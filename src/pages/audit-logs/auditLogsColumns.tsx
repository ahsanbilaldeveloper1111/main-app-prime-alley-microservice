import React from "react";
import type { TableColumn } from "@components/GenericTable";
import {
  companyNameFromRow,
  formatAuditTimestampOrEmpty,
  formatLabel,
  getCrmUserDisplay,
  getMainAppUserDisplay,
  scalarToDisplayString,
  userDisplayFromRow,
  type ChangeItem,
} from "./auditLogsDomain";

export function changesSummaryColumn(): TableColumn<Record<string, unknown>> {
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
        <span
          title={summary
            .map(
              (c) =>
                `${scalarToDisplayString(c.field)}: ${scalarToDisplayString(c.type)} ${scalarToDisplayString(c.new) || scalarToDisplayString(c.old) || ""}`,
            )
            .join("\n")}
        >
          {summary.length} change{suffix}
        </span>
      );
    },
    emptyValue: "—",
  };
}

const AuditLogColumnsByModule: Record<string, TableColumn<Record<string, unknown>>[]> = {
  "Staff management": [
    { key: "formatted_timestamp", label: "Date & Time", sortable: true, type: "text", emptyValue: "—" },
    { key: "formatted_action", label: "Action", sortable: true, type: "text", emptyValue: "—" },
    {
      key: "resource_type",
      label: "Resource",
      sortable: true,
      type: "text",
      accessor: (row) => formatLabel(row.resource_type),
      emptyValue: "—",
    },
    { key: "user_id", label: "User", sortable: true, type: "text", accessor: (row) => userDisplayFromRow(row), emptyValue: "—" },
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
      accessor: (row) => formatLabel(row.resource_type),
      emptyValue: "—",
    },
    { key: "company", label: "Company", sortable: true, type: "text", accessor: (row) => companyNameFromRow(row), emptyValue: "—" },
    { key: "ip_address", label: "IP Address", sortable: true, type: "text", emptyValue: "—" },
    changesSummaryColumn(),
  ],
  Automation: [
    {
      key: "formatted_timestamp",
      label: "Date & Time",
      sortable: true,
      type: "text",
      accessor: (row) =>
        scalarToDisplayString(row.formatted_timestamp) ||
        formatAuditTimestampOrEmpty(row.created_at, "MMM D, YYYY HH:mm:ss") ||
        "—",
      emptyValue: "—",
    },
    {
      key: "formatted_action",
      label: "Action",
      sortable: true,
      type: "text",
      accessor: (row) =>
        scalarToDisplayString(row.formatted_action) ||
        (row.action != null && row.action !== "" ? formatLabel(row.action) : "") ||
        scalarToDisplayString(row.action) ||
        "—",
      emptyValue: "—",
    },
    {
      key: "resource_type",
      label: "Resource",
      sortable: true,
      type: "text",
      accessor: (row) => formatLabel(row.resource_type),
      emptyValue: "—",
    },
    { key: "company", label: "Company", sortable: true, type: "text", accessor: (row) => companyNameFromRow(row), emptyValue: "—" },
    { key: "ip_address", label: "IP Address", sortable: true, type: "text", emptyValue: "—" },
    changesSummaryColumn(),
  ],
  CRM: [
    {
      key: "created_at_formatted",
      label: "Date & Time",
      sortable: true,
      type: "text",
      accessor: (row) =>
        scalarToDisplayString(row.created_at_formatted) ||
        formatAuditTimestampOrEmpty(row.created_at, "YYYY-MM-DD HH:mm:ss") ||
        "—",
      emptyValue: "—",
    },
    {
      key: "action_display",
      label: "Action",
      sortable: true,
      type: "text",
      accessor: (row) => scalarToDisplayString(row.action_display) || formatLabel(row.event) || "—",
      emptyValue: "—",
    },
    {
      key: "entity_type",
      label: "Entity Type",
      sortable: true,
      type: "text",
      accessor: (row) => formatLabel(row.entity_type) || "—",
      emptyValue: "—",
    },
    {
      key: "entity_name",
      label: "Entity Name",
      sortable: true,
      type: "text",
      accessor: (row) => scalarToDisplayString(row.entity_name) || "—",
      emptyValue: "—",
    },
    {
      key: "user_extension",
      label: "User",
      sortable: true,
      type: "text",
      accessor: (row) => getCrmUserDisplay(row),
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
      accessor: (row) =>
        scalarToDisplayString(row.formatted_timestamp) ||
        formatAuditTimestampOrEmpty(row.created_at, "MMM D, YYYY HH:mm:ss") ||
        "—",
      emptyValue: "—",
    },
    {
      key: "formatted_action",
      label: "Action",
      sortable: true,
      type: "text",
      accessor: (row) =>
        scalarToDisplayString(row.formatted_action) ||
        (row.action != null && row.action !== "" ? formatLabel(row.action) : "") ||
        scalarToDisplayString(row.action) ||
        "—",
      emptyValue: "—",
    },
    {
      key: "resource_type",
      label: "Resource",
      sortable: true,
      type: "text",
      accessor: (row) => formatLabel(row.record_type ?? row.resource_type) || "—",
      emptyValue: "—",
    },
    { key: "user_id", label: "User", sortable: true, type: "text", accessor: (row) => getMainAppUserDisplay(row), emptyValue: "—" },
    changesSummaryColumn(),
  ],
};

const defaultAuditLogColumns: TableColumn<Record<string, unknown>>[] = [
  { key: "formatted_timestamp", label: "Date & Time", sortable: true, type: "text", emptyValue: "—" },
  { key: "formatted_action", label: "Action", sortable: true, type: "text", emptyValue: "—" },
  {
    key: "resource_type",
    label: "Resource",
    sortable: true,
    type: "text",
    accessor: (row) => formatLabel(row.resource_type),
    emptyValue: "—",
  },
  { key: "user_id", label: "User", sortable: true, type: "text", accessor: (row) => userDisplayFromRow(row), emptyValue: "—" },
  { key: "ip_address", label: "IP Address", sortable: true, type: "text", emptyValue: "—" },
  changesSummaryColumn(),
];

export function getColumnsForModule(moduleName: string | null): TableColumn<Record<string, unknown>>[] {
  if (!moduleName) return defaultAuditLogColumns;
  return AuditLogColumnsByModule[moduleName] ?? defaultAuditLogColumns;
}
