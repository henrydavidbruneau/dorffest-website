import type { DirectusEintrag } from './directus'
import type { Wiederholung } from '../utils/wiederholung'

export type MitbringenPosition = 'aus' | 'seite_1' | 'seite_2'

/** Directus-Collection `termine` */
export interface Termin extends DirectusEintrag {
  slug: string
  titel: string
  /** ISO-Datum mit Uhrzeit. null = Datum steht noch nicht fest */
  beginn: string | null
  ende: string | null
  /** Datum steht fest, Uhrzeit noch nicht */
  uhrzeit_folgt: boolean
  /** Ersetzt die Datumsanzeige, solange `beginn` fehlt, z.B. "2026" */
  datum_text: string | null
  /** Regelmäßiger Termin: Kurzform statt Datum, z.B. "1. Mo" (leer = automatisch aus `wiederholung`) */
  rhythmus_kurz: string | null
  /** Regelmäßig? `beginn`/`ende` sind das erste Datum (siehe shared/utils/wiederholung.ts).
   *  Fehlt, solange das Feld in Directus noch nicht angelegt ist. */
  wiederholung?: Wiederholung | null
  /** letzter Tag der Wiederholung (YYYY-MM-DD) */
  wiederholung_bis?: string | null
  /** Text statt Uhrzeit/Ort, z.B. "Termin folgt – hilf mit planen" */
  hinweis: string | null
  /** null = "Ort folgt" */
  ort: string | null
  adresse: string | null
  /** Directus: Datei-ID (über die Bild-Route /bilder/:id) */
  bild: string | null
  bild_alt: string | null
  /** kurzer Text für Kacheln (Startseite) */
  kurzbeschreibung: string | null
  /** Markdown */
  beschreibung: string | null
  /** Beschriftung des Links auf dem Zettel. Standard: "Details" */
  aufruf_text: string | null
  /** auf der Startseite unter "Was kommt" zeigen */
  hervorgehoben: boolean
  /** im Nextup-Band (Countdown) auf der Startseite – höchstens einer; fehlt, solange das Feld nicht angelegt ist */
  im_fokus?: boolean | null

  /** Anmeldung möglich? */
  anmeldung_aktiv: boolean
  /** Anzahl Plätze; null = unbegrenzt */
  plaetze: number | null

  /** Mitbring-Formular ("Was bringst du mit?"):
   *  aus = nicht zeigen · seite_1 = auf der ersten Seite (mit der Anmeldung)
   *  seite_2 = als zweite Seite der Anmeldung (ohne Anmeldung wie seite_1) */
  mitbringen_position: MitbringenPosition
  /** Einleitung zum Mitbringen, z.B. "Wir stellen einen Tisch mit Getränken und Gebäck auf …" */
  mitbringen_text: string | null
  /** Vorschläge zum Antippen (Directus: Tags/JSON) */
  mitbringen_vorschlaege: string[] | null
}

/** Termin-Detail: wie in Directus, plus serverseitig berechnete Felder */
/** wie geliefert: bei regelmäßigen Terminen sind `beginn`/`ende` schon das nächste Datum */
export interface TerminDetail extends Termin {
  /** „jeden ersten Montag im Monat“ (leer bei einmaligen) */
  wiederholung_text: string
  beschreibung_html: string
  /** freie Plätze (nur bei begrenzten Plätzen), sonst null */
  plaetze_frei: number | null
  /** liegt der Termin schon zurück? */
  vergangen: boolean
}
