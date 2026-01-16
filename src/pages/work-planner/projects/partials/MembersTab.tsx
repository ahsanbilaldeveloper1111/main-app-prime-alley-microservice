import React, { useState, useMemo } from 'react';
import { Spinner, Button, Modal, Form } from 'react-bootstrap';
import Select from 'react-select';
import { UserPlus, Trash2, Edit, Users } from 'lucide-react';
import { addMember, updateMemberRole, removeMember } from '@utils/tasks';

interface MembersTabProps {
  selectedProject: any;
  members: any[];
  loading: boolean;
  onRefresh: () => void;
  styles: any;
  hierarchyDataExtensions: any[];
}

const MembersTab: React.FC<MembersTabProps> = ({
  selectedProject,
  members,
  loading,
  onRefresh,
  styles,
  hierarchyDataExtensions
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [formData, setFormData] = useState({ extension_number: '', role: 'member' });
  const [processing, setProcessing] = useState(false);

  const handleAddMember = async () => {
    if (!selectedProject?.id || !formData.extension_number) return;
    
    try {
      setProcessing(true);
      await addMember(selectedProject.id, {
        extension_number: formData.extension_number,
        role: formData.role
      } as any);
      setShowAddModal(false);
      setFormData({ extension_number: '', role: 'member' });
      onRefresh();
    } catch (error) {
      console.error('Error adding member:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedProject?.id || !selectedMember || !formData.role) return;
    
    try {
      setProcessing(true);
      await updateMemberRole(selectedProject.id, selectedMember.extension_number, {
        role: formData.role
      });
      setShowEditModal(false);
      setSelectedMember(null);
      setFormData({ extension_number: '', role: 'member' });
      onRefresh();
    } catch (error) {
      console.error('Error updating member role:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedProject?.id || !selectedMember) return;
    
    try {
      setProcessing(true);
      await removeMember(selectedProject.id, selectedMember.extension_number);
      setShowDeleteModal(false);
      setSelectedMember(null);
      onRefresh();
    } catch (error) {
      console.error('Error removing member:', error);
    } finally {
      setProcessing(false);
    }
  };

  const openEditModal = (member: any) => {
    setSelectedMember(member);
    setFormData({ extension_number: member.extension_number, role: member.role || 'member' });
    setShowEditModal(true);
  };

  const openDeleteModal = (member: any) => {
    setSelectedMember(member);
    setShowDeleteModal(true);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'owner':
        return { bg: '#FEE2E2', color: '#991B1B' };
      case 'admin':
        return { bg: '#FEF3C7', color: '#92400E' };
      case 'manager':
        return { bg: '#DBEAFE', color: '#1E40AF' };
      default:
        return { bg: '#E5E7EB', color: '#4B5563' };
    }
  };

  // Prepare options for react-select
  const extensionOptions = useMemo(() => {
    return hierarchyDataExtensions
      .filter((ext: any) => !members.some((m: any) => m.extension_number === ext.extension_number))
      .map((ext: any) => ({
        value: ext.extension_number,
        label: ext.user?.name || ext.name || ext.extension_number || 'Unknown'
      }));
  }, [hierarchyDataExtensions, members]);

  // Get selected option for react-select
  const selectedExtensionOption = useMemo(() => {
    if (!formData.extension_number || extensionOptions.length === 0) return null;
    const found = extensionOptions.find((opt: { value: string; label: string }) => {
      // Handle both string and number comparisons
      return String(opt.value) === String(formData.extension_number);
    });
    return found || null;
  }, [formData.extension_number, extensionOptions]);

  return (
    <>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h5 style={styles.cardTitle}>Project Members</h5>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <UserPlus size={16} />
            Add Member
          </Button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <Spinner animation="border" />
          </div>
        ) : members.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
            <Users size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '500' }}>No members found</p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', opacity: 0.7 }}>Add members to collaborate on this project</p>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Member</th>
                  <th style={styles.th}>Extension</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member: any, index: number) => {
                  const userName = member.user?.name || member.user?.display_name || member.extension_number || 'Unknown';
                  const initials = getInitials(userName);
                  const colors = ['#48bb78', '#f56565', '#4299e1', '#ed64a6', '#667eea', '#9f7aea', '#fc8181', '#ed8936'];
                  const color = colors[index % colors.length];
                  const roleColors = getRoleColor(member.role);

                  return (
                    <tr 
                      key={member.id || member.extension_number || index}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: color,
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            flexShrink: 0
                          }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: '500', color: '#1F2937' }}>{userName}</div>
                            {member.user?.email && (
                              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{member.user.email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={{ color: '#4B5563', fontFamily: 'monospace' }}>
                          {member.extension_number}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          backgroundColor: roleColors.bg,
                          color: roleColors.color,
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          display: 'inline-block',
                          textTransform: 'capitalize'
                        }}>
                          {member.role || 'Member'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button
                            onClick={() => openEditModal(member)}
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
                            title="Edit Role"
                          >
                            <Edit size={16} />
                          </button>
                          {member.role?.toLowerCase() !== 'owner' && (
                            <button
                              onClick={() => openDeleteModal(member)}
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
                              title="Remove Member"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Member</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Extension Number</Form.Label>
              <Select
                value={selectedExtensionOption}
                onChange={(selectedOption: any) => {
                  setFormData((prev) => ({ 
                    ...prev, 
                    extension_number: selectedOption?.value || '' 
                  }));
                }}
                options={extensionOptions}
                placeholder="Select Extension"
                isClearable
                isSearchable
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                menuPosition="fixed"
                className="react-select-container"
                classNamePrefix="react-select"
                styles={{
                  control: (base: any, state: any) => ({
                    ...base,
                    minHeight: '38px',
                    borderColor: state.isFocused ? '#4680FF' : '#E5E9F2',
                    boxShadow: state.isFocused ? '0 0 0 1px #4680FF' : 'none',
                    '&:hover': {
                      borderColor: '#4680FF'
                    }
                  }),
                  placeholder: (base: any) => ({
                    ...base,
                    color: '#9CA3AF'
                  }),
                  singleValue: (base: any) => ({
                    ...base,
                    color: '#1F2937',
                    fontWeight: '500'
                  }),
                  input: (base: any) => ({
                    ...base,
                    color: '#1F2937'
                  }),
                  menuPortal: (base: any) => ({
                    ...base,
                    zIndex: 9999
                  })
                }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddMember}
            disabled={processing || !formData.extension_number}
          >
            {processing ? <Spinner size="sm" animation="border" /> : 'Add Member'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Role Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Member Role</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Member</Form.Label>
              <Form.Control
                type="text"
                value={selectedMember?.user?.name || selectedMember?.extension_number || ''}
                disabled
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                {selectedMember?.role?.toLowerCase() === 'owner' && (
                  <option value="owner">Owner</option>
                )}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleUpdateRole}
            disabled={processing}
          >
            {processing ? <Spinner size="sm" animation="border" /> : 'Update Role'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Remove Member</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to remove{' '}
            <strong>{selectedMember?.user?.name || selectedMember?.extension_number}</strong> from this project?
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleRemoveMember}
            disabled={processing}
          >
            {processing ? <Spinner size="sm" animation="border" /> : 'Remove Member'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default MembersTab;
