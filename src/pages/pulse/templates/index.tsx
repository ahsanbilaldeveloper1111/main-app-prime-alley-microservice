import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState, useCallback } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericTable, { TableColumn } from '@components/GenericTable';
import { getTemplates, ZabbixTemplate, ZabbixTemplateGroupRef } from '@utils/zabbix';
import { Button, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import '@assets/scss/common.scss';
import { FiRefreshCw } from 'react-icons/fi';
import '@assets/scss/tabs.scss';
import AppSelect from '@components/AppSelect';

type TemplateGroupOption = { value: string; label: string };

const NetopsTemplates = () => {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<ZabbixTemplate[]>([]);
  const [search, setSearch] = useState('');
  const [groupOptions, setGroupOptions] = useState<TemplateGroupOption[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<TemplateGroupOption | null>(null);
  const [pagination, setPagination] = useState({
    offset: 0,
    limit: 10,
    total: 0,
    pageSizeOptions: [10, 15, 25, 50, 100] as number[],
  });

  const fetchTemplates = useCallback(
    async (offset: number, limit: number, searchTerm?: string, groupName?: string) => {
      setLoading(true);
      try {
        const response = await getTemplates({
          offset,
          limit,
          ...(searchTerm?.trim() ? { search: searchTerm.trim() } : {}),
          ...(groupName?.trim() ? { group: groupName.trim() } : {}),
        });
        setTemplates(response.templates ?? []);
        setPagination((prev) => ({
          ...prev,
          offset: response.offset,
          limit: response.limit,
          total: response.total,
        }));
      } catch (error) {
        console.error('Error fetching templates:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to fetch templates');
        setTemplates([]);
        setPagination((prev) => ({ ...prev, offset: 0, total: 0 }));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchTemplates(0, pagination.limit, undefined, selectedGroup?.value);
  }, [fetchTemplates, pagination.limit, selectedGroup?.value]);

  useEffect(() => {
    let cancelled = false;

    const loadTemplateGroups = async () => {
      setGroupsLoading(true);
      try {
        const response = await getTemplates({ offset: 0, limit: 2000 });
        const all = response.templates ?? [];

        const names = new Set<string>();
        all.forEach((t) => {
          (t.groups ?? []).forEach((g: ZabbixTemplateGroupRef) => {
            if (g?.name) names.add(g.name);
          });
        });

        if (cancelled) return;

        const options = Array.from(names)
          .map((name) => ({ value: name, label: name }))
          .sort((a, b) => a.label.localeCompare(b.label));
        setGroupOptions(options);
      } catch (error) {
        console.error('Error fetching template groups:', error);
        setGroupOptions([]);
      } finally {
        if (!cancelled) setGroupsLoading(false);
      }
    };

    loadTemplateGroups();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearch = () => fetchTemplates(0, pagination.limit, search, selectedGroup?.value);
  const handleRefresh = () => fetchTemplates(0, pagination.limit, search, selectedGroup?.value);

  const tableColumns: TableColumn<ZabbixTemplate>[] = [
    { key: 'templateid', label: 'Template ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    {
      key: 'groups',
      label: 'Groups',
      sortable: true,
      render: (row) => <span>{row.groups?.map((g) => g.name).join(', ') ?? '-'}</span>,
    },
  ];

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Pulse" mainLink="/pulse/dashboard" subTitle="Templates" />

      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2 d-flex justify-content-end align-items-center gap-2 flex-wrap">
            <div style={{ minWidth: '260px', maxWidth: '320px' }}>
              <AppSelect<TemplateGroupOption>
                instanceId="pulse-templates-group"
                placeholder="All template groups"
                isClearable
                isLoading={groupsLoading}
                options={groupOptions}
                value={selectedGroup}
                onChange={(opt) => {
                  const next = (opt ?? null) as TemplateGroupOption | null;
                  setSelectedGroup(next);
                  fetchTemplates(0, pagination.limit, search, next?.value);
                }}
              />
            </div>
            <input
              type="text"
              className="form-control"
              placeholder="Search templates..."
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

      <GenericTable<ZabbixTemplate>
        data={templates}
        columns={tableColumns}
        loading={loading}
        emptyMessage="No templates found."
        loadingMessage="Loading templates..."
        pagination={{
          currentPage: pagination.limit > 0 ? Math.floor(pagination.offset / pagination.limit) + 1 : 1,
          rowsPerPage: pagination.limit,
          totalRows: pagination.total,
          pageSizeOptions: pagination.pageSizeOptions,
        }}
        onPaginationChange={(page, rowsPerPage) => {
          fetchTemplates((page - 1) * rowsPerPage, rowsPerPage, search, selectedGroup?.value);
        }}
        sortable={true}
        hover={true}
        striped={false}
        uniqueKey="templateid"
      />
    </React.Fragment>
  );
};

NetopsTemplates.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default NetopsTemplates;
