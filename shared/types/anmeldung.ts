import type { DirectusEintrag } from './directus'

/** Directus-Collection `anmeldungen` (Anmeldungen zu Terminen) */
export interface Anmeldung extends DirectusEintrag {
  /** Fremdschlüssel auf `termine` */
  termin: number
  name: string
  email: string
  personen: number
  nachricht: string | null
}

/** Directus-Collection `beitraege` ("Was bringst du mit?") */
export interface Beitrag extends DirectusEintrag {
  termin: number
  name: string
  was: string
  email: string | null
}
