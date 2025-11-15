# Quick Start Guide - DuckDB UI Offline

Get up and running with DuckDB UI in offline/airgapped environments in just a few minutes!

## For Users (Pre-built Package)

If you have a pre-built offline package:

```bash
# 1. Extract the package
tar -xzf duckdb-ui-offline-*.tar.gz
cd duckdb-ui-offline-deploy/

# 2. Start DuckDB UI
./start-ui.sh

# 3. Open your browser to http://localhost:4213
```

That's it! 🎉

## For Developers (Building from Source)

### Prerequisites
- Git
- C++ compiler (GCC 8+, Clang 9+, or MSVC 2019+)
- CMake 3.15+
- Make

### Build Steps

```bash
# 1. Clone the repository
git clone --recursive https://github.com/narayanananalytics/duckdb-ui.git
cd duckdb-ui

# 2. Build the extension
make release

# 3. Start DuckDB UI
./build/release/duckdb -ui
```

Your browser will automatically open to http://localhost:4213

## Creating a Deployment Package

To create a portable package for airgapped systems:

```bash
# Build and package
make release
./scripts/package-offline.sh

# This creates: duckdb-ui-offline-YYYYMMDD-HHMMSS.tar.gz
# Transfer this file to your target system
```

## First Steps in the UI

Once the UI is open:

1. **Try a simple query**:
   ```sql
   SELECT 'Hello from DuckDB!' as message;
   ```
   Click "Run Query" or press Ctrl+Enter

2. **Explore system tables**:
   ```sql
   SELECT * FROM information_schema.tables LIMIT 10;
   ```

3. **Create a table**:
   ```sql
   CREATE TABLE test (id INTEGER, name VARCHAR);
   INSERT INTO test VALUES (1, 'Alice'), (2, 'Bob');
   SELECT * FROM test;
   ```

## Common Commands

| Action | Command |
|--------|---------|
| Start UI from SQL | `CALL start_ui();` |
| Stop UI | `CALL stop_ui();` |
| Change port | `SET ui_local_port = 8080; CALL start_ui();` |
| Set custom UI path | `export DUCKDB_UI_STATIC_PATH=/path/to/ui_static` |

## Troubleshooting

**Problem**: "File not found" errors

**Solution**: Make sure you're running from the directory containing `ui_static/`:
```bash
export DUCKDB_UI_STATIC_PATH=/absolute/path/to/ui_static
```

**Problem**: Port 4213 is already in use

**Solution**: Use a different port:
```sql
SET ui_local_port = 5000;
CALL start_ui();
```

**Problem**: Browser doesn't open automatically

**Solution**: Manually navigate to http://localhost:4213

## Next Steps

- Read the full [Offline Setup Guide](OFFLINE_SETUP.md) for advanced configuration
- Customize the UI by editing files in `ui_static/`
- Explore DuckDB features at https://duckdb.org/docs/

## Support

For issues with:
- **Offline functionality**: Open an issue in this repository
- **DuckDB core**: See https://github.com/duckdb/duckdb
- **General questions**: Check https://duckdb.org/docs/

---

**Happy querying! 🦆**
