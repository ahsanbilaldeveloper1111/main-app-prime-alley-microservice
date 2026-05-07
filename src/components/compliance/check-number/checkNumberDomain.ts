/** Max CSV size for DNCR bulk upload */
export const CHECK_NUMBER_MAX_FILE_BYTES = 10 * 1024 * 1024;

export const CHECK_NUMBER_ALLOWED_EXTENSIONS = [".csv"] as const;

export const CHECK_NUMBER_SAMPLE_FILENAME = "dncr_bulkupload_sample.csv";

/** Row shape from single-number CheckNumber API (array items). */
export interface CheckNumberResultRow {
  phoneNumber?: string;
  accountNumber?: string;
  status?: string;
  dncrStatus?: string;
  transactionStatus?: string;
}

/** Row value shape when bulk response is a flat record (key = phone). */
export interface BulkCheckResultValue {
  status?: string;
  accountNumber?: string;
  dncrStatus?: string;
  transactionStatus?: string;
}

export function isValidPhoneCharacter(char: string): boolean {
  const phoneRegex = /[\d\s\-\+\(\)]/;
  return phoneRegex.test(char);
}

export function isValidPhoneInput(value: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(value);
}

export type BulkFileValidationError =
  | "invalid_object"
  | "empty"
  | "too_large"
  | "bad_extension";

export function validateBulkCsvFile(file: File): BulkFileValidationError | null {
  if (!(file instanceof File)) {
    return "invalid_object";
  }
  if (file.size === 0) {
    return "empty";
  }
  if (file.size > CHECK_NUMBER_MAX_FILE_BYTES) {
    return "too_large";
  }
  const fileExtension = file.name
    .toLowerCase()
    .substring(file.name.lastIndexOf("."));
  if (
    !(CHECK_NUMBER_ALLOWED_EXTENSIONS as readonly string[]).includes(
      fileExtension,
    )
  ) {
    return "bad_extension";
  }
  return null;
}

export function bulkFileValidationToastMessage(
  err: BulkFileValidationError,
): string {
  switch (err) {
    case "invalid_object":
      return "Invalid file object";
    case "empty":
      return "The selected file is empty";
    case "too_large":
      return "File size must be less than 10MB";
    case "bad_extension":
      return `Invalid file type. Please use: ${CHECK_NUMBER_ALLOWED_EXTENSIONS.join(", ")}`;
    default:
      return "Invalid file";
  }
}

export function buildCheckNumberSampleCsv(): string {
  const sampleData = `PhoneNumber
0557044312
0556960535
0556930017
0557067850
0509380627
0551234567
0559876543`;
  const BOM = "\uFEFF";
  return BOM + sampleData;
}

export function downloadCheckNumberSampleFile(): void {
  const csvContent = buildCheckNumberSampleCsv();
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
  const url = globalThis.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = CHECK_NUMBER_SAMPLE_FILENAME;
  document.body.appendChild(a);
  a.click();
  globalThis.URL.revokeObjectURL(url);
  a.remove();
}

export function isTruthyString(v: string | undefined): boolean {
  return v === "TRUE";
}
