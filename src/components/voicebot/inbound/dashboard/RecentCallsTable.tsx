import React from "react";
import { Check } from "lucide-react";
import GenericTable, { type TableColumn } from "@components/GenericTable";
import { formatStartTime, formatDuration, type CallRow } from "./types";

export interface RecentCallsTableProps {
  loading: boolean;
  calls: CallRow[];
}

const RecentCallsTable = ({ loading, calls }: RecentCallsTableProps) => (
  <>
    <h5 className="mb-3">Recent Calls</h5>
    <div className="mb-4">
      <GenericTable<CallRow>
        data={calls}
        columns={[
          {
            key: "bot",
            label: "Bot",
            type: "custom",
            render: (call) => String(call.bot_name ?? call.bot ?? "—"),
          } as TableColumn<CallRow>,
          {
            key: "company",
            label: "Company",
            type: "custom",
            render: (call) => String(call.company_name ?? call.company ?? "—"),
          } as TableColumn<CallRow>,
          {
            key: "call_duration_seconds",
            label: "Duration",
            type: "custom",
            render: (call) => formatDuration(call.call_duration_seconds),
          } as TableColumn<CallRow>,
          {
            key: "status",
            label: "Status",
            type: "custom",
            render: (call) =>
              String(call.status ?? "") === "completed" ? (
                <span className="text-success d-inline-flex align-items-center gap-1">
                  <Check size={16} /> Completed
                </span>
              ) : (
                String(call.status ?? "—")
              ),
          } as TableColumn<CallRow>,
          {
            key: "session_start_time",
            label: "Start Time",
            type: "custom",
            render: (call) => (
              <span className="text-nowrap small">
                {formatStartTime(call.session_start_time)}
              </span>
            ),
          } as TableColumn<CallRow>,
        ]}
        loading={loading}
        loadingMessage="Loading..."
        emptyMessage="No recent calls."
        uniqueKey="session_id"
        showToolbar={false}
        showToolbarActions={false}
      />
    </div>
  </>
);

export default RecentCallsTable;
