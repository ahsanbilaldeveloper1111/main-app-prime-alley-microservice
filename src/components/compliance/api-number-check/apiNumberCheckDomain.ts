import { toast } from "react-toastify";

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

export const MAX_MANUAL_NUMBERS = 1;

export function normalizeDigits(value: string): string {
  return value.replaceAll(/\D/g, "");
}

export function parsePhoneNumbers(input: string): string[] {
  return input
    .split(/[,\n]/)
    .map((num) => num.trim())
    .filter((num) => num.length > 0);
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
    toast.error("Please enter a phone number");
    return null;
  }

  const phoneNumbers = parsePhoneNumbers(manualInput);
  if (phoneNumbers.length === 0) {
    toast.error("Please enter a phone number");
    return null;
  }

  if (phoneNumbers.length > MAX_MANUAL_NUMBERS) {
    toast.error("Only one number can be checked at a time");
    return null;
  }

  const phoneNumber = phoneNumbers[0];
  if (!isValidPhoneNumber(phoneNumber)) {
    toast.error(
      'Invalid phone number. Numbers must start with "05" and be exactly 10 digits.',
    );
    return null;
  }

  const result = await checkSingleNumber(phoneNumber);
  return [result];
}
