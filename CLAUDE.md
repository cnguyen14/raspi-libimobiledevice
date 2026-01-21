# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **documentation repository** for libimobiledevice 1.4.0 setup on Raspberry Pi Zero 2W. It contains comprehensive guides for building, configuring, and using libimobiledevice to communicate with iOS devices over USB.

**Important:** This repository contains NO source code - only documentation files.

## Repository Purpose

- Target Platforms: Raspberry Pi Zero 2W / Orange Pi Zero 2W (ARM64)
- OS: Raspberry Pi OS Lite 64-bit / Armbian 25.11.2 (Debian 12 Bookworm)
- libimobiledevice Version: 1.4.0-6-gc4f1118 (GitHub master)
- Documentation Date: January 21, 2026 (Updated)

**⚠️ CRITICAL:** All libimobiledevice components MUST be built from GitHub source. Do NOT use apt packages. See [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md) for detailed installation instructions including the required libplist commit (2c50f76) to avoid assertion failures with modern iOS devices.

### New: iOS Bridge API System

The Raspberry Pi now includes a **portable iOS device bridge system** that extends libimobiledevice functionality over WiFi:

**Components Installed:**
- **Node.js API Server** (`~/ios-bridge-api/`) - HTTP REST API exposing libimobiledevice commands
- **Electron.js GUI** (`~/ios-bridge-gui/`) - Touchscreen control interface for 7" displays
- **WiFi Mode Switching** - Dual mode: AP (portable hotspot) or Client (home network)
- **Auto-start Services** - Both API and GUI start automatically on boot

**Key Features:**
- RESTful endpoints: device info, screenshots, battery status, system logs
- WiFi AP mode: `RaspberryPi-iOS` (password: raspberry123) at 192.168.50.1
- WiFi Client mode: Connects to home network for backend sync
- CORS-enabled for mobile app integration
- Runs on port 3000 (API) and displays on DISPLAY :0 (GUI)

**Services:**
- `ios-bridge-api.service` - Node.js API server
- `ios-bridge-gui.service` - Electron.js GUI application
- Both enabled and running

**Important:** When testing WiFi mode switching, SSH connectivity will be lost temporarily. Only switch modes when ready to test the complete system.

### New: Chromium Kiosk with CI/CD Deployment

The Raspberry Pi 4 is configured as a **Chromium kiosk** that automatically updates when code is pushed to GitHub:

**Components Installed:**
- **Chromium Browser** - Fullscreen kiosk mode
- **Node.js 20 + PM2** - Web server process management
- **serve** - Static file server on port 3000
- **xdotool** - Browser automation for auto-refresh

**Architecture:**
```
GitHub Push → GitHub Actions Build → SSH Deploy → PM2 Restart → Chromium Refresh
```

**Key Features:**
- Automatic deployment from GitHub Actions
- Password-based SSH deployment (learning setup)
- PM2 process management with auto-restart
- Chromium kiosk displays `http://localhost:3000`
- Auto-refresh via xdotool (F5 key simulation)
- Survives reboots - kiosk starts automatically

**System Services:**
- `kiosk.service` - Chromium kiosk autostart
- PM2 managed process: `kiosk-app` (serve on port 3000)

**File Locations:**
- App files: `/home/pi/app/`
- Kiosk script: `/home/pi/kiosk.sh`
- Systemd service: `/etc/systemd/system/kiosk.service`
- PM2 config: `/home/pi/.pm2/`

**Documentation:** See [docs/KIOSK_SETUP.md](docs/KIOSK_SETUP.md) for complete setup guide, GitHub Actions configuration, and troubleshooting.

## Raspberry Pi 4 Connection

**IMPORTANT:** This documentation repository is paired with a live Raspberry Pi 4 system fully configured with Chromium kiosk and libimobiledevice.

### SSH Connection Details
- **Host:** 192.168.1.137
- **User:** pi
- **Password:** root
- **Hostname:** pi
- **Kernel:** Linux 6.12.47+rpt-rpi-v8 (aarch64)
- **OS:** Debian GNU/Linux 13 (trixie) - Raspberry Pi OS
- **Hardware:** Raspberry Pi 4 Model B

