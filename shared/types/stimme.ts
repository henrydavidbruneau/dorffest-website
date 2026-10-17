import type { DirectusEintrag } from './directus'

/** Directus-Collection `stimmen` ("Stimmen aus dem Verein") */
export interface Stimme extends DirectusEintrag {
  name: string
  zitat: string
  bild: string | null
  bild_alt: string | null
  sort: number | null
}
