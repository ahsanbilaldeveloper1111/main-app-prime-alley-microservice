import React, { type ReactElement } from "react";
import { Button } from "react-bootstrap";
import moment from "moment";
import { Calendar, Clock, LogIn, LogOut } from "lucide-react";
import type { AttendanceStatusData } from "@utils/staffManagement";
import { formatAttendanceToolbarDateLine } from "../attendanceDomain";

type AttendanceSessionLiveBlockProps = Readonly<{
  elapsed: string;
}>;

export function AttendanceSessionLiveBlock({ elapsed }: AttendanceSessionLiveBlockProps): ReactElement | null {
  if (!elapsed) return null;
  return (
    <div
      className="att-session-timer"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      title="Time since check-in; updates every second"
    >
      <div className="att-session-timer__header">
        <span className="att-session-timer__eyebrow">Active session</span>
        <span className="att-session-timer__live-pill">Live</span>
      </div>
      <div className="att-session-timer__face">
        <Clock className="att-session-timer__icon" size={20} strokeWidth={2} aria-hidden />
        <span className="att-session-timer__digits tabular-nums">{elapsed}</span>
      </div>
    </div>
  );
}

export function AttendanceStatusLoading(): ReactElement {
  return (
    <div className="att-status-loading">
      <Clock size={20} aria-hidden />
      <span>Loading status…</span>
    </div>
  );
}

export function AttendanceStatusUnavailable(): ReactElement {
  return (
    <div className="att-status-unavailable">
      <Clock size={18} aria-hidden />
      Status unavailable
    </div>
  );
}

type AttendanceStatusPillBodyProps = Readonly<{
  isCheckedIn: boolean;
  hasCheckInAt: boolean;
  liveSessionElapsed: string;
}>;

export function AttendanceStatusPillBody({
  isCheckedIn,
  hasCheckInAt,
  liveSessionElapsed,
}: AttendanceStatusPillBodyProps): ReactElement {
  const showLiveTimer = isCheckedIn && hasCheckInAt && liveSessionElapsed.length > 0;

  if (showLiveTimer) {
    return (
      <>
        <span
          className="att-status-pill__seg att-status-pill__seg--time"
          title="Session duration since check-in (updates every second)"
        >
          <span className="att-status-pill__live-dot" aria-hidden />
          <Clock className="att-status-pill__seg-ico" size={16} strokeWidth={2} aria-hidden />
          <span className="att-status-pill__run tabular-nums">{liveSessionElapsed}</span>
        </span>
        <span className="att-status-pill__seg att-status-pill__seg--label">Checked in</span>
      </>
    );
  }

  if (isCheckedIn) {
    return (
      <>
        <Clock
          className="att-status-pill__ico att-status-pill__ico--pulse"
          size={18}
          strokeWidth={2}
          aria-hidden
        />
        <span className="att-status-pill__text">Checked in</span>
      </>
    );
  }

  return (
    <>
      <Clock className="att-status-pill__ico" size={18} strokeWidth={2} aria-hidden />
      <span className="att-status-pill__text">Checked out</span>
    </>
  );
}

type AttendanceToolbarStatusStripProps = Readonly<{
  status: AttendanceStatusData;
  isCheckedIn: boolean;
  liveSessionElapsed: string;
  dateLine: string | null;
  statusLoading: boolean;
  checkInOutLoading: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
}>;

