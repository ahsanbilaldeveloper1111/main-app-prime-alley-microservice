import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericTable, { TableColumn } from '@components/GenericTable';
import { getHostGraphs, ZabbixGraphRow } from '@utils/zabbix';
import { Button, Row, Col, Badge, Nav } from 'react-bootstrap';
import { toast } from 'react-toastify';
import '@assets/scss/common.scss';
import { FiRefreshCw } from 'react-icons/fi';
import '@assets/scss/tabs.scss';
import Link from 'next/link';

type GraphRow = ZabbixGraphRow & { section: string };

const HostGraphs = () => {
  const router = useRouter();
  const hostid = useMemo(() => {
    const raw = router.query.hostid;
    return typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '';
  }, [router.query.hostid]);

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<GraphRow[]>([]);
  const [total, setTotal] = useState(0);

  const fetchGraphs = useCallback(
    async (searchTerm?: string) => {
      if (!hostid) return;
      setLoading(true);
      try {
        const response = await getHostGraphs(hostid, {
          key_only: true,
          ...(searchTerm?.trim() ? { search: searchTerm.trim() } : {}),
        });

        const nextRows: GraphRow[] = [];
        Object.entries(response.sections ?? {}).forEach(([section, list]) => {
          (list ?? []).forEach((g) => {
            nextRows.push({ section, graphid: g.graphid, name: g.name });
          });
        });

        setRows(nextRows);
        setTotal(response.total ?? nextRows.length);
      } catch (error) {
        console.error('Error fetching host graphs:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to fetch host graphs');
        setRows([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [hostid]
  );

  useEffect(() => {
    if (!router.isReady) return;
    fetchGraphs();
  }, [router.isReady, fetchGraphs]);

  const handleSearch = () => fetchGraphs(search);
  const handleRefresh = () => fetchGraphs(search);

  const tableColumns: TableColumn<GraphRow>[] = [
    {
      key: 'section',
      label: 'Section',
      sortable: true,
      render: (row) => <Badge bg="secondary">{row.section}</Badge>,
    },
    { key: 'name', label: 'Graph', sortable: true },
    { key: 'graphid', label: 'Graph ID', sortable: true },
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
          <Nav.Link as={Link} href={hostid ? `/pulse/hosts/${hostid}/events` : '/pulse/hosts'} active={false}>
            Events
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={Link} href={hostid ? `/pulse/hosts/${hostid}/graphs` : '/pulse/hosts'} active>
            Graphs
          </Nav.Link>
        </Nav.Item>
      </Nav>

      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2 d-flex justify-content-end align-items-center gap-2 flex-wrap">
            <input
              type="text"
              className="form-control"
              placeholder="Search graphs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{ maxWidth: '240px' }}
            />
            <Button variant="primary" onClick={handleSearch} disabled={loading || !hostid}>
              Search
            </Button>
            <Button variant="info" onClick={handleRefresh} disabled={loading || !hostid}>
              <FiRefreshCw size={14} /> Refresh
            </Button>
          </div>
        </Col>
      </Row>

      <Row className="mb-2">
        <Col>
          <span className="text-muted small">{total ? `Total graphs: ${total}` : 'No graphs'}</span>
        </Col>
      </Row>

      <GenericTable<GraphRow>
        data={rows}
        columns={tableColumns}
        loading={loading}
        emptyMessage={hostid ? 'No graphs found.' : 'Host ID not found.'}
        loadingMessage="Loading graphs..."
        sortable
        hover
        striped={false}
        uniqueKey="graphid"
      />
    </React.Fragment>
  );
};

HostGraphs.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default HostGraphs;

