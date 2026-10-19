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

## Offen / als Nächstes

1. **Phase 8:** rechtliche Seiten mit echten Inhalten, 404, SEO-Meta je Seite prüfen, Feinschliff Mobile.
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
