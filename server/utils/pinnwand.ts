// Pinnwände (Leserbriefe, Ideenwand) aus Directus `leserbriefe` / `ideen`.
// Wie das Freundebuch bei DPAT: sofort sichtbar, Moderation im Vereinsheim, Bot-Schutz per Turnstile.
import type { H3Event } from 'h3'

export type Pinnwand = 'leserbriefe' | 'ideen'

const FELDER: Record<Pinnwand, string> = {
  leserbriefe: 'id,status,name,text,artikel,date_created',
  ideen: 'id,status,name,text,date_created',
}

export async function ladePinnwand(wand: Pinnwand) {
  return directusListe<Leserbrief | Idee>(wand, { fields: FELDER[wand], filter: VEROEFFENTLICHT, sort: '-date_created', limit: 200 })
}

/** Eintrag prüfen und anlegen; liefert den neuen Eintrag zurück */
export async function pinneAn(event: H3Event, wand: Pinnwand, grenzen: { textMin: number, textMax: number }) {
  rateLimit(event, `pinnwand-${wand}`, 5)
  const body = await leseBody(event)
  const name = text(body.name, 60)
  const inhalt = typeof body.text === 'string' ? body.text.trim().slice(0, grenzen.textMax) : ''
  const vorlaeufig = { id: Date.now(), status: 'published' as const, date_created: new Date().toISOString(), date_updated: null, name, text: inhalt }
  if (istBot(body)) return vorlaeufig
  if (!name) throw fail(400, 'name', 'Bitte gib deinen Namen an.')
  if (inhalt.length < grenzen.textMin) throw fail(400, 'text', 'Schreib uns noch ein bisschen mehr.')
  await pruefeTurnstile(event, body)
  const neu = await directusAnlegen<Leserbrief | Idee>(wand, { name, text: inhalt })
  return neu ?? vorlaeufig
}
