"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import moment from "moment-timezone";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  ChevronDown,
  Mail,
  Phone,
  Share2,
  X,
  List,
  ChevronsUp,
  ChevronsDown,
} from "lucide-react";
import type { CalendarEvent as ApiCalendarEvent, TasksCalendarData } from "@utils/work-planner";
import ViewPlannerTaskSidebar, {
  type ViewPlannerTaskSidebarProps,
} from "@components/ViewPlannerTaskSidebar";
import { getTask } from "@utils/tasks";
import { useHierarchyData } from "@components/filters/useHierarchyData";
import { ModuleSlug } from "@utils/Helper";

const FONT    = "'Lexend Deca', Helvetica, Arial, sans-serif";
const PRIMARY = "#141414";
const PURPLE  = "#6c41c9";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TaskDue {
  date: Date;
  todos: string[];
  emails: string[];
  calls: string[];
  linkedin: string[];
}

interface CalendarEvent {
  date: Date;
  hour: number;       // 0-23
  minute: number;     // 0 or 30
  durationMins: number;
  title: string;
  type: "todo" | "email" | "call" | "linkedin";
  taskId?: string | number | null;
}

type EventType = CalendarEvent["type"];

const CALENDAR_TASK_WITH_RELATIONS = [
  "project",
  "status",
  "assignees",
  "labels",
  "comments",
  "parent",
  "parent.status",
  "parent.project",
  "children",
  "children.status",
  "children.assignees",
] as const;

function resolveCalendarTaskFetchId(ev: ApiCalendarEvent): string | number | null {
  const nested = ev.task as Record<string, unknown> | null | undefined;
  const nestedId = nested?.id;
  if (nestedId != null && nestedId !== "") return nestedId as string | number;
  const tid = String(ev.task_id ?? "").trim();
  if (tid) return tid;
  return null;
}

function mapPriorityToType(priority: string | undefined): EventType {
  const p = String(priority ?? "").toLowerCase();
  if (p.includes("email")) return "email";
  if (p.includes("call") || p.includes("phone")) return "call";
  if (p.includes("linkedin") || p.includes("linked")) return "linkedin";
  return "todo";
}

function apiEventToInternal(ev: ApiCalendarEvent): CalendarEvent {
  const startDate = new Date(ev.start);
  const endDate = new Date(ev.end);
  const durationMs = endDate.getTime() - startDate.getTime();
  const durationMins = Math.max(1, Math.round(durationMs / 60000));
  return {
    date: new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()),
    hour: startDate.getHours(),
    minute: startDate.getMinutes(),
    durationMins,
    title: ev.title,
    type: mapPriorityToType(ev.priority),
    taskId: resolveCalendarTaskFetchId(ev),
  };
}

function apiEventsToTasks(events: ApiCalendarEvent[]): TaskDue[] {
  const byDate = new Map<string, TaskDue>();
  for (const ev of events) {
    const d = new Date(ev.start);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const type = mapPriorityToType(ev.priority);
    let bucket = byDate.get(key);
    if (!bucket) {
      bucket = {
        date: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
        todos: [],
        emails: [],
        calls: [],
        linkedin: [],
      };
      byDate.set(key, bucket);
    }
    if (type === "todo") bucket.todos.push(ev.title);
    else if (type === "email") bucket.emails.push(ev.title);
    else if (type === "call") bucket.calls.push(ev.title);
    else bucket.linkedin.push(ev.title);
  }
  return Array.from(byDate.values());
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}

