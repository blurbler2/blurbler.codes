
# Deployment Guide — blurbler.codes

This document contains concise, copyable steps to deploy the Node.js application used in this project to a VPS (example: DigitalOcean Ubuntu server). Follow sections in order and adapt values like `IP`, `USER`, and domain names to your environment.

## Prerequisites

- A VPS (Ubuntu) with a public IP (example: `164.92.180.50`).
- Local machine with `ssh` client (macOS zsh shell shown in examples).
- Domain name with A records pointed to your VPS IP (e.g., `blurbler.codes`, `www.blurbler.codes`).

## 1) Create a non-root user and upload SSH key (recommended)

On your local machine:

```bash
# generate a key (if you don't have one already)
ssh-keygen -t ed25519 -C "your_email@example.com" -f ~/.ssh/id_ed25519

# copy the public key to your clipboard (macOS)
pbcopy < ~/.ssh/id_ed25519.pub
```

On the server (initially connect as `root` or via the console):

```bash
# create a new user
adduser blurbler
# add to sudo group
usermod -aG sudo blurbler

# switch to the new user
su - blurbler

# create ~/.ssh and add your public key
mkdir -p ~/.ssh
vi ~/.ssh/authorized_keys   # paste the public key you copied
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

Optional local `~/.ssh/config` entry (makes SSH easier):

```text
Host your-vps
  HostName 164.92.180.50
  User blurbler
  IdentityFile ~/.ssh/id_ed25519
  AddKeysToAgent yes
  UseKeychain yes
```

Disable root SSH login once your user works:

```bash
sudo vi /etc/ssh/sshd_config   # set PermitRootLogin no
sudo systemctl restart sshd
```

Test: `ssh blurbler@164.92.180.50`

## 2) Install essentials: Node.js, nginx, Docker (optional), pm2

On the server (Ubuntu):

```bash
sudo apt update
sudo apt upgrade -y

# install nginx
sudo apt install -y nginx

# NodeSource install script (example for Node 23)
curl -fsSL https://deb.nodesource.com/setup_23.x | sudo -E bash -
sudo apt install -y nodejs build-essential

# pm2 (global) to run Node apps in prod
sudo npm install -g pm2

# optional: Docker
sudo apt install -y docker.io docker-compose
sudo systemctl enable --now docker
```

## 3) Example Nginx site (reverse proxy + WebSocket headers)

Create a site file like `/etc/nginx/sites-available/fsfe` and symlink to `sites-enabled`.

Example `fsfe` server block (adapt `server_name`):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name blurbler.codes www.blurbler.codes;

    root /var/www/html;
    index index.html;

    location / {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and test:

```bash
sudo ln -s /etc/nginx/sites-available/fsfe /etc/nginx/sites-enabled/fsfe
sudo nginx -t
sudo systemctl restart nginx
```

Open `http://your-ip-or-domain` to confirm nginx serves or proxies correctly.

## 4) Obtain HTTPS with Certbot

Install certbot (snap) and request a certificate. This example uses the nginx plugin.

```bash
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# allow https in firewall first
sudo ufw allow 'Nginx Full'

# run certbot nginx plugin (interactive)
sudo certbot --nginx -d blurbler.codes -d www.blurbler.codes

# confirm renewal is scheduled; test dry-run
sudo certbot renew --dry-run
```

If you use `certbot --nginx`, Certbot will modify your nginx config to add the SSL directives. Re-run `sudo nginx -t` after any edits.

## 5) Start the Node app with PM2

Place your app in `/var/www/app` (or another folder), `cd` there and install dependencies.

```bash
cd /var/www/app
npm ci   # or npm install

# start app
pm2 start app.js --name blurbler-app
pm2 save

# ensure pm2 restarts on server boot
pm2 startup systemd -u $(whoami) --hp $HOME
# follow the printed command output and run the suggested sudo command if needed
```

To view logs and status:

```bash
pm2 status
pm2 logs blurbler-app
```

If you update code and want to pull & restart automatically, you can use a webhook, cron job (example below), or `pm2` with `--watch` (not recommended for production without care).

## 6) Optional: Docker build & run (local or server)

Example `Dockerfile` (already in repo):

```dockerfile
FROM node:24-alpine3.21
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY --chown=node:node package*.json ./
USER node
RUN npm install
COPY --chown=node:node . .
EXPOSE 3000
CMD [ "node", "app.js" ]
```

Build and run:

```bash
sudo docker build -t node-fsfe .
sudo docker run -d --restart unless-stopped -p 3000:3000 node-fsfe
```

If you run the app in Docker, ensure your nginx proxy_pass points to the correct host/port where the container is published.

## 7) Automating deploys (cron example)

Example `github.sh` to pull latest code (make executable and secure):

```bash
#! /usr/bin/env bash
cd /var/www/app
git pull origin main --ff-only
npm ci
pm2 restart blurbler-app
```

Make it executable: `chmod 700 /var/www/app/github.sh`.

Add a cron job (edit with `crontab -e`) to run every 2 minutes (example) and log output:

```cron
*/2 * * * * sh /var/www/app/github.sh 2>&1 | logger -t github.sh
```

## 8) Security checklist (short)

- Keep only necessary ports open: `sudo ufw allow ssh`, `sudo ufw allow http`, `sudo ufw allow https`.
- Use `nmap` to scan open ports: `sudo nmap -sV your.ip.address`.
- Use `unattended-upgrades` to apply security updates automatically.
- Limit file permissions: private keys `chmod 600`, `~/.ssh` directory `chmod 700`.

## 9) Quick full deployment command sequence (copy and adapt)

```bash
# on server
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx curl git build-essential
curl -fsSL https://deb.nodesource.com/setup_23.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

# set up app
sudo mkdir -p /var/www/app && sudo chown $USER:$USER /var/www/app
cd /var/www/app
git clone git@github.com:blurbler2/blurbler.codes.git .
npm ci
pm2 start app.js --name blurbler-app
pm2 save
pm2 startup systemd -u $(whoami) --hp $HOME

# nginx proxy (create site file as above), then
sudo nginx -t && sudo systemctl restart nginx

# certbot (snap)
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo certbot --nginx -d blurbler.codes -d www.blurbler.codes
```

## Run Locally

For local development or testing, use these steps to run the app on your machine:

1. Install dependencies:

```bash
npm ci
```

2. Start the WebSocket-enabled server (or the main HTTP app):

```bash
node index-ws.js
# or
node app.js
```

3. Set a custom `PORT` environment variable if required:

```bash
PORT=3000 node index-ws.js
```

4. Optional: run with `pm2` for process supervision during development:

```bash
pm2 start index-ws.js --name blurbler-ws --watch
pm2 logs blurbler-ws
```

I can add `npm` scripts like `start` and `dev` to `package.json` if you'd like a simpler developer workflow.

---

If you want, I can:

- Commit these files and push them to the repo.
- Create a `DEPLOY.md` PR with staged changes and suggestions.
- Expand any section into a more in-depth tutorial (e.g., WebSocket + Nginx, Docker Compose setup, Kubernetes intro).

# Deployment Guide — blurbler.codes

This document contains concise, copyable steps to deploy the Node.js application used in this project to a VPS (example: DigitalOcean Ubuntu server). Follow sections in order and adapt values like `IP`, `USER`, and domain names to your environment.

## Prerequisites

- A VPS (Ubuntu) with a public IP (example: `164.92.180.50`).
- Local machine with `ssh` client (macOS zsh shell shown in examples).
- Domain name with A records pointed to your VPS IP (e.g., `blurbler.codes`, `www.blurbler.codes`).

## 1) Create a non-root user and upload SSH key (recommended)

On your local machine:

```bash
# generate a key (if you don't have one already)
ssh-keygen -t ed25519 -C "your_email@example.com" -f ~/.ssh/id_ed25519

# copy the public key to your clipboard (macOS)
pbcopy < ~/.ssh/id_ed25519.pub
```

On the server (initially connect as `root` or via the console):

```bash
# create a new user
adduser blurbler
# add to sudo group
usermod -aG sudo blurbler

# switch to the new user
su - blurbler

# create ~/.ssh and add your public key
mkdir -p ~/.ssh
vi ~/.ssh/authorized_keys   # paste the public key you copied
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

Optional local `~/.ssh/config` entry (makes SSH easier):

```text
Host your-vps
  HostName 164.92.180.50
  User blurbler
  IdentityFile ~/.ssh/id_ed25519
  AddKeysToAgent yes
  UseKeychain yes
```

Disable root SSH login once your user works:

```bash
sudo vi /etc/ssh/sshd_config   # set PermitRootLogin no
sudo systemctl restart sshd
```

Test: `ssh blurbler@164.92.180.50`

## 2) Install essentials: Node.js, nginx, Docker (optional), pm2

On the server (Ubuntu):

```bash
sudo apt update
sudo apt upgrade -y

