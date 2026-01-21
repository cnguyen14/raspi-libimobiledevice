#!/bin/bash
# Chromium Kiosk Startup Script

# Wait for X server
while [ ! -f /tmp/.X11-unix/X0 ]; do
  sleep 1
done

# Disable screen blanking
xset -display :0 s off
xset -display :0 -dpms
xset -display :0 s noblank

# Hide cursor after 2 seconds of inactivity
unclutter -display :0 -idle 2 &

# Start Chromium in kiosk mode
chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-component-update \
  --check-for-update-interval=31536000 \
  --display=:0 \
  http://localhost:3000
