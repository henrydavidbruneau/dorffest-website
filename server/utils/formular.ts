// Gemeinsame Bausteine für öffentliche Formulare (Muster aus DPAT):
// Rate-Limit → Honeypot → (später Turnstile) → Validierung → (später Directus/Brevo)
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
