export type FaqsHelpCenterTab = "modules" | "topics" | "items" | "types";

export const MAIN_SETTINGS_HELP_CENTER_MODULES_PATH =
  "/main-settings/help-center/modules";
export const MAIN_SETTINGS_HELP_CENTER_TOPICS_PATH =
  "/main-settings/help-center/topics";
export const MAIN_SETTINGS_HELP_CENTER_ITEMS_PATH =
  "/main-settings/help-center/items";
export const MAIN_SETTINGS_HELP_CENTER_TYPES_PATH =
  "/main-settings/help-center/types";

export const DEFAULT_FAQS_HUB_PATH = MAIN_SETTINGS_HELP_CENTER_MODULES_PATH;

const MAIN_SETTINGS_TAB_PATHS: Record<FaqsHelpCenterTab, string> = {
  modules: MAIN_SETTINGS_HELP_CENTER_MODULES_PATH,
  topics: MAIN_SETTINGS_HELP_CENTER_TOPICS_PATH,
  items: MAIN_SETTINGS_HELP_CENTER_ITEMS_PATH,
  types: MAIN_SETTINGS_HELP_CENTER_TYPES_PATH,
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

export function buildMainSettingsHelpCenterPath(
  tab: FaqsHelpCenterTab,
): string {
  return MAIN_SETTINGS_TAB_PATHS[tab];
}

export function buildLegacySettingsHelpCenterPath(
  subTab: FaqsHelpCenterTab = "modules",
): string {
  return `/settings?tab=help-center&subtab=${subTab}`;
}

export function isMainSettingsHelpCenterContext(pathname?: string): boolean {
  return readPathname(pathname).includes("/main-settings/help-center");
}

export function isLegacySettingsHelpCenterContext(pathname?: string): boolean {
  const path = readPathname(pathname);
  return path === "/settings" || path.startsWith("/settings/");
}

/** Hide in-app FAQ breadcrumbs when main settings chrome already provides section title. */
export function shouldShowFaqsAdminBreadcrumb(pathname?: string): boolean {
  return !isMainSettingsHelpCenterContext(pathname);
}

export function resolveFaqsHubPath(
  subTab: FaqsHelpCenterTab = "modules",
  pathname?: string,
): string {
  if (isMainSettingsHelpCenterContext(pathname)) {
    return buildMainSettingsHelpCenterPath(subTab);
  }
  if (isLegacySettingsHelpCenterContext(pathname)) {
    return buildLegacySettingsHelpCenterPath(subTab);
  }
  return buildMainSettingsHelpCenterPath(subTab);
}
