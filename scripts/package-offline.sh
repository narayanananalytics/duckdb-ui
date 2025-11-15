#!/bin/bash

# DuckDB UI - Offline Deployment Package Script
# This script creates a deployment package for airgapped systems

set -e

echo "🦆 DuckDB UI - Creating Offline Deployment Package"
echo "=================================================="

# Configuration
BUILD_DIR="build/release"
DEPLOY_DIR="duckdb-ui-offline-deploy"
ARCHIVE_NAME="duckdb-ui-offline-$(date +%Y%m%d-%H%M%S).tar.gz"

# Check if build exists
if [ ! -f "$BUILD_DIR/duckdb" ]; then
    echo "❌ Error: Build not found. Please run 'make release' first."
    exit 1
fi

# Check if UI static files exist
if [ ! -d "ui_static" ]; then
    echo "❌ Error: ui_static directory not found."
    exit 1
fi

# Create deployment directory
echo "📁 Creating deployment directory..."
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# Copy extension binary
echo "📦 Copying extension binary..."
cp "$BUILD_DIR/extension/ui/ui.duckdb_extension" "$DEPLOY_DIR/"

# Copy DuckDB binary
echo "📦 Copying DuckDB binary..."
cp "$BUILD_DIR/duckdb" "$DEPLOY_DIR/"

# Copy UI static files
echo "📦 Copying UI static files..."
cp -r ui_static "$DEPLOY_DIR/"

# Copy documentation
echo "📄 Copying documentation..."
cp OFFLINE_SETUP.md "$DEPLOY_DIR/README.md"
cp LICENSE "$DEPLOY_DIR/"

# Create a startup script
echo "📝 Creating startup script..."
cat > "$DEPLOY_DIR/start-ui.sh" << 'EOF'
#!/bin/bash

# DuckDB UI Offline Startup Script

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Set the UI static path to the script directory
export DUCKDB_UI_STATIC_PATH="$SCRIPT_DIR/ui_static"

echo "🦆 Starting DuckDB UI (Offline Mode)"
echo "UI will be available at: http://localhost:4213"
echo "Press Ctrl+C to stop"
echo ""

# Start DuckDB with UI
"$SCRIPT_DIR/duckdb" -ui "$@"
EOF

chmod +x "$DEPLOY_DIR/start-ui.sh"

# Create a Windows startup script
echo "📝 Creating Windows startup script..."
cat > "$DEPLOY_DIR/start-ui.bat" << 'EOF'
@echo off
REM DuckDB UI Offline Startup Script for Windows

SET SCRIPT_DIR=%~dp0
SET DUCKDB_UI_STATIC_PATH=%SCRIPT_DIR%ui_static

echo Starting DuckDB UI (Offline Mode)
echo UI will be available at: http://localhost:4213
echo Press Ctrl+C to stop
echo.

"%SCRIPT_DIR%duckdb.exe" -ui %*
EOF

# Create archive
echo "📦 Creating archive: $ARCHIVE_NAME..."
tar -czf "$ARCHIVE_NAME" "$DEPLOY_DIR"

# Calculate sizes
ARCHIVE_SIZE=$(du -h "$ARCHIVE_NAME" | cut -f1)
DIR_SIZE=$(du -sh "$DEPLOY_DIR" | cut -f1)

echo ""
echo "✅ Package created successfully!"
echo "=================================================="
echo "📦 Archive: $ARCHIVE_NAME"
echo "📊 Archive size: $ARCHIVE_SIZE"
echo "📊 Extracted size: $DIR_SIZE"
echo ""
echo "Contents:"
echo "  - duckdb (executable)"
echo "  - ui.duckdb_extension"
echo "  - ui_static/ (HTML, CSS, JS)"
echo "  - start-ui.sh (Linux/Mac startup script)"
echo "  - start-ui.bat (Windows startup script)"
echo "  - README.md (offline setup guide)"
echo "  - LICENSE"
echo ""
echo "To deploy to an airgapped system:"
echo "  1. Copy $ARCHIVE_NAME to the target system"
echo "  2. Extract: tar -xzf $ARCHIVE_NAME"
echo "  3. Run: cd $DEPLOY_DIR && ./start-ui.sh"
echo ""
echo "For detailed instructions, see OFFLINE_SETUP.md"
