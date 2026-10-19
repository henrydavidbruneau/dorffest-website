// Kontakt-Postfach im Vereinsheim (nur Vorstand): liest per IMAP, ändert nichts.
// Nachrichten werden mit PEEK geholt – sie bleiben im Webmail ungelesen, wenn sie es waren.
// Zugangsdaten nur als Umgebungsvariablen (NUXT_IMAP_*), nie im Code oder Frontend.
import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'

export interface MailKopf {
  uid: number
  von: string
  vonAdresse: string
  betreff: string
  datum: string
  gelesen: boolean
}

export interface Mail extends MailKopf {
  an: string
  text: string
  anhaenge: { name: string, groesse: number }[]
}

export function postfachKonfig() {
  const { imapHost, imapPort, imapBenutzer, imapPasswort, webmailUrl } = useRuntimeConfig()
  return { host: imapHost, port: Number(imapPort) || 993, benutzer: imapBenutzer, passwort: imapPasswort, webmail: webmailUrl, eingerichtet: !!(imapHost && imapBenutzer && imapPasswort) }
}

async function mitPostfach<T>(arbeit: (imap: ImapFlow) => Promise<T>): Promise<T> {
  const k = postfachKonfig()
  if (!k.eingerichtet) throw fail(503, 'postfach', 'Das Postfach ist noch nicht eingerichtet.')
  const imap = new ImapFlow({ host: k.host, port: k.port, secure: true, auth: { user: k.benutzer, pass: k.passwort }, logger: false })
  try {
    await imap.connect()
    const sperre = await imap.getMailboxLock('INBOX', { readOnly: true })
    try {
      return await arbeit(imap)
    }
    finally {
      sperre.release()
    }
  }
  catch (e) {
    if (isError(e)) throw e
    console.error('[postfach]', (e as Error).message)
    throw fail(502, 'postfach', 'Das Postfach ist gerade nicht erreichbar.')
  }
  finally {
    await imap.logout().catch(() => {})
  }
}

// kurz zwischenspeichern, damit Dashboard + Postfach-Seite nicht doppelt verbinden
let liste: { bis: number, mails: MailKopf[] } | null = null

export async function ladePost(anzahl = 30): Promise<MailKopf[]> {
  if (liste && liste.bis > Date.now()) return liste.mails.slice(0, anzahl)
  const mails = await mitPostfach(async (imap) => {
    const gesamt = (imap.mailbox && typeof imap.mailbox === 'object' ? imap.mailbox.exists : 0) || 0
    if (!gesamt) return []
    const ergebnis: MailKopf[] = []
    for await (const n of imap.fetch(`${Math.max(1, gesamt - 49)}:*`, { uid: true, envelope: true, flags: true, internalDate: true })) {
      const von = n.envelope?.from?.[0]
      ergebnis.push({
        uid: n.uid,
        von: von?.name || von?.address || 'unbekannt',
        vonAdresse: von?.address ?? '',
        betreff: n.envelope?.subject || '(ohne Betreff)',
        datum: new Date(n.envelope?.date ?? n.internalDate ?? Date.now()).toISOString(),
        gelesen: n.flags?.has('\\Seen') ?? false,
      })
    }
    return ergebnis.sort((a, b) => Date.parse(b.datum) - Date.parse(a.datum))
  })
  liste = { bis: Date.now() + 60_000, mails }
  return mails.slice(0, anzahl)
}

export async function ladeMail(uid: number): Promise<Mail> {
  return mitPostfach(async (imap) => {
    const n = await imap.fetchOne(String(uid), { uid: true, source: true, flags: true }, { uid: true })
    if (!n || !n.source) throw fail(404, 'mail', 'Diese Mail gibt es nicht (mehr).')
    const m = await simpleParser(n.source)
    const von = m.from?.value[0]
    const text = m.text?.trim()
      || (typeof m.html === 'string' ? m.html.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() : '')
    return {
      uid,
      von: von?.name || von?.address || 'unbekannt',
      vonAdresse: von?.address ?? '',
      an: Array.isArray(m.to) ? m.to.map(t => t.text).join(', ') : m.to?.text ?? '',
      betreff: m.subject || '(ohne Betreff)',
      datum: (m.date ?? new Date()).toISOString(),
      gelesen: n.flags?.has('\\Seen') ?? false,
      text: text.slice(0, 50_000),
      anhaenge: m.attachments.map(a => ({ name: a.filename ?? 'Anhang', groesse: a.size })),
    }
  })
}
