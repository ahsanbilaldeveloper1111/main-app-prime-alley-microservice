import React from "react";
import { Button, Col, Row, Spinner } from "react-bootstrap";
import type { ActivityLogExtension } from "./activityLogExtension";

/** Allowed `limit` values for the activities modal (API pagination). */
export const ACTIVITIES_MODAL_PER_PAGE_OPTIONS = [5, 10, 20, 50, 100] as const;
export const DEFAULT_ACTIVITIES_MODAL_PER_PAGE: (typeof ACTIVITIES_MODAL_PER_PAGE_OPTIONS)[number] = 10;

export function parseActivitiesModalPerPage(raw: string): (typeof ACTIVITIES_MODAL_PER_PAGE_OPTIONS)[number] {
  const n = Number(raw);
  return ACTIVITIES_MODAL_PER_PAGE_OPTIONS.includes(n as (typeof ACTIVITIES_MODAL_PER_PAGE_OPTIONS)[number])
    ? (n as (typeof ACTIVITIES_MODAL_PER_PAGE_OPTIONS)[number])
    : DEFAULT_ACTIVITIES_MODAL_PER_PAGE;
}

export function formatActivityDate(dateString: string) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateString;
  }
}

/** Long label for activity headers (e.g. March 26, 2026 at 05:12 PM). */
function formatActivityDateLong(dateString: string) {
  try {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateString;
  }
}

/** Unwrap activities from API (array or `{ data: [] }` envelope). */
export function normalizeTaskActivitiesPayload(res: unknown): any[] {
  if (Array.isArray(res)) {
    return res;
  }
  if (res && typeof res === "object" && Array.isArray((res as { data?: unknown }).data)) {
    return (res as { data: any[] }).data;
  }
  return [];
}

