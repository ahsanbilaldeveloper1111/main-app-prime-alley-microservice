import React, { useCallback } from "react";
import { ChevronDown } from "lucide-react";

const DAYS_OPTIONS = ["7", "30", "60"] as const;
const PERIOD_OPTIONS = ["Monthly", "Date", "Range"] as const;

export type DashboardPeriodType = (typeof PERIOD_OPTIONS)[number];

export interface DashboardPageToolbarProps {
  periodType: DashboardPeriodType;
  setPeriodType: (v: DashboardPeriodType) => void;
  selectedDays: string;
  setSelectedDays: (v: string) => void;
  selectedDate: string;
  setSelectedDate: (v: string) => void;
  rangeStartDate: string;
  setRangeStartDate: (v: string) => void;
  rangeEndDate: string;
  setRangeEndDate: (v: string) => void;
  openDropdown: string | null;
  setOpenDropdown: React.Dispatch<React.SetStateAction<string | null>>;
}

const DashboardPageToolbar: React.FC<DashboardPageToolbarProps> = ({
  periodType,
  setPeriodType,
  selectedDays,
  setSelectedDays,
  selectedDate,
  setSelectedDate,
  rangeStartDate,
  setRangeStartDate,
  rangeEndDate,
  setRangeEndDate,
  openDropdown,
  setOpenDropdown,
}) => {
  const toggleDropdown = useCallback((dropdown: string) => {
    setOpenDropdown((prev) => (prev === dropdown ? null : dropdown));
  }, [setOpenDropdown]);

  return (
    <div className="employees-dashboard__page-header">
      <h1 className="employees-dashboard__title">Employee Management</h1>

      <div className="employees-dashboard__header-actions">
        <div className="employees-dashboard__period-row">
          <div className="employees-dashboard__dropdown-wrap">
            <button
              type="button"
              className="employees-dashboard__dropdown-trigger employees-dashboard__dropdown-trigger--period"
              onClick={(e) => {
                e.stopPropagation();
                toggleDropdown("period");
              }}
            >
              <span>{periodType}</span>
              <ChevronDown size={14} color="#9CA3AF" />
            </button>
            {openDropdown === "period" && (
              <div className="employees-dashboard__dropdown-menu employees-dashboard__dropdown-menu--period-anchor">
                {PERIOD_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option}
                    className={`employees-dashboard__dropdown-item${periodType === option ? " employees-dashboard__dropdown-item--active" : ""}`}
                    onClick={() => {
                      setPeriodType(option);
                      setOpenDropdown(null);
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
          {periodType === "Date" && (
            <input
              type="date"
              className="employees-dashboard__date-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          )}
          {periodType === "Range" && (
            <>
              <input
                type="date"
                className="employees-dashboard__date-input"
                value={rangeStartDate}
                onChange={(e) => setRangeStartDate(e.target.value)}
              />
              <span className="employees-dashboard__range-sep">–</span>
              <input
                type="date"
                className="employees-dashboard__date-input"
                value={rangeEndDate}
                onChange={(e) => setRangeEndDate(e.target.value)}
              />
            </>
          )}
        </div>

        <div className="employees-dashboard__dropdown-wrap">
          <button
            type="button"
            className="employees-dashboard__dropdown-trigger"
            onClick={(e) => {
              e.stopPropagation();
              toggleDropdown("days");
            }}
          >
            <span>{selectedDays} Days</span>
            <ChevronDown size={14} color="#9CA3AF" />
          </button>
          {openDropdown === "days" && (
            <div className="employees-dashboard__dropdown-menu employees-dashboard__dropdown-menu--days">
              {DAYS_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option}
                  className={`employees-dashboard__dropdown-item${selectedDays === option ? " employees-dashboard__dropdown-item--active" : ""}`}
                  onClick={() => {
                    setSelectedDays(option);
                    setOpenDropdown(null);
                  }}
                >
                  Last {option} days
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPageToolbar;
