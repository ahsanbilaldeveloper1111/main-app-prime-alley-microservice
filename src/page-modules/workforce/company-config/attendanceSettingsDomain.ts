import type { AttendanceTenantSettings } from "@utils/staffManagement";

export type AttendanceSettingsFormState = Readonly<{
  multiple_break_types_enabled: boolean;
  auto_checkout_on_hard_limit: boolean;
  timezone: string;
}>;

export function createDefaultAttendanceSettingsFormState(): AttendanceSettingsFormState {
  return {
    multiple_break_types_enabled: true,
    auto_checkout_on_hard_limit: false,
    timezone: "",
  };
}

export function attendanceSettingsToFormState(
  settings: AttendanceTenantSettings | null | undefined,
): AttendanceSettingsFormState {
  const defaults = createDefaultAttendanceSettingsFormState();
  if (!settings) {
    return defaults;
  }
  return {
    multiple_break_types_enabled: settings.multiple_break_types_enabled !== false,
    auto_checkout_on_hard_limit: settings.auto_checkout_on_hard_limit === true,
    timezone: settings.timezone?.trim() ?? "",
  };
}

export function buildAttendanceSettingsPayload(
  tenantId: string,
  form: AttendanceSettingsFormState,
): AttendanceTenantSettings {
  const payload: AttendanceTenantSettings = {
    tenant_id: tenantId.trim(),
    multiple_break_types_enabled: form.multiple_break_types_enabled,
    auto_checkout_on_hard_limit: form.auto_checkout_on_hard_limit,
  };
  const timezone = form.timezone.trim();
  if (timezone) {
    payload.timezone = timezone;
  }
  return payload;
}
