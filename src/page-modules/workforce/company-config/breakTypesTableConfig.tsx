import type { TableColumn } from "@components/GenericTable";
import {
  formatBreakTypeBoolean,
  formatBreakTypeDuration,
  formatBreakTypeLabel,
} from "@page-modules/workforce/company-config/breakTypesDomain";
import type { AttendanceBreakType } from "@utils/staffManagement";
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

export function buildBreakTypesTableColumns(): TableColumn<AttendanceBreakType>[] {
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
      key: "duration_minutes",
      label: "Duration",
      sortable: true,
      render: (row) => formatBreakTypeDuration(row.duration_minutes),
    },
    {
      key: "is_paid",
      label: "Paid",
      sortable: true,
      render: (row) => formatBreakTypeBoolean(row.is_paid),
    },
    {
      key: "is_active",
      label: "Status",
      sortable: true,
      render: (row) => breakTypeActiveBadge(row.is_active),
    },
  ];
}
