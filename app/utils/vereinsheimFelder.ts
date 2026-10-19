// Feldlisten für den Editor im Vereinsheim (<VereinsheimEditor>) – je Collection einmal,
// benannt wie in Directus (DIRECTUS.md). Reihenfolge = Reihenfolge im Formular.

export interface FeldDef {
  feld: string
  label: string
  typ: 'text' | 'mehrzeilig' | 'markdown' | 'zahl' | 'datum' | 'zeitpunkt' | 'janein' | 'auswahl' | 'bild' | 'tags' | 'email' | 'beziehung'
  hinweis?: string
  pflicht?: boolean
  /** über die ganze Breite */
  breit?: boolean
  /** Auswahl: Wert → Beschriftung (bei `beziehung` lädt die Seite die Optionen) */
  optionen?: Record<string, string>
  /** Auswahl: Beschriftung für „nichts gewählt“ (Standard „– nichts –“) */
  leerText?: string
  /** Bild: Directus-Ordner */
  ordner?: string
  maxlength?: number
  /** nur zeigen, wenn … */
  wenn?: (daten: Record<string, unknown>) => boolean
  /** Abschnitt im Formular (siehe GruppeDef) */
  gruppe?: string
  /** große Eingabe (z.B. Titel) */
  gross?: boolean
}

/** Abschnitt im Formular: links die Hauptspalte (Text), rechts die Randspalte (Einstellungen) */
export interface GruppeDef {
  key: string
  titel: string
  seite: 'haupt' | 'rand'
  /** zugeklappt, bis jemand ihn öffnet (öffnet sich von selbst, wenn schon etwas drinsteht) */
  einklappbar?: boolean
  hinweis?: string
  /** nur zeigen, wenn … (z.B. nur bei einem bestimmten Ressort) */
  wenn?: (daten: Record<string, unknown>, beziehungen?: Record<string, Record<string, string>>) => boolean
}

export const STATUS_VEROEFFENTLICHT = { draft: 'Entwurf', published: 'Veröffentlicht', archived: 'Archiv' }

// „aus“ steht als leere Auswahl („einmalig“) im Formular
const { aus: _einmalig, ...WIEDERHOLUNGEN_AUSWAHL } = WIEDERHOLUNGEN

