import type { DirectusEintrag } from './directus'

export type Jahreszeit = 'fruehling' | 'sommer' | 'herbst' | 'winter'

/** Directus-Collection `ausgaben` (Dorfanzeiger-Ausgaben) */
export interface Ausgabe extends DirectusEintrag {
  nummer: number
  jahreszeit: Jahreszeit
  jahr: number
  /** Thema der Ausgabe, z.B. "Die letzte Planungsrunde" */
  motto: string | null
  /** Directus: Datei-ID (über die Bild-Route /bilder/:id) */
  bild: string | null
  bild_alt: string | null
  /** null = noch nicht erschienen (wird als "erscheint im …" angezeigt) */
  erschienen_am: string | null
}
