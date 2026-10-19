/** „Fünf Fragen an …“ – abgeleitet aus einem Artikel im Ressort „Porträts“ */
export interface Portraet {
  /** ID des Artikels */
  id: number
  name: string
  zitat: string
  /** Directus: Datei-ID */
  bild: string | null
  bild_alt: string | null
  /** Slug des Interview-Artikels */
  artikel: string | null
}
