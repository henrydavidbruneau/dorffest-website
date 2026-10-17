// Lese- und Schreibzugriff auf die Pinnwände (Leserbriefe, Ideenwand).
// Heute aus server/data, später Directus `leserbriefe` / `ideenwand` (wie Freundebuch bei DPAT:
// sofort veröffentlicht, Moderation im Vereinsheim, Bot-Schutz per Turnstile).
import type { H3Event } from 'h3'
import { leserbriefe, ideen } from '../data/pinnwand'

const quellen = { leserbriefe, ideen } as const
export type Pinnwand = keyof typeof quellen

export async function ladePinnwand(wand: Pinnwand) {
  return quellen[wand]
    .filter(e => e.status === 'published')
    .sort((a, b) => Date.parse(b.date_created) - Date.parse(a.date_created))
}

/** Eintrag prüfen und (vorerst nur im Log) anlegen; liefert den neuen Eintrag zurück */
export async function pinneAn(event: H3Event, wand: Pinnwand, grenzen: { textMin: number, textMax: number }) {
  rateLimit(event, `pinnwand-${wand}`, 5)
  const body = await leseBody(event)
  const name = text(body.name, 60)
  const inhalt = typeof body.text === 'string' ? body.text.trim().slice(0, grenzen.textMax) : ''

  const eintrag = { id: Date.now(), status: 'published' as const, date_created: new Date().toISOString(), date_updated: null, name, text: inhalt }
  if (istBot(body)) return eintrag
  if (!name) throw fail(400, 'name', 'Bitte gib deinen Namen an.')
  if (inhalt.length < grenzen.textMin) throw fail(400, 'text', 'Schreib uns noch ein bisschen mehr.')

  console.info(`[${wand}]`, { name, text: inhalt })
  return eintrag
}
