import type {
  AttendanceGracePeriodPolicy,
  CreateAttendanceGracePeriodPolicyPayload,
} from "@utils/staffManagement";
import {
  buildPolicyEffectiveDatesPayload,
  defaultCompanyPolicyEffectiveFrom,
  readPolicyEffectiveFrom,
  readPolicyEffectiveTo,
  validatePolicyEffectiveDates,
} from "@page-modules/workforce/company-config/companyConfigShared";

export { formatCompanyPolicyUpdatedAt as formatGracePeriodPolicyUpdatedAt } from "@page-modules/workforce/company-config/companyConfigShared";

export const GRACE_PERIOD_CHECK_IN_MAX_MINUTES = 60;
export const GRACE_PERIOD_CHECKOUT_MAX_MINUTES = 60;

export type GracePeriodPolicyFormState = Readonly<{
  grace_minutes: number;
  late_threshold_minutes: number;
  compensate_late_by_stay: boolean;
  late_adjustment_approval_required: boolean;
  effective_from: string;
  effective_to: string;
}>;

export function createDefaultGracePeriodPolicyFormState(): GracePeriodPolicyFormState {
  return {
    grace_minutes: 10,
    late_threshold_minutes: 15,
    compensate_late_by_stay: true,
    late_adjustment_approval_required: false,
    effective_from: defaultCompanyPolicyEffectiveFrom(),
    effective_to: "",
  };
}

function readPolicyBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  return fallback;
}

function readPolicyNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

export function gracePeriodPolicyToFormState(
  policy: AttendanceGracePeriodPolicy | null | undefined,
): GracePeriodPolicyFormState {
  const defaults = createDefaultGracePeriodPolicyFormState();
  if (!policy) {
    return defaults;
  }

  const record = policy as Record<string, unknown>;

  return {
    ...defaults,
    grace_minutes: readPolicyNumber(policy.grace_minutes, defaults.grace_minutes),
    late_threshold_minutes: readPolicyNumber(
      policy.late_threshold_minutes,
      defaults.late_threshold_minutes,
    ),
    compensate_late_by_stay: readPolicyBoolean(
      policy.compensate_late_by_stay ?? record.compensateLateByStay,
      defaults.compensate_late_by_stay,
    ),
    late_adjustment_approval_required: readPolicyBoolean(
      policy.late_adjustment_approval_required ?? record.lateAdjustmentApprovalRequired,
      defaults.late_adjustment_approval_required,
    ),
    effective_from: readPolicyEffectiveFrom(policy, record),
    effective_to: readPolicyEffectiveTo(policy, record),
  };
}

export function applyGracePeriodPolicyToggle<K extends keyof GracePeriodPolicyFormState>(
  form: GracePeriodPolicyFormState,
  key: K,
  value: GracePeriodPolicyFormState[K],
): GracePeriodPolicyFormState {
  const next = { ...form, [key]: value };
  if (key === "late_adjustment_approval_required" && value === true) {
    return { ...next, compensate_late_by_stay: false };
  }
  if (key === "compensate_late_by_stay" && value === true) {
    return { ...next, late_adjustment_approval_required: false };
  }
  return next;
}

export function validateGracePeriodPolicyForm(
  form: GracePeriodPolicyFormState,
  tenantId: string,
): string | null {
  if (!(tenantId ?? "").trim()) {
    return "Select a tenant.";
  }
  if (!Number.isFinite(form.grace_minutes) || form.grace_minutes < 0) {
    return "Check-in grace cannot be negative.";
  }
  if (form.grace_minutes > GRACE_PERIOD_CHECK_IN_MAX_MINUTES) {
    return `Check-in grace cannot exceed ${GRACE_PERIOD_CHECK_IN_MAX_MINUTES} minutes.`;
  }
  if (!Number.isFinite(form.late_threshold_minutes) || form.late_threshold_minutes < 0) {
    return "Check-out grace cannot be negative.";
  }
  if (form.late_threshold_minutes > GRACE_PERIOD_CHECKOUT_MAX_MINUTES) {
    return `Check-out grace cannot exceed ${GRACE_PERIOD_CHECKOUT_MAX_MINUTES} minutes.`;
  }
  return validatePolicyEffectiveDates(form.effective_from, form.effective_to);
}

export function buildGracePeriodPolicyPayload(
  tenantId: string,
  form: GracePeriodPolicyFormState,
): CreateAttendanceGracePeriodPolicyPayload {
  const trimmedTenantId = tenantId.trim();
  const effectiveDates = buildPolicyEffectiveDatesPayload(
    form.effective_from,
    form.effective_to,
  );

  return {
    tenant_id: trimmedTenantId,
    target_type: "company",
    target_id: trimmedTenantId,
    grace_minutes: form.grace_minutes,
    late_threshold_minutes: form.late_threshold_minutes,
    compensate_late_by_stay: form.compensate_late_by_stay,
    late_adjustment_approval_required: form.late_adjustment_approval_required,
    ...effectiveDates,
  };
}
