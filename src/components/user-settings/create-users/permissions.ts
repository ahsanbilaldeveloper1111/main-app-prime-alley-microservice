import type { PermCategory, PermStatus } from "./types";

function category(
  title: string,
  itemNames: readonly string[],
  defaultStatus: PermStatus,
  overrides?: Partial<Record<string, PermStatus>>,
): PermCategory {
  return {
    title,
    items: itemNames.map((name) => ({
      name,
      status: overrides?.[name] ?? defaultStatus,
    })),
  };
}

const CRM_OBJECTS_VIEW_ONLY = [
  "Contacts",
  "Companies",
  "Deals",
  "Orders",
  "Carts",
  "Tickets",
  "Tasks",
  "CRM emails",
  "Meetings",
  "Calls",
  "Notes",
  "Projects",
] as const;

const CRM_OBJECTS_STANDARD = [
  "Contacts",
  "Companies",
  "Deals",
  "Orders",
  "Tickets",
  "Tasks",
] as const;

const CRM_TOOLS_ALL = [
  "Communicate",
  "Bulk delete",
  "Import",
  "Export",
  "Edit associations",
  "Custom views",
  "Customize record page layout",
  "View connected record data",
] as const;

const CRM_TOOLS_STANDARD = ["Communicate", "Import", "Export", "Custom views"] as const;

const MARKETING_VIEW_ONLY = [
  "Segments",
  "Forms",
  "Delete form submissions",
  "Files",
  "Marketing Access",
  "Ads",
  "Marketing email",
  "CTA",
  "SMS",
  "Buyer Intent",
  "Social",
  "Marketing Events",
  "Blog",
  "Landing pages",
  "Website pages",
  "URL Redirects",
] as const;

const MARKETING_STANDARD = [
  "Marketing Access",
  "Marketing email",
  "Blog",
  "Landing pages",
] as const;

const SALES_VIEW_ONLY = [
  "Sales Access",
  "Templates",
  "Meeting scheduling pages",
  "Sales Starter",
  "Forecasts",
] as const;

const SALES_STANDARD = ["Sales Access", "Templates", "Meeting scheduling pages"] as const;

export const VIEW_ONLY_PERMISSIONS: PermCategory[] = [
  category("CRM objects", CRM_OBJECTS_VIEW_ONLY, "green-circle"),
  category("CRM tools", CRM_TOOLS_ALL, "grey-dot"),
  category("Marketing", MARKETING_VIEW_ONLY, "grey-dot", {
    Segments: "green-circle",
    "Marketing Access": "green-dot",
    Ads: "green-circle",
    "Marketing email": "green-circle",
    CTA: "green-circle",
    SMS: "green-circle",
    "Buyer Intent": "green-circle",
    Blog: "green-circle",
    "Landing pages": "green-circle",
    "Website pages": "green-circle",
    "URL Redirects": "green-circle",
  }),
  category("Sales", SALES_VIEW_ONLY, "grey-dot"),
];

export const STANDARD_USER_PERMISSIONS: PermCategory[] = [
  category("CRM objects", CRM_OBJECTS_STANDARD, "green-circle"),
  category("CRM tools", CRM_TOOLS_STANDARD, "green-dot"),
  category("Marketing", MARKETING_STANDARD, "green-circle", {
    "Marketing Access": "green-dot",
  }),
  category("Sales", SALES_STANDARD, "green-dot"),
];

