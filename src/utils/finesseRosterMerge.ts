import type { FinesseUserData } from "./finesse";
import { isFinesseAgentLoggedOutStateField } from "./finesse";

/** One agent row from roster/topic payloads (shapes vary by backend). */
export type FinesseRosterAgentPatch = {
  loginId?: string;
  loginName?: string;
  firstName?: string;
  lastName?: string;
  extension?: string;
  state?: string;
  pendingState?: string;
  stateChangeTime?: string;
};

/**
 * Combine successive roster messages (e.g. deltas per agent) so refetch overlay keeps the latest state per login.
 */
export function mergeRosterPayloads(prev: unknown, incoming: unknown): unknown {
  const a = prev == null ? [] : extractRosterAgentEntries(prev);
  const b = extractRosterAgentEntries(incoming);
  const byKey = new Map<string, FinesseRosterAgentPatch>();
  for (const e of a) {
    const k = rosterLoginKey(e.loginId, e.loginName);
    if (k) byKey.set(k, e);
  }
  for (const e of b) {
    const k = rosterLoginKey(e.loginId, e.loginName);
    if (k) byKey.set(k, e);
  }
  return [...byKey.values()];
}

/**
 * Normalize roster STOMP body into agent rows (array, or `users` / `agents` / etc. wrappers).
 */
export function extractRosterAgentEntries(raw: unknown): FinesseRosterAgentPatch[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.filter((x) => x && typeof x === "object") as FinesseRosterAgentPatch[];
  }
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    for (const key of ["users", "agents", "roster", "teamUsers", "members", "data"]) {
      const v = o[key];
      if (Array.isArray(v)) return extractRosterAgentEntries(v);
    }
    if ("loginId" in o || "loginName" in o) return [o as FinesseRosterAgentPatch];
  }
  return [];
}

function rosterLoginKey(loginId?: string, loginName?: string): string | null {
  const id = loginId ?? loginName;
  if (id == null || String(id).trim() === "") return null;
  return String(id).trim().toLowerCase();
}

/** Prefer `state`; use `pendingState` only when primary state is empty. */
function rosterEffectiveState(e: FinesseRosterAgentPatch): string | undefined {
  if (e.state != null && String(e.state).trim() !== "") return e.state;
  if (e.pendingState != null && String(e.pendingState).trim() !== "") return e.pendingState;
  return undefined;
}

/**
 * Roster row / TopBar: when Finesse sends LOGOUT/OFFLINE in `pendingState` while `state` lags,
 * prefer pending (same as team table).
 */
export function resolveRosterAgentDisplayState(
  patch: FinesseRosterAgentPatch,
): string | undefined {
  return rosterStateForExistingTeamUser(patch);
}

function rosterStateForExistingTeamUser(patch: FinesseRosterAgentPatch): string | undefined {
  const pend = patch.pendingState;
  if (pend != null && String(pend).trim() !== "") {
    const pu = String(pend).trim().toUpperCase();
    if (isFinesseAgentLoggedOutStateField(pend) || pu === "OFFLINE") {
      return String(pend).trim();
    }
  }
  return rosterEffectiveState(patch);
}

/**
 * New roster row should be added to the team list when another agent signs in to Finesse
 * and was not in the REST snapshot (e.g. only logged-out users were omitted).
 */
function shouldAppendNewTeamUserFromRoster(e: FinesseRosterAgentPatch): boolean {
  const effective = rosterEffectiveState(e);
  if (effective == null || String(effective).trim() === "") return false;
  if (isFinesseAgentLoggedOutStateField(effective)) return false;
  const upper = String(effective).trim().toUpperCase();
  if (upper === "OFFLINE") return false;
  return true;
}

function rosterEntryToTeamUserRow(e: FinesseRosterAgentPatch): Record<string, unknown> {
  const loginId = String(e.loginId ?? e.loginName ?? "").trim();
  const st = rosterEffectiveState(e);
  return {
    loginId,
    ...(e.firstName == null ? {} : { firstName: e.firstName }),
    ...(e.lastName == null ? {} : { lastName: e.lastName }),
    ...(e.extension == null ? {} : { extension: e.extension }),
    ...(st == null ? {} : { state: st }),
    ...(e.pendingState == null ? {} : { pendingState: e.pendingState }),
    ...(e.stateChangeTime == null ? {} : { stateChangeTime: e.stateChangeTime }),
  };
}

export function mergeTeamUsersFromRoster<
  U extends Record<string, unknown>,
  T extends { users?: U[] },
>(prev: T | null | undefined, rosterRaw: unknown): T | null | undefined {
  if (prev == null) return prev;
  const entries = extractRosterAgentEntries(rosterRaw);
  if (entries.length === 0) return prev;

  const byLogin = new Map<string, FinesseRosterAgentPatch>();
  for (const e of entries) {
    const key = rosterLoginKey(e.loginId, e.loginName);
    if (key) byLogin.set(key, e);
  }

  const existingUsers = prev.users ?? [];
  const existingKeys = new Set(
    existingUsers
      .map((u) => rosterLoginKey((u as { loginId?: string }).loginId))
      .filter((k): k is string => k != null),
  );

  const merged = existingUsers.map((u) => {
    const key = rosterLoginKey((u as { loginId?: string }).loginId);
    const patch = key == null ? undefined : byLogin.get(key);
    if (patch == null) return u;
    const displayState = rosterStateForExistingTeamUser(patch);
    const next = {
      ...u,
      ...(displayState == null ? {} : { state: displayState }),
      ...(patch.pendingState == null ? {} : { pendingState: patch.pendingState }),
      ...(patch.stateChangeTime == null ? {} : { stateChangeTime: patch.stateChangeTime }),
      ...(patch.firstName == null ? {} : { firstName: patch.firstName }),
      ...(patch.lastName == null ? {} : { lastName: patch.lastName }),
      ...(patch.extension == null ? {} : { extension: patch.extension }),
    };
    return next as U;
  });

  const additions: U[] = [];
  for (const [, e] of byLogin) {
    const key = rosterLoginKey(e.loginId, e.loginName);
    if (key == null) continue;
    if (existingKeys.has(key)) continue;
    if (!shouldAppendNewTeamUserFromRoster(e)) continue;
    additions.push(rosterEntryToTeamUserRow(e) as U);
    existingKeys.add(key);
  }

  if (additions.length === 0) {
    return { ...prev, users: merged };
  }
  return { ...prev, users: [...merged, ...additions] };
}

export function mergeAgentProfileFromRoster(
  profile: FinesseUserData,
  rosterRaw: unknown,
  selfLogin: string,
): FinesseUserData {
  const entries = extractRosterAgentEntries(rosterRaw);
  const self = entries.find(
    (e) =>
      (e.loginId != null && e.loginId === selfLogin) ||
      (e.loginName != null && e.loginName === selfLogin),
  );
  if (!self) return profile;
  const display = resolveRosterAgentDisplayState(self);
  if (display == null) return profile;
  return {
    ...profile,
    state: display,
    ...(self.stateChangeTime == null ? {} : { stateChangeTime: self.stateChangeTime }),
  };
}

export function findRosterEntryForLogin(
  rosterRaw: unknown,
  selfLogin: string,
): FinesseRosterAgentPatch | undefined {
  return extractRosterAgentEntries(rosterRaw).find(
    (e) =>
      (e.loginId != null && e.loginId === selfLogin) ||
      (e.loginName != null && e.loginName === selfLogin),
  );
}
