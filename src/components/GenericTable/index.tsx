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
  type?: 'text' | 'badge' | 'avatar' | 'multi-field' | 'date' | 'phone' | 'custom';
  
  // For custom rendering (fallback)
  render?: (row: T, index: number) => React.ReactNode;
  
  // For avatar type
  avatar?: {
    getInitials?: (row: T) => string;
    getColor?: (row: T) => string;
  };
  
  // For badge type
  badge?: {
    getVariant?: (row: T) => 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
    getColor?: (row: T) => string; // For custom color
  };
  
  // For multi-field type
  fields?: {
    primary: string; // Key for primary field
    secondary?: string; // Key for secondary field
    secondaryClass?: string; // CSS class for secondary
  };
  
  // For date formatting
  dateFormat?: string;
  
  // For empty values
  emptyValue?: string | React.ReactNode;
  
  // Data accessor (if different from key)
  accessor?: (row: T) => any;
}

export interface DropdownOption<T = any> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  show?: (row: T) => boolean;
  className?: string;
  divider?: boolean; // Add divider after this option
}

export interface TableAction<T = any> {
  label: string;
  icon?: React.ReactNode;
  onClick?: (row: T) => void;
  variant?: string;
  className?: string;
  show?: (row: T) => boolean;
  render?: (row: T) => React.ReactNode; // For custom action rendering like dropdowns
  
  // Dropdown configuration
  dropdown?: {
    options: DropdownOption<T>[];
    align?: 'start' | 'end';
    toggleVariant?: string;
    toggleClassName?: string;
  };
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
  
  // Selection
  selectable?: boolean;
  selectedRows?: T[];
  onSelectionChange?: (selected: T[]) => void;
  
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
  uniqueKey?: string; // Key to use for row key (default: 'id')
}

