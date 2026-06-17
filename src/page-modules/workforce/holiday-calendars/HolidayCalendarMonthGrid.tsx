import { ACCOUNT_DEFAULTS_FONT } from "@components/main-settings/accountDefaultsTabPrimitives";
import { MAIN_SETTINGS_FONT_SIZE } from "@components/main-settings/mainSettingsTokens";
import {
  HOLIDAY_MONTH_LABELS,
  HOLIDAY_WEEKDAY_LABELS,
  buildHolidayMonthMatrix,
  formatIsoDateFromLocalDate,
} from "@page-modules/workforce/holiday-calendars/holidayCalendarDomain";
import type { HolidayCalendarHoliday } from "@utils/staffManagement";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";
import { Button } from "react-bootstrap";

export type HolidayCalendarMonthGridProps = Readonly<{
  year: number;
  month: number;
  holidaysByDate: ReadonlyMap<string, readonly HolidayCalendarHoliday[]>;
  selectedDate: string | null;
  onSelectDate: (isoDate: string) => void;
  onMonthChange: (month: number) => void;
}>;

const gridStyle: React.CSSProperties = {
  fontFamily: ACCOUNT_DEFAULTS_FONT,
};

const weekdayHeaderStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
  gap: "4px",
  marginBottom: "4px",
};

const weekdayLabelStyle: React.CSSProperties = {
  fontSize: MAIN_SETTINGS_FONT_SIZE.sm,
  fontWeight: 600,
  color: "#6b7280",
  textAlign: "center",
  padding: "4px 0",
};

const weeksStyle: React.CSSProperties = {
  display: "grid",
  gap: "4px",
};

const weekRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
  gap: "4px",
};

function dayButtonStyle(options: {
  isSelected: boolean;
  hasHoliday: boolean;
  isOutsideMonth: boolean;
}): React.CSSProperties {
  let backgroundColor = "#ffffff";
  let borderColor = "#e5e7eb";
  let color = "#141414";

  if (options.isOutsideMonth) {
    color = "#c4c4c4";
  }
  if (options.hasHoliday) {
    backgroundColor = "#e8f2ff";
    borderColor = "#0066cc";
  }
  if (options.isSelected) {
    backgroundColor = "#0066cc";
    borderColor = "#0066cc";
    color = "#ffffff";
  }

  return {
    minHeight: "42px",
    border: `1px solid ${borderColor}`,
    borderRadius: "8px",
    backgroundColor,
    color,
    fontFamily: ACCOUNT_DEFAULTS_FONT,
    fontSize: MAIN_SETTINGS_FONT_SIZE.sm,
    fontWeight: options.isSelected || options.hasHoliday ? 600 : 400,
    padding: "6px 4px",
    cursor: options.isOutsideMonth ? "default" : "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "2px",
  };
}

export function HolidayCalendarMonthGrid({
  year,
  month,
  holidaysByDate,
  selectedDate,
  onSelectDate,
  onMonthChange,
}: HolidayCalendarMonthGridProps) {
  const weeks = buildHolidayMonthMatrix(year, month);
  const canGoPrev = month > 0;
  const canGoNext = month < 11;

  return (
    <div style={gridStyle}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <Button
          variant="outline-secondary"
          size="sm"
          type="button"
          disabled={!canGoPrev}
          onClick={() => onMonthChange(month - 1)}
          aria-label="Previous month"
        >
          <ChevronLeft size={16} aria-hidden />
        </Button>
        <div
          style={{
            fontSize: MAIN_SETTINGS_FONT_SIZE.base,
            fontWeight: 600,
            color: "#141414",
          }}
        >
          {HOLIDAY_MONTH_LABELS[month]} {year}
        </div>
        <Button
          variant="outline-secondary"
          size="sm"
          type="button"
          disabled={!canGoNext}
          onClick={() => onMonthChange(month + 1)}
          aria-label="Next month"
        >
          <ChevronRight size={16} aria-hidden />
        </Button>
      </div>

      <div style={weekdayHeaderStyle}>
        {HOLIDAY_WEEKDAY_LABELS.map((label) => (
          <div key={label} style={weekdayLabelStyle}>
            {label}
          </div>
        ))}
      </div>

      <div style={weeksStyle}>
        {weeks.map((week, weekIndex) => (
          <div key={`week-${weekIndex}`} style={weekRowStyle}>
            {week.map((date, dayIndex) => {
              if (!date) {
                return (
                  <div
                    key={`empty-${weekIndex}-${dayIndex}`}
                    style={dayButtonStyle({
                      isSelected: false,
                      hasHoliday: false,
                      isOutsideMonth: true,
                    })}
                    aria-hidden
                  />
                );
              }

              const isoDate = formatIsoDateFromLocalDate(date);
              const holidays = holidaysByDate.get(isoDate) ?? [];
              const isSelected = selectedDate === isoDate;

              return (
                <button
                  key={isoDate}
                  type="button"
                  style={dayButtonStyle({
                    isSelected,
                    hasHoliday: holidays.length > 0,
                    isOutsideMonth: false,
                  })}
                  onClick={() => onSelectDate(isoDate)}
                  aria-label={`${isoDate}${holidays.length > 0 ? `, ${holidays.length} holiday(s)` : ""}`}
                  aria-pressed={isSelected}
                >
                  <span>{date.getDate()}</span>
                  {holidays.length > 0 ? (
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: isSelected ? "#ffffff" : "#0066cc",
                      }}
                      aria-hidden
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
