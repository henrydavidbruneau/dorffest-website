# Directus – was die Website braucht

Bauplan für das Directus der Königsdorf-Seite und das **Vereinsheim** (Admin-Bereich unter
`/vereinsheim`). Vorbild ist DPAT (`~/Documents/Projects/WirSindRaus/dont-post-about-this`,
dort `DIRECTUS.md`, `scripts/directus-setup.mjs`, `server/utils/adminSession.ts`).

Stand: 18.10.2026. Die Website läuft bis zur Umstellung mit Platzhalterdaten aus
`server/data/*.ts`; die Typen in `shared/types/*.ts` entsprechen den Collections unten.

## Grundsätze

- **Directus 11** (Policies statt Rollen), self-hosted.
- Die Website spricht Directus **nur serverseitig** an (`server/utils/*`), nie aus dem Browser.
  Dafür gibt es einen **Server-User** mit statischem Token (`NUXT_DIRECTUS_TOKEN`).
  → **Keine öffentlichen Rechte** in Directus nötig.
- Das **Vereinsheim** ist eine eigene Oberfläche in Nuxt (`app/pages/vereinsheim/*`). Login mit
  dem eigenen Directus-Account, Session als httpOnly-Cookie (wie DPAT `adminSession.ts`).
  Was jemand sehen/ändern darf, regeln die Policies unten.
- Feldnamen `snake_case`. Jede Collection bekommt die Systemfelder `id`, `status` (wo sinnvoll),
  `date_created`, `date_updated`, `user_created`, `user_updated`.
- Personenbezogene Daten (Anmeldungen, Anträge, Mitglieder, Auslagen) sind **nie** über den
  Server-Token lesbar, nur anlegbar – außer wo die Website sie zum Rechnen braucht (Plätze zählen).

## Policies

| Policy | Wer | Kurz |
|---|---|---|
| `Server` | Server-User (Token auf Netlify) | liest Veröffentlichtes, legt Einreichungen an |
| `Mitglied` | alle Vereinsmitglieder mit Vereinsheim-Zugang | Inhalte pflegen, Anmeldungen sehen, eigene Auslagen |
| `Vorstand` | Vorstand (zusätzlich zu `Mitglied`) | Mitgliedsanträge, Mitgliederliste, alle Auslagen |

## Collections im Überblick

| Collection | Wofür | Server | Mitglied | Vorstand |
|---|---|---|---|---|
| `termine` | Events (`/termine/:slug`, Startseite) | read (published) | alles | alles |
| `anmeldungen` | Anmeldungen zu Terminen (inkl. Mitbringen) | create, read (nur `termin`, `personen`) | read, update, delete | alles |
| `beitraege` | „Was bringst du mit?“ bei Terminen ohne Anmeldung | create | read, update, delete | alles |
| `termin_rundmails` | Mails an alle Angemeldeten (Protokoll) | – | create, read | alles |
| `ressorts` | Ressorts des Dorfanzeigers | read | read | alles |
| `ausgaben` | Dorfanzeiger-Ausgaben (Nr., Jahreszeit) | read | alles | alles |
| `artikel` | Dorfanzeiger-Artikel | read (published) | alles | alles |
| `kleinanzeigen` | max. 4 Kleinanzeigen im Dorfanzeiger | read (published) | alles | alles |
| `leserbriefe` | Leserbriefe (sofort sichtbar, moderierbar) | create, read (published) | read, update, delete | alles |
| `stimmen` | „Stimmen aus dem Verein“ (Über uns) | read (published) | alles | alles |
| `faq` | Fragen auf der Startseite | read (published) | alles | alles |
| `ideen` | Ideenwand „Was fehlt dir in Königsdorf?“ | create, read (published) | read, update, delete | alles |
| `vorschlaege` | eingereichte Ideen/Angebote (Mitmachen) | create | read, update | alles |
| `plenum_erinnerungen` | Erinnerungen ans Plenum | create | read, delete | alles |
| `mitgliedsantraege` | Anträge von `/mitglied-werden` | create | – | alles |
| `mitglieder` | Mitgliederliste | – | – | alles |
| `auslagen` | Finanzen: Auslagen einreichen | – | create, read/update **eigene** | alles |
| `verein` (Singleton) | Kontakt, Konto, Infochannel-Link | read | read | alles |

