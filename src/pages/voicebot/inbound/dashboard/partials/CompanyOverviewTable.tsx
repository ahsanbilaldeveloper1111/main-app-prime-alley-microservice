import React from "react";
import { Table } from "react-bootstrap";
import type { CompanyTableRow } from "./types";

export interface CompanyOverviewTableProps {
  loading: boolean;
  rows: CompanyTableRow[];
}

const CompanyOverviewTable = ({ loading, rows }: CompanyOverviewTableProps) => (
  <>
    <h5 className="mb-3">Company Overview (Active Companies)</h5>
    <div className="card">
      <Table responsive bordered hover className="mb-0">
        <thead>
          <tr>
            <th>Company</th>
            <th>Tier</th>
            <th>Bots</th>
            <th>Calls</th>
            <th>Cost</th>
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
            if (rows.length === 0) {
              return (
                <tr>
                  <td colSpan={5} className="text-center text-muted">No companies.</td>
                </tr>
              );
            }
            return rows.map((row, i) => (
              <tr key={row.company + "-" + i}>
                <td>{row.company}</td>
                <td className="text-capitalize">{row.tier}</td>
                <td>{row.bots}</td>
                <td>{row.calls}</td>
                <td>${row.cost}</td>
              </tr>
            ));
          })()}
        </tbody>
      </Table>
    </div>
  </>
);

export default CompanyOverviewTable;
