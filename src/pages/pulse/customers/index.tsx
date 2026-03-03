import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { getCustomersV2, ZabbixCustomerGroupRow } from '@utils/zabbix';
import { Button, Row, Col, Badge, Modal, Table, Card, Pagination, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import '@assets/scss/common.scss';
import { FiRefreshCw } from 'react-icons/fi';
import '@assets/scss/tabs.scss';

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
    limit: 10,
    total: 0,
    pageSizeOptions: [10, 15, 25, 50, 100] as number[],
  });

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
        const groups = Array.isArray(response.customers?.[customer])
          ? (response.customers?.[customer] as ZabbixCustomerGroupRow[])
          : [];
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
    fetchCustomers(0, pagination.limit, undefined);
  }, [fetchCustomers, pagination.limit]);

  const handleSearch = () => fetchCustomers(0, pagination.limit, search);
  const handleRefresh = () => fetchCustomers(0, pagination.limit, search);

  const totalCustomersOnPage = useMemo(() => rows.length, [rows]);

  const openDetails = useCallback((mode: DetailsModalMode, row: CustomerTableRow) => {
    setDetailsModal({ open: true, mode, row });
  }, []);

  const closeDetails = useCallback(() => {
    setDetailsModal((prev) => ({ ...prev, open: false }));
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

  const currentPage = useMemo(
    () => (pagination.limit > 0 ? Math.floor(pagination.offset / pagination.limit) + 1 : 1),
    [pagination.limit, pagination.offset]
  );
  const totalPages = useMemo(
    () => (pagination.limit > 0 ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1),
    [pagination.limit, pagination.total]
  );

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Pulse" mainLink="/pulse/dashboard" subTitle="Customers" />

      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2 d-flex justify-content-end align-items-center gap-2 flex-wrap">
            <div className="text-muted me-auto">
              Showing <strong>{totalCustomersOnPage}</strong> customers on this page
            </div>
            <input
              type="text"
              className="form-control"
              placeholder="Search customers..."
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

      {loading ? (
        <div className="text-center text-muted py-5">Loading customers...</div>
      ) : rows.length === 0 ? (
        <div className="text-center text-muted py-5">No customers found.</div>
      ) : (
        <Row className="g-3">
          {rows.map((row) => {
            const typeCount = row.device_types.length;
            const deviceCount = row.host_count_total;

            const perTypeCounts = row.groups.reduce<Record<string, number>>((acc, g) => {
              const dt = String(g.device_type ?? '').trim();
              if (!dt) return acc;
              const n = typeof g.host_count === 'number' ? g.host_count : Number(g.host_count);
              acc[dt] = (acc[dt] ?? 0) + (Number.isFinite(n) ? n : 0);
              return acc;
            }, {});
            const orderedTypes = Object.keys(perTypeCounts).sort((a, b) => a.localeCompare(b));

            return (
              <Col key={row.customer} xl={6} lg={6} md={12}>
                <Card
                  className="h-100"
                  role="button"
                  onClick={() => openDetails('groups', row)}
                  style={{
                    textDecoration: 'none',
                    display: 'block',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.25rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '2rem' }}>🏢</span>
                        <div>
                          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{row.customer}</h3>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            {pluralize(deviceCount, 'total device')} • {pluralize(typeCount, 'type')}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '0.5rem 0.75rem',
                        background: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: '0.5rem',
                        border: '1px solid #10b981',
                      }}
                    >
                      <span style={{ fontSize: '1.5rem' }}>🟢</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981', marginTop: '0.25rem' }}>
                        Healthy
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '0.75rem',
                      marginBottom: '1rem',
                    }}
                  >
                    {orderedTypes.length > 0 ? (
                      orderedTypes.map((dt) => (
                        <div
                          key={dt}
                          role="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openDetails('device_types', row);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 0.75rem',
                            background: 'var(--row-even)',
                            borderRadius: '0.375rem',
                            borderLeft: '3px solid var(--primary)',
                            cursor: 'pointer',
                          }}
                        >
                          <span style={{ fontSize: '1.25rem' }}>{deviceTypeIcon(dt)}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{dt}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {pluralize(perTypeCounts[dt] ?? 0, 'device')}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-muted">No device types</div>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '1rem',
                      borderTop: '1px solid var(--border)',
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>⏱️</span>
                      <span>Updated just now</span>
                    </div>
                    <div style={{ color: 'var(--primary)', fontWeight: 600 }}>View Details →</div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      <Row className="mt-3 align-items-center g-2">
        <Col md={6} className="text-muted">
          Showing <strong>{totalCustomersOnPage}</strong> of <strong>{pagination.total}</strong> customers
        </Col>
        <Col md={6} className="d-flex justify-content-end align-items-center gap-2 flex-wrap">
          <div style={{ minWidth: 120 }}>
            <Form.Select
              value={pagination.limit}
              onChange={(e) => {
                const next = Number(e.target.value) || 10;
                setPagination((prev) => ({ ...prev, limit: next, offset: 0 }));
                fetchCustomers(0, next, search);
              }}
              disabled={loading}
            >
              {pagination.pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </Form.Select>
          </div>
          <Pagination className="mb-0">
            <Pagination.Prev
              disabled={loading || currentPage <= 1}
              onClick={() => fetchCustomers(Math.max(0, (currentPage - 2) * pagination.limit), pagination.limit, search)}
            />
            <Pagination.Item active>{currentPage}</Pagination.Item>
            <Pagination.Item disabled>of {totalPages}</Pagination.Item>
            <Pagination.Next
              disabled={loading || currentPage >= totalPages}
              onClick={() => fetchCustomers(currentPage * pagination.limit, pagination.limit, search)}
            />
          </Pagination>
        </Col>
      </Row>

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
                        <td>{typeof g.host_count === 'number' ? g.host_count : Number(g.host_count) || 0}</td>
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
    </React.Fragment>
  );
};

PulseCustomers.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default PulseCustomers;

