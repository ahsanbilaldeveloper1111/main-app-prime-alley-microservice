import type { TableColumn } from "@components/GenericTable";
import {
  formatOvertimeEffectiveFrom,
  formatOvertimeEffectiveTo,
  formatOvertimePolicyHours,
  formatOvertimePolicyMinutes,
  formatOvertimePolicyUpdatedAt,
} from "@page-modules/workforce/company-config/overtimeDomain";
import type { AttendanceOvertimePolicy } from "@utils/staffManagement";
import React from "react";

function overtimeEnabledBadge(enabled: boolean | null | undefined) {
  const isEnabled = Boolean(enabled);
  const color = isEnabled ? "#10b981" : "#6b7280";
  const label = isEnabled ? "Enabled" : "Disabled";

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

export function buildOvertimePoliciesTableColumns(): TableColumn<AttendanceOvertimePolicy>[] {
  return [
    {
      key: "buffer_minutes",
      label: "Buffer",
      sortable: true,
      render: (row) =>
        formatOvertimePolicyMinutes(
          row.buffer_minutes ??
            (typeof row.bufferMinutes === "number" ? row.bufferMinutes : null),
        ),
    },
    {
      key: "weekly_cap_hours",
      label: "Weekly cap",
      sortable: true,
      render: (row) =>
        formatOvertimePolicyHours(
          row.weekly_cap_hours ??
            (typeof row.weeklyCapHours === "number" ? row.weeklyCapHours : null),
        ),
    },
    {
      key: "enabled",
      label: "Status",
      sortable: true,
      render: (row) => overtimeEnabledBadge(row.enabled),
    },
    {
      key: "effective_from",
      label: "Effective from",
      sortable: true,
      render: (row) =>
        formatOvertimeEffectiveFrom(row.effective_from, row as Record<string, unknown>),
    },
    {
      key: "effective_to",
      label: "Effective to",
      sortable: true,
      render: (row) =>
        formatOvertimeEffectiveTo(row.effective_to, row as Record<string, unknown>),
    },
    {
      key: "updated_at",
      label: "Last updated",
      sortable: true,
      render: (row) => formatOvertimePolicyUpdatedAt(row.updated_at) ?? "—",
    },
  ];
}
