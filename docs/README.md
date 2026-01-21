# Raspberry Pi iOS Bridge Documentation

Complete documentation for setting up and using the Raspberry Pi iOS Bridge system with libimobiledevice 1.4.0.

## 📖 Documentation Overview

This repository contains comprehensive guides for building a complete iOS device communication system on Raspberry Pi.

### Quick Start

**New to this project?** Start here:
1. [Complete Setup Guide](hardware/setup-guide.md) - Install everything from scratch
2. [WiFi Modes Guide](hardware/wifi-modes.md) - Configure AP and Client modes
3. [Local API Documentation](api/local-api.md) - Use the REST API

### What is This?

The Raspberry Pi iOS Bridge is a complete system that enables:
- **iOS Device Communication** - Connect iPhone/iPad via USB
- **Dual WiFi Modes** - Portable hotspot (offline) or home network (online)
- **REST API** - HTTP endpoints for device info, screenshots, logs, battery status
- **Data Sync** - Queue data offline, sync when online
- **Chromium Kiosk** - Optional fullscreen display

**Use Cases:**
- Portable iOS device testing
- Field data collection
- Automated device monitoring
- Demo/kiosk applications

---

## 📚 Documentation Structure

### Hardware Setup

- **[Complete Setup Guide](hardware/setup-guide.md)** ⭐ START HERE
  - System prerequisites
  - Automated installation
  - Manual installation steps
  - Post-installation configuration
  - Verification and testing
  - Comprehensive troubleshooting

- **[WiFi Modes Guide](hardware/wifi-modes.md)**
  - Access Point (AP) mode configuration
  - Client mode configuration
  - Mode switching procedures
  - Advanced networking configuration
  - Troubleshooting network issues

### API Documentation

- **[Local API Documentation](api/local-api.md)**
  - Complete REST API reference
  - All endpoints with examples
  - Request/response formats
  - Mobile app integration guide
  - Testing procedures

---

## 🚀 Quick Installation

### Prerequisites
- Raspberry Pi Zero 2W, Pi 4, or compatible
- Raspberry Pi OS Lite 64-bit
- iOS device with USB cable

### Installation (Automated)

```bash
# Clone repository
cd ~
git clone https://github.com/yourusername/raspi-ios-bridge.git
cd raspi-ios-bridge

# Run installer
cd pi-setup
sudo ./install.sh

# Reboot
sudo reboot
```

Installation takes ~15-20 minutes on Raspberry Pi 4.

### Verification

```bash
# List connected devices
idevice_id -l

# Get device info
ideviceinfo

# Test API
curl http://localhost:3000/health
```

**Detailed instructions:** See [Complete Setup Guide](hardware/setup-guide.md)

---

## 🏗️ System Architecture

### Components

**1. libimobiledevice 1.4.0**
- Built from GitHub source
- 5 libraries + 23 idevice tools
- Automatic USB device detection
- Critical: Uses libplist commit 2c50f76 for iOS 26.2+ support

**2. Pi API Server (Node.js)**
- REST API on port 3000
- SQLite local database
- Offline operation queue
- CORS-enabled for mobile apps

**3. Dual WiFi Modes**
- **AP Mode:** Portable hotspot (`RaspberryPi-iOS` @ 192.168.50.1)
- **Client Mode:** Home WiFi with internet access
- Easy mode switching

**4. Chromium Kiosk (Optional)**
- Fullscreen display
- Auto-start on boot
- GitHub Actions deployment

### Data Flow

**Offline Mode (Portable):**
```
iPhone → USB → Raspberry Pi (AP Mode) → Mobile App (WiFi)
                    ↓
              Local SQLite DB
```

**Online Mode (Synced):**
```
iPhone → USB → Raspberry Pi (Client Mode) → Backend API
                    ↓                             ↓
              Local Queue                   Cloud Database
                    ↓_____________________________↑
                           Sync Queue
```

---

## 📱 Mobile App Integration

The Pi exposes a REST API for mobile apps to connect in both modes:

**Offline (AP Mode):**
```javascript
const API_URL = 'http://192.168.50.1:3000';
```

**Online (Internet):**
```javascript
const API_URL = 'https://api.yourdomain.com';
```

