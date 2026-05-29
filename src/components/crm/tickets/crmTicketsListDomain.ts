import { formatDateForTable } from "@utils/Helper";
import axiosInstance from "@utils/axios";
import { toast } from "react-toastify";

export type CrmTicketStatus = "Open" | "In Progress" | "Resolved";
export type CrmTicketPriority = "Low" | "Medium" | "High";

export type CrmTicketAppliedFilters = {
  ticketOwner: string;
  createDateFrom: string;
  createDateTo: string;
  priority: CrmTicketPriority | "All Priorities";
};

export const DEFAULT_CRM_TICKET_FILTERS: CrmTicketAppliedFilters = {
  ticketOwner: "All Owners",
  createDateFrom: "",
  createDateTo: "",
  priority: "All Priorities",
};

export type CrmTicketSummary = {
  id: number;
  summary: string;
};

export type CrmTicketGridRow = {
  id: number;
  ticket_name: string;
  pipeline: string;
  ticket_status: CrmTicketStatus;
  create_date: string;
  priority: CrmTicketPriority;
  ticket_owner: string;
  source: string;
  last_activity_date: string;
  email?: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
  crm_summary?: CrmTicketSummary;
  data?: {
    crm_summary?: CrmTicketSummary;
    data?: { crm_summary?: CrmTicketSummary };
  };
  rawData?: unknown;
};

type TicketHierarchyExtension = {
  id?: unknown;
  display_name?: string;
  name?: string;
};

const PRIORITY_LABELS: CrmTicketPriority[] = ["Low", "Medium", "High"];

const PRIORITY_TO_API: Record<CrmTicketPriority, number> = {
  Low: 0,
  Medium: 1,
  High: 2,
};

export function getTicketCrmSummary(
  ticket: CrmTicketGridRow,
): CrmTicketSummary | undefined {
  return (
    ticket.crm_summary ??
    ticket.data?.crm_summary ??
    ticket.data?.data?.crm_summary
  );
}

function readPositiveNumber(value: unknown): number | undefined {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed >= 0) {
    return parsed;
  }
  return undefined;
}

function resolveTicketsListTotal(
  source: Record<string, unknown> | null | undefined,
  rowCount: number,
): number {
  if (!source) {
    return rowCount;
  }

  const pagination = readRecord(source.pagination);
  const candidates = [
    source.total,
    source.recordsTotal,
    source.recordsFiltered,
    source.totalRecords,
    pagination?.total,
    pagination?.recordsTotal,
    pagination?.recordsFiltered,
  ];

  for (const candidate of candidates) {
    const parsed = readPositiveNumber(candidate);
    if (parsed != null) {
      return parsed;
    }
  }

  return rowCount;
}

export function normalizeTicketsListResponse(response: unknown): {
  items: unknown[];
  total: number;
} {
  if (response == null) {
    return { items: [], total: 0 };
  }
  if (Array.isArray(response)) {
    return { items: response, total: response.length };
  }

  const root = response as Record<string, unknown>;
  if (Array.isArray(root.data)) {
    return {
      items: root.data,
      total: resolveTicketsListTotal(root, root.data.length),
    };
  }

  const nested = root.data;
  if (nested != null && typeof nested === "object") {
    const nestedRecord = nested as Record<string, unknown>;
    const rows = nestedRecord.data;
    if (Array.isArray(rows)) {
      return {
        items: rows,
        total: resolveTicketsListTotal(nestedRecord, rows.length),
      };
    }
  }

  const dataList = root.dataList;
  if (Array.isArray(dataList)) {
    return {
      items: dataList,
      total: resolveTicketsListTotal(root, dataList.length),
    };
  }

  return { items: [], total: 0 };
}

function mapTicketStatus(statusName: unknown): CrmTicketStatus {
  const normalized = String(statusName ?? "").toLowerCase();
  if (normalized.includes("resolved") || normalized.includes("closed")) {
    return "Resolved";
  }
  if (
    normalized.includes("progress") ||
    normalized.includes("pending") ||
    normalized.includes("waiting")
  ) {
    return "In Progress";
  }
  return "Open";
}

function mapTicketPriority(priority: unknown): CrmTicketPriority {
  const priorityNum = Number(priority);
  if (Number.isNaN(priorityNum)) {
    return "Low";
  }
  if (priorityNum >= 2) {
    return "High";
  }
  return PRIORITY_LABELS[priorityNum] ?? "Low";
}

