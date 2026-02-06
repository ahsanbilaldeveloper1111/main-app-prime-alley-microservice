import React, { useState, useMemo, useRef, useEffect } from 'react';
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
    getVariant?: (row: T) => 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'dark' | 'light';
    getColor?: (row: T) => string; // For custom color
    showDot?: (row: T) => boolean; // For status badges with dot indicator
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
    const defaults = defaultSelectedColumns || columns.map(c => c.key);
    if (columnStorageKey && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(columnStorageKey);
        if (saved) {
          const savedCols: string[] = JSON.parse(saved);
          // Merge in any default columns missing from saved (e.g. newly added columns)
          const missing = defaults.filter((c: string) => !savedCols.includes(c));
          return missing.length > 0 ? [...savedCols, ...missing] : savedCols;
        }
      } catch (_e) {}
    }
    return defaults;
  });

  // Context menu (right‑click) state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; row: T } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Flatten actions into context menu items (buttons + dropdown options)
  type ContextMenuItem = { label: string; icon?: React.ReactNode; onClick: (row: T) => void; divider?: boolean; className?: string };
  const getContextMenuItems = useMemo(() => {
    return (row: T): ContextMenuItem[] => {
      const items: ContextMenuItem[] = [];
      for (const action of actions) {
        if (action.show && !action.show(row)) continue;
        if (action.dropdown) {
          const opts = action.dropdown.options.filter(o => !o.show || o.show(row));
          for (let i = 0; i < opts.length; i++) {
            const o = opts[i];
            items.push({
              label: o.label,
              icon: o.icon,
              onClick: o.onClick,
              divider: o.divider ?? false,
              className: o.className,
            });
          }
        } else if (action.onClick && !action.render) {
          items.push({
            label: action.label,
            icon: action.icon,
            onClick: action.onClick,
            divider: false,
            className: action.className,
          });
        }
      }
      return items;
    };
  }, [actions]);

  // Close context menu on outside click or Escape
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    const onMouseDown = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [contextMenu]);

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
        const showDot = column.badge?.showDot?.(row) ?? false;
        const badgeClass = showDot 
          ? `gt-status-badge gt-badge-${badgeVariant}` 
          : `gt-badge gt-badge-${badgeVariant}`;
        
        return (
          <span 
            className={badgeClass} 
            style={badgeColor ? { backgroundColor: badgeColor } : undefined}
          >
            {showDot && <span className="gt-status-dot"></span>}
            {value}
          </span>
        );

      case 'multi-field':
        if (!column.fields) return value;
        
        const primaryValue = row[column.fields.primary];
        const secondaryValue = column.fields.secondary ? row[column.fields.secondary] : null;
        
        return (
          <div className="gt-company-cell">
            <div className="gt-company-name gt-text">{primaryValue || column.emptyValue || '-'}</div>
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
        return <span className="gt-text">{value}</span>;

      case 'text':
      default:
        return <span className="gt-text">{value}</span>;
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
      {/* Right‑click context menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="gt-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          role="menu"
        >
          {getContextMenuItems(contextMenu.row).map((item, idx) => (
            <React.Fragment key={idx}>
              <button
                type="button"
                className={`gt-context-menu-item ${item.className || ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  item.onClick(contextMenu.row);
                  setContextMenu(null);
                }}
                role="menuitem"
              >
                {item.icon && <span className="gt-context-menu-icon">{item.icon}</span>}
                {item.label}
              </button>
              {item.divider && <div className="gt-context-menu-divider" />}
            </React.Fragment>
          ))}
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
                  {visibleColumns.map((col, colIndex) => {
                    const isLastColumn = colIndex === visibleColumns.length - 1;
                    const hasActionsColumn = showActions && actions.length > 0;
                    const showCustomizerInHeader = customizableColumns && isLastColumn && !hasActionsColumn;
                    return (
                      <th
                        key={col.key}
                        className={`generic-table-th ${col.sortable !== false && sortable ? 'sortable' : ''}`}
                        style={{ textAlign: col.align || 'left' }}
                        onClick={(e) => {
                          if (showCustomizerInHeader && (e.target as HTMLElement).closest('.dropdown')) return;
                          col.sortable !== false && sortable && handleSort(col.key);
                        }}
                      >
                        <div className="th-content d-flex align-items-center justify-content-between gap-1">
                          <div className="d-flex align-items-center">
                            <span>{col.label}</span>
                            {col.sortable !== false && sortable && renderSortIcon(col.key)}
                          </div>
                          {showCustomizerInHeader && (
                            <Dropdown align="end" autoClose="outside" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                              <Dropdown.Toggle
                                variant="link"
                                size="sm"
                                className="d-inline-flex align-items-center p-1 text-secondary text-decoration-none border-0"
                                id="column-customizer-toggle"
                                style={{ minWidth: 'auto' }}
                              >
                                <Layers size={18} />
                              </Dropdown.Toggle>
                              <Dropdown.Menu align="end" className="column-selector-menu">
                                {columns.map((c) => (
                                  <Dropdown.Item key={c.key} as="div">
                                    <Form.Check
                                      type="checkbox"
                                      label={c.label || c.key}
                                      checked={selectedColumns.includes(c.key)}
                                      onChange={() => handleColumnToggle(c.key)}
                                    />
                                  </Dropdown.Item>
                                ))}
                                <Dropdown.Divider />
                                <Dropdown.Item
                                  onClick={() => {
                                    const allKeys = columns.map(c => c.key);
                                    setSelectedColumns(allKeys);
                                    if (columnStorageKey) localStorage.setItem(columnStorageKey, JSON.stringify(allKeys));
                                    if (onColumnChange) onColumnChange(allKeys);
                                  }}
                                >
                                  Select All
                                </Dropdown.Item>
                                <Dropdown.Item
                                  onClick={() => {
                                    const defaultKeys = defaultSelectedColumns || columns.map(c => c.key);
                                    setSelectedColumns(defaultKeys);
                                    if (columnStorageKey) localStorage.setItem(columnStorageKey, JSON.stringify(defaultKeys));
                                    if (onColumnChange) onColumnChange(defaultKeys);
                                  }}
                                >
                                  Reset to Default
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                          )}
                        </div>
                      </th>
                    );
                  })}
                  {showActions && actions.length > 0 && (
                    <th className="generic-table-th generic-table-actions-header">
                      <div className="d-flex align-items-center justify-content-center gap-1 w-100">
                        <span className='text-center'>{actionsLabel}</span>
                        {customizableColumns && (
                          <Dropdown align="end" autoClose="outside" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                            <Dropdown.Toggle
                              variant="link"
                              size="sm"
                              className="d-inline-flex align-items-center p-1 text-secondary text-decoration-none border-0"
                              id="column-customizer-toggle"
                              style={{ minWidth: 'auto' }}
                            >
                              <Layers size={18} />
                            </Dropdown.Toggle>
                            <Dropdown.Menu align="end" className="column-selector-menu">
                              {columns.map((c) => (
                                <Dropdown.Item key={c.key} as="div">
                                  <Form.Check
                                    type="checkbox"
                                    label={c.label || c.key}
                                    checked={selectedColumns.includes(c.key)}
                                    onChange={() => handleColumnToggle(c.key)}
                                  />
                                </Dropdown.Item>
                              ))}
                              <Dropdown.Divider />
                              <Dropdown.Item
                                onClick={() => {
                                  const allKeys = columns.map(c => c.key);
                                  setSelectedColumns(allKeys);
                                  if (columnStorageKey) localStorage.setItem(columnStorageKey, JSON.stringify(allKeys));
                                  if (onColumnChange) onColumnChange(allKeys);
                                }}
                              >
                                Select All
                              </Dropdown.Item>
                              <Dropdown.Item
                                onClick={() => {
                                  const defaultKeys = defaultSelectedColumns || columns.map(c => c.key);
                                  setSelectedColumns(defaultKeys);
                                  if (columnStorageKey) localStorage.setItem(columnStorageKey, JSON.stringify(defaultKeys));
                                  if (onColumnChange) onColumnChange(defaultKeys);
                                }}
                              >
                                Reset to Default
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        )}
                      </div>
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
                      onContextMenu={(e) => {
                        if (!showActions || actions.length === 0) return;
                        e.preventDefault();
                        e.stopPropagation();
                        const items = getContextMenuItems(row);
                        if (items.length === 0) return;
                        setContextMenu({ x: e.clientX, y: e.clientY, row });
                      }}
                      className={`generic-table-row ${rowClassName?.(row, index) || ''} ${onRowClick || onRowDoubleClick ? 'clickable' : ''}`}
                    >
                      {selectable && (
                        <td className="generic-table-td" style={{ width: '40px' }} onClick={(e) => e.stopPropagation()}>
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
                                return (
                                  <div key={actionIndex} onClick={(e) => e.stopPropagation()}>
                                    {action.render(row)}
                                  </div>
                                );
                              }
                              
                              // If action has dropdown configuration
                              if (action.dropdown) {
                                const visibleOptions = action.dropdown.options.filter(
                                  option => !option.show || option.show(row)
                                );
                                
                                if (visibleOptions.length === 0) return null;
                                
                                return (
                                  <div key={actionIndex} onClick={(e) => e.stopPropagation()}>
                                    <Dropdown drop="down" align="end">
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
                                  </div>
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