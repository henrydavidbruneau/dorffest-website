// Mails über die Brevo-Transactional-API (Muster aus DPAT). Text schreiben wir selbst,
// das HTML entsteht daraus (Absätze, Links klickbar).
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
}

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, z => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' })[z]!)
}

function alsHtml(text: string) {
  const absaetze = text.trim().split(/\n\s*\n/).map(a =>
    `<p>${escapeHtml(a).replace(/https?:\/\/\S+/g, url => `<a href="${url}">${url}</a>`).replace(/\n/g, '<br>')}</p>`)
  return `<div style="font-family: system-ui, sans-serif; font-size: 16px; line-height: 1.5; color: #1a1a1a; max-width: 560px">${absaetze.join('\n')}</div>`
}

export async function sendeMail({ an, betreff, text, antwortAn, tags }: Mail): Promise<void> {
  const { brevoApiKey, mailVon, mailVonName } = useRuntimeConfig()
  if (!brevoApiKey) {
    console.info(`[mail] Kein NUXT_BREVO_API_KEY – nicht gesendet.\n  An: ${an}\n  Betreff: ${betreff}\n-----\n${text}\n-----`)
    return
  }
  await $fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': brevoApiKey, 'accept': 'application/json' },
    body: {
      sender: { email: mailVon, name: mailVonName },
      to: [{ email: an }],
      subject: betreff,
      textContent: text,
      htmlContent: alsHtml(text),
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
  return sendeMailStill({ an: kontakt_email || KONTAKT_MAIL, betreff, text, antwortAn, tags: ['hinweis'] })
}

/** Gruß unter Mails an Nachbar*innen */
export const GRUSS = `Bis bald im Dorf!\nKönigsdorf rückt zusammen e.V.\n${KONTAKT_MAIL}`
