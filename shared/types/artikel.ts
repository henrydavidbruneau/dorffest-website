import type { DirectusEintrag } from './directus'

export type Ressort = 'feste' | 'verein' | 'treffen' | 'kinder' | 'rezepte'

/** Directus-Collection `dorfanzeiger` (Artikel) */
export interface Artikel extends DirectusEintrag {
  slug: string
  titel: string
  /** Kürzerer Titel für Teaser, z.B. "So war das erste Dorffest". Sonst `titel` */
  teaser_titel: string | null
  /** Kurztext für Teaser im Dorfanzeiger */
  teaser: string
  /** noch kürzerer Teaser für die Startseite. Sonst `teaser` */
  teaser_kurz: string | null
  /** normaler Artikel oder Interview ("Fünf Fragen an …", erscheint nicht in den Listen) */
  art: 'artikel' | 'interview'
  ressort: Ressort
  autor_in: string | null
  /** kleines Rundbild neben dem Namen */
  autor_in_bild: string | null
  /** ISO-Datum. null = Datum folgt */
  veroeffentlicht_am: string | null
  /** Ersetzt die Datumsanzeige, z.B. "November" oder "Datum folgt" */
  datum_text: string | null
  lesedauer_minuten: number | null
  /** Directus: Datei-ID. Bis dahin: Pfad unter public/ */
  bild: string | null
  bild_alt: string | null
  bildunterschrift: string | null
  /** Markdown. Eigene Konventionen:
   *  - `![Alt](/pfad.webp "Bildunterschrift")` allein in einer Zeile = Bild mit Unterschrift
   *  - `> Zitat` + `> — Quelle` = Zitatkasten */
  inhalt: string
  /** Aufruf-Kasten am Ende (z.B. "Nächstes Jahr wieder?") */
  aufruf_titel: string | null
  aufruf_text: string | null
  aufruf_knopf: string | null
  aufruf_link: string | null
  /** Seite in der Ausgabe */
  seite: number | null
  titelgeschichte: boolean
  /** auf der Startseite unter "Was bisher geschah" zeigen */
  hervorgehoben: boolean
  /** Reihenfolge innerhalb der Ausgabe (Directus: manuelle Sortierung) */
  sort: number | null
  /** Fremdschlüssel auf `ausgaben` */
  ausgabe: number | null
}

/** Artikel-Detail: wie in Directus, plus serverseitig gerendertes HTML */
export interface ArtikelDetail extends Artikel {
  inhalt_html: string
}
