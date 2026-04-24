import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useEffect,
  useCallback
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import { Container, Row, Col, Button, Form, Modal, Badge } from 'react-bootstrap';
import { Plus, Edit, Trash2, AlertCircle, MoreVertical } from 'lucide-react';
import { listStatuses, createStatus, updateStatus, deleteStatus } from '@utils/work-planner';
import DeleteConfirmationModal from '@pages/partial/DeleteConfirmationModal';
import GenericTable, { TableColumn, TableAction } from '@components/GenericTable';
import { PlannerColorTableCell } from '@planner/PlannerColorTableCell';
import { toast } from 'react-toastify';

interface Status {
  id: number;
  name: string;
  color: string;
  order?: number;
  is_default?: boolean;
  is_completed?: boolean;
  created_at?: string;
  updated_at?: string;
}

const WorkPlannerStatuses = () => {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#4680FF',
    order: 0,
    is_default: false,
    is_completed: false
  });
  const [processing, setProcessing] = useState(false);

  // Fetch statuses
  const fetchStatuses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await listStatuses();
      if (response && Array.isArray(response)) {
        setStatuses(response);
      } else if (response?.data && Array.isArray(response.data)) {
        setStatuses(response.data);
      } else {
        setStatuses([]);
      }
    } catch (error) {
      console.error('Error fetching statuses:', error);
      setStatuses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  // Handle create status
  const handleCreateStatus = async () => {
    if (!formData.name.trim()) {
      toast.error('Status name is required');
      return;
    }

    try {
      setProcessing(true);
      const response = await createStatus({
        name: formData.name.trim(),
        color: formData.color,
        order: formData.order,
        is_default: formData.is_default,
        is_completed: formData.is_completed
      });

      if (response) {
        setShowCreateModal(false);
        setFormData({
          name: '',
          color: '#4680FF',
          order: 0,
          is_default: false,
          is_completed: false
        });
        await fetchStatuses();
      }
    } catch (error) {
      console.error('Error creating status:', error);
    } finally {
      setProcessing(false);
    }
  };

  // Handle edit status
  const handleEditStatus = async () => {
    if (!selectedStatus || !formData.name.trim()) {
      toast.error('Status name is required');
      return;
    }

    try {
      setProcessing(true);
      const response = await updateStatus(selectedStatus.id, {
        name: formData.name.trim(),
        color: formData.color,
        order: formData.order,
        is_default: formData.is_default,
        is_completed: formData.is_completed
      });

      if (response) {
        setShowEditModal(false);
        setSelectedStatus(null);
        setFormData({
          name: '',
          color: '#4680FF',
          order: 0,
          is_default: false,
          is_completed: false
        });
        await fetchStatuses();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setProcessing(false);
    }
  };

  // Handle delete status
  const handleDeleteStatus = async () => {
    if (!selectedStatus) return;

    try {
      setProcessing(true);
      const response = await deleteStatus(selectedStatus.id);

      if (response) {
        setShowDeleteModal(false);
        setSelectedStatus(null);
        await fetchStatuses();
      }
    } catch (error) {
      console.error('Error deleting status:', error);
    } finally {
      setProcessing(false);
    }
  };

  // Open edit modal
  const openEditModal = (status: Status) => {
    setSelectedStatus(status);
    setFormData({
      name: status.name || '',
      color: status.color || '#4680FF',
      order: status.order || 0,
      is_default: status.is_default || false,
      is_completed: status.is_completed || false
    });
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = (status: Status) => {
    setSelectedStatus(status);
    setShowDeleteModal(true);
  };

  // Predefined colors
  const predefinedColors = [
    '#4680FF', '#2CA87F', '#FFB64D', '#DC2626', '#9E9E9E',
    '#667EEA', '#F56565', '#48BB78', '#ED8936', '#4FC3F7',
    '#A855F7', '#EC4899', '#14B8A6', '#F59E0B', '#EF4444'
  ];

  const statusColumns: TableColumn<Status>[] = [
    { key: 'name', label: 'Name', sortable: true, accessor: (row) => row.name, render: (row) => <span className="fw-semibold">{row.name}</span> },
    {
      key: 'color',
      label: 'Color',
      sortable: true,
      accessor: (row) => row.color,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <PlannerColorTableCell color={row.color} variant="barWide" />
        </div>
      ),
    },
    { key: 'order', label: 'Order', sortable: true, accessor: (row) => row.order ?? 0 },
    { key: 'is_default', label: 'Default', sortable: true, accessor: (row) => row.is_default, render: (row) => (
      row.is_default ? <Badge bg="success">Yes</Badge> : <Badge bg="secondary">No</Badge>
    ) },
    { key: 'is_completed', label: 'Completed', sortable: true, accessor: (row) => row.is_completed, render: (row) => (
      row.is_completed ? <Badge bg="success">Yes</Badge> : <Badge bg="secondary">No</Badge>
    ) },
  ];

  const statusActions: TableAction<Status>[] = [
    {
      label: 'Actions',
      icon: <MoreVertical size={16} />,
      dropdown: {
        options: [
          { label: 'Edit', icon: <Edit size={14} />, onClick: (row) => openEditModal(row) },
          { label: 'Delete', icon: <Trash2 size={14} />, onClick: (row) => openDeleteModal(row), className: 'text-danger', divider: true },
        ],
        align: 'end',
      },
    },
  ];

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Work Planner Statuses" />

      {/* <PageHeader
        title="Work Planner Statuses"
        showSearch={false}
      /> */}

<div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
        <div className="mb-3 mb-md-0">
  {/* <nav aria-label="breadcrumb">
    <ol className="breadcrumb mb-0">
      <li className="breadcrumb-item">
        <a href="/dashboard" className="text-decoration-none">
          Work Planner
        </a>
      </li>
      <li className="breadcrumb-item active fw-bold" aria-current="page">
      Statuses
      </li>
    </ol>
  </nav> */}
</div>
<div className="d-flex flex-wrap gap-2">
<Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              className="d-flex align-items-center gap-2"
            >
              <Plus size={16} />
              Add Status
            </Button>
        </div>
</div>

      <Container fluid className="py-4">
        {/* <Row className="d-flex justify-content-between align-items-center mb-3">
          <Col xs="auto">
            <h5 className="mb-0 fw-bold">Statuses</h5>
          </Col>
          <Col xs="auto">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="d-flex align-items-center gap-2"
            >
              <Plus size={16} />
              Add Status
            </Button>
          </Col>
        </Row> */}
        <Row>
          <Col>
            
                <GenericTable<Status>
                  data={statuses}
                  columns={statusColumns}
                  actions={statusActions}
                  showActions={true}
                  actionsLabel="Actions"
                  sortable={true}
                  loading={loading}
                  emptyMessage={
                    <div className="text-center py-5">
                      <AlertCircle size={48} className="text-muted mb-3" />
                      <p className="text-muted">No statuses found</p>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setShowCreateModal(true)}
                        className="mt-3"
                      >
                        <Plus size={16} className="me-2" />
                        Create First Status
                      </Button>
                    </div>
                  }
                  loadingMessage="Loading statuses..."
                  hover={true}
                  uniqueKey="id"
                  customizableColumns={true}
                  columnStorageKey="planner-status-columns"
                />
             
          </Col>
        </Row>
      </Container>

      {/* Create Status Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter status name"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Color</Form.Label>
              <div className="d-flex gap-2 flex-wrap mb-2">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: color,
                      border: formData.color === color ? '3px solid #000' : '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    title={color}
                  />
                ))}
              </div>
              <Form.Control
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Order</Form.Label>
              <Form.Control
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: Number.parseInt(e.target.value, 10) || 0 })}
                min="0"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Is Default"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Is Completed"
                checked={formData.is_completed}
                onChange={(e) => setFormData({ ...formData, is_completed: e.target.checked })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreateStatus} disabled={processing}>
            {processing ? 'Creating...' : 'Create'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Status Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter status name"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Color</Form.Label>
              <div className="d-flex gap-2 flex-wrap mb-2">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: color,
                      border: formData.color === color ? '3px solid #000' : '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    title={color}
                  />
                ))}
              </div>
              <Form.Control
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Order</Form.Label>
              <Form.Control
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: Number.parseInt(e.target.value, 10) || 0 })}
                min="0"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Is Default"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Is Completed"
                checked={formData.is_completed}
                onChange={(e) => setFormData({ ...formData, is_completed: e.target.checked })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleEditStatus} disabled={processing}>
            {processing ? 'Updating...' : 'Update'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setSelectedStatus(null);
        }}
        onConfirm={handleDeleteStatus}
        itemName={selectedStatus?.name}
        itemType="status"
        loading={processing}
      />
    </React.Fragment>
  );
};

WorkPlannerStatuses.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default WorkPlannerStatuses;
