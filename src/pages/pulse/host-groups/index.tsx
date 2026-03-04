import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState, useCallback } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericTable, { TableColumn } from '@components/GenericTable';
import { getHostGroups, ZabbixHostGroup } from '@utils/zabbix';
import { Button, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import '@assets/scss/common.scss';
import { FiRefreshCw } from 'react-icons/fi';
import '@assets/scss/tabs.scss';

const HostGroups = () => {
  const [groups, setGroups] = useState<ZabbixHostGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    offset: 0,
    limit: 10,
    total: 0,
    pageSizeOptions: [10, 15, 25, 50, 100] as number[],
  });

  const fetchHostGroups = useCallback(async (offset: number, limit: number, searchTerm?: string) => {
    setLoading(true);
    try {
      const params: Parameters<typeof getHostGroups>[0] = {
        output: ['groupid', 'name'],
        selectHosts: ['hostid'],
        offset,
        limit,
      };
      const key = searchTerm?.trim();
      if (key) params.search = key;
      const response = await getHostGroups(params);
      const data = response.hostgroups ?? [];
      setGroups(data);
      setPagination((prev) => ({
        ...prev,
        offset: response.offset,
        limit: response.limit,
        total: response.total,
      }));
    } catch (error) {
      console.error('Error fetching host groups:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch host groups');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHostGroups(0, 10);
  }, [fetchHostGroups]);

  const handlePrevPage = () => {
    const { offset, limit } = pagination;
    fetchHostGroups(Math.max(0, offset - limit), limit, search);
  };

  const handleNextPage = () => {
    const { offset, limit, total } = pagination;
    if (offset + limit < total) {
      fetchHostGroups(offset + limit, limit, search);
    }
  };

  const handleSearch = () => fetchHostGroups(0, pagination.limit, search);

  const handleRefresh = () => fetchHostGroups(0, pagination.limit, search);

  const hasNextPage = pagination.offset + pagination.limit < pagination.total;

  const tableColumns: TableColumn<ZabbixHostGroup>[] = [
    { key: 'name', label: 'Name', sortable: true },
    {
      key: 'host_count',
      label: 'Host count',
      sortable: true,
      render: (row) => (
        <span>{row.host_count ?? (row.hosts ? row.hosts.length : 0)} Hosts</span>
      ),
    },
  ];

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Pulse" mainLink="/pulse/dashboard" subTitle="Hosts" />
      <BreadcrumbItem mainTitle="Hosts" mainLink="/pulse/hosts" subTitle="Host Groups" />

      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2 d-flex justify-content-end align-items-center gap-2 flex-wrap">
            <input
              type="text"
              className="form-control"
              placeholder="Search host groups..."
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

      

      <GenericTable<ZabbixHostGroup>
        data={groups}
        columns={tableColumns}
        loading={loading}
        emptyMessage="No host groups found."
        loadingMessage="Loading host groups..."
        pagination={{
          currentPage: pagination.limit > 0 ? Math.floor(pagination.offset / pagination.limit) + 1 : 1,
          rowsPerPage: pagination.limit,
          totalRows: pagination.total,
          pageSizeOptions: pagination.pageSizeOptions,
        }}
        onPaginationChange={(page, rowsPerPage) => {
          fetchHostGroups((page - 1) * rowsPerPage, rowsPerPage, search);
        }}
        sortable
        hover
        striped={false}
        uniqueKey="groupid"
      />
    </React.Fragment>
  );
};

HostGroups.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default HostGroups;
