// Lesezugriff auf Dorfanzeiger-Artikel. Heute aus server/data, später aus Directus (`dorfanzeiger`).
import { artikel as platzhalter } from '../data/dorfanzeiger'

export interface ArtikelFilter {
  ressort?: Ressort
  ausgabe?: number
  hervorgehoben?: boolean
  limit?: number
}

/** Titelgeschichte zuerst, dann nach manueller Sortierung der Redaktion */
function sortierung(a: Artikel, b: Artikel) {
  if (a.titelgeschichte !== b.titelgeschichte) return a.titelgeschichte ? -1 : 1
  return (a.sort ?? 999) - (b.sort ?? 999)
}

export async function ladeArtikelListe(filter: ArtikelFilter = {}): Promise<Artikel[]> {
  // Interviews ("Fünf Fragen an …") laufen über die Porträts, nicht über die Listen
  let liste = platzhalter.filter(a => a.status === 'published' && a.art === 'artikel')
  if (filter.ressort) liste = liste.filter(a => a.ressort === filter.ressort)
  if (filter.ausgabe) liste = liste.filter(a => a.ausgabe === filter.ausgabe)
  if (filter.hervorgehoben) liste = liste.filter(a => a.hervorgehoben)
  liste = [...liste].sort(sortierung)
  return filter.limit ? liste.slice(0, filter.limit) : liste
}

export async function ladeArtikel(slug: string): Promise<Artikel | null> {
  return platzhalter.find(a => a.slug === slug && a.status === 'published') ?? null
}