export const FELDER_TERMIN: FeldDef[] = [
  { feld: 'titel', gruppe: 'text', gross: true, label: 'Titel', typ: 'text', pflicht: true, breit: true, maxlength: 160 },
  { feld: 'slug', gruppe: 'website', label: 'Adresse (/termine/…)', typ: 'text', pflicht: true, hinweis: 'nur a–z, 0–9 und Bindestriche', maxlength: 120 },
  { feld: 'hervorgehoben', gruppe: 'website', label: 'Auf der Startseite unter „Was kommt“', typ: 'janein' },
  { feld: 'beginn', gruppe: 'wann', label: 'Beginn', typ: 'zeitpunkt', hinweis: 'leer = Datum steht noch nicht fest; bei regelmäßigen das erste Mal' },
  { feld: 'ende', gruppe: 'wann', label: 'Ende', typ: 'zeitpunkt' },
  { feld: 'uhrzeit_folgt', gruppe: 'wann', label: 'Datum fest, Uhrzeit folgt', typ: 'janein' },
  { feld: 'wiederholung', gruppe: 'wann', label: 'Wiederholen', typ: 'auswahl', optionen: WIEDERHOLUNGEN_AUSWAHL, leerText: 'einmalig', hinweis: 'gleicher Wochentag = z.B. jeden 1. Montag; Beginn/Ende sind das erste Mal, die Website zeigt immer das nächste Datum', wenn: d => !!d.beginn },
  { feld: 'wiederholung_bis', gruppe: 'wann', label: 'Wiederholen bis', typ: 'datum', hinweis: 'leer = ohne Ende', wenn: d => !!d.beginn && !!d.wiederholung && d.wiederholung !== 'aus' },
  { feld: 'rhythmus_kurz', gruppe: 'wann', label: 'Kurzform im Terminkalender', typ: 'text', hinweis: 'leer = automatisch, z.B. „1. Mo“', maxlength: 30, wenn: d => !!d.wiederholung && d.wiederholung !== 'aus' },
  { feld: 'datum_text', gruppe: 'wann', label: 'Text statt Datum', typ: 'text', hinweis: 'z.B. „2027“, solange kein Beginn eingetragen ist', maxlength: 60 },

  { feld: 'ort', gruppe: 'wo', label: 'Ort', typ: 'text', hinweis: 'leer = „Ort folgt“', maxlength: 160 },
  { feld: 'adresse', gruppe: 'wo', label: 'Adresse', typ: 'text', maxlength: 200 },
  { feld: 'hinweis', gruppe: 'wo', label: 'Hinweis statt Uhrzeit/Ort', typ: 'text', hinweis: 'z.B. „Programm folgt – hilf mit planen“', maxlength: 160 },
  { feld: 'kurzbeschreibung', gruppe: 'text', label: 'Kurzbeschreibung', typ: 'mehrzeilig', breit: true, hinweis: '≈ 200 Zeichen für Zettel, Kalender und Vorschau', maxlength: 300 },
  { feld: 'beschreibung', gruppe: 'text', label: 'Beschreibung', typ: 'markdown', breit: true },
  { feld: 'aufruf_text', gruppe: 'website', label: 'Linktext auf dem Zettel', typ: 'text', hinweis: 'Standard: „Details“', maxlength: 40 },
  { feld: 'bild', gruppe: 'bild', label: 'Foto', hinweis: 'erscheint als Polaroid auf der Terminseite', typ: 'bild', ordner: 'termine' },
  { feld: 'bild_alt', gruppe: 'bild', label: 'Was ist auf dem Bild?', typ: 'text', hinweis: 'für Menschen, die das Bild nicht sehen', wenn: d => !!d.bild, maxlength: 200 },
  { feld: 'anmeldung_aktiv', gruppe: 'anmeldung', label: 'Anmeldung möglich', typ: 'janein' },
  { feld: 'plaetze', gruppe: 'anmeldung', label: 'Plätze', typ: 'zahl', hinweis: 'leer = unbegrenzt', wenn: d => !!d.anmeldung_aktiv },
  { feld: 'mitbringen_position', gruppe: 'anmeldung', label: '„Was bringst du mit?“', typ: 'auswahl', optionen: { aus: 'aus', seite_1: 'auf dem Anmeldezettel', seite_2: 'als zweite Seite' } },
  { feld: 'mitbringen_text', gruppe: 'anmeldung', label: 'Einleitung zum Mitbringen', typ: 'mehrzeilig', breit: true, wenn: d => d.mitbringen_position !== 'aus' },
  { feld: 'mitbringen_vorschlaege', gruppe: 'anmeldung', label: 'Vorschläge zum Antippen', typ: 'tags', breit: true, hinweis: 'mit Komma trennen: Kuchen, Kaffee, Becher', wenn: d => d.mitbringen_position !== 'aus' },
]

export const GRUPPEN_TERMIN: GruppeDef[] = [
  { key: 'text', titel: 'Worum geht’s?', seite: 'haupt' },
  { key: 'anmeldung', titel: 'Anmeldung & Mitbringen', seite: 'haupt' },
  { key: 'wann', titel: 'Wann', seite: 'rand' },
  { key: 'wo', titel: 'Wo', seite: 'rand' },
  { key: 'bild', titel: 'Bild', seite: 'rand' },
  { key: 'website', titel: 'Auf der Website', seite: 'rand' },
]

