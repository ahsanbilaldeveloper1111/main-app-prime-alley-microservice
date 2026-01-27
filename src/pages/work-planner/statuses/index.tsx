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
import PageHeader from "@components/PageHeader";
import { Container, Row, Col, Card, Table, Button, Form, Modal, Badge, Spinner } from 'react-bootstrap';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { listStatuses, createStatus, updateStatus, deleteStatus } from '@utils/work-planner';
import DeleteConfirmationModal from '@pages/partial/DeleteConfirmationModal';
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

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Work Planner Statuses" />

      <PageHeader
        title="Work Planner Statuses"
        showSearch={false}
      />

      <Container fluid className="py-4">
        <Row>
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">Statuses</h5>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowCreateModal(true)}
                  className="d-flex align-items-center gap-2"
                >
                  <Plus size={16} />
                  Add Status
                </Button>
              </Card.Header>
              <Card.Body>
                {loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3 text-muted">Loading statuses...</p>
                  </div>
                ) : statuses.length === 0 ? (
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
                ) : (
                  <Table hover responsive>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Color</th>
                        <th>Order</th>
                        <th>Default</th>
                        <th>Completed</th>
                        <th style={{ width: '150px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statuses.map((status) => (
                        <tr key={status.id}>
                          <td className="fw-semibold">{status.name}</td>
                          <td>
                            <Badge
                              style={{
                                backgroundColor: status.color,
                                color: '#fff',
                                padding: '6px 12px',
                                borderRadius: '4px'
                              }}
                            >
                              {status.color}
                            </Badge>
                          </td>
                          <td>{status.order || 0}</td>
                          <td>
                            {status.is_default ? (
                              <Badge bg="success">Yes</Badge>
                            ) : (
                              <Badge bg="secondary">No</Badge>
                            )}
                          </td>
                          <td>
                            {status.is_completed ? (
                              <Badge bg="success">Yes</Badge>
                            ) : (
                              <Badge bg="secondary">No</Badge>
                            )}
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <Button
                                variant="link"
                                size="sm"
                                className="p-1"
                                onClick={() => openEditModal(status)}
                                title="Edit"
                              >
                                <Edit size={16} />
                              </Button>
                              <Button
                                variant="link"
                                size="sm"
                                className="p-1 text-danger"
                                onClick={() => openDeleteModal(status)}
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
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
