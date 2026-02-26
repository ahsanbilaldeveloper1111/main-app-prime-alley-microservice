import React, { useState, useEffect, useCallback, useMemo, ReactElement } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import PageHeader from "@components/PageHeader";
import { Card, Dropdown, Modal, Table, Form, Button } from "react-bootstrap";
import { useSession } from "next-auth/react";
import moment from "moment";
import { FileText } from "lucide-react";
import GenericTable, { TableColumn, PaginationConfig, ToolbarConfig } from "@components/GenericTable";
import GenericSidebar from "@components/GenericSidebarNew";
import { GetHierarchyData } from "@utils/users";
import { AuditFilterConfig, AuditFilterNode, AuditFilterService } from "@config/auditFilterConfig";
import StatsCards, { StatsCardData } from "@components/GenericStatsCards";

function normalizeAuditResponse(result: unknown): unknown[] {
  if (Array.isArray(result)) return result;
  if (result && typeof result === "object" && "data" in result) {
    const d = (result as { data: unknown }).data;
    return Array.isArray(d) ? d : [];
  }
  return [];
}

/** Format value: replace underscores with spaces, capitalize each word (e.g. user_requests → User Requests). */
function formatLabel(value: unknown): string {
  if (value == null || value === "") return "—";
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Build shared Changes column (reused across modules). */
function changesSummaryColumn(): TableColumn<Record<string, unknown>> {
  return {
    key: "changes_summary",
    label: "Changes",
    sortable: false,
    type: "custom",
    render: (row: Record<string, unknown>) => {
      const summary = row.changes_summary as any[] | undefined;
      if (!summary?.length) return "—";
      return (
        <span title={summary.map((c: any) => `${c.field}: ${c.type} ${c.new || c.old || ""}`).join("\n")}>
          {summary.length} change{summary.length !== 1 ? "s" : ""}
        </span>
      );
    },
    emptyValue: "—",
  };
}

/** Columns per module name. Use these when a module is selected. */
const AuditLogColumnsByModule: Record<string, TableColumn<Record<string, unknown>>[]> = {
  "Staff management": [
    { key: "formatted_timestamp", label: "Date & Time", sortable: true, type: "text", emptyValue: "—" },
    { key: "formatted_action", label: "Action", sortable: true, type: "text", emptyValue: "—" },
    {
      key: "resource_type",
      label: "Resource",
      sortable: true,
      type: "text",
      accessor: (row: Record<string, unknown>) => formatLabel(row.resource_type),
      emptyValue: "—",
    },
    {
      key: "user_id",
      label: "User",
      sortable: true,
      type: "text",
      accessor: (row: Record<string, unknown>) =>
        (row.user as any)?.display_name || (row.user as any)?.email || row.user_id || "—",
      emptyValue: "—",
    },
    // { key: "message", label: "Message", sortable: false, type: "text", emptyValue: "—" },
    { key: "ip_address", label: "IP Address", sortable: true, type: "text", emptyValue: "—" },
    changesSummaryColumn(),
  ],
  Accounts: [
    { key: "formatted_timestamp", label: "Date & Time", sortable: true, type: "text", emptyValue: "—" },
    { key: "formatted_action", label: "Action", sortable: true, type: "text", emptyValue: "—" },
    {
      key: "resource_type",
      label: "Resource",
      sortable: true,
      type: "text",
      accessor: (row: Record<string, unknown>) => formatLabel(row.resource_type),
      emptyValue: "—",
    },
    {
      key: "company",
      label: "Company",
      sortable: true,
      type: "text",
      accessor: (row: Record<string, unknown>) => (row.company as any)?.name || "—",
      emptyValue: "—",
    },
    // { key: "message", label: "Message", sortable: false, type: "text", emptyValue: "—" },
    { key: "ip_address", label: "IP Address", sortable: true, type: "text", emptyValue: "—" },
    changesSummaryColumn(),
  ],
  Automation: [
    {
      key: "formatted_timestamp",
      label: "Date & Time",
      sortable: true,
      type: "text",
      accessor: (row: Record<string, unknown>) =>
        (row.formatted_timestamp as string) || (row.created_at ? moment(String(row.created_at)).format("MMM D, YYYY HH:mm:ss") : null) || "—",
      emptyValue: "—",
    },
    {
      key: "formatted_action",
      label: "Action",
      sortable: true,
      type: "text",
      accessor: (row: Record<string, unknown>) =>
        (row.formatted_action as string) || formatLabel(row.action) || (row.action as string) || "—",
      emptyValue: "—",
    },
    {
      key: "resource_type",
      label: "Resource",
      sortable: true,
      type: "text",
      accessor: (row: Record<string, unknown>) => formatLabel(row.resource_type),
      emptyValue: "—",
    },
    {
      key: "company",
      label: "Company",
      sortable: true,
      type: "text",
      accessor: (row: Record<string, unknown>) => (row.company as any)?.name || "—",
      emptyValue: "—",
    },
    // { key: "message", label: "Message", sortable: false, type: "text", emptyValue: "—" },
    { key: "ip_address", label: "IP Address", sortable: true, type: "text", emptyValue: "—" },
    changesSummaryColumn(),
  ],
  CRM: [
    {
      key: "created_at_formatted",
      label: "Date & Time",
      sortable: true,
      type: "text",
      accessor: (row: Record<string, unknown>) =>
        (row.created_at_formatted as string) || (row.created_at ? moment(String(row.created_at)).format("YYYY-MM-DD HH:mm:ss") : null) || "—",
      emptyValue: "—",
    },
    {
      key: "action_display",
      label: "Action",
      sortable: true,
      type: "text",
      accessor: (row: Record<string, unknown>) => (row.action_display as string) || formatLabel(row.event) || "—",
      emptyValue: "—",
    },
    {
      key: "entity_type",
      label: "Entity Type",
      sortable: true,
      type: "text",
      accessor: (row: Record<string, unknown>) => formatLabel(row.entity_type) || "—",
      emptyValue: "—",
    },
    {
      key: "entity_name",
      label: "Entity Name",
      sortable: true,
      type: "text",
      accessor: (row: Record<string, unknown>) => (row.entity_name as string) || "—",
      emptyValue: "—",
    },
    {
      key: "user_extension",
      label: "User",
      sortable: true,
      type: "text",
      accessor: (row: Record<string, unknown>) => {
        const u = row.user_extension;
        if (row.user_display != null && row.user_display !== "") return String(row.user_display);
        if (u && typeof u === "object" && !Array.isArray(u)) return (u as any).display_name || (u as any).name || "—";
        if (u != null && u !== "") return String(u);
        return "—";
      },
      emptyValue: "—",
    },
    { key: "description", label: "Description", sortable: false, type: "text", emptyValue: "—" },
    changesSummaryColumn(),
  ],
  "Main App": [
    {
      key: "formatted_timestamp",
      label: "Date & Time",
      sortable: true,
      type: "text",
      accessor: (row: Record<string, unknown>) =>
        (row.formatted_timestamp as string) || (row.created_at ? moment(String(row.created_at)).format("MMM D, YYYY HH:mm:ss") : null) || "—",
      emptyValue: "—",
    },
    {
      key: "formatted_action",
      label: "Action",
      sortable: true,
      type: "text",
      accessor: (row: Record<string, unknown>) =>
        (row.formatted_action as string) || formatLabel(row.action) || (row.action as string) || "—",
      emptyValue: "—",
    },
    {
      key: "resource_type",
      label: "Resource",
      sortable: true,
      type: "text",
      accessor: (row: Record<string, unknown>) => formatLabel((row.record_type ?? row.resource_type) as string) || "—",
      emptyValue: "—",
    },
    {
      key: "user_id",
      label: "User",
      sortable: true,
      type: "text",
      accessor: (row: Record<string, unknown>) => {
        if (row.user_display != null && row.user_display !== "") return String(row.user_display);
        const uExt = row.user_extension;
        if (uExt && typeof uExt === "object" && !Array.isArray(uExt))
          return (uExt as any).display_name || (uExt as any).name || (uExt as any).email || "—";
        const u = row.user_id;
        if (u && typeof u === "object" && !Array.isArray(u)) return (u as any).display_name || (u as any).name || "—";
        if (u != null && u !== "") return String(u);
        if (uExt != null && uExt !== "") return String(uExt);
        return "—";
      },
      emptyValue: "—",
    },
    changesSummaryColumn(),
  ],
};

/** Default columns when module has no specific definition. */
const defaultAuditLogColumns: TableColumn<Record<string, unknown>>[] = [
  { key: "formatted_timestamp", label: "Date & Time", sortable: true, type: "text", emptyValue: "—" },
  { key: "formatted_action", label: "Action", sortable: true, type: "text", emptyValue: "—" },
  {
    key: "resource_type",
    label: "Resource",
    sortable: true,
    type: "text",
    accessor: (row: Record<string, unknown>) => formatLabel(row.resource_type),
    emptyValue: "—",
  },
  {
    key: "user_id",
    label: "User",
    sortable: true,
    type: "text",
    accessor: (row: Record<string, unknown>) =>
      (row.user as any)?.display_name || (row.user as any)?.email || row.user_id || "—",
    emptyValue: "—",
  },
  // { key: "message", label: "Message", sortable: false, type: "text", emptyValue: "—" },
  { key: "ip_address", label: "IP Address", sortable: true, type: "text", emptyValue: "—" },
  changesSummaryColumn(),
];

function getColumnsForModule(moduleName: string | null): TableColumn<Record<string, unknown>>[] {
  if (!moduleName) return defaultAuditLogColumns;
  return AuditLogColumnsByModule[moduleName] ?? defaultAuditLogColumns;
}

/** Sidebar field config per module: label and row key (or "user" / "changes_summary" for custom value). */
const AUDIT_SIDEBAR_FIELDS_BY_MODULE: Record<
  string,
  Array<{ label: string; key: string; copyable?: boolean; showWhenKey?: string }>
> = {
  "Staff management": [
    { label: "Date & time", key: "formatted_timestamp", copyable: true },
    { label: "Action", key: "formatted_action" },
    { label: "Resource", key: "resource_type" },
    { label: "User", key: "user" },
    { label: "Message", key: "message", showWhenKey: "message" },
    { label: "IP address", key: "ip_address", copyable: true },
  ],
  Accounts: [
    { label: "Date & time", key: "formatted_timestamp", copyable: true },
    { label: "Action", key: "formatted_action" },
    { label: "Resource", key: "resource_type" },
    { label: "Company", key: "company" },
    { label: "Message", key: "message", showWhenKey: "message" },
    { label: "IP address", key: "ip_address", copyable: true },
  ],
  Automation: [
    { label: "Date & time", key: "formatted_timestamp", copyable: true },
    { label: "Action", key: "formatted_action" },
    { label: "Resource", key: "resource_type" },
    { label: "Company", key: "company" },
    { label: "Message", key: "message", showWhenKey: "message" },
    { label: "IP address", key: "ip_address", copyable: true },
  ],
  CRM: [
    { label: "Date & time", key: "created_at_formatted", copyable: true },
    { label: "Action", key: "action_display" },
    { label: "Entity type", key: "entity_type" },
    { label: "Entity name", key: "entity_name" },
    { label: "Description", key: "description", showWhenKey: "description" },
  ],
  "Main App": [
    { label: "Date & time", key: "formatted_timestamp", copyable: true },
    { label: "Action", key: "formatted_action" },
    { label: "Resource", key: "resource_type" },
    { label: "User", key: "user_id" },
    { label: "Changes", key: "changes_summary" },
  ],
};

const DEFAULT_SIDEBAR_FIELDS = AUDIT_SIDEBAR_FIELDS_BY_MODULE["Staff management"];

function getSidebarFieldValue(row: Record<string, unknown>, key: string): string {
  if (key === "user" || key === "user_id") {
    if (row.user_display != null && row.user_display !== "") return String(row.user_display);
    const uExt = row.user_extension;
    if (uExt && typeof uExt === "object" && !Array.isArray(uExt))
      return (uExt as any).display_name || (uExt as any).name || (uExt as any).email || "—";
    if (uExt != null && uExt !== "") return String(uExt);
    const u = row.user as any;
    return u?.display_name || u?.email || (row.user_id != null ? String(row.user_id) : "—") || "—";
  }
  if (key === "company") {
    return (row.company as any)?.name || "—";
  }
  if (key === "resource_type") return formatLabel(row.record_type ?? row.resource_type);
  if (key === "formatted_timestamp") {
    const v = row.formatted_timestamp;
    if (v != null && v !== "") return String(v);
    if (row.created_at) return moment(String(row.created_at)).format("MMM D, YYYY HH:mm:ss");
    return "—";
  }
  if (key === "formatted_action") {
    const v = row.formatted_action;
    if (v != null && v !== "") return String(v);
    return formatLabel(row.action) || (row.action != null ? String(row.action) : "") || "—";
  }
  if (key === "created_at_formatted") {
    const v = row.created_at_formatted;
    if (v != null && v !== "") return String(v);
    if (row.created_at) return moment(String(row.created_at)).format("YYYY-MM-DD HH:mm:ss");
    return "—";
  }
  if (key === "action_display") {
    return (row.action_display as string) || formatLabel(row.event) || "—";
  }
  if (key === "entity_type") return formatLabel(row.entity_type) || "—";
  if (key === "changes_summary") {
    const summary = row.changes_summary as ChangeItem[] | undefined;
    if (!summary?.length) return "—";
    return `${summary.length} change${summary.length !== 1 ? "s" : ""}: ${summary.map((c) => c.field).filter(Boolean).join(", ")}`;
  }
  const v = row[key];
  return v != null && v !== "" ? String(v) : "—";
}

/** Resolve API param keys for date range from service/module timestamp config. */
function getTimestampParamKeys(timestamp: string | [string, string] | undefined): [string, string] {
  if (!timestamp) return ["date_from", "date_to"];
  if (Array.isArray(timestamp)) return [timestamp[0], timestamp[1]];
  return [`${timestamp}_from`, `${timestamp}_to`];
}

function getSidebarFieldsForModule(
  moduleName: string | null,
  row: Record<string, unknown>
): Array<{ label: string; value: string; type: "text"; copyable?: boolean; show?: boolean }> {
  const config = (moduleName && AUDIT_SIDEBAR_FIELDS_BY_MODULE[moduleName]) || DEFAULT_SIDEBAR_FIELDS;
  return config.map(({ label, key, copyable, showWhenKey }) => ({
    label,
    value: getSidebarFieldValue(row, key),
    type: "text" as const,
    copyable,
    show: showWhenKey ? !!row[showWhenKey] : true,
  }));
}

type ChangeItem = { field?: string; type?: string; new?: string; old?: string };

/** Derive changes_summary from old_values and new_values (e.g. Accounts, Automation APIs). */
function deriveChangesFromOldNew(
  oldValues: Record<string, unknown> | null | undefined,
  newValues: Record<string, unknown> | null | undefined
): ChangeItem[] {
  const old = oldValues && typeof oldValues === "object" ? oldValues : {};
  const newV = newValues && typeof newValues === "object" ? newValues : {};
  const format = (v: unknown): string => (v == null || v === "" ? "—" : String(v));
  const allKeys = new Set([...Object.keys(old), ...Object.keys(newV)]);
  const items: ChangeItem[] = [];
  allKeys.forEach((key) => {
    const oldVal = old[key];
    const newVal = newV[key];
    const hasOld = key in old;
    const hasNew = key in newV;
    if (!hasOld && hasNew) {
      items.push({ field: formatLabel(key), type: "added", old: "—", new: format(newVal) });
    } else if (hasOld && !hasNew) {
      items.push({ field: formatLabel(key), type: "removed", old: format(oldVal), new: "—" });
    } else if (hasOld && hasNew && oldVal !== newVal) {
      items.push({ field: formatLabel(key), type: "updated", old: format(oldVal), new: format(newVal) });
    }
  });
  return items;
}

/** Normalize CRM changes: object { fieldKey: { old, new } } or array -> ChangeItem[]. */
function normalizeCrmChanges(changes: unknown): ChangeItem[] {
  if (!changes) return [];
  const format = (v: unknown): string => (v == null || v === "" ? "—" : String(v));
  if (Array.isArray(changes)) {
    return changes.map((c: any) => ({
      field: c.field ?? (c.fieldKey != null ? formatLabel(c.fieldKey) : "—"),
      type: c.type ?? "updated",
      old: c.old != null ? format(c.old) : "—",
      new: c.new != null ? format(c.new) : "—",
    }));
  }
  if (typeof changes === "object" && changes !== null && !Array.isArray(changes)) {
    const obj = changes as Record<string, { old?: unknown; new?: unknown }>;
    return Object.entries(obj).map(([key, val]) => ({
      field: formatLabel(key),
      type: "updated",
      old: val && typeof val === "object" && "old" in val ? format(val.old) : "—",
      new: val && typeof val === "object" && "new" in val ? format(val.new) : "—",
    }));
  }
  return [];
}

function ChangesSummaryTable({ changes }: { changes: ChangeItem[] }) {
  if (!changes?.length) {
    return <span className="text-muted">—</span>;
  }
  return (
    <Table size="sm" bordered className="mb-0 small">
      <thead>
        <tr>
          <th>Field</th>
          <th>Type</th>
          <th>New</th>
          <th>Old</th>
        </tr>
      </thead>
      <tbody>
        {changes.map((c, i) => (
          <tr key={i}>
            <td>{c.field ?? "—"}</td>
            <td>{c.type ?? "—"}</td>
            <td className="text-break">{c.new ?? "—"}</td>
            <td className="text-break">{c.old ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

const AuditLogsNewPage = () => {
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

  const visibleAuditModules = useMemo(() => {
    const perms = session?.user?.permissions ?? [];
    return AuditFilterConfig.filter((n) => perms.includes(n.isShow));
  }, [session?.user?.permissions]);

  const visibleAuditServices = useMemo(() => {
    if (!selectedAuditModule) return [];
    const perms = session?.user?.permissions ?? [];
    return selectedAuditModule.services.filter((s) => perms.includes(s.isShow ?? ""));
  }, [selectedAuditModule, session?.user?.permissions]);

  const handleAuditModuleChange = useCallback((moduleName: string) => {
    if (selectedAuditModule?.moduleName === moduleName) return;
    setAuditLogsData(null);
    setAuditLogsSummary(null);
    const node = visibleAuditModules.find((n) => n.moduleName === moduleName) ?? null;
    setSelectedAuditModule(node);
    setSelectedAuditService(null);
    setSelectedAuditAction("");
    setAuditStartDate("");
    setAuditEndDate("");
    setSelectedAuditUser("");
    setAuditPage(1);
  }, [visibleAuditModules, selectedAuditModule?.moduleName]);

  const handleAuditServiceChange = useCallback((serviceName: string) => {
    if (selectedAuditService?.serviceName === serviceName) return;
    const svc = visibleAuditServices.find((s) => s.serviceName === serviceName) ?? null;
    setSelectedAuditService(svc);
    setSelectedAuditAction("");
    setAuditStartDate("");
    setAuditEndDate("");
    setSelectedAuditUser("");
    setAuditLogsData(null);
    setAuditLogsSummary(null);
    setAuditPage(1);
  }, [visibleAuditServices, selectedAuditService?.serviceName]);


  /** Known summary key -> display label (supports both e.g. created/create, updated/update). */
  const auditLogsStatsCards: StatsCardData[] = useMemo(() => {
    const s = auditLogsSummary;
    if (!s || typeof s !== "object") return [];
    const keys = Object.keys(s).filter((k) => typeof s[k] === "number");
    return keys.map((key) => ({
      title: formatLabel(key),
      value: Number(s[key]),
    }));
  }, [auditLogsSummary, auditLogsData?.length, auditTotal]);

  useEffect(() => {
    const moduleSlug =
      selectedAuditModule?.moduleSlug ??
      selectedAuditService?.moduleSlug ??
      selectedAuditModule?.services?.[0]?.moduleSlug;
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
      .then((data: any) => {
        if (cancelled || !data?.extensions || !Array.isArray(data.extensions)) return;
        setAuditUserOptions(
          data.extensions.map((ext: any) => ({
            value: String(ext.id ?? ext.extension_number ?? ext.extension ?? ext.user_id ?? ""),
            label: ext.display_name || ext.name || ext.extension_number || ext.extension || String(ext.id ?? "Unknown"),
          }))
        );
      })
      .catch(() => { if (!cancelled) setAuditUserOptions([]); });
    return () => { cancelled = true; };
  }, [selectedAuditModule, selectedAuditService?.serviceName, selectedAuditService?.moduleSlug, selectedAuditService?.users, selectedAuditModule?.users]);

  useEffect(() => {
    if (!selectedAuditModule || typeof selectedAuditModule.endpoint !== "function") return;
    const moduleSlug = selectedAuditModule?.moduleSlug ?? selectedAuditService?.moduleSlug ?? selectedAuditModule?.services?.[0]?.moduleSlug;
    const pageKey = selectedAuditModule.pageKey ?? "page";
    const perPageKey = selectedAuditModule.perPageKey ?? "limit";
    const params: Record<string, unknown> = {
      module_slug: moduleSlug,
      [pageKey]: auditPage,
      [perPageKey]: auditLimit,
    };
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
    selectedAuditModule.endpoint(params)
      .then((result: unknown) => {
        if (cancelled) return;
        const data = normalizeAuditResponse(result);
        setAuditLogsData(data);
        const res = result as {
          pagination?: { total?: number };
          summary?: Record<string, number>;
          data?: { summary?: Record<string, number> };
        };
        if (res?.pagination?.total != null) setAuditTotal(res.pagination.total);
        else setAuditTotal(Array.isArray(data) ? data.length : 0);
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
      .finally(() => { if (!cancelled) setAuditLogsLoading(false); });
    return () => { cancelled = true; };
  }, [selectedAuditModule, selectedAuditService, selectedAuditAction, auditStartDate, auditEndDate, selectedAuditUser, auditPage, auditLimit]);

  const handlePreviewClick = useCallback((row: Record<string, unknown>) => {
    setSelectedRow(row);
    setShowSidebar(true);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setShowSidebar(false);
    setSelectedRow(null);
  }, []);

  /** Normalize rows: Main App / Accounts / Automation derive changes from old_values/new_values; CRM use changes as changes_summary. */
  const dataList = useMemo(() => {
    const raw = auditLogsData ?? [];
    const moduleName = selectedAuditModule?.moduleName ?? "";
    if (moduleName === "Main App") {
      return raw.map((row: any) => {
        const derived = deriveChangesFromOldNew(row.old_values, row.new_values);
        const ext = row.user_extension != null ? String(row.user_extension) : "";
        const userDisplay =
          auditUserOptions.find((o) => String(o.value) === ext)?.label ??
          (row.user_extension && typeof row.user_extension === "object"
            ? (row.user_extension as any).display_name || (row.user_extension as any).name
            : null);
        return {
          ...row,
          resource_type: row.record_type ?? row.resource_type,
          formatted_timestamp: row.formatted_timestamp ?? (row.created_at ? moment(String(row.created_at)).format("MMM D, YYYY HH:mm:ss") : null),
          formatted_action: row.formatted_action ?? (row.action ? formatLabel(row.action) : null) ?? row.action,
          changes_summary: row.changes_summary ?? derived,
          ...(userDisplay != null && userDisplay !== "" ? { user_display: userDisplay } : {}),
        };
      });
    }
    if (moduleName === "Accounts" || moduleName === "Automation") {
      return raw.map((row: any) => {
        const existing = row.changes_summary;
        if (existing && Array.isArray(existing) && existing.length > 0) return row;
        const derived = deriveChangesFromOldNew(row.old_values, row.new_values);
        return { ...row, changes_summary: derived };
      });
    }
    if (moduleName === "CRM") {
      return raw.map((row: any) => {
        const ext = row.user_extension != null ? String(row.user_extension) : "";
        const userDisplay = auditUserOptions.find((o) => String(o.value) === ext)?.label ?? (row.user_extension && typeof row.user_extension === "object" ? (row.user_extension as any).display_name || (row.user_extension as any).name : null);
        return {
          ...row,
          changes_summary: row.changes_summary ?? normalizeCrmChanges(row.changes) ?? [],
          ...(userDisplay != null && userDisplay !== "" ? { user_display: userDisplay } : {}),
        };
      });
    }
    return raw;
  }, [auditLogsData, selectedAuditModule?.moduleName, auditUserOptions]);

  const isReady = !!selectedAuditModule;

  const changesSummary = (selectedRow?.changes_summary as ChangeItem[] | undefined) ?? [];

  const filterPills = useMemo(() => {
    const pills: any[] = [];
    if (visibleAuditModules.length === 0) return pills;
    
    // Add individual module pills instead of dropdown
    visibleAuditModules.forEach((module) => {
      pills.push({
        id: `audit_module_${module.moduleName}`,
        label: module.moduleName,
        active: selectedAuditModule?.moduleName === module.moduleName,
        onClick: () => handleAuditModuleChange(module.moduleName),
        onClear: selectedAuditModule?.moduleName === module.moduleName 
          ? () => handleAuditModuleChange("")
          : undefined,
      });
    });
    
    if (!selectedAuditModule) return pills;
    pills.push({
      id: "audit_service",
      searchable: true,
      label: selectedAuditService ? selectedAuditService.serviceName : "Select Resources",
      showDropdown: true,
      dropdownOptions: [
        // { label: "All Resources", value: "", onClick: () => handleAuditServiceChange("") },
        ...visibleAuditServices.map((s) => ({ label: s.serviceName, value: s.serviceName, onClick: () => handleAuditServiceChange(s.serviceName) })),
      ],
    });
    const actionOptions = selectedAuditService
      ? selectedAuditService.actions
      : Array.from(new Set(visibleAuditServices.flatMap((s) => s.actions)));
    pills.push({
      id: "audit_action",
      label: selectedAuditAction || "Select Action",
      showDropdown: true,
      searchable: true,
      dropdownOptions: [
        { label: "All", value: "", onClick: () => setSelectedAuditAction("") },
        ...actionOptions?.map((a) => ({ label: a, value: a, onClick: () => setSelectedAuditAction(a ?? "") })) ?? [],
      ],
    });
    pills.push({
      id: "audit_date",
      label: auditStartDate && auditEndDate
        ? auditStartDate === auditEndDate ? moment(auditStartDate).format("MMM D, YYYY") : `${moment(auditStartDate).format("MMM D")} - ${moment(auditEndDate).format("MMM D, YYYY")}`
        : "Select Audit date",
      showDropdown: true,
      dropdownOptions: [
        { label: "All Time", value: "all", onClick: () => { setAuditStartDate(""); setAuditEndDate(""); } },
        { label: "Today", value: "today", onClick: () => { const t = moment().format("YYYY-MM-DD"); setAuditStartDate(t); setAuditEndDate(t); } },
        { label: "Last 7 Days", value: "week", onClick: () => { setAuditStartDate(moment().subtract(7, "days").format("YYYY-MM-DD")); setAuditEndDate(moment().format("YYYY-MM-DD")); } },
        { label: "Last 30 Days", value: "month", onClick: () => { setAuditStartDate(moment().subtract(30, "days").format("YYYY-MM-DD")); setAuditEndDate(moment().format("YYYY-MM-DD")); } },
        { label: "Custom range...", value: "custom", onClick: () => { setCustomStartDate(auditStartDate || ""); setCustomEndDate(auditEndDate || ""); setShowAuditDateCustomModal(true); } },
      ],
    });
    const showUserPill =
      (selectedAuditModule && (selectedAuditModule.users === "hierarchy" || selectedAuditModule.users === "dropdown")) ||
      (selectedAuditService && (selectedAuditService.users === "hierarchy" || selectedAuditService.users === "dropdown"));
    if (showUserPill) {
      pills.push({
        id: "audit_user",
        label: selectedAuditUser ? (auditUserOptions.find((o) => o.value === selectedAuditUser)?.label || selectedAuditUser) : "Select User",
        showDropdown: true,
        searchable: true,
        dropdownOptions: [
          { label: "All users", value: "", onClick: () => setSelectedAuditUser("") },
          ...auditUserOptions.map((o) => ({ label: o.label, value: o.value, onClick: () => setSelectedAuditUser(o.value) })),
        ],
      });
    }
    return pills;
  }, [visibleAuditModules, visibleAuditServices, selectedAuditModule, selectedAuditService, selectedAuditAction, auditStartDate, auditEndDate, selectedAuditUser, auditUserOptions, handleAuditModuleChange, handleAuditServiceChange]);

  const toolbarConfig: ToolbarConfig = useMemo(() => ({
    showTabs: false,
    showSearch: false,
    showFiltersButton: false,
    showFilterPills: true,
    showSortButton: false,
    showExportButton: false,
    filterPills,
    showAdvancedFilters: false,
  }), [filterPills]);

  const pagination: PaginationConfig = useMemo(() => ({
    currentPage: auditPage,
    rowsPerPage: auditLimit,
    totalRows: auditTotal,
    pageSizeOptions: [10, 15, 25, 50, 100],
  }), [auditPage, auditLimit, auditTotal]);

  const handlePaginationChange = useCallback((page: number, rowsPerPage: number) => {
    setAuditPage(page);
    setAuditLimit(rowsPerPage);
  }, []);

  return (
    <>
      <style>{`
        .gt-toolbar-main,
        .gt-filter-pills {
          border: none !important;
          padding: 0 !important;
        }
      `}</style>
      <BreadcrumbItem mainTitle="Audit Logs" mainLink="/audit-logs" subTitle="Audit Logs" />
      <div style={{ backgroundColor: "#ffffff", minHeight: "100vh" }}>
        <div style={{ padding: "20px" }}>
          <h1 style={{ fontWeight: 300, color: "#141414", fontSize: "24px", marginBottom: "8px" }}>
            Audit Logs
          </h1>
          <p style={{ fontSize: "14px", fontWeight: 100, color: "#666", marginBottom: "20px" }}>
            View audit logs by module and service
          </p>
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <GenericTable
              data={dataList as Record<string, unknown>[]}
              columns={getColumnsForModule(selectedAuditModule?.moduleName ?? null)}
              actions={[]}
              showActions={false}
              selectable={false}
              selectedRows={[]}
              onSelectionChange={() => {}}
              pagination={pagination}
              onPaginationChange={handlePaginationChange}
              sortable
              defaultSortColumn="formatted_timestamp"
              defaultSortDirection="desc"
              onSort={() => {}}
              onPreviewClick={handlePreviewClick}
              loading={auditLogsLoading}
              emptyMessage="No audit logs found matching your criteria"
              loadingMessage="Loading audit logs..."
              hover
              uniqueKey="id"
              fixedHeight
              maxHeight="calc(100vh - 280px)"
              showToolbar
              toolbar={toolbarConfig}
              statsCards={selectedAuditModule ? auditLogsStatsCards : []}
              showToolbarActions={false}
              noBorder={true}
            />
          </div>
        </div>
      </div>

      {showSidebar && selectedRow && (
          <GenericSidebar
            isOpen={showSidebar}
            onClose={handleCloseSidebar}
            
            title={selectedRow?.formatted_action ? `Audit: ${selectedRow.formatted_action}` : "Audit log"}
            subtitle={(selectedRow?.formatted_timestamp as string) || ""}
            quickActions={[]}
            sections={[
              {
                id: "audit-details",
                title: "Audit log details",
                icon: FileText,
                collapsible: true,
                defaultExpanded: true,
                actions: [],
                fields: getSidebarFieldsForModule(selectedAuditModule?.moduleName ?? null, selectedRow),
              },
              {
                id: "audit-changes",
                title: "Changes",
                icon: FileText,
                collapsible: true,
                defaultExpanded: true,
                actions: [],
                customContent: <ChangesSummaryTable changes={changesSummary} />,
              },
            ]}
          />
        )}

      <Modal show={showAuditDateCustomModal} onHide={() => setShowAuditDateCustomModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Custom date range</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Start date</Form.Label>
            <Form.Control
              type="date"
              value={customStartDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomStartDate(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-0">
            <Form.Label>End date</Form.Label>
            <Form.Control
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowAuditDateCustomModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setAuditStartDate(customStartDate);
              setAuditEndDate(customEndDate);
              setShowAuditDateCustomModal(false);
            }}
          >
            Apply
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

AuditLogsNewPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;
export default AuditLogsNewPage;
