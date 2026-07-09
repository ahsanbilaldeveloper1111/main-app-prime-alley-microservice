import type { TableColumn } from "@components/GenericTable";
import { appendSettingsActionsColumn } from "@components/main-settings/settingsEmbeddedTable";
import type { CrmTableRowAction } from "@page-modules/crm/shared/CrmTableRowActions";
import {
  formatBreakTypeDurationWindow,
  formatBreakTypeLabel,
  formatBreakTypePaidLabel,
} from "@page-modules/workforce/company-config/breakTypesDomain";
import type { AttendanceBreakType } from "@utils/staffManagement";
import { Edit, Trash2 } from "lucide-react";
import React from "react";

function breakTypeActiveBadge(isActive: boolean | null | undefined) {
  const active = Boolean(isActive);
  const color = active ? "#10b981" : "#6b7280";
  const label = active ? "Active" : "Inactive";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontWeight: 500,
        color,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: color,
        }}
      />
      {label}
    </span>
  );
}

function buildBreakTypesBaseColumns(): TableColumn<AttendanceBreakType>[] {
  return [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (row) => row.name?.trim() || "—",
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (row) => formatBreakTypeLabel(row.type),
    },
    {
      key: "is_paid",
      label: "Paid/Unpaid",
      sortable: true,
      render: (row) => formatBreakTypePaidLabel(row.is_paid),
    },
    {
      key: "duration_window",
      label: "Duration / window",
      sortable: false,
      render: (row) => formatBreakTypeDurationWindow(row),
    },
    {
      key: "max_per_day",
      label: "Max per day",
      sortable: true,
      render: (row) =>
        row.max_per_day != null && Number.isFinite(row.max_per_day)
          ? String(row.max_per_day)
          : "—",
    },
    {
      key: "is_active",
      label: "Status",
      sortable: true,
      render: (row) => breakTypeActiveBadge(row.is_active),
    },
  ];
}

export type BuildBreakTypesTableColumnsOptions = Readonly<{
  onEdit?: (breakType: AttendanceBreakType) => void;
  onDelete?: (breakType: AttendanceBreakType) => void;
}>;

export function buildBreakTypesTableColumns(
  options?: BuildBreakTypesTableColumnsOptions,
): TableColumn<AttendanceBreakType>[] {
  const baseColumns = buildBreakTypesBaseColumns();
  if (!options?.onEdit && !options?.onDelete) {
    return baseColumns;
  }

  return appendSettingsActionsColumn<AttendanceBreakType>(baseColumns, (row) => {
    if (!Number.isFinite(row.id) || row.id <= 0) {
      return [];
    }
    const label = row.name?.trim() || `Break #${row.id}`;
    const actions: CrmTableRowAction[] = [];
    if (options.onEdit) {
      actions.push({
        label: `Edit ${label}`,
        icon: <Edit size={22} aria-hidden />,
        tone: "primary",
        onClick: () => options.onEdit?.(row),
      });
    }
    if (options.onDelete) {
      actions.push({
        label: `Delete ${label}`,
        icon: <Trash2 size={22} aria-hidden />,
        tone: "danger",
        onClick: () => options.onDelete?.(row),
      });
    }
    return actions;
  });
}
