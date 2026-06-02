export type WorkforceSettingsTab = "request-categories";

export const MAIN_SETTINGS_WORKFORCE_REQUEST_CATEGORIES_PATH =
  "/main-settings/workforce/request-categories";

export const DEFAULT_WORKFORCE_HUB_PATH =
  MAIN_SETTINGS_WORKFORCE_REQUEST_CATEGORIES_PATH;

const MAIN_SETTINGS_TAB_PATHS: Record<WorkforceSettingsTab, string> = {
  "request-categories": MAIN_SETTINGS_WORKFORCE_REQUEST_CATEGORIES_PATH,
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

export function buildMainSettingsWorkforcePath(
  tab: WorkforceSettingsTab = "request-categories",
): string {
  return MAIN_SETTINGS_TAB_PATHS[tab];
}

export function buildLegacySettingsWorkforcePath(
  subTab: WorkforceSettingsTab = "request-categories",
): string {
  return `/settings?tab=staff-insights&subtab=${subTab}`;
}

export function isMainSettingsWorkforceContext(pathname?: string): boolean {
  return readPathname(pathname).includes("/main-settings/workforce");
}

export function isLegacySettingsWorkforceContext(pathname?: string): boolean {
  const path = readPathname(pathname);
  return path === "/settings" || path.startsWith("/settings/");
}

export function shouldShowWorkforceAdminBreadcrumb(pathname?: string): boolean {
  return !isMainSettingsWorkforceContext(pathname);
}

export function resolveWorkforceHubPath(
  tab: WorkforceSettingsTab = "request-categories",
  pathname?: string,
): string {
  if (isMainSettingsWorkforceContext(pathname)) {
    return buildMainSettingsWorkforcePath(tab);
  }
  if (isLegacySettingsWorkforceContext(pathname)) {
    return buildLegacySettingsWorkforcePath(tab);
  }
  return buildMainSettingsWorkforcePath(tab);
}
