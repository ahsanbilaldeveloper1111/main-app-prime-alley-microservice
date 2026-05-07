import React from "react";

import {
  type BulkCheckResultValue,
  isTruthyString,
} from "./checkNumberDomain";

import "./checkNumberPage.scss";

export interface CheckNumberBulkResultTableProps {
  results: Record<string, BulkCheckResultValue>;
}

export function CheckNumberBulkResultTable(
  props: Readonly<CheckNumberBulkResultTableProps>,
): React.ReactElement {
  const { results } = props;

  return (
    <div className="mt-4">
      <div className="table-responsive">
        <table className="table table-bordered table-striped">
          <thead className="table-dark">
            <tr>
              <th>Phone Number</th>
              <th>Status</th>
              <th>Account Number</th>
              <th>DNCR Status</th>
              <th>Transaction Status</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(results).map(([phoneNumber, data]) => (
              <tr key={phoneNumber}>
                <td>
                  <strong>{phoneNumber}</strong>
                </td>
                <td>
                  <span
                    className={`badge ${isTruthyString(data.status) ? "bg-success" : "bg-danger"}`}
                  >
                    {isTruthyString(data.status)
                      ? "Registered"
                      : "Not Registered"}
                  </span>
                </td>
                <td>{data.accountNumber}</td>
                <td>
                  <span
                    className={`badge ${isTruthyString(data.dncrStatus) ? "bg-success" : "bg-danger"}`}
                  >
                    {isTruthyString(data.dncrStatus) ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>{data.transactionStatus || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
