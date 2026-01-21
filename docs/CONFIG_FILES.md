# Configuration Files

## GPU Activation (Orange Pi / Armbian)

**CRITICAL:** For Orange Pi boards running Armbian, GPU hardware acceleration must be enabled for optimal performance, especially when running GUI applications.

**File:** `/boot/armbianEnv.txt`

### Enable Mali G31 GPU (Orange Pi Zero 2W)

The Orange Pi Zero 2W has a Mali G31 MP2 GPU that can be enabled via device tree overlay:

```bash
sudo nano /boot/armbianEnv.txt
```

Find the line starting with `overlays=` and add `gpu`:

```ini
overlays=gpu
```

**Complete example configuration:**
```ini
verbosity=1
bootlogo=false
console=both
disp_mode=1920x1080p60
overlay_prefix=sun50i-h616
rootdev=UUID=adb61282-df86-4116-9688-e94c56913687
rootfstype=ext4
extraargs=quiet loglevel=3 vt.global_cursor_default=0
overlays=gpu
usbstoragequirks=0x2537:0x1066:u,0x2537:0x1068:u
```

### Apply Changes

```bash
sudo reboot
```

### Verify GPU is Active

After reboot, verify the GPU is using hardware acceleration:

```bash
# Check OpenGL renderer (should show Mali-G31 Panfrost, not llvmpipe)
glxinfo | grep "OpenGL renderer"
# Expected output: OpenGL renderer string: Mali-G31 (Panfrost)

# Check DRM devices
ls -la /dev/dri/
# Should show: card0 and renderD128
```

**Performance Impact:**
- **Without GPU:** X server startup takes 30-40 seconds (llvmpipe software rendering)
- **With GPU:** X server startup takes 8-12 seconds (Mali G31 hardware acceleration)

**IMPORTANT:** Only modify the `overlays=` line. Do NOT change `console=`, `loglevel=`, or other boot parameters unless you know exactly what you're doing, as incorrect console settings can prevent the system from booting.

---

## udev Rules for Apple Devices

**File:** `/etc/udev/rules.d/39-usbmuxd.rules`

```bash
# udev rules for Apple iOS devices
# Automatically set permissions for all Apple USB devices

# Apple devices (vendor ID 05ac)
SUBSYSTEM=="usb", ATTR{idVendor}=="05ac", MODE="0660", GROUP="usbmux"
SUBSYSTEM=="usb", ENV{DEVTYPE}=="usb_device", ATTR{idVendor}=="05ac", MODE="0660", GROUP="usbmux"

# For the actual device nodes
SUBSYSTEM=="usb", ATTRS{idVendor}=="05ac", MODE="0660", GROUP="usbmux"

# Tag for systemd
SUBSYSTEM=="usb", ATTR{idVendor}=="05ac", TAG+="systemd", ENV{SYSTEMD_WANTS}="usbmuxd.service"
```

### How to Apply

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

sudo udevadm control --reload-rules
sudo udevadm trigger --subsystem-match=usb
```

---

## systemd Service Override

**File:** `/etc/systemd/system/usbmuxd.service.d/override.conf`

```ini
[Install]
WantedBy=multi-user.target
```

### How to Apply

```bash
sudo mkdir -p /etc/systemd/system/usbmuxd.service.d
sudo tee /etc/systemd/system/usbmuxd.service.d/override.conf > /dev/null << 'EOF'
[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable usbmuxd
```

---

## Group Setup

```bash
# Create usbmux group
sudo groupadd -r usbmux

# Add users to group
sudo usermod -a -G usbmux usbmux
sudo usermod -a -G usbmux pi
```

---

## Complete Setup Script

Save this as `setup-usbmuxd.sh` for quick setup on new systems:

```bash
#!/bin/bash
set -e

echo "=== Setting up usbmuxd for iOS devices ==="

# Create usbmux group
echo "Creating usbmux group..."
sudo groupadd -r usbmux 2>/dev/null || echo "Group already exists"

# Add users to group
echo "Adding users to usbmux group..."
sudo usermod -a -G usbmux usbmux
sudo usermod -a -G usbmux pi

# Create udev rules
echo "Creating udev rules..."
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

# Reload udev rules
echo "Reloading udev rules..."
sudo udevadm control --reload-rules
sudo udevadm trigger --subsystem-match=usb

# Create systemd override
echo "Creating systemd override..."
sudo mkdir -p /etc/systemd/system/usbmuxd.service.d
sudo tee /etc/systemd/system/usbmuxd.service.d/override.conf > /dev/null << 'EOF'
[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
echo "Enabling usbmuxd service..."
sudo systemctl daemon-reload
sudo systemctl enable usbmuxd
sudo systemctl restart usbmuxd

echo ""
echo "=== Setup complete! ==="
echo "Service status:"
systemctl status usbmuxd --no-pager | grep -E "Loaded|Active"
echo ""
echo "You may need to log out and back in for group changes to take effect."
echo "Then plug in your iOS device and run: idevice_id -l"
```

Make it executable:
```bash
chmod +x setup-usbmuxd.sh
```
