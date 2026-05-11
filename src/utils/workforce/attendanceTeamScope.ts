/** GET /attendance user_ids length guard (query string size). */
export const ATTENDANCE_QUERY_MAX_USER_IDS = 120;

function collectAttendanceScopeIdFromRow(row: unknown, sink: Set<string>): void {
  if (row == null || typeof row !== "object") return;
  const o = row as Record<string, unknown>;
  const id = o.id;
  if (typeof id === "number" && Number.isFinite(id)) {
    sink.add(String(id));
  } else if (typeof id === "string" && id.trim() !== "") {
    sink.add(id.trim());
  }
  const phoneRaw = o.phone ?? o.phone_no;
  if (typeof phoneRaw === "string" && phoneRaw.trim() !== "") {
    sink.add(phoneRaw.trim());
  } else if (typeof phoneRaw === "number" && Number.isFinite(phoneRaw)) {
    sink.add(String(phoneRaw));
  }
}

/**
 * Normalizes `getTeamUsers` payloads into identifiers accepted by attendance APIs
 * (main-app user id and/or phone, depending on tenant).
 */
export function parseTeamUsersResponseForAttendanceScope(
  raw: unknown,
  fallbackSelfId: string,
): string[] {
  const sink = new Set<string>();
  const self = String(fallbackSelfId ?? "").trim();
  if (self) {
    sink.add(self);
  }
  if (raw == null) {
    return [...sink];
  }
  if (Array.isArray(raw)) {
    for (const item of raw) {
      collectAttendanceScopeIdFromRow(item, sink);
    }
    return [...sink];
  }
  if (typeof raw !== "object") {
    return [...sink];
  }
  const d = raw as Record<string, unknown>;
  for (const key of ["team_member", "team_owners"] as const) {
    const arr = d[key];
    if (Array.isArray(arr)) {
      for (const item of arr) {
        collectAttendanceScopeIdFromRow(item, sink);
      }
    }
  }
  const users = d.users;
  if (Array.isArray(users)) {
    for (const item of users) {
      collectAttendanceScopeIdFromRow(item, sink);
    }
  }
  return [...sink];
}

export function capUserIdsForAttendanceQuery(
  ids: readonly string[],
  max: number,
): string[] {
  if (ids.length <= max) {
    return [...ids];
  }
  return ids.slice(0, max);
}

export function buildTeamAttendanceAllowSet(
  teamScopeUserIds: readonly string[],
  selfStr: string,
): Set<string> {
  const trimmed = String(selfStr ?? "").trim();
  if (teamScopeUserIds.length > 0) {
    return new Set(
      teamScopeUserIds
        .map((x) => String(x).trim())
        .filter((x) => x.length > 0),
    );
  }
  if (trimmed.length > 0) {
    return new Set([trimmed]);
  }
  return new Set();
}

export type TeamAttendanceQueryPlan =
  | { kind: "wait_team" }
  | { kind: "no_scope" }
  | { kind: "empty_page" }
  | { kind: "ok"; user_ids: string[]; rowFilterAllow: Set<string> };

export function planTeamAttendanceListQuery(input: {
  teamScopeLoading: boolean;
  teamScopeUserIds: readonly string[];
  sessionUserId: string | null | undefined;
  appliedUserIds: readonly string[];
}): TeamAttendanceQueryPlan {
  if (input.teamScopeLoading) {
    return { kind: "wait_team" };
  }
  const selfStr = String(input.sessionUserId ?? "").trim();
  const allow = buildTeamAttendanceAllowSet(input.teamScopeUserIds, selfStr);
  if (allow.size === 0) {
    return { kind: "no_scope" };
  }
  const normalizedApplied = input.appliedUserIds
    .map((id) => String(id).trim())
    .filter((id) => id.length > 0);
  if (normalizedApplied.length === 0) {
    return {
      kind: "ok",
      user_ids: capUserIdsForAttendanceQuery(
        [...allow],
        ATTENDANCE_QUERY_MAX_USER_IDS,
      ),
      rowFilterAllow: allow,
    };
  }
  const narrowed = normalizedApplied.filter((id) => allow.has(id));
  if (narrowed.length === 0) {
    return { kind: "empty_page" };
  }
  return {
    kind: "ok",
    user_ids: capUserIdsForAttendanceQuery(
      narrowed,
      ATTENDANCE_QUERY_MAX_USER_IDS,
    ),
    rowFilterAllow: allow,
  };
}
