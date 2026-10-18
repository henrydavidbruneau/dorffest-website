import type { Ressort } from './artikel'

/** Directus-Collection `gastbeitrag_einladungen`: privater Link `/gastbeitrag/:schluessel` */
export interface GastbeitragEinladung {
  id: number
  /** zufälliger, nicht erratbarer Schlüssel im Link */
  schluessel: string
  /** für wen der Link ist (Begrüßung „Hallo …!“) */
  name: string
  /** Vorauswahl im Formular, optional */
  ressort: Ressort | null
  /** ISO-Datum; danach ist der Link ungültig. null = unbegrenzt */
  gueltig_bis: string | null
  /** mehrere Beiträge über denselben Link erlaubt (z.B. für eine Gruppe) */
  mehrfach: boolean
  /** offen → eingereicht (nach dem ersten Beitrag, außer `mehrfach`) · widerrufen */
  status: 'offen' | 'eingereicht' | 'widerrufen'
  date_created: string
}

/** Was die Seite über eine Einladung erfährt (ohne interne Felder) */
export interface GastbeitragEinladungOeffentlich {
  name: string
  ressort: Ressort | null
  /** schon eingereicht oder abgelaufen → nur Hinweis statt Formular */
  gueltig: boolean
  grund: 'eingereicht' | 'abgelaufen' | null
}

/** Directus-Collection `gastbeitraege`: eingereichte Texte, warten im Vereinsheim aufs Okay */
export interface Gastbeitrag {
  id: number
  status: 'eingereicht' | 'angenommen' | 'abgelehnt'
  einladung: number
  titel: string
  ressort: Ressort
  teaser: string | null
  /** Markdown (Leerzeile = neuer Absatz) */
  inhalt: string
  /** Directus: Datei-ID */
  bild: string | null
  bildunterschrift: string | null
  foto_von: string | null
  /** Name unter dem Artikel */
  autor_in: string
  /** nur für Rückfragen, wird nicht veröffentlicht */
  email: string
  rechte_bestaetigt: boolean
  /** Mitglied, das den Beitrag angenommen/abgelehnt hat */
  geprueft_von: string | null
  /** angelegter Artikel-Entwurf nach dem Annehmen */
  artikel: number | null
  date_created: string
}
