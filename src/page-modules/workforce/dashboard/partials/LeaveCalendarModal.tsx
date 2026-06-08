import React from "react";
import {
  WORKFORCE_AVATAR_PALETTE,
  workforcePaletteSoftBg,
} from "@page-modules/workforce/shared/workforceChartColors";
import type { LeaveCalendarDay } from "../dashboardDomain";

const CALENDAR_ACCENT = WORKFORCE_AVATAR_PALETTE[0];
const CALENDAR_LEAVE_TINT = WORKFORCE_AVATAR_PALETTE[5];

export interface LeaveCalendarModalProps {
  open: boolean;
  onClose: () => void;
  calendarMonthInfo: {
    year: number;
    month: number;
    monthLabel: string;
    daysInMonth: number;
    startWeekday: number;
  };
  leaveByDate: Record<string, LeaveCalendarDay>;
  selectedCalendarDate: string;
  onSelectCalendarDate: (isoDate: string) => void;
  getDisplayName: (userId: string | number | null | undefined, fallback?: string) => string;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const LeaveCalendarModal: React.FC<LeaveCalendarModalProps> = ({
  open,
  onClose,
  calendarMonthInfo,
  leaveByDate,
  selectedCalendarDate,
  onSelectCalendarDate,
  getDisplayName,
}) => {
  if (!open) return null;

  const selectedDayLeave = leaveByDate[selectedCalendarDate];
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <dialog open className="employees-dashboard__modal-overlay">
      <div className="employees-dashboard__modal-sheet">
        <div className="employees-dashboard__modal-head">
          <h2 className="employees-dashboard__modal-title">Employee Leave Calendar</h2>
          <button type="button" className="employees-dashboard__modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="employees-dashboard__calendar-month-label">{calendarMonthInfo.monthLabel}</div>
        <div className="employees-dashboard__calendar-grid">
          {WEEKDAYS.map((day) => (
            <div key={day} className="employees-dashboard__calendar-weekday">
              {day}
            </div>
          ))}
          {Array.from({ length: calendarMonthInfo.startWeekday }, (_, i) => (
            <div key={`pad-${i}`} className="employees-dashboard__calendar-pad" />
          ))}
          {Array.from({ length: calendarMonthInfo.daysInMonth }, (_, i) => {
            const day = i + 1;
            const dateStr = `${calendarMonthInfo.year}-${String(calendarMonthInfo.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayData = leaveByDate[dateStr];
            const hasLeave = (dayData?.on_leave_count ?? 0) > 0;
            const isSelected = dateStr === selectedCalendarDate;
            const isToday = dateStr === todayStr;
            let dayBackground = "#F9FAFB";
            if (hasLeave) {
              dayBackground = workforcePaletteSoftBg(CALENDAR_LEAVE_TINT);
            }
            if (isToday) {
              dayBackground = workforcePaletteSoftBg(CALENDAR_ACCENT);
            }
            if (isSelected) {
              dayBackground = workforcePaletteSoftBg(WORKFORCE_AVATAR_PALETTE[3]);
            }
            const dayBorder =
              isSelected || isToday
                ? `2px solid ${CALENDAR_ACCENT}`
                : `1px solid ${workforcePaletteSoftBg(CALENDAR_ACCENT)}`;
            const dayColor = isSelected || isToday ? CALENDAR_ACCENT : "#374151";
            const dayWeight = isSelected || isToday ? "600" : "400";
            const leaveCountText = dayData?.on_leave_count ? `(${dayData.on_leave_count})` : "";
            return (
              <button
                type="button"
                key={day}
                className="employees-dashboard__calendar-day"
                onClick={() => onSelectCalendarDate(dateStr)}
                style={{
                  background: dayBackground,
                  border: dayBorder,
                  fontWeight: dayWeight,
                  color: dayColor,
                }}
              >
                {day}
                {hasLeave && (
                  <div className="employees-dashboard__calendar-leave-pill">On Leave {leaveCountText}</div>
                )}
              </button>
            );
          })}
        </div>
        <div className="employees-dashboard__calendar-detail">
          <div className="employees-dashboard__calendar-detail-title">
            Employees on Leave {selectedCalendarDate === todayStr ? "Today" : ""} ({selectedCalendarDate})
          </div>
          <div className="employees-dashboard__calendar-detail-list">
            {selectedDayLeave?.employees?.length ? (
              selectedDayLeave.employees.map((emp) => (
                <div key={`${emp.user_id}-${emp.request_id}`}>
                  • {getDisplayName(emp.user_id, emp.employee_name)} - {emp.leave_type}
                </div>
              ))
            ) : (
              <span className="employees-dashboard__calendar-detail-empty">No employees on leave this day.</span>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
};

export default LeaveCalendarModal;
