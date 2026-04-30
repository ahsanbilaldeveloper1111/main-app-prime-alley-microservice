import type { AxiosError, AxiosResponse } from "axios";
import { toast } from "react-toastify";
import axiosInstance from "./axios";

interface PaginationParams {
  page?: number;
  perPage?: number;
  search?: string;
  draw?: number;
  filters?: any;
  isExport?: boolean;
  exportType?: string;
  reportType?: string;
  moduleSlug?: string;
}

type ExportJsonPayload = {
  success?: boolean;
  message?: string;
  detail?: string;
  dataList?: Array<Record<string, unknown>>;
  data?:
    | { dataList?: Array<Record<string, unknown>> }
    | Array<Record<string, unknown>>;
};

function appendFiltersToQueryParams(
  queryParams: URLSearchParams,
  filters: Record<string, unknown>,
) {
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value) || typeof value === "object") {
      queryParams.append(key, JSON.stringify(value));
      return;
    }
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      typeof value === "bigint" ||
      typeof value === "symbol"
    ) {
      queryParams.append(key, value.toString());
      return;
    }
    queryParams.append(key, JSON.stringify(value));
  });
}

function getRowsFromExportJson(
  parsed: ExportJsonPayload,
): Record<string, unknown>[] {
  const nestedDataList =
    !Array.isArray(parsed?.data) &&
    parsed?.data != null &&
    Array.isArray((parsed.data as { dataList?: unknown[] }).dataList)
      ? (parsed.data as { dataList: unknown[] }).dataList
      : undefined;
  const rowsSource =
    (Array.isArray(parsed?.dataList) ? parsed.dataList : undefined) ??
    (Array.isArray(parsed?.data) ? parsed.data : undefined) ??
    nestedDataList ??
    [];
  return rowsSource.filter(
    (row: unknown): row is Record<string, unknown> =>
      typeof row === "object" && row !== null && !Array.isArray(row),
  );
}

function csvEscape(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "object") {
    const escapedObject = JSON.stringify(value).replaceAll('"', '""');
    return /[",\n\r]/.test(escapedObject)
      ? `"${escapedObject}"`
      : escapedObject;
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint" ||
    typeof value === "symbol"
  ) {
    const escaped = String(value).replaceAll('"', '""');
    return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
  }
  return "";
}

function buildExportTimestamp(): string {
  return new Date()
    .toISOString()
    .replaceAll(":", "-")
    .replaceAll(".", "-")
    .slice(0, -5);
}

function downloadCsvRows(rows: Record<string, unknown>[]): string {
  const headers = Array.from(
    rows.reduce<Set<string>>((acc, row) => {
      Object.keys(row ?? {}).forEach((k) => acc.add(k));
      return acc;
    }, new Set<string>()),
  );
  const csvLines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => csvEscape(row?.[h])).join(",")),
  ];
  const csvBlob = new Blob([`\uFEFF${csvLines.join("\r\n")}`], {
    type: "text/csv;charset=utf-8;",
  });
  const csvUrl = globalThis.URL.createObjectURL(csvBlob);
  const csvLink = document.createElement("a");
  csvLink.href = csvUrl;
  csvLink.setAttribute(
    "download",
    `call_recordings_${buildExportTimestamp()}.csv`,
  );
  document.body.appendChild(csvLink);
  csvLink.click();
  csvLink.remove();
  globalThis.URL.revokeObjectURL(csvUrl);
  return csvUrl;
}

type BinaryExportFormat = "xlsx" | "pdf";

function acceptHeaderForStreamingExport(format: BinaryExportFormat): string {
  return format === "xlsx"
    ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, application/octet-stream, */*"
    : "application/pdf, application/octet-stream, */*";
}

