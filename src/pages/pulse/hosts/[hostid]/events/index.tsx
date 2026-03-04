import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericTable, { TableColumn } from '@components/GenericTable';
import { getHostEvents, ZabbixEventRow } from '@utils/zabbix';
import { Button, Row, Col, Badge, Nav } from 'react-bootstrap';
import { toast } from 'react-toastify';
import '@assets/scss/common.scss';
import { FiRefreshCw } from 'react-icons/fi';
import '@assets/scss/tabs.scss';
import AppSelect from '@components/AppSelect';
import Link from 'next/link';

type ValueOption = { value: number; label: string };
const VALUE_OPTIONS: ValueOption[] = [
  { value: 1, label: 'Problems' },
  { value: 0, label: 'Recovery' },
];

const HostEvents = () => {
  const router = useRouter();
  const hostid = useMemo(() => {
    const raw = router.query.hostid;
    return typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '';
  }, [router.query.hostid]);

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

  const fetchEvents = useCallback(
    async (offset: number, limit: number, value: number) => {
      if (!hostid) return;
      setLoading(true);
      try {
        const response = await getHostEvents(hostid, { offset, limit, value });
        setEvents(response.events ?? []);
        setPagination((prev) => ({
          ...prev,
          offset: response.offset,
          limit: response.limit,
          returned: response.returned,
          has_more: response.has_more,
        }));
      } catch (error) {
        console.error('Error fetching host events:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to fetch host events');
        setEvents([]);
        setPagination((prev) => ({ ...prev, offset: 0, returned: 0, has_more: false }));
      } finally {
        setLoading(false);
      }
    },
    [hostid]
  );

  useEffect(() => {
    if (!router.isReady) return;
    fetchEvents(0, pagination.limit, selectedValue.value);
  }, [router.isReady, fetchEvents, pagination.limit, selectedValue.value]);

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
    { key: 'time', label: 'Time', sortable: true, render: (row) => <span>{row.time ?? '-'}</span> },
    { key: 'customer', label: 'Customer', sortable: true, render: (row) => <span>{row.customer ?? '-'}</span> },
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
    { key: 'type', label: 'Type', sortable: true, render: (row) => <span className="text-capitalize">{row.type ?? '-'}</span> },
    { key: 'description', label: 'Description', sortable: true, render: (row) => <span>{row.description ?? '-'}</span> },
    {
      key: 'acknowledged',
      label: 'Acknowledged',
      sortable: true,
      render: (row) => (row.acknowledged ? <Badge bg="success">Yes</Badge> : <Badge bg="secondary">No</Badge>),
    },
  ];

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Pulse" mainLink="/pulse/dashboard" subTitle="Hosts" />
      <BreadcrumbItem mainTitle="Hosts" mainLink="/pulse/hosts" subTitle={`Host ${hostid || ''}`} />

      <Nav variant="tabs" className="mb-3">
        <Nav.Item>
          <Nav.Link as={Link} href={hostid ? `/pulse/hosts/${hostid}` : '/pulse/hosts'} active={false}>
            Overview
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={Link} href={hostid ? `/pulse/hosts/${hostid}/events` : '/pulse/hosts'} active>
            Events
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={Link} href={hostid ? `/pulse/hosts/${hostid}/graphs` : '/pulse/hosts'} active={false}>
            Graphs
          </Nav.Link>
        </Nav.Item>
      </Nav>

      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2 d-flex justify-content-end align-items-center gap-2 flex-wrap">
            <div style={{ minWidth: '220px', maxWidth: '260px' }}>
              <AppSelect<ValueOption>
                instanceId="pulse-host-events-value"
                options={VALUE_OPTIONS}
                value={selectedValue}
                onChange={(opt) => {
                  const next = (opt ?? VALUE_OPTIONS[0]) as ValueOption;
                  setSelectedValue(next);
                  fetchEvents(0, pagination.limit, next.value);
                }}
              />
            </div>
            <Button variant="info" onClick={handleRefresh} disabled={loading || !hostid}>
              <FiRefreshCw size={14} /> Refresh
            </Button>
          </div>
        </Col>
      </Row>

      <GenericTable<ZabbixEventRow>
        data={events}
        columns={tableColumns}
        loading={loading}
        emptyMessage={hostid ? 'No events found.' : 'Host ID not found.'}
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
        sortable
        hover
        striped={false}
        uniqueKey="eventid"
      />
    </React.Fragment>
  );
};

HostEvents.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default HostEvents;

