import type { DirectusEintrag } from './directus'

export type Ressort = 'feste' | 'verein' | 'treffen' | 'kinder' | 'rezepte'

/** Directus-Collection `dorfanzeiger` (Artikel) */
export interface Artikel extends DirectusEintrag {
  slug: string
  titel: string
  /** Kurztext für Teaser */
  teaser: string
  ressort: Ressort
  autor_in: string | null
  /** ISO-Datum. null = Datum folgt */
  veroeffentlicht_am: string | null
  /** Ersetzt die Datumsanzeige, z.B. "November" oder "Datum folgt" */
  datum_text: string | null
  lesedauer_minuten: number | null
  /** Directus: Datei-ID. Bis dahin: Pfad unter public/ */
  bild: string | null
  bild_alt: string | null
  bildunterschrift: string | null
  /** Markdown */
  inhalt: string
  titelgeschichte: boolean
  /** Fremdschlüssel auf `ausgaben` */
  ausgabe: number | null
}