### Connecting to the Raspberry Pi

Using standard SSH:
```bash
ssh pi@192.168.1.137
# Password: root
```

Using sshpass (non-interactive):
```bash
sshpass -p 'root' ssh pi@192.168.1.137 "command"
```

For root access:
```bash
sshpass -p 'root' ssh pi@192.168.1.137 "echo 'root' | sudo -S command"
```

### libimobiledevice Installation Status

**✅ INSTALLED AND TESTED** - Installed January 21, 2026

libimobiledevice 1.4.0 has been successfully built from GitHub source and tested with iPhone iOS 26.2.

**Installed Components:**
1. ✅ libplist (2.7.0-22-g001a59e) - Commit 2c50f76 (critical for iOS 26.2 compatibility)
2. ✅ libimobiledevice-glue (1.3.2-3-gd0f6398)
3. ✅ libusbmuxd (2.1.1-2-gfe5c80a)
4. ✅ libtatsu (1.0.5-2-g1d5e76d)
5. ✅ libimobiledevice (1.4.0-6-gc4f1118)
6. ✅ usbmuxd daemon (1.1.1-51-ge8f7954) - Running and auto-starts

**Installation Locations:**
- Libraries: `/usr/local/lib`
- Tools: `/usr/local/bin` (23 idevice tools installed)
- Daemon: `/usr/local/sbin/usbmuxd`

**System Configuration:**
- ✅ udev rules: `/etc/udev/rules.d/39-usbmuxd.rules`
- ✅ systemd service: `/lib/systemd/system/usbmuxd.service`
- ✅ usbmux group (GID: 985) with user `pi` added
- ✅ Automatic device detection enabled

**Tested Device:**
- Device: iPhone (iPhone18,2)
- iOS Version: 26.2
- UDID: 00008150-000971D00A20401C
- Status: Paired and communicating successfully
- USB: Apple device ID 05ac:12a8

**Verified Functionality:**
- ✅ Device detection (`idevice_id -l`)
- ✅ Device information retrieval (`ideviceinfo`)
- ✅ Pairing validation (`idevicepair validate`)
- ✅ Device name query (`idevicename`)
- ✅ Battery status (`ideviceinfo -q com.apple.mobile.battery`)
- ⚠️ Screenshot requires developer disk image (expected limitation)
- ⚠️ idevicesyslog has symbol lookup error (minor, other tools work)

### System Resources
- **Hardware:** Raspberry Pi 4 Model B
- **Architecture:** ARM64 (aarch64)
- **OS:** Debian GNU/Linux 13 (trixie)
- **Kernel:** 6.12.47+rpt-rpi-v8

### System State (Last Updated: January 21, 2026)

**Current Status:** Fully configured with Chromium kiosk and libimobiledevice

**Installed Systems:**
1. ✅ Chromium Kiosk - Auto-starts on boot, displays `http://localhost:3000`
2. ✅ PM2 Web Server - Serves kiosk content, survives reboots
3. ✅ GitHub Actions CI/CD - Ready for deployment (requires GitHub secrets configuration)
4. ✅ libimobiledevice 1.4.0 - Full iOS device communication suite
5. ✅ usbmuxd - Automatic iPhone detection and pairing

**Verified Capabilities:**
- Chromium kiosk boots in ~10-20 seconds (minimal X11 setup)
- iPhone iOS 26.2 detection and communication working
- PM2 process management operational
- Ready for application deployment via GitHub push

### Common Remote Commands

**System Status:**
```bash
# Check system information
sshpass -p 'root' ssh pi@192.168.1.137 "uname -a"

# Check available disk space
sshpass -p 'root' ssh pi@192.168.1.137 "df -h"

# View system status
sshpass -p 'root' ssh pi@192.168.1.137 "systemctl status"

# Update system packages
sshpass -p 'root' ssh pi@192.168.1.137 "sudo apt update && sudo apt upgrade -y"
```

**iOS Device Commands:**
```bash
# List connected iOS devices (returns UDID)
sshpass -p 'root' ssh pi@192.168.1.137 "idevice_id -l"

# Get full device information
sshpass -p 'root' ssh pi@192.168.1.137 "ideviceinfo"

# Get device name
sshpass -p 'root' ssh pi@192.168.1.137 "idevicename"

# Get battery status
sshpass -p 'root' ssh pi@192.168.1.137 "ideviceinfo -q com.apple.mobile.battery"

# Check device pairing status
sshpass -p 'root' ssh pi@192.168.1.137 "idevicepair validate"
```

**Service Management:**
```bash
# Check usbmuxd service status
sshpass -p 'root' ssh pi@192.168.1.137 "systemctl status usbmuxd"

# View usbmuxd logs
sshpass -p 'root' ssh pi@192.168.1.137 "journalctl -u usbmuxd -n 20"

# Check PM2 processes
sshpass -p 'root' ssh pi@192.168.1.137 "pm2 status"

# View Chromium kiosk status (via X display)
sshpass -p 'root' ssh pi@192.168.1.137 "DISPLAY=:0 xdotool search --class chromium"
```

### Testing Changes

When updating documentation that includes commands or configurations:
1. SSH into the Raspberry Pi
2. Test the commands/configurations on the actual system
3. Verify the output matches documentation
4. Update documentation with accurate results

### Security Note

The password "root" is simple and should only be used on trusted local networks. For production use, consider using SSH key-based authentication and a stronger password.

## Documentation Structure

The repository contains five main documentation files in the `/docs` directory:

- **docs/README.md** - Overview and navigation guide
- **docs/SETUP_GUIDE.md** - Complete installation and configuration guide (17KB, comprehensive)
- **docs/QUICK_REFERENCE.md** - Fast command lookup (2.3KB)
- **docs/CONFIG_FILES.md** - Configuration files and setup scripts (3.8KB)
- **docs/KIOSK_SETUP.md** - Chromium kiosk and CI/CD deployment guide

## Key System Components Documented

### Build Process
The documentation covers building from source in this order:
1. libplist (2.7.0) - Property list handling
2. libimobiledevice-glue (1.3.2) - Utility code
3. libusbmuxd (2.1.1) - USB multiplexer client
4. libtatsu (1.0.5) - TSS request handling
5. libimobiledevice (1.4.0) - Main library

**Build location:** `~/build/` (on Raspberry Pi)
**Install prefix:** `/usr/local`

### System Configuration
Critical configuration files documented:
- `/etc/udev/rules.d/39-usbmuxd.rules` - Auto-detect Apple devices (vendor ID: 05ac)
- `/etc/systemd/system/usbmuxd.service.d/override.conf` - Enable boot-time startup
- Group: `usbmux` (GID: 985) with members: usbmux, pi

### Tools Installed
21 idevice tools documented, including:
- `idevice_id -l` - List devices
- `ideviceinfo` - Device information
- `idevicescreenshot` - Capture screenshots
- `idevicesyslog` - View system logs
- `idevicebackup2` - Backup/restore
- And 16 more specialized tools

## Common Documentation Tasks

### Updating Installation Instructions
When modifying docs/SETUP_GUIDE.md:
- Maintain the build order (dependencies first)
- Keep version numbers consistent throughout
- Update "Last Updated" date at bottom
- Ensure troubleshooting section addresses known issues

### Adding New Commands
When adding to docs/QUICK_REFERENCE.md:
- Keep commands concise (one-liners preferred)
- Group by category (Detection, Information, Tools, etc.)
- Include brief inline comments for clarity
- Maintain consistent formatting

### Configuration Changes
When updating docs/CONFIG_FILES.md:
- Include both the file content AND the command to apply it
- Use heredoc syntax for multi-line configurations
- Test commands work exactly as written
- Provide reload/restart commands where needed

## System Architecture Notes

### Automatic Device Detection Flow
1. systemd starts `usbmuxd.service` on boot
2. udev monitors USB bus for Apple devices (vendor ID: 05ac)
3. When iPhone plugged in, udev applies permissions (0660, group: usbmux)
4. usbmuxd establishes connection
5. All idevice tools can now access device

### Plug/Unplug Resilience
The udev rules use `ATTR{idVendor}=="05ac"` (vendor match) rather than specific device numbers, so they work regardless of which device number (/dev/bus/usb/001/XXX) the iPhone gets assigned. This solves the common issue where permissions break after replug.

## Important Technical Details

### Device Requirements
- iPhone must be **unlocked** and **trusted** (paired)
- Uses Apple's official protocols (no jailbreak needed)
- Works over USB only (not WiFi)

### Permission Model
- usbmuxd daemon runs as `usbmux:usbmux`
- USB devices assigned group `usbmux` with mode `0660`
- Users in `usbmux` group can access devices
- Requires logout/login after group membership changes

### Build Dependencies
System packages required (from apt):
- build-essential, git, autoconf, automake, libtool, pkg-config
- libssl-dev (OpenSSL for SSL/TLS)
- libusb-1.0-0-dev (USB device access)
- usbmuxd (multiplexer daemon)
- python3-dev (headers, optional)
- libcurl4-openssl-dev (required by libtatsu)

## Troubleshooting Reference

Common issues documented in docs/SETUP_GUIDE.md:

1. **USB Permission Errors** - Fix: reload udev rules, restart usbmuxd, replug device
2. **Device Not Detected After Replug** - Should be automatic; if fails, check udev rules
3. **usbmuxd Not Starting on Boot** - Fix: create systemd override, enable service
4. **Missing Dependencies** - Follow build order strictly
5. **libcurl Not Found** - Install libcurl4-openssl-dev before building libtatsu

## Performance Notes (Raspberry Pi Zero 2W)

- Device detection: Instant
- ideviceinfo query: <1 second
- idevicescreenshot: 1-2 seconds
- Build time: ~15 minutes total
- Disk usage: ~50MB source + ~10MB installed

## Maintenance Procedures

### Updating libimobiledevice
```bash
cd ~/build/libimobiledevice
git pull
git checkout [new-version-tag]
./autogen.sh
make clean
make
sudo make install
sudo ldconfig
```

### Backing Up Configuration
Essential files to backup:
- /etc/udev/rules.d/39-usbmuxd.rules
- /etc/systemd/system/usbmuxd.service.d/override.conf

Both are documented with full content in docs/CONFIG_FILES.md for easy restoration.

## Documentation Style Guidelines

### Formatting Conventions
- Use fenced code blocks with bash syntax highlighting
- Include command outputs as comments or in separate blocks
- Provide full file paths for all configuration files
- Use emoji sparingly (only in docs/README.md for visual navigation)

### Command Documentation
- Always show complete commands (no placeholders like [device-id])
- Include verification commands after making changes
- Provide both the action and how to check it worked
- Group related commands together with context

### Version References
When documenting versions, include:
- Version number (e.g., 1.4.0)
- Git commit hash if from master (e.g., 2.7.0-22-g001a59e)
- Build date
- Platform (ARM64, Raspberry Pi Zero 2W)

## Resources and References

- Official site: https://libimobiledevice.org/
- Main repository: https://github.com/libimobiledevice/libimobiledevice
- Related projects: libplist, libusbmuxd, libimobiledevice-glue, libtatsu

## File Organization

```
raspi-libimobiledevice/
├── CLAUDE.md              # This file - guidance for Claude Code
├── examples/              # Example configurations for deployment
│   ├── github-workflow.yml # GitHub Actions deployment template
│   └── test-page.html     # Test page for kiosk verification
└── docs/
    ├── README.md          # Entry point, overview, navigation
    ├── SETUP_GUIDE.md     # Complete setup, troubleshooting, reference
    ├── QUICK_REFERENCE.md # Fast command lookup for daily use
    ├── CONFIG_FILES.md    # Copy-paste configs and scripts
    └── KIOSK_SETUP.md     # Chromium kiosk and CI/CD guide
```

Each file serves a specific audience:
- docs/README.md: First-time visitors
- docs/SETUP_GUIDE.md: People doing installation
- docs/QUICK_REFERENCE.md: Daily users
- docs/CONFIG_FILES.md: System replication/backup
- docs/KIOSK_SETUP.md: Kiosk and CI/CD setup
