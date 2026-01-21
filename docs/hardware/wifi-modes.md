# WiFi Mode Switching Guide

Comprehensive guide for configuring and switching between Access Point and Client WiFi modes on Raspberry Pi.

## Overview

The Raspberry Pi iOS Bridge supports two WiFi modes:

| Mode | Purpose | Use Case | Internet | IP Address |
|------|---------|----------|----------|------------|
| **AP (Access Point)** | Portable hotspot | Offline/field use | No | 192.168.50.1 (static) |
| **Client** | Home network | Online sync | Yes | DHCP assigned |

## Mode Comparison

### AP Mode (Access Point)
**Purpose:** Create a portable WiFi hotspot for direct device-to-Pi communication

**Characteristics:**
- Pi creates WiFi network `RaspberryPi-iOS`
- Mobile devices connect directly to Pi
- No internet required
- Fixed IP: `192.168.50.1`
- DHCP range: `192.168.50.10` - `192.168.50.100`

**When to Use:**
- Field operations without WiFi
- Portable/mobile deployment
- Offline data collection
- Demo environments

**Services:**
- `hostapd` - Access point daemon
- `dnsmasq` - DHCP and DNS server

### Client Mode
**Purpose:** Connect to existing WiFi network for internet access and backend sync

**Characteristics:**
- Pi connects to home/office WiFi
- Internet connectivity
- DHCP assigned IP
- Can sync to backend server

**When to Use:**
- Home/office deployment
- Backend data synchronization
- Remote access via SSH
- Software updates

**Services:**
- `wpa_supplicant` - WiFi client
- `dhcpcd` - DHCP client

---

## Initial Setup

### Configure AP Mode

```bash
cd ~/raspi-ios-bridge/pi-setup/network
sudo ./setup-ap-mode.sh
```

**Configuration:**
- SSID: `RaspberryPi-iOS` (customizable via `AP_SSID` env var)
- Password: `raspberry123` (customizable via `AP_PASSWORD` env var)
- Channel: 7 (customizable via `AP_CHANNEL` env var)
- IP: `192.168.50.1`

**Custom Configuration:**
```bash
AP_SSID="MyPiHotspot" AP_PASSWORD="mypassword123" sudo ./setup-ap-mode.sh
```

**Files Created:**
- `/etc/hostapd/hostapd.conf.ap` - hostapd configuration
- `/etc/dnsmasq.conf.ap` - DHCP server configuration
- `/etc/dhcpcd.conf.ap` - Static IP configuration

### Configure Client Mode

```bash
cd ~/raspi-ios-bridge/pi-setup/network

# Interactive prompt
sudo ./setup-client-mode.sh

# Or provide credentials directly
sudo ./setup-client-mode.sh "YourWiFiSSID" "YourWiFiPassword"
```

**Files Created:**
- `/etc/wpa_supplicant/wpa_supplicant.conf.client` - WiFi credentials
- `/etc/dhcpcd.conf.client` - DHCP client configuration

---

## Switching Modes

### Switch to AP Mode

```bash
cd ~/raspi-ios-bridge/pi-setup/network
sudo ./switch-mode.sh ap
```

**What Happens:**
1. Stops all network services
2. Copies AP configuration files
3. Disables `wpa_supplicant`
4. Enables and starts `hostapd` and `dnsmasq`
5. Assigns static IP `192.168.50.1` to `wlan0`

**Expected Output:**
```
=========================================
AP Mode Activated!
=========================================
SSID: RaspberryPi-iOS
IP Address: 192.168.50.1

Connect your mobile device to this WiFi network
Pi API available at: http://192.168.50.1:3000
```

**Verification:**
```bash
# Check services
systemctl status hostapd
systemctl status dnsmasq

# Check IP address
ip addr show wlan0 | grep "inet "
# Should show: inet 192.168.50.1/24

# Check SSID is broadcasting
iwconfig wlan0 | grep ESSID
```

### Switch to Client Mode

```bash
cd ~/raspi-ios-bridge/pi-setup/network
sudo ./switch-mode.sh client
```

**What Happens:**
1. Stops all network services
2. Copies client configuration files
3. Disables `hostapd` and `dnsmasq`
4. Enables and starts `wpa_supplicant`
5. Obtains IP via DHCP

**Expected Output:**
```
=========================================
Client Mode Activated!
=========================================
Connected to: YourWiFiSSID
IP Address: 192.168.1.145

Pi API available at: http://192.168.1.145:3000
SSH access: ssh pi@192.168.1.145
```

