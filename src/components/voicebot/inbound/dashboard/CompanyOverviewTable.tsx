import React from "react";
import GenericTable, { type TableColumn } from "@components/GenericTable";
import type { CompanyTableRow } from "./types";

export interface CompanyOverviewTableProps {
  loading: boolean;
  rows: CompanyTableRow[];
}

const CompanyOverviewTable = ({ loading, rows }: CompanyOverviewTableProps) => (
  <>
    <h5 className="mb-3">Company Overview (Active Companies)</h5>
    <div>
      <GenericTable<CompanyTableRow>
        data={rows}
        columns={[
          {
            key: "company",
            label: "Company",
            type: "text",
            emptyValue: "—",
          } as TableColumn<CompanyTableRow>,
          {
            key: "tier",
            label: "Tier",
            type: "custom",
            render: (row) => <span className="text-capitalize">{row.tier}</span>,
          } as TableColumn<CompanyTableRow>,
          {
            key: "bots",
            label: "Bots",
            type: "text",
            emptyValue: "0",
          } as TableColumn<CompanyTableRow>,
          {
            key: "calls",
            label: "Calls",
            type: "text",
            emptyValue: "0",
          } as TableColumn<CompanyTableRow>,
          {
            key: "cost",
            label: "Cost",
            type: "custom",
            render: (row) => <span>${row.cost}</span>,
          } as TableColumn<CompanyTableRow>,
        ]}
        loading={loading}
        loadingMessage="Loading..."
        emptyMessage="No companies."
        uniqueKey="company"
        showToolbar={false}
        showToolbarActions={false}
      />
    </div>
  </>
);

export default CompanyOverviewTable;
