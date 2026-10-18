# Directus auf Hetzner einrichten

Schritt für Schritt vom leeren Hetzner-Konto bis zu
`https://cms.königsdorf-rückt-zusammen.de` mit laufendem Directus. Was danach in Directus
angelegt wird (Collections, Policies), steht in `../DIRECTUS.md`.

**Aufbau:** ein kleiner Hetzner-Cloud-Server mit Docker. Darauf drei Container
(`docker-compose.yml`): **Postgres** (Datenbank), **Directus**, **Caddy** (HTTPS-Zertifikat
automatisch, leitet an Directus weiter). Alle Daten liegen unter `/opt/directus/data`.

Dauer: ca. 45 Minuten. Kosten: ca. 6,60 €/Monat (CX23 5,49 € + Backups 20 %).

---

## 1. SSH-Schlüssel (auf dem Mac, einmalig)

Die Befehle in dieser Anleitung ohne Kommentare kopieren – das Mac-Terminal (zsh) versteht
`# …` hinter einem Befehl nicht.

Schon einen Schlüssel? `ls ~/.ssh` zeigt z.B. `id_ed25519.pub` oder `id_rsa.pub` – dann den
nehmen. Sonst neu erzeugen (Fragen mit Enter bestätigen, Passphrase optional):

```bash
ssh-keygen -t ed25519 -C "bruno@koenigsdorf"
```

Den öffentlichen Schlüssel anzeigen – diese eine Zeile (`ssh-ed25519 AAAA… bruno@koenigsdorf`)
kommt gleich zu Hetzner:

```bash
cat ~/.ssh/id_ed25519.pub
```

## 2. Server bei Hetzner anlegen

[console.hetzner.com](https://console.hetzner.com) → oben links das Projekt-Menü (z.B.
„Default ▾“) → neues Projekt „Königsdorf“ anlegen und auswählen (optional, hält es nur getrennt
vom DPAT-Server) → **Ressource erstellen ▾ → Server**:

| Einstellung | Wert |
|---|---|
| Standort | Nürnberg oder Falkenstein |
| Image | **Ubuntu 26.04** |
| Typ | **CX23** (Shared vCPU, x86, 2 vCPU, 4 GB RAM, wie `dpat-core`) |
| Netzwerk | öffentliche IPv4 + IPv6 an |
| SSH-Key | den aus Schritt 1 einfügen |
| Firewall | neu anlegen „web“: eingehend **TCP 22, TCP 80, TCP 443, UDP 443** |
| Backups | **an** (+20 %, tägliche Abbilder, 7 Tage) |
| Name | `directus-koenigsdorf` |

IPv4-Adresse des Servers notieren.

> Die Hetzner-Firewall ist wichtig, weil Docker die Ubuntu-Firewall (`ufw`) umgeht.

## 3. DNS-Eintrag

Beim Anbieter der Domain `königsdorf-rückt-zusammen.de` einen Eintrag anlegen:

| Typ | Name | Wert |
|---|---|---|
| A | `cms` | IPv4 des Servers |
| AAAA | `cms` | IPv6 des Servers (optional) |

In Punycode heißt die Domain `cms.xn--knigsdorf-rckt-zusammen-7kc4n.de` – so steht sie
überall in Konfigurationen. Prüfen (kann ein paar Minuten dauern), muss die Server-IP zeigen:

```bash
dig +short cms.xn--knigsdorf-rckt-zusammen-7kc4n.de
```

## 4. Server vorbereiten

```bash
ssh root@<SERVER-IP>

apt update && apt upgrade -y
curl -fsSL https://get.docker.com | sh
timedatectl set-timezone Europe/Berlin
reboot
```

Die zweite Zeile installiert Docker samt Compose. Nach dem `reboot` ein paar Sekunden warten und
wieder mit `ssh root@<SERVER-IP>` einloggen. Sicherheitsupdates spielt Ubuntu von selbst ein (`unattended-upgrades`).

## 5. Dateien hochladen

Auf dem **Mac**, im Projektordner:

```bash
ssh root@<SERVER-IP> mkdir -p /opt/directus
scp hetzner/docker-compose.yml hetzner/Caddyfile hetzner/.env.example hetzner/backup.sh \
    root@<SERVER-IP>:/opt/directus/
```

## 6. `.env` ausfüllen

Auf dem **Server**:

```bash
cd /opt/directus
cp .env.example .env
openssl rand -hex 32
openssl rand -hex 32
nano .env
chmod 600 .env
```

Die beiden `openssl`-Zeilen erzeugen je einen Zufallswert: einen für `DIRECTUS_SECRET`, einen
für `DB_PASSWORD`. In `nano` eintragen, mit Strg+O speichern (Enter), mit Strg+X beenden.

