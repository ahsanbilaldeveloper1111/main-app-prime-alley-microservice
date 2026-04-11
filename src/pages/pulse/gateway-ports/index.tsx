import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, { FilterPill, TabConfig, TableColumn, ToolbarConfig } from "@components/GenericTable";
import { StatsCardData } from "@components/GenericStatsCards";
import { ListPorts } from "@utils/ports";
import { getGsmData, UpdatePortMobileNumber } from "@utils/GsmManagement";


import { toast } from "react-toastify";
import { useSession } from "next-auth/react";

import "@assets/scss/common.scss";

import { FiEdit } from "react-icons/fi";

interface PortCompany {
  name?: string;
}

interface PortRecord {
  id: number | string;
  gsm?: {
    name?: string;
  };
  port_number?: string | number;
  mobile_number?: string;
  sim_status?: string;
  operator?: string;
  signal_status?: string;
  imei?: string;
  imsi?: string;
  iccid?: string;
  port_status?: string;
  status?: string;
  companies?: PortCompany[];
}

interface PortTableRow {
  id: string;
  deviceName: string;
  port: string;
  mobileNumber: string;
  simStatus: string;
  operator: string;
  signalStatus: string;
  imei: string;
  imsi: string;
  iccid: string;
  portStatus: string;
  companyName: string;
  status: string;
  raw: PortRecord;
}

function mapPortRecordToTableRow(item: PortRecord, idx: number): PortTableRow {
  const portNum = item.port_number;
  return {
    id: String(item.id ?? idx),
    deviceName: item.gsm?.name || "",
    port: portNum === undefined || portNum === null ? "" : String(portNum),
    mobileNumber: item.mobile_number || "",
    simStatus: item.sim_status || "",
    operator: item.operator || "",
    signalStatus: item.signal_status || "",
    imei: item.imei || "",
    imsi: item.imsi || "",
    iccid: item.iccid || "",
    portStatus: item.port_status || "",
    companyName: item.companies?.[0]?.name || "",
    status: item.status || "",
    raw: item,
  };
}

const MOBILE_NUMBER_REGEX = /^\+?[1-9]\d{0,15}$/;

interface FilterOption {
  label: string;
  value: string;
}

const PORT_POWER_OPTIONS: FilterOption[] = [
  { label: "Power On", value: "power_on" },
  { label: "Power Off", value: "power_off" },
];

const OPERATOR_OPTIONS: FilterOption[] = [
  { label: "Etisalat by e&", value: "Etisalat" },
  { label: "DU", value: "du" },
];

const SIM_STATUS_OPTIONS: FilterOption[] = [
  { label: "Registered", value: "REGISTER_OK" },
  { label: "Unregistered", value: "UNREGISTER_OK" },
  { label: "No SIM", value: "NO_SIM" },
  { label: "Power Off", value: "POWER_OFF" },
];

const PORT_STATUS_OPTIONS: FilterOption[] = [
  { label: "Active", value: "up" },
  { label: "Not Active", value: "down" },
];

const SIM_STATUS_LABELS: Record<string, string> = {
  REGISTER_OK: "Registered",
  UNREGISTER_OK: "Unregistered",
  NO_SIM: "No SIM",
  POWER_OFF: "Power Off",
};

const PORT_STATUS_LABELS: Record<string, string> = {
  up: "Active",
  down: "Not Active",
};

const PORT_POWER_LABELS: Record<string, string> = {
  power_on: "Power On",
  power_off: "Power Off",
};

const OPERATOR_LABELS: Record<string, string> = {
  Etisalat: "Etisalat by e&",
  du: "DU",
};

interface GsmHierarchyItem {
  id: string;
  name: string;
  identifier?: string;
}

