import moment from "moment";
import type { AttendanceCheckInPayload } from "@utils/staffManagement";

export type WorkforceSessionUserLike = Readonly<{
  id?: string | number | null;
  phone?: string | number | null;
  extension?: string | number | null;
  company_identifier?: string | null;
}> | null | undefined;

export type GeoCoordinates = Readonly<{
  latitude: number;
  longitude: number;
}>;

/**
 * Workforce attendance APIs identify users by extension (main-app `phone`), not internal id.
 */
export function readWorkforceExtensionUserId(user: WorkforceSessionUserLike): string {
  const phone = String(user?.phone ?? "").trim();
  if (phone) {
    return phone;
  }
  const extension = String(user?.extension ?? "").trim();
  if (extension) {
    return extension;
  }
  return "";
}

export function readWorkforceTenantId(
  ...candidates: Array<string | null | undefined>
): string {
  for (const candidate of candidates) {
    const trimmed = String(candidate ?? "").trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return "";
}

export function resolveAttendanceWorkDate(preferred?: string | null): string {
  const trimmed = String(preferred ?? "").trim();
  if (trimmed) {
    return trimmed;
  }
  return moment().format("YYYY-MM-DD");
}

export function buildAttendanceWebMeta(
  coordinates?: GeoCoordinates | null,
): NonNullable<AttendanceCheckInPayload["meta"]> {
  const meta: NonNullable<AttendanceCheckInPayload["meta"]> = {
    device: "web",
  };
  if (coordinates) {
    meta.latitude = coordinates.latitude;
    meta.longitude = coordinates.longitude;
  }
  return meta;
}

export function buildAttendanceSessionPayload(args: Readonly<{
  tenantId: string | null | undefined;
  extensionUserId: string;
  workDate?: string | null;
  coordinates?: GeoCoordinates | null;
}>): AttendanceCheckInPayload {
  const tenant_id = readWorkforceTenantId(args.tenantId);
  const user_id = args.extensionUserId.trim();
  return {
    tenant_id: tenant_id || undefined,
    user_id: user_id || undefined,
    work_date: resolveAttendanceWorkDate(args.workDate),
    meta: buildAttendanceWebMeta(args.coordinates),
  };
}

export async function readBrowserGeoCoordinates(): Promise<GeoCoordinates | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  });
}

export function validateAttendanceSessionPayload(
  payload: AttendanceCheckInPayload,
): string | null {
  if (!String(payload.tenant_id ?? "").trim()) {
    return "Company tenant is required for attendance actions.";
  }
  if (!String(payload.user_id ?? "").trim()) {
    return "Your extension number is required for attendance actions.";
  }
  if (!String(payload.work_date ?? "").trim()) {
    return "Work date is required for attendance actions.";
  }
  return null;
}