`ADMIN_EMAIL`/`ADMIN_PASSWORD` = dein Login. Alle Werte zusätzlich in den Passwortmanager.

## 7. Starten

```bash
cd /opt/directus
mkdir -p data/uploads data/extensions
chown -R 1000:1000 data/uploads data/extensions
docker compose up -d
docker compose logs -f directus
```

`chown` ist nötig, weil Directus im Container nicht als root läuft. Im Log warten bis
„Server started at …“, dann mit Strg+C raus (Directus läuft weiter).

Test: `https://cms.königsdorf-rückt-zusammen.de` im Browser → Directus-Login. Klappt das
HTTPS nicht: `docker compose logs caddy` (meist DNS noch nicht da oder Port 80 zu).

Danach in `.env` die Zeile `ADMIN_PASSWORD=` leeren (wird nur beim ersten Start gebraucht).

## 8. Backups

Zusätzlich zu den Hetzner-Abbildern ein Datenbank-Dump pro Nacht:

```bash
mkdir -p /opt/directus/backups
crontab -e
```

Im Editor (beim ersten Mal `nano` wählen) diese Zeile ans Ende setzen und speichern:

```
30 3 * * * /opt/directus/backup.sh >> /opt/directus/backups/backup.log 2>&1
```

Einmal von Hand testen: `/opt/directus/backup.sh && ls -lh /opt/directus/backups`.

Wiederherstellen (Notfall):
`gunzip -c backups/db-JJJJ-MM-TT.sql.gz | docker compose exec -T database psql -U directus directus`
(in eine leere Datenbank).

## 9. Lizenz (Directus 12)

Directus 12 läuft ohne Lizenz im kostenlosen **Core-Tier**. Der ist eng: nach heutigem Stand
**3 Seats** (Nutzer*innen mit *App Access* oder *Admin Access*, also Zugang zum Directus-Studio)
und wenige Flows. Nutzer*innen, die sich nur über die API anmelden – der Server-User und alle,
die nur das **Vereinsheim** benutzen – zählen nicht.

Der Verein hat eine Lizenz über den kostenlosen **Open Innovation Grant** (Oktober 2026).
Den Schlüssel (`DXXXX-XXXXX-XXXXX-XXXXC`) in `.env` als `LICENSE_KEY=` eintragen,
`docker compose up -d`, dann im Studio unter *Settings → License* prüfen. Schlüssel nur im
Passwortmanager und in der Server-`.env`, nie im Repo oder Chat.

Die Lizenz hat nur wenige Aktivierungen (je Adresse/`PUBLIC_URL` eine): **nicht** für lokale
Test-Instanzen verwenden – die laufen ohne Schlüssel im Core-Tier. Die Website ist so geplant,
dass sie auch ohne Lizenz funktioniert (Vereinsheim-Nutzer*innen ohne App Access, Flows sparsam).

## 10. Updates

Version steht fest in `docker-compose.yml` (`directus/directus:12.5.0`). Für ein Update:

1. Release-Notes / Breaking Changes lesen (directus.com → Releases).
2. `/opt/directus/backup.sh`
3. Tag in `docker-compose.yml` ändern (auch hier im Repo), dann
   `docker compose pull && docker compose up -d`. Die Datenbank-Migration läuft automatisch.

Postgres und Caddy bekommen mit `docker compose pull` Patch-Updates ihrer Hauptversion.

## 11. Zugänge für Website und Einrichtung

Im Directus-Studio als Admin:

1. **Server-User** (für Netlify): *User Directory* → neuer User `website-server`, ohne Passwort,
   Feld **Token** → generieren, speichern. Policy `Server` bekommt er, sobald das Setup-Skript
   sie angelegt hat. Token auf Netlify als `NUXT_DIRECTUS_TOKEN`, URL als
   `NUXT_DIRECTUS_URL=https://cms.xn--knigsdorf-rckt-zusammen-7kc4n.de`.
2. **Setup-Zugang für Claude** (wie bei DPAT, `docs/session-directus-setup.md` dort):
   User `claude-setup` mit Admin-Rolle, Token erzeugen. In der Claude-Cloud-Umgebung
   - als Umgebungsvariable `DIRECTUS_ADMIN_TOKEN` eintragen (**nicht in den Chat**),
   - unter Network access die Domain `cms.xn--knigsdorf-rckt-zusammen-7kc4n.de` erlauben,
   - neue Session starten.
   Nach dem Setup den User deaktivieren (er belegt einen Seat).

## Nützliche Befehle

Auf dem Server in `/opt/directus`:

| Befehl | Wofür |
|---|---|
| `docker compose ps` | läuft alles? |
| `docker compose logs -f directus` | Log ansehen (Strg+C beendet) |
| `docker compose restart directus` | neu starten |
| `df -h` | Platz auf der Platte |