function humanizeActivityFieldKey(key: string): string {
  const map: Record<string, string> = {
    due_date: "Due Date",
    start_date: "Start Date",
    end_date: "End Date",
    status_id: "Status",
    project_id: "Project",
    priority: "Priority",
    title: "Title",
    description: "Description",
    assignees: "Assignees",
    watchers: "Watchers",
    extension_numbers: "Assignees",
    watcher_numbers: "Watchers",
    label_ids: "Labels",
  };
  if (map[key]) {
    return map[key];
  }
  return key
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function formatActivityChangeValue(val: unknown): string {
  if (val == null || val === "") {
    return "—";
  }
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      try {
        const d = new Date(trimmed);
        if (!Number.isNaN(d.getTime())) {
          return d.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
        }
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  }
  if (typeof val === "number" || typeof val === "boolean") {
    return String(val);
  }
  try {
    return JSON.stringify(val);
  } catch {
    if (typeof val === "object" && val !== null) {
      return "[Complex value]";
    }
    return String(val as string | number | bigint | boolean | symbol);
  }
}

function collectActivityChangeKeys(
  oldValues: Record<string, unknown> | null | undefined,
  newValues: Record<string, unknown> | null | undefined,
): string[] {
  const keys = new Set<string>();
  if (oldValues && typeof oldValues === "object") {
    for (const k of Object.keys(oldValues)) {
      keys.add(k);
    }
  }
  if (newValues && typeof newValues === "object") {
    for (const k of Object.keys(newValues)) {
      keys.add(k);
    }
  }
  return Array.from(keys);
}

export function getExtensionDisplay(
  extList: ActivityLogExtension[] | undefined,
  extNumber: string,
) {
  if (!extList?.length || !extNumber) {
    return { name: extNumber, initials: (extNumber || "UN").toUpperCase().slice(0, 2) };
  }
  const extension = extList.find(
    (ext) =>
      String(ext.id) === String(extNumber) || ext.extension_number === extNumber,
  );
  const name = extension?.name || extension?.user?.name || extNumber;
  const initials =
    name === extNumber
      ? (extNumber || "UN").toUpperCase().slice(0, 2)
      : name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .substring(0, 2)
          .toUpperCase();
  return { name, initials };
}

/** Change fields whose values are extension numbers resolvable via hierarchy `extensions`. */
const ACTIVITY_CHANGE_HIERARCHY_EXTENSION_FIELDS = new Set([
  "watchers",
  "watcher_numbers",
  "extension_numbers",
  "assignees",
]);

function formatExtensionListForActivityChange(
  val: unknown,
  extensions: ActivityLogExtension[] | undefined,
): string {
  if (val == null) {
    return "—";
  }
  if (!Array.isArray(val)) {
    return formatActivityChangeValue(val);
  }
  if (val.length === 0) {
    return "—";
  }
  const names: string[] = [];
  for (const item of val) {
    if (typeof item === "string" || typeof item === "number") {
      names.push(getExtensionDisplay(extensions, String(item)).name);
    } else if (item != null && typeof item === "object") {
      const extNum =
        (item as { extension_number?: string }).extension_number ??
        (item as { id?: string | number }).id;
      if (extNum != null && String(extNum) !== "") {
        names.push(getExtensionDisplay(extensions, String(extNum)).name);
      }
    }
  }
  const joined = names.filter(Boolean).join(", ");
  return joined.length > 0 ? joined : "—";
}

function formatActivityChangeValueForField(
  fieldKey: string,
  val: unknown,
  extensions: ActivityLogExtension[] | undefined,
): string {
  if (ACTIVITY_CHANGE_HIERARCHY_EXTENSION_FIELDS.has(fieldKey)) {
    return formatExtensionListForActivityChange(val, extensions);
  }
  return formatActivityChangeValue(val);
}

function normalizeCommentsResponse(commentsResponse: unknown): any[] {
  if (commentsResponse && Array.isArray(commentsResponse)) {
    return commentsResponse;
  }
  if (
    commentsResponse &&
    typeof commentsResponse === "object" &&
    Array.isArray((commentsResponse as { data?: unknown }).data)
  ) {
    return (commentsResponse as { data: any[] }).data;
  }
  return [];
}

function documentPluralSuffix(count: number): string {
  if (count === 1) {
    return "";
  }
  return "s";
}

export function renderActivityList(
  activities: any[],
  extensions: ActivityLogExtension[],
  avatarSize = "32px",
  fontSize = "0.7rem",
): React.ReactNode {
  return activities.map((activity: any, idx: number) => {
    const extNumber = activity.extension_number || "";
    const { name: extensionName, initials: extensionInitials } = getExtensionDisplay(
      extensions,
      extNumber,
    );
    const activityDate = formatActivityDate(activity.created_at || "");
    const actionText = activity.description || activity.action || "Activity";

    return (
      <div
        key={activity.id ?? idx}
        style={{
          marginBottom: avatarSize === "32px" ? "1rem" : 0,
          display: "flex",
          gap: "12px",
          padding: avatarSize === "40px" ? "1rem 0" : 0,
          borderBottom:
            avatarSize === "40px" && idx < activities.length - 1
              ? "1px solid #e2e8f0"
              : "none",
        }}
      >
        <div
          className="assignee-avatar"
          style={{
            width: avatarSize,
            height: avatarSize,
            fontSize,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            fontWeight: 600,
          }}
        >
          {extensionInitials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.875rem", color: "#1e293b", marginBottom: "0.25rem" }}>
            {extNumber === "system" ? (
              <>{actionText}</>
            ) : (
              <>
                <strong>{extensionName}</strong> {actionText}
              </>
            )}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{activityDate}</div>
        </div>
      </div>
    );
  });
}

export function ActivitiesTabPanel({
  loadingActivities,
  taskActivities,
  extensions,
  onViewAll,
}: Readonly<{
  loadingActivities: boolean;
  taskActivities: any[];
  extensions: ActivityLogExtension[];
  onViewAll: () => void;
}>): React.ReactElement {
  let body: React.ReactNode;
  if (loadingActivities) {
    body = (
      <div style={{ textAlign: "center", padding: "1.5rem" }}>
        <Spinner animation="border" size="sm" />
      </div>
    );
  } else if (taskActivities.length === 0) {
    body = (
      <div
        style={{
          textAlign: "center",
          padding: "1rem",
          color: "#94a3b8",
          fontSize: "0.875rem",
        }}
      >
        No activities found
      </div>
    );
  } else {
    body = (
      <>
        {renderActivityList(taskActivities, extensions)}
        <div style={{ marginTop: "0.75rem", textAlign: "center" }}>
          <Button
            variant="link"
            size="sm"
            onClick={() => onViewAll()}
            style={{
              color: "#4e6fa5",
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            View All
          </Button>
        </div>
      </>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 8,
        padding: "0.75rem",
        border: "1px solid #e2e8f0",
      }}
    >
      {body}
    </div>
  );
}

const actionBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#e0f2fe",
  color: "#0369a1",
  fontSize: "0.75rem",
  fontWeight: 600,
  padding: "2px 10px",
  borderRadius: 999,
  textTransform: "lowercase",
};

function resolveTaskDisplayRef(task: { task_id?: string; id?: string | number } | null | undefined): string {
  if (task?.task_id != null && task.task_id !== "") {
    return String(task.task_id);
  }
  if (task?.id != null && task.id !== "") {
    return `#${task.id}`;
  }
  return "";
}

function activitySummaryVerb(actionLabel: string): string {
  const actionLower = actionLabel.toLowerCase();
  if (actionLower === "updated") {
    return "was updated";
  }
  if (actionLower === "created") {
    return "was created";
  }
  if (actionLower === "deleted") {
    return "was deleted";
  }
  return `was ${actionLabel}`;
}

function ActivityLogChangesBlock({
  changeKeys,
  oldVals,
  newVals,
  extensions,
}: Readonly<{
  changeKeys: string[];
  oldVals: Record<string, unknown> | undefined;
  newVals: Record<string, unknown> | undefined;
  extensions: ActivityLogExtension[];
}>): React.ReactElement | null {
  if (changeKeys.length === 0) {
    return null;
  }
  return (
    <div>
      <div
        style={{
          fontSize: "0.7rem",
          fontWeight: 700,
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginBottom: 8,
        }}
      >
        Changes
      </div>
      <div
        style={{
          backgroundColor: "#f8fafc",
          borderRadius: 8,
          padding: "12px 14px",
          border: "1px solid #e2e8f0",
        }}
      >
        {changeKeys.map((fieldKey, ckIdx) => (
          <div
            key={fieldKey}
            style={{ marginBottom: ckIdx < changeKeys.length - 1 ? 14 : 0 }}
          >
            <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#334155", marginBottom: 8 }}>
              {humanizeActivityFieldKey(fieldKey)}:
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start" }}>
              <div style={{ flex: "1 1 140px", minWidth: 120 }}>
                <span
                  style={{
                    display: "inline-block",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    color: "#b91c1c",
                    backgroundColor: "#fef2f2",
                    padding: "2px 8px",
                    borderRadius: 4,
                    marginBottom: 4,
                  }}
                >
                  Old
                </span>
                <div style={{ fontSize: "0.8125rem", color: "#64748b", wordBreak: "break-word" }}>
                  {formatActivityChangeValueForField(fieldKey, oldVals?.[fieldKey], extensions)}
                </div>
              </div>
              <div style={{ flex: "1 1 140px", minWidth: 120 }}>
                <span
                  style={{
                    display: "inline-block",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    color: "#15803d",
                    backgroundColor: "#f0fdf4",
                    padding: "2px 8px",
                    borderRadius: 4,
                    marginBottom: 4,
                  }}
                >
                  New
                </span>
                <div style={{ fontSize: "0.8125rem", color: "#334155", wordBreak: "break-word" }}>
                  {formatActivityChangeValueForField(fieldKey, newVals?.[fieldKey], extensions)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityLogSidebarCards({
  taskRef,
  taskTitle,
  projectName,
}: Readonly<{
  taskRef: string;
  taskTitle: string;
  projectName: string;
}>): React.ReactElement {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          padding: "12px 14px",
          backgroundColor: "#fff",
        }}
      >
        <div
          style={{
            fontSize: "0.65rem",
            fontWeight: 700,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 8,
          }}
        >
          Related Task
        </div>
        {taskRef ? (
          <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1e293b" }}>{taskRef}</div>
        ) : null}
        {taskTitle ? (
          <div style={{ fontSize: "0.8125rem", color: "#475569", marginTop: 4 }}>{taskTitle}</div>
        ) : (
          <div style={{ fontSize: "0.8125rem", color: "#94a3b8" }}>—</div>
        )}
      </div>
      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          padding: "12px 14px",
          backgroundColor: "#fff",
        }}
      >
        <div
          style={{
            fontSize: "0.65rem",
            fontWeight: 700,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 8,
          }}
        >
          Project
        </div>
        <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1e293b" }}>{projectName}</div>
      </div>
    </div>
  );
}

function ActivityLogModalEntry({
  activity,
  extensions,
}: Readonly<{
  activity: any;
  extensions: ActivityLogExtension[];
}>): React.ReactElement {
  const extNumber = String(activity.extension_number || "");
  const { initials: extensionInitials } = getExtensionDisplay(extensions, extNumber);
  const actionLabel = String(activity.action || "activity");
  const createdAt = activity.created_at || "";
  const task = activity.task;
  const project = activity.project;
  const taskRef = resolveTaskDisplayRef(task);
  const taskTitle = task?.title ? String(task.title) : "";
  const summaryVerb = activitySummaryVerb(actionLabel);
  const summaryLine =
    taskRef && taskTitle
      ? `Task ${taskRef} "${taskTitle}" ${summaryVerb}`
      : activity.description || `${actionLabel} activity`;

  const oldVals =
    activity.old_values && typeof activity.old_values === "object"
      ? (activity.old_values as Record<string, unknown>)
      : undefined;
  const newVals =
    activity.new_values && typeof activity.new_values === "object"
      ? (activity.new_values as Record<string, unknown>)
      : undefined;
  const changeKeys = collectActivityChangeKeys(oldVals, newVals);
  const projectName = project?.name ? String(project.name) : "—";

  return (
    <div
      style={{
        marginBottom: "1.25rem",
        paddingBottom: "1.25rem",
        borderBottom: "1px solid #e2e8f0",
      }}
    >
      <Row className="g-3">
        <Col lg={8}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.8rem",
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {extensionInitials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "8px 12px",
                  marginBottom: 8,
                }}
              >
                <span style={actionBadgeStyle}>{actionLabel}</span>
                <span style={{ fontSize: "0.8125rem", color: "#64748b" }}>
                  {formatActivityDateLong(createdAt)}
                </span>
              </div>
              <div
                style={{
                  fontSize: "0.9375rem",
                  fontWeight: 700,
                  color: "#0f172a",
                  marginBottom: 6,
                  lineHeight: 1.35,
                }}
              >
                {summaryLine}
              </div>
              {activity.description ? (
                <div style={{ fontSize: "0.8125rem", color: "#64748b", marginBottom: 10 }}>
                  {String(activity.description)}
                </div>
              ) : null}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                {extNumber ? (
                  <span
                    style={{
                      fontSize: "0.7rem",
                      padding: "4px 10px",
                      borderRadius: 6,
                      backgroundColor: "#f1f5f9",
                      color: "#475569",
                      fontWeight: 500,
                    }}
                  >
                    Ext: {extNumber}
                  </span>
                ) : null}
                {taskRef ? (
                  <span
                    style={{
                      fontSize: "0.7rem",
                      padding: "4px 10px",
                      borderRadius: 6,
                      backgroundColor: "#dbeafe",
                      color: "#1d4ed8",
                      fontWeight: 500,
                    }}
                  >
                    Task: {taskRef}
                  </span>
                ) : null}
                {project?.name ? (
                  <span
                    style={{
                      fontSize: "0.7rem",
                      padding: "4px 10px",
                      borderRadius: 6,
                      backgroundColor: "#cffafe",
                      color: "#0e7490",
                      fontWeight: 500,
                    }}
                  >
                    Project: {String(project.name)}
                  </span>
                ) : null}
              </div>
              <ActivityLogChangesBlock
                changeKeys={changeKeys}
                oldVals={oldVals}
                newVals={newVals}
                extensions={extensions}
              />
            </div>
          </div>
        </Col>
        <Col lg={4}>
          <ActivityLogSidebarCards taskRef={taskRef} taskTitle={taskTitle} projectName={projectName} />
        </Col>
      </Row>
    </div>
  );
}

export function AllActivitiesModalContent({
  loadingAllActivities,
  pageActivities,
  extensions,
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: Readonly<{
  loadingAllActivities: boolean;
  pageActivities: any[];
  extensions: ActivityLogExtension[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}>): React.ReactElement {
  if (loadingAllActivities) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <Spinner animation="border" />
      </div>
    );
  }
  if (totalItems === 0) {
    return (
      <div style={{ textAlign: "center", padding: "1.5rem", color: "#94a3b8" }}>
        No activities found
      </div>
    );
  }

  return (
    <>
      <div style={{ fontSize: "0.8125rem", color: "#64748b", marginBottom: 12 }}>
        Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalItems)} of{" "}
        {totalItems}
      </div>
      {pageActivities.map((activity: any, idx: number) => (
        <ActivityLogModalEntry
          key={activity.id ?? idx}
          activity={activity}
          extensions={extensions}
        />
      ))}
      {totalPages > 1 ? (
        <div
          className="d-flex flex-wrap align-items-center justify-content-center gap-2 mt-3 pt-3 border-top"
          style={{ borderColor: "#e2e8f0" }}
        >
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            Previous
          </Button>
          <span style={{ fontSize: "0.8125rem", color: "#64748b" }}>
            Page {currentPage} of {totalPages}
          </span>
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </>
  );
}
