import moment from "moment";
import {
  isStoredAsUtcMidnightCalendarDue,
  parseApiDueTimeToTimeInput,
  shouldSuppressDueTimeInListCell,
} from "@utils/plannerTaskDueTime";
import React from "react";
import { Button } from "react-bootstrap";
import { FiSearch } from "react-icons/fi";

/** Lexend-based outline button used across CRM + Planner task listing toolbars. */
export const TASK_LIST_BTN_OUTLINE: React.CSSProperties = {
  backgroundColor: "rgb(255, 255, 255)",
  borderColor: "#8a8a8a",
  color: "#141414",
  textDecoration: "none",
  borderRadius: 4,
  borderWidth: 1,
  borderStyle: "solid",
  verticalAlign: "middle",
  paddingTop: 8,
  paddingBottom: 8,
  paddingLeft: 16,
  paddingRight: 16,
  maxWidth: "100%",
  fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
  fontSize: 12,
  fontWeight: 400,
  letterSpacing: 0,
  lineHeight: "14px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  whiteSpace: "nowrap" as const,
  outline: "none",
  background: "#fff",
};

/** Compact variant for secondary actions in table cells. */
export const TASK_LIST_BTN_COMPACT_CELL: React.CSSProperties = {
  ...TASK_LIST_BTN_OUTLINE,
  paddingTop: 3,
  paddingBottom: 3,
  paddingLeft: 9,
  paddingRight: 9,
  fontSize: 11,
};

export const TASK_LIST_CELL: React.CSSProperties = {
  fontSize: 13,
  color: "#374151",
  fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
  fontWeight: 300,
};

/** Dot colors for priority column (CRM + Planner). */
export const TASK_PRIORITY_DOT_COLORS: Record<string, string> = {
  low: "#22c55e",
  medium: "#f59e0b",
  normal: "#f59e0b",
  high: "#ef4444",
  urgent: "#ef4444",
};

export type TaskCompleteCircleButtonProps = Readonly<{
  isCompleted: boolean;
  title: string;
  disabled?: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
}>;

