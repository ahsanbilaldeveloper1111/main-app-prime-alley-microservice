import React from "react";
import type { TableColumn } from "@components/GenericTable";
import {
  convertUTCSeparateDateTimeToUserDate,
  convertUTCSeparateDateTimeToUserTime,
  formatDuration,
  GlobalDateFormat,
  GlobalTimeFormat,
} from "@utils/Helper";
import type { CallLogRow } from "./callLogTypes";

export function getCallLogsTableColumns(): TableColumn<CallLogRow>[] {
  return [
    {
      key: "Date",
      label: "Date",
      sortable: true,
      render: (row) =>
        convertUTCSeparateDateTimeToUserDate(
          row.Date ?? "",
          row.Time ?? "",
          GlobalDateFormat,
        ),
    },
    {
      key: "Time",
      label: "Time",
      sortable: true,
      render: (row) =>
        convertUTCSeparateDateTimeToUserTime(
          row.Date ?? "",
          row.Time ?? "",
          GlobalTimeFormat,
        ),
    },
    { key: "username", label: "Username", sortable: true },
    { key: "department_name", label: "Department", sortable: true },
    { key: "call_type", label: "Call Type", sortable: true },
    {
      key: "is_answered",
      label: "Call Result",
      sortable: true,
      render: (row) =>
        row.is_answered === "Yes" ? (
          <span className="status-badge success">Answered</span>
        ) : (
          <span className="status-badge danger">Not Answered</span>
        ),
    },
    {
      key: "duration",
      label: "Duration",
      sortable: true,
      render: (row) =>
        formatDuration(Number.parseInt(String(row.duration), 10) || 0),
    },
    { key: "extension", label: "Extension", sortable: true },
    { key: "phone_number", label: "Phone Number", sortable: true },
  ];
}
