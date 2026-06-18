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

export type GracePeriodPolicyFormState = Readonly<{
  grace_minutes: number;
  late_threshold_minutes: number;
  effective_from: string;
  effective_to: string;
}>;

export function createDefaultGracePeriodPolicyFormState(): GracePeriodPolicyFormState {
  return {
    grace_minutes: 10,
    late_threshold_minutes: 15,
    effective_from: defaultCompanyPolicyEffectiveFrom(),
    effective_to: "",
  };
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
    effective_from: readPolicyEffectiveFrom(policy, record),
    effective_to: readPolicyEffectiveTo(policy, record),
  };
}

export function validateGracePeriodPolicyForm(
  form: GracePeriodPolicyFormState,
  tenantId: string,
): string | null {
  if (!(tenantId ?? "").trim()) {
    return "Select a tenant.";
  }
  if (!Number.isFinite(form.grace_minutes) || form.grace_minutes < 0) {
    return "Grace minutes cannot be negative.";
  }
  if (!Number.isFinite(form.late_threshold_minutes) || form.late_threshold_minutes < 0) {
    return "Late threshold minutes cannot be negative.";
  }
  if (form.late_threshold_minutes < form.grace_minutes) {
    return "Late threshold cannot be less than grace minutes.";
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
    ...effectiveDates,
  };
}
