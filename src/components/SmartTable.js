import React, { useState, useMemo, useCallback } from 'react';
import './SmartTable.css';
import {
  FaSearch, FaSort, FaSortUp, FaSortDown,
  FaFileExcel, FaFileCsv, FaPrint, FaFilter,
  FaChevronLeft, FaChevronRight, FaTimes, FaEdit, FaTrash
} from 'react-icons/fa';

// ── Utility: Export to CSV ──────────────────────────────────────────────
function exportCSV(columns, data, filename = 'export') {
  const headers = columns.filter(c => c.key !== '__actions').map(c => c.label);
  const rows = data.map(row =>
    columns.filter(c => c.key !== '__actions').map(c => {
      const val = row[c.key];
      if (val === null || val === undefined) return '';
      const str = String(val).replace(/"/g, '""');
      return str.includes(',') ? `"${str}"` : str;
    })
  );
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ── Utility: Export to Excel (via CSV) ─────────────────────────────────
function exportExcel(columns, data, filename = 'export') {
  const headers = columns.filter(c => c.key !== '__actions').map(c => c.label);
  const rows = data.map(row =>
    columns.filter(c => c.key !== '__actions').map(c => row[c.key] ?? '')
  );
  const csv = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}.xls`; a.click();
  URL.revokeObjectURL(url);
}

// ── SmartTable Component ────────────────────────────────────────────────
export default function SmartTable({
  columns = [],        // [{ key, label, sortable, width, render }]
  data = [],           // array of row objects
  onEdit,              // (row) => void
  onDelete,            // (row) => void
  loading = false,
  filename = 'table-data',
  showExport = true,
  showSearch = true,
  showPagination = true,
  keyField = 'id',    // unique key field
  emptyMessage = 'No records found.',
  filterOptions = [],  // [{ key, label, options: [{value, label}] }]
}) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc'); // 'asc' | 'desc'
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  // ── Sort handler
  const handleSort = useCallback((key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  }, [sortKey]);

  // ── Filter handler
  const handleFilter = useCallback((key, value) => {
    setFilters(f => ({ ...f, [key]: value }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearch('');
    setPage(1);
  }, []);

  // ── Filtered + Searched + Sorted data
  const processed = useMemo(() => {
    let result = [...data];

    // Apply search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(row =>
        columns.some(col => {
          if (col.key === '__actions') return false;
          const val = row[col.key];
          return val !== null && val !== undefined &&
            String(val).toLowerCase().includes(q);
        })
      );
    }

    // Apply column filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== undefined) {
        result = result.filter(row => String(row[key]) === String(value));
      }
    });

    // Apply sort
    if (sortKey) {
      result.sort((a, b) => {
        const av = a[sortKey] ?? '';
        const bv = b[sortKey] ?? '';
        
        // Robust natural sorting using localeCompare
        const comparison = String(av).localeCompare(String(bv), undefined, { 
          numeric: true, 
          sensitivity: 'base' 
        });
        
        return sortDir === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, search, filters, sortKey, sortDir, columns]);

  // ── Pagination
  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return processed.slice(start, start + pageSize);
  }, [processed, page, pageSize]);

  // ── Print
  const handlePrint = () => {
    const printCols = columns.filter(c => c.key !== '__actions');
    const rows = processed.map(row =>
      `<tr>${printCols.map(c => `<td>${row[c.key] ?? ''}</td>`).join('')}</tr>`
    ).join('');
    const headers = printCols.map(c => `<th>${c.label}</th>`).join('');
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Print</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: bold; }
        tr:nth-child(even) { background: #fafafa; }
        @media print { body { margin: 0; } }
      </style></head><body>
      <h2 style="margin-bottom:16px">${filename}</h2>
      <table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>
      </body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  return (
    <div className="st-wrapper">
      {/* ── Toolbar ── */}
      <div className="st-toolbar">
        <div className="st-toolbar-left">
          {showSearch && (
            <div className="st-search-box">
              <FaSearch className="st-search-icon" />
              <input
                type="text"
                placeholder="Search all columns..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="st-search-input"
              />
              {search && (
                <button type="button" className="st-clear-btn" onClick={() => setSearch('')}>
                  <FaTimes />
                </button>
              )}
            </div>
          )}

          {filterOptions.length > 0 && (
            <button
              type="button"
              className={`st-filter-btn ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(s => !s)}
            >
              <FaFilter />
              Filters
              {activeFilterCount > 0 && (
                <span className="st-filter-count">{activeFilterCount}</span>
              )}
            </button>
          )}

          {(search || activeFilterCount > 0) && (
            <button type="button" className="st-clear-all-btn" onClick={clearFilters}>
              <FaTimes /> Clear All
            </button>
          )}
        </div>

        <div className="st-toolbar-right">
          <span className="st-record-count">
            {processed.length} record{processed.length !== 1 ? 's' : ''}
          </span>
          {showExport && (
            <div className="st-export-group">
              <button
                type="button"
                className="st-export-btn csv"
                onClick={() => exportCSV(columns, processed, filename)}
                title="Export CSV"
              >
                <FaFileCsv /> CSV
              </button>
              <button
                type="button"
                className="st-export-btn excel"
                onClick={() => exportExcel(columns, processed, filename)}
                title="Export Excel"
              >
                <FaFileExcel /> Excel
              </button>
              <button
                type="button"
                className="st-export-btn print"
                onClick={handlePrint}
                title="Print"
              >
                <FaPrint /> Print
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Filters Row ── */}
      {showFilters && filterOptions.length > 0 && (
        <div className="st-filters-row">
          {filterOptions.map(f => (
            <div key={f.key} className="st-filter-field">
              <label>{f.label}</label>
              <select
                value={filters[f.key] || ''}
                onChange={e => handleFilter(f.key, e.target.value)}
              >
                <option value="">All</option>
                {f.options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* ── Table ── */}
      <div className="st-table-scroll">
        <table className="st-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  style={{ width: col.width, cursor: col.sortable !== false && col.key !== '__actions' ? 'pointer' : 'default' }}
                  className={col.key === '__actions' ? 'st-actions-col' : ''}
                  onClick={() => {
                    if (col.sortable !== false && col.key !== '__actions') {
                      handleSort(col.key);
                    }
                  }}
                >
                  <div className="st-th-inner">
                    <span>{col.label}</span>
                    {col.sortable !== false && col.key !== '__actions' && (
                      <button
                        type="button"
                        className="st-sort-btn"
                        title={`Sort by ${col.label}`}
                      >
                        {sortKey === col.key
                          ? sortDir === 'asc' ? <FaSortUp /> : <FaSortDown />
                          : <FaSort />}
                      </button>
                    )}
                  </div>
                </th>
              ))}
              {(onEdit || onDelete) && <th className="st-actions-col">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="st-loading">
                  <span className="spinner spinner-primary" />
                  Loading data...
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="st-empty">
                  <div className="st-empty-inner">
                    <FaSearch className="st-empty-icon" />
                    <p>{emptyMessage}</p>
                    {(search || activeFilterCount > 0) && (
                      <button type="button" className="btn-outline" onClick={clearFilters}>Clear Filters</button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((row, idx) => (
                <tr key={row[keyField] ?? idx}>
                  {columns.map(col => (
                    <td key={col.key}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="st-actions-cell">
                      {onEdit && (
                        <button type="button" className="btn-edit" onClick={() => onEdit(row)}>
                          <FaEdit /> Edit
                        </button>
                      )}
                      {onDelete && (
                        <button type="button" className="btn-delete" onClick={() => onDelete(row)}>
                          <FaTrash /> Delete
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {showPagination && (
        <div className="st-pagination">
          <div className="st-page-size">
            <label>Rows per page:</label>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
            >
              {[10, 25, 50, 100].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div className="st-page-info">
            Showing {Math.min((page - 1) * pageSize + 1, processed.length)}–{Math.min(page * pageSize, processed.length)} of {processed.length}
          </div>

          <div className="st-page-controls">
            <button
              type="button"
              className="st-page-btn"
              onClick={() => setPage(1)}
              disabled={page === 1}
              title="First page"
            >«</button>
            <button
              type="button"
              className="st-page-btn"
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
            >
              <FaChevronLeft />
            </button>

            {/* Page number buttons */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  type="button"
                  key={pageNum}
                  className={`st-page-btn ${page === pageNum ? 'active' : ''}`}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              className="st-page-btn"
              onClick={() => setPage(p => p + 1)}
              disabled={page === totalPages}
            >
              <FaChevronRight />
            </button>
            <button
              type="button"
              className="st-page-btn"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              title="Last page"
            >»</button>
          </div>
        </div>
      )}
    </div>
  );
}
