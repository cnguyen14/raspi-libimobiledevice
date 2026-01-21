#!/bin/bash
# Install Chromium Kiosk
# Run as: sudo ./install-kiosk.sh

set -e

if [ "$EUID" -ne 0 ]; then
    echo "Error: This script must be run as root (use sudo)"
    exit 1
fi

ORIGINAL_USER="${SUDO_USER:-$USER}"
KIOSK_DIR="$HOME/raspi-ios-bridge/kiosk-app"

echo "========================================="
echo "Installing Chromium Kiosk"
echo "========================================="

# Install required packages
echo "Installing packages..."
apt update
apt install -y chromium-browser x11-xserver-utils unclutter

# Install Node.js 20 if not already installed
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'.' -f1 | tr -d 'v')" -lt "20" ]; then
    echo "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

# Install PM2 globally
echo "Installing PM2..."
npm install -g pm2 serve

# Copy kiosk script
echo "Setting up kiosk script..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp "$SCRIPT_DIR/kiosk.sh" /home/$ORIGINAL_USER/kiosk.sh
chmod +x /home/$ORIGINAL_USER/kiosk.sh
chown $ORIGINAL_USER:$ORIGINAL_USER /home/$ORIGINAL_USER/kiosk.sh

# Copy systemd service
echo "Installing systemd service..."
cp "$SCRIPT_DIR/kiosk.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable kiosk

# Setup PM2 for serving kiosk app
echo "Setting up PM2 for kiosk app..."
su - "$ORIGINAL_USER" -c "cd /home/$ORIGINAL_USER/raspi-ios-bridge/kiosk-app && pm2 start 'npx serve public -l 3000 -s' --name kiosk-app"
su - "$ORIGINAL_USER" -c "pm2 save"
su - "$ORIGINAL_USER" -c "pm2 startup systemd -u $ORIGINAL_USER --hp /home/$ORIGINAL_USER" | tail -1 | bash

echo ""
echo "========================================="
echo "Kiosk Installation Complete!"
echo "========================================="
echo ""
echo "The kiosk will start automatically on boot."
echo ""
echo "Commands:"
echo "  Start kiosk:   sudo systemctl start kiosk"
echo "  Stop kiosk:    sudo systemctl stop kiosk"
echo "  Status:        systemctl status kiosk"
echo "  PM2 status:    pm2 status"
echo ""
echo "Reboot to start the kiosk: sudo reboot"
