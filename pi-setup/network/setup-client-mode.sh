#!/bin/bash
# Configure Raspberry Pi WiFi Client Mode
# Run as: sudo ./setup-client-mode.sh [SSID] [PASSWORD]

set -e

if [ "$EUID" -ne 0 ]; then
    echo "Error: This script must be run as root (use sudo)"
    exit 1
fi

# Get WiFi credentials
if [ -n "$1" ] && [ -n "$2" ]; then
    WIFI_SSID="$1"
    WIFI_PASSWORD="$2"
else
    echo "========================================="
    echo "Configure WiFi Client Mode"
    echo "========================================="
    read -p "Enter WiFi SSID: " WIFI_SSID
    read -sp "Enter WiFi Password: " WIFI_PASSWORD
    echo ""
fi

echo ""
echo "Configuring client mode for: $WIFI_SSID"

# Create wpa_supplicant configuration
echo "Creating WiFi configuration..."
cat > /etc/wpa_supplicant/wpa_supplicant.conf.client << EOF
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
country=US

network={
    ssid="$WIFI_SSID"
    psk="$WIFI_PASSWORD"
    key_mgmt=WPA-PSK
}
EOF

# Backup original wpa_supplicant.conf if not already backed up
if [ ! -f /etc/wpa_supplicant/wpa_supplicant.conf.backup ]; then
    cp /etc/wpa_supplicant/wpa_supplicant.conf /etc/wpa_supplicant/wpa_supplicant.conf.backup 2>/dev/null || true
fi

# Create DHCP dhcpcd configuration for client mode
cat > /etc/dhcpcd.conf.client << EOF
# Client Mode Configuration
# Use DHCP for wlan0
interface wlan0
EOF

echo ""
echo "========================================="
echo "Client Mode configuration complete!"
echo "========================================="
echo ""
echo "To activate client mode, run:"
echo "  sudo ./switch-mode.sh client"
