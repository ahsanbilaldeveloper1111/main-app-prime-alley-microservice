import type { TicketModuleRecord } from "@utils/ticket-module";

export type TicketModule = TicketModuleRecord;

export const TICKET_MODULE_COLOR_SUGGESTIONS = [
  "#0d6efd",
  "#198754",
  "#dc3545",
  "#fd7e14",
  "#6f42c1",
  "#20c997",
] as const;

export const DEFAULT_TICKET_MODULE_COLOR = "#0d6efd";
