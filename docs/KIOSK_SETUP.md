# Chromium Kiosk with CI/CD Deployment

Complete guide for setting up Raspberry Pi 4 as a Chromium kiosk that automatically updates when you push code to GitHub.

**Last Updated:** January 21, 2026

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Part 1: Chromium Kiosk Setup](#part-1-chromium-kiosk-setup)
- [Part 2: Web Server Setup](#part-2-web-server-setup)
- [Part 3: GitHub Actions CI/CD](#part-3-github-actions-cicd)
- [Part 4: Auto-Refresh Configuration](#part-4-auto-refresh-configuration)
- [Testing and Verification](#testing-and-verification)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)
- [Advanced Topics](#advanced-topics)

---

## Overview

This guide implements a simple, learning-friendly CI/CD pipeline:

```
GitHub Push → GitHub Actions Build → SSH Deploy → PM2 Restart → Chromium Refresh
```

**What you'll build:**
- Chromium browser running in fullscreen kiosk mode
- Node.js web server (PM2 + serve) hosting your app
- Automatic deployment from GitHub when you push code
- Auto-refresh functionality to update the display

**Best for:**
- Learning CI/CD fundamentals
- React, Next.js, Vue.js applications
- Local network deployments
- Rapid iteration and testing

---

## Architecture

### System Components

**Display Layer:**
- Chromium browser in kiosk mode
- Fullscreen, no toolbars or decorations
- Displays `http://localhost:3000`

**Application Layer:**
- `serve` - Static file server
- PM2 - Process manager with auto-restart
- Node.js 20 LTS runtime

**Deployment Layer:**
- GitHub Actions - CI/CD automation
- SSH - Secure file transfer
- sshpass - Non-interactive authentication

**System Layer:**
- systemd - Kiosk service management
- X11 - Display server
- xdotool - Browser automation

### File Structure on Raspberry Pi

```
/home/pi/
├── app/                    # Deployed application files
│   ├── index.html
│   ├── assets/
│   └── ...
├── .xinitrc               # X session configuration (launches kiosk)
├── .bash_profile          # Auto-start X on login
└── .pm2/                  # PM2 configuration
```

---

## Prerequisites

### Raspberry Pi Requirements

- Raspberry Pi 4 Model B (2GB+ RAM recommended)
- **Raspberry Pi OS Lite** (64-bit) - No desktop environment needed!
- Network connection (Ethernet or WiFi)
- Display connected via HDMI
- SSH enabled

**Important:** We'll install only the minimal X server components needed for Chromium. This keeps boot times fast and system resources low.

### GitHub Requirements

- GitHub account
- Repository with your web application
- Access to repository settings (for secrets)

### Development Requirements

- Basic understanding of Git and GitHub
- Node.js project with build script (`npm run build`)
- Knowledge of command line and SSH

---

## Part 1: Chromium Kiosk Setup

### Step 1.1: Install Minimal X Server and Chromium

**Important:** For fastest boot times, we'll install only the minimal X11 components needed, without a full desktop environment.

SSH into your Raspberry Pi and install:

```bash
sudo apt update

# Install minimal X server (no desktop environment)
sudo apt install -y --no-install-recommends xserver-xorg xinit

# Install Chromium and utilities
sudo apt install -y chromium-browser x11-xserver-utils unclutter

# Optional: Install a lightweight window manager (helps with window management)
sudo apt install -y --no-install-recommends openbox
```

**What these packages do:**
- `xserver-xorg` - Minimal X11 server (no desktop environment)
- `xinit` - X initialization tools (startx command)
- `chromium-browser` - Web browser with kiosk mode support
- `x11-xserver-utils` - X11 utilities (xset for display power management)
- `unclutter` - Hides mouse cursor after inactivity
- `openbox` - Lightweight window manager (optional, only 1-2MB)

**Why this matters:**
- Full desktop (LXDE/GNOME): ~500MB RAM, 30-60s boot time
- Minimal X11 setup: ~150MB RAM, 10-20s boot time
- Boot time improvement: **2-3x faster!**

### Step 1.2: Configure Auto-login to Console

Configure the Pi to auto-login to console (not graphical desktop):

```bash
sudo raspi-config nonint do_boot_behaviour B2
```

This sets the Pi to boot to console with auto-login as user `pi`.

### Step 1.3: Create .xinitrc for X Session

Create `.xinitrc` to configure what runs when X starts:

```bash
cat > /home/pi/.xinitrc << 'EOF'
#!/bin/bash

# Disable screen blanking and power management
xset s off
xset -dpms
xset s noblank

# Hide mouse cursor after 0.5 seconds
unclutter -idle 0.5 -root &

# Start lightweight window manager (helps with window behavior)
openbox &

# Launch Chromium in kiosk mode
chromium-browser \
  --noerrdialogs \
  --disable-infobars \
  --kiosk \
  --disable-session-crashed-bubble \
  --disable-restore-session-state \
  --disable-component-update \
  --disable-background-timer-throttling \
  --disable-backgrounding-occluded-windows \
  --disable-renderer-backgrounding \
  --app=http://localhost:3000
EOF

chmod +x /home/pi/.xinitrc
```

### Step 1.4: Auto-start X Server on Login

Configure bash to automatically start X server when logging in:

```bash
cat >> /home/pi/.bash_profile << 'EOF'

# Auto-start X server on tty1 (first virtual terminal)
if [ -z "$DISPLAY" ] && [ "$(tty)" = "/dev/tty1" ]; then
    startx -- -nocursor
fi
EOF
```

**How this works:**
1. Pi boots to console and auto-logs in as `pi`
2. `.bash_profile` detects we're on tty1 (main console)
3. Runs `startx` which starts minimal X server
4. X server reads `.xinitrc` and launches Chromium kiosk
5. Total time: **10-20 seconds from power-on to browser!**

**Chromium flags explained:**
- `--noerrdialogs` - Suppress error dialogs
- `--disable-infobars` - Hide info bars (e.g., "Chrome is being controlled")
- `--kiosk` - Launch in fullscreen kiosk mode
- `--disable-session-crashed-bubble` - Don't show crash recovery dialog
- `--disable-restore-session-state` - Always start fresh
- `--disable-component-update` - Don't auto-update components
- `--app=URL` - Launch as app mode for specified URL

### Step 1.5: Verify X Configuration (Don't Start Yet)

You can test the configuration after setting up the web server:

```bash
# Don't run this yet - wait until web server is ready
# startx
```

---

## Part 2: Web Server Setup

### Step 2.1: Install Node.js 20 LTS

Install Node.js using the official NodeSource repository:

```bash
# Download and run the Node.js 20 setup script
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### Step 2.2: Install PM2 Process Manager

PM2 is a production-grade process manager for Node.js applications:

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
```

### Step 2.3: Install Serve Static File Server

Install `serve` to host static files:

```bash
sudo npm install -g serve
```

### Step 2.4: Create App Directory

Create the directory where your application files will be deployed:

```bash
mkdir -p /home/pi/app
```

Create a temporary test page:

```bash
cat > /home/pi/app/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kiosk Test Page</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            color: white;
        }
        .container {
            text-align: center;
            padding: 2rem;
        }
        h1 {
            font-size: 4rem;
            margin: 0 0 1rem 0;
        }
        p {
            font-size: 1.5rem;
            opacity: 0.9;
        }
        .status {
            margin-top: 2rem;
            padding: 1rem 2rem;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            font-size: 1.2rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Kiosk is Running!</h1>
        <p>Your Chromium kiosk is successfully configured.</p>
        <div class="status">
            <div>Time: <span id="time"></span></div>
        </div>
    </div>
    <script>
        function updateTime() {
            document.getElementById('time').textContent = new Date().toLocaleTimeString();
        }
        updateTime();
        setInterval(updateTime, 1000);
    </script>
</body>
</html>
EOF
```

### Step 2.5: Configure PM2

Start the web server with PM2:

```bash
# Start serve on port 3000, serving files from /home/pi/app
pm2 start serve --name "kiosk-app" -- /home/pi/app -p 3000 -s

# Save PM2 configuration
pm2 save

# Configure PM2 to start on boot
pm2 startup systemd -u pi --hp /home/pi
```

**Important:** PM2 will output a command like:
```
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u pi --hp /home/pi
```

Copy and run this command to enable PM2 on boot.

### Step 2.6: Verify Web Server

Test that the web server is running:

```bash
# Check PM2 status
pm2 status

# Test with curl
curl http://localhost:3000

# Check PM2 logs
pm2 logs kiosk-app --lines 20
```

You should see the HTML content of your test page.

---

## Part 3: GitHub Actions CI/CD

### Step 3.1: Configure GitHub Secrets

Navigate to your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add the following secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `PI_HOST` | `192.168.1.137` | Raspberry Pi IP address |
| `PI_USER` | `pi` | SSH username |
| `PI_PASSWORD` | `root` | SSH password |
| `PI_PORT` | `22` | SSH port (default) |

**Security Note:** For production, use SSH keys instead of passwords.

### Step 3.2: Create GitHub Actions Workflow

In your repository, create the workflow file:

**File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to Raspberry Pi Kiosk

on:
  push:
    branches:
      - main  # Change to 'master' if that's your default branch
  workflow_dispatch:  # Allow manual trigger from Actions tab

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build
        # This creates a 'dist' folder (Vite/React) or 'out' folder (Next.js)
        # Adjust based on your framework

      - name: Deploy to Raspberry Pi
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.PI_HOST }}
          username: ${{ secrets.PI_USER }}
          password: ${{ secrets.PI_PASSWORD }}
          port: ${{ secrets.PI_PORT }}
          source: "dist/*"  # Change to "out/*" for Next.js
          target: "/home/pi/app/"
          strip_components: 1  # Remove 'dist' folder from path
          rm: true  # Remove old files before deploying

      - name: Restart web server
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.PI_HOST }}
          username: ${{ secrets.PI_USER }}
          password: ${{ secrets.PI_PASSWORD }}
          port: ${{ secrets.PI_PORT }}
          script: |
            pm2 restart kiosk-app || pm2 start serve --name "kiosk-app" -- /home/pi/app -p 3000 -s
            pm2 save
```

### Step 3.3: Adjust for Your Framework

**For Vite/React (creates `dist/` folder):**
```yaml
source: "dist/*"
```

**For Next.js with static export (creates `out/` folder):**
```yaml
source: "out/*"
```

**For Create React App (creates `build/` folder):**
```yaml
source: "build/*"
```

### Step 3.4: Test Deployment

Commit and push your workflow file:

```bash
git add .github/workflows/deploy.yml
git commit -m "Add CI/CD deployment workflow"
git push origin main
```

Go to your repository on GitHub → **Actions** tab to watch the deployment.

---

## Part 4: Auto-Refresh Configuration

### Step 4.1: Install xdotool

Install xdotool for browser automation:

```bash
sudo apt install -y xdotool
```

### Step 4.2: Add Refresh Step to Workflow

Update your GitHub Actions workflow to include auto-refresh:

Add this step after the "Restart web server" step:

```yaml
      - name: Refresh Chromium
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.PI_HOST }}
          username: ${{ secrets.PI_USER }}
          password: ${{ secrets.PI_PASSWORD }}
          port: ${{ secrets.PI_PORT }}
          script: |
            export DISPLAY=:0
            xdotool search --class chromium windowactivate --sync key --clearmodifiers F5
