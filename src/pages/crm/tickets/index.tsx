import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useCallback, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Modal, Form, Button } from "react-bootstrap";
import Layout from "@layout/index";
import GenericTable, {
  TableColumn,
  FilterPill,
  TabConfig,
} from "@components/GenericTable";
import GenericFilterSidebar, {
  FilterField,
} from "@components/GenericFilterSidebar";
import GenericSidebar, { SidebarSection } from "@components/GenericSidebarNew";
import { CreateTicketSidebar } from "@components/renderCreateTicketForm";
import { Calendar, AlertCircle, User, Layers, Tag, History, FileText } from "lucide-react";

type TicketStatus = "Open" | "In Progress" | "Resolved";
type TicketPriority = "Low" | "Medium" | "High";
type TicketFilters = {
  ticketOwner: string;
  createDate: string;
  lastActivityDate: string;
  priority: TicketPriority | "All Priorities";
};

type CrmSummary = {
  id: number;
  summary: string;
};

type TicketRowData = {
  crm_summary?: CrmSummary;
  data?: {
    crm_summary?: CrmSummary;
  };
};

interface TicketRow {
  id: number;
  ticket_name: string;
  pipeline: string;
  ticket_status: TicketStatus;
  create_date: string;
  priority: TicketPriority;
  ticket_owner: string;
  source: string;
  last_activity_date: string;
  email?: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
  crm_summary?: CrmSummary;
  data?: TicketRowData;
}

const getTicketCrmSummary = (ticket: TicketRow): CrmSummary | undefined =>
  ticket.crm_summary ?? ticket.data?.crm_summary ?? ticket.data?.data?.crm_summary;

const DUMMY_TICKETS: TicketRow[] = [
  {
    id: 101,
    ticket_name: "Login issue for enterprise account",
    pipeline: "Support Pipeline",
    ticket_status: "Open",
    create_date: "2026-03-09",
    priority: "High",
    ticket_owner: "John Carter",
    source: "Email",
    last_activity_date: "2026-03-10",
    email: "john.carter@example.com",
    phone: "+971500000001",
    created_at: "2026-03-09",
    updated_at: "2026-03-10",
    crm_summary: {
      id: 1,
      summary: "Customer reported enterprise login failure. Identity verification in progress.",
    },
  },
  {
    id: 102,
    ticket_name: "Billing clarification request",
    pipeline: "Billing Pipeline",
    ticket_status: "In Progress",
    create_date: "2026-03-08",
    priority: "Medium",
    ticket_owner: "Unassigned",
    source: "Web Form",
    last_activity_date: "2026-03-10",
    email: "accounts@example.com",
    phone: "+971500000002",
    created_at: "2026-03-08",
    updated_at: "2026-03-10",
    data: {
      crm_summary: {
        id: 2,
        summary: "Customer requested billing clarification. Awaiting finance team update.",
      },
    },
  },
];

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

const DEFAULT_TICKET_FILTERS: TicketFilters = {
  ticketOwner: "All Owners",
  createDate: "",
  lastActivityDate: "",
  priority: "All Priorities",
};

