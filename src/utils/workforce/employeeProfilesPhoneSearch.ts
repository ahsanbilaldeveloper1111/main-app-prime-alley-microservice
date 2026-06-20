import type { EmployeeProfilesListScopeResult } from "./employeeProfilesListScope";

export function digitsOnlyForPhoneMatch(s: string): string {
  return s.replaceAll(/\D/g, "");
}

/** Pakistan CNIC formatted or 13-digit raw — use API `search`, not phone `user_ids`. */
export function isCnicLikeEmployeeSearchQuery(raw: string): boolean {
  const trimmed = raw.trim();
  if (/^\d{5}-\d{7}-\d$/.test(trimmed)) return true;
  return digitsOnlyForPhoneMatch(trimmed).length === 13 && !trimmed.includes("+");
}

/**
 * True when the search box looks like a phone/extension fragment (digits + typical separators only).
 * In that case GET /user-profiles `search` often misses `user_id`/phone matches; use `user_ids` instead.
 */
export function isPhoneLikeEmployeeSearchQuery(raw: string): boolean {
  if (isCnicLikeEmployeeSearchQuery(raw)) return false;
  const t = raw.trim();
  if (t.length < 2) return false;
  if (!/^[\d\s+().-]+$/.test(t)) return false;
  return digitsOnlyForPhoneMatch(t).length >= 2;
}

type MainAppUserRow = Readonly<{
  id: number | string;
  phone?: string | null;
}>;

function buildAllowedPhonesFromScope(
  scope: EmployeeProfilesListScopeResult,
  mainAppUserPhones: readonly string[],
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

function mainAppUserMatchesNumericNeedle(u: MainAppUserRow, needle: string, rawSearch: string): boolean {
  const phone = String(u.phone ?? "").trim();
  const idStr = String(u.id ?? "").trim();
  const raw = rawSearch.trim();

  if (phone !== "") {
    if (phone.includes(raw)) return true;
    const phoneDigits = digitsOnlyForPhoneMatch(phone);
    if (phoneDigits.includes(needle)) return true;
  }

  if (idStr !== "" && (idStr.includes(needle) || idStr.includes(raw))) {
    return true;
  }

  return false;
}

function resolveMainAppUserSearchId(u: MainAppUserRow): { phone: string; idStr: string; userId: string } {
  const phone = String(u.phone ?? "").trim();
  const idStr = String(u.id ?? "").trim();
  const userId = phone === "" ? idStr : phone;
  return { phone, idStr, userId };
}

function isUserIdAllowedForPhoneSearch(
  allowed: Set<string> | null,
  phone: string,
  idStr: string,
  userId: string,
): boolean {
  if (allowed == null) {
    return true;
  }
  return allowed.has(phone) || allowed.has(idStr) || allowed.has(userId);
}

function collectPhoneLikeSearchUserIds(input: {
  appliedSearch: string;
  mainAppUsers: readonly MainAppUserRow[];
  allowed: Set<string> | null;
  needle: string;
  maxIds: number;
}): string[] {
  const hits: string[] = [];
  const seen = new Set<string>();

  for (const u of input.mainAppUsers) {
    if (!mainAppUserMatchesNumericNeedle(u, input.needle, input.appliedSearch)) {
      continue;
    }

    const { phone, idStr, userId } = resolveMainAppUserSearchId(u);
    if (userId === "") {
      continue;
    }
    if (!isUserIdAllowedForPhoneSearch(input.allowed, phone, idStr, userId)) {
      continue;
    }
    if (seen.has(userId)) {
      continue;
    }

    seen.add(userId);
    hits.push(userId);
    if (hits.length >= input.maxIds) {
      break;
    }
  }

  return hits;
}

/**
 * Returns `user_ids` (directory phones) to query instead of `search`, or `null` if phone-style
 * search should fall through to normal `search` behavior.
 * Returns `[]` when the query is phone-like but no scoped matches exist.
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
  if (needle.length < 2) {
    return null;
  }

  const allowed = buildAllowedPhonesFromScope(input.scope, input.mainAppUserPhones);
  return collectPhoneLikeSearchUserIds({
    appliedSearch: input.appliedSearch,
    mainAppUsers: input.mainAppUsers,
    allowed,
    needle,
    maxIds: input.maxIds,
  });
}
