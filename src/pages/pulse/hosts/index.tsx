import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState, useCallback } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericTable, { TableColumn, TableAction } from '@components/GenericTable';
import {
  getHostGroups,
  getHosts,
  ZabbixHost,
  ZabbixHostGroup,
} from '@utils/zabbix';
import { Button, Row, Col, Modal, Badge, Form, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import '@assets/scss/common.scss';
import { FiRefreshCw } from 'react-icons/fi';
import '@assets/scss/tabs.scss';
import { Pencil, Trash2 } from 'lucide-react';
import AppSelect from '@components/AppSelect';
import DeleteConfirmationModal from '@pages/partial/DeleteConfirmationModal';

type HostGroupOption = { value: string; label: string };

const Hosts = () => {
  const [hosts, setHosts] = useState<ZabbixHost[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [hostGroupsLoading, setHostGroupsLoading] = useState(false);
  const [hostGroupOptions, setHostGroupOptions] = useState<HostGroupOption[]>([]);
  const [selectedHostGroup, setSelectedHostGroup] = useState<HostGroupOption | null>(null);
  const [pagination, setPagination] = useState({
    offset: 0,
    limit: 10,
    total: 0,
    pageSizeOptions: [5, 10, 15, 20, 25, 50, 100] as number[],
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editHost, setEditHost] = useState<ZabbixHost | null>(null);
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState<number>(1);
  const [editDescription, setEditDescription] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ZabbixHost | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchHosts = useCallback(async (offset: number, limit: number, search?: string, groupid?: string) => {
    setLoading(true);
    try {
      const params: Parameters<typeof getHosts>[0] = {
        output: ['hostid', 'host', 'name'],
        selectInterfaces: ['interfaceid', 'ip'],
        selectGroups: ['groupid', 'name'],
        offset,
        limit,
      };
      const key = search?.trim();
      if (key) params.search = key;
      const gid = groupid?.trim();
      if (gid) params.groupid = gid;
      const response = await getHosts(params);
      const data = response.hosts ?? [];
      setHosts(data);
      setPagination((prev) => ({
        ...prev,
        offset: response.offset,
        limit: response.limit,
        total: response.total,
      }));
    } catch (error) {
      console.error('Error fetching hosts:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch hosts');
      setHosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHosts(0, 10);
  }, [fetchHosts]);

  useEffect(() => {
    let cancelled = false;

    const loadHostGroups = async () => {
      setHostGroupsLoading(true);
      try {
        const all: ZabbixHostGroup[] = [];
        let offset = 0;
        const limit = 200;

        while (true) {
          const response = await getHostGroups({
            output: ['groupid', 'name'],
            selectHosts: ['hostid'],
            offset,
            limit,
          });

          all.push(...(response.hostgroups ?? []));

          if (!response.has_more) break;
          if (!response.returned || response.returned <= 0) break;

          offset = response.offset + response.returned;
        }

        if (cancelled) return;

        const options: HostGroupOption[] = all
          .filter((g) => g?.groupid && g?.name)
          .map((g) => ({ value: g.groupid, label: g.name }))
          .sort((a, b) => a.label.localeCompare(b.label));

        setHostGroupOptions(options);
      } catch (error) {
        console.error('Error fetching host groups:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to fetch host groups');
        setHostGroupOptions([]);
      } finally {
        if (!cancelled) setHostGroupsLoading(false);
      }
    };

    loadHostGroups();

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshList = useCallback(
    (nextOffset?: number) => {
      fetchHosts(
        nextOffset ?? pagination.offset,
        pagination.limit,
        search,
        selectedHostGroup?.value
      );
    },
    [fetchHosts, pagination.offset, pagination.limit, search, selectedHostGroup?.value]
  );

  const handlePrevPage = () => {
    const { offset, limit } = pagination;
    fetchHosts(Math.max(0, offset - limit), limit, search, selectedHostGroup?.value);
  };

  const handleNextPage = () => {
    const { offset, limit, total } = pagination;
    if (offset + limit < total) {
      fetchHosts(offset + limit, limit, search, selectedHostGroup?.value);
    }
  };

  const handleSearch = () => fetchHosts(0, pagination.limit, search, selectedHostGroup?.value);

  const handleRefresh = () => fetchHosts(0, pagination.limit, search, selectedHostGroup?.value);

  const hasNextPage = pagination.offset + pagination.limit < pagination.total;



  const tableColumns: TableColumn<ZabbixHost>[] = [
    { key: 'host', label: 'Name / Hostname', sortable: true },
    {
      key: 'ip',
      label: 'Address',
      sortable: true,
      render: (row) => <span>{row.interfaces?.[0]?.ip ?? '-'}</span>,
    },
    {
      key: 'groups',
      label: 'Groups',
      sortable: true,
      render: (row) => <span>{row.groups?.map((g) => g.name).join(', ') ?? '-'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) =>
        Number(row.status) === 1 ? (
          <Badge bg="success">Monitored</Badge>
        ) : (
          <Badge bg="danger">Not monitored</Badge>
        ),
    },
  ];

  const tableActions: TableAction<ZabbixHost>[] = [
    // { label: 'Edit', icon: <Pencil size={16} />, onClick: (row) => openEditModal(row) },
    // { label: 'Delete', icon: <Trash2 size={16} />, onClick: (row) => openDeleteConfirm(row) },
  ];

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Pulse" mainLink="/pulse/dashboard" subTitle="Hosts" />

      <Row className="mb-3">
        <Col md={12}>
          
          <div className="page-header-title style-2 d-flex justify-content-end align-items-center gap-2 flex-wrap">

            <div style={{ minWidth: '260px', maxWidth: '320px' }}>
              <AppSelect
                instanceId="pulse-hosts-hostgroup"
                placeholder="All host groups"
                isClearable
                isLoading={hostGroupsLoading}
                options={hostGroupOptions}
                value={selectedHostGroup}
                onChange={(opt) => {
                  const next = (opt ?? null) as HostGroupOption | null;
                  setSelectedHostGroup(next);
                  fetchHosts(0, pagination.limit, search, next?.value);
                }}
              />
            </div>
            <input
              type="text"
              className="form-control"
              placeholder="Search hosts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{ maxWidth: '240px' }}
            />
            <Button variant="primary" onClick={handleSearch} disabled={loading}>
              Search
            </Button>
            <Button variant="info" onClick={handleRefresh} disabled={loading}>
              <FiRefreshCw size={14} /> Refresh
            </Button>
          </div>
        </Col>
      </Row>

   

      <GenericTable<ZabbixHost>
        data={hosts}
        columns={tableColumns}
        actions={tableActions}
        showActions
        actionsLabel="Actions"
        loading={loading}
        emptyMessage="No hosts found."
        loadingMessage="Loading hosts..."
        pagination={{
          currentPage: pagination.limit > 0 ? Math.floor(pagination.offset / pagination.limit) + 1 : 1,
          rowsPerPage: pagination.limit,
          totalRows: pagination.total,
          pageSizeOptions: pagination.pageSizeOptions,
        }}
        onPaginationChange={(page, rowsPerPage) => {
          fetchHosts((page - 1) * rowsPerPage, rowsPerPage, search, selectedHostGroup?.value);
        }}
        sortable
        hover
        striped={false}
        uniqueKey="hostid"
      />
    
    </React.Fragment>
  );
};

Hosts.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default Hosts;
