import React from "react";
import { Form, Spinner } from "react-bootstrap";
import { MyDayPastDayStatsPanel } from "@components/planner/my-day/MyDayPastDayStatsPanel";
import type { MyDayHistoryLoadResult, MyDayHistoryTaskRow } from "@page-modules/planner/my-day/myDayHistoryDomain";
import { formatDateGlobal } from "@utils/Helper";

type MyDayHistoryPastDayPanelProps = Readonly<{
  yesterdayIso: string;
  selectedDate: string;
  dateOptions: string[];
  loading: boolean;
  rows: MyDayHistoryTaskRow[];
  historyResult: MyDayHistoryLoadResult | null;
  metaLine: string;
  onSelectedDateChange: (date: string) => void;
}>;

function HistorySourceMeta({
  historyResult,
}: Readonly<{ historyResult: MyDayHistoryLoadResult | null }>) {
  const historySourceLabel = historyResult?.historySourceLabel ?? "";
  if (historySourceLabel === "") {
    return null;
  }

  const deletedCount = historyResult?.deletedCount ?? 0;
  const isReadOnly = historyResult?.readOnly === true;
  const deletedSuffix = deletedCount > 0 ? ` · ${deletedCount} deleted` : "";
  const readOnlySuffix = isReadOnly ? " · Read-only" : "";

  return (
    <p className="small text-muted mb-2" style={{ fontSize: "11px" }}>
      Data source: {historySourceLabel}
      {readOnlySuffix}
      {deletedSuffix}
    </p>
  );
}

function HistoryTaskList({
  selectedDate,
  rows,
}: Readonly<{ selectedDate: string; rows: MyDayHistoryTaskRow[] }>) {
  if (rows.length === 0) {
    return <p className="text-muted small mb-0">No tasks recorded for this date.</p>;
  }

  return (
    <div className="myday-history-list">
      {rows.map((row) => (
        <div key={`${selectedDate}-${row.rowKey}`} className="myday-history-item">
          <div className="myday-history-item__title">
            {row.title}
            {row.isDeleted ? (
              <span className="myday-tag myday-tag--deleted ms-2">Deleted</span>
            ) : null}
          </div>
          <div className="myday-history-item__meta">
            {row.status} • {row.projectName} • {row.estimateLabel}
          </div>
        </div>
      ))}
    </div>
  );
}

export function MyDayHistoryPastDayPanel({
  yesterdayIso,
  selectedDate,
  dateOptions,
  loading,
  rows,
  historyResult,
  metaLine,
  onSelectedDateChange,
}: MyDayHistoryPastDayPanelProps) {
  return (
    <div className="reports-panel myday-history-past-day">
      <h2 className="reports-panel__title">Past day history</h2>
      <p className="reports-panel__subtitle">
        Read-only past day view. After midnight reset, data is rebuilt from end-of-day logs and
        includes deleted tasks when the server provides them.
      </p>
      <Form.Group className="mb-3">
        <Form.Label className="small fw-semibold">Past day</Form.Label>
        <Form.Select
          value={selectedDate}
          onChange={(e) => onSelectedDateChange(e.target.value)}
          disabled={loading}
        >
          {dateOptions.map((iso) => (
            <option key={iso} value={iso}>
              {formatDateGlobal(iso)}
              {iso === yesterdayIso ? " (yesterday)" : ""}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      {historyResult?.stats ? <MyDayPastDayStatsPanel stats={historyResult.stats} /> : null}

      <p className="small text-muted my-3 mb-2">{metaLine}</p>
      <HistorySourceMeta historyResult={historyResult} />

      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" size="sm" role="status" />
        </div>
      ) : (
        <HistoryTaskList selectedDate={selectedDate} rows={rows} />
      )}
    </div>
  );
}
