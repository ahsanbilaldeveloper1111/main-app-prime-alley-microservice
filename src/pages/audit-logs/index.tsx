import React, { useState, useEffect, useCallback, useMemo, ReactElement } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Modal, Form, Button, Dropdown } from "react-bootstrap";
import { useSession } from "next-auth/react";
import moment from "moment";
import GenericTable, { TableColumn, PaginationConfig } from "@components/GenericTable";
import { GetHierarchyData } from "@utils/users";
import { AuditFilterConfig, AuditFilterNode, AuditFilterService } from "@config/auditFilterConfig";
import StatsCards, { StatsCardData } from "@components/GenericStatsCards";
import AuditLogSidebar, { AuditSidebarField } from "@components/AuditLogSidebar";

/* ─────────────────────── page-scoped CSS ─────────────────────── */
const PAGE_CSS = `
.btn svg, .introjs-tooltip .introjs-button svg {
  width: 9px !important;
}
  .al-tabs-row {
    display: flex;
    align-items: stretch;
    width: 100%;
    border: 1px solid #cccccc;
    overflow: visible;
    background: transparent;
    margin-bottom: 0;
  }
  .al-tabs-group {
    display: flex;
    flex: 1 1 0;
    min-width: 0;
  }
  .al-tab-btn {
    flex: 1 1 0;
    min-width: 0;
    padding: 10px 16px;
    font-size: 14px;
    font-weight: 400;
    color: #516f90;
    background: #f5f5f5;
    border: none;
    border-right: 1px solid #cccccc;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left;
    outline: none;
    position: relative;
    transition: background 0.12s, color 0.12s;
    line-height: 1.4;
  }
  .al-tab-btn:last-child {
    border-right: none;
  }
  .al-tab-btn:hover:not(.al-tab-active) {
    background: #ebebeb;
    color: #33475b;
  }
  .al-tab-btn.al-tab-active {
    background: #ffffff;
    color: #33475b;
    font-weight: 400;
    margin-bottom: -1px;
    padding-bottom: 11px;
    z-index: 2;
  }
  .al-tabs-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0 8px;
    background: #f5f5f5;
    border-left: 1px solid #cccccc;
    flex-shrink: 0;
  }
  .al-tabs-icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: 1px solid #c5cdd8;
    border-radius: 3px;
    background: #ffffff;
    color: #516f90;
    cursor: pointer;
    transition: background 0.12s;
    flex-shrink: 0;
  }
  .al-tabs-icon-btn:hover { background: #f0f0f0; }
  .al-tabs-more-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    height: 28px;
    padding: 0 10px;
    border: 1px solid #c5cdd8;
    border-radius: 3px;
    background: #ffffff;
    color: #33475b;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.12s;
    flex-shrink: 0;
  }
  .al-tabs-more-btn:hover { background: #f0f0f0; }
  .al-filter-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    padding: 8px 0 8px 0;
    gap: 0;
    border-bottom: 1px solid #e5e5e5;
    margin-bottom: 0;
  }
  .al-filter-item {
    display: flex;
    align-items: center;
    gap: 3px;
    margin-right: 4px;
  }
  .al-filter-label {
    font-size: 13px;
    color: #516f90;
    font-weight: 400;
    white-space: nowrap;
  }
  .al-filter-val-btn {
    font-size: 13px;
    font-weight: 700;
    color: #33475b;
    background: none;
    border: none;
    padding: 2px 4px;
    border-radius: 3px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 2px;
    white-space: nowrap;
    transition: background 0.12s;
  }
  .al-filter-val-btn:hover { background: #f0f0f0; }
  .al-caret { display: inline-block; vertical-align: middle; margin-left: 1px; }
  .al-filter-dd .dropdown-toggle {
    font-size: 13px !important;
    font-weight: 700 !important;
    color: #33475b !important;
    background: none !important;
    border: none !important;
    box-shadow: none !important;
    padding: 2px 4px !important;
    display: flex !important;
    align-items: center !important;
    gap: 2px !important;
  }
  .al-filter-dd .dropdown-toggle::after { display: none !important; }
  .al-filter-dd .dropdown-toggle:hover,
  .al-filter-dd .dropdown-toggle:focus,
  .al-filter-dd .dropdown-toggle:active,
  .al-filter-dd .show > .dropdown-toggle {
    background: #f0f0f0 !important;
    border-radius: 3px !important;
    color: #33475b !important;
  }
  .al-filter-dd .dropdown-menu {
    font-size: 13px;
    min-width: 180px;
    box-shadow: 0 4px 14px rgba(0,0,0,0.13);
    border: 1px solid #dde2e8;
    border-radius: 4px;
  }
  .al-filter-dd .dropdown-item { color: #33475b; padding: 7px 16px; }
  .al-filter-dd .dropdown-item:hover { background: #f0f8ff; color: #0091ae; }
  .al-export-btn {
    margin-left: auto;
    font-size: 13px;
    color: #33475b;
    background: #fff;
    border: 1px solid #c5cdd8;
    border-radius: 4px;
    padding: 5px 14px;
    cursor: pointer;
    font-weight: 400;
    white-space: nowrap;
    transition: background 0.12s, border-color 0.12s;
  }
  .al-export-btn:hover { background: #f5f5f5; border-color: #99aab5; }
`;