export function AttendanceToolbarStatusStrip({
  status,
  isCheckedIn,
  liveSessionElapsed,
  dateLine,
  statusLoading,
  checkInOutLoading,
  onCheckIn,
  onCheckOut,
}: AttendanceToolbarStatusStripProps): ReactElement {
  const hasCheckInAt = Boolean(status.attendance?.check_in_at);
  const showLivePill = isCheckedIn && hasCheckInAt && liveSessionElapsed.length > 0;

  const pillClassName = [
    "att-status-pill",
    isCheckedIn ? "att-status-pill--in" : "att-status-pill--out",
    showLivePill ? "att-status-pill--live" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const checkInOutDisabled = statusLoading || checkInOutLoading;
  const checkInOutButtonLabel = checkInOutLoading ? "…" : undefined;

  return (
    <div className="att-toolbar-strip">
      <div className={pillClassName} role="status" aria-live="polite">
        <AttendanceStatusPillBody
          isCheckedIn={isCheckedIn}
          hasCheckInAt={hasCheckInAt}
          liveSessionElapsed={liveSessionElapsed}
        />
      </div>
      {dateLine ? (
        <div className="att-toolbar-strip__date">
          <Calendar size={14} className="flex-shrink-0" aria-hidden />
          <span>{dateLine}</span>
        </div>
      ) : null}
      {isCheckedIn ? (
        <Button
          type="button"
          variant="warning"
          size="sm"
          className="att-action-btn att-action-btn--out"
          disabled={checkInOutDisabled}
          onClick={onCheckOut}
        >
          <LogOut size={18} aria-hidden />
          {checkInOutButtonLabel ?? "Check Out"}
        </Button>
      ) : (
        <Button
          type="button"
          variant="success"
          size="sm"
          className="att-action-btn"
          disabled={checkInOutDisabled}
          onClick={onCheckIn}
        >
          <LogIn size={18} aria-hidden />
          {checkInOutButtonLabel ?? "Check In"}
        </Button>
      )}
    </div>
  );
}

type AttendanceReadonlyStatusPanelProps = Readonly<{
  status: AttendanceStatusData;
  isCheckedIn: boolean;
  statusLabel: string;
  liveSessionElapsed: string;
}>;

export function AttendanceReadonlyStatusPanel({
  status,
  isCheckedIn,
  statusLabel,
  liveSessionElapsed,
}: AttendanceReadonlyStatusPanelProps): ReactElement {
  return (
    <div className="att-status-panel">
      {status.work_date ? (
        <div className="att-status-panel__meta">
          <Calendar size={14} className="att-meta-icon flex-shrink-0" aria-hidden />
          <span>{moment(status.work_date).format("dddd, DD MMM YYYY")}</span>
        </div>
      ) : null}
      <div
        className={`att-status-chip ${isCheckedIn ? "att-status-chip--in" : "att-status-chip--out"}`}
      >
        <Clock size={16} aria-hidden />
        {statusLabel}
      </div>
      {isCheckedIn && status.attendance?.check_in_at ? (
        <AttendanceSessionLiveBlock elapsed={liveSessionElapsed} />
      ) : null}
    </div>
  );
}

type AttendanceStatusDisplayProps = Readonly<{
  statusLoading: boolean;
  status: AttendanceStatusData | null;
  isCheckedIn: boolean;
  canCheckInOut: boolean;
  liveSessionElapsed: string;
  checkInOutLoading: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
}>;

export function AttendanceStatusDisplay({
  statusLoading,
  status,
  isCheckedIn,
  canCheckInOut,
  liveSessionElapsed,
  checkInOutLoading,
  onCheckIn,
  onCheckOut,
}: AttendanceStatusDisplayProps): ReactElement {
  if (statusLoading) {
    return <AttendanceStatusLoading />;
  }

  if (!status) {
    return <AttendanceStatusUnavailable />;
  }

  const dateLine = formatAttendanceToolbarDateLine(status, isCheckedIn);
  const statusLabel = isCheckedIn ? "Checked in" : "Checked out";

  if (canCheckInOut) {
    return (
      <AttendanceToolbarStatusStrip
        status={status}
        isCheckedIn={isCheckedIn}
        liveSessionElapsed={liveSessionElapsed}
        dateLine={dateLine}
        statusLoading={statusLoading}
        checkInOutLoading={checkInOutLoading}
        onCheckIn={onCheckIn}
        onCheckOut={onCheckOut}
      />
    );
  }

  return (
    <AttendanceReadonlyStatusPanel
      status={status}
      isCheckedIn={isCheckedIn}
      statusLabel={statusLabel}
      liveSessionElapsed={liveSessionElapsed}
    />
  );
}
