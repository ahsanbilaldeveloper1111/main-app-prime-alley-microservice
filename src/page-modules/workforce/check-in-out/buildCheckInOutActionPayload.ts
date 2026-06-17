import type { MyAttendanceData, AttendanceBreakStartPayload } from "@utils/staffManagement";
import {
  buildAttendanceSessionPayload,
  readBrowserGeoCoordinates,
  readWorkforceExtensionUserId,
  readWorkforceTenantId,
  type WorkforceSessionUserLike,
} from "@utils/workforce/attendanceActionPayload";

export async function buildCheckInPayload(args: Readonly<{
  sessionUser: WorkforceSessionUserLike;
  tenantId: string | null | undefined;
  myAttendance: MyAttendanceData | null;
}>): Promise<ReturnType<typeof buildAttendanceSessionPayload>> {
  const coordinates = await readBrowserGeoCoordinates();
  return buildAttendanceSessionPayload({
    tenantId: readWorkforceTenantId(
      args.myAttendance?.tenant_id,
      args.tenantId,
      args.sessionUser?.company_identifier,
    ),
    extensionUserId: readWorkforceExtensionUserId(args.sessionUser),
    workDate: args.myAttendance?.work_date,
    coordinates,
  });
}

export function buildCheckInOutSessionPayload(args: Readonly<{
  sessionUser: WorkforceSessionUserLike;
  tenantId: string | null | undefined;
  myAttendance: MyAttendanceData | null;
}>): ReturnType<typeof buildAttendanceSessionPayload> {
  return buildAttendanceSessionPayload({
    tenantId: readWorkforceTenantId(
      args.myAttendance?.tenant_id,
      args.tenantId,
      args.sessionUser?.company_identifier,
    ),
    extensionUserId: readWorkforceExtensionUserId(args.sessionUser),
    workDate: args.myAttendance?.work_date,
  });
}

export function buildStartBreakPayload(
  sessionPayload: ReturnType<typeof buildAttendanceSessionPayload>,
  breakTypeId: number,
): AttendanceBreakStartPayload {
  return {
    ...sessionPayload,
    break_type_id: breakTypeId,
  };
}
