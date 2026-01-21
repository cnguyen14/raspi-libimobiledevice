#!/bin/bash
# Configure Raspberry Pi as WiFi Access Point
# Run as: sudo ./setup-ap-mode.sh

set -e

AP_SSID="${AP_SSID:-RaspberryPi-iOS}"
AP_PASSWORD="${AP_PASSWORD:-raspberry123}"
AP_CHANNEL="${AP_CHANNEL:-7}"
AP_IP="192.168.50.1"

echo "========================================="
echo "Configuring WiFi Access Point Mode"
echo "========================================="
echo "SSID: $AP_SSID"
echo "Password: $AP_PASSWORD"
echo "IP: $AP_IP"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Error: This script must be run as root (use sudo)"
    exit 1
fi

# Install required packages
echo "Installing hostapd and dnsmasq..."
apt update
apt install -y hostapd dnsmasq

# Stop services for configuration
systemctl stop hostapd
systemctl stop dnsmasq

# Configure static IP for wlan0
echo "Configuring static IP..."
cat > /etc/dhcpcd.conf.ap << EOF
# AP Mode Configuration
interface wlan0
    static ip_address=$AP_IP/24
    nohook wpa_supplicant
EOF

# Backup original dhcpcd.conf if not already backed up
if [ ! -f /etc/dhcpcd.conf.backup ]; then
    cp /etc/dhcpcd.conf /etc/dhcpcd.conf.backup
fi

# Configure dnsmasq
echo "Configuring DHCP server..."
cat > /etc/dnsmasq.conf.ap << EOF
# AP Mode DHCP Configuration
interface=wlan0
dhcp-range=192.168.50.10,192.168.50.100,255.255.255.0,24h
domain=local
address=/raspberrypi.local/$AP_IP
EOF

# Backup original dnsmasq.conf if not already backed up
if [ ! -f /etc/dnsmasq.conf.backup ]; then
    cp /etc/dnsmasq.conf /etc/dnsmasq.conf.backup 2>/dev/null || true
fi

# Configure hostapd
echo "Configuring Access Point..."
cat > /etc/hostapd/hostapd.conf.ap << EOF
# AP Mode Configuration
interface=wlan0
driver=nl80211
ssid=$AP_SSID
hw_mode=g
channel=$AP_CHANNEL
wmm_enabled=0
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_passphrase=$AP_PASSWORD
wpa_key_mgmt=WPA-PSK
wpa_pairwise=TKIP
rsn_pairwise=CCMP
EOF

# Backup original hostapd.conf if not already backed up
if [ ! -f /etc/hostapd/hostapd.conf.backup ]; then
    cp /etc/hostapd/hostapd.conf /etc/hostapd/hostapd.conf.backup 2>/dev/null || true
fi

# Point hostapd to our config
sed -i 's|#DAEMON_CONF=""|DAEMON_CONF="/etc/hostapd/hostapd.conf.ap"|' /etc/default/hostapd 2>/dev/null || \
    echo 'DAEMON_CONF="/etc/hostapd/hostapd.conf.ap"' >> /etc/default/hostapd

# Enable IP forwarding
echo "Enabling IP forwarding..."
sed -i 's/#net.ipv4.ip_forward=1/net.ipv4.ip_forward=1/' /etc/sysctl.conf
sysctl -w net.ipv4.ip_forward=1

# Configure NAT (if eth0 available for internet sharing)
echo "Configuring NAT..."
iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE || true
iptables-save > /etc/iptables.ipv4.nat

# Make iptables rules persistent
cat > /etc/rc.local << 'EOF'
#!/bin/sh -e
iptables-restore < /etc/iptables.ipv4.nat
exit 0
EOF
chmod +x /etc/rc.local

echo ""
echo "========================================="
echo "AP Mode configuration complete!"
echo "========================================="
echo ""
echo "To activate AP mode, run:"
echo "  sudo ./switch-mode.sh ap"
