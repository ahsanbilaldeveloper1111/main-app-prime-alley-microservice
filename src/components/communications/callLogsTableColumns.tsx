import React from "react";
import type { TableColumn } from "@components/GenericTable";
import {
  convertUTCSeparateDateTimeToUserDate,
  convertUTCSeparateDateTimeToUserTime,
  formatDuration,
  GlobalDateFormat,
  GlobalTimeFormat,
} from "@utils/Helper";
import { getCallLogRowSortValue } from "./callLogSortUtils";
import type { CallLogRow } from "./callLogTypes";

function callLogSortAccessor(columnKey: string) {
  return (row: CallLogRow) => getCallLogRowSortValue(row, columnKey);
}

export function getCallLogsTableColumns(): TableColumn<CallLogRow>[] {
  return [
    {
      key: "Date",
      label: "Date",
      sortable: true,
      type: "number",
      sortAccessor: callLogSortAccessor("Date"),
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
      type: "number",
      sortAccessor: callLogSortAccessor("Time"),
      render: (row) =>
        convertUTCSeparateDateTimeToUserTime(
          row.Date ?? "",
          row.Time ?? "",
          GlobalTimeFormat,
        ),
    },
    {
      key: "username",
      label: "Username",
      sortable: true,
      sortAccessor: callLogSortAccessor("username"),
    },
    {
      key: "department_name",
      label: "Department",
      sortable: true,
      sortAccessor: callLogSortAccessor("department_name"),
    },
    {
      key: "call_type",
      label: "Call Type",
      sortable: true,
      sortAccessor: callLogSortAccessor("call_type"),
    },
    {
      key: "is_answered",
      label: "Call Result",
      sortable: true,
      type: "number",
      sortAccessor: callLogSortAccessor("is_answered"),
      render: (row) =>
        row.is_answered === "Yes" ? (
          <span className="status-badge primary">Answered</span>
        ) : (
          <span className="status-badge info">Not Answered</span>
        ),
    },
    {
      key: "duration",
      label: "Duration",
      sortable: true,
      type: "number",
      sortAccessor: callLogSortAccessor("duration"),
      render: (row) =>
        formatDuration(Number.parseInt(String(row.duration), 10) || 0),
    },
    {
      key: "extension",
      label: "Extension",
      sortable: true,
      sortAccessor: callLogSortAccessor("extension"),
    },
    {
      key: "phone_number",
      label: "Phone Number",
      sortable: true,
      sortAccessor: callLogSortAccessor("phone_number"),
    },
  ];
}
