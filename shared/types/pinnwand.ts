import type { DirectusEintrag } from './directus'

/** Directus-Collection `leserbriefe` (Dorfanzeiger) */
export interface Leserbrief extends DirectusEintrag {
  name: string
  text: string
}

/** Directus-Collection `ideenwand` ("Was fehlt dir in Königsdorf?", Mitmachen-Seite) */
export interface Idee extends DirectusEintrag {
  name: string
  text: string
}