const GenericTable = <T extends Record<string, any>>({
  data,
  columns,
  pagination,
  onPaginationChange,
  sortable = true,
  defaultSortColumn = '',
  defaultSortDirection = 'asc',
  onSort,
  actions = [],
  showActions = true,
  actionsLabel = 'Actions',
  selectable = false,
  selectedRows = [],
  onSelectionChange,
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
      if (saved) return JSON.parse(saved);
    }
    return defaultSelectedColumns || columns.map(c => c.key);
  });

  // Check if a row is selected
  const isSelected = (row: T) => {
    return selectedRows.some(selectedRow => selectedRow[uniqueKey] === row[uniqueKey]);
  };

  // Handle select all
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      onSelectionChange?.(sortedData);
    } else {
      onSelectionChange?.([]);
    }
  };

  // Handle individual row selection
  const handleRowSelection = (row: T, checked: boolean) => {
    if (checked) {
      onSelectionChange?.([...selectedRows, row]);
    } else {
      onSelectionChange?.(selectedRows.filter(r => r[uniqueKey] !== row[uniqueKey]));
    }
  };

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

  // Render cell content based on column type
  const renderCellContent = (column: TableColumn<T>, row: T, index: number) => {
    // Custom render function takes precedence
    if (column.render) {
      return column.render(row, index);
    }

    // Get value using accessor or key
    const getValue = () => {
      if (column.accessor) return column.accessor(row);
      return row[column.key];
    };

    const value = getValue();

    // Handle empty values
    if (value === null || value === undefined || value === '') {
      return <span className="gt-empty-cell">{column.emptyValue || '-'}</span>;
    }

    // Render based on type
    switch (column.type) {
      case 'avatar':
        const name = String(value);
        const initials = column.avatar?.getInitials?.(row) || name.substring(0, 2).toUpperCase();
        const bgColor = column.avatar?.getColor?.(row) || '#6c757d';
        
        return (
          <div className="gt-name-cell">
            <div className="gt-avatar" style={{ backgroundColor: bgColor }}>
              {initials}
            </div>
            <span className="gt-name-text">{name}</span>
          </div>
        );

      case 'badge':
        const badgeVariant = column.badge?.getVariant?.(row) || 'secondary';
        const badgeColor = column.badge?.getColor?.(row);
        const badgeClass = `gt-badge gt-badge-${badgeVariant}`;
        
        return (
          <span 
            className={badgeClass} 
            style={badgeColor ? { backgroundColor: badgeColor } : undefined}
          >
            {value}
          </span>
        );

      case 'multi-field':
        if (!column.fields) return value;
        
        const primaryValue = row[column.fields.primary];
        const secondaryValue = column.fields.secondary ? row[column.fields.secondary] : null;
        
        return (
          <div className="gt-company-cell">
            <div className="gt-company-name">{primaryValue || column.emptyValue || '-'}</div>
            {secondaryValue && (
              <div className={column.fields.secondaryClass || 'gt-company-industry'}>
                {secondaryValue}
              </div>
            )}
          </div>
        );

      case 'phone':
        // Phone component should be passed via render function
        return value;

      case 'date':
        // Date formatting handled by accessor function
        return value;

      case 'text':
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
                  {selectable && (
                    <th className="generic-table-th" style={{ width: '40px' }}>
                      <Form.Check
                        type="checkbox"
                        checked={sortedData.length > 0 && sortedData.every(row => isSelected(row))}
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
                  {showActions && actions.length > 0 && (
                    <th className="generic-table-th generic-table-actions-header">
                      {actionsLabel}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={(selectable ? 1 : 0) + visibleColumns.length + (showActions && actions.length > 0 ? 1 : 0)} className="text-center py-4">
                      <div className="generic-table-loading">
                        {loadingMessage}
                      </div>
                    </td>
                  </tr>
                ) : sortedData.length === 0 ? (
                  <tr>
                    <td colSpan={(selectable ? 1 : 0) + visibleColumns.length + (showActions && actions.length > 0 ? 1 : 0)} className="text-center py-4">
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
                      className={`generic-table-row ${rowClassName?.(row, index) || ''} ${onRowClick || onRowDoubleClick ? 'clickable' : ''}`}
                    >
                      {selectable && (
                        <td className="generic-table-td" style={{ width: '40px' }}>
                          <Form.Check
                            type="checkbox"
                            checked={isSelected(row)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleRowSelection(row, e.target.checked);
                            }}
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
                      {showActions && actions.length > 0 && (
                        <td className="generic-table-td generic-table-actions-cell">
                          <div className="generic-table-actions">
                            {actions.map((action, actionIndex) => {
                              if (action.show && !action.show(row)) return null;
                              
                              // If action has custom render (for dropdowns, etc.)
                              if (action.render) {
                                return <div key={actionIndex}>{action.render(row)}</div>;
                              }
                              
                              // If action has dropdown configuration
                              if (action.dropdown) {
                                const visibleOptions = action.dropdown.options.filter(
                                  option => !option.show || option.show(row)
                                );
                                
                                if (visibleOptions.length === 0) return null;
                                
                                return (
                                  <Dropdown key={actionIndex} drop="down" align="end">
                                    <Dropdown.Toggle
                                      variant={action.variant || 'link'}
                                      size="sm"
                                      className={action.className || ''}
                                      id={`dropdown-${row[uniqueKey]}-${actionIndex}`}
                                    >
                                      {action.icon}
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                      {visibleOptions.map((option, optionIndex) => {
                                        const menuItem = (
                                          <Dropdown.Item
                                            key={optionIndex}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              option.onClick(row);
                                            }}
                                            className={option.className}
                                          >
                                            {option.icon && <span className="me-2">{option.icon}</span>}
                                            {option.label}
                                          </Dropdown.Item>
                                        );
                                        
                                        if (option.divider) {
                                          return (
                                            <React.Fragment key={optionIndex}>
                                              {menuItem}
                                              <Dropdown.Divider />
                                            </React.Fragment>
                                          );
                                        }
                                        
                                        return menuItem;
                                      })}
                                    </Dropdown.Menu>
                                  </Dropdown>
                                );
                              }
                              
                              return (
                                <Button
                                  key={actionIndex}
                                  variant={action.variant || 'link'}
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    action.onClick?.(row);
                                  }}
                                  className={`p-1 ${action.className || ''}`}
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