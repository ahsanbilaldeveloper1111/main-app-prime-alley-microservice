import moment from "moment";
import { parsePhoneNumber as parsePhoneNumberInput } from "react-phone-number-input";
import type { CrmDataItem } from "@utils/crm";
import { createNonPrngId } from "@utils/id";

const RESERVED_DATA_KEYS = new Set([
  "email",
  "assigned_to",
  "uploaded_by",
  "disposition",
  "tags",
  "note",
  "contact_owner",
  "lifecycle_stage",
  "legal_basis",
]);

export type CrmItemForContactForm = CrmDataItem & {
  data?: Record<string, unknown>;
  source_file?: string;
  tags?: { id?: number; name?: string }[];
};

export type CrmContactFormTag = { value: string; label: string; id: number };

export type CrmContactFormCustomField = {
  id: string;
  field_name: string;
  field_value: string;
};

type ContactFormBase = {
  firstName: string;
  lastName: string;
  email: string;
  phone_country_code: string;
  phoneNumber: string;
  campaign_id: number | null;
  contact_owner: string | null;
  lifecycle_stage: string;
  disposition: string;
  legal_basis: string[];
  company_domain: string;
  scheduled_call_at: string;
  tags: CrmContactFormTag[];
  note: string;
  custom_fields: CrmContactFormCustomField[];
};

function toDatetimeLocal(v: string | null | undefined): string {
  if (!v) return "";
  const m = moment(v);
  return m.isValid() ? m.format("YYYY-MM-DDTHH:mm") : "";
}

function unknownToFormString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "bigint") return String(value);
  return "";
}

function resolveSourceFieldValue(
  item: CrmItemForContactForm,
  d: Record<string, unknown>,
): string {
  const anyItem = item as unknown as Record<string, unknown>;
  const raw =
    anyItem.source_file ??
    d.source_file ??
    d.source ??
    anyItem.source;
  return unknownToFormString(raw);
}

function mapTagsArray(
  item: CrmItemForContactForm,
  d: Record<string, unknown>,
): CrmContactFormTag[] {
  const rawTags =
    (item as { tags?: unknown }).tags ??
    (item as { data?: { tags?: unknown } }).data?.tags ??
    d.tags ??
    [];
  if (!Array.isArray(rawTags)) return [];
  return rawTags.map((t: unknown) => {
    if (typeof t === "string") {
      return { value: t, label: t, id: 0 };
    }
    const tag = t as {
      name?: string;
      value?: string;
      label?: string;
      id?: number;
      tag_id?: number;
      pivot?: { tag_id?: number };
    };
    return {
      value: tag.name ?? tag.value ?? String(tag.id ?? ""),
      label: tag.name ?? tag.label ?? tag.value ?? String(tag.id ?? ""),
      id: Number(tag.id ?? tag.tag_id ?? tag.pivot?.tag_id ?? 0),
    };
  });
}

function buildCustomFieldsFromData(d: Record<string, unknown>): CrmContactFormCustomField[] {
  return Object.entries(d)
    .filter(([k]) => !RESERVED_DATA_KEYS.has(k))
    .map(([field_name, field_value]) => ({
      id: createNonPrngId(field_name),
      field_name,
      field_value: Array.isArray(field_value)
        ? field_value.map((e) => unknownToFormString(e)).join(", ")
        : unknownToFormString(field_value).trim(),
    }))
    .filter((f) => f.field_name || f.field_value);
}

function splitPhoneCountryAndNational(item: CrmItemForContactForm): {
  phone_country_code: string;
  phoneNumber: string;
} {
  let phoneCountryCode = "";
  let phoneNumber = item.phone ?? "";
  if (typeof item.phone === "string" && item.phone.trim()) {
    try {
      const normalized = item.phone.replaceAll(/\s/g, "");
      const parsed = parsePhoneNumberInput(normalized);
      if (parsed) {
        phoneCountryCode = `+${parsed.countryCallingCode}`;
        phoneNumber = parsed.nationalNumber;
      }
    } catch {
      // keep phoneNumber as-is, phoneCountryCode ""
    }
  }
  return { phone_country_code: phoneCountryCode, phoneNumber };
}

export type MappedCrmContactFormState =
  | (ContactFormBase & { source: string })
  | (ContactFormBase & { source_file: string });

export type CrmListContactFormState =
  | (ContactFormBase & { source: string })
  | (ContactFormBase & { source_file: string });

/** Options when seeding an empty create-contact form (e.g. default Owner = logged-in user). */
export type CreateEmptyCrmListContactFormOptions = {
  defaultContactOwner?: string | null;
};

