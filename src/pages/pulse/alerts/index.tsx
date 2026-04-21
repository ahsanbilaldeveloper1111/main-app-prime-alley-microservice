import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState, useCallback, useMemo } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericTable, { TableColumn, ToolbarConfig, TabConfig } from '@components/GenericTable';
import { getAlerts, ZabbixAlertRow } from '@utils/zabbix';
import { Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import '@assets/scss/common.scss';
import { FiRefreshCw } from 'react-icons/fi';
import '@assets/scss/tabs.scss';
import { Search } from 'lucide-react';
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
    limit: 20,
    total: 0,
    pageSizeOptions: [10, 20, 25, 50, 100] as number[],
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
      const acknowledgedFilter = acknowledged === undefined ? {} : { acknowledged };
      const response = await getAlerts({
        offset,
        limit,
        ...(severity ? { severity } : {}),
        ...acknowledgedFilter,
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

  const handleSeverityChangeRaw = useCallback((opt: any) => {
    const next = (opt ?? null) as SeverityOption | null;
    setSelectedSeverity(next);
    fetchAlerts(0, pagination.limit, search, next?.value, selectedAcknowledged?.value);
  }, [fetchAlerts, pagination.limit, search, selectedAcknowledged?.value]);

  const handleAcknowledgedChangeRaw = useCallback((opt: any) => {
    const next = (opt ?? null) as AcknowledgedOption | null;
    setSelectedAcknowledged(next);
    fetchAlerts(0, pagination.limit, search, selectedSeverity?.value, next?.value);
  }, [fetchAlerts, pagination.limit, search, selectedSeverity?.value]);

  const alertTabs: TabConfig[] = useMemo(
    () => [
      {
        id: 'alerts',
        label: 'Alerts',
        count: pagination.total,
        removable: false,
      },
    ],
    [pagination.total]
  );

  const alertsToolbarConfig: ToolbarConfig = useMemo(
    () => ({
      showSearch: true,
      searchValue: search,
      searchPlaceholder: 'Search alerts...',
      onSearchChange: setSearch,
      onSearch: handleSearch,
      showTabs: true,
      tabs: alertTabs,
      activeTab: 'alerts',
      onTabChange: () => {},
      showTableViewDropdown: false,
      customActions: (
        <div className="d-flex align-items-center gap-2 flex-wrap alerts-toolbar-buttons">
          <button className="alerts-btn" onClick={handleSearch} disabled={loading}>
            <Search size={14} /> Search
          </button>
          <button className="alerts-btn" onClick={handleRefresh} disabled={loading}>
            <FiRefreshCw size={14} /> Refresh
          </button>
        </div>
      ),
      rightActions: (
        <div className="d-flex align-items-center gap-2">
          <div className="alerts-filter-select" style={{ minWidth: '180px', maxWidth: '220px' }}>
            <AppSelect<SeverityOption>
              instanceId="pulse-alerts-severity"
              classNamePrefix="alerts-select"
              placeholder="All severities"
              isClearable
              options={SEVERITY_OPTIONS}
              value={selectedSeverity}
              onChange={handleSeverityChangeRaw}
            />
          </div>
          <div className="alerts-filter-select" style={{ minWidth: '180px', maxWidth: '220px' }}>
            <AppSelect<AcknowledgedOption>
              instanceId="pulse-alerts-acknowledged"
              classNamePrefix="alerts-select"
              placeholder="All acknowledgements"
              isClearable
              options={ACKNOWLEDGED_OPTIONS}
              value={selectedAcknowledged}
              onChange={handleAcknowledgedChangeRaw}
            />
          </div>
        </div>
      ),
    }),
    [
      alertTabs,
      handleAcknowledgedChangeRaw,
      handleRefresh,
      handleSearch,
      handleSeverityChangeRaw,
      loading,
      search,
      selectedAcknowledged,
      selectedSeverity,
    ]
  );

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Pulse" mainLink="/pulse/dashboard" subTitle="Alerts" />

      <div
        className="pulse-alerts-page"
        style={{
          display: 'flex',
          gap: '0',
          height: 'calc(100vh)',
          overflow: 'hidden',
        }}
      >
        <div className="alerts-table-pane" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <GenericTable<ZabbixAlertRow>
            data={alerts}
            columns={tableColumns}
            loading={loading}
            showToolbarActions={false}
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
            showToolbar={true}
            toolbar={alertsToolbarConfig}
            fixedHeight={true}
            maxHeight="calc(100vh - 295px)"
          />
        </div>
      </div>

      <style jsx global>{`
        .pulse-alerts-page .alerts-btn {
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

        .pulse-alerts-page .alerts-btn:hover,
        .pulse-alerts-page .alerts-btn:focus {
          background-color: rgb(0, 0, 0);
          color: rgb(255, 255, 255);
          opacity: 0.92;
        }

        .pulse-alerts-page .alerts-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .pulse-alerts-page .gt-toolbar-search input,
        .pulse-alerts-page .gt-toolbar-search .form-control {
          min-height: 40px;
          height: 40px;
          font-size: 12px;
        }

        .pulse-alerts-page .gt-toolbar-search button,
        .pulse-alerts-page .gt-toolbar-search .btn {
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

        .pulse-alerts-page .alerts-filter-select {
          min-height: 40px;
        }

        .pulse-alerts-page .alerts-select__control {
          min-height: 40px;
          height: 40px;
          border-radius: 4px;
        }

        .pulse-alerts-page .alerts-select__value-container {
          min-height: 40px;
          padding: 0 10px;
          font-size: 12px;
        }

        .pulse-alerts-page .alerts-select__indicators {
          min-height: 40px;
        }

        .pulse-alerts-page .generic-table-container,
        .pulse-alerts-page .generic-table-card,
        .pulse-alerts-page .gt-toolbar-container,
        .pulse-alerts-page .gt-toolbar-main,
        .pulse-alerts-page .gt-toolbar-tabs-section {
          overflow: visible;
        }

        .pulse-alerts-page .gt-toolbar-container {
          position: relative;
          z-index: 20;
        }

        .pulse-alerts-page .alerts-select__menu {
          z-index: 30;
        }

        .pulse-alerts-page .alerts-table-pane {
          min-height: 0;
        }

        .pulse-alerts-page .alerts-table-pane .generic-table-responsive.fixed-height-table {
          min-height: 0;
        }
      `}</style>
    </React.Fragment>
  );
};

Alerts.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default Alerts;