/* ─────────────────────── helpers ─────────────────────── */
function normalizeAuditResponse(result: unknown): unknown[] {
  if (Array.isArray(result)) return result;
  if (result && typeof result === "object" && "data" in result) {
    const d = (result as { data: unknown }).data;
    return Array.isArray(d) ? d : [];
  }
  return [];
}

const DISPLAY_OBJECT_KEYS = [
  "label","name","display_name","title","email","id",
  "extension_number","extension","user_id","value","text",
] as const;

function displayStringFromPlainObject(o: Record<string, unknown>): string {
  for (const k of DISPLAY_OBJECT_KEYS) {
    const v = o[k];
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      const s = String(v); if (s !== "") return s;
    }
  }
  if (typeof o.$date === "string" || typeof o.$date === "number") return scalarToDisplayString(o.$date);
  if (o.user != null && typeof o.user === "object" && !Array.isArray(o.user)) {
    const u = o.user as Record<string, unknown>;
    const inner = scalarToDisplayString(u.display_name ?? u.name ?? u.email);
    if (inner !== "") return inner;
  }
  return "";
}

function scalarToDisplayString(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") return String(value);
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? "" : value.toISOString();
  if (Array.isArray(value)) return value.map(scalarToDisplayString).filter(p => p !== "").join(", ");
  if (typeof value === "object") return displayStringFromPlainObject(value as Record<string, unknown>);
  return "";
}

function momentFormatIfValid(value: moment.MomentInput, pattern: string): string | null {
  const m = moment(value);
  return m.isValid() ? m.format(pattern) : null;
}

function formatAuditTimestampOrDash(value: unknown, pattern: string): string {
  if (value == null || value === "") return "—";
  if (value instanceof Date && !Number.isNaN(value.getTime())) return moment(value).format(pattern);
  if (typeof value === "number" && Number.isFinite(value)) return momentFormatIfValid(value, pattern) ?? "—";
  if (typeof value === "string") return momentFormatIfValid(value, pattern) ?? "—";
  if (typeof value === "object" && !Array.isArray(value)) {
    const o = value as Record<string, unknown>;
    if ("$date" in o) return formatAuditTimestampOrDash(o.$date, pattern);
    if (o.date != null) return formatAuditTimestampOrDash(o.date, pattern);
  }
  return "—";
}

function formatAuditTimestampOrEmpty(value: unknown, pattern: string): string {
  const s = formatAuditTimestampOrDash(value, pattern);
  return s === "—" ? "" : s;
}

function hierarchyExtOptionValue(ext: Record<string, unknown>): string {
  for (const k of ["id","extension_number","extension","user_id"] as const) {
    const s = scalarToDisplayString(ext[k]); if (s !== "") return s;
  }
  return "";
}

function hierarchyExtOptionLabel(ext: Record<string, unknown>): string {
  for (const k of ["display_name","name","extension_number","extension","id"] as const) {
    const s = scalarToDisplayString(ext[k]); if (s !== "") return s;
  }
  return "Unknown";
}

function formatLabel(value: unknown): string {
  const base = scalarToDisplayString(value);
  if (base === "") return "—";
  return base.replaceAll("_"," ").replaceAll(/\b\w/g, c => c.toUpperCase());
}

type UserLike = { display_name?: string; name?: string; email?: string };
type HierarchyResponse = { extensions?: Array<Record<string, unknown>> };
type ChangeItem = { field?: string; type?: string; new?: string; old?: string };

function toUserLike(value: unknown): UserLike | null {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as UserLike;
  return null;
}
function asStringOrEmpty(value: unknown): string { return scalarToDisplayString(value); }
function valueOrDash(value: unknown): string { const s = scalarToDisplayString(value); return s === "" ? "—" : s; }

function formatIfNotNull(value: unknown, formatter: (v: unknown) => string): string {
  return value === null || value === undefined ? "—" : formatter(value);
}

function getCrmUserDisplay(row: Record<string, unknown>): string {
  if (row.user_display != null && row.user_display !== "") {
    return scalarToDisplayString(row.user_display) || "—";
  }
  const u = row.user_extension;
  const uObj = toUserLike(u);
  if (uObj) {
    return uObj.display_name || uObj.name || "—";
  }
  if (u != null && u !== "") {
    return scalarToDisplayString(u) || "—";
  }
  return "—";
}

function getMainAppUserDisplay(row: Record<string, unknown>): string {
  if (row.user_display != null && row.user_display !== "") {
    return scalarToDisplayString(row.user_display) || "—";
  }
  const uExt = row.user_extension;
  const uExtObj = toUserLike(uExt);
  if (uExtObj) {
    return uExtObj.display_name || uExtObj.name || uExtObj.email || "—";
  }
  const u = row.user_id;
  const uObj = toUserLike(u);
  if (uObj) {
    return uObj.display_name || uObj.name || "—";
  }
  if (u != null && u !== "") {
    return scalarToDisplayString(u) || "—";
  }
  if (uExt != null && uExt !== "") {
    return scalarToDisplayString(uExt) || "—";
  }
  return "—";
}