```

**How it works:**
- `export DISPLAY=:0` - Target the main display
- `xdotool search --class chromium` - Find Chromium window
- `windowactivate --sync` - Focus the window
- `key --clearmodifiers F5` - Press F5 to refresh

### Step 4.3: Alternative: WebSocket Live Reload

For more advanced setups, you can implement WebSocket-based live reload:

**Add to your HTML (in the `<head>` section):**

```html
<script>
  // Connect to a WebSocket server that notifies on deployment
  const ws = new WebSocket('ws://localhost:3001');
  ws.onmessage = () => location.reload();
</script>
```

**Create a simple WebSocket server:**

```bash
npm install -g ws
```

This approach is more complex but provides instant reload without simulating keypresses.

---

## Testing and Verification

### Test 1: Manual Chromium Launch

Test the kiosk script manually:

```bash
# From SSH session
DISPLAY=:0 /home/pi/kiosk.sh
```

Chromium should launch in fullscreen on the connected display.

### Test 2: Web Server Response

Test the web server:

```bash
curl http://localhost:3000
```

Should return your HTML content.

### Test 3: PM2 Status

Check PM2 process status:

```bash
pm2 status
pm2 logs kiosk-app --lines 50
```

### Test 4: X Server and Kiosk Launch

Test launching X and the kiosk manually:

```bash
# From SSH, this will start X on the display
startx -- -nocursor
```

The kiosk should launch on the connected display. To stop, switch to a virtual terminal (Ctrl+Alt+F2 from the Pi keyboard) and run:

```bash
pkill X
```

### Test 5: Full System Reboot

Test that everything starts automatically:

```bash
sudo reboot
```

After reboot:
1. Pi boots to console and auto-logs in
2. X server starts automatically
3. Chromium launches in kiosk mode
4. Web server is running (`pm2 status` from SSH)
5. Your app is visible on the display

### Test 6: Deployment

Make a change to your application:

```bash
# Edit your index.html or source files
git add .
git commit -m "Test deployment"
git push origin main
```

Go to GitHub → Actions and watch the workflow:
1. Build should complete successfully
2. Files should deploy to Raspberry Pi
3. Chromium should refresh (if auto-refresh is configured)

---

## Troubleshooting

### Chromium Won't Start

**Symptom:** After boot, Chromium doesn't appear on display

**Solutions:**

1. Check if X server is running:
```bash
ps aux | grep X
# Should show something like: /usr/lib/xorg/Xorg :0
```

2. Check if you're logged in and on tty1:
```bash
tty
# Should show: /dev/tty1
```

3. Verify .bash_profile configuration:
```bash
cat ~/.bash_profile
# Should contain the startx auto-launch code
```

4. Check .xinitrc exists and is executable:
```bash
ls -la ~/.xinitrc
# Should show: -rwxr-xr-x
```

5. Test manual launch:
```bash
startx -- -nocursor
```

6. Check X server logs:
```bash
cat ~/.local/share/xorg/Xorg.0.log
# Look for errors
```

### Connection Refused on localhost:3000

**Symptom:** `curl: (7) Failed to connect to localhost port 3000`

**Solutions:**

1. Check PM2 status:
```bash
pm2 status
pm2 logs kiosk-app
```

2. Restart PM2:
```bash
pm2 restart kiosk-app
```

3. Verify serve is installed:
```bash
which serve
```

4. Check if port 3000 is in use:
```bash
sudo lsof -i :3000
```

### GitHub Actions Deployment Fails

**Symptom:** Deployment step fails with SSH error

**Solutions:**

1. Verify GitHub secrets are set correctly
2. Test SSH connection manually:
```bash
ssh pi@192.168.1.137
```

3. Check GitHub Actions logs for specific error
4. Verify Pi is accessible from internet (if deploying from GitHub hosted runners)

### App Not Updating After Deployment

**Symptom:** Old content still shows after successful deployment

**Solutions:**

1. Check deployed files:
```bash
ls -la /home/pi/app/
```

2. Clear browser cache by adding flags to kiosk.sh:
```bash
--disable-application-cache \
--disable-cache \
```

3. Force hard refresh:
```bash
export DISPLAY=:0
xdotool key Ctrl+Shift+R
```

4. Restart X server and kiosk:
```bash
# Kill X server (it will restart due to .bash_profile)
pkill X
# Or logout and login again to trigger .bash_profile
```

### Chromium Displays Old Content

**Symptom:** Browser shows cached version of site

**Solutions:**

1. Modify kiosk.sh to disable cache:
```bash
chromium-browser \
  --disable-application-cache \
  --disable-cache \
  --disk-cache-size=1 \
  ...other flags...
