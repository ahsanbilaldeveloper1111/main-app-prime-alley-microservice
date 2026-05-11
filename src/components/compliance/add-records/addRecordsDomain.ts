export const ADD_RECORDS_DNCR_PERM_MSG =
  "You do not have permission for this action.";

/** Fetch params for `fetchLocalDNDBlocks`. */
export type AddRecordsFetchParams = {
  limit: number;
  offset: number;
  search?: string;
};

export type CsvRecordPayload = {
  called_number: string;
  comments: string;
};

const CALLED_NUMBER_REGEX = /^05\d{8}$/;

/** Strip spaces/dashes; local DND expects 10 digits starting with 05 (e.g. 0501234567). */
export function digitsOnlyCalledNumber(value: string): string {
  return value.replaceAll(/\D/g, "");
}

export function isValidCalledNumber(value: string): boolean {
  return CALLED_NUMBER_REGEX.test(digitsOnlyCalledNumber(value));
}

export function getAddRecordsErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === "object" && err !== null && "response" in err) {
    const response = (err as { response?: { data?: { message?: string } } })
      .response;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
}

export function formatLocalDndDateTime(dateTimeStr: string): string {
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

export function downloadLocalDndBlocksSampleCsv(): void {
  const sampleData = [
    ["called_number", "comments"],
    ["0511111111", "Comments for the record"],
    ["0511111112", "Comments for the record"],
  ];

  const csvContent = sampleData.map((row) => row.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = globalThis.URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", "local_dnd_blocks_sample.csv");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  link.remove();
  globalThis.URL.revokeObjectURL(url);
}

export type ParsedBulkCsvResult =
  | { ok: true; records: CsvRecordPayload[] }
  | { ok: false; message: string };

/** Parse CSV text (header + rows) into payloads; validates each called number. */
export function parseLocalDndBulkCsvPreview(csvPreview: string): ParsedBulkCsvResult {
  const lines = csvPreview.trim().split("\n");
  if (lines.length < 2) {
    return {
      ok: false,
      message:
        "CSV file must contain at least a header row and one data row",
    };
  }

  const dataLines = lines.slice(1);
  const records: CsvRecordPayload[] = [];

  for (const line of dataLines) {
    const values = line.split(",").map((v) => v.trim());
    const calledNum = values[0];
    if (!calledNum) continue;
    const normalizedCsvNumber = digitsOnlyCalledNumber(calledNum);
    if (!isValidCalledNumber(normalizedCsvNumber)) {
      return {
        ok: false,
        message: `Invalid called number in CSV: ${calledNum}. Must be 10 digits starting with 05.`,
      };
    }
    records.push({
      called_number: normalizedCsvNumber,
      comments: values[1] || "",
    });
  }

  if (records.length === 0) {
    return { ok: false, message: "No valid records found in CSV file" };
  }

  return { ok: true, records };
}
