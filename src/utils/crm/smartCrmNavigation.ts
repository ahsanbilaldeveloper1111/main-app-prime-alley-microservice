export type SmartCrmSettingsTab =
  | "stages"
  | "industries"
  | "products"
  | "deal-templates"
  | "business-types"
  | "campaigns";

export const MAIN_SETTINGS_SMART_CRM_STAGES_PATH =
  "/main-settings/smart-crm/stages";
export const MAIN_SETTINGS_SMART_CRM_INDUSTRIES_PATH =
  "/main-settings/smart-crm/industries";
export const MAIN_SETTINGS_SMART_CRM_PRODUCTS_PATH =
  "/main-settings/smart-crm/products";
export const MAIN_SETTINGS_SMART_CRM_DEAL_TEMPLATES_PATH =
  "/main-settings/smart-crm/deal-templates";
export const MAIN_SETTINGS_SMART_CRM_BUSINESS_TYPES_PATH =
  "/main-settings/smart-crm/business-types";
export const MAIN_SETTINGS_SMART_CRM_CAMPAIGNS_PATH =
  "/main-settings/smart-crm/campaigns";

export const DEFAULT_SMART_CRM_HUB_PATH = MAIN_SETTINGS_SMART_CRM_STAGES_PATH;

const MAIN_SETTINGS_TAB_PATHS: Record<SmartCrmSettingsTab, string> = {
  stages: MAIN_SETTINGS_SMART_CRM_STAGES_PATH,
  industries: MAIN_SETTINGS_SMART_CRM_INDUSTRIES_PATH,
  products: MAIN_SETTINGS_SMART_CRM_PRODUCTS_PATH,
  "deal-templates": MAIN_SETTINGS_SMART_CRM_DEAL_TEMPLATES_PATH,
  "business-types": MAIN_SETTINGS_SMART_CRM_BUSINESS_TYPES_PATH,
  campaigns: MAIN_SETTINGS_SMART_CRM_CAMPAIGNS_PATH,
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

export function buildMainSettingsSmartCrmPath(tab: SmartCrmSettingsTab): string {
  return MAIN_SETTINGS_TAB_PATHS[tab];
}

export function buildLegacySettingsSmartCrmPath(
  subTab: SmartCrmSettingsTab = "stages",
): string {
  return `/settings?tab=crm&subtab=${subTab}`;
}

export function isMainSettingsSmartCrmContext(pathname?: string): boolean {
  return readPathname(pathname).includes("/main-settings/smart-crm");
}

export function isLegacySettingsSmartCrmContext(pathname?: string): boolean {
  const path = readPathname(pathname);
  return path === "/settings" || path.startsWith("/settings/");
}

export function shouldShowSmartCrmAdminBreadcrumb(pathname?: string): boolean {
  return !isMainSettingsSmartCrmContext(pathname);
}

export function resolveSmartCrmHubPath(
  tab: SmartCrmSettingsTab = "stages",
  pathname?: string,
): string {
  if (isMainSettingsSmartCrmContext(pathname)) {
    return buildMainSettingsSmartCrmPath(tab);
  }
  if (isLegacySettingsSmartCrmContext(pathname)) {
    return buildLegacySettingsSmartCrmPath(tab);
  }
  return buildMainSettingsSmartCrmPath(tab);
}