Dateien (`directus_files`): Ordner `termine`, `artikel`, `stimmen`, `belege` (Belege nur
Vorstand + Ersteller*in lesbar). Server darf Dateien lesen, die an veröffentlichten Inhalten hängen.

---

## Termine

### `termine`

| Feld | Typ | Hinweis |
|---|---|---|
| `status` | Auswahl: `draft` · `published` · `archived` | nur `published` erscheint |
| `titel` | Text, Pflicht | |
| `slug` | Text, eindeutig, Pflicht | URL `/termine/:slug`, nur a–z 0–9 - |
| `beginn` | Datum+Zeit, optional | leer = Datum steht noch nicht fest |
| `ende` | Datum+Zeit, optional | |
| `uhrzeit_folgt` | Boolean, Standard false | Datum fest, Uhrzeit offen (Kalenderdatei ganztägig) |
| `datum_text` | Text, optional | ersetzt das Datum, solange `beginn` leer ist („2027“) |
| `rhythmus_kurz` | Text, optional | regelmäßige Termine, z.B. „1. Mo“ (Terminkalender) |
| `hinweis` | Text, optional | ersetzt Uhrzeit/Ort auf dem Zettel („Programm folgt – hilf mit planen“) |
| `ort` | Text, optional | leer = „Ort folgt“ |
| `adresse` | Text, optional | |
| `bild` | Datei (Bild), optional | Polaroid auf der Eventseite |
| `bild_alt` | Text | Pflicht, wenn `bild` gesetzt |
| `kurzbeschreibung` | Text (≈ 200 Zeichen) | Countdown-Band, Zettel, Kalender, Vorschau |
| `beschreibung` | Markdown | „Worum geht’s?“ |
| `aufruf_text` | Text, optional | Linktext auf dem Zettel, Standard „Details“ |
| `hervorgehoben` | Boolean | auf der Startseite unter „Was kommt“ |
| `anmeldung_aktiv` | Boolean | Anmeldezettel anzeigen |
| `plaetze` | Zahl, optional | leer = unbegrenzt; sonst Restplätze + Sticker |
| `mitbringen_position` | Auswahl: `aus` · `seite_1` · `seite_2` | „Was bringst du mit?“ aus / auf dem Anmeldezettel / als 2. Seite |
| `mitbringen_text` | Text, optional | Einleitung, z.B. „Wir stellen einen Tisch mit Getränken …“ |
| `mitbringen_vorschlaege` | Tags (JSON-Liste) | antippbare Vorschläge |

### `anmeldungen`

| Feld | Typ | Hinweis |
|---|---|---|
| `termin` | M2O → `termine`, Pflicht | |
| `name` | Text | |
| `email` | Text | |
| `personen` | Zahl, 1–10 | Summe ergibt belegte Plätze |
| `nachricht` | Text, optional | |
| `mitbringen` | Text, optional | „Was bringst du mit?“ (Seite 1 oder 2) |
| `status` | Auswahl: `angemeldet` · `abgemeldet` | abgemeldete zählen nicht |

O2M an `termine`: Alias-Feld `anmeldungen` (für die Übersicht im Vereinsheim).

### `beitraege`
Mitbring-Liste bei Terminen **ohne** Anmeldung: `termin` (M2O), `name`, `was`, `email` (optional).

### `termin_rundmails`
Protokoll der Mails an alle Angemeldeten: `termin` (M2O), `betreff`, `text` (Markdown),
`empfaenger_anzahl`, `gesendet_am`, `user_created` (wer geschickt hat). Versand über Brevo
(transaktional, BCC-frei: einzeln je Empfänger*in).

### Vereinsheim: Termine
- Liste aller Termine (kommend / vergangen / Entwürfe) mit Datum, Status, Anmeldezahl,
  Restplätzen. Aktionen: **Bearbeiten**, **Duplizieren** (kopiert alles außer `id`, `slug` → `…-kopie`,
  Status → `draft`, Anmeldungen nicht), **Löschen** (mit Rückfrage; Anmeldungen werden mitgelöscht).
- Termin-Formular mit allen Feldern oben, Bild-Upload, Markdown-Vorschau.
- **Anmeldungen** je Termin: Tabelle (Name, Mail, Personen, Nachricht, **Mitbringen**) +
  Mitbring-Liste aus `beitraege`, Summe Personen, CSV-Export.
