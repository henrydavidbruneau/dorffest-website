// Kontakt-Postfach im Vereinsheim (nur Vorstand): ein kleines Mailprogramm.
//
// Lesen per IMAP (imapflow, mit PEEK – Lesen ändert nichts am Gelesen-Status).
// Senden über das Postfach selbst (IONOS-SMTP, dieselben Zugangsdaten). Lehnt IONOS den Absender ab
// (die Adresse ohne Umlaute ist kein Alias des Postfachs), geht die Mail über Brevo raus.
// Danach eine Kopie in den „Gesendet“-Ordner und das Original als beantwortet markieren –
// so sieht man im Webmail genauso, was das Vereinsheim verschickt hat.
// Zugangsdaten nur als Umgebungsvariablen (NUXT_IMAP_*), nie im Code oder Frontend.
import { domainToASCII } from 'node:url'
import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import nodemailer from 'nodemailer'
import MailComposer from 'nodemailer/lib/mail-composer'

export type Ordner = 'eingang' | 'gesendet'

export interface MailKopf {
  uid: number
  /** Message-ID (für Markierungen; bleibt beim Verschieben gleich) */
  messageId: string | null
  von: string
  vonAdresse: string
  an: string
  betreff: string
  datum: string
  gelesen: boolean
  beantwortet: boolean
}

export interface PostMail extends MailKopf {
  text: string
  anhaenge: { name: string, groesse: number }[]
  references: string[]
  /** weitere Empfänger (An + Kopie) für „Allen antworten“, ohne Absender und ohne das eigene Postfach */
  weitere: string[]
}

/** Adresse vergleichbar machen (klein, Umlaut-Domain als xn--…) */
function normalAdresse(adresse: string) {
  const [lokal, domain] = adresse.trim().toLowerCase().split('@')
  return domain ? `${lokal}@${domainToASCII(domain) || domain}` : adresse.trim().toLowerCase()
}

function eigeneAdressen() {
  const { mailVon, imapBenutzer } = useRuntimeConfig()
  return new Set([mailVon, imapBenutzer].filter(Boolean).map(normalAdresse))
}

export function postfachKonfig() {
  const { imapHost, imapPort, imapBenutzer, imapPasswort, smtpHost, webmailUrl } = useRuntimeConfig()
  return { host: imapHost, port: Number(imapPort) || 993, smtpHost, benutzer: imapBenutzer, passwort: imapPasswort, webmail: webmailUrl, eingerichtet: !!(imapHost && imapBenutzer && imapPasswort) }
}

// Verbindung kurz offen halten: Liste laden und danach eine Mail öffnen braucht so nur einen
// Login (TLS + Anmeldung kosten bei IONOS spürbar Zeit). Netlify friert Funktionen zwischen
// Anfragen ein – deshalb nur kurz wiederverwenden und vorher mit NOOP prüfen, ob sie noch lebt.
const OFFEN_HALTEN = 30_000
let offen: { imap: ImapFlow, zuletzt: number } | null = null

function schliesse(imap: ImapFlow) {
  if (offen?.imap === imap) offen = null
  imap.logout().catch(() => imap.close())
}

async function lebt(imap: ImapFlow) {
  const pruefung = imap.noop().then(() => true, () => false)
  const zeitUm = new Promise<boolean>(r => setTimeout(() => r(false), 1500))
  return Promise.race([pruefung, zeitUm])
}

let verbindet: Promise<ImapFlow> | null = null

async function verbindung(): Promise<ImapFlow> {
  if (offen && offen.imap.usable && Date.now() - offen.zuletzt < OFFEN_HALTEN && await lebt(offen.imap)) return offen.imap
  if (offen) schliesse(offen.imap)
  // gleichzeitige Anfragen teilen sich den Aufbau
  verbindet ??= neueVerbindung().finally(() => (verbindet = null))
  return verbindet
}

async function neueVerbindung(): Promise<ImapFlow> {
  const k = postfachKonfig()
  const imap = new ImapFlow({ host: k.host, port: k.port, secure: true, auth: { user: k.benutzer, pass: k.passwort }, logger: false })
  imap.on('error', () => schliesse(imap))
  imap.on('close', () => {
    if (offen?.imap === imap) offen = null
  })
  await imap.connect()
  offen = { imap, zuletzt: Date.now() }
  return imap
}

