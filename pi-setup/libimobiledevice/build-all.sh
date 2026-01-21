#!/bin/bash
# Build all libimobiledevice components in correct order
# Run as: ./build-all.sh

set -e  # Exit on error

BUILD_DIR="$HOME/build"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "======================================"
echo "Building libimobiledevice 1.4.0"
echo "======================================"
echo "Build directory: $BUILD_DIR"
echo ""

# Create build directory
mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"

# Build order (dependencies first)
echo "Step 1/5: Building libplist..."
"$SCRIPT_DIR/build-libplist.sh"

echo ""
echo "Step 2/5: Building libimobiledevice-glue..."
"$SCRIPT_DIR/build-glue.sh"

echo ""
echo "Step 3/5: Building libusbmuxd..."
"$SCRIPT_DIR/build-libusbmuxd.sh"

echo ""
echo "Step 4/5: Building libtatsu..."
"$SCRIPT_DIR/build-libtatsu.sh"

echo ""
echo "Step 5/5: Building libimobiledevice..."
"$SCRIPT_DIR/build-libimobiledevice.sh"

echo ""
echo "======================================"
echo "libimobiledevice build complete!"
echo "======================================"
echo "Install location: /usr/local"
echo "Tools location: /usr/local/bin"
echo ""
echo "Verifying installation..."
if command -v idevice_id &> /dev/null; then
    echo "✓ idevice_id found"
    idevice_id --version
else
    echo "✗ idevice_id not found in PATH"
fi
