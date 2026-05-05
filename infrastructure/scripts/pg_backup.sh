#!/bin/bash
# pg_backup.sh
# Run this script via crontab: 0 3 * * * /path/to/pg_backup.sh

BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +"%Y%m%d_%H%M%S")
DB_USER="postgres"
# If using Docker, use: docker exec -t postgres_container pg_dump...

mkdir -p $BACKUP_DIR

echo "Iniciando respaldo de la base de datos..."
pg_dump -U $DB_USER -h localhost -F c -b -v -f "$BACKUP_DIR/db_backup_$DATE.dump" majia_os_db

echo "Comprimiendo respaldo..."
gzip "$BACKUP_DIR/db_backup_$DATE.dump"

echo "Eliminando respaldos de más de 7 días..."
find $BACKUP_DIR -type f -name "*.gz" -mtime +7 -exec rm {} \;

echo "Respaldo completado: db_backup_$DATE.dump.gz"
