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
          {loading ? (
            <tr>
              <td colSpan={5} className="text-center text-muted">Loading...</td>
            </tr>
          ) : calls.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center text-muted">No recent calls.</td>
            </tr>
          ) : (
            calls.map((call, i) => (
              <tr key={(call.session_id ?? call.id ?? i) as string}>
                <td>{(call.bot_name ?? call.bot) as string ?? "—"}</td>
                <td>{(call.company_name ?? call.company) as string ?? "—"}</td>
                <td>{formatDuration(call.call_duration_seconds as number)}</td>
                <td>
                  {(call.status as string) === "completed" ? (
                    <span className="text-success d-inline-flex align-items-center gap-1">
                      <Check size={16} /> Completed
                    </span>
                  ) : (
                    (call.status as string) ?? "—"
                  )}
                </td>
                <td className="text-nowrap small">
                  {formatStartTime(call.session_start_time as string)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  </>
);

export default RecentCallsTable;
