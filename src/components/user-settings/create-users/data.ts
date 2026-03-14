import type { AccessMethod, SeatOption, SelectableUser, StepMeta, TemplateGroup, TemplateItem } from "./types";
import { STANDARD_USER_PERMISSIONS, VIEW_ONLY_PERMISSIONS } from "./permissions";

export const STEPS: StepMeta[] = [
  { id: "email", label: "Select user" },
  { id: "access", label: "Access" },
  { id: "review", label: "Review" },
];

export const SELECTABLE_USERS: SelectableUser[] = [
  { id: "u_1", name: "Sarah Johnson", email: "sarah.johnson@crmportal.com" },
  { id: "u_2", name: "Michael Chen", email: "michael.chen@crmportal.com" },
  { id: "u_3", name: "Ava Martinez", email: "ava.martinez@crmportal.com" },
  { id: "u_4", name: "Daniel Kim", email: "daniel.kim@crmportal.com" },
  { id: "u_5", name: "Priya Patel", email: "priya.patel@crmportal.com" },
];

export const SEAT_OPTIONS: SeatOption[] = [
  { id: "view_only", label: "View-Only Seat", sublabel: "Unlimited seats" },
  { id: "core", label: "Core Seat", sublabel: "Unlimited seats", badge: { text: "Trial", color: "#2d7a4f" } },
  { id: "developer", label: "Developer Seat", sublabel: "Unlimited seats" },
  { id: "commerce_pro", label: "Commerce Professional Seat", sublabel: "Unlimited seats", badge: { text: "Trial", color: "#2d7a4f" } },
  { id: "sales_pro", label: "Sales Professional Seat", sublabel: "5 seats remaining" },
  { id: "service_starter", label: "Service Starter Seat", sublabel: "Unlimited seats" },
];

export const ACCESS_METHODS: AccessMethod[] = [
  {
    id: "seat_permissions",
    title: "Use seat permissions",
    description: "Users will have default permissions based on the seat you select.",
  },
  {
    id: "super_admin",
    title: "Make Super Admin",
    description: "Super Admins can manage all users, tools, and settings.",
  },
  {
    id: "template",
    title: "Start with a template",
    description: "Copy another user's permissions or use a suggested set of permissions based on common roles.",
  },
  {
    id: "scratch",
    title: "Start from scratch",
    description: "Create permissions specifically for this user.",
  },
];

export const TEMPLATE_GROUPS: TemplateGroup[] = [
  {
    groupLabel: "Suggested templates",
    items: [{ id: "view_only_tpl", label: "View only", permissions: VIEW_ONLY_PERMISSIONS }],
  },
  {
    groupLabel: "Role templates",
    items: [
      {
        id: "super_admin_tpl",
        label: "Super Admin",
        sublabel: "Super Admin permissions can't be edited.",
        disabled: true,
      },
      {
        id: "standard_user_tpl",
        label: "Standard user",
        permissions: STANDARD_USER_PERMISSIONS,
      },
    ],
  },
];

export const ALL_TEMPLATE_ITEMS: TemplateItem[] = TEMPLATE_GROUPS.flatMap((g) => g.items);

