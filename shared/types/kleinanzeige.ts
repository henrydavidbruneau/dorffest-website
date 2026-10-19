import type { DirectusEintrag } from './directus'

/** Directus-Collection `kleinanzeigen` (max. 4 veröffentlichte) */
export interface Kleinanzeige extends Omit<DirectusEintrag, 'status'> {
  status: 'published' | 'draft'
  /** z.B. "Gesucht: Kuchen" */
  ueberschrift: string
  kurzbeschreibung: string | null
  /** z.B. "melde dich!" */
  link_text: string | null
  /** Ziel des Links (mailto: mit Betreff „Kleinanzeige: …“) */
  ziel_email: string | null
  sort: number | null
}
