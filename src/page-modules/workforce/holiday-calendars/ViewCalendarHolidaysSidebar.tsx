import {
  PoliciesAttendanceFormSidebar,
  PoliciesAttendanceFormSidebarFooterBar,
  PoliciesAttendanceSidebarCancelButton,
  PoliciesAttendanceSidebarPrimaryButton,
} from "@page-modules/workforce/shared/policiesAttendanceFormSidebarUi";
import { ACCOUNT_DEFAULTS_FONT } from "@components/main-settings/accountDefaultsTabPrimitives";
import { MAIN_SETTINGS_FONT_SIZE } from "@components/main-settings/mainSettingsTokens";
import { HolidayCalendarMonthGrid } from "@page-modules/workforce/holiday-calendars/HolidayCalendarMonthGrid";
import {
  buildHolidaysByDateMap,
  formatHolidayCalendarDateValue,
  formatHolidayHalfDayLabel,
  formatHolidayScopeLabel,
  normalizeHolidayDateKey,
  readCalendarHolidayId,
  readHolidayCalendarYear,
  sortCalendarHolidaysByDate,
  type HolidayDepartmentOption,
} from "@page-modules/workforce/holiday-calendars/holidayCalendarDomain";
import { useCalendarHolidaysQuery } from "@page-modules/workforce/holiday-calendars/useCalendarHolidaysQuery";
import type { HolidayCalendar, HolidayCalendarHoliday } from "@utils/staffManagement";
import { Edit, Trash2 } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Button, Spinner } from "react-bootstrap";

export type ViewCalendarHolidaysSidebarProps = Readonly<{
  show: boolean;
  calendar: HolidayCalendar | null;
  departmentOptions: readonly HolidayDepartmentOption[];
  onClose: () => void;
  onAddHoliday: (calendar: HolidayCalendar) => void;
  onEditHoliday: (calendar: HolidayCalendar, holiday: HolidayCalendarHoliday) => void;
  onDeleteHoliday: (calendar: HolidayCalendar, holiday: HolidayCalendarHoliday) => void;
}>;

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: ACCOUNT_DEFAULTS_FONT,
  fontSize: MAIN_SETTINGS_FONT_SIZE.base,
  fontWeight: 600,
  color: "#141414",
  marginBottom: "12px",
};

const listMetaStyle: React.CSSProperties = {
  fontFamily: ACCOUNT_DEFAULTS_FONT,
  fontSize: MAIN_SETTINGS_FONT_SIZE.sm,
  color: "#6b7280",
};

function readHolidayListItemKey(holiday: HolidayCalendarHoliday): string {
  const holidayId = readCalendarHolidayId(holiday);
  if (holidayId === null) {
    return `${holiday.name ?? "holiday"}-${holiday.date ?? "date"}`;
  }
  return String(holidayId);
}

function canManageCalendarHoliday(
  calendar: HolidayCalendar | null,
  holidayId: number | null,
): calendar is HolidayCalendar {
  return calendar !== null && holidayId !== null;
}

function hasHolidayCalendarYear(year: number | null): year is number {
  return year !== null && Number.isFinite(year);
}

