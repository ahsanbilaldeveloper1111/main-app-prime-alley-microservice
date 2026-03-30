import type { MainAppUserLookup } from "@hooks/useMainAppLookups";

export type UserRequestIdValue = string | number | null | undefined;

function phoneDigitsOnly(value: UserRequestIdValue): string {
  return String(value ?? "").replaceAll(/\D/g, "");
}

/** Match request `user_id` to main-app lookup `phone` (exact or same digits). */
export function findMainAppUserByRequestUserId(
  users: MainAppUserLookup[] | undefined,
  userId: UserRequestIdValue
): MainAppUserLookup | undefined {
  if (userId == null || userId === "" || !users?.length) return undefined;
  const idStr = String(userId).trim();
  const requestDigits = phoneDigitsOnly(idStr);
  return users.find((x) => {
    const p = String(x.phone ?? "").trim();
    if (p === idStr) return true;
    if (requestDigits.length === 0) return false;
    return phoneDigitsOnly(p) === requestDigits;
  });
}

export function getUserDisplayNameFromLookup(
  users: MainAppUserLookup[] | undefined,
  userId: UserRequestIdValue
): string {
  if (userId == null || userId === "") return "—";
  const idStr = String(userId).trim();
  const u = findMainAppUserByRequestUserId(users, userId);
  return u?.name ?? idStr;
}
