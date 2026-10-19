# Übergabe für die nächste Session (Stand 19.10.2026)

Zuerst `CLAUDE.md` und `DIRECTUS.md` lesen, dort steht alles Dauerhafte. Hier steht nur,
wo wir gerade sind und was als Nächstes kommt.

## Wo der Stand liegt

- Branch **`relaunch`** (Bruno: direkt dorthin pushen, keine PRs nötig). `main` nie anfassen.
- Netlify baut `relaunch`; die Domain zeigt noch auf die alte Seite (`main` / GitHub Pages).
- Letzte Commits: Directus-Anbindung + Vereinsheim (`1ce8503`), Kontakt-Postfach lesen (`4286472`),
  Mails aus dem Vereinsheim beantworten/schreiben (`0db8cf2`).

## Fertig und mit Bruno getestet

- **Directus** (12.5) eingerichtet: Schema/Rechte/Flows über `scripts/directus-setup.mjs`
  (idempotent, `--dry-run`), Startinhalte über `scripts/directus-seed.mjs`. Rollen Mitglied/Vorstand.
- **Website liest/schreibt über Directus** (`server/utils/*`, Bild-Route `/bilder/:id`), Formulare mit
  Rate-Limit, Honeypot, Turnstile, Brevo-Mails, Double-Opt-in (Newsletter, Plenum-Erinnerung).
- **Vereinsheim** (`/vereinsheim`): Dashboard, Termine, Dorfanzeiger (Zeitungslook, Artikel-Vorschau,
  Gastbeitrag-Links), Ideensammlung, Über uns, Kasse, Mitglieder (Vorstand), Konto, **Post** (Vorstand).
- **Post / Kontakt-Postfach:** IONOS-Postfach `kontakt@königsdorf-rückt-zusammen.de`
  (Punycode `kontakt@xn--knigsdorf-rckt-zusammen-7kc4n.de`). Lesen per IMAP, Senden per IONOS-SMTP,
  Rückfall Brevo. `kontakt@koenigsdorf-rueckt-zusammen.de` ist bei IONOS als **E-Mail-Weiterleitung**
  auf das Postfach angelegt (vorher hatte die Domain ohne Umlaute gar keine Mail!). Bruno hat Empfang
  und Antworten erfolgreich getestet. `NUXT_IMAP_*` sind auf Netlify gesetzt (Passwort als Secret).

## Zuletzt erledigt (19.10.2026, zweite Session)

- **Vereinsheim übersichtlicher:** lila Seitenköpfe mit Hervorhebung, Navigation mit „Diverses“ (Ideensammlung, Über uns,
  Mitglieder), neuer Login ohne Tür, „Tschüss“ führt zur Website, kaum noch Reenie Beanie bei Funktionen,
  ruhige Formulare (durchgezogene Rahmen), Bearbeiten-Seiten zweispaltig mit Abschnitten und fester Aktionsleiste,
  Markdown-Werkzeugleiste, Terminliste neu (nach Monat, Kalenderblatt, Anmelde-Balken, Menü „⋯“).
- **Post schneller + automatisch aktuell:** siehe `DIRECTUS.md` → Post. Noch auf Netlify mit dem echten Postfach testen.
- Footer: „Vereinsheim“ als normaler Link unter „Verein“. Stimmen-Zitate bis 400 Zeichen (lange werden kleiner gesetzt).
- Phase 8 begonnen: SEO-Grundwerte (og:*, Canonical), `robots.txt`, Mobil: Hero mittig, „Fragen?“ ohne Figur und
  zentriert, Newsletter-Zettel im Dorfanzeiger mobil gerade, Querscrollen bei Tablets behoben.

- **Tour + Profil:** Tour durchs Vereinsheim (Vorschlag auf dem Dashboard, im Profil wiederholbar), Profil-Knopf mit
  rundem Profilbild neben „Tschüss“, Profilbild-Upload unter „Mein Profil“.
  Setup-Skript ist gelaufen (siehe unten).

- **Dorfanzeiger ohne Ausgaben:** neuester Artikel groß, drei in der Reihe, weitere in der Seitenspalte bis sie voll
  ist, Archiv unter `/dorfanzeiger/archiv`. Reihenfolge = `veroeffentlicht_am`. **Achtung:** „Wir sind jetzt ein Verein“
  und „Kleidertausch #2“ haben aus dem Import kein Erscheinungsdatum und stehen deshalb ganz hinten – Bruno trägt im
  Vereinsheim ein Datum ein, wenn sie weiter vorn stehen sollen.
- Dashboard: Kacheln springen nicht mehr (Post-Karte hat feste Mindesthöhe + Platzhalter), Plenum-Fuß ohne Datum,
  Tour-Vorschlag nach 1 s mittig mit abgedunkeltem Hintergrund. Turnstile in schmalen Spalten kompakt (Leserbrief).

- **Regelmäßige Termine:** Wiederholen (jede Woche, alle zwei Wochen, monatlich gleicher Wochentag/gleiches Datum,
  optional bis) im Termin-Formular; Website zeigt das nächste Datum. Leserbrief: eigene Überschrift, breiterer Zettel.
  Artikel-Editor: Abschnitt „Porträt“ nur im Ressort Porträts.
  `scripts/directus-setup.mjs` ist am 19.10.2026 gelaufen (Wiederholung, Anrede, Tour, Profilbilder + Rechte).

## Offen / als Nächstes

1. **Phase 8:** rechtliche Seiten mit echten Inhalten (Impressum: Vorstand, Registereintrag, Verantwortliche*r nach
   § 18 MStV – Angaben von Bruno nötig), Mobil-Feinschliff weiter Seite für Seite.
2. **Datenschutz** (`app/inhalte/datenschutz.md`, Entwurf): Brevo, Cloudflare Turnstile, Directus
   (Hetzner) und das Lesen/Senden des Kontakt-Postfachs (IONOS) ergänzen. Bruno fragen, bevor es live geht.
3. Vor dem Livegang `/komponenten` löschen; Stimmen-Zitate (außer Thomas) sind noch Platzhalter;
   echte Bilder/Illustrationen kommen von Bruno aus Figma (namensgleich drüberkopieren).
4. Umstellung der Domain auf die neue Seite (`relaunch` → Produktion) erst nach Brunos OK.

## Hinweise zur Arbeitsumgebung

- In Directus **nichts löschen**, Token-Werte **nie** ausgeben oder committen.
- Vor jedem Push `npm run lint` und `npm run build`.
- Im Cloud-Container sind IMAP/SMTP-Ports gesperrt: Postfach lokal nur mit einem Test-Server
  prüfbar (z.B. `hoodiecrow-imap` hinter TLS + `smtp-server`, `NODE_TLS_REJECT_UNAUTHORIZED=0`
  nur lokal), Ende-zu-Ende testet Bruno auf Netlify.
- Directus-Adresse steht in `NUXT_DIRECTUS_URL` (auf Netlify per `SECRETS_SCAN_OMIT_KEYS` vom
  Secret-Scan ausgenommen).