function TextFilterPill({
  placeholder,
  initialValue,
  onApply,
}: Readonly<{
  placeholder: string;
  initialValue: string;
  onApply: (value: string) => void;
}>) {
  const [localValue, setLocalValue] = useState(initialValue);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onApply(localValue.trim());
    }
  };

  return (
    <div style={{ minWidth: "220px", padding: "4px 2px" }}>
      <input
        type="text"
        className="form-control form-control-sm mb-2"
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
      />
      <button
        type="button"
        className="btn btn-primary btn-sm w-100"
        onClick={() => onApply(localValue.trim())}
      >
        Apply
      </button>
    </div>
  );
}

interface PillDropdownContentProps {
  readonly placeholder: string;
  readonly initialValue: string;
  readonly filterKey: string;
  readonly closeMenu: () => void;
  readonly onSetFilter: (key: string, value: string) => void;
  readonly onClearFilter: (key: string) => void;
}

function PillDropdownContent({
  placeholder,
  initialValue,
  filterKey,
  closeMenu,
  onSetFilter,
  onClearFilter,
}: PillDropdownContentProps) {
  const handleApply = (val: string) => {
    if (val) {
      onSetFilter(filterKey, val);
    } else {
      onClearFilter(filterKey);
    }
    closeMenu();
  };
  return <TextFilterPill placeholder={placeholder} initialValue={initialValue} onApply={handleApply} />;
}

interface TextPillDropdownRendererProps {
  readonly closeMenu: () => void;
  readonly initialValue: string;
  readonly onSetFilter: (key: string, value: string) => void;
  readonly onClearFilter: (key: string) => void;
}

function MobileNumberPillDropdown({
  closeMenu,
  initialValue,
  onSetFilter,
  onClearFilter,
}: TextPillDropdownRendererProps) {
  return (
    <PillDropdownContent
      placeholder="Enter Mobile Number"
      initialValue={initialValue}
      filterKey="mobile_number"
      closeMenu={closeMenu}
      onSetFilter={onSetFilter}
      onClearFilter={onClearFilter}
    />
  );
}

function ImeiPillDropdown({
  closeMenu,
  initialValue,
  onSetFilter,
  onClearFilter,
}: TextPillDropdownRendererProps) {
  return (
    <PillDropdownContent
      placeholder="Enter IMEI"
      initialValue={initialValue}
      filterKey="imei"
      closeMenu={closeMenu}
      onSetFilter={onSetFilter}
      onClearFilter={onClearFilter}
    />
  );
}

function ImsiPillDropdown({
  closeMenu,
  initialValue,
  onSetFilter,
  onClearFilter,
}: TextPillDropdownRendererProps) {
  return (
    <PillDropdownContent
      placeholder="Enter IMSI"
      initialValue={initialValue}
      filterKey="imsi"
      closeMenu={closeMenu}
      onSetFilter={onSetFilter}
      onClearFilter={onClearFilter}
    />
  );
}

function IccidPillDropdown({
  closeMenu,
  initialValue,
  onSetFilter,
  onClearFilter,
}: TextPillDropdownRendererProps) {
  return (
    <PillDropdownContent
      placeholder="Enter ICCID"
      initialValue={initialValue}
      filterKey="iccid"
      closeMenu={closeMenu}
      onSetFilter={onSetFilter}
      onClearFilter={onClearFilter}
    />
  );
}

interface DropdownContext {
  closeMenu: () => void;
}

