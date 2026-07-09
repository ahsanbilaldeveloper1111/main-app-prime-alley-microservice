import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import "@page-modules/workforce/shared/workforcePages.scss";
import "@page-modules/workforce/check-in-out/checkInOutPage.scss";
import "@assets/scss/attendance-page.scss";

import React, { type ReactElement, useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import Layout from "@layout/index";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import { useMainAppLookups } from "@hooks/useMainAppLookups";
import { workforceKeys } from "@query/keys";
import {
  attendanceBreakEnd,
  attendanceBreakStart,
  attendanceCheckIn,
  attendanceCheckOut,
  attendanceOvertimeEnd,
  attendanceOvertimeStart,
  normalizeMyAttendanceData,
  type AttendanceBreakType,
} from "@utils/staffManagement";
import {
  readWorkforceExtensionUserId,
  readWorkforceTenantId,
  validateAttendanceSessionPayload,
} from "@utils/workforce/attendanceActionPayload";
import { consumeHandledAttendanceError } from "@page-modules/workforce/attendance/attendanceDomain";
import { useAttendanceLiveSessionElapsed } from "@page-modules/workforce/attendance/useAttendanceLiveSessionElapsed";
import {
  buildCheckInOutSessionPayload,
  buildCheckInPayload,
  buildStartBreakPayload,
} from "@page-modules/workforce/check-in-out/buildCheckInOutActionPayload";
import { CheckInOutActionsPanel } from "@page-modules/workforce/check-in-out/CheckInOutActionsPanel";
import { EmployeeAttendanceReportPanel } from "@page-modules/workforce/check-in-out/EmployeeAttendanceReportPanel";
import {
  readMyAttendanceCheckInAt,
  buildCheckOutSuccessMessage,
  getMyAttendanceActionAvailability,
  OVERTIME_UNAPPROVED_WARNING,
  readMyAttendanceMultipleBreakTypesEnabled,
  readSelectableBreakTypes,
  SHIFT_END_MODAL_SNOOZE_MS,
  shouldShowShiftEndModal,
} from "@page-modules/workforce/check-in-out/checkInOutDomain";
/* Late adjustment (disabled)
import { LateAdjustmentRequestsPanel } from "@page-modules/workforce/check-in-out/LateAdjustmentRequestsPanel";
import { RequestLateAdjustmentModal } from "@page-modules/workforce/check-in-out/RequestLateAdjustmentModal";
import {
  findPendingLateAdjustmentRequest,
  shouldShowRequestLateAdjustmentAction,
} from "@page-modules/workforce/check-in-out/lateAdjustmentDomain";
import {
  useApproveLateAdjustmentMutation,
  useRejectLateAdjustmentMutation,
  useSubmitLateAdjustmentMutation,
} from "@page-modules/workforce/check-in-out/useLateAdjustmentMutations";
import { useLateAdjustmentRequestsQuery } from "@page-modules/workforce/check-in-out/useLateAdjustmentRequestsQuery";
*/
import { ShiftEndModal } from "@page-modules/workforce/check-in-out/ShiftEndModal";
import { StartBreakTypeModal } from "@page-modules/workforce/check-in-out/StartBreakTypeModal";
import { useMyAttendanceQuery } from "@page-modules/workforce/check-in-out/useMyAttendanceQuery";
import { WorkforceListPageShell } from "@page-modules/workforce/shared/WorkforceListPageShell";

const { PERMISSIONS } = HEADER_CONSTANTS;

const CheckInOutPage = () => {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { companyIdentifier } = useMainAppLookups();
  const sessionUser = session?.user;
  const [showStartBreakModal, setShowStartBreakModal] = useState(false);
  // const [showLateAdjustmentModal, setShowLateAdjustmentModal] = useState(false);
  const [showShiftEndModal, setShowShiftEndModal] = useState(false);
  const [shiftEndSnoozedUntil, setShiftEndSnoozedUntil] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  const canPerformActions = Boolean(
    sessionUser?.permissions?.includes(PERMISSIONS.CHECK_IN_OUT_ATTENDENCE_STAFF_MANAGEMENT),
  );
  /* Late adjustment manager permission (disabled)
  const canManageLateAdjustments = Boolean(
    sessionUser?.permissions?.includes(PERMISSIONS.STAFF_MANAGEMENT_SERVICES),
  );
  */

  const myAttendanceQuery = useMyAttendanceQuery();
  const myAttendance = myAttendanceQuery.data ?? null;
  const breakTypesTenantId = readWorkforceTenantId(
    myAttendance?.tenant_id,
    companyIdentifier,
    sessionUser?.company_identifier,
  );
  const extensionUserId = readWorkforceExtensionUserId(sessionUser);

  /* Late adjustment queries & mutations (disabled)
  const myLateAdjustmentQuery = useLateAdjustmentRequestsQuery({
    tenantId: breakTypesTenantId,
    userId: extensionUserId,
    status: "pending",
    enabled: canPerformActions && Boolean(breakTypesTenantId && extensionUserId),
  });
  const managerLateAdjustmentQuery = useLateAdjustmentRequestsQuery({
    tenantId: breakTypesTenantId,
    status: "pending",
    enabled: canManageLateAdjustments && Boolean(breakTypesTenantId),
  });

  const pendingLateAdjustment = useMemo(
    () => findPendingLateAdjustmentRequest(myLateAdjustmentQuery.data ?? []),
    [myLateAdjustmentQuery.data],
  );
  const showRequestLateAdjustment = shouldShowRequestLateAdjustmentAction({
    myAttendance,
    pendingRequest: pendingLateAdjustment,
    canPerformActions,
  });

  const submitLateAdjustmentMutation = useSubmitLateAdjustmentMutation();
  const approveLateAdjustmentMutation = useApproveLateAdjustmentMutation();
  const rejectLateAdjustmentMutation = useRejectLateAdjustmentMutation();
  */

  const invalidateAttendanceReads = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: workforceKeys.attendance.all() }).catch((err: unknown) => {
      consumeHandledAttendanceError(err, "CheckInOut.invalidateReads");
    });
  }, [queryClient]);

  const buildSessionPayload = useCallback(
    () =>
      buildCheckInOutSessionPayload({
        sessionUser,
        tenantId: companyIdentifier,
        myAttendance,
      }),
    [companyIdentifier, myAttendance, sessionUser],
  );

  const validatePayloadOrToast = useCallback(
    (payload: ReturnType<typeof buildCheckInOutSessionPayload>): boolean => {
      const error = validateAttendanceSessionPayload(payload);
      if (!error) {
        return true;
      }
      toast.error(error);
      return false;
    },
    [],
  );

  const checkInMutation = useMutation({
    mutationFn: async () => {
      const payload = await buildCheckInPayload({
        sessionUser,
        tenantId: companyIdentifier,
        myAttendance,
      });
      if (!validatePayloadOrToast(payload)) {
        throw new Error("Invalid check-in payload");
      }
      return attendanceCheckIn(payload);
    },
    onSuccess: () => {
      toast.success("Checked in successfully");
      invalidateAttendanceReads();
    },
    onError: (err: unknown) => {
      if (err instanceof Error && err.message === "Invalid check-in payload") {
        return;
      }
      consumeHandledAttendanceError(err, "CheckInOut.checkIn");
      toast.error("Check-in failed");
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: () => {
      const payload = buildSessionPayload();
      if (!validatePayloadOrToast(payload)) {
        throw new Error("Invalid check-out payload");
      }
      return attendanceCheckOut(payload);
    },
    onSuccess: (data) => {
      let normalizedAttendance = myAttendance;
      if (data != null && typeof data === "object") {
        normalizedAttendance = normalizeMyAttendanceData(data);
        queryClient.setQueryData(workforceKeys.attendance.my(), normalizedAttendance);
      }
      toast.success(buildCheckOutSuccessMessage(normalizedAttendance));
      setShowShiftEndModal(false);
      invalidateAttendanceReads();
    },
    onError: (err: unknown) => {
      if (err instanceof Error && err.message === "Invalid check-out payload") {
        return;
      }
      consumeHandledAttendanceError(err, "CheckInOut.checkOut");
      toast.error("Check-out failed");
    },
  });

  const startBreakMutation = useMutation({
    mutationFn: (breakType: AttendanceBreakType) => {
      const sessionPayload = buildSessionPayload();
      if (!validatePayloadOrToast(sessionPayload)) {
        throw new Error("Invalid start-break payload");
      }
      return attendanceBreakStart(
        buildStartBreakPayload(sessionPayload, breakType.id, breakType.name),
      );
    },
    onSuccess: () => {
      toast.success("Break started");
      setShowStartBreakModal(false);
      invalidateAttendanceReads();
    },
    onError: (err: unknown) => {
      if (err instanceof Error && err.message === "Invalid start-break payload") {
        return;
      }
      consumeHandledAttendanceError(err, "CheckInOut.startBreak");
      toast.error("Failed to start break");
    },
  });

  const endBreakMutation = useMutation({
    mutationFn: () => {
      const payload = buildSessionPayload();
      if (!validatePayloadOrToast(payload)) {
        throw new Error("Invalid end-break payload");
      }
      return attendanceBreakEnd(payload);
    },
    onSuccess: () => {
      toast.success("Break ended");
      invalidateAttendanceReads();
    },
    onError: (err: unknown) => {
      if (err instanceof Error && err.message === "Invalid end-break payload") {
        return;
      }
      consumeHandledAttendanceError(err, "CheckInOut.endBreak");
      toast.error("Failed to end break");
    },
  });

  const startOvertimeMutation = useMutation({
    mutationFn: (estimatedEndAt?: string) => {
      const payload = buildSessionPayload();
      if (!validatePayloadOrToast(payload)) {
        throw new Error("Invalid start-overtime payload");
      }
      return attendanceOvertimeStart({
        ...payload,
        is_approved: false,
        ...(estimatedEndAt ? { estimated_end_at: estimatedEndAt } : {}),
      });
    },
    onSuccess: () => {
      toast.success("Overtime started");
      setShowShiftEndModal(false);
      invalidateAttendanceReads();
    },
    onError: (err: unknown) => {
      if (err instanceof Error && err.message === "Invalid start-overtime payload") {
        return;
      }
      consumeHandledAttendanceError(err, "CheckInOut.startOvertime");
      toast.error("Failed to start overtime");
    },
  });

  const endOvertimeMutation = useMutation({
    mutationFn: () => {
      const payload = buildSessionPayload();
      if (!validatePayloadOrToast(payload)) {
        throw new Error("Invalid end-overtime payload");
      }
      return attendanceOvertimeEnd(payload);
    },
    onSuccess: () => {
      toast.success("Overtime ended");
      invalidateAttendanceReads();
    },
    onError: (err: unknown) => {
      if (err instanceof Error && err.message === "Invalid end-overtime payload") {
        return;
      }
      consumeHandledAttendanceError(err, "CheckInOut.endOvertime");
      toast.error("Failed to end overtime");
    },
  });

  const handleStartOvertime = useCallback(
    (estimatedEndAt?: string) => {
      if (!estimatedEndAt) {
        const confirmed = globalThis.confirm(
          `${OVERTIME_UNAPPROVED_WARNING}\n\nDo you want to continue?`,
        );
        if (!confirmed) {
          return;
        }
      }
      startOvertimeMutation.mutate(estimatedEndAt);
    },
    [startOvertimeMutation],
  );

  const actionAvailability = useMemo(
    () => getMyAttendanceActionAvailability(myAttendance, canPerformActions),
    [canPerformActions, myAttendance],
  );

  useEffect(() => {
    const intervalId = globalThis.setInterval(() => setNowTick(Date.now()), 30_000);
    return () => globalThis.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const shouldShow = shouldShowShiftEndModal(
      myAttendance,
      actionAvailability,
      shiftEndSnoozedUntil,
      nowTick,
    );
    setShowShiftEndModal(shouldShow);
  }, [actionAvailability, myAttendance, nowTick, shiftEndSnoozedUntil]);

  const handleShiftEndSnooze = useCallback(() => {
    setShiftEndSnoozedUntil(Date.now() + SHIFT_END_MODAL_SNOOZE_MS);
    setShowShiftEndModal(false);
  }, []);

  const actionLoading =
    checkInMutation.isPending ||
    checkOutMutation.isPending ||
    startBreakMutation.isPending ||
    endBreakMutation.isPending ||
    startOvertimeMutation.isPending ||
    endOvertimeMutation.isPending;
    // submitLateAdjustmentMutation.isPending ||
    // approveLateAdjustmentMutation.isPending ||
    // rejectLateAdjustmentMutation.isPending;

  /* Late adjustment handlers (disabled)
  const getEmployeeLabel = useCallback(
    (userId: string | null | undefined): string => {
      const idStr = userId?.trim() ?? "";
      if (!idStr) {
        return "Employee";
      }
      const users = (mainAppUsers ?? []) as Array<{ id: string | number; name?: string | null; phone?: string | null }>;
      const match = users.find(
        (user) =>
          String(user.id) === idStr ||
          String(user.phone ?? "").trim() === idStr,
      );
      return match?.name?.trim() || idStr;
    },
    [mainAppUsers],
  );

  const handleSubmitLateAdjustment = useCallback(
    (reason: string) => {
      const tenantId = breakTypesTenantId?.trim() ?? "";
      const userId = extensionUserId?.trim() ?? "";
      if (!tenantId || !userId) {
        toast.error("Missing tenant or user for late adjustment request.");
        return;
      }
      submitLateAdjustmentMutation.mutate(
        { tenant_id: tenantId, user_id: userId, reason },
        {
          onSuccess: () => {
            setShowLateAdjustmentModal(false);
            invalidateAttendanceReads();
          },
        },
      );
    },
    [
      breakTypesTenantId,
      extensionUserId,
      invalidateAttendanceReads,
      submitLateAdjustmentMutation,
    ],
  );

  const handleApproveLateAdjustment = useCallback(
    (request: { id: number }, comment: string) => {
      const tenantId = breakTypesTenantId?.trim() ?? "";
      if (!tenantId) {
        toast.error("Missing tenant for late adjustment approval.");
        return;
      }
      approveLateAdjustmentMutation.mutate({
        id: request.id,
        payload: {
          tenant_id: tenantId,
          ...(comment ? { comment } : {}),
        },
      });
    },
    [approveLateAdjustmentMutation, breakTypesTenantId],
  );

  const handleRejectLateAdjustment = useCallback(
    (request: { id: number }, comment: string) => {
      const tenantId = breakTypesTenantId?.trim() ?? "";
      if (!tenantId) {
        toast.error("Missing tenant for late adjustment rejection.");
        return;
      }
      rejectLateAdjustmentMutation.mutate({
        id: request.id,
        payload: {
          tenant_id: tenantId,
          ...(comment ? { comment } : {}),
        },
      });
    },
    [breakTypesTenantId, rejectLateAdjustmentMutation],
  );
  */

  const handleStartBreak = useCallback(() => {
    const breakTypes = readSelectableBreakTypes(myAttendance);
    if (breakTypes.length === 0) {
      toast.error("No break types configured.");
      return;
    }
    const singleBreakMode = readMyAttendanceMultipleBreakTypesEnabled(myAttendance) === false;
    if (singleBreakMode && breakTypes.length === 1) {
      startBreakMutation.mutate(breakTypes[0]);
      return;
    }
    setShowStartBreakModal(true);
  }, [myAttendance, startBreakMutation]);

  const sessionCheckInAt = readMyAttendanceCheckInAt(myAttendance);
  const liveSessionElapsed = useAttendanceLiveSessionElapsed(sessionCheckInAt);

  const reportTenantId = readWorkforceTenantId(
    myAttendance?.tenant_id,
    companyIdentifier,
    sessionUser?.company_identifier,
  );
  const reportUserId = readWorkforceExtensionUserId(sessionUser);

  return (
    <WorkforceListPageShell breadcrumbSubTitle="Check in / Check out">
      <div className="check-in-out-page">
        <div className="check-in-out-page__layout">
          <div className="check-in-out-page__main-columns">
            <div className="check-in-out-page__report-col">
              <EmployeeAttendanceReportPanel tenantId={reportTenantId || null} userId={reportUserId || null} />
            </div>

            <div className="check-in-out-page__actions-col">
              <CheckInOutActionsPanel
                statusLoading={myAttendanceQuery.isFetching}
                myAttendance={myAttendance}
                canPerformActions={canPerformActions}
                liveSessionElapsed={liveSessionElapsed}
                actionLoading={actionLoading}
                onCheckIn={() => checkInMutation.mutate()}
                onCheckOut={() => checkOutMutation.mutate()}
                onStartBreak={handleStartBreak}
                onEndBreak={() => endBreakMutation.mutate()}
                onStartOvertime={handleStartOvertime}
                onEndOvertime={() => endOvertimeMutation.mutate()}
              />
            </div>
          </div>

          {/* Late adjustment manager panel (disabled)
          {canManageLateAdjustments ? (
            <LateAdjustmentRequestsPanel
              requests={managerLateAdjustmentQuery.data ?? []}
              isLoading={managerLateAdjustmentQuery.isFetching}
              isError={managerLateAdjustmentQuery.isError}
              actionLoading={
                approveLateAdjustmentMutation.isPending || rejectLateAdjustmentMutation.isPending
              }
              getEmployeeLabel={getEmployeeLabel}
              onApprove={handleApproveLateAdjustment}
              onReject={handleRejectLateAdjustment}
              onRetry={() => {
                managerLateAdjustmentQuery.refetch().catch(() => undefined);
              }}
            />
          ) : null}
          */}
        </div>
      </div>

      <StartBreakTypeModal
        show={showStartBreakModal}
        tenantId={breakTypesTenantId || null}
        contextBreakTypes={myAttendance?.context?.break_types}
        isSubmitting={startBreakMutation.isPending}
        onClose={() => {
          if (startBreakMutation.isPending) return;
          setShowStartBreakModal(false);
        }}
        onConfirm={(breakType) => startBreakMutation.mutate(breakType)}
      />

      {/* Late adjustment request modal (disabled)
      <RequestLateAdjustmentModal
        show={showLateAdjustmentModal}
        lateMinutes={myAttendance?.attendance?.late_minutes ?? null}
        isSubmitting={submitLateAdjustmentMutation.isPending}
        onClose={() => {
          if (submitLateAdjustmentMutation.isPending) {
            return;
          }
          setShowLateAdjustmentModal(false);
        }}
        onConfirm={handleSubmitLateAdjustment}
      />
      */}

      <ShiftEndModal
        show={showShiftEndModal}
        canStartOvertime={actionAvailability.canStartOvertime}
        isSubmitting={checkOutMutation.isPending || startOvertimeMutation.isPending}
        onCheckOut={() => checkOutMutation.mutate()}
        onStartOvertime={handleStartOvertime}
        onSnooze={handleShiftEndSnooze}
        onHide={() => {
          if (checkOutMutation.isPending || startOvertimeMutation.isPending) {
            return;
          }
          handleShiftEndSnooze();
        }}
      />
    </WorkforceListPageShell>
  );
};

CheckInOutPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default CheckInOutPage;
