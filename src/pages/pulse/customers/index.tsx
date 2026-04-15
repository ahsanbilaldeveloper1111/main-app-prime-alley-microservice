import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { getCustomersV2, ZabbixCustomerGroupRow } from '@utils/zabbix';
import GenericTable, { TableColumn, ToolbarConfig, TabConfig } from '@components/GenericTable';
import GenericSidebar, { SidebarSection } from '@components/GenericSidebarNew';
import { Badge, Modal, Table, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import '@assets/scss/common.scss';
import { FiRefreshCw } from 'react-icons/fi';
import '@assets/scss/tabs.scss';
import { Building2, FolderTree, Monitor } from 'lucide-react';

type CustomerTableRow = {
  customer: string;
  group_count: number;
  host_count_total: number;
  device_types: string[];
  groups: ZabbixCustomerGroupRow[];
};

type DetailsModalMode = 'device_types' | 'groups';

const PulseCustomers = () => {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<CustomerTableRow[]>([]);
  const [search, setSearch] = useState('');
  const [detailsModal, setDetailsModal] = useState<{
    open: boolean;
    mode: DetailsModalMode;
    row: CustomerTableRow | null;
  }>({ open: false, mode: 'device_types', row: null });
  const [pagination, setPagination] = useState({
    offset: 0,
    limit: 100,
    total: 0,
    pageSizeOptions: [10, 15, 25, 50, 100] as number[],
  });
  const [showCustomerSidebar, setShowCustomerSidebar] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerTableRow | null>(null);

  const fetchCustomers = useCallback(async (offset: number, limit: number, searchTerm?: string) => {
    setLoading(true);
    try {
      const response = await getCustomersV2({
        offset,
        limit,
        ...(searchTerm?.trim() ? { search: searchTerm.trim() } : {}),
      });

      const customerNames =
        Array.isArray(response.customer_names) && response.customer_names.length > 0
          ? response.customer_names
          : Object.keys(response.customers ?? {}).sort((a, b) => a.localeCompare(b));

      const customerRows: CustomerTableRow[] = customerNames.map((customer) => {
        const maybeGroups = response.customers?.[customer];
        const groups: ZabbixCustomerGroupRow[] = Array.isArray(maybeGroups) ? maybeGroups : [];
        const deviceTypes = Array.from(
          new Set(groups.map((g) => String(g.device_type ?? '')).filter(Boolean))
        ).sort((a, b) => a.localeCompare(b));
        const hostCountTotal = groups.reduce((acc, g) => {
          const n = typeof g.host_count === 'number' ? g.host_count : Number(g.host_count);
          return acc + (Number.isFinite(n) ? n : 0);
        }, 0);
        return {
          customer,
          groups,
          group_count: groups.length,
          host_count_total: hostCountTotal,
          device_types: deviceTypes,
        };
      });

      setRows(customerRows);
      setPagination((prev) => ({
        ...prev,
        offset: response.offset ?? offset,
        limit: response.limit ?? limit,
        total: response.total ?? 0,
      }));
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch customers');
      setRows([]);
      setPagination((prev) => ({ ...prev, offset: 0, total: 0 }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers(0, pagination.limit);
  }, [fetchCustomers, pagination.limit]);

  const handleSearch = () => fetchCustomers(0, pagination.limit, search);
  const handleRefresh = () => fetchCustomers(0, pagination.limit, search);

  const openDetails = useCallback((mode: DetailsModalMode, row: CustomerTableRow) => {
    setDetailsModal({ open: true, mode, row });
  }, []);

  const closeDetails = useCallback(() => {
    setDetailsModal((prev) => ({ ...prev, open: false }));
  }, []);

  const openCustomerSidebar = useCallback((row: CustomerTableRow) => {
    setSelectedCustomer(row);
    setShowCustomerSidebar(true);
  }, []);

  const closeCustomerSidebar = useCallback(() => {
    setShowCustomerSidebar(false);
    setSelectedCustomer(null);
  }, []);

  const pluralize = useCallback((n: number, s: string, p?: string) => {
    const plural = p ?? `${s}s`;
    return `${n} ${n === 1 ? s : plural}`;
  }, []);

  const deviceTypeIcon = useCallback((deviceType: string) => {
    const key = deviceType.trim().toLowerCase();
    if (key.includes('firewall')) return '🔥';
    if (key.includes('router')) return '🌐';
    if (key.includes('server')) return '🖥️';
    if (key.includes('switch')) return '🔀';
    return '📦';
  }, []);

  const tableColumns: TableColumn<CustomerTableRow>[] = useMemo(
    () => [
      { key: 'customer', label: 'Customer', sortable: true },
      { key: 'group_count', label: 'Groups', sortable: true },
      { key: 'host_count_total', label: 'Total Devices', sortable: true },
      {
        key: 'device_types',
        label: 'Device Types',
        sortable: false,
        render: (row) => (
          <div className="d-flex flex-wrap gap-1">
            {row.device_types.length > 0 ? (
              row.device_types.map((dt) => (
                <Badge key={dt} bg="secondary" style={{ fontSize: '0.75rem' }}>
                  {deviceTypeIcon(dt)} {dt}
                </Badge>
              ))
            ) : (
              <span className="text-muted">-</span>
            )}
          </div>
        ),
      },
    ],
    [deviceTypeIcon]
  );

  const customerSidebarSections: SidebarSection[] = useMemo(() => {
    if (!selectedCustomer) return [];

    const perTypeCounts = selectedCustomer.groups.reduce<Record<string, number>>((acc, g) => {
      const dt = String(g.device_type ?? '').trim();
      if (!dt) return acc;
      const n = typeof g.host_count === 'number' ? g.host_count : Number(g.host_count);
      acc[dt] = (acc[dt] ?? 0) + (Number.isFinite(n) ? n : 0);
      return acc;
    }, {});
    const orderedTypes = Object.keys(perTypeCounts).sort((a, b) => a.localeCompare(b));

    return [
      {
        id: 'overview',
        title: 'Customer Overview',
        icon: Building2,
        collapsible: true,
        defaultExpanded: true,
        fields: [
          { label: 'Customer Name', value: selectedCustomer.customer, copyable: true },
          { label: 'Total Devices', value: selectedCustomer.host_count_total },
          { label: 'Total Groups', value: selectedCustomer.group_count },
          { label: 'Device Type Count', value: selectedCustomer.device_types.length },
        ],
      },
      {
        id: 'device-types',
        title: 'Device Types',
        icon: Monitor,
        collapsible: true,
        defaultExpanded: true,
        customContent: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {orderedTypes.length > 0 ? (
              orderedTypes.map((dt) => (
                <div
                  key={dt}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--row-even)',
                    borderRadius: '0.375rem',
                    borderLeft: '3px solid var(--primary)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1rem' }}>{deviceTypeIcon(dt)}</span>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{dt}</span>
                  </div>
                  <Badge bg="secondary">{perTypeCounts[dt] ?? 0} devices</Badge>
                </div>
              ))
            ) : (
              <div className="text-muted">No device types</div>
            )}
          </div>
        ),
      },
      {
        id: 'groups',
        title: 'Groups',
        icon: FolderTree,
        collapsible: true,
        defaultExpanded: false,
        customContent:
          selectedCustomer.groups.length > 0 ? (
            <Table responsive bordered hover size="sm" className="mb-0">
              <thead>
                <tr>
                  <th style={{ width: '110px' }}>Group ID</th>
                  <th>Path</th>
                  <th style={{ width: '160px' }}>Device Type</th>
                  <th style={{ width: '90px' }}>Hosts</th>
                </tr>
              </thead>
              <tbody>
                {selectedCustomer.groups.map((g) => (
                  <tr key={g.groupid}>
                    <td>{g.groupid}</td>
                    <td>{g.name ?? '-'}</td>
                    <td>{(g.device_type as string) ?? '-'}</td>
                    <td>
                      {typeof g.host_count === 'number' ? g.host_count : Number(g.host_count) || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-muted">No groups.</div>
          ),
      },
    ];
  }, [selectedCustomer, deviceTypeIcon]);

  const customerTabs: TabConfig[] = useMemo(
    () => [
      {
        id: 'customers',
        label: 'Customers',
        count: pagination.total || rows.length,
        removable: false,
      },
    ],
    [pagination.total, rows.length]
  );

  const customersToolbarConfig: ToolbarConfig = useMemo(
    () => ({
      showSearch: true,
      searchValue: search,
      searchPlaceholder: 'Search customers...',
      onSearchChange: setSearch,
      onSearch: handleSearch,
      showTabs: true,
      tabs: customerTabs,
      activeTab: 'customers',
      onTabChange: () => {},
      showTableViewDropdown: false,
      customActions: (
        <div className="d-flex align-items-center gap-2 flex-wrap customers-toolbar-buttons">
          <button className="customers-btn" onClick={handleSearch} disabled={loading}>
            Search
          </button>
          <button className="customers-btn" onClick={handleRefresh} disabled={loading}>
            <FiRefreshCw size={14} /> Refresh
          </button>
        </div>
      ),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [customerTabs, handleSearch, handleRefresh, loading, search]
  );

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Pulse" mainLink="/pulse/dashboard" subTitle="Customers" />

      <div
        className="pulse-customers-page"
        style={{
          display: 'flex',
          gap: '0',
          height: 'calc(100vh)',
          overflow: 'hidden',
        }}
      >
        <div
          className="customers-table-pane"
          style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        >
          <GenericTable<CustomerTableRow>
            data={rows}
            columns={tableColumns}
            showActions={false}
            showToolbarActions={false}
            loading={loading}
            emptyMessage="No customers found."
            loadingMessage="Loading customers..."
            pagination={{
              currentPage:
                pagination.limit > 0 ? Math.floor(pagination.offset / pagination.limit) + 1 : 1,
              rowsPerPage: pagination.limit,
              totalRows: pagination.total,
              pageSizeOptions: pagination.pageSizeOptions,
            }}
            onPaginationChange={(page, rowsPerPage) => {
              fetchCustomers((page - 1) * rowsPerPage, rowsPerPage, search);
            }}
            sortable
            hover
            striped={false}
            uniqueKey="customer"
            onPreviewClick={(row) => openCustomerSidebar(row)}
            showToolbar={true}
            toolbar={customersToolbarConfig}
            fixedHeight={true}
            maxHeight="calc(100vh - 295px)"
          />
        </div>

        {showCustomerSidebar && selectedCustomer && (
          <GenericSidebar
            isOpen={showCustomerSidebar}
            onClose={closeCustomerSidebar}
            title={selectedCustomer.customer}
            subtitle={`${pluralize(selectedCustomer.host_count_total, 'device')} • ${pluralize(selectedCustomer.device_types.length, 'type')}`}
            avatar={{
              initials: selectedCustomer.customer.slice(0, 2).toUpperCase(),
              name: selectedCustomer.customer,
              gradient: '#667eea',
            }}
            actionsDropdown={{
              label: 'Actions',
              items: [
                {
                  label: 'View Device Types',
                  onClick: () => {
                    closeCustomerSidebar();
                    openDetails('device_types', selectedCustomer);
                  },
                },
                {
                  label: 'View Groups',
                  onClick: () => {
                    closeCustomerSidebar();
                    openDetails('groups', selectedCustomer);
                  },
                },
              ],
            }}
            sections={customerSidebarSections}
          />
        )}
      </div>

      <Modal show={detailsModal.open} onHide={closeDetails} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {detailsModal.row?.customer ?? 'Customer'}{' '}
            {detailsModal.mode === 'device_types' ? 'Device Types' : 'Groups'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailsModal.mode === 'device_types' ? (
            <div className="d-flex flex-wrap gap-2">
              {(detailsModal.row?.device_types ?? []).length > 0 ? (
                (detailsModal.row?.device_types ?? []).map((t) => (
                  <Badge key={t} bg="secondary">
                    {t}
                  </Badge>
                ))
              ) : (
                <div className="text-muted">No device types.</div>
              )}
            </div>
          ) : (
            <React.Fragment>
              {(detailsModal.row?.groups ?? []).length > 0 ? (
                <Table responsive bordered hover size="sm" className="mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: '110px' }}>Group ID</th>
                      <th>Path</th>
                      <th style={{ width: '160px' }}>Device Type</th>
                      <th style={{ width: '90px' }}>Hosts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detailsModal.row?.groups ?? []).map((g) => (
                      <tr key={g.groupid}>
                        <td>{g.groupid}</td>
                        <td>{g.name ?? '-'}</td>
                        <td>{(g.device_type as string) ?? '-'}</td>
                        <td>
                          {typeof g.host_count === 'number'
                            ? g.host_count
                            : Number(g.host_count) || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-muted">No groups.</div>
              )}
            </React.Fragment>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeDetails}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx global>{`
        .pulse-customers-page .customers-btn {
          padding: 9px 13px;
          background-color: rgb(0, 0, 0);
          color: rgb(255, 255, 255);
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          min-height: 40px;
          line-height: 1;
        }

        .pulse-customers-page .customers-btn:hover,
        .pulse-customers-page .customers-btn:focus {
          background-color: rgb(0, 0, 0);
          color: rgb(255, 255, 255);
          opacity: 0.92;
        }

        .pulse-customers-page .customers-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .pulse-customers-page .gt-toolbar-search input,
        .pulse-customers-page .gt-toolbar-search .form-control {
          min-height: 40px;
          height: 40px;
          font-size: 12px;
        }

        .pulse-customers-page .gt-toolbar-search button,
        .pulse-customers-page .gt-toolbar-search .btn {
          min-height: 40px;
          height: 40px;
          padding: 9px 13px;
          font-size: 12px;
          font-weight: 500;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .pulse-customers-page .customers-table-pane {
          min-height: 0;
        }

        .pulse-customers-page .customers-table-pane .generic-table-responsive.fixed-height-table {
          min-height: 0;
        }
      `}</style>
    </React.Fragment>
  );
};

PulseCustomers.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default PulseCustomers;

