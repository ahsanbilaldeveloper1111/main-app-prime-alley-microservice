import "@assets/scss/datatable-style.scss";
import "@assets/scss/crm-tickets-page.scss";
import "@assets/scss/common.scss";
import React, { ReactElement, useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "@layout/index";
import GenericTable, {
  TableAction,
  TableColumn,
  TabConfig,
} from "@components/GenericTable";
import { buildCrmTicketsTableToolbar } from "@components/crm/tickets/buildCrmTicketsTableToolbar";
import { useCrmTicketsFilterPills } from "@hooks/useCrmTicketsFilterPills";
import { useStagedFiltersActions } from "@utils/communicationsStagedFilters";
import GenericSidebar, { SidebarSection } from "@components/GenericSidebarNew";
import { CreateTicketSidebar } from "@components/renderCreateTicketForm";
import {
  Calendar,
  AlertCircle,
  User,
  Layers,
  Tag,
  History,
  FileText,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  DashboardData,
  DeleteTicket,
  GetTicket,
  ListTickets,
} from "@utils/tickets";
import { GetHierarchyData } from "@utils/users";
import { GetAllStatuses } from "@utils/ticket-statuses";
import { ModuleSlug } from "@utils/Helper";
import { crmAppKeys } from "@query/keys";
import {
  buildCrmTicketsListApiFilters,
  buildCrmTicketsListRequest,
  DEFAULT_CRM_TICKET_FILTERS,
  getTicketActivityCount,
  getTicketCommentsCount,
  getTicketCrmSummary,
  mapApiTicketsToCrmGridRows,
  mapDashboardToCrmStats,
  normalizeTicketsListResponse,
  type CrmTicketAppliedFilters,
  type CrmTicketGridRow,
  type CrmTicketPriority,
  type CrmTicketStatus,
  type CrmTicketsListTab,
} from "@components/crm/tickets/crmTicketsListDomain";

type TicketStatus = CrmTicketStatus;
type TicketPriority = CrmTicketPriority;
type TicketFilters = CrmTicketAppliedFilters;
type TicketRow = CrmTicketGridRow;

const ALL_COLUMNS = [
  "ticket_name",
  "pipeline",
  "ticket_status",
  "create_date",
  "priority",
  "ticket_owner",
  "source",
  "last_activity_date",
];

const DEFAULT_TICKET_TABLE_COLUMNS = [...ALL_COLUMNS, "actions"];

const CrmTicketsPage = () => {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchValue, setSearchValue] = useState<string>("");
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [editingTicketId, setEditingTicketId] = useState<number | null>(null);
  const [editingTicketInitial, setEditingTicketInitial] =
    useState<unknown>(undefined);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    rowsPerPage: 10,
  });

  const [showTicketSidebar, setShowTicketSidebar] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketRow | null>(null);

  const [currentFilters, setCurrentFilters] = useState<TicketFilters>({
    ...DEFAULT_CRM_TICKET_FILTERS,
  });
  const [appliedFilters, setAppliedFilters] = useState<TicketFilters>({
    ...DEFAULT_CRM_TICKET_FILTERS,
  });

  const appliedFiltersKey = useMemo(
    () => JSON.stringify(appliedFilters),
    [appliedFilters],
  );

  const hierarchyQuery = useQuery({
    queryKey: crmAppKeys.crmTicketsPage.hierarchyExtensions(),
    queryFn: async () => {
      const hierarchyData = await GetHierarchyData(ModuleSlug.TICKET);
      return Array.isArray(hierarchyData?.extensions)
        ? hierarchyData.extensions
        : [];
    },
  });

  const statusesQuery = useQuery({
    queryKey: crmAppKeys.crmTicketsPage.statuses(),
    queryFn: async () => {
      const statuses = await GetAllStatuses();
      return Array.isArray(statuses) ? statuses : [];
    },
  });

  const ticketsQuery = useQuery({
    queryKey: crmAppKeys.crmTicketsPage.list({
      search: searchValue.trim(),
      filtersKey: appliedFiltersKey,
      page: pagination.currentPage,
      perPage: pagination.rowsPerPage,
      activeTab,
    }),
    queryFn: async () => {
      const extensions = hierarchyQuery.data ?? [];
      const listRequest = buildCrmTicketsListRequest(
        appliedFilters,
        extensions,
        {
          page: pagination.currentPage,
          perPage: pagination.rowsPerPage,
          search: searchValue.trim(),
          activeTab: activeTab as CrmTicketsListTab,
          moduleSlug: ModuleSlug.TICKET,
          statuses: statusesQuery.data ?? [],
        },
      );

      const response = await ListTickets(listRequest);
      return normalizeTicketsListResponse(response);
    },
    enabled: hierarchyQuery.isSuccess && statusesQuery.isSuccess,
  });

  const dashboardQuery = useQuery({
    queryKey: crmAppKeys.crmTicketsPage.dashboard(appliedFiltersKey),
    queryFn: async () => {
      const extensions = hierarchyQuery.data ?? [];
      return DashboardData(
        buildCrmTicketsListApiFilters(appliedFilters, extensions, {
          activeTab: "all",
          statuses: statusesQuery.data ?? [],
        }),
      );
    },
    enabled: hierarchyQuery.isSuccess && statusesQuery.isSuccess,
  });

  const ticketDetailQuery = useQuery({
    queryKey: crmAppKeys.crmTicketsPage.detail(
      String(selectedTicket?.id ?? ""),
    ),
    queryFn: async () => {
      if (selectedTicket == null) {
        return null;
      }
      return GetTicket(String(selectedTicket.id));
    },
    enabled: showTicketSidebar && selectedTicket != null,
  });

  const tickets = useMemo(
    () =>
      mapApiTicketsToCrmGridRows(
        ticketsQuery.data?.items ?? [],
        hierarchyQuery.data ?? [],
      ),
    [ticketsQuery.data?.items, hierarchyQuery.data],
  );

  const ticketsListTotal = ticketsQuery.data?.total ?? 0;

  const dashboardStats = useMemo(
    () => mapDashboardToCrmStats(dashboardQuery.data),
    [dashboardQuery.data],
  );

  const openCreateTicketModal = useCallback(() => {
    setEditingTicketId(null);
    setEditingTicketInitial(undefined);
    setShowCreateTicketModal(true);
  }, []);

  const openEditTicketModal = useCallback(
    (ticketId: number, initialTicket?: unknown) => {
      const row = tickets.find((ticket) => ticket.id === ticketId);
      setEditingTicketId(ticketId);
      setEditingTicketInitial(initialTicket ?? row?.rawData);
      setShowCreateTicketModal(true);
    },
    [tickets],
  );

  const closeCreateTicketModal = useCallback(() => {
    setShowCreateTicketModal(false);
    setEditingTicketId(null);
    setEditingTicketInitial(undefined);
  }, []);

  const refreshTickets = useCallback(() => {
    queryClient
      .invalidateQueries({ queryKey: crmAppKeys.crmTicketsPage.all() })
      .catch(() => undefined);
  }, [queryClient]);

  const handleDeleteTicket = useCallback(
    (row: TicketRow) => {
      DeleteTicket(String(row.id))
        .then((deleted) => {
          if (deleted) {
            refreshTickets();
          }
        })
        .catch(() => undefined);
    },
    [refreshTickets],
  );

  const applyCommittedFilters = useCallback((filters: TicketFilters) => {
    setAppliedFilters(filters);
    setCurrentFilters(filters);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, []);

  const setStagedTicketFilters = useCallback(
    (filters: Record<string, unknown>) => {
      setCurrentFilters(filters as TicketFilters);
    },
    [],
  );

  const applyCommittedFiltersStaged = useCallback(
    (filters: Record<string, unknown>) => {
      applyCommittedFilters(filters as TicketFilters);
    },
    [applyCommittedFilters],
  );

  const {
    handleApplyFiltersClick,
    handleResetFiltersClick,
    hasUnappliedFilterChanges,
    hasNonDefaultFilters,
  } = useStagedFiltersActions(
    currentFilters,
    appliedFilters,
    DEFAULT_CRM_TICKET_FILTERS,
    setStagedTicketFilters,
    applyCommittedFiltersStaged,
  );

  const handleFiltersChange = useCallback(
    (update: TicketFilters | ((prev: TicketFilters) => TicketFilters)) => {
      setCurrentFilters((prev) =>
        typeof update === "function" ? update(prev) : update,
      );
    },
    [],
  );

  const ticketTabs: TabConfig[] = useMemo(
    () => [
      {
        id: "all",
        label: "All Tickets",
        count: dashboardStats.total,
        removable: false,
      },
      {
        id: "open",
        label: "Open tickets",
        count: dashboardStats.open,
        removable: false,
      },
      {
        id: "unassigned",
        label: "Unassigned ticket",
        count: dashboardStats.unassigned,
        removable: false,
      },
    ],
    [dashboardStats],
  );

  const renderAddTicketsButton = useCallback(
    () => (
      <button
        type="button"
        onClick={openCreateTicketModal}
        style={{
          padding: "9px 13px",
          backgroundColor: "#000000",
          color: "#ffffff",
          border: "none",
          borderRadius: "4px",
          fontSize: "12px",
          fontWeight: "500",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          right: 22,
          position: "absolute",
          top: 20,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#1a1a1a";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#000000";
        }}
      >
        Create ticket
      </button>
    ),
    [openCreateTicketModal],
  );

  const ticketsColumns: TableColumn<TicketRow>[] = useMemo(
    () => [
      {
        key: "ticket_name",
        label: "Ticket name",
        sortable: true,
        type: "text",
      },
      { key: "pipeline", label: "Pipeline", sortable: true, type: "text" },
      {
        key: "ticket_status",
        label: "Ticket Status",
        sortable: true,
        type: "badge",
        badge: {
          getVariant: (row) => {
            if (row.ticket_status === "Open") return "warning";
            if (row.ticket_status === "Resolved") return "success";
            return "info";
          },
        },
      },
      {
        key: "create_date",
        label: "Create date",
        sortable: true,
        type: "date",
        sortKey: "created_at",
      },
      {
        key: "priority",
        label: "Priority",
        sortable: true,
        type: "badge",
        badge: {
          getVariant: (row) => {
            if (row.priority === "High") return "danger";
            if (row.priority === "Medium") return "warning";
            return "secondary";
          },
        },
      },
      {
        key: "ticket_owner",
        label: "Ticket owner",
        sortable: true,
        type: "text",
      },
      { key: "source", label: "Source", sortable: true, type: "text" },
      {
        key: "last_activity_date",
        label: "Last activity date",
        sortable: true,
        type: "date",
        sortKey: "updated_at",
      },
    ],
    [],
  );

  const openPreviewSidebar = useCallback((row: TicketRow) => {
    setSelectedTicket(row);
    setShowTicketSidebar(true);
  }, []);

  const ticketTableActions: TableAction<TicketRow>[] = useMemo(
    () => [
      {
        label: "View",
        icon: <Eye size={16} />,
        onClick: (row) => openPreviewSidebar(row),
        variant: "link",
      },
      {
        label: "Edit",
        icon: <Pencil size={16} />,
        onClick: (row) => openEditTicketModal(row.id, row.rawData),
        variant: "link",
      },
      {
        label: "Delete",
        icon: <Trash2 size={16} />,
        onClick: (row) => handleDeleteTicket(row),
        variant: "link",
        className: "text-danger",
      },
    ],
    [openPreviewSidebar, openEditTicketModal, handleDeleteTicket],
  );

  const handleCloseSidebar = useCallback(() => {
    setShowTicketSidebar(false);
    setSelectedTicket(null);
  }, []);

  const ticketSidebarSections: SidebarSection[] = useMemo(() => {
    if (!selectedTicket) return [];
    const activityCount = getTicketActivityCount(ticketDetailQuery.data);
    const notesCount = getTicketCommentsCount(ticketDetailQuery.data);
    return [
      {
        id: "ticket-overview",
        title: "Ticket Overview",
        icon: Layers,
        defaultExpanded: true,
        collapsible: true,
        actions: [
          {
            label: "Edit all properties",
            onClick: () => {
              setShowTicketSidebar(false);
              openEditTicketModal(selectedTicket.id, selectedTicket.rawData);
            },
          },
        ],
        fields: [
          {
            label: "Ticket Name",
            value: selectedTicket.ticket_name,
            copyable: true,
          },
          { label: "Pipeline", value: selectedTicket.pipeline },
          {
            label: "Status",
            value: selectedTicket.ticket_status,
            type: "badge",
          },
          { label: "Priority", value: selectedTicket.priority, type: "badge" },
          { label: "Owner", value: selectedTicket.ticket_owner, icon: User },
          { label: "Source", value: selectedTicket.source, icon: Tag },
          {
            label: "Created Date",
            value: selectedTicket.created_at || selectedTicket.create_date,
            type: "date",
          },
          {
            label: "Last Updated",
            value:
              selectedTicket.updated_at || selectedTicket.last_activity_date,
            type: "date",
          },
        ],
      },
      {
        id: "ticket-dates",
        title: "Dates",
        icon: Calendar,
        defaultExpanded: true,
        collapsible: true,
        fields: [
          { label: "Created", value: selectedTicket.create_date, type: "date" },
          {
            label: "Last activity",
            value: selectedTicket.last_activity_date,
            type: "date",
          },
        ],
      },
      {
        id: "recent-activities",
        title: "Recent activities",
        icon: History,
        collapsible: true,
        defaultExpanded: true,
        count: activityCount,
        emptyState: {
          icon: History,
          message: "No recent activities for this ticket.",
        },
      },
      {
        id: "notes",
        title: "Notes",
        icon: FileText,
        collapsible: true,
        defaultExpanded: true,
        count: notesCount,
        emptyState: {
          icon: FileText,
          message: "No notes added yet.",
          action: {
            label: "Edit ticket",
            onClick: () => {
              setShowTicketSidebar(false);
              openEditTicketModal(selectedTicket.id, selectedTicket.rawData);
            },
          },
        },
      },
    ];
  }, [selectedTicket, openEditTicketModal, ticketDetailQuery.data]);

  const ticketExtensions = useMemo(
    (): Array<{
      id?: unknown;
      display_name?: string;
      name?: string;
      extension?: string;
    }> => hierarchyQuery.data ?? [],
    [hierarchyQuery.data],
  );

  const crmTicketsFilterPills = useCrmTicketsFilterPills({
    currentFilters,
    onFiltersChange: handleFiltersChange,
    extensions: ticketExtensions,
  });

  const ticketsStatsCards = useMemo(
    () => [
      {
        title: "All Tickets",
        value: dashboardStats.total,
        icon: Layers,
        iconColor: "#6366F1",
        iconBgColor: "#EEF2FF",
      },
      {
        title: "Open Tickets",
        value: dashboardStats.open,
        icon: AlertCircle,
        iconColor: "#F59E0B",
        iconBgColor: "#FEF3C7",
      },
      {
        title: "Unassigned",
        value: dashboardStats.unassigned,
        icon: User,
        iconColor: "#10B981",
        iconBgColor: "#D1FAE5",
      },
    ],
    [dashboardStats],
  );

  const handleFilterChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, []);

  const ticketsToolbarConfig = useMemo(
    () =>
      buildCrmTicketsTableToolbar({
        searchValue,
        onSearchChange: handleSearchChange,
        ticketTabs,
        activeTab,
        onTabChange: handleFilterChange,
        filterPills: crmTicketsFilterPills,
        handleApplyFiltersClick,
        handleResetFiltersClick,
        hasUnappliedFilterChanges,
        hasNonDefaultFilters,
        rightActions: renderAddTicketsButton(),
      }),
    [
      searchValue,
      ticketTabs,
      activeTab,
      handleFilterChange,
      crmTicketsFilterPills,
      handleApplyFiltersClick,
      handleResetFiltersClick,
      hasUnappliedFilterChanges,
      hasNonDefaultFilters,
      renderAddTicketsButton,
      handleSearchChange,
    ],
  );

  return (
    <div className="crm-tickets-page">
      <div
        style={{
          display: "flex",
          gap: "0",
          height: "calc(100vh)",
          overflow: "hidden",
        }}
      >
        <div className="tickets-scrollable-content" style={{ flex: 1 }}>
          <div className="container-fluid">
            <div className="tickets-table-wrapper">
              <GenericTable
                data={tickets}
                columns={ticketsColumns}
                showToolbarActions={false}
                customizableColumns={true}
                defaultSelectedColumns={DEFAULT_TICKET_TABLE_COLUMNS}
                columnStorageKey="crm-tickets-columns-v2"
                pinActionsColumn={true}
                actions={ticketTableActions}
                showActions={true}
                sortable={true}
                defaultSortBy="create_date"
                defaultSortOrder="desc"
                pagination={{
                  currentPage: pagination.currentPage,
                  rowsPerPage: pagination.rowsPerPage,
                  totalRows: ticketsListTotal,
                  pageSizeOptions: [10, 15, 25, 50, 100],
                }}
                onPaginationChange={(page, rowsPerPage) => {
                  setPagination((prev) => ({
                    ...prev,
                    currentPage: page,
                    rowsPerPage,
                  }));
                }}
                onPreviewClick={(row) => openPreviewSidebar(row)}
                onFirstColumnClick={(row) => openPreviewSidebar(row)}
                onRowDoubleClick={(row) => openPreviewSidebar(row)}
                  loading={
                    ticketsQuery.isLoading ||
                    hierarchyQuery.isLoading ||
                    statusesQuery.isLoading ||
                    dashboardQuery.isLoading
                  }
                emptyMessage="No tickets found matching your criteria"
                loadingMessage="Loading tickets..."
                hover={true}
                uniqueKey="id"
                fixedHeight={true}
                  maxHeight="calc(100vh - 340px)"
                showToolbar={true}
                toolbar={ticketsToolbarConfig}
                statsCards={ticketsStatsCards}
              />
            </div>
          </div>
        </div>

        {showTicketSidebar && selectedTicket && (
          <GenericSidebar
            isOpen={showTicketSidebar}
            onClose={handleCloseSidebar}
            title={selectedTicket.ticket_name}
            subtitle={selectedTicket.pipeline}
            email={selectedTicket.email}
            phone={selectedTicket.phone}
            senderName="CRM Agent"
            senderEmail="crm@example.com"
            company={selectedTicket.source}
            avatar={{
              initials: selectedTicket.ticket_name.slice(0, 2).toUpperCase(),
              name: selectedTicket.ticket_name,
              gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
            crmSummary={getTicketCrmSummary(selectedTicket)}
            actionsDropdown={{
              label: "Actions",
              items: [
                {
                  label: "Edit Ticket",
                  onClick: () => {
                    setShowTicketSidebar(false);
                    openEditTicketModal(
                      selectedTicket.id,
                      selectedTicket.rawData,
                    );
                  },
                },
                {
                  label: "Delete",
                  onClick: () => {
                    DeleteTicket(String(selectedTicket.id))
                      .then((deleted) => {
                        if (deleted) {
                          handleCloseSidebar();
                          refreshTickets();
                        }
                      })
                      .catch(() => undefined);
                  },
                },
              ],
            }}
            sections={ticketSidebarSections}
          />
        )}
      </div>

      {showCreateTicketModal && (
        <CreateTicketSidebar
          editTicketId={editingTicketId}
          initialTicket={editingTicketInitial}
          onClose={closeCreateTicketModal}
          onSuccess={() => {
            closeCreateTicketModal();
            refreshTickets();
          }}
        />
      )}
    </div>
  );
};

CrmTicketsPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmTicketsPage;
