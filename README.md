# Raspberry Pi iOS Bridge

Complete system for iOS device communication over USB with dual WiFi mode support (offline hotspot / online sync).

**Target Platform:** Raspberry Pi Zero 2W, Pi 4, or compatible ARM64 boards
**OS:** Raspberry Pi OS Lite 64-bit (Debian 12/13)
**libimobiledevice:** 1.4.0 from GitHub source

---

## What is This?

A complete Raspberry Pi-based system that enables:

- ✅ **iOS Device Communication** - Connect iPhone/iPad via USB using libimobiledevice
- ✅ **Dual WiFi Modes** - Portable AP mode (offline) or Client mode (online sync)
- ✅ **REST API** - HTTP endpoints for device info, screenshots, battery, logs
- ✅ **Offline-First** - Queue data locally, sync when online
- ✅ **Chromium Kiosk** - Optional fullscreen display
- ✅ **Auto-Detection** - Plug-and-play iOS device recognition

---

## Quick Start

### Installation

```bash
# Clone repository
cd ~
git clone https://github.com/yourusername/raspi-ios-bridge.git
cd raspi-ios-bridge

# Run automated installer
cd pi-setup
sudo ./install.sh

# Reboot
sudo reboot
```

Installation takes ~15-20 minutes on Raspberry Pi 4.

### Verification

```bash
# Plug in iPhone/iPad (unlocked and trusted)

# List connected devices
idevice_id -l

# Get device information
ideviceinfo

# Test API server
curl http://localhost:3000/health
```

**Complete documentation:** See [docs/README.md](docs/README.md)

---

## System Architecture

```
┌──────────────┐       USB        ┌─────────────────────┐
│   iPhone/    │ ◄────────────────► │   Raspberry Pi      │
│     iPad     │                    │                     │
└──────────────┘                    │  • libimobiledevice │
                                    │  • Node.js API      │
       ▲                            │  • SQLite DB        │
       │                            └─────────────────────┘
       │ WiFi                              │         │
       │                                   │         │
   ┌───┴────────┐                  ┌───────┴───┐  ┌─┴─────────┐
   │ Mobile App │                  │ AP Mode   │  │ Client    │
   │            │                  │ (Offline) │  │ Mode      │
   │  • React   │                  └───────────┘  │ (Online)  │
   │    Native  │                                 │           │
   │  • Offline │                                 │  Sync to  │
   │    Queue   │                                 │  Backend  │
   └────────────┘                                 └───────────┘
```

### Dual WiFi Mode Operation

**AP Mode (Portable/Offline):**
- Pi creates WiFi hotspot: `RaspberryPi-iOS`
- Mobile app connects directly to Pi
- No internet required
- Data stored locally in SQLite

**Client Mode (Online/Sync):**
- Pi connects to home/office WiFi
- Mobile app connects to internet
- Both sync to backend server
- Offline queue processed

---

## Features

### libimobiledevice 1.4.0

Built from GitHub source with all dependencies:

- **Libraries:** libplist (commit 2c50f76), libimobiledevice-glue, libusbmuxd, libtatsu, libimobiledevice
- **Tools:** 23 idevice commands (info, screenshot, syslog, backup, etc.)
- **Critical:** Uses specific libplist commit for iOS 26.2+ compatibility

### Pi API Server

Node.js REST API with the following endpoints:

```
GET  /api/device/info           # Device information
GET  /api/device/list           # Connected devices
GET  /api/battery               # Battery status
GET  /api/screenshot            # Capture screenshot
GET  /api/syslog/stream         # Stream system logs
POST /api/sync/trigger          # Trigger backend sync
GET  /api/sync/status           # Sync queue status
```

Full API documentation: [docs/api/local-api.md](docs/api/local-api.md)

### Network Capabilities

**AP Mode:**
- SSID: `RaspberryPi-iOS`
- Password: `raspberry123`
- IP: `192.168.50.1`
- DHCP: `192.168.50.10` - `.100`

**Client Mode:**
- Connects to saved WiFi networks
- DHCP assigned IP
- Internet connectivity
- Backend synchronization

Switch modes easily:
```bash
cd ~/raspi-ios-bridge/pi-setup/network
sudo ./switch-mode.sh [ap|client]
```

### Data Synchronization

- **Local SQLite database** for offline storage
- **Sync queue** for operations when offline
- **Automatic sync** when online (configurable interval)
- **Conflict resolution** strategies

---

## Repository Structure

