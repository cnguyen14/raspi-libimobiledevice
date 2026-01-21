# WiFi Management API

REST API endpoints for managing Raspberry Pi WiFi modes (AP/Client) and network scanning.

## Overview

The WiFi API allows you to:
- Check current WiFi mode and status
- Scan for available networks
- Switch between AP mode (offline hotspot) and Client mode (connect to WiFi)
- Manage saved networks

**⚠️ Warning:** Switching WiFi modes will disconnect SSH. Always know how to reconnect!

---

## Endpoints

### GET /api/wifi/status

Get current WiFi mode and connection status.

**Response:**
```json
{
  "success": true,
  "mode": "client",
  "ipAddress": "192.168.1.137",
  "connectedSsid": "HomeWiFi",
  "interface": "wlan0"
}
```

**Mode values:**
- `ap` - Access Point mode (hotspot)
- `client` - Client mode (connected to WiFi)
- `unknown` - Cannot determine mode

**Example:**
```bash
curl http://192.168.1.137:3000/api/wifi/status
```

---

### GET /api/wifi/scan

Scan for available WiFi networks.

**Response:**
```json
{
  "success": true,
  "networks": [
    {
      "ssid": "HomeWiFi",
      "quality": 70,
      "maxQuality": 70,
      "qualityPercent": 100,
      "signalLevel": -30,
      "encrypted": true
    },
    {
      "ssid": "NeighborWiFi",
      "quality": 45,
      "maxQuality": 70,
      "qualityPercent": 64,
      "signalLevel": -55,
      "encrypted": true
    }
  ],
  "count": 2
}
```

**Example:**
```bash
curl http://192.168.1.137:3000/api/wifi/scan
```

**Note:** Scanning takes 5-10 seconds. Networks are sorted by signal strength.

---

### POST /api/wifi/mode/ap

Switch to AP mode (create WiFi hotspot).

**Response:**
```json
{
  "success": true,
  "mode": "ap",
  "message": "Switched to AP mode. Pi will create WiFi hotspot 'RaspberryPi-iOS'",
  "output": "...",
  "warning": "SSH connection may be lost. Reconnect to 192.168.50.1"
}
```

**Example:**
```bash
curl -X POST http://192.168.1.137:3000/api/wifi/mode/ap
```

**What happens:**
1. Stops wpa_supplicant (client mode)
2. Starts hostapd and dnsmasq (AP mode)
3. Sets static IP: 192.168.50.1
4. Creates WiFi network: `RaspberryPi-iOS`
5. Password: `raspberry123`

**⚠️ WARNING:** SSH connection will be lost! Reconnect to `192.168.50.1` after switching.

---

### POST /api/wifi/mode/client

Switch to Client mode and connect to a WiFi network.

**Request Body:**
```json
{
  "ssid": "HomeWiFi",
  "password": "mypassword"
}
```

**Response:**
```json
{
  "success": true,
  "mode": "client",
  "ssid": "HomeWiFi",
  "message": "Switching to Client mode and connecting to HomeWiFi",
  "output": "...",
  "warning": "SSH connection may be lost temporarily. Pi will get new IP from DHCP."
}
```

**Example:**
```bash
curl -X POST http://192.168.1.137:3000/api/wifi/mode/client \
  -H "Content-Type: application/json" \
  -d '{
    "ssid": "HomeWiFi",
    "password": "mypassword"
  }'
```

**What happens:**
1. Saves WiFi credentials to wpa_supplicant.conf
2. Stops hostapd and dnsmasq (AP mode)
3. Starts wpa_supplicant (client mode)
4. Connects to specified WiFi network
5. Gets IP from DHCP

**⚠️ WARNING:** SSH connection will be lost! Reconnect to new DHCP IP after switching.

---

### GET /api/wifi/saved-networks

Get list of saved WiFi networks from wpa_supplicant.

**Response:**
```json
{
  "success": true,
  "networks": [
    "HomeWiFi",
    "OfficeWiFi",
    "MobileHotspot"
  ],
  "count": 3
}
```