export const FELDER_ARTIKEL: FeldDef[] = [
  { feld: 'titel', gruppe: 'text', gross: true, label: 'Titel', typ: 'text', pflicht: true, breit: true, maxlength: 200 },
  { feld: 'slug', gruppe: 'extras', label: 'Adresse (/dorfanzeiger/…)', typ: 'text', pflicht: true, maxlength: 120 },
  { feld: 'ressort', gruppe: 'einordnung', label: 'Ressort', typ: 'beziehung', pflicht: true },
  { feld: 'hervorgehoben', gruppe: 'einordnung', label: 'Startseite „Was bisher geschah“', typ: 'janein' },
  { feld: 'teaser_titel', gruppe: 'extras', label: 'Kurzer Titel für Teaser', typ: 'text', maxlength: 120 },
  { feld: 'teaser', gruppe: 'text', label: 'Vorspann / Teaser', typ: 'mehrzeilig', breit: true, pflicht: true },
  { feld: 'teaser_kurz', gruppe: 'extras', label: 'Teaser für die Startseite (noch kürzer)', typ: 'mehrzeilig', breit: true },
  { feld: 'autor_in', gruppe: 'autor', label: 'Autor*in', typ: 'text', maxlength: 120 },
  { feld: 'autor_in_bild', gruppe: 'autor', label: 'Bild der Autor*in (rund)', typ: 'bild', ordner: 'artikel' },
  { feld: 'veroeffentlicht_am', gruppe: 'autor', label: 'Erschienen am', typ: 'datum', hinweis: 'bestimmt die Reihenfolge im Dorfanzeiger; leer = Tag des Veröffentlichens' },
  { feld: 'datum_text', gruppe: 'autor', label: 'Text statt Datum', typ: 'text', hinweis: 'z.B. „November“', maxlength: 60 },
  { feld: 'lesedauer_minuten', gruppe: 'autor', label: 'Lesedauer (Minuten)', typ: 'zahl', hinweis: 'leer = wird aus dem Text geschätzt' },
  { feld: 'bild', gruppe: 'bild', label: 'Foto', typ: 'bild', ordner: 'artikel' },
  { feld: 'bild_alt', gruppe: 'bild', label: 'Was ist auf dem Bild?', typ: 'text', wenn: d => !!d.bild, maxlength: 200 },
  { feld: 'bildunterschrift', gruppe: 'bild', label: 'Bildunterschrift', typ: 'text', wenn: d => !!d.bild },
  { feld: 'inhalt', gruppe: 'text', label: 'Text', typ: 'markdown', breit: true, pflicht: true, hinweis: 'Bild mit Unterschrift: ![Alt](url "Unterschrift") · Zitat: > … und > — Quelle' },
  { feld: 'aufruf_titel', gruppe: 'aufruf', label: 'Titel', typ: 'text', maxlength: 120 },
  { feld: 'aufruf_text', gruppe: 'aufruf', label: 'Text', typ: 'mehrzeilig', wenn: d => !!d.aufruf_titel },
  { feld: 'aufruf_knopf', gruppe: 'aufruf', label: 'Knopf-Text', typ: 'text', wenn: d => !!d.aufruf_titel, maxlength: 40 },
  { feld: 'aufruf_link', gruppe: 'aufruf', label: 'Knopf-Link', typ: 'text', wenn: d => !!d.aufruf_titel },
  { feld: 'portraet_name', gruppe: 'portraet', label: 'Name', typ: 'text', maxlength: 120 },
  { feld: 'portraet_zitat', gruppe: 'portraet', label: 'Zitat', typ: 'mehrzeilig', wenn: d => !!d.portraet_name },
]

export const GRUPPEN_ARTIKEL: GruppeDef[] = [
  { key: 'text', titel: 'Artikel', seite: 'haupt' },
  { key: 'aufruf', titel: 'Gelber Kasten am Ende', seite: 'haupt', einklappbar: true, hinweis: 'z.B. „Mach mit!“ mit Knopf' },
  // nur im Ressort „Porträts“ – speist „Fünf Fragen an …“ im Dorfanzeiger
  { key: 'portraet', titel: 'Porträt', seite: 'haupt', hinweis: 'Name und Zitat für „Fünf Fragen an …“', wenn: (d, b) => b?.ressort?.[String(d.ressort ?? '')] === 'Porträts' },
  { key: 'einordnung', titel: 'Einordnung', seite: 'rand' },
  { key: 'autor', titel: 'Autor*in & Datum', seite: 'rand' },
  { key: 'bild', titel: 'Hauptbild', seite: 'rand' },
  { key: 'extras', titel: 'Teaser & Adresse', seite: 'rand', einklappbar: true, hinweis: 'kürzere Titel/Texte für Übersichten' },
]

