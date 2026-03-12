import React from "react";
import { Table } from "react-bootstrap";
import { Check } from "lucide-react";
import { formatStartTime, formatDuration, type CallRow } from "./types";

export interface RecentCallsTableProps {
  loading: boolean;
  calls: CallRow[];
}

const RecentCallsTable = ({ loading, calls }: RecentCallsTableProps) => (
  <>
    <h5 className="mb-3">Recent Calls</h5>
    <div className="mb-4 card">
      <Table responsive bordered hover className="mb-0">
        <thead>
          <tr>
            <th>Bot</th>
            <th>Company</th>
            <th>Duration</th>
            <th>Status</th>
            <th>Start Time</th>
          </tr>
        </thead>
        <tbody>
          {(() => {
            if (loading) {
              return (
                <tr>
                  <td colSpan={5} className="text-center text-muted">Loading...</td>
                </tr>
              );
            }
            if (calls.length === 0) {
              return (
                <tr>
                  <td colSpan={5} className="text-center text-muted">No recent calls.</td>
                </tr>
              );
            }
            return calls.map((call, i) => (
              <tr key={String(call.session_id ?? call.id ?? i)}>
                <td>{String(call.bot_name ?? call.bot ?? "—")}</td>
                <td>{String(call.company_name ?? call.company ?? "—")}</td>
                <td>{formatDuration(call.call_duration_seconds)}</td>
                <td>
                  {String(call.status ?? "") === "completed" ? (
                    <span className="text-success d-inline-flex align-items-center gap-1">
                      <Check size={16} /> Completed
                    </span>
                  ) : (
                    String(call.status ?? "—")
                  )}
                </td>
                <td className="text-nowrap small">
                  {formatStartTime(call.session_start_time)}
                </td>
              </tr>
            ));
          })()}
        </tbody>
      </Table>
    </div>
  </>
);

export default RecentCallsTable;
