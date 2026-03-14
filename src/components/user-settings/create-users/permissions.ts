import type { PermCategory } from "./types";

export const VIEW_ONLY_PERMISSIONS: PermCategory[] = [
  {
    title: "CRM objects",
    items: [
      { name: "Contacts", status: "green-circle" },
      { name: "Companies", status: "green-circle" },
      { name: "Deals", status: "green-circle" },
      { name: "Orders", status: "green-circle" },
      { name: "Carts", status: "green-circle" },
      { name: "Tickets", status: "green-circle" },
      { name: "Tasks", status: "green-circle" },
      { name: "CRM emails", status: "green-circle" },
      { name: "Meetings", status: "green-circle" },
      { name: "Calls", status: "green-circle" },
      { name: "Notes", status: "green-circle" },
      { name: "Projects", status: "green-circle" },
    ],
  },
  {
    title: "CRM tools",
    items: [
      { name: "Communicate", status: "grey-dot" },
      { name: "Bulk delete", status: "grey-dot" },
      { name: "Import", status: "grey-dot" },
      { name: "Export", status: "grey-dot" },
      { name: "Edit associations", status: "grey-dot" },
      { name: "Custom views", status: "grey-dot" },
      { name: "Customize record page layout", status: "grey-dot" },
      { name: "View connected record data", status: "grey-dot" },
    ],
  },
  {
    title: "Marketing",
    items: [
      { name: "Segments", status: "green-circle" },
      { name: "Forms", status: "grey-dot" },
      { name: "Delete form submissions", status: "grey-dot" },
      { name: "Files", status: "grey-dot" },
      { name: "Marketing Access", status: "green-dot" },
      { name: "Ads", status: "green-circle" },
      { name: "Marketing email", status: "green-circle" },
      { name: "CTA", status: "green-circle" },
      { name: "SMS", status: "green-circle" },
      { name: "Buyer Intent", status: "green-circle" },
      { name: "Social", status: "grey-dot" },
      { name: "Marketing Events", status: "grey-dot" },
      { name: "Blog", status: "green-circle" },
      { name: "Landing pages", status: "green-circle" },
      { name: "Website pages", status: "green-circle" },
      { name: "URL Redirects", status: "green-circle" },
    ],
  },
  {
    title: "Sales",
    items: [
      { name: "Sales Access", status: "grey-dot" },
      { name: "Templates", status: "grey-dot" },
      { name: "Meeting scheduling pages", status: "grey-dot" },
      { name: "Sales Starter", status: "grey-dot" },
      { name: "Forecasts", status: "grey-dot" },
    ],
  },
];

export const STANDARD_USER_PERMISSIONS: PermCategory[] = [
  {
    title: "CRM objects",
    items: [
      { name: "Contacts", status: "green-circle" },
      { name: "Companies", status: "green-circle" },
      { name: "Deals", status: "green-circle" },
      { name: "Orders", status: "green-circle" },
      { name: "Tickets", status: "green-circle" },
      { name: "Tasks", status: "green-circle" },
    ],
  },
  {
    title: "CRM tools",
    items: [
      { name: "Communicate", status: "green-dot" },
      { name: "Import", status: "green-dot" },
      { name: "Export", status: "green-dot" },
      { name: "Custom views", status: "green-dot" },
    ],
  },
  {
    title: "Marketing",
    items: [
      { name: "Marketing Access", status: "green-dot" },
      { name: "Marketing email", status: "green-circle" },
      { name: "Blog", status: "green-circle" },
      { name: "Landing pages", status: "green-circle" },
    ],
  },
  {
    title: "Sales",
    items: [
      { name: "Sales Access", status: "green-dot" },
      { name: "Templates", status: "green-dot" },
      { name: "Meeting scheduling pages", status: "green-dot" },
    ],
  },
];

