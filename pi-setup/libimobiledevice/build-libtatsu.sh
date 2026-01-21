#!/bin/bash
# Build libtatsu from GitHub source

set -e
BUILD_DIR="${BUILD_DIR:-$HOME/build}"
cd "$BUILD_DIR"

echo "Building libtatsu..."

# Clone if not exists
if [ ! -d "libtatsu" ]; then
    git clone https://github.com/libimobiledevice/libtatsu.git
fi

cd libtatsu
git fetch
git checkout master
git pull

./autogen.sh
make
sudo make install
sudo ldconfig

echo "libtatsu installed successfully"
