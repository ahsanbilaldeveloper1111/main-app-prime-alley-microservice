import type { UserProfile, UserProfileAddress } from "@utils/staffManagement";

/** Pakistan CNIC: 5-7-1 digits (13 total). */
export const CNIC_MAX_DIGITS = 13;

export function stripCnicDigits(value: string | null | undefined): string {
  return String(value ?? "").replace(/\D/g, "").slice(0, CNIC_MAX_DIGITS);
}

/** Formats CNIC as XXXXX-XXXXXXX-X while typing. */
export function formatCnicInput(raw: string): string {
  const digits = stripCnicDigits(raw);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

export function formatCnicForDisplay(value: string | null | undefined): string {
  const trimmed = String(value ?? "").trim();
  if (trimmed === "") return "—";
  const formatted = formatCnicInput(trimmed);
  return formatted || "—";
}

export function isValidCnic(value: string | null | undefined): boolean {
  const digits = stripCnicDigits(value);
  return digits.length === 0 || digits.length === CNIC_MAX_DIGITS;
}

export function normalizeWorkforcePhoneKey(phone: string | null | undefined): string {
  return String(phone ?? "").trim();
}

export function findEmployeeWithDuplicatePhone(
  phone: string,
  profiles: ReadonlyArray<Pick<UserProfile, "id" | "phone">>,
  excludeProfileId?: number,
): Pick<UserProfile, "id" | "phone"> | undefined {
  const key = normalizeWorkforcePhoneKey(phone);
  if (key === "") return undefined;
  return profiles.find(
    (profile) =>
      profile.id !== excludeProfileId && normalizeWorkforcePhoneKey(profile.phone) === key,
  );
}

export function resolveEmployeeAddresses(
  profile: Pick<UserProfile, "addresses"> & { address_locations?: UserProfileAddress[] },
): UserProfileAddress[] {
  if (profile.addresses?.length) return profile.addresses;
  if (profile.address_locations?.length) return profile.address_locations;
  return [];
}

export function formatEmployeeAddressBlock(
  addresses: UserProfileAddress[] | null | undefined,
  profile?: Pick<UserProfile, "addresses"> & { address_locations?: UserProfileAddress[] },
): string {
  let rows: UserProfileAddress[] = [];
  if (addresses && addresses.length > 0) {
    rows = addresses;
  } else if (profile) {
    rows = resolveEmployeeAddresses(profile);
  }
  if (!rows.length) return "—";
  const blocks = rows
    .map((row) => {
      const parts = [
        row.name?.trim(),
        row.address?.trim(),
        [row.city?.trim(), row.state?.trim()].filter(Boolean).join(", "),
        row.country?.trim(),
        row.zip_code?.trim(),
      ].filter((part) => Boolean(part && part.length > 0));
      return parts.join(", ");
    })
    .filter((block) => block.length > 0);
  return blocks.length > 0 ? blocks.join("\n") : "—";
}

export function resolveEmployeeIdDisplay(profile: Pick<UserProfile, "employee_code" | "id">): string {
  const code = String(profile.employee_code ?? "").trim();
  if (code !== "") return code;
  if (profile.id != null) return `EMP-${String(profile.id).padStart(5, "0")}`;
  return "—";
}
