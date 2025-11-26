#!/usr/bin/env bash
set -e
# Exit immediately if any command fails.

USER_HOME="/home/blurbler"
BACKUP_DATE=$(date +"%Y%m%d-%H%M%S")
BACKUP_FILE="$USER_HOME/backup-$BACKUP_DATE.tar.gz"

TEMP_DIR="$USER_HOME/backup-temp"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

echo "==> Collecting files..."

# Copy app folder (needs sudo)
mkdir -p "$TEMP_DIR/app"
sudo cp -r /var/www/app/* "$TEMP_DIR/app/"

# Copy .env if exists (needs sudo)
if [ -f /var/www/app/.env ]; then
  sudo cp /var/www/app/.env "$TEMP_DIR/app/"
fi

# PM2 process list dump (no sudo needed)
mkdir -p "$TEMP_DIR/pm2"
pm2 save || true
cp ~/.pm2/dump.pm2 "$TEMP_DIR/pm2/" 2>/dev/null || true

# Copy nginx config (requires sudo)
mkdir -p "$TEMP_DIR/nginx"
sudo cp /etc/nginx/nginx.conf "$TEMP_DIR/nginx/"
sudo cp -r /etc/nginx/sites-available "$TEMP_DIR/nginx/"
sudo cp -r /etc/nginx/sites-enabled "$TEMP_DIR/nginx/"

# Copy SSL certificates (requires sudo)
mkdir -p "$TEMP_DIR/letsencrypt"
sudo cp -r /etc/letsencrypt/* "$TEMP_DIR/letsencrypt/" || true

echo "==> Creating compressed archive..."
# tar needs sudo because some copied files are root-owned
sudo tar -czvf "$BACKUP_FILE" -C "$TEMP_DIR" .

echo "==> Cleaning up temp files..."
rm -rf "$TEMP_DIR"

# Keep only the last 2 backups (newest + previous)
echo "==> Cleaning old backups (keeping only the last 2)..."
ls -1t "$USER_HOME"/backup-*.tar.gz 2>/dev/null | tail -n +3 | xargs -r rm -- || true


echo "==> Backup complete!"
echo "==> Backup saved to: $BACKUP_FILE"
echo "Download with:"
echo "scp USER@YOUR_SERVER_IP:$BACKUP_FILE ."

