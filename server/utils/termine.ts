// Lesezugriff auf Termine. Heute aus server/data, später aus Directus (`termine`).
// Nur diese Datei muss dann umgestellt werden – Routen, Composables und Seiten bleiben.
import { termine as platzhalter } from '../data/termine'

export interface TerminFilter {
  zeitraum?: 'kommend' | 'vergangen' | 'alle'
  hervorgehoben?: boolean
  /** nur Termine mit festem Datum oder Rhythmus (für den Terminkalender) */
  mitDatum?: boolean
  limit?: number
}

/** Ein Termin gilt bis zu seinem Ende (oder Beginn + 1 Tag) als kommend. Ohne Datum immer. */
function istKommend(termin: Termin, jetzt: number) {
  if (!termin.beginn) return true
  const ende = termin.ende ? Date.parse(termin.ende) : Date.parse(termin.beginn) + 24 * 60 * 60 * 1000
  return ende >= jetzt
}

/** aufsteigend nach Beginn; regelmäßige Termine danach, Termine ohne Datum ans Ende */
function nachBeginn(a: Termin, b: Termin) {
  const rang = (t: Termin) => (!t.beginn ? 2 : t.rhythmus_kurz ? 1 : 0)
  if (rang(a) !== rang(b)) return rang(a) - rang(b)
  return Date.parse(a.beginn ?? '') - Date.parse(b.beginn ?? '') || 0
}

export async function ladeTermine(filter: TerminFilter = {}): Promise<Termin[]> {
  const jetzt = Date.now()
  const zeitraum = filter.zeitraum ?? 'kommend'

  let liste = platzhalter.filter(t => t.status === 'published')
  if (filter.hervorgehoben) liste = liste.filter(t => t.hervorgehoben)
  if (filter.mitDatum) liste = liste.filter(t => !!t.beginn)
  if (zeitraum === 'kommend') liste = liste.filter(t => istKommend(t, jetzt)).sort(nachBeginn)
  if (zeitraum === 'vergangen') liste = liste.filter(t => !istKommend(t, jetzt)).sort((a, b) => nachBeginn(b, a))
  if (zeitraum === 'alle') liste = [...liste].sort(nachBeginn)

  return filter.limit ? liste.slice(0, filter.limit) : liste
}

export async function ladeTermin(slug: string): Promise<Termin | null> {
  return platzhalter.find(t => t.slug === slug && t.status === 'published') ?? null
}