async function verbinden<T>(arbeit: (imap: ImapFlow) => Promise<T>): Promise<T> {
  const k = postfachKonfig()
  if (!k.eingerichtet) throw fail(503, 'postfach', 'Das Postfach ist noch nicht eingerichtet.')
  let imap: ImapFlow | null = null
  try {
    imap = await verbindung()
    const ergebnis = await arbeit(imap)
    if (offen?.imap === imap) offen.zuletzt = Date.now()
    return ergebnis
  }
  catch (e) {
    if (imap) schliesse(imap)
    if (isError(e)) throw e
    console.error('[postfach]', (e as Error).message)
    throw fail(502, 'postfach', 'Das Postfach ist gerade nicht erreichbar.')
  }
}

/** Pfad des Gesendet-Ordners (IONOS: „Gesendete Objekte“), einmal je Funktions-Instanz gesucht */
let gesendet: string | null = null
async function gesendetPfad(imap: ImapFlow): Promise<string> {
  if (gesendet) return gesendet
  const ordner = await imap.list()
  const treffer = ordner.find(o => o.specialUse === '\\Sent')
    ?? ordner.find(o => /^(gesendete objekte|gesendet|sent|sent items|sent messages)$/i.test(o.name))
  gesendet = treffer?.path ?? 'Sent'
  return gesendet
}

async function mitOrdner<T>(imap: ImapFlow, ordner: Ordner, schreiben: boolean, arbeit: () => Promise<T>): Promise<T> {
  const pfad = ordner === 'eingang' ? 'INBOX' : await gesendetPfad(imap)
  const sperre = await imap.getMailboxLock(pfad, { readOnly: !schreiben })
  try {
    return await arbeit()
  }
  finally {
    sperre.release()
  }
}

const adressen = (liste?: { name?: string, address?: string }[]) => (liste ?? []).map(a => a.name || a.address).filter(Boolean).join(', ')

// kurz zwischenspeichern, damit Dashboard + Postfach-Seite nicht doppelt verbinden
const zwischenspeicher = new Map<Ordner, { bis: number, mails: MailKopf[] }>()
// geöffnete Mails ändern sich nicht (nur „beantwortet“, das leert den Speicher beim Senden)
const mailSpeicher = new Map<string, { bis: number, mail: PostMail }>()

/** `frisch` = am Speicher vorbei direkt ins Postfach schauen (Knopf „Aktualisieren“) */
export async function ladePost(ordner: Ordner = 'eingang', anzahl = 30, frisch = false): Promise<MailKopf[]> {
  const gemerkt = zwischenspeicher.get(ordner)
  if (!frisch && gemerkt && gemerkt.bis > Date.now()) return gemerkt.mails.slice(0, anzahl)
  const mails = await verbinden(imap => mitOrdner(imap, ordner, false, async () => {
    const gesamt = (imap.mailbox && typeof imap.mailbox === 'object' ? imap.mailbox.exists : 0) || 0
    if (!gesamt) return []
    const ergebnis: MailKopf[] = []
    for await (const n of imap.fetch(`${Math.max(1, gesamt - 49)}:*`, { uid: true, envelope: true, flags: true, internalDate: true })) {
      const von = n.envelope?.from?.[0]
      ergebnis.push({
        uid: n.uid,
        messageId: n.envelope?.messageId ?? null,
        von: von?.name || von?.address || 'unbekannt',
        vonAdresse: von?.address ?? '',
        an: adressen(n.envelope?.to),
        betreff: n.envelope?.subject || '(ohne Betreff)',
        datum: new Date(n.envelope?.date ?? n.internalDate ?? Date.now()).toISOString(),
        gelesen: n.flags?.has('\\Seen') ?? false,
        beantwortet: n.flags?.has('\\Answered') ?? false,
      })
    }
    return ergebnis.sort((a, b) => Date.parse(b.datum) - Date.parse(a.datum))
  }))
  zwischenspeicher.set(ordner, { bis: Date.now() + 30_000, mails })
  return mails.slice(0, anzahl)
}