async function processBlobExportResponse(
  response: AxiosResponse<Blob>,
  options: {
    binaryFormat: BinaryExportFormat;
    downloadBaseName: string;
    successToast: string;
  },
): Promise<string | undefined> {
  if (response.status === 204) {
    toast.error("No data found for export");
    return undefined;
  }

  const contentType = String(response.headers?.["content-type"] ?? "");
  if (contentType.includes("application/json")) {
    const text = await response.data.text();
    const parsed = JSON.parse(text) as ExportJsonPayload;
    const rows = getRowsFromExportJson(parsed);

    if (!Array.isArray(rows) || rows.length === 0) {
      const message =
        parsed?.detail ||
        parsed?.message ||
        "No export data found in response.";
      toast.error(message);
      throw new Error(message);
    }
    const csvUrl = downloadCsvRows(rows);
    toast.success("CSV file downloaded successfully");
    return csvUrl;
  }

  const blobType =
    options.binaryFormat === "xlsx"
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : "application/pdf";
  const blob = new Blob([response.data], { type: blobType });
  const url = globalThis.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const timestamp = buildExportTimestamp();
  const ext = options.binaryFormat === "xlsx" ? "xlsx" : "pdf";
  link.setAttribute(
    "download",
    `${options.downloadBaseName}_${timestamp}.${ext}`,
  );

  document.body.appendChild(link);
  link.click();
  link.remove();
  globalThis.URL.revokeObjectURL(url);

  toast.success(options.successToast);
  return url;
}

async function toastAxiosBlobError(
  error: unknown,
  fallbackMessage: string,
): Promise<void> {
  const ax = error as AxiosError<Blob>;
  const data = ax.response?.data;
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      const parsed = JSON.parse(text) as ExportJsonPayload;
      toast.error(parsed?.detail || parsed?.message || fallbackMessage);
    } catch {
      toast.error(fallbackMessage);
    }
  } else {
    toast.error(fallbackMessage);
  }
}

export const ListCallLogs = async (
  params: PaginationParams | undefined,
  endpoint: string,
) => {
  try {
    const safeParams = params ?? {};
    const {
      page = 1,
      perPage = 15,
      search = "",
      draw = 1,
      filters = {},
      isExport = false,
      exportType = "",
      reportType = "",
      moduleSlug = "",
    } = safeParams;

    // Create base query parameters
    const queryParams = new URLSearchParams({
      page: page.toString(),
      perPage: perPage.toString(),
      search: search,
      draw: draw.toString(),
      isExport: isExport.toString(),
      exportType: exportType,
      reportType: reportType,
      moduleSlug: moduleSlug,
    });

    // Flatten filters and add each key-value pair as separate query parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        // Handle arrays by converting them to JSON strings for proper format
        if (Array.isArray(value)) {
          queryParams.append(key, JSON.stringify(value));
        }
        // Handle objects by converting them to JSON strings
        else if (typeof value === "object") {
          queryParams.append(key, JSON.stringify(value));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });

    if (isExport === true) {
      const response = await axiosInstance.get(
        `${endpoint}?${queryParams.toString()}`,
        {
          responseType: "blob",
          headers: {
            "Accept":
              exportType === "xlsx"
                ? acceptHeaderForStreamingExport("xlsx")
                : "audio/*, application/octet-stream, */*",
          },
        },
      );

      return response.data;
    } else {
      const response = await axiosInstance.get(
        `${endpoint}?${queryParams.toString()}`,
      );
      //console.log('response call logs:', response);
      return response.data;
    }
  } catch (error) {
    throw error;
  }
};

export const ExportCallLogs = async (params: PaginationParams = {}) => {
  try {
    const {
      page = 1,
      perPage = 15,
      search = "",
      draw = 1,
      filters = {},
      isExport = true,
      exportType = "csv",
    } = params;

    // Create base query parameters
    const queryParams = new URLSearchParams({
      search: search.toString(),
      isExport: "true",
      exportType: exportType.toString(),
    });

    // Flatten filters and add each key-value pair as separate query parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        // Handle arrays by joining with commas (avoid JSON encoding issues)
        if (Array.isArray(value)) {
          queryParams.append(key, value.join(","));
        }
        // Handle objects by converting them to JSON strings
        else if (typeof value === "object") {
          queryParams.append(key, JSON.stringify(value));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });

    // Same-origin proxy to avoid 431 and keep same pattern as rest of app
    const exportUrl = `/api/call-logs/export?${queryParams.toString()}`;

    window.open(exportUrl, "_blank");

    toast.success(`${exportType.toUpperCase()} export started`);

    return { success: true };
  } catch (error) {
    console.error("Export Error:", error);
    toast.error("Export failed");
    throw error;
  }
};

export const DownloadCallRecording = async (
  id: string,
  agentExtension: string,
  endpoint: string,
  node?: string,
) => {
  try {
    //window.open(`${endpoint}/${id}`, '_blank');
    const response = await axiosInstance.get(`${endpoint}/${id}`, {
      responseType: "blob",
      params: {
        extension_number: agentExtension,
        node: node,
      },
    });

    if (response.status === 204) {
      toast.error("Audio file not found");
      return;
    }

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `recording_${id}.mp3`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return url;
  } catch (error) {
    throw error;
  }
};

