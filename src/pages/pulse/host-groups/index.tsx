import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState, useCallback } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericTable, { TableAction, TableColumn } from '@components/GenericTable';
import {
  addCustomerHostGroups,
  addHostGroup,
  deleteHostGroup,
  getHostGroups,
  updateHostGroup,
  ZabbixHostGroup,
} from '@utils/zabbix';
import { Button, Row, Col, Modal, Form, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import '@assets/scss/common.scss';
import { FiRefreshCw } from 'react-icons/fi';
import '@assets/scss/tabs.scss';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import DeleteConfirmationModal from '@pages/partial/DeleteConfirmationModal';

const HostGroups = () => {
  const [groups, setGroups] = useState<ZabbixHostGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    offset: 0,
    limit: 10,
    total: 0,
    pageSizeOptions: [10, 15, 25, 50, 100] as number[],
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createSaving, setCreateSaving] = useState(false);

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerSaving, setCustomerSaving] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState<ZabbixHostGroup | null>(null);
  const [editName, setEditName] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ZabbixHostGroup | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchHostGroups = useCallback(async (offset: number, limit: number, searchTerm?: string) => {
    setLoading(true);
    try {
      const params: Parameters<typeof getHostGroups>[0] = {
        output: ['groupid', 'name'],
        selectHosts: ['hostid'],
        offset,
        limit,
      };
      const key = searchTerm?.trim();
      if (key) params.search = key;
      const response = await getHostGroups(params);
      const data = response.hostgroups ?? [];
      setGroups(data);
      setPagination((prev) => ({
        ...prev,
        offset: response.offset,
        limit: response.limit,
        total: response.total,
      }));
    } catch (error) {
      console.error('Error fetching host groups:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch host groups');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHostGroups(0, 10);
  }, [fetchHostGroups]);

  const handlePrevPage = () => {
    const { offset, limit } = pagination;
    fetchHostGroups(Math.max(0, offset - limit), limit, search);
  };

  const handleNextPage = () => {
    const { offset, limit, total } = pagination;
    if (offset + limit < total) {
      fetchHostGroups(offset + limit, limit, search);
    }
  };

  const handleSearch = () => fetchHostGroups(0, pagination.limit, search);

  const handleRefresh = () => fetchHostGroups(0, pagination.limit, search);

  const hasNextPage = pagination.offset + pagination.limit < pagination.total;

  const openCreateModal = () => {
    setCreateName('');
    setShowCreateModal(true);
  };

  const openCustomerModal = () => {
    setCustomerName('');
    setShowCustomerModal(true);
  };

  const submitCreateGroup = async () => {
    const name = createName.trim();
    if (!name) return toast.error('Group name is required');
    setCreateSaving(true);
    try {
      const resp = await addHostGroup({ name });
      toast.success(`Host group created: ${resp.name}`);
      setShowCreateModal(false);
      fetchHostGroups(0, pagination.limit, search);
    } catch (error) {
      console.error('Error creating host group:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create host group');
    } finally {
      setCreateSaving(false);
    }
  };

  const submitCreateCustomerGroups = async () => {
    const name = customerName.trim();
    if (!name) return toast.error('Customer name is required');
    setCustomerSaving(true);
    try {
      await addCustomerHostGroups({ customer_name: name });
      toast.success(`Customer host groups created for: ${name}`);
      setShowCustomerModal(false);
      fetchHostGroups(0, pagination.limit, search);
    } catch (error) {
      console.error('Error creating customer host groups:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create customer host groups');
    } finally {
      setCustomerSaving(false);
    }
  };

  const openEditModal = (group: ZabbixHostGroup) => {
    setEditTarget(group);
    setEditName(group.name ?? '');
    setShowEditModal(true);
  };

  const submitEditGroup = async () => {
    if (!editTarget?.groupid) return;
    const name = editName.trim();
    if (!name) return toast.error('Group name is required');
    setEditSaving(true);
    try {
      await updateHostGroup(editTarget.groupid, { name });
      toast.success('Host group updated');
      setShowEditModal(false);
      setEditTarget(null);
      fetchHostGroups(pagination.offset, pagination.limit, search);
    } catch (error) {
      console.error('Error updating host group:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update host group');
    } finally {
      setEditSaving(false);
    }
  };

  const openDeleteConfirm = (group: ZabbixHostGroup) => {
    setDeleteTarget(group);
    setShowDeleteModal(true);
  };

  const handleDeleteGroup = async () => {
    if (!deleteTarget?.groupid) return;
    setDeleteLoading(true);
    try {
      await deleteHostGroup(deleteTarget.groupid);
      toast.success('Host group deleted');
      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchHostGroups(0, pagination.limit, search);
    } catch (error) {
      console.error('Error deleting host group:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete host group');
    } finally {
      setDeleteLoading(false);
    }
  };

  const tableColumns: TableColumn<ZabbixHostGroup>[] = [
    { key: 'name', label: 'Name', sortable: true },
    {
      key: 'host_count',
      label: 'Host count',
      sortable: true,
      render: (row) => (
        <span>{row.host_count ?? (row.hosts ? row.hosts.length : 0)} Hosts</span>
      ),
    },
  ];

  const tableActions: TableAction<ZabbixHostGroup>[] = [
    { label: 'Edit', icon: <Pencil size={16} />, onClick: (row) => openEditModal(row) },
    { label: 'Delete', icon: <Trash2 size={16} />, onClick: (row) => openDeleteConfirm(row) },
  ];

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Pulse" mainLink="/pulse/dashboard" subTitle="Hosts" />
      <BreadcrumbItem mainTitle="Hosts" mainLink="/pulse/hosts" subTitle="Host Groups" />

      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2 d-flex justify-content-end align-items-center gap-2 flex-wrap">
           
            <input
              type="text"
              className="form-control"
              placeholder="Search host groups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{ maxWidth: '240px' }}
            />
            <Button variant="primary" onClick={handleSearch} disabled={loading}>
              <Search size={14} />
              Search
            </Button>
            <Button variant="success" onClick={openCreateModal} disabled={loading}>
              <Plus  size={14} />
              New Host Group
            </Button>
            <Button variant="warning" onClick={openCustomerModal} disabled={loading}>
              <Plus size={14} />
              Add Customer Group
            </Button>

            
            <Button variant="info" onClick={handleRefresh} disabled={loading}>
              <FiRefreshCw size={14} /> Refresh
            </Button>
          </div>
        </Col>
      </Row>

      

      <GenericTable<ZabbixHostGroup>
        data={groups}
        columns={tableColumns}
        actions={tableActions}
        showActions
        actionsLabel="Actions"
        loading={loading}
        emptyMessage="No host groups found."
        loadingMessage="Loading host groups..."
        pagination={{
          currentPage: pagination.limit > 0 ? Math.floor(pagination.offset / pagination.limit) + 1 : 1,
          rowsPerPage: pagination.limit,
          totalRows: pagination.total,
          pageSizeOptions: pagination.pageSizeOptions,
        }}
        onPaginationChange={(page, rowsPerPage) => {
          fetchHostGroups((page - 1) * rowsPerPage, rowsPerPage, search);
        }}
        sortable
        hover
        striped={false}
        uniqueKey="groupid"
      />

      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>New Host Group</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Group name</Form.Label>
            <Form.Control
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="single group"
              autoFocus
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)} disabled={createSaving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submitCreateGroup} disabled={createSaving || !createName.trim()}>
            {createSaving ? (
              <span className="d-inline-flex align-items-center gap-2">
                <Spinner size="sm" animation="border" /> Saving...
              </span>
            ) : (
              'Create'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showCustomerModal}
        onHide={() => setShowCustomerModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Add Customer Group</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Customer name</Form.Label>
            <Form.Control
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer Group Name"
              autoFocus
            />
          </Form.Group>
          <div className="text-muted mt-2" style={{ fontSize: '13px' }}>
            This will automatically create 4 hostgroups: Servers, Firewalls, Routers, and Switches.
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCustomerModal(false)} disabled={customerSaving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={submitCreateCustomerGroups}
            disabled={customerSaving || !customerName.trim()}
          >
            {customerSaving ? (
              <span className="d-inline-flex align-items-center gap-2">
                <Spinner size="sm" animation="border" /> Saving...
              </span>
            ) : (
              'Create'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showEditModal}
        onHide={() => {
          setShowEditModal(false);
          setEditTarget(null);
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Host Group</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Group name</Form.Label>
            <Form.Control value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowEditModal(false);
              setEditTarget(null);
            }}
            disabled={editSaving}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={submitEditGroup} disabled={editSaving || !editName.trim()}>
            {editSaving ? (
              <span className="d-inline-flex align-items-center gap-2">
                <Spinner size="sm" animation="border" /> Saving...
              </span>
            ) : (
              'Update'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDeleteGroup}
        itemName={deleteTarget?.name}
        itemType="host group"
        loading={deleteLoading}
      />
    </React.Fragment>
  );
};

HostGroups.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default HostGroups;
