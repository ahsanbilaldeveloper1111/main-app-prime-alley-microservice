import React, { useState, useMemo, useEffect } from 'react';
import { Col, Row, Dropdown } from 'react-bootstrap';
import dynamic from 'next/dynamic';
import { Tooltip } from 'react-tooltip';
import '@assets/scss/custom-datatable.scss';
import { Layers } from 'lucide-react';

// Dynamic import for DataTable to avoid SSR issues
const DataTable = dynamic(() => import("react-data-table-component"), {
  ssr: false
});

// Types for better type safety
export interface Column {
  key: string;
  name: string;
  selector: (row: any) => any;
  sortable?: boolean;
  cell?: (props: any) => React.ReactNode;
}

export interface ServerPaginationInfo {
  totalRows: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
}

export interface CustomDataTableProps {
  columns: Column[];
  data: any[];
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
  pointerOnHover?: boolean;
  paginationComponentOptions?: any;
  conditionalRowStyles?: any[];
  onRowClick?: (row: any) => void;
  // Feature flags
  rowClick?: boolean;
  showCanvas?: boolean;
  // Row selection
  rowSelection?: boolean;
  onSelectionChange?: (selectedRows: any[]) => void;
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
  noTableHead?: boolean;
}

const CustomDataTable: React.FC<CustomDataTableProps> = ({
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
  pointerOnHover = true,
  noTableHead = false,
  paginationComponentOptions = {
    rowsPerPageText: "Data per page",
    rangeSeparatorText: "of",
    selectAllRowsItem: false
  },
  conditionalRowStyles = [
    {
      when: () => true,
      style: {
        animation: 'fadeInUp 0.9s ease-in-out',
      },
    },
  ],
  onRowClick,
  // Feature flags
  rowClick = false,
  showCanvas = false,
  // Row selection
  rowSelection = false,
  onSelectionChange,
  // Server-side pagination props
  serverSide = false,
  paginationInfo,
  onPageChange,
  onPerPageChange,
  onSearch,
  pagination=true,
  keyField = "id",
  clearSelectedRows = false,
  // Style-2 specific props
  onFiltersClick,
  onExportClick,
  onNewClick,
  filtersText = 'Filters',
  exportText = 'Export',
  newText = 'New GSM'
}) => {
  // State management
  const [pageSize, setPageSize] = useState<number>(defaultPageSize);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    columns.map(col => col.key)
  );
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  // Sync pageSize with server-side prop
  useEffect(() => {
    if (serverSide && paginationInfo?.perPage) {
      setPageSize(paginationInfo.perPage);
    }
  }, [serverSide, paginationInfo?.perPage]);

  // Get the current page size - always use paginationInfo.perPage for server-side
  const currentPageSize = serverSide ? (paginationInfo?.perPage || defaultPageSize) : pageSize;

  // Filtered data based on search term (only for client-side)
  const filteredData = useMemo(() => {
    if (serverSide) {
      // For server-side, return data as-is since filtering is handled by server
      return data;
    }
    
    if (!searchTerm.trim()) return data;
    
    return data.filter((row) =>
      Object.values(row).some(
        (value) =>
          value &&
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm, serverSide]);

  // Visible columns data
  const visibleColumnsData = useMemo(() => {
    return columns.filter(col => visibleColumns.includes(col.key));
  }, [columns, visibleColumns]);

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
  };

  const handlePageChange = (page: number) => {
    if (serverSide && onPageChange) {
      onPageChange(page);
    }
  };

  const toggleColumnVisibility = (columnKey: string) => {
    setVisibleColumns(prev =>
      prev.includes(columnKey)
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  const showAllColumns = () => {
    setVisibleColumns(columns.map(col => col.key));
  };

  const hideAllColumns = () => {
    setVisibleColumns([columns[0]?.key].filter(Boolean));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    onSearch?.(e.target.value);
  };

  const handleRowSelectionChange = (selected: { allSelected: boolean; selectedCount: number; selectedRows: unknown[] }) => {
    setSelectedRows(selected.selectedRows);
    onSelectionChange?.(selected.selectedRows);
  };

  return (
    <div className={`custom-datatable ${tableStyle}`}>
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
            <div className="dataTables_length" id="dom-jqry_length">
              <label className="d-flex align-items-center">
                Show{" "}
                <select
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


        {/* Search and Column Controls */}
        
        <Col sm={12} md={showPageSizeSelector ? 6 : 12}>
          <div className='d-flex align-items-center justify-content-end gap-2'>
            {/* Search Box */}
            {showSearch && (
              <div>
                <label className="d-flex align-items-center justify-content-end">
                  {/* Search: */}
                  <input
                    type="search"
                    className="form-control form-control-sm ms-1"
                    placeholder={searchPlaceholder}
                    aria-controls="dom-jqry"
                    onChange={handleSearchChange}
                    value={searchTerm}
                  />
                </label>
              </div>
            )}

            {/* Column Visibility Controls */}
            {showColumnVisibility && (
              <div className="d-flex align-items-center justify-content-end">
                <Dropdown>
                  <Dropdown.Toggle variant="outline-secondary" size="sm">
                  <Layers size={14} className="me-1" />
                  Customize Columns 
                  {/* ({visibleColumns.length}/{columns.length}) */}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Header>Select Columns to Show</Dropdown.Header>
                    <Dropdown.Divider />
                    {columns.map((column) => (
                      <div key={column.key} className="px-3 py-1">
                        <div className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={visibleColumns.includes(column.key)}
                            onChange={() => toggleColumnVisibility(column.key)}
                            id={`column-${column.key}`}
                          />
                          <label
                            className="form-check-label"
                            htmlFor={`column-${column.key}`}
                            style={{ cursor: 'pointer' }}
                          >
                            {column.name}
                          </label>
                        </div>
                      </div>
                    ))}
                    {/* <Dropdown.Divider />
                    <Dropdown.Item onClick={showAllColumns}>
                      Show All
                    </Dropdown.Item>
                    <Dropdown.Item onClick={hideAllColumns}>
                      Hide All
                    </Dropdown.Item> */}
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            )}
          </div>
        </Col>
       


      </Row>

      {tableStyle === 'table-style-2222' && (
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
                    type="search"
                    className="form-control"
                    placeholder={searchPlaceholder}
                    aria-controls="dom-jqry"
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

              {/* Column Visibility Controls */}
              {showColumnVisibility && (
                <div className="d-flex align-items-center">
                  <Dropdown>
                    <Dropdown.Toggle variant="outline-secondary" size="sm" style={{ 
                      height: '36px', 
                      borderRadius: '6px',
                      fontSize: '12px',
                      padding: '6px 12px'
                    }}>
                      <i className="fas fa-cog me-1"></i>
                      Customize ({visibleColumns.length}/{columns.length})
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Header>Select Columns to Show</Dropdown.Header>
                      <Dropdown.Divider />
                      {columns.map((column) => (
                        <div key={column.key} className="px-3 py-1">
                          <div className="form-check">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={visibleColumns.includes(column.key)}
                              onChange={() => toggleColumnVisibility(column.key)}
                              id={`column-${column.key}`}
                            />
                            <label
                              className="form-check-label"
                              htmlFor={`column-${column.key}`}
                              style={{ cursor: 'pointer' }}
                            >
                              {column.name}
                            </label>
                          </div>
                        </div>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              )}
            </div>
          </div>
        </Col>
        )}

        
        {/* DataTable */}
      {visibleColumnsData.length > 0 ? (
        <DataTable
          key={`datatable-${currentPageSize}-${visibleColumns.length}-${serverSide ? 'server' : 'client'}`}
          striped={striped}
          columns={visibleColumnsData}
          data={filteredData}
          paginationComponentOptions={paginationComponentOptions}
          pagination={pagination}
          paginationPerPage={currentPageSize}
          paginationRowsPerPageOptions={pageSizeOptions}
          onChangeRowsPerPage={handlePerRowsChange}
          onChangePage={handlePageChange}
          highlightOnHover={highlightOnHover}
          pointerOnHover={rowClick ? true : pointerOnHover}
          conditionalRowStyles={conditionalRowStyles}
          className={className}
          progressPending={loading}
          onRowClicked={rowClick && onRowClick ? onRowClick : undefined}
          paginationTotalRows={serverSide ? paginationInfo?.totalRows : undefined}
          paginationServer={serverSide}
          selectableRows={rowSelection}
          onSelectedRowsChange={handleRowSelectionChange}
          clearSelectedRows={clearSelectedRows}
          keyField={keyField}
          noTableHead={noTableHead}
          selectableRowsComponentProps={{ 
            style: { 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              width: '100%'
            } 
          }}
        />
      ) : (
        <div className="text-center p-4 border rounded">
          <p className="mb-0">
            No columns selected. Please select at least one column to display the table.
          </p>
        </div>
      )}
      </div>

      <Tooltip id="my-tooltip" />
    </div>
  );
};

export default CustomDataTable; 