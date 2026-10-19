// Mails über die Brevo-Transactional-API (Muster aus DPAT). Text schreiben wir selbst,
// das HTML im Look der Website entsteht daraus (`shared/utils/mailHtml.ts`).
//
// Ohne NUXT_BREVO_API_KEY (lokal / Deploy-Preview) wird NICHT gesendet: Empfänger, Betreff
// und Text landen im Server-Log – so bleiben die Abläufe testbar, ohne echte Mails.
import { KONTAKT_MAIL } from '#shared/utils/kontakt'

export interface Mail {
  an: string
  betreff: string
  /** Klartext; Leerzeile = Absatz */
  text: string
  /** Antwort-Adresse, z.B. die Person hinter einem Vorschlag */
  antwortAn?: string
  /** Brevo-Tags fürs Filtern im Brevo-Log */
  tags?: string[]
  /** Abmelde-Link im Fuß der Mail */
  abmelden?: string
  /** rechts in der Kopfzeile der Mail, z.B. „Anmeldung“ */
  rubrik?: string
  /** großes „Bis bald im Dorf!“ statt Kontaktdaten (Rundbrief-Test) */
  grosserGruss?: boolean
}

/** Adresse der Website für Logo, Schriften und Links in Mails (Punycode – Umlaut-Domains machen in Mails Ärger) */
export function mailBasis() {
  const { mailBasis, public: { siteUrl } } = useRuntimeConfig()
  return new URL(mailBasis || siteUrl).origin
}

export async function sendeMail({ an, betreff, text, antwortAn, tags, abmelden, rubrik, grosserGruss }: Mail): Promise<void> {
  const { brevoApiKey, mailVon, mailVonName } = useRuntimeConfig()
  if (!brevoApiKey) {
    console.info(`[mail] Kein NUXT_BREVO_API_KEY – nicht gesendet.\n  An: ${an}\n  Betreff: ${betreff}\n-----\n${mailText(text)}${abmelden ? `\n\nAbmelden: ${abmelden}` : ''}\n-----`)
    return
  }
  await $fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': brevoApiKey, 'accept': 'application/json' },
    body: {
      sender: { email: mailVon, name: mailVonName },
      to: [{ email: an }],
      subject: betreff,
      textContent: mailText(text) + (abmelden ? `\n\nAbmelden: ${abmelden}` : ''),
      htmlContent: mailHtml(text, { basis: mailBasis(), abmelden, rubrik, grosserGruss, vorschau: betreff }),
      ...(antwortAn ? { replyTo: { email: antwortAn } } : {}),
      ...(tags?.length ? { tags } : {}),
    },
  })
}

/**
 * Mail senden, ohne dass ein Fehler das Formular scheitern lässt
 * (der Eintrag ist dann schon gespeichert – lieber loggen als „Fehler“ melden)
 */
export async function sendeMailStill(mail: Mail) {
  await sendeMail(mail).catch(e => console.error(`[mail] „${mail.betreff}“ an ${mail.an} fehlgeschlagen:`, e?.data ?? e))
}

/** Hinweis an den Verein (Kontakt-Postfach) */
export async function mailAnVerein(betreff: string, text: string, antwortAn?: string) {
  const { kontakt_email } = await ladeVerein()
  return sendeMailStill({ an: kontakt_email || KONTAKT_MAIL, betreff, text, antwortAn, tags: ['hinweis'], rubrik: 'Fürs Vereinsheim' })
}