export function TaskCompleteCircleButton({
  isCompleted,
  title,
  disabled = false,
  onClick,
}: TaskCompleteCircleButtonProps) {
  return (
    <button
      type="button"
      aria-disabled={disabled}
      onClick={onClick}
      title={title}
      style={{
        background: isCompleted ? "#16a34a" : "transparent",
        border: isCompleted ? "1.5px solid #16a34a" : "1.5px solid #9ca3af",
        borderRadius: "50%",
        width: 20,
        height: 20,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
      }}
    >
      {isCompleted && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden>
          <path
            d="M1 4L3.5 6.5L9 1"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

/** True when `due_time` from the API should affect the list cell (non-empty after parse). */
export function isTaskDueTimePrefilled(dueTimeRaw: string | null | undefined): boolean {
  return parseApiDueTimeToTimeInput(dueTimeRaw).length > 0;
}

function formatHhMmTo12Hour(hhMm: string): string {
  const parsed = moment(hhMm, "HH:mm", true);
  return parsed.isValid() ? parsed.format("h:mm A") : hhMm;
}

function taskDueDateListTimeClock12h(
  dueDateIso: string,
  dueTimeRaw: string | null | undefined,
  m: moment.Moment,
): string {
  const useExplicitDueTime =
    isTaskDueTimePrefilled(dueTimeRaw) &&
    !shouldSuppressDueTimeInListCell(dueDateIso, dueTimeRaw);
  if (useExplicitDueTime) {
    const hhMm = parseApiDueTimeToTimeInput(dueTimeRaw);
    if (hhMm === "") return "";
    return formatHhMmTo12Hour(hhMm);
  }
  const dueHasClockInIso = /T\d{2}:\d{2}/.test(String(dueDateIso).trim());
  if (dueHasClockInIso && !isStoredAsUtcMidnightCalendarDue(dueDateIso)) {
    return m.format("h:mm A");
  }
  return "";
}

/** Visual tone for due-date cells (use with shared or page SCSS modifiers). */
export type TaskDueDateCellTone = "empty" | "default" | "overdue";

/** Date + optional time in 12-hour form; omits clock for UTC-midnight “date-only” dues unless a real `due_time` is present. */
export function formatTaskDueDateCellParts(
  dueDateIso: string | null | undefined,
  rowStatus: "pending" | "completed" | "overdue",
  dueTimeRaw?: string | null,
): { label: string; color: string; fontWeight: number; tone: TaskDueDateCellTone } {
  if (!dueDateIso) {
    return { label: "—", color: "#9ca3af", fontWeight: 300, tone: "empty" };
  }
  const m = moment(dueDateIso);
  const overdue = m.isBefore(moment()) && rowStatus !== "completed";
  const isToday = m.isSame(moment(), "day");
  const isTomorrow = m.isSame(moment().add(1, "day"), "day");
  const timeClock = taskDueDateListTimeClock12h(dueDateIso, dueTimeRaw, m);
  let label: string;
  if (isToday) {
    label = timeClock ? `Today at ${timeClock}` : "Today";
  } else if (isTomorrow) {
    label = timeClock ? `Tomorrow at ${timeClock}` : "Tomorrow";
  } else {
    label = timeClock
      ? `${m.format("D MMMM YYYY")} at ${timeClock}`
      : m.format("D MMMM YYYY");
  }
  return {
    label,
    color: overdue ? "#ef4444" : "#374151",
    fontWeight: overdue ? 500 : 300,
    tone: overdue ? "overdue" : "default",
  };
}

export type TaskListingSearchRowProps = Readonly<{
  search: string;
  onSearchChange: (value: string) => void;
  onSubmitSearch: () => void;
  placeholder?: string;
  editColumnsSlot?: React.ReactNode;
  wrapperStyle?: React.CSSProperties;
  wrapperClassName?: string;
}>;

export function TaskListingSearchRow({
  search,
  onSearchChange,
  onSubmitSearch,
  placeholder = "Search task title and notes",
  editColumnsSlot,
  wrapperStyle,
  wrapperClassName,
}: TaskListingSearchRowProps) {
  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 16px",
    backgroundColor: "#fff",
    flexShrink: 0,
    gap: 12,
    ...wrapperStyle,
  };
  return (
    <div className={wrapperClassName} style={rowStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 0, flexGrow: 1 }}>
        <div style={{ position: "relative" }}>
          <FiSearch
            size={14}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#9ca3af",
              pointerEvents: "none",
            }}
          />
          <input
            className="task-search-input"
            type="text"
            placeholder={placeholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSubmitSearch();
            }}
            style={{
              height: 36,
              width: 260,
              padding: "0 12px 0 34px",
              border: "1px solid #d1d5db",
              borderRadius: "20px 0 0 20px",
              borderRight: "none",
              fontSize: 13,
              color: "#374151",
              outline: "none",
              backgroundColor: "#fff",
              fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
            }}
          />
        </div>
        <Button
          variant="outline-secondary"
          onClick={onSubmitSearch}
          style={{
            height: 36,
            padding: "0 14px",
            borderRadius: "0 20px 20px 0",
            border: "1px solid #d1d5db",
            borderLeft: "none",
            backgroundColor: "#fff",
            color: "#6b7280",
            display: "inline-flex",
            alignItems: "center",
            fontSize: 13,
            fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
            outline: "none",
            boxShadow: "none",
          }}
        >
          <FiSearch size={15} />
        </Button>
      </div>
      {editColumnsSlot}
    </div>
  );
}

const TASK_AVATAR_COLORS = [
  "#4299e1", "#48bb78", "#ed64a6", "#f6ad55",
  "#667eea", "#fc8181", "#38b2ac", "#9f7aea",
];

function getTaskAvatarColor(name: string): string {
  if (!name) return TASK_AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TASK_AVATAR_COLORS[Math.abs(hash) % TASK_AVATAR_COLORS.length];
}

export type TaskListingAssigneeCellProps = Readonly<{
  label: string;
}>;

export function TaskListingAssigneeCell({ label }: TaskListingAssigneeCellProps) {
  if (!label) {
    return <span style={{ ...TASK_LIST_CELL, color: "#9ca3af" }}>—</span>;
  }
  const initial = label.charAt(0).toUpperCase();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: getTaskAvatarColor(label),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          fontWeight: 700,
          color: "#fff",
          flexShrink: 0,
        }}
      >
        {initial}
      </div>
      <span
        style={{
          ...TASK_LIST_CELL,
          maxWidth: 130,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          display: "inline-block",
        }}
        title={label}
      >
        {label}
      </span>
    </div>
  );
}

export function buildTaskListingPageStyleTag(options?: {
  showTitleHoverEditButton?: boolean;
  extraRules?: string;
}): string {
  const hoverRules = options?.showTitleHoverEditButton
    ? `
          .tasks-page .task-title-cell .ptl-title-edit-btn { visibility: hidden; }
          .tasks-page .task-title-cell:hover .ptl-title-edit-btn { visibility: visible; }
  `
    : "";
  const extra = options?.extraRules ?? "";
  return `
            body, .tasks-page, .tasks-page * { box-sizing: border-box; }
            .tasks-page .gt-toolbar-container { display: none !important; }
            ${hoverRules}
            .tasks-page .generic-table-card,
            .tasks-page .generic-table-container,
            .tasks-page .card-body {
              border-radius: 0 !important;
              box-shadow: none !important;
              border: none !important;
              background: #fff !important;
            }
            ${extra}
  `;
}
