import React, { type ReactElement } from "react";
import moment from "moment";
import {
  Calendar,
  Clock,
  Coffee,
  LogIn,
  LogOut,
  Timer,
} from "lucide-react";
import type { MyAttendanceData } from "@utils/staffManagement";
import {
  AttendanceSessionLiveBlock,
  AttendanceStatusLoading,
  AttendanceStatusUnavailable,
} from "@page-modules/workforce/attendance/partials/AttendanceStatusUI";
import {
  getMyAttendanceActionAvailability,
  isMyAttendanceOnBreak,
  isMyAttendanceOnOvertime,
  resolveMyAttendanceState,
} from "./checkInOutDomain";

type CheckInOutActionsPanelProps = Readonly<{
  statusLoading: boolean;
  myAttendance: MyAttendanceData | null;
  canPerformActions: boolean;
  liveSessionElapsed: string;
  actionLoading: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onStartBreak: () => void;
  onEndBreak: () => void;
  onStartOvertime: () => void;
}>;

function renderStatusDateLine(myAttendance: MyAttendanceData): ReactElement | null {
  if (!myAttendance.work_date) {
    return null;
  }
  return (
    <div className="check-in-out-page__status-meta">
      <Calendar size={16} aria-hidden />
      <span>{moment(myAttendance.work_date).format("dddd, DD MMM YYYY")}</span>
    </div>
  );
}

function renderStatusIcon(state: string): ReactElement {
  if (isMyAttendanceOnBreak(state)) {
    return <Coffee size={16} aria-hidden />;
  }
  if (isMyAttendanceOnOvertime(state)) {
    return <Timer size={16} aria-hidden />;
  }
  return <Clock size={16} aria-hidden />;
}

function renderStatusSection(
  statusLoading: boolean,
  myAttendance: MyAttendanceData | null,
  liveSessionElapsed: string,
): ReactElement {
  if (statusLoading) {
    return <AttendanceStatusLoading />;
  }
  if (!myAttendance) {
    return <AttendanceStatusUnavailable />;
  }

  const { label: statusLabel, chipModifier } = resolveMyAttendanceState(myAttendance.state);
  const chipClass = `check-in-out-page__status-chip check-in-out-page__status-chip--${chipModifier}`;
  const showLiveTimer =
    myAttendance.is_checked_in && Boolean(myAttendance.attendance?.check_in_at) && liveSessionElapsed;

  return (
    <>
      {renderStatusDateLine(myAttendance)}
      {myAttendance.banner ? (
        <p className="check-in-out-page__banner">{myAttendance.banner}</p>
      ) : null}
      <div className={chipClass}>
        {renderStatusIcon(myAttendance.state)}
        {statusLabel}
      </div>
      {showLiveTimer ? <AttendanceSessionLiveBlock elapsed={liveSessionElapsed} /> : null}
    </>
  );
}

function renderSessionActions(
  availability: ReturnType<typeof getMyAttendanceActionAvailability>,
  buttonsDisabled: boolean,
  actionLoading: boolean,
  handlers: Readonly<{
    onStartBreak: () => void;
    onEndBreak: () => void;
    onStartOvertime: () => void;
  }>,
): ReactElement | null {
  const hasSessionActions =
    availability.canStartBreak ||
    availability.canEndBreak ||
    availability.canStartOvertime;
  if (!hasSessionActions) {
    return null;
  }

  return (
    <div className="check-in-out-page__section">
      <p className="check-in-out-page__section-label">Session actions</p>
      <div className="check-in-out-page__secondary-actions">
        <button
          type="button"
          className="check-in-out-page__action-btn check-in-out-page__action-btn--sub-break-start"
          disabled={buttonsDisabled || !availability.canStartBreak}
          onClick={handlers.onStartBreak}
        >
          <Coffee size={18} aria-hidden />
          {actionLoading ? "…" : "Start Break"}
        </button>
        <button
          type="button"
          className="check-in-out-page__action-btn check-in-out-page__action-btn--sub-break-end"
          disabled={buttonsDisabled || !availability.canEndBreak}
          onClick={handlers.onEndBreak}
        >
          <Coffee size={18} aria-hidden />
          {actionLoading ? "…" : "End Break"}
        </button>
        <button
          type="button"
          className="check-in-out-page__action-btn check-in-out-page__action-btn--sub-overtime"
          disabled={buttonsDisabled || !availability.canStartOvertime}
          onClick={handlers.onStartOvertime}
        >
          <Timer size={18} aria-hidden />
          {actionLoading ? "…" : "Start Overtime"}
        </button>
      </div>
    </div>
  );
}

export function CheckInOutActionsPanel({
  statusLoading,
  myAttendance,
  canPerformActions,
  liveSessionElapsed,
  actionLoading,
  onCheckIn,
  onCheckOut,
  onStartBreak,
  onEndBreak,
  onStartOvertime,
}: CheckInOutActionsPanelProps): ReactElement {
  const availability = getMyAttendanceActionAvailability(myAttendance, canPerformActions);
  const buttonsDisabled = statusLoading || actionLoading;

  return (
    <div className="check-in-out-page__card">
      <div className="check-in-out-page__header">
        <h1 className="check-in-out-page__title">Check in / Check out</h1>
        <p className="check-in-out-page__subtitle">
          Record your work session, breaks, and overtime for today.
        </p>
      </div>

      <div className="check-in-out-page__status">
        {renderStatusSection(statusLoading, myAttendance, liveSessionElapsed)}
      </div>

      {canPerformActions ? (
        <>
          <div className="check-in-out-page__section">
            <p className="check-in-out-page__section-label">Primary actions</p>
            <div className="check-in-out-page__primary-actions">
              <button
                type="button"
                className="check-in-out-page__action-btn check-in-out-page__action-btn--primary-in"
                disabled={buttonsDisabled || !availability.canCheckIn}
                onClick={onCheckIn}
              >
                <LogIn size={20} aria-hidden />
                {actionLoading ? "…" : "Check In"}
              </button>
              <button
                type="button"
                className="check-in-out-page__action-btn check-in-out-page__action-btn--primary-out"
                disabled={buttonsDisabled || !availability.canCheckOut}
                onClick={onCheckOut}
              >
                <LogOut size={20} aria-hidden />
                {actionLoading ? "…" : "Check Out"}
              </button>
            </div>
          </div>

          {renderSessionActions(availability, buttonsDisabled, actionLoading, {
            onStartBreak,
            onEndBreak,
            onStartOvertime,
          })}
        </>
      ) : (
        <div className="check-in-out-page__section">
          <p className="check-in-out-page__readonly-note">
            You can view your attendance status here. Check-in and check-out actions require the
            appropriate workforce permission.
          </p>
        </div>
      )}
    </div>
  );
}