const CrmTicketsPage = () => {
  const router = useRouter();

  const openTicketDetailPage = useCallback(
    (ticketId: number) => {
      router
        .push({
          pathname: "/crm/tickets/tickets-detailpage",
          query: { id: String(ticketId) },
        })
        .catch(() => {
          // navigation errors can happen during rapid route changes
        });
    },
    [router],
  );

  const [tickets] = useState<TicketRow[]>(DUMMY_TICKETS);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchValue, setSearchValue] = useState<string>("");
  const [tableView, setTableView] = useState<"table" | "board">("table");
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
  const [showColumnEditor, setShowColumnEditor] = useState(false);
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(ALL_COLUMNS);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    rowsPerPage: 10,
    sortColumn: "create_date",
    sortDirection: "desc" as "asc" | "desc",
  });

  const [showTicketSidebar, setShowTicketSidebar] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketRow | null>(null);

  const persistSelectedColumns = useCallback((columns: string[]) => {
    try {
      if (globalThis.window !== undefined) {
        globalThis.window.localStorage.setItem(
          "ticketsSelectedColumns",
          JSON.stringify(columns),
        );
      }
    } catch {
      // Ignore storage errors (SSR, private mode, quota).
    }
  }, []);

  const handleColumnToggle = useCallback(
    (column: string, checked: boolean) => {
      setSelectedColumns((prev) => {
        if (checked) return prev.includes(column) ? prev : [...prev, column];
        const next = prev.filter((k) => k !== column);
        return next.length ? next : ALL_COLUMNS;
      });
    },
    [],
  );

  const [filterForm, setFilterForm] = useState<TicketFilters>({ ...DEFAULT_TICKET_FILTERS });
  const [appliedFilters, setAppliedFilters] = useState<TicketFilters>({
    ...DEFAULT_TICKET_FILTERS,
  });

  const handleCloseFilterSidebar = useCallback(() => {
    setShowFilterSidebar(false);
  }, []);

  const handleApplyFilters = useCallback(() => {
    setAppliedFilters(filterForm);
    setShowFilterSidebar(false);
  }, [filterForm]);

  const handleResetFilters = useCallback(() => {
    const reset = { ...DEFAULT_TICKET_FILTERS };
    setFilterForm(reset);
    setAppliedFilters(reset);
    setShowFilterSidebar(false);
  }, []);

  const filteredData = useMemo(() => {
    let list = [...tickets];

    if (activeTab === "open") {
      list = list.filter((ticket) => ticket.ticket_status !== "Resolved");
    } else if (activeTab === "unassigned") {
      list = list.filter((ticket) => ticket.ticket_owner === "Unassigned");
    }

    const q = searchValue.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (ticket) =>
          ticket.ticket_name.toLowerCase().includes(q) ||
          ticket.pipeline.toLowerCase().includes(q) ||
          ticket.ticket_owner.toLowerCase().includes(q) ||
          ticket.source.toLowerCase().includes(q),
      );
    }

    if (appliedFilters.ticketOwner !== "All Owners") {
      list = list.filter((ticket) => ticket.ticket_owner === appliedFilters.ticketOwner);
    }
    if (appliedFilters.priority !== "All Priorities") {
      list = list.filter((ticket) => ticket.priority === appliedFilters.priority);
    }
    if (appliedFilters.createDate) {
      list = list.filter((ticket) => ticket.create_date === appliedFilters.createDate);
    }
    if (appliedFilters.lastActivityDate) {
      list = list.filter(
        (ticket) => ticket.last_activity_date === appliedFilters.lastActivityDate,
      );
    }

    return list;
  }, [tickets, activeTab, searchValue, appliedFilters]);

  const pagedData = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.rowsPerPage;
    const end = start + pagination.rowsPerPage;
    return filteredData.slice(start, end);
  }, [filteredData, pagination.currentPage, pagination.rowsPerPage]);

  const ticketTabs: TabConfig[] = useMemo(() => {
    const allCount = tickets.length;
    const openCount = tickets.filter((ticket) => ticket.ticket_status !== "Resolved").length;
    const unassignedCount = tickets.filter((ticket) => ticket.ticket_owner === "Unassigned").length;

    return [
      { id: "all", label: "All Tickets", count: allCount, removable: false },
      { id: "open", label: "Open tickets", count: openCount, removable: false },
      {
        id: "unassigned",
        label: "Unassigned ticket",
        count: unassignedCount,
        removable: false,
      },
    ];
  }, [tickets]);

  const renderAddTicketsButton = useCallback(
    () => (
      <button
        type="button"
        onClick={() => setShowCreateTicketModal(true)}
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
    [],
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
      },
    ],
    [],
  );

  const openPreviewSidebar = useCallback((row: TicketRow) => {
    setSelectedTicket(row);
    setShowTicketSidebar(true);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setShowTicketSidebar(false);
    setSelectedTicket(null);
  }, []);

  const ticketSidebarSections: SidebarSection[] = useMemo(() => {
    if (!selectedTicket) return [];
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
              setShowCreateTicketModal(true);
            },
          },
        ],
        fields: [
          { label: "Ticket Name", value: selectedTicket.ticket_name, copyable: true },
          { label: "Pipeline", value: selectedTicket.pipeline },
          { label: "Status", value: selectedTicket.ticket_status, type: "badge" },
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
            value: selectedTicket.updated_at || selectedTicket.last_activity_date,
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
        count: 0,
        emptyState: {
          icon: History,
          message: "No recent activities for this ticket.",
          action: {
            label: "Open detail page",
            onClick: () => {
              handleCloseSidebar();
              openTicketDetailPage(selectedTicket.id);
            },
          },
        },
      },
      {
        id: "notes",
        title: "Notes",
        icon: FileText,
        collapsible: true,
        defaultExpanded: true,
        count: 0,
        emptyState: {
          icon: FileText,
          message: "No notes added yet.",
          action: {
            label: "Edit ticket",
            onClick: () => {
              setShowTicketSidebar(false);
              setShowCreateTicketModal(true);
            },
          },
        },
      },
    ];
  }, [selectedTicket, handleCloseSidebar, openTicketDetailPage]);

  const uniqueOwners = useMemo(
    () => Array.from(new Set(tickets.map((ticket) => ticket.ticket_owner))),
    [tickets],
  );

  const advancedFilterFields: FilterField[] = useMemo(
    () => [
      {
        id: "ticketOwner",
        label: "Ticket owner",
        type: "dropdown",
        value: filterForm.ticketOwner,
        onChange: (value) =>
          setFilterForm((prev) => ({ ...prev, ticketOwner: value || "All Owners" })),
        options: [
          { value: "All Owners", label: "All Owners" },
          ...uniqueOwners.map((owner) => ({ value: owner, label: owner })),
        ],
      },
      {
        id: "createDate",
        label: "Create date",
        type: "date",
        value: filterForm.createDate,
        onChange: (value) => setFilterForm((prev) => ({ ...prev, createDate: value || "" })),
      },
      {
        id: "lastActivityDate",
        label: "Last activity date",
        type: "date",
        value: filterForm.lastActivityDate,
        onChange: (value) =>
          setFilterForm((prev) => ({ ...prev, lastActivityDate: value || "" })),
      },
      {
        id: "priority",
        label: "Priority",
        type: "dropdown",
        value: filterForm.priority,
        onChange: (value) =>
          setFilterForm((prev) => ({ ...prev, priority: value || "All Priorities" })),
        options: [
          { value: "All Priorities", label: "All Priorities" },
          { value: "Low", label: "Low" },
          { value: "Medium", label: "Medium" },
          { value: "High", label: "High" },
        ],
      },
    ],
    [filterForm, uniqueOwners],
  );

  const filterPills: FilterPill[] = useMemo(
    () => [
      {
        id: "ticketOwner",
        label:
          appliedFilters.ticketOwner === "All Owners"
            ? "Ticket owner"
            : `Ticket owner: ${appliedFilters.ticketOwner}`,
        showDropdown: false,
        onClick: () => setShowFilterSidebar(true),
      },
      {
        id: "createDate",
        label: appliedFilters.createDate ? `Create date: ${appliedFilters.createDate}` : "Create date",
        showDropdown: false,
        onClick: () => setShowFilterSidebar(true),
      },
      {
        id: "lastActivityDate",
        label: appliedFilters.lastActivityDate
          ? `Last activity date: ${appliedFilters.lastActivityDate}`
          : "Last activity date",
        showDropdown: false,
        onClick: () => setShowFilterSidebar(true),
      },
      {
        id: "priority",
        label:
          appliedFilters.priority === "All Priorities"
            ? "Priority"
            : `Priority: ${appliedFilters.priority}`,
        showDropdown: false,
        onClick: () => setShowFilterSidebar(true),
      },
      {
        id: "more",
        label: "More",
        showDropdown: false,
        onClick: () => setShowFilterSidebar(true),
      },
      {
        id: "advanced",
        label: "Advance filters",
        showDropdown: false,
        onClick: () => setShowFilterSidebar(true),
      },
    ],
    [appliedFilters],
  );

  const ticketsStatsCards = useMemo(
    () => [
      {
        title: "All Tickets",
        value: tickets.length,
        icon: Layers,
        iconColor: "#6366F1",
        iconBgColor: "#EEF2FF",
      },
      {
        title: "Open Tickets",
        value: tickets.filter((ticket) => ticket.ticket_status !== "Resolved").length,
        icon: AlertCircle,
        iconColor: "#F59E0B",
        iconBgColor: "#FEF3C7",
      },
      {
        title: "Unassigned",
        value: tickets.filter((ticket) => ticket.ticket_owner === "Unassigned").length,
        icon: User,
        iconColor: "#10B981",
        iconBgColor: "#D1FAE5",
      },
    ],
    [tickets],
  );

  const visibleColumns = useMemo(
    () => ticketsColumns.filter((column) => selectedColumns.includes(column.key)),
    [ticketsColumns, selectedColumns],
  );

  const handleFilterChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, []);

  const ticketsToolbarConfig = useMemo(
    () => ({
      showSearch: true,
      searchValue,
      searchPlaceholder: "Search tickets...",
      onSearchChange: setSearchValue,
      onSearch: () => {},
      showTabs: true,
      tabs: ticketTabs,
      activeTab,
      onTabChange: handleFilterChange,
      tabsDropdownLabel: "Tickets",
      showFiltersButton: true,
      onFiltersClick: () => setShowFilterSidebar(true),
      showFilterPills: true,
      filterPills,
      showMoreFiltersButton: false,
      showAdvancedFilters: true,
      onAdvancedFiltersClick: () => setShowFilterSidebar(true),
      showSortButton: true,
      showExportButton: true,
      onExportClick: () => console.info("Export is not wired yet."),
      showEditColumns: true,
      onEditColumnsClick: () => setShowColumnEditor(true),
      showTableViewDropdown: true,
      currentTableView: tableView,
      onTableViewChange: setTableView,
      showImport: true,
      onImportClick: () => console.info("Import is not wired yet."),
      rightActions: renderAddTicketsButton(),
    }),
    [searchValue, ticketTabs, activeTab, handleFilterChange, filterPills, tableView, renderAddTicketsButton],
  );

  return (
    <React.Fragment>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .tickets-table-wrapper {
          width: 100%;
          overflow: hidden;
        }
        .tickets-scrollable-content {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
        }
      `,
        }}
      />
      {/* <div style={{ padding: "12px 16px 0" }}>
        <h4 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#111827" }}>Tickets</h4>
      </div> */}

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
            <div
              className="tickets-table-wrapper"
              style={{
                flex: 1,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <GenericTable
                data={pagedData}
                columns={visibleColumns}
                showActions={false}
                sortable={true}
                defaultSortColumn="create_date"
                defaultSortDirection="desc"
                pagination={{
                  currentPage: pagination.currentPage,
                  rowsPerPage: pagination.rowsPerPage,
                  totalRows: filteredData.length,
                  pageSizeOptions: [10, 15, 25, 50, 100],
                }}
                onPaginationChange={(page, rowsPerPage) => {
                  setPagination((prev) => ({
                    ...prev,
                    currentPage: page,
                    rowsPerPage,
                  }));
                }}
                onSort={(column, direction) => {
                  setPagination((prev) => ({
                    ...prev,
                    sortColumn: column,
                    sortDirection: direction,
                  }));
                }}
                onPreviewClick={(row) => openPreviewSidebar(row)}
                onFirstColumnClick={(row) =>
                  openTicketDetailPage(row.id)
                }
                onRowDoubleClick={(row) => openPreviewSidebar(row)}
                loading={false}
                emptyMessage="No tickets found matching your criteria"
                loadingMessage="Loading tickets..."
                hover={true}
                uniqueKey="id"
                fixedHeight={true}
                maxHeight="calc(100vh - 345px)"
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
                  label: "View Ticket Detail",
                  onClick: () => {
                    handleCloseSidebar();
                    openTicketDetailPage(selectedTicket.id);
                  },
                },
                {
                  label: "Edit Ticket",
                  onClick: () => {
                    setShowTicketSidebar(false);
                    setShowCreateTicketModal(true);
                  },
                },
                {
                  label: "Delete",
                  onClick: () => {
                    console.info("Delete ticket", selectedTicket.id);
                  },
                },
              ],
            }}
            sections={ticketSidebarSections}
            recordLink={{
              label: "View record",
              onClick: () => {
                handleCloseSidebar();
                openTicketDetailPage(selectedTicket.id);
              },
            }}
          />
        )}
      </div>

      <GenericFilterSidebar
        isOpen={showFilterSidebar}
        onClose={handleCloseFilterSidebar}
        title="Filters"
        subtitle="Filter tickets"
        filters={advancedFilterFields}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        width="400px"
        showApplyButton
        showResetButton
      />

      <Modal show={showColumnEditor} onHide={() => setShowColumnEditor(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Customize Columns</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {ALL_COLUMNS.map((column) => {
            const found = ticketsColumns.find((c) => c.key === column);
            return (
              <Form.Check
                key={column}
                type="checkbox"
                className="mb-2"
                label={found?.label || column}
                checked={selectedColumns.includes(column)}
                onChange={(e) => {
                  handleColumnToggle(column, e.target.checked);
                }}
              />
            );
          })}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => {
              setSelectedColumns(ALL_COLUMNS);
              persistSelectedColumns(ALL_COLUMNS);
            }}
          >
            Reset
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              persistSelectedColumns(selectedColumns);
              setShowColumnEditor(false);
            }}
          >
            Apply
          </Button>
        </Modal.Footer>
      </Modal>

      {showCreateTicketModal && (
        <CreateTicketSidebar
          onClose={() => setShowCreateTicketModal(false)}
          onSuccess={() => setShowCreateTicketModal(false)}
        />
      )}
    </React.Fragment>
  );
};

CrmTicketsPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmTicketsPage;
