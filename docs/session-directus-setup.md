# Übergabe: Directus einrichten (neue Session)

Auftrag für eine neue Claude-Code-Session. Sag ihr: „Lies `docs/session-directus-setup.md`
und arbeite sie ab.“

## Stand (18.10.2026)

- **Server läuft:** Hetzner CX23 `directus-koenigsdorf` (`89.167.24.190`), Ubuntu 26.04,
  Docker Compose aus `hetzner/` (Postgres 17, Directus 12.5.0, Caddy). Anleitung:
  `hetzner/README.md`.
- **Adresse:** `https://api.königsdorf-rückt-zusammen.de` =
  `https://api.xn--knigsdorf-rckt-zusammen-7kc4n.de` (in Konfigurationen immer Punycode).
- **Lizenz:** Open Innovation Grant vorhanden (`LICENSE_KEY` in der Server-`.env`).
- **Mails aus Directus:** Brevo-SMTP ist in der Server-`.env` eingetragen.
- **Directus ist leer:** keine Collections, keine eigenen Policies.
- **User `website-server`** ist angelegt (ohne Policy), sein statischer Token liegt auf
  Netlify als `NUXT_DIRECTUS_TOKEN`. Ohne Policy darf er noch nichts.
- **Netlify** baut `relaunch`. Env: `NUXT_DIRECTUS_URL`, `NUXT_DIRECTUS_TOKEN`
  (`NUXT_BREVO_API_KEY` folgt).
- **Kontakt-Mail** ist jetzt `kontakt@koenigsdorf-rueckt-zusammen.de` (Weiterleitung bei
  IONOS; Umlaut-Domains gehen bei Brevo/Mail nicht).
- Code-Branch: `claude/nice-bell-nol2e3` (Hetzner-Dateien, neue Kontakt-Mail). Noch nicht in
  `relaunch` gemergt.

## Vorher erledigt (Bruno)

- Cloud-Umgebung: `DIRECTUS_ADMIN_TOKEN` (Token des Admin-Users `claude-setup`) als
  Umgebungsvariable, Domain `api.xn--knigsdorf-rckt-zusammen-7kc4n.de` unter Network access →
  Allowed domains.

## Prompt

> Wir richten Directus für die Königsdorf-Website ein. Lies `CLAUDE.md`, `DIRECTUS.md`
> (Bauplan: Collections, Policies, Rechte) und diese Datei. Vorbild ist DPAT
> (`henrydavidbruneau/dont-post-about-this`: `scripts/directus-setup.mjs`, `DIRECTUS.md`) –
> dort nur lesen, nichts ändern. Arbeite auf dem Branch `claude/nice-bell-nol2e3`.
>
> 1. Zugang prüfen: `curl -s https://api.xn--knigsdorf-rckt-zusammen-7kc4n.de/server/health`
>    und ob `DIRECTUS_ADMIN_TOKEN` gesetzt ist (Wert nie ausgeben). Mit dem Token
>    Version (`/server/info`), Lizenzstatus, vorhandene Collections, Policies und User
>    auflisten.
> 2. `scripts/directus-setup.mjs` nach DPAT-Muster schreiben: legt alle Collections,
>    Felder und Relationen aus `DIRECTUS.md` an, die Policies `Server`, `Mitglied`,
>    `Vorstand` (alle **ohne App Access** – Lizenz-Seats, siehe `DIRECTUS.md`) mit den
>    Rechten aus der Tabelle, und hängt `Server` an den User `website-server`. Nur Fehlendes
>    anlegen, nichts ändern oder löschen, beliebig oft ausführbar, `--dry-run`. Öffentliche
>    Rolle bekommt **keine** Rechte. Directus 12: Breaking Changes beachten.
> 3. Probelauf mit `--dry-run`. **Ergebnis zeigen und auf mein Okay warten.**
> 4. Nach dem Okay echter Lauf, dann ein zweites Mal (muss alles „schon vorhanden“ melden).
> 5. Startinhalte aus `scripts/directus-seed/inhalte.json` importieren (eigenes Skript,
>    Hinweise in der Datei und in `DIRECTUS.md` → „Startinhalte“: Dateien hochladen,
>    Slugs/Nummern in IDs auflösen). Vorher in der JSON die Kontakt-Mails auf
>    `kontakt@koenigsdorf-rueckt-zusammen.de` umstellen. Erst Probelauf zeigen.
> 6. Prüfen, ohne Testdaten liegen zu lassen: mit dem Token von `website-server` kann ich
>    das nicht (liegt nur auf Netlify) – stattdessen über die Policy-Rechte gegenprüfen und
>    öffentlich (`/items/termine` ohne Token) → 403.
> 7. `DIRECTUS.md` auf den echten Stand bringen, committen, pushen.
> 8. Zum Schluss: Liste, was ich noch tun muss (User `claude-setup` deaktivieren,
>    Vereinsheim-User anlegen, …) und was als Nächstes kommt (`server/utils/*` auf
>    Directus umstellen).
>
> Regeln: Nichts in Directus löschen. Token-Werte nie ausgeben oder committen.
> Vor jedem Push `npm run lint` (und `npm run build`, falls die Umgebung Google Fonts
> erreicht – in der letzten Session ging das nicht).