**Verification:**
```bash
# Check services
systemctl status wpa_supplicant

# Check IP address
ip addr show wlan0 | grep "inet "

# Check connection
iwconfig wlan0 | grep ESSID

# Test internet
ping -c 3 8.8.8.8
```

---

## Troubleshooting

### AP Mode Issues

#### SSID Not Broadcasting

**Check hostapd status:**
```bash
systemctl status hostapd
journalctl -u hostapd -n 50
```

**Common causes:**
1. **Driver issues** - Check `driver=nl80211` in `/etc/hostapd/hostapd.conf.ap`
2. **Channel conflict** - Try different channel: `AP_CHANNEL=11 sudo ./setup-ap-mode.sh`
3. **Interface busy** - Ensure not in client mode: `sudo killall wpa_supplicant`

**Solution:**
```bash
sudo systemctl stop hostapd
sudo systemctl start hostapd
journalctl -u hostapd -f  # Watch for errors
```

#### Clients Can't Get IP Address

**Check dnsmasq:**
```bash
systemctl status dnsmasq
journalctl -u dnsmasq -n 50
```

**Verify DHCP range:**
```bash
cat /etc/dnsmasq.conf | grep dhcp-range
```

**Solution:**
```bash
sudo systemctl restart dnsmasq

# Check leases
cat /var/lib/misc/dnsmasq.leases
```

#### Static IP Not Assigned

**Check dhcpcd configuration:**
```bash
cat /etc/dhcpcd.conf | grep wlan0
```

**Solution:**
```bash
sudo systemctl restart dhcpcd
ip addr show wlan0  # Verify IP
```

### Client Mode Issues

#### Can't Connect to WiFi

**Check wpa_supplicant status:**
```bash
systemctl status wpa_supplicant
journalctl -u wpa_supplicant -n 50
```

**Verify credentials:**
```bash
sudo cat /etc/wpa_supplicant/wpa_supplicant.conf
```

**Test connection manually:**
```bash
sudo wpa_supplicant -i wlan0 -c /etc/wpa_supplicant/wpa_supplicant.conf -d
# Press Ctrl+C to stop
```

**Solution:**
```bash
# Reconfigure with correct credentials
cd ~/raspi-ios-bridge/pi-setup/network
sudo ./setup-client-mode.sh "CorrectSSID" "CorrectPassword"
sudo ./switch-mode.sh client
```

#### No IP Address Obtained

**Check DHCP client:**
```bash
systemctl status dhcpcd
journalctl -u dhcpcd -n 50
```

**Request new lease:**
```bash
sudo dhcpcd -k wlan0  # Release
sudo dhcpcd wlan0     # Renew
```

**Solution:**
```bash
sudo systemctl restart dhcpcd
sleep 5
ip addr show wlan0
```

#### Connected But No Internet

**Check gateway:**
```bash
ip route show
# Should show: default via 192.168.x.1 dev wlan0
```

**Test connectivity:**
```bash
ping -c 3 $(ip route | grep default | awk '{print $3}')  # Ping gateway
ping -c 3 8.8.8.8  # Ping Google DNS
ping -c 3 google.com  # Test DNS resolution
```

**Solution:**
```bash
# Check DNS configuration
cat /etc/resolv.conf

# If missing, add DNS manually
echo "nameserver 8.8.8.8" | sudo tee -a /etc/resolv.conf
```

### General Issues

#### Services Conflict

**Symptoms:** Both modes services running simultaneously

**Solution:**
```bash
# Stop all network services
sudo systemctl stop hostapd dnsmasq wpa_supplicant dhcpcd

# Switch mode cleanly
sudo ./switch-mode.sh [ap|client]
```

#### Lost SSH Connection

**Cause:** Switching modes changes IP address

**Prevention:**
- Always note current mode before switching
- Use serial console for mode switching
- Or add cron job to auto-revert after 5 minutes:

```bash
# Switch to AP mode with auto-revert
sudo ./switch-mode.sh ap && echo "sudo ~/raspi-ios-bridge/pi-setup/network/switch-mode.sh client" | at now + 5 minutes
```

#### Configuration Files Missing

**Symptoms:** `Error: Client mode not configured yet`

**Solution:**
```bash
# Re-run setup scripts
cd ~/raspi-ios-bridge/pi-setup/network
sudo ./setup-ap-mode.sh
sudo ./setup-client-mode.sh "YourSSID" "YourPassword"
```

---

## Advanced Configuration

### Change AP Settings

Edit AP configuration:

```bash
sudo nano /etc/hostapd/hostapd.conf.ap
```

