import React, {
  ReactElement,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/router";
import {
  Row,
  Col,
  Button,
  Form,
  Modal,
} from "react-bootstrap";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import ProtectedRoute from "@components/ProtectedRoute";
import {
  Target,
  Handshake,
  ShoppingBag,
  AlertCircle,
} from "lucide-react";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import { ActivityTimelineModalView } from "@page-modules/crm/activities/ActivityTimelineModalView";
import { ActivityHistorySidebarPanel } from "@page-modules/crm/activities/ActivityHistorySidebarPanel";
import { getActivityHistoryTableColumns } from "@page-modules/crm/activities/activityHistoryTableColumns";
import type { ActivityRecord } from "@page-modules/crm/activities/activityHistoryPageTypes";
import { resolveActivityTabFromRouter } from "@page-modules/crm/activities/activityHistoryListParams";
import { useCrmActivityHistoryPageData } from "@hooks/useCrmActivityHistoryPageData";
import "@assets/scss/datatable-style.scss";
import "@assets/scss/ticketsnew.scss";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import "@assets/scss/crm-activities-page.scss";
import "@assets/scss/crm-activity-timeline-modal.scss";
import { stripTrailingParenthetical } from "@utils/displayName";
import { toast } from "react-toastify";
import GenericTable, {
  TabConfig,
  FilterPill,
} from "@components/GenericTable";
import GenericFilterSidebar, {
  FilterField,
} from "@components/GenericFilterSidebar";

/** Safely stringify an id-like value (string/number) without falling back to `[object Object]`. */
function toSafeIdString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "bigint") {
    return value.toString();
  }
  return "";
}

/** Determine if an activity row matches the current text search. */
function activitySearchMatches(
  activity: ActivityRecord,
  search: string,
): boolean {
  if (!search) return true;
  const searchLower = search.toLowerCase();
  return (
    activity.customer.toLowerCase().includes(searchLower) ||
    activity.agent.toLowerCase().includes(searchLower)
  );
}

/** Combine the "All Types" tab with the user's custom tabs, hiding count when inactive. */
function buildHistoryTabs(
  customTabs: TabConfig[],
  activityTypeFilter: string,
  totalCount: number,
): TabConfig[] {
  const allTab: TabConfig = {
    id: "all",
    label: "All Types",
    count: totalCount,
    removable: false,
  };
  const customTabsWithCount = customTabs.map((t) => ({
    ...t,
    count: activityTypeFilter === t.id ? totalCount : undefined,
  }));
  return [allTab, ...customTabsWithCount];
}

