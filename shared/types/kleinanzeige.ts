import type { DirectusEintrag } from './directus'

export type KleinanzeigeArt = 'gesucht' | 'biete' | 'gefunden'

/** Directus-Collection `kleinanzeigen` */
export interface Kleinanzeige extends DirectusEintrag {
  art: KleinanzeigeArt
  /** Was gesucht/geboten/gefunden wird, z.B. "Kuchen" */
  titel: string
  text: string
  /** z.B. "melde dich!" oder "abholen" */
  link_text: string | null
  /** URL oder mailto: */
  link: string | null
}
