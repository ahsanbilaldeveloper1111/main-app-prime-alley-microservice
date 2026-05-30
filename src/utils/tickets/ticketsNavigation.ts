export type TicketsSettingsTab =
  | "statuses"
  | "modules"
  | "categories"
  | "sub-categories"
  | "types";

export const MAIN_SETTINGS_TICKETS_STATUSES_PATH =
  "/main-settings/tickets/statuses";
export const MAIN_SETTINGS_TICKETS_MODULES_PATH =
  "/main-settings/tickets/modules";
export const MAIN_SETTINGS_TICKETS_CATEGORIES_PATH =
  "/main-settings/tickets/categories";
export const MAIN_SETTINGS_TICKETS_SUB_CATEGORIES_PATH =
  "/main-settings/tickets/sub-categories";
export const MAIN_SETTINGS_TICKETS_TYPES_PATH =
  "/main-settings/tickets/types";

export const DEFAULT_TICKETS_HUB_PATH = MAIN_SETTINGS_TICKETS_STATUSES_PATH;

const MAIN_SETTINGS_TAB_PATHS: Record<TicketsSettingsTab, string> = {
  statuses: MAIN_SETTINGS_TICKETS_STATUSES_PATH,
  modules: MAIN_SETTINGS_TICKETS_MODULES_PATH,
  categories: MAIN_SETTINGS_TICKETS_CATEGORIES_PATH,
  "sub-categories": MAIN_SETTINGS_TICKETS_SUB_CATEGORIES_PATH,
  types: MAIN_SETTINGS_TICKETS_TYPES_PATH,
};

function readPathname(pathname?: string): string {
  if (pathname) {
    return pathname;
  }
  if (typeof globalThis === "undefined") {
    return "";
  }
  return globalThis.window?.location.pathname ?? "";
}

export function buildMainSettingsTicketsPath(tab: TicketsSettingsTab): string {
  return MAIN_SETTINGS_TAB_PATHS[tab];
}

export function buildLegacySettingsTicketsPath(
  subTab: TicketsSettingsTab = "statuses",
): string {
  return `/settings?tab=tickets&subtab=${subTab}`;
}

export function isMainSettingsTicketsContext(pathname?: string): boolean {
  return readPathname(pathname).includes("/main-settings/tickets");
}

export function isLegacySettingsTicketsContext(pathname?: string): boolean {
  const path = readPathname(pathname);
  return path === "/settings" || path.startsWith("/settings/");
}

export function shouldShowTicketsAdminBreadcrumb(pathname?: string): boolean {
  return !isMainSettingsTicketsContext(pathname);
}

export function resolveTicketsHubPath(
  tab: TicketsSettingsTab = "statuses",
  pathname?: string,
): string {
  if (isMainSettingsTicketsContext(pathname)) {
    return buildMainSettingsTicketsPath(tab);
  }
  if (isLegacySettingsTicketsContext(pathname)) {
    return buildLegacySettingsTicketsPath(tab);
  }
  return buildMainSettingsTicketsPath(tab);
}