**Key settings:**
```
ssid=RaspberryPi-iOS           # Change SSID
wpa_passphrase=raspberry123     # Change password
channel=7                       # Change channel (1-11)
hw_mode=g                       # 2.4GHz (a=5GHz, g=2.4GHz)
```

After changes:
```bash
sudo ./switch-mode.sh ap  # Apply changes
```

### Change Static IP

Edit DHCP configuration:

```bash
sudo nano /etc/dhcpcd.conf.ap
```

Change:
```
interface wlan0
    static ip_address=192.168.50.1/24  # Your desired IP
```

Update dnsmasq DHCP range:

```bash
sudo nano /etc/dnsmasq.conf.ap
```

Change:
```
dhcp-range=192.168.50.10,192.168.50.100,255.255.255.0,24h
```

### Add Multiple WiFi Networks

Edit client configuration:

```bash
sudo nano /etc/wpa_supplicant/wpa_supplicant.conf.client
```

Add multiple networks:

```
network={
    ssid="HomeWiFi"
    psk="homepassword"
    priority=2
}

network={
    ssid="WorkWiFi"
    psk="workpassword"
    priority=1
}
```

Higher `priority` = preferred network.

### Enable Internet Sharing (AP Mode)

Allow clients connected to AP to access internet via Ethernet:

**Enable IP forwarding:**
```bash
echo 1 | sudo tee /proc/sys/net/ipv4/ip_forward
sudo sed -i 's/#net.ipv4.ip_forward=1/net.ipv4.ip_forward=1/' /etc/sysctl.conf
```

**Configure NAT:**
```bash
sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
sudo iptables -A FORWARD -i eth0 -o wlan0 -m state --state RELATED,ESTABLISHED -j ACCEPT
sudo iptables -A FORWARD -i wlan0 -o eth0 -j ACCEPT

# Save rules
sudo iptables-save | sudo tee /etc/iptables.ipv4.nat
```

**Load on boot:**
```bash
echo "iptables-restore < /etc/iptables.ipv4.nat" | sudo tee -a /etc/rc.local
```

---

## Automation

### Auto-detect Mode on Boot

Create a script that auto-selects mode based on available networks:

```bash
#!/bin/bash
# /usr/local/bin/auto-wifi-mode.sh

KNOWN_SSIDS=("HomeWiFi" "WorkWiFi")

# Scan for known networks
for ssid in "${KNOWN_SSIDS[@]}"; do
    if iwlist wlan0 scan | grep -q "$ssid"; then
        /home/pi/raspi-ios-bridge/pi-setup/network/switch-mode.sh client
        exit 0
    fi
done

# No known networks, use AP mode
/home/pi/raspi-ios-bridge/pi-setup/network/switch-mode.sh ap
```

Make executable and add to cron:

```bash
sudo chmod +x /usr/local/bin/auto-wifi-mode.sh
echo "@reboot /usr/local/bin/auto-wifi-mode.sh" | crontab -
```

---

## Reference

### Configuration File Locations

**AP Mode:**
- `/etc/hostapd/hostapd.conf.ap`
- `/etc/dnsmasq.conf.ap`
- `/etc/dhcpcd.conf.ap`

**Client Mode:**
- `/etc/wpa_supplicant/wpa_supplicant.conf.client`
- `/etc/dhcpcd.conf.client`

**Active (current mode):**
- `/etc/hostapd/hostapd.conf`
- `/etc/dnsmasq.conf`
- `/etc/dhcpcd.conf`
- `/etc/wpa_supplicant/wpa_supplicant.conf`

**Backups:**
- `/etc/dhcpcd.conf.backup`
- `/etc/dnsmasq.conf.backup`
- `/etc/hostapd/hostapd.conf.backup`
- `/etc/wpa_supplicant/wpa_supplicant.conf.backup`

### Useful Commands

```bash
# Network interface info
ifconfig wlan0
ip addr show wlan0
iwconfig wlan0

# WiFi scanning
sudo iwlist wlan0 scan | grep ESSID

# Service management
sudo systemctl [start|stop|restart|status] [hostapd|dnsmasq|wpa_supplicant|dhcpcd]

# Logs
journalctl -u hostapd -f
journalctl -u dnsmasq -f
journalctl -u wpa_supplicant -f

# DHCP leases (AP mode)
cat /var/lib/misc/dnsmasq.leases

# Current connections
iw dev wlan0 station dump  # AP mode clients
```

---

## Next Steps

- Test both modes with mobile device
- Configure API endpoints: [Local API Documentation](../api/local-api.md)
- Set up automated sync (online mode)
