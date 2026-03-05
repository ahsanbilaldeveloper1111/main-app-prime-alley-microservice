import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { getHosts, ZabbixHost } from '@utils/zabbix';
import { Badge, Button, Card, Col, Nav, Row, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import '@assets/scss/common.scss';
import { FiRefreshCw } from 'react-icons/fi';
import '@assets/scss/tabs.scss';
import Link from 'next/link';

const HostDetails = () => {
  const router = useRouter();
  const hostid = useMemo(() => {
    const raw = router.query.hostid;
    return typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '';
  }, [router.query.hostid]);

  const [loading, setLoading] = useState(false);
  const [host, setHost] = useState<ZabbixHost | null>(null);

  const fetchHost = useCallback(async () => {
    if (!hostid) return;
    setLoading(true);
    try {
      const res = await getHosts({
        hostids: [hostid],
        output: ['hostid', 'host', 'name', 'status', 'description'],
        selectInterfaces: ['interfaceid', 'ip', 'dns', 'port'],
        selectGroups: ['groupid', 'name'],
        selectParentTemplates: ['templateid', 'name'],
        limit: 1,
        offset: 0,
      } as any);
      const row = res.hosts?.[0] ?? null;
      setHost(row);
    } catch (error) {
      console.error('Error fetching host details:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch host details');
      setHost(null);
    } finally {
      setLoading(false);
    }
  }, [hostid]);

  useEffect(() => {
    if (!router.isReady) return;
    fetchHost();
  }, [router.isReady, fetchHost]);

  const baseHref = hostid ? `/pulse/hosts/${hostid}` : '/pulse/hosts';
  const eventsHref = hostid ? `/pulse/hosts/${hostid}/events` : '/pulse/hosts';
  const graphsHref = hostid ? `/pulse/hosts/${hostid}/graphs` : '/pulse/hosts';

  const isEvents = router.asPath.includes('/events');
  const isGraphs = router.asPath.includes('/graphs');
  const isOverview = !isEvents && !isGraphs;

  const statusNum = Number(host?.status);

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Pulse" mainLink="/pulse/dashboard" subTitle="Hosts" />
      <BreadcrumbItem mainTitle="Hosts" mainLink="/pulse/hosts" subTitle={host?.name ?? host?.host ?? hostid ?? 'Host'} />

      <Row className="mb-3">
        <Col md={12} className="d-flex justify-content-end">
          <Button variant="info" onClick={fetchHost} disabled={loading || !hostid}>
            <FiRefreshCw size={14} /> Refresh
          </Button>
        </Col>
      </Row>

      <Nav variant="tabs" className="mb-3">
        <Nav.Item>
          <Nav.Link as={Link} href={baseHref} active={isOverview}>
            Overview
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={Link} href={eventsHref} active={isEvents}>
            Events
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={Link} href={graphsHref} active={isGraphs}>
            Graphs
          </Nav.Link>
        </Nav.Item>
      </Nav>

      <Card>
        <Card.Body>
          {loading && !host ? (
            <div className="py-4 text-center">
              <Spinner animation="border" role="status" />
            </div>
          ) : !hostid ? (
            <div className="text-muted">Host ID not found.</div>
          ) : !host ? (
            <div className="text-muted">Host not found.</div>
          ) : (
            <Row className="g-3">
              <Col md={6}>
                <div className="text-muted small">Name</div>
                <div className="fw-semibold">{host.name ?? '-'}</div>
              </Col>
              <Col md={6}>
                <div className="text-muted small">Hostname</div>
                <div className="fw-semibold">{host.host ?? '-'}</div>
              </Col>

              <Col md={6}>
                <div className="text-muted small">Status</div>
                <div>
                  {Number.isFinite(statusNum) ? (
                    statusNum === 1 ? (
                      <Badge bg="success">Monitored</Badge>
                    ) : (
                      <Badge bg="danger">Not monitored</Badge>
                    )
                  ) : (
                    <Badge bg="secondary">{host.status ?? '-'}</Badge>
                  )}
                </div>
              </Col>

              <Col md={6}>
                <div className="text-muted small">IP(s)</div>
                <div className="fw-semibold">
                  {host.interfaces?.length ? host.interfaces.map((i) => i.ip ?? i.dns ?? '').filter(Boolean).join(', ') : '-'}
                </div>
              </Col>

              <Col md={6}>
                <div className="text-muted small">Groups</div>
                <div className="fw-semibold">
                  {host.groups?.length ? host.groups.map((g) => g.name ?? g.groupid).join(', ') : '-'}
                </div>
              </Col>

              <Col md={6}>
                <div className="text-muted small">Templates</div>
                <div className="fw-semibold">
                  {host.parentTemplates?.length
                    ? host.parentTemplates.map((t) => t.name ?? t.templateid).join(', ')
                    : '-'}
                </div>
              </Col>

              <Col md={12}>
                <div className="text-muted small">Description</div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{(host.description ?? '').trim() || '-'}</div>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>
    </React.Fragment>
  );
};

HostDetails.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default HostDetails;