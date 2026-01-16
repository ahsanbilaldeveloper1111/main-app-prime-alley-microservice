import React, { useState } from 'react';
import { Spinner, Button, Modal, Form } from 'react-bootstrap';
import { Plus, Trash2, Edit, Tag } from 'lucide-react';
import { createLabel, updateLabel, deleteLabel } from '@utils/tasks';

interface LabelsTabProps {
  selectedProject: any;
  labels: any[];
  loading: boolean;
  onRefresh: () => void;
  styles: any;
}

const LabelsTab: React.FC<LabelsTabProps> = ({
  selectedProject,
  labels,
  loading,
  onRefresh,
  styles
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', color: '#4680FF' });
  const [processing, setProcessing] = useState(false);

  const handleAddLabel = async () => {
    if (!selectedProject?.id || !formData.name) return;
    
    try {
      setProcessing(true);
      await createLabel(selectedProject.id, {
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
    if (!selectedProject?.id || !selectedLabel || !formData.name) return;
    
    try {
      setProcessing(true);
      await updateLabel(selectedProject.id, selectedLabel.id, {
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
    if (!selectedProject?.id || !selectedLabel) return;
    
    try {
      setProcessing(true);
      await deleteLabel(selectedProject.id, selectedLabel.id);
      setShowDeleteModal(false);
      setSelectedLabel(null);
      onRefresh();
    } catch (error) {
      console.error('Error deleting label:', error);
    } finally {
      setProcessing(false);
    }
  };

  const openEditModal = (label: any) => {
    setSelectedLabel(label);
    setFormData({ name: label.name || '', color: label.color || '#4680FF' });
    setShowEditModal(true);
  };

  const openDeleteModal = (label: any) => {
    setSelectedLabel(label);
    setShowDeleteModal(true);
  };

  const predefinedColors = [
    '#4680FF', '#2CA87F', '#FFB64D', '#DC2626', '#9E9E9E',
    '#667EEA', '#F56565', '#48BB78', '#ED8936', '#4FC3F7',
    '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'
  ];

  return (
    <>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h5 style={styles.cardTitle}>Project Labels</h5>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={16} />
            Add Label
          </Button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <Spinner animation="border" />
          </div>
        ) : labels.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
            <Tag size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '500' }}>No labels found</p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', opacity: 0.7 }}>Add labels to categorize your project tasks</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
            {labels.map((label: any, index: number) => (
              <div
                key={label.id || index}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E9F2',
                  borderRadius: '8px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#4680FF';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#E5E9F2';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    backgroundColor: label.color || '#4680FF',
                    flexShrink: 0
                  }}></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500', color: '#1F2937', fontSize: '0.9rem' }}>
                      {label.name}
                    </div>
                    {label.description && (
                      <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
                        {label.description}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                  <button
                    onClick={() => openEditModal(label)}
                    style={{
                      padding: '0.375rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      color: '#6B7280'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#F3F4F6';
                      e.currentTarget.style.color = '#4680FF';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#6B7280';
                    }}
                    title="Edit Label"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => openDeleteModal(label)}
                    style={{
                      padding: '0.375rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      color: '#6B7280'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#FEE2E2';
                      e.currentTarget.style.color = '#DC2626';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#6B7280';
                    }}
                    title="Delete Label"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Label Modal */}
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

      {/* Edit Label Modal */}
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

      {/* Delete Confirmation Modal */}
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
