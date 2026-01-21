#!/bin/bash
# Build libimobiledevice from GitHub source

set -e
BUILD_DIR="${BUILD_DIR:-$HOME/build}"
cd "$BUILD_DIR"

echo "Building libimobiledevice..."

# Clone if not exists
if [ ! -d "libimobiledevice" ]; then
    git clone https://github.com/libimobiledevice/libimobiledevice.git
fi

cd libimobiledevice
git fetch
git checkout master
git pull

./autogen.sh
make
sudo make install
sudo ldconfig

echo "libimobiledevice installed successfully"
echo ""
echo "Available tools:"
ls -1 /usr/local/bin/idevice* | head -10