const GsmPorts = () => {
  const { data: session } = useSession();

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState<Record<string, unknown>>({});
  const prevFiltersRef = useRef(currentFilters);
  const [tableData, setTableData] = useState<PortTableRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(15);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedPortId, setSelectedPortId] = useState<number | null>(null);
  const [mobileNumber, setMobileNumber] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const [portSummary, setPortSummary] = useState({
    total_port: 0,
    online_port: 0,
    offline_port: 0,
    active_port: 0,
  });

  const [gsmFilterOptions, setGsmFilterOptions] = useState<FilterOption[]>([]);
  const [companyFilterOptions, setCompanyFilterOptions] = useState<FilterOption[]>([]);

  useEffect(() => {
    const hasFilterPerm = session?.user?.permissions?.includes("filters-gsm-assignment");
    if (!hasFilterPerm) return;

    getGsmData()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((data: any) => {
        if (!data) return;

        const gsmList: GsmHierarchyItem[] = Array.isArray(data.gsm) ? data.gsm : [];
        setGsmFilterOptions(
          gsmList.map((g) => ({
            label: g.name || g.id,
            value: String(g.id),
          })),
        );

        const companyList: GsmHierarchyItem[] = Array.isArray(data.company) ? data.company : [];
        setCompanyFilterOptions(
          companyList.map((c) => ({
            label: c.name || c.id,
            value: String(c.identifier || c.id),
          })),
        );
      })
      .catch(() => {});
  }, [session?.user?.permissions]);

  const statsCards = useMemo<StatsCardData[]>(
    () => [
      { title: "Total", value: portSummary.total_port, subtitle: "Total Carrier Ports" },
      { title: "Registered", value: portSummary.online_port, subtitle: "Registered Carrier Ports" },
      { title: "Unregistered", value: portSummary.offline_port, subtitle: "Unregistered Carrier Ports" },
      { title: "Active", value: portSummary.active_port, subtitle: "Active Carrier Ports" },
    ],
    [portSummary],
  );

  const portColumns = useMemo<TableColumn<PortTableRow>[]>(() => {
    const isAdmin = session?.user?.is_admin === "1";
    const perms = session?.user?.permissions ?? [];

    const adminLeadColumns: TableColumn<PortTableRow>[] = isAdmin
      ? [
          {
            key: "deviceName",
            label: "DEVICE NAME",
            type: "text",
            sortable: true,
            render: (row: PortTableRow) => row.deviceName || "---",
          },
          {
            key: "port",
            label: "PORT",
            type: "text",
            sortable: true,
            render: (row: PortTableRow) => row.port || "---",
          },
        ]
      : [];

    const coreColumns: TableColumn<PortTableRow>[] = [
      {
        key: "mobileNumber",
        label: "PORT NUMBER",
        type: "text",
        sortable: true,
        render: (row: PortTableRow) => row.mobileNumber || "---",
      },
      {
        key: "simStatus",
        label: "PORT STATUS",
        type: "custom",
        sortable: true,
        render: (row: PortTableRow) => (
          <div>
            {row.simStatus === "REGISTER_OK" && (
              <span className="status-badge success">REGISTERED</span>
            )}
            {row.simStatus === "UNREGISTER_OK" && (
              <span className="status-badge danger">UNREGISTERED</span>
            )}
            {row.simStatus === "NO_SIM" && <span className="status-badge warning">NO SIM</span>}
            {row.simStatus === "POWER_OFF" && (
              <span className="status-badge danger">POWER OFF</span>
            )}
            {!row.simStatus && <span>---</span>}
          </div>
        ),
      },
      {
        key: "operator",
        label: "OPERATOR",
        type: "text",
        sortable: true,
        render: (row: PortTableRow) => row.operator || "---",
      },
      {
        key: "signalStatus",
        label: "SIGNAL",
        type: "custom",
        sortable: true,
        render: (row: PortTableRow) => (
          <div>
            {row.status === "up" && (
              <span className="status-badge success">
                <i className="fas fa-signal" />
              </span>
            )}
            {row.status === "down" && (
              <span className="status-badge danger">
                <i className="fas fa-signal-slash" />
              </span>
            )}
            {!row.status && <span>---</span>}
          </div>
        ),
      },
    ];

    const optionalColumns: TableColumn<PortTableRow>[] = [
      ...(perms.includes("imei-gsm-ports")
        ? [
            {
              key: "imei" as const,
              label: "IMEI",
              type: "text" as const,
              sortable: true,
              render: (row: PortTableRow) => row.imei || "---",
            },
          ]
        : []),
      ...(perms.includes("imsi-gsm-ports")
        ? [
            {
              key: "imsi" as const,
              label: "IMSI",
              type: "text" as const,
              sortable: true,
              render: (row: PortTableRow) => row.imsi || "---",
            },
          ]
        : []),
      ...(perms.includes("iccid-gsm-ports")
        ? [
            {
              key: "iccid" as const,
              label: "ICCID",
              type: "text" as const,
              sortable: true,
              render: (row: PortTableRow) => row.iccid || "---",
            },
          ]
        : []),
    ];

    const adminTailColumns: TableColumn<PortTableRow>[] = isAdmin
      ? [
          {
            key: "portStatus",
            label: "PORT STATUS",
            type: "custom",
            sortable: true,
            render: (row: PortTableRow) => (
              <div>
                {row.status === "up" && <span className="status-badge success">Active</span>}
                {row.status === "down" && (
                  <span className="status-badge danger">Not Active</span>
                )}
                {!row.status && <span>---</span>}
              </div>
            ),
          },
          {
            key: "companyName",
            label: "COMPANY",
            type: "text",
            sortable: true,
            render: (row: PortTableRow) => row.companyName || "---",
          },
        ]
      : [];

    return [
      ...adminLeadColumns,
      ...coreColumns,
      ...optionalColumns,
      ...adminTailColumns,
    ];
  }, [session?.user?.is_admin, session?.user?.permissions]);

  const fetchGsmPorts = useCallback(async (page = 1, perPage = 15, search = "") => {
    setLoading(true);
    try {
      const response = await ListPorts({ page, perPage, search, filters: currentFilters });

      if (response?.summary) {
        setPortSummary(response.summary);
      }

      const mapRows = (records: PortRecord[]) =>
        records.map((item, idx) => mapPortRecordToTableRow(item, idx));

      if (response?.data) {
        const dataArray: PortRecord[] = Array.isArray(response.data) ? response.data : [];
        const mappedData = mapRows(dataArray);
        setTableData(mappedData);
        setTotalRecords(response.total || response.metadata?.total_records || mappedData.length);
      } else {
        const dataArray: PortRecord[] = Array.isArray(response)
          ? response
          : response?.dataList || response?.records || [];
        const mappedData = mapRows(dataArray);
        setTableData(mappedData);
        setTotalRecords(response?.total || response?.metadata?.total_records || mappedData.length);
      }
    } catch (error) {
      console.error("Error fetching GSM ports:", error);
      toast.error("Failed to load GSM ports");
      setTableData([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [currentFilters]);

  useEffect(() => {
    const filtersChanged = JSON.stringify(currentFilters) !== JSON.stringify(prevFiltersRef.current);

    if (filtersChanged) {
      prevFiltersRef.current = currentFilters;
      if (currentPage !== 1) {
        setCurrentPage(1);
        return;
      }
    }

    fetchGsmPorts(filtersChanged ? 1 : currentPage, recordsPerPage).catch((err) => {
      console.error("fetchGsmPorts failed", err);
    });
  }, [currentFilters, currentPage, recordsPerPage, refreshKey, fetchGsmPorts]);

  const handlePaginationChange = (page: number, rowsPerPage: number) => {
    if (rowsPerPage !== recordsPerPage) {
      setRecordsPerPage(rowsPerPage);
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
      return;
    }

    setCurrentPage(page);
  };

  const handleUpdateMobileNumber = (id: number, currentMobileNumber?: string) => {
    setSelectedPortId(id);
    setMobileNumber(currentMobileNumber || "");
    setShowUpdateMobileNumberModal(true);
  };

  const [showUpdateMobileNumberModal, setShowUpdateMobileNumberModal] = useState(false);
  const [showUpdateMobileNumberSubmitModal, setShowUpdateMobileNumberSubmitModal] = useState(false);

  const handleCloseUpdateModal = () => {
    setShowUpdateMobileNumberModal(false);
    setMobileNumber("");
    setSelectedPortId(null);
    setIsUpdating(false);
  };

  const submitMobileNumberUpdate = async () => {
    if (!selectedPortId) {
      toast.error("No port selected");
      return;
    }

    if (!mobileNumber.trim()) {
      toast.error("Please enter a mobile number");
      return;
    }

    if (!MOBILE_NUMBER_REGEX.test(mobileNumber.trim())) {
      toast.error("Please enter a valid mobile number");
      return;
    }

    setIsUpdating(true);

    try {
      const success = await UpdatePortMobileNumber(selectedPortId.toString(), mobileNumber.trim());

      if (success) {
        setShowUpdateMobileNumberModal(false);
        setShowUpdateMobileNumberSubmitModal(true);
        setRefreshKey((prev) => prev + 1);
        setMobileNumber("");
        setSelectedPortId(null);
      } else {
        toast.error("Failed to update mobile number");
      }
    } catch (error) {
      console.error("Error updating mobile number:", error);
      toast.error("An error occurred while updating mobile number");
    } finally {
      setIsUpdating(false);
    }
  };

  const setFilter = useCallback((key: string, value: unknown) => {
    setCurrentFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilter = useCallback((key: string) => {
    setCurrentFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const renderMobileNumberDropdown = useCallback(
    (ctx: DropdownContext) => (
      <MobileNumberPillDropdown
        closeMenu={ctx.closeMenu}
        initialValue={String(currentFilters.mobile_number ?? "")}
        onSetFilter={setFilter}
        onClearFilter={clearFilter}
      />
    ),
    [currentFilters.mobile_number, setFilter, clearFilter],
  );

  const renderImeiDropdown = useCallback(
    (ctx: DropdownContext) => (
      <ImeiPillDropdown
        closeMenu={ctx.closeMenu}
        initialValue={String(currentFilters.imei ?? "")}
        onSetFilter={setFilter}
        onClearFilter={clearFilter}
      />
    ),
    [currentFilters.imei, setFilter, clearFilter],
  );

  const renderImsiDropdown = useCallback(
    (ctx: DropdownContext) => (
      <ImsiPillDropdown
        closeMenu={ctx.closeMenu}
        initialValue={String(currentFilters.imsi ?? "")}
        onSetFilter={setFilter}
        onClearFilter={clearFilter}
      />
    ),
    [currentFilters.imsi, setFilter, clearFilter],
  );

  const renderIccidDropdown = useCallback(
    (ctx: DropdownContext) => (
      <IccidPillDropdown
        closeMenu={ctx.closeMenu}
        initialValue={String(currentFilters.iccid ?? "")}
        onSetFilter={setFilter}
        onClearFilter={clearFilter}
      />
    ),
    [currentFilters.iccid, setFilter, clearFilter],
  );

  const portFilterPills = useMemo<FilterPill[]>(() => {
    const hasFilterPerm = session?.user?.permissions?.includes("filters-gsm-assignment");

    if (!hasFilterPerm) return [];

    return [
      // GSM Device (from hierarchy)
      {
        id: "gsm-device",
        label: "GSM Device",
        showDropdown: true,
        searchable: true,
        active: Boolean(currentFilters.gsm),
        activeLabel: gsmFilterOptions.find((g) => g.value === String(currentFilters.gsm))?.label,
        onClear: () => clearFilter("gsm"),
        dropdownOptions: gsmFilterOptions.map((g) => ({
          label: g.label,
          value: g.value,
          onClick: () => setFilter("gsm", g.value),
        })),
      },
      // Port (power status)
      {
        id: "port-power",
        label: "Port",
        showDropdown: true,
        active: Boolean(currentFilters.port),
        activeLabel: PORT_POWER_LABELS[String(currentFilters.port)],
        onClear: () => clearFilter("port"),
        dropdownOptions: PORT_POWER_OPTIONS.map((opt) => ({
          label: opt.label,
          value: opt.value,
          onClick: () => setFilter("port", opt.value),
        })),
      },
      // Company (from hierarchy)
      {
        id: "company",
        label: "Company",
        showDropdown: true,
        searchable: true,
        active: Boolean(currentFilters.company),
        activeLabel: companyFilterOptions.find((c) => c.value === String(currentFilters.company))?.label,
        onClear: () => clearFilter("company"),
        dropdownOptions: companyFilterOptions.map((c) => ({
          label: c.label,
          value: c.value,
          onClick: () => setFilter("company", c.value),
        })),
      },
      // SIM Status
      {
        id: "sim-status",
        label: "SIM Status",
        showDropdown: true,
        active: Boolean(currentFilters.sim_status),
        activeLabel: SIM_STATUS_LABELS[String(currentFilters.sim_status)],
        onClear: () => clearFilter("sim_status"),
        dropdownOptions: SIM_STATUS_OPTIONS.map((opt) => ({
          label: opt.label,
          value: opt.value,
          onClick: () => setFilter("sim_status", opt.value),
        })),
      },
      // Sim Operator
      {
        id: "operator",
        label: "Operator",
        showDropdown: true,
        active: Boolean(currentFilters.operator),
        activeLabel: OPERATOR_LABELS[String(currentFilters.operator)],
        onClear: () => clearFilter("operator"),
        dropdownOptions: OPERATOR_OPTIONS.map((opt) => ({
          label: opt.label,
          value: opt.value,
          onClick: () => setFilter("operator", opt.value),
        })),
      },
      // Mobile Number (text input)
      {
        id: "mobile-number",
        label: "Mobile Number",
        showDropdown: true,
        active: Boolean(currentFilters.mobile_number),
        activeLabel: String(currentFilters.mobile_number ?? ""),
        activeLabelOnly: true,
        onClear: () => clearFilter("mobile_number"),
        dropdownContent: renderMobileNumberDropdown,
      },
      // IMEI (text input)
      {
        id: "imei",
        label: "IMEI",
        showDropdown: true,
        active: Boolean(currentFilters.imei),
        activeLabel: String(currentFilters.imei ?? ""),
        activeLabelOnly: true,
        onClear: () => clearFilter("imei"),
        dropdownContent: renderImeiDropdown,
      },
      // IMSI (text input)
      {
        id: "imsi",
        label: "IMSI",
        showDropdown: true,
        active: Boolean(currentFilters.imsi),
        activeLabel: String(currentFilters.imsi ?? ""),
        activeLabelOnly: true,
        onClear: () => clearFilter("imsi"),
        dropdownContent: renderImsiDropdown,
      },
      // ICCID (text input)
      {
        id: "iccid",
        label: "ICCID",
        showDropdown: true,
        active: Boolean(currentFilters.iccid),
        activeLabel: String(currentFilters.iccid ?? ""),
        activeLabelOnly: true,
        onClear: () => clearFilter("iccid"),
        dropdownContent: renderIccidDropdown,
      },
      // Port Status
      {
        id: "port-status",
        label: "Port Status",
        showDropdown: true,
        active: Boolean(currentFilters.port_status),
        activeLabel: PORT_STATUS_LABELS[String(currentFilters.port_status)],
        onClear: () => clearFilter("port_status"),
        dropdownOptions: PORT_STATUS_OPTIONS.map((opt) => ({
          label: opt.label,
          value: opt.value,
          onClick: () => setFilter("port_status", opt.value),
        })),
      },
    ];
  }, [
    session?.user?.permissions,
    currentFilters,
    gsmFilterOptions,
    companyFilterOptions,
    setFilter,
    clearFilter,
    renderMobileNumberDropdown,
    renderImeiDropdown,
    renderImsiDropdown,
    renderIccidDropdown,
  ]);

  const portTabs = useMemo<TabConfig[]>(
    () => [
      { id: "carrier-ports", label: "Carrier Ports", count: totalRecords, removable: false },
    ],
    [totalRecords],
  );

  const portToolbarConfig = useMemo<ToolbarConfig>(
    () => ({
      showTabs: true,
      tabs: portTabs,
      activeTab: "carrier-ports",
      onTabChange: () => {},
      showFiltersButton: true,
      showFilterPills: false,
      filterPills: portFilterPills,
      showMoreFiltersButton: false,
    }),
    [portTabs, portFilterPills],
  );

  const canUpdateMobile =
    session?.user?.is_admin === "1" &&
    session?.user?.permissions?.includes("update-mobile-number-gsm-ports");

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Carrier Ports" />

      {session?.user?.permissions?.includes("list-gsm-ports") && (
        <GenericTable<PortTableRow>
          data={tableData}
          columns={portColumns}
          uniqueKey="id"
          loading={loading}
          loadingMessage="Loading GSM ports..."
          emptyMessage="No GSM ports found."
          showToolbar={true}
          toolbar={portToolbarConfig}
          showToolbarActions={false}
          statsCards={statsCards}
          metricsGridMinWidth="200px"
          showActions={canUpdateMobile}
          actionsLabel="Actions"
          customizableColumns={false}
          pagination={{
            currentPage,
            rowsPerPage: recordsPerPage,
            totalRows: totalRecords,
            pageSizeOptions: [10, 15, 25, 50],
          }}
          onPaginationChange={handlePaginationChange}
          actions={
            canUpdateMobile
              ? [
                  {
                    label: "Update Mobile Number",
                    icon: <FiEdit className="me-2" />,
                    onClick: (row: PortTableRow) => {
                      handleUpdateMobileNumber(Number(row.id), row.mobileNumber);
                    },
                    className: "action-edit",
                  },
                ]
              : []
          }
          hover={true}
          striped={false}
          size="md"
        />
      )}

      {showUpdateMobileNumberSubmitModal && (
        <dialog
          open
          id="gateway-ports-success-modal"
          className="modal customModal"
          style={{ display: "flex", border: "none", padding: 0, background: "transparent", maxWidth: "100vw" }}
          aria-labelledby="gateway-ports-success-title"
        >
          <div className="modal-content">
            <button
              type="button"
              className="close-btn border-0 bg-transparent p-0"
              aria-label="Close"
              onClick={() => setShowUpdateMobileNumberSubmitModal(false)}
            >
              <i className="fas fa-times" aria-hidden />
            </button>
            <h2 id="gateway-ports-success-title">Successful!</h2>
            <p id="gateway-ports-success-text">
              The GSM ports mobile number has been successfully updated.
            </p>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setShowUpdateMobileNumberSubmitModal(false);
                  setMobileNumber("");
                  setSelectedPortId(null);
                }}
              >
                Done
              </button>
            </div>
          </div>
        </dialog>
      )}

      {showUpdateMobileNumberModal && (
        <dialog
          open
          id="gateway-ports-update-modal"
          className="modal customModal"
          style={{ display: "flex", border: "none", padding: 0, background: "transparent", maxWidth: "100vw" }}
          aria-labelledby="gateway-ports-update-title"
        >
          <div className="modal-content">
            <button
              type="button"
              className="close-btn border-0 bg-transparent p-0"
              aria-label="Close"
              onClick={handleCloseUpdateModal}
            >
              <i className="fas fa-times" aria-hidden />
            </button>
            <h2 id="gateway-ports-update-title">Update Mobile Number!</h2>

            <div className="form-group mb-3">
              <label htmlFor="mobile_number">Mobile Number</label>
              <input
                type="text"
                className="form-control"
                id="mobile_number"
                placeholder="Enter Mobile Number"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isUpdating) {
                    e.preventDefault();
                    submitMobileNumberUpdate().catch((err) => console.error(err));
                  }
                }}
                disabled={isUpdating}
              />
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCloseUpdateModal}
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  submitMobileNumberUpdate().catch((err) => console.error(err));
                }}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <span className="d-inline-flex align-items-center gap-2">
                    <span className="spinner-border spinner-border-sm" aria-hidden />
                    <output className="mb-0">Updating…</output>
                  </span>
                ) : (
                  "Update Mobile Number"
                )}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </React.Fragment>
  );
};

GsmPorts.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default GsmPorts;
