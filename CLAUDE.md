# Königsdorf rückt zusammen – Website (Relaunch)

Webseite des Vereins **„Königsdorf rückt zusammen e.V."**: Nachbar*innen, die Feste,
Treffpunkte und Hilfe im Dorf organisieren.

- **Ton:** herzlich, nahbar, ein bisschen verschmitzt; demokratisch und klar gegen
  Rassismus und Ausgrenzung.
- **Sprache:** nur Deutsch, gegendert mit Sternchen („Nachbar*innen"), wie im Design.
- **Bei Unklarheiten fragen, nicht raten.**

## Branches & Deployment

- Gearbeitet wird auf **`relaunch`**. **`main` bleibt unberührt**: Dort läuft die alte
  Vue-CLI-Seite weiter auf GitHub Pages (`gh-pages`), bis umgestellt wird.
- Nie auf `main` pushen.
- Netlify baut `relaunch` als Deploy-Preview (`netlify.toml`).
- Assets der alten Seite liegen in der Git-History von `main`
  (`git show main:src/assets/…`), weitere Rohdateien unter `../Assets/`.

## Architektur

- **Nuxt 4** (`app/`-Verzeichnis), **SSR auf Netlify** (`nitro.preset: 'netlify'`).
- Module: `@nuxt/fonts` (Schriften lokal), `@nuxt/image` (Fotos als WebP), `@nuxt/eslint`.
- **Directus** (self-hosted, siehe `DIRECTUS.md`) für alles Dynamische – angebunden über `server/utils/*`.
- **Kein** Nuxt Content, **kein** Nuxt Studio, **kein** i18n.
- **Brevo** (Mails, `server/utils/mail.ts`) und **Cloudflare Turnstile** (Bot-Schutz, `<BasisTurnstile>`);
  ohne Schlüssel nur Log bzw. keine Prüfung.
- `.env` ist gitignored (`.env.example` zeigt die Variablen). Tokens nur serverseitig
  über `useRuntimeConfig()`, nie im Frontend.
- npm braucht `legacy-peer-deps=true` (steht in `.npmrc`), sonst bricht `npm install`
  mit dem Arborist-Fehler „edgesOut" ab.

### Ordner

```
app/
  assets/css/tokens.css   Design-Tokens (Farben, Schriften, Abstände, Radien, Schatten)
  assets/css/base.css     Reset, Fokus, reduced motion
  components/basis/       Basis-Komponenten (<BasisKnopf>, <BasisNotizzettel>, …)
  components/layout/      Kopf + Fuß
  components/start/       Sektionen der Startseite (<StartHero>, …); je Seite ein Ordner
  composables/            useTermine(), useDorfanzeiger(), …
  layouts/default.vue     Nav + Footer
  pages/                  Seiten
  texte.ts                längere Texte, die im Code gepflegt werden
shared/types/             Interfaces = spätere Directus-Collections
server/api/               Server-Routen (GET + POST)
server/routes/bilder/     Bild-Route: Directus-Dateien über den Server-Token
server/utils/             Directus-Zugriff (directus.ts), Lesen je Typ, Formular-Helfer, Mail
public/illustrationen/    Illustrationen (SVG)
public/fotos/             Fotos (WebP, über <NuxtImg>)
scripts/                  directus-setup.mjs (Schema/Rechte), directus-seed.mjs (Startinhalte)
```

### Inhalte: wo was liegt

**Faustregel:** Ändert es sich oft oder befüllen es andere? → Directus. Sonst → Code.

- **Im Code:** Nav, Footer, Buttons, Startseiten-Texte, „Was wir tun", Über uns,
  Leitbild, alles Strukturelle. Längere Texte gesammelt in **`app/texte.ts`** (nicht
  über Komponenten verstreut). `texte.ts` wird nicht auto-importiert:
  `import { texte } from '~/texte'`.
- **Später aus Directus (jetzt Platzhalter):** `termine`, `dorfanzeiger` (Artikel),
  `kleinanzeigen` (gesucht/biete/gefunden), `faq`, `stimmen` (Zitate „Stimmen aus dem
  Verein"), `ausgaben` (Dorfanzeiger-Ausgaben), `formulare` + `einreichungen`,
  `abstimmungen` + `optionen` + `stimmen`, `newsletter`, evtl. `mitgliedsantraege`.

### Datenschicht (Directus nur an einer Stelle)

1. **Typen:** pro Datentyp ein Interface in `shared/types/`, benannt und aufgebaut wie die
   Directus-Collection (Feldnamen `snake_case`, `status`, `slug`, `date_created` …).
2. **Server-Routen** unter `server/api/…` sind dünn; Lesen + Mapping in `server/utils/<typ>.ts`
   über `directusServer()` (Server-Token, selbst auf `published` filtern).
3. **Composables** (`useTermine()`, `useDorfanzeiger()`, `useKleinanzeigen()`,
   `useFaq()` …) rufen nur die Server-Routen auf (`useFetch('/api/…')`).
4. **Seiten kennen nur Composables**, nie Server-Daten oder Directus direkt.
5. **Formulare** haben eine **POST-Route**: Rate-Limit → Honeypot → Validierung → Turnstile →
   Directus → Mail (Details in `DIRECTUS.md` → „Website-Anbindung“).
6. **Bilder** aus Directus sind Datei-IDs: `<NuxtImg :src="id" :provider="bildAnbieter(id)">`
   → `/bilder/:id`. Lokale Bilder (`/fotos/…`) wie bisher.
7. **Inhalte** pflegt der Verein in Directus (bald im Vereinsheim); Startinhalte kamen aus
   `scripts/directus-seed/inhalte.json`.

## Vorbild: DPAT („Don't Post About This")

Gleiche Architektur, fertig an Directus angebunden. Lokal unter
`/Users/brunobalscheit/Documents/Projects/WirSindRaus/dont-post-about-this`.
Dort **Muster** abschauen, **nicht das Design** (und nicht Nuxt Content/i18n, das nutzt
DPAT, wir nicht). **Am DPAT-Repo nichts ändern, nur lesen.**

- `server/api/*` + `server/utils/*`: Server-Routen, Directus-Zugriff, Fehlerbehandlung.
  Muster: Lesen + Mapping in `server/utils/<typ>.ts`, Route ist dünn;
  `directusServer()` mit Server-Token aus `useRuntimeConfig()`; selbst auf
  `status = published` filtern.
- POST-Routen (z.B. `newsletter.post.ts`): Rate-Limit → Honeypot → Turnstile →
  Validierung; Fehler als `createError({ statusCode, statusMessage, data: { code } })`;
  Newsletter antwortet immer `{ ok: true }` (keine Auskunft, wer eingetragen ist).
- `server/api/admin/*` + `server/utils/adminSession.ts`: Login mit httpOnly-Cookies
- `app/pages/admin/*`: Admin-Oberfläche (bei uns `/vereinsheim`)
- `scripts/directus-setup.mjs` + `DIRECTUS.md`: Collections/Rechte anlegen
- Newsletter mit Bestätigungslink (Double-Opt-in über Brevo), öffentliche Einreichung
  mit Status `eingereicht`

## Seiten

Nav: Startseite · Termine · Neuigkeiten · Über uns · [Button „Mitmachen"]

| Route | Quelle | Inhalt |
|---|---|---|
| `/` | Design S. 1 | Hero („Königsdorf rückt zusammen", Buttons Infochannel + „Was wir tun") · „Was wir tun" (4 nummerierte Zeilen mit Notizzetteln) · „Was kommt" (lila, Termin-Zettel, Text, Newsletter-Box „Neue Termine ins Postfach") · „Was bisher geschah" (Dorfanzeiger-Teaser, 3 Artikel) · „Nimm dir einen!" (Abreißzettel „Gesucht: Du!") · „Fragen?" (FAQ-Akkordeon + Notizzettel) · „Bis bald im Dorf!" (Newsletter) · Footer |
| `/ueber-uns` | Design S. 2 | Hero „Königsdorf gemeinsam gestalten", Bildreihe, Text, Leitbild-Block, „Stimmen aus dem Verein" (Polaroid + Zitat + Avatar-Auswahl), „Deine Ideen. Neue Begegnungen.", „Hier fehlt noch dein Name" (Mitgliedsausweis, Name live tippen, „Antrag starten") |
| `/dorfanzeiger` | Design S. 3 | „Neuigkeiten": Zeitungslayout auf lila Grund: Masthead, Ressort-Filter (Alle · Feste · Verein · Dorffunk · Rezepte · Feuilleton · Porträts), Titelgeschichte, Terminkalender-Kasten, Seitenspalte, 3er-Reihe, „Fünf Fragen an …", Kleinanzeigen, „Mach mit!"-Box, Leserbriefe zum Anpinnen, Newsletter-Zettel |
| `/dorfanzeiger/[slug]` | `Dorfanzeiger Beitrag.pdf` (von Bruno, 17.10.2026) | Kopfzeile, Titelei, Autor*in/Datum/Lesezeit, Bild, Markdown-Text mit Initialen, Zitatkasten, Aufruf-Kasten, Weitersagen, Mehr aus dieser Ausgabe |
| `/termine/[slug]` | „Plakat“-Aufbau (von Bruno gewählt) | Lila Kopfband (Nav im lila Farbschema): Titel, Datumszettel, Wann/Wo, Anmelden + „In den Kalender“ (`.ics`), Bild als Polaroid (sonst Illustration), runder **Sticker** (Störer) → springt zum **Anmeldezettel** unter der Beschreibung. Anmeldung (`anmeldung_aktiv`) und „Was bringst du mit?“ (`mitbringen_position`: `aus` · `seite_1` = mit auf dem Anmeldezettel · `seite_2` = zweite Seite vor dem Absenden) sind unabhängig; ohne Anmeldung ist der Zettel nur die Mitbring-Liste (`/beitrag`), ohne beides gibt es weder Zettel noch Sticker. `/termine` → `/#was-kommt`. Startseite: nächster Termin als Countdown-Band („in 29 Tagen: …“). |
| `/satzung`, `/impressum`, `/datenschutz` | Texte in `app/inhalte/*.md` | Textseiten über `<BasisTextseite>` (Markdown). Keine Kontaktseite: „Kontakt“ im Fuß ist ein Mail-Link. Datenschutz ist ein Entwurf (Stand Oktober 2026) – bei Brevo/Turnstile/Directus anpassen. |
| `/mitmachen` | von Bruno beschrieben | Intro (offene Gruppe, Plenum + Orga-WhatsApp nur für Mitglieder), 4 Wege, **Plenum** groß mit Erinnerungs-Anmeldung (`/api/plenum-erinnerung`), Dorffest-2027-Aufruf (07.09.2027) mit Ideen-Formular (`/api/vorschlaege`), **Ideenwand** „Was fehlt dir in Königsdorf?“ (`/api/ideen`), Kontakt-Mail |
| `/mitglied-werden` | von Bruno beschrieben | Fördermitglied (Standard; 3/5/10 € im Monat, steuerlich absetzbar) oder reguläres Mitglied (24 €+ / ermäßigt 12 € im Jahr; Voraussetzung: mind. einmal beim Plenum, wird abgefragt). Beiträge zentral in `shared/utils/mitgliedschaft.ts`. POST `/api/mitgliedsantrag`. Name kommt aus dem Ausweis (`?name=`). |
| `/gastbeitrag/[schluessel]` | von Bruno beschrieben | Privater Link für externe Gastbeiträge (Layout `schlicht`: keine Navigation, nur „zur Startseite“; `noindex`, `no-referrer`). Text, Rubrik, optional Foto (im Browser verkleinert) → POST multipart `/api/gastbeitrag/:schluessel`. Landet im Vereinsheim, ein Mitglied nimmt an/lehnt ab (siehe `DIRECTUS.md`). Links erstellt das Vereinsheim (Dorfanzeiger → Gastbeiträge). |
| `/vereinsheim` | von Bruno gewünscht: „gemütliches Vereinsheim“ | Admin-Bereich (nur im Browser, `ssr: false`), Look wie die Website: lila Kopf mit Navigation (Dashboard · Termine · Dorfanzeiger · Kasse · Post · „Diverses“ ▾ mit Ideensammlung, Über uns, Mitglieder), Creme-Grund (Layout `vereinsheim`; `vollbreit` für Dashboard/Dorfanzeiger). Jede Unterseite beginnt mit einem lila Seitenkopf (`<VereinsheimKopf>`, Titel optional mit Hervorhebung). Arbeitsflächen bewusst ruhig: weiße Karten (`.vh-karte`), durchgezogene helle Rahmen, Beschriftungen in Poppins, **Reenie Beanie nur als Deko** (Dashboard-Gruß, Schriftzug „Vereinsheim“), nicht bei Funktionen. `/vereinsheim/tuer` Login (schlichte Karte auf Lila, Benutzername oder E-Mail) · „Tschüss“ meldet ab und führt zur Website · Profil-Knopf (rundes Profilbild bzw. Symbol + Vorname) links neben „Tschüss“ → Mein Profil (Name, Profilbild, Passwort, Tour wiederholen) · **Tour** (`<VereinsheimTour>`, Schritte in `useVereinsheimTour.ts`, Ziele per `data-tour`): auf dem Dashboard vorgeschlagen, bis gemacht oder abgelehnt („Später“ nur für die Sitzung), gemerkt in `directus_users.tour_erledigt_am` · Dashboard nach Brunos Entwurf (Gruß-Spruch, Post für den Vorstand bzw. eigene Kassen-Einreichungen, Icon-Kacheln, „Wir sehen uns im Plenum“) · Termine (Liste nach Monat mit Kalenderblatt, Ort und Anmeldestand; Anmeldungen als Strichliste, CSV, Druck, Rundmail) · Dorfanzeiger im Zeitungslook (Redaktionstisch, Ausgaben, Kleinanzeigen, Leserbriefe, Gastbeitrag-Links + Posteingang; Artikel-Vorschau über `<ZeitungArtikel>`) · Ideensammlung (inkl. Plenum-Erinnerungen) · Über uns · Kasse · Mitglieder (Vorstand) · Post (Kontakt-Postfach lesen + antworten, Vorstand) · Konto. Bearbeiten über `<VereinsheimFormularSeite>` + Feldlisten in `app/utils/vereinsheimFelder.ts`; mit `GRUPPEN_*` zweispaltig (links Text, rechts Einstellungen in Abschnitten, Aktionsleiste klebt unten). Markdown-Felder mit Werkzeugleiste. |
| 404 | – | eigene Fehlerseite im Stil der Seite |

Footer-Links: Über uns · Satzung · Mitglied werden · Vereinsheim · Termine ·
Infochannel · Kontakt · Impressum · Datenschutz.

## Design-System

Das **Figma-PDF (3 Seiten: Startseite, Über uns, Dorfanzeiger) ist der maßgebliche
Zielzustand.** Abnahme Sektion für Sektion gegen das PDF. Im Konflikt gewinnt die Treue
zum Design. Datei: `~/Downloads/RücktZusammen.pdf` (3 Seiten, 1440pt breit; die
gleichnamige Datei auf dem Desktop ist ein älterer, anderer Stand). Daneben liegt
`~/Downloads/RücktZusammen.fig`.

- **Maße aus dem PDF messen, nicht schätzen:** Seite mit `pdftoppm -r 72` rendern
  (1pt = 1 CSS-px), Größen über Pixel-/Tintenmessung bestimmen (Versalhöhe Londrina =
  0.72em, Poppins = 0.70em; Reenie Beanie über die Textbreite kalibrieren). Danach
  Umsetzung bei 1440px screenshotten und Sektion für Sektion daneben legen.
- **Maße sind Referenz, Layout bleibt fluid:** Größen als
  `clamp(Minimum, Designwert/1440·100vw, Designwert)` – bei 1440px exakt das Design,
  darunter proportional kleiner, nie unter ein lesbares Minimum. Inhaltsbreite 1120px.
- Hero = volle Viewport-Höhe (`100svh` minus Kopf). Der gestrichelte Pfeil vom
  „Was wir tun“-Knopf zur Überschrift (`<StartWegweiser>`) wird per JS aus den echten
  Positionen gezeichnet (ResizeObserver) und entfällt auf Mobil.
- Aufbau-Animation Startseite: Nav fährt herein (nur erster Aufruf), Hero-Elemente gestaffelt
  (CSS in `StartHero`), danach zeichnet sich die Linie per JS (Maske), „hier entlang“ und Tanzpaar
  ploppen auf, wenn die Linie sie erreicht. Alles aus bei `prefers-reduced-motion`.
- Scroll-Einblendungen: Direktive `v-einblenden` (Plugin `einblenden.ts`) setzt einmalig `.ist-sichtbar`.
  Startzustand nur mit `:root.js .x` (nicht `:global(html.js)` – das macht Vue zu `html.js` allein!).
- Kontakt-Mail `kontakt@koenigsdorf-rueckt-zusammen.de` (ohne Umlaute, bei IONOS als E-Mail-Weiterleitung auf das Postfach `kontakt@königsdorf-rückt-zusammen.de`; Umlaut-Adressen machen bei Mail Ärger) und Vereinskonto (IBAN) in `shared/utils/kontakt.ts`.
- Logo: `public/logo-mobil.svg` (Schild ohne Pfosten), gerade, nicht gedreht.
- Navigation ohne gestrichelte Linie. Dorfanzeiger-Seiten (Layout `zeitung`) zeigen testweise
  dieselbe Navigation im lila Farbschema (`<LayoutKopf dunkel>`); sie fährt beim Betreten von oben herein.
- Blatt-Animation (`<ZeitungBlatt>`) nur beim Betreten des Dorfanzeigers von außen, nicht
  beim Wechsel zwischen Dorfanzeiger-Seiten (`useZeitungAnimation`, Plugin
  `vorherige-route`). Auf Mobil ist das Blatt nicht gedreht.

- **Tokens** in `app/assets/css/tokens.css`. Neue Werte kommen von Bruno aus Figma,
  **nicht aus dem PDF schätzen.** Stand Figma:
  - Lila `#7A2A7E` · Orange `#E8820C` · Flieder `#8E6FE0` · Creme `#FFFDF7` ·
    Pfirsich `#FCE0C5` · Gelb `#FADF84`. Textfarbe je nach Grund: Schwarz, Weiß,
    Pfirsich, Orange oder Lila.
  - `--farbe-orange-text` (`#A45C08`): dunkleres Orange für **kleinen** Text auf hellem
    Grund, weil Orange auf Creme nur 2.7:1 Kontrast hat.
  - Abstände, Radien, Schatten, Schriftgrößen sind **vorläufig** abgeleitet.
- **Schriften** (lokal per `@nuxt/fonts`, `global: true`, weil sie nur über
  CSS-Variablen genutzt werden): Display **Londrina Solid Black (900)**, Headlines in
  Versalien · Body **Poppins Light (300)**, auch Regular (400), einzelne Wörter fett
  (700) · Handschrift **Reenie Beanie** (Klasse `.handschrift`).
- **Basis-Komponenten** liegen in `app/components/basis/` und heißen im Template
  `<BasisKnopf>`, `<BasisHervorhebung>`, `<BasisNotizzettel>`, `<BasisKlebeband>`,
  `<BasisTerminZettel>`, `<BasisArtikelTeaser>`, `<BasisKleinanzeige>`,
  `<BasisNewsletterBox>`, `<BasisTrennlinie>`, `<BasisPolaroid>`. Kopf/Fuß:
  `app/components/layout/`. Alle Link-Ziele zentral in `app/navigation.ts`.
- **Vorschau** aller Basis-Komponenten: `/komponenten` (noindex). **Vor dem Livegang
  löschen.**
- Datumsformatierung nur über `shared/utils/datum.ts` (immer Europe/Berlin, Netlify
  läuft auf UTC).
- **Wiederkehrende Elemente als Komponenten mit Varianten** (Props statt Kopien):
  Button (lila gefüllt / Outline / klein), Hervorhebungs-Kasten (Flieder hinter Wörtern
  wie „RÜCKT ZUSAMMEN", „DORF!"), Notizzettel (Tape, leicht gedreht), Termin-Zettel,
  Artikel-Teaser, Kleinanzeige, Newsletter-Box, gepunktete Trennlinie, Polaroid.
  Unregelmäßigkeiten (Rotation, Tape-Position, Farbe) **als Props**, nicht
  weguniformieren.
- Basis-Komponenten zuerst, dann Sektionen. Nach jeder Sektion aufräumen (doppelten Code
  zusammenziehen, wo es die Optik nicht kostet).
- **Bilder/Illustrationen:** maßhaltige Platzhalter (richtige Größe + Seitenverhältnis)
  mit **finalen Dateinamen** (z.B. `public/illustrationen/tanzpaar.svg`,
  `public/fotos/dorffest-buffet.webp`). **Keine Bildextraktion aus dem PDF.** Bruno
  exportiert die echten Dateien aus Figma und kopiert sie namensgleich drüber.
  Illustrationen SVG, Fotos WebP über `@nuxt/image` (liegen in `public/`, weil
  `@nuxt/image`/Netlify Image CDN dort lesen).
- **Zwischenstand:** Fotos/Illustrationen stammen von der alten Seite (`main`). Die
  Illustrations-SVGs sind vorerst nur WebP-Bitmaps in einer SVG-Hülle.

### Quality Floor (nicht verhandelbar)

Responsive bis Mobile (PDF zeigt nur Desktop, Mobile sinnvoll ableiten) · sichtbarer
Keyboard-Fokus · `prefers-reduced-motion` · semantisches HTML · Alt-Texte ·
ausreichende Kontraste · SEO-Meta pro Seite (`useSeoMeta`).

## Phasen

Nach jeder Phase: committen, pushen, Bruno kurz zeigen.

1. ✅ **Scaffold:** Nuxt 4, Netlify-Preset, `@nuxt/fonts`, `@nuxt/image`, ESLint,
   Ordnerstruktur, `CLAUDE.md`.
2. ✅ **Tokens + Basis-Komponenten** (nach Figma-Werten) + Layout (Nav, Footer).
3. ✅ **Startseite**, Sektion für Sektion.
4. ✅ **Über uns** (Stimmen-Zitate außer Thomas sind Platzhalter; „Antrag starten“ führt vorerst auf die Platzhalterseite `/mitglied-werden?name=…`).
5. ✅ **Dorfanzeiger**: Übersicht (Layout `zeitung`, Blatt gleitet von unten rechts in einer Kurve herein) und Artikelseite nach `Dorfanzeiger Beitrag.pdf` (Bereich um das Blatt dort veraltet). Artikeltext ist Markdown, wird in `server/utils/markdown.ts` gerendert (Bild allein in Zeile + Titel = Bild mit Unterschrift; `> — Quelle` = Zitatquelle).
6. ✅ **Termine**: Eventseiten mit Anmeldung (`anmeldung_aktiv`, `plaetze`) und Mitbringen (`mitbringen_aktiv`, `mitbringen_text`, `mitbringen_vorschlaege`); POST-Routen prüfen + loggen (Rate-Limit, Honeypot, Validierung in `server/utils/formular.ts`).
7. ✅ **Formulare**: Anmeldung/Mitbringen, Mitgliedsantrag, Plenum-Erinnerung, Ideen, Leserbriefe, Ideenwand (POST-Routen prüfen + loggen). Newsletter-Anmeldung und „Kleinanzeige aufgeben“ entfallen vorerst (Newsletter-Box ist nur Oberfläche).
8. Rechtliche Seiten, 404, SEO, Feinschliff Mobile. (404 ✅, SEO-Grundwerte/Canonical/robots.txt ✅, Mobil-Feinschliff laufend; Impressum/Datenschutz brauchen noch echte Angaben von Bruno.)

9. ✅ **Directus** eingerichtet und angebunden (`DIRECTUS.md`).
10. ✅ **Vereinsheim** (siehe Seiten-Tabelle und `DIRECTUS.md` → „Vereinsheim“).

## Regeln

- Keine Secrets committen. Nichts am DPAT-Repo ändern. Nicht auf `main` pushen.
- Vor jedem Push: `npm run build` und `npm run lint` müssen durchlaufen.
- Commits klein und auf Deutsch beschreibend.

## Befehle

```bash
npm install        # .npmrc setzt legacy-peer-deps
npm run dev        # http://localhost:3000
npm run lint
npm run build      # Netlify-Build (.netlify/, dist/)
```
