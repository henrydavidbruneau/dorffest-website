import type { DirectusEintrag } from './directus'

/** Directus-Collection `portraets` ("Fünf Fragen an …") */
export interface Portraet extends DirectusEintrag {
  name: string
  zitat: string
  bild: string | null
  bild_alt: string | null
  /** Slug des Interview-Artikels */
  artikel: string | null
  /** Fremdschlüssel auf `ausgaben` */
  ausgabe: number | null
}
