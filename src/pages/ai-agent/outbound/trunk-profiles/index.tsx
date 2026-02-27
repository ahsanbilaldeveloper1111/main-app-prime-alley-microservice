import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useCallback,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import FormModal from "@pages/partial/FormModal";
import ConfirmModal from "@pages/partial/ConfirmModal";
import { getTrunksOutbound, addTrunk, updateTrunk, deleteTrunk } from "@utils/ai-agent/outbound";


import { Row, Col, Form } from 'react-bootstrap';
import {
  Search,
  Plus,
  Edit,
  Phone,
  MoreVertical,
  Trash2
} from 'lucide-react';

interface Trunk {
  sip_trunk_id: string;
  name: string;
  address: string;
  numbers: string[];
}



const normalizeTrunkList = (items: Trunk[]) =>
  items.map((trunk) => ({
    ...trunk,
    numbers: Array.isArray(trunk.numbers) ? trunk.numbers : [],
  }));

const AIMLTrunkProfile = () => {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedActions, setExpandedActions] = useState<string | null>(null);
  const [trunks, setTrunks] = useState<Trunk[]>([]);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Modal states
  const [showAddTrunkModal, setShowAddTrunkModal] = useState<boolean>(false);
  const [showEditTrunkModal, setShowEditTrunkModal] = useState<boolean>(false);
  const [showDeleteTrunkModal, setShowDeleteTrunkModal] = useState<boolean>(false);
  const [selectedTrunk, setSelectedTrunk] = useState<Trunk | null>(null);

  // Form states
  const [newTrunkName, setNewTrunkName] = useState<string>('');
  const [newTrunkAddress, setNewTrunkAddress] = useState<string>('');
  const [newTrunkNumbers, setNewTrunkNumbers] = useState<string>('');

  // Fetch trunks (aiml list-trunks + outbound for reference)
  const fetchTrunks = useCallback(async () => {
    try {
      //const response = await axiosInstance.get('aiml/list-trunks');
      
      const response = await getTrunksOutbound();
      console.log('getTrunksOutbound response:', response?.data);
      const received = normalizeTrunkList(response?.data?.trunks ?? []);
      setTrunks(received);
    } catch (error) {
      console.error('Error fetching trunks:', error);
      toast.error('Failed to fetch trunks');
    }
  }, []);

  // Load trunks on mount and refresh
  React.useEffect(() => {
    fetchTrunks();
  }, [fetchTrunks, refreshKey]);

  // Filter trunks
  const filteredTrunks = trunks.filter(trunk => {
    const matchesSearch = trunk.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trunk.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trunk.numbers.some(num => num.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  // Handle add trunk
  const handleSubmitAddTrunk = useCallback(() => {
    if (!newTrunkName || !newTrunkAddress || !newTrunkNumbers) {
      toast.error('Please fill in all required fields');
      return;
    }

    addTrunk({
      name: newTrunkName,
      address: newTrunkAddress,
      numbers: newTrunkNumbers
    }).then((response) => {
      toast.success('Trunk added successfully');
      setShowAddTrunkModal(false);
      setNewTrunkName('');
      setNewTrunkAddress('');
      setNewTrunkNumbers('');
      setRefreshKey(prev => prev + 1);
    }).catch((error) => {
      toast.error('Failed to add trunk');
    });
  }, [newTrunkName, newTrunkAddress, newTrunkNumbers]);

  const handleCloseAddTrunkModal = useCallback(() => {
    setShowAddTrunkModal(false);
    setNewTrunkName('');
    setNewTrunkAddress('');
    setNewTrunkNumbers('');
  }, []);

  // Handle edit trunk
  const handleEditTrunk = useCallback((trunk: Trunk) => {
    setSelectedTrunk(trunk);
    setNewTrunkName(trunk.name);
    setNewTrunkAddress(trunk.address);
    setNewTrunkNumbers(Array.isArray(trunk.numbers) ? trunk.numbers.join(', ') : trunk.numbers || '');
    setShowEditTrunkModal(true);
    setExpandedActions(null);
  }, []);

  const handleSubmitEditTrunk = useCallback(() => {
    if (!selectedTrunk || !newTrunkName || !newTrunkAddress || !newTrunkNumbers) {
      toast.error('Please fill in all required fields');
      return;
    }

    updateTrunk({
      trunk_id: selectedTrunk.sip_trunk_id,
      name: newTrunkName,
      address: newTrunkAddress,
      numbers: newTrunkNumbers
    }).then((response) => {
      toast.success('Trunk updated successfully');
      setShowEditTrunkModal(false);
      setSelectedTrunk(null);
      setNewTrunkName('');
      setNewTrunkAddress('');
      setNewTrunkNumbers('');
      setRefreshKey(prev => prev + 1);
    }).catch((error) => {
      toast.error('Failed to update trunk');
    });
  }, [selectedTrunk, newTrunkName, newTrunkAddress, newTrunkNumbers]);

  const handleCloseEditTrunkModal = useCallback(() => {
    setShowEditTrunkModal(false);
    setSelectedTrunk(null);
    setNewTrunkName('');
    setNewTrunkAddress('');
    setNewTrunkNumbers('');
  }, []);

  // Handle delete trunk
  const handleDeleteTrunk = useCallback((trunk: Trunk) => {
    setSelectedTrunk(trunk);
    setShowDeleteTrunkModal(true);
    setExpandedActions(null);
  }, []);

  const handleConfirmDeleteTrunk = useCallback(() => {
    if (!selectedTrunk) return;

    deleteTrunk({
      trunk_id: selectedTrunk.sip_trunk_id
    }).then((response) => {
      toast.success('Trunk deleted successfully');
      setShowDeleteTrunkModal(false);
      setSelectedTrunk(null);
      setRefreshKey(prev => prev + 1);
    }).catch((error) => {
      toast.error('Failed to delete trunk');
      setShowDeleteTrunkModal(false);
      setSelectedTrunk(null);
    });
  }, [selectedTrunk]);

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Trunk Profiles" />

      <PageHeader
        title="Trunk Profiles"
        showSearch={false}
        buttons={
          <></>
        }>
        </PageHeader>
    

<div>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              {/* Filters and Actions */}
              <Row className="g-3 mb-4">
                <Col xs={12} md={6} lg={4}>
                  <div style={{ position: 'relative' }}>
                    <Search size={18} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input
                      type="text"
                      placeholder="Search trunks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 40px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#1f2937'
                      }}
                    />
                  </div>
                </Col>
              </Row>
  
              {/* Trunks Table */}
              <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Trunk ID</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Name</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Address</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Numbers</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrunks.map((trunk) => (
                      <tr key={trunk.sip_trunk_id} style={{ transition: 'background-color 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#1f2937', borderBottom: '1px solid #f3f4f6' }}>{trunk.sip_trunk_id}</td>
                        <td style={{ padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #667eea 0%, #667eea  100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <Phone size={20} color="white" />
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>{trunk.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', fontFamily: 'monospace', color: '#1f2937', borderBottom: '1px solid #f3f4f6' }}>{trunk.address}</td>
                        <td style={{ padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {trunk.numbers && trunk.numbers.length > 0 ? (
                              trunk.numbers.slice(0, 3).map((num) => (
                                <span key={`${trunk.sip_trunk_id}-${num}`} style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '4px 8px',
                                  backgroundColor: '#f3f4f6',
                                  color: '#6b7280',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: 500
                                }}>
                                  {num}
                                </span>
                              ))
                            ) : (
                              <span style={{ color: '#9ca3af', fontSize: '13px' }}>No numbers</span>
                            )}
                            {trunk.numbers && trunk.numbers.length > 3 && (
                              <span style={{ color: '#6b7280', fontSize: '12px', padding: '4px 8px' }}>
                                +{trunk.numbers.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '16px', borderBottom: '1px solid #f3f4f6', position: 'relative' }}>
                          <button
                            onClick={() => setExpandedActions(expandedActions === trunk.sip_trunk_id ? null : trunk.sip_trunk_id)}
                            style={{
                              padding: '6px',
                              backgroundColor: 'transparent',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <MoreVertical size={16} color="#6b7280" />
                          </button>
                          {expandedActions === trunk.sip_trunk_id && (
                            <div style={{
                              position: 'absolute',
                              right: '16px',
                              top: '50px',
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                              zIndex: 10,
                              minWidth: '180px'
                            }}>
                              {session?.user?.permissions?.includes('edit-trunk-aiml') && (
                                <div
                                  onClick={() => handleEditTrunk(trunk)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 16px',
                                    fontSize: '14px',
                                    color: '#1f2937',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                    borderBottom: '1px solid #f3f4f6'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  <Edit size={16} />
                                  Edit Trunk
                                </div>
                              )}
                              {session?.user?.permissions?.includes('delete-trunk-aiml') && (
                                <div
                                  onClick={() => handleDeleteTrunk(trunk)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 16px',
                                    fontSize: '14px',
                                    color: '#dc2626',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  <Trash2 size={16} />
                                  Delete Trunk
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
  
              {filteredTrunks.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <Phone size={48} color="#d1d5db" style={{ marginBottom: '16px' }} />
                  <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>No trunks found matching your criteria</p>
                </div>
              )}
            </div>
          </div>

      {/* Add Trunk Modal */}
      <FormModal
        show={showAddTrunkModal}
        onHide={handleCloseAddTrunkModal}
        title="Add Trunk"
        onSubmit={handleSubmitAddTrunk}
        onCancel={handleCloseAddTrunkModal}
        cancelButtonText="Cancel"
        desc="Please fill in the details below to add a new trunk"
        submitButtonText="Add Trunk"
        isSubmitDisabled={!newTrunkName || !newTrunkAddress || !newTrunkNumbers}
        submitButtonVariant="primary"
        cancelButtonVariant="secondary"
        showGuidelines={true}
        guidelines={<p>Please fill in the details below to add a new trunk</p>}
        size="lg"
        titleIcon={<Plus size={20} className="text-primary" />}
        formHtml={
          <>
            <Form.Group className="mb-3">
              <Form.Label>Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                value={newTrunkName}
                onChange={(event) => setNewTrunkName(event.target.value)}
                placeholder="Campaign A Trunk"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Address <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                value={newTrunkAddress}
                onChange={(event) => setNewTrunkAddress(event.target.value)}
                placeholder="90.250.8.96:5069"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Numbers (comma or newline separated) <span className="text-danger">*</span></Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newTrunkNumbers}
                onChange={(event) => setNewTrunkNumbers(event.target.value)}
                placeholder="303100,303101"
                required
              />
            </Form.Group>
          </>
        }
      />

      {/* Edit Trunk Modal */}
      <FormModal
        show={showEditTrunkModal}
        onHide={handleCloseEditTrunkModal}
        title="Edit Trunk"
        onSubmit={handleSubmitEditTrunk}
        onCancel={handleCloseEditTrunkModal}
        cancelButtonText="Cancel"
        desc="Please update the details below"
        submitButtonText="Update Trunk"
        isSubmitDisabled={!newTrunkName || !newTrunkAddress || !newTrunkNumbers}
        submitButtonVariant="primary"
        cancelButtonVariant="secondary"
        showGuidelines={true}
        guidelines={<p>Please update the details below</p>}
        size="lg"
        titleIcon={<Edit size={20} className="text-primary" />}
        formHtml={
          <>
            <Form.Group className="mb-3">
              <Form.Label>Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                value={newTrunkName}
                onChange={(event) => setNewTrunkName(event.target.value)}
                placeholder="Campaign A Trunk"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Address <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                value={newTrunkAddress}
                onChange={(event) => setNewTrunkAddress(event.target.value)}
                placeholder="90.250.8.96:5069"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Numbers (comma or newline separated) <span className="text-danger">*</span></Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newTrunkNumbers}
                onChange={(event) => setNewTrunkNumbers(event.target.value)}
                placeholder="303100,303101"
                required
              />
            </Form.Group>
          </>
        }
      />

      {/* Delete Trunk Modal */}
      <ConfirmModal
        show={showDeleteTrunkModal}
        onHide={() => setShowDeleteTrunkModal(false)}
        title="Delete Trunk"
        description={`Are you sure you want to delete the trunk "${selectedTrunk?.name}"?`}
        targetName={selectedTrunk?.sip_trunk_id || ''}
        onConfirm={handleConfirmDeleteTrunk}
        onCancel={() => setShowDeleteTrunkModal(false)}
        confirmButtonText="Delete"
        confirmButtonVariant="danger"
        requireTextConfirmation={true}
        requiredConfirmationText="delete"
      />
    </React.Fragment>
  );
};

AIMLTrunkProfile.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default AIMLTrunkProfile;
