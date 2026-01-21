# Raspberry Pi iOS Bridge - Kiosk App

Chromium kiosk display application that runs fullscreen on the Raspberry Pi 4.

## Features

- Fullscreen Chromium display
- Auto-refresh on deployment
- Displays iOS device information
- PM2 process management

## Development

```bash
# Start development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

## Deployment

The kiosk app automatically deploys when you push to GitHub (via GitHub Actions).

### GitHub Actions Setup

1. Add these secrets to your GitHub repository:
   - `PI_HOST`: Raspberry Pi IP address (e.g., 192.168.1.137)
   - `PI_USER`: SSH username (e.g., pi)
   - `PI_PASSWORD`: SSH password

2. Push to the `main` branch to trigger deployment

### Manual Deployment

```bash
# SSH into Pi
ssh pi@192.168.1.137

# Navigate to kiosk app
cd ~/raspi-ios-bridge/kiosk-app

# Pull latest changes
git pull

# Restart PM2
pm2 restart kiosk-app

# Refresh Chromium (if running)
DISPLAY=:0 xdotool key F5
```

## Kiosk Service

The kiosk starts automatically on boot via systemd service:

```bash
# Check status
systemctl status kiosk

# Restart kiosk
sudo systemctl restart kiosk

# View logs
journalctl -u kiosk -f
```

## Directory Structure

```
kiosk-app/
├── public/           # Static files served by kiosk
│   └── index.html    # Main kiosk display page
├── .github/
│   └── workflows/    # GitHub Actions deployment
└── package.json      # Dependencies and scripts
```