function toOptionalString(value: unknown): string | undefined {
  if (value == null) {
    return undefined;
  }
  return String(value);
}

function toFormatDateInput(value: unknown): string | Date | null | undefined {
  if (typeof value === "string" || value instanceof Date) {
    return value;
  }
  return undefined;
}

function readUserExtensionIds(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (raw == null || raw === "") {
    return [];
  }
  return [raw];
}

function resolveTicketOwnerLabel(
  ticket: Record<string, unknown>,
  extensions: TicketHierarchyExtension[],
): string {
  const ids = readUserExtensionIds(ticket.user_extension);
  if (ids.length === 0) {
    return "Unassigned";
  }

  const labels = ids.map((id) => {
    const match = extensions.find(
      (extension) => String(extension.id) === String(id),
    );
    return match?.display_name || match?.name || String(id);
  });

  return labels.join(", ");
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function formatTicketListDateBoundary(
  date: string,
  boundary: "start" | "end",
): string {
  const trimmed = date.trim();
  if (!trimmed) {
    return "";
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed.replace("T", " ")}:00`;
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(trimmed)) {
    return trimmed.replace("T", " ").slice(0, 19);
  }
  if (trimmed.includes(" ")) {
    return trimmed;
  }
  return boundary === "start" ? `${trimmed} 00:00:00` : `${trimmed} 23:59:59`;
}

type TicketStatusRecord = {
  id?: unknown;
  name?: string;
};

function isResolvedOrClosedStatusName(name: unknown): boolean {
  const normalized = String(name ?? "").toLowerCase();
  return normalized.includes("resolved") || normalized.includes("closed");
}

export function buildCrmTicketsListApiFilters(
  appliedFilters: CrmTicketAppliedFilters,
  extensions: TicketHierarchyExtension[],
  options?: {
    activeTab?: CrmTicketsListTab;
    statuses?: TicketStatusRecord[];
  },
): Record<string, unknown> {
  const filters: Record<string, unknown> = {};

  if (appliedFilters.priority !== "All Priorities") {
    filters.priority = PRIORITY_TO_API[appliedFilters.priority];
  }

  const startDate = formatTicketListDateBoundary(
    appliedFilters.createDateFrom,
    "start",
  );
  const endDate = formatTicketListDateBoundary(
    appliedFilters.createDateTo,
    "end",
  );
  if (startDate) {
    filters.start_date = startDate;
  }
  if (endDate) {
    filters.end_date = endDate;
  }

  if (appliedFilters.ticketOwner !== "All Owners") {
    const ownerExtension = extensions.find(
      (extension) =>
        extension.display_name === appliedFilters.ticketOwner ||
        extension.name === appliedFilters.ticketOwner,
    );
    if (ownerExtension?.id != null) {
      filters.extensions = [String(ownerExtension.id)];
      filters.is_filtered = true;
    }
  }

  const activeTab = options?.activeTab ?? "all";
  if (activeTab === "unassigned") {
    filters.only_unassigned = true;
  } else if (activeTab === "open") {
    const statuses = options?.statuses ?? [];
    const openStatusIds = statuses
      .filter((status) => !isResolvedOrClosedStatusName(status.name))
      .map((status) => String(status.id ?? ""))
      .filter((id) => id.length > 0);
    if (openStatusIds.length > 0) {
      filters.status_id = openStatusIds;
    }
  }

  return filters;
}

export function mapApiTicketToCrmGridRow(
  ticket: unknown,
  extensions: TicketHierarchyExtension[],
): CrmTicketGridRow | null {
  const record = readRecord(ticket);
  if (record?.id == null) {
    return null;
  }

  const status = readRecord(record.status);
  const module = readRecord(record.module);
  const type = readRecord(record.type);
  const crmSummary = readRecord(record.crm_summary);

  const createDate =
    formatDateForTable(toFormatDateInput(record.created_at)) || "—";
  const lastActivityDate =
    formatDateForTable(toFormatDateInput(record.updated_at)) || createDate;

  return {
    id: Number(record.id),
    ticket_name: String(record.title ?? record.ticket_name ?? "Untitled ticket"),
    pipeline: String(module?.name ?? "—"),
    ticket_status: mapTicketStatus(status?.name),
    create_date: createDate,
    priority: mapTicketPriority(record.priority),
    ticket_owner: resolveTicketOwnerLabel(record, extensions),
    source: String(
      record.ticket_category ?? type?.name ?? record.source ?? "—",
    ),
    last_activity_date: lastActivityDate,
    email: toOptionalString(record.email),
    phone: toOptionalString(record.phone),
    created_at: toOptionalString(record.created_at),
    updated_at: toOptionalString(record.updated_at),
    crm_summary:
      crmSummary?.id != null
        ? {
            id: Number(crmSummary.id),
            summary: String(crmSummary.summary ?? ""),
          }
        : undefined,
    rawData: ticket,
  };
}

export type CrmTicketsListTab = "all" | "open" | "unassigned";

export function buildCrmTicketsListRequest(
  appliedFilters: CrmTicketAppliedFilters,
  extensions: TicketHierarchyExtension[],
  options: {
    page: number;
    perPage: number;
    search: string;
    activeTab: CrmTicketsListTab;
    moduleSlug: string;
    statuses?: TicketStatusRecord[];
  },
): {
  page: number;
  perPage: number;
  search: string;
  filters: Record<string, unknown>;
  moduleSlug: string;
} {
  const filters = buildCrmTicketsListApiFilters(appliedFilters, extensions, {
    activeTab: options.activeTab,
    statuses: options.statuses,
  });

  return {
    page: options.page,
    perPage: options.perPage,
    search: options.search.trim(),
    filters,
    moduleSlug: options.moduleSlug,
  };
}

export function applyCrmTicketsTabFilter(
  rows: CrmTicketGridRow[],
  activeTab: CrmTicketsListTab,
): CrmTicketGridRow[] {
  if (activeTab === "open") {
    return rows.filter((ticket) => ticket.ticket_status !== "Resolved");
  }
  if (activeTab === "unassigned") {
    return rows.filter((ticket) => ticket.ticket_owner === "Unassigned");
  }
  return rows;
}

export function mapDashboardToCrmStats(dashboard: unknown): {
  total: number;
  open: number;
  unassigned: number;
} {
  const record = dashboard != null && typeof dashboard === "object"
    ? (dashboard as Record<string, unknown>)
    : null;

  const total = readPositiveNumber(record?.total ?? record?.total_tickets) ?? 0;
  const byStatus = Array.isArray(record?.by_status) ? record.by_status : [];
  const byApproval = readRecord(record?.by_approval);

  let open = 0;
  for (const entry of byStatus) {
    const row = readRecord(entry);
    const name = String(row?.name ?? "");
    const count = readPositiveNumber(row?.count ?? row?.total) ?? 0;
    if (isResolvedOrClosedStatusName(name)) {
      continue;
    }
    open += count;
  }

  const unassigned =
    readPositiveNumber(
      byApproval?.unassigned ??
        byApproval?.unassigned_count ??
        record?.unassigned ??
        record?.unassigned_count,
    ) ?? 0;

  return { total, open, unassigned };
}

export async function exportCrmTicketsCsv(params: {
  search: string;
  filters: Record<string, unknown>;
  moduleSlug: string;
}): Promise<void> {
  try {
    const response = await axiosInstance.post(
      "/tickets/list",
      {
        page: 1,
        perPage: 10000,
        search: params.search,
        draw: 1,
        ...params.filters,
        isExport: true,
        exportType: "csv",
        module_slug: params.moduleSlug,
      },
      {
        responseType: "blob",
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json",
        },
      },
    );

    const blob = response.data instanceof Blob
      ? response.data
      : new Blob([response.data]);

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "crm-tickets.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    toast.error("Failed to export tickets");
    throw error;
  }
}

export function getTicketActivityCount(ticket: unknown): number {
  const record = readRecord(ticket);
  const activityLogs = record?.activityLogs;
  return Array.isArray(activityLogs) ? activityLogs.length : 0;
}

export function getTicketCommentsCount(ticket: unknown): number {
  const record = readRecord(ticket);
  const comments = record?.comments;
  const assigneeComments = record?.assigneeComments;
  const commentCount = Array.isArray(comments) ? comments.length : 0;
  const assigneeCount = Array.isArray(assigneeComments)
    ? assigneeComments.length
    : 0;
  return commentCount + assigneeCount;
}

export function mapApiTicketsToCrmGridRows(
  tickets: unknown[],
  extensions: TicketHierarchyExtension[],
): CrmTicketGridRow[] {
  return tickets
    .map((ticket) => mapApiTicketToCrmGridRow(ticket, extensions))
    .filter((row): row is CrmTicketGridRow => row != null);
}
