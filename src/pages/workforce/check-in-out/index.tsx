import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import "@page-modules/workforce/shared/workforcePages.scss";
import "@page-modules/workforce/check-in-out/checkInOutPage.scss";
import "@assets/scss/attendance-page.scss";

import React, { type ReactElement, useCallback, useState } from "react";
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
  attendanceOvertimeStart,
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
import { readMyAttendanceCheckInAt } from "@page-modules/workforce/check-in-out/checkInOutDomain";
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

  const canPerformActions = Boolean(
    sessionUser?.permissions?.includes(PERMISSIONS.CHECK_IN_OUT_ATTENDENCE_STAFF_MANAGEMENT),
  );

  const myAttendanceQuery = useMyAttendanceQuery();
  const myAttendance = myAttendanceQuery.data ?? null;
  const breakTypesTenantId = readWorkforceTenantId(
    myAttendance?.tenant_id,
    companyIdentifier,
    sessionUser?.company_identifier,
  );

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
    onSuccess: () => {
      toast.success("Checked out successfully");
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
    mutationFn: (breakTypeId: number) => {
      const sessionPayload = buildSessionPayload();
      if (!validatePayloadOrToast(sessionPayload)) {
        throw new Error("Invalid start-break payload");
      }
      return attendanceBreakStart(buildStartBreakPayload(sessionPayload, breakTypeId));
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
    mutationFn: () => {
      const payload = buildSessionPayload();
      if (!validatePayloadOrToast(payload)) {
        throw new Error("Invalid start-overtime payload");
      }
      return attendanceOvertimeStart(payload);
    },
    onSuccess: () => {
      toast.success("Overtime started");
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

  const actionLoading =
    checkInMutation.isPending ||
    checkOutMutation.isPending ||
    startBreakMutation.isPending ||
    endBreakMutation.isPending ||
    startOvertimeMutation.isPending;

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
                onStartBreak={() => setShowStartBreakModal(true)}
                onEndBreak={() => endBreakMutation.mutate()}
                onStartOvertime={() => startOvertimeMutation.mutate()}
              />
            </div>
          </div>
        </div>
      </div>

      <StartBreakTypeModal
        show={showStartBreakModal}
        tenantId={breakTypesTenantId || null}
        isSubmitting={startBreakMutation.isPending}
        onClose={() => {
          if (startBreakMutation.isPending) return;
          setShowStartBreakModal(false);
        }}
        onConfirm={(breakTypeId) => startBreakMutation.mutate(breakTypeId)}
      />
    </WorkforceListPageShell>
  );
};

CheckInOutPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default CheckInOutPage;
