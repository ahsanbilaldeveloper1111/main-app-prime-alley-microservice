import React from "react";
import { Check } from "lucide-react";
import GenericTable, { type TableColumn } from "@components/GenericTable";
import { humanizeSnakeCase } from "@utils/Helper";
import { formatStartTime, formatDuration, type CallRow } from "./types";

export interface RecentCallsTableProps {
  loading: boolean;
  calls: CallRow[];
}

/** Normalize API status for comparisons (handles snake_case, spaces, casing). */
function normalizedCallStatus(status: unknown): string {
  if (status == null) return "";
  if (typeof status === "string") {
    return status.trim().toLowerCase().replaceAll(/[\s-]+/g, "_");
  }
  if (typeof status === "number" || typeof status === "boolean" || typeof status === "bigint") {
    return String(status).trim().toLowerCase().replaceAll(/[\s-]+/g, "_");
  }
  return "";
}

function renderCallStatusCell(call: CallRow) {
  const norm = normalizedCallStatus(call.status);
  const raw = call.status;
  const label = humanizeSnakeCase(
    typeof raw === "string" ? raw.replaceAll("-", "_") : raw,
    "—",
  );

  if (norm === "completed") {
    return (
      <span className="text-success d-inline-flex align-items-center gap-1">
        <Check size={16} /> Completed
      </span>
    );
  }
  if (norm === "failed" || norm === "timeout" || norm === "transfer_failed") {
    return <span className="status-badge danger text-capitalize">{label}</span>;
  }
  if (norm === "transferred") {
    return <span className="status-badge info text-capitalize">{label}</span>;
  }
  return <span className="status-badge secondary text-capitalize">{label}</span>;
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
            render: (call) => {
              const label =
                (typeof call.bot_name === "string" && call.bot_name.trim()) ||
                (typeof call.botName === "string" && call.botName.trim()) ||
                (typeof call.bot === "string" && call.bot.trim()) ||
                "—";
              return label;
            },
          } as TableColumn<CallRow>,
          {
            key: "company",
            label: "Company",
            type: "custom",
            render: (call) => {
              const label =
                (typeof call.company_name === "string" && call.company_name.trim()) ||
                (typeof call.companyName === "string" && call.companyName.trim()) ||
                (typeof call.company === "string" && call.company.trim()) ||
                "—";
              return label;
            },
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
            render: (call) => renderCallStatusCell(call),
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
