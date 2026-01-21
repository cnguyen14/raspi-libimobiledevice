#!/bin/bash
# Master installation script for Raspberry Pi iOS Bridge
# Run as: sudo ./install.sh

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================="
echo "Raspberry Pi iOS Bridge Installer"
echo "========================================="
echo ""
echo "This script will install:"
echo "  1. System dependencies"
echo "  2. libimobiledevice 1.4.0 (from GitHub source)"
echo "  3. usbmuxd daemon with auto-start"
echo "  4. Pi API server (Node.js)"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Installation cancelled."
    exit 1
fi

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Error: This script must be run as root (use sudo)"
    exit 1
fi

# Install dependencies
echo ""
echo "=== Step 1: Installing dependencies ==="
"$SCRIPT_DIR/dependencies.sh"

# Build libimobiledevice
echo ""
echo "=== Step 2: Building libimobiledevice ==="
# Run as the original user, not root
ORIGINAL_USER="${SUDO_USER:-$USER}"
su - "$ORIGINAL_USER" -c "cd '$SCRIPT_DIR/libimobiledevice' && ./build-all.sh"

# Configure usbmuxd
echo ""
echo "=== Step 3: Configuring usbmuxd ==="

# Create usbmux group if doesn't exist
if ! getent group usbmux > /dev/null 2>&1; then
    groupadd -r usbmux
    echo "Created usbmux group"
fi

# Add user to usbmux group
usermod -a -G usbmux "$ORIGINAL_USER"
echo "Added $ORIGINAL_USER to usbmux group"

# Copy udev rules
cp "$SCRIPT_DIR/../config/udev/39-usbmuxd.rules" /etc/udev/rules.d/
udevadm control --reload-rules
udevadm trigger
echo "Installed udev rules"

# Copy systemd service
mkdir -p /etc/systemd/system/usbmuxd.service.d/
cp "$SCRIPT_DIR/../config/systemd/usbmuxd-override.conf" /etc/systemd/system/usbmuxd.service.d/override.conf
systemctl daemon-reload
systemctl enable usbmuxd
systemctl restart usbmuxd
echo "Configured usbmuxd service"

# Install Pi API
echo ""
echo "=== Step 4: Installing Pi API server ==="
PI_API_DIR="$SCRIPT_DIR/../pi-api"
cd "$PI_API_DIR"
su - "$ORIGINAL_USER" -c "cd '$PI_API_DIR' && npm install"

# Copy systemd service for Pi API
cp "$SCRIPT_DIR/../config/systemd/pi-api.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable pi-api
systemctl start pi-api
echo "Pi API server installed and started"

echo ""
echo "========================================="
echo "Installation Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "  1. Logout and login for group membership to take effect"
echo "  2. Plug in an iOS device"
echo "  3. Test with: idevice_id -l"
echo "  4. Check Pi API: curl http://localhost:3000/api/device/info"
echo ""
echo "Services:"
echo "  - usbmuxd: systemctl status usbmuxd"
echo "  - pi-api: systemctl status pi-api"
