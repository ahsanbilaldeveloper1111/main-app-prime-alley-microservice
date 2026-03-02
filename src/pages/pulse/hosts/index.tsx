import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericTable, { TableColumn, TableAction } from '@components/GenericTable';
import { getHosts, getItemsByHostName, ZabbixHost, ZabbixItem } from '@utils/zabbix';
import { Button, Row, Col, Modal, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import '@assets/scss/common.scss';
import { FiRefreshCw, FiEye } from 'react-icons/fi';
import '@assets/scss/tabs.scss';
import { List } from 'lucide-react';

const Hosts = () => {
  const router = useRouter();
  const [hosts, setHosts] = useState<ZabbixHost[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    offset: 0,
    limit: 10,
    total: 0,
    pageSizeOptions: [5, 10, 15, 20, 25, 50, 100] as number[],
  });
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedHost, setSelectedHost] = useState<ZabbixHost | null>(null);
  const [viewItems, setViewItems] = useState<ZabbixItem[]>([]);
  const [viewLoading, setViewLoading] = useState(false);

  const fetchHosts = useCallback(async (offset: number, limit: number, search?: string) => {
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

  const handleViewClick = useCallback(async (row: ZabbixHost) => {
    setSelectedHost(row);
    setShowViewModal(true);
    setViewItems([]);
    setViewLoading(true);
    try {
      const hostName = row.host || row.name;
      if (!hostName) {
        toast.error('Host name not available');
        return;
      }
      const response = await getItemsByHostName([hostName]);
      if (response?.error) {
        toast.error(response.error.message || 'Failed to fetch items');
        setViewItems([]);
        return;
      }
      const list = response?.result ?? [];
      setViewItems(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Failed to fetch items');
      setViewItems([]);
    } finally {
      setViewLoading(false);
    }
  }, []);

  const handleViewItemsClick = useCallback(
    (row: ZabbixHost) => {
      if (row.hostid) {
        router.push(`/pulse/hosts/${row.hostid}`);
      } else {
        toast.error('Host ID not available');
      }
    },
    [router]
  );

  const handlePrevPage = () => {
    const { offset, limit } = pagination;
    fetchHosts(Math.max(0, offset - limit), limit, search);
  };

  const handleNextPage = () => {
    const { offset, limit, total } = pagination;
    if (offset + limit < total) {
      fetchHosts(offset + limit, limit, search);
    }
  };

  const handleSearch = () => fetchHosts(0, pagination.limit, search);

  const handleRefresh = () => fetchHosts(0, pagination.limit, search);

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
    { label: 'View', icon: <FiEye size={16} />, onClick: (row) => handleViewClick(row) },
    { label: 'View Items', icon: <List size={16} />, onClick: (row) => handleViewItemsClick(row) },
  ];

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Pulse" mainLink="/pulse/dashboard" subTitle="Hosts" />

      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2 d-flex justify-content-end align-items-center gap-2 flex-wrap">
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
          fetchHosts((page - 1) * rowsPerPage, rowsPerPage, search);
        }}
        sortable
        hover
        striped={false}
        uniqueKey="hostid"
      />

      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Items — {selectedHost?.name ?? selectedHost?.host ?? 'Host'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewLoading ? (
            <div className="text-center py-4">Loading items...</div>
          ) : viewItems.length === 0 ? (
            <div className="text-center py-4 text-muted">No items found for this host.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm table-bordered">
                <thead>
                  <tr>
                    <th>Item ID</th>
                    <th>Name</th>
                    <th>Key</th>
                    <th>Last Value</th>
                    <th>Units</th>
                  </tr>
                </thead>
                <tbody>
                  {viewItems.map((item) => (
                    <tr key={item.itemid}>
                      <td>{item.itemid}</td>
                      <td>{item.name}</td>
                      <td><code>{item.key_ ?? '-'}</code></td>
                      <td>{item.lastvalue ?? '-'}</td>
                      <td>{item.units ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
};

Hosts.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default Hosts;