export async function ladeMail(ordner: Ordner, uid: number): Promise<PostMail> {
  const schluessel = `${ordner}:${uid}`
  const gemerkt = mailSpeicher.get(schluessel)
  if (gemerkt && gemerkt.bis > Date.now()) return gemerkt.mail
  const mail = await verbinden(imap => mitOrdner(imap, ordner, false, async () => {
    const n = await imap.fetchOne(String(uid), { uid: true, source: true, flags: true }, { uid: true })
    if (!n || !n.source) throw fail(404, 'mail', 'Diese Mail gibt es nicht (mehr).')
    const m = await simpleParser(n.source)
    const von = m.from?.value[0]
    const text = m.text?.trim()
      || (typeof m.html === 'string' ? m.html.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() : '')
    const references = Array.isArray(m.references) ? m.references : m.references ? [m.references] : []
    const liste = (feld: typeof m.to) => (Array.isArray(feld) ? feld : feld ? [feld] : []).flatMap(f => f.value.map(v => v.address ?? '')).filter(Boolean)
    const absender = normalAdresse(m.replyTo?.value[0]?.address ?? von?.address ?? '')
    const eigene = eigeneAdressen()
    const weitere = [...new Map([...liste(m.to), ...liste(m.cc)].map(a => [normalAdresse(a), a] as const)).entries()]
      .filter(([n]) => n !== absender && !eigene.has(n))
      .map(([, a]) => a)
    return {
      uid,
      von: von?.name || von?.address || 'unbekannt',
      vonAdresse: m.replyTo?.value[0]?.address ?? von?.address ?? '',
      an: Array.isArray(m.to) ? m.to.map(t => t.text).join(', ') : m.to?.text ?? '',
      betreff: m.subject || '(ohne Betreff)',
      datum: (m.date ?? new Date()).toISOString(),
      gelesen: n.flags?.has('\\Seen') ?? false,
      beantwortet: n.flags?.has('\\Answered') ?? false,
      text: text.slice(0, 50_000),
      anhaenge: m.attachments.map(a => ({ name: a.filename ?? 'Anhang', groesse: a.size })),
      messageId: m.messageId ?? null,
      references,
      weitere,
    }
  }))
  if (mailSpeicher.size > 100) mailSpeicher.clear()
  mailSpeicher.set(schluessel, { bis: Date.now() + 10 * 60_000, mail })
  return mail
}

export interface NeueMail {
  an: string
  /** Kopie an (z.B. bei „Allen antworten“) */
  cc?: string[]
  betreff: string
  text: string
  /** UID der Mail im Eingang, auf die geantwortet wird */
  antwortAuf?: number
}