- **„Mail an alle Angemeldeten“**: Betreff + Text → Server-Route schickt über Brevo, legt
  `termin_rundmails` an.

---

## Dorfanzeiger

### `ressorts`
`name`, `slug`, `sort`. Inhalt: **Feste · Verein · Dorffunk · Rezepte · Feuilleton · Porträts**
(Slugs `feste`, `verein`, `dorffunk`, `rezepte`, `feuilleton`, `portraets`). Als eigene
Collection, damit sie ohne Code-Änderung ergänzt werden können.

### `ausgaben`
`nummer` (Zahl, eindeutig), `jahreszeit` (Auswahl `fruehling` · `sommer` · `herbst` · `winter`),
`jahr`, `motto` (optional), `bild` (Datei, optional), `bild_alt`, `erschienen_am` (Datum;
leer = angekündigt). Die neueste erschienene Ausgabe ist die aktuelle.

### `artikel`

| Feld | Typ | Hinweis |
|---|---|---|
| `status` | `draft` · `published` · `archived` | |
| `titel` | Text, Pflicht | |
| `slug` | Text, eindeutig | `/dorfanzeiger/:slug` |
| `teaser_titel` | Text, optional | kürzerer Titel für Teaser („So war das erste Dorffest“) |
| `teaser` | Text | Vorspann / Teaser im Dorfanzeiger |
| `teaser_kurz` | Text, optional | noch kürzer für die Startseite |
| `ressort` | M2O → `ressorts`, Pflicht | |
| `ausgabe` | M2O → `ausgaben` | |
| `sort` | Zahl | Reihenfolge in der Ausgabe (Drag & Drop) |
| `titelgeschichte` | Boolean | max. eine je Ausgabe (im Vereinsheim prüfen) |
| `hervorgehoben` | Boolean | Startseite „Was bisher geschah“ (3 Stück) |
| `autor_in` | Text, optional | |
| `autor_in_bild` | Datei, optional | kleines Rundbild |
| `veroeffentlicht_am` | Datum, optional | |
| `datum_text` | Text, optional | statt Datum („November“, „Datum folgt“) |
| `lesedauer_minuten` | Zahl, optional | kann das Vereinsheim aus dem Text schätzen |
| `seite` | Zahl, optional | „Seite 1“ in der Kopfzeile |
| `bild`, `bild_alt`, `bildunterschrift` | Datei / Text / Text | |
| `inhalt` | Markdown | Bild allein in einer Zeile mit Titel = Bild mit Unterschrift: `![Alt](url "Unterschrift")`; Zitat mit `> …` und `> — Quelle` |
| `aufruf_titel`, `aufruf_text`, `aufruf_knopf`, `aufruf_link` | Text | gelber Kasten am Ende (optional) |
| `portraet_name`, `portraet_zitat` | Text, optional | nur Ressort „Porträts“: speist „Fünf Fragen an …“ |

> Code-Anpassung bei der Umstellung: Die bisherige Collection-Idee `portraets` und das Feld
> `art: interview` entfallen – ein Porträt ist ein Artikel im Ressort „Porträts“ mit
> `portraet_name`/`portraet_zitat`. Bild = `bild`.

### `kleinanzeigen`

| Feld | Typ | Hinweis |
|---|---|---|
| `status` | `draft` · `published` | |
| `ueberschrift` | Text, Pflicht | z.B. „Gesucht: Kuchen“ |
| `kurzbeschreibung` | Text (≈ 80 Zeichen) | |
| `link_text` | Text | z.B. „melde dich!“ |
| `ziel_email` | E-Mail | Ziel des Links (`mailto:` mit Betreff „Kleinanzeige: …“) |
| `sort` | Zahl | |

**Maximal 4** veröffentlichte Anzeigen: im Vereinsheim („Neue Anzeige“ ist bei 4 gesperrt)
und als Absicherung per Directus-Flow (Filter-Hook auf create/update → Fehler, wenn schon 4
`published` existieren).

> Code-Anpassung bei der Umstellung: `shared/types/kleinanzeige.ts` bekommt diese Felder
> (statt `art`, `titel`, `text`, `link`).

