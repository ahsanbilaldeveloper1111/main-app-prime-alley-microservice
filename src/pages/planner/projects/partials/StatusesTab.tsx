import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Spinner, Button, Modal, Form } from 'react-bootstrap';
import { Plus, Trash2, Edit, AlertCircle, Filter, Tag } from 'lucide-react';
import { createStatus, updateStatus, deleteStatus } from '@utils/tasks';
import { canManage } from '@utils/work-planner';
import { useSession } from 'next-auth/react';
import GenericTable, { TableColumn, TableAction, ToolbarConfig, FilterPill } from '@components/GenericTable';
import { StatsCardData } from '@components/GenericStatsCards';

interface StatusesTabProps {
  selectedProject: any;
  statuses: any[];
  loading: boolean;
  onRefresh: () => void;
  styles: any;
}

const predefinedColors = [
  '#4680FF', '#2CA87F', '#FFB64D', '#DC2626', '#9E9E9E',
  '#667EEA', '#F56565', '#48BB78', '#ED8936', '#4FC3F7',
];

const StatusesTab: React.FC<StatusesTabProps> = ({
  selectedProject,
  statuses,
  loading,
  onRefresh,
  styles,
}) => {
  const { data: session } = useSession();
  const isAllow = useMemo(() => canManage(statuses, selectedProject, session), [statuses, selectedProject, session]);

  const [showAddModal, setShowAddModal]     = useState(false);
  const [showEditModal, setShowEditModal]   = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<any>(null);
  const [formData, setFormData]             = useState({ name: '', color: '#4680FF' });
  const [processing, setProcessing]         = useState(false);

  // Pagination and search states
  const [pagination, setPagination] = useState({
    currentPage: 1,
    rowsPerPage: 15,
    sortColumn: '',
    sortDirection: 'asc' as 'asc' | 'desc',
  });
  const [searchValue, setSearchValue] = useState('');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [clearSelectedRows, setClearSelectedRows] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(['name', 'color']);
  const [showColumnEditor, setShowColumnEditor] = useState(false);
  const [colorFilter, setColorFilter] = useState<string | null>(null);

  // ── CRUD handlers ─────────────────────────────────────────────────────────
  const handleAddStatus = async () => {
    if (!selectedProject?.id || !formData.name) return;
    try {
      setProcessing(true);
      await createStatus(selectedProject.id, { name: formData.name, color: formData.color } as any);
      setShowAddModal(false);
      setFormData({ name: '', color: '#4680FF' });
      onRefresh();
    } catch (error) {
      console.error('Error adding status:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedProject?.id || !selectedStatus || !formData.name) return;
    try {
      setProcessing(true);
      await updateStatus(selectedProject.id, selectedStatus.id, { name: formData.name, color: formData.color } as any);
      setShowEditModal(false);
      setSelectedStatus(null);
      setFormData({ name: '', color: '#4680FF' });
      onRefresh();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteStatus = async () => {
    if (!selectedProject?.id || !selectedStatus) return;
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
    setFormData({ name: status.name || '', color: status.color || '#4680FF' });
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

  const paginatedStatuses = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.rowsPerPage;
    const end = start + pagination.rowsPerPage;
    return filteredStatuses.slice(start, end);
  }, [filteredStatuses, pagination.currentPage, pagination.rowsPerPage]);

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
          onClick={() => setShowAddModal(true)}
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
  const handleFirstColumnClick = useCallback((row: any) => {
    openEditModal(row);
  }, []);

  const handleRowDoubleClick = useCallback((row: any) => {
    if (isAllow) {
      openEditModal(row);
    }
  }, [isAllow]);

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

  // ── Color picker shared UI ────────────────────────────────────────────────
  const ColorPicker = () => (
    <>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        {predefinedColors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, color }))}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: color,
              border: formData.color === color ? '3px solid #1F2937' : '2px solid #E5E9F2',
              cursor: 'pointer',
              padding: 0,
            }}
          />
        ))}
      </div>
      <Form.Control
        type="color"
        value={formData.color}
        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
        style={{ width: '100%', height: '40px' }}
      />
    </>
  );

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
          showActions={isAllow && actions.length > 0}
          actionsLabel="Actions"
          
          // Selection
          selectable={isAllow}
          selectedRows={paginatedStatuses.filter((item) =>
            selectedItems.includes(item.id)
          )}
          onSelectionChange={(selected) => {
            setSelectedItems(selected.map((item) => item.id));
            setClearSelectedRows(false);
          }}
          
          // Pagination
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
          
          // Sorting
          sortable={true}
          defaultSortColumn={pagination.sortColumn}
          defaultSortDirection={pagination.sortDirection}
          onSort={(column, direction) => {
            setPagination((prev) => ({
              ...prev,
              sortColumn: column,
              sortDirection: direction,
              currentPage: 1,
            }));
          }}
          
          // Row interactions
          onFirstColumnClick={(row) => handleFirstColumnClick(row)}
          onRowDoubleClick={(row) => handleRowDoubleClick(row)}
          
          // Loading & styling
          loading={loading}
          emptyMessage="No statuses found matching your criteria"
          loadingMessage="Loading statuses..."
          hover={true}
          uniqueKey="id"
          
          // Fixed height mode
          fixedHeight={true}
          maxHeight="calc(100vh - 345px)"
          
          // Toolbar
          showToolbar={true}
          toolbar={toolbarConfig}
          
          // Stats cards for metrics
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
              <ColorPicker />
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
              <ColorPicker />
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
