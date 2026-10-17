import type { DirectusEintrag } from './directus'

/** Directus-Collection `anmeldungen` (Anmeldungen zu Terminen) */
export interface Anmeldung extends DirectusEintrag {
  /** Fremdschlüssel auf `termine` */
  termin: number
  name: string
  email: string
  personen: number
  nachricht: string | null
  /** "Was bringst du mit?" (optional, zweite Seite der Anmeldung) */
  mitbringen: string | null
}

/** Directus-Collection `beitraege` ("Was bringst du mit?" bei Terminen ohne Anmeldung) */
export interface Beitrag extends DirectusEintrag {
  termin: number
  name: string
  was: string
  email: string | null
}
