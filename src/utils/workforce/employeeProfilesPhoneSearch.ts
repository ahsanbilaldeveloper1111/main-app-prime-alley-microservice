import type { EmployeeProfilesListScopeResult } from "./employeeProfilesListScope";

export function digitsOnlyForPhoneMatch(s: string): string {
  return s.replaceAll(/\D/g, "");
}

/**
 * True when the search box looks like a phone/extension fragment (digits + typical separators only).
 * In that case GET /user-profiles `search` often misses `user_id`/phone matches; use `user_ids` instead.
 */
export function isPhoneLikeEmployeeSearchQuery(raw: string): boolean {
  const t = raw.trim();
  if (t.length < 3) return false;
  if (!/^[\d\s+().-]+$/.test(t)) return false;
  return digitsOnlyForPhoneMatch(t).length >= 3;
}

type MainAppUserRow = Readonly<{
  id: number | string;
  phone?: string | null;
}>;

function buildAllowedPhonesFromScope(
  scope: EmployeeProfilesListScopeResult,
  mainAppUserPhones: readonly string[]
): Set<string> | null {
  if (scope.kind === "empty") {
    return null;
  }
  if (scope.kind === "scoped") {
    return new Set(scope.user_ids.map((x) => String(x).trim()).filter((x) => x.length > 0));
  }
  if (scope.kind === "scoped_backend_only") {
    return new Set(mainAppUserPhones.map((x) => String(x).trim()).filter((x) => x.length > 0));
  }
  if (scope.kind === "full" && scope.user_ids != null && scope.user_ids.length > 0) {
    return new Set(scope.user_ids.map((x) => String(x).trim()).filter((x) => x.length > 0));
  }
  return null;
}

/**
 * Returns `user_ids` (directory phones) to query instead of `search`, or `null` if phone-style
 * search should fall through to normal `search` behavior.
 */
export function resolveUserProfileIdsForPhoneLikeSearch(input: {
  appliedSearch: string;
  mainAppUsers: readonly MainAppUserRow[];
  scope: EmployeeProfilesListScopeResult;
  mainAppUserPhones: readonly string[];
  maxIds: number;
}): string[] | null {
  if (!isPhoneLikeEmployeeSearchQuery(input.appliedSearch)) {
    return null;
  }
  const needle = digitsOnlyForPhoneMatch(input.appliedSearch);
  if (needle.length < 3) {
    return null;
  }

  const allowed = buildAllowedPhonesFromScope(input.scope, input.mainAppUserPhones);

  const hits: string[] = [];
  const seen = new Set<string>();

  for (const u of input.mainAppUsers) {
    const phone = String(u.phone ?? "").trim();
    if (phone === "") continue;
    const phoneDigits = digitsOnlyForPhoneMatch(phone);
    if (!phoneDigits.includes(needle)) continue;
    if (allowed != null && !allowed.has(phone) && !allowed.has(String(u.id))) continue;
    if (seen.has(phone)) continue;
    seen.add(phone);
    hits.push(phone);
    if (hits.length >= input.maxIds) break;
  }

  return hits.length > 0 ? hits : null;
}
