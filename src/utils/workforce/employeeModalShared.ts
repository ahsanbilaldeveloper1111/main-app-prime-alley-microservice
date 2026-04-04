import { getMainAppUsers, type UserProfilePayload } from "@utils/staffManagement";

export const EMPLOYMENT_TYPES = ["Full-Time", "Part-Time", "Contract", "Internship", "Freelance", "Temporary"];
export const CONTRACT_TYPES = ["Permanent", "Temporary", "Freelance", "Fixed-term", "Probation"];

/** Employee code, CNIC / ID, and similar short profile text fields. */
export const WORKFORCE_PROFILE_SHORT_TEXT_MAX = 50;
export const DESIGNATION_MAX_LENGTH = 100;
export const ADDRESS_NAME_MAX_LENGTH = 150;
export const ADDRESS_ZIP_CODE_MAX_LENGTH = 50;
export const ADDRESS_STREET_MAX_LENGTH = 200;

export type DepartmentUserRow = { id: number; name: string; phone: string };

export type MainAppUserApiRow = {
  id: number;
  name?: string;
  phone?: string | number | null;
  phone_no?: string | number | null;
};

/** Shared `react-select` styles for Add / Edit employee modals. */
export const employeeModalReactSelectStyles = {
  control: (provided: Record<string, unknown>, state: { isFocused?: boolean }) => ({
    ...provided,
    minHeight: "48px",
    height: "48px",
    fontSize: "0.875rem",
    borderColor: state.isFocused ? "#86b7fe" : "#dee2e6",
    boxShadow: state.isFocused ? "0 0 0 0.2rem rgba(13, 110, 253, 0.25)" : "none",
    borderRadius: "0.375rem",
    "&:hover": {
      borderColor: state.isFocused ? "#86b7fe" : "#DBE0E5",
    },
  }),
  valueContainer: (provided: Record<string, unknown>) => ({
    ...provided,
    height: "48px",
    padding: "0 8px",
  }),
  input: (provided: Record<string, unknown>) => ({
    ...provided,
    margin: "0px",
    padding: "0px",
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  indicatorsContainer: (provided: Record<string, unknown>) => ({
    ...provided,
    height: "48px",
  }),
  placeholder: (provided: Record<string, unknown>) => ({
    ...provided,
    color: "#6c757d",
    fontSize: "0.875rem",
  }),
  singleValue: (provided: Record<string, unknown>) => ({
    ...provided,
    fontSize: "0.875rem",
    lineHeight: "1.5",
  }),
  multiValue: (provided: Record<string, unknown>) => ({
    ...provided,
    backgroundColor: "#e7f1ff",
    borderRadius: "0.25rem",
  }),
  multiValueLabel: (provided: Record<string, unknown>) => ({
    ...provided,
    color: "#0d6efd",
    fontSize: "0.875rem",
    padding: "2px 6px",
  }),
  multiValueRemove: (provided: Record<string, unknown>) => ({
    ...provided,
    color: "#0d6efd",
    "&:hover": {
      backgroundColor: "#b6d4fe",
      color: "#0d6efd",
    },
  }),
};

export function mainAppUserRowPhone(user: MainAppUserApiRow): string {
  const raw = user.phone ?? user.phone_no;
  if (raw == null) return "";
  return String(raw).trim();
}

/**
 * Users in a department for the employee modal user dropdown (extension required).
 */
export async function fetchDepartmentUserRowsForModal(
  companyUuid: string | null | undefined,
  departmentId: number,
): Promise<DepartmentUserRow[]> {
  const uuid = typeof companyUuid === "string" ? companyUuid.trim() : "";
  if (uuid === "") return [];
  try {
    const usersRaw = await getMainAppUsers(uuid, { department_id: departmentId });
    if (!Array.isArray(usersRaw)) return [];
    return (usersRaw as MainAppUserApiRow[])
      .map((u) => ({
        id: u.id,
        name: u.name ?? "—",
        phone: mainAppUserRowPhone(u),
      }))
      .filter((u) => u.phone !== "");
  } catch {
    return [];
  }
}

export type EmployeeModalAddressRowLike = { name?: string | null; address?: string | null };

export function validateEmployeeModalAddressRows(
  rows: readonly EmployeeModalAddressRowLike[],
): { ok: true } | { ok: false; message: string } {
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    if (!(row.name ?? "").trim()) {
      return { ok: false, message: `Address #${i + 1}: name is required.` };
    }
    if (!(row.address ?? "").trim()) {
      return { ok: false, message: `Address #${i + 1}: street address is required.` };
    }
  }
  return { ok: true };
}

/** Shared required-field rules for create + update employee profile. */
export function validateEmployeeModalCoreRequiredFields(
  form: Partial<UserProfilePayload>,
): { ok: true } | { ok: false; message: string } {
  if (!form.user_id?.toString().trim()) {
    return { ok: false, message: "User ID is required" };
  }
  if (!form.department_id) {
    return { ok: false, message: "Department is required" };
  }
  if (!form.employment_type?.toString().trim()) {
    return { ok: false, message: "Employment type is required" };
  }
  if (!form.contract_type?.toString().trim()) {
    return { ok: false, message: "Contract type is required" };
  }
  if (!form.designation?.toString().trim()) {
    return { ok: false, message: "Designation is required" };
  }
  return { ok: true };
}

/** React list key only; use cryptographically strong randomness (not Math.random). */
let addressUiIdFallbackSeq = 0;

export function createEmployeeModalAddressUiId(): string {
  const { crypto: webCrypto } = globalThis;
  if (webCrypto?.randomUUID) {
    return webCrypto.randomUUID();
  }
  if (webCrypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    webCrypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  addressUiIdFallbackSeq += 1;
  return `addr-${addressUiIdFallbackSeq}`;
}
