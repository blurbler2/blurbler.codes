#!/usr/bin/env bash
set -euo pipefail

# deploy.sh
# Builds the project locally, rsyncs `dist/` and `ecosystem.config.js` to the server,
# and restarts the app via PM2.
# Usage:
#   ./deploy.sh [SERVER_USER] [SERVER_HOST] [SERVER_PATH] [SSH_KEY_PATH]
# Environment variables (overrides positional args): SERVER_USER, SERVER_HOST, SERVER_PATH, SSH_KEY_PATH

SSH_KEY=${SSH_KEY_PATH:-${4:-${HOME}/.ssh/id_ed25519}}
SERVER_USER=${SERVER_USER:-${1:-blurbler}}
SERVER_HOST=${SERVER_HOST:-${2:-164.92.180.50}}
SERVER_PATH=${SERVER_PATH:-${3:-/var/www/app}}

echo "Using SSH key: ${SSH_KEY}"
echo "Deploy target: ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}"

# Build locally
echo "Installing dependencies and building..."
npm ci
npm run build

# Sync built files and PM2 config
echo "Syncing dist/ and ecosystem.config.js to server..."
rsync -avz --delete -e "ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no" ./dist/ ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/dist/
rsync -avz -e "ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no" ./ecosystem.config.js ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/ecosystem.config.js

# Restart PM2 on server
echo "Restarting PM2 on server..."
ssh -i "${SSH_KEY}" -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_HOST} <<EOF
  set -e
  cd ${SERVER_PATH}
  pm2 start ecosystem.config.js --env production --update-env || pm2 reload ecosystem.config.js --env production --update-env
  pm2 save
  exit
EOF

echo "Deployment complete: ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}"
