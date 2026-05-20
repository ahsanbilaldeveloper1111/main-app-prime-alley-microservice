import React, { useEffect, useMemo, useState } from "react";
import { Spinner } from "react-bootstrap";
import { getMyDayTeam, type MyDayTeamReporteePayload } from "@utils/tasks";
import { formatWorkloadMemberLabel } from "@page-modules/planner/workload/workloadDomain";
import {
  formatSuggestionDueDate,
  resolveEstimateMinutesFromRow,
  resolveProjectFromRow,
  toMinutesDisplay,
} from "@page-modules/planner/my-day/myDayDomain";

type MyDayTeamSectionProps = Readonly<{
  planDate: string;
  managerExtension: string;
  reporteeExtensions: string[];
  hierarchyExtensions?: unknown[] | null;
}>;

function mapTeamTaskRow(row: unknown): {
  id: number;
  title: string;
  estimateMinutes: number;
  projectName: string;
  dueLabel: string | null;
} | null {
  if (row == null || typeof row !== "object") return null;
  const record = row as Record<string, unknown>;
  const id = Number(record.id);
  if (!Number.isFinite(id) || id <= 0) return null;
  const title =
    typeof record.title === "string" && record.title.trim()
      ? record.title.trim()
      : `Task #${id}`;
  const project = resolveProjectFromRow(record);
  let dueRaw: string | null = null;
  if (typeof record.due_date === "string") {
    dueRaw = record.due_date;
  } else if (typeof record.end_date === "string") {
    dueRaw = record.end_date;
  }
  return {
    id,
    title,
    estimateMinutes: resolveEstimateMinutesFromRow(record),
    projectName: project.label,
    dueLabel: formatSuggestionDueDate(dueRaw),
  };
}

function ReporteeBlock({
  reportee,
  hierarchyExtensions,
}: Readonly<{
  reportee: MyDayTeamReporteePayload;
  hierarchyExtensions?: unknown[] | null;
}>) {
  const label = formatWorkloadMemberLabel(
    reportee.extension_number,
    hierarchyExtensions,
    null,
  );
  const active = (reportee.active ?? [])
    .map(mapTeamTaskRow)
    .filter((row): row is NonNullable<typeof row> => row != null);
  const completed = (reportee.completed ?? [])
    .map(mapTeamTaskRow)
    .filter((row): row is NonNullable<typeof row> => row != null);
  const meta = reportee.meta ?? {};
  const planned = Number(meta.planned_minutes ?? 0);

  if (active.length === 0 && completed.length === 0) {
    return (
      <div className="myday-team-reportee myday-team-reportee--empty">
        <div className="myday-team-reportee__name">{label}</div>
        <p className="myday-team-reportee__empty">No tasks in My Day</p>
      </div>
    );
  }

  return (
    <div className="myday-team-reportee">
      <div className="myday-team-reportee__head">
        <div className="myday-team-reportee__name">{label}</div>
        <div className="myday-team-reportee__meta">
          {meta.tasks_planned ?? active.length + completed.length} tasks ·{" "}
          {toMinutesDisplay(planned)} planned
        </div>
      </div>
      {active.length > 0 ? (
        <ul className="myday-team-task-list">
          {active.map((task) => (
            <li key={task.id} className="myday-team-task">
              <span className="myday-team-task__title">{task.title}</span>
              <span className="myday-team-task__tags">
                <span className="myday-tag myday-tag--project">{task.projectName}</span>
                <span className="myday-tag myday-tag--estimate">
                  {task.estimateMinutes > 0
                    ? toMinutesDisplay(task.estimateMinutes)
                    : "No estimate"}
                </span>
                {task.dueLabel ? (
                  <span className="myday-tag myday-tag--due">{task.dueLabel}</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {completed.length > 0 ? (
        <p className="myday-team-reportee__done">
          {completed.length} completed
        </p>
      ) : null}
    </div>
  );
}

export function MyDayTeamSection({
  planDate,
  managerExtension,
  reporteeExtensions,
  hierarchyExtensions,
}: MyDayTeamSectionProps) {
  const [loading, setLoading] = useState(false);
  const [reportees, setReportees] = useState<MyDayTeamReporteePayload[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reporteeKey = useMemo(() => reporteeExtensions.join(","), [reporteeExtensions]);

  useEffect(() => {
    if (reporteeExtensions.length === 0) {
      setReportees([]);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getMyDayTeam({
      extension_number: managerExtension || undefined,
      reportee_extensions: reporteeExtensions.slice(0, 60),
      date: planDate,
    })
      .then((payload) => {
        if (cancelled) return;
        setReportees(payload.reportees ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setReportees([]);
        setError("Could not load team My Day");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [managerExtension, planDate, reporteeKey, reporteeExtensions]);

  if (reporteeExtensions.length === 0) return null;

  return (
    <div className="myday-table-card myday-team-card">
      <div className="myday-section-title">My Team</div>
      {loading ? (
        <div className="myday-team-loading">
          <Spinner animation="border" size="sm" />
          <span>Loading team…</span>
        </div>
      ) : null}
      {error ? <p className="myday-empty-state">{error}</p> : null}
      {!loading && !error && reportees.length === 0 ? (
        <p className="myday-empty-state">No reportee data for today.</p>
      ) : null}
      {!loading && !error
        ? reportees.map((reportee) => (
            <ReporteeBlock
              key={reportee.extension_number}
              reportee={reportee}
              hierarchyExtensions={hierarchyExtensions}
            />
          ))
        : null}
    </div>
  );
}
