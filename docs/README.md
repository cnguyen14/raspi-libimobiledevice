# Raspberry Pi libimobiledevice Documentation

This directory contains comprehensive documentation for setting up and using libimobiledevice 1.4.0 on Raspberry Pi Zero 2W.

## Documentation Files

### 📘 [SETUP_GUIDE.md](SETUP_GUIDE.md)
**Complete installation and configuration guide**

The main documentation covering:
- System requirements and prerequisites
- Step-by-step build instructions for all dependencies
- Configuration of udev rules and systemd services
- Troubleshooting common issues
- Usage examples for all tools
- Reference information

**Use this for:** First-time setup, understanding the system, troubleshooting

---

### ⚡ [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
**Quick command reference**

Fast lookup guide with:
- Most commonly used commands
- Device detection and info queries
- Service management commands
- Quick troubleshooting steps
- File locations

**Use this for:** Daily usage, quick command lookup

---

### ⚙️ [CONFIG_FILES.md](CONFIG_FILES.md)
**Configuration files and setup scripts**

Contains:
- Complete udev rules file
- systemd service override configuration
- Group setup commands
- Ready-to-use setup script for replication

**Use this for:** Replicating setup on another system, backup reference

---

### 🌐 [iOS Bridge API](../../../pi/ios-bridge-api/README.md)
**Network API for iOS device communication**

HTTP REST API server that exposes libimobiledevice functionality over WiFi:
- RESTful endpoints for device info, screenshots, battery status, logs
- Dual WiFi mode: AP mode (portable) or Client mode (home network)
- Electron.js GUI for touchscreen control (7" display)
- Auto-start services with systemd
- CORS-enabled for mobile app integration

**Use this for:** Building mobile apps that communicate with iOS devices through the Raspberry Pi

**Location:** `~/ios-bridge-api/` on Raspberry Pi

---

## Quick Start

### If You're Setting Up for the First Time
1. Read [SETUP_GUIDE.md](SETUP_GUIDE.md)
2. Follow the installation steps in order
3. Configure using the examples in [CONFIG_FILES.md](CONFIG_FILES.md)
4. Keep [QUICK_REFERENCE.md](QUICK_REFERENCE.md) handy for daily use

### If You Already Have It Set Up
- Use [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for command lookups
- Refer to [SETUP_GUIDE.md](SETUP_GUIDE.md) Troubleshooting section if issues arise

---

## System Information

**Target Device:** Raspberry Pi Zero 2W / Orange Pi Zero 2W
**OS:** Raspberry Pi OS Lite / Armbian 64-bit (Debian 12/13)
**libimobiledevice Version:** 1.4.0
**Setup Date:** January 19, 2026

**Orange Pi Users:** GPU acceleration is **required** for optimal GUI performance. See [CONFIG_FILES.md](CONFIG_FILES.md#gpu-activation-orange-pi--armbian) for setup instructions.

---

## What is libimobiledevice?

libimobiledevice is a cross-platform software library that enables communication with iOS devices (iPhone, iPad, iPod Touch) without needing to jailbreak them. It provides:

- Device information retrieval
- Backup and restore functionality
- File system access
- Screenshot capture
- System log viewing
- And much more...

All tools work over USB connection and respect Apple's security protocols, requiring the device to be unlocked and trusted.

---

## Key Features of This Setup

✅ **Automatic Device Detection** - Plug and play, works every time
✅ **Persistent Configuration** - Survives reboots and system updates
✅ **Multi-Device Support** - Handle multiple iOS devices simultaneously
✅ **Plug/Unplug Resilient** - Works regardless of device number changes
✅ **Auto-Start on Boot** - usbmuxd service starts automatically
✅ **Complete Tool Suite** - All 21 idevice tools included
✅ **Network API** - HTTP REST API for remote access (Node.js/Express)
✅ **Dual WiFi Mode** - AP mode (portable) or Client mode (home network)
✅ **Touchscreen GUI** - Chromium kiosk mode control interface for 7" displays
✅ **Mobile-Ready** - CORS-enabled for Android/iOS app integration
✅ **GPU Acceleration** - Mali G31 hardware acceleration (Orange Pi Zero 2W)

---

## Most Common Commands

### Direct Device Access (libimobiledevice)
```bash
# List connected devices
idevice_id -l

# Get device information
ideviceinfo -s

# Take a screenshot
idevicescreenshot

# View device logs
idevicesyslog

# Check service status
systemctl status usbmuxd
```

### Network API Access (iOS Bridge)
```bash
# Check API status
curl http://localhost:3000/api/health

# Get device info via API
curl http://localhost:3000/api/device/info

# Get battery status
curl http://localhost:3000/api/device/battery

# Check WiFi mode
curl http://localhost:3000/api/wifi/status

# Manage API service
sudo systemctl status ios-bridge-api.service
```

See [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for more commands and [iOS Bridge API README](../../../pi/ios-bridge-api/README.md) for complete API documentation.

---

## Troubleshooting

If you encounter issues:

1. Check [SETUP_GUIDE.md - Troubleshooting Section](SETUP_GUIDE.md#troubleshooting)
2. Use [QUICK_REFERENCE.md - Troubleshooting](QUICK_REFERENCE.md#troubleshooting)
3. Verify configurations match [CONFIG_FILES.md](CONFIG_FILES.md)

Common issues and solutions are well-documented in the guides.

---

## File Structure

```
raspi-libimobiledevice/
├── README.md                  # This file - overview and index
├── SETUP_GUIDE.md            # Complete setup and reference guide
├── QUICK_REFERENCE.md        # Quick command reference
└── CONFIG_FILES.md           # Configuration files and scripts
```

---

## Additional Resources

- **libimobiledevice Project:** https://libimobiledevice.org/
- **GitHub Repository:** https://github.com/libimobiledevice/libimobiledevice
- **Issue Tracker:** Report bugs on GitHub

---

## Maintenance

### Updating libimobiledevice

Refer to [SETUP_GUIDE.md - Maintenance](SETUP_GUIDE.md#maintenance) section for update procedures.

### Backing Up Your Configuration

The important files to backup are:
- `/etc/udev/rules.d/39-usbmuxd.rules`
- `/etc/systemd/system/usbmuxd.service.d/override.conf`

These are documented in [CONFIG_FILES.md](CONFIG_FILES.md) for easy restoration.

---

## Support

This documentation was created during the setup process on January 19, 2026.

For issues with:
- **This setup:** Refer to troubleshooting sections in the guides
- **libimobiledevice bugs:** Report on GitHub
- **General usage:** Consult the official documentation

---

**Happy iOS device hacking! 📱**
