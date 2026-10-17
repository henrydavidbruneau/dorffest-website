import type { DirectusEintrag } from './directus'
import type { BeitragStufe, Mitgliedsart } from '../utils/mitgliedschaft'

/** Directus-Collection `mitgliedsantraege` */
export interface Mitgliedsantrag extends DirectusEintrag {
  art: Mitgliedsart
  beitrag_stufe: BeitragStufe
  /** Jahresbeitrag in Euro (bei "standard" ggf. mehr als 24) */
  beitrag_jahr: number
  vorname: string
  nachname: string
  strasse: string
  plz: string
  ort: string
  email: string
  telefon: string | null
  /** nur reguläre Mitglieder: schon einmal beim Plenum gewesen */
  plenum_besucht: boolean | null
  nachricht: string | null
}
