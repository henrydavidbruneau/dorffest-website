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
- **Directus** (self-hosted) kommt **später** für alles Dynamische.
- **Kein** Nuxt Content, **kein** Nuxt Studio, **kein** i18n.
- Später: **Brevo** (Mails/Newsletter), **Cloudflare Turnstile** (Bot-Schutz).
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
server/data/              Platzhalterdaten, bis Directus angebunden ist
server/utils/             Hilfsfunktionen (später Directus-Client)
public/illustrationen/    Illustrationen (SVG)
public/fotos/             Fotos (WebP, über <NuxtImg>)
scripts/                  später: directus-setup.mjs
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

### Datenschicht (Directus später nur an einer Stelle)

1. **Typen:** pro Datentyp ein Interface in `shared/types/`, benannt und aufgebaut wie die
   spätere Directus-Collection (Feldnamen `snake_case`, `status`, `slug`,
   `date_created` …).
2. **Server-Routen** unter `server/api/…` (z.B. `termine.get.ts`,
   `termine/[slug].get.ts`, `dorfanzeiger.get.ts`) liefern vorerst Platzhalterdaten aus
   `server/data/*.ts`. Später zeigen **genau diese Routen** auf Directus.
3. **Composables** (`useTermine()`, `useDorfanzeiger()`, `useKleinanzeigen()`,
   `useFaq()` …) rufen nur die Server-Routen auf (`useFetch('/api/…')`).
4. **Seiten kennen nur Composables**, nie Server-Daten oder Directus direkt.
5. **Formulare** (Newsletter, Mitgliedsantrag, Kleinanzeige aufgeben, Fest-Beiträge,
   Abstimmung) haben eine **POST-Route**, die validiert und vorerst nur loggt bzw. eine
   Erfolgsmeldung zurückgibt. Kein Speichern, keine Mails.
6. **Platzhalterdaten** = Inhalte aus dem Design (15.11. Kleidertausch, 19.12.
   Königsdorf singt zusammen, Dorffest 2026, Artikel „Ein Tag, an dem das ganze Dorf
   zusammenkam" …) plus 1–2 weitere, damit Listen realistisch aussehen.

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
| `/dorfanzeiger` | Design S. 3 | „Neuigkeiten": Zeitungslayout auf lila Grund: Masthead, Ressort-Filter (Alle · Feste · Verein · Treffen · Kinder · Rezepte), Titelgeschichte, Terminkalender-Kasten, Seitenspalte, 3er-Reihe, „Fünf Fragen an …", Kleinanzeigen, „Werde Mitglied"-Box, „Frühere Ausgaben", Newsletter-Zettel |
| `/dorfanzeiger/[slug]` | **nicht im Design** | Aus dem Zeitungs-Look ableiten: Masthead klein, Ressort, Titel, Autor*in, Datum, Lesedauer, Bild + Bildunterschrift, Fließtext aus Markdown. **Entwurf vorher zeigen.** |
| `/termine`, `/termine/[slug]` | **nicht im Design** | Aus den Termin-Zetteln ableiten: kommende + vergangene Termine; Detail mit Datum, Uhrzeit, Ort, Beschreibung, `.ics`-Download, ggf. Formular („Was bringst du mit?"). **Entwurf vorher zeigen.** |
| `/satzung`, `/kontakt`, `/impressum`, `/datenschutz` | – | einfache Textseiten, Platzhaltertext |
| `/vereinsheim` | – | Admin-Bereich (bei uns „Vereinsheim“, im DPAT-Vorbild `admin`/„Hinterzimmer“), **letzte Phase** (nach Directus). Route ist reserviert. |
| 404 | – | eigene Fehlerseite im Stil der Seite |

Footer-Links: Über uns · Satzung · Mitglied werden · Termine ·
Infochannel · Kontakt · Impressum · Datenschutz.

## Design-System

Das **Figma-PDF (3 Seiten: Startseite, Über uns, Dorfanzeiger) ist der maßgebliche
Zielzustand.** Abnahme Sektion für Sektion gegen das PDF. Im Konflikt gewinnt die Treue
zum Design.

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
4. **Über uns.**
5. **Dorfanzeiger** (Übersicht), dann Artikelseite (Entwurf vorher zeigen).
6. **Termine** + Termin-Detailseite (Entwurf vorher zeigen).
7. **Formulare** (UI + POST-Routen mit Validierung, noch ohne Speichern).
8. Rechtliche Seiten, 404, SEO, Feinschliff Mobile.

→ Danach: Directus aufsetzen (separat), Server-Routen umstellen, Vereinsheim (Admin) bauen.

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
