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
  /** Bild: Directus-Ordner */
  ordner?: string
  maxlength?: number
  /** nur zeigen, wenn … */
  wenn?: (daten: Record<string, unknown>) => boolean
}

export const STATUS_VEROEFFENTLICHT = { draft: 'Entwurf', published: 'Veröffentlicht', archived: 'Archiv' }

export const FELDER_TERMIN: FeldDef[] = [
  { feld: 'titel', label: 'Titel', typ: 'text', pflicht: true, breit: true, maxlength: 160 },
  { feld: 'slug', label: 'Adresse (/termine/…)', typ: 'text', pflicht: true, hinweis: 'nur a–z, 0–9 und Bindestriche', maxlength: 120 },
  { feld: 'hervorgehoben', label: 'Auf der Startseite unter „Was kommt“', typ: 'janein' },
  { feld: 'beginn', label: 'Beginn', typ: 'zeitpunkt', hinweis: 'leer = Datum steht noch nicht fest' },
  { feld: 'ende', label: 'Ende', typ: 'zeitpunkt' },
  { feld: 'uhrzeit_folgt', label: 'Datum fest, Uhrzeit folgt', typ: 'janein' },
  { feld: 'datum_text', label: 'Text statt Datum', typ: 'text', hinweis: 'z.B. „2027“, solange kein Beginn eingetragen ist', maxlength: 60 },
  { feld: 'rhythmus_kurz', label: 'Rhythmus (kurz)', typ: 'text', hinweis: 'z.B. „1. Mo“ für regelmäßige Termine', maxlength: 30 },
  { feld: 'hinweis', label: 'Hinweis statt Uhrzeit/Ort', typ: 'text', hinweis: 'z.B. „Programm folgt – hilf mit planen“', maxlength: 160 },
  { feld: 'ort', label: 'Ort', typ: 'text', hinweis: 'leer = „Ort folgt“', maxlength: 160 },
  { feld: 'adresse', label: 'Adresse', typ: 'text', maxlength: 200 },
  { feld: 'kurzbeschreibung', label: 'Kurzbeschreibung', typ: 'mehrzeilig', breit: true, hinweis: '≈ 200 Zeichen für Zettel, Kalender und Vorschau', maxlength: 300 },
  { feld: 'beschreibung', label: 'Worum geht’s?', typ: 'markdown', breit: true },
  { feld: 'aufruf_text', label: 'Linktext auf dem Zettel', typ: 'text', hinweis: 'Standard: „Details“', maxlength: 40 },
  { feld: 'bild', label: 'Bild (Polaroid)', typ: 'bild', ordner: 'termine' },
  { feld: 'bild_alt', label: 'Was ist auf dem Bild?', typ: 'text', hinweis: 'für Menschen, die das Bild nicht sehen', wenn: d => !!d.bild, maxlength: 200 },
  { feld: 'anmeldung_aktiv', label: 'Anmeldung möglich', typ: 'janein' },
  { feld: 'plaetze', label: 'Plätze', typ: 'zahl', hinweis: 'leer = unbegrenzt', wenn: d => !!d.anmeldung_aktiv },
  { feld: 'mitbringen_position', label: '„Was bringst du mit?“', typ: 'auswahl', optionen: { aus: 'aus', seite_1: 'auf dem Anmeldezettel', seite_2: 'als zweite Seite' } },
  { feld: 'mitbringen_text', label: 'Einleitung zum Mitbringen', typ: 'mehrzeilig', breit: true, wenn: d => d.mitbringen_position !== 'aus' },
  { feld: 'mitbringen_vorschlaege', label: 'Vorschläge zum Antippen', typ: 'tags', breit: true, hinweis: 'mit Komma trennen: Kuchen, Kaffee, Becher', wenn: d => d.mitbringen_position !== 'aus' },
]