### `leserbriefe`
`status` (`published` · `hidden`, Standard `published` – erscheint sofort), `name`, `text`
(≤ 600 Zeichen), optional `artikel` (M2O, „zu welchem Beitrag“). Bot-Schutz über Turnstile.

### Vereinsheim: Dorfanzeiger (ein Tab mit drei Reitern)
1. **Artikel** – Liste je Ausgabe (sortierbar), Bearbeiten/Duplizieren/Löschen, Ressort
   zuweisen, Markdown-Editor mit Bild-Upload und Vorschau im Zeitungslook.
2. **Kleinanzeigen** – vier Kärtchen, bearbeiten/löschen/neu (max. 4).
3. **Leserbriefe** – neueste zuerst, „Ausblenden“ / „Löschen“ (wie DPAT-Freundebuch).

Ausgaben verwalten als kleiner Bereich im Reiter „Artikel“.

---

## Über uns, Startseite, Mitmachen

### `stimmen`
`status`, `name`, `zitat` (≤ 160 Zeichen), `bild` (Datei, quadratisch), `bild_alt`, `sort`.

### `faq`
`status`, `frage`, `antwort` (Markdown), `sort`.

### `ideen` (Ideenwand)
`status` (`published` · `hidden`), `name`, `text` (≤ 280 Zeichen). Sofort sichtbar, moderierbar.

### `vorschlaege`
`status` (`neu` · `in_planung` · `umgesetzt` · `abgelehnt`), `name`, `email`, `idee`,
`dorffest` (Boolean), `selbst_mitmachen` (Boolean), `notiz` (intern).

### `plenum_erinnerungen`
`name`, `email`, `wie` (`jedes` · `naechstes`), `bestaetigt` (Boolean, Double-Opt-in),
`abgemeldet_am`. Alternativ direkt als Brevo-Liste „Plenum“ – dann entfällt die Collection.

---

## Mitglieder & Finanzen (Vorstand)

### `mitgliedsantraege`

| Feld | Typ | Hinweis |
|---|---|---|
| `status` | `eingereicht` · `angenommen` · `abgelehnt` | Standard `eingereicht` |
| `art` | `foerder` · `regulaer` | in der Satzung: fördernd / stimmberechtigt |
| `beitrag_stufe` | `foerder_3` · `foerder_5` · `foerder_10` · `standard` · `ermaessigt` | |
| `beitrag_jahr` | Zahl (€) | bei `standard` ggf. mehr als 24 |
| `vorname`, `nachname`, `strasse`, `plz`, `ort`, `email`, `telefon` | Text | |
| `plenum_besucht` | Boolean | nur `regulaer` (Selbstauskunft) |
| `nachricht` | Text | |
| `satzung_anerkannt_am` | Datum+Zeit | Zeitpunkt der Bestätigung (Textform-Nachweis) |
| `entschieden_am`, `entschieden_von` | Datum / M2O → Users | |
| `mitglied` | M2O → `mitglieder` | gesetzt bei Annahme |

### `mitglieder`
`status` (`aktiv` · `ausgetreten` · `gestrichen`), `art` (`foerder` · `stimmberechtigt`),
Stammdaten wie oben, `mitglied_seit`, `austritt_zum`, `beitrag_jahr`,
`beitrag_bezahlt_bis` (Datum), `notiz`, optional `user` (M2O → Directus-User für Vereinsheim-Zugang).

### `auslagen`

| Feld | Typ | Hinweis |
|---|---|---|
| `status` | `eingereicht` · `genehmigt` · `ausgezahlt` · `abgelehnt` | |
| `titel` | Text | wofür |
| `betrag` | Dezimal (€) | |
| `datum` | Datum | Datum der Ausgabe |
| `termin` | M2O → `termine`, optional | Zuordnung zu einer Veranstaltung |
| `beleg` | Datei(en) | Foto/PDF des Kassenbons |
| `kontoinhaber_in`, `iban` | Text | für die Erstattung |
| `notiz` | Text | |
| `user_created` | Systemfeld | Mitglieder sehen nur ihre eigenen |

### `verein` (Singleton)
`kontakt_email`, `kontoinhaber`, `iban`, `infochannel_url`, `naechstes_dorffest` (Datum).
Ersetzt `shared/utils/kontakt.ts` und `app/navigation.ts` (`links.infochannel`).

