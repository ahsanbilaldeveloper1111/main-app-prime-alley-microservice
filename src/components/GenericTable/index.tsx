import React, { useState, useMemo } from 'react';
import { Table, Form, Button, Dropdown, Card } from 'react-bootstrap';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Layers
} from 'lucide-react';
import '@assets/css/GenericTable.css';

// Type definitions
export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  
  // Data rendering types
  type?: 'text' | 'badge' | 'avatar' | 'multi-field' | 'date' | 'custom';
  
  // For custom rendering (fallback)
  render?: (row: T, index: number) => React.ReactNode;
  
  // For avatar type
  avatar?: {
    getInitials?: (row: T) => string;
    getColor?: (row: T) => string;
  };
  
  // For badge type
  badge?: {
    getVariant?: (row: T) => 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
    getColor?: (row: T) => string; // For custom color (overrides variant)
  };
  
  // For multi-field type
  fields?: {
    primary: string;
    secondary?: string;
    secondaryClass?: string;
  };
  
  // For date formatting
  dateFormat?: string;
  
  // For empty values
  emptyValue?: string | React.ReactNode;
  
  // Data accessor (if different from key)
  accessor?: (row: T) => any;
}

export interface TableAction<T = any> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  variant?: string;
  show?: (row: T) => boolean;
  render?: (row: T) => React.ReactNode;
}

export interface PaginationConfig {
  currentPage: number;
  rowsPerPage: number;
  totalRows: number;
  pageSizeOptions?: number[];
}

export interface GenericTableProps<T = any> {
  // Data
  data: T[];
  columns: TableColumn<T>[];
  
  // Selection
  selectable?: boolean;
  selectedRows?: any[];
  onSelectionChange?: (selectedRows: any[]) => void;
  selectKey?: string; // Key to use for selection (default: 'id')
  
  // Pagination
  pagination?: PaginationConfig;
  onPaginationChange?: (page: number, rowsPerPage: number) => void;
  
  // Sorting
  sortable?: boolean;
  defaultSortColumn?: string;
  defaultSortDirection?: 'asc' | 'desc';
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  
  // Actions
  actions?: TableAction<T>[];
  showActions?: boolean;
  actionsLabel?: string;
  
  // Column customization
  customizableColumns?: boolean;
  defaultSelectedColumns?: string[];
  onColumnChange?: (selectedColumns: string[]) => void;
  columnStorageKey?: string;
  
  // Row interactions
  onRowClick?: (row: T, index: number) => void;
  onRowDoubleClick?: (row: T, index: number) => void;
  rowClassName?: (row: T, index: number) => string;
  
  // Styling
  striped?: boolean;
  hover?: boolean;
  bordered?: boolean;
  size?: 'sm' | 'md' | 'lg';
  
  // Loading & Empty states
  loading?: boolean;
  emptyMessage?: string | React.ReactNode;
  loadingMessage?: string | React.ReactNode;
  
  // Misc
  uniqueKey?: string;
}

