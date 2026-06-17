import type { TableColumn } from "@components/GenericTable";
import {
  formatBreaksEffectiveFrom,
  formatBreaksEffectiveTo,
  formatBreaksPolicyMinutes,
  formatBreaksPolicyNumber,
  formatBreaksPolicyUpdatedAt,
} from "@page-modules/workforce/company-config/breaksDomain";
import type { AttendanceBreakPolicy } from "@utils/staffManagement";

export function buildBreaksPoliciesTableColumns(): TableColumn<AttendanceBreakPolicy>[] {
  return [
    {
      key: "max_breaks_per_day",
      label: "Max breaks/day",
      sortable: true,
      render: (row) => formatBreaksPolicyNumber(row, "max_breaks_per_day"),
    },
    {
      key: "min_gap_minutes",
      label: "Min gap",
      sortable: true,
      render: (row) =>
        formatBreaksPolicyMinutes(
          row.min_gap_minutes ??
            (typeof row.minGapMinutes === "number" ? row.minGapMinutes : null),
        ),
    },
    {
      key: "effective_from",
      label: "Effective from",
      sortable: true,
      render: (row) =>
        formatBreaksEffectiveFrom(row.effective_from, row as Record<string, unknown>),
    },
    {
      key: "effective_to",
      label: "Effective to",
      sortable: true,
      render: (row) =>
        formatBreaksEffectiveTo(row.effective_to, row as Record<string, unknown>),
    },
    {
      key: "updated_at",
      label: "Last updated",
      sortable: true,
      render: (row) => formatBreaksPolicyUpdatedAt(row.updated_at) ?? "—",
    },
  ];
}