# install nginx
sudo apt install -y nginx

# NodeSource install script (example for Node 23)
curl -fsSL https://deb.nodesource.com/setup_23.x | sudo -E bash -
sudo apt install -y nodejs build-essential

# pm2 (global) to run Node apps in prod
sudo npm install -g pm2

# optional: Docker
sudo apt install -y docker.io docker-compose
sudo systemctl enable --now docker
```

## 3) Example Nginx site (reverse proxy + WebSocket headers)

Create a site file like `/etc/nginx/sites-available/fsfe` and symlink to `sites-enabled`.

Example `fsfe` server block (adapt `server_name`):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name blurbler.codes www.blurbler.codes;

    root /var/www/html;
    index index.html;

    location / {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and test:

```bash
sudo ln -s /etc/nginx/sites-available/fsfe /etc/nginx/sites-enabled/fsfe
sudo nginx -t
sudo systemctl restart nginx
```

Open `http://your-ip-or-domain` to confirm nginx serves or proxies correctly.

## 4) Obtain HTTPS with Certbot

Install certbot (snap) and request a certificate. This example uses the nginx plugin.

```bash
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# allow https in firewall first
sudo ufw allow 'Nginx Full'

# run certbot nginx plugin (interactive)
sudo certbot --nginx -d blurbler.codes -d www.blurbler.codes

# confirm renewal is scheduled; test dry-run
sudo certbot renew --dry-run
```

If you use `certbot --nginx`, Certbot will modify your nginx config to add the SSL directives. Re-run `sudo nginx -t` after any edits.

## 5) Start the Node app with PM2

Place your app in `/var/www/app` (or another folder), `cd` there and install dependencies.

```bash
cd /var/www/app
npm ci   # or npm install

# start app
pm2 start app.js --name blurbler-app
pm2 save

# ensure pm2 restarts on server boot
pm2 startup systemd -u $(whoami) --hp $HOME
# follow the printed command output and run the suggested sudo command if needed
```

To view logs and status:

```bash
pm2 status
pm2 logs blurbler-app
```

If you update code and want to pull & restart automatically, you can use a webhook, cron job (example below), or `pm2` with `--watch` (not recommended for production without care).

## 6) Optional: Docker build & run (local or server)

Example `Dockerfile` (already in repo):

```dockerfile
FROM node:24-alpine3.21
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY --chown=node:node package*.json ./
USER node
RUN npm install
COPY --chown=node:node . .
EXPOSE 3000
CMD [ "node", "app.js" ]
```

Build and run:

```bash
sudo docker build -t node-fsfe .
sudo docker run -d --restart unless-stopped -p 3000:3000 node-fsfe
```

If you run the app in Docker, ensure your nginx proxy_pass points to the correct host/port where the container is published.

## 7) Automating deploys (cron example)

Example `github.sh` to pull latest code (make executable and secure):

```bash
#! /usr/bin/env bash
cd /var/www/app
git pull origin main --ff-only
npm ci
pm2 restart blurbler-app
```

Make it executable: `chmod 700 /var/www/app/github.sh`.

Add a cron job (edit with `crontab -e`) to run every 2 minutes (example) and log output:

```cron
*/2 * * * * sh /var/www/app/github.sh 2>&1 | logger -t github.sh
```

## 8) Security checklist (short)

- Keep only necessary ports open: `sudo ufw allow ssh`, `sudo ufw allow http`, `sudo ufw allow https`.
- Use `nmap` to scan open ports: `sudo nmap -sV your.ip.address`.
- Use `unattended-upgrades` to apply security updates automatically.
- Limit file permissions: private keys `chmod 600`, `~/.ssh` directory `chmod 700`.

## 9) Quick full deployment command sequence (copy and adapt)

```bash
# on server
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx curl git build-essential
curl -fsSL https://deb.nodesource.com/setup_23.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

# set up app
sudo mkdir -p /var/www/app && sudo chown $USER:$USER /var/www/app
cd /var/www/app
git clone git@github.com:blurbler2/blurbler.codes.git .
npm ci
pm2 start app.js --name blurbler-app
pm2 save
pm2 startup systemd -u $(whoami) --hp $HOME

# nginx proxy (create site file as above), then
sudo nginx -t && sudo systemctl restart nginx

# certbot (snap)
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo certbot --nginx -d blurbler.codes -d www.blurbler.codes
```