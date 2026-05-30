import React from "react";
import type { TableColumn } from "@components/GenericTable";
import type { AnalysisPerCallCostRow } from "@utils/aiAnalytics";

import {
  formatPerCallCostCell,
  PER_CALL_COST_TABLE_COLUMNS,
  type PerCallCostTableColumnKey,
} from "./formatPerCallCostDisplay";

function PerCallCostCell(props: Readonly<{
  row: AnalysisPerCallCostRow;
  columnKey: PerCallCostTableColumnKey;
}>) {
  const text = formatPerCallCostCell(props.row, props.columnKey);
  const isIdColumn = props.columnKey === "call_id";
  return (
    <span
      className={
        isIdColumn
          ? "ai-analysis-per-call-cost__cell-text ai-analysis-per-call-cost__cell-text--id"
          : "ai-analysis-per-call-cost__cell-text"
      }
      title={text}
    >
      {text}
    </span>
  );
}

export function getPerCallCostTableColumns(): TableColumn<AnalysisPerCallCostRow>[] {
  return PER_CALL_COST_TABLE_COLUMNS.map(({ key, label, width, align }) => ({
    key,
    label,
    width,
    align,
    sortable: false,
    render: (row) => <PerCallCostCell row={row} columnKey={key} />,
  }));
}
