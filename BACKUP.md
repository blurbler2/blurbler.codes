# blurbler.codes – Server Backup Guide

This repository contains a simple backup script (`backup.sh`) that you can run on your server to create a full backup of your application, configuration, and SSL certificates.  
The instructions below walk you through:

- manually backing up your app  
- using the automated `backup.sh` script  
- downloading the backup to your local machine  
- (placeholder) restore steps  

This version does **not** include cronjobs, timers, or automated restore scripts yet.

---

# 📦 Manual Backup (example)

You can manually copy your app and config files from the server to your local machine:

```bash
mkdir -p ~/blurbler.codes-backup

# Copy your app

scp -r USER@YOUR_SERVER_IP:/var/www/app ~/blurbler.codes-backup/app

# Copy your nginx config (example)

scp USER@YOUR_SERVER_IP:/etc/nginx/sites-available/fsfe ~/blurbler.codes-backup/

```

Replace:

- USER (e.g. blurbler)
- YOUR_SERVER_IP
- paths if needed

# ⚙️ Using the Backup Script on the Server

This repository includes a script called backup.sh that automatically collects:

- /var/www/app
- nginx configuration
- Let’s Encrypt SSL certificates
- PM2 process dump

See `backup.sh` in this repository. If not on already your server, upload the script to your server:

    `scp backup.sh USER@YOUR_SERVER_IP:~`


1. SSH into your server

    `ssh USER@YOUR_SERVER_IP`

2. Make it executable:

    `chmod +x backup.sh`

3. Run it:

    `sudo ./backup.sh`

After it runs successfully, you will see a file like: `backup-20250128-104200.tar.gz` inside your server home directory.

# 💾 Download Backup to Your Laptop 
## From your local machine, run:

    `scp USER@YOUR_SERVER_IP:/home/USER/server-backup-YYYYMMDD-HHMMSS.tar.gz .`

This saves the backup to your current local directory.

## Restore script

(A restore script will be added later.)

1. Upload your backup file (from your laptop):

    `scp backup-20250128-104200.tar.gz root@YOUR_SERVER_IP:/root/`

2. Upload the script:

    `scp restore.sh root@YOUR_SERVER_IP:/root/`

Make it executable:

    `sudo chmod +x restore.sh`

Run the restore: 

    `sudo /root/restore.sh /root/minimal-backup-20250128-104200.tar.gz`


## After restauration

Restart pm2:

`pm2 resurrect  # if PM2 dump was restored`

    Or start manually:

``` 
pm2 start /var/www/app/app.js --name blurbler-app
pm2 save
```


# Optional: Cronjob, backup daily on your server

Run:

    `sudo crontab -e`

Add:

    `0 3 * * * /home/USER/backup.sh >/var/log/server-backup.log 2>&1`

This creates a backup every night at 3:00 AM.