const HistoryPage = () => {
  const router = useRouter();
  // New Activity Tracker States
  const [activityTypeFilter, setActivityTypeFilter] = useState("all");
  const [activityFilters, setActivityFilters] = useState({
    agents: [] as string[], // Store extension IDs
    dateRange: { start: "", end: "" },
  });
  const [showActivitySidebar, setShowActivitySidebar] = useState(false);
  const [showFiltersSidebar, setShowFiltersSidebar] = useState(false);
  const [showActivityTimelineModal, setShowActivityTimelineModal] =
    useState(false);
  const [selectedActivityRecord, setSelectedActivityRecord] =
    useState<any>(null);
  const [activitySearch, setActivitySearch] = useState("");
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
    sort_by: "",
    sort_order: "asc" as "asc" | "desc",
  });
  const [customTabs, setCustomTabs] = useState<TabConfig[]>([]);
  const [showAddTabModal, setShowAddTabModal] = useState(false);
  const [showColumnEditor, setShowColumnEditor] = useState(false);

  const {
    extensions,
    allActivityRecords,
    loading,
    historyChain,
    recordStages,
    currentStageIndex,
    crmData,
    loadingHistory,
    loadingCrmData,
  } = useCrmActivityHistoryPageData({
    pagination,
    setPagination,
    activitySearch,
    activityTypeFilter,
    activityFilters,
    selectedActivityRecord,
    showActivitySidebar,
    showActivityTimelineModal,
  });

  const defaultSelectedColumns = [
    "customer",
    "agent",
    "lastActivity",
    "type",
    "stage",
  ];
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    () => defaultSelectedColumns,
  );
  const [draftSelectedColumns, setDraftSelectedColumns] = useState<string[]>(
    [],
  );
  const [tableMaxHeight, setTableMaxHeight] = useState("calc(100vh - 345px)");
  const [sidebarMarginTop, setSidebarMarginTop] = useState<number>(0);

  useEffect(() => {
    const headerHeight = 74;
    const paginationHeight = 130;
    const updateMaxHeight = () => {
      const toolbarEl = document.querySelector(".gt-toolbar-container");
      if (!toolbarEl) return;
      const toolbarHeight = toolbarEl.getBoundingClientRect().height;
      setTableMaxHeight(
        `calc(100vh - ${headerHeight + toolbarHeight + paginationHeight}px)`,
      );
    };
    updateMaxHeight();
    const observer = new ResizeObserver(updateMaxHeight);
    const toolbarEl = document.querySelector(".gt-toolbar-container");
    if (toolbarEl) observer.observe(toolbarEl);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const updateSidebarMargin = () => {
      const tabsEl = document.querySelector(".gt-toolbar-tabs-section");
      if (!tabsEl) return;
      setSidebarMarginTop(tabsEl.getBoundingClientRect().height);
    };
    updateSidebarMargin();
    const timeout = setTimeout(updateSidebarMargin, 100);
    window.addEventListener("resize", updateSidebarMargin);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", updateSidebarMargin);
    };
  }, []);

  const validHistoryFilters = ["all", "leads", "deals", "orders"];

  useEffect(() => {
    const next = resolveActivityTabFromRouter(
      router.isReady,
      router.query.tab,
      activityTypeFilter,
      validHistoryFilters,
    );
    if (next) setActivityTypeFilter(next);
  }, [router.isReady, router.query.tab, activityTypeFilter]);

  useEffect(() => {
    if (showColumnEditor) setDraftSelectedColumns([...selectedColumns]);
  }, [showColumnEditor, selectedColumns]);

  const handleFilterChange = useCallback(
    (filterId: string) => {
      setActivityTypeFilter(filterId);
      setPagination((prev) => ({ ...prev, current_page: 1 }));

      router.push(
        {
          pathname: router.pathname,
          query: { ...router.query, tab: filterId },
        },
        undefined,
        { shallow: true },
      );
    },
    [router],
  );

  const availableAgents: { value: string; label: string }[] = extensions.map(
    (ext: { id?: unknown; extension?: unknown; display_name?: string; name?: string }) => ({
      value: toSafeIdString(ext.id) || toSafeIdString(ext.extension),
      label: stripTrailingParenthetical(
        ext.display_name ||
          ext.name ||
          toSafeIdString(ext.id) ||
          toSafeIdString(ext.extension),
      ),
    }),
  );

  const filteredActivityRecords = allActivityRecords.filter((activity) =>
    activitySearchMatches(activity, activitySearch),
  );

  const typeFilterCounts = {
    all: allActivityRecords.length,
    prospects: allActivityRecords.filter((a) => a.type === "Prospect").length,
    leads: allActivityRecords.filter((a) => a.type === "Lead").length,
    deals: allActivityRecords.filter((a) => a.type === "Deal").length,
    orders: allActivityRecords.filter((a) => a.type === "Order").length,
  };

  const { PERMISSIONS } = HEADER_CONSTANTS;

  const tableColumns = useMemo(
    () => getActivityHistoryTableColumns(),
    [],
  );

  // Define filter fields for GenericFilterSidebar
  const filterFields: FilterField[] = [
    {
      id: "agents",
      label: "Agents",
      type: "multi-select",
      value: activityFilters.agents
        .map((agentId) => {
          const agent = availableAgents.find((a) => a.value === agentId);
          return agent ? { value: agent.value, label: agent.label } : null;
        })
        .filter(Boolean),
      onChange: (selected) => {
        setActivityFilters((prev) => ({
          ...prev,
          agents: selected ? selected.map((s: any) => s.value) : [],
        }));
      },
      options: availableAgents,
      placeholder: "Select agents...",
    },
    {
      id: "dateFrom",
      label: "From",
      type: "date",
      value: activityFilters.dateRange.start,
      onChange: (value) =>
        setActivityFilters((prev) => ({
          ...prev,
          dateRange: { ...prev.dateRange, start: value },
        })),
    },
    {
      id: "dateTo",
      label: "To",
      type: "date",
      value: activityFilters.dateRange.end,
      onChange: (value) =>
        setActivityFilters((prev) => ({
          ...prev,
          dateRange: { ...prev.dateRange, end: value },
        })),
    },
  ];

  const historyTabs: TabConfig[] = buildHistoryTabs(
    customTabs,
    activityTypeFilter,
    typeFilterCounts.all ?? pagination.total ?? 0,
  );

  const handleOpenFiltersSidebar = useCallback(() => {
    setShowFiltersSidebar(true);
  }, []);

  const historyFilterPills: FilterPill[] = [
    {
      id: "agents",
      label: "Agents",
      showDropdown: true,
      dropdownOptions: [
        {
          label: "All Agents",
          value: "all",
          onClick: () => {
            setActivityFilters((prev) => ({ ...prev, agents: [] }));
            setPagination((prev) => ({ ...prev, current_page: 1 }));
          },
        },
        ...availableAgents.map((agent) => ({
          label: agent.label,
          value: String(agent.value),
          onClick: () => {
            setActivityFilters((prev) => ({ ...prev, agents: [agent.value] }));
            setPagination((prev) => ({ ...prev, current_page: 1 }));
          },
        })),
      ],
    },
  ];

  const handlePreviewClick = (row: ActivityRecord) => {
    setSelectedActivityRecord(row);
    setShowActivitySidebar(true);
  };

  return (
    <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_CRM_HISTORY]}>
      <div>
        <BreadcrumbItem
          mainTitle="CRM"
          mainLink="/crm/dashboard"
          subTitle="Activity Management"
        />
        {/* Main flex container: content + sidebar (same layout as prospects) */}
        <div className="crm-activities-layout" style={{ display: "flex", height: "calc(100vh - 74px)", overflow: "hidden" }}>
          {/* Main content area - table and modals */}
          <div className="crm-activities-main">
        {/* Activities Table */}
        <GenericTable
          data={filteredActivityRecords}
          columns={tableColumns.filter((c) => selectedColumns.includes(c.key))}
          loading={loading}
          emptyMessage={
            <div className="text-center py-4">
              <AlertCircle size={48} className="mb-3 opacity-50" />
              <div>No activities found matching your criteria</div>
            </div>
          }
          loadingMessage="Loading activities..."
          pagination={{
            currentPage: pagination.current_page,
            rowsPerPage: pagination.per_page,
            totalRows: pagination.total,
            pageSizeOptions: [10, 15, 25, 50, 100],
          }}
          onPaginationChange={(page, rowsPerPage) => {
            setPagination((prev) => ({
              ...prev,
              current_page: page,
              per_page: rowsPerPage,
            }));
          }}
          sortable={true}
          defaultSortBy={pagination.sort_by}
          defaultSortOrder={pagination.sort_order}
          onSort={(column, direction) => {
            setPagination((prev) => ({
              ...prev,
              sort_by: column,
              sort_order: direction,
              current_page: 1,
            }));
          }}
          onPreviewClick={handlePreviewClick}
          onRowClick={(row) => {
            setSelectedActivityRecord(row);
            setShowActivitySidebar(true);
          }}
          hover={true}
          striped={false}
          fixedHeight={true}
          maxHeight={tableMaxHeight}
          showToolbar={true}
          toolbar={{
            showTabs: true,
            tabsDropdownLabel: "Activity",
            tabs: historyTabs,
            activeTab: activityTypeFilter,
            onTabChange: handleFilterChange,
            onTabAdd: () => setShowAddTabModal(true),
            onTabRemove: (tabId) => {
              setCustomTabs((tabs) => tabs.filter((t) => t.id !== tabId));
              if (activityTypeFilter === tabId) {
                handleFilterChange("all");
              }
            },
            showSearch: true,
            searchValue: activitySearch,
            searchPlaceholder: "Search activities by record name, agent...",
            onSearchChange: (value) => setActivitySearch(value),
            onSearch: () => {
              setPagination((prev) => ({ ...prev, current_page: 1 }));
            },
            showTableViewDropdown: true,
            tableViewLabel: "Table view",
            onTableViewClick: () => {},
            showEditColumns: true,
            onEditColumnsClick: () => setShowColumnEditor(true),
            showPipelineDropdown: false,
            pipelineLabel: "All Pipelines",
            onPipelineClick: () => {},
            showFiltersButton: true,
            filterPills: historyFilterPills,
            showAdvancedFilters: true,
            onAdvancedFiltersClick: handleOpenFiltersSidebar,
            showSortButton: true,
            showExportButton: true,
            onExportClick: () => {},
          }}
        />

        {/* Activity Timeline Modal */}
        <ActivityTimelineModalView
          show={showActivityTimelineModal}
          onClose={() => setShowActivityTimelineModal(false)}
          record={selectedActivityRecord}
          currentStageIndex={currentStageIndex}
          loadingHistory={loadingHistory}
          loadingCrmData={loadingCrmData}
          historyChain={historyChain}
          crmData={crmData}
          extensions={extensions}
        />

        {/* Add Tab Modal - add Leads, Deals, Orders as tabs */}
        <Modal show={showAddTabModal} onHide={() => setShowAddTabModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Add tab</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="text-muted mb-3">Select a type to add as a new tab</p>
            <div
              className="d-grid gap-2"
              style={{ maxHeight: "400px", overflowY: "auto" }}
            >
              {[
                { id: "leads", label: "Leads", icon: <Target size={16} /> },
                { id: "deals", label: "Deals", icon: <Handshake size={16} /> },
                {
                  id: "orders",
                  label: "Orders",
                  icon: <ShoppingBag size={16} />,
                },
              ].map((opt) => {
                const isAlreadyAdded = customTabs.some((t) => t.id === opt.id);
                return (
                  <Button
                    key={opt.id}
                    variant="outline-primary"
                    onClick={() => {
                      if (!isAlreadyAdded) {
                        setCustomTabs((prev) => [
                          ...prev,
                          {
                            id: opt.id,
                            label: opt.label,
                            removable: true,
                          },
                        ]);
                        setShowAddTabModal(false);
                        toast.success("Tab added successfully!");
                      }
                    }}
                    disabled={isAlreadyAdded}
                    className="d-flex align-items-center justify-content-start"
                    style={{ textAlign: "left" }}
                  >
                    {opt.icon}
                    <span className="ms-2">{opt.label}</span>
                  </Button>
                );
              })}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowAddTabModal(false)}
            >
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Column Editor Modal */}
        <Modal
          show={showColumnEditor}
          onHide={() => setShowColumnEditor(false)}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>Customize Columns</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="text-muted mb-3">
              Select which columns to display in the table
            </p>
            <Row>
              {tableColumns.map((col) => {
                const isChecked = draftSelectedColumns.includes(col.key);
                const isOnlySelected =
                  isChecked && draftSelectedColumns.length === 1;
                return (
                  <Col key={col.key} md={6} className="mb-2">
                    <Form.Check
                      type="checkbox"
                      id={`history-column-check-${col.key}`}
                      label={col.label}
                      checked={isChecked}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        if (checked) {
                          setDraftSelectedColumns((prev) =>
                            prev.includes(col.key) ? prev : [...prev, col.key],
                          );
                        } else if (!isOnlySelected) {
                          setDraftSelectedColumns((prev) =>
                            prev.filter((k) => k !== col.key),
                          );
                        }
                      }}
                    />
                  </Col>
                );
              })}
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowColumnEditor(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setSelectedColumns(draftSelectedColumns);
                setShowColumnEditor(false);
              }}
            >
              Apply Changes
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Generic Filter Sidebar */}
        <GenericFilterSidebar
          isOpen={showFiltersSidebar}
          onClose={() => setShowFiltersSidebar(false)}
          title="Advanced Filters"
          subtitle="Filter activities by agent and date range"
          filters={filterFields}
          onApply={() => {
            setPagination((prev) => ({ ...prev, current_page: 1 }));
          }}
          onReset={() => {
            setActivityTypeFilter("all");
            setActivitySearch("");
            setActivityFilters({
              agents: [],
              dateRange: { start: "", end: "" },
            });
            setPagination((prev) => ({ ...prev, current_page: 1 }));
          }}
        />
        </div>
        <ActivityHistorySidebarPanel
          sidebarMarginTop={sidebarMarginTop}
          showActivitySidebar={showActivitySidebar}
          setShowActivitySidebar={setShowActivitySidebar}
          selectedActivityRecord={selectedActivityRecord}
          extensions={extensions}
          loadingHistory={loadingHistory}
          recordStages={recordStages}
          currentStageIndex={currentStageIndex}
          historyChain={historyChain}
          crmData={crmData}
          router={router}
        />
        </div>
      </div>
    </ProtectedRoute>
  );
};

HistoryPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default HistoryPage;
