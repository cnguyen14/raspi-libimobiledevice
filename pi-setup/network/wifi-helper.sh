#!/bin/bash
# WiFi Helper Script
# Provides utility functions for WiFi management

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get current WiFi mode
get_mode() {
  if systemctl is-active --quiet hostapd; then
    echo "ap"
  elif systemctl is-active --quiet wpa_supplicant; then
    echo "client"
  else
    echo "unknown"
  fi
}

# Get WiFi status
get_status() {
  MODE=$(get_mode)
  IP=$(ip -4 addr show wlan0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}' || echo "none")
  SSID=$(iwgetid -r || echo "none")

  echo "Mode: $MODE"
  echo "IP: $IP"
  echo "SSID: $SSID"
}

# Scan for WiFi networks
scan_networks() {
  echo -e "${GREEN}Scanning for WiFi networks...${NC}"
  sudo iwlist wlan0 scan | grep -E "ESSID|Quality|Signal level" | sed 's/^[ \t]*//'
}

# Get list of saved networks
get_saved_networks() {
  echo -e "${GREEN}Saved WiFi networks:${NC}"
  sudo grep -E "ssid=" /etc/wpa_supplicant/wpa_supplicant.conf | sed 's/.*ssid="\(.*\)"/\1/'
}

# Check if interface is up
check_interface() {
  if ! ip link show wlan0 &> /dev/null; then
    echo -e "${RED}Error: wlan0 interface not found${NC}"
    exit 1
  fi
}

# Main command handler
case "${1:-}" in
  mode)
    get_mode
    ;;
  status)
    get_status
    ;;
  scan)
    check_interface
    scan_networks
    ;;
  saved)
    get_saved_networks
    ;;
  *)
    echo "WiFi Helper Script"
    echo "Usage: $0 {mode|status|scan|saved}"
    echo ""
    echo "Commands:"
    echo "  mode   - Get current WiFi mode (ap/client)"
    echo "  status - Get WiFi status (mode, IP, SSID)"
    echo "  scan   - Scan for available WiFi networks"
    echo "  saved  - List saved WiFi networks"
    exit 1
    ;;
esac
