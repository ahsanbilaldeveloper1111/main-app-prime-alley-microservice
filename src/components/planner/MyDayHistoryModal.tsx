import React, { useCallback, useEffect, useMemo, useState } from "react";
import moment from "moment";
import { Button, Form, Modal, Nav, Spinner } from "react-bootstrap";
import { MyDayMonthlyReportSection } from "@components/planner/my-day/MyDayMonthlyReportSection";
import { MyDayPastDayStatsPanel } from "@components/planner/my-day/MyDayPastDayStatsPanel";
import {
  formatPastDayStatsLine,
  loadMyDayHistoryForDate,
  type MyDayHistoryLoadResult,
  type MyDayHistoryTaskRow,
} from "@page-modules/planner/my-day/myDayHistoryDomain";
import { formatDateGlobal } from "@utils/Helper";
import { listMyDayDailyLogs } from "@utils/tasks";

export type { MyDayHistoryTaskRow } from "@page-modules/planner/my-day/myDayHistoryDomain";

type MyDayHistoryView = "past_day" | "monthly";

export type MyDayHistoryModalProps = Readonly<{
  show: boolean;
  todayIso: string;
  onClose: () => void;
}>;

export function MyDayHistoryModal({ show, todayIso, onClose }: MyDayHistoryModalProps) {
  const yesterdayIso = useMemo(
    () => moment(todayIso, "YYYY-MM-DD").subtract(1, "day").format("YYYY-MM-DD"),
    [todayIso],
  );

  const defaultPastDates = useMemo(() => {
    const options: string[] = [];
    const base = moment(todayIso, "YYYY-MM-DD");
    for (let i = 1; i <= 14; i += 1) {
      options.push(base.clone().subtract(i, "day").format("YYYY-MM-DD"));
    }
    return options;
  }, [todayIso]);

  const [activeView, setActiveView] = useState<MyDayHistoryView>("past_day");
  const [selectedDate, setSelectedDate] = useState(yesterdayIso);
  const [dateOptions, setDateOptions] = useState<string[]>(defaultPastDates);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<MyDayHistoryTaskRow[]>([]);
  const [historyResult, setHistoryResult] = useState<MyDayHistoryLoadResult | null>(null);
  const [metaLine, setMetaLine] = useState("");

  const loadHistory = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const result = await loadMyDayHistoryForDate(date);
      setRows(result.rows);
      setHistoryResult(result);
      setMetaLine(formatPastDayStatsLine(result.stats));
    } catch {
      setRows([]);
      setHistoryResult(null);
      setMetaLine("Unable to load history for this date.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!show) return;
    setActiveView("past_day");
    setSelectedDate(yesterdayIso);
  }, [show, yesterdayIso]);

  useEffect(() => {
    if (!show) return;
    listMyDayDailyLogs({ limit: 90 })
      .then((logs) => {
        const fromLogs = logs
          .map((log) => log.log_date ?? log.plan_date)
          .filter((d): d is string => typeof d === "string" && d.length > 0);
        const merged = [...new Set([...defaultPastDates, ...fromLogs])].sort((a, b) =>
          b.localeCompare(a),
        );
        setDateOptions(merged);
      })
      .catch(() => setDateOptions(defaultPastDates));
  }, [defaultPastDates, show]);

  useEffect(() => {
    if (!show || activeView !== "past_day" || !selectedDate) return;
    loadHistory(selectedDate).catch(() => undefined);
  }, [loadHistory, selectedDate, show, activeView]);

  const historySourceLabel = historyResult?.historySourceLabel ?? "";
  const deletedCount = historyResult?.deletedCount ?? 0;
  const isReadOnly = historyResult?.readOnly === true;

  return (
    <Modal
      show={show}
      onHide={onClose}
      size="xl"
      centered
      scrollable
      dialogClassName="myday-history-modal"
      contentClassName="myday-history-modal__content"
    >
      <Modal.Header closeButton>
        <Modal.Title>My Day history</Modal.Title>
      </Modal.Header>
      <Modal.Body className="myday-history-modal__body">
        <Nav variant="tabs" className="reports-view-tabs mb-3">
          <Nav.Item>
            <Nav.Link
              active={activeView === "past_day"}
              onClick={() => setActiveView("past_day")}
            >
              Past day
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              active={activeView === "monthly"}
              onClick={() => setActiveView("monthly")}
            >
              My Day Monthly
            </Nav.Link>
          </Nav.Item>
        </Nav>

        {activeView === "monthly" ? (
          <MyDayMonthlyReportSection active={show && activeView === "monthly"} />
        ) : (
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
                onChange={(e) => setSelectedDate(e.target.value)}
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
            {historySourceLabel ? (
              <p className="small text-muted mb-2" style={{ fontSize: "11px" }}>
                Data source: {historySourceLabel}
                {isReadOnly ? " · Read-only" : ""}
                {deletedCount > 0 ? ` · ${deletedCount} deleted` : ""}
              </p>
            ) : null}

            {loading ? (
              <div className="text-center py-4">
                <Spinner animation="border" size="sm" role="status" />
              </div>
            ) : null}

            {!loading && rows.length === 0 ? (
              <p className="text-muted small mb-0">No tasks recorded for this date.</p>
            ) : null}

            {!loading && rows.length > 0 ? (
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
            ) : null}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
