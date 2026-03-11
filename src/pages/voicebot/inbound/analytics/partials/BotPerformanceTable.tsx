import React from "react";
import { Table } from "react-bootstrap";

export interface BotPerformanceRow {
  name: string;
  total: number;
  completed: number;
  transferred: number;
  failed: number;
  successRate: string;
}

export interface BotPerformanceTableProps {
  loading: boolean;
  rows: BotPerformanceRow[];
}

const BotPerformanceTable = ({ loading, rows }: BotPerformanceTableProps) => (
  <>
    <h5 className="mb-3">Bot Performance</h5>
    <div className="card">
      <Table responsive bordered hover className="mb-0">
        <thead>
          <tr>
            <th className="text-start">Bot</th>
            <th className="text-center">Total Calls</th>
            <th className="text-center">Completed</th>
            <th className="text-center">Transferred</th>
            <th className="text-center">Failed</th>
            <th className="text-end">Success Rate</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} className="text-center text-muted">
                Loading...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center text-muted">
                No bot data available.
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i}>
                <td className="text-start">{row.name}</td>
                <td className="text-center">{row.total}</td>
                <td className="text-center">{row.completed}</td>
                <td className="text-center">{row.transferred}</td>
                <td className="text-center">{row.failed}</td>
                <td className="text-end">{row.successRate}%</td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  </>
);

export default BotPerformanceTable;
