import type { DirectusEintrag } from './directus'

/** Directus-Collection `termine` */
export interface Termin extends DirectusEintrag {
  slug: string
  titel: string
  /** ISO-Datum mit Uhrzeit. null = Datum steht noch nicht fest */
  beginn: string | null
  ende: string | null
  /** Ersetzt die Datumsanzeige, solange `beginn` fehlt, z.B. "2026" */
  datum_text: string | null
  /** Text statt Uhrzeit/Ort, z.B. "Termin folgt – hilf mit planen" */
  hinweis: string | null
  /** null = "Ort folgt" */
  ort: string | null
  adresse: string | null
  kurzbeschreibung: string | null
  /** Markdown */
  beschreibung: string | null
  /** Beschriftung des Links auf dem Zettel. Standard: "Details" */
  aufruf_text: string | null
  /** auf der Startseite unter "Was kommt" zeigen */
  hervorgehoben: boolean
}
