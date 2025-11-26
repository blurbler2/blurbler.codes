#!/usr/bin/env bash
set -e

# --- Validate input ---
if [ -z "$1" ]; then
  echo "Usage: sudo ./restore.sh <backup-file.tar.gz>"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "==> Creating temp directory..."
TEMP_DIR="$HOME/restore-temp"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

echo "==> Extracting backup..."
sudo tar -xzvf "$BACKUP_FILE" -C "$TEMP_DIR"

# -------------------------
# RESTORE APP
# -------------------------
echo "==> Restoring app files..."
sudo rm -rf /var/www/app
sudo mkdir -p /var/www/app

# Copy files directly (no more double nesting)
sudo cp -r "$TEMP_DIR/app/"* /var/www/app/

# Set correct ownership for production
sudo chown -R www-data:www-data /var/www/app

# -------------------------
# NODE MODULES
# -------------------------
echo "==> Installing Node.js dependencies..."
cd /var/www/app

# Install as www-data user
sudo -u www-data npm install --production || true

# -------------------------
# NGINX CONFIG
# -------------------------
echo "==> Restoring nginx config..."
sudo cp "$TEMP_DIR/nginx/nginx.conf" /etc/nginx/nginx.conf
sudo cp -r "$TEMP_DIR/nginx/sites-available/"* /etc/nginx/sites-available/
sudo cp -r "$TEMP_DIR/nginx/sites-enabled/"* /etc/nginx/sites-enabled/

# -------------------------
# SSL CERTIFICATES
# -------------------------
echo "==> Restoring SSL certificates..."
sudo rm -rf /etc/letsencrypt
sudo mkdir -p /etc/letsencrypt
sudo cp -r "$TEMP_DIR/letsencrypt/"* /etc/letsencrypt/

# -------------------------
# RELOAD NGINX
# -------------------------
echo "==> Testing and restarting nginx..."
sudo nginx -t
sudo systemctl restart nginx

# -------------------------
# PM2
# -------------------------
echo "==> Restoring PM2..."
if [ -f "$TEMP_DIR/pm2/dump.pm2" ]; then
  mkdir -p ~/.pm2
  cp "$TEMP_DIR/pm2/dump.pm2" ~/.pm2/dump.pm2
  echo "  PM2 dump restored. Run:"
  echo "  pm2 resurrect"
else
  echo "  No PM2 dump found."
fi

# -------------------------
# CLEANUP
# -------------------------
echo "==> Cleaning up..."
rm -rf "$TEMP_DIR"

echo
echo "==> Restore complete!"
echo "If PM2 did not auto-load apps, run:"
echo "pm2 start app.js --name blurbler-app"
echo "pm2 save"
echo "to start the app and save the PM2 process list."