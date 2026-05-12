import type { TableColumn } from "@components/GenericTable";

/** Row shape for the CRM activity history table. */
export interface ActivityRecord {
  id: number;
  record_id?: string;
  customer: string;
  type: string;
  agent: string;
  lastActivity: string;
  stage: string;
  tags: string[];
  dateTime: string;
}

export interface HistoryPaginationState {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  sort_by: string;
  sort_order: "asc" | "desc";
}

export interface HistoryActivityFiltersState {
  agents: string[];
  dateRange: { start: string; end: string };
}

export type ActivityEntityType = "prospect" | "lead" | "deal" | "order";

export type ActivityHistoryTableColumn = TableColumn<ActivityRecord>;
