// Lesezugriff auf Dorfanzeiger-Artikel. Heute aus server/data, später aus Directus (`dorfanzeiger`).
import { artikel as platzhalter } from '../data/dorfanzeiger'

export interface ArtikelFilter {
  ressort?: Ressort
  hervorgehoben?: boolean
  limit?: number
}

/** Titelgeschichte zuerst, dann neueste zuerst; ohne Datum ans Ende */
function sortierung(a: Artikel, b: Artikel) {
  if (a.titelgeschichte !== b.titelgeschichte) return a.titelgeschichte ? -1 : 1
  if (!a.veroeffentlicht_am) return 1
  if (!b.veroeffentlicht_am) return -1
  return Date.parse(b.veroeffentlicht_am) - Date.parse(a.veroeffentlicht_am)
}

export async function ladeArtikelListe(filter: ArtikelFilter = {}): Promise<Artikel[]> {
  let liste = platzhalter.filter(a => a.status === 'published')
  if (filter.ressort) liste = liste.filter(a => a.ressort === filter.ressort)
  if (filter.hervorgehoben) liste = liste.filter(a => a.hervorgehoben)
  // Hervorgehobene in der Reihenfolge der Daten (= Reihenfolge im Design)
  if (!filter.hervorgehoben) liste = [...liste].sort(sortierung)
  return filter.limit ? liste.slice(0, filter.limit) : liste
}

export async function ladeArtikel(slug: string): Promise<Artikel | null> {
  return platzhalter.find(a => a.slug === slug && a.status === 'published') ?? null
}
