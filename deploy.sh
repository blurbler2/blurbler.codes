#!/usr/bin/env bash
set -euo pipefail

# Simple deploy script
# Usage: ./deploy.sh [SERVER_USER] [SERVER_HOST] [SERVER_PATH] [SSH_KEY]
# If you have an ssh-agent with your key loaded, you don't need to pass SSH_KEY.

SERVER_USER=${1:-${SERVER_USER:-blurbler}}
SERVER_HOST=${2:-${SERVER_HOST:-164.92.180.50}}
SERVER_PATH=${3:-${SERVER_PATH:-/var/www/app}}
SSH_KEY=${4:-${SSH_KEY:-}}

echo "Deploying to: ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}"

echo "Building..."
npm ci
npm run build

# Ensure dist exists
if [ ! -d ./dist ] || [ -z "$(ls -A ./dist)" ]; then
  echo "Error: ./dist is missing or empty. Build failed." >&2
  exit 1
fi

# SSH options (use agent if no key file provided)
if [ -n "${SSH_KEY}" ] && [ -f "${SSH_KEY}" ]; then
  SSH_OPTS="-i ${SSH_KEY} -o StrictHostKeyChecking=no"
else
  SSH_OPTS="-o StrictHostKeyChecking=no"
fi

echo "Creating remote path and uploading files..."
ssh ${SSH_OPTS} ${SERVER_USER}@${SERVER_HOST} "mkdir -p '${SERVER_PATH}/dist'"

rsync -avz --delete -e "ssh ${SSH_OPTS}" ./dist/ ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/dist/
rsync -avz -e "ssh ${SSH_OPTS}" ./ecosystem.config.js ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/ecosystem.config.js

echo "Restarting app on server"
ssh ${SSH_OPTS} ${SERVER_USER}@${SERVER_HOST} "cd '${SERVER_PATH}' && pm2 start ecosystem.config.js --env production --update-env || pm2 reload ecosystem.config.js --env production --update-env && pm2 save"

echo "Deploy complete"