function userDisplayFromRow(row: Record<string, unknown>): string {
  if (row.user_display != null && row.user_display !== "") return scalarToDisplayString(row.user_display) || "—";
  const uExt = row.user_extension;
  const uExtObj = toUserLike(uExt);
  if (uExtObj) return uExtObj.display_name || uExtObj.name || uExtObj.email || "—";
  if (uExt != null && uExt !== "") return scalarToDisplayString(uExt) || "—";
  const uObj = toUserLike(row.user);
  if (uObj) return uObj.display_name || uObj.email || uObj.name || "—";
  if (row.user_id != null && row.user_id !== "") return scalarToDisplayString(row.user_id) || "—";
  return "—";
}

function companyNameFromRow(row: Record<string, unknown>): string {
  const company = row.company;
  if (company && typeof company === "object" && !Array.isArray(company)) {
    const name = (company as { name?: unknown }).name;
    if (name != null && name !== "") return scalarToDisplayString(name) || "—";
  }
  return "—";
}

function getSidebarFieldValue(row: Record<string, unknown>, key: string): string { // NOSONAR
  if (key === "user" || key === "user_id") return userDisplayFromRow(row);
  if (key === "company") return companyNameFromRow(row);
  if (key === "resource_type") return formatLabel(row.record_type ?? row.resource_type);
  if (key === "formatted_timestamp") {
    const v = scalarToDisplayString(row.formatted_timestamp);
    if (v !== "") return v;
    return formatAuditTimestampOrDash(row.created_at, "MMM D, YYYY HH:mm:ss");
  }
  if (key === "formatted_action") {
    const v = scalarToDisplayString(row.formatted_action);
    if (v !== "") return v;
    const formattedAction = formatLabel(row.action);
    if (formattedAction !== "—") return formattedAction;
    if (row.action != null && row.action !== "") return scalarToDisplayString(row.action) || "—";
    return "—";
  }
  if (key === "created_at_formatted") {
    const v = scalarToDisplayString(row.created_at_formatted);
    if (v !== "") return v;
    return formatAuditTimestampOrDash(row.created_at, "YYYY-MM-DD HH:mm:ss");
  }
  if (key === "action_display") return scalarToDisplayString(row.action_display) || formatLabel(row.event) || "—";
  if (key === "entity_type") return formatLabel(row.entity_type) || "—";
  if (key === "changes_summary") {
    const summary = row.changes_summary as ChangeItem[] | undefined;
    if (summary == null || summary.length === 0) return "—";
    const suffix = summary.length === 1 ? "" : "s";
    return `${summary.length} change${suffix}: ${summary.map(c => scalarToDisplayString(c.field)).filter(Boolean).join(", ")}`;
  }
  const v = row[key];
  if (v == null || v === "") return "—";
  return scalarToDisplayString(v) || "—";
}

function getTimestampParamKeys(timestamp: string | [string, string] | undefined): [string, string] {
  if (!timestamp) return ["date_from","date_to"];
  if (Array.isArray(timestamp)) return [timestamp[0], timestamp[1]];
  return [`${timestamp}_from`, `${timestamp}_to`];
}

function deriveChangesFromOldNew(oldValues: Record<string,unknown>|null|undefined, newValues: Record<string,unknown>|null|undefined): ChangeItem[] {
  const old = oldValues && typeof oldValues === "object" ? oldValues : {};
  const newV = newValues && typeof newValues === "object" ? newValues : {};
  const format = (v: unknown): string => v == null || v === "" ? "—" : scalarToDisplayString(v) || "—";
  const allKeys = new Set([...Object.keys(old),...Object.keys(newV)]);
  const items: ChangeItem[] = [];
  allKeys.forEach(key => {
    const oldVal = old[key]; const newVal = newV[key];
    const hasOld = key in old; const hasNew = key in newV;
    if (!hasOld && hasNew) items.push({ field: formatLabel(key), type: "added", old: "—", new: format(newVal) });
    else if (hasOld && !hasNew) items.push({ field: formatLabel(key), type: "removed", old: format(oldVal), new: "—" });
    else if (hasOld && hasNew && oldVal !== newVal) items.push({ field: formatLabel(key), type: "updated", old: format(oldVal), new: format(newVal) });
  });
  return items;
}

function normalizeCrmChanges(changes: unknown): ChangeItem[] {
  if (!changes) return [];
  const format = (v: unknown): string => v == null || v === "" ? "—" : scalarToDisplayString(v) || "—";
  if (Array.isArray(changes)) {
    return changes.map(c => {
      const obj = c as Record<string,unknown>;
      const fv = valueOrDash(obj.field); const fkv = valueOrDash(obj.fieldKey) === "—" ? "—" : formatLabel(obj.fieldKey);
      const field = fv === "—" ? fkv : fv;
      const type = valueOrDash(obj.type) === "—" ? "updated" : scalarToDisplayString(obj.type) || "updated";
      return { field, type, old: valueOrDash(obj.old) === "—" ? "—" : format(obj.old), new: valueOrDash(obj.new) === "—" ? "—" : format(obj.new) };
    });
  }
  if (typeof changes === "object" && changes !== null && !Array.isArray(changes)) {
    const obj = changes as Record<string,{ old?: unknown; new?: unknown }>;
    return Object.entries(obj).map(([key,val]) => ({ field: formatLabel(key), type: "updated", old: formatIfNotNull(val?.old, format), new: formatIfNotNull(val?.new, format) }));
  }
  return [];
}

