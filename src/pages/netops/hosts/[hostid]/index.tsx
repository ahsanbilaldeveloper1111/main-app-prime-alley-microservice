import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericTable, { TableColumn } from '@components/GenericTable';
import { getItemsByHostId, getHosts, ZebbixItem, ZebbixHost } from '@utils/zebbix';
import { Button, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import '@assets/scss/common.scss';
import { FiRefreshCw, FiArrowLeft } from 'react-icons/fi';
import '@assets/scss/tabs.scss';

const HostItemsDetail = () => {
  const router = useRouter();
  const hostid = router.query.hostid as string | undefined;
  const [items, setItems] = useState<ZebbixItem[]>([]);
  const [host, setHost] = useState<ZebbixHost | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const tableColumns: TableColumn<ZebbixItem>[] = [
    { key: 'itemid', label: 'Item ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    {
      key: 'key_',
      label: 'Key',
      sortable: true,
      render: (row) => <code>{row.key_ ?? '-'}</code>,
    },
    { key: 'lastvalue', label: 'Last Value', sortable: true },
    { key: 'units', label: 'Units', sortable: true },
  ];

  const fetchItems = useCallback(async () => {
    if (!hostid) return;
    setLoading(true);
    try {
      const [itemsRes, hostsRes] = await Promise.all([
        getItemsByHostId(hostid),
        getHosts(),
      ]);
      if (itemsRes.error) {
        toast.error(itemsRes.error.message || 'Failed to fetch items');
        setItems([]);
      } else {
        const list = itemsRes.result ?? [];
        setItems(Array.isArray(list) ? list : []);
      }
      if (hostsRes.result && Array.isArray(hostsRes.result)) {
        const found = (hostsRes.result as ZebbixHost[]).find((h) => h.hostid === hostid);
        setHost(found ?? null);
      }
    } catch (error) {
      console.error('Error fetching host items:', error);
      toast.error('Failed to fetch items');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [hostid]);

  useEffect(() => {
    if (hostid) fetchItems();
  }, [hostid, refreshKey, fetchItems]);

  const handleBack = () => router.push('/netops/hosts');
  const handleRefresh = () => setRefreshKey((k) => k + 1);

  const hostName = host?.name ?? host?.host ?? `Host ${hostid}`;

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="NetOps" mainLink="/netops/dashboard" subTitle="Hosts" />
      <BreadcrumbItem mainTitle="Hosts" mainLink="/netops/hosts" subTitle={hostName} />

      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2">
            <Row className="d-flex justify-content-between align-items-center">
              <Col md={6}>
                <h2 className="mb-0">Host Items — {hostName}</h2>
                {hostid && (
                  <small className="text-muted">Host ID: {hostid}</small>
                )}
              </Col>
              <Col md={6} className="d-flex justify-content-end align-items-center gap-2">
                <Button variant="outline-secondary" onClick={handleBack}>
                  <FiArrowLeft size={14} /> Back to Hosts
                </Button>
                <Button variant="info" onClick={handleRefresh} disabled={loading}>
                  <FiRefreshCw size={14} /> Refresh
                </Button>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      <GenericTable<ZebbixItem>
        data={items}
        columns={tableColumns}
        loading={loading}
        emptyMessage="No items found for this host."
        loadingMessage="Loading items..."
        sortable={true}
        hover={true}
        striped={false}
        uniqueKey="itemid"
      />
    </React.Fragment>
  );
};

HostItemsDetail.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default HostItemsDetail;
