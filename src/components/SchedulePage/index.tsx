"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  Check,
  ChevronDown,
  Mail,
  Phone,
  Linkedin,
  X,
  List,
  ChevronsUp,
  ChevronsDown,
} from "lucide-react";

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
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function formatHeaderRange(weekStart: Date, hideWeekends: boolean): string {
  const end = new Date(weekStart);
  end.setDate(weekStart.getDate() + (hideWeekends ? 4 : 6));
  const s = weekStart, e = end;
  if (s.getMonth() === e.getMonth()) {
    return `${s.getDate()} ${MONTHS[s.getMonth()]} - ${e.getDate()} ${MONTHS[e.getMonth()]}, ${s.getFullYear()}`;
  }
  return `${s.getDate()} ${MONTHS[s.getMonth()]} - ${e.getDate()} ${MONTHS[e.getMonth()]}, ${e.getFullYear()}`;
}

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

function formatDayLabel(d: Date): string {
  return `${DAYS[d.getDay()]}  ${d.getDate()}`;
}

function formatDateFull(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const HOURS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`);
const CELL_H = 64; // px per hour

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

function TaskPopover({ task, anchorRect, onClose }: TaskPopoverProps) {
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
            {totalTasks} task{totalTasks !== 1 ? "s" : ""} due
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
            { label: "LinkedIn",  items: task.linkedin, icon: <Linkedin size={13} color="#666" /> },
          ] as { label: string; items: string[]; icon: React.ReactNode }[]
        ).map((section, si) => (
          <React.Fragment key={section.label}>
            {si > 0 && <div style={{ height: "1px", backgroundColor: "#f5f5f5", margin: "6px 0" }} />}
            <div style={{ padding: "6px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                {section.icon}
                <span style={{ fontSize: "12px", fontWeight: 700, color: PRIMARY }}>{section.label}</span>
              </div>
              {section.items.length === 0
                ? <div style={{ fontSize: "11px", color: "#888", paddingLeft: "19px" }}>
                    You're all caught up on {section.label.toLowerCase()} tasks
                  </div>
                : section.items.map((t, i) => (
                    <div key={i} style={{ fontSize: "11px", color: PRIMARY, paddingLeft: "19px", marginBottom: "2px" }}>{t}</div>
                  ))
              }
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── Event chip in time grid ──────────────────────────────────────────────────

const EVENT_COLORS: Record<CalendarEvent["type"], { bg: string; border: string; icon: React.ReactNode }> = {
  todo:     { bg: "#EFEEFD", border: "#7D53E9", icon: <List  size={11} color={PURPLE} /> },
  email:    { bg: "#EFEEFD", border: "#7D53E9", icon: <Mail  size={11} color={PURPLE} /> },
  call:     { bg: "#EFEEFD", border: "#7D53E9", icon: <Phone size={11} color={PURPLE} /> },
  linkedin: { bg: "#EFEEFD", border: "#7D53E9", icon: <Linkedin size={11} color={PURPLE} /> },
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const today = new Date();
  const [sidebarOpen,    setSidebarOpen]    = useState(true);
  const [weekStart,      setWeekStart]      = useState<Date>(getWeekStart(new Date()));
  const [hideWeekends,   setHideWeekends]   = useState(true);
  const [allDayExpanded, setAllDayExpanded] = useState(false); // false = collapsed (shows event counts)
  const [activePopover,  setActivePopover]  = useState<{ task: TaskDue; rect: DOMRect } | null>(null);

  const visibleDays = hideWeekends ? 5 : 7;
  const days: Date[] = Array.from({ length: visibleDays }, (_, i) => addDays(weekStart, i));

  const prevWeek = () => setWeekStart((w) => addDays(w, -7));
  const nextWeek = () => setWeekStart((w) => addDays(w, 7));
  const goToday  = () => setWeekStart(getWeekStart(today));

  const getTaskForDay   = (day: Date) => SAMPLE_TASKS.find((t) => sameDay(t.date, day));
  const getEventsForDay = (day: Date) => CALENDAR_EVENTS.filter((e) => sameDay(e.date, day));

  const getEventCountForDay = (day: Date): number => getEventsForDay(day).length;

  const handleTaskClick = (e: React.MouseEvent<HTMLButtonElement>, task: TaskDue) => {
    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
    setActivePopover((prev) => prev && sameDay(prev.task.date, task.date) ? null : { task, rect });
  };

  const SIDEBAR_W = 370;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: FONT, backgroundColor: "#f5f5f5", color: PRIMARY, position: "relative" }}>

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
              {formatHeaderRange(weekStart, hideWeekends)}
            </h2>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingBottom: "12px", flexWrap: "wrap" }}>
            <button style={btnBase} onClick={goToday}>Today</button>
            <button style={btnBase}>Week <ChevronDown size={12} /></button>
            <button style={btnBase}>Key <ChevronDown size={12} /></button>

            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontFamily: FONT, fontWeight: 300, color: PRIMARY, userSelect: "none" }}>
              <span
                onClick={() => setHideWeekends((v) => !v)}
                style={{
                  width: "16px", height: "16px", border: "2px solid #141414", borderRadius: "3px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  backgroundColor: hideWeekends ? "#141414" : "#fff", flexShrink: 0, cursor: "pointer",
                }}
              >
                {hideWeekends && <Check size={11} color="#fff" strokeWidth={3} />}
              </span>
              <span style={{ fontSize: "14px" }}>Hide weekends</span>
            </label>

            <button style={{ ...btnBase, fontWeight: 600, fontSize: "14px", lineHeight: "18px", border: "none", padding: "7px 4px", gap: "6px" }}>
              UTC +05:00 Almaty, Aqtau, Aqtobe, Ashgabat <ChevronDown size={13} />
            </button>

            <div style={{ flex: 1 }} />

            <div style={{ display: "flex", gap: "4px" }}>
              <button onClick={prevWeek} style={{ ...btnBase, padding: "7px 10px" }}><ChevronLeft  size={14} /></button>
              <button onClick={nextWeek} style={{ ...btnBase, padding: "7px 10px" }}><ChevronRight size={14} /></button>
            </div>
          </div>
        </div>

        {/* ── Calendar grid ── */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>

          {/* Day headers row */}
          <div style={{
            display: "grid",
            gridTemplateColumns: `64px repeat(${visibleDays}, 1fr)`,
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
            gridTemplateColumns: `64px repeat(${visibleDays}, 1fr)`,
            borderBottom: "1px solid #e5e5e5",
            backgroundColor: "#fff",
            flexShrink: 0,
            minHeight: "38px",
          }}>
            {/* Toggle arrow */}
            <div
              onClick={() => setAllDayExpanded((v) => !v)}
              style={{
                borderRight: "1px solid #e5e5e5",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#888",
              }}
              title={allDayExpanded ? "Collapse" : "Expand"}
            >
              {allDayExpanded
                ? <ChevronsUp   size={15} color="#888" />
                : <ChevronsDown size={15} color="#888" />
              }
            </div>

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
                  {!allDayExpanded && (
                    <button
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: "14px", fontWeight: 400, color: "#006162",
                        fontFamily: FONT, padding: 0, textDecoration: "underline",
                        textUnderlineOffset: "2px", whiteSpace: "nowrap",
                      }}
                    >
                      {eventCount} event{eventCount !== 1 ? "s" : ""}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Scrollable time grid */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            <div style={{ position: "relative" }}>
              {HOURS.map((hour, hi) => (
                <div
                  key={hour}
                  style={{
                    display: "grid",
                    gridTemplateColumns: `64px repeat(${visibleDays}, 1fr)`,
                    height: `${CELL_H}px`,
                    borderBottom: "1px solid #f0f0f0",
                    position: "relative",
                  }}
                >
                  {/* Time label */}
                  <div style={{
                    borderRight: "1px solid #e5e5e5",
                    padding: "4px 8px 0 0",
                    textAlign: "right",
                    fontSize: "11px", color: "#999", fontFamily: FONT, fontWeight: 300,
                    userSelect: "none", flexShrink: 0,
                  }}>
                    {hour}
                  </div>

                  {/* Day columns */}
                  {days.map((day) => {
                    const eventsThisHour = getEventsForDay(day).filter((ev) => ev.hour === hi);

                    return (
                      <div
                        key={day.toISOString()}
                        style={{ borderRight: "1px solid #f0f0f0", position: "relative" }}
                      >
                        {/* Half-hour dashed line */}
                        <div style={{
                          position: "absolute", top: "50%", left: 0, right: 0,
                          borderTop: "1px dashed #ebebeb", pointerEvents: "none",
                        }} />

                        {/* Calendar event chips */}
                        {eventsThisHour.map((ev, ei) => {
                          const colors = EVENT_COLORS[ev.type];
                          const topPx  = (ev.minute / 60) * CELL_H;
                          const heightPx = (ev.durationMins / 60) * CELL_H - 2;
                          return (
                            <div
                              key={ei}
                              style={{
                                position: "absolute",
                                top: topPx,
                                left: "4px",
                                right: "4px",
                                height: "40px",
                                backgroundColor: colors.bg,
                                border: `1px solid ${colors.border}`,
                                borderRadius: "4px",
                                padding: "4px 6px",
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "5px",
                                overflow: "hidden",
                                cursor: "pointer",
                                zIndex: 2,
                              }}
                            >
                              <span style={{ marginTop: "1px", flexShrink: 0 }}>{colors.icon}</span>
                              <span style={{ fontSize: "12px", fontWeight: 600, lineHeight: "22px", color: PRIMARY, fontFamily: FONT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {ev.title}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
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
