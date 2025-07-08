#!/bin/bash

PROJECT_DIR="/home/omnisys/project/OMNI-SYS"
ENV_FILE="$PROJECT_DIR/backend/.env"
BACKUP_DIR="$PROJECT_DIR/backups"

# === read .env-file ===
set -a
source "$ENV_FILE"
set +a

# === timestamp for filename ===
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_backup_$TIMESTAMP.sql"

# === create backup-directory (if it doesn't exist) ===
mkdir -p "$BACKUP_DIR"

# === create temporary .pgpass-file (-> for db password) ===
export PGPASSFILE=$(mktemp)
echo "$DB_HOST:$DB_PORT:$DB_NAME:$DB_USER:$DB_PASSWORD" > "$PGPASSFILE"
chmod 600 "$PGPASSFILE"

# === execute backup ===
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"

# === delete temporary .pgpass ===
rm "$PGPASSFILE"
unset PGPASSFILE

# === delete old backups (after 7 days) ===
find "$BACKUP_DIR" -type f -name "*.sql" -mtime +7 -delete