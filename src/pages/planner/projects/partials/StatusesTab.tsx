import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useProjectSettingsTabListState } from '@hooks/useProjectSettingsTabListState';
import { paginatedSlice } from '@utils/paginatedSlice';
import { Spinner, Button, Modal, Form, Table } from 'react-bootstrap';
import {
  Plus,
  Trash2,
  Edit,
  Filter,
  Tag,
  GripVertical,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { createStatus, updateStatus, deleteStatus, reorderStatuses } from '@utils/tasks';
import GenericTable, { TableColumn, TableAction, ToolbarConfig, FilterPill } from '@components/GenericTable';
import { StatsCardData } from '@components/GenericStatsCards';

interface StatusesTabProps {
  selectedProject: any;
  statuses: any[];
  loading: boolean;
  onRefresh: () => void;
  styles: any;
  canManageProject: boolean;
}

const predefinedColors = [
  '#4680FF', '#2CA87F', '#FFB64D', '#DC2626', '#9E9E9E',
  '#667EEA', '#F56565', '#48BB78', '#ED8936', '#4FC3F7',
];

type StatusFormColorPickerProps = {
  color: string;
  onColorChange: (color: string) => void;
};

const StatusFormColorPicker: React.FC<StatusFormColorPickerProps> = ({
  color,
  onColorChange,
}) => (
  <>
    <div
      style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '0.5rem',
        flexWrap: 'wrap',
      }}
    >
      {predefinedColors.map((preset) => (
        <button
          key={preset}
          type="button"
          onClick={() => onColorChange(preset)}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            backgroundColor: preset,
            border:
              color === preset ? '3px solid #1F2937' : '2px solid #E5E9F2',
            cursor: 'pointer',
            padding: 0,
          }}
        />
      ))}
    </div>
    <Form.Control
      type="color"
      value={color}
      onChange={(e) => onColorChange(e.target.value)}
      style={{ width: '100%', height: '40px' }}
    />
  </>
);

const DEFAULT_STATUS_FORM = {
  name: '',
  color: '#4680FF',
  is_completed: false,
  is_default: false,
};

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** Merge a reordered subset (filtered rows) back into the full project status id order. */
function applyFilteredReorder(
  fullOrderedIds: number[],
  reorderedFilteredIds: number[],
): number[] {
  const filteredSet = new Set(reorderedFilteredIds);
  let fi = 0;
  return fullOrderedIds.map((id) =>
    filteredSet.has(id) ? reorderedFilteredIds[fi++] : id,
  );
}

type StatusesTableCustomBodyProps = {
  paginatedStatuses: any[];
  visibleColumns: TableColumn[];
  actions: TableAction[];
  isAllow: boolean;
  processing: boolean;
  loading: boolean;
  selectedItems: number[];
  onToggleSelectAllPage: (checked: boolean) => void;
  onToggleRow: (id: number, checked: boolean) => void;
  onReorderPageRows: (fromPageIndex: number, toPageIndex: number) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (column: string, direction: 'asc' | 'desc') => void;
  sortable: boolean;
  onFirstColumnClick: (row: any, index: number) => void;
  onRowDoubleClick?: (row: any, index: number) => void;
  emptyMessage: React.ReactNode;
  loadingMessage: React.ReactNode;
  maxHeight: string;
  fixedHeight: boolean;
  currentPage: number;
  rowsPerPage: number;
  totalFiltered: number;
  pageSizeOptions: number[];
  onPaginationChange: (page: number, rowsPerPage: number) => void;
};