function changesSummaryColumn(): TableColumn<Record<string, unknown>> {
  return {
    key: "changes_summary", label: "Changes", sortable: false, type: "custom",
    render: (row: Record<string, unknown>) => {
      const summary = row.changes_summary as ChangeItem[] | undefined;
      if (summary == null || summary.length === 0) return "—";
      const suffix = summary.length === 1 ? "" : "s";
      return <span title={summary.map(c => `${scalarToDisplayString(c.field)}: ${scalarToDisplayString(c.type)} ${scalarToDisplayString(c.new) || scalarToDisplayString(c.old) || ""}`).join("\n")}>{summary.length} change{suffix}</span>;
    },
    emptyValue: "—",
  };
}

const AuditLogColumnsByModule: Record<string, TableColumn<Record<string, unknown>>[]> = {
  "Staff management": [
    { key: "formatted_timestamp", label: "Date & Time", sortable: true, type: "text", emptyValue: "—" },
    { key: "formatted_action", label: "Action", sortable: true, type: "text", emptyValue: "—" },
    { key: "resource_type", label: "Resource", sortable: true, type: "text", accessor: (row) => formatLabel(row.resource_type), emptyValue: "—" },
    { key: "user_id", label: "User", sortable: true, type: "text", accessor: (row) => userDisplayFromRow(row), emptyValue: "—" },
    { key: "ip_address", label: "IP Address", sortable: true, type: "text", emptyValue: "—" },
    changesSummaryColumn(),
  ],
  Accounts: [
    { key: "formatted_timestamp", label: "Date & Time", sortable: true, type: "text", emptyValue: "—" },
    { key: "formatted_action", label: "Action", sortable: true, type: "text", emptyValue: "—" },
    { key: "resource_type", label: "Resource", sortable: true, type: "text", accessor: (row) => formatLabel(row.resource_type), emptyValue: "—" },
    { key: "company", label: "Company", sortable: true, type: "text", accessor: (row) => companyNameFromRow(row), emptyValue: "—" },
    { key: "ip_address", label: "IP Address", sortable: true, type: "text", emptyValue: "—" },
    changesSummaryColumn(),
  ],
  Automation: [
    { key: "formatted_timestamp", label: "Date & Time", sortable: true, type: "text", accessor: (row) => scalarToDisplayString(row.formatted_timestamp) || formatAuditTimestampOrEmpty(row.created_at, "MMM D, YYYY HH:mm:ss") || "—", emptyValue: "—" },
    { key: "formatted_action", label: "Action", sortable: true, type: "text", accessor: (row) => scalarToDisplayString(row.formatted_action) || (row.action != null && row.action !== "" ? formatLabel(row.action) : "") || scalarToDisplayString(row.action) || "—", emptyValue: "—" },
    { key: "resource_type", label: "Resource", sortable: true, type: "text", accessor: (row) => formatLabel(row.resource_type), emptyValue: "—" },
    { key: "company", label: "Company", sortable: true, type: "text", accessor: (row) => companyNameFromRow(row), emptyValue: "—" },
    { key: "ip_address", label: "IP Address", sortable: true, type: "text", emptyValue: "—" },
    changesSummaryColumn(),
  ],
  CRM: [
    { key: "created_at_formatted", label: "Date & Time", sortable: true, type: "text", accessor: (row) => scalarToDisplayString(row.created_at_formatted) || formatAuditTimestampOrEmpty(row.created_at, "YYYY-MM-DD HH:mm:ss") || "—", emptyValue: "—" },
    { key: "action_display", label: "Action", sortable: true, type: "text", accessor: (row) => scalarToDisplayString(row.action_display) || formatLabel(row.event) || "—", emptyValue: "—" },
    { key: "entity_type", label: "Entity Type", sortable: true, type: "text", accessor: (row) => formatLabel(row.entity_type) || "—", emptyValue: "—" },
    { key: "entity_name", label: "Entity Name", sortable: true, type: "text", accessor: (row) => scalarToDisplayString(row.entity_name) || "—", emptyValue: "—" },
    { key: "user_extension", label: "User", sortable: true, type: "text", accessor: (row) => getCrmUserDisplay(row), emptyValue: "—" },
    { key: "description", label: "Description", sortable: false, type: "text", emptyValue: "—" },
    changesSummaryColumn(),
  ],
  "Main App": [
    { key: "formatted_timestamp", label: "Date & Time", sortable: true, type: "text", accessor: (row) => scalarToDisplayString(row.formatted_timestamp) || formatAuditTimestampOrEmpty(row.created_at, "MMM D, YYYY HH:mm:ss") || "—", emptyValue: "—" },
    { key: "formatted_action", label: "Action", sortable: true, type: "text", accessor: (row) => scalarToDisplayString(row.formatted_action) || (row.action != null && row.action !== "" ? formatLabel(row.action) : "") || scalarToDisplayString(row.action) || "—", emptyValue: "—" },
    { key: "resource_type", label: "Resource", sortable: true, type: "text", accessor: (row) => formatLabel(row.record_type ?? row.resource_type) || "—", emptyValue: "—" },
    { key: "user_id", label: "User", sortable: true, type: "text", accessor: (row) => getMainAppUserDisplay(row), emptyValue: "—" },
    changesSummaryColumn(),
  ],
};

