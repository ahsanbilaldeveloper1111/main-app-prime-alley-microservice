import React from "react";

import {
  type CheckNumberResultRow,
  isTruthyString,
} from "./checkNumberDomain";

import "./checkNumberPage.scss";

export interface CheckNumberSingleResultTableProps {
  rows: CheckNumberResultRow[];
}

export function CheckNumberSingleResultTable(
  props: Readonly<CheckNumberSingleResultTableProps>,
): React.ReactElement {
  const { rows } = props;

  return (
    <div className="mt-4">
      <div className="mt-4">
        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            <thead>
              <tr>
                <th>Phone Number</th>
                <th>Status</th>
                <th>DNCR Status</th>
                <th>Transaction Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item, idx) => (
                <tr
                  key={
                    item.phoneNumber ??
                    item.accountNumber ??
                    `check-row-${idx}`
                  }
                >
                  <td>{item.accountNumber}</td>
                  <td>
                    <span
                      className={`badge ${isTruthyString(item.status) ? "bg-success" : "bg-danger"}`}
                    >
                      {isTruthyString(item.status)
                        ? "Registered"
                        : "Not Registered"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${isTruthyString(item.dncrStatus) ? "bg-success" : "bg-danger"}`}
                    >
                      {isTruthyString(item.dncrStatus) ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{item.transactionStatus || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