const GenericTable = <T extends Record<string, any>>({
  data,
  columns,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  selectKey = 'id',
  pagination,
  onPaginationChange,
  sortable = true,
  defaultSortColumn = '',
  defaultSortDirection = 'asc',
  onSort,
  actions = [],
  showActions = true,
  actionsLabel = 'Actions',
  customizableColumns = false,
  defaultSelectedColumns,
  onColumnChange,
  columnStorageKey,
  onRowClick,
  onRowDoubleClick,
  rowClassName,
  striped = false,
  hover = true,
  bordered = false,
  size = 'md',
  loading = false,
  emptyMessage = 'No data available',
  loadingMessage = 'Loading...',
  uniqueKey = 'id'
}: GenericTableProps<T>) => {
  // Sorting state
  const [sortColumn, setSortColumn] = useState(defaultSortColumn);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultSortDirection);
  
  // Column selection state
  const [selectedColumns, setSelectedColumns] = useState<string[]>(() => {
    if (columnStorageKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(columnStorageKey);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return defaultSelectedColumns || columns.map(c => c.key);
        }
      }
    }
    return defaultSelectedColumns || columns.map(c => c.key);
  });

  // Selection state
  const [internalSelectedRows, setInternalSelectedRows] = useState<any[]>(selectedRows);

  // Use controlled or uncontrolled selection
  const currentSelectedRows = onSelectionChange ? selectedRows : internalSelectedRows;

  // Filter visible columns
  const visibleColumns = useMemo(() => {
    if (!customizableColumns) return columns;
    return columns.filter(col => selectedColumns.includes(col.key));
  }, [columns, selectedColumns, customizableColumns]);

  // Handle sorting
  const handleSort = (column: string) => {
    if (!sortable) return;
    
    const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(column);
    setSortDirection(newDirection);
    
    if (onSort) {
      onSort(column, newDirection);
    }
  };

  // Handle row selection
  const handleSelectRow = (row: T) => {
    if (!selectable) return;
    
    const rowId = row[selectKey];
    const isSelected = currentSelectedRows.some((r: any) => r[selectKey] === rowId);
    
    let newSelection: any[];
    if (isSelected) {
      newSelection = currentSelectedRows.filter((r: any) => r[selectKey] !== rowId);
    } else {
      newSelection = [...currentSelectedRows, row];
    }
    
    if (onSelectionChange) {
      onSelectionChange(newSelection);
    } else {
      setInternalSelectedRows(newSelection);
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (!selectable) return;
    
    const allSelected = sortedData.every(row => 
      currentSelectedRows.some((r: any) => r[selectKey] === row[selectKey])
    );
    
    let newSelection: any[];
    if (allSelected) {
      newSelection = [];
    } else {
      newSelection = [...sortedData];
    }
    
    if (onSelectionChange) {
      onSelectionChange(newSelection);
    } else {
      setInternalSelectedRows(newSelection);
    }
  };

  // Check if row is selected
  const isRowSelected = (row: T) => {
    return currentSelectedRows.some((r: any) => r[selectKey] === row[selectKey]);
  };

  // Check if all rows are selected
  const areAllRowsSelected = () => {
    return sortedData.length > 0 && sortedData.every(row => isRowSelected(row));
  };

  // Render cell content based on column type
  const renderCellContent = (column: TableColumn<T>, row: T, index: number) => {
    // Custom render function takes precedence
    if (column.render) {
      return column.render(row, index);
    }

    // Get value using accessor or key
    const getValue = () => {
      if (column.accessor) {
        try {
          return column.accessor(row);
        } catch (error) {
          console.warn(`Error in accessor for column ${column.key}:`, error);
          return null;
        }
      }
      return row[column.key];
    };

    const value = getValue();

    // Handle empty values
    if (value === null || value === undefined || value === '') {
      return <span className="gt-empty-cell">{column.emptyValue || '-'}</span>;
    }

    // Render based on type
    switch (column.type) {
      case 'avatar': {
        const name = String(value);
        let initials = name.substring(0, 2).toUpperCase();
        let bgColor = '#6c757d';
        
        // Safely get initials if avatar config exists
        if (column.avatar?.getInitials) {
          try {
            initials = column.avatar.getInitials(row);
          } catch (error) {
            console.warn(`Error getting initials for ${column.key}:`, error);
          }
        }
        
        // Safely get color if avatar config exists
        if (column.avatar?.getColor) {
          try {
            bgColor = column.avatar.getColor(row);
          } catch (error) {
            console.warn(`Error getting color for ${column.key}:`, error);
          }
        }
        
        return (
          <div className="gt-name-cell">
            <div className="gt-avatar" style={{ backgroundColor: bgColor }}>
              {initials}
            </div>
            <span className="gt-name-text">{name}</span>
          </div>
        );
      }

      case 'badge': {
        let badgeClass = 'gt-badge gt-badge-secondary';
        let customStyle: React.CSSProperties | undefined = undefined;
        
        // Get variant or color
        if (column.badge?.getColor) {
          try {
            const color = column.badge.getColor(row);
            if (color) {
              customStyle = { backgroundColor: color };
            }
          } catch (error) {
            console.warn(`Error getting badge color for ${column.key}:`, error);
          }
        } else if (column.badge?.getVariant) {
          try {
            const variant = column.badge.getVariant(row);
            badgeClass = `gt-badge gt-badge-${variant}`;
          } catch (error) {
            console.warn(`Error getting badge variant for ${column.key}:`, error);
          }
        }
        
        return (
          <span className={badgeClass} style={customStyle}>
            {value}
          </span>
        );
      }

      case 'multi-field': {
        if (!column.fields) return value;
        
        const primaryValue = row[column.fields.primary] || column.emptyValue || '-';
        const secondaryValue = column.fields.secondary ? row[column.fields.secondary] : null;
        
        return (
          <div className="gt-company-cell">
            <div className="gt-company-name">{primaryValue}</div>
            {secondaryValue && (
              <div className={column.fields.secondaryClass || 'gt-company-industry'}>
                {secondaryValue}
              </div>
            )}
          </div>
        );
      }

      case 'date':
      case 'text':
      case 'custom':
      default:
        return value;
    }
  };

  // Sort data (client-side if no onSort provided)
  const sortedData = useMemo(() => {
    if (onSort || !sortColumn) return data;
    
    return [...data].sort((a, b) => {
      const aVal = a[sortColumn] ?? '';
      const bVal = b[sortColumn] ?? '';
      
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      
      if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortColumn, sortDirection, onSort]);

  // Render sort icon
  const renderSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown size={14} className="ms-1 text-muted" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp size={14} className="ms-1" />
    ) : (
      <ArrowDown size={14} className="ms-1" />
    );
  };

  // Handle column selection
  const handleColumnToggle = (columnKey: string) => {
    const newSelected = selectedColumns.includes(columnKey)
      ? selectedColumns.filter(k => k !== columnKey)
      : [...selectedColumns, columnKey];
    
    setSelectedColumns(newSelected);
    
    if (columnStorageKey) {
      localStorage.setItem(columnStorageKey, JSON.stringify(newSelected));
    }
    
    if (onColumnChange) {
      onColumnChange(newSelected);
    }
  };

  // Pagination controls
  const renderPaginationControls = () => {
    if (!pagination) return null;
    
    const { currentPage, rowsPerPage, totalRows, pageSizeOptions = [10, 25, 50, 100] } = pagination;
    const totalPages = Math.ceil(totalRows / rowsPerPage);
    const startRow = (currentPage - 1) * rowsPerPage + 1;
    const endRow = Math.min(currentPage * rowsPerPage, totalRows);

    return (
      <div className="generic-table-pagination">
        <div className="pagination-info">
          <span className="text-muted small">Show</span>
          <Form.Select
            size="sm"
            value={rowsPerPage}
            onChange={(e) => onPaginationChange?.(currentPage, Number(e.target.value))}
            className="pagination-select"
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </Form.Select>
          <span className="text-muted small">entries</span>
        </div>

        <div className="text-muted small">
          Showing {startRow} to {endRow} of {totalRows} entries
        </div>

        <div className="pagination-buttons">
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={currentPage === 1}
            onClick={() => onPaginationChange?.(1, rowsPerPage)}
          >
            <ChevronsLeft size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={currentPage === 1}
            onClick={() => onPaginationChange?.(currentPage - 1, rowsPerPage)}
          >
            <ChevronLeft size={14} />
          </Button>

          {[...Array(totalPages)].map((_, index) => {
            const pageNum = index + 1;
            if (
              pageNum === 1 ||
              pageNum === totalPages ||
              (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
            ) {
              return (
                <Button
                  key={pageNum}
                  size="sm"
                  variant={currentPage === pageNum ? 'primary' : 'outline-secondary'}
                  onClick={() => onPaginationChange?.(pageNum, rowsPerPage)}
                >
                  {pageNum}
                </Button>
              );
            } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
              return <span key={pageNum} className="px-2">...</span>;
            }
            return null;
          })}

          <Button
            size="sm"
            variant="outline-secondary"
            disabled={currentPage === totalPages}
            onClick={() => onPaginationChange?.(currentPage + 1, rowsPerPage)}
          >
            <ChevronRight size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={currentPage === totalPages}
            onClick={() => onPaginationChange?.(totalPages, rowsPerPage)}
          >
            <ChevronsRight size={14} />
          </Button>
        </div>
      </div>
    );
  };

  const hasActions = showActions && actions && actions.length > 0;

  return (
    <div className="generic-table-container">
      {/* Column Customization */}
      {customizableColumns && (
        <div className="d-flex justify-content-end gap-2 mb-3">
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" size="sm">
              <Layers size={16} className="me-2" />
              Customize Columns
            </Dropdown.Toggle>
            <Dropdown.Menu align="end" className="column-selector-menu">
              {columns.map((col) => (
                <Dropdown.Item key={col.key} as="div">
                  <Form.Check
                    type="checkbox"
                    label={col.label}
                    checked={selectedColumns.includes(col.key)}
                    onChange={() => handleColumnToggle(col.key)}
                  />
                </Dropdown.Item>
              ))}
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => {
                const allKeys = columns.map(c => c.key);
                setSelectedColumns(allKeys);
                if (columnStorageKey) localStorage.setItem(columnStorageKey, JSON.stringify(allKeys));
                if (onColumnChange) onColumnChange(allKeys);
              }}>
                Select All
              </Dropdown.Item>
              <Dropdown.Item onClick={() => {
                const defaultKeys = defaultSelectedColumns || columns.map(c => c.key);
                setSelectedColumns(defaultKeys);
                if (columnStorageKey) localStorage.setItem(columnStorageKey, JSON.stringify(defaultKeys));
                if (onColumnChange) onColumnChange(defaultKeys);
              }}>
                Reset to Default
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      )}

      {/* Table */}
      <Card className="border-0 shadow-sm generic-table-card">
        <Card.Body className="p-0">
          <div className="generic-table-responsive">
            <Table
              hover={hover}
              striped={striped}
              bordered={bordered}
              size={size}
              className="generic-table mb-0"
            >
              <thead className="generic-table-header">
                <tr>
                  {/* Selection checkbox column */}
                  {selectable && (
                    <th className="generic-table-th" style={{ width: 'auto' }}>
                      <Form.Check
                        type="checkbox"
                        checked={areAllRowsSelected()}
                        onChange={handleSelectAll}
                      />
                    </th>
                  )}
                  
                  {visibleColumns.map((col) => (
                    <th
                      key={col.key}
                      className={`generic-table-th ${col.sortable !== false && sortable ? 'sortable' : ''}`}
                      style={{ textAlign: col.align || 'left' }}
                      onClick={() => col.sortable !== false && sortable && handleSort(col.key)}
                    >
                      <div className="th-content">
                        <span>{col.label}</span>
                        {col.sortable !== false && sortable && renderSortIcon(col.key)}
                      </div>
                    </th>
                  ))}
                  
                  {hasActions && (
                    <th className="generic-table-th generic-table-actions-header">
                      {actionsLabel}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumns.length + (selectable ? 1 : 0) + (hasActions ? 1 : 0)} className="text-center py-4">
                      <div className="generic-table-loading">
                        {loadingMessage}
                      </div>
                    </td>
                  </tr>
                ) : sortedData.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumns.length + (selectable ? 1 : 0) + (hasActions ? 1 : 0)} className="text-center py-4">
                      <div className="generic-table-empty">
                        {emptyMessage}
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedData.map((row, index) => (
                    <tr
                      key={row[uniqueKey] || index}
                      onClick={() => onRowClick?.(row, index)}
                      onDoubleClick={() => onRowDoubleClick?.(row, index)}
                      className={`generic-table-row ${rowClassName?.(row, index) || ''} ${onRowClick || onRowDoubleClick ? 'clickable' : ''} ${isRowSelected(row) ? 'selected' : ''}`}
                    >
                      {/* Selection checkbox cell */}
                      {selectable && (
                        <td className="generic-table-td" onClick={(e) => e.stopPropagation()}>
                          <Form.Check
                            type="checkbox"
                            checked={isRowSelected(row)}
                            onChange={() => handleSelectRow(row)}
                          />
                        </td>
                      )}
                      
                      {visibleColumns.map((col) => (
                        <td
                          key={col.key}
                          className="generic-table-td"
                          style={{ textAlign: col.align || 'left' }}
                        >
                          {renderCellContent(col, row, index)}
                        </td>
                      ))}
                      
                      {hasActions && (
                        <td className="generic-table-td generic-table-actions-cell">
                          <div className="generic-table-actions">
                            {actions.map((action, actionIndex) => {
                              // Check if action should be shown
                              if (action.show && !action.show(row)) return null;
                              
                              // If action has custom render (for dropdowns, etc.)
                              if (action.render) {
                                return <div key={actionIndex}>{action.render(row)}</div>;
                              }
                              
                              return (
                                <Button
                                  key={actionIndex}
                                  variant={action.variant || 'link'}
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    action.onClick(row);
                                  }}
                                  className="p-1"
                                  title={action.label}
                                >
                                  {action.icon || action.label}
                                </Button>
                              );
                            })}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
          {pagination && <div className="p-3">{renderPaginationControls()}</div>}
        </Card.Body>
      </Card>
    </div>
  );
};

export default GenericTable;