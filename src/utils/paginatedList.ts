import { toast } from "react-toastify";
import axiosInstance from "./axios";

export interface PaginationParams {
  page?: number;
  perPage?: number;
  search?: string;
  draw?: number;
  filters?: any;
  isExport?: boolean;
  exportType?: string;
}

export type PagedListPayload<T = unknown> = Readonly<{
  data: T[];
  total: number;
  currentPage?: number;
  perPage?: number;
}>;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function toFiniteNumber(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function readPagedRows(response: unknown): unknown[] {
  if (Array.isArray(response)) {
    return response;
  }

  const record = asRecord(response);
  if (!record) {
    return [];
  }

  const data = Array.isArray(record.data) ? record.data : null;
  const dataList = Array.isArray(record.dataList) ? record.dataList : null;

  if (data && data.length > 0) {
    return data;
  }
  if (dataList && dataList.length > 0) {
    return dataList;
  }
  return data ?? dataList ?? [];
}

function readPagedTotal(response: unknown, rowCountFallback = 0): number {
  const record = asRecord(response);
  if (!record) {
    return rowCountFallback;
  }

  const meta = asRecord(record.meta);
  const total =
    toFiniteNumber(record.total) ??
    toFiniteNumber(meta?.total) ??
    toFiniteNumber(record.recordsTotal) ??
    toFiniteNumber(record.recordsFiltered);

  return total ?? rowCountFallback;
}

/** Normalize list API payloads into `{ data, total }` for table pagination. */
export function normalizePagedListResponse<T = unknown>(
  response: unknown,
  fallbackPage = 1,
  fallbackPerPage = 15,
): PagedListPayload<T> {
  const data = readPagedRows(response) as T[];
  const total = readPagedTotal(response, data.length);
  const record = asRecord(response);
  const meta = asRecord(record?.meta);

  return {
    data,
    total,
    currentPage:
      toFiniteNumber(record?.current_page) ??
      toFiniteNumber(meta?.current_page) ??
      fallbackPage,
    perPage:
      toFiniteNumber(record?.per_page) ??
      toFiniteNumber(meta?.per_page) ??
      fallbackPerPage,
  };
}

type PostPagedListOptions = {
  /** Optional label used in toast/error logging. */
  context?: string;
  /** Optional hook for error reporting (e.g. Sentry). */
  onError?: (error: unknown) => void;
  /** Disable the "export coming soon" toast if needed. */
  toastOnExport?: boolean;
};

export type NormalizedPagedList<T> = {
  data: T[];
  total: number;
};

/** Unwrap common list API shapes (`dataList` + `meta`, or `data` + `total`). */
export function normalizePostPagedListResult<T = unknown>(
  raw: unknown,
): NormalizedPagedList<T> {
  if (!raw || typeof raw !== "object") {
    return { data: [], total: 0 };
  }

  const record = raw as Record<string, unknown>;
  const dataList = record.dataList;
  const data = record.data;
  let rows: unknown[] = [];
  if (Array.isArray(dataList)) {
    rows = dataList;
  } else if (Array.isArray(data)) {
    rows = data;
  }

  const meta =
    record.meta && typeof record.meta === "object"
      ? (record.meta as Record<string, unknown>)
      : undefined;

  const total =
    Number(record.total) ||
    Number(meta?.total) ||
    Number(record.recordsTotal) ||
    Number(record.recordsFiltered) ||
    rows.length ||
    0;

  return { data: rows as T[], total };
}

export async function postPagedList<T = any>(
  endpoint: string,
  params: PaginationParams = {},
  options: PostPagedListOptions = {},
): Promise<T> {
  const {
    page = 1,
    perPage = 15,
    search = "",
    draw = 1,
    filters = {},
    isExport = false,
    exportType = "",
  } = params;

  try {
    const response = await axiosInstance.post(
      endpoint,
      {
        page,
        perPage,
        search,
        draw,
        ...filters,
        isExport,
        exportType,
      },
      {
        responseType: isExport ? ("blob" as const) : ("json" as const),
        headers: isExport
          ? {
              Accept: "*/*",
              "Content-Type": "application/json",
            }
          : undefined,
      },
    );

    if (isExport && (options.toastOnExport ?? true)) {
      toast.success(`${String(exportType).toUpperCase()} export - comming soon`);
    }

    return response?.data?.data as T;
  } catch (error) {
    options.onError?.(error);
    // Keep console noise consistent with existing call sites
    console.error(`${options.context ?? "API"} Error:`, error);
    throw error;
  }
}

