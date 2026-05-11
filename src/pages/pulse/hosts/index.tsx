import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useEffect, useState, useCallback, useMemo } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericTable, { TableColumn, TableAction, ToolbarConfig, TabConfig } from '@components/GenericTable';
import GenericSidebar, { SidebarSection } from '@components/GenericSidebarNew';
import {
  createHost,
  deleteHost,
  getHostGroups,
  getHosts,
  getTemplates,
  refreshHostsCache,
  updateHost,
  ZabbixHost,
  ZabbixHostGroup,
  ZabbixTemplate,
} from '@utils/zabbix';
import { Button, Row, Col, Modal, Badge, Form, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import '@assets/scss/common.scss';
import { FiRefreshCw } from 'react-icons/fi';
import '@assets/scss/tabs.scss';
import { Eye, Pencil, Plus, Trash2, Server, Globe, FolderTree, Layers, Phone, MessageCircle, MessageSquare, Calendar, Mail, MoreHorizontal, Search } from 'lucide-react';
import AppSelect from '@components/AppSelect';
import DeleteConfirmationModal from '@pages/partial/DeleteConfirmationModal';
import router from 'next/router';

type HostGroupOption = { value: string; label: string };
type TemplateOption = { value: string; label: string };
type SnmpVersionOption = { value: number; label: string };
type HostGroupLike = { groupid: string; name?: string };
type TemplateLike = { templateid: string; name?: string };

function validateHostBasics(
  hostname: string,
  groupCount: number,
  templateCount: number
): string | null {
  if (!hostname) return 'Hostname is required';
  if (groupCount === 0) return 'Please select at least one group';
  if (templateCount === 0) return 'Please select at least one template';
  return null;
}

function validateAgentConnection(
  useIp: boolean,
  ip: string,
  dns: string,
  port: string,
  isValidIpv4: (v: string) => boolean,
  isValidPort: (v: string) => boolean
): string | null {
  if (useIp && !ip.trim()) return 'IP is required when "Use IP" is enabled';
  if (useIp && !isValidIpv4(ip)) return 'IP address is invalid';
  if (!useIp && !dns.trim()) return 'DNS is required when "Use IP" is disabled';
  if (!isValidPort(port)) return 'Port must be a number between 1 and 65535';
  return null;
}

function validateSnmpWhenEnabled(
  enabled: boolean,
  useIp: boolean,
  ip: string,
  dns: string,
  port: string,
  isValidIpv4: (v: string) => boolean,
  isValidPort: (v: string) => boolean
): string | null {
  if (!enabled) return null;
  if (useIp && !ip.trim()) return 'SNMP IP is required when "SNMP Use IP" is enabled';
  if (useIp && !isValidIpv4(ip)) return 'SNMP IP address is invalid';
  if (!useIp && !dns.trim()) return 'SNMP DNS is required when "SNMP Use IP" is disabled';
  if (!isValidPort(port)) return 'SNMP port must be a number between 1 and 65535';
  return null;
}

const Hosts = () => {
  const [hosts, setHosts] = useState<ZabbixHost[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [hostGroupsLoading, setHostGroupsLoading] = useState(false);
  const [hostGroupOptions, setHostGroupOptions] = useState<HostGroupOption[]>([]);
  const [selectedHostGroup, setSelectedHostGroup] = useState<HostGroupOption | null>(null);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateOptions, setTemplateOptions] = useState<TemplateOption[]>([]);
  const [pagination, setPagination] = useState({
    offset: 0,
    limit: 20,
    total: 0,
    pageSizeOptions: [10, 20, 25, 50, 100] as number[],
  });

  // New host modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingHostId, setEditingHostId] = useState<string | null>(null);
  const [createSaving, setCreateSaving] = useState(false);
  const [createHostname, setCreateHostname] = useState('');
  const [createVisibleName, setCreateVisibleName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createUseIp, setCreateUseIp] = useState(true);
  const [createIp, setCreateIp] = useState('');
  const [createDns, setCreateDns] = useState('');
  const [createPort, setCreatePort] = useState('');
  const [createGroups, setCreateGroups] = useState<HostGroupOption[]>([]);
  const [createTemplates, setCreateTemplates] = useState<TemplateOption[]>([]);

  const [snmpEnabled, setSnmpEnabled] = useState(false);
  const [snmpUseIp, setSnmpUseIp] = useState(true);
  const [snmpIp, setSnmpIp] = useState('');
  const [snmpDns, setSnmpDns] = useState('');
  const [snmpPort, setSnmpPort] = useState('');
  const [snmpVersion, setSnmpVersion] = useState<number>(2);
  const [snmpCommunity, setSnmpCommunity] = useState('{$SNMP_COMMUNITY}');
  const [snmpBulk, setSnmpBulk] = useState(true);
  const [snmpMaxRepetitions, setSnmpMaxRepetitions] = useState<number>(10);

  const [refreshCacheLoading, setRefreshCacheLoading] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ZabbixHost | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showHostSidebar, setShowHostSidebar] = useState(false);
  const [selectedHost, setSelectedHost] = useState<ZabbixHost | null>(null);

  const fetchHosts = useCallback(async (offset: number, limit: number, search?: string, groupid?: string) => {
    setLoading(true);
    try {
      const params: Parameters<typeof getHosts>[0] = {
        output: ['hostid', 'host', 'name', 'description', 'status'],
        selectInterfaces: ['interfaceid', 'ip', 'dns', 'port'],
        selectGroups: ['groupid', 'name'],
        selectParentTemplates: ['templateid', 'name'],
        offset,
        limit,
      };
      const key = search?.trim();
      if (key) params.search = key;
      const gid = groupid?.trim();
      if (gid) params.groupid = gid;
      const response = await getHosts(params);
      const data = response.hosts ?? [];
      setHosts(data);
      setPagination((prev) => ({
        ...prev,
        offset: response.offset,
        limit: response.limit,
        total: response.total,
      }));
    } catch (error) {
      console.error('Error fetching hosts:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch hosts');
      setHosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHosts(0, 20);
  }, [fetchHosts]);

  useEffect(() => {
    let cancelled = false;

    const loadHostGroups = async () => {
      setHostGroupsLoading(true);
      try {
        const all: ZabbixHostGroup[] = [];
        let offset = 0;
        const limit = 200;

        while (true) {
          const response = await getHostGroups({
            output: ['groupid', 'name'],
            selectHosts: ['hostid'],
            offset,
            limit,
          });

          all.push(...(response.hostgroups ?? []));

          if (!response.has_more) break;
          if (!response.returned || response.returned <= 0) break;

          offset = response.offset + response.returned;
        }

        if (cancelled) return;

        const options: HostGroupOption[] = all
          .filter((g) => g?.groupid && g?.name)
          .map((g) => ({ value: g.groupid, label: g.name }))
          .sort((a, b) => a.label.localeCompare(b.label));

        setHostGroupOptions(options);
      } catch (error) {
        console.error('Error fetching host groups:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to fetch host groups');
        setHostGroupOptions([]);
      } finally {
        if (!cancelled) setHostGroupsLoading(false);
      }
    };

    loadHostGroups();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadTemplates = async () => {
      setTemplatesLoading(true);
      try {
        const response = await getTemplates({ offset: 0, limit: 2000 });
        const all: ZabbixTemplate[] = response.templates ?? [];
        const options: TemplateOption[] = all
          .filter((t) => t?.templateid && t?.name)
          .map((t) => ({ value: t.templateid, label: t.name }))
          .sort((a, b) => a.label.localeCompare(b.label));
        if (!cancelled) setTemplateOptions(options);
      } catch (error) {
        console.error('Error fetching templates:', error);
        if (!cancelled) setTemplateOptions([]);
      } finally {
        if (!cancelled) setTemplatesLoading(false);
      }
    };

    loadTemplates();

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshList = useCallback(
    (nextOffset?: number) => {
      fetchHosts(
        nextOffset ?? pagination.offset,
        pagination.limit,
        search,
        selectedHostGroup?.value
      );
    },
    [fetchHosts, pagination.offset, pagination.limit, search, selectedHostGroup?.value]
  );

  const handleSearch = () => fetchHosts(0, pagination.limit, search, selectedHostGroup?.value);

  const handleRefresh = () => fetchHosts(0, pagination.limit, search, selectedHostGroup?.value);

  const handleRefreshCache = async () => {
    setRefreshCacheLoading(true);
    try {
      const resp = await refreshHostsCache();
      toast.success(resp?.message || 'Hosts cache refreshed');
      fetchHosts(0, pagination.limit, search, selectedHostGroup?.value);
    } catch (error) {
      console.error('Error refreshing hosts cache:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to refresh hosts cache');
    } finally {
      setRefreshCacheLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingHostId(null);
    setCreateHostname('');
    setCreateVisibleName('');
    setCreateDescription('');
    setCreateUseIp(true);
    setCreateIp('');
    setCreateDns('');
    setCreatePort('10050');
    setCreateGroups([]);
    setCreateTemplates([]);

    setSnmpEnabled(false);
    setSnmpUseIp(true);
    setSnmpIp('');
    setSnmpDns('');
    setSnmpPort('161');
    setSnmpVersion(2);
    setSnmpCommunity('{$SNMP_COMMUNITY}');
    setSnmpBulk(true);
    setSnmpMaxRepetitions(10);

    setShowCreateModal(true);
  };

  const openEditModal = (host: ZabbixHost) => {
    setEditingHostId(host.hostid);
    setCreateHostname(host.host ?? '');
    setCreateVisibleName(host.name ?? '');
    setCreateDescription((host.description as string) ?? '');

    const iface = host.interfaces?.[0];
    setCreateIp((iface?.ip as string) ?? '');
    setCreateDns((iface?.dns as string) ?? '');
    setCreatePort((iface?.port as string) ?? '10050');
    setCreateUseIp(Boolean((iface?.ip as string) ?? ''));

    const hostGroups = (host.groups ?? []) as HostGroupLike[];
    const groups: HostGroupOption[] = hostGroups.map((group) => ({
      value: group.groupid,
      label: group.name ?? group.groupid,
    }));
    setCreateGroups(groups);

    const hostTemplates = (host.parentTemplates ?? []) as TemplateLike[];
    const templates: TemplateOption[] = hostTemplates.map((template) => ({
      value: template.templateid,
      label: template.name ?? template.templateid,
    }));
    setCreateTemplates(templates);

    setShowCreateModal(true);
  };

  const openDeleteConfirm = (host: ZabbixHost) => {
    setDeleteTarget(host);
    setShowDeleteModal(true);
  };

  const openHostSidebar = useCallback((host: ZabbixHost) => {
    setSelectedHost(host);
    setShowHostSidebar(true);
  }, []);

  const closeHostSidebar = useCallback(() => {
    setShowHostSidebar(false);
    setSelectedHost(null);
  }, []);

  const handleDeleteHost = async () => {
    if (!deleteTarget?.hostid) return;
    setDeleteLoading(true);
    try {
      await deleteHost(deleteTarget.hostid);
      toast.success('Host deleted');
      setShowDeleteModal(false);
      setDeleteTarget(null);
      refreshList(0);
    } catch (error) {
      console.error('Error deleting host:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete host');
    } finally {
      setDeleteLoading(false);
    }
  };

  const isValidPort = useCallback((value: string) => {
    const s = value.trim();
    if (!s) return false;
    if (!/^\d+$/.test(s)) return false;
    const n = Number(s);
    return Number.isInteger(n) && n >= 1 && n <= 65535;
  }, []);

  const isValidIpv4 = useCallback((value: string) => {
    const s = value.trim();
    if (!s) return false;
    const parts = s.split('.');
    if (parts.length !== 4) return false;
    for (const part of parts) {
      if (!/^\d+$/.test(part)) return false;
      const n = Number(part);
      if (!Number.isInteger(n) || n < 0 || n > 255) return false;
    }
    return true;
  }, []);

  const validateCreateHostForm = useCallback((): string | null => {
    return (
      validateHostBasics(createHostname.trim(), createGroups.length, createTemplates.length) ??
      validateAgentConnection(createUseIp, createIp, createDns, createPort, isValidIpv4, isValidPort) ??
      validateSnmpWhenEnabled(snmpEnabled, snmpUseIp, snmpIp, snmpDns, snmpPort, isValidIpv4, isValidPort)
    );
  }, [
    createDns,
    createGroups.length,
    createHostname,
    createIp,
    createPort,
    createTemplates.length,
    createUseIp,
    isValidIpv4,
    isValidPort,
    snmpDns,
    snmpEnabled,
    snmpIp,
    snmpPort,
    snmpUseIp,
  ]);

  const getCreateHostErrorMessage = useCallback((error: unknown): string => {
    if (error instanceof Error) return error.message;
    return editingHostId ? 'Failed to update host' : 'Failed to create host';
  }, [editingHostId]);

  const submitCreateHost = async () => {
    const validationError = validateCreateHostForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const hostname = createHostname.trim();

    setCreateSaving(true);
    try {
      const payload = {
        hostname,
        visible_name: createVisibleName.trim(),
        ip: createIp.trim(),
        port: createPort.trim() || '',
        dns: createDns.trim(),
        description: createDescription.trim(),
        groupids: createGroups.map((g) => g.value),
        templateids: createTemplates.map((t) => t.value),
        use_ip: createUseIp ? 1 : 0,
        snmp_enabled: snmpEnabled,
        snmp_ip: snmpIp.trim(),
        snmp_port: snmpPort.trim() || '',
        snmp_dns: snmpDns.trim(),
        snmp_use_ip: snmpUseIp ? 1 : 0,
        snmp_version: snmpVersion,
        snmp_community: snmpCommunity.trim() || '{$SNMP_COMMUNITY}',
        snmp_bulk: snmpBulk ? 1 : 0,
        snmp_max_repetitions: snmpMaxRepetitions,
      };

      if (editingHostId) {
        await updateHost(editingHostId, payload);
        toast.success('Host updated');
      } else {
        const resp = await createHost(payload);
        toast.success(`Host created: ${resp.hostname}`);
      }
      setShowCreateModal(false);
      setEditingHostId(null);
      refreshList(0);
    } catch (error) {
      console.error('Error creating host:', error);
      toast.error(getCreateHostErrorMessage(error));
    } finally {
      setCreateSaving(false);
    }
  };


  const tableColumns: TableColumn<ZabbixHost>[] = [
    { key: 'host', label: 'Name / Hostname', sortable: true },
    {
      key: 'ip',
      label: 'Address',
      sortable: true,
      render: (row) => <span>{row.interfaces?.[0]?.ip ?? '-'}</span>,
    },
    {
      key: 'groups',
      label: 'Groups',
      sortable: true,
      render: (row) => {
        const rowGroups = (row.groups ?? []) as HostGroupLike[];
        return <span>{rowGroups.map((group) => group.name).filter(Boolean).join(', ') || '-'}</span>;
      },
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) =>
        Number(row.status) === 1 ? (
          <Badge bg="success">Monitored</Badge>
        ) : (
          <Badge bg="danger">Not monitored</Badge>
        ),
    },
  ];

  const tableActions: TableAction<ZabbixHost>[] = [
    { label: 'View', icon: <Eye size={16} />, onClick: (row) => router.push(`/pulse/hosts/${row.hostid}`) },
    { label: 'Edit', icon: <Pencil size={16} />, onClick: (row) => openEditModal(row) },
    { label: 'Delete', icon: <Trash2 size={16} />, onClick: (row) => openDeleteConfirm(row) },
  ];

  const handleHostGroupFilterChange = useCallback(
    (opt: HostGroupOption | null) => {
      setSelectedHostGroup(opt);
      fetchHosts(0, pagination.limit, search, opt?.value);
    },
    [fetchHosts, pagination.limit, search]
  );

  const handleCreateGroupsChange = useCallback((opt: readonly HostGroupOption[] | null) => {
    setCreateGroups(opt ? [...opt] : []);
  }, []);

  const handleCreateTemplatesChange = useCallback((opt: readonly TemplateOption[] | null) => {
    setCreateTemplates(opt ? [...opt] : []);
  }, []);

  const handleSnmpVersionChange = useCallback((opt: SnmpVersionOption | null) => {
    setSnmpVersion(opt?.value ?? 2);
  }, []);

  const handleHostGroupFilterChangeRaw = useCallback((opt: any) => {
    handleHostGroupFilterChange((opt as HostGroupOption | null) ?? null);
  }, [handleHostGroupFilterChange]);

  const handleCreateGroupsChangeRaw = useCallback((opt: any) => {
    handleCreateGroupsChange((opt as readonly HostGroupOption[] | null) ?? null);
  }, [handleCreateGroupsChange]);

  const handleCreateTemplatesChangeRaw = useCallback((opt: any) => {
    handleCreateTemplatesChange((opt as readonly TemplateOption[] | null) ?? null);
  }, [handleCreateTemplatesChange]);

  const handleSnmpVersionChangeRaw = useCallback((opt: any) => {
    handleSnmpVersionChange((opt as SnmpVersionOption | null) ?? null);
  }, [handleSnmpVersionChange]);

  const hostSidebarQuickActions = useMemo(() => {
    // Hosts do not currently provide phone/email fields, keep these actions visible but disabled.
    const hasPhone = false;
    const hasEmail = false;

    return [
      {
        id: 'qa-call',
        label: 'Call',
        icon: Phone,
        onClick: () => {},
        disabled: !hasPhone,
      },
      {
        id: 'qa-whatsapp',
        label: 'WhatsApp',
        icon: MessageCircle,
        onClick: () => {},
        disabled: !hasPhone,
      },
      {
        id: 'qa-sms',
        label: 'SMS',
        icon: MessageSquare,
        onClick: () => {},
        disabled: !hasPhone,
      },
      {
        id: 'qa-meeting',
        label: 'Meeting',
        icon: Calendar,
        onClick: () => {},
      },
      {
        id: 'qa-email',
        label: 'Email',
        icon: Mail,
        onClick: () => {},
        disabled: !hasEmail,
      },
      {
        id: 'more',
        label: 'More',
        icon: MoreHorizontal,
        onClick: () => {
          // Let GenericSidebar's built-in "More" submenu open.
        },
      },
    ];
  }, []);

  const hostTabs: TabConfig[] = useMemo(
    () => [
      {
        id: 'hosts',
        label: 'Hosts',
        count: pagination.total,
        removable: false,
      },
    ],
    [pagination.total]
  );

  const hostSidebarSections: SidebarSection[] = useMemo(() => {
    if (!selectedHost) return [];

    const hostInterface = selectedHost.interfaces?.[0];
    const selectedHostGroups = (selectedHost.groups ?? []) as HostGroupLike[];
    const selectedHostTemplates = (selectedHost.parentTemplates ?? []) as TemplateLike[];
    const groupNames = selectedHostGroups.map((group) => group.name).filter(Boolean);
    const templateNames = selectedHostTemplates.map((template) => template.name).filter(Boolean);

    return [
      {
        id: 'about-host',
        title: 'About this host',
        icon: Server,
        collapsible: true,
        defaultExpanded: true,
        fields: [
          { label: 'Host ID', value: selectedHost.hostid || 'N/A', copyable: true },
          { label: 'Host Name', value: selectedHost.host || 'N/A', copyable: true },
          { label: 'Visible Name', value: selectedHost.name || 'N/A', copyable: true },
          {
            label: 'Status',
            value: Number(selectedHost.status) === 1 ? 'Monitored' : 'Not monitored',
            type: 'badge',
            badgeVariant: Number(selectedHost.status) === 1 ? 'success' : 'danger',
          },
          { label: 'Description', value: selectedHost.description || 'N/A' },
        ],
      },
      {
        id: 'network',
        title: 'Network',
        icon: Globe,
        collapsible: true,
        defaultExpanded: true,
        fields: [
          { label: 'IP Address', value: hostInterface?.ip || 'N/A', copyable: true },
          { label: 'DNS', value: hostInterface?.dns || 'N/A', copyable: true },
          { label: 'Port', value: hostInterface?.port || 'N/A', copyable: true },
        ],
      },
      {
        id: 'groups',
        title: 'Groups',
        icon: FolderTree,
        collapsible: true,
        defaultExpanded: true,
        fields: [
          {
            label: 'Assigned Groups',
            value: groupNames.length > 0 ? groupNames : ['No groups'],
            type: 'tags',
          },
        ],
      },
      {
        id: 'templates',
        title: 'Templates',
        icon: Layers,
        collapsible: true,
        defaultExpanded: false,
        fields: [
          {
            label: 'Linked Templates',
            value: templateNames.length > 0 ? templateNames : ['No templates'],
            type: 'tags',
          },
        ],
      },
    ];
  }, [selectedHost]);

  const hostsToolbarConfig: ToolbarConfig = useMemo(
    () => ({
      showSearch: true,
      searchValue: search,
      searchPlaceholder: 'Search hosts...',
      onSearchChange: setSearch,
      onSearch: handleSearch,
      showTabs: true,
      tabs: hostTabs,
      activeTab: 'hosts',
      onTabChange: () => {},
      showTableViewDropdown: false,
      customActions: (
        <div className="d-flex align-items-center gap-2 flex-wrap hosts-toolbar-buttons">
          <button className="hosts-btn" onClick={handleSearch} disabled={loading}>
            <Search size={14} /> Search
          </button>
          <button className="hosts-btn" onClick={openCreateModal} disabled={loading}>
            <Plus size={14} /> New Host
          </button>
          <button className="hosts-btn" onClick={handleRefreshCache} disabled={loading || refreshCacheLoading}>
            <FiRefreshCw size={14} /> Refresh Hosts Cache
          </button>
          <button className="hosts-btn" onClick={handleRefresh} disabled={loading}>
            <FiRefreshCw size={14} /> Refresh
          </button>
        </div>
      ),
      rightActions: (
        <div className="hosts-filter-select" style={{ minWidth: '260px', width: '100%', maxWidth: '320px' }}>
          <AppSelect
            instanceId="pulse-hosts-hostgroup"
            classNamePrefix="hosts-select"
            placeholder="All host groups"
            isClearable
            isLoading={hostGroupsLoading}
            options={hostGroupOptions}
            value={selectedHostGroup}
            onChange={handleHostGroupFilterChangeRaw}
          />
        </div>
      ),
    }),
    [
      fetchHosts,
      handleRefresh,
      handleRefreshCache,
      handleSearch,
      hostGroupOptions,
      hostGroupsLoading,
      hostTabs,
      handleHostGroupFilterChange,
      handleHostGroupFilterChangeRaw,
      loading,
      openCreateModal,
      refreshCacheLoading,
      selectedHostGroup,
    ]
  );

  const snmpVersionOptions: SnmpVersionOption[] = [
    { value: 1, label: 'SNMPv1' },
    { value: 2, label: 'SNMPv2c' },
    { value: 3, label: 'SNMPv3' },
  ];

  const selectedSnmpVersion: SnmpVersionOption =
    snmpVersionOptions.find((o) => o.value === snmpVersion) ?? snmpVersionOptions[1];

  const isCreateFormValid = useMemo(() => {
    const hostnameOk = Boolean(createHostname.trim());
    const groupsOk = createGroups.length > 0;
    const templatesOk = createTemplates.length > 0;
    const addressOk = createUseIp ? isValidIpv4(createIp) : Boolean(createDns.trim());
    const portOk = isValidPort(createPort);
    const snmpOk =
      !snmpEnabled ||
      ((snmpUseIp ? isValidIpv4(snmpIp) : Boolean(snmpDns.trim())) && isValidPort(snmpPort));
    return hostnameOk && groupsOk && templatesOk && addressOk && portOk && snmpOk;
  }, [
    createDns,
    createGroups.length,
    createHostname,
    createIp,
    createPort,
    createTemplates.length,
    createUseIp,
    isValidIpv4,
    isValidPort,
    snmpDns,
    snmpEnabled,
    snmpIp,
    snmpPort,
    snmpUseIp,
  ]);

  const submitButtonLabel = editingHostId ? 'Update Host' : 'Create Host';

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Pulse" mainLink="/pulse/dashboard" subTitle="Hosts" />
      <div
        className="pulse-hosts-page"
        style={{
          display: 'flex',
          gap: '0',
          height: 'calc(100vh)',
          overflow: 'hidden',
        }}
      >
        <div className="hosts-table-pane" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <GenericTable<ZabbixHost>
            data={hosts}
            columns={tableColumns}
            actions={tableActions}
            showActions
            actionsLabel="Actions"
            showToolbarActions={false}
            loading={loading}
            emptyMessage="No hosts found."
            loadingMessage="Loading hosts..."
            pagination={{
              currentPage: pagination.limit > 0 ? Math.floor(pagination.offset / pagination.limit) + 1 : 1,
              rowsPerPage: pagination.limit,
              totalRows: pagination.total,
              pageSizeOptions: pagination.pageSizeOptions,
            }}
            onPaginationChange={(page, rowsPerPage) => {
              fetchHosts((page - 1) * rowsPerPage, rowsPerPage, search, selectedHostGroup?.value);
            }}
            sortable
            hover
            striped={false}
            uniqueKey="hostid"
            onPreviewClick={(row) => openHostSidebar(row)}
            showToolbar={true}
            toolbar={hostsToolbarConfig}
            fixedHeight={true}
            maxHeight="calc(100vh - 295px)"
          />
        </div>

        {showHostSidebar && selectedHost && (
          <GenericSidebar
            isOpen={showHostSidebar}
            onClose={closeHostSidebar}
            title={selectedHost.name || selectedHost.host || 'Host Details'}
            subtitle={selectedHost.interfaces?.[0]?.ip || ''}
            avatar={{
              initials: (selectedHost.host || selectedHost.name || 'H').slice(0, 2).toUpperCase(),
              name: selectedHost.host || selectedHost.name || 'Host',
              gradient: '#0091ae',
            }}
            recordLink={{
              label: 'Open host details page',
              onClick: () => router.push(`/pulse/hosts/${selectedHost.hostid}`),
            }}
            actionsDropdown={{
              label: 'Actions',
              items: [
                {
                  label: 'Edit Host',
                  onClick: () => {
                    closeHostSidebar();
                    openEditModal(selectedHost);
                  },
                },
                {
                  label: 'Delete Host',
                  onClick: () => {
                    closeHostSidebar();
                    openDeleteConfirm(selectedHost);
                  },
                },
              ],
            }}
            sections={hostSidebarSections}
            quickActions={hostSidebarQuickActions}
          />
        )}
      </div>

      <Modal
        show={showCreateModal}
        onHide={() => {
          setShowCreateModal(false);
          setEditingHostId(null);
        }}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>{editingHostId ? 'Edit Host' : 'New Host'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Host Name</Form.Label>
                <Form.Control
                  value={createHostname}
                  onChange={(e) => setCreateHostname(e.target.value)}
                  placeholder="AcmeTechGroup-Server-deviceName"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Visible Name (optional)</Form.Label>
                <Form.Control
                  value={createVisibleName}
                  onChange={(e) => setCreateVisibleName(e.target.value)}
                  placeholder="AcmeTechGroup-Server-deviceName"
                />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group>
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                />
              </Form.Group>
            </Col>

            
            <Col md={6}>
              <Form.Group>
                <Form.Label>IP Address</Form.Label>
                <Form.Control
                  value={createIp}
                  onChange={(e) => setCreateIp(e.target.value)}
                  placeholder="eg: 192.168.30.10"
                  isInvalid={Boolean(createIp.trim()) && !isValidIpv4(createIp)}
                />
                <Form.Control.Feedback type="invalid">Enter a valid IPv4 address (e.g. 192.168.1.10)</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>DNS</Form.Label>
                <Form.Control
                  value={createDns}
                  onChange={(e) => setCreateDns(e.target.value)}
                  placeholder="hostname.local"
                 
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Port</Form.Label>
                <Form.Control
                  value={createPort}
                  onChange={(e) => setCreatePort(e.target.value)}
                  placeholder="10050"
                  isInvalid={Boolean(createPort.trim()) && !isValidPort(createPort)}
                />
                <Form.Control.Feedback type="invalid">Port must be between 1 and 65535</Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Groups</Form.Label>
                <AppSelect<HostGroupOption, true>
                  instanceId="create-host-groups"
                  classNamePrefix="hosts-select"
                  isMulti
                  isLoading={hostGroupsLoading}
                  options={hostGroupOptions}
                  value={createGroups}
                  onChange={handleCreateGroupsChangeRaw}
                  placeholder="Select groups..."
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Templates</Form.Label>
                <AppSelect<TemplateOption, true>
                  instanceId="create-host-templates"
                  classNamePrefix="hosts-select"
                  isMulti
                  isLoading={templatesLoading}
                  options={templateOptions}
                  value={createTemplates}
                  onChange={handleCreateTemplatesChangeRaw}
                  placeholder="Select templates..."
                />
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Check
                type="switch"
                id="create-snmp-enabled"
                label="SNMP Enabled"
                checked={snmpEnabled}
                onChange={(e) => setSnmpEnabled(e.target.checked)}
              />
            </Col>

            {snmpEnabled ? (
              <React.Fragment>
                
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>SNMP IP Address</Form.Label>
                    <Form.Control
                      value={snmpIp}
                      onChange={(e) => setSnmpIp(e.target.value)}
                      placeholder="eg: 192.168.30.10"
                      isInvalid={Boolean(snmpIp.trim()) && !isValidIpv4(snmpIp)}
                    />
                    <Form.Control.Feedback type="invalid">Enter a valid IPv4 address</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>SNMP DNS Name</Form.Label>
                    <Form.Control
                      value={snmpDns}
                      onChange={(e) => setSnmpDns(e.target.value)}
                      placeholder="eg: snmp-dns-name.local"
                    
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>SNMP Port</Form.Label>
                    <Form.Control
                      value={snmpPort}
                      onChange={(e) => setSnmpPort(e.target.value)}
                      placeholder="161"
                      isInvalid={Boolean(snmpPort.trim()) && !isValidPort(snmpPort)}
                    />
                    <Form.Control.Feedback type="invalid">Port must be between 1 and 65535</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>SNMP Version</Form.Label>
                    <AppSelect<SnmpVersionOption>
                      instanceId="hc-snmp-version"
                      classNamePrefix="hosts-select"
                      options={snmpVersionOptions}
                      value={selectedSnmpVersion}
                      onChange={handleSnmpVersionChangeRaw}
                      isSearchable={false}
                      placeholder="Select SNMP version"
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>SNMP Community</Form.Label>
                    <Form.Control
                      value={snmpCommunity}
                      onChange={(e) => setSnmpCommunity(e.target.value)}
                      placeholder="{$SNMP_COMMUNITY}"
                    />
                    <small className="text-muted">Default macro {'{$SNMP_COMMUNITY}'} uses host-level value</small>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Check
                    type="switch"
                    id="create-snmp-bulk"
                    label="SNMP Bulk"
                    checked={snmpBulk}
                    onChange={(e) => setSnmpBulk(e.target.checked)}
                  />
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>SNMP Max Repetitions</Form.Label>
                    <Form.Control
                      type="number"
                      value={snmpMaxRepetitions}
                      onChange={(e) => setSnmpMaxRepetitions(Number(e.target.value) || 10)}
                      min={1}
                      max={100}
                    />
                  </Form.Group>
                </Col>
              </React.Fragment>
            ) : null}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)} disabled={createSaving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submitCreateHost} disabled={createSaving || !isCreateFormValid}>
            {createSaving ? (
              <span className="d-inline-flex align-items-center gap-2">
                <Spinner size="sm" animation="border" /> Saving...
              </span>
            ) : (
              submitButtonLabel
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDeleteHost}
        itemName={deleteTarget?.name || deleteTarget?.host}
        itemType="host"
        loading={deleteLoading}
      />

      <style>{`
        .pulse-hosts-page .hosts-btn {
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

        .pulse-hosts-page .hosts-btn:hover,
        .pulse-hosts-page .hosts-btn:focus {
          background-color: rgb(0, 0, 0);
          color: rgb(255, 255, 255);
          opacity: 0.92;
        }

        .pulse-hosts-page .hosts-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .pulse-hosts-page .gt-toolbar-search input,
        .pulse-hosts-page .gt-toolbar-search .form-control {
          min-height: 40px;
          height: 40px;
          font-size: 12px;
        }

        .pulse-hosts-page .gt-toolbar-search button,
        .pulse-hosts-page .gt-toolbar-search .btn {
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

        .pulse-hosts-page .hosts-filter-select {
          min-height: 40px;
        }

        .pulse-hosts-page .hosts-select__control {
          min-height: 40px;
          height: 40px;
          border-radius: 4px;
        }

        .pulse-hosts-page .hosts-select__value-container {
          min-height: 40px;
          padding: 0 10px;
          font-size: 12px;
        }

        .pulse-hosts-page .hosts-select__indicators {
          min-height: 40px;
        }

        .pulse-hosts-page .hosts-table-pane {
          min-height: 0;
        }

        .pulse-hosts-page .hosts-table-pane .generic-table-responsive.fixed-height-table {
          min-height: 0;
        }
      `}</style>
    
    </React.Fragment>
  );
};

Hosts.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default Hosts;
