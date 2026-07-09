import React, { type ReactElement } from "react";
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
  buildMyAttendanceStatusData,
  isMyAttendanceOnBreak,
  isMyAttendanceOnOvertime,
  readMyAttendanceSessionActive,
  resolveMyAttendanceState,
  readMyAttendanceCheckoutGraceMinutes,
  formatCheckoutGraceHelpText,
  readMyAttendanceLateMinutes,
  shouldShowEarlyCheckoutBadge,
  formatEarlyCheckoutBadgeLabel,
  readMyAttendanceEarlyExitMinutes,
  isMyAttendanceAutoCheckout,
  shouldShowLateArrivalBadge,
  // shouldShowOnTimeWithAdjustmentBadge,
  // formatOnTimeWithAdjustmentBadgeLabel,
  hasSelectableBreakTypes,
} from "./checkInOutDomain";
/* Late adjustment (disabled)
import {
  formatLateAdjustmentRequestStatus,
  isLateAdjustmentPendingStatus,
} from "./lateAdjustmentDomain";
import type { LateAdjustmentRequest } from "@utils/staffManagement";
*/
import { formatAttendanceToolbarDateLine } from "@page-modules/workforce/attendance/attendanceDomain";

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
  onEndOvertime: () => void;
  /* Late adjustment props (disabled)
  showRequestLateAdjustment?: boolean;
  pendingLateAdjustment?: LateAdjustmentRequest | null;
  onRequestLateAdjustment?: () => void;
  */
}>;

