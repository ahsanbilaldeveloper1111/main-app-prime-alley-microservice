/** Main-app user row (lookup list); `phone` is the extension matching org-chart `user_id`. */
export type OrgChartMainAppUserRow = {
  id: number;
  name?: string;
  phone?: string | number | null;
};

/** Normalize API `user_id` / extension and main-app `phone` for comparison. */
export function normalizeOrgChartUserKey(value: string | number | undefined | null): string {
  return String(value ?? "").trim();
}

/**
 * Org-chart API `user_id` is the extension; main-app users are keyed by `phone` (same value).
 * Falls back to matching numeric `id` if the API ever sends internal id.
 */
export function findMainAppUserByOrgChartUserId(
  users: readonly OrgChartMainAppUserRow[] | undefined | null,
  apiUserId: string | undefined | null,
): OrgChartMainAppUserRow | undefined {
  if (!users?.length) return undefined;
  const needle = normalizeOrgChartUserKey(apiUserId);
  if (needle === "") return undefined;
  return users.find((u) => {
    const phone = normalizeOrgChartUserKey(u.phone);
    if (phone !== "" && phone === needle) return true;
    return normalizeOrgChartUserKey(u.id) === needle;
  });
}

/** Value stored in filters / `data-org-chart-user-id`: prefer extension (`phone`), else `id`. */
export function mainAppUserRowKeyForSelection(u: OrgChartMainAppUserRow): string {
  const phone = normalizeOrgChartUserKey(u.phone);
  return phone === "" ? String(u.id) : phone;
}

export function mainAppUserMatchesOrgChartUserId(
  u: OrgChartMainAppUserRow,
  apiUserId: string | undefined | null,
): boolean {
  const needle = normalizeOrgChartUserKey(apiUserId);
  if (needle === "") return false;
  const phone = normalizeOrgChartUserKey(u.phone);
  if (phone !== "" && phone === needle) return true;
  return normalizeOrgChartUserKey(u.id) === needle;
}

/**
 * Keep only main-app users that have a row in minified user profiles (`user_id` = extension).
 * If `profiles` is empty (not loaded), returns `users` unchanged so the UI is not blank on startup.
 */
export function filterOrgChartUsersWithMinifiedProfile<User extends OrgChartMainAppUserRow>(
  users: readonly User[],
  profiles: readonly { user_id: string }[],
): User[] {
  if (profiles.length === 0) {
    return [...users];
  }
  return users.filter((u) =>
    profiles.some((p) => mainAppUserMatchesOrgChartUserId(u, p.user_id)),
  );
}