const StatusesTableCustomBody: React.FC<StatusesTableCustomBodyProps> = ({
  paginatedStatuses,
  visibleColumns,
  actions,
  isAllow,
  processing,
  loading,
  selectedItems,
  onToggleSelectAllPage,
  onToggleRow,
  onReorderPageRows,
  sortBy,
  sortOrder,
  onSort,
  sortable,
  onFirstColumnClick,
  onRowDoubleClick,
  emptyMessage,
  loadingMessage,
  maxHeight,
  fixedHeight,
  currentPage,
  rowsPerPage,
  totalFiltered,
  pageSizeOptions,
  onPaginationChange,
}) => {
  const showReorder = isAllow && !processing && !loading;
  const hasActions = isAllow && actions.length > 0;
  const colCount =
    (isAllow ? 1 : 0) +
    (showReorder ? 1 : 0) +
    visibleColumns.length +
    (hasActions ? 1 : 0);

  const renderSortIcon = (columnKey: string) => {
    if (sortBy !== columnKey) {
      return <ArrowUpDown size={14} className="ms-1 text-muted" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp size={14} className="ms-1" />
    ) : (
      <ArrowDown size={14} className="ms-1" />
    );
  };

  const handleHeaderSort = (columnKey: string) => {
    if (!sortable) return;
    const col = visibleColumns.find((c) => c.key === columnKey);
    if (col?.sortable === false) return;
    const newDirection =
      sortBy === columnKey && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort(columnKey, newDirection);
  };

  const totalPages = Math.ceil(totalFiltered / rowsPerPage) || 1;
  const startRow = totalFiltered === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endRow = Math.min(currentPage * rowsPerPage, totalFiltered);

  const paginationControls = (
    <div className="generic-table-pagination">
      <div className="pagination-info">
        <span className="text-muted small">Show</span>
        <Form.Select
          size="sm"
          value={rowsPerPage}
          onChange={(e) =>
            onPaginationChange(currentPage, Number(e.target.value))
          }
          className="pagination-select"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </Form.Select>
        <span className="text-muted small">entries</span>
      </div>

      <div className="text-muted small">
        Showing {startRow} to {endRow} of {totalFiltered} entries
      </div>

      <div className="pagination-buttons">
        <Button
          size="sm"
          variant="outline-secondary"
          disabled={currentPage === 1}
          onClick={() => onPaginationChange(1, rowsPerPage)}
        >
          <ChevronsLeft size={14} />
        </Button>
        <Button
          size="sm"
          variant="outline-secondary"
          disabled={currentPage === 1}
          onClick={() => onPaginationChange(currentPage - 1, rowsPerPage)}
        >
          <ChevronLeft size={14} />
        </Button>

        {Array.from({ length: totalPages }, (_, index) => {
          const pageNum = index + 1;
          if (
            pageNum === 1 ||
            pageNum === totalPages ||
            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
          ) {
            const variant =
              currentPage === pageNum ? 'primary' : 'outline-secondary';
            return (
              <Button
                key={pageNum}
                size="sm"
                variant={variant}
                onClick={() => onPaginationChange(pageNum, rowsPerPage)}
              >
                {pageNum}
              </Button>
            );
          }
          if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
            return (
              <span key={pageNum} className="px-2">
                ...
              </span>
            );
          }
          return null;
        })}

        <Button
          size="sm"
          variant="outline-secondary"
          disabled={currentPage === totalPages || totalFiltered === 0}
          onClick={() => onPaginationChange(currentPage + 1, rowsPerPage)}
        >
          <ChevronRight size={14} />
        </Button>
        <Button
          size="sm"
          variant="outline-secondary"
          disabled={currentPage === totalPages || totalFiltered === 0}
          onClick={() => onPaginationChange(totalPages, rowsPerPage)}
        >
          <ChevronsRight size={14} />
        </Button>
      </div>
    </div>
  );

  const allPageSelected =
    paginatedStatuses.length > 0 &&
    paginatedStatuses.every((row) => selectedItems.includes(row.id));

  let bodyRows: React.ReactNode;
  if (loading) {
    bodyRows = (
      <tr>
        <td colSpan={colCount} className="text-center py-4">
          <div className="generic-table-loading">{loadingMessage}</div>
        </td>
      </tr>
    );
  } else if (paginatedStatuses.length === 0) {
    bodyRows = (
      <tr>
        <td colSpan={colCount} className="text-center py-4">
          <div className="generic-table-empty">{emptyMessage}</div>
        </td>
      </tr>
    );
  } else {
    bodyRows = paginatedStatuses.map((row, pageIndex) => (
      <tr
        key={String(row.id ?? pageIndex)}
        onDoubleClick={() => onRowDoubleClick?.(row, pageIndex)}
        className={`generic-table-row ${onRowDoubleClick ? 'clickable' : ''}`}
        onDragOver={(e) => {
          if (!showReorder) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
        onDrop={(e) => {
          if (!showReorder) return;
          e.preventDefault();
          const raw = e.dataTransfer.getData('text/plain');
          const draggedId = Number(raw);
          if (!Number.isFinite(draggedId)) return;
          const fromPageIndex = paginatedStatuses.findIndex(
            (r) => r.id === draggedId,
          );
          if (fromPageIndex < 0) return;
          onReorderPageRows(fromPageIndex, pageIndex);
        }}
      >
        {isAllow && (
          <td
            className="generic-table-td"
            style={{ width: '40px' }}
            onClick={(ev) => ev.stopPropagation()}
          >
            <Form.Check
              type="checkbox"
              checked={selectedItems.includes(row.id)}
              onChange={(e) => onToggleRow(row.id, e.target.checked)}
            />
          </td>
        )}
        {showReorder && (
          <td
            className="generic-table-td"
            style={{ width: '40px', cursor: 'grab' }}
            draggable
            onClick={(ev) => ev.stopPropagation()}
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', String(row.id));
              e.dataTransfer.effectAllowed = 'move';
            }}
            title="Drag to reorder"
          >
            <GripVertical size={16} className="text-muted" aria-hidden />
            <span className="visually-hidden">Reorder</span>
          </td>
        )}
        {visibleColumns.map((col, colIdx) => (
          <td
            key={col.key}
            className="generic-table-td"
            style={{
              textAlign: col.align || 'left',
              position: colIdx === 0 ? 'relative' : undefined,
            }}
          >
            {colIdx === 0 ? (
              <button
                type="button"
                className="border-0 bg-transparent p-0 text-start w-100"
                onClick={(ev) => {
                  ev.stopPropagation();
                  onFirstColumnClick(row, pageIndex);
                }}
              >
                {col.render ? col.render(row, pageIndex) : null}
              </button>
            ) : (
              <div>{col.render ? col.render(row, pageIndex) : null}</div>
            )}
          </td>
        ))}
        {hasActions && (
          <td
            className="generic-table-td"
            style={{ textAlign: 'center', width: '120px' }}
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="d-flex gap-1 justify-content-center align-items-center">
              {actions.map((action, actionIndex) => {
                if (action.show && !action.show(row)) return null;
                const isDisabled = action.disabled?.(row);
                const buttonEl = (
                  <Button
                    key={`${action.label}-${actionIndex}`}
                    variant={action.variant || 'link'}
                    size="sm"
                    disabled={isDisabled}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      if (!isDisabled) action.onClick?.(row);
                    }}
                    className={`p-1 ${
                      isDisabled
                        ? `gt-action-disabled ${action.disabledClassName ?? ''}`
                        : action.className || ''
                    }`}
                    title={isDisabled ? undefined : action.label}
                  >
                    {action.icon || action.label}
                  </Button>
                );
                if (isDisabled && action.disabledTitle) {
                  return (
                    <span
                      key={`${action.label}-${actionIndex}-wrap`}
                      className="gt-action-disabled-wrapper"
                      title={action.disabledTitle}
                    >
                      {buttonEl}
                    </span>
                  );
                }
                return buttonEl;
              })}
            </div>
          </td>
        )}
      </tr>
    ));
  }

  return (
    <>
      <div
        className={`generic-table-responsive ${fixedHeight ? 'fixed-height-table' : ''}`}
        style={fixedHeight ? { maxHeight, overflow: 'auto' } : {}}
      >
        <Table hover className="generic-table mb-0">
          <thead className="generic-table-header">
            <tr>
              {isAllow && (
                <th className="generic-table-th" style={{ width: '40px' }}>
                  <Form.Check
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={(e) => onToggleSelectAllPage(e.target.checked)}
                  />
                </th>
              )}
              {showReorder && (
                <th className="generic-table-th" style={{ width: '40px' }}>
                  <span className="visually-hidden">Reorder</span>
                </th>
              )}
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  className={`generic-table-th ${col.sortable !== false && sortable ? 'sortable' : ''}`}
                  style={{ textAlign: col.align || 'left' }}
                  onClick={() => handleHeaderSort(col.key)}
                >
                  <div className="th-content d-flex align-items-center justify-content-between">
                    <span>{col.label}</span>
                    {col.sortable !== false &&
                      sortable &&
                      renderSortIcon(col.key)}
                  </div>
                </th>
              ))}
              {hasActions && (
                <th className="generic-table-th" style={{ textAlign: 'center' }}>
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>{bodyRows}</tbody>
        </Table>
      </div>
      <div className="p-3">{paginationControls}</div>
    </>
  );
};

