#!/bin/bash
# Install system dependencies for libimobiledevice and Pi API server
# Run as: sudo ./dependencies.sh

set -e  # Exit on error

echo "======================================"
echo "Installing System Dependencies"
echo "======================================"

# Update package list
echo "Updating package list..."
apt update

# Install build tools
echo "Installing build tools..."
apt install -y build-essential git autoconf automake libtool pkg-config

# Install libraries for libimobiledevice
echo "Installing libimobiledevice dependencies..."
apt install -y \
    libssl-dev \
    libusb-1.0-0-dev \
    usbmuxd \
    python3-dev \
    libcurl4-openssl-dev

# Install Node.js 20 (for Pi API server)
echo "Installing Node.js 20..."
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'.' -f1 | tr -d 'v')" -lt "20" ]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

# Install PM2 globally
echo "Installing PM2 process manager..."
npm install -g pm2

# Install SQLite3
echo "Installing SQLite3..."
apt install -y sqlite3 libsqlite3-dev

echo ""
echo "======================================"
echo "Dependencies installed successfully!"
echo "======================================"
echo "Node.js version: $(node -v)"
echo "npm version: $(npm -v)"
echo "PM2 version: $(pm2 -v)"
