import type { DirectusEintrag } from './directus'

/** Directus-Collection `wuensche`: Wunschliste bei Terminen (z.B. Songwünsche), Stimmen in `wunsch_stimmen` */
export interface Wunsch extends Omit<DirectusEintrag, 'status'> {
  status: 'published' | 'hidden'
  termin: number
  text: string
  /** freiwillig */
  name: string | null
  /** Hash der Browser-Kennung, wer ihn angelegt hat (nur serverseitig, für die Grenze je Person) */
  waehler?: string | null
}

/** Wunsch, wie die Website ihn bekommt: mit Stimmenzahl und ob dieser Browser schon dafür ist */
export interface WunschMitStimmen {
  id: number
  text: string
  name: string | null
  stimmen: number
  meine: boolean
  /** hat dieser Browser den Wunsch angelegt? */
  eigener: boolean
}