export const FELDER_ARTIKEL: FeldDef[] = [
  { feld: 'titel', label: 'Titel', typ: 'text', pflicht: true, breit: true, maxlength: 200 },
  { feld: 'slug', label: 'Adresse (/dorfanzeiger/…)', typ: 'text', pflicht: true, maxlength: 120 },
  { feld: 'ressort', label: 'Ressort', typ: 'beziehung', pflicht: true },
  { feld: 'ausgabe', label: 'Ausgabe', typ: 'beziehung' },
  { feld: 'seite', label: 'Seite in der Ausgabe', typ: 'zahl' },
  { feld: 'titelgeschichte', label: 'Titelgeschichte', typ: 'janein', hinweis: 'höchstens eine je Ausgabe' },
  { feld: 'hervorgehoben', label: 'Startseite „Was bisher geschah“', typ: 'janein' },
  { feld: 'teaser_titel', label: 'Kurzer Titel für Teaser', typ: 'text', maxlength: 120 },
  { feld: 'teaser', label: 'Vorspann / Teaser', typ: 'mehrzeilig', breit: true, pflicht: true },
  { feld: 'teaser_kurz', label: 'Teaser für die Startseite (noch kürzer)', typ: 'mehrzeilig', breit: true },
  { feld: 'autor_in', label: 'Autor*in', typ: 'text', maxlength: 120 },
  { feld: 'autor_in_bild', label: 'Bild der Autor*in (rund)', typ: 'bild', ordner: 'artikel' },
  { feld: 'veroeffentlicht_am', label: 'Erschienen am', typ: 'datum' },
  { feld: 'datum_text', label: 'Text statt Datum', typ: 'text', hinweis: 'z.B. „November“', maxlength: 60 },
  { feld: 'lesedauer_minuten', label: 'Lesedauer (Minuten)', typ: 'zahl', hinweis: 'leer = wird aus dem Text geschätzt' },
  { feld: 'bild', label: 'Hauptbild', typ: 'bild', ordner: 'artikel' },
  { feld: 'bild_alt', label: 'Was ist auf dem Bild?', typ: 'text', wenn: d => !!d.bild, maxlength: 200 },
  { feld: 'bildunterschrift', label: 'Bildunterschrift', typ: 'text', wenn: d => !!d.bild },
  { feld: 'inhalt', label: 'Text', typ: 'markdown', breit: true, pflicht: true, hinweis: 'Bild mit Unterschrift: ![Alt](url "Unterschrift") · Zitat: > … und > — Quelle' },
  { feld: 'aufruf_titel', label: 'Gelber Kasten: Titel', typ: 'text', maxlength: 120 },
  { feld: 'aufruf_text', label: 'Gelber Kasten: Text', typ: 'mehrzeilig', wenn: d => !!d.aufruf_titel },
  { feld: 'aufruf_knopf', label: 'Gelber Kasten: Knopf', typ: 'text', wenn: d => !!d.aufruf_titel, maxlength: 40 },
  { feld: 'aufruf_link', label: 'Gelber Kasten: Link', typ: 'text', wenn: d => !!d.aufruf_titel },
  { feld: 'portraet_name', label: 'Porträt: Name', typ: 'text', hinweis: 'nur Ressort Porträts – für „Fünf Fragen an …“', maxlength: 120 },
  { feld: 'portraet_zitat', label: 'Porträt: Zitat', typ: 'mehrzeilig', wenn: d => !!d.portraet_name },
]

export const FELDER_AUSGABE: FeldDef[] = [
  { feld: 'nummer', label: 'Nummer', typ: 'zahl', pflicht: true },
  { feld: 'jahreszeit', label: 'Jahreszeit', typ: 'auswahl', pflicht: true, optionen: { fruehling: 'Frühling', sommer: 'Sommer', herbst: 'Herbst', winter: 'Winter' } },
  { feld: 'jahr', label: 'Jahr', typ: 'zahl', pflicht: true },
  { feld: 'motto', label: 'Motto', typ: 'text', maxlength: 120 },
  { feld: 'erschienen_am', label: 'Erschienen am', typ: 'datum', hinweis: 'leer = angekündigt' },
  { feld: 'bild', label: 'Bild', typ: 'bild', ordner: 'artikel' },
  { feld: 'bild_alt', label: 'Was ist auf dem Bild?', typ: 'text', wenn: d => !!d.bild },
]

export const FELDER_KLEINANZEIGE: FeldDef[] = [
  { feld: 'ueberschrift', label: 'Überschrift', typ: 'text', pflicht: true, hinweis: 'z.B. „Gesucht: Kuchen“', maxlength: 80 },
  { feld: 'kurzbeschreibung', label: 'Kurzbeschreibung', typ: 'mehrzeilig', maxlength: 80, hinweis: 'höchstens 80 Zeichen' },
  { feld: 'link_text', label: 'Linktext', typ: 'text', hinweis: 'z.B. „melde dich!“', maxlength: 40 },
  { feld: 'ziel_email', label: 'Antworten an', typ: 'email' },
]

export const FELDER_STIMME: FeldDef[] = [
  { feld: 'name', label: 'Name', typ: 'text', pflicht: true, maxlength: 80 },
  { feld: 'zitat', label: 'Zitat', typ: 'mehrzeilig', pflicht: true, maxlength: 160, hinweis: 'höchstens 160 Zeichen, gern mit „…“' },
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
