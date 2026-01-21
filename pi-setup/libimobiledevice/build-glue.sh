#!/bin/bash
# Build libimobiledevice-glue from GitHub source

set -e
BUILD_DIR="${BUILD_DIR:-$HOME/build}"
cd "$BUILD_DIR"

echo "Building libimobiledevice-glue..."

# Clone if not exists
if [ ! -d "libimobiledevice-glue" ]; then
    git clone https://github.com/libimobiledevice/libimobiledevice-glue.git
fi

cd libimobiledevice-glue
git fetch
git checkout master
git pull

./autogen.sh
make
sudo make install
sudo ldconfig

echo "libimobiledevice-glue installed successfully"