```

2. Add cache-control headers to your app
3. Use xdotool to force hard refresh (Ctrl+Shift+R)

### PM2 Not Starting on Boot

**Symptom:** After reboot, PM2 process not running

**Solutions:**

1. Run PM2 startup command again:
```bash
pm2 startup systemd -u pi --hp /home/pi
# Copy and run the outputted command
```

2. Verify PM2 is saved:
```bash
pm2 save
```

3. Check systemd status:
```bash
systemctl status pm2-pi.service
```

### Display Goes to Sleep

**Symptom:** Screen blanks after period of inactivity

**Solutions:**

1. Verify xset commands in kiosk.sh
2. Add to `/boot/config.txt`:
```bash
# Disable HDMI blanking
hdmi_blanking=1
```

3. Edit `/etc/lightdm/lightdm.conf`:
```bash
[Seat:*]
xserver-command=X -s 0 -dpms
```

---

## Security Considerations

### Current Setup (Learning)

The current setup uses:
- ✅ Simple password authentication
- ✅ Secrets stored in GitHub
- ✅ No SSL (localhost only)
- ⚠️ Password in plaintext in GitHub secrets
- ⚠️ No firewall rules

**This is acceptable for:**
- Learning and development
- Local network only
- Trusted environment

### Production Improvements

For production deployments, implement these security measures:

#### 1. Use SSH Key Authentication

Generate SSH key on GitHub Actions runner:

```yaml
- name: Setup SSH key
  run: |
    mkdir -p ~/.ssh
    echo "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/id_rsa
    chmod 600 ~/.ssh/id_rsa
