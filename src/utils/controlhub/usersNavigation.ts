export const MAIN_SETTINGS_USER_DIRECTORY_PATH =
  "/main-settings/users-teams/user-directory";

export const MAIN_SETTINGS_SUPERVISOR_TEAMS_PATH =
  "/main-settings/users-teams/supervisor-teams";

export const MAIN_SETTINGS_MANAGEMENT_GROUPS_PATH =
  "/main-settings/users-teams/management-groups";

export const MAIN_SETTINGS_RANKS_AND_PERMISSIONS_PATH =
  "/main-settings/users-teams/ranks-and-permissions";

export type UsersTeamsTab =
  | "user-directory"
  | "supervisor-teams"
  | "management-groups"
  | "ranks-and-permissions";

const MAIN_SETTINGS_TAB_PATHS: Record<UsersTeamsTab, string> = {
  "user-directory": MAIN_SETTINGS_USER_DIRECTORY_PATH,
  "supervisor-teams": MAIN_SETTINGS_SUPERVISOR_TEAMS_PATH,
  "management-groups": MAIN_SETTINGS_MANAGEMENT_GROUPS_PATH,
  "ranks-and-permissions": MAIN_SETTINGS_RANKS_AND_PERMISSIONS_PATH,
};

/** @deprecated Legacy list route removed; use {@link MAIN_SETTINGS_USER_DIRECTORY_PATH}. */
export const CONTROLHUB_USERS_PATH = MAIN_SETTINGS_USER_DIRECTORY_PATH;

/** Default users list destination when context is unknown (legacy route redirects here). */
export const DEFAULT_USERS_DIRECTORY_PATH = MAIN_SETTINGS_USER_DIRECTORY_PATH;

export const LEGACY_SETTINGS_USER_DIRECTORY_PATH =
  "/settings?tab=user-management&subtab=user-directory";

function readPathname(pathname?: string): string {
  if (pathname) {
    return pathname;
  }
  if (typeof globalThis === "undefined") {
    return "";
  }
  return globalThis.window?.location.pathname ?? "";
}

export function buildMainSettingsUsersTeamsPath(tab: UsersTeamsTab): string {
  return MAIN_SETTINGS_TAB_PATHS[tab];
}

const LEGACY_SETTINGS_USERS_TEAMS_SUBTAB: Record<UsersTeamsTab, string> = {
  "user-directory": "user-directory",
  "supervisor-teams": "supervisor-teams",
  "management-groups": "management-groups",
  "ranks-and-permissions": "ranks-and-permissions",
};

export function buildLegacySettingsUsersTeamsPath(
  subTab: UsersTeamsTab = "user-directory",
): string {
  const legacySubTab = LEGACY_SETTINGS_USERS_TEAMS_SUBTAB[subTab];
  return `/settings?tab=user-management&subtab=${legacySubTab}`;
}

export function isMainSettingsUsersContext(pathname?: string): boolean {
  return readPathname(pathname).includes("/main-settings/users-teams");
}

/** Hide list breadcrumbs when main settings chrome already provides section title. */
export function shouldShowUsersTeamsBreadcrumb(pathname?: string): boolean {
  return !isMainSettingsUsersContext(pathname);
}

export function resolveUsersTeamsTabPath(
  tab: UsersTeamsTab = "user-directory",
  pathname?: string,
): string {
  if (isMainSettingsUsersContext(pathname)) {
    return buildMainSettingsUsersTeamsPath(tab);
  }
  if (isLegacySettingsUsersContext(pathname)) {
    return buildLegacySettingsUsersTeamsPath(tab);
  }
  return buildMainSettingsUsersTeamsPath(tab);
}

export function isLegacySettingsUsersContext(pathname?: string): boolean {
  const path = readPathname(pathname);
  return path === "/settings" || path.startsWith("/settings/");
}

/** Resolve the users list URL for the current settings context. */
export function resolveUsersListReturnPath(pathname?: string): string {
  if (isMainSettingsUsersContext(pathname)) {
    return MAIN_SETTINGS_USER_DIRECTORY_PATH;
  }
  if (isLegacySettingsUsersContext(pathname)) {
    return LEGACY_SETTINGS_USER_DIRECTORY_PATH;
  }
  return DEFAULT_USERS_DIRECTORY_PATH;
}

/** Allow only same-origin relative paths for return navigation. */
export function sanitizeReturnPath(
  value: unknown,
  fallback = DEFAULT_USERS_DIRECTORY_PATH,
): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  return trimmed;
}

export function buildUserEditPath(
  encId: string,
  returnTo?: string,
): string {
  const resolvedReturn =
    returnTo ?? resolveUsersListReturnPath();
  const params = new URLSearchParams({
    returnTo: resolvedReturn,
  });
  return `/controlhub/users/${encId}?${params.toString()}`;
}

export function buildUserCreatePath(returnTo?: string): string {
  const resolvedReturn =
    returnTo ?? resolveUsersListReturnPath();
  const params = new URLSearchParams({
    returnTo: resolvedReturn,
  });
  return `/controlhub/users/create?${params.toString()}`;
}

export function buildUsersDirectoryPath(
  query?: Readonly<Record<string, string | number | undefined>>,
  pathname?: string,
): string {
  const base = resolveUsersListReturnPath(pathname);
  if (!query) {
    return base;
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && String(value).length > 0) {
      params.set(key, String(value));
    }
  }

  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