**Auto-detect Mode:**
```javascript
import NetInfo from '@react-native-community/netinfo';

const state = await NetInfo.fetch();
if (state.details?.ssid === 'RaspberryPi-iOS') {
  // Use Pi local API
} else {
  // Use backend API
}
```

See [Local API Documentation](api/local-api.md) for complete endpoint reference.

---

## 🔧 Common Commands

### Device Management
```bash
# List devices
idevice_id -l

# Get device info
ideviceinfo

# Get device name
idevicename

# Battery status
ideviceinfo -q com.apple.mobile.battery

# Check pairing
idevicepair validate
```

### Service Management
```bash
# Check services
systemctl status usbmuxd
systemctl status pi-api

# Restart services
sudo systemctl restart usbmuxd
sudo systemctl restart pi-api

# View logs
journalctl -u pi-api -f
```

### WiFi Modes
```bash
cd ~/raspi-ios-bridge/pi-setup/network

# Switch to AP mode (portable)
sudo ./switch-mode.sh ap

# Switch to client mode (home network)
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

## 🛠️ Troubleshooting

### Quick Fixes

**Device not detected:**
```bash
sudo systemctl restart usbmuxd
# Ensure device is unlocked and trusted
```

**Permission errors:**
```bash
sudo usermod -a -G usbmux $USER
logout
# Log back in
```

**API not responding:**
```bash
sudo systemctl restart pi-api
journalctl -u pi-api -n 50
```

**WiFi issues:**
```bash
systemctl status hostapd    # AP mode
systemctl status wpa_supplicant  # Client mode
```

**Detailed troubleshooting:** See [Complete Setup Guide - Troubleshooting](hardware/setup-guide.md#troubleshooting)

---

## 📋 Checklist

### Initial Setup
- [ ] Raspberry Pi OS installed
- [ ] Internet connection available
- [ ] Repository cloned
- [ ] Installation script completed
- [ ] System rebooted
- [ ] Device detected (`idevice_id -l`)
- [ ] API responding (`curl localhost:3000/health`)

### WiFi Configuration
- [ ] AP mode configured
- [ ] Client mode configured
- [ ] Can switch between modes
- [ ] Mobile device can connect to AP
- [ ] Pi can connect to home WiFi

### Testing
- [ ] Device info retrieved
- [ ] Battery status retrieved
- [ ] Screenshot captured
- [ ] API endpoints working
- [ ] Sync queue functional (online mode)

---

## 🌐 Additional Resources

### Related Repositories

This is part of a multi-repository project:

1. **raspi-ios-bridge** (this repo) - Raspberry Pi hardware setup
2. **ios-bridge-mobile** - Mobile app (Expo/React Native)
3. **ios-bridge-backend** - Backend API (Python FastAPI)

### External Links

- **libimobiledevice:** https://libimobiledevice.org/
- **GitHub Repository:** https://github.com/libimobiledevice/libimobiledevice
- **Documentation:** https://docs.libimobiledevice.org/

---

## 📞 Support

### Getting Help

1. Check [Troubleshooting Section](hardware/setup-guide.md#troubleshooting)
2. Review [WiFi Modes Guide](hardware/wifi-modes.md) for network issues
3. Consult [API Documentation](api/local-api.md) for API errors
4. Check service logs: `journalctl -u pi-api -n 100`

### Common Issues

| Issue | Guide | Section |
|-------|-------|---------|
| Device not detected | [Setup Guide](hardware/setup-guide.md) | Troubleshooting → Device Not Detected |
| Permission errors | [Setup Guide](hardware/setup-guide.md) | Troubleshooting → Permission Denied |
| WiFi connection | [WiFi Guide](hardware/wifi-modes.md) | Troubleshooting |
| API errors | [API Docs](api/local-api.md) | Error Responses |
| libplist assertion | [Setup Guide](hardware/setup-guide.md) | Troubleshooting → libplist Assertion |

---

## 📄 License

This project is MIT licensed. libimobiledevice is licensed under LGPL v2.1.

---

**Last Updated:** January 21, 2026

**Compatible With:**
- Raspberry Pi OS (64-bit)
- iOS 12 - iOS 26.2
- libimobiledevice 1.4.0
- Node.js 20.x
