// Lesezugriff auf Dorfanzeiger-Artikel aus Directus (`artikel`, Ressort als Slug).
// Ein Porträt („Fünf Fragen an …“) ist ein Artikel im Ressort „Porträts“.
// Keine Ausgaben mehr: der neueste Artikel steht vorn (nach Erscheinungsdatum). Artikel ohne Datum
// (z.B. aus dem Start-Import mit „Datum folgt“) kommen ans Ende – das Vereinsheim setzt das Datum
// beim Veröffentlichen automatisch.

export interface ArtikelFilter {
  ressort?: Ressort
  /** Porträts („Fünf Fragen an …“) mit ausgeben */
  mitInterviews?: boolean
  hervorgehoben?: boolean
  limit?: number
}

type ArtikelRoh = Omit<Artikel, 'ressort'> & { ressort: { slug: Ressort } | null }

const FELDER = '*,ressort.slug'

function mitRessortSlug({ ressort, ...artikel }: ArtikelRoh): Artikel {
  return { ...artikel, ressort: ressort?.slug ?? 'verein' }
}

/** Zeitpunkt fürs Sortieren: Erscheinungsdatum (ohne Datum = ganz alt) */
const zeitpunkt = (a: Artikel) => Date.parse(a.veroeffentlicht_am ?? '') || 0

/** neueste zuerst */
function sortierung(a: Artikel, b: Artikel) {
  return zeitpunkt(b) - zeitpunkt(a) || b.id - a.id
}

export async function ladeArtikelListe(filter: ArtikelFilter = {}): Promise<Artikel[]> {
  const bedingungen: object[] = [VEROEFFENTLICHT]
  if (filter.ressort) bedingungen.push({ ressort: { slug: { _eq: filter.ressort } } })
  // Porträts laufen über „Fünf Fragen an …“, nicht über die Listen (außer im Ressort-Filter)
  else if (!filter.mitInterviews) bedingungen.push({ ressort: { slug: { _neq: 'portraets' } } })
  if (filter.hervorgehoben) bedingungen.push({ hervorgehoben: { _eq: true } })
  const roh = await directusListe<ArtikelRoh>('artikel', { fields: FELDER, filter: { _and: bedingungen } })
  const liste = roh.map(mitRessortSlug).sort(sortierung)
  return filter.limit ? liste.slice(0, filter.limit) : liste
}

export async function ladeArtikel(slug: string): Promise<ArtikelDetail | null> {
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return null
  const [roh] = await directusListe<ArtikelRoh>('artikel', {
    fields: FELDER,
    filter: { _and: [VEROEFFENTLICHT, { slug: { _eq: slug } }] },
    limit: 1,
  })
  if (!roh) return null
  const artikel = mitRessortSlug(roh)
  return { ...artikel, inhalt_html: markdownZuHtml(artikel.inhalt ?? '') }
}