/** Mail verschicken (IONOS-SMTP, sonst Brevo), Kopie in „Gesendet“, Original als beantwortet markieren */
export async function sendePost(neu: NeueMail): Promise<{ weg: 'postfach' | 'brevo' }> {
  const { brevoApiKey, mailVon, mailVonName } = useRuntimeConfig()
  const k = postfachKonfig()
  if (!k.eingerichtet) throw fail(503, 'postfach', 'Das Postfach ist noch nicht eingerichtet.')

  const original = neu.antwortAuf ? await ladeMail('eingang', neu.antwortAuf) : null
  const kette = original?.messageId ? [...original.references, original.messageId] : []
  const nachricht = {
    from: { name: mailVonName, address: mailVon },
    to: neu.an,
    ...(neu.cc?.length ? { cc: neu.cc } : {}),
    subject: neu.betreff,
    text: neu.text,
    date: new Date(),
    ...(original?.messageId ? { inReplyTo: original.messageId, references: kette } : {}),
  }

  // 1. über das Postfach selbst
  let weg: 'postfach' | 'brevo' = 'postfach'
  try {
    const smtp = nodemailer.createTransport({ host: k.smtpHost || 'smtp.ionos.de', port: 465, secure: true, auth: { user: k.benutzer, pass: k.passwort } })
    await smtp.sendMail(nachricht)
  }
  catch (e) {
    // 2. Rückfall: Brevo (z.B. wenn IONOS den Absender ohne Umlaute nicht zulässt)
    console.warn('[postfach] SMTP abgelehnt, versuche Brevo:', (e as Error)?.message ?? e)
    if (!brevoApiKey) throw fail(502, 'senden', 'Das Postfach hat die Mail nicht angenommen (ist die Adresse ohne Umlaute als Alias eingerichtet?).')
    weg = 'brevo'
    await $fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': brevoApiKey, 'accept': 'application/json' },
      body: { sender: { email: mailVon, name: mailVonName }, to: [{ email: neu.an }], ...(neu.cc?.length ? { cc: neu.cc.map(email => ({ email })) } : {}), subject: neu.betreff, textContent: neu.text, tags: ['vereinsheim-post'] },
    }).catch((err) => {
      console.error('[postfach] Brevo:', err?.data ?? err)
      throw fail(502, 'senden', 'Die Mail konnte gerade nicht verschickt werden.')
    })
  }

  // Ablage im Postfach – ein Fehler hier macht das Senden nicht rückgängig, nur die Kopie fehlt dann
  try {
    const roh = await new MailComposer(nachricht).compile().build()
    await verbinden(async (imap) => {
      await imap.append(await gesendetPfad(imap), roh, ['\\Seen'])
      if (neu.antwortAuf) await mitOrdner(imap, 'eingang', true, () => imap.messageFlagsAdd(String(neu.antwortAuf), ['\\Answered'], { uid: true }))
    })
  }
  catch (e) {
    console.error('[postfach] Ablage in „Gesendet“ fehlgeschlagen:', (e as Error)?.message ?? e)
  }
  zwischenspeicher.clear()
  mailSpeicher.clear()
  return { weg }
}

/** Papierkorb des Postfachs (IONOS: „Papierkorb“), einmal je Funktions-Instanz gesucht */
let papierkorb: string | null | undefined
async function papierkorbPfad(imap: ImapFlow): Promise<string | null> {
  if (papierkorb !== undefined) return papierkorb
  const ordner = await imap.list()
  const treffer = ordner.find(o => o.specialUse === '\\Trash')
    ?? ordner.find(o => /^(papierkorb|gelöschte objekte|gelöschte elemente|trash|deleted items|deleted messages)$/i.test(o.name))
  papierkorb = treffer?.path ?? null
  return papierkorb
}

/** Mail in den Papierkorb legen (wie im Webmail; dort lässt sie sich zurückholen). Ohne Papierkorb: endgültig löschen */
export async function loeschePost(ordner: Ordner, uid: number): Promise<{ papierkorb: boolean }> {
  const ergebnis = await verbinden(async (imap) => {
    const ziel = await papierkorbPfad(imap)
    return mitOrdner(imap, ordner, true, async () => {
      if (ziel) {
        const verschoben = await imap.messageMove(String(uid), ziel, { uid: true })
        if (!verschoben) throw fail(404, 'mail', 'Diese Mail gibt es nicht (mehr).')
        return { papierkorb: true }
      }
      const weg = await imap.messageDelete(String(uid), { uid: true })
      if (!weg) throw fail(404, 'mail', 'Diese Mail gibt es nicht (mehr).')
      return { papierkorb: false }
    })
  })
  zwischenspeicher.clear()
  mailSpeicher.delete(`${ordner}:${uid}`)
  return ergebnis
}

/** Gelesen-Status setzen (wie im Webmail; das Vereinsheim selbst liest mit PEEK und ändert ihn nicht) */
export async function setzeGelesen(ordner: Ordner, uid: number, gelesen: boolean) {
  await verbinden(imap => mitOrdner(imap, ordner, true, () => gelesen
    ? imap.messageFlagsAdd(String(uid), ['\\Seen'], { uid: true })
    : imap.messageFlagsRemove(String(uid), ['\\Seen'], { uid: true })))
  zwischenspeicher.clear()
  mailSpeicher.delete(`${ordner}:${uid}`)
}
