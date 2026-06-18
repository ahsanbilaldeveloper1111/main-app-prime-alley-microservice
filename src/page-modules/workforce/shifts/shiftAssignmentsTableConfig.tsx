import type { TableColumn } from "@components/GenericTable";
import { appendSettingsActionsColumn } from "@components/main-settings/settingsEmbeddedTable";
import type { CrmTableRowAction } from "@page-modules/crm/shared/CrmTableRowActions";
import {
  formatShiftAssignmentDate,
  formatShiftAssignmentLabel,
  formatShiftAssignmentRowLabel,
  resolveShiftAssignmentShiftLabel,
  resolveShiftAssignmentUserLabel,
} from "@page-modules/workforce/shifts/shiftAssignmentsDomain";
import type { StaffShift, StaffShiftAssignment } from "@utils/staffManagement";
import { Edit, Trash2 } from "lucide-react";

export type ShiftAssignmentsTableContext = Readonly<{
  shiftsById: ReadonlyMap<number, StaffShift>;
  userLabelById: ReadonlyMap<string, string>;
  onEdit?: (assignment: StaffShiftAssignment) => void;
  onDelete?: (assignment: StaffShiftAssignment) => void;
}>;

function buildShiftAssignmentsBaseColumns(
  context: ShiftAssignmentsTableContext,
): TableColumn<StaffShiftAssignment>[] {
  return [
    {
      key: "shift_id",
      label: "Shift",
      sortable: true,
      render: (row) => resolveShiftAssignmentShiftLabel(row, context.shiftsById),
    },
    {
      key: "user_id",
      label: "User",
      sortable: true,
      render: (row) => resolveShiftAssignmentUserLabel(row, context.userLabelById),
    },
    {
      key: "effective_from",
      label: "Effective from",
      sortable: true,
      render: (row) => formatShiftAssignmentDate(row.effective_from),
    },
    {
      key: "effective_to",
      label: "Effective to",
      sortable: true,
      render: (row) => formatShiftAssignmentDate(row.effective_to),
    },
    {
      key: "reason",
      label: "Reason",
      sortable: true,
      render: (row) => formatShiftAssignmentLabel(row.reason),
    },
    {
      key: "updated_at",
      label: "Last updated",
      sortable: true,
      render: (row) => formatShiftAssignmentDate(row.updated_at),
    },
  ];
}

export function buildShiftAssignmentsTableColumns(
  context: ShiftAssignmentsTableContext,
): TableColumn<StaffShiftAssignment>[] {
  const baseColumns = buildShiftAssignmentsBaseColumns(context);

  if (!context.onEdit && !context.onDelete) {
    return baseColumns;
  }

  return appendSettingsActionsColumn<StaffShiftAssignment>(baseColumns, (row) => {
    if (row.id == null || !Number.isFinite(row.id)) {
      return [];
    }

    const rowLabel = formatShiftAssignmentRowLabel(
      row,
      context.shiftsById,
      context.userLabelById,
    );
    const actions: CrmTableRowAction[] = [];

    if (context.onEdit) {
      actions.push({
        label: `Edit ${rowLabel}`,
        icon: <Edit size={22} aria-hidden />,
        tone: "primary",
        onClick: () => context.onEdit?.(row),
      });
    }

    if (context.onDelete) {
      actions.push({
        label: `Delete ${rowLabel}`,
        icon: <Trash2 size={22} aria-hidden />,
        tone: "danger",
        onClick: () => context.onDelete?.(row),
      });
    }

    return actions;
  });
}
