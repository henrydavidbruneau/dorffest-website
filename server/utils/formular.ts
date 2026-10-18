// Gemeinsame Bausteine für öffentliche Formulare (Muster aus DPAT):
// Rate-Limit → Honeypot → Validierung → Turnstile → Directus (+ Mail über Brevo)
import type { H3Event } from 'h3'

export const fail = (statusCode: number, code: string, statusMessage: string) =>
  createError({ statusCode, statusMessage, data: { code } })

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Text aus dem Body lesen: getrimmt, Länge begrenzt, leer = '' */
export function text(wert: unknown, max = 200): string {
  return typeof wert === 'string' ? wert.trim().replace(/\s+/g, ' ').slice(0, max) : ''
}

export function email(wert: unknown): string {
  const e = text(wert, 254).toLowerCase()
  return EMAIL_RE.test(e) ? e : ''
}

/** Honeypot: Feld "website" ist für Menschen unsichtbar; ausgefüllt = Bot */
export function istBot(body: Record<string, unknown>): boolean {
  return typeof body.website === 'string' && body.website.trim() !== ''
}

// Einfaches Rate-Limit pro IP im Speicher der Funktion (reicht gegen Doppelklicks und einfache Bots)
const zaehler = new Map<string, { anzahl: number, bis: number }>()

export function rateLimit(event: H3Event, schluessel: string, max = 5, fensterMs = 10 * 60 * 1000) {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unbekannt'
  const key = `${schluessel}:${ip}`
  const jetzt = Date.now()
  const eintrag = zaehler.get(key)
  if (!eintrag || eintrag.bis < jetzt) {
    zaehler.set(key, { anzahl: 1, bis: jetzt + fensterMs })
    return
  }
  eintrag.anzahl++
  if (eintrag.anzahl > max) throw fail(429, 'rate', 'Zu viele Versuche. Bitte probier es später noch einmal.')
}

export async function leseBody(event: H3Event): Promise<Record<string, unknown>> {
  const body = await readBody(event).catch(() => null)
  return body && typeof body === 'object' ? body as Record<string, unknown> : {}
}

/**
 * Cloudflare Turnstile serverseitig prüfen (Feld `turnstile` im Body).
 * Ohne NUXT_TURNSTILE_SECRET_KEY (lokal, Deploy-Preview) wird nicht geprüft.
 */
export async function pruefeTurnstile(event: H3Event, body: Record<string, unknown>) {
  const { turnstileSecretKey } = useRuntimeConfig()
  if (!turnstileSecretKey) return
  const token = typeof body.turnstile === 'string' ? body.turnstile : ''
  if (!token) throw fail(400, 'turnstile', 'Bitte warte kurz, bis die Bot-Prüfung durch ist, und schick es dann noch einmal.')
  const ergebnis = await $fetch<{ success: boolean }>('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({
      secret: turnstileSecretKey,
      response: token,
      remoteip: getRequestIP(event, { xForwardedFor: true }) ?? '',
    }),
  }).catch(() => ({ success: false }))
  if (!ergebnis.success) throw fail(403, 'turnstile', 'Die Bot-Prüfung hat nicht geklappt. Lade die Seite neu und versuch es noch einmal.')
}