```

Remove password-based authentication from Raspberry Pi:

```bash
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
sudo systemctl restart ssh
```

#### 2. Set Up Firewall

Configure UFW (Uncomplicated Firewall):

```bash
# Install UFW
sudo apt install ufw

# Allow SSH
sudo ufw allow 22/tcp

# Allow from local network only
sudo ufw allow from 192.168.1.0/24

# Enable firewall
sudo ufw enable
```

#### 3. Create Dedicated Deploy User

Don't use the `pi` user for deployments:

```bash
# Create deploy user
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG www-data deploy

# Set up SSH key for deploy user
sudo mkdir -p /home/deploy/.ssh
sudo nano /home/deploy/.ssh/authorized_keys
# Paste public key
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

#### 4. Use GitHub Deploy Keys

Instead of storing private keys in secrets:

1. Generate deploy key:
```bash
ssh-keygen -t ed25519 -C "deploy@raspberrypi"
```

2. Add public key to `~/.ssh/authorized_keys` on Pi
3. Add private key to GitHub repository deploy keys
4. Restrict to read-only if possible

#### 5. Add HTTPS Support

For internal network HTTPS:

```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /home/pi/selfsigned.key \
  -out /home/pi/selfsigned.crt

# Use with serve
pm2 delete kiosk-app
pm2 start serve --name "kiosk-app" -- /home/pi/app \
  -p 3000 --ssl-cert /home/pi/selfsigned.crt \
  --ssl-key /home/pi/selfsigned.key
pm2 save
```