export const FELDER_KLEINANZEIGE: FeldDef[] = [
  { feld: 'ueberschrift', label: 'Überschrift', typ: 'text', pflicht: true, hinweis: 'z.B. „Gesucht: Kuchen“', maxlength: 80 },
  { feld: 'kurzbeschreibung', label: 'Kurzbeschreibung', typ: 'mehrzeilig', maxlength: 80, hinweis: 'höchstens 80 Zeichen' },
  { feld: 'link_text', label: 'Linktext', typ: 'text', hinweis: 'z.B. „melde dich!“', maxlength: 40 },
  { feld: 'ziel_email', label: 'Antworten an', typ: 'email' },
]

export const FELDER_STIMME: FeldDef[] = [
  { feld: 'name', label: 'Name', typ: 'text', pflicht: true, maxlength: 80 },
  { feld: 'zitat', label: 'Zitat', typ: 'mehrzeilig', pflicht: true, maxlength: 400, hinweis: 'höchstens 400 Zeichen – lange Zitate werden auf der Website kleiner gesetzt' },
  { feld: 'bild', label: 'Foto (quadratisch)', typ: 'bild', ordner: 'stimmen' },
  { feld: 'bild_alt', label: 'Was ist auf dem Foto?', typ: 'text', wenn: d => !!d.bild },
]

export const FELDER_FAQ: FeldDef[] = [
  { feld: 'frage', label: 'Frage', typ: 'text', pflicht: true, breit: true, maxlength: 200 },
  { feld: 'antwort', label: 'Antwort', typ: 'markdown', pflicht: true, breit: true },
]

export const FELDER_MITGLIED: FeldDef[] = [
  { feld: 'vorname', label: 'Vorname', typ: 'text', pflicht: true },
  { feld: 'nachname', label: 'Nachname', typ: 'text', pflicht: true },
  { feld: 'status', label: 'Status', typ: 'auswahl', optionen: { aktiv: 'aktiv', ausgetreten: 'ausgetreten', gestrichen: 'gestrichen' } },
  { feld: 'art', label: 'Art', typ: 'auswahl', optionen: { foerder: 'Fördermitglied', stimmberechtigt: 'stimmberechtigt' } },
  { feld: 'strasse', label: 'Straße', typ: 'text' },
  { feld: 'plz', label: 'PLZ', typ: 'text' },
  { feld: 'ort', label: 'Ort', typ: 'text' },
  { feld: 'email', label: 'E-Mail', typ: 'email' },
  { feld: 'telefon', label: 'Telefon', typ: 'text' },
  { feld: 'mitglied_seit', label: 'Mitglied seit', typ: 'datum' },
  { feld: 'austritt_zum', label: 'Austritt zum', typ: 'datum' },
  { feld: 'beitrag_jahr', label: 'Beitrag im Jahr (€)', typ: 'zahl' },
  { feld: 'beitrag_bezahlt_bis', label: 'Beitrag bezahlt bis', typ: 'datum' },
  { feld: 'notiz', label: 'Notiz (intern)', typ: 'mehrzeilig', breit: true },
]

export const FELDER_AUSLAGE: FeldDef[] = [
  { feld: 'titel', label: 'Wofür?', typ: 'text', pflicht: true, breit: true, maxlength: 160 },
  { feld: 'betrag', label: 'Betrag (€)', typ: 'zahl', pflicht: true },
  { feld: 'datum', label: 'Datum der Ausgabe', typ: 'datum', pflicht: true },
  { feld: 'termin', label: 'Für welchen Termin? (optional)', typ: 'beziehung' },
  { feld: 'kontoinhaber_in', label: 'Kontoinhaber*in', typ: 'text' },
  { feld: 'iban', label: 'IBAN', typ: 'text' },
  { feld: 'notiz', label: 'Notiz', typ: 'mehrzeilig', breit: true },
]

export const FELDER_VEREIN: FeldDef[] = [
  { feld: 'kontakt_email', label: 'Kontakt-Mail', typ: 'email', pflicht: true, hinweis: 'ohne Umlaute – steht auf der Website und bekommt die Hinweis-Mails' },
  { feld: 'infochannel_url', label: 'Link zum Infochannel', typ: 'text', pflicht: true, breit: true },
  { feld: 'kontoinhaber', label: 'Kontoinhaber', typ: 'text', pflicht: true },
  { feld: 'iban', label: 'IBAN', typ: 'text', pflicht: true },
  { feld: 'naechstes_dorffest', label: 'Nächstes Dorffest', typ: 'datum' },
]
