import { toast } from "react-toastify";
import { CheckNumbers } from "@utils/dncr";

export interface PhoneResult {
  input: string;
  normalized?: string;
  status?: string;
  carrier?: string;
  country?: string;
  notes?: string;
  accountNumber?: string;
  dncrStatus?: string;
  transactionStatus?: string;
  details?: Record<string, unknown>;
}

export interface NumberCheckTableRow {
  id: string;
  calledNumber: string;
  status: string;
  dncrStatus?: string;
}

interface ApiResultDetails {
  accountNumber?: string;
  dncrStatus?: string;
  transactionStatus?: string | null;
}

export interface ApiResultItem {
  status?: string;
  message?: string;
  number?: string;
  details?: ApiResultDetails;
}

export interface BatchApiResponse {
  results?: Record<string, ApiResultItem>;
}

export const MAX_MANUAL_NUMBERS = 10;
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const BULK_DNCR_PERMISSION_TOAST =
  "You do not have permission for bulk DNCR checks.";

export function normalizeDigits(value: string): string {
  return value.replaceAll(/\D/g, "");
}

export function parsePhoneNumbers(input: string): string[] {
  return input
    .split(/[,\n]/)
    .map((num) => num.trim())
    .filter((num) => num.length > 0)
    .slice(0, MAX_MANUAL_NUMBERS);
}

export function isValidPhoneNumber(phoneNumber: string): boolean {
  const digitsOnly = normalizeDigits(phoneNumber);
  return digitsOnly.startsWith("05") && digitsOnly.length === 10;
}

export function getStatusCategory(
  status: string | null | undefined,
  dncrStatus: string | null | undefined,
): "invalid" | "denied" | "permitted" {
  const normalizedStatus = status?.toUpperCase();
  const normalizedDncrStatus = dncrStatus?.toUpperCase();
  const isDncrStatusEmpty = !dncrStatus;

  if (normalizedStatus === "INVALID" && isDncrStatusEmpty) return "invalid";
  if (normalizedStatus === "TRUE" && normalizedDncrStatus === "TRUE") return "denied";
  if (normalizedStatus === "FALSE" && normalizedDncrStatus === "FALSE") return "permitted";
  if (normalizedDncrStatus === "TRUE" || dncrStatus === "Denied") return "denied";
  if (normalizedDncrStatus === "FALSE" || dncrStatus === "Permitted") return "permitted";
  return "permitted";
}

export function getStatusLabel(
  status: string | null | undefined,
  dncrStatus: string | null | undefined,
): string {
  const category = getStatusCategory(status, dncrStatus);
  if (category === "invalid") return "Invalid";
  if (category === "denied") return "Denied";
  return "Permitted";
}

export function createErrorResult(phoneNumber: string, notes: string): PhoneResult {
  return {
    input: phoneNumber,
    normalized: phoneNumber,
    status: "Error",
    notes,
  };
}

export function transformCheckResult(phoneNumber: string, response: unknown): PhoneResult {
  if (!response || response === false) {
    return {
      input: phoneNumber,
      normalized: phoneNumber,
      status: "Invalid",
      notes: "No results found",
    };
  }

  if (Array.isArray(response)) {
    if (response.length > 0) return transformCheckResult(phoneNumber, response[0]);
    return {
      input: phoneNumber,
      normalized: phoneNumber,
      status: "Invalid",
      notes: "No results found",
    };
  }

  if (typeof response === "object") {
    const resultObj = response as ApiResultItem;
    const details = resultObj.details ?? {};
    const transactionStatus =
      details.transactionStatus !== null && details.transactionStatus !== undefined
        ? String(details.transactionStatus)
        : "N/A";
    const status = resultObj.status;
    const notes =
      resultObj.message ||
      (status === "TRUE" || status === "VALID" ? "Registered" : "Not Registered");

    return {
      input: phoneNumber,
      normalized: phoneNumber,
      status,
      accountNumber: details.accountNumber || resultObj.number || phoneNumber,
      dncrStatus: details.dncrStatus,
      transactionStatus,
      notes,
    };
  }

  return {
    input: phoneNumber,
    normalized: phoneNumber,
    status: "Invalid",
    notes: "No results found",
  };
}

export async function runManualNumberCheck(
  manualInput: string,
  checkSingleNumber: (phoneNumber: string) => Promise<PhoneResult>,
): Promise<PhoneResult[] | null> {
  if (!manualInput.trim()) {
    toast.error("Please enter at least one phone number");
    return null;
  }

  const phoneNumbers = parsePhoneNumbers(manualInput);
  if (phoneNumbers.length === 0) {
    toast.error("Please enter valid phone numbers");
    return null;
  }

  if (phoneNumbers.length > MAX_MANUAL_NUMBERS) {
    toast.error("Maximum 10 numbers allowed");
    return null;
  }

  const invalidNumbers = phoneNumbers.filter((phoneNumber) => !isValidPhoneNumber(phoneNumber));
  if (invalidNumbers.length > 0) {
    toast.error(
      `Invalid phone numbers: ${invalidNumbers.join(", ")}. Numbers must start with "05" and be exactly 10 digits.`,
    );
    return null;
  }

  if (phoneNumbers.length === 1) {
    const result = await checkSingleNumber(phoneNumbers[0]);
    return [result];
  }

  const apiResponse = await CheckNumbers(phoneNumbers);
  if (!apiResponse || apiResponse === false) {
    return phoneNumbers.map((phoneNumber) => createErrorResult(phoneNumber, "API request failed"));
  }

  const responseObj = apiResponse as BatchApiResponse;
  if (!responseObj.results || typeof responseObj.results !== "object") {
    return phoneNumbers.map((phoneNumber) =>
      createErrorResult(phoneNumber, "Unexpected response format"),
    );
  }

  return phoneNumbers.map((phoneNumber) => {
    const result = responseObj.results?.[phoneNumber];
    return result
      ? transformCheckResult(phoneNumber, result)
      : createErrorResult(phoneNumber, "No result found for this number");
  });
}