Update kiosk.sh to use `https://localhost:3000`.

#### 6. Implement Health Checks

Add a health check endpoint:

```bash
# Create health check script
cat > /home/pi/health-check.sh << 'EOF'
#!/bin/bash
if ! curl -f http://localhost:3000 > /dev/null 2>&1; then
  echo "Web server down, restarting..."
  pm2 restart kiosk-app
fi
EOF

chmod +x /home/pi/health-check.sh

# Add to crontab (run every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/pi/health-check.sh") | crontab -
```

#### 7. Log Rotation

Configure PM2 log rotation:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## Advanced Topics

### Docker-Based Deployment

For a more robust setup, consider using Docker:

**Benefits:**
- Cleaner separation of concerns
- Easier rollback
- No dependency conflicts
- Industry standard

**Basic Docker setup:**

1. Create Dockerfile:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
RUN npm install -g serve
CMD ["serve", "-s", "dist", "-l", "3000"]
```

2. Build and push to Docker Hub in GitHub Actions
3. Use Watchtower on Pi to auto-pull new images

### Multiple Environments

Deploy to different environments:

```yaml
on:
  push:
    branches:
      - main      # Production
      - staging   # Staging
      - develop   # Development
```

Use different secrets for each environment.

### Monitoring and Alerts

Set up monitoring with:

- **Uptime Kuma** - Self-hosted monitoring
- **Prometheus + Grafana** - Metrics and dashboards
- **Slack/Discord webhooks** - Deployment notifications

### Content Management

For non-developers to update content:

- **NetlifyCMS** - Git-based CMS
- **Strapi** - Headless CMS
- **WordPress** - Traditional CMS with REST API

### Load Balancing Multiple Displays

For multiple kiosk displays:

1. Set up multiple Raspberry Pis
2. Use Ansible for configuration management
3. Deploy to all nodes simultaneously
4. Centralized monitoring dashboard

---

## Reference: Complete File Listings

### /home/pi/.xinitrc

```bash
#!/bin/bash

