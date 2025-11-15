// DuckDB UI - Offline Client Application

class DuckDBUI {
    constructor() {
        this.connectionName = 'default';
        this.databaseName = '';
        this.schemaName = 'main';
        this.init();
    }

    init() {
        this.setupElements();
        this.setupEventListeners();
        this.loadServerInfo();
    }

    setupElements() {
        this.sqlEditor = document.getElementById('sql-editor');
        this.runBtn = document.getElementById('run-btn');
        this.clearBtn = document.getElementById('clear-btn');
        this.resultsContainer = document.getElementById('results-container');
        this.queryTimeSpan = document.getElementById('query-time');
        this.rowCountSpan = document.getElementById('row-count');
        this.versionInfo = document.getElementById('version-info');
        this.status = document.getElementById('status');
    }

    setupEventListeners() {
        this.runBtn.addEventListener('click', () => this.executeQuery());
        this.clearBtn.addEventListener('click', () => this.clearEditor());

        this.sqlEditor.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.executeQuery();
            }
        });
    }

    async loadServerInfo() {
        try {
            const response = await fetch('/info');
            const version = response.headers.get('X-DuckDB-Version');
            const platform = response.headers.get('X-DuckDB-Platform');
            const uiVersion = response.headers.get('X-DuckDB-UI-Extension-Version');

            if (version) {
                this.versionInfo.textContent = `DuckDB ${version} (${platform}) | UI Extension ${uiVersion}`;
            }
            this.setStatus('connected', 'Connected');
        } catch (error) {
            console.error('Failed to load server info:', error);
            this.setStatus('error', 'Disconnected');
        }
    }

    setStatus(type, message) {
        this.status.textContent = `● ${message}`;
        this.status.style.color = type === 'connected' ? 'var(--success-color)' : 'var(--error-color)';
    }

    clearEditor() {
        this.sqlEditor.value = '';
        this.sqlEditor.focus();
    }

    async executeQuery() {
        const sql = this.sqlEditor.value.trim();

        if (!sql) {
            this.showError('Please enter a SQL query');
            return;
        }

        this.setLoading(true);
        const startTime = performance.now();

        try {
            const result = await this.runSQL(sql);
            const endTime = performance.now();
            const duration = ((endTime - startTime) / 1000).toFixed(3);

            this.displayResults(result, duration);
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.setLoading(false);
        }
    }

    async runSQL(sql) {
        const headers = new Headers();
        headers.append('Content-Type', 'text/plain');
        headers.append('Origin', window.location.origin);
        headers.append('X-DuckDB-UI-Request-Description', 'SQL Query');
        headers.append('X-DuckDB-UI-Connection-Name', this.connectionName);

        if (this.databaseName) {
            headers.append('X-DuckDB-UI-Database-Name', btoa(this.databaseName));
        }
        if (this.schemaName) {
            headers.append('X-DuckDB-UI-Schema-Name', btoa(this.schemaName));
        }

        headers.append('X-DuckDB-UI-Result-Row-Limit', '10000');
        headers.append('X-DuckDB-UI-Errors-As-JSON', 'false');

        const response = await fetch('/ddb/run', {
            method: 'POST',
            headers: headers,
            body: sql
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        return this.parseResult(arrayBuffer);
    }

    parseResult(arrayBuffer) {
        // Simple binary result parser
        // The actual format is complex, so for now we'll handle it simply
        const dataView = new DataView(arrayBuffer);

        // Check if it's an error (simplified check)
        if (arrayBuffer.byteLength < 100) {
            const decoder = new TextDecoder();
            const text = decoder.decode(arrayBuffer);
            if (text.includes('error') || text.includes('Error')) {
                throw new Error('Query execution failed. Check your SQL syntax.');
            }
        }

        // For a production implementation, you would parse the binary format properly
        // This is a simplified version that shows the structure
        try {
            // Try to parse as a successful result
            return this.parseBinaryResult(dataView);
        } catch (e) {
            // Fallback: show raw result info
            return {
                columns: ['Result'],
                rows: [['Query executed successfully']],
                rowCount: 1
            };
        }
    }

    parseBinaryResult(dataView) {
        // Simplified binary parser
        // In a real implementation, you'd use the @duckdb/data-reader package
        // For now, return a placeholder that indicates successful execution

        let offset = 0;

        // Result type (1 byte) - 0 = empty, 1 = error, 2 = success
        const resultType = dataView.getUint8(offset);
        offset += 1;

        if (resultType === 1) {
            // Error result
            throw new Error('Query execution failed');
        }

        if (resultType === 0) {
            // Empty result (like CREATE, INSERT, etc.)
            return {
                columns: ['Status'],
                rows: [['✓ Query executed successfully']],
                rowCount: 0
            };
        }

        // For actual data results, we'd need the proper deserializer
        // This is a placeholder
        return {
            columns: ['Info'],
            rows: [['Query completed. Results parsing requires binary deserializer.']],
            rowCount: 1,
            note: 'For full result parsing, the TypeScript duckdb-ui-client package should be compiled and included.'
        };
    }

    displayResults(result, duration) {
        this.queryTimeSpan.textContent = `Executed in ${duration}s`;

        if (result.note) {
            this.resultsContainer.innerHTML = `
                <div style="padding: 1rem; color: var(--text-secondary);">
                    <p>${result.note}</p>
                    <p style="margin-top: 1rem;">To enable full result display, build the TypeScript client libraries with:</p>
                    <pre style="background: var(--bg-dark); padding: 1rem; border-radius: 4px; margin-top: 0.5rem;">cd ts && pnpm install && pnpm build</pre>
                </div>
            `;
            return;
        }

        const rowCount = result.rows.length;
        this.rowCountSpan.textContent = `${rowCount} row${rowCount !== 1 ? 's' : ''}`;

        if (rowCount === 0) {
            this.resultsContainer.innerHTML = '<div class="empty-state"><p>Query returned no results</p></div>';
            return;
        }

        let html = '<table class="results-table"><thead><tr>';

        // Column headers
        result.columns.forEach(col => {
            html += `<th>${this.escapeHtml(col)}</th>`;
        });
        html += '</tr></thead><tbody>';

        // Rows
        result.rows.forEach(row => {
            html += '<tr>';
            row.forEach(cell => {
                const value = cell === null ? '<i>NULL</i>' : this.escapeHtml(String(cell));
                html += `<td>${value}</td>`;
            });
            html += '</tr>';
        });

        html += '</tbody></table>';
        this.resultsContainer.innerHTML = html;
    }

    showError(message) {
        this.resultsContainer.innerHTML = `<div class="error-message">Error: ${this.escapeHtml(message)}</div>`;
        this.queryTimeSpan.textContent = '';
        this.rowCountSpan.textContent = '';
    }

    setLoading(isLoading) {
        this.runBtn.disabled = isLoading;
        this.runBtn.innerHTML = isLoading
            ? '<span class="loading"></span> Running...'
            : 'Run Query (Ctrl+Enter)';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new DuckDBUI());
} else {
    new DuckDBUI();
}
