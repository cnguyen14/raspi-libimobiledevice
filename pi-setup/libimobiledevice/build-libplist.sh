#!/bin/bash
# Build libplist from GitHub source
# Critical: Use commit 2c50f76 for iOS 26.2 compatibility

set -e
BUILD_DIR="${BUILD_DIR:-$HOME/build}"
cd "$BUILD_DIR"

echo "Building libplist..."

# Clone if not exists
if [ ! -d "libplist" ]; then
    git clone https://github.com/libimobiledevice/libplist.git
fi

cd libplist
git fetch
git checkout 2c50f76  # Critical commit for modern iOS

./autogen.sh
make
sudo make install
sudo ldconfig

echo "libplist installed successfully"
