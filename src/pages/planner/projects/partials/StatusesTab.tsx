import React, { useMemo, useState } from 'react';
import { Spinner, Button, Modal, Form } from 'react-bootstrap';
import { Plus, Trash2, Edit, AlertCircle } from 'lucide-react';
import { createStatus, updateStatus, deleteStatus } from '@utils/tasks';
import { canManage } from '@utils/work-planner';
import { useSession } from 'next-auth/react';
import GenericTable, { TableColumn, TableAction } from '@components/GenericTable';

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
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h5 style={styles.cardTitle}>Project Statuses</h5>
        {isAllow && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={16} />
            Add Status
          </Button>
        )}
      </div>

      {/* Empty state */}
      {!loading && statuses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
          <AlertCircle size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '500' }}>No statuses found</p>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', opacity: 0.7 }}>
            Add statuses to organize your project tasks
          </p>
        </div>
      ) : (
        <GenericTable
          data={statuses}
          columns={columns}
          actions={actions}
          showActions={isAllow && actions.length > 0}
          actionsLabel="Actions"
          uniqueKey="id"
          loading={loading}
          loadingMessage="Loading statuses..."
          emptyMessage="No statuses found"
          hover={true}
          sortable={true}
          fixedHeight={false}
          showToolbar={false}
          showToolbarActions={false}
        />
      )}

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
