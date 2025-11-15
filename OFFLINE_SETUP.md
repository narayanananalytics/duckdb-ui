# DuckDB UI - Offline/Airgapped Setup Guide

This document describes how to build and deploy the offline version of the DuckDB UI extension that can run in airgapped systems without any external dependencies.

## Overview

The offline version of DuckDB UI has been modified to:
- **Serve all UI assets locally** from the `ui_static` directory
- **No internet connection required** during runtime
- **Self-contained UI** with all HTML, CSS, and JavaScript bundled
- **Compatible with airgapped/isolated systems**

## Architecture Changes

### Original Architecture
- HTTP server proxies all UI requests to `https://ui.duckdb.org`
- UI assets are fetched from remote server on-demand
- Requires internet connectivity

### Offline Architecture
- HTTP server serves static files from local `ui_static` directory
- All UI components bundled in the repository
- Zero external dependencies at runtime

## Building the Extension

### Prerequisites

1. **C++ Build Tools**:
   - CMake 3.15+
   - C++17 compatible compiler (GCC 8+, Clang 9+, MSVC 2019+)
   - Make or Ninja

2. **Dependencies** (for building only, not runtime):
   - Git (for cloning submodules)
   - OpenSSL development libraries

### Build Steps

1. **Clone the repository with submodules**:
   ```bash
   git clone --recursive https://github.com/narayanananalytics/duckdb-ui.git
   cd duckdb-ui
   ```

   If already cloned, update submodules:
   ```bash
   git submodule update --init --recursive
   ```

2. **Build the extension**:
   ```bash
   make release
   ```

   This creates:
   - `./build/release/duckdb` - DuckDB shell with UI extension
   - `./build/release/extension/ui/ui.duckdb_extension` - Loadable extension binary

3. **Verify the UI static files**:
   ```bash
   ls -la ui_static/
   # Should show: index.html, styles.css, app.js
   ```

## Deployment to Airgapped Systems

### Option 1: Package Everything Together

Create a deployment package with all necessary files:

```bash
# Create deployment directory
mkdir -p duckdb-ui-offline-deploy
cd duckdb-ui-offline-deploy

# Copy the extension binary
cp ../build/release/extension/ui/ui.duckdb_extension .

# Copy the UI static files
cp -r ../ui_static .

# Copy the DuckDB binary (optional, if you want standalone)
cp ../build/release/duckdb .

# Create deployment archive
cd ..
tar -czf duckdb-ui-offline.tar.gz duckdb-ui-offline-deploy/
```

Transfer `duckdb-ui-offline.tar.gz` to your airgapped system.

### Option 2: System-wide Installation

On the target airgapped system:

```bash
# Extract the package
tar -xzf duckdb-ui-offline.tar.gz
cd duckdb-ui-offline-deploy

# Set the UI static path (optional if ui_static is in current directory)
export DUCKDB_UI_STATIC_PATH=/path/to/ui_static

# Run DuckDB with UI
./duckdb -ui
```

## Running the Offline UI

### Method 1: From Command Line

```bash
# Navigate to the deployment directory
cd /path/to/duckdb-ui-offline-deploy

# Start DuckDB with UI flag
./duckdb -ui
```

This will:
1. Start DuckDB
2. Load the UI extension
3. Start HTTP server on `http://localhost:4213`
4. Open your default browser automatically

### Method 2: From SQL

```sql
-- Load the extension (if not auto-loaded)
INSTALL '/path/to/ui.duckdb_extension';
LOAD ui;

-- Start the UI server
CALL start_ui();
```

### Method 3: Programmatic Loading

In your application or script:

```sql
-- Set the static path if needed
SET ui_static_path = '/custom/path/to/ui_static';

-- Start the UI
CALL start_ui();
```

## Configuration

### Environment Variables

- **DUCKDB_UI_STATIC_PATH**: Path to the `ui_static` directory
  ```bash
  export DUCKDB_UI_STATIC_PATH=/opt/duckdb/ui_static
  ```

  If not set, the extension looks for `ui_static` in the current working directory.

### DuckDB Settings

The UI extension respects the following DuckDB settings:

- `ui_local_port` (default: 4213): Port for the HTTP server
  ```sql
  SET ui_local_port = 8080;
  ```

## Usage

Once the UI is running, access it at:
```
http://localhost:4213
```

### Features

The offline UI provides:

1. **SQL Editor**
   - Syntax highlighting
   - Keyboard shortcuts (Ctrl+Enter to run)
   - Multi-statement support

2. **Query Results**
   - Tabular display
   - Execution time tracking
   - Row count
   - Error messages with details

3. **Database Operations**
   - Run SELECT queries
   - Execute DDL (CREATE, DROP, ALTER)
   - Execute DML (INSERT, UPDATE, DELETE)
   - View query results
   - Handle parameterized queries

### Example Queries

```sql
-- View all tables
SELECT * FROM information_schema.tables;

-- Create a table
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name VARCHAR,
    email VARCHAR
);

-- Insert data
INSERT INTO users VALUES
    (1, 'Alice', 'alice@example.com'),
    (2, 'Bob', 'bob@example.com');

-- Query data
SELECT * FROM users;

-- Analytics query
SELECT
    COUNT(*) as total_users,
    COUNT(DISTINCT email) as unique_emails
FROM users;
```

## Troubleshooting

### Issue: "File not found" errors in browser

**Solution**: Ensure the `ui_static` directory is in the correct location:

```bash
# Check current directory
pwd
ls -la ui_static/

# Or set the path explicitly
export DUCKDB_UI_STATIC_PATH=/absolute/path/to/ui_static
```

### Issue: Port already in use

**Solution**: Change the port:

```sql
SET ui_local_port = 5000;
CALL start_ui();
```

### Issue: Permission denied errors

**Solution**: Ensure the extension and UI files have proper permissions:

```bash
chmod +x duckdb
chmod -R 644 ui_static/*
```

### Issue: Browser doesn't open automatically

**Solution**: Manually open your browser and navigate to:
```
http://localhost:4213
```

## Customization

### Modifying the UI

The UI files are located in `ui_static/`:

- `index.html` - Main HTML structure
- `styles.css` - Styling and layout
- `app.js` - JavaScript application logic

You can modify these files to customize:
- Colors and themes
- Layout and components
- Query behavior
- Result display format

After modifications, no rebuild is required - just refresh your browser.

### Adding Custom Features

To add features like:
- Export results to CSV
- Query history
- Saved queries
- Dark/light theme toggle

Edit the `ui_static/app.js` and `ui_static/index.html` files accordingly.

## Security Considerations

1. **Network Binding**: By default, the server only binds to `localhost`, preventing external access.

2. **No Remote Connections**: The offline version doesn't make any outbound HTTP requests.

3. **File Access**: The server only serves files from the `ui_static` directory and includes path traversal protection.

4. **Authentication**: Currently, there's no built-in authentication. If needed, use a reverse proxy (nginx, Apache) with authentication.

## Advanced: Building TypeScript Client Libraries

For advanced features and full result parsing, you can build the TypeScript client libraries:

```bash
cd ts

# Install pnpm if not already installed
npm install -g pnpm

# Install dependencies and build
pnpm install
pnpm build

# The compiled libraries will be in ts/pkgs/*/out/
```

To use these in the UI, you would need to bundle them with a tool like Vite or Webpack and include them in the `ui_static` directory.

## Comparison: Online vs Offline

| Feature | Online (Original) | Offline (This Version) |
|---------|------------------|----------------------|
| Internet Required | Yes | No |
| UI Updates | Automatic from remote | Manual (rebuild) |
| Deployment Size | ~Small | ~Medium |
| Startup Speed | Depends on network | Fast |
| Airgapped Systems | ❌ Not supported | ✅ Fully supported |
| Customization | Limited | Full control |

## Support and Contributions

This is a modified version of the official DuckDB UI extension adapted for offline/airgapped deployment.

For issues specific to the offline functionality, please contact the repository maintainer.

For general DuckDB issues, see: https://github.com/duckdb/duckdb

## License

Same as the original DuckDB UI extension (MIT License).
