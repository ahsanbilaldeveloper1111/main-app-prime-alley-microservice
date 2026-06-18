import type { TableColumn } from "@components/GenericTable";
import { appendSettingsActionsColumn } from "@components/main-settings/settingsEmbeddedTable";
import type { CrmTableRowAction } from "@page-modules/crm/shared/CrmTableRowActions";
import {
  formatShiftDateValue,
  formatShiftHardLimitHours,
  formatShiftLabel,
  formatShiftTimeValue,
  formatShiftWorkingDays,
  readStaffShiftTime,
  resolveStaffShiftTenantId,
  resolveVisibleStaffShiftTableColumns,
  type ShiftTenantOption,
  type StaffShiftTableColumnKey,
} from "@page-modules/workforce/shifts/shiftManagementDomain";
import type { StaffShift } from "@utils/staffManagement";
import { Edit, Trash2 } from "lucide-react";

function shiftStatusBadge(status: string | null | undefined) {
  const label = formatShiftLabel(status);
  const normalized = (status ?? "").trim().toLowerCase();
  let color = "#6b7280";
  if (normalized === "active") color = "#10b981";
  if (normalized === "inactive") color = "#ef4444";
  if (normalized === "draft") color = "#f59e0b";

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

function resolveTenantLabel(
  shift: StaffShift,
  tenantOptions: readonly ShiftTenantOption[],
): string {
  const tenantId = resolveStaffShiftTenantId(shift, "");
  if (!tenantId) return "—";
  return tenantOptions.find((option) => option.value === tenantId)?.label ?? tenantId;
}

function buildShiftTableColumn(
  key: StaffShiftTableColumnKey,
  tenantOptions: readonly ShiftTenantOption[],
): TableColumn<StaffShift> {
  switch (key) {
    case "name":
      return {
        key,
        label: "Shift name",
        sortable: true,
        render: (row) => row.name?.trim() || "—",
      };
    case "type":
      return {
        key,
        label: "Type",
        sortable: true,
        render: (row) => formatShiftLabel(row.type),
      };
    case "status":
      return {
        key,
        label: "Status",
        sortable: true,
        render: (row) => shiftStatusBadge(row.status),
      };
    case "start_time":
      return {
        key,
        label: "Start",
        sortable: true,
        render: (row) => formatShiftTimeValue(readStaffShiftTime(row, "start_time")),
      };
    case "end_time":
      return {
        key,
        label: "End",
        sortable: true,
        render: (row) => formatShiftTimeValue(readStaffShiftTime(row, "end_time")),
      };
    case "working_days":
      return {
        key,
        label: "Working days",
        sortable: false,
        render: (row) => formatShiftWorkingDays(row.working_days),
      };
    case "earliest_checkin":
      return {
        key,
        label: "Earliest check-in",
        sortable: true,
        render: (row) => formatShiftTimeValue(row.earliest_checkin),
      };
    case "grace_period_minutes":
      return {
        key,
        label: "Grace (min)",
        sortable: true,
        render: (row) =>
          row.grace_period_minutes == null ? "—" : String(row.grace_period_minutes),
      };
    case "hard_limit_hours":
      return {
        key,
        label: "Hard limit",
        sortable: true,
        render: (row) => formatShiftHardLimitHours(row.hard_limit_hours),
      };
    case "effective_from":
      return {
        key,
        label: "Effective from",
        sortable: true,
        render: (row) => formatShiftDateValue(row.effective_from),
      };
    case "tenant_id":
      return {
        key,
        label: "Tenant",
        sortable: true,
        render: (row) => resolveTenantLabel(row, tenantOptions),
      };
    default:
      return {
        key,
        label: key,
        sortable: false,
        render: () => "—",
      };
  }
}

export type BuildStaffShiftsTableColumnsOptions = Readonly<{
  rows?: readonly StaffShift[];
  isWorkforceAdmin?: boolean;
  tenantOptions?: readonly ShiftTenantOption[];
  onEdit?: (shift: StaffShift) => void;
  onDelete?: (shift: StaffShift) => void;
}>;

export function buildStaffShiftsTableColumns(
  options?: BuildStaffShiftsTableColumnsOptions,
): TableColumn<StaffShift>[] {
  const rows = options?.rows ?? [];
  const tenantOptions = options?.tenantOptions ?? [];
  const visibleColumnKeys = resolveVisibleStaffShiftTableColumns(rows, {
    includeTenant: options?.isWorkforceAdmin,
  });

  const baseColumns = visibleColumnKeys.map((key) =>
    buildShiftTableColumn(key, tenantOptions),
  );

  if (!options?.onEdit && !options?.onDelete) {
    return baseColumns;
  }

  return appendSettingsActionsColumn<StaffShift>(baseColumns, (row): CrmTableRowAction[] => {
    const shiftLabel = row.name?.trim() || "shift";
    return [
      ...(options.onEdit
        ? [
            {
              label: `Edit ${shiftLabel}`,
              icon: <Edit size={22} aria-hidden />,
              tone: "primary" as const,
              onClick: () => options.onEdit?.(row),
            },
          ]
        : []),
      ...(options.onDelete
        ? [
            {
              label: `Delete ${shiftLabel}`,
              icon: <Trash2 size={22} aria-hidden />,
              tone: "danger" as const,
              onClick: () => options.onDelete?.(row),
            },
          ]
        : []),
    ];
  });
}
