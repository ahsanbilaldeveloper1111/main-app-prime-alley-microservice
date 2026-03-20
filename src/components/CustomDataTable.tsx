import React, { useState, useMemo, useEffect, useId } from 'react';
import { Col, Row } from 'react-bootstrap';
import '@assets/scss/custom-datatable.scss';
import GenericTable, { TableColumn } from '@components/GenericTable';

// Types for better type safety (rows must be objects for GenericTable)
export interface Column<T extends Record<string, unknown> = Record<string, unknown>> {
  key: string;
  name: string;
  selector: (row: T) => unknown;
  sortable?: boolean;
  cell?: (row: T) => React.ReactNode;
}

export interface ServerPaginationInfo {
  totalRows: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
}

export interface CustomDataTableProps<T extends Record<string, unknown> = Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  title?: string;
  loading?: boolean;
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  searchPlaceholder?: string;
  showSearch?: boolean;
  showColumnVisibility?: boolean;
  showPageSizeSelector?: boolean;
  className?: string;
  striped?: boolean;
  highlightOnHover?: boolean;
  onRowClick?: (row: T) => void;
  // Feature flags
  rowClick?: boolean;
  // Row selection
  rowSelection?: boolean;
  onSelectionChange?: (selectedRows: T[]) => void;
  keyField?: string;
  // Server-side pagination props
  serverSide?: boolean;
  paginationInfo?: ServerPaginationInfo;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (newPerPage: number) => void;
  onSearch?: (searchTerm: string) => void;
  pagination?: boolean;
  clearSelectedRows?: boolean;
  tableStyle?: string;
  // Style-2 specific props
  onFiltersClick?: () => void;
  onExportClick?: () => void;
  onNewClick?: () => void;
  filtersText?: string;
  exportText?: string;
  newText?: string;
  // Page identifier for localStorage (if not provided, will use title)
  pageName?: string;
}

