# blurbler.codes
Learning project for fullstack development

## Project Summary

- Purpose: Fullstack learning project for front-end engineers to deploy and operate a production-capable Node.js web app. Focuses on moving from local development to a hosted VPS and covers servers, deployment, networking, security, real-time features, containers, and basic CI/CD.

- Primary Stack:
	- App: Node.js (HTTP / Express, WebSocket examples)
	- Process manager: `pm2` for production process management and auto-start
	- Reverse proxy: `nginx` for proxying, SSL termination, and load balancing
	- Containers: Docker (Alpine-based images) for portable builds
	- Database: SQLite for lightweight local storage (examples and SQL concepts)
	- Hosting: DigitalOcean VPS, blurbler.codes

- Key Concepts Covered:
	- Shell, Vim, and Git basics (`ls`, `cd`, `vi`, `ssh`, `git`) and file permissions
	- Servers and cloud basics (VPS, virtualization, differences vs on-prem)
	- Networking fundamentals (OSI model, IPv4 vs IPv6, TCP/UDP, common ports)
	- SSH key setup and secure server access; disabling root SSH login
	- Firewall and security (UFW, `nmap`, `unattended-upgrades`, least privilege)
	- HTTPS and Certbot for SSL certificates; enabling HTTP/2 in Nginx
	- Nginx patterns: `proxy_pass`, `upstream` blocks, logging, and `nginx -t` validation
	- Process management with `pm2` and Docker container workflows
	- WebSockets and proxied real-time connections (nginx headers for Upgrade/Connection)
	- Basic CI/CD ideas: cron automation, GitHub pulls, and deployment strategies

- Typical Deployment Flow (concise):
	1. Provision VPS and add a non-root user with SSH public key in `~/.ssh/authorized_keys`.
	2. Install Node.js, `nginx`, Docker (optional), and `pm2`.
	3. Configure Nginx to `proxy_pass` to the Node app (e.g., `http://127.0.0.1:3000/`) and test with `sudo nginx -t`.
	4. Start the app with `pm2 start app.js` (or run a Docker container) and run `pm2 save` + `pm2 startup`.
	5. Obtain SSL via Certbot, open firewall ports (`ssh`, `http`, `https`), and enable UFW.

- Security & Operations Checklist:
	- Use SSH keys and the OS keychain (`ssh-add --apple-use-keychain`).
	- Restrict `~/.ssh/authorized_keys` permissions and disable root login in `/etc/ssh/sshd_config`.
	- Configure UFW (`sudo ufw allow ssh`, `sudo ufw allow http`, `sudo ufw allow https`, `sudo ufw enable`).
	- Scan for open ports with `nmap` and close unnecessary ones.
	- Enable `unattended-upgrades` for security updates.

- Useful Commands (examples):
	- Validate Nginx: `sudo nginx -t`
	- Start server: `node app.js` or `pm2 start app.js`
	- Add PM2 to startup: run the command output by `pm2 startup` (example included in PM2 output)
	- Docker build: `sudo docker build -t node-fsfe .`
	- Docker run: `sudo docker run -d -p 3000:3000 node-fsfe`
	- Cron example: `*/2 * * * * sh /var/www/app/github.sh 2>&1 | logger -t github.sh`

## Deployment Guide

Detailed, step-by-step deployment instructions are in `DEPLOY.md`. See that file for SSH key setup, Nginx configuration, Certbot (HTTPS), `pm2` usage, Docker build/run, and an ordered deployment checklist with copyable commands.

### CI / Deploy notes

This repository includes a GitHub Actions workflow which now builds the site on Actions (not on the small VPS) and uploads only the production `dist/` output to the server. This avoids OOM failures when building on small droplets.

Required repository secrets (set these in GitHub → Settings → Secrets and variables → Actions):

- `DEPLOY_SSH_KEY` — private SSH key for the deploy user (contents of the private key file). The workflow will write this to `~/.ssh/id_ed25519` during the run.
- `SERVER_USER` — user on your server (e.g. `blurbler`).
- `SERVER_HOST` — server IP or hostname (e.g. `164.92.180.50`).
- `SERVER_PATH` — absolute path on the server where the app lives (e.g. `/var/www/app`).

After adding the secrets, trigger the workflow by pushing to `main` or using the Actions tab's manual `workflow_dispatch`.

### Local deploy script

You can also build and deploy from your machine using the included `deploy.sh`. It builds locally, uploads `dist/` and `ecosystem.config.js`, and restarts the app with PM2.

Usage examples:

Run with defaults (user `blurbler`, host `164.92.180.50`, path `/var/www/app`, key `~/.ssh/id_ed25519`):

```bash
./deploy.sh
```

Pass server arguments:

```bash
./deploy.sh myuser 1.2.3.4 /var/www/app ~/.ssh/id_ed25519_other
```

Or export environment variables:

```bash
export SERVER_USER=myuser
export SERVER_HOST=1.2.3.4
export SERVER_PATH=/var/www/app
export SSH_KEY_PATH=~/.ssh/id_ed25519
./deploy.sh
```

Note: The deploy script requires `rsync` and SSH access to the target server and will restart PM2 using `ecosystem.config.js`.

## Run Locally

To run the app locally for development or quick testing:

- Install dependencies:

```bash
npm ci
```

- Start the WebSocket-enabled server (example):

```bash
node index-ws.js
# or run the main HTTP app
node app.js
```

- Run with a specific port (example):

```bash
PORT=3000 node index-ws.js
```

- Use `pm2` locally if you want process supervision:

```bash
pm2 start index-ws.js --name blurbler-ws --watch
pm2 logs blurbler-ws
```


## Run website locally

`npm run dev`