```
raspi-ios-bridge/
├── README.md                       # This file
├── CLAUDE.md                       # AI assistant guidance
├── .gitignore
│
├── docs/                           # Documentation
│   ├── README.md                   # Documentation hub
│   ├── hardware/
│   │   ├── setup-guide.md          # Complete Pi setup guide
│   │   └── wifi-modes.md           # WiFi configuration
│   └── api/
│       └── local-api.md            # API reference
│
├── pi-setup/                       # Installation scripts
│   ├── install.sh                  # Master installer
│   ├── dependencies.sh             # System dependencies
│   ├── libimobiledevice/           # Build scripts
│   │   ├── build-all.sh
│   │   ├── build-libplist.sh
│   │   ├── build-glue.sh
│   │   ├── build-libusbmuxd.sh
│   │   ├── build-libtatsu.sh
│   │   └── build-libimobiledevice.sh
│   ├── network/                    # WiFi management
│   │   ├── setup-ap-mode.sh
│   │   ├── setup-client-mode.sh
│   │   └── switch-mode.sh
│   └── kiosk/                      # Chromium kiosk
│       ├── install-kiosk.sh
│       ├── kiosk.sh
│       └── kiosk.service
│
├── pi-api/                         # Node.js API server
│   ├── server.js                   # Express server
│   ├── package.json
│   ├── routes/                     # API endpoints
│   │   ├── device.js
│   │   ├── battery.js
│   │   ├── screenshot.js
│   │   ├── syslog.js
│   │   └── sync.js
│   ├── services/                   # Business logic
│   │   ├── libimobiledevice.js     # idevice wrapper
│   │   ├── storage.js              # SQLite operations
│   │   └── sync-queue.js           # Sync management
│   ├── db/                         # Database
│   │   ├── schema.sql
│   │   └── init.js
│   └── config/                     # Configuration
│       ├── offline.json
│       └── online.json
│
├── kiosk-app/                      # Chromium kiosk display
│   ├── package.json
│   ├── public/
│   │   └── index.html
│   └── .github/workflows/
│       └── deploy-kiosk.yml
│
├── config/                         # System configuration
│   ├── udev/
│   │   └── 39-usbmuxd.rules
│   └── systemd/
│       ├── usbmuxd-override.conf
│       └── pi-api.service
│
└── examples/                       # Example configurations
    └── README.md
```

---

## Documentation

**Start here:** [docs/README.md](docs/README.md)

### Key Guides

1. **[Complete Setup Guide](docs/hardware/setup-guide.md)** - Installation, configuration, troubleshooting
2. **[WiFi Modes Guide](docs/hardware/wifi-modes.md)** - AP/Client mode setup and switching
3. **[Local API Documentation](docs/api/local-api.md)** - REST API reference

---

## Common Commands

### Device Operations

```bash
# List devices
idevice_id -l

# Device info
ideviceinfo

# Battery status
ideviceinfo -q com.apple.mobile.battery

# Screenshot
idevicescreenshot
```

### Service Management

```bash
# Check status
systemctl status usbmuxd
systemctl status pi-api

# View logs
journalctl -u pi-api -f
```

### WiFi Mode Switching

```bash
cd ~/raspi-ios-bridge/pi-setup/network

# Portable mode (offline)
sudo ./switch-mode.sh ap

# Home network (online)
sudo ./switch-mode.sh client
```

### API Testing

```bash
# Health check
curl http://localhost:3000/health

# Device info
curl http://localhost:3000/api/device/info

# Battery
curl http://localhost:3000/api/battery

# Screenshot
curl http://localhost:3000/api/screenshot > screenshot.png
```

---

## Multi-Repository Project

This is part of a complete IoT system with three repositories:

1. **raspi-ios-bridge** (this repo) - Raspberry Pi hardware and API
2. **ios-bridge-mobile** - Mobile app (Expo/React Native)
3. **ios-bridge-backend** - Backend server (Python FastAPI)

---

## Raspberry Pi 4 Connection

This repository is paired with a live Raspberry Pi 4 system for testing:

**SSH Access:**
```bash
ssh pi@192.168.1.137
# Password: root
```

**Status:**
- ✅ libimobiledevice 1.4.0 installed and tested
- ✅ Chromium kiosk configured
- ✅ iPhone iOS 26.2 detection verified
- ✅ All services running

See [CLAUDE.md](CLAUDE.md) for detailed connection info and system status.

---

## Requirements

### Hardware
- Raspberry Pi Zero 2W, Pi 4, or compatible ARM64 board
- microSD card (16GB+ recommended)
- iOS device (iPhone/iPad)
- USB cable

### Software
- Raspberry Pi OS Lite 64-bit (Debian 12/13)
- Internet connection (for initial setup)

---

## Troubleshooting

**Device not detected:**
```bash
sudo systemctl restart usbmuxd
# Ensure device is unlocked and trusted
```

**Permission errors:**
```bash
sudo usermod -a -G usbmux $USER
logout
```

**API not responding:**
```bash
sudo systemctl restart pi-api
journalctl -u pi-api -n 50
```

**Complete troubleshooting:** [docs/hardware/setup-guide.md#troubleshooting](docs/hardware/setup-guide.md#troubleshooting)

---

## License

MIT License

libimobiledevice is licensed under LGPL v2.1.

---

## Resources

- **libimobiledevice:** https://libimobiledevice.org/
- **GitHub:** https://github.com/libimobiledevice/libimobiledevice
- **Documentation:** [docs/README.md](docs/README.md)

---

**Last Updated:** January 21, 2026
**Version:** 1.0.0
