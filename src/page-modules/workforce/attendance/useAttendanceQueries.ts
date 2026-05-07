import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getAttendance,
  getAttendanceStatus,
  type AttendanceRecord,
  type AttendanceStatusData,
} from "@utils/staffManagement";
import { workforceKeys } from "../../../query/keys";
import {
  buildAttendanceListRequestParams,
  serializeAttendanceListFiltersKey,
  type AttendancePaginationState,
} from "./attendanceDomain";

export type AttendanceListPayload = Readonly<{
  records: AttendanceRecord[];
  pagination: AttendancePaginationState | null;
}>;

async function fetchAttendanceListPayload(args: Readonly<{
  page: number;
  limit: number;
  appliedUserIds: readonly string[];
  selectedDatePreset: string;
}>): Promise<AttendanceListPayload> {
  try {
    const params = buildAttendanceListRequestParams(args);
    const { data, pagination: p } = await getAttendance(params);
    const records = data ?? [];
    if (!p) {
      return { records, pagination: null };
    }
    return {
      records,
      pagination: {
        page: p.page,
        limit: p.limit,
        total: p.total,
        last_page: p.last_page,
      },
    };
  } catch (err) {
    console.error("[Attendance] Failed to load attendance records", err);
    return { records: [], pagination: null };
  }
}

async function fetchAttendanceStatusSafe(): Promise<AttendanceStatusData | null> {
  try {
    return await getAttendanceStatus();
  } catch (err) {
    console.error("[Attendance] Failed to load attendance status", err);
    return null;
  }
}

export function useAttendanceListQuery(args: Readonly<{
  page: number;
  limit: number;
  appliedUserIds: readonly string[];
  selectedDatePreset: string;
}>) {
  const filtersKey = serializeAttendanceListFiltersKey(args.appliedUserIds, args.selectedDatePreset);
  return useQuery({
    queryKey: workforceKeys.attendance.list({
      page: args.page,
      limit: args.limit,
      filtersKey,
    }),
    queryFn: () =>
      fetchAttendanceListPayload({
        page: args.page,
        limit: args.limit,
        appliedUserIds: args.appliedUserIds,
        selectedDatePreset: args.selectedDatePreset,
      }),
    placeholderData: keepPreviousData,
  });
}

export function useAttendanceStatusQuery() {
  return useQuery({
    queryKey: workforceKeys.attendance.status(),
    queryFn: fetchAttendanceStatusSafe,
  });
}
