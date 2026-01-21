# libimobiledevice Quick Reference Guide

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
