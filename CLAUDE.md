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

## Orange Pi Connection

**IMPORTANT:** This documentation repository is paired with a live Orange Pi Zero 2W system where libimobiledevice is installed and operational.

### SSH Connection Details
- **Host:** 192.168.68.69
- **User:** orangepi
- **Password:** orangepi
- **Root Password:** orangepi
- **Hostname:** orangepi
- **Kernel:** Linux 6.1.43-current-sunxi64 (aarch64)
- **OS:** Armbian 25.11.2 (Debian 12 Bookworm)
- **SoC:** Allwinner H616 with Mali G31 MP2 GPU

### Connecting to the Orange Pi

Using standard SSH:
```bash
ssh orangepi@192.168.68.69
# Password: orangepi
```

Using sshpass (non-interactive):
```bash
sshpass -p 'orangepi' ssh orangepi@192.168.68.69 "command"
```

For root access:
```bash
sshpass -p 'orangepi' ssh orangepi@192.168.68.69 "echo 'orangepi' | sudo -S command"
```

### libimobiledevice Installation Status

**✅ INSTALLED** (January 21, 2026) - All components built from GitHub source

**Installed Versions:**
- libplist: 2.7.0-19-g2c50f76 (specific commit to avoid assertion errors)
- libimobiledevice-glue: 1.3.2-5-gda770a7
- libusbmuxd: 2.1.1-2-g93eb168
- libtatsu: 1.0.5-3-g60a39f3
- libimobiledevice: 1.4.0-6-gc4f1118
- usbmuxd daemon: 1.1.1-72-g3ded00c

**Installation Location:** `/usr/local/lib` and `/usr/local/bin`

**Status:**
```bash
sshpass -p 'orangepi' ssh orangepi@192.168.68.69 "ideviceinfo --version"
# Output: ideviceinfo 1.4.0-6-gc4f1118

sshpass -p 'orangepi' ssh orangepi@192.168.68.69 "systemctl is-active usbmuxd"
# Output: active

sshpass -p 'orangepi' ssh orangepi@192.168.68.69 "idevice_id -l"
# Output: 00008150-000971D00A20401C (when iPhone connected)
```

**Testing Results:**
- ✅ Device detection: Working
- ✅ Device info retrieval: Working
- ✅ Date/time sync: Working
- ✅ Tested with: iOS 26.2 (iPhone 16 Pro)

**Critical Notes:**
- All apt packages (usbmuxd, libplist3, libusbmuxd6, libimobiledevice6) were removed
- Must use libplist commit 2c50f76 to avoid assertion failures
- systemd service configured and enabled on boot

For reinstallation or troubleshooting, see [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md).

### System Resources
- **Memory:** 4 GB RAM
- **Storage:** 64 GB SD card
- **OS:** Armbian 25.11.2 (Debian 12 Bookworm)
- **Display:** QDTECH MPI7002 7" touchscreen (1024x600)

### System State (Last Updated: January 21, 2026)

**Current Status:** Fresh Armbian installation with optimizations

**Mali GPU:** ✅ Activated
- Configuration: `/boot/armbianEnv.txt` with `overlays=gpu`
- DRM devices: card0, card1, renderD128
- Renderer: Mali-G31 (Panfrost)

**Boot Performance:** ✅ Optimized
- Boot time: 10.9 seconds (4.3s kernel + 6.6s userspace)
- Optimized from baseline by disabling unnecessary services

**Disabled Services (for faster boot):**
- bluetooth.service, aw859a-bluetooth.service (Bluetooth not needed)
- armbian-zram-config.service (ZRAM swap, 4GB RAM sufficient)
- armbian-ramlog.service (RAM logging)
- rsyslog.service (using journald instead)
- armbian-hardware-monitor.service (not critical)
- e2scrub_reap.service (filesystem scrubbing)
- fake-hwclock.service (using systemd-timesyncd)
- systemd-networkd-wait-online.service (prevents boot delays)

**Disabled Timers:**
- apt-daily.timer, apt-daily-upgrade.timer (manual updates)
- e2scrub_all.timer, dpkg-db-backup.timer (not critical)

**Enabled Services (essential only):**
- ssh.service (remote access)
- systemd-networkd.service, systemd-resolved.service (networking)
- systemd-timesyncd.service (time sync)
- aw859a-wifi.service, wpa_supplicant.service (WiFi)
- cron.service (scheduled tasks)
- armbian-hardware-optimize.service, armbian-led-state.service (system optimization)

### Common Remote Commands

Run idevice commands on the Orange Pi:
```bash
# List connected iOS devices
sshpass -p 'orangepi' ssh orangepi@192.168.68.69 "idevice_id -l"

# Get device information
sshpass -p 'orangepi' ssh orangepi@192.168.68.69 "ideviceinfo -s"

# Check usbmuxd service status
sshpass -p 'orangepi' ssh orangepi@192.168.68.69 "systemctl status usbmuxd"

# View system logs
sshpass -p 'orangepi' ssh orangepi@192.168.68.69 "journalctl -u usbmuxd -n 20"
```

### Testing Changes

When updating documentation that includes commands or configurations:
1. SSH into the Orange Pi
2. Test the commands/configurations on the actual system
3. Verify the output matches documentation
4. Update documentation with accurate results

### Security Note

The password "orangepi" is simple and should only be used on trusted local networks. This is typical for development/testing Orange Pi setups.

## Documentation Structure

The repository contains four main documentation files in the `/docs` directory:

- **docs/README.md** - Overview and navigation guide
- **docs/SETUP_GUIDE.md** - Complete installation and configuration guide (17KB, comprehensive)
- **docs/QUICK_REFERENCE.md** - Fast command lookup (2.3KB)
- **docs/CONFIG_FILES.md** - Configuration files and setup scripts (3.8KB)

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
└── docs/
    ├── README.md          # Entry point, overview, navigation
    ├── SETUP_GUIDE.md     # Complete setup, troubleshooting, reference
    ├── QUICK_REFERENCE.md # Fast command lookup for daily use
    └── CONFIG_FILES.md    # Copy-paste configs and scripts
```

Each file serves a specific audience:
- docs/README.md: First-time visitors
- docs/SETUP_GUIDE.md: People doing installation
- docs/QUICK_REFERENCE.md: Daily users
- docs/CONFIG_FILES.md: System replication/backup
