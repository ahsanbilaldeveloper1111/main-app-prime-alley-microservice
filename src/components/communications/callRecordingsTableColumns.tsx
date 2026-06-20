import React from "react";
import type { TableColumn } from "@components/GenericTable";
import {
  convertDateTimeWithOffsetToLocal,
  formatDuration,
  GlobalDateFormat,
  GlobalTimeFormat,
} from "@utils/Helper";
import { getCallRecordingRowSortValue } from "./callRecordingSortUtils";
import type { CallRecordingRow } from "./callRecordingTypes";

function callRecordingSortAccessor(columnKey: string) {
  return (row: CallRecordingRow) =>
    getCallRecordingRowSortValue(row, columnKey);
}

export function getCallRecordingsTableColumns(): TableColumn<CallRecordingRow>[] {
  return [
    {
      key: "DateTime",
      label: "Date",
      sortable: true,
      type: "number",
      sortAccessor: callRecordingSortAccessor("DateTime"),
      render: (row) => (
        <div>
          {convertDateTimeWithOffsetToLocal(
            String(row.DateTime ?? ""),
            undefined,
            GlobalDateFormat,
          )}
        </div>
      ),
    },
    {
      key: "Time",
      label: "Time",
      sortable: true,
      type: "number",
      sortAccessor: callRecordingSortAccessor("Time"),
      render: (row) => (
        <div>
          {convertDateTimeWithOffsetToLocal(
            String(row.DateTime ?? ""),
            undefined,
            GlobalTimeFormat,
          )}
        </div>
      ),
    },
    {
      key: "AgentExtension",
      label: "Extension",
      sortable: true,
      sortAccessor: callRecordingSortAccessor("AgentExtension"),
    },
    {
      key: "Username",
      label: "Username",
      sortable: true,
      sortAccessor: callRecordingSortAccessor("Username"),
    },
    {
      key: "Department",
      label: "Department",
      sortable: true,
      sortAccessor: callRecordingSortAccessor("Department"),
      render: (row) => row.Department || "---",
    },
    {
      key: "RemotePartyNumber",
      label: "Remote Number",
      sortable: true,
      sortAccessor: callRecordingSortAccessor("RemotePartyNumber"),
    },
    {
      key: "Direction",
      label: "Direction",
      sortable: true,
      sortAccessor: callRecordingSortAccessor("Direction"),
    },
    {
      key: "Duration",
      label: "Duration",
      sortable: true,
      type: "number",
      sortAccessor: callRecordingSortAccessor("Duration"),
      render: (row) => {
        const duration =
          Number.parseInt(String(row.Duration), 10) / 10_000_000 || 0;
        return <div>{formatDuration(duration)}</div>;
      },
    },
  ];
}
