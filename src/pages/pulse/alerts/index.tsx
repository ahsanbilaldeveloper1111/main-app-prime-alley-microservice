import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState, useCallback } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericTable, { TableColumn } from '@components/GenericTable';
import { getAlerts, ZabbixAlertRow } from '@utils/zabbix';
import { Button, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import '@assets/scss/common.scss';
import { FiRefreshCw } from 'react-icons/fi';
import '@assets/scss/tabs.scss';
import { Badge } from 'react-bootstrap';
import AppSelect from '@components/AppSelect';

type SeverityOption = { value: string; label: string };
type AcknowledgedOption = { value: boolean; label: string };

const SEVERITY_OPTIONS: SeverityOption[] = [
  { value: 'not_classified', label: 'Not classified' },
  { value: 'information', label: 'Information' },
  { value: 'warning', label: 'Warning' },
  { value: 'average', label: 'Average' },
  { value: 'high', label: 'High' },
  { value: 'disaster', label: 'Disaster' },
];

const ACKNOWLEDGED_OPTIONS: AcknowledgedOption[] = [
  { value: true, label: 'Acknowledged' },
  { value: false, label: 'Unacknowledged' },
];

const Alerts = () => {
  const [alerts, setAlerts] = useState<ZabbixAlertRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityOption | null>(null);
  const [selectedAcknowledged, setSelectedAcknowledged] = useState<AcknowledgedOption | null>(null);
  const [pagination, setPagination] = useState({
    offset: 0,
    limit: 10,
    total: 0,
    pageSizeOptions: [10, 15, 25, 50, 100] as number[],
  });

  const fetchAlerts = useCallback(
    async (
      offset: number,
      limit: number,
      searchTerm?: string,
      severity?: string,
      acknowledged?: boolean
    ) => {
    setLoading(true);
    try {
      const response = await getAlerts({
        offset,
        limit,
        ...(severity ? { severity } : {}),
        ...(acknowledged !== undefined ? { acknowledged } : {}),
        ...(searchTerm?.trim() ? { search: searchTerm.trim() } : {}),
      });
      setAlerts(response.alerts ?? []);
      setPagination((prev) => ({
        ...prev,
        offset: response.offset,
        limit: response.limit,
        total: response.total,
      }));
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch alerts');
      setAlerts([]);
      setPagination((prev) => ({ ...prev, offset: 0, total: 0 }));
    } finally {
      setLoading(false);
    }
    },
    []
  );

  useEffect(() => {
    fetchAlerts(
      0,
      pagination.limit,
      undefined,
      selectedSeverity?.value,
      selectedAcknowledged?.value
    );
  }, [fetchAlerts, pagination.limit, selectedSeverity?.value, selectedAcknowledged?.value]);

  const badgeVariantForSeverityClass = (severityClass?: string) => {
    const s = (severityClass ?? '').toLowerCase();
    if (s === 'danger' || s === 'error') return 'danger';
    if (s === 'warning') return 'warning';
    if (s === 'success') return 'success';
    if (s === 'info') return 'info';
    if (s === 'primary') return 'primary';
    if (s === 'secondary') return 'secondary';
    return 'secondary';
  };

  const tableColumns: TableColumn<ZabbixAlertRow>[] = [
    { key: 'description', label: 'Description', sortable: true },
    {
      key: 'severity',
      label: 'Severity',
      sortable: true,
      render: (row) => (
        <Badge bg={badgeVariantForSeverityClass(row.severity_class)} className="text-capitalize">
          {row.severity ?? '-'}
        </Badge>
      ),
    },
    {
      key: 'time',
      label: 'Time',
      sortable: true,
      render: (row) => <span>{row.time ?? '-'}</span>,
    },
    {
      key: 'hostname',
      label: 'Host',
      sortable: true,
      render: (row) => <span>{row.hostname ?? '-'}</span>,
    },
    {
      key: 'customer',
      label: 'Customer',
      sortable: true,
      render: (row) => <span>{row.customer ?? '-'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => <span className="text-capitalize">{row.status ?? '-'}</span>,
    },
    {
      key: 'acknowledged',
      label: 'Acknowledged',
      sortable: true,
      render: (row) =>
        row.acknowledged ? <Badge bg="success">Yes</Badge> : <Badge bg="secondary">No</Badge>,
    },
  ];

  const handleSearch = () =>
    fetchAlerts(0, pagination.limit, search, selectedSeverity?.value, selectedAcknowledged?.value);
  const handleRefresh = () =>
    fetchAlerts(0, pagination.limit, search, selectedSeverity?.value, selectedAcknowledged?.value);

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Pulse" mainLink="/pulse/dashboard" subTitle="Alerts" />

      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2 d-flex justify-content-end align-items-center gap-2 flex-wrap">
            <div style={{ minWidth: '220px', maxWidth: '260px' }}>
              <AppSelect<SeverityOption>
                instanceId="pulse-alerts-severity"
                placeholder="All severities"
                isClearable
                options={SEVERITY_OPTIONS}
                value={selectedSeverity}
                onChange={(opt) => {
                  const next = (opt ?? null) as SeverityOption | null;
                  setSelectedSeverity(next);
                  fetchAlerts(0, pagination.limit, search, next?.value, selectedAcknowledged?.value);
                }}
              />
            </div>
            <div style={{ minWidth: '220px', maxWidth: '260px' }}>
              <AppSelect<AcknowledgedOption>
                instanceId="pulse-alerts-acknowledged"
                placeholder="All acknowledgements"
                isClearable
                options={ACKNOWLEDGED_OPTIONS}
                value={selectedAcknowledged}
                onChange={(opt) => {
                  const next = (opt ?? null) as AcknowledgedOption | null;
                  setSelectedAcknowledged(next);
                  fetchAlerts(0, pagination.limit, search, selectedSeverity?.value, next?.value);
                }}
              />
            </div>
            {/* <input
              type="text"
              className="form-control"
              placeholder="Search alerts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{ maxWidth: '240px' }}
            /> */}
            {/* <Button variant="primary" onClick={handleSearch} disabled={loading}>
              Search
            </Button> */}
            <Button variant="info" onClick={handleRefresh} disabled={loading}>
              <FiRefreshCw size={14} /> Refresh
            </Button>
          </div>
        </Col>
      </Row>

      <GenericTable<ZabbixAlertRow>
        data={alerts}
        columns={tableColumns}
        loading={loading}
        emptyMessage="No alerts found."
        loadingMessage="Loading alerts..."
        pagination={{
          currentPage: pagination.limit > 0 ? Math.floor(pagination.offset / pagination.limit) + 1 : 1,
          rowsPerPage: pagination.limit,
          totalRows: pagination.total,
          pageSizeOptions: pagination.pageSizeOptions,
        }}
        onPaginationChange={(page, rowsPerPage) => {
          fetchAlerts(
            (page - 1) * rowsPerPage,
            rowsPerPage,
            search,
            selectedSeverity?.value,
            selectedAcknowledged?.value
          );
        }}
        sortable={true}
        hover={true}
        striped={false}
        uniqueKey="alertid"
      />
    </React.Fragment>
  );
};

Alerts.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default Alerts;