### Vereinsheim: Übersicht
Startseite des Vereinsheims als gemütliches „Schwarzes Brett“ im Look der Seite: Kacheln für
**Termine** (nächster Termin + neue Anmeldungen), **Dorfanzeiger** (Entwürfe, neue Leserbriefe),
**Mitmachen** (neue Vorschläge, Ideenwand), **Über uns** (Stimmen), **Finanzen**
(„Auslage einreichen“, offene Auslagen) und – nur für den Vorstand – **Mitglieder**
(offene Anträge).

---

## Mitgliedsanträge – Ablauf

1. Antrag auf `/mitglied-werden` → `mitgliedsantraege` mit Status `eingereicht`
   (Satzung § 4: Antrag in Textform, auch online; Satzung gilt mit dem Antrag als anerkannt).
2. Automatisch: Eingangsbestätigung an Antragsteller*in (Brevo) mit Beitrag, IBAN und
   Verwendungszweck; Hinweis-Mail an den Vorstand.
3. Vorstand entscheidet im Vereinsheim (Reiter „Mitglieder“ → „Anträge“): **Annehmen** legt
   einen Datensatz in `mitglieder` an und schickt eine Willkommens-Mail; **Ablehnen** braucht
   keine Begründung (Satzung). Bei `regulaer` prüft der Vorstand die Plenums-Angabe.
4. Nach der Entscheidung bleibt der Antrag als Nachweis gespeichert; abgelehnte Anträge nach
   6 Monaten löschen (Flow).
5. Zugang zum Vereinsheim / Orga-Gruppe: Vorstand legt bei Bedarf einen Directus-User an und
   verknüpft ihn mit dem Mitglied.

Sichtbar nur für die Policy `Vorstand`. Der Server-Token darf nur **anlegen**, nicht lesen.

---

## Umgebungsvariablen (Netlify)

| Variable | Wofür |
|---|---|
| `NUXT_DIRECTUS_URL` | z.B. `https://cms.königsdorf-rückt-zusammen.de` (Punycode-Domain) |
| `NUXT_DIRECTUS_TOKEN` | statischer Token des Server-Users |
| `NUXT_BREVO_API_KEY` | Mails (Anmeldebestätigung, Rundmails, Anträge) |
| `NUXT_TURNSTILE_SECRET_KEY` / `NUXT_PUBLIC_TURNSTILE_SITE_KEY` | Bot-Schutz für Formulare |
| `NUXT_SESSION_SECRET` | Vereinsheim-Session (wie DPAT) |

## Startinhalte

`scripts/directus-seed/inhalte.json` enthält alle Inhalte, die die Website heute als
Platzhalter zeigt – schon im Schema oben (Ressorts, Ausgaben, Termine, Artikel inkl.
Porträt-Feldern, Kleinanzeigen, FAQ, Stimmen, Singleton `verein`).

- **Dateien:** Felder der Form `{"datei": "public/fotos/…"}` beim Import aus dem Repo hochladen
  und durch die Datei-ID ersetzen; Bilder im Markdown (`/fotos/…`) ebenso, dort die URL ersetzen.
- **Relationen:** `ressort` = Slug, `ausgabe` = Nummer, beim Import in IDs auflösen.
- **Entwürfe:** `status: draft` = unbestätigt (FAQ-Entwürfe, fehlende Zitate, Adventscafé).
- **Nicht enthalten:** Beispiel-Leserbriefe und Beispiel-Ideen.
- Neu erzeugen (Dev-Server muss laufen): Inhalte aus `/api/*` exportieren und umformen – siehe
  Commit-Historie; einfacher ist es, die Datei direkt anzupassen.

## Umstellung der Website (Reihenfolge)

1. Collections + Policies anlegen (`scripts/directus-setup.mjs`, nach DPAT-Muster).
2. Startinhalte aus `scripts/directus-seed/inhalte.json` importieren (siehe oben).
3. `server/utils/*.ts` von `server/data` auf Directus umstellen – Routen, Composables und
   Seiten bleiben unverändert (außer den beiden markierten Code-Anpassungen).
4. POST-Routen speichern statt loggen, Turnstile + Brevo anbinden.
5. Vereinsheim bauen.
