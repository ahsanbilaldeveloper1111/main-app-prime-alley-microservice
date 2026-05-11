/** List row / API record */
export interface LocalDNDBlockRecord {
  id: number;
  called_number: string;
  company_name: string;
  date_time: string;
  comments: string;
}

export interface LocalDNDListResponse {
  status: string;
  total: number;
  records: LocalDNDBlockRecord[];
  limit: number;
  offset: number;
}

export interface AddLocalDNDResponse {
  status: string;
  message: string;
  record_id: number;
}

export interface BulkAddLocalDNDResponse {
  status: string;
  message: string;
  records_added?: number;
}

export const LOCAL_DND_BLOCKS_LIST_PATH = "/dncr/local-dnd-blocks";
export const LOCAL_DND_BLOCKS_ADD_PATH = "/dncr/local-dnd-blocks/add";
export const LOCAL_DND_BLOCKS_BULK_ADD_PATH = "/dncr/local-dnd-blocks/bulk-add";
export const LOCAL_DND_BLOCKS_BULK_DELETE_PATH =
  "/dncr/local-dnd-blocks/bulk-delete";

export function localDndBlockDeletePath(id: number): string {
  return `/dncr/local-dnd-blocks/delete/${id}`;
}

export function formatLocalDndBlockDateTime(dateTimeStr: string): string {
  try {
    const date = new Date(dateTimeStr);
    return date
      .toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace(",", "");
  } catch {
    return dateTimeStr;
  }
}

export function getLocalDndCallBlockErrorMessage(
  err: unknown,
  fallback: string,
): string {
  if (typeof err === "object" && err !== null && "response" in err) {
    const msg = (err as { response?: { data?: { message?: string } } }).response
      ?.data?.message;
    if (msg) return msg;
  }
  return fallback;
}

export const LOCAL_DND_CALL_BLOCK_SAMPLE_FILENAME =
  "local_dnd_blocks_sample.csv";

export function downloadLocalDndCallBlockSampleCsv(): void {
  const sampleData = [
    ["called_number", "company_name", "comments"],
    ["0501234567", "Acme Corporation", "Bulk upload - Campaign 2026"],
    ["0557890123", "Tech Solutions Ltd", "DND List Import"],
    ["0509876543", "Global Industries", "Customer requested block"],
  ];

  const csvContent = sampleData.map((row) => row.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = globalThis.URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", LOCAL_DND_CALL_BLOCK_SAMPLE_FILENAME);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  link.remove();
  globalThis.URL.revokeObjectURL(url);
}
