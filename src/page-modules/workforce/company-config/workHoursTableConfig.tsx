import type { TableColumn } from "@components/GenericTable";
import { appendSettingsActionsColumn } from "@components/main-settings/settingsEmbeddedTable";
import type { CrmTableRowAction } from "@page-modules/crm/shared/CrmTableRowActions";
import {
  formatWorkHoursEffectiveFrom,
  formatWorkHoursEffectiveTo,
  formatWorkHoursPolicyHours,
  formatWorkHoursPolicyLabel,
  formatWorkHoursPolicyUpdatedAt,
} from "@page-modules/workforce/company-config/companyConfigDomain";
import type { AttendanceWorkHoursPolicy } from "@utils/staffManagement";
import { Edit, Trash2 } from "lucide-react";

function buildWorkHoursPolicyBaseColumns(): TableColumn<AttendanceWorkHoursPolicy>[] {
  return [
    {
      key: "min_hours_per_day",
      label: "Min hours/day",
      sortable: true,
      render: (row) => formatWorkHoursPolicyHours(row, "min_hours_per_day"),
    },
    {
      key: "max_hours_per_day",
      label: "Max hours/day",
      sortable: true,
      render: (row) => formatWorkHoursPolicyHours(row, "max_hours_per_day"),
    },
    {
      key: "effective_from",
      label: "Effective from",
      sortable: true,
      render: (row) =>
        formatWorkHoursEffectiveFrom(row.effective_from, row as Record<string, unknown>),
    },
    {
      key: "effective_to",
      label: "Effective to",
      sortable: true,
      render: (row) =>
        formatWorkHoursEffectiveTo(row.effective_to, row as Record<string, unknown>),
    },
    {
      key: "updated_at",
      label: "Last updated",
      sortable: true,
      render: (row) => formatWorkHoursPolicyUpdatedAt(row.updated_at) ?? "—",
    },
  ];
}

export type BuildWorkHoursPoliciesTableColumnsOptions = Readonly<{
  onEdit?: (policy: AttendanceWorkHoursPolicy) => void;
  onDelete?: (policy: AttendanceWorkHoursPolicy) => void;
}>;

export function buildWorkHoursPoliciesTableColumns(
  options?: BuildWorkHoursPoliciesTableColumnsOptions,
): TableColumn<AttendanceWorkHoursPolicy>[] {
  const baseColumns = buildWorkHoursPolicyBaseColumns();

  if (!options?.onEdit && !options?.onDelete) {
    return baseColumns;
  }

  return appendSettingsActionsColumn<AttendanceWorkHoursPolicy>(baseColumns, (row) => {
    if (row.id == null || !Number.isFinite(row.id)) {
      return [];
    }

    const policyLabel = formatWorkHoursPolicyLabel(row);
    const actions: CrmTableRowAction[] = [];

    if (options.onEdit) {
      actions.push({
        label: `Edit ${policyLabel}`,
        icon: <Edit size={22} aria-hidden />,
        tone: "primary",
        onClick: () => options.onEdit?.(row),
      });
    }

    if (options.onDelete) {
      actions.push({
        label: `Delete ${policyLabel}`,
        icon: <Trash2 size={22} aria-hidden />,
        tone: "danger",
        onClick: () => options.onDelete?.(row),
      });
    }

    return actions;
  });
}
