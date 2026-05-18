import React, { useCallback, useEffect, useMemo, useState } from "react";
import moment from "moment";
import { Button, Form, Modal, Spinner } from "react-bootstrap";
import { getMyDayPastDaySnapshot } from "@utils/tasks";
import { formatDateGlobal } from "@utils/Helper";

export type MyDayHistoryTaskRow = Readonly<{
  id: number;
  title: string;
  status: "Active" | "Completed";
  estimateLabel: string;
  projectName: string;
}>;

function mapHistoryTaskRow(row: unknown, status: "Active" | "Completed"): MyDayHistoryTaskRow | null {
  if (row == null || typeof row !== "object") return null;
  const o = row as Record<string, unknown>;
  const id = Number(o.id);
  if (!Number.isFinite(id) || id <= 0) return null;
  const title =
    typeof o.title === "string" && o.title.trim() ? o.title.trim() : `Task #${id}`;
  const est = Number(o.estimated_minutes ?? o.estimated_duration_minutes ?? 0);
  const estimateLabel =
    Number.isFinite(est) && est > 0 ? `${Math.round(est)}m` : "No estimate";
  const project =
    o.project != null && typeof o.project === "object"
      ? (o.project as { name?: string | null }).name
      : null;
  return {
    id,
    title,
    status,
    estimateLabel,
    projectName: project?.trim() || "No project",
  };
}

export type MyDayHistoryModalProps = Readonly<{
  show: boolean;
  todayIso: string;
  onClose: () => void;
}>;

export function MyDayHistoryModal({ show, todayIso, onClose }: MyDayHistoryModalProps) {
  const pastDateOptions = useMemo(() => {
    const options: string[] = [];
    const base = moment(todayIso, "YYYY-MM-DD");
    for (let i = 1; i <= 14; i += 1) {
      options.push(base.clone().subtract(i, "day").format("YYYY-MM-DD"));
    }
    return options;
  }, [todayIso]);

  const defaultHistoryDate = pastDateOptions[0] ?? todayIso;

  const [selectedDate, setSelectedDate] = useState(defaultHistoryDate);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<MyDayHistoryTaskRow[]>([]);
  const [metaLine, setMetaLine] = useState("");

  const loadHistory = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const payload = await getMyDayPastDaySnapshot(date);
      const active = (payload.active ?? [])
        .map((row) => mapHistoryTaskRow(row, "Active"))
        .filter((r): r is MyDayHistoryTaskRow => r != null);
      const completed = (payload.completed ?? [])
        .map((row) => mapHistoryTaskRow(row, "Completed"))
        .filter((r): r is MyDayHistoryTaskRow => r != null);
      setRows([...active, ...completed]);

      const meta = payload.meta ?? {};
      const activeCount = meta.active_count ?? active.length;
      const completedCount = meta.completed_count ?? completed.length;
      const planned = Number(meta.planned_minutes ?? 0);
      const done = Number(meta.completed_minutes ?? 0);
      setMetaLine(
        `${activeCount} active • ${completedCount} completed • ${done}m done of ${planned}m planned`,
      );
    } catch {
      setRows([]);
      setMetaLine("Unable to load history for this date.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!show) return;
    setSelectedDate(defaultHistoryDate);
  }, [defaultHistoryDate, show]);

  useEffect(() => {
    if (!show || !selectedDate) return;
    loadHistory(selectedDate).catch(() => undefined);
  }, [loadHistory, selectedDate, show]);

  return (
    <Modal show={show} onHide={onClose} size="lg" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>My Day history</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="small text-muted mb-3">
          Read-only snapshot of tasks and activities from a previous day.
        </p>
        <Form.Group className="mb-3">
          <Form.Label className="small fw-semibold">Date</Form.Label>
          <Form.Select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            disabled={loading}
          >
            {pastDateOptions.map((iso) => (
              <option key={iso} value={iso}>
                {formatDateGlobal(iso)}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <p className="small text-muted mb-2">{metaLine}</p>

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
              <div key={`${selectedDate}-${row.id}-${row.status}`} className="myday-history-item">
                <div className="myday-history-item__title">{row.title}</div>
                <div className="myday-history-item__meta">
                  {row.status} • {row.projectName} • {row.estimateLabel}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
