import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericTable, { TableColumn, TableAction } from '@components/GenericTable';
import { getHosts, getItemsByHostName, ZabbixHost, ZabbixItem } from '@utils/zabbix';
import { Button, Row, Col, Modal, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import '@assets/scss/common.scss';
import { FiRefreshCw, FiEye } from 'react-icons/fi';
import '@assets/scss/tabs.scss';
import { List } from 'lucide-react';

const Hosts = () => {
  const router = useRouter();
  const [hosts, setHosts] = useState<ZabbixHost[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchValue, setSearchValue] = useState('');
  const [tablePagination, setTablePagination] = useState({
    currentPage: 1,
    rowsPerPage: 15,
    totalRows: 0,
    pageSizeOptions: [10, 15, 25, 50, 100] as number[],
  });
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedHost, setSelectedHost] = useState<ZabbixHost | null>(null);
  const [viewItems, setViewItems] = useState<ZabbixItem[]>([]);
  const [viewLoading, setViewLoading] = useState(false);

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

  const tableColumns: TableColumn<ZabbixHost>[] = [
    // { key: 'hostid', label: 'Host ID', sortable: true },
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
      render: (row) => <span>{row.groups?.map((group) => group.name).join(', ') ?? '-'}</span>,
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
    {
          label: 'View',
      icon: <FiEye size={16} />,
      onClick: (row) => handleViewClick(row),
      },
      {
        label: 'View Items',
    icon: <List size={16} />,
    onClick: (row) => handleViewItemsClick(row),
  },
  ];

  const fetchHosts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getHosts({
       output: ["hostid", "host", "name"],
        selectInterfaces: ["interfaceid", "ip"]
      });
      if (response.error) {
        toast.error(response.error.message || 'Failed to fetch hosts');
        setHosts([]);
        return;
      }
      const list = response.result ?? [];
      const data = Array.isArray(list) ? (list as ZabbixHost[]) : [];
      setHosts(data);
      setTablePagination((prev) => ({
        ...prev,
        totalRows: data.length,
        currentPage: 1,
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
    fetchHosts();
  }, [refreshKey, fetchHosts]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const filteredHosts = searchValue.trim()
    ? hosts.filter(
        (h) =>
          h.host?.toLowerCase().includes(searchValue.toLowerCase()) ||
          h.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
          h.hostid?.toLowerCase().includes(searchValue.toLowerCase()) ||
          h.interfaces?.some((i) => i.ip?.toLowerCase().includes(searchValue.toLowerCase()))
      )
    : hosts;

  const paginatedData = filteredHosts.slice(
    (tablePagination.currentPage - 1) * tablePagination.rowsPerPage,
    tablePagination.currentPage * tablePagination.rowsPerPage
  );

  const summaryCards: SummaryCard[] = [
    {
      id: 'total-hosts',
      title: 'Total Hosts',
      value: hosts.length,
      description: 'Hosts from Zabbix',
      delay: 0.1,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: 'style-2',
    },
  ];

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Pulse" mainLink="/pulse/dashboard" subTitle="Hosts" />

      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2">
            <Row className="d-flex justify-content-between align-items-center">
              <Col md={4}>
                {/* <h2 className="mb-0">Hosts</h2> */}
              </Col>
              <Col md={8} className="d-flex justify-content-end align-items-center gap-2 flex-wrap">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search hosts..."
                  value={searchValue}
                  onChange={(e) => {
                    setSearchValue(e.target.value);
                    setTablePagination((prev) => ({ ...prev, currentPage: 1 }));
                  }}
                  style={{ maxWidth: '240px' }}
                />
                <Button variant="info" onClick={handleRefresh} disabled={loading}>
                  <FiRefreshCw size={14} /> Refresh
                </Button>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      {/* <PageSummaryGrid cards={summaryCards} /> */}

      <GenericTable<ZabbixHost>
        data={paginatedData}
        columns={tableColumns}
        actions={tableActions}
        showActions={true}
        actionsLabel="Actions"
        loading={loading}
        emptyMessage="No hosts found."
        loadingMessage="Loading hosts..."
        pagination={{
          currentPage: tablePagination.currentPage,
          rowsPerPage: tablePagination.rowsPerPage,
          totalRows: filteredHosts.length,
          pageSizeOptions: tablePagination.pageSizeOptions,
        }}
        onPaginationChange={(page, rowsPerPage) => {
          setTablePagination((prev) => ({
            ...prev,
            currentPage: page,
            rowsPerPage,
          }));
        }}
        sortable={true}
        hover={true}
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

Hosts.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default Hosts;
