import type { DirectusEintrag } from './directus'

/** Directus-Collection `faq` */
export interface Faq extends DirectusEintrag {
  frage: string
  /** Markdown */
  antwort: string
  sort: number | null
}