**Example:**
```bash
curl http://192.168.1.137:3000/api/wifi/saved-networks
```

---

## Usage Flow

### Switching to AP Mode (Portable/Offline)

```bash
# 1. Check current status
curl http://192.168.1.137:3000/api/wifi/status

# 2. Switch to AP mode
curl -X POST http://192.168.1.137:3000/api/wifi/mode/ap

# 3. SSH connection lost!

# 4. Connect to "RaspberryPi-iOS" WiFi (password: raspberry123)

# 5. SSH to new IP
ssh pi@192.168.50.1

# 6. Verify
curl http://192.168.50.1:3000/api/wifi/status
```

---

### Switching to Client Mode (Online)

```bash
# 1. Scan for networks
curl http://192.168.50.1:3000/api/wifi/scan

# 2. Connect to WiFi
curl -X POST http://192.168.50.1:3000/api/wifi/mode/client \
  -H "Content-Type: application/json" \
  -d '{"ssid": "HomeWiFi", "password": "mypassword"}'

# 3. SSH connection lost!

# 4. Find Pi's new IP (check router or use network scanner)

# 5. SSH to new IP
ssh pi@192.168.1.137

# 6. Verify
curl http://192.168.1.137:3000/api/wifi/status
```

---

## Testing Without Mode Switching

You can test the API without switching modes:

```bash
# Check status (safe)
curl http://192.168.1.137:3000/api/wifi/status

# Scan networks (safe)
curl http://192.168.1.137:3000/api/wifi/scan

# List saved networks (safe)
curl http://192.168.1.137:3000/api/wifi/saved-networks
```

---

## Error Handling

**Invalid request:**
```json
{
  "success": false,
  "error": "SSID and password are required"
}
```

**System error:**
```json
{
  "success": false,
  "error": "Failed to switch to Client mode",
  "message": "exit code 1: ..."
}
```

---

## Security Considerations

1. **No authentication** - Add authentication in production
2. **Passwords in plaintext** - Stored in wpa_supplicant.conf
3. **Sudoers required** - Pi user needs passwordless sudo for network commands
4. **Network exposure** - API accessible to anyone on network

---

## Troubleshooting

### "Permission denied" errors

Install sudoers configuration:
```bash
cd ~/raspi-ios-bridge/pi-setup/network
sudo ./install-sudoers.sh
```

### Cannot reconnect after mode switch

**AP Mode:** Connect to `RaspberryPi-iOS` WiFi, then SSH to `192.168.50.1`

**Client Mode:** Check router for Pi's new IP, or use:
```bash
# On your local machine
nmap -sn 192.168.1.0/24 | grep -B 2 "Raspberry Pi"
```

### Mode switch fails

Check logs:
```bash
sudo journalctl -u hostapd -n 50
sudo journalctl -u wpa_supplicant -n 50
```

Manual switch:
```bash
cd ~/raspi-ios-bridge/pi-setup/network
sudo ./switch-mode.sh ap     # or client
```

---

## Mobile App Integration

The mobile app will use these endpoints to:
1. Detect current mode on app startup
2. Show network scanner UI
3. Allow user to switch modes
4. Warn user about connection loss

**Example mobile app flow:**
```typescript
// Check current mode
const status = await apiClient.get('/api/wifi/status');

if (status.mode === 'ap') {
  // Offline mode UI
  showOfflineInterface();
} else {
  // Online mode UI
  showOnlineInterface();
}

// Scan networks button
const networks = await apiClient.get('/api/wifi/scan');
showNetworkList(networks);

// Connect button
await apiClient.post('/api/wifi/mode/client', {
  ssid: selectedNetwork,
  password: userPassword
});
showWarning('Connection will be lost. Reconnecting...');
```

---

## Command Line Helper

Use the WiFi helper script for quick checks:

```bash
cd ~/raspi-ios-bridge/pi-setup/network

# Get current mode
./wifi-helper.sh mode

# Get full status
./wifi-helper.sh status

# Scan networks
./wifi-helper.sh scan

# List saved networks
./wifi-helper.sh saved
```
