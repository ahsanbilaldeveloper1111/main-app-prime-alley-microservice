import { StatsCardData } from "@components/GenericStatsCards";
import type {
  FilterPill,
  TabConfig,
  TableColumn,
  ToolbarConfig,
} from "@components/GenericTable";
import { useQuery } from "@tanstack/react-query";
import { fetchComplianceCdrList } from "../../../query/fetchComplianceCdrList";
import { complianceKeys } from "../../../query/keys";
import React, { useCallback, useMemo, useState } from "react";

import { CdrDatetimeFilterField } from "./CdrDatetimeFilterField";
import { CdrPhoneContainer } from "./CdrPhoneContainer";
import { CdrTextFilterField } from "./CdrTextFilterField";
import { CdrToneBadge } from "./CdrToneBadge";
import {
  AppliedFilters,
  buildCdrFilterPillDropdownOptions,
  CDR_LOCAL_DND_STATUS_CHOICES,
  CDR_REPETITION_STATUS_CHOICES,
  computeCdrAggregatedStats,
  createDefaultCdrAppliedFilters,
  DNCR_API_STATUS_LABELS,
  formatCdrFilterDatetimeForDisplay,
  getCdrDefaultDateFromLocal,
  getCdrDefaultDateToLocal,
  getDncrTone,
  getTriStateTone,
  mapCdrRecordToUI,
  type CDRRecord,
  type MappedCDRRecord,
} from "./cdrRecordsDomain";

import "./cdrRecordsPage.scss";

