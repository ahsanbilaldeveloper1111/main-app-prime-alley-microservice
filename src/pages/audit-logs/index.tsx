import React, { useState, useEffect, useCallback, useMemo, ReactElement } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Modal, Table, Form, Button, Dropdown } from "react-bootstrap";
import { useSession } from "next-auth/react";
import moment from "moment";
import GenericTable, { TableColumn, PaginationConfig } from "@components/GenericTable";
import { GetHierarchyData } from "@utils/users";
import { AuditFilterConfig, AuditFilterNode, AuditFilterService } from "@config/auditFilterConfig";
import { StatsCardData } from "@components/GenericStatsCards";
import AuditLogSidebar, { AuditSidebarField } from "@components/AuditLogSidebar";

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
    .replaceAll("_", " ")
    .replaceAll(/\b\w/g, (c) => c.toUpperCase());
}

/** Build shared Changes column (reused across modules). */
function changesSummaryColumn(): TableColumn<Record<string, unknown>> {
  return {
    key: "changes_summary",
    label: "Changes",
    sortable: false,
    type: "custom",
    render: (row: Record<string, unknown>) => {
      const summary = row.changes_summary as ChangeItem[] | undefined;
      if (summary == null || summary.length === 0) return "—";
      const suffix = summary.length === 1 ? "" : "s";
      return (
        <span title={summary.map((c) => `${c.field}: ${c.type} ${c.new || c.old || ""}`).join("\n")}>
          {summary.length} change{suffix}
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
      accessor: (row: Record<string, unknown>) => userDisplayFromRow(row),
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
      accessor: (row: Record<string, unknown>) => companyNameFromRow(row),
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
      accessor: (row: Record<string, unknown>) => companyNameFromRow(row),
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
        const userObj = toUserLike(u);
        if (userObj) return userObj.display_name || userObj.name || "—";
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
        const uExtObj = toUserLike(uExt);
        if (uExtObj) return uExtObj.display_name || uExtObj.name || uExtObj.email || "—";
        const u = row.user_id;
        const uObj = toUserLike(u);
        if (uObj) return uObj.display_name || uObj.name || "—";
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
    accessor: (row: Record<string, unknown>) => userDisplayFromRow(row),
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

type UserLike = { display_name?: string; name?: string; email?: string };
function asStringOrEmpty(value: unknown): string {
  if (value == null || value === "") return "";
  return String(value);
}

function valueOrDash(value: unknown): string {
  if (value == null || value === "") return "—";
  return String(value);
}
type HierarchyResponse = { extensions?: Array<Record<string, unknown>> };

function toUserLike(value: unknown): UserLike | null {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as UserLike;
  return null;
}

function userDisplayFromRow(row: Record<string, unknown>): string {
  if (row.user_display != null && row.user_display !== "") return String(row.user_display);
  const uExt = row.user_extension;
  const uExtObj = toUserLike(uExt);
  if (uExtObj) return uExtObj.display_name || uExtObj.name || uExtObj.email || "—";
  if (uExt != null && uExt !== "") return String(uExt);
  const uObj = toUserLike(row.user);
  if (uObj) return uObj.display_name || uObj.email || uObj.name || "—";
  if (row.user_id != null && row.user_id !== "") return String(row.user_id);
  return "—";
}

function companyNameFromRow(row: Record<string, unknown>): string {
  const company = row.company;
  if (company && typeof company === "object" && !Array.isArray(company)) {
    const name = (company as { name?: unknown }).name;
    if (name != null && name !== "") return String(name);
  }
  return "—";
}

function getSidebarFieldValue(row: Record<string, unknown>, key: string): string { // NOSONAR
  if (key === "user" || key === "user_id") return userDisplayFromRow(row);
  if (key === "company") return companyNameFromRow(row);
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
    const formattedAction = formatLabel(row.action);
    if (formattedAction !== "—") return formattedAction;
    if (row.action != null && row.action !== "") return String(row.action);
    return "—";
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
    if (summary == null || summary.length === 0) return "—";
    const suffix = summary.length === 1 ? "" : "s";
    return `${summary.length} change${suffix}: ${summary.map((c) => c.field).filter(Boolean).join(", ")}`;
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
    return changes.map((c) => {
      const obj = c as Record<string, unknown>;
      const fieldValue = valueOrDash(obj.field);
      const fieldKeyValue = valueOrDash(obj.fieldKey) === "—" ? "—" : formatLabel(obj.fieldKey);
      const field = fieldValue === "—" ? fieldKeyValue : fieldValue;
      const type = valueOrDash(obj.type) === "—" ? "updated" : String(obj.type);
      return {
        field,
        type,
        old: valueOrDash(obj.old) === "—" ? "—" : format(obj.old),
        new: valueOrDash(obj.new) === "—" ? "—" : format(obj.new),
      };
    });
  }
  if (typeof changes === "object" && changes !== null && !Array.isArray(changes)) {
    const obj = changes as Record<string, { old?: unknown; new?: unknown }>;
    return Object.entries(obj).map(([key, val]) => ({
      field: formatLabel(key),
      type: "updated",
      old: val != null && typeof val === "object" && "old" in val ? format(val.old) : "—",
      new: val != null && typeof val === "object" && "new" in val ? format(val.new) : "—",
    }));
  }
  return [];
}

function ChangesSummaryTable({ changes }: Readonly<{ changes: ChangeItem[] }>) {
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
        {changes.map((c) => (
          <tr key={`${c.field ?? "field"}-${c.type ?? "type"}-${c.new ?? ""}-${c.old ?? ""}`}>
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

const AuditLogsNewPage = () => { // NOSONAR
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

  const selectedRowUser = toUserLike(selectedRow?.user);
  const sidebarFields: AuditSidebarField[] = selectedRow ? [
  { label: "Category",       value: formatLabel(selectedRow.resource_type) },
  { label: "Subcategory",    value: formatLabel(selectedRow.formatted_action) },
  { label: "Action",         value: "Perform" },
  {
    label: "Date of change",
    value: selectedRow.formatted_timestamp as string,
  },
  {
    label: "Modified by",
    value: "",
    isUser: true,
    userName: selectedRowUser?.display_name || "Unknown",
    userEmail: selectedRowUser?.email || "",
    sectionBreakAfter: true,
  },
  { label: "Country",        value: selectedRow.country != null && selectedRow.country !== "" ? String(selectedRow.country) : "—" },
  { label: "Region",         value: selectedRow.region != null && selectedRow.region !== "" ? String(selectedRow.region) : "—" },
  { label: "Login Type",     value: selectedRow.login_type != null && selectedRow.login_type !== "" ? String(selectedRow.login_type) : "—" },
  { label: "User Agent",     value: selectedRow.user_agent != null && selectedRow.user_agent !== "" ? String(selectedRow.user_agent) : "—" },
  { label: "IP Address",     value: selectedRow.ip_address != null && selectedRow.ip_address !== "" ? String(selectedRow.ip_address) : "—" },
] : [];

  const visibleAuditModules = useMemo(() => {
    const perms = session?.user?.permissions ?? [];
    return AuditFilterConfig.filter((n: AuditFilterNode) => perms.includes(n.isShow));
  }, [session?.user?.permissions]);

  const visibleAuditServices = useMemo(() => {
    if (!selectedAuditModule) return [];
    const perms = session?.user?.permissions ?? [];
    return selectedAuditModule.services.filter((s: AuditFilterService) => perms.includes(s.isShow ?? ""));
  }, [selectedAuditModule, session?.user?.permissions]);

  const handleAuditModuleChange = useCallback((moduleName: string) => {
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
  }, [visibleAuditModules, selectedAuditModule?.moduleName]);

  const handleAuditServiceChange = useCallback((serviceName: string) => {
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
      .then((data: HierarchyResponse) => {
        if (cancelled || !data?.extensions || !Array.isArray(data.extensions)) return;
        setAuditUserOptions(
          data.extensions.map((ext) => ({
            value: String(ext.id ?? ext.extension_number ?? ext.extension ?? ext.user_id ?? ""),
            label: String(ext.display_name ?? ext.name ?? ext.extension_number ?? ext.extension ?? ext.id ?? "Unknown"),
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
      return raw.map((row) => {
        const rowObj = row as Record<string, unknown>;
        const derived = deriveChangesFromOldNew(
          rowObj.old_values as Record<string, unknown> | undefined,
          rowObj.new_values as Record<string, unknown> | undefined
        );
        const ext = asStringOrEmpty(rowObj.user_extension);
        const userExtObj = toUserLike(rowObj.user_extension);
        const userDisplay =
          auditUserOptions.find((o) => String(o.value) === ext)?.label ??
          (userExtObj ? userExtObj.display_name || userExtObj.name : null);
        return {
          ...rowObj,
          resource_type: rowObj.record_type ?? rowObj.resource_type,
          formatted_timestamp: rowObj.formatted_timestamp ?? (rowObj.created_at ? moment(String(rowObj.created_at)).format("MMM D, YYYY HH:mm:ss") : null),
          formatted_action: rowObj.formatted_action ?? (rowObj.action ? formatLabel(rowObj.action) : null) ?? rowObj.action,
          changes_summary: rowObj.changes_summary ?? derived,
          ...(userDisplay != null && userDisplay !== "" ? { user_display: userDisplay } : {}),
        };
      });
    }
    if (moduleName === "Accounts" || moduleName === "Automation") {
      return raw.map((row) => {
        const rowObj = row as Record<string, unknown>;
        const existing = rowObj.changes_summary;
        if (existing && Array.isArray(existing) && existing.length > 0) return row;
        const derived = deriveChangesFromOldNew(
          rowObj.old_values as Record<string, unknown> | undefined,
          rowObj.new_values as Record<string, unknown> | undefined
        );
        return { ...rowObj, changes_summary: derived };
      });
    }
    if (moduleName === "CRM") {
      return raw.map((row) => {
        const rowObj = row as Record<string, unknown>;
        const ext = asStringOrEmpty(rowObj.user_extension);
        const userExtObj = toUserLike(rowObj.user_extension);
        const userDisplay = auditUserOptions.find((o) => String(o.value) === ext)?.label ?? (userExtObj ? userExtObj.display_name || userExtObj.name : null);
        return {
          ...rowObj,
          changes_summary: rowObj.changes_summary ?? normalizeCrmChanges(rowObj.changes) ?? [],
          ...(userDisplay != null && userDisplay !== "" ? { user_display: userDisplay } : {}),
        };
      });
    }
    return raw;
  }, [auditLogsData, selectedAuditModule?.moduleName, auditUserOptions]);

  const actionOptions = useMemo<string[]>(() => {
    if (selectedAuditService) {
      return ((selectedAuditService.actions ?? []) as unknown[]).filter((a: unknown): a is string => typeof a === "string");
    }
    return Array.from(
      new Set(
        visibleAuditServices
          .flatMap((s: AuditFilterService) => (s.actions ?? []) as unknown[])
          .filter((a: unknown): a is string => typeof a === "string")
      )
    );
  }, [selectedAuditService, visibleAuditServices]);

  const dateLabel = useMemo(() => {
    if (!auditStartDate || !auditEndDate) return "Select Audit date";
    if (auditStartDate === auditEndDate) return moment(auditStartDate).format("MMM D, YYYY");
    return `${moment(auditStartDate).format("MMM D")} - ${moment(auditEndDate).format("MMM D, YYYY")}`;
  }, [auditStartDate, auditEndDate]);

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
      <BreadcrumbItem mainTitle="Audit Logs" mainLink="/audit-logs" subTitle="Audit Logs" />
      <div style={{ backgroundColor: "#ffffff", minHeight: "100vh" }}>
        <div style={{ padding: "20px" }}>
          <h1 style={{ fontWeight: 300, color: "#141414", fontSize: "24px", marginBottom: "8px" }}>
            Audit Logs
          </h1>
          <p style={{ fontSize: "14px", fontWeight: 100, color: "#666", marginBottom: "20px" }}>
            View audit logs by module and service
          </p>

          {/* Custom two-row audit filter section */}
          {visibleAuditModules.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              {/* Row 1: Module pills */}
              <div className="d-flex align-items-center gap-2 flex-wrap">
                {visibleAuditModules.map((module: AuditFilterNode) => (
                  <button
                    key={module.moduleName}
                    className={`gt-filter-pill${selectedAuditModule?.moduleName === module.moduleName ? " gt-filter-pill-active" : ""}`}
                    onClick={() => handleAuditModuleChange(module.moduleName)}
                  >
                    {module.moduleName}
                  </button>
                ))}
              </div>

              {/* Row 2: Sub-filter dropdowns (shown after a module is selected) */}
              {selectedAuditModule && (
                <div className="d-flex align-items-center gap-2 flex-wrap" style={{ marginTop: "8px" }}>
                  {/* Service */}
                  <Dropdown>
                    <Dropdown.Toggle variant="outline-secondary" size="sm" className="gt-filter-pill">
                      {selectedAuditService ? selectedAuditService.serviceName : "Select Resources"}
                    </Dropdown.Toggle>
                    <Dropdown.Menu style={{ maxHeight: "280px", overflowY: "auto" }}>
                      <div className="px-2 pb-2" onClick={(e) => e.stopPropagation()}>
                        <Form.Control size="sm" type="text" placeholder="Search..." value={serviceSearch}
                          onChange={(e) => setServiceSearch(e.target.value)} autoFocus />
                      </div>
                      {visibleAuditServices
                        .filter((s: AuditFilterService) => s.serviceName.toLowerCase().includes(serviceSearch.toLowerCase()))
                        .map((s: AuditFilterService) => (
                          <Dropdown.Item key={s.serviceName}
                            onClick={() => { handleAuditServiceChange(s.serviceName); setServiceSearch(""); }}>
                            {s.serviceName}
                          </Dropdown.Item>
                        ))}
                    </Dropdown.Menu>
                  </Dropdown>

                  {/* Action */}
                  <Dropdown>
                    <Dropdown.Toggle variant="outline-secondary" size="sm" className="gt-filter-pill">
                      {selectedAuditAction || "Select Action"}
                    </Dropdown.Toggle>
                    <Dropdown.Menu style={{ maxHeight: "280px", overflowY: "auto" }}>
                      <div className="px-2 pb-2" onClick={(e) => e.stopPropagation()}>
                        <Form.Control size="sm" type="text" placeholder="Search..." value={actionSearch}
                          onChange={(e) => setActionSearch(e.target.value)} autoFocus />
                      </div>
                      <Dropdown.Item onClick={() => { setSelectedAuditAction(""); setActionSearch(""); }}>All</Dropdown.Item>
                      {actionOptions
                        .filter((a) => a.toLowerCase().includes(actionSearch.toLowerCase()))
                        .map((a) => (
                          <Dropdown.Item key={a} onClick={() => { setSelectedAuditAction(a); setActionSearch(""); }}>
                            {a}
                          </Dropdown.Item>
                        ))}
                    </Dropdown.Menu>
                  </Dropdown>

                  {/* Date */}
                  <Dropdown>
                    <Dropdown.Toggle variant="outline-secondary" size="sm" className="gt-filter-pill">
                      {dateLabel}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => { setAuditStartDate(""); setAuditEndDate(""); }}>All Time</Dropdown.Item>
                      <Dropdown.Item onClick={() => { const t = moment().format("YYYY-MM-DD"); setAuditStartDate(t); setAuditEndDate(t); }}>Today</Dropdown.Item>
                      <Dropdown.Item onClick={() => { setAuditStartDate(moment().subtract(7, "days").format("YYYY-MM-DD")); setAuditEndDate(moment().format("YYYY-MM-DD")); }}>Last 7 Days</Dropdown.Item>
                      <Dropdown.Item onClick={() => { setAuditStartDate(moment().subtract(30, "days").format("YYYY-MM-DD")); setAuditEndDate(moment().format("YYYY-MM-DD")); }}>Last 30 Days</Dropdown.Item>
                      <Dropdown.Item onClick={() => { setCustomStartDate(auditStartDate || ""); setCustomEndDate(auditEndDate || ""); setShowAuditDateCustomModal(true); }}>Custom range...</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>

                  {/* User (conditional) */}
                  {(selectedAuditModule.users === "hierarchy" || selectedAuditModule.users === "dropdown" ||
                    selectedAuditService?.users === "hierarchy" || selectedAuditService?.users === "dropdown") && (
                    <Dropdown>
                      <Dropdown.Toggle variant="outline-secondary" size="sm" className="gt-filter-pill">
                        {selectedAuditUser
                          ? auditUserOptions.find((o) => o.value === selectedAuditUser)?.label || selectedAuditUser
                          : "Select User"}
                      </Dropdown.Toggle>
                      <Dropdown.Menu style={{ maxHeight: "280px", overflowY: "auto" }}>
                        <div className="px-2 pb-2" onClick={(e) => e.stopPropagation()}>
                          <Form.Control size="sm" type="text" placeholder="Search..." value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)} autoFocus />
                        </div>
                        <Dropdown.Item onClick={() => { setSelectedAuditUser(""); setUserSearch(""); }}>All users</Dropdown.Item>
                        {auditUserOptions
                          .filter((o) => o.label.toLowerCase().includes(userSearch.toLowerCase()))
                          .map((o) => (
                            <Dropdown.Item key={o.value} onClick={() => { setSelectedAuditUser(o.value); setUserSearch(""); }}>
                              {o.label}
                            </Dropdown.Item>
                          ))}
                      </Dropdown.Menu>
                    </Dropdown>
                  )}
                </div>
              )}
            </div>
          )}

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
              showToolbar={false}
              showToolbarActions={false}
              noBorder={true}
            />
          </div>
        </div>
      </div>

      {showSidebar && selectedRow && (
  <AuditLogSidebar
    isOpen={showSidebar}
    onClose={handleCloseSidebar}
    title="Additional details"
    subtitle={asStringOrEmpty(selectedRow.formatted_timestamp)}
    fields={sidebarFields}
    onSaveComment={() => {}}
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
