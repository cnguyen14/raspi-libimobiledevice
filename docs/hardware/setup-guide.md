# Raspberry Pi iOS Bridge - Complete Setup Guide

Complete guide for setting up libimobiledevice 1.4.0 and the iOS Bridge API on Raspberry Pi.

**Last Updated:** January 21, 2026

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Automated Installation](#automated-installation)
3. [Manual Installation](#manual-installation)
4. [Post-Installation Configuration](#post-installation-configuration)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Hardware
- Raspberry Pi Zero 2W, Pi 4, or compatible ARM64 board
- microSD card (16GB+ recommended)
- iOS device (iPhone/iPad)
- USB cable (Lightning or USB-C depending on device)

### Software
- Raspberry Pi OS Lite 64-bit (Debian 12 Bookworm or newer)
- Internet connection for initial setup
- SSH access or physical access to Pi

### Target Platform
- **OS:** Debian 12 (Bookworm) / Debian 13 (Trixie)
- **Architecture:** ARM64 (aarch64)
- **libimobiledevice:** 1.4.0 from GitHub master
- **Node.js:** 20.x LTS

---

## Automated Installation

The easiest way to install everything is using the automated installer.

### Step 1: Clone Repository

```bash
# Clone the repository
cd ~
git clone https://github.com/yourusername/raspi-ios-bridge.git
cd raspi-ios-bridge
```

### Step 2: Run Installer

```bash
# Run the master installer as root
cd pi-setup
sudo ./install.sh
```

The installer will:
1. Install system dependencies (build tools, libraries, Node.js)
2. Build libimobiledevice from GitHub source (all 5 components)
3. Configure usbmuxd daemon with auto-start
4. Install and start the Pi API server
5. Configure udev rules for automatic device detection

**Installation time:** ~15-20 minutes on Raspberry Pi 4

### Step 3: Reboot

```bash
sudo reboot
```

After reboot, the system is ready to use. Skip to [Verification](#verification).

---

## Manual Installation

If you prefer to install components individually, follow these steps.

### 1. Install Dependencies

```bash
cd ~/raspi-ios-bridge/pi-setup
sudo ./dependencies.sh
```

This installs:
- Build tools: `build-essential`, `git`, `autoconf`, `automake`, `libtool`, `pkg-config`
- Libraries: `libssl-dev`, `libusb-1.0-0-dev`, `libcurl4-openssl-dev`
- Daemon: `usbmuxd`
- Node.js 20.x and PM2

### 2. Build libimobiledevice

```bash
cd ~/raspi-ios-bridge/pi-setup/libimobiledevice
./build-all.sh
```

This builds all components in the correct order:
1. **libplist** (commit 2c50f76) - Critical for iOS 26.2+ compatibility
2. **libimobiledevice-glue**
3. **libusbmuxd**
4. **libtatsu**
5. **libimobiledevice** (main library with 23 idevice tools)

**Build location:** `~/build/`
**Install location:** `/usr/local/`

### 3. Configure usbmuxd

Create usbmux group and add user:

```bash
sudo groupadd -r usbmux
sudo usermod -a -G usbmux $USER
```

Install udev rules:

```bash
sudo cp config/udev/39-usbmuxd.rules /etc/udev/rules.d/
sudo udevadm control --reload-rules
sudo udevadm trigger
```

Configure systemd service:

```bash
sudo mkdir -p /etc/systemd/system/usbmuxd.service.d/
sudo cp config/systemd/usbmuxd-override.conf /etc/systemd/system/usbmuxd.service.d/override.conf
sudo systemctl daemon-reload
sudo systemctl enable usbmuxd
sudo systemctl restart usbmuxd
```

### 4. Install Pi API Server

```bash
cd ~/raspi-ios-bridge/pi-api

# Install Node.js dependencies
npm install

# Initialize database
node db/init.js

# Install systemd service
sudo cp ../config/systemd/pi-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable pi-api
sudo systemctl start pi-api
```

### 5. Logout and Login

Group membership changes require re-login:

```bash
logout
# SSH back in
```

---

## Post-Installation Configuration

### WiFi Mode Configuration

The system supports two WiFi modes:

#### **AP Mode (Access Point / Hotspot)**
Creates a portable WiFi hotspot for direct mobile connection.

```bash
cd ~/raspi-ios-bridge/pi-setup/network

# Configure AP mode
sudo ./setup-ap-mode.sh

# Switch to AP mode
sudo ./switch-mode.sh ap
```

**Default Settings:**
- SSID: `RaspberryPi-iOS`
- Password: `raspberry123`
- IP: `192.168.50.1`
- API: `http://192.168.50.1:3000`

#### **Client Mode (Home WiFi)**
Connects to existing WiFi network for internet access.

```bash
cd ~/raspi-ios-bridge/pi-setup/network

# Configure client mode (provide your WiFi credentials)
sudo ./setup-client-mode.sh "YourWiFiSSID" "YourWiFiPassword"

# Switch to client mode
sudo ./switch-mode.sh client
```

See [WiFi Modes Guide](wifi-modes.md) for detailed information.

### Chromium Kiosk (Optional)

Install fullscreen Chromium kiosk for displaying the iOS Bridge UI:

```bash
cd ~/raspi-ios-bridge/pi-setup/kiosk
sudo ./install-kiosk.sh
```

The kiosk will:
- Display `http://localhost:3000` in fullscreen
- Auto-start on boot
- Auto-refresh when app updates

---

## Verification

### 1. Check Services

```bash
# usbmuxd status
systemctl status usbmuxd

# Pi API status
systemctl status pi-api

# PM2 processes (if using kiosk)
pm2 status
```

All services should show **active (running)**.

### 2. Connect iOS Device

1. Plug iPhone/iPad into Raspberry Pi via USB
2. **Unlock the device**
3. **Trust the computer** (tap "Trust" on device)

### 3. Test Device Detection

```bash
# List connected devices
idevice_id -l

# Should output device UDID like:
# 00008150-000971D00A20401C
```

### 4. Get Device Information

```bash
# Get full device info
ideviceinfo

# Get device name
idevicename

# Get battery status
ideviceinfo -q com.apple.mobile.battery
```

### 5. Test Pi API

```bash
# Check API health
curl http://localhost:3000/health

# List devices
curl http://localhost:3000/api/device/list

# Get device info
curl http://localhost:3000/api/device/info

# Get battery status
curl http://localhost:3000/api/battery
```

All endpoints should return JSON responses.

---

## Troubleshooting

### Device Not Detected

**Symptoms:** `idevice_id -l` returns nothing

**Solutions:**
1. Check device is unlocked and trusted
2. Restart usbmuxd: `sudo systemctl restart usbmuxd`
3. Check USB cable (try different cable)
4. Verify device appears in USB: `lsusb | grep Apple`
5. Check udev rules: `ls -l /etc/udev/rules.d/39-usbmuxd.rules`

### Permission Denied Errors

**Symptoms:** `Could not connect to lockdownd` or permission errors

**Solutions:**
1. Check group membership: `groups` (should include `usbmux`)
2. If not in group: `sudo usermod -a -G usbmux $USER && logout`
3. Check udev rule permissions: `ls -l /dev/bus/usb/*/*`

### API Server Not Starting

**Symptoms:** `systemctl status pi-api` shows failed

**Solutions:**
1. Check logs: `journalctl -u pi-api -n 50`
2. Verify Node.js installed: `node -v` (should be v20.x)
3. Check dependencies: `cd ~/raspi-ios-bridge/pi-api && npm install`
4. Test manually: `cd ~/raspi-ios-bridge/pi-api && node server.js`

### Build Errors

**Symptoms:** Build fails during `./build-all.sh`

**Solutions:**
1. Verify all dependencies installed: `sudo ./dependencies.sh`
2. Check for disk space: `df -h`
3. Update system: `sudo apt update && sudo apt upgrade`
4. Check specific component logs in `~/build/[component-name]/`

### libplist Assertion Failure

**Symptoms:** `Assertion 'node' failed` when running idevice commands

**Solution:**
This is a known issue with libplist versions. **You MUST use commit 2c50f76**:

```bash
cd ~/build/libplist
git fetch
git checkout 2c50f76
./autogen.sh
make clean
make
sudo make install
sudo ldconfig
```

### WiFi Mode Issues

**Symptoms:** Can't switch modes or no WiFi connection

**Solutions:**
1. Check WiFi hardware: `iwconfig`
2. View service status: `systemctl status hostapd wpa_supplicant`
3. Check configurations exist:
   - AP: `ls /etc/hostapd/hostapd.conf.ap`
   - Client: `ls /etc/wpa_supplicant/wpa_supplicant.conf.client`
4. Review detailed [WiFi Modes Guide](wifi-modes.md)

---

## System Information

### Installed Components

After successful installation, you should have:

**Libraries (in `/usr/local/lib`):**
- libplist (2.7.0)
- libimobiledevice-glue (1.3.2)
- libusbmuxd (2.1.1)
- libtatsu (1.0.5)
- libimobiledevice (1.4.0)

**Tools (in `/usr/local/bin`):**
23 idevice tools including:
- `idevice_id` - List devices
- `ideviceinfo` - Device information
- `idevicename` - Device name
- `idevicepair` - Pairing management
- `idevicescreenshot` - Capture screenshots
- `idevicesyslog` - System logs
- `idevicebackup2` - Backup/restore
- And 16 more specialized tools

**Services:**
- `usbmuxd.service` - USB multiplexer daemon
- `pi-api.service` - REST API server
- `kiosk.service` - Chromium kiosk (if installed)

### File Locations

- **Repository:** `~/raspi-ios-bridge/`
- **Build sources:** `~/build/`
- **Installation:** `/usr/local/`
- **Configuration:** `/etc/systemd/system/`, `/etc/udev/rules.d/`
- **Database:** `~/raspi-ios-bridge/pi-api/db/pi-bridge.db`
- **Screenshots:** `~/raspi-ios-bridge/pi-api/screenshots/`

---

## Next Steps

- Configure WiFi modes: [WiFi Modes Guide](wifi-modes.md)
- Explore API endpoints: [Local API Documentation](../api/local-api.md)
- Set up mobile app connection (see mobile app repository)
- Configure backend sync (see backend repository)

---

## References

- libimobiledevice: https://github.com/libimobiledevice/libimobiledevice
- libplist: https://github.com/libimobiledevice/libplist
- Official site: https://libimobiledevice.org/
