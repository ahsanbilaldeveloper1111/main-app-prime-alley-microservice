import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useProjectSettingsTabListState } from '@hooks/useProjectSettingsTabListState';
import { paginatedSlice } from '@utils/paginatedSlice';
import { Spinner, Button, Modal, Form } from 'react-bootstrap';
import { Plus, Trash2, Edit, Tag } from 'lucide-react';
import { createProjectLabel, updateProjectLabel, deleteProjectLabel } from '@utils/tasks';
import GenericTable, { TableColumn, TableAction, ToolbarConfig, FilterPill } from '@components/GenericTable';
import type { StatsCardData } from '@components/GenericStatsCards';

interface LabelsTabProps {
  selectedProject: any;
  labels: any[];
  loading: boolean;
  onRefresh: () => void;
  styles: any;
  canManageProject: boolean;
}

function resolveLabelTaskCount(label: any): number {
  const raw =
    label?.tasks_count ??
    label?.task_count ??
    label?.tasksCount ??
    label?.pivot?.task_count;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw;
  }
  if (typeof raw === 'string') {
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

const LabelsTab: React.FC<LabelsTabProps> = ({
  selectedProject,
  labels,
  loading,
  onRefresh,
  styles: _styles,
  canManageProject,
}) => {
  const isAllow = canManageProject;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', color: '#4680FF' });
  const [processing, setProcessing] = useState(false);

  const {
    pagination,
    setPagination,
    searchValue,
    setSearchValue,
    selectedItems,
    setSelectedItems,
    selectedColumns,
  } = useProjectSettingsTabListState(['name', 'color', 'tasks']);
  const [colorFilter, setColorFilter] = useState<string | null>(null);

  // ── CRUD handlers ─────────────────────────────────────────────────────────
  const handleAddLabel = async () => {
    if (!canManageProject || !selectedProject?.id || !formData.name) return;
    
    try {
      setProcessing(true);
      await createProjectLabel(selectedProject.id, {
        name: formData.name,
        color: formData.color
      });
      setShowAddModal(false);
      setFormData({ name: '', color: '#4680FF' });
      onRefresh();
    } catch (error) {
      console.error('Error adding label:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateLabel = async () => {
    if (!canManageProject || !selectedProject?.id || !selectedLabel || !formData.name) return;
    
    try {
      setProcessing(true);
      await updateProjectLabel(selectedProject.id, selectedLabel.id, {
        name: formData.name,
        color: formData.color
      });
      setShowEditModal(false);
      setSelectedLabel(null);
      setFormData({ name: '', color: '#4680FF' });
      onRefresh();
    } catch (error) {
      console.error('Error updating label:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteLabel = async () => {
    if (!canManageProject || !selectedProject?.id || !selectedLabel) return;
    
    try {
      setProcessing(true);
      await deleteProjectLabel(selectedProject.id, selectedLabel.id);
      setShowDeleteModal(false);
      setSelectedLabel(null);
      onRefresh();
    } catch (error) {
      console.error('Error deleting label:', error);
    } finally {
      setProcessing(false);
    }
  };

  const openEditModal = useCallback((label: any) => {
    setSelectedLabel(label);
    setFormData({ name: label.name || '', color: label.color || '#4680FF' });
    setShowEditModal(true);
  }, []);

  const openDeleteModal = useCallback((label: any) => {
    setSelectedLabel(label);
    setShowDeleteModal(true);
  }, []);

  const predefinedColors = [
    '#4680FF', '#2CA87F', '#FFB64D', '#DC2626', '#9E9E9E',
    '#667EEA', '#F56565', '#48BB78', '#ED8936', '#4FC3F7',
    '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'
  ];

  // ── Enrich labels with task count (from API fields when present) ─────────
  const enrichedLabels = useMemo(
    () =>
      labels.map((label) => ({
        ...label,
        _taskCount: resolveLabelTaskCount(label),
      })),
    [labels],
  );

  // ── GenericTable columns ──────────────────────────────────────────────────
  const columns: TableColumn[] = [
    {
      key: 'name',
      label: 'Label Name',
      sortable: true,
      render: (row: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '4px',
            backgroundColor: row.color || '#4680FF',
            flexShrink: 0,
            border: '1px solid rgba(0,0,0,0.1)',
          }}></div>
          <div>
            <div style={{ fontWeight: '500', color: '#1F2937' }}>{row.name}</div>
            {row.description && (
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{row.description}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'color',
      label: 'Color',
      sortable: true,
      render: (row: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            backgroundColor: row.color || '#4680FF',
            border: '2px solid #E5E9F2',
            flexShrink: 0,
          }}></div>
          <span style={{ 
            color: '#6B7280', 
            fontFamily: 'monospace', 
            fontSize: '0.8rem',
            textTransform: 'uppercase',
          }}>
            {row.color || '#4680FF'}
          </span>
        </div>
      ),
    },
    {
      key: 'tasks',
      label: 'Tasks',
      sortable: true,
      render: (row: any) => (
        <span style={{
          padding: '0.25rem 0.75rem',
          backgroundColor: '#F3F4F6',
          color: '#4B5563',
          borderRadius: '6px',
          fontSize: '0.75rem',
          fontWeight: '600',
          display: 'inline-block',
        }}>
          {row._taskCount || 0} tasks
        </span>
      ),
    },
  ];

  // ── GenericTable actions ──────────────────────────────────────────────────
  const actions: TableAction[] = isAllow ? [
    {
      label: 'Edit Label',
      icon: <Edit size={16} />,
      variant: 'link',
      className: 'text-secondary p-1',
      onClick: (row: any) => {
        openEditModal(row);
      },
    },
    {
      label: 'Delete Label',
      icon: <Trash2 size={16} />,
      variant: 'link',
      className: 'text-danger p-1',
      onClick: (row: any) => {
        openDeleteModal(row);
      },
    },
  ] : [];

  // ── Filtered and Paginated Data ───────────────────────────────────────────
  const filteredLabels = useMemo(() => {
    let result = enrichedLabels;

    // Search filter
    if (searchValue.trim()) {
      const search = searchValue.toLowerCase();
      result = result.filter((label: any) => 
        (label.name || '').toLowerCase().includes(search) ||
        (label.color || '').toLowerCase().includes(search) ||
        (label.description || '').toLowerCase().includes(search)
      );
    }

    // Color filter
    if (colorFilter) {
      result = result.filter((label: any) => label.color === colorFilter);
    }

    return result;
  }, [enrichedLabels, searchValue, colorFilter]);

  const paginatedLabels = useMemo(
    () =>
      paginatedSlice(
        filteredLabels,
        pagination.currentPage,
        pagination.rowsPerPage,
      ),
    [filteredLabels, pagination.currentPage, pagination.rowsPerPage],
  );

  // ── Stats Cards ───────────────────────────────────────────────────────────
  const statsCardsData: StatsCardData[] = useMemo(() => {
    const totalLabels = labels.length;
    const uniqueColors = new Set(labels.map((l: any) => l.color || '#4680FF')).size;
    const totalTasks = labels.reduce((sum: number, l: any) => sum + resolveLabelTaskCount(l), 0);

    return [
      {
        title: 'Total Labels',
        value: totalLabels,
        icon: Tag,
        iconColor: '#6366F1',
        iconBgColor: '#EEF2FF',
        subtitle: `${uniqueColors} unique colors · ${totalTasks} task uses`,
      },
      {
        title: 'Active Labels',
        value: labels.filter((l: any) => resolveLabelTaskCount(l) > 0).length,
        icon: Tag,
        iconColor: '#10B981',
        iconBgColor: '#D1FAE5',
        metric: {
          text: 'Used in tasks',
          dotColor: '#10B981',
        },
      },
      {
        title: 'Color Variations',
        value: uniqueColors,
        icon: Tag,
        iconColor: '#F59E0B',
        iconBgColor: '#FEF3C7',
        metric: {
          text: 'Unique colors',
          dotColor: '#F59E0B',
        },
      },
    ];
  }, [labels]);

  // ── Filter Pills ──────────────────────────────────────────────────────────
  const uniqueColors = useMemo(() => {
    return Array.from(new Set(labels.map((l: any) => l.color || '#4680FF')));
  }, [labels]);

  const filterPills: FilterPill[] = useMemo(() => [
    {
      id: 'color',
      label: 'Color',
      icon: <Tag size={14} />,
      active: !!colorFilter,
      activeLabel: colorFilter || undefined,
      onClear: () => setColorFilter(null),
      showDropdown: true,
      dropdownOptions: [
        { label: 'All Colors', value: 'all', onClick: () => setColorFilter(null) },
        ...uniqueColors.map((color: string) => ({
          label: color,
          value: color,
          onClick: () => setColorFilter(color),
        })),
      ],
    },
  ], [colorFilter, uniqueColors]);

  // Render Add Label Button (following MembersTab pattern)
  const renderAddLabelButton = () => (
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
            // Bulk delete functionality
            const firstSelected = labels.find((l: any) => l.id === selectedItems[0]);
            if (firstSelected) {
              setSelectedLabel(firstSelected);
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
          Add Label
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
        label: 'All Labels',
        count: labels.length,
        removable: false,
      },
    ],
    activeTab: 'all',
    
    showSearch: true,
    searchValue,
    searchPlaceholder: 'Search labels...',
    onSearchChange: setSearchValue,
    onSearch: () => setPagination(prev => ({ ...prev, currentPage: 1 })),
    
    showFilterPills: true,
    filterPills,
    
    showEditColumns: false,
    
    showExportButton: true,
    onExportClick: () => {
      console.log('Export labels data');
      // Implement export functionality
    },
    
    rightActions: renderAddLabelButton(),
  }), [searchValue, filterPills, isAllow, selectedItems.length, labels.length]);

  // ── Row Interaction Handlers ──────────────────────────────────────────────
  const handleFirstColumnClick = useCallback(
    (row: any) => {
      if (!isAllow) {
        return;
      }
      openEditModal(row);
    },
    [isAllow, openEditModal],
  );

  const handleRowDoubleClick = useCallback(
    (row: any) => {
      if (!isAllow) {
        return;
      }
      openEditModal(row);
    },
    [isAllow, openEditModal],
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [searchValue, colorFilter]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Labels Table with GenericTable */}
      <div
        className="labels-table-wrapper"
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <GenericTable
          data={paginatedLabels}
          columns={columns.filter((c) => selectedColumns.includes(c.key))}
          actions={actions}
          showActions={isAllow && actions.length > 0}
          actionsLabel="Actions"
          
          // Selection
          selectable={isAllow}
          selectedRows={paginatedLabels.filter((item) =>
            selectedItems.includes(item.id)
          )}
          onSelectionChange={(selected) => {
            setSelectedItems(selected.map((item) => item.id));
          }}
          
          // Pagination
          pagination={{
            currentPage: pagination.currentPage,
            rowsPerPage: pagination.rowsPerPage,
            totalRows: filteredLabels.length,
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
          
          // Row interactions
          onFirstColumnClick={(row) => handleFirstColumnClick(row)}
          onRowDoubleClick={(row) => handleRowDoubleClick(row)}
          
          // Loading & styling
          loading={loading}
          emptyMessage="No labels found matching your criteria"
          loadingMessage="Loading labels..."
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

      {/* ── Add Label Modal ── */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Label</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Label Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter label name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Color</Form.Label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      backgroundColor: color,
                      border: formData.color === color ? '3px solid #1F2937' : '2px solid #E5E9F2',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  />
                ))}
              </div>
              <Form.Control
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                style={{ width: '100%', height: '40px' }}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddLabel}
            disabled={processing || !formData.name}
          >
            {processing ? <Spinner size="sm" animation="border" /> : 'Add Label'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Edit Label Modal ── */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Label</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Label Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter label name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Color</Form.Label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      backgroundColor: color,
                      border: formData.color === color ? '3px solid #1F2937' : '2px solid #E5E9F2',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  />
                ))}
              </div>
              <Form.Control
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                style={{ width: '100%', height: '40px' }}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleUpdateLabel}
            disabled={processing || !formData.name}
          >
            {processing ? <Spinner size="sm" animation="border" /> : 'Update Label'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Label</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to delete the label{' '}
            <strong>{selectedLabel?.name}</strong>? This action cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteLabel}
            disabled={processing}
          >
            {processing ? <Spinner size="sm" animation="border" /> : 'Delete Label'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default LabelsTab;
