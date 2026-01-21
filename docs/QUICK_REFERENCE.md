# libimobiledevice Quick Reference Guide

## Installation Quick Reference

### ⚠️ CRITICAL: Build from Source Only

**DO NOT** install from apt. All components MUST be built from GitHub:

```bash
# Remove apt packages first
sudo apt-get remove -y usbmuxd libplist3 libusbmuxd6 libimobiledevice6

# Build order:
# 1. libplist (MUST use commit 2c50f76)
# 2. libimobiledevice-glue
# 3. libusbmuxd
# 4. libtatsu
# 5. libimobiledevice
# 6. usbmuxd (daemon)
```

### Required libplist Commit

**CRITICAL:** Use commit `2c50f76` to avoid assertion failures:

```bash
cd ~/build/libplist
git checkout 2c50f76  # REQUIRED - latest commit causes crashes
./autogen.sh && make && sudo make install && sudo ldconfig
```

**Why?** Latest commit (c18d6b3) adds strict string length validation that fails with iOS devices.

### Verify Installation

```bash
# Check versions
ideviceinfo --version                               # Should show: 1.4.0-6-gc4f1118
ldd /usr/local/bin/ideviceinfo | grep plist        # Should show: /usr/local/lib/libplist

# Check libplist commit
cd ~/build/libplist && git log -1 --oneline        # Should show: 2c50f76

# Test with device
idevice_id -l                                       # Should return UDID
ideviceinfo -k DeviceName                          # Should return device name
```

### Troubleshoot Assertion Error

If you see: `plist.c:1329: plist_get_string_val: Assertion failed`

```bash
# Fix: Rebuild libplist with correct commit
cd ~/build/libplist
git checkout 2c50f76
make clean && ./autogen.sh && make && sudo make install && sudo ldconfig
sudo systemctl restart usbmuxd
idevice_id -l  # Should work now
```

---

## Most Common Commands

### Device Detection
```bash
# List connected devices
idevice_id -l

# Check pairing status
idevicepair validate

# Get device info
ideviceinfo -s
```

### Device Information
```bash
ideviceinfo -k DeviceName          # Device name
ideviceinfo -k ProductVersion      # iOS version
ideviceinfo -k ProductType         # Model (e.g., iPhone18,2)
ideviceinfo -k UniqueDeviceID      # UDID
ideviceinfo -k WiFiAddress         # WiFi MAC address
ideviceinfo -k BuildVersion        # Build number
```

### Useful Tools
```bash
idevicename                        # Get device name
idevicedate                        # Get device date/time
idevicescreenshot screenshot.png   # Take screenshot
idevicesyslog                      # View live logs
idevicediagnostics restart         # Restart device
```

## Service Management

### Check usbmuxd Status
```bash
systemctl status usbmuxd
systemctl is-active usbmuxd
systemctl is-enabled usbmuxd
```

### Restart usbmuxd
```bash
sudo systemctl restart usbmuxd
```

### View Logs
```bash
journalctl -u usbmuxd -f
```

## Troubleshooting

### Device Not Detected
```bash
# 1. Check USB connection
lsusb | grep -i apple

# 2. Check permissions
ls -l /dev/bus/usb/001/

# 3. Restart service
sudo systemctl restart usbmuxd

# 4. Try detection again
idevice_id -l
```

### Permission Issues
```bash
# Check udev rules exist
cat /etc/udev/rules.d/39-usbmuxd.rules

# Reload rules
sudo udevadm control --reload-rules
sudo udevadm trigger --subsystem-match=usb

# Restart service
sudo systemctl restart usbmuxd
```

## GPU Activation (Orange Pi / Armbian)

**CRITICAL for GUI performance on Orange Pi Zero 2W:**

```bash
# Edit boot config
sudo nano /boot/armbianEnv.txt

# Add 'gpu' to overlays line:
overlays=gpu

# Save and reboot
sudo reboot

# Verify GPU is active (should show Mali-G31, not llvmpipe)
glxinfo | grep "OpenGL renderer"
```

## File Locations

### Configuration
- udev rules: `/etc/udev/rules.d/39-usbmuxd.rules`
- systemd override: `/etc/systemd/system/usbmuxd.service.d/override.conf`
- Armbian boot config: `/boot/armbianEnv.txt` (Orange Pi GPU settings)

### Binaries
- Tools: `/usr/local/bin/idevice*`
- Libraries: `/usr/local/lib/libimobiledevice*`

### Source Code
- Build directory: `~/build/`
- Repositories: `~/build/libplist/`, `~/build/libimobiledevice/`, etc.

## Version Check

```bash
ideviceinfo --version              # Tool version
pkg-config --modversion libimobiledevice-1.0  # Library version
```

## Group Membership

```bash
groups pi                          # Check pi user groups (should include usbmux)
getent group usbmux               # Check usbmux group members
```
