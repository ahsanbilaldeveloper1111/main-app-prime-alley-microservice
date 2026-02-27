import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState, useCallback } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericTable, { TableColumn } from '@components/GenericTable';
import { getHostGroups, ZabbixHostGroup } from '@utils/zabbix';
import { Button, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import '@assets/scss/common.scss';
import { FiRefreshCw } from 'react-icons/fi';
import '@assets/scss/tabs.scss';

const HostGroups = () => {
  const [groups, setGroups] = useState<ZabbixHostGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchValue, setSearchValue] = useState('');
  const [tablePagination, setTablePagination] = useState({
    currentPage: 1,
    rowsPerPage: 15,
    totalRows: 0,
    pageSizeOptions: [10, 15, 25, 50, 100] as number[],
  });

  const tableColumns: TableColumn<ZabbixHostGroup>[] = [
    // { key: 'groupid', label: 'Group ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
  ];

  const fetchHostGroups = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getHostGroups({
        output: ["groupid", "name"],
        selectHosts: ["hostid"]
      });
      if (response.error) {
        toast.error(response.error.message || 'Failed to fetch host groups');
        setGroups([]);
        return;
      }
      const list = response.result ?? [];
      const data = Array.isArray(list) ? (list as ZabbixHostGroup[]) : [];
      setGroups(data);
      setTablePagination((prev) => ({
        ...prev,
        totalRows: data.length,
        currentPage: 1,
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
    fetchHostGroups();
  }, [refreshKey, fetchHostGroups]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const filteredGroups = searchValue.trim()
    ? groups.filter(
        (g) =>
          g.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
          g.groupid?.toLowerCase().includes(searchValue.toLowerCase())
      )
    : groups;

  const paginatedData = filteredGroups.slice(
    (tablePagination.currentPage - 1) * tablePagination.rowsPerPage,
    tablePagination.currentPage * tablePagination.rowsPerPage
  );

  const summaryCards: SummaryCard[] = [
    {
      id: 'total-groups',
      title: 'Total Host Groups',
      value: groups.length,
      description: 'Host groups from Zabbix',
      delay: 0.1,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: 'style-2',
    },
  ];

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Pulse" mainLink="/pulse/dashboard" subTitle="Hosts" />
      <BreadcrumbItem mainTitle="Hosts" mainLink="/pulse/hosts" subTitle="Host Groups" />

      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2">
            <Row className="d-flex justify-content-between align-items-center">
              <Col md={4}>
                <h2 className="mb-0">Host Groups</h2>
              </Col>
              <Col md={8} className="d-flex justify-content-end align-items-center gap-2 flex-wrap">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search host groups..."
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

      <GenericTable<ZabbixHostGroup>
        data={paginatedData}
        columns={tableColumns}
        loading={loading}
        emptyMessage="No host groups found."
        loadingMessage="Loading host groups..."
        pagination={{
          currentPage: tablePagination.currentPage,
          rowsPerPage: tablePagination.rowsPerPage,
          totalRows: filteredGroups.length,
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
        uniqueKey="groupid"
      />
    </React.Fragment>
  );
};

HostGroups.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default HostGroups;