export interface CdrRecordsPageViewModel {
  mappedData: MappedCDRRecord[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  recordsPerPage: number;
  totalRecords: number;
  toolbarConfig: ToolbarConfig;
  cdrColumns: TableColumn<MappedCDRRecord>[];
  statsCards: StatsCardData[];
  handleRecordsPerPageChange: (value: number) => void;
  setCurrentPage: (page: number) => void;
}

export function useCdrRecordsPage(): CdrRecordsPageViewModel {
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(25);
  const [searchQuery, setSearchQuery] = useState("");
  const [callingNumberFilter, setCallingNumberFilter] = useState("");
  const [calledNumberFilter, setCalledNumberFilter] = useState("");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [repetitionStatusFilter, setRepetitionStatusFilter] = useState("");
  const [localDndStatusFilter, setLocalDndStatusFilter] = useState("");
  const [dncrApiStatusFilter, setDncrApiStatusFilter] = useState("");

  const [dateFromFilter, setDateFromFilter] = useState(getCdrDefaultDateFromLocal);
  const [dateToFilter, setDateToFilter] = useState(getCdrDefaultDateToLocal);
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(() =>
    createDefaultCdrAppliedFilters(),
  );

  const filtersKey = useMemo(
    () => JSON.stringify(appliedFilters),
    [appliedFilters],
  );

  const {
    data: cdrPayload,
    isPending,
    isFetching,
    error: cdrQueryError,
  } = useQuery({
    queryKey: complianceKeys.cdr.list({
      page: currentPage,
      perPage: recordsPerPage,
      filtersKey,
    }),
    queryFn: () =>
      fetchComplianceCdrList({
        currentPage,
        recordsPerPage,
        appliedFilters,
      }),
  });

  const apiData: CDRRecord[] = cdrPayload?.data ?? [];
  const metadata = cdrPayload?.metadata ?? null;
  const statistics = cdrPayload?.statistics ?? null;
  const loading = isPending || isFetching;
  let error: string | null = null;
  if (cdrQueryError instanceof Error) {
    error = cdrQueryError.message;
  } else if (cdrQueryError) {
    error = "Failed to fetch CDR records";
  }

  const stats = useMemo(
    () =>
      computeCdrAggregatedStats(
        statistics,
        apiData,
        metadata?.total_records || 0,
      ),
    [statistics, apiData, metadata?.total_records],
  );

  const mappedData = useMemo(
    () => apiData.map(mapCdrRecordToUI),
    [apiData],
  );

  const totalRecords = metadata?.total_records || 0;

  const statsCards = useMemo<StatsCardData[]>(
    () => [
      {
        title: "Total Records",
        value: stats.totalRecords.toLocaleString(),
        subtitle: "This month",
      },
      {
        title: "Local DND — Allowed",
        value: stats.localDNDAllowed || 0,
        subtitle: `Blocked: ${stats.localDNDBlocked || 0} · Not Checked: ${stats.localDNDNotChecked || 0}`,
      },
      {
        title: "Repetition — Allowed",
        value: stats.repetitionAllowed || 0,
        subtitle: `Blocked: ${stats.repetitionNotAllowed || 0} · Not Checked: ${stats.repetitionNotChecked || 0}`,
      },
      {
        title: "DNCR API — Allowed",
        value: stats.dncrApiFalse || 0,
        subtitle: `Blocked: ${stats.dncrApiTrue || 0} · Not Checked: ${stats.dncrApiNotChecked || 0}`,
      },
      {
        title: "Avg Response Time",
        value: `${(stats.avgTime || 0).toFixed(1)}ms`,
        subtitle: `Min ${(stats.minTime || 0).toFixed(1)}ms / Max ${(stats.maxTime || 0).toFixed(1)}ms`,
      },
    ],
    [stats],
  );

  const cdrTabs = useMemo<TabConfig[]>(
    () => [
      {
        id: "cdr-records",
        label: "CDR Records",
        count: totalRecords,
        removable: false,
      },
    ],
    [totalRecords],
  );

  const handleApplyFilters = useCallback(() => {
    setAppliedFilters({
      search: searchQuery,
      calling_number: callingNumberFilter,
      called_number: calledNumberFilter,
      user_id: userIdFilter.trim(),
      call_repetition_status: repetitionStatusFilter,
      local_dnd_status: localDndStatusFilter,
      dncr_api_status: dncrApiStatusFilter,
      date_from: dateFromFilter.trim() || getCdrDefaultDateFromLocal(),
      date_to: dateToFilter.trim() || getCdrDefaultDateToLocal(),
    });
    setCurrentPage(1);
  }, [
    searchQuery,
    callingNumberFilter,
    calledNumberFilter,
    userIdFilter,
    repetitionStatusFilter,
    localDndStatusFilter,
    dncrApiStatusFilter,
    dateFromFilter,
    dateToFilter,
  ]);

  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
    setCallingNumberFilter("");
    setCalledNumberFilter("");
    setUserIdFilter("");
    setRepetitionStatusFilter("");
    setLocalDndStatusFilter("");
    setDncrApiStatusFilter("");
    setDateFromFilter(getCdrDefaultDateFromLocal());
    setDateToFilter(getCdrDefaultDateToLocal());
    setAppliedFilters(createDefaultCdrAppliedFilters());
    setCurrentPage(1);
  }, []);

  const handleRecordsPerPageChange = useCallback((value: number) => {
    setRecordsPerPage(value);
    setCurrentPage(1);
  }, []);

  const repetitionFilterOptions = useMemo(
    () =>
      buildCdrFilterPillDropdownOptions(
        "All Status",
        CDR_REPETITION_STATUS_CHOICES,
        repetitionStatusFilter,
        setRepetitionStatusFilter,
      ),
    [repetitionStatusFilter],
  );

  const localDndFilterOptions = useMemo(
    () =>
      buildCdrFilterPillDropdownOptions(
        "All Status",
        CDR_LOCAL_DND_STATUS_CHOICES,
        localDndStatusFilter,
        setLocalDndStatusFilter,
      ),
    [localDndStatusFilter],
  );

  const dncrApiFilterOptions = useMemo(
    () =>
      buildCdrFilterPillDropdownOptions(
        "All Statuses",
        Object.entries(DNCR_API_STATUS_LABELS)
          .filter(([key]) => key !== "")
          .map(([value, label]) => ({ label, value })),
        dncrApiStatusFilter,
        setDncrApiStatusFilter,
      ),
    [dncrApiStatusFilter],
  );

  const callingDropdownContent = useMemo(
    () => (
      <CdrTextFilterField
        minWidth="220px"
        placeholder="Calling Number"
        value={callingNumberFilter}
        onValueChange={setCallingNumberFilter}
      />
    ),
    [callingNumberFilter],
  );

  const calledDropdownContent = useMemo(
    () => (
      <CdrTextFilterField
        minWidth="220px"
        placeholder="Called Number"
        value={calledNumberFilter}
        onValueChange={setCalledNumberFilter}
      />
    ),
    [calledNumberFilter],
  );

  const userDropdownContent = useMemo(
    () => (
      <CdrTextFilterField
        minWidth="180px"
        placeholder="User ID"
        value={userIdFilter}
        onValueChange={setUserIdFilter}
      />
    ),
    [userIdFilter],
  );

  const dateFromDropdownContent = useMemo(
    () => (
      <CdrDatetimeFilterField
        value={dateFromFilter}
        onValueChange={setDateFromFilter}
        resolveDefault={getCdrDefaultDateFromLocal}
      />
    ),
    [dateFromFilter],
  );

  const dateToDropdownContent = useMemo(
    () => (
      <CdrDatetimeFilterField
        value={dateToFilter}
        onValueChange={setDateToFilter}
        resolveDefault={getCdrDefaultDateToLocal}
      />
    ),
    [dateToFilter],
  );

  const clearAppliedFilter = useCallback(
    (key: keyof AppliedFilters) => {
      setAppliedFilters((prev) => ({ ...prev, [key]: "" }));
      setCurrentPage(1);
    },
    [],
  );

  const makeFilterPill = useCallback(
    (
      id: string,
      label: string,
      key: keyof AppliedFilters,
      options?: {
        draftValue?: string;
        dropdownContent?: React.ReactNode;
        dropdownOptions?: FilterPill["dropdownOptions"];
        searchable?: boolean;
        formatActiveLabel?: (value: string) => string;
        clearable?: boolean;
        onClearExtra?: () => void;
      },
    ): FilterPill => {
      const appliedRaw = appliedFilters[key];
      const applied =
        typeof appliedRaw === "string"
          ? appliedRaw.trim()
          : String(appliedRaw ?? "").trim();
      const draft = (options?.draftValue ?? "").trim();
      const displayValue = draft || applied;
      const isActive = Boolean(displayValue);
      const activeLabel = displayValue
        ? options?.formatActiveLabel?.(displayValue) ?? displayValue
        : undefined;
      let clearHandler: (() => void) | undefined;
      if (options?.clearable !== false && isActive) {
        clearHandler = () => {
          options?.onClearExtra?.();
          clearAppliedFilter(key);
        };
      }
      return {
        id,
        label,
        showDropdown: true,
        ...(options?.searchable ? { searchable: true } : {}),
        active: isActive,
        activeLabel,
        onClear: clearHandler,
        ...(options?.dropdownContent
          ? { dropdownContent: options.dropdownContent }
          : {}),
        ...(options?.dropdownOptions
          ? { dropdownOptions: options.dropdownOptions }
          : {}),
      };
    },
    [appliedFilters, clearAppliedFilter],
  );

  const filterPills = useMemo<FilterPill[]>(
    () => [
      makeFilterPill("cdr-calling", "Calling #", "calling_number", {
        draftValue: callingNumberFilter,
        dropdownContent: callingDropdownContent,
        onClearExtra: () => setCallingNumberFilter(""),
      }),
      makeFilterPill("cdr-called", "Called #", "called_number", {
        draftValue: calledNumberFilter,
        dropdownContent: calledDropdownContent,
        onClearExtra: () => setCalledNumberFilter(""),
      }),
      makeFilterPill("cdr-user", "User", "user_id", {
        draftValue: userIdFilter,
        dropdownContent: userDropdownContent,
        onClearExtra: () => setUserIdFilter(""),
      }),
      makeFilterPill(
        "cdr-repetition",
        "Repetition",
        "call_repetition_status",
        {
          draftValue: repetitionStatusFilter,
          dropdownOptions: repetitionFilterOptions,
          onClearExtra: () => setRepetitionStatusFilter(""),
        },
      ),
      makeFilterPill("cdr-local-dnd", "Local DND", "local_dnd_status", {
        draftValue: localDndStatusFilter,
        dropdownOptions: localDndFilterOptions,
        onClearExtra: () => setLocalDndStatusFilter(""),
      }),
      makeFilterPill("cdr-dncr", "DNCR API", "dncr_api_status", {
        draftValue: dncrApiStatusFilter,
        dropdownOptions: dncrApiFilterOptions,
        searchable: true,
        formatActiveLabel: (v) => DNCR_API_STATUS_LABELS[v] || v,
        onClearExtra: () => setDncrApiStatusFilter(""),
      }),
      makeFilterPill("cdr-date-from", "Date From", "date_from", {
        draftValue: dateFromFilter,
        dropdownContent: dateFromDropdownContent,
        clearable: false,
        formatActiveLabel: formatCdrFilterDatetimeForDisplay,
      }),
      makeFilterPill("cdr-date-to", "Date To", "date_to", {
        draftValue: dateToFilter,
        dropdownContent: dateToDropdownContent,
        clearable: false,
        formatActiveLabel: formatCdrFilterDatetimeForDisplay,
      }),
    ],
    [
      appliedFilters,
      makeFilterPill,
      callingNumberFilter,
      calledNumberFilter,
      userIdFilter,
      repetitionStatusFilter,
      localDndStatusFilter,
      dncrApiStatusFilter,
      dateFromFilter,
      dateToFilter,
      callingDropdownContent,
      calledDropdownContent,
      userDropdownContent,
      dateFromDropdownContent,
      dateToDropdownContent,
      repetitionFilterOptions,
      localDndFilterOptions,
      dncrApiFilterOptions,
    ],
  );

  const toolbarConfig = useMemo<ToolbarConfig>(
    () => ({
      showSearch: true,
      searchValue: searchQuery,
      searchPlaceholder: "Search (across all fields)",
      onSearchChange: setSearchQuery,
      onSearch: handleApplyFilters,
      showTabs: true,
      tabs: cdrTabs,
      activeTab: "cdr-records",
      onTabChange: () => {},
      showFilterPills: true,
      filterPills,
      showMoreFiltersButton: false,
      customActions: (
        <div className="d-flex align-items-center gap-2 flex-wrap cdr-toolbar-buttons">
          <button
            type="button"
            className="cdrRecords-btn cdrRecords-btnOutline"
            onClick={handleResetFilters}
          >
            Reset
          </button>
          <button
            type="button"
            className="cdrRecords-btn"
            onClick={handleApplyFilters}
          >
            Apply Filters
          </button>
        </div>
      ),
    }),
    [
      searchQuery,
      filterPills,
      cdrTabs,
      handleApplyFilters,
      handleResetFilters,
    ],
  );

  const cdrColumns = useMemo<TableColumn<MappedCDRRecord>[]>(
    () => [
      { key: "id", label: "ID", type: "text", sortable: false },
      { key: "dateTime", label: "DATE/TIME", type: "text", sortable: false },
      {
        key: "calling",
        label: "CALLING #",
        type: "custom",
        sortable: false,
        render: (row) => <CdrPhoneContainer phone={row.calling} />,
      },
      {
        key: "called",
        label: "CALLED #",
        type: "custom",
        sortable: false,
        render: (row) => <CdrPhoneContainer phone={row.called} />,
      },
      { key: "userId", label: "USER ID", type: "text", sortable: false },
      {
        key: "localDND",
        label: "LOCAL DND",
        type: "custom",
        sortable: false,
        render: (row) => (
          <CdrToneBadge
            text={row.localDND}
            tone={getTriStateTone(row.localDND, "Allowed", "Not Checked")}
          />
        ),
      },
      {
        key: "repetition",
        label: "REPETITION",
        type: "custom",
        sortable: false,
        render: (row) => (
          <CdrToneBadge
            text={row.repetition}
            tone={getTriStateTone(row.repetition, "Allowed", "Not Checked")}
          />
        ),
      },
      {
        key: "dncrApi",
        label: "DNCR API",
        type: "custom",
        sortable: false,
        render: (row) => (
          <CdrToneBadge text={row.dncrApi} tone={getDncrTone(row.dncrApi)} />
        ),
      },
      { key: "time", label: "TIME (MS)", type: "text", sortable: false },
      {
        key: "allowLocalDNCL",
        label: "ALLOW LOCAL DNCL",
        type: "text",
        sortable: false,
      },
      {
        key: "allowApiDNCLCalls",
        label: "ALLOW API DNCL",
        type: "text",
        sortable: false,
      },
      {
        key: "allowRepetition",
        label: "ALLOW REPETITIVE",
        type: "text",
        sortable: false,
      },
    ],
    [],
  );

  return {
    mappedData,
    loading,
    error,
    currentPage,
    recordsPerPage,
    totalRecords,
    toolbarConfig,
    cdrColumns,
    statsCards,
    handleRecordsPerPageChange,
    setCurrentPage,
  };
}