function renderStatusDateLine(
  myAttendance: MyAttendanceData,
  isCheckedIn: boolean,
): ReactElement | null {
  const status = buildMyAttendanceStatusData(myAttendance, isCheckedIn);
  const dateLine = status ? formatAttendanceToolbarDateLine(status, isCheckedIn) : null;
  if (!dateLine) {
    return null;
  }
  return (
    <div className="check-in-out-page__status-meta">
      <Calendar size={16} aria-hidden />
      <span>{dateLine}</span>
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
  canPerformActions: boolean,
  liveSessionElapsed: string,
): ReactElement {
  if (statusLoading) {
    return <AttendanceStatusLoading />;
  }
  if (!myAttendance) {
    return <AttendanceStatusUnavailable />;
  }

  const availability = getMyAttendanceActionAvailability(myAttendance, canPerformActions);
  const isCheckedIn = readMyAttendanceSessionActive(myAttendance, availability);
  const status = buildMyAttendanceStatusData(myAttendance, isCheckedIn);
  const { label: statusLabel, chipModifier } = resolveMyAttendanceState(myAttendance.state);
  const chipClass = `check-in-out-page__status-chip check-in-out-page__status-chip--${chipModifier}`;
  const showLiveTimer =
    isCheckedIn && Boolean(status?.attendance?.check_in_at) && liveSessionElapsed;

  return (
    <>
      {renderStatusDateLine(myAttendance, isCheckedIn)}
      {myAttendance.banner ? (
        <p className="check-in-out-page__banner">{myAttendance.banner}</p>
      ) : null}
      {isMyAttendanceAutoCheckout(myAttendance) ? (
        <p className="check-in-out-page__auto-checkout-notice">
          You were automatically checked out.
        </p>
      ) : null}
      <div className={chipClass}>
        {renderStatusIcon(myAttendance.state)}
        {statusLabel}
      </div>
      {showLiveTimer ? <AttendanceSessionLiveBlock elapsed={liveSessionElapsed} /> : null}
      {renderAttendanceOutcomeBadges(myAttendance)}
    </>
  );
}

function renderAttendanceOutcomeBadges(myAttendance: MyAttendanceData): ReactElement | null {
  // const showAdjustmentBadge = shouldShowOnTimeWithAdjustmentBadge(myAttendance);
  const showLateBadge = shouldShowLateArrivalBadge(myAttendance);
  const earlyExitMinutes = readMyAttendanceEarlyExitMinutes(myAttendance);
  const showEarlyBadge = shouldShowEarlyCheckoutBadge(myAttendance);
  const lateMinutes = readMyAttendanceLateMinutes(myAttendance);

  if (!showLateBadge && !showEarlyBadge) {
    return null;
  }

  return (
    <div className="check-in-out-page__outcome-badges">
      {/* Late adjustment badge (disabled)
      {showAdjustmentBadge ? (
        <span className="check-in-out-page__outcome-badge check-in-out-page__outcome-badge--adjusted">
          {formatOnTimeWithAdjustmentBadgeLabel()}
        </span>
      ) : null}
      */}
      {showLateBadge && lateMinutes != null ? (
        <span className="check-in-out-page__outcome-badge check-in-out-page__outcome-badge--late">
          Late arrival — {lateMinutes} min
        </span>
      ) : null}
      {showEarlyBadge ? (
        <span className="check-in-out-page__outcome-badge check-in-out-page__outcome-badge--early-exit">
          {earlyExitMinutes != null
            ? formatEarlyCheckoutBadgeLabel(earlyExitMinutes)
            : "Early checkout"}
        </span>
      ) : null}
    </div>
  );
}

/* Late adjustment notice (disabled)
function renderLateAdjustmentNotice(
  pendingLateAdjustment: LateAdjustmentRequest | null | undefined,
): ReactElement | null {
  if (!pendingLateAdjustment || !isLateAdjustmentPendingStatus(pendingLateAdjustment.status)) {
    return null;
  }
  return (
    <p className="check-in-out-page__late-adjustment-notice">
      Late adjustment request {formatLateAdjustmentRequestStatus(pendingLateAdjustment.status).toLowerCase()}
      {pendingLateAdjustment.reason ? `: ${pendingLateAdjustment.reason}` : "."}
    </p>
  );
}
*/

function renderCheckOutGraceHint(
  myAttendance: MyAttendanceData,
  canCheckOut: boolean,
): ReactElement | null {
  if (!canCheckOut) {
    return null;
  }
  const graceMinutes = readMyAttendanceCheckoutGraceMinutes(myAttendance);
  if (graceMinutes == null) {
    return null;
  }
  return (
    <p className="check-in-out-page__checkout-grace-hint">
      {formatCheckoutGraceHelpText(graceMinutes)}
    </p>
  );
}

function renderSessionActions(
  availability: ReturnType<typeof getMyAttendanceActionAvailability>,
  buttonsDisabled: boolean,
  actionLoading: boolean,
  hasBreakTypes: boolean,
  handlers: Readonly<{
    onStartBreak: () => void;
    onEndBreak: () => void;
    onStartOvertime: () => void;
    onEndOvertime: () => void;
  }>,
): ReactElement | null {
  const hasSessionActions =
    availability.canStartBreak ||
    availability.canEndBreak ||
    availability.canStartOvertime ||
    availability.canEndOvertime;
  if (!hasSessionActions) {
    return null;
  }

  return (
    <div className="check-in-out-page__section">
      <p className="check-in-out-page__section-label">Session actions</p>
      {!hasBreakTypes && availability.canStartBreak ? (
        <p className="check-in-out-page__break-types-empty">No break types configured.</p>
      ) : null}
      <div className="check-in-out-page__secondary-actions">
        <button
          type="button"
          className="check-in-out-page__action-btn check-in-out-page__action-btn--sub-break-start"
          disabled={buttonsDisabled || !availability.canStartBreak || !hasBreakTypes}
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
        <button
          type="button"
          className="check-in-out-page__action-btn check-in-out-page__action-btn--sub-overtime-end"
          disabled={buttonsDisabled || !availability.canEndOvertime}
          onClick={handlers.onEndOvertime}
        >
          <Timer size={18} aria-hidden />
          {actionLoading ? "…" : "End Overtime"}
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
  onEndOvertime,
}: CheckInOutActionsPanelProps): ReactElement {
  const availability = getMyAttendanceActionAvailability(myAttendance, canPerformActions);
  const buttonsDisabled = statusLoading || actionLoading;
  const breakTypesAvailable = hasSelectableBreakTypes(myAttendance);

  return (
    <div className="check-in-out-page__card">
      <div className="check-in-out-page__header">
        <h1 className="check-in-out-page__title">Check in / Check out</h1>
        <p className="check-in-out-page__subtitle">
          Record your work session, breaks, and overtime for today.
        </p>
      </div>

      <div className="check-in-out-page__status">
        {renderStatusSection(
          statusLoading,
          myAttendance,
          canPerformActions,
          liveSessionElapsed,
        )}
      </div>

      {canPerformActions ? (
        <>
          {/* Late adjustment request button (disabled)
          {showRequestLateAdjustment && onRequestLateAdjustment ? (
            <div className="check-in-out-page__section">
              <button
                type="button"
                className="check-in-out-page__action-btn check-in-out-page__action-btn--sub-late-adjustment"
                disabled={buttonsDisabled}
                onClick={onRequestLateAdjustment}
              >
                <Clock size={18} aria-hidden />
                Request late adjustment
              </button>
            </div>
          ) : null}
          */}
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
            {myAttendance
              ? renderCheckOutGraceHint(myAttendance, availability.canCheckOut)
              : null}
          </div>

          {renderSessionActions(availability, buttonsDisabled, actionLoading, breakTypesAvailable, {
            onStartBreak,
            onEndBreak,
            onStartOvertime,
            onEndOvertime,
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
