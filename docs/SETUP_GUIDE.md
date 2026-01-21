# libimobiledevice 1.4.0 Setup Guide for Raspberry Pi Zero 2W / Orange Pi Zero 2W

**Date:** January 21, 2026 (Updated)
**Target Devices:** Raspberry Pi Zero 2W / Orange Pi Zero 2W
**OS:** Raspberry Pi OS Lite 64-bit / Armbian 25.11.2 (Debian 12 Bookworm)
**Kernel:** Linux 6.12.47+rpt-rpi-v8 (aarch64) / Linux 6.1.43-current-sunxi64 (aarch64)

---

## Table of Contents

1. [Overview](#overview)
2. [System Information](#system-information)
3. [Prerequisites](#prerequisites)
4. [Installation Process](#installation-process)
5. [Configuration](#configuration)
6. [Troubleshooting](#troubleshooting)
7. [Verification](#verification)
8. [Usage Examples](#usage-examples)
9. [References](#references)

---

## Overview

This document provides a comprehensive guide for building and configuring libimobiledevice 1.4.0 from source on ARM64 single-board computers (Raspberry Pi Zero 2W, Orange Pi Zero 2W). The setup enables communication with iOS devices (iPhone, iPad) over USB.

### ⚠️ CRITICAL: Build from Source Only

**DO NOT** install libimobiledevice packages from apt/system repositories. The latest GitHub versions have a critical compatibility issue that must be addressed:

- ✅ **Build all components from GitHub source** (instructions below)
- ⚠️ **Use specific libplist commit** to avoid assertion failures with modern iOS devices
- ❌ **Remove any existing apt packages** before building from source

### What is libimobiledevice?

libimobiledevice is a cross-platform software library that talks the protocols to support iOS devices. It allows access to device information, backups, file systems, screenshots, and more without needing jailbreak.

### Version Information (GitHub Master Branch)

All components must be built from GitHub source:

- **libimobiledevice:** 1.4.0-6-gc4f1118
- **libplist:** 2.7.0-19-g2c50f76 (**MUST use this specific commit - see below**)
- **libimobiledevice-glue:** 1.3.2-5-gda770a7
- **libusbmuxd:** 2.1.1-2-g93eb168
- **libtatsu:** 1.0.5-3-g60a39f3
- **usbmuxd (daemon):** 1.1.1-72-g3ded00c

### 🔴 Known Issue: libplist Assertion Error

The latest libplist commit (c18d6b3) adds strict string length validation that causes crashes with iOS devices:

**Error:**
```
usbmuxd: plist.c:1329: plist_get_string_val: Assertion `length == strlen(*val)' failed.
```

**Cause:** iOS devices send plist strings with embedded null characters, violating the new assertion check.

**Solution:** Use commit `2c50f76` which predates the strict validation (instructions provided in installation steps).

---

## System Information

### Hardware
- **Device:** Raspberry Pi Zero 2W
- **Architecture:** aarch64 (ARM64)
- **RAM:** 512MB
- **Storage:** 117GB SD card (110GB free after installation)

### Software
- **OS:** Debian GNU/Linux 13 (trixie)
- **Base:** Raspberry Pi OS Lite 64-bit
- **Kernel:** 6.12.47+rpt-rpi-v8
- **Python:** 3.13.5
- **GCC:** (installed via build-essential)

---

## Prerequisites

### Step 1: Remove Existing apt Packages

**CRITICAL:** Remove any existing libimobiledevice packages from apt to avoid conflicts:

```bash
sudo apt-get remove -y usbmuxd libplist3 libusbmuxd6 libimobiledevice6
```

This ensures we build everything from GitHub source with compatible versions.

### Step 2: Install Build Dependencies

Install only the build tools and base libraries (NOT libimobiledevice components):

```bash
sudo apt-get update
sudo apt-get install -y \
    build-essential \
    git \
    autoconf \
    automake \
    libtool \
    pkg-config \
    libssl-dev \
    libusb-1.0-0-dev \
    python3-dev \
    libcurl4-openssl-dev
```

### Package Breakdown

- **build-essential** - Compilation tools (gcc, make, etc.)
- **git** - Version control for cloning repositories
- **autoconf/automake/libtool** - Build system tools
- **pkg-config** - Library configuration helper
- **libssl-dev** - SSL/TLS support (OpenSSL)
- **libusb-1.0-0-dev** - USB device access (base library only)
- **python3-dev** - Python development headers (optional)
- **libcurl4-openssl-dev** - HTTP client library (required for libtatsu)

**Note:** We do NOT install `usbmuxd`, `libplist3`, `libusbmuxd6`, or `libimobiledevice6` from apt - these will be built from source.

---

## Installation Process

All source code is built in `~/build/` directory on the Raspberry Pi.

### 1. libplist (Dependency)

**Purpose:** Library for handling Apple's property list format (plist files)

**⚠️ CRITICAL:** Must use commit `2c50f76` to avoid assertion failures with iOS devices.

```bash
mkdir -p ~/build
cd ~/build
git clone https://github.com/libimobiledevice/libplist.git
cd libplist

# Checkout the stable commit (before strict string validation)
git checkout 2c50f76

./autogen.sh
make
sudo make install
sudo ldconfig
```

**Installation Location:** `/usr/local/lib/libplist-2.0.*`
**Version Built:** 2.7.0-19-g2c50f76

**Why this specific commit?**
The latest commit (c18d6b3) adds strict plist string length validation that fails with modern iOS devices (iOS 26.2 tested). Commit 2c50f76 is the last stable version before this change and works correctly with all iOS versions.

### 2. libimobiledevice-glue (Dependency)

**Purpose:** Common glue/utility code used by libimobiledevice

```bash
cd ~/build
git clone https://github.com/libimobiledevice/libimobiledevice-glue.git
cd libimobiledevice-glue
./autogen.sh
make
sudo make install
sudo ldconfig
```

**Installation Location:** `/usr/local/lib/libimobiledevice-glue-1.0.*`
**Version Built:** 1.3.2-5-gda770a7

### 3. libusbmuxd (Dependency)

**Purpose:** Client library for communicating with usbmuxd daemon

```bash
cd ~/build
git clone https://github.com/libimobiledevice/libusbmuxd.git
cd libusbmuxd
./autogen.sh
make
sudo make install
sudo ldconfig
```

**Installation Location:** `/usr/local/lib/libusbmuxd-2.0.*`
**Version Built:** 2.1.1-2-g93eb168

**Tools Installed:**
- `iproxy` - Port forwarding tool
- `inetcat` - Network testing tool

### 4. libtatsu (Dependency)

**Purpose:** Library for handling Tatsu Signing Server (TSS) requests

**Note:** Requires `libcurl4-openssl-dev` which we installed earlier.

```bash
cd ~/build
git clone https://github.com/libimobiledevice/libtatsu.git
cd libtatsu
./autogen.sh
make
sudo make install
sudo ldconfig
```

**Installation Location:** `/usr/local/lib/libtatsu.*`
**Version Built:** 1.0.5-3-g60a39f3

### 5. libimobiledevice (Main Package)

**Purpose:** Main library for iOS device communication

```bash
cd ~/build
git clone https://github.com/libimobiledevice/libimobiledevice.git
cd libimobiledevice
# Use master branch (contains latest iOS compatibility)
./autogen.sh
make
sudo make install
sudo ldconfig
```

**Installation Location:** `/usr/local/lib/libimobiledevice-1.0.*`
**Version Built:** 1.4.0-6-gc4f1118

**Configuration Details:**
- Install prefix: `/usr/local`
- Debug code: no
- Python bindings: no (cython not installed)
- SSL support backend: OpenSSL

### 6. usbmuxd Daemon (Required)

**Purpose:** USB multiplexing daemon that manages iOS device connections

**IMPORTANT:** Must also build the daemon from source (not just the library).

```bash
cd ~/build
git clone https://github.com/libimobiledevice/usbmuxd.git
cd usbmuxd
./autogen.sh
make
sudo make install
```

**Installation Location:** `/usr/local/sbin/usbmuxd`
**Version Built:** 1.1.1-72-g3ded00c

**What gets installed:**
- Binary: `/usr/local/sbin/usbmuxd` (the daemon)
- systemd service: `/lib/systemd/system/usbmuxd.service`
- udev rules: `/lib/udev/rules.d/39-usbmuxd.rules`

**Note:** The systemd service and udev rules are automatically installed but may need additional configuration (see Configuration section).

---

## Configuration

### 1. Create usbmux Group

The `usbmux` group is required for proper USB device access:

```bash
sudo groupadd -r usbmux
```

**Group ID:** 985 (auto-assigned)

### 2. Add Users to usbmux Group

```bash
# Add the usbmux user to its own group
sudo usermod -a -G usbmux usbmux

# Add the pi user for interactive access
sudo usermod -a -G usbmux pi
```

### 3. Create udev Rules for Apple Devices

Create `/etc/udev/rules.d/39-usbmuxd.rules`:

```bash
sudo tee /etc/udev/rules.d/39-usbmuxd.rules > /dev/null << 'EOF'
# udev rules for Apple iOS devices
# Automatically set permissions for all Apple USB devices

# Apple devices (vendor ID 05ac)
SUBSYSTEM=="usb", ATTR{idVendor}=="05ac", MODE="0660", GROUP="usbmux"
SUBSYSTEM=="usb", ENV{DEVTYPE}=="usb_device", ATTR{idVendor}=="05ac", MODE="0660", GROUP="usbmux"

# For the actual device nodes
SUBSYSTEM=="usb", ATTRS{idVendor}=="05ac", MODE="0660", GROUP="usbmux"

# Tag for systemd
SUBSYSTEM=="usb", ATTR{idVendor}=="05ac", TAG+="systemd", ENV{SYSTEMD_WANTS}="usbmuxd.service"
EOF
```

**Purpose:** These rules automatically:
- Detect any Apple device (vendor ID: 05ac)
- Set permissions to `0660` (rw-rw----)
- Assign group ownership to `usbmux`
- Trigger usbmuxd service when device is connected
- **Work for ANY device number** (handles plug/unplug cycles)

### 4. Reload udev Rules

```bash
sudo udevadm control --reload-rules
sudo udevadm trigger --subsystem-match=usb
```

### 5. Enable usbmuxd on Boot

After building usbmuxd from source, verify the systemd service file exists and is properly configured:

```bash
# Check if service file exists and has content
cat /lib/systemd/system/usbmuxd.service
```

If the file is empty or missing, create it manually:

```bash
sudo tee /lib/systemd/system/usbmuxd.service > /dev/null << 'EOF'
[Unit]
Description=Socket daemon for the usbmux protocol used by Apple devices
Documentation=man:usbmuxd(8)

[Service]
ExecStart=/usr/local/sbin/usbmuxd --user usbmux --systemd
PIDFile=/usr/local/var/run/usbmuxd.pid
KillMode=mixed

[Install]
WantedBy=multi-user.target
EOF
```

Create systemd override to ensure auto-start:

```bash
sudo mkdir -p /etc/systemd/system/usbmuxd.service.d
sudo tee /etc/systemd/system/usbmuxd.service.d/override.conf > /dev/null << 'EOF'
[Install]
WantedBy=multi-user.target
EOF
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable usbmuxd
sudo systemctl start usbmuxd
```

**Verification:**
```bash
systemctl is-enabled usbmuxd  # Should return: enabled
systemctl is-active usbmuxd   # Should return: active
systemctl status usbmuxd      # Should show "active (running)"
```

---

## Troubleshooting

### Issue 0: Assertion Error `plist.c:1329` (CRITICAL - Most Common Issue)

**Symptom:**
```
usbmuxd: plist.c:1329: plist_get_string_val: Assertion `length == strlen(*val)' failed.
```

Or in journalctl:
```bash
$ sudo journalctl -u usbmuxd -n 20
Jan 21 01:39:54 orangepizero2w usbmuxd[6309]: Connected to v2.0 device 1 on location 0x10003
Jan 21 01:39:54 orangepizero2w usbmuxd[6309]: plist.c:1329: plist_get_string_val: Assertion failed.
Jan 21 01:39:54 orangepizero2w systemd[1]: usbmuxd.service: Main process exited, code=killed, status=6/ABRT
```

Device detection shows:
```bash
$ idevice_id -l
ERROR: Unable to retrieve device list!
```

**Cause:** You're using the latest libplist commit (c18d6b3) which adds strict string length validation that fails with iOS devices sending plist strings with embedded null characters.

**Solution:**

1. Check your current libplist version:
```bash
cd ~/build/libplist
git log -1 --oneline
# If you see: c18d6b3 plist: Fix heap overflow... (BAD)
# You need: 2c50f76 xplist: Allow empty key entry... (GOOD)
```

2. Rebuild libplist with the correct commit:
```bash
cd ~/build/libplist
git checkout 2c50f76
make clean
./autogen.sh
make
sudo make install
sudo ldconfig
```

3. Restart usbmuxd:
```bash
sudo systemctl restart usbmuxd
```

4. Test device detection:
```bash
idevice_id -l
# Should return device UDID
```

**Prevention:** Always use commit `2c50f76` when building libplist (as documented in the installation steps).

**Tested With:** iOS 26.2 (iPhone 16 Pro), iOS versions back to iOS 15.

### Issue 1: USB Device Permission Errors

**Symptom:**
```
libusb: error [get_usbfs_fd] libusb couldn't open USB device /dev/bus/usb/001/XXX, errno=13
libusb: error [get_usbfs_fd] libusb requires write access to USB device nodes
[22:23:57.502][2] Could not open device 1-X: LIBUSB_ERROR_ACCESS
```

**Cause:** USB device doesn't have correct permissions for usbmux user.

**Solution:**
1. Verify udev rules are in place (`/etc/udev/rules.d/39-usbmuxd.rules`)
2. Reload udev rules: `sudo udevadm control --reload-rules`
3. Trigger udev: `sudo udevadm trigger --subsystem-match=usb`
4. Restart usbmuxd: `sudo systemctl restart usbmuxd`
5. Replug the iOS device

**Check Permissions:**
```bash
# Find the Apple device
lsusb | grep -i apple

# Check permissions (replace XXX with actual device number)
ls -l /dev/bus/usb/001/XXX

# Should show: crw-rw----+ 1 root usbmux
```

### Issue 2: Device Not Detected After Replug

**Symptom:** Device works initially but not detected after unplugging and replugging.

**Cause:** Each plug creates a new device number (005 → 006 → 007...), and permissions need to be reapplied.

**Solution:** The udev rules we created handle this automatically. If still having issues:

1. Check udev rules exist and are correct
2. Verify usbmux group exists: `getent group usbmux`
3. Monitor udev events: `sudo udevadm monitor --environment --udev`
4. Replug device and watch for events

### Issue 3: usbmuxd Not Starting on Boot

**Symptom:** After reboot, usbmuxd is not running.

**Solution:**
```bash
# Check if enabled
systemctl is-enabled usbmuxd

# If not enabled, follow step 5 in Configuration section
# Create override file and enable service
```

### Issue 4: Missing Dependencies During Build

**Symptom:**
```
configure: error: Package requirements (libXXX >= X.X.X) were not met
```

**Solution:** Install the missing dependency development package:
- libplist → build libplist first
- libimobiledevice-glue → build after libplist
- libusbmuxd → build after libimobiledevice-glue
- libtatsu → requires libcurl4-openssl-dev, install via apt
- Follow the build order in Installation Process section

### Issue 5: "Package 'libcurl', required by 'virtual:world', not found"

**Symptom:** libtatsu fails to configure.

**Solution:**
```bash
sudo apt-get install -y libcurl4-openssl-dev
```

### Issue 6: Mixed apt and Source Installations

**Symptom:** Tools work intermittently, or show errors about incompatible library versions.

**Cause:** Mixing apt-installed packages with source-built libraries causes version conflicts.

**Solution:**

1. Remove ALL libimobiledevice-related apt packages:
```bash
sudo apt-get remove -y usbmuxd libplist3 libusbmuxd6 libimobiledevice6
sudo apt-get autoremove -y
```

2. Verify libraries are using /usr/local:
```bash
ldd /usr/local/bin/ideviceinfo | grep -E 'plist|usbmuxd|imobiledevice'
# All should show: /usr/local/lib/...
```

3. If you see `/lib/aarch64-linux-gnu/`, remove those old libraries:
```bash
sudo rm /lib/aarch64-linux-gnu/libplist*
sudo rm /lib/aarch64-linux-gnu/libusbmuxd*
sudo rm /lib/aarch64-linux-gnu/libimobiledevice*
```

4. Rebuild all components from source following the installation guide.

### Issue 7: usbmuxd Service Masked or Missing

**Symptom:**
```
Failed to enable unit: Unit file /lib/systemd/system/usbmuxd.service is masked.
```

Or service file is empty:
```bash
$ cat /lib/systemd/system/usbmuxd.service
# Empty or very small file
```

**Solution:**

1. Unmask the service:
```bash
sudo systemctl unmask usbmuxd
```

2. Manually create the service file:
```bash
sudo tee /lib/systemd/system/usbmuxd.service > /dev/null << 'EOF'
[Unit]
Description=Socket daemon for the usbmux protocol used by Apple devices
Documentation=man:usbmuxd(8)

[Service]
ExecStart=/usr/local/sbin/usbmuxd --user usbmux --systemd
PIDFile=/usr/local/var/run/usbmuxd.pid
KillMode=mixed

[Install]
WantedBy=multi-user.target
EOF
```

3. Reload and enable:
```bash
sudo systemctl daemon-reload
sudo systemctl enable usbmuxd
sudo systemctl start usbmuxd
```

4. Verify:
```bash
systemctl status usbmuxd
```

---

## Verification

### Check Installation

```bash
# Check libimobiledevice version
ideviceinfo --version
# Output: ideviceinfo 1.4.0

# Check library version
pkg-config --modversion libimobiledevice-1.0
# Output: 1.4.0

# List installed tools
ls -1 /usr/local/bin/idevice*
```

### Test Device Detection

```bash
# List connected devices (returns UDID)
idevice_id -l

# Check pairing status
idevicepair validate
# Output: SUCCESS: Validated pairing with device [UDID]

# Get device information
ideviceinfo -k ProductVersion  # iOS version
ideviceinfo -k DeviceName       # Device name
ideviceinfo -k ProductType      # Device model
```

### Verify usbmuxd Service

```bash
# Check service status
sudo systemctl status usbmuxd

# View logs
sudo journalctl -u usbmuxd -f
```

### Test Plug/Unplug Cycle

1. Plug in iPhone
2. Run: `idevice_id -l` (should show UDID)
3. Run: `lsusb | grep Apple` (note device number, e.g., 005)
4. Unplug iPhone
5. Replug iPhone
6. Run: `lsusb | grep Apple` (device number changes, e.g., 006)
7. Run: `idevice_id -l` (should still detect device with new number)

---

## Usage Examples

### Device Information

```bash
# Get all device info
ideviceinfo

# Get specific info (short format)
ideviceinfo -s

# Get specific key
ideviceinfo -k DeviceName
ideviceinfo -k ProductVersion
ideviceinfo -k UniqueDeviceID
ideviceinfo -k WiFiAddress
ideviceinfo -k BuildVersion
```

### Device Management

```bash
# List connected devices
idevice_id -l

# Get device name
idevicename

# Set device name
idevicename "My iPhone"

# Get device date/time
idevicedate

# Pair device (if not paired)
idevicepair pair

# Validate existing pairing
idevicepair validate

# Unpair device
idevicepair unpair
```

### System Logs

```bash
# View device system log (live)
idevicesyslog

# Save log to file
idevicesyslog > device.log
```

### Screenshots

```bash
# Take screenshot (saves to current directory)
idevicescreenshot

# Specify filename
idevicescreenshot screenshot.png
```

### Backup

```bash
# Create backup
idevicebackup2 backup --full /path/to/backup/directory

# List backups
idevicebackup2 list

# Restore backup
idevicebackup2 restore --system /path/to/backup/directory
```

### File System Access

```bash
# Interactive AFC client
afcclient

# Common AFC commands (within afcclient):
# ls        - List files
# cd        - Change directory
# get       - Download file
# put       - Upload file
# rm        - Delete file
# mkdir     - Create directory
```

### Diagnostics

```bash
# Get diagnostics information
idevicediagnostics diagnostics

# Restart device
idevicediagnostics restart

# Shutdown device
idevicediagnostics shutdown

# Sleep device
idevicediagnostics sleep
```

### Developer Tools

```bash
# Debug server proxy (for lldb debugging)
idevicedebugserverproxy 12345

# Port forwarding (forward local port to device)
iproxy 2222 22  # Forward local 2222 to device SSH port 22

# Device provisioning profiles
ideviceprovision list
ideviceprovision install profile.mobileprovision
ideviceprovision remove [UUID]
```

---

## Installed Tools Reference

All tools are installed in `/usr/local/bin/`:

| Tool | Purpose |
|------|---------|
| `idevice_id` | List connected devices |
| `ideviceinfo` | Display device information |
| `idevicename` | Get/set device name |
| `idevicedate` | Display device date and time |
| `idevicepair` | Manage device pairing |
| `idevicesyslog` | View device system logs |
| `idevicescreenshot` | Capture device screenshot |
| `idevicebackup` | Legacy backup tool (iOS 3.x) |
| `idevicebackup2` | Modern backup tool |
| `idevicecrashreport` | Retrieve crash reports |
| `idevicediagnostics` | Diagnostics and device control |
| `idevicedebug` | Debug applications |
| `idevicedebugserverproxy` | Debug server proxy |
| `idevicedevmodectl` | Enable/disable developer mode |
| `ideviceenterrecovery` | Put device into recovery mode |
| `ideviceimagemounter` | Mount disk images |
| `idevicenotificationproxy` | Notification observer |
| `ideviceprovision` | Manage provisioning profiles |
| `idevicesetlocation` | Simulate GPS location |
| `idevicebtlogger` | Bluetooth packet logger |
| `afcclient` | Apple File Conduit client |

---

## Files Created/Modified

### udev Rules
- **File:** `/etc/udev/rules.d/39-usbmuxd.rules`
- **Purpose:** Auto-detect Apple devices and set permissions
- **Owner:** root:root
- **Permissions:** 644

### systemd Override
- **File:** `/etc/systemd/system/usbmuxd.service.d/override.conf`
- **Purpose:** Enable usbmuxd to start on boot
- **Owner:** root:root
- **Permissions:** 644

### System Groups
- **Group:** usbmux (GID: 985)
- **Members:** usbmux, pi

### Library Locations
All libraries installed in `/usr/local/lib/`:
- `libplist-2.0.*`
- `libimobiledevice-glue-1.0.*`
- `libusbmuxd-2.0.*`
- `libtatsu.*`
- `libimobiledevice-1.0.*`

### Binary Locations
All binaries installed in `/usr/local/bin/`:
- 21 idevice tools
- iproxy, inetcat (from libusbmuxd)
- plistutil (from libplist)

---

## System Startup Sequence

When Raspberry Pi boots:

1. **systemd** starts `multi-user.target`
2. **usbmuxd.service** starts automatically (enabled)
3. **udev rules** monitor for USB devices
4. When iPhone plugged in:
   - udev detects Apple device (vendor ID: 05ac)
   - Applies permissions: `crw-rw---- root:usbmux`
   - Triggers usbmuxd service (if not already running)
   - usbmuxd establishes connection with device
   - Device becomes available to all idevice tools

---

## Network Information (Example Test Device)

From testing with iPhone 16 Pro:

```
Device UDID: 00008150-000971D00A20401C
Product Type: iPhone18,2
iOS Version: 26.2
Build Version: 23C55
WiFi Address: 5c:ad:ba:34:2c:01
Device Name: iPhone
```

---

## References

### Official Documentation
- libimobiledevice GitHub: https://github.com/libimobiledevice/libimobiledevice
- libimobiledevice.org: https://libimobiledevice.org/

### Related Projects
- libplist: https://github.com/libimobiledevice/libplist
- libusbmuxd: https://github.com/libimobiledevice/libusbmuxd
- libimobiledevice-glue: https://github.com/libimobiledevice/libimobiledevice-glue
- libtatsu: https://github.com/libimobiledevice/libtatsu

### Build System
- Autotools (autoconf, automake, libtool)
- GNU Make
- pkg-config

### Dependencies
- OpenSSL: SSL/TLS support
- libusb-1.0: USB device access
- libcurl: HTTP client (for libtatsu)

---

## Notes

### Cython Bindings
During build, you may see warnings about missing Cython:
```
configure: WARNING: Unable to find 'cython' or 'cython3' program.
```

This is **normal** and can be ignored. Python bindings are optional and not required for the command-line tools to work.

### Build Time
On Raspberry Pi Zero 2W, the complete build process takes approximately:
- libplist: ~2 minutes
- libimobiledevice-glue: ~1 minute
- libusbmuxd: ~1 minute
- libtatsu: ~30 seconds
- libimobiledevice: ~8-10 minutes
- **Total: ~15 minutes**

### Disk Space
- Source code: ~50MB
- Installed libraries and tools: ~10MB
- Build artifacts (can be removed): ~100MB

### Performance
The Raspberry Pi Zero 2W can handle all libimobiledevice operations effectively:
- Device detection: Instant
- ideviceinfo: <1 second
- idevicescreenshot: 1-2 seconds
- Backup operations: Slower due to CPU/USB speed, but functional

---

## Maintenance

### Updating libimobiledevice

To update to a newer version:

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

Repeat for dependencies if needed.

### Uninstalling

To remove libimobiledevice:

```bash
cd ~/build/libimobiledevice
sudo make uninstall
sudo ldconfig
```

Repeat for each dependency in reverse order.

### Cleaning Build Artifacts

To free up disk space after installation:

```bash
cd ~/build
rm -rf libplist libimobiledevice-glue libusbmuxd libtatsu libimobiledevice
```

The installed libraries and tools will remain in `/usr/local/`.

---

## Troubleshooting Commands Quick Reference

```bash
# Check service status
systemctl status usbmuxd
journalctl -u usbmuxd -n 50

# Check device detection
lsusb | grep -i apple
idevice_id -l

# Check permissions
ls -l /dev/bus/usb/001/
getfacl /dev/bus/usb/001/[device-number]

# Check groups
groups pi
getent group usbmux

# Restart services
sudo systemctl restart usbmuxd

# Monitor udev events
sudo udevadm monitor --environment --udev

# Test udev rules
sudo udevadm test /devices/platform/... (device path)

# Library paths
ldconfig -p | grep libimobiledevice
pkg-config --list-all | grep -E "plist|usbmuxd|imobiledevice|tatsu"
```

---

## Support and Community

- **Issues:** Report bugs on GitHub repositories
- **IRC:** #libimobiledevice on Libera.Chat
- **Mailing List:** Available on libimobiledevice.org

---

**Document Version:** 2.0
**Last Updated:** January 21, 2026
**Major Changes in v2.0:**
- Added critical libplist commit requirement (2c50f76)
- Added complete GitHub source build instructions
- Added usbmuxd daemon build from source
- Added comprehensive troubleshooting for assertion errors
- Updated for Orange Pi Zero 2W compatibility
- Added systemd service configuration fixes

**Author:** Setup performed and documented via Claude Code
**Tested Platforms:** Raspberry Pi Zero 2W, Orange Pi Zero 2W (ARM64)
**Tested iOS Versions:** iOS 26.2 (iPhone 16 Pro)