const defaultAuditLogColumns: TableColumn<Record<string, unknown>>[] = [
  { key: "formatted_timestamp", label: "Date & Time", sortable: true, type: "text", emptyValue: "—" },
  { key: "formatted_action", label: "Action", sortable: true, type: "text", emptyValue: "—" },
  { key: "resource_type", label: "Resource", sortable: true, type: "text", accessor: (row) => formatLabel(row.resource_type), emptyValue: "—" },
  { key: "user_id", label: "User", sortable: true, type: "text", accessor: (row) => userDisplayFromRow(row), emptyValue: "—" },
  { key: "ip_address", label: "IP Address", sortable: true, type: "text", emptyValue: "—" },
  changesSummaryColumn(),
];

function getColumnsForModule(moduleName: string | null): TableColumn<Record<string, unknown>>[] {
  if (!moduleName) return defaultAuditLogColumns;
  return AuditLogColumnsByModule[moduleName] ?? defaultAuditLogColumns;
}

/* ── Icons ── */
const IconUndo = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/>
  </svg>
);
const IconCopy = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
);
const IconGrid = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
);
const CaretDown = () => (
  <svg className="al-caret" width="10" height="6" viewBox="0 0 10 6" fill="none">
    <path d="M1 1l4 4 4-4" stroke="#516f90" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ═══════════════════════════ MAIN PAGE ════════════════════════════════ */
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
    { label: "Date of change", value: scalarToDisplayString(selectedRow.formatted_timestamp) || formatAuditTimestampOrDash(selectedRow.created_at, "MMM D, YYYY HH:mm:ss") },
    { label: "Modified by", value: "", isUser: true, userName: scalarToDisplayString(selectedRowUser?.display_name) || "Unknown", userEmail: scalarToDisplayString(selectedRowUser?.email) || "", sectionBreakAfter: true },
    { label: "Country",    value: valueOrDash(selectedRow.country) },
    { label: "Region",     value: valueOrDash(selectedRow.region) },
    { label: "Login Type", value: valueOrDash(selectedRow.login_type) },
    { label: "User Agent", value: valueOrDash(selectedRow.user_agent) },
    { label: "IP Address", value: valueOrDash(selectedRow.ip_address) },
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

  /* ── Auto-select first module once the permission-filtered list is ready ── */
  useEffect(() => {
    if (visibleAuditModules.length > 0 && !selectedAuditModule) {
      setSelectedAuditModule(visibleAuditModules[0]);
    }
  }, [visibleAuditModules, selectedAuditModule]);

  const handleAuditModuleChange = useCallback((moduleName: string) => {
    if (selectedAuditModule?.moduleName === moduleName) return;
    setAuditLogsData(null); setAuditLogsSummary(null);
    const node = visibleAuditModules.find((n: AuditFilterNode) => n.moduleName === moduleName) ?? null;
    setSelectedAuditModule(node); setSelectedAuditService(null);
    setSelectedAuditAction(""); setAuditStartDate(""); setAuditEndDate(""); setSelectedAuditUser(""); setAuditPage(1);
  }, [visibleAuditModules, selectedAuditModule?.moduleName]);

  const handleAuditServiceChange = useCallback((serviceName: string) => {
    if (selectedAuditService?.serviceName === serviceName) return;
    const svc = visibleAuditServices.find((s: AuditFilterService) => s.serviceName === serviceName) ?? null;
    setSelectedAuditService(svc); setSelectedAuditAction("");
    setAuditStartDate(""); setAuditEndDate(""); setSelectedAuditUser("");
    setAuditLogsData(null); setAuditLogsSummary(null); setAuditPage(1);
  }, [visibleAuditServices, selectedAuditService?.serviceName]);

  const auditLogsStatsCards: StatsCardData[] = useMemo(() => {
    const s = auditLogsSummary;
    if (!s || typeof s !== "object") return [];
    const keys = Object.keys(s).filter(k => typeof s[k] === "number");
    return keys.map(key => ({ title: formatLabel(key), value: Number(s[key]) }));
  }, [auditLogsSummary]);

  useEffect(() => {
    const moduleSlug = selectedAuditModule?.moduleSlug ?? selectedAuditService?.moduleSlug ?? selectedAuditModule?.services?.[0]?.moduleSlug;
    const moduleUsesHierarchy = !!selectedAuditModule?.moduleSlug || selectedAuditModule?.users === "hierarchy" || selectedAuditModule?.users === "dropdown" || selectedAuditService?.users === "hierarchy" || selectedAuditService?.users === "dropdown";
    if (!moduleSlug || !moduleUsesHierarchy) { setAuditUserOptions([]); return; }
    let cancelled = false;
    GetHierarchyData(moduleSlug).then((data: HierarchyResponse) => {
      if (cancelled || !data?.extensions || !Array.isArray(data.extensions)) return;
      setAuditUserOptions(data.extensions.map(ext => ({ value: hierarchyExtOptionValue(ext), label: hierarchyExtOptionLabel(ext) })));
    }).catch(() => { if (!cancelled) setAuditUserOptions([]); });
    return () => { cancelled = true; };
  }, [selectedAuditModule, selectedAuditService?.serviceName, selectedAuditService?.moduleSlug, selectedAuditService?.users, selectedAuditModule?.users]);

  useEffect(() => {
    if (!selectedAuditModule || typeof selectedAuditModule.endpoint !== "function") return;
    const moduleSlug = selectedAuditModule?.moduleSlug ?? selectedAuditService?.moduleSlug ?? selectedAuditModule?.services?.[0]?.moduleSlug;
    const pageKey = selectedAuditModule.pageKey ?? "page";
    const perPageKey = selectedAuditModule.perPageKey ?? "limit";
    const params: Record<string, unknown> = { module_slug: moduleSlug, [pageKey]: auditPage, [perPageKey]: auditLimit };
    if (selectedAuditService) {
      if (selectedAuditService.serviceKey) params[selectedAuditService.serviceKey] = selectedAuditService.serviceValue;
      else params.service = selectedAuditService.serviceName;
    }
    if (selectedAuditUser) { const userKey = selectedAuditService?.userKey ?? selectedAuditModule?.userKey ?? "user_id"; params[userKey] = selectedAuditUser; }
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
    selectedAuditModule.endpoint(params).then((result: unknown) => {
      if (cancelled) return;
      const data = normalizeAuditResponse(result);
      setAuditLogsData(data);
      const res = result as { pagination?: { total?: number }; summary?: Record<string, number>; data?: { summary?: Record<string, number> } };
      if (res?.pagination?.total == null) setAuditTotal(Array.isArray(data) ? data.length : 0);
      else setAuditTotal(res.pagination.total);
      const summaryObj = res?.summary ?? res?.data?.summary;
      if (summaryObj && typeof summaryObj === "object" && !Array.isArray(summaryObj)) {
        const summary: Record<string, number> = {};
        Object.entries(summaryObj).forEach(([k, v]) => { if (typeof v === "number" && !Number.isNaN(v)) summary[k] = v; });
        setAuditLogsSummary(Object.keys(summary).length ? summary : null);
      } else { setAuditLogsSummary(null); }
    }).catch(() => { if (!cancelled) { setAuditLogsData([]); setAuditTotal(0); setAuditLogsSummary(null); } })
    .finally(() => { if (!cancelled) setAuditLogsLoading(false); });
    return () => { cancelled = true; };
  }, [selectedAuditModule, selectedAuditService, selectedAuditAction, auditStartDate, auditEndDate, selectedAuditUser, auditPage, auditLimit]);

  const handlePreviewClick = useCallback((row: Record<string, unknown>) => { setSelectedRow(row); setShowSidebar(true); }, []);
  const handleCloseSidebar = useCallback(() => { setShowSidebar(false); setSelectedRow(null); }, []);

  const dataList = useMemo(() => {
    const raw = auditLogsData ?? [];
    const moduleName = selectedAuditModule?.moduleName ?? "";
    if (moduleName === "Main App") {
      return raw.map(row => {
        const rowObj = row as Record<string, unknown>;
        const derived = deriveChangesFromOldNew(rowObj.old_values as Record<string,unknown>|undefined, rowObj.new_values as Record<string,unknown>|undefined);
        const ext = asStringOrEmpty(rowObj.user_extension);
        const userExtObj = toUserLike(rowObj.user_extension);
        const userDisplay = auditUserOptions.find(o => String(o.value) === ext)?.label ?? (userExtObj ? userExtObj.display_name || userExtObj.name : null);
        const formattedTimestamp = scalarToDisplayString(rowObj.formatted_timestamp) || formatAuditTimestampOrEmpty(rowObj.created_at, "MMM D, YYYY HH:mm:ss") || null;
        const formattedAction = scalarToDisplayString(rowObj.formatted_action) || (rowObj.action != null && rowObj.action !== "" ? formatLabel(rowObj.action) : "") || scalarToDisplayString(rowObj.action) || null;
        return { ...rowObj, resource_type: rowObj.record_type ?? rowObj.resource_type, formatted_timestamp: formattedTimestamp, formatted_action: formattedAction, changes_summary: rowObj.changes_summary ?? derived, ...(userDisplay != null && userDisplay !== "" ? { user_display: userDisplay } : {}) };
      });
    }
    if (moduleName === "Accounts" || moduleName === "Automation") {
      return raw.map(row => {
        const rowObj = row as Record<string, unknown>;
        const existing = rowObj.changes_summary;
        if (existing && Array.isArray(existing) && existing.length > 0) return row;
        const derived = deriveChangesFromOldNew(rowObj.old_values as Record<string,unknown>|undefined, rowObj.new_values as Record<string,unknown>|undefined);
        return { ...rowObj, changes_summary: derived };
      });
    }
    if (moduleName === "CRM") {
      return raw.map(row => {
        const rowObj = row as Record<string, unknown>;
        const ext = asStringOrEmpty(rowObj.user_extension);
        const userExtObj = toUserLike(rowObj.user_extension);
        const userDisplay = auditUserOptions.find(o => String(o.value) === ext)?.label ?? (userExtObj ? userExtObj.display_name || userExtObj.name : null);
        return { ...rowObj, changes_summary: rowObj.changes_summary ?? normalizeCrmChanges(rowObj.changes) ?? [], ...(userDisplay != null && userDisplay !== "" ? { user_display: userDisplay } : {}) };
      });
    }
    return raw;
  }, [auditLogsData, selectedAuditModule?.moduleName, auditUserOptions]);

  const actionOptions = useMemo<string[]>(() => {
    if (selectedAuditService) return ((selectedAuditService.actions ?? []) as unknown[]).filter((a: unknown): a is string => typeof a === "string");
    return Array.from(new Set(visibleAuditServices.flatMap((s: AuditFilterService) => (s.actions ?? []) as unknown[]).filter((a: unknown): a is string => typeof a === "string")));
  }, [selectedAuditService, visibleAuditServices]);

  const dateLabel = useMemo(() => {
    if (!auditStartDate || !auditEndDate) return "Last 30 days";
    if (auditStartDate === auditEndDate) return moment(auditStartDate).format("MMM D, YYYY");
    return `${moment(auditStartDate).format("MMM D")} – ${moment(auditEndDate).format("MMM D, YYYY")}`;
  }, [auditStartDate, auditEndDate]);

  const pagination: PaginationConfig = useMemo(() => ({
    currentPage: auditPage, rowsPerPage: auditLimit, totalRows: auditTotal, pageSizeOptions: [10,15,25,50,100],
  }), [auditPage, auditLimit, auditTotal]);

  const handlePaginationChange = useCallback((page: number, rowsPerPage: number) => {
    setAuditPage(page); setAuditLimit(rowsPerPage);
  }, []);

  const showUserFilter = selectedAuditModule?.users === "hierarchy" || selectedAuditModule?.users === "dropdown" || selectedAuditService?.users === "hierarchy" || selectedAuditService?.users === "dropdown";

  return (
    <>
      <style>{PAGE_CSS}</style>

      <BreadcrumbItem mainTitle="Audit Logs" mainLink="/audit-logs" subTitle="Audit Logs" />

      <div style={{ backgroundColor: "#ffffff", minHeight: "100vh" }}>
        <div style={{ padding: "20px" }}>
          <h1 style={{ fontWeight: 300, color: "#141414", fontSize: "24px", marginBottom: "8px" }}>
            Audit Logs
          </h1>
          <p style={{ fontSize: "14px", fontWeight: 100, color: "#666", marginBottom: "20px" }}>
            View audit logs by module and service
          </p>

          {/* ═══════════════ TAB BAR ═══════════════ */}
          {visibleAuditModules.length > 0 && (
            <div style={{ marginBottom: "12px" }}>

              {/* Tab row: all tabs are dynamic from visibleAuditModules */}
              <div className="al-tabs-row">
                <div className="al-tabs-group">
                  {visibleAuditModules.map((module: AuditFilterNode) => (
                    <button
                      type="button"
                      key={module.moduleName}
                      className={`al-tab-btn${selectedAuditModule?.moduleName === module.moduleName ? " al-tab-active" : ""}`}
                      onClick={() => handleAuditModuleChange(module.moduleName)}
                    >
                      {module.moduleName}
                    </button>
                  ))}
                </div>

                {/* Right-side action icons */}
                <div className="al-tabs-actions">
                  <button type="button" className="al-tabs-icon-btn" title="Undo"><IconUndo /></button>
                  <button type="button" className="al-tabs-icon-btn" title="Duplicate"><IconCopy /></button>
                  <button type="button" className="al-tabs-icon-btn" title="Grid view"><IconGrid /></button>
                  <button type="button" className="al-tabs-more-btn">
                    More <CaretDown />
                  </button>
                </div>
              </div>

              {/* ── Sub-filter row: shown as soon as a module is active (incl. auto-selected first) ── */}
              {/* ── Sub-filter row ── */}
{selectedAuditModule && (
  <div className="al-filter-row">

    {/* Service / Resource — dynamic, only if services exist */}
    {visibleAuditServices.length > 0 && (
      <div className="al-filter-item">
        <span className="al-filter-label">Resource</span>
        <Dropdown className="al-filter-dd">
          <Dropdown.Toggle>
            {selectedAuditService ? selectedAuditService.serviceName : "All"} <CaretDown />
          </Dropdown.Toggle>
          <Dropdown.Menu style={{ maxHeight: "280px", overflowY: "auto" }}>
            <div className="px-2 pb-2">
              <Form.Control size="sm" type="search" placeholder="Search..."
                value={serviceSearch} onChange={e => setServiceSearch(e.target.value)}
                onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()} autoFocus />
            </div>
            <Dropdown.Item onClick={() => { setSelectedAuditService(null); setServiceSearch(""); }}>All</Dropdown.Item>
            {visibleAuditServices
              .filter((s: AuditFilterService) => s.serviceName.toLowerCase().includes(serviceSearch.toLowerCase()))
              .map((s: AuditFilterService) => (
                <Dropdown.Item key={s.serviceName} onClick={() => { handleAuditServiceChange(s.serviceName); setServiceSearch(""); }}>
                  {s.serviceName}
                </Dropdown.Item>
              ))}
          </Dropdown.Menu>
        </Dropdown>
      </div>
    )}

    {/* Action — dynamic, only if actions exist */}
    {actionOptions.length > 0 && (
      <div className="al-filter-item">
        <span className="al-filter-label">Action</span>
        <Dropdown className="al-filter-dd">
          <Dropdown.Toggle>
            {selectedAuditAction || "All"} <CaretDown />
          </Dropdown.Toggle>
          <Dropdown.Menu style={{ maxHeight: "280px", overflowY: "auto" }}>
            <div className="px-2 pb-2">
              <Form.Control size="sm" type="search" placeholder="Search..."
                value={actionSearch} onChange={e => setActionSearch(e.target.value)}
                onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()} autoFocus />
            </div>
            <Dropdown.Item onClick={() => { setSelectedAuditAction(""); setActionSearch(""); }}>All</Dropdown.Item>
            {actionOptions
              .filter(a => a.toLowerCase().includes(actionSearch.toLowerCase()))
              .map(a => (
                <Dropdown.Item key={a} onClick={() => { setSelectedAuditAction(a); setActionSearch(""); }}>{a}</Dropdown.Item>
              ))}
          </Dropdown.Menu>
        </Dropdown>
      </div>
    )}

    {/* User — dynamic, only if module/service uses hierarchy or dropdown */}
    {showUserFilter && (
      <div className="al-filter-item">
        <span className="al-filter-label">User</span>
        <Dropdown className="al-filter-dd">
          <Dropdown.Toggle>
            {selectedAuditUser
              ? auditUserOptions.find(o => o.value === selectedAuditUser)?.label || selectedAuditUser
              : "Anyone"} <CaretDown />
          </Dropdown.Toggle>
          <Dropdown.Menu style={{ maxHeight: "280px", overflowY: "auto" }}>
            <div className="px-2 pb-2">
              <Form.Control size="sm" type="search" placeholder="Search..."
                value={userSearch} onChange={e => setUserSearch(e.target.value)}
                onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()} autoFocus />
            </div>
            <Dropdown.Item onClick={() => { setSelectedAuditUser(""); setUserSearch(""); }}>Anyone</Dropdown.Item>
            {auditUserOptions
              .filter(o => o.label.toLowerCase().includes(userSearch.toLowerCase()))
              .map(o => (
                <Dropdown.Item key={o.value} onClick={() => { setSelectedAuditUser(o.value); setUserSearch(""); }}>{o.label}</Dropdown.Item>
              ))}
          </Dropdown.Menu>
        </Dropdown>
      </div>
    )}

    {/* Date — always shown when a module is active */}
    <div className="al-filter-item">
      <span className="al-filter-label">Date</span>
      <Dropdown className="al-filter-dd">
        <Dropdown.Toggle>
          {dateLabel} <CaretDown />
        </Dropdown.Toggle>
        <Dropdown.Menu>
          <Dropdown.Item onClick={() => { setAuditStartDate(""); setAuditEndDate(""); }}>All Time</Dropdown.Item>
          <Dropdown.Item onClick={() => { const t = moment().format("YYYY-MM-DD"); setAuditStartDate(t); setAuditEndDate(t); }}>Today</Dropdown.Item>
          <Dropdown.Item onClick={() => { setAuditStartDate(moment().subtract(7,"days").format("YYYY-MM-DD")); setAuditEndDate(moment().format("YYYY-MM-DD")); }}>Last 7 Days</Dropdown.Item>
          <Dropdown.Item onClick={() => { setAuditStartDate(moment().subtract(30,"days").format("YYYY-MM-DD")); setAuditEndDate(moment().format("YYYY-MM-DD")); }}>Last 30 Days</Dropdown.Item>
          <Dropdown.Item onClick={() => { setCustomStartDate(auditStartDate || ""); setCustomEndDate(auditEndDate || ""); setShowAuditDateCustomModal(true); }}>Custom range...</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </div>

    {/* Export — pushed to the right */}
    <button type="button" className="al-export-btn">Export report</button>
  </div>
)}
            </div>
          )}

          {/* Stats cards */}
          {auditLogsStatsCards.length > 0 && (
            <StatsCards data={auditLogsStatsCards} gridMinWidth="160px" valueFontSize="28px" />
          )}

          {/* Table */}
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
        <Modal.Header closeButton><Modal.Title>Custom date range</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Start date</Form.Label>
            <Form.Control type="date" value={customStartDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomStartDate(e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-0">
            <Form.Label>End date</Form.Label>
            <Form.Control type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowAuditDateCustomModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => { setAuditStartDate(customStartDate); setAuditEndDate(customEndDate); setShowAuditDateCustomModal(false); }}>Apply</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

AuditLogsNewPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;
export default AuditLogsNewPage;