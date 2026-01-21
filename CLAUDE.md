# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## ⚠️ CRITICAL WORKFLOW - READ THIS FIRST ⚠️

### Working with Raspberry Pi

**NEVER run scripts or commands directly on the user's laptop.** Always follow this workflow:

#### For System Dependencies & Scripts (apt install, bash scripts):
1. ✅ Create script on laptop (local development)
2. ✅ Push to GitHub
3. ✅ SSH to Pi: `sshpass -p 'root' ssh pi@192.168.1.137`
4. ✅ Pull on Pi: `cd ~/raspi-ios-bridge && git pull origin master`
5. ✅ Run script on Pi: `sudo ./script.sh` or `bash script.sh`
6. ❌ NEVER run scripts on laptop using `Bash` tool directly

#### For Frontend App (Chromium Kiosk):
1. ✅ Develop app on laptop (edit HTML/JS/CSS files locally)
2. ✅ **CAN TEST ON LAPTOP** - Use Playwright MCP to debug UI directly on laptop
3. ✅ Open in browser on laptop: `http://localhost:3000/` or use Playwright tools
4. ✅ Push to GitHub when ready
5. ✅ SSH to Pi and pull: `cd ~/raspi-ios-bridge && git pull origin master`
6. ✅ Pi automatically updates (served by Pi API on port 3000)

**Exception:** Frontend apps CAN be tested on laptop because Playwright MCP is available for UI debugging. This is the ONLY exception to the "never run on laptop" rule.

#### SSH Connection Info:
- **Host:** `192.168.1.137`
- **User:** `pi`
- **Password:** `root`
- **Command:** `sshpass -p 'root' ssh pi@192.168.1.137 "command"`

#### Git Workflow:
```bash
# On laptop
git add .
git commit -m "message"
git push origin master

# Then SSH to Pi
sshpass -p 'root' ssh pi@192.168.1.137 "cd ~/raspi-ios-bridge && git pull origin master"
```

**Remember:** The Pi is the deployment target. Laptop is for development only.

---

## Project Overview

This is the **Raspberry Pi iOS Bridge** repository - a complete system for iOS device communication over USB with dual WiFi mode support (offline hotspot / online sync).

**Repository Name:** raspi-ios-bridge (formerly raspi-libimobiledevice)
**Purpose:** Raspberry Pi hardware setup, API server, and documentation
**Target Platform:** Raspberry Pi Zero 2W, Pi 4, or compatible ARM64 boards
**OS:** Raspberry Pi OS Lite 64-bit (Debian 12/13)
**libimobiledevice Version:** 1.4.0 from GitHub source
**Last Restructured:** January 21, 2026

## Repository Structure

This repository contains:
1. **Executable installation scripts** - Automated setup for all components
2. **Pi API Server** (Node.js) - REST API for iOS device communication
3. **Network management scripts** - WiFi AP/Client mode switching
4. **Chromium kiosk setup** - Optional fullscreen display
5. **Comprehensive documentation** - Hardware setup and API reference

**Important:** This is now a **complete working system**, not just documentation. It includes executable code, scripts, and a Node.js API server.

---

## Multi-Repository Project

This is part of a three-repository IoT project:

1. **raspi-ios-bridge** (this repo) - Raspberry Pi hardware and API server
2. **ios-bridge-mobile** - Mobile app (Expo/React Native) [to be created]
3. **ios-bridge-backend** - Backend server (Python FastAPI) [to be created]

### System Architecture

**Offline Mode (Portable):**
```
Mobile App (WiFi) ←→ Raspberry Pi (AP Mode: 192.168.50.1)
     ↓                        ↓
Local Storage          Local Database (SQLite)
```

**Online Mode (Home/Internet):**
```
Mobile App (Internet) ←→ Backend API (Cloud) ←→ Raspberry Pi (Client Mode)
          ↓                      ↓                      ↓
    Cache/Queue          PostgreSQL/MySQL       Local Database
                                ↕
                        Data Synchronization
```

---

## Repository Structure

```
raspi-ios-bridge/
├── README.md                       # Project overview
├── CLAUDE.md                       # This file - AI guidance
├── .gitignore
│
├── docs/                           # Documentation
│   ├── README.md                   # Documentation hub
│   ├── hardware/                   # Hardware setup docs
│   │   ├── setup-guide.md          # Complete Pi setup
│   │   └── wifi-modes.md           # WiFi AP/Client modes
│   └── api/                        # API documentation
│       └── local-api.md            # REST API reference
│
├── pi-setup/                       # Installation scripts
│   ├── install.sh                  # Master installer
│   ├── dependencies.sh             # System dependencies
│   ├── libimobiledevice/           # Build scripts
│   │   ├── build-all.sh            # Build all components
│   │   ├── build-libplist.sh
│   │   ├── build-glue.sh
│   │   ├── build-libusbmuxd.sh
│   │   ├── build-libtatsu.sh
│   │   └── build-libimobiledevice.sh
│   ├── network/                    # WiFi management
│   │   ├── setup-ap-mode.sh        # Configure AP
│   │   ├── setup-client-mode.sh    # Configure client
│   │   └── switch-mode.sh          # Switch modes
│   └── kiosk/                      # Chromium kiosk
│       ├── install-kiosk.sh
│       ├── kiosk.sh
│       └── kiosk.service
│
├── pi-api/                         # Node.js API server
│   ├── package.json
│   ├── server.js                   # Express server
│   ├── routes/                     # API endpoints
│   │   ├── device.js               # Device info
│   │   ├── battery.js              # Battery status
│   │   ├── screenshot.js           # Screenshots
│   │   ├── syslog.js               # System logs
│   │   └── sync.js                 # Data sync
│   ├── services/                   # Business logic
│   │   ├── libimobiledevice.js     # idevice wrapper
│   │   ├── storage.js              # SQLite ops
│   │   └── sync-queue.js           # Sync management
│   ├── db/                         # Database
│   │   ├── schema.sql
│   │   └── init.js
│   └── config/                     # Configuration
│       ├── offline.json
│       └── online.json
│
├── kiosk-app/                      # Chromium kiosk app
│   ├── package.json
│   ├── public/
│   │   └── index.html
│   └── .github/workflows/
│       └── deploy-kiosk.yml
│
├── config/                         # System configuration
│   ├── udev/
│   │   └── 39-usbmuxd.rules        # USB auto-detect
│   └── systemd/
│       ├── usbmuxd-override.conf   # usbmuxd service
│       └── pi-api.service          # API service
│
└── examples/                       # Examples
    └── README.md
```

---

## System Components

### 1. libimobiledevice 1.4.0

Built from GitHub source with all dependencies:
- **libplist** (commit 2c50f76) - Critical for iOS 26.2+ compatibility
- **libimobiledevice-glue** - Utility code
- **libusbmuxd** - USB multiplexer client
- **libtatsu** - TSS request handling
- **libimobiledevice** - Main library with 23 idevice tools

**Installation:**
- Build location: `~/build/`
- Install location: `/usr/local/`
- Automated via: `pi-setup/install.sh`

### 2. Pi API Server (Node.js)

REST API exposing libimobiledevice functionality:
- **Framework:** Express.js
- **Port:** 3000
- **Database:** SQLite
- **CORS:** Enabled for mobile apps

**Key Endpoints:**
- `GET /api/device/info` - Device information
- `GET /api/battery` - Battery status
- `GET /api/screenshot` - Capture screenshot
- `GET /api/syslog/stream` - Stream system logs (SSE)
- `POST /api/sync/trigger` - Trigger backend sync

**Service:** `pi-api.service` (systemd)

### 3. Dual WiFi Modes

**AP Mode (Access Point):**
- SSID: `RaspberryPi-iOS`
- Password: `raspberry123`
- IP: `192.168.50.1`
- Purpose: Portable offline operation

**Client Mode:**
- Connects to home/office WiFi
- DHCP assigned IP
- Purpose: Internet access and backend sync

**Switching:** `pi-setup/network/switch-mode.sh [ap|client]`

### 4. Chromium Kiosk (Optional)

- Fullscreen Chromium display
- Displays `http://localhost:3000`
- Auto-start on boot
- GitHub Actions auto-deployment

**Service:** `kiosk.service` (systemd)

---

## Raspberry Pi 4 Connection

**IMPORTANT:** This repository is paired with a live Raspberry Pi 4 system for testing.

### SSH Connection Details
- **Host:** 192.168.1.137
- **User:** pi
- **Password:** root
- **Hardware:** Raspberry Pi 4 Model B
- **OS:** Debian 13 (trixie) - Raspberry Pi OS
- **Architecture:** ARM64 (aarch64)
- **Kernel:** 6.12.47+rpt-rpi-v8

### Connecting

```bash
# Standard SSH
ssh pi@192.168.1.137
# Password: root

# Non-interactive
sshpass -p 'root' ssh pi@192.168.1.137 "command"
```

### System Status (Last Updated: January 21, 2026)

**Installed and Tested:**
- ✅ libimobiledevice 1.4.0 (from GitHub source)
- ✅ usbmuxd daemon (auto-start enabled)
- ✅ Chromium kiosk (configured)
- ✅ PM2 process manager (operational)
- ✅ iPhone iOS 26.2 detection (verified)

**Verified Functionality:**
- Device detection: `idevice_id -l` ✅
- Device info: `ideviceinfo` ✅
- Battery status: `ideviceinfo -q com.apple.mobile.battery` ✅
- Pairing: `idevicepair validate` ✅

### Testing Commands

```bash
# iOS Device Commands
sshpass -p 'root' ssh pi@192.168.1.137 "idevice_id -l"
sshpass -p 'root' ssh pi@192.168.1.137 "ideviceinfo"
sshpass -p 'root' ssh pi@192.168.1.137 "idevicename"

# Service Status
sshpass -p 'root' ssh pi@192.168.1.137 "systemctl status usbmuxd"
sshpass -p 'root' ssh pi@192.168.1.137 "systemctl status pi-api"
sshpass -p 'root' ssh pi@192.168.1.137 "pm2 status"

# API Testing
sshpass -p 'root' ssh pi@192.168.1.137 "curl http://localhost:3000/health"
```

---

## Working with This Repository

### Installation Scripts

When modifying `pi-setup/` scripts:
1. **Test on the actual Pi** - Always verify scripts work on hardware
2. **Maintain build order** - libimobiledevice dependencies must build in sequence
3. **Keep scripts idempotent** - Scripts should handle repeated runs
4. **Add verification steps** - Include checks to confirm success

**Critical:** libplist MUST use commit 2c50f76 for iOS 26.2+ compatibility.

### Pi API Server

When modifying `pi-api/`:
1. **Follow Express patterns** - Use existing route structure
2. **Wrap idevice commands** - Use `services/libimobiledevice.js` wrapper
3. **Handle errors gracefully** - iOS devices can disconnect unexpectedly
4. **Store data in SQLite** - Use `services/storage.js` for persistence
5. **Queue offline operations** - Use `services/sync-queue.js`

**Testing:**
```bash
cd pi-api
npm install
node db/init.js  # Initialize database
node server.js   # Start server
curl http://localhost:3000/health
```

### Network Scripts

When modifying `pi-setup/network/`:
1. **Test mode switching** - Verify both AP and Client modes work
2. **Preserve configurations** - Keep `.ap` and `.client` suffix files
3. **Handle service conflicts** - Ensure clean service stops/starts
4. **Test SSH connectivity** - Mode switching changes IP addresses

**Warning:** SSH connection will be lost when switching modes.

### Documentation

When modifying `docs/`:
1. **Keep hardware docs in `docs/hardware/`** - Setup guides, WiFi modes
2. **Keep API docs in `docs/api/`** - REST API reference
3. **Update `docs/README.md`** - Maintain navigation hub
4. **Test commands** - Verify all commands work on actual Pi
5. **Include examples** - Provide curl examples for API endpoints

**Old Documentation:** The old `SETUP_GUIDE.md`, `QUICK_REFERENCE.md`, `CONFIG_FILES.md`, and `KIOSK_SETUP.md` are deprecated. Use new consolidated docs.

---

## Key Technical Details

### libimobiledevice Build Order

**CRITICAL:** Build in this exact order:
1. libplist (commit 2c50f76) ← Required commit!
2. libimobiledevice-glue
3. libusbmuxd
4. libtatsu
5. libimobiledevice

**Why commit 2c50f76?** Fixes assertion failures with iOS 26.2+ devices.

### Device Requirements

- iPhone/iPad must be **unlocked**
- Device must be **trusted** (tap "Trust This Computer")
- Uses Apple's official protocols (no jailbreak)
- USB connection only (not WiFi)

### Permission Model

- usbmuxd runs as `usbmux:usbmux`
- USB devices assigned group `usbmux` with mode `0660`
- Users in `usbmux` group can access devices
- **Requires logout/login** after adding user to group

### udev Rules

File: `/etc/udev/rules.d/39-usbmuxd.rules`
- Matches Apple devices by vendor ID: `05ac`
- Sets permissions automatically
- Works regardless of device number (plug/unplug resilient)

---

## Common Tasks

### Update Installation Script

```bash
# Edit script
nano pi-setup/install.sh

# Test on Pi
sshpass -p 'root' ssh pi@192.168.1.137 "cd /home/pi/raspi-ios-bridge && git pull"
sshpass -p 'root' ssh pi@192.168.1.137 "sudo /home/pi/raspi-ios-bridge/pi-setup/install.sh"
```

### Add New API Endpoint

1. Create route in `pi-api/routes/`
2. Add business logic to `pi-api/services/` if needed
3. Register route in `pi-api/server.js`
4. Document in `docs/api/local-api.md`
5. Test with curl

### Update Documentation

1. Edit relevant markdown file in `docs/`
2. Test commands on actual Pi
3. Update `docs/README.md` if adding new docs
4. Commit with clear message

---

## Troubleshooting Guide

### Device Not Detected

```bash
# Restart usbmuxd
sudo systemctl restart usbmuxd

# Check device is plugged in
lsusb | grep Apple

# Verify udev rules
ls -l /etc/udev/rules.d/39-usbmuxd.rules
```

### API Not Responding

```bash
# Check service
systemctl status pi-api

# View logs
journalctl -u pi-api -n 50

# Restart service
sudo systemctl restart pi-api
```

### WiFi Mode Issues

```bash
# Check current services
systemctl status hostapd      # AP mode
systemctl status wpa_supplicant  # Client mode

# Switch mode
cd ~/raspi-ios-bridge/pi-setup/network
sudo ./switch-mode.sh [ap|client]
```

---

## Development Workflow

### Making Changes

1. **Clone repository** (if not already)
   ```bash
   git clone https://github.com/yourusername/raspi-ios-bridge.git
   cd raspi-ios-bridge
   ```

2. **Make changes locally**
   - Edit scripts, API code, or documentation
   - Test locally if possible

3. **Push to Pi for testing**
   ```bash
   git add .
   git commit -m "Description of changes"
   git push

   # On Pi
   ssh pi@192.168.1.137
   cd ~/raspi-ios-bridge
   git pull
   ```

4. **Test on Pi**
   - Run installation scripts
   - Test API endpoints
   - Verify services
   - Test with actual iPhone

5. **Update documentation**
   - Document any new features
   - Update troubleshooting if needed
   - Add examples

---

## Resources

- **libimobiledevice:** https://libimobiledevice.org/
- **GitHub:** https://github.com/libimobiledevice/libimobiledevice
- **Documentation:** [docs/README.md](docs/README.md)

---

## Important Notes

1. **Always test on real hardware** - Raspberry Pi behavior differs from desktop
2. **Verify iOS device compatibility** - Test with multiple iOS versions if possible
3. **Document breaking changes** - Update troubleshooting section
4. **Keep passwords secure** - Current Pi password ("root") is for development only
5. **Backup configurations** - Before major changes, backup udev rules and systemd services

---

**Last Updated:** January 21, 2026
**Repository Version:** 1.0.0 (Restructured)
