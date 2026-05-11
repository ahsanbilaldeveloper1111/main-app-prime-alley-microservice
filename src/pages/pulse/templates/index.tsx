import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState, useCallback, useMemo } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericTable, { TableColumn, ToolbarConfig, TabConfig } from '@components/GenericTable';
import { getTemplates, ZabbixTemplate, ZabbixTemplateGroupRef } from '@utils/zabbix';
import { toast } from 'react-toastify';
import '@assets/scss/common.scss';
import { FiRefreshCw } from 'react-icons/fi';
import '@assets/scss/tabs.scss';
import { Search } from 'lucide-react';
import AppSelect from '@components/AppSelect';

type TemplateGroupOption = { value: string; label: string };

function collectTemplateGroupNames(templates: ZabbixTemplate[]): string[] {
  const names = new Set<string>();
  for (const t of templates) {
    for (const g of t.groups ?? []) {
      if (g?.name) names.add(g.name);
    }
  }
  return Array.from(names).sort((a, b) => a.localeCompare(b));
}

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
        const all: ZabbixTemplate[] = response.templates ?? [];

        if (cancelled) return;

        const options = collectTemplateGroupNames(all).map((name) => ({ value: name, label: name }));
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

  const handleGroupChangeRaw = useCallback((opt: TemplateGroupOption | null) => {
    setSelectedGroup(opt);
    fetchTemplates(0, pagination.limit, search, opt?.value);
  }, [fetchTemplates, pagination.limit, search]);

  const tableColumns: TableColumn<ZabbixTemplate>[] = [
    { key: 'templateid', label: 'Template ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    {
      key: 'groups',
      label: 'Groups',
      sortable: true,
      render: (row) => <span>{row.groups?.map((g: ZabbixTemplateGroupRef) => g.name).join(', ') ?? '-'}</span>,
    },
  ];

  const templateTabs: TabConfig[] = useMemo(
    () => [
      {
        id: 'templates',
        label: 'Templates',
        count: pagination.total,
        removable: false,
      },
    ],
    [pagination.total]
  );

  const templatesToolbarConfig: ToolbarConfig = useMemo(
    () => ({
      showSearch: true,
      searchValue: search,
      searchPlaceholder: 'Search templates...',
      onSearchChange: setSearch,
      onSearch: handleSearch,
      showTabs: true,
      tabs: templateTabs,
      activeTab: 'templates',
      onTabChange: () => {},
      showTableViewDropdown: false,
      customActions: (
        <div className="d-flex align-items-center gap-2 flex-wrap templates-toolbar-buttons">
          <button className="templates-btn" onClick={handleSearch} disabled={loading}>
            <Search size={14} /> Search
          </button>
          <button className="templates-btn" onClick={handleRefresh} disabled={loading}>
            <FiRefreshCw size={14} /> Refresh
          </button>
        </div>
      ),
      rightActions: (
        <div className="templates-filter-select" style={{ minWidth: '260px', width: '100%', maxWidth: '320px' }}>
          <AppSelect<TemplateGroupOption>
            instanceId="pulse-templates-group"
            classNamePrefix="templates-select"
            placeholder="All template groups"
            isClearable
            isLoading={groupsLoading}
            options={groupOptions}
            value={selectedGroup}
            onChange={handleGroupChangeRaw}
          />
        </div>
      ),
    }),
    [
      groupOptions,
      groupsLoading,
      handleGroupChangeRaw,
      handleRefresh,
      handleSearch,
      loading,
      search,
      selectedGroup,
      templateTabs,
    ]
  );

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Pulse" mainLink="/pulse/dashboard" subTitle="Templates" />

      <div
        className="pulse-templates-page"
        style={{
          display: 'flex',
          gap: '0',
          height: 'calc(100vh)',
          overflow: 'hidden',
        }}
      >
        <div className="templates-table-pane" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <GenericTable<ZabbixTemplate>
            data={templates}
            columns={tableColumns}
            loading={loading}
            emptyMessage="No templates found."
            loadingMessage="Loading templates..."
            showToolbarActions={false}
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
            showToolbar={true}
            toolbar={templatesToolbarConfig}
            fixedHeight={true}
            maxHeight="calc(100vh - 295px)"
          />
        </div>
      </div>

      <style>{`
        .pulse-templates-page .templates-btn {
          padding: 9px 13px;
          background-color: rgb(0, 0, 0);
          color: rgb(255, 255, 255);
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          min-height: 40px;
          line-height: 1;
        }

        .pulse-templates-page .templates-btn:hover,
        .pulse-templates-page .templates-btn:focus {
          background-color: rgb(0, 0, 0);
          color: rgb(255, 255, 255);
          opacity: 0.92;
        }

        .pulse-templates-page .templates-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .pulse-templates-page .gt-toolbar-search input,
        .pulse-templates-page .gt-toolbar-search .form-control {
          min-height: 40px;
          height: 40px;
          font-size: 12px;
        }

        .pulse-templates-page .gt-toolbar-search button,
        .pulse-templates-page .gt-toolbar-search .btn {
          min-height: 40px;
          height: 40px;
          padding: 9px 13px;
          font-size: 12px;
          font-weight: 500;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .pulse-templates-page .templates-filter-select {
          min-height: 40px;
        }

        .pulse-templates-page .templates-select__control {
          min-height: 40px;
          height: 40px;
          border-radius: 4px;
        }

        .pulse-templates-page .templates-select__value-container {
          min-height: 40px;
          padding: 0 10px;
          font-size: 12px;
        }

        .pulse-templates-page .templates-select__indicators {
          min-height: 40px;
        }

        .pulse-templates-page .generic-table-container,
        .pulse-templates-page .generic-table-card,
        .pulse-templates-page .gt-toolbar-container,
        .pulse-templates-page .gt-toolbar-main,
        .pulse-templates-page .gt-toolbar-tabs-section {
          overflow: visible;
        }

        .pulse-templates-page .gt-toolbar-container {
          position: relative;
          z-index: 20;
        }

        .pulse-templates-page .templates-select__menu {
          z-index: 30;
        }

        .pulse-templates-page .templates-table-pane {
          min-height: 0;
        }

        .pulse-templates-page .templates-table-pane .generic-table-responsive.fixed-height-table {
          min-height: 0;
        }
      `}</style>
    </React.Fragment>
  );
};

NetopsTemplates.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default NetopsTemplates;
