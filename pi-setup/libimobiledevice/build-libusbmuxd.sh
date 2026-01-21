#!/bin/bash
# Build libusbmuxd from GitHub source

set -e
BUILD_DIR="${BUILD_DIR:-$HOME/build}"
cd "$BUILD_DIR"

echo "Building libusbmuxd..."

# Clone if not exists
if [ ! -d "libusbmuxd" ]; then
    git clone https://github.com/libimobiledevice/libusbmuxd.git
fi

cd libusbmuxd
git fetch
git checkout master
git pull

./autogen.sh
make
sudo make install
sudo ldconfig

echo "libusbmuxd installed successfully"
