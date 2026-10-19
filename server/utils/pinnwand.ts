// Pinnwände (Leserbriefe, Ideenwand) aus Directus `leserbriefe` / `ideen`.
// Wie das Freundebuch bei DPAT: sofort sichtbar, Moderation im Vereinsheim, Bot-Schutz per Turnstile.
import type { H3Event } from 'h3'

export type Pinnwand = 'leserbriefe' | 'ideen'

// Leserbriefe mit `*`: liefert nur, was der Server lesen darf – so klappt es auch, solange das
// Feld `anrede` noch nicht angelegt ist (scripts/directus-setup.mjs)
const FELDER: Record<Pinnwand, string> = {
  leserbriefe: '*',
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
  // Leserbriefe: eigene Überschrift statt „Liebe Nachbar*innen,“ (nur speichern, wenn geändert)
  const anrede = wand === 'leserbriefe' ? text(body.anrede, 80) : ''
  const mitAnrede = anrede && anrede !== ANREDE_STANDARD ? { anrede } : {}
  const vorlaeufig = { id: Date.now(), status: 'published' as const, date_created: new Date().toISOString(), date_updated: null, name, text: inhalt, ...mitAnrede }
  if (istBot(body)) return vorlaeufig
  if (!name) throw fail(400, 'name', 'Bitte gib deinen Namen an.')
  if (inhalt.length < grenzen.textMin) throw fail(400, 'text', 'Schreib uns noch ein bisschen mehr.')
  await pruefeTurnstile(event, body)
  const neu = await directusAnlegen<Leserbrief | Idee>(wand, { name, text: inhalt, ...mitAnrede }).catch((e) => {
    // Feld `anrede` fehlt in Directus noch → Brief ohne eigene Überschrift speichern statt ihn zu verlieren
    if (!('anrede' in mitAnrede)) throw e
    console.warn('[pinnwand] Leserbrief ohne Anrede gespeichert (Feld anrede fehlt?):', (e as Error)?.message ?? e)
    return directusAnlegen<Leserbrief | Idee>(wand, { name, text: inhalt })
  })
  return neu ?? vorlaeufig
}