function CustomDataTable<T extends Record<string, unknown> = Record<string, unknown>>({
  columns,
  data,
  title,
  loading = false,
  pageSizeOptions = [15, 30, 50, 100],
  defaultPageSize = 15,
  searchPlaceholder = "Search...",
  showSearch = true,
  showColumnVisibility = true,
  showPageSizeSelector = true,
  className = "table-bordered",
  striped = true,
  highlightOnHover = true,
  tableStyle = 'table-style-1',
  onRowClick,
  // Feature flags
  rowClick = false,
  // Row selection
  rowSelection = false,
  onSelectionChange,
  // Server-side pagination props
  serverSide = false,
  paginationInfo,
  onPageChange,
  onPerPageChange,
  onSearch,
  pagination = true,
  keyField = "id",
  clearSelectedRows = false,
  // Style-2 specific props
  onFiltersClick,
  onExportClick,
  onNewClick,
  filtersText = 'Filters',
  exportText = 'Export',
  newText = 'New GSM',
  // Page identifier for localStorage
  pageName,
}: Readonly<CustomDataTableProps<T>>) {
  const domId = useId();
  const lengthControlId = `${domId}-length`;
  const searchControlId = `${domId}-search`;

  // Helper function to convert title to a valid localStorage key
  const titleToKey = (titleStr: string | undefined): string => {
    if (!titleStr) return 'default';
    let key = titleStr.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-'); // Replace non-alphanumeric with hyphens
    // Remove leading and trailing hyphens
    key = key.replace(/^-+/, '').replace(/-+$/, '');
    return key || 'default';
  };

  // Helper functions for localStorage
  const getStorageKey = () => {
    const key = pageName || titleToKey(title);
    return `datatable-columns-${key}`;
  };

  // State management
  const [pageSize, setPageSize] = useState<number>(defaultPageSize);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedColumns, setSelectedColumns] = useState<string[]>(() => columns.map((col) => col.key));
  const [selectedRows, setSelectedRows] = useState<T[]>([]);

  // Keep selected columns valid when incoming columns change and default to all.
  useEffect(() => {
    const allColumnKeys = columns.map((col) => col.key);

    try {
      const storedRaw = globalThis.window?.localStorage?.getItem(getStorageKey());
      if (storedRaw) {
        const parsed: unknown = JSON.parse(storedRaw);
        if (!Array.isArray(parsed)) {
          setSelectedColumns(allColumnKeys);
          return;
        }
        const stored = parsed.filter((key): key is string => typeof key === 'string');
        const validStored = stored.filter((key) => allColumnKeys.includes(key));
        const missingColumns = allColumnKeys.filter((key) => !validStored.includes(key));
        const merged = [...validStored, ...missingColumns];
        setSelectedColumns(merged.length > 0 ? merged : allColumnKeys);
        return;
      }
    } catch {
      // Ignore corrupt or unavailable localStorage (private mode, quota, etc.)
    }

    setSelectedColumns(allColumnKeys);
  }, [columns, pageName, title]);

  // Sync pageSize with server-side prop
  useEffect(() => {
    if (serverSide && paginationInfo?.perPage) {
      setPageSize(paginationInfo.perPage);
    }
  }, [serverSide, paginationInfo?.perPage]);

  // Keep client pagination at first page whenever filter or page size changes.
  useEffect(() => {
    if (!serverSide) {
      setCurrentPage(1);
    }
  }, [searchTerm, pageSize, serverSide]);

  useEffect(() => {
    if (!rowSelection || !clearSelectedRows) return;
    setSelectedRows([]);
  }, [clearSelectedRows, rowSelection]);

  // Get the current page size - always use paginationInfo.perPage for server-side
  const currentPageSize = serverSide ? (paginationInfo?.perPage || defaultPageSize) : pageSize;

  // Filtered data based on search term (only for client-side)
  const filteredData = useMemo(() => {
    if (serverSide) {
      // For server-side, return data as-is since filtering is handled by server
      return data;
    }

    if (!searchTerm.trim()) return data;

    const q = searchTerm.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some((value) =>
        (value?.toString() ?? '').toLowerCase().includes(q),
      ),
    );
  }, [data, searchTerm, serverSide]);

  const genericColumns = useMemo(() => {
    return columns.map((col) => ({
      key: col.key,
      label: col.name,
      sortable: col.sortable,
      type: col.cell ? 'custom' : 'text',
      accessor: col.selector as (row: T) => unknown,
      render: col.cell ? (row: T) => col.cell?.(row) : undefined,
      emptyValue: '--',
    })) as TableColumn<T>[];
  }, [columns]);

  const clientPagedData = useMemo(() => {
    if (serverSide || !pagination) return filteredData;
    const start = (currentPage - 1) * currentPageSize;
    return filteredData.slice(start, start + currentPageSize);
  }, [serverSide, pagination, filteredData, currentPage, currentPageSize]);

  const tablePagination = useMemo(() => {
    if (!pagination) return undefined;

    return {
      currentPage: serverSide ? (paginationInfo?.currentPage || 1) : currentPage,
      rowsPerPage: currentPageSize,
      totalRows: serverSide ? (paginationInfo?.totalRows || 0) : filteredData.length,
      pageSizeOptions,
    };
  }, [pagination, serverSide, paginationInfo?.currentPage, paginationInfo?.totalRows, currentPage, currentPageSize, filteredData.length, pageSizeOptions]);

  // Event handlers
  const handlePageSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newPageSize = Number(event.target.value);
    setPageSize(newPageSize);

    if (serverSide && onPerPageChange) {
      onPerPageChange(newPageSize);
    }
  };

  const handlePerRowsChange = (newPerPage: number) => {
    setPageSize(newPerPage);

    if (serverSide && onPerPageChange) {
      onPerPageChange(newPerPage);
    }
    if (!serverSide) {
      setCurrentPage(1);
    }
  };

  const handlePageChange = (page: number) => {
    if (serverSide && onPageChange) {
      onPageChange(page);
      return;
    }

    if (!serverSide) {
      setCurrentPage(page);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    onSearch?.(e.target.value);
  };

  return (
    <div className={`custom-datatable ${tableStyle} ${className}`.trim()}>
      {/* Title Section
      {title && (
        <Row className="mb-3">
          <Col md={12}>
            <div className="page-header-title">
              <h2 className="mb-0 d-flex align-items-center">
                {title}
              </h2>
            </div>
          </Col>
        </Row>
      )} */}

      <div className={`table-content ${tableStyle}`}>

         {/* Controls Section */}
      <Row className="mb-3">
        {/* Page Size Selector */}
        {showPageSizeSelector  && (
          <Col sm={12} md={6}>
            <div className="dataTables_length" id={lengthControlId}>
              <label className="d-flex align-items-center" htmlFor={`${lengthControlId}-select`}>
                Show{" "}
                <select
                  id={`${lengthControlId}-select`}
                  onChange={handlePageSizeChange}
                  className="form-select form-select-sm mx-1"
                  style={{ width: "auto" }}
                  value={currentPageSize}
                >
                  {pageSizeOptions.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>{" "}
                entries
              </label>
            </div>
          </Col>
        )}


        {/* Search Control */}

        <Col sm={12} md={showPageSizeSelector ? 6 : 12}>
          <div className='d-flex align-items-center justify-content-end gap-2'>
            {/* Search Box */}
            {showSearch && (
              <div>
                <label className="d-flex align-items-center justify-content-end" htmlFor={searchControlId}>
                  <span className="visually-hidden">{searchPlaceholder}</span>
                  <input
                    id={searchControlId}
                    type="search"
                    className="form-control form-control-sm ms-1"
                    placeholder={searchPlaceholder}
                    aria-controls={lengthControlId}
                    onChange={handleSearchChange}
                    value={searchTerm}
                  />
                </label>
              </div>
            )}
          </div>
        </Col>


      </Row>

      {tableStyle === 'table-style-2222' && (
        <Row className="mb-3 g-0">
        <Col sm={12} md={12}>
          <div className='d-flex align-items-center justify-content-between w-100' style={{ gap: '12px' }}>
            {/* Search Box - Left Side */}
            {showSearch && (
              <div className="search-container" style={{ flex: '1'}}>
                <div className="position-relative">
                  <i className="fas fa-search position-absolute" style={{
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#999',
                    fontSize: '14px',
                    zIndex: 1
                  }}></i>
                  <input
                    id={`${searchControlId}-alt`}
                    type="search"
                    className="form-control"
                    placeholder={searchPlaceholder}
                    aria-label={searchPlaceholder}
                    aria-controls={lengthControlId}
                    onChange={handleSearchChange}
                    value={searchTerm}
                    style={{
                      paddingLeft: '36px',
                      paddingRight: '12px',
                      borderRadius: '6px',
                      border: '1px solid #e0e0e0',
                      backgroundColor: '#f5f5f5',
                      height: '36px',
                      fontSize: '14px',
                      color: '#333'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons - Right Side */}
            <div className="d-flex align-items-center" style={{ gap: '12px' }}>
              {/* Filters Button */}
              {onFiltersClick && (
                <button
                  type="button"
                  className="btn"
                  onClick={onFiltersClick}
                  style={{
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#3366ff',
                    border: 'none',
                    height: '36px',
                    color: 'white',
                    minWidth: '80px',
                    justifyContent: 'center'
                  }}
                >
                  <i className="fas fa-filter" style={{ fontSize: '12px' }}></i>
                  {filtersText}
                </button>
              )}

              {/* Export Button */}
              {onExportClick && (
                <button
                  type="button"
                  className="btn"
                  onClick={onExportClick}
                  style={{
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#e0e0e0',
                    border: '1px solid #e0e0e0',
                    color: '#333',
                    height: '36px',
                    minWidth: '80px',
                    justifyContent: 'center'
                  }}
                >
                  <i className="fas fa-download" style={{ fontSize: '12px' }}></i>
                  {exportText}
                </button>
              )}

              {/* New GSM Button */}
              {onNewClick && (
                <button
                  type="button"
                  className="btn"
                  onClick={onNewClick}
                  style={{
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#28a745',
                    border: 'none',
                    height: '36px',
                    color: 'white',
                    minWidth: '90px',
                    justifyContent: 'center'
                  }}
                >
                  <i className="fas fa-plus" style={{ fontSize: '12px' }}></i>
                  {newText}
                </button>
              )}

            </div>
          </div>
        </Col>
        </Row>
        )}


        {/* GenericTable */}
      <GenericTable
        data={clientPagedData}
        columns={genericColumns}
        loading={loading}
        emptyMessage="No data available"
        hover={highlightOnHover}
        striped={striped}
        selectable={rowSelection}
        selectedRows={selectedRows}
        onSelectionChange={(rows) => {
          setSelectedRows(rows);
          onSelectionChange?.(rows);
        }}
        uniqueKey={keyField}
        showActions={false}
        actions={[]}
        showToolbar={false}
        noBorder={false}
        pagination={tablePagination}
        onPaginationChange={(page, rowsPerPage) => {
          if (rowsPerPage !== currentPageSize) {
            handlePerRowsChange(rowsPerPage);
            if (serverSide) {
              onPageChange?.(1);
            }
            return;
          }
          handlePageChange(page);
        }}
        customizableColumns={showColumnVisibility}
        selectedColumns={selectedColumns}
        defaultSelectedColumns={columns.map((col) => col.key)}
        columnStorageKey={getStorageKey()}
        onColumnChange={(updatedColumns) => {
          const allColumnKeys = columns.map((col) => col.key);
          const validColumns = updatedColumns.filter((key) =>
            allColumnKeys.includes(key),
          );
          const fallbackColumns = validColumns.length > 0
            ? validColumns
            : allColumnKeys;

          setSelectedColumns(fallbackColumns);
          try {
            globalThis.window?.localStorage?.setItem(
              getStorageKey(),
              JSON.stringify(fallbackColumns),
            );
          } catch {
            // Ignore quota / private mode errors
          }
        }}
        onRowClick={
          rowClick && onRowClick
            ? (row, _index) => onRowClick(row)
            : undefined
        }
      />
      </div>
    </div>
  );
}

export default CustomDataTable;
