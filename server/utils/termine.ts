// Lesezugriff auf Termine aus Directus (`termine`, Anmeldezahlen aus `anmeldungen`).
// Nur diese Datei kennt Directus – Routen, Composables und Seiten bleiben gleich.

export interface TerminFilter {
  zeitraum?: 'kommend' | 'vergangen' | 'alle'
  hervorgehoben?: boolean
  /** nur Termine mit festem Datum oder Rhythmus (für den Terminkalender) */
  mitDatum?: boolean
  limit?: number
}

/** Ein Termin gilt bis zu seinem Ende (oder Beginn + 1 Tag) als kommend. Ohne Datum immer. */
export function istKommend(termin: Termin, jetzt: number) {
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

// Ausdrücklich ohne den Alias `anmeldungen` (O2M) – die liest der Server-Token nicht
const FELDER = [
  'id', 'status', 'date_created', 'date_updated', 'titel', 'slug', 'beginn', 'ende', 'uhrzeit_folgt',
  'datum_text', 'rhythmus_kurz', 'hinweis', 'ort', 'adresse', 'bild', 'bild_alt', 'kurzbeschreibung',
  'beschreibung', 'aufruf_text', 'hervorgehoben', 'anmeldung_aktiv', 'plaetze', 'mitbringen_position',
  'mitbringen_text', 'mitbringen_vorschlaege',
].join(',')

export async function ladeTermine(filter: TerminFilter = {}): Promise<Termin[]> {
  const jetzt = Date.now()
  const zeitraum = filter.zeitraum ?? 'kommend'
  const bedingungen: object[] = [VEROEFFENTLICHT]
  if (filter.hervorgehoben) bedingungen.push({ hervorgehoben: { _eq: true } })
  if (filter.mitDatum) bedingungen.push({ beginn: { _nnull: true } })
  let liste = await directusListe<Termin>('termine', { fields: FELDER, filter: { _and: bedingungen } })
  if (zeitraum === 'kommend') liste = liste.filter(t => istKommend(t, jetzt)).sort(nachBeginn)
  if (zeitraum === 'vergangen') liste = liste.filter(t => !istKommend(t, jetzt)).sort((a, b) => nachBeginn(b, a))
  if (zeitraum === 'alle') liste = [...liste].sort(nachBeginn)
  return filter.limit ? liste.slice(0, filter.limit) : liste
}

export async function ladeTermin(slug: string): Promise<Termin | null> {
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return null
  const [termin] = await directusListe<Termin>('termine', {
    fields: FELDER,
    filter: { _and: [VEROEFFENTLICHT, { slug: { _eq: slug } }] },
    limit: 1,
  })
  return termin ?? null
}

/** bisher angemeldete Personen (Summe `personen`, abgemeldete zählen nicht) */
export async function zaehleAnmeldungen(terminId: number): Promise<number> {
  const [zeile] = await directusServer<{ sum: { personen: string | number | null } }[]>('/items/anmeldungen', {
    query: { 'aggregate[sum]': 'personen', 'filter': { termin: { _eq: terminId }, status: { _eq: 'angemeldet' } } },
  })
  return Number(zeile?.sum.personen ?? 0) || 0
}

export async function ladeTerminDetail(slug: string): Promise<TerminDetail | null> {
  const termin = await ladeTermin(slug)
  if (!termin) return null
  const plaetze_frei = termin.plaetze ? Math.max(0, termin.plaetze - await zaehleAnmeldungen(termin.id)) : null
  return {
    ...termin,
    beschreibung_html: termin.beschreibung ? markdownZuHtml(termin.beschreibung) : '',
    plaetze_frei,
    vergangen: !istKommend(termin, Date.now()),
  }
}
