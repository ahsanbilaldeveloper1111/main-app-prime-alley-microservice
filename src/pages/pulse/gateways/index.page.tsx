import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useEffect, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, { TableColumn, TableAction, ToolbarConfig } from "@components/GenericTable";
import GenericSidebar, { SidebarSection } from "@components/GenericSidebarNew";
import { StatsCardData } from "@components/GenericStatsCards";
import { ListGsmManagement, updateGsm, deleteGsm } from "@utils/GsmManagement";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { Button, Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import AddGsmModal from "@components/gsm/partials/AddGsmModal";
import ConfirmModal from "@components/page-partials/ConfirmModal";
import SuccessfulModal from "@components/page-partials/SuccessfulModal";
import { ApexOptions } from "apexcharts";
import { Server, Activity, Zap, MapPin, AlertTriangle, Settings, Wifi } from "lucide-react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

// ── Module-level chart config ──────────────────────────────────────────────────

const GSM_CHART_BASE: Partial<ApexOptions> = {
  chart: { type: "area", zoom: { enabled: false }, toolbar: { show: false }, background: "transparent" },
  dataLabels: { enabled: false },
  stroke: { curve: "smooth", width: 2 },
  fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.1, stops: [0, 100] } },
  legend: { show: false },
  grid: { show: true, borderColor: "#e5e7eb", strokeDashArray: 0 },
  markers: { size: 4, strokeColors: "#ffffff", strokeWidth: 2, hover: { size: 6 } },
  xaxis: {
    type: "category",
    categories: ["11:00", "11:05", "11:10", "11:15", "11:20"],
    title: { text: "Time" },
  },
};

const GSM_LATENCY_CHART_OPTIONS: ApexOptions = {
  ...GSM_CHART_BASE,
  colors: ["#2563eb"],
  stroke: { ...GSM_CHART_BASE.stroke, colors: ["#2563eb"] },
  fill: { ...GSM_CHART_BASE.fill, colors: ["#2563eb"] },
  markers: { ...GSM_CHART_BASE.markers, colors: ["#2563eb"] },
  yaxis: { min: 0, max: 80, tickAmount: 4, title: { text: "Latency (ms)" } },
};

const GSM_LATENCY_SERIES = [{ name: "Latency", data: [63, 68, 66, 71, 68] }];

const GSM_DATA_USAGE_CHART_OPTIONS: ApexOptions = {
  ...GSM_CHART_BASE,
  colors: ["#10b981"],
  stroke: { ...GSM_CHART_BASE.stroke, colors: ["#10b981"] },
  fill: { ...GSM_CHART_BASE.fill, colors: ["#10b981"] },
  markers: { ...GSM_CHART_BASE.markers, colors: ["#10b981"] },
  yaxis: { min: 0, max: 80, tickAmount: 4, title: { text: "Data (MB)" } },
};

const GSM_DATA_USAGE_SERIES = [{ name: "Data Usage", data: [63, 68, 66, 71, 68] }];

// ── Static alert log data ──────────────────────────────────────────────────────

interface AlertLogEntry {
  id: string;
  timestamp: string;
  message: string;
  isAlert: boolean;
}

const GSM_ALERT_LOG_ENTRIES: AlertLogEntry[] = [
  { id: "alert-1", timestamp: "", message: "ALERT: Latency spike detected at 11:15", isAlert: true },
  { id: "log-1", timestamp: "2025-09-18 11:00:00", message: "Status check initiated. Latency: 65ms", isAlert: false },
  { id: "log-2", timestamp: "2025-09-18 11:05:00", message: "Connection stable. Latency: 70ms", isAlert: false },
  { id: "log-3", timestamp: "2025-09-18 11:10:00", message: "Latency improving. Latency: 68ms", isAlert: false },
  { id: "log-4", timestamp: "2025-09-18 11:15:00", message: "Latency spike detected. Latency: 72ms", isAlert: false },
  { id: "log-5", timestamp: "2025-09-18 11:20:00", message: "System recovery in progress. Latency: 69ms", isAlert: false },
  { id: "log-6", timestamp: "2025-09-18 11:25:00", message: "Connection restored. Latency: 67ms", isAlert: false },
  { id: "log-7", timestamp: "2025-09-18 11:30:00", message: "All systems normal. Latency: 65ms", isAlert: false },
  { id: "log-8", timestamp: "2025-09-18 11:35:00", message: "Routine maintenance check. Latency: 66ms", isAlert: false },
  { id: "log-9", timestamp: "2025-09-18 11:40:00", message: "Performance optimization applied. Latency: 64ms", isAlert: false },
  { id: "log-10", timestamp: "2025-09-18 11:45:00", message: "System monitoring active. Latency: 63ms", isAlert: false },
];

function renderAlertLogEntry(entry: AlertLogEntry): React.ReactNode {
  if (entry.isAlert) {
    return (
      <div key={entry.id} style={{ color: "#fd7e14", fontWeight: "bold", marginBottom: "10px" }}>
        {entry.message}
      </div>
    );
  }
  return (
    <div key={entry.id} style={{ marginBottom: "8px" }}>
      <span style={{ color: "#6c757d" }}>{entry.timestamp}</span>{" "}
      {entry.message}
    </div>
  );
}

const CURRENT_FILTERS: Record<string, unknown> = {};

// Mapped GSM table row interface
interface GsmTableRow {
  id: string;
  ipAddress: string;
  name: string;
  username: string;
  deviceStatus: string;
  companyName: string;
}

interface GsmApiCompany {
  name?: string;
}

interface GsmApiRecord {
  id?: string | number;
  ID?: string | number;
  ip_address?: string;
  ipAddress?: string;
  IP?: string;
  name?: string;
  Name?: string;
  username?: string;
  Username?: string;
  device_status?: string;
  deviceStatus?: string;
  status?: string;
  company_name?: string;
  companyName?: string;
  company?: string;
  companies?: GsmApiCompany[];
}

function mapGsmRow(item: GsmApiRecord, idx: number): GsmTableRow {
  const companyName =
    item.company_name ||
    item.companyName ||
    item.company ||
    (item.companies && item.companies.length > 0 ? item.companies[0].name : "") ||
    "";

  return {
    id: String(item.id ?? item.ID ?? idx),
    ipAddress: item.ip_address || item.ipAddress || item.IP || "",
    name: item.name || item.Name || "",
    username: item.username || item.Username || "",
    deviceStatus: item.device_status || item.deviceStatus || item.status || "",
    companyName,
  };
}

const GsmList = () => {
  const { data: session } = useSession();

  // Table state
  const [tableData, setTableData] = useState<GsmTableRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(15);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [showAddGsmModal, setShowAddGsmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState("");
  const [successModalDescription, setSuccessModalDescription] = useState("");
  const [showExportSuccessfulModal, setShowExportSuccessfulModal] = useState(false);

  // Edit modal state
  const [showEditGsmModal, setShowEditGsmModal] = useState(false);
  const [editGsmId, setEditGsmId] = useState("");
  const [editGsmName, setEditGsmName] = useState("");
  const [editGsmIpAddress, setEditGsmIpAddress] = useState("");
  const [editGsmUsername, setEditGsmUsername] = useState("");
  const [editGsmPassword, setEditGsmPassword] = useState("");
  const [editGsmStatus, setEditGsmStatus] = useState("");

  // Delete modal state
  const [showDeleteGsmModal, setShowDeleteGsmModal] = useState<boolean>(false);
  const [selectedGsm, setSelectedGsm] = useState<string>("");
  const [selectedGsmName, setSelectedGsmName] = useState<string>("");

  // GSM summary
  const [gsmSummary, setGsmSummary] = useState({
    total_gsm: 0,
    assigned_to_company: 0,
    not_assigned_to_company: 0,
    total_port: 0,
  });

  // Sidebar state
  const [showGsmSidebar, setShowGsmSidebar] = useState(false);
  const [selectedGsmRow, setSelectedGsmRow] = useState<GsmTableRow | null>(null);
  const [sidebarTimeRange, setSidebarTimeRange] = useState<"24h" | "7d" | "30d">("24h");


  // ── Callbacks ─────────────────────────────────────────────────────────────

  const handleExportSuccessful = useCallback(() => {
    setShowExportSuccessfulModal(true);
  }, []);

  const openGsmSidebar = useCallback((row: GsmTableRow) => {
    setSelectedGsmRow(row);
    setShowGsmSidebar(true);
  }, []);

  const closeGsmSidebar = useCallback(() => {
    setShowGsmSidebar(false);
    setSelectedGsmRow(null);
  }, []);

  const handleEditGsm = useCallback((row: GsmTableRow) => {
    setShowEditGsmModal(true);
    setEditGsmId(row.id);
    setEditGsmName(row.name);
    setEditGsmIpAddress(row.ipAddress);
    setEditGsmUsername(row.username);
    setEditGsmPassword("");
    setEditGsmStatus("");
  }, []);

  const handleDeleteGsm = useCallback((row: GsmTableRow) => {
    setSelectedGsm(row.id);
    setSelectedGsmName(row.name);
    setShowDeleteGsmModal(true);
  }, []);

  const fetchGsmData = useCallback(async (page = 1, perPage = 15, search = "") => {
    setLoading(true);
    try {
      const response = await ListGsmManagement({
        page,
        perPage,
        search,
        filters: CURRENT_FILTERS,
      });

      if (response?.data) {
        const dataArray = Array.isArray(response.data) ? (response.data as GsmApiRecord[]) : [];
        const mappedData: GsmTableRow[] = dataArray.map((item, idx) => mapGsmRow(item, idx));
        setTableData(mappedData);
        const totalRecordsCount = response.total || response.metadata?.total_records || mappedData.length;
        setTotalRecords(totalRecordsCount);
        if (response?.summary) {
          setGsmSummary(response.summary);
        }
      } else {
        const dataArray = Array.isArray(response)
          ? (response as GsmApiRecord[])
          : ((response?.dataList || response?.records || []) as GsmApiRecord[]);
        const mappedFallbackData: GsmTableRow[] = dataArray.map((item, idx) => mapGsmRow(item, idx));
        setTableData(mappedFallbackData);
        setTotalRecords(mappedFallbackData.length);
      }
    } catch (err) {
      console.error("Error fetching GSM data:", err);
      toast.error("Failed to load GSM data");
      setTableData([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePaginationChange = useCallback((page: number, rowsPerPage: number) => {
    setCurrentPage(page);
    if (rowsPerPage !== recordsPerPage) {
      setRecordsPerPage(rowsPerPage);
    }
  }, [recordsPerPage]);

  const handleSubmitEditGsm = useCallback(async () => {
    const isInvalid =
      editGsmName === "" ||
      editGsmIpAddress === "" ||
      editGsmUsername === "" ||
      editGsmPassword === "";

    if (isInvalid) {
      toast.error("Please fill all the fields");
      return;
    }

    try {
      const response = await updateGsm(
        editGsmId,
        editGsmName,
        editGsmIpAddress,
        editGsmUsername,
        editGsmPassword,
        editGsmStatus,
      );
      if (response) {
        setShowEditGsmModal(false);
        setEditGsmName("");
        setEditGsmIpAddress("");
        setEditGsmUsername("");
        setEditGsmPassword("");
        setEditGsmStatus("");
        setSuccessModalTitle("Successfully Updated");
        setSuccessModalDescription("The GSM device has been successfully updated.");
        setShowSuccessModal(true);
        setCurrentPage(1);
        fetchGsmData(1, recordsPerPage, searchQuery);
      } else {
        toast.error("Failed to update GSM device");
      }
    } catch (error) {
      console.error("Error updating GSM:", error);
      toast.error("An error occurred while updating the GSM device");
    }
  }, [editGsmId, editGsmIpAddress, editGsmName, editGsmPassword, editGsmStatus, editGsmUsername, fetchGsmData, recordsPerPage, searchQuery]);

  const handleSubmitDeleteGsm = useCallback(async () => {
    try {
      const response = await deleteGsm(selectedGsm);
      if (response) {
        setShowDeleteGsmModal(false);
        setSelectedGsm("");
        setSelectedGsmName("");
        setSuccessModalTitle("Successfully Deleted");
        setSuccessModalDescription("The GSM device has been successfully deleted.");
        setShowSuccessModal(true);
        setCurrentPage(1);
        fetchGsmData(1, recordsPerPage, searchQuery);
      } else {
        toast.error("Failed to delete GSM");
      }
    } catch (error) {
      console.error("Error deleting GSM:", error);
      toast.error("An error occurred while deleting the GSM device");
    }
  }, [fetchGsmData, recordsPerPage, searchQuery, selectedGsm]);

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchGsmData(currentPage, recordsPerPage, searchQuery);
  }, [currentPage, recordsPerPage, searchQuery, fetchGsmData]);

  // ── Memoized values ────────────────────────────────────────────────────────

  const gsmStatsCards = useMemo<StatsCardData[]>(() => [
    {
      title: "Total GSMs",
      value: gsmSummary.total_gsm,
      icon: Server,
      iconColor: "#2563eb",
      iconBgColor: "#eff6ff",
      subtitle: "Total devices in the system",
    },
    {
      title: "Assigned GSMs",
      value: gsmSummary.assigned_to_company,
      icon: Wifi,
      iconColor: "#16a34a",
      iconBgColor: "#f0fdf4",
      subtitle: "GSMs linked to a company",
    },
    {
      title: "Unassigned GSMs",
      value: gsmSummary.not_assigned_to_company,
      icon: AlertTriangle,
      iconColor: "#dc2626",
      iconBgColor: "#fef2f2",
      subtitle: "GSMs awaiting assignment",
    },
    {
      title: "Total Ports",
      value: gsmSummary.total_port,
      icon: Activity,
      iconColor: "#7c3aed",
      iconBgColor: "#f5f3ff",
      subtitle: "Overall port capacity",
    },
  ], [gsmSummary]);

  const gsmColumns = useMemo<TableColumn<GsmTableRow>[]>(() => [
    {
      key: "ipAddress",
      label: "IP ADDRESS",
      type: "text",
      sortable: true,
      render: (row: GsmTableRow) => row.ipAddress || "---",
    },
    {
      key: "name",
      label: "NAME",
      type: "text",
      sortable: true,
      render: (row: GsmTableRow) => row.name || "---",
    },
    {
      key: "username",
      label: "USERNAME",
      type: "text",
      sortable: true,
      render: (row: GsmTableRow) => row.username || "---",
    },
    {
      key: "deviceStatus",
      label: "DEVICE STATUS",
      type: "custom",
      sortable: true,
      render: (row: GsmTableRow) => {
        if (!row.deviceStatus) {
          return <div className="text-gray-400 text-lg">---</div>;
        }
        return (
          <div className="flex items-center gap-2">
            <div className="text-gray-700 text-sm font-medium uppercase device-status-container">
              <div
                className={`device-status-dot ${
                  row.deviceStatus === "power_on" ? "active animate-ping" : ""
                }`}
              />
              {row.deviceStatus.toUpperCase()}
            </div>
          </div>
        );
      },
    },
    {
      key: "companyName",
      label: "COMPANIES",
      type: "text",
      sortable: true,
      render: (row: GsmTableRow) => row.companyName || "---",
    },
  ], []);

  const gsmTableActions = useMemo<TableAction<GsmTableRow>[]>(() => {
    const actions: TableAction<GsmTableRow>[] = [];

    if (session?.user?.permissions?.includes("edit-gsm-management")) {
      actions.push({
        label: "Edit",
        icon: <FiEdit className="me-2" />,
        onClick: handleEditGsm,
        className: "action-edit",
      });
    }

    if (session?.user?.permissions?.includes("delete-gsm-management")) {
      actions.push({
        label: "Delete",
        icon: <FiTrash2 className="me-2" />,
        onClick: handleDeleteGsm,
        className: "action-delete",
      });
    }

    return actions;
  }, [handleDeleteGsm, handleEditGsm, openGsmSidebar, session?.user?.permissions]);

  const toolbarConfig = useMemo<ToolbarConfig>(() => ({
    showSearch: true,
    searchValue: searchQuery,
    searchPlaceholder: "Search GSM, Company...",
    onSearchChange: setSearchQuery,
    onSearch: () => {},
    showTabs: true,
    tabs: [
      {
        id: "gsm-devices",
        label: "Telco Gateway Management",
        count: totalRecords,
        removable: false,
      },
    ],
    activeTab: "gsm-devices",
    onTabChange: () => {},
    showFilterPills: false,
    showExportButton: false,
    showFiltersButton: false,
    showSortButton: false,
    showEditColumns: false,
    customActions: (
      <div className="d-flex gap-2">
        {session?.user?.permissions?.includes("add-gsm-management") && (
          <button
            type="button"
            className="btn btn-primary"
            id="new-assign-btn"
            onClick={() => setShowAddGsmModal(true)}
          >
            <i className="fas fa-plus" /> New Assign
          </button>
        )}
        {session?.user?.permissions?.includes("export-gsm-managements") && (
          <button
            type="button"
            className="btn btn-export"
            id="export-btn"
            onClick={handleExportSuccessful}
          >
            <i className="fas fa-download" /> Export
          </button>
        )}
      </div>
    ),
  }), [handleExportSuccessful, searchQuery, session?.user?.permissions, totalRecords]);

  const gsmSidebarSections = useMemo<SidebarSection[]>(() => {
    if (!selectedGsmRow) return [];

    const alertLogContent = GSM_ALERT_LOG_ENTRIES.map(renderAlertLogEntry);

    return [
      {
        id: "device-info",
        title: "Device Information",
        icon: Server,
        collapsible: true,
        defaultExpanded: true,
        fields: [
          { label: "ID", value: selectedGsmRow.id || "N/A", copyable: true },
          { label: "Name", value: selectedGsmRow.name || "N/A", copyable: true },
          { label: "IP Address", value: selectedGsmRow.ipAddress || "N/A", copyable: true },
          { label: "Username", value: selectedGsmRow.username || "N/A" },
          { label: "Company", value: selectedGsmRow.companyName || "N/A" },
          {
            label: "Status",
            value: selectedGsmRow.deviceStatus || "N/A",
            type: "badge",
            badgeVariant: selectedGsmRow.deviceStatus === "power_on" ? "success" : "secondary",
          },
        ],
      },
      {
        id: "system-metrics",
        title: "System Metrics",
        icon: Activity,
        collapsible: true,
        defaultExpanded: true,
        fields: [
          { label: "Firmware", value: "1.0.0" },
          { label: "Uptime", value: "10 days" },
          { label: "CPU Usage", value: "10%" },
          { label: "Memory Usage", value: "10%" },
          { label: "Battery Level", value: "10%" },
          { label: "Last Check-in", value: "11:25 AM" },
          { label: "RSRP", value: "-100 dBm" },
          { label: "RSRQ", value: "-10 dB" },
          { label: "Modem Status", value: "Active" },
        ],
      },
      {
        id: "device-actions",
        title: "Device Actions",
        icon: Settings,
        collapsible: true,
        defaultExpanded: true,
        customContent: (
          <div className="d-flex gap-2 flex-wrap p-2">
            <button type="button" className="btn btn-primary btn-sm">Send Command</button>
            <button type="button" className="btn btn-warning btn-sm">Force Update</button>
            <button type="button" className="btn btn-success btn-sm">Toggle Power</button>
          </div>
        ),
      },
      {
        id: "latency-history",
        title: "Latency History",
        icon: Activity,
        collapsible: true,
        defaultExpanded: true,
        customContent: (
          <div>
            <div className="d-flex justify-content-center gap-2 mb-2">
              <button
                type="button"
                className={`btn btn-sm ${sidebarTimeRange === "24h" ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setSidebarTimeRange("24h")}
              >
                24h
              </button>
              <button
                type="button"
                className={`btn btn-sm ${sidebarTimeRange === "7d" ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setSidebarTimeRange("7d")}
              >
                7d
              </button>
              <button
                type="button"
                className={`btn btn-sm ${sidebarTimeRange === "30d" ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setSidebarTimeRange("30d")}
              >
                30d
              </button>
            </div>
            <ReactApexChart
              options={GSM_LATENCY_CHART_OPTIONS}
              series={GSM_LATENCY_SERIES}
              type="area"
              height={200}
            />
          </div>
        ),
      },
      {
        id: "data-usage",
        title: "Data Usage (MB)",
        icon: Zap,
        collapsible: true,
        defaultExpanded: false,
        customContent: (
          <ReactApexChart
            options={GSM_DATA_USAGE_CHART_OPTIONS}
            series={GSM_DATA_USAGE_SERIES}
            type="area"
            height={200}
          />
        ),
      },
      {
        id: "location",
        title: "Location",
        icon: MapPin,
        collapsible: true,
        defaultExpanded: false,
        customContent: (
          <div
            style={{
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
              padding: "20px",
              textAlign: "center",
              color: "#6c757d",
              minHeight: "80px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Location Map
          </div>
        ),
      },
      {
        id: "alert-logs",
        title: "Alert History & Logs",
        icon: AlertTriangle,
        collapsible: true,
        defaultExpanded: false,
        customContent: (
          <div
            style={{
              backgroundColor: "#f8f9fa",
              border: "1px solid #dee2e6",
              borderRadius: "8px",
              padding: "15px",
              maxHeight: "200px",
              overflowY: "auto",
              fontFamily: "monospace",
              fontSize: "14px",
              lineHeight: "1.5",
            }}
          >
            {alertLogContent}
          </div>
        ),
      },
    ];
  }, [selectedGsmRow, sidebarTimeRange]);

  // ── JSX ────────────────────────────────────────────────────────────────────

  return (
    <React.Fragment>
      <style>{`
      button#new-assign-btn {
    background: #141414;
    padding: 6px 15px;
    border: 1px solid #141414;
    border-radius: 4px;
    font-size: 12px;
}
    i.fas.fa-plus{
    font-size: 12px !important;
}
        @keyframes gsm-pulse {
          0% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.3); opacity: 0.3; }
          100% { transform: scale(1); opacity: 0.7; }
        }
      `}</style>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Telco Gateway Management" />

      <div
        className="pulse-gateways-page"
        style={{ display: "flex", gap: "0", height: "calc(100vh)", overflow: "hidden" }}
      >
        <div
          className="gateways-table-pane"
          style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}
        >
          {session?.user?.permissions?.includes("list-gsm-management") && (
            <GenericTable<GsmTableRow>
              data={tableData}
              columns={gsmColumns}
              uniqueKey="id"
              loading={loading}
              loadingMessage="Loading GSM devices..."
              emptyMessage="No GSM devices found. Click 'New Assign' to add one."
              showToolbar={true}
              toolbar={toolbarConfig}
              showActions={true}
              actionsLabel="Actions"
              customizableColumns={false}
              showToolbarActions={false}
              statsCards={gsmStatsCards}
              pagination={{
                currentPage,
                rowsPerPage: recordsPerPage,
                totalRows: totalRecords,
                pageSizeOptions: [10, 15, 25, 50],
              }}
              onPaginationChange={handlePaginationChange}
              onPreviewClick={openGsmSidebar}
              actions={gsmTableActions}
              hover={true}
              striped={false}
              size="md"
              fixedHeight={true}
              maxHeight="calc(100vh - 295px)"
            />
          )}
        </div>

        {showGsmSidebar && selectedGsmRow && (
          <GenericSidebar
            isOpen={showGsmSidebar}
            onClose={closeGsmSidebar}
            title={selectedGsmRow.name || "GSM Details"}
            subtitle={selectedGsmRow.ipAddress || ""}
            avatar={{
              initials: (selectedGsmRow.name || "GS").slice(0, 2).toUpperCase(),
              name: selectedGsmRow.name || "GSM Device",
            }}
            actionsDropdown={{
              label: "Actions",
              items: [
                {
                  label: "Edit GSM",
                  onClick: () => {
                    closeGsmSidebar();
                    handleEditGsm(selectedGsmRow);
                  },
                },
                {
                  label: "Delete GSM",
                  onClick: () => {
                    closeGsmSidebar();
                    handleDeleteGsm(selectedGsmRow);
                  },
                },
              ],
            }}
            sections={gsmSidebarSections}
          />
        )}
      </div>

      {showEditGsmModal && (
        <Modal show={showEditGsmModal} onHide={() => setShowEditGsmModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Edit Gsm</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="form-group mb-3">
              <label htmlFor="editGsmName">Gsm Name</label>
              <input
                type="text"
                className="form-control"
                id="editGsmName"
                value={editGsmName}
                onChange={(e) => setEditGsmName(e.target.value)}
                placeholder="Gsm Name"
                required
              />
            </div>
            <div className="form-group mb-3">
              <label htmlFor="editGsmIpAddress">Ip Address</label>
              <input
                type="text"
                className="form-control"
                id="editGsmIpAddress"
                value={editGsmIpAddress}
                onChange={(e) => setEditGsmIpAddress(e.target.value)}
                placeholder="Gsm Ip Address"
                required
              />
            </div>
            <div className="form-group mb-3">
              <label htmlFor="editGsmUsername">Username</label>
              <input
                type="text"
                className="form-control"
                id="editGsmUsername"
                value={editGsmUsername}
                onChange={(e) => setEditGsmUsername(e.target.value)}
                placeholder="Gsm Username"
                required
              />
            </div>
            <div className="form-group mb-3">
              <label htmlFor="editGsmPassword">Password</label>
              <input
                type="password"
                className="form-control"
                id="editGsmPassword"
                value={editGsmPassword}
                onChange={(e) => setEditGsmPassword(e.target.value)}
                placeholder="Gsm Password"
                required
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditGsmModal(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={handleSubmitEditGsm}>
              Edit
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {showDeleteGsmModal && (
        <ConfirmModal
          show={showDeleteGsmModal}
          onHide={() => setShowDeleteGsmModal(false)}
          title="Delete GSM?"
          description={`Are you sure you want to delete "${selectedGsmName}"? This action cannot be undone.`}
          targetName="this GSM device"
          onConfirm={handleSubmitDeleteGsm}
        />
      )}

      {showExportSuccessfulModal && (
        <SuccessfulModal
          show={showExportSuccessfulModal}
          onHide={() => setShowExportSuccessfulModal(false)}
          title="Export Successful!"
          description="The GSM data has been successfully exported as a JSON file."
          confirmButtonText="OK"
        />
      )}

      {showAddGsmModal && (
        <AddGsmModal
          show={showAddGsmModal}
          onHide={() => setShowAddGsmModal(false)}
          onSuccess={() => {
            setShowAddGsmModal(false);
            setSuccessModalTitle("Successfully Created");
            setSuccessModalDescription("The GSM device has been successfully created.");
            setShowSuccessModal(true);
            setCurrentPage(1);
            fetchGsmData(1, recordsPerPage, searchQuery);
          }}
        />
      )}

      {showSuccessModal && (
        <SuccessfulModal
          show={showSuccessModal}
          title={successModalTitle}
          description={successModalDescription}
          confirmButtonText="OK"
          onHide={() => setShowSuccessModal(false)}
        />
      )}
    </React.Fragment>
  );
};

GsmList.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default GsmList;
