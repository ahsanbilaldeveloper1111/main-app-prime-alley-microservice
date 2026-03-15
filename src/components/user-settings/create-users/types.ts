export type StepId = "email" | "access" | "review";

export interface StepMeta {
  id: StepId;
  label: string;
}

export interface SelectableUser {
  id: string;
  name: string;
  email: string;
}

export interface SeatOption {
  id: string;
  label: string;
  sublabel: string;
  badge?: { text: string; color: string };
}

export interface AccessMethod {
  id: "seat_permissions" | "super_admin" | "template" | "scratch";
  title: string;
  description: string;
}

export type PermStatus = "green-circle" | "grey-circle" | "green-dot" | "grey-dot";

export interface PermItem {
  name: string;
  status: PermStatus;
}

export interface PermCategory {
  title: string;
  items: PermItem[];
}

export interface TemplateItem {
  id: string;
  label: string;
  sublabel?: string;
  disabled?: boolean;
  permissions?: PermCategory[];
}

export interface TemplateGroup {
  groupLabel: string;
  items: TemplateItem[];
}