const StatusesTab: React.FC<StatusesTabProps> = ({
  selectedProject,
  statuses,
  loading,
  onRefresh,
  styles,
  canManageProject,
}) => {
  const isAllow = canManageProject;

  const [showAddModal, setShowAddModal]     = useState(false);
  const [showEditModal, setShowEditModal]   = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<any>(null);
  const [formData, setFormData]             = useState(() => ({ ...DEFAULT_STATUS_FORM }));
  const [processing, setProcessing]         = useState(false);

  const {
    pagination,
    setPagination,
    searchValue,
    setSearchValue,
    selectedItems,
    setSelectedItems,
    selectedColumns,
  } = useProjectSettingsTabListState(['name', 'color']);
  const [showColumnEditor, setShowColumnEditor] = useState(false);
  const [colorFilter, setColorFilter] = useState<string | null>(null);

  // ── CRUD handlers ─────────────────────────────────────────────────────────
  const handleAddStatus = async () => {
    if (!canManageProject || !selectedProject?.id || !formData.name) return;
    try {
      setProcessing(true);
      await createStatus(selectedProject.id, {
        name: formData.name,
        color: formData.color,
        is_completed: formData.is_completed,
        is_default: formData.is_default,
      });
      setShowAddModal(false);
      setFormData({ ...DEFAULT_STATUS_FORM });
      onRefresh();
    } catch (error) {
      console.error('Error adding status:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!canManageProject || !selectedProject?.id || !selectedStatus || !formData.name) return;
    try {
      setProcessing(true);
      await updateStatus(selectedProject.id, selectedStatus.id, {
        name: formData.name,
        color: formData.color,
        is_completed: formData.is_completed,
        is_default: formData.is_default,
      });
      setShowEditModal(false);
      setSelectedStatus(null);
      setFormData({ ...DEFAULT_STATUS_FORM });
      onRefresh();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteStatus = async () => {
    if (!canManageProject || !selectedProject?.id || !selectedStatus) return;
    try {
      setProcessing(true);
      await deleteStatus(selectedProject.id, selectedStatus.id);
      setShowDeleteModal(false);
      setSelectedStatus(null);
      onRefresh();
    } catch (error) {
      console.error('Error deleting status:', error);
    } finally {
      setProcessing(false);
    }
  };

  const openEditModal = (status: any) => {
    setSelectedStatus(status);
    setFormData({
      name: status.name || '',
      color: status.color || '#4680FF',
      is_completed: status.is_completed === true,
      is_default: status.is_default === true,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (status: any) => {
    setSelectedStatus(status);
    setShowDeleteModal(true);
  };

  // ── Filtered and Paginated Data ───────────────────────────────────────────
  const filteredStatuses = useMemo(() => {
    let result = statuses;

    // Search filter
    if (searchValue.trim()) {
      const search = searchValue.toLowerCase();
      result = result.filter((s: any) => 
        (s.name || '').toLowerCase().includes(search) ||
        (s.color || '').toLowerCase().includes(search)
      );
    }

    // Color filter
    if (colorFilter) {
      result = result.filter((s: any) => (s.color || '').toLowerCase() === colorFilter.toLowerCase());
    }

    return result;
  }, [statuses, searchValue, colorFilter]);

  const sortedFilteredStatuses = useMemo(() => {
    const col = pagination.sortBy;
    if (!col) return filteredStatuses;
    const dir = pagination.sortOrder;
    return [...filteredStatuses].sort((a: any, b: any) => {
      const aVal = a[col] ?? '';
      const bVal = b[col] ?? '';
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      if (aStr < bStr) return dir === 'asc' ? -1 : 1;
      if (aStr > bStr) return dir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredStatuses, pagination.sortBy, pagination.sortOrder]);

  const paginatedStatuses = useMemo(
    () =>
      paginatedSlice(
        sortedFilteredStatuses,
        pagination.currentPage,
        pagination.rowsPerPage,
      ),
    [sortedFilteredStatuses, pagination.currentPage, pagination.rowsPerPage],
  );

  // ── Stats Cards ───────────────────────────────────────────────────────────
  const statsCardsData: StatsCardData[] = useMemo(() => {
    const totalStatuses = statuses.length;
    const activeStatuses = statuses.filter((s: any) => s.is_active !== false).length;
    const uniqueColors = new Set(statuses.map((s: any) => s.color)).size;

    return [
      {
        title: 'Total Statuses',
        value: totalStatuses,
        icon: Tag,
        iconColor: '#6366F1',
        iconBgColor: '#EEF2FF',
        subtitle: `${uniqueColors} unique colors`,
      },
      {
        title: 'Active',
        value: activeStatuses,
        icon: Tag,
        iconColor: '#10B981',
        iconBgColor: '#D1FAE5',
        metric: {
          text: 'Currently in use',
          dotColor: '#10B981',
        },
      },
      {
        title: 'Color Variations',
        value: uniqueColors,
        icon: Tag,
        iconColor: '#8B5CF6',
        iconBgColor: '#EDE9FE',
        metric: {
          text: 'Distinct colors',
          dotColor: '#8B5CF6',
        },
      },
    ];
  }, [statuses]);

  // ── Filter Pills ──────────────────────────────────────────────────────────
  const uniqueColors = useMemo(() => {
    const colors = new Set(statuses.map((s: any) => s.color).filter(Boolean));
    return Array.from(colors);
  }, [statuses]);

  const filterPills: FilterPill[] = useMemo(() => [
    {
      id: 'color',
      label: 'Color',
      icon: <Filter size={14} />,
      active: !!colorFilter,
      activeLabel: colorFilter ? colorFilter.toUpperCase() : undefined,
      onClear: () => setColorFilter(null),
      showDropdown: true,
      dropdownOptions: [
        { label: 'All Colors', value: 'all', onClick: () => setColorFilter(null) },
        ...uniqueColors.map((color: string) => ({
          label: color.toUpperCase(),
          value: color,
          onClick: () => setColorFilter(color),
        })),
      ],
    },
  ], [colorFilter, uniqueColors]);

  // Render Add Status Button (following prospects.tsx pattern)
  const renderAddStatusButton = () => (
    <div
      style={{
        position: "absolute",
        right: "19px",
        top: "170px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      {isAllow && selectedItems.length > 0 && (
        <button
          type="button"
          onClick={() => {
            // Bulk delete - open delete modal for first selected item
            const firstSelected = statuses.find((s: any) => selectedItems.includes(s.id));
            if (firstSelected) {
              setSelectedStatus(firstSelected);
              setShowDeleteModal(true);
            }
          }}
          style={{
            padding: "9px 13px",
            backgroundColor: "#dc3545",
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: "500",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#c82333";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#dc3545";
          }}
        >
          <Trash2 size={16} />
          Delete ({selectedItems.length})
        </button>
      )}
      {isAllow && (
        <button
          onClick={() => {
            setFormData({ ...DEFAULT_STATUS_FORM });
            setShowAddModal(true);
          }}
          style={{
            padding: "9px 13px",
            backgroundColor: "#000000",
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: "500",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#1a1a1a";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#000000";
          }}
        >
          <Plus size={16} />
          Add Status
        </button>
      )}
    </div>
  );

  // ── Toolbar Configuration ─────────────────────────────────────────────────
  const toolbarConfig: ToolbarConfig = useMemo(() => ({
    // Tabs (required for rightActions to render)
    showTabs: true,
    tabs: [
      {
        id: 'all',
        label: 'All Statuses',
        count: statuses.length,
        removable: false,
      },
    ],
    activeTab: 'all',
    
    showSearch: true,
    searchValue,
    searchPlaceholder: 'Search statuses...',
    onSearchChange: setSearchValue,
    onSearch: () => setPagination(prev => ({ ...prev, currentPage: 1 })),
    
    showFilterPills: true,
    filterPills,
    
    showEditColumns: true,
    onEditColumnsClick: () => setShowColumnEditor(true),
    
    showExportButton: true,
    onExportClick: () => {
      console.log('Export statuses data');
      // Implement export functionality
    },
    
    rightActions: renderAddStatusButton(),
  }), [searchValue, filterPills, isAllow, selectedItems.length, statuses.length]);

  // ── Row Interaction Handlers ──────────────────────────────────────────────
  const handleFirstColumnClick = useCallback(
    (row: any) => {
      if (!isAllow) return;
      openEditModal(row);
    },
    [isAllow],
  );

  const handleRowDoubleClick = useCallback((row: any) => {
    if (isAllow) {
      openEditModal(row);
    }
  }, [isAllow]);

  const handleStatusRowReorder = useCallback(
    async (fromPageIndex: number, toPageIndex: number) => {
      if (!canManageProject || !selectedProject?.id || fromPageIndex === toPageIndex) return;
      const offset = (pagination.currentPage - 1) * pagination.rowsPerPage;
      const fromFiltered = offset + fromPageIndex;
      const toFiltered = offset + toPageIndex;
      if (
        fromFiltered < 0 ||
        toFiltered < 0 ||
        fromFiltered >= sortedFilteredStatuses.length ||
        toFiltered >= sortedFilteredStatuses.length
      ) {
        return;
      }
      const fullOrderedIds = statuses.map((s: { id: number }) => s.id);
      const filteredIds = sortedFilteredStatuses.map((s: { id: number }) => s.id);
      const reorderedFiltered = arrayMove(filteredIds, fromFiltered, toFiltered);
      const status_ids = applyFilteredReorder(fullOrderedIds, reorderedFiltered);
      try {
        setProcessing(true);
        await reorderStatuses(selectedProject.id, { status_ids });
        onRefresh();
      } catch {
        // reorderStatuses already surfaces toast on failure
      } finally {
        setProcessing(false);
      }
    },
    [
      canManageProject,
      selectedProject?.id,
      pagination.currentPage,
      pagination.rowsPerPage,
      sortedFilteredStatuses,
      statuses,
      onRefresh,
    ],
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [searchValue, colorFilter]);

  // ── GenericTable columns ──────────────────────────────────────────────────
  const columns: TableColumn[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (row: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: row.color || '#4680FF',
            flexShrink: 0,
          }} />
          <span style={{ fontWeight: '500', color: '#1F2937' }}>{row.name}</span>
        </div>
      ),
    },
    {
      key: 'color',
      label: 'Color',
      sortable: false,
      render: (row: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '40px',
            height: '24px',
            backgroundColor: row.color || '#4680FF',
            borderRadius: '4px',
            border: '1px solid #E5E9F2',
            flexShrink: 0,
          }} />
          <span style={{ color: '#6B7280', fontSize: '0.875rem', fontFamily: 'monospace' }}>
            {row.color || '#4680FF'}
          </span>
        </div>
      ),
    },
  ];

  // ── GenericTable actions ──────────────────────────────────────────────────
  const actions: TableAction[] = isAllow ? [
    {
      label: 'Edit Status',
      icon: <Edit size={16} />,
      variant: 'link',
      className: 'text-secondary p-1',
      onClick: (row: any) => openEditModal(row),
    },
    {
      label: 'Delete Status',
      icon: <Trash2 size={16} />,
      variant: 'link',
      className: 'text-danger p-1',
      onClick: (row: any) => openDeleteModal(row),
    },
  ] : [];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Custom styles for StatusesTab to reduce column width */}
      <style>{`
        .statuses-table-wrapper .generic-table-th.sortable {
          min-width: auto !important;
        }
        .statuses-table-wrapper .generic-table-th:first-child + .generic-table-th {
          min-width: auto !important;
          width: auto !important;
        }
      `}</style>

      {/* Statuses Table with GenericTable */}
      <div
        className="statuses-table-wrapper"
        data-column-editor-open={showColumnEditor ? 'true' : undefined}
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <GenericTable
          data={paginatedStatuses}
          columns={columns.filter((c) => selectedColumns.includes(c.key))}
          actions={actions}
          showActions={false}
          selectable={false}
          customBody={
            <StatusesTableCustomBody
              paginatedStatuses={paginatedStatuses}
              visibleColumns={columns.filter((c) =>
                selectedColumns.includes(c.key),
              )}
              actions={actions}
              isAllow={isAllow}
              processing={processing}
              loading={loading}
              selectedItems={selectedItems}
              onToggleSelectAllPage={(checked) => {
                setSelectedItems(
                  checked ? paginatedStatuses.map((r: any) => r.id) : [],
                );
              }}
              onToggleRow={(id, checked) => {
                setSelectedItems((prev) =>
                  checked
                    ? [...prev, id]
                    : prev.filter((x) => x !== id),
                );
              }}
              onReorderPageRows={(fromIdx, toIdx) => {
                handleStatusRowReorder(fromIdx, toIdx).catch(() => undefined);
              }}
              sortBy={pagination.sortBy}
              sortOrder={pagination.sortOrder}
              onSort={(column, direction) => {
                setPagination((prev) => ({
                  ...prev,
                  sortBy: column,
                  sortOrder: direction,
                  currentPage: 1,
                }));
              }}
              sortable
              onFirstColumnClick={(row) => handleFirstColumnClick(row)}
              onRowDoubleClick={(row) => handleRowDoubleClick(row)}
              emptyMessage="No statuses found matching your criteria"
              loadingMessage="Loading statuses..."
              maxHeight="calc(100vh - 345px)"
              fixedHeight
              currentPage={pagination.currentPage}
              rowsPerPage={pagination.rowsPerPage}
              totalFiltered={filteredStatuses.length}
              pageSizeOptions={[10, 15, 25, 50, 100]}
              onPaginationChange={(page, rowsPerPage) => {
                setPagination({
                  ...pagination,
                  currentPage: page,
                  rowsPerPage,
                });
              }}
            />
          }
          pagination={{
            currentPage: pagination.currentPage,
            rowsPerPage: pagination.rowsPerPage,
            totalRows: filteredStatuses.length,
            pageSizeOptions: [10, 15, 25, 50, 100],
          }}
          onPaginationChange={(page, rowsPerPage) => {
            setPagination({
              ...pagination,
              currentPage: page,
              rowsPerPage,
            });
          }}
          sortable={true}
          defaultSortBy={pagination.sortBy}
          defaultSortOrder={pagination.sortOrder}
          onSort={(column, direction) => {
            setPagination((prev) => ({
              ...prev,
              sortBy: column,
              sortOrder: direction,
              currentPage: 1,
            }));
          }}
          loading={loading}
          emptyMessage="No statuses found matching your criteria"
          loadingMessage="Loading statuses..."
          hover={true}
          uniqueKey="id"
          fixedHeight={true}
          maxHeight="calc(100vh - 345px)"
          showToolbar={true}
          toolbar={toolbarConfig}
          statsCards={statsCardsData}
        />
      </div>

      {/* ── Add Status Modal ── */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Status Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter status name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Color</Form.Label>
              <StatusFormColorPicker
                color={formData.color}
                onColorChange={(next) =>
                  setFormData((prev) => ({ ...prev, color: next }))
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="add-status-is-completed"
                label="Marks this as a completed status"
                checked={formData.is_completed}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, is_completed: e.target.checked }))
                }
              />
              <Form.Text className="text-muted d-block">
                When this status is selected, the task will be marked as completed.
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="add-status-is-default"
                label="Marks this as a default status"
                checked={formData.is_default}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, is_default: e.target.checked }))
                }
              />
              <Form.Text className="text-muted d-block">
                When no other default is set, this status will be used for new tasks.
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAddStatus} disabled={processing || !formData.name}>
            {processing ? <Spinner size="sm" animation="border" /> : 'Add Status'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Edit Status Modal ── */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Status Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter status name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Color</Form.Label>
              <StatusFormColorPicker
                color={formData.color}
                onColorChange={(next) =>
                  setFormData((prev) => ({ ...prev, color: next }))
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="edit-status-is-completed"
                label="Completed status"
                checked={formData.is_completed}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, is_completed: e.target.checked }))
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="edit-status-is-default"
                label="Default status"
                checked={formData.is_default}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, is_default: e.target.checked }))
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleUpdateStatus} disabled={processing || !formData.name}>
            {processing ? <Spinner size="sm" animation="border" /> : 'Update Status'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to delete the status{' '}
            <strong>{selectedStatus?.name}</strong>? This action cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteStatus} disabled={processing}>
            {processing ? <Spinner size="sm" animation="border" /> : 'Delete Status'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default StatusesTab;
