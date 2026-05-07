import React from "react";
import { Edit3 } from "lucide-react";
import GenericTable, { TableColumn } from "@components/GenericTable";

import { type NumberCheckTableRow } from "./apiNumberCheckDomain";

import "./apiNumberCheckPage.scss";

export interface ApiNumberCheckResultsSectionProps {
  totalNumbers: number;
  deniedCount: number;
  permittedCount: number;
  invalidStatusCount: number;
  hasResults: boolean;
  tableData: NumberCheckTableRow[];
  tableColumns: TableColumn<NumberCheckTableRow>[];
  isChecking: boolean;
  isUploading: boolean;
}

export function ApiNumberCheckResultsSection(
  props: Readonly<ApiNumberCheckResultsSectionProps>,
): React.ReactElement {
  const {
    totalNumbers,
    deniedCount,
    permittedCount,
    invalidStatusCount,
    hasResults,
    tableData,
    tableColumns,
    isChecking,
    isUploading,
  } = props;

  return (
    <div className="apiNumberCheck-card">
      <div className="apiNumberCheck-cardHeader">
        <div className="apiNumberCheck-sectionTitle">
          <div className="apiNumberCheck-iconBadge">
            <Edit3 size={16} color="#6c757d" />
          </div>
          Results
        </div>
        <div className="apiNumberCheck-resultStats">
          <span className="apiNumberCheck-statItem">
            Total <strong>{totalNumbers}</strong>
          </span>
          <span className="apiNumberCheck-statItem apiNumberCheck-statItem--permitted">
            Permitted <strong>{permittedCount}</strong>
          </span>
          <span className="apiNumberCheck-statItem apiNumberCheck-statItem--denied">
            Denied <strong>{deniedCount}</strong>
          </span>
          <span className="apiNumberCheck-statItem apiNumberCheck-statItem--invalid">
            Invalid <strong>{invalidStatusCount}</strong>
          </span>
        </div>
      </div>

      <div className="apiNumberCheck-cardBody">
        {hasResults ? (
          <GenericTable<NumberCheckTableRow>
            data={tableData}
            columns={tableColumns}
            uniqueKey="id"
            showActions={false}
            showToolbar={false}
            showToolbarActions={false}
            loading={isChecking || isUploading}
            loadingMessage="Loading results..."
            emptyMessage='No results yet. Enter phone numbers and click Check Numbers to see results.'
          />
        ) : (
          <div className="apiNumberCheck-emptyResults">
            No results yet. Enter phone numbers and click &quot;Check
            Numbers&quot; to see results.
          </div>
        )}
      </div>
    </div>
  );
}
