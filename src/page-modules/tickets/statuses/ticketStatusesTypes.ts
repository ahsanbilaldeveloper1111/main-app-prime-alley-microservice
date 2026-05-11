import type { TicketStatusRecord } from "@utils/ticket-statuses";

export const STATUS_COLOR_SUGGESTIONS = [
  { color: "#0d6efd", label: "Open/New" },
  { color: "#ffc107", label: "Pending" },
  { color: "#fd7e14", label: "In Progress" },
  { color: "#198754", label: "Resolved" },
  { color: "#6c757d", label: "Closed" },
  { color: "#dc3545", label: "Blocked" },
] as const;

export const DEFAULT_STATUS_COLOR = "#0d6efd";

export interface StatusSidebarConfig {
  title: string;
  namePlaceholder: string;
  submitLabel: string;
  submittingLabel: string;
  colorPickerId: string;
  colorTextId: string;
  nameInputId: string;
}

export const CREATE_SIDEBAR_CONFIG: StatusSidebarConfig = {
  title: "Create New Status",
  namePlaceholder: "e.g., Open, In Progress, Resolved, Pending Review, etc.",
  submitLabel: "Create Status",
  submittingLabel: "Creating...",
  colorPickerId: "createStatusColorPicker",
  colorTextId: "createStatusColorText",
  nameInputId: "createStatusName",
};

export const EDIT_SIDEBAR_CONFIG: StatusSidebarConfig = {
  title: "Edit Status",
  namePlaceholder: "Status Name",
  submitLabel: "Update Status",
  submittingLabel: "Updating...",
  colorPickerId: "editStatusColorPicker",
  colorTextId: "editStatusColorText",
  nameInputId: "editStatusName",
};

export type TicketStatus = TicketStatusRecord;
