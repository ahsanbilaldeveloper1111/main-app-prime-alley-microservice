import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useCallback,
  useMemo,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, { TableColumn, ToolbarConfig, TableAction } from "@components/GenericTable";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import FormModal from "@pages/partial/FormModal";
import ConfirmModal from "@pages/partial/ConfirmModal";
import { getTrunksOutbound, addTrunk, updateTrunk, deleteTrunk } from "@utils/ai-agent/outbound";


import { Form } from 'react-bootstrap';
import {
  Plus,
  Edit,
  Phone,
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
  const EQUAL_COLUMN_WIDTH = '20%';
  const [searchQuery, setSearchQuery] = useState<string>('');
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
  const filteredTrunks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return trunks;
    return trunks.filter((trunk) => {
      const matchesSearch =
        trunk.name.toLowerCase().includes(query) ||
        trunk.address.toLowerCase().includes(query) ||
        trunk.numbers.some((num) => num.toLowerCase().includes(query));
      return matchesSearch;
    });
  }, [trunks, searchQuery]);

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
    }).then(() => {
      toast.success('Trunk added successfully');
      setShowAddTrunkModal(false);
      setNewTrunkName('');
      setNewTrunkAddress('');
      setNewTrunkNumbers('');
      setRefreshKey(prev => prev + 1);
    }).catch(() => {
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
    }).then(() => {
      toast.success('Trunk updated successfully');
      setShowEditTrunkModal(false);
      setSelectedTrunk(null);
      setNewTrunkName('');
      setNewTrunkAddress('');
      setNewTrunkNumbers('');
      setRefreshKey(prev => prev + 1);
    }).catch(() => {
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
  }, []);

  const handleConfirmDeleteTrunk = useCallback(() => {
    if (!selectedTrunk) return;

    deleteTrunk({
      trunk_id: selectedTrunk.sip_trunk_id
    }).then(() => {
      toast.success('Trunk deleted successfully');
      setShowDeleteTrunkModal(false);
      setSelectedTrunk(null);
      setRefreshKey(prev => prev + 1);
    }).catch(() => {
      toast.error('Failed to delete trunk');
      setShowDeleteTrunkModal(false);
      setSelectedTrunk(null);
    });
  }, [selectedTrunk]);

  const canAddTrunk = session?.user?.permissions?.includes('add-trunk-aiml') || false;
  const canEditTrunk = session?.user?.permissions?.includes('edit-trunk-aiml') || false;
  const canDeleteTrunk = session?.user?.permissions?.includes('delete-trunk-aiml') || false;

  const tableColumns = useMemo<TableColumn<Trunk>[]>(() => [
    {
      key: 'sip_trunk_id',
      label: 'Trunk ID',
      width: EQUAL_COLUMN_WIDTH,
      sortable: true,
      type: 'text',
      render: (trunk) => (
        <span style={{ fontWeight: 600, color: '#1f2937' }}>{trunk.sip_trunk_id}</span>
      ),
    },
    {
      key: 'name',
      label: 'Name',
      width: EQUAL_COLUMN_WIDTH,
      sortable: true,
      type: 'custom',
      render: (trunk) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #667eea 0%, #667eea 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Phone size={20} color="white" />
          </div>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>{trunk.name}</span>
        </div>
      ),
    },
    {
      key: 'address',
      label: 'Address',
      width: EQUAL_COLUMN_WIDTH,
      sortable: true,
      type: 'text',
      render: (trunk) => (
        <span style={{ fontFamily: 'monospace', color: '#1f2937' }}>{trunk.address}</span>
      ),
    },
    {
      key: 'numbers',
      label: 'Numbers',
      width: EQUAL_COLUMN_WIDTH,
      sortable: false,
      type: 'custom',
      render: (trunk) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {trunk.numbers && trunk.numbers.length > 0 ? (
            <>
              {trunk.numbers.slice(0, 3).map((num) => (
                <span
                  key={`${trunk.sip_trunk_id}-${num}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    backgroundColor: '#f3f4f6',
                    color: '#6b7280',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  {num}
                </span>
              ))}
              {trunk.numbers.length > 3 && (
                <span style={{ color: '#6b7280', fontSize: '12px', padding: '4px 8px' }}>
                  +{trunk.numbers.length - 3} more
                </span>
              )}
            </>
          ) : (
            <span style={{ color: '#9ca3af', fontSize: '13px' }}>No numbers</span>
          )}
        </div>
      ),
    },
  ], [EQUAL_COLUMN_WIDTH]);

  const tableActions = useMemo<TableAction<Trunk>[]>(() => {
    const actions: TableAction<Trunk>[] = [];
    if (canEditTrunk) {
      actions.push({
        label: 'Edit Trunk',
        icon: <Edit size={16} />,
        onClick: handleEditTrunk,
        variant: 'link',
        className: 'p-1 text-primary',
      });
    }
    if (canDeleteTrunk) {
      actions.push({
        label: 'Delete Trunk',
        icon: <Trash2 size={16} />,
        onClick: handleDeleteTrunk,
        variant: 'link',
        className: 'p-1 text-danger',
      });
    }
    return actions;
  }, [canEditTrunk, canDeleteTrunk, handleEditTrunk, handleDeleteTrunk]);

  const toolbarConfig = useMemo<ToolbarConfig>(() => ({
    showSearch: true,
    searchValue: searchQuery,
    searchPlaceholder: 'Search trunks...',
    onSearchChange: setSearchQuery,
    onSearch: () => setSearchQuery((prev) => prev.trim()),
    rightActions: canAddTrunk ? (
      <button
        type="button"
        className="btn btn-primary btn-sm"
        onClick={() => setShowAddTrunkModal(true)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
      >
        <Plus size={14} />
        Add Trunk
      </button>
    ) : undefined,
  }), [searchQuery, canAddTrunk]);

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Trunk Profiles" />

      {/* <PageHeader
        title="Trunk Profiles"
        showSearch={false}
        buttons={
          <></>
        }>
        </PageHeader> */}
    

<div className="outbound-trunks-table">
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <GenericTable<Trunk>
                data={filteredTrunks}
                columns={tableColumns}
                actions={tableActions}
                showActions={tableActions.length > 0}
                actionsLabel="Actions"
                showToolbar
                toolbar={toolbarConfig}
                loading={false}
                emptyMessage="No trunks found matching your criteria"
                uniqueKey="sip_trunk_id"
                showToolbarActions={false}
                hover
              />
            </div>
            <style jsx global>{`
              .outbound-trunks-table .generic-table {
                table-layout: fixed;
              }

              .outbound-trunks-table .generic-table .generic-table-th,
              .outbound-trunks-table .generic-table .generic-table-td,
              .outbound-trunks-table .generic-table .generic-table-actions-header,
              .outbound-trunks-table .generic-table .generic-table-actions-cell {
                width: 20%;
                max-width: 20%;
              }
            `}</style>
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