export const DownloadStreamingExport = async (
  params: PaginationParams | undefined,
  endpoint: string,
  reportType: string,
) => {
  const safeParams = params ?? {};
  const {
    page = 1,
    perPage = 15,
    draw = 1,
    search = "",
    filters = {},
    isExport = true,
    exportType = "excel",
    moduleSlug = "",
  } = safeParams;

  try {
    const normalizedExportType = exportType === "excel" ? "xlsx" : exportType;

    // Create base query parameters
    const queryParams = new URLSearchParams({
      page: page.toString(),
      perPage: perPage.toString(),
      search: search,
      draw: draw.toString(),
      isExport: isExport.toString(),
      exportType: normalizedExportType,
      reportType: reportType,
      moduleSlug: moduleSlug,
    });

    appendFiltersToQueryParams(queryParams, filters);

    const binaryFormat: BinaryExportFormat =
      normalizedExportType === "xlsx" ? "xlsx" : "pdf";

    const response = await axiosInstance.get(
      `${endpoint}?${queryParams.toString()}`,
      {
        responseType: "blob",
        headers: {
          Accept: acceptHeaderForStreamingExport(binaryFormat),
        },
      },
    );

    return await processBlobExportResponse(response, {
      binaryFormat,
      downloadBaseName: "call_recordings",
      successToast: `${normalizedExportType.toUpperCase()} file downloaded successfully`,
    });
  } catch (error) {
    console.error(`${exportType.toUpperCase()} Download Error:`, error);
    throw error;
  }
};

/** POST export: body matches list filters (see Communications Call Recordings). */
export const ExportCallRecordings = async (
  filters: Record<string, unknown>,
) => {
  try {
    const response = await axiosInstance.post(
      "call-logs/recordings/export",
      filters,
      {
        responseType: "blob",
        headers: {
          Accept: acceptHeaderForStreamingExport("xlsx"),
        },
      },
    );

    return await processBlobExportResponse(response, {
      binaryFormat: "xlsx",
      downloadBaseName: "call_recordings",
      successToast: "XLSX file downloaded successfully",
    });
  } catch (error) {
    await toastAxiosBlobError(error, "Call recordings export failed");
    console.error("Call recordings export error:", error);
    throw error;
  }
};

export const GetTranscriptionOverview = async () => {
  try {
    const response = await axiosInstance.get(
      `call-logs/analytics/dashboard-overview`,
      {
        params: {
          reportType: "analyticsDashboardOverview",
        },
      },
    );
    if (response && response?.data && response?.data?.success === true) {
      return response?.data?.data;
    } else {
      //  toast.error("Failed to fetch transcription overview");
    }
  } catch (error) {
    // toast.error("Failed to fetch transcription overview");
    throw error;
  }
};

export const DownloadCallsExport = async (params: any, endpoint: string) => {
  try {
    // Create base query parameters using URLSearchParams (matching ListCallLogs approach)
    const queryParams = new URLSearchParams();

    // Flatten filters and add each key-value pair as separate query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        // Handle arrays/objects by converting them to JSON strings.
        if (Array.isArray(value) || typeof value === "object") {
          const jsonString = JSON.stringify(value);
          queryParams.append(key, jsonString);
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });

    const queryString = queryParams.toString();
    // Set appropriate headers based on export type
    const headers = {
      Accept: acceptHeaderForStreamingExport("xlsx"),
    };

    const response = await axiosInstance.get(`${endpoint}?${queryString}`, {
      responseType: "blob",
      headers,
    });

    if (response.status === 204) {
      toast.error("No data found for export");
      return;
    }

    // Create blob with appropriate type based on export format
    const blobType =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    const blob = new Blob([response.data], { type: blobType });
    const url = globalThis.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    // Generate filename with timestamp and appropriate extension
    const timestamp = buildExportTimestamp();
    const fileExtension = "csv";
    link.setAttribute("download", `calls_export_${timestamp}.${fileExtension}`);

    document.body.appendChild(link);
    link.click();
    link.remove();
    globalThis.URL.revokeObjectURL(url);

    toast.success(`Calls export file downloaded successfully`);
    return url;
  } catch (error) {
    console.error(`Calls export Download Error:`, error);
    toast.error(`Calls export download failed`);
    throw error;
  }
};
