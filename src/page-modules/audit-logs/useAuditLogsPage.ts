import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useSession } from "next-auth/react";
import moment from "moment";
import type { StatsCardData } from "@components/GenericStatsCards";
import type { AuditSidebarField } from "@components/AuditLogSidebar";
import type { PaginationConfig } from "@components/GenericTable";
import { GetHierarchyData } from "@utils/users";
import type { AuditFilterNode, AuditFilterService } from "@config/auditFilterConfig";
import { AuditFilterConfig } from "@config/auditFilterConfig";
import {
  asStringOrEmpty,
  deriveChangesFromOldNew,
  formatAuditTimestampOrDash,
  formatAuditTimestampOrEmpty,
  formatLabel,
  getTimestampParamKeys,
  hierarchyExtOptionLabel,
  hierarchyExtOptionValue,
  normalizeAuditResponse,
  normalizeCrmChanges,
  scalarToDisplayString,
  toUserLike,
  valueOrDash,
  type HierarchyResponse,
} from "./auditLogsDomain";

export interface AuditLogsPageViewModel {
  visibleAuditModules: AuditFilterNode[];
  selectedAuditModule: AuditFilterNode | null;
  handleAuditModuleChange: (moduleName: string) => void;
  mobileTabsOpen: boolean;
  setMobileTabsOpen: Dispatch<SetStateAction<boolean>>;
  visibleAuditServices: AuditFilterService[];
  selectedAuditService: AuditFilterService | null;
  handleAuditServiceChange: (serviceName: string) => void;
  clearAuditService: () => void;
  serviceSearch: string;
  setServiceSearch: Dispatch<SetStateAction<string>>;
  actionOptions: string[];
  selectedAuditAction: string;
  setSelectedAuditAction: Dispatch<SetStateAction<string>>;
  actionSearch: string;
  setActionSearch: Dispatch<SetStateAction<string>>;
  showUserFilter: boolean;
  selectedAuditUser: string;
  setSelectedAuditUser: Dispatch<SetStateAction<string>>;
  auditUserOptions: { value: string; label: string }[];
  userSearch: string;
  setUserSearch: Dispatch<SetStateAction<string>>;
  dateLabel: string;
  setAuditStartDate: Dispatch<SetStateAction<string>>;
  setAuditEndDate: Dispatch<SetStateAction<string>>;
  setShowAuditDateCustomModal: Dispatch<SetStateAction<boolean>>;
  setCustomStartDate: Dispatch<SetStateAction<string>>;
  setCustomEndDate: Dispatch<SetStateAction<string>>;
  auditStartDate: string;
  auditEndDate: string;
  auditLogsStatsCards: StatsCardData[];
  dataList: Record<string, unknown>[];
  pagination: PaginationConfig;
  handlePaginationChange: (page: number, rowsPerPage: number) => void;
  auditLogsLoading: boolean;
  showSidebar: boolean;
  selectedRow: Record<string, unknown> | null;
  handlePreviewClick: (row: Record<string, unknown>) => void;
  handleCloseSidebar: () => void;
  sidebarFields: AuditSidebarField[];
  showAuditDateCustomModal: boolean;
  customStartDate: string;
  customEndDate: string;
  applyCustomDateRange: () => void;
}