# Disable screen blanking and power management
xset s off
xset -dpms
xset s noblank

# Hide mouse cursor after 0.5 seconds
unclutter -idle 0.5 -root &

# Start lightweight window manager
openbox &

# Launch Chromium in kiosk mode
chromium-browser \
  --noerrdialogs \
  --disable-infobars \
  --kiosk \
  --disable-session-crashed-bubble \
  --disable-restore-session-state \
  --disable-component-update \
  --disable-background-timer-throttling \
  --disable-backgrounding-occluded-windows \
  --disable-renderer-backgrounding \
  --app=http://localhost:3000
```

### /home/pi/.bash_profile (appended)

```bash
# Auto-start X server on tty1 (first virtual terminal)
if [ -z "$DISPLAY" ] && [ "$(tty)" = "/dev/tty1" ]; then
    startx -- -nocursor
fi
```

### Complete GitHub Actions Workflow

See `examples/github-workflow.yml` in this repository for the complete, copy-paste ready workflow file.

---

## Next Steps

After completing this setup:

1. ✅ Test with a simple HTML page
2. ✅ Deploy a React/Vite application
3. ✅ Configure auto-refresh
4. 🔄 Implement health monitoring
5. 🔄 Set up alerts for failed deployments
6. 🔄 Add staging environment
7. 🔄 Explore Docker-based deployment
8. 🔄 Implement proper security measures

---

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Chromium Command Line Switches](https://peter.sh/experiments/chromium-command-line-switches/)
- [Raspberry Pi Kiosk Guide](https://reelyactive.github.io/diy/pi-kiosk/)
- [systemd Service Documentation](https://www.freedesktop.org/software/systemd/man/systemd.service.html)

---

**Last Updated:** January 21, 2026
**Platform:** Raspberry Pi 4 Model B
**OS:** Raspberry Pi OS (Debian 13 - trixie)
**Node.js:** 20.x LTS
