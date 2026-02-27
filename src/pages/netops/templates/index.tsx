import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState, useCallback } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericTable, { TableColumn } from '@components/GenericTable';
import {  getHosts, ZebbixAlert, ZebbixHost } from '@utils/zebbix';
import { getTemplates } from '@utils/zabbix';
import { Button, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import '@assets/scss/common.scss';
import { FiRefreshCw } from 'react-icons/fi';
import '@assets/scss/tabs.scss';

const SEVERITY_LABELS: Record<string, string> = {
  '0': 'Not classified',
  '1': 'Information',
  '2': 'Warning',
  '3': 'Average',
  '4': 'High',
  '5': 'Disaster',
};

const formatClock = (clock: string) => {
  const num = parseInt(clock, 10);
  if (isNaN(num)) return clock;
  const d = new Date(num * 1000);
  return d.toLocaleString();
};

const NetopsTemplates = () => {
  const [alerts, setAlerts] = useState<ZebbixAlert[]>([]);
  const [hosts, setHosts] = useState<ZebbixHost[]>([]);
  const [selectedHostId, setSelectedHostId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchValue, setSearchValue] = useState('');
  const [tablePagination, setTablePagination] = useState({
    currentPage: 1,
    rowsPerPage: 15,
    totalRows: 0,
    pageSizeOptions: [10, 15, 25, 50, 100] as number[],
  });

  const tableColumns: TableColumn<ZebbixAlert>[] = [
    { key: 'templateid', label: 'Template ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    {
      key: 'host',
      label: 'Template Groups',
      sortable: true,
      render: (row) => row.hosts?.[0]?.host ?? '-',
    },
  ];

  const fetchHosts = useCallback(async () => {
    try {
      const response = await getHosts();
      if (response.error || !response.result) return;
      const list = response.result ?? [];
      setHosts(Array.isArray(list) ? list : []);
      if (list.length > 0 && !selectedHostId) {
        setSelectedHostId((list[0] as ZebbixHost).hostid);
      }
    } catch (error) {
      console.error('Error fetching hosts:', error);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    if (!selectedHostId) {
      setAlerts([]);
      return;
    }
    setLoading(true);
    try {
      const response = await getTemplates({
        // hostids: [selectedHostId]
        output: ["templateid", "name"],
        selectHosts: ["host"],
      });
      if (response?.error) {
        toast.error(response.error.message || 'Failed to fetch templates');
        setAlerts([]);
        return;
      }
      const list =
        Array.isArray((response as any)?.result)
          ? (response as any).result
          : Array.isArray((response as any)?.data?.result)
            ? (response as any).data.result
            : Array.isArray((response as any)?.data)
              ? (response as any).data
              : [];
      setAlerts(list);
      setTablePagination((prev) => ({
        ...prev,
        totalRows: list.length,
        currentPage: 1,
      }));
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Failed to fetch alerts');
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedHostId]);

  useEffect(() => {
    fetchHosts();
  }, [refreshKey]);

  useEffect(() => {
    fetchTemplates();
  }, [selectedHostId, refreshKey, fetchTemplates]);

  const handleRefresh = () => setRefreshKey((k) => k + 1);

  const filteredAlerts = searchValue.trim()
    ? alerts.filter(
        (a) =>
          a.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
          a.eventid?.toLowerCase().includes(searchValue.toLowerCase()) ||
          a.hosts?.[0]?.host?.toLowerCase().includes(searchValue.toLowerCase())
      )
    : alerts;

  const paginatedData = filteredAlerts.slice(
    (tablePagination.currentPage - 1) * tablePagination.rowsPerPage,
    tablePagination.currentPage * tablePagination.rowsPerPage
  );

  const summaryCards: SummaryCard[] = [
    {
      id: 'total-alerts',
      title: 'Total Alerts',
      value: alerts.length,
      description: 'Alerts for selected host',
      delay: 0.1,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: 'style-2',
    },
  ];

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Hosts" mainLink="/netops/templates" subTitle="Templates" />

      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2">
            <Row className="d-flex justify-content-between align-items-center">
              <Col md={4}>
                <h2 className="mb-0">Templates</h2>
              </Col>
              <Col md={8} className="d-flex justify-content-end align-items-center gap-2 flex-wrap">
                {/* <select
                  className="form-select"
                  value={selectedHostId}
                  onChange={(e) => setSelectedHostId(e.target.value)}
                  style={{ maxWidth: '280px' }}
                >
                  <option value="">Select host</option>
                  {hosts.map((h) => (
                    <option key={h.hostid} value={h.hostid}>
                      {h.name ?? h.host ?? h.hostid}
                    </option>
                  ))}
                </select> */}
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search alerts..."
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

      <GenericTable<ZebbixAlert>
        data={paginatedData}
        columns={tableColumns}
        loading={loading}
        emptyMessage={selectedHostId ? 'No templates found for this host.' : 'Select a host to view templates.'}
        loadingMessage="Loading templates..."
        pagination={{
          currentPage: tablePagination.currentPage,
          rowsPerPage: tablePagination.rowsPerPage,
          totalRows: filteredAlerts.length,
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
        uniqueKey="eventid"
      />
    </React.Fragment>
  );
};

NetopsTemplates.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default NetopsTemplates;