export function useAuditLogsPage(): AuditLogsPageViewModel {
  const { data: session } = useSession();
  const [selectedAuditModule, setSelectedAuditModule] = useState<AuditFilterNode | null>(null);
  const [selectedAuditService, setSelectedAuditService] = useState<AuditFilterService | null>(null);
  const [selectedAuditAction, setSelectedAuditAction] = useState("");
  const [auditStartDate, setAuditStartDate] = useState("");
  const [auditEndDate, setAuditEndDate] = useState("");
  const [selectedAuditUser, setSelectedAuditUser] = useState("");
  const [auditLogsData, setAuditLogsData] = useState<unknown[] | null>(null);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const [auditLimit, setAuditLimit] = useState(10);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditLogsSummary, setAuditLogsSummary] = useState<Record<string, number> | null>(null);
  const [auditUserOptions, setAuditUserOptions] = useState<{ value: string; label: string }[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Record<string, unknown> | null>(null);
  const [showAuditDateCustomModal, setShowAuditDateCustomModal] = useState(false);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");
  const [actionSearch, setActionSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [mobileTabsOpen, setMobileTabsOpen] = useState(false);

  const selectedRowUser = toUserLike(selectedRow?.user);
  const sidebarFields: AuditSidebarField[] = selectedRow
    ? [
        { label: "Category", value: formatLabel(selectedRow.resource_type) },
        { label: "Subcategory", value: formatLabel(selectedRow.formatted_action) },
        { label: "Action", value: "Perform" },
        {
          label: "Date of change",
          value:
            scalarToDisplayString(selectedRow.formatted_timestamp) ||
            formatAuditTimestampOrDash(selectedRow.created_at, "MMM D, YYYY HH:mm:ss"),
        },
        {
          label: "Modified by",
          value: "",
          isUser: true,
          userName: scalarToDisplayString(selectedRowUser?.display_name) || "Unknown",
          userEmail: scalarToDisplayString(selectedRowUser?.email) || "",
          sectionBreakAfter: true,
        },
        { label: "Country", value: valueOrDash(selectedRow.country) },
        { label: "Region", value: valueOrDash(selectedRow.region) },
        { label: "Login Type", value: valueOrDash(selectedRow.login_type) },
        { label: "User Agent", value: valueOrDash(selectedRow.user_agent) },
        { label: "IP Address", value: valueOrDash(selectedRow.ip_address) },
      ]
    : [];

  const visibleAuditModules = useMemo(() => {
    const perms = session?.user?.permissions ?? [];
    return AuditFilterConfig.filter((n: AuditFilterNode) => perms.includes(n.isShow));
  }, [session?.user?.permissions]);

  const visibleAuditServices = useMemo(() => {
    if (!selectedAuditModule) return [];
    const perms = session?.user?.permissions ?? [];
    return selectedAuditModule.services.filter((s: AuditFilterService) => perms.includes(s.isShow ?? ""));
  }, [selectedAuditModule, session?.user?.permissions]);

  useEffect(() => {
    if (visibleAuditModules.length > 0 && !selectedAuditModule) {
      setSelectedAuditModule(visibleAuditModules[0]);
    }
  }, [visibleAuditModules, selectedAuditModule]);

  const handleAuditModuleChange = useCallback(
    (moduleName: string) => {
      if (selectedAuditModule?.moduleName === moduleName) return;
      setAuditLogsData(null);
      setAuditLogsSummary(null);
      const node = visibleAuditModules.find((n: AuditFilterNode) => n.moduleName === moduleName) ?? null;
      setSelectedAuditModule(node);
      setSelectedAuditService(null);
      setSelectedAuditAction("");
      setAuditStartDate("");
      setAuditEndDate("");
      setSelectedAuditUser("");
      setAuditPage(1);
      setMobileTabsOpen(false);
    },
    [visibleAuditModules, selectedAuditModule?.moduleName],
  );

  const handleAuditServiceChange = useCallback(
    (serviceName: string) => {
      if (selectedAuditService?.serviceName === serviceName) return;
      const svc = visibleAuditServices.find((s: AuditFilterService) => s.serviceName === serviceName) ?? null;
      setSelectedAuditService(svc);
      setSelectedAuditAction("");
      setAuditStartDate("");
      setAuditEndDate("");
      setSelectedAuditUser("");
      setAuditLogsData(null);
      setAuditLogsSummary(null);
      setAuditPage(1);
    },
    [visibleAuditServices, selectedAuditService?.serviceName],
  );

  const clearAuditService = useCallback(() => {
    setSelectedAuditService(null);
    setServiceSearch("");
  }, []);

  const auditLogsStatsCards: StatsCardData[] = useMemo(() => {
    const s = auditLogsSummary;
    if (!s || typeof s !== "object") return [];
    const keys = Object.keys(s).filter((k) => typeof s[k] === "number");
    return keys.map((key) => ({ title: formatLabel(key), value: Number(s[key]) }));
  }, [auditLogsSummary]);

  useEffect(() => {
    const moduleSlug =
      selectedAuditModule?.moduleSlug ?? selectedAuditService?.moduleSlug ?? selectedAuditModule?.services?.[0]?.moduleSlug;
    const moduleUsesHierarchy =
      !!selectedAuditModule?.moduleSlug ||
      selectedAuditModule?.users === "hierarchy" ||
      selectedAuditModule?.users === "dropdown" ||
      selectedAuditService?.users === "hierarchy" ||
      selectedAuditService?.users === "dropdown";
    if (!moduleSlug || !moduleUsesHierarchy) {
      setAuditUserOptions([]);
      return;
    }
    let cancelled = false;
    GetHierarchyData(moduleSlug)
      .then((data: HierarchyResponse) => {
        if (cancelled || !data?.extensions || !Array.isArray(data.extensions)) return;
        setAuditUserOptions(
          data.extensions.map((ext) => ({ value: hierarchyExtOptionValue(ext), label: hierarchyExtOptionLabel(ext) })),
        );
      })
      .catch(() => {
        if (!cancelled) setAuditUserOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [
    selectedAuditModule,
    selectedAuditService?.serviceName,
    selectedAuditService?.moduleSlug,
    selectedAuditService?.users,
    selectedAuditModule?.users,
  ]);

  useEffect(() => {
    if (!selectedAuditModule || typeof selectedAuditModule.endpoint !== "function") return;
    const moduleSlug =
      selectedAuditModule?.moduleSlug ?? selectedAuditService?.moduleSlug ?? selectedAuditModule?.services?.[0]?.moduleSlug;
    const pageKey = selectedAuditModule.pageKey ?? "page";
    const perPageKey = selectedAuditModule.perPageKey ?? "limit";
    const params: Record<string, unknown> = { module_slug: moduleSlug, [pageKey]: auditPage, [perPageKey]: auditLimit };
    if (selectedAuditService) {
      if (selectedAuditService.serviceKey) params[selectedAuditService.serviceKey] = selectedAuditService.serviceValue;
      else params.service = selectedAuditService.serviceName;
    }
    if (selectedAuditUser) {
      const userKey = selectedAuditService?.userKey ?? selectedAuditModule?.userKey ?? "user_id";
      params[userKey] = selectedAuditUser;
    }
    if (selectedAuditAction) {
      if (selectedAuditService?.actionKey) params[selectedAuditService.actionKey] = selectedAuditAction;
      else params.action = selectedAuditAction;
    }
    const timestampConfig = selectedAuditModule?.timestamp;
    const [startKey, endKey] = getTimestampParamKeys(timestampConfig as [string, string]);
    if (auditStartDate) params[startKey] = auditStartDate;
    if (auditEndDate) params[endKey] = auditEndDate;

    let cancelled = false;
    setAuditLogsLoading(true);
    selectedAuditModule
      .endpoint(params)
      .then((result: unknown) => {
        if (cancelled) return;
        const data = normalizeAuditResponse(result);
        setAuditLogsData(data);
        const res = result as {
          pagination?: { total?: number };
          summary?: Record<string, number>;
          data?: { summary?: Record<string, number> };
        };
        if (res?.pagination?.total == null) setAuditTotal(Array.isArray(data) ? data.length : 0);
        else setAuditTotal(res.pagination.total);
        const summaryObj = res?.summary ?? res?.data?.summary;
        if (summaryObj && typeof summaryObj === "object" && !Array.isArray(summaryObj)) {
          const summary: Record<string, number> = {};
          Object.entries(summaryObj).forEach(([k, v]) => {
            if (typeof v === "number" && !Number.isNaN(v)) summary[k] = v;
          });
          setAuditLogsSummary(Object.keys(summary).length ? summary : null);
        } else {
          setAuditLogsSummary(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAuditLogsData([]);
          setAuditTotal(0);
          setAuditLogsSummary(null);
        }
      })
      .finally(() => {
        if (!cancelled) setAuditLogsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    selectedAuditModule,
    selectedAuditService,
    selectedAuditAction,
    auditStartDate,
    auditEndDate,
    selectedAuditUser,
    auditPage,
    auditLimit,
  ]);

  const handlePreviewClick = useCallback((row: Record<string, unknown>) => {
    setSelectedRow(row);
    setShowSidebar(true);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setShowSidebar(false);
    setSelectedRow(null);
  }, []);

  const dataList = useMemo(() => {
    const raw = auditLogsData ?? [];
    const moduleName = selectedAuditModule?.moduleName ?? "";
    if (moduleName === "Main App") {
      return raw.map((row) => {
        const rowObj = row as Record<string, unknown>;
        const derived = deriveChangesFromOldNew(
          rowObj.old_values as Record<string, unknown> | undefined,
          rowObj.new_values as Record<string, unknown> | undefined,
        );
        const ext = asStringOrEmpty(rowObj.user_extension);
        const userExtObj = toUserLike(rowObj.user_extension);
        const userDisplay =
          auditUserOptions.find((o) => String(o.value) === ext)?.label ??
          (userExtObj ? userExtObj.display_name || userExtObj.name : null);
        const formattedTimestamp =
          scalarToDisplayString(rowObj.formatted_timestamp) ||
          formatAuditTimestampOrEmpty(rowObj.created_at, "MMM D, YYYY HH:mm:ss") ||
          null;
        const formattedAction =
          scalarToDisplayString(rowObj.formatted_action) ||
          (rowObj.action != null && rowObj.action !== "" ? formatLabel(rowObj.action) : "") ||
          scalarToDisplayString(rowObj.action) ||
          null;
        return {
          ...rowObj,
          resource_type: rowObj.record_type ?? rowObj.resource_type,
          formatted_timestamp: formattedTimestamp,
          formatted_action: formattedAction,
          changes_summary: rowObj.changes_summary ?? derived,
          ...(userDisplay != null && userDisplay !== "" ? { user_display: userDisplay } : {}),
        };
      });
    }
    if (moduleName === "Accounts" || moduleName === "Automation") {
      return raw.map((row) => {
        const rowObj = row as Record<string, unknown>;
        const existing = rowObj.changes_summary;
        if (existing && Array.isArray(existing) && existing.length > 0) return row as Record<string, unknown>;
        const derived = deriveChangesFromOldNew(
          rowObj.old_values as Record<string, unknown> | undefined,
          rowObj.new_values as Record<string, unknown> | undefined,
        );
        return { ...rowObj, changes_summary: derived };
      });
    }
    if (moduleName === "CRM") {
      return raw.map((row) => {
        const rowObj = row as Record<string, unknown>;
        const ext = asStringOrEmpty(rowObj.user_extension);
        const userExtObj = toUserLike(rowObj.user_extension);
        const userDisplay =
          auditUserOptions.find((o) => String(o.value) === ext)?.label ??
          (userExtObj ? userExtObj.display_name || userExtObj.name : null);
        return {
          ...rowObj,
          changes_summary: rowObj.changes_summary ?? normalizeCrmChanges(rowObj.changes) ?? [],
          ...(userDisplay != null && userDisplay !== "" ? { user_display: userDisplay } : {}),
        };
      });
    }
    return raw as Record<string, unknown>[];
  }, [auditLogsData, selectedAuditModule?.moduleName, auditUserOptions]);

  const actionOptions = useMemo<string[]>(() => {
    if (selectedAuditService)
      return ((selectedAuditService.actions ?? []) as unknown[]).filter((a: unknown): a is string => typeof a === "string");
    return Array.from(
      new Set(
        visibleAuditServices
          .flatMap((s: AuditFilterService) => (s.actions ?? []) as unknown[])
          .filter((a: unknown): a is string => typeof a === "string"),
      ),
    );
  }, [selectedAuditService, visibleAuditServices]);

  const dateLabel = useMemo(() => {
    if (!auditStartDate || !auditEndDate) return "Last 30 days";
    if (auditStartDate === auditEndDate) return moment(auditStartDate).format("MMM D, YYYY");
    return `${moment(auditStartDate).format("MMM D")} – ${moment(auditEndDate).format("MMM D, YYYY")}`;
  }, [auditStartDate, auditEndDate]);

  const pagination: PaginationConfig = useMemo(
    () => ({
      currentPage: auditPage,
      rowsPerPage: auditLimit,
      totalRows: auditTotal,
      pageSizeOptions: [10, 15, 25, 50, 100],
    }),
    [auditPage, auditLimit, auditTotal],
  );

  const handlePaginationChange = useCallback((page: number, rowsPerPage: number) => {
    setAuditPage(page);
    setAuditLimit(rowsPerPage);
  }, []);

  const showUserFilter =
    selectedAuditModule?.users === "hierarchy" ||
    selectedAuditModule?.users === "dropdown" ||
    selectedAuditService?.users === "hierarchy" ||
    selectedAuditService?.users === "dropdown";

  const applyCustomDateRange = useCallback(() => {
    setAuditStartDate(customStartDate);
    setAuditEndDate(customEndDate);
    setShowAuditDateCustomModal(false);
  }, [customStartDate, customEndDate]);

  return {
    visibleAuditModules,
    selectedAuditModule,
    handleAuditModuleChange,
    mobileTabsOpen,
    setMobileTabsOpen,
    visibleAuditServices,
    selectedAuditService,
    handleAuditServiceChange,
    clearAuditService,
    serviceSearch,
    setServiceSearch,
    actionOptions,
    selectedAuditAction,
    setSelectedAuditAction,
    actionSearch,
    setActionSearch,
    showUserFilter,
    selectedAuditUser,
    setSelectedAuditUser,
    auditUserOptions,
    userSearch,
    setUserSearch,
    dateLabel,
    setAuditStartDate,
    setAuditEndDate,
    setShowAuditDateCustomModal,
    setCustomStartDate,
    setCustomEndDate,
    auditStartDate,
    auditEndDate,
    auditLogsStatsCards,
    dataList,
    pagination,
    handlePaginationChange,
    auditLogsLoading,
    showSidebar,
    selectedRow,
    handlePreviewClick,
    handleCloseSidebar,
    sidebarFields,
    showAuditDateCustomModal,
    customStartDate,
    customEndDate,
    applyCustomDateRange,
  };
}
