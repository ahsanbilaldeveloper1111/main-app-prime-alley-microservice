/** Late adjustment feature disabled — uncomment the block below to re-enable. */

/*
import type { LateAdjustmentRequest, MyAttendanceData } from "@utils/staffManagement";

export const ON_TIME_WITH_ADJUSTMENT_STATUS = "on_time_with_adjustment";
export const LATE_ADJUSTMENT_PENDING_STATUS = "pending";

export function readLateAdjustmentApprovalRequired(data: MyAttendanceData | null): boolean {
  return data?.context?.policies?.grace_period?.late_adjustment_approval_required === true;
}

export function isOnTimeWithAdjustmentStatus(status: string | null | undefined): boolean {
  const normalized = status?.trim().toLowerCase() ?? "";
  return (
    normalized === ON_TIME_WITH_ADJUSTMENT_STATUS ||
    normalized === "on time with adjustment"
  );
}

export function shouldShowOnTimeWithAdjustmentBadge(data: MyAttendanceData | null): boolean {
  if (!data?.attendance) {
    return false;
  }
  return isOnTimeWithAdjustmentStatus(data.attendance.status);
}

export function isLateAdjustmentPendingStatus(status: string | null | undefined): boolean {
  return status?.trim().toLowerCase() === LATE_ADJUSTMENT_PENDING_STATUS;
}

export function findPendingLateAdjustmentRequest(
  requests: readonly LateAdjustmentRequest[],
): LateAdjustmentRequest | null {
  return (
    requests.find((request) => isLateAdjustmentPendingStatus(request.status)) ?? null
  );
}

export function shouldShowRequestLateAdjustmentAction(args: Readonly<{
  myAttendance: MyAttendanceData | null;
  pendingRequest: LateAdjustmentRequest | null;
  canPerformActions: boolean;
}>): boolean {
  if (!args.canPerformActions || !args.myAttendance) {
    return false;
  }
  if (!readLateAdjustmentApprovalRequired(args.myAttendance)) {
    return false;
  }
  if (args.pendingRequest) {
    return false;
  }
  const lateMinutes = args.myAttendance.attendance?.late_minutes;
  if (lateMinutes == null || !Number.isFinite(lateMinutes) || lateMinutes <= 0) {
    return false;
  }
  const state = args.myAttendance.state.trim().toLowerCase();
  return state === "checked_in" || state === "on_break" || args.myAttendance.is_checked_in === true;
}

export function formatLateAdjustmentRequestStatus(status: string | null | undefined): string {
  const normalized = status?.trim().toLowerCase() ?? "";
  if (normalized === "pending") return "Pending";
  if (normalized === "approved") return "Approved";
  if (normalized === "rejected") return "Rejected";
  if (!normalized) return "—";
  return normalized
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function validateLateAdjustmentReason(reason: string): string | null {
  const trimmed = reason.trim();
  if (!trimmed) {
    return "Please provide a reason for your late adjustment request.";
  }
  if (trimmed.length < 5) {
    return "Reason must be at least 5 characters.";
  }
  return null;
}
*/
