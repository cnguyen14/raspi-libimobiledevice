#!/bin/bash
# Install sudoers configuration for WiFi management

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUDOERS_SOURCE="$SCRIPT_DIR/../../config/sudoers.d/wifi-management"
SUDOERS_DEST="/etc/sudoers.d/wifi-management"

echo "Installing WiFi management sudoers configuration..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Error: This script must be run as root (use sudo)"
  exit 1
fi

# Validate sudoers file syntax before installing
echo "Validating sudoers configuration..."
if ! visudo -cf "$SUDOERS_SOURCE"; then
  echo "Error: Invalid sudoers configuration"
  exit 1
fi

# Copy to /etc/sudoers.d/
echo "Installing to $SUDOERS_DEST..."
cp "$SUDOERS_SOURCE" "$SUDOERS_DEST"

# Set correct permissions (must be 0440)
chmod 0440 "$SUDOERS_DEST"
chown root:root "$SUDOERS_DEST"

echo "✓ WiFi management sudoers configuration installed successfully"
echo ""
echo "The 'pi' user can now run these commands without password:"
echo "  - WiFi scanning (iwlist, iwgetid)"
echo "  - Service management (systemctl for hostapd, dnsmasq, wpa_supplicant)"
echo "  - WiFi management scripts (switch-mode.sh, etc.)"