export type CrmExtensionLikeForOwnerDefault = {
  extension?: string | number | null;
  id?: string | number | null;
};

/**
 * Returns the extension `value` string used by Prospect Owner select if the session user
 * matches an entry in `extensions` (same rules as ProspectEditSidebar option values).
 */
export function resolveDefaultContactOwnerExtension(
  sessionUser:
    | {
        phone?: string | number | null;
        extension?: string | number | null;
      }
    | null
    | undefined,
  extensions: readonly CrmExtensionLikeForOwnerDefault[],
): string | null {
  if (!sessionUser || extensions.length === 0) return null;
  const candidates = new Set<string>();
  const phone =
    sessionUser.phone != null ? String(sessionUser.phone).trim() : "";
  const ext =
    sessionUser.extension != null ? String(sessionUser.extension).trim() : "";
  if (phone) candidates.add(phone);
  if (ext) candidates.add(ext);
  for (const e of extensions) {
    const v = String(e.extension ?? e.id ?? "");
    if (v && candidates.has(v)) return v;
  }
  return null;
}

/** Initial empty state for create-contact sidebar on CRM list pages (quotes, contacts, prospects). */
export function createEmptyCrmListContactFormState(
  sourceField: "source",
  options?: CreateEmptyCrmListContactFormOptions,
): ContactFormBase & { source: string };
export function createEmptyCrmListContactFormState(
  sourceField: "source_file",
  options?: CreateEmptyCrmListContactFormOptions,
): ContactFormBase & { source_file: string };
export function createEmptyCrmListContactFormState(
  sourceField: "source" | "source_file",
  options?: CreateEmptyCrmListContactFormOptions,
): CrmListContactFormState {
  const base: ContactFormBase = {
    firstName: "",
    lastName: "",
    email: "",
    phone_country_code: "",
    phoneNumber: "",
    campaign_id: null,
    contact_owner: options?.defaultContactOwner ?? null,
    lifecycle_stage: "Lead",
    disposition: "",
    legal_basis: [],
    company_domain: "",
    scheduled_call_at: "",
    tags: [],
    note: "",
    custom_fields: [],
  };
  if (sourceField === "source") {
    return { ...base, source: "" };
  }
  return { ...base, source_file: "" };
}

/**
 * Maps a CRM record from getCrmDataById into create/edit contact sidebar form state.
 * `sourceField` selects whether the display source is stored under `source` or `source_file` in form state.
 */
export function mapCrmDataItemToContactFormState(
  item: CrmItemForContactForm,
  sourceField: "source" | "source_file",
): MappedCrmContactFormState {
  const d = (item.data || {}) as Record<string, unknown>;
  const nameParts = (item.name || "").trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";
  const { phone_country_code, phoneNumber } = splitPhoneCountryAndNational(item);
  const tagsArray = mapTagsArray(item, d);
  const customFieldsArray = buildCustomFieldsFromData(d);
  const anyItem = item as unknown as Record<string, unknown>;
  const emailRaw = d.email ?? anyItem.email ?? "";
  const lifecycleRaw = d.lifecycle_stage ?? "";
  const dispositionRaw = d.disposition ?? anyItem.disposition ?? "";
  const legalRaw = d.legal_basis;
  const companyDomainRaw =
    anyItem.company_domain ?? d.company_domain ?? "";
  const scheduledRaw = item.scheduled_call_at ?? d.scheduled_call_at;
  const noteRaw = item.note ?? d.note ?? "";
  const sourceVal = resolveSourceFieldValue(item, d);

  const base: ContactFormBase = {
    firstName,
    lastName,
    email: unknownToFormString(emailRaw),
    phone_country_code,
    phoneNumber,
    campaign_id: (item.campaign_id ?? d.campaign_id ?? null) as number | null,
    contact_owner: (anyItem.user_extension ??
      d.contact_owner ??
      anyItem.contact_owner ??
      null) as string | null,
    lifecycle_stage: unknownToFormString(lifecycleRaw),
    disposition: unknownToFormString(dispositionRaw),
    legal_basis: Array.isArray(legalRaw) ? (legalRaw as string[]) : [],
    company_domain: unknownToFormString(companyDomainRaw),
    scheduled_call_at: toDatetimeLocal(
      scheduledRaw as string | null | undefined,
    ),
    tags: tagsArray,
    note: unknownToFormString(noteRaw),
    custom_fields: customFieldsArray,
  };

  if (sourceField === "source") {
    return { ...base, source: sourceVal };
  }
  return { ...base, source_file: sourceVal };
}