function startOfDayCalendar(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isWeekendDay(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function endOfMonthCalendar(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function startOfMonthCalendar(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonthsCalendar(d: Date, deltaMonths: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + deltaMonths, 1);
}

function parseDateInputLocal(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const day = Number(m[3]);
  const dt = new Date(y, mo, day);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== day) return null;
  return dt;
}

function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

function eachDayInclusive(start: Date, end: Date): Date[] {
  const a = startOfDayCalendar(start);
  const b = startOfDayCalendar(end);
  if (a.getTime() > b.getTime()) return [];
  const out: Date[] = [];
  let cur = new Date(a);
  while (cur.getTime() <= b.getTime()) {
    out.push(startOfDayCalendar(cur));
    cur = addDays(cur, 1);
  }
  return out;
}

function formatHeaderRangeClosed(start: Date, end: Date): string {
  const s = start;
  const e = end;
  if (sameDay(s, e)) {
    return `${DAYS[s.getDay()]} ${s.getDate()} ${MONTHS[s.getMonth()]} ${s.getFullYear()}`;
  }
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    return `${s.getDate()} – ${e.getDate()} ${MONTHS[s.getMonth()]} ${s.getFullYear()}`;
  }
  if (s.getFullYear() === e.getFullYear()) {
    return `${s.getDate()} ${MONTHS[s.getMonth()]} – ${e.getDate()} ${MONTHS[e.getMonth()]} ${s.getFullYear()}`;
  }
  return `${s.getDate()} ${MONTHS[s.getMonth()]} ${s.getFullYear()} – ${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}`;
}

function formatDayLabel(d: Date): string {
  return `${DAYS[d.getDay()]}  ${d.getDate()}`;
}

function formatDateFull(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function getBrowserIanaTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

function compareTimeZonesByOffset(a: string, b: string): number {
  const off = moment.tz(a).utcOffset() - moment.tz(b).utcOffset();
  if (off !== 0) return off;
  return a.localeCompare(b);
}

const ALL_IANA_TIMEZONES_SORTED: string[] = moment.tz.names().slice().sort(compareTimeZonesByOffset);

function formatTimeZoneButtonLabel(iana: string): string {
  const tail = iana.includes("/") ? iana.split("/").pop() ?? iana : iana;
  const place = tail.replaceAll("_", " ");
  return `UTC${moment.tz(iana).format("Z")} ${place}`;
}

interface TimeZoneMenuProps {
  value: string;
  onChange: (iana: string) => void;
  btnBase: React.CSSProperties;
}

function TimeZoneMenu({ value, onChange, btnBase }: Readonly<TimeZoneMenuProps>) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredZones = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return ALL_IANA_TIMEZONES_SORTED;
    return ALL_IANA_TIMEZONES_SORTED.filter((z) => z.toLowerCase().includes(q));
  }, [filter]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFilter("");
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setFilter("");
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = useCallback(
    (iana: string) => {
      onChange(iana);
      setOpen(false);
      setFilter("");
    },
    [onChange],
  );

  return (
    <div ref={wrapRef} style={{ position: "relative", flexShrink: 0 }}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
        style={{ ...btnBase, fontWeight: 600, fontSize: "14px", lineHeight: "18px", border: "none", padding: "7px 8px", gap: "6px", maxWidth: "min(340px, 100%)" }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {formatTimeZoneButtonLabel(value)}
        </span>
        <ChevronDown size={13} style={{ flexShrink: 0 }} />
      </button>
      {open && (
        <div
          aria-label="Time zone"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: "4px",
            minWidth: "min(360px, calc(100vw - 48px))",
            maxHeight: "280px",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#fff",
            border: "1px solid #e0e0e0",
            borderRadius: "6px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            zIndex: 120,
            overflow: "hidden",
          }}
        >
          <input
            ref={inputRef}
            type="search"
            placeholder="Search time zones…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Filter time zones"
            style={{
              border: "none",
              borderBottom: "1px solid #eee",
              padding: "10px 12px",
              fontSize: "13px",
              fontFamily: FONT,
              outline: "none",
            }}
          />
          <div style={{ overflowY: "auto", flex: 1 }}>
            {filteredZones.length === 0 ? (
              <div style={{ padding: "12px", fontSize: "13px", color: "#888" }}>No matches</div>
            ) : (
              filteredZones.map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => pick(z)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 12px",
                    fontSize: "12px",
                    fontFamily: FONT,
                    border: "none",
                    background: z === value ? "#f0edfc" : "#fff",
                    cursor: "pointer",
                    color: PRIMARY,
                  }}
                >
                  {formatTimeZoneButtonLabel(z)}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const HOURS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`);
const CELL_H = 64; // px per hour
const TIME_COL_W = 64;
const DAY_COL_MIN_WHEN_SCROLL = 72;

// ─── Sample data ─────────────────────────────────────────────────────────────

const SAMPLE_TASKS: TaskDue[] = [
  {
    date: new Date(2026, 1, 24), // Tue 24 Feb
    todos: ["purchasing of 5 drives"],
    emails: [],
    calls: [],
    linkedin: [],
  },
  {
    date: new Date(2026, 1, 25), // Wed 25 Feb
    todos: [],
    emails: ["AI bot offer"],
    calls: [],
    linkedin: [],
  },
];

const CALENDAR_EVENTS: CalendarEvent[] = [
  {
    date: new Date(2026, 1, 24), // Tue 24 Feb
    hour: 13, minute: 0, durationMins: 60,
    title: "purchasing of 5 drives",
    type: "todo",
  },
  {
    date: new Date(2026, 1, 25), // Wed 25 Feb
    hour: 13, minute: 0, durationMins: 60,
    title: "AI bot offer",
    type: "email",
  },
];

// ─── Button base style ────────────────────────────────────────────────────────

const btnBase: React.CSSProperties = {
  cursor: "pointer",
  whiteSpace: "nowrap",
  color: PRIMARY,
  fontFamily: FONT,
  fontSize: "12px",
  fontWeight: 300,
  letterSpacing: "0px",
  lineHeight: "14px",
  backgroundColor: "#fff",
  border: "1px solid #adadad",
  borderRadius: "4px",
  padding: "7px 12px",
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
};

// ─── Task popover ─────────────────────────────────────────────────────────────

interface TaskPopoverProps {
  task: TaskDue;
  anchorRect: DOMRect;
  onClose: () => void;
}

function TaskPopover({ task, anchorRect, onClose }: Readonly<TaskPopoverProps>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const totalTasks = task.todos.length + task.emails.length + task.calls.length + task.linkedin.length;

  // Flip above if near bottom
  const top = anchorRect.bottom + 6 > window.innerHeight - 200
    ? anchorRect.top - 6 - 280
    : anchorRect.bottom + 6;

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        top,
        left: Math.min(anchorRect.left, window.innerWidth - 316),
        zIndex: 1000,
        backgroundColor: "#fff",
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
        width: "300px",
        fontFamily: FONT,
      }}
    >
      <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: PRIMARY, marginBottom: "2px" }}>
            {totalTasks} task{totalTasks === 1 ? "" : "s"} due
          </div>
          <div style={{ fontSize: "11px", color: "#666", fontWeight: 300 }}>{formatDateFull(task.date)}</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#888", padding: "2px", display: "flex" }}>
          <X size={14} />
        </button>
      </div>

      <div style={{ padding: "8px 0 12px" }}>
        {(
          [
            { label: "To-dos",    items: task.todos,    icon: <List     size={13} color="#666" /> },
            { label: "Emails",    items: task.emails,   icon: <Mail     size={13} color="#666" /> },
            { label: "Calls",     items: task.calls,    icon: <Phone    size={13} color="#666" /> },
            { label: "LinkedIn",  items: task.linkedin, icon: <Share2 size={13} color="#666" /> },
          ] as { label: string; items: string[]; icon: React.ReactNode }[]
        ).map((section, si) => (
          <React.Fragment key={section.label}>
            {si > 0 && <div style={{ height: "1px", backgroundColor: "#f5f5f5", margin: "6px 0" }} />}
            <div style={{ padding: "6px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                {section.icon}
                <span style={{ fontSize: "12px", fontWeight: 700, color: PRIMARY }}>{section.label}</span>
              </div>
              {section.items.length > 0
                ? section.items.map((t, i) => (
                    <div key={`${section.label}-${t}-${i}`} style={{ fontSize: "11px", color: PRIMARY, paddingLeft: "19px", marginBottom: "2px" }}>{t}</div>
                  ))
                : <div style={{ fontSize: "11px", color: "#888", paddingLeft: "19px" }}>
                    You&apos;re all caught up on {section.label.toLowerCase()} tasks
                  </div>
              }
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/** Events in the same hour row that share a start minute overlap if drawn full-width; group for stacked (new-line) layout. */
function groupCalendarEventsByStartMinute(events: CalendarEvent[]): Map<number, CalendarEvent[]> {
  const byMinute = new Map<number, CalendarEvent[]>();
  for (const ev of events) {
    const list = byMinute.get(ev.minute) ?? [];
    list.push(ev);
    byMinute.set(ev.minute, list);
  }
  return byMinute;
}

function calendarEventStableKey(ev: CalendarEvent, dayMs: number, hourIdx: number, slotIndex: number): string {
  const id = ev.taskId != null && ev.taskId !== "" ? String(ev.taskId) : "no-id";
  return `${id}-${ev.title}-${hourIdx}-${ev.minute}-${dayMs}-${slotIndex}`;
}

// ─── Event chip in time grid ──────────────────────────────────────────────────

const EVENT_COLORS: Record<CalendarEvent["type"], { bg: string; border: string; icon: React.ReactNode }> = {
  todo:     { bg: "#EFEEFD", border: "#7D53E9", icon: <List  size={11} color={PURPLE} /> },
  email:    { bg: "#EFEEFD", border: "#7D53E9", icon: <Mail  size={11} color={PURPLE} /> },
  call:     { bg: "#EFEEFD", border: "#7D53E9", icon: <Phone size={11} color={PURPLE} /> },
  linkedin: { bg: "#EFEEFD", border: "#7D53E9", icon: <Share2 size={11} color={PURPLE} /> },
};

interface CalendarEventChipProps {
  ev: CalendarEvent;
  onOpenTask: (ev: CalendarEvent) => void | Promise<void>;
  /** When true, chip is one row in a vertical stack with siblings (same start minute). */
  stackGroup?: boolean;
  /** Vertical offset inside the hour cell (ignored when stackGroup — parent stack sets top). */
  topPx: number;
}

function CalendarEventChip({
  ev,
  onOpenTask,
  stackGroup = false,
  topPx,
}: Readonly<CalendarEventChipProps>) {
  const colors = EVENT_COLORS[ev.type];
  const canOpenTask = ev.taskId != null;
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!canOpenTask) return;
    Promise.resolve(onOpenTask(ev)).catch((err: unknown) => console.error(err));
  };
  const positionStyle: React.CSSProperties = stackGroup
    ? {
        position: "relative",
        alignSelf: "stretch",
        width: "100%",
        minHeight: 36,
        flexShrink: 0,
        pointerEvents: "auto",
      }
    : {
        position: "absolute",
        top: topPx,
        left: "4px",
        right: "4px",
        height: "40px",
      };
  return (
    <button
      type="button"
      onClick={handleClick}
      title={canOpenTask ? ev.title : undefined}
      style={{
        ...positionStyle,
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: "4px",
        padding: "4px 6px",
        display: "flex",
        alignItems: "flex-start",
        gap: "5px",
        overflow: "hidden",
        cursor: canOpenTask ? "pointer" : "default",
        zIndex: 2,
        font: "inherit",
        textAlign: "left",
      }}
    >
      <span style={{ marginTop: "1px", flexShrink: 0 }}>{colors.icon}</span>
      <span style={{ fontSize: "12px", fontWeight: 600, lineHeight: "22px", color: PRIMARY, fontFamily: FONT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {ev.title}
      </span>
    </button>
  );
}

function renderCalendarHourColumnChips(
  eventsThisHour: CalendarEvent[],
  dayMs: number,
  hourIdx: number,
  onOpenTask: (ev: CalendarEvent) => void | Promise<void>,
): React.ReactNode {
  const byMinute = groupCalendarEventsByStartMinute(eventsThisHour);
  return Array.from(byMinute.entries()).map(([minute, evs]) => {
    const topPx = (minute / 60) * CELL_H;
    const useStack = evs.length > 1;
    const chips = evs.map((ev, slotIndex) => (
      <CalendarEventChip
        key={calendarEventStableKey(ev, dayMs, hourIdx, slotIndex)}
        ev={ev}
        onOpenTask={onOpenTask}
        stackGroup={useStack}
        topPx={topPx}
      />
    ));
    const groupKey = `${dayMs}-${hourIdx}-${minute}`;
    if (useStack) {
      return (
        <div
          key={groupKey}
          style={{
            position: "absolute",
            top: topPx,
            left: 4,
            right: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            gap: 4,
            pointerEvents: "none",
          }}
        >
          {chips}
        </div>
      );
    }
    return <React.Fragment key={groupKey}>{chips}</React.Fragment>;
  });
}

interface CalendarHourRowProps {
  hourLabel: string;
  hourIdx: number;
  days: Date[];
  gridTemplateColumns: string;
  getEventsForDay: (day: Date) => CalendarEvent[];
  onOpenTask: (ev: CalendarEvent) => void | Promise<void>;
}

function CalendarHourRow({
  hourLabel,
  hourIdx,
  days,
  gridTemplateColumns,
  getEventsForDay,
  onOpenTask,
}: Readonly<CalendarHourRowProps>) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns,
        height: `${CELL_H}px`,
        borderBottom: "1px solid #f0f0f0",
        position: "relative",
      }}
    >
      <div
        style={{
          borderRight: "1px solid #e5e5e5",
          padding: "4px 8px 0 0",
          textAlign: "right",
          fontSize: "11px",
          color: "#999",
          fontFamily: FONT,
          fontWeight: 300,
          userSelect: "none",
          flexShrink: 0,
        }}
      >
        {hourLabel}
      </div>

      {days.map((day) => {
        const eventsThisHour = getEventsForDay(day).filter((ev) => ev.hour === hourIdx);
        const dayMs = day.getTime();
        return (
          <div
            key={day.toISOString()}
            style={{ borderRight: "1px solid #f0f0f0", position: "relative" }}
          >
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: 0,
                right: 0,
                borderTop: "1px dashed #ebebeb",
                pointerEvents: "none",
              }}
            />
            {renderCalendarHourColumnChips(eventsThisHour, dayMs, hourIdx, onOpenTask)}
          </div>
        );
      })}
    </div>
  );
}

export type CalendarRangeMode = "week" | "this_month" | "last_month" | "custom";

const RANGE_MODE_OPTIONS: { value: CalendarRangeMode; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "custom", label: "Custom Range" },
];

interface CalendarRangeModeSelectProps {
  value: CalendarRangeMode;
  onChange: (mode: CalendarRangeMode) => void;
  btnBase: React.CSSProperties;
}

function calendarNavBackAriaLabel(mode: CalendarRangeMode): string {
  switch (mode) {
    case "this_month":
    case "last_month":
      return "Previous month";
    case "custom":
      return "Previous range";
    default:
      return "Previous week";
  }
}

function calendarNavForwardAriaLabel(mode: CalendarRangeMode): string {
  switch (mode) {
    case "this_month":
    case "last_month":
      return "Next month";
    case "custom":
      return "Next range";
    default:
      return "Next week";
  }
}

function CalendarRangeModeSelect({
  value,
  onChange,
  btnBase,
}: Readonly<CalendarRangeModeSelectProps>) {
  return (
    <select
      aria-label="Calendar range"
      value={value}
      onChange={(e) => onChange(e.target.value as CalendarRangeMode)}
      style={{
        ...btnBase,
       
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      {RANGE_MODE_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

interface CalendarRangeDerivedParams {
  rangeMode: CalendarRangeMode;
  weekStart: Date;
  hideWeekends: boolean;
  monthAnchor: Date;
  customStartStr: string;
  customEndStr: string;
}

interface CalendarRangeComputation {
  fetchStart: Date;
  fetchEnd: Date;
  rawDays: Date[];
  title: string;
}

function weekViewDayCount(hideWeekends: boolean): number {
  return hideWeekends ? 5 : 7;
}

function computeWeekRange(p: Readonly<CalendarRangeDerivedParams>): CalendarRangeComputation {
  const fetchStart = p.weekStart;
  const fetchEnd = addDays(p.weekStart, 6);
  const n = weekViewDayCount(p.hideWeekends);
  const rawDays = Array.from({ length: n }, (_, i) => addDays(p.weekStart, i));
  return {
    fetchStart,
    fetchEnd,
    rawDays,
    title: formatHeaderRangeClosed(fetchStart, fetchEnd),
  };
}

function computeMonthRange(p: Readonly<CalendarRangeDerivedParams>): CalendarRangeComputation {
  const ms = startOfMonthCalendar(p.monthAnchor);
  const me = endOfMonthCalendar(p.monthAnchor);
  return {
    fetchStart: ms,
    fetchEnd: me,
    rawDays: eachDayInclusive(ms, me),
    title: `${MONTHS[p.monthAnchor.getMonth()]} ${p.monthAnchor.getFullYear()}`,
  };
}

function orderDayRangeInclusive(a: Date, b: Date): { start: Date; end: Date } {
  const s0 = startOfDayCalendar(a);
  const e0 = startOfDayCalendar(b);
  if (s0.getTime() > e0.getTime()) {
    return { start: e0, end: s0 };
  }
  return { start: s0, end: e0 };
}

function computeCustomRange(
  p: Readonly<CalendarRangeDerivedParams>,
  fallbackWs: Date,
): CalendarRangeComputation {
  const parsedA = parseDateInputLocal(p.customStartStr);
  const parsedB = parseDateInputLocal(p.customEndStr);
  if (!parsedA || !parsedB) {
    const fetchStart = fallbackWs;
    const fetchEnd = addDays(fallbackWs, 6);
    const n = weekViewDayCount(p.hideWeekends);
    const rawDays = Array.from({ length: n }, (_, i) => addDays(fallbackWs, i));
    return {
      fetchStart,
      fetchEnd,
      rawDays,
      title: "Choose start and end date",
    };
  }
  const { start, end } = orderDayRangeInclusive(parsedA, parsedB);
  return {
    fetchStart: start,
    fetchEnd: end,
    rawDays: eachDayInclusive(start, end),
    title: formatHeaderRangeClosed(start, end),
  };
}

function computeDefaultRange(p: Readonly<CalendarRangeDerivedParams>): CalendarRangeComputation {
  const fetchStart = p.weekStart;
  const fetchEnd = addDays(p.weekStart, 6);
  const n = weekViewDayCount(p.hideWeekends);
  const rawDays = Array.from({ length: n }, (_, i) => addDays(p.weekStart, i));
  return { fetchStart, fetchEnd, rawDays, title: "" };
}

function computeRawCalendarRange(
  p: Readonly<CalendarRangeDerivedParams>,
  fallbackWs: Date,
): CalendarRangeComputation {
  switch (p.rangeMode) {
    case "week":
      return computeWeekRange(p);
    case "this_month":
    case "last_month":
      return computeMonthRange(p);
    case "custom":
      return computeCustomRange(p, fallbackWs);
    default:
      return computeDefaultRange(p);
  }
}

function applyHideWeekendsToDays(rawDays: Date[], hideWeekends: boolean): Date[] {
  if (!hideWeekends || rawDays.length === 0) {
    return rawDays;
  }
  const filtered = rawDays.filter((d) => !isWeekendDay(d));
  return filtered.length > 0 ? filtered : rawDays;
}

function computeCalendarRangeDerived(
  p: Readonly<CalendarRangeDerivedParams>,
): {
  fetchStart: Date;
  fetchEnd: Date;
  days: Date[];
  headerTitle: string;
} {
  const fallbackWs = getWeekStart(new Date());
  const { fetchStart, fetchEnd, rawDays, title } = computeRawCalendarRange(p, fallbackWs);
  const displayDays = applyHideWeekendsToDays(rawDays, p.hideWeekends);
  const daysOut = displayDays.length > 0 ? displayDays : [startOfDayCalendar(new Date())];

  return {
    fetchStart,
    fetchEnd,
    days: daysOut,
    headerTitle: title,
  };
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export type FetchCalendarDataFn = (
  start: Date,
  end: Date,
  timeZone: string,
) => Promise<TasksCalendarData | null>;

interface SchedulePageProps {
  fetchCalendarData?: FetchCalendarDataFn;
}

export default function SchedulePage({ fetchCalendarData }: Readonly<SchedulePageProps> = {}) {
  const today = new Date();
  const [sidebarOpen,    setSidebarOpen]    = useState(true);
  const [weekStart,      setWeekStart]      = useState<Date>(getWeekStart(new Date()));
  const [hideWeekends,   setHideWeekends]   = useState(true);
  const [allDayExpanded, setAllDayExpanded] = useState(false); // false = collapsed (shows event counts)
  const [activePopover,  setActivePopover]  = useState<{ task: TaskDue; rect: DOMRect } | null>(null);
  const [apiTasks,       setApiTasks]       = useState<TaskDue[] | null>(null);
  const [apiEvents,      setApiEvents]      = useState<CalendarEvent[] | null>(null);
  const [loading,        setLoading]        = useState(false);
  const [calendarTimeZone, setCalendarTimeZone] = useState<string>(() => {
    const tz = getBrowserIanaTimeZone();
    return ALL_IANA_TIMEZONES_SORTED.includes(tz) ? tz : "UTC";
  });
  const [showViewTaskSidebar, setShowViewTaskSidebar] = useState(false);
  const [viewSidebarTask, setViewSidebarTask] = useState<Record<string, unknown> | null>(null);
  const [rangeMode, setRangeMode] = useState<CalendarRangeMode>("week");
  const [monthAnchor, setMonthAnchor] = useState<Date>(() => startOfMonthCalendar(new Date()));
  const [customStartStr, setCustomStartStr] = useState(() => {
    const ws = getWeekStart(new Date());
    return toDateInputValue(ws);
  });
  const [customEndStr, setCustomEndStr] = useState(() => {
    const ws = getWeekStart(new Date());
    return toDateInputValue(addDays(ws, 6));
  });

  const { hierarchyDataExtensions } = useHierarchyData(ModuleSlug.USER_DIRECTORY);

  const fetchRef = useRef(fetchCalendarData);
  fetchRef.current = fetchCalendarData;

  const { fetchStart, fetchEnd, days, headerTitle } = useMemo(
    () =>
      computeCalendarRangeDerived({
        rangeMode,
        weekStart,
        hideWeekends,
        monthAnchor,
        customStartStr,
        customEndStr,
      }),
    [rangeMode, weekStart, hideWeekends, monthAnchor, customStartStr, customEndStr],
  );

  const visibleDayCount = days.length;
  const calendarGridTemplateColumns = useMemo(() => {
    if (visibleDayCount > 7) {
      const repeatPart =
        "repeat(" +
        String(visibleDayCount) +
        ", minmax(" +
        String(DAY_COL_MIN_WHEN_SCROLL) +
        "px, 1fr))";
      return String(TIME_COL_W) + "px " + repeatPart;
    }
    return String(TIME_COL_W) + "px repeat(" + String(visibleDayCount) + ", 1fr)";
  }, [visibleDayCount]);
  const calendarGridMinWidthPx =
    visibleDayCount > 7 ? TIME_COL_W + visibleDayCount * DAY_COL_MIN_WHEN_SCROLL : undefined;

  const calendarDataKey = useMemo(() => {
    return (
      toDateInputValue(fetchStart) +
      "_" +
      toDateInputValue(fetchEnd) +
      "_" +
      calendarTimeZone
    );
  }, [fetchStart, fetchEnd, calendarTimeZone]);

  useEffect(() => {
    const fetch = fetchRef.current;
    if (!fetch) return;
    let cancelled = false;
    setLoading(true);
    fetch(fetchStart, fetchEnd, calendarTimeZone)
      .then((data) => {
        if (cancelled || !data?.events) return;
        setApiEvents(data.events.map(apiEventToInternal));
        setApiTasks(apiEventsToTasks(data.events));
      })
      .catch(() => {
        if (!cancelled) {
          setApiEvents(null);
          setApiTasks(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [calendarDataKey, fetchStart, fetchEnd, calendarTimeZone]);

  const handleRangeModeChange = useCallback((mode: CalendarRangeMode) => {
    setRangeMode(mode);
    const now = new Date();
    if (mode === "week") {
      setWeekStart(getWeekStart(now));
    } else if (mode === "this_month") {
      setMonthAnchor(startOfMonthCalendar(now));
    } else if (mode === "last_month") {
      setMonthAnchor(addMonthsCalendar(startOfMonthCalendar(now), -1));
    } else {
      const ws = getWeekStart(weekStart);
      setCustomStartStr(toDateInputValue(ws));
      setCustomEndStr(toDateInputValue(addDays(ws, 6)));
    }
  }, [weekStart]);

  const navigateCalendarBack = useCallback(() => {
    if (rangeMode === "week") {
      setWeekStart((w) => addDays(w, -7));
    } else if (rangeMode === "this_month" || rangeMode === "last_month") {
      setMonthAnchor((m) => addMonthsCalendar(m, -1));
    } else {
      const start = parseDateInputLocal(customStartStr);
      const end = parseDateInputLocal(customEndStr);
      if (!start || !end) return;
      let s = startOfDayCalendar(start);
      let e = startOfDayCalendar(end);
      if (s.getTime() > e.getTime()) {
        const t = s;
        s = e;
        e = t;
      }
      const spanDays = Math.round((e.getTime() - s.getTime()) / 86400000);
      const ns = addDays(s, -7);
      setCustomStartStr(toDateInputValue(ns));
      setCustomEndStr(toDateInputValue(addDays(ns, spanDays)));
    }
  }, [customEndStr, customStartStr, rangeMode]);

  const navigateCalendarForward = useCallback(() => {
    if (rangeMode === "week") {
      setWeekStart((w) => addDays(w, 7));
    } else if (rangeMode === "this_month" || rangeMode === "last_month") {
      setMonthAnchor((m) => addMonthsCalendar(m, 1));
    } else {
      const start = parseDateInputLocal(customStartStr);
      const end = parseDateInputLocal(customEndStr);
      if (!start || !end) return;
      let s = startOfDayCalendar(start);
      let e = startOfDayCalendar(end);
      if (s.getTime() > e.getTime()) {
        const t = s;
        s = e;
        e = t;
      }
      const spanDays = Math.round((e.getTime() - s.getTime()) / 86400000);
      const ns = addDays(s, 7);
      setCustomStartStr(toDateInputValue(ns));
      setCustomEndStr(toDateInputValue(addDays(ns, spanDays)));
    }
  }, [customEndStr, customStartStr, rangeMode]);

  const goToday = useCallback(() => {
    const now = new Date();
    if (rangeMode === "week") {
      setWeekStart(getWeekStart(now));
    } else if (rangeMode === "this_month") {
      setMonthAnchor(startOfMonthCalendar(now));
    } else if (rangeMode === "last_month") {
      setMonthAnchor(addMonthsCalendar(startOfMonthCalendar(now), -1));
    } else {
      const ws = getWeekStart(now);
      setCustomStartStr(toDateInputValue(ws));
      setCustomEndStr(toDateInputValue(addDays(ws, 6)));
    }
  }, [rangeMode]);

  const tasks = apiTasks ?? SAMPLE_TASKS;
  const events = apiEvents ?? CALENDAR_EVENTS;
  const getTaskForDay   = (day: Date) => tasks.find((t) => sameDay(t.date, day));
  const getEventsForDay = (day: Date) => events.filter((e) => sameDay(e.date, day));

  const getEventCountForDay = (day: Date): number => getEventsForDay(day).length;

  const handleTaskClick = (e: React.MouseEvent<HTMLButtonElement>, task: TaskDue) => {
    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
    setActivePopover((prev) => prev && sameDay(prev.task.date, task.date) ? null : { task, rect });
  };

  const handleGridEventOpenTask = useCallback(async (ev: CalendarEvent) => {
    const taskId = ev.taskId;
    if (taskId == null) return;
    setShowViewTaskSidebar(true);
    setViewSidebarTask({ id: taskId, title: ev.title } as Record<string, unknown>);
    try {
      const data = await getTask(taskId, [...CALENDAR_TASK_WITH_RELATIONS]);
      if (data && typeof data === "object") {
        setViewSidebarTask(data as Record<string, unknown>);
      }
    } catch (err) {
      console.error("Failed to load task for calendar view:", err);
    }
  }, []);

  const closeViewTaskSidebar = useCallback(() => {
    setShowViewTaskSidebar(false);
    setViewSidebarTask(null);
  }, []);

  const SIDEBAR_W = 370;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: FONT, backgroundColor: "#f5f5f5", color: PRIMARY, position: "relative" }}>
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(255,255,255,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            fontSize: "14px",
            color: PRIMARY,
          }}
        >
          Loading calendar…
        </div>
      )}

      {/* Toggle button for sidebar */}
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        style={{
          position: "absolute",
          top: "12px",
          left: sidebarOpen ? `${SIDEBAR_W - 40}px` : "-10px",
          background: "#fff",
          border: "1px solid #d0d0d0",
          borderRadius: "4px",
          cursor: "pointer",
          padding: "5px",
          display: "flex",
          alignItems: "center",
          color: "#666",
          zIndex: 100,
          transition: "left 220ms ease",
        }}
      >
        {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* ── Sidebar ── */}
      <div style={{
        width: sidebarOpen ? SIDEBAR_W : 0,
        minWidth: sidebarOpen ? SIDEBAR_W : 0,
        overflow: "hidden",
        transition: "width 220ms ease, min-width 220ms ease",
        backgroundColor: "#fff",
        borderRight: "1px solid #e5e5e5",
        flexShrink: 0,
      }}>
        <div style={{ width: SIDEBAR_W, padding: "20px 0", paddingTop: "13px" }}>
          {[
            { label: "Upcoming meetings (0)", badge: null },
            { label: "Follow-up opportunities (0)", badge: "i" },
          ].map(({ label, badge }) => (
            <React.Fragment key={label}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 20px", cursor: "pointer" }}>
                <ChevronRight size={16} color="#666" />
                <span style={{ fontSize: "16px", fontWeight: 600, fontFamily: FONT, letterSpacing: "0px", lineHeight: "20px", color: PRIMARY }}>
                  {label}
                </span>
                {badge && (
                  <span style={{
                    width: "20px", height: "20px", borderRadius: "50%",
                    backgroundColor: PURPLE, color: "#fff",
                    fontSize: "11px", fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    {badge}
                  </span>
                )}
              </div>
              <div style={{ height: "1px", backgroundColor: "#f0f0f0" }} />
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: "#fff" }}>

        {/* ── Top bar ── */}
        <div style={{ borderBottom: "1px solid #e5e5e5", padding: "0 20px", backgroundColor: "#fff", flexShrink: 0 }}>
          {/* Date range */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 0 10px" }}>
            <h2 style={{ margin: 0, fontSize: "20px", fontStyle: "normal", fontWeight: 600, fontFamily: FONT, letterSpacing: "0px", lineHeight: "24px", color: PRIMARY }}>
              {headerTitle}
            </h2>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingBottom: "12px", flexWrap: "wrap" }}>
            <button type="button" style={btnBase} onClick={goToday}>Today</button>
            <CalendarRangeModeSelect value={rangeMode} onChange={handleRangeModeChange} btnBase={btnBase} />
            {rangeMode === "custom" && (
              <>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontFamily: FONT }}>
                  <span>Start</span>
                  <input
                    type="date"
                    value={customStartStr}
                    onChange={(e) => setCustomStartStr(e.target.value)}
                    style={{ ...btnBase, padding: "6px 8px", fontFamily: FONT }}
                  />
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontFamily: FONT }}>
                  <span>End</span>
                  <input
                    type="date"
                    value={customEndStr}
                    onChange={(e) => setCustomEndStr(e.target.value)}
                    style={{ ...btnBase, padding: "6px 8px", fontFamily: FONT }}
                  />
                </label>
              </>
            )}
            <button type="button" style={btnBase}>Key <ChevronDown size={12} /></button>

            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontFamily: FONT, fontWeight: 300, color: PRIMARY, userSelect: "none" }}>
              <button
                type="button"
                aria-pressed={hideWeekends}
                aria-label="Hide weekends"
                onClick={() => setHideWeekends((v) => !v)}
                style={{
                  width: "16px", height: "16px", border: "2px solid #141414", borderRadius: "3px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  backgroundColor: hideWeekends ? "#141414" : "#fff", flexShrink: 0, cursor: "pointer",
                  padding: 0, margin: 0, font: "inherit",
                }}
              >
                {hideWeekends && <Check size={11} color="#fff" strokeWidth={3} />}
              </button>
              <span style={{ fontSize: "14px" }}>Hide weekends</span>
            </label>

            <TimeZoneMenu value={calendarTimeZone} onChange={setCalendarTimeZone} btnBase={btnBase} />

            <div style={{ flex: 1 }} />

            <div style={{ display: "flex", gap: "4px" }}>
              <button
                type="button"
                aria-label={calendarNavBackAriaLabel(rangeMode)}
                onClick={navigateCalendarBack}
                style={{ ...btnBase, padding: "7px 10px" }}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                aria-label={calendarNavForwardAriaLabel(rangeMode)}
                onClick={navigateCalendarForward}
                style={{ ...btnBase, padding: "7px 10px" }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Calendar grid ── */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div
            style={{
              flex: 1,
              overflowX: "auto",
              overflowY: "hidden",
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            <div
              style={{
                minWidth: calendarGridMinWidthPx ?? "100%",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
              }}
            >
          {/* Day headers row */}
          <div style={{
            display: "grid",
            gridTemplateColumns: calendarGridTemplateColumns,
            borderBottom: "1px solid #e5e5e5",
            backgroundColor: "#f7f5fc",
            flexShrink: 0,
          }}>
            <div style={{ borderRight: "1px solid #e5e5e5", padding: "10px 0" }} />
            {days.map((day) => {
              const isToday = sameDay(day, today);
              return (
                <div key={day.toISOString()} style={{ borderRight: "1px solid #e5e5e5", padding: "10px 0 8px", textAlign: "center" }}>
                  <span style={{ fontSize: "13px", fontWeight: isToday ? 700 : 500, color: isToday ? PURPLE : PRIMARY, fontFamily: FONT }}>
                    {formatDayLabel(day)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* All-day row: expand/collapse toggle */}
          <div style={{
            display: "grid",
            gridTemplateColumns: calendarGridTemplateColumns,
            borderBottom: "1px solid #e5e5e5",
            backgroundColor: "#fff",
            flexShrink: 0,
            minHeight: "38px",
          }}>
            {/* Toggle arrow */}
            <button
              type="button"
              onClick={() => setAllDayExpanded((v) => !v)}
              style={{
                borderRight: "1px solid #e5e5e5",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#888",
                background: "none", border: "none", padding: 0, width: "100%",
              }}
              title={allDayExpanded ? "Collapse" : "Expand"}
              aria-label={allDayExpanded ? "Collapse all-day row" : "Expand all-day row"}
            >
              {allDayExpanded
                ? <ChevronsUp   size={15} color="#888" />
                : <ChevronsDown size={15} color="#888" />
              }
            </button>

            {days.map((day) => {
              const task = getTaskForDay(day);
              const eventCount = getEventCountForDay(day);

              return (
                <div
                  key={day.toISOString()}
                  style={{ borderRight: "1px solid #e5e5e5", padding: "5px 6px", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  {/* EXPANDED: show task pills */}
                  {allDayExpanded && task && (
                    <button
                      onClick={(e) => handleTaskClick(e, task)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "5px",
                        backgroundColor: "#f0edfc", border: "1px solid #c9bff5",
                        borderRadius: "4px", padding: "3px 8px", cursor: "pointer",
                        fontSize: "11px", fontWeight: 400, color: PRIMARY, fontFamily: FONT,
                        whiteSpace: "nowrap", width: "100%",
                      }}
                    >
                      <List size={11} color={PURPLE} />
                      {task.todos.length + task.emails.length + task.calls.length + task.linkedin.length} task due
                    </button>
                  )}

                  {/* COLLAPSED: show event count link */}
                  {allDayExpanded ? null : (
                    <button
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: "14px", fontWeight: 400, color: "#006162",
                        fontFamily: FONT, padding: 0, textDecoration: "underline",
                        textUnderlineOffset: "2px", whiteSpace: "nowrap",
                      }}
                    >
                      {eventCount} event{eventCount === 1 ? "" : "s"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Scrollable time grid */}
          <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
            <div style={{ position: "relative" }}>
              {HOURS.map((hour, hi) => (
                <CalendarHourRow
                  key={hour}
                  hourLabel={hour}
                  hourIdx={hi}
                  days={days}
                  gridTemplateColumns={calendarGridTemplateColumns}
                  getEventsForDay={getEventsForDay}
                  onOpenTask={handleGridEventOpenTask}
                />
              ))}
            </div>
          </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Task Popover ── */}
      {activePopover && (
        <TaskPopover
          task={activePopover.task}
          anchorRect={activePopover.rect}
          onClose={() => setActivePopover(null)}
        />
      )}

      <ViewPlannerTaskSidebar
        isOpen={showViewTaskSidebar}
        onClose={closeViewTaskSidebar}
        task={viewSidebarTask}
        extensions={hierarchyDataExtensions as ViewPlannerTaskSidebarProps["extensions"]}
      />

      {/* ── Got feedback ── */}
      <div style={{
        position: "fixed", bottom: "16px", right: "16px",
        backgroundColor: "#fff", border: "1px solid #e0e0e0", borderRadius: "4px",
        padding: "8px 14px", fontSize: "12px", color: PRIMARY, cursor: "pointer",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)", fontFamily: FONT, zIndex: 100,
      }}>
        Got feedback?
      </div>
    </div>
  );
}
