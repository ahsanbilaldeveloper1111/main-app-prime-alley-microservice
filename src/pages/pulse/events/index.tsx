import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState, useCallback } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericTable, { TableColumn } from '@components/GenericTable';
import { getEvents, ZabbixEventRow } from '@utils/zabbix';
import { Button, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import '@assets/scss/common.scss';
import { FiRefreshCw } from 'react-icons/fi';
import '@assets/scss/tabs.scss';
import { Badge } from 'react-bootstrap';
import AppSelect from '@components/AppSelect';
import Link from 'next/link';

type ValueOption = { value: number; label: string };
const VALUE_OPTIONS: ValueOption[] = [
  { value: 1, label: 'Problems' },
  { value: 0, label: 'Recovery' },
];

const NetopsEvents = () => {
  const [events, setEvents] = useState<ZabbixEventRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedValue, setSelectedValue] = useState<ValueOption>(VALUE_OPTIONS[0]);
  const [pagination, setPagination] = useState({
    offset: 0,
    limit: 25,
    returned: 0,
    has_more: false,
    pageSizeOptions: [10, 15, 25, 50, 100] as number[],
  });

  const fetchEvents = useCallback(async (offset: number, limit: number, value: number) => {
    setLoading(true);
    try {
      const response = await getEvents({
        offset,
        limit,
        value,
      });
      setEvents(response.events ?? []);
      setPagination((prev) => ({
        ...prev,
        offset: response.offset,
        limit: response.limit,
        returned: response.returned,
        has_more: response.has_more,
      }));
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch events');
      setEvents([]);
      setPagination((prev) => ({ ...prev, offset: 0, returned: 0, has_more: false }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(0, pagination.limit, selectedValue.value);
  }, [fetchEvents, pagination.limit, selectedValue.value]);

  const handleRefresh = () => fetchEvents(0, pagination.limit, selectedValue.value);

  const computedTotalRows =
    pagination.has_more ? pagination.offset + pagination.limit + 1 : pagination.offset + events.length;

  const badgeVariantForSeverityClass = (severityClass?: string) => {
    const s = (severityClass ?? '').toLowerCase();
    if (s === 'danger' || s === 'error' || s === 'critical') return 'danger';
    if (s === 'warning') return 'warning';
    if (s === 'success' || s === 'ok') return 'success';
    if (s === 'info') return 'info';
    if (s === 'primary') return 'primary';
    return 'secondary';
  };

  const tableColumns: TableColumn<ZabbixEventRow>[] = [
    {
      key: 'time',
      label: 'Time',
      sortable: true,
      render: (row) => <span>{row.time ?? '-'}</span>,
    },
    {
      key: 'customer',
      label: 'Customer',
      sortable: true,
      render: (row) => <span>{row.customer ?? '-'}</span>,
    },
    {
      key: 'device',
      label: 'Device',
      sortable: true,
      render: (row) => {
        const host = row.hosts?.[0];
        if (host?.hostid) {
          return (
            <Link href={`/pulse/hosts/${host.hostid}`} className="badge bg-warning text-dark">
              {host.host ?? host.hostid}
            </Link>
          );
        }
        return <span>{host?.host ?? row.host_names?.[0] ?? '-'}</span>;
      },
    },
    {
      key: 'severity',
      label: 'Severity',
      sortable: true,
      render: (row) => (
        <Badge
          bg={badgeVariantForSeverityClass(row.severity_class)}
          text={row.severity_class?.toLowerCase() === 'warning' ? 'dark' : undefined}
          className="text-capitalize"
        >
          {row.severity ?? '-'}
        </Badge>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (row) => <span className="text-capitalize">{row.type ?? '-'}</span>,
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
      render: (row) => <span>{row.description ?? '-'}</span>,
    },
    {
      key: 'acknowledged',
      label: 'Acknowledged',
      sortable: true,
      render: (row) =>
        row.acknowledged ? <Badge bg="success">Yes</Badge> : <Badge bg="secondary">No</Badge>,
    },
  ];

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Pulse" mainLink="/pulse/dashboard" subTitle="Events" />

      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2 d-flex justify-content-end align-items-center gap-2 flex-wrap">
            <div style={{ minWidth: '220px', maxWidth: '260px' }}>
              <AppSelect<ValueOption>
                instanceId="pulse-events-value"
                options={VALUE_OPTIONS}
                value={selectedValue}
                onChange={(opt) => {
                  const next = (opt ?? VALUE_OPTIONS[0]) as ValueOption;
                  setSelectedValue(next);
                  fetchEvents(0, pagination.limit, next.value);
                }}
              />
            </div>
            <Button variant="info" onClick={handleRefresh} disabled={loading}>
              <FiRefreshCw size={14} /> Refresh
            </Button>
          </div>
        </Col>
      </Row>

      <GenericTable<ZabbixEventRow>
        data={events}
        columns={tableColumns}
        loading={loading}
        emptyMessage="No events found."
        loadingMessage="Loading events..."
        pagination={{
          currentPage: pagination.limit > 0 ? Math.floor(pagination.offset / pagination.limit) + 1 : 1,
          rowsPerPage: pagination.limit,
          totalRows: computedTotalRows,
          pageSizeOptions: pagination.pageSizeOptions,
        }}
        onPaginationChange={(page, rowsPerPage) => {
          fetchEvents((page - 1) * rowsPerPage, rowsPerPage, selectedValue.value);
        }}
        sortable={true}
        hover={true}
        striped={false}
        uniqueKey="eventid"
      />
    </React.Fragment>
  );
};

NetopsEvents.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default NetopsEvents;