export function ViewCalendarHolidaysSidebar({
  show,
  calendar,
  departmentOptions,
  onClose,
  onAddHoliday,
  onEditHoliday,
  onDeleteHoliday,
}: ViewCalendarHolidaysSidebarProps) {
  const calendarYear = calendar ? readHolidayCalendarYear(calendar) : null;
  const [visibleMonth, setVisibleMonth] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const holidaysQuery = useCalendarHolidaysQuery(show && calendar ? calendar.id : null);
  const holidays = holidaysQuery.data ?? [];

  useEffect(() => {
    if (!show) {
      setSelectedDate(null);
      return;
    }
    const today = new Date();
    let defaultMonth = 0;
    if (calendarYear !== null && today.getFullYear() === calendarYear) {
      defaultMonth = today.getMonth();
    }
    setVisibleMonth(defaultMonth);
    setSelectedDate(null);
  }, [calendar?.id, calendarYear, show]);

  const holidaysByDate = useMemo(() => buildHolidaysByDateMap(holidays), [holidays]);

  const sortedHolidays = useMemo(() => sortCalendarHolidaysByDate(holidays), [holidays]);

  const visibleHolidays = useMemo(() => {
    if (!selectedDate) return sortedHolidays;
    return sortedHolidays.filter(
      (holiday) => normalizeHolidayDateKey(holiday.date) === selectedDate,
    );
  }, [selectedDate, sortedHolidays]);

  const calendarLabel = calendar?.name?.trim() || "calendar";

  return (
    <PoliciesAttendanceFormSidebar
      show={show}
      onHide={onClose}
      title={`Holidays in ${calendarLabel}`}
      footer={
        <PoliciesAttendanceFormSidebarFooterBar>
          <PoliciesAttendanceSidebarCancelButton onClick={onClose} label="Close" />
          {calendar ? (
            <PoliciesAttendanceSidebarPrimaryButton
              onClick={() => onAddHoliday(calendar)}
              label="Add holiday"
            />
          ) : null}
        </PoliciesAttendanceFormSidebarFooterBar>
      }
    >
      <div style={{ fontFamily: ACCOUNT_DEFAULTS_FONT }}>
        {holidaysQuery.isFetching && holidays.length === 0 ? (
          <div className="d-flex justify-content-center py-4">
            <Spinner animation="border" size="sm" role="status">
              <span className="visually-hidden">Loading holidays...</span>
            </Spinner>
          </div>
        ) : null}

        {hasHolidayCalendarYear(calendarYear) ? (
          <HolidayCalendarMonthGrid
            year={calendarYear}
            month={visibleMonth}
            holidaysByDate={holidaysByDate}
            selectedDate={selectedDate}
            onSelectDate={(isoDate) => {
              setSelectedDate((current) => (current === isoDate ? null : isoDate));
            }}
            onMonthChange={setVisibleMonth}
          />
        ) : (
          <p className="text-muted mb-0" style={listMetaStyle}>
            Calendar year is not available.
          </p>
        )}

        <div className="mt-4">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
            <div style={sectionTitleStyle}>
              {selectedDate
                ? `Holidays on ${formatHolidayCalendarDateValue(selectedDate)}`
                : "All holidays"}
            </div>
            {selectedDate ? (
              <Button
                variant="link"
                size="sm"
                type="button"
                className="p-0"
                onClick={() => setSelectedDate(null)}
              >
                Show all
              </Button>
            ) : null}
          </div>

          {visibleHolidays.length === 0 ? (
            <p className="text-muted mb-0" style={listMetaStyle}>
              {selectedDate ? "No holidays on this date." : "No holidays added yet."}
            </p>
          ) : (
            <div className="d-flex flex-column gap-2">
              {visibleHolidays.map((holiday) => {
                const holidayId = readCalendarHolidayId(holiday);
                const holidayKey = readHolidayListItemKey(holiday);
                const showHolidayActions = canManageCalendarHoliday(calendar, holidayId);

                return (
                  <div
                    key={holidayKey}
                    className="d-flex align-items-start justify-content-between gap-3 border rounded-3 p-3"
                    style={{ borderColor: "#e5e7eb" }}
                  >
                    <div className="min-w-0">
                      <div
                        style={{
                          fontSize: MAIN_SETTINGS_FONT_SIZE.base,
                          fontWeight: 600,
                          color: "#141414",
                        }}
                      >
                        {holiday.name?.trim() || "Untitled holiday"}
                      </div>
                      <div style={listMetaStyle}>
                        {formatHolidayCalendarDateValue(holiday.date)}
                      </div>
                      <div style={listMetaStyle}>
                        {formatHolidayScopeLabel(holiday, departmentOptions)}
                        {" · "}
                        {formatHolidayHalfDayLabel(holiday)}
                      </div>
                    </div>
                    {showHolidayActions ? (
                      <div className="d-flex flex-shrink-0 gap-1">
                        <Button
                          variant="light"
                          size="sm"
                          type="button"
                          className="btn-action-style-2 d-inline-flex align-items-center justify-content-center p-0 text-primary"
                          title={`Edit ${holiday.name?.trim() || "holiday"}`}
                          aria-label={`Edit ${holiday.name?.trim() || "holiday"}`}
                          onClick={() => onEditHoliday(calendar, holiday)}
                        >
                          <Edit size={16} aria-hidden />
                        </Button>
                        <Button
                          variant="light"
                          size="sm"
                          type="button"
                          className="btn-action-style-2 d-inline-flex align-items-center justify-content-center p-0 text-danger"
                          title={`Delete ${holiday.name?.trim() || "holiday"}`}
                          aria-label={`Delete ${holiday.name?.trim() || "holiday"}`}
                          onClick={() => onDeleteHoliday(calendar, holiday)}
                        >
                          <Trash2 size={16} aria-hidden />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PoliciesAttendanceFormSidebar>
  );
}
