# Directus – was die Website braucht

Bauplan für das Directus der Königsdorf-Seite und das **Vereinsheim** (Admin-Bereich unter
`/vereinsheim`). Vorbild ist DPAT (`~/Documents/Projects/WirSindRaus/dont-post-about-this`,
dort `DIRECTUS.md`, `scripts/directus-setup.mjs`, `server/utils/adminSession.ts`).

Stand: 18.10.2026. **Directus ist eingerichtet und die Website angebunden** (Collections, Rechte,
Rollen, Flows, Startinhalte – siehe „Einrichtung“ unten). Lesen und Formulare laufen über
`server/utils/*` mit dem Server-Token. Die Typen in `shared/types/*.ts` entsprechen den Collections
unten. Das Vereinsheim unter `/vereinsheim` nutzt dieselben Collections mit den persönlichen Konten.

Server: `https://api.xn--knigsdorf-rckt-zusammen-7kc4n.de` (= `api.königsdorf-rückt-zusammen.de`,
in Konfigurationen immer Punycode), Directus 12.5.0, Lizenz: Open Innovation Grant.

## Grundsätze

- **Directus 12** (Policies statt Rollen), self-hosted auf Hetzner – Einrichtung des Servers:
  `hetzner/README.md`.
- **Lizenz-Seats:** Ohne Lizenz (Core-Tier) zählen nur Nutzer*innen mit *App Access*/*Admin Access*
  (Directus-Studio), nach heutigem Stand max. 3. Deshalb haben `Mitglied` und `Vorstand`
  **kein App Access** – sie arbeiten nur im Vereinsheim (Login über die API). Studio nur für
  Admins. Flows sparsam. Der Open Innovation Grant ist eingetragen (`LICENSE_KEY` in der
  Server-`.env`) – eigene Filter in Rechten brauchen eine Lizenz.
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
| `gastbeitrag_einladungen` | private Links für Gastbeiträge | read, update (`status`) | alles | alles |
| `gastbeitraege` | eingereichte Gastbeiträge (warten aufs Okay) | create | read, update | alles |
| `stimmen` | „Stimmen aus dem Verein“ (Über uns) | read (published) | alles | alles |
| `faq` | Fragen auf der Startseite | read (published) | alles | alles |
| `ideen` | Ideenwand „Was fehlt dir in Königsdorf?“ | create, read (published) | read, update, delete | alles |
| `vorschlaege` | eingereichte Ideen/Angebote (Mitmachen) | create | read, update | alles |
| `plenum_erinnerungen` | Erinnerungen ans Plenum | create | read, delete | alles |
| `mitgliedsantraege` | Anträge von `/mitglied-werden` | create | – | alles |
| `mitglieder` | Mitgliederliste | – | – | alles |
| `auslagen` (+ `auslagen_belege`) | Finanzen: Auslagen einreichen | – | create, read/update **eigene** | alles |
| `verein` (Singleton) | Kontakt, Konto, Infochannel-Link | read | read | alles |

Dateien (`directus_files`): Ordner `termine`, `artikel`, `gastbeitraege`, `stimmen`, `belege` (Belege nur
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

### Gastbeiträge

Externe schreiben über einen **privaten Link** `/gastbeitrag/:schluessel` (ohne Navigation, nur
„zur Startseite“, `noindex`, `no-referrer`). Ein Mitglied erzeugt den Link im Vereinsheim und
gibt ihn privat weiter.

**`gastbeitrag_einladungen`**

| Feld | Typ | Hinweis |
|---|---|---|
| `schluessel` | Text, eindeutig | zufällig (≥ 24 Zeichen, `crypto.randomBytes(18).toString('base64url')`), vom Vereinsheim erzeugt |
| `name` | Text | für wen („Hallo Marta!“) |
| `ressort` | M2O → `ressorts`, optional | Vorauswahl |
| `gueltig_bis` | Datum, optional | leer = unbegrenzt |
| `mehrfach` | Boolean | mehrere Beiträge über denselben Link (z.B. Kita-Gruppe) |
| `status` | `offen` · `eingereicht` · `widerrufen` | nach dem ersten Beitrag `eingereicht` (außer `mehrfach`) |
| `notiz` | Text, optional | intern: worum es gehen soll |

**`gastbeitraege`**

| Feld | Typ | Hinweis |
|---|---|---|
| `status` | `eingereicht` · `angenommen` · `abgelehnt` | |
| `einladung` | M2O → `gastbeitrag_einladungen` | |
| `titel`, `teaser`, `inhalt` | Text / Text / Markdown | Leerzeile = Absatz |
| `ressort` | M2O → `ressorts` | |
| `bild`, `bildunterschrift`, `foto_von` | Datei (Ordner `gastbeitraege`) / Text / Text | Foto kommt verkleinert (≤ 2000 px, JPEG, ≤ 4 MB) |
| `autor_in` | Text | Name unter dem Beitrag |
| `email` | E-Mail | nur für Rückfragen, nie öffentlich |
| `rechte_bestaetigt` | Boolean | Pflicht |
| `geprueft_von` | M2O → `directus_users` | wer angenommen/abgelehnt hat |
| `artikel` | M2O → `artikel` | nach dem Annehmen |

**Ablauf:** Einreichung → `gastbeitraege` (`eingereicht`) + Hinweis-Mail an den Verein →
im Vereinsheim liest **ein Mitglied** und klickt **Annehmen** (legt einen `artikel`-Entwurf mit
Text, Bild und `autor_in` an, verknüpft ihn, `geprueft_von` = Mitglied) oder **Ablehnen**
(optional kurze Mail). Der Artikel-Entwurf wird wie jeder Artikel einer Ausgabe zugeordnet und
veröffentlicht; dann geht eine „Dein Beitrag ist erschienen“-Mail an `email`. Abgelehnte
Gastbeiträge nach 6 Monaten löschen (Flow).

### Vereinsheim: Dorfanzeiger (ein Tab mit vier Reitern)
1. **Artikel** – Liste je Ausgabe (sortierbar), Bearbeiten/Duplizieren/Löschen, Ressort
   zuweisen, Markdown-Editor mit Bild-Upload und Vorschau im Zeitungslook.
2. **Kleinanzeigen** – vier Kärtchen, bearbeiten/löschen/neu (max. 4).
3. **Leserbriefe** – neueste zuerst, „Ausblenden“ / „Löschen“ (wie DPAT-Freundebuch).
4. **Gastbeiträge** – oben „Link erstellen“ (Name, Rubrik, gültig bis → Link kopieren) und die
   Liste der Links (widerrufen); darunter eingereichte Beiträge mit Vorschau im Zeitungslook,
   **Annehmen** / **Ablehnen**.

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
| `belege` | Dateien (M2M über `auslagen_belege`, Ordner `belege`) | Foto/PDF des Kassenbons, mehrere möglich |
| `kontoinhaber_in`, `iban` | Text | für die Erstattung |
| `notiz` | Text | |
| `user_created` | Systemfeld | Mitglieder sehen nur ihre eigenen |

### `verein` (Singleton)
`kontakt_email`, `kontoinhaber`, `iban`, `infochannel_url`, `naechstes_dorffest` (Datum).
Ersetzt `shared/utils/kontakt.ts` und `app/navigation.ts` (`links.infochannel`).

### Vereinsheim: Übersicht
Startseite des Vereinsheims als gemütliches „Schwarzes Brett“ im Look der Seite: Kacheln für
**Termine** (nächster Termin + neue Anmeldungen), **Dorfanzeiger** (Entwürfe, neue Leserbriefe, eingereichte Gastbeiträge),
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
| `NUXT_DIRECTUS_URL` | z.B. `https://api.königsdorf-rückt-zusammen.de` (Punycode-Domain) |
| `NUXT_DIRECTUS_TOKEN` | statischer Token des Server-Users |
| `NUXT_BREVO_API_KEY` | Mails (Anmeldebestätigung, Rundmails, Anträge) |
| `NUXT_BREVO_NEWSLETTER_LISTE` | ID der Newsletter-Liste in Brevo |
| `NUXT_TURNSTILE_SECRET_KEY` / `NUXT_PUBLIC_TURNSTILE_SITE_KEY` | Bot-Schutz für Formulare |
| `NUXT_LINK_SECRET` | Schlüssel für signierte Bestätigungslinks (Newsletter, Plenum-Erinnerung; bei DPAT `NUXT_NEWSLETTER_SECRET`). Kommt mit dem Double-Opt-in. Das Vereinsheim braucht keinen eigenen Session-Schlüssel (Directus-Tokens im httpOnly-Cookie, wie DPAT). |

## Einrichtung (Skripte)

Beide Skripte legen nur an, was fehlt, ändern und löschen nichts und sind beliebig oft
ausführbar. Admin-Token als `DIRECTUS_ADMIN_TOKEN` setzen (nie committen), Node 22+.

```bash
node scripts/directus-setup.mjs --dry-run   # Probelauf
node scripts/directus-setup.mjs             # Collections, Felder, Relationen, Ordner, Policies, Rechte
node scripts/directus-setup.mjs --list      # Policies, Zuordnungen, Rechte je Policy
node scripts/directus-seed.mjs --dry-run    # Startinhalte (Probelauf)
node scripts/directus-seed.mjs              # Startinhalte
```

`directus-setup.mjs` ist der Bauplan in Code: Neue Felder/Rechte dort ergänzen und erneut
ausführen. An vorhandene Rechte werden neue Felder angehängt; sonstige Abweichungen meldet das
Skript nur. Stand 18.10.2026: 21 Collections, 5 Ordner, 3 Policies, 2 Rollen, 2 Flows, alles angelegt.

### Was angelegt ist

- **Systemfelder** an jeder Collection: `date_created`, `date_updated`, `user_created`,
  `user_updated`. IDs sind Ganzzahlen (Dateien/User: UUID). `verein` ist ein Singleton.
- **Löschen:** Termin löschen löscht seine `anmeldungen`, `beitraege` und `termin_rundmails`
  mit. Ein Ressort mit Artikeln lässt sich nicht löschen. Sonst wird die Verknüpfung geleert.
- `termine.anmeldungen` ist das O2M-Gegenstück zu `anmeldungen.termin`.
- `status`-Felder legen wir selbst an (Directus 12 schlägt für neue Collections sonst
  `archived` vor). `termine` und `artikel` archivieren über `status = archived`.
- **Ordner:** `termine`, `artikel` (auch Ausgaben), `gastbeitraege`, `stimmen`, `belege`. Die
  Datei-Felder schlagen ihren Ordner vor.
- **Dezimalzahlen** (`betrag`, `beitrag_jahr`) liefert Directus als String.

### Rechte im Detail

- **Öffentlich:** keine Rechte (`/items/…`, `/assets/…`, `/files` → 403).
- **`Server`** (User `website-server`):
  - liest `published` bei `termine`, `artikel`, `kleinanzeigen`, `stimmen`, `faq`, `leserbriefe`,
    `ideen`; alles bei `ressorts`, `ausgaben`, `verein`
  - `anmeldungen`: liest nur `termin`, `personen`, `status` (Plätze zählen); `personen` muss 1–10 sein
  - `gastbeitrag_einladungen`: liest ohne `notiz`; `status` nur von `offen` auf `eingereicht`
  - `gastbeitraege`: Anlegen nur mit `rechte_bestaetigt = true`
  - legt an: `anmeldungen`, `beitraege`, `leserbriefe`, `gastbeitraege`, `ideen`, `vorschlaege`,
    `plenum_erinnerungen`, `mitgliedsantraege` (nur die Formularfelder, Status = Standard)
  - **Dateien:** liest nur Ordner `termine`, `artikel`, `stimmen`; lädt nur in `gastbeitraege`
    hoch. Beim Annehmen eines Gastbeitrags verschiebt das Vereinsheim das Foto nach `artikel`.
  - `directus_users`: nur `email` + `benutzername` aktiver User mit Benutzernamen (Login, s.u.)
  - `plenum_erinnerungen`: liest nur `id` (für den signierten Link), ändert nur `bestaetigt` /
    `abgemeldet_am` (Double-Opt-in)
- **`Mitglied`:** wie in der Tabelle. Auslagen: eigene lesen, bearbeiten nur solange
  `eingereicht`. Dateien: alles außer fremden Belegen lesen/bearbeiten, hochladen (nicht
  löschen). Ordner lesen. User: `id`, Name, `email`, `avatar`, `benutzername` aller lesen; eigenes
  Konto (Name, E-Mail, Passwort, Avatar) bearbeiten.
- **`Vorstand`:** alles auf allen Collections und Dateien, User lesen. Vorstandsleute bekommen
  **beide** Policies (`Mitglied` + `Vorstand`). User anlegen/Policies vergeben bleibt beim Admin
  im Studio (sonst könnte man sich selbst Admin-Rechte geben).

### Bilder auf der Website

Ohne öffentliche Rechte kann der Browser `/assets/<id>` nicht direkt laden. Die Website braucht
deshalb eine Bild-Route (z.B. `server/routes/bilder/[id].ts`), die mit dem Server-Token von
Directus holt (mit Transformationen wie `?width=…&format=webp`) und mit Cache-Headern ausliefert.
Bilder im Markdown (`inhalt`) zeigen auf `https://api.xn--knigsdorf-rckt-zusammen-7kc4n.de/assets/<id>`
– `server/utils/markdown.ts` schreibt diese Adressen beim Umstellen auf die Bild-Route um.

### Vereinsheim-Zugang (User anlegen)

1. Studio → **User Directory** → **+**: Vorname, Nachname, E-Mail, **Benutzername**,
   Startpasswort (privat weitergeben; keine Einladungs-Mail – die führt ins Studio).
2. **Role** `Mitglied` wählen, Vorstandsleute bekommen `Vorstand` (enthält beide Policies – jeder
   User hat nur eine Rolle). Ohne App Access → kein Lizenz-Seat.
3. Optional mit `mitglieder.user` verknüpfen.

**Login mit Benutzernamen:** Directus meldet nur per E-Mail an. Das Feld
`directus_users.benutzername` (eindeutig, 3–30 Zeichen a–z 0–9 . _ -) erlaubt im Vereinsheim
trotzdem den Benutzernamen: Die Login-Route (`server/api/vereinsheim/login.post.ts`) nimmt
Benutzername **oder** E-Mail; enthält die Eingabe kein `@`, sucht sie mit dem Server-Token die
E-Mail zum Benutzernamen und meldet dann mit E-Mail + Passwort bei `/auth/login` an. Gleiche
Fehlermeldung für „unbekannt“ und „falsches Passwort“; Rate-Limit wie bei den Formularen.
Jede*r braucht trotzdem eine E-Mail (Directus-Pflicht, Passwort vergessen).

### Rollen

- `Mitglied` → Policy `Mitglied`
- `Vorstand` → Policies `Mitglied` + `Vorstand`

### Flows

- **Kleinanzeigen: max. 4 veröffentlicht** – Filter-Hook auf `items.create`/`items.update`: liest die
  veröffentlichten Anzeigen und bricht ab, wenn es mit dieser mehr als 4 wären (Meldung „Es sind
  schon 4 Kleinanzeigen veröffentlicht …“). Getestet am 18.10.2026.
- **Aufräumen: Abgelehntes nach 6 Monaten löschen** – täglich 3 Uhr: `gastbeitraege` und
  `mitgliedsantraege` mit Status `abgelehnt`, letzte Änderung bzw. Entscheidung älter als 6 Monate.

### Website-Anbindung

- **Lesen:** `server/utils/<typ>.ts` über `directusServer()` (`server/utils/directus.ts`), filtert
  selbst auf `published`. Fehler von Directus → 502 mit freundlicher Meldung, Details im Log.
- **Formulare:** Rate-Limit → Honeypot → Validierung → Turnstile → Directus → Mail.
  - Anmeldung: `anmeldungen` + Bestätigungsmail · Mitbringen: `beitraege`
  - Leserbrief / Idee: sofort sichtbar · Vorschlag: + Hinweis an den Verein
  - Mitgliedsantrag: + Eingangsbestätigung (Beitrag, IBAN, Verwendungszweck) + Hinweis an den Verein
  - Gastbeitrag: Foto → Ordner `gastbeitraege`, Eintrag, Link verbraucht (außer `mehrfach`), Hinweis
  - Plenum-Erinnerung: Double-Opt-in mit signierten Links (`NUXT_LINK_SECRET`),
    `/api/plenum-erinnerung/bestaetigen|abmelden` → zurück auf `/mitmachen?plenum=…`
- **Ohne Schlüssel** (lokal, Deploy-Preview): Mails nur im Log (`NUXT_BREVO_API_KEY`), keine
  Bot-Prüfung (`NUXT_TURNSTILE_SECRET_KEY` / `NUXT_PUBLIC_TURNSTILE_SITE_KEY`), keine Plenum-Links.
- **Bilder:** `<NuxtImg :src="datei-id" :provider="bildAnbieter(src)">` → `/bilder/:id?width=…`.
- **Achtung:** Directus prüft „Pflichtfeld“ (`required`) bei API-Anlagen nicht zuverlässig – die
  Website validiert selbst, das Vereinsheim muss es auch tun.

### Vereinsheim (technisch)

- Nur im Browser (`routeRules`: `ssr: false`, `X-Robots-Tag: noindex`). Route-Middleware `vereinsheim`
  schickt ohne Anmeldung zur Tür (`/vereinsheim/tuer`); `/vereinsheim/mitglieder` nur mit `vorstand`.
- **Login** `POST /api/vereinsheim/login`: Benutzername → E-Mail (Server-Token), dann `/auth/login`.
  Access-/Refresh-Token in httpOnly-Cookies `vh_at`/`vh_rt` (`server/utils/vereinsheim.ts`, Muster DPAT).
  Server-Middleware erneuert abgelaufene Tokens und lehnt Schreibzugriffe fremder Herkunft ab.
- **Daten:** `/api/vereinsheim/d/<pfad>` reicht an Directus durch – mit dem Token der Person, nur
  für die Collections des Vereins, `files`, `folders`, `users` (Positivliste). Rechte = Policies.
  Im Browser: `vh.liste/eins/anlegen/aendern/loeschen/hochladen` (`app/composables/useVereinsheim.ts`).
- **Sonderrouten** (mehrere Schritte oder Mails): Rundmail, Gastbeitrag annehmen/ablehnen,
  „Dein Beitrag ist erschienen“ (`artikel/:id/erschienen`, einmalig über `gastbeitraege.erschienen_mail_am`),
  Plenum-Erinnerung verschicken (`plenum/erinnern`: an alle Bestätigten, „nur das nächste“ wird danach
  abgemeldet, `zuletzt_erinnert_am`), Mitgliedsantrag annehmen/ablehnen, Passwort, Konto,
  Markdown-Vorschau, Bilder
  (`/api/vereinsheim/bild/:id` – zeigt auch Gastbeitrags-Fotos und eigene Belege).
- **Vorstand?** = darf `mitglieder` lesen (Policy `Vorstand`).
- Lokal testen: `vh_at`-Cookie auf einen statischen Token setzen.

- **Vereinsdaten** (`verein`): Website liest sie über `/api/verein` (`useVerein()`, 5 Min. Cache),
  Mails über `ladeVerein()`; Ersatzwerte in `shared/utils/kontakt.ts`. Bearbeiten: Vereinsheim →
  Mitglieder → Vereinsdaten (Vorstand).
- **Newsletter** (Double-Opt-in): `POST /api/newsletter` → signierter Link →
  `/api/newsletter/bestaetigen` → Brevo-Liste `NUXT_BREVO_NEWSLETTER_LISTE`. Ohne Key/Liste nur Log.

## Startinhalte

**Importiert am 18.10.2026** mit `scripts/directus-seed.mjs` (12 Bilder, 6 Ressorts, 4 Ausgaben,
6 Termine, 7 Artikel, 4 Kleinanzeigen, 4 FAQ, 4 Stimmen, `verein`).

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

1. ✅ Collections + Policies anlegen (`scripts/directus-setup.mjs`, nach DPAT-Muster).
2. ✅ Startinhalte aus `scripts/directus-seed/inhalte.json` importieren (siehe oben).
3. ✅ `server/utils/*.ts` von `server/data` auf Directus umstellen – Routen, Composables und
   Seiten bleiben unverändert (außer den beiden markierten Code-Anpassungen).
4. ✅ POST-Routen speichern statt loggen, Turnstile + Brevo anbinden.
5. ✅ Vereinsheim bauen.
