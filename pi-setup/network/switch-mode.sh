#!/bin/bash
# Switch between AP and Client WiFi modes
# Run as: sudo ./switch-mode.sh [ap|client]

set -e

MODE="$1"

if [ "$EUID" -ne 0 ]; then
    echo "Error: This script must be run as root (use sudo)"
    exit 1
fi

if [ "$MODE" != "ap" ] && [ "$MODE" != "client" ]; then
    echo "Usage: sudo ./switch-mode.sh [ap|client]"
    echo ""
    echo "Modes:"
    echo "  ap     - Access Point mode (portable hotspot)"
    echo "  client - Client mode (connect to home WiFi)"
    exit 1
fi

echo "========================================="
echo "Switching to $MODE mode"
echo "========================================="

# Stop services
echo "Stopping network services..."
systemctl stop hostapd 2>/dev/null || true
systemctl stop dnsmasq 2>/dev/null || true
systemctl stop dhcpcd 2>/dev/null || true
systemctl stop wpa_supplicant 2>/dev/null || true

if [ "$MODE" = "ap" ]; then
    echo "Activating Access Point mode..."

    # Switch configurations
    cp /etc/dhcpcd.conf.ap /etc/dhcpcd.conf
    cp /etc/dnsmasq.conf.ap /etc/dnsmasq.conf
    cp /etc/hostapd/hostapd.conf.ap /etc/hostapd/hostapd.conf

    # Disable wpa_supplicant
    systemctl disable wpa_supplicant 2>/dev/null || true

    # Enable and start AP services
    systemctl unmask hostapd
    systemctl enable hostapd
    systemctl enable dnsmasq
    systemctl start dhcpcd
    sleep 2
    systemctl start dnsmasq
    systemctl start hostapd

    echo ""
    echo "========================================="
    echo "AP Mode Activated!"
    echo "========================================="
    echo "SSID: $(grep '^ssid=' /etc/hostapd/hostapd.conf | cut -d'=' -f2)"
    echo "IP Address: $(grep 'static ip_address=' /etc/dhcpcd.conf | cut -d'=' -f2 | cut -d'/' -f1)"
    echo ""
    echo "Connect your mobile device to this WiFi network"
    echo "Pi API available at: http://$(grep 'static ip_address=' /etc/dhcpcd.conf | cut -d'=' -f2 | cut -d'/' -f1):3000"

elif [ "$MODE" = "client" ]; then
    echo "Activating Client mode..."

    # Check if client configuration exists
    if [ ! -f /etc/wpa_supplicant/wpa_supplicant.conf.client ]; then
        echo "Error: Client mode not configured yet"
        echo "Run: sudo ./setup-client-mode.sh [SSID] [PASSWORD]"
        exit 1
    fi

    # Switch configurations
    cp /etc/dhcpcd.conf.client /etc/dhcpcd.conf
    cp /etc/wpa_supplicant/wpa_supplicant.conf.client /etc/wpa_supplicant/wpa_supplicant.conf

    # Disable AP services
    systemctl disable hostapd 2>/dev/null || true
    systemctl disable dnsmasq 2>/dev/null || true

    # Enable and start client services
    systemctl enable wpa_supplicant
    systemctl start dhcpcd
    sleep 2
    systemctl start wpa_supplicant

    # Wait for connection
    echo "Waiting for WiFi connection..."
    sleep 5

    IP_ADDR=$(ip -4 addr show wlan0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}' || echo "No IP assigned")

    echo ""
    echo "========================================="
    echo "Client Mode Activated!"
    echo "========================================="
    echo "Connected to: $(grep 'ssid=' /etc/wpa_supplicant/wpa_supplicant.conf | head -1 | cut -d'"' -f2)"
    echo "IP Address: $IP_ADDR"
    echo ""
    if [ "$IP_ADDR" != "No IP assigned" ]; then
        echo "Pi API available at: http://$IP_ADDR:3000"
        echo "SSH access: ssh pi@$IP_ADDR"
    else
        echo "Warning: No IP address assigned. Check WiFi credentials."
    fi
fi

echo ""
echo "Checking services..."
systemctl --no-pager status dhcpcd | grep Active || true
if [ "$MODE" = "ap" ]; then
    systemctl --no-pager status hostapd | grep Active || true
    systemctl --no-pager status dnsmasq | grep Active || true
else
    systemctl --no-pager status wpa_supplicant | grep Active || true
fi

echo ""
echo "Current network status:"
ip addr show wlan0 | grep "inet " || echo "No IP address assigned"
