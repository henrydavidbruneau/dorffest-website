#!/bin/sh
# Nächtliches Backup: Datenbank-Dump + Uploads, 14 Tage aufheben.
# Cron (crontab -e):  30 3 * * * /opt/directus/backup.sh >> /opt/directus/backups/backup.log 2>&1
set -eu
cd /opt/directus
mkdir -p backups
STAMP=$(date +%F)
docker compose exec -T database pg_dump -U directus directus | gzip > "backups/db-$STAMP.sql.gz"
tar -czf "backups/uploads-$STAMP.tar.gz" -C data uploads
find backups -name '*.gz' -mtime +14 -delete
echo "$(date -Is) Backup ok"
