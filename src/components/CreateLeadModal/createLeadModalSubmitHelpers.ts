import { createLeadFollowUp } from "@utils/crm";

/**
 * Helpers extracted from `CreateLeadModal/index.tsx` so the `handleSubmit`
 * function stays under SonarQube's cognitive complexity ceiling.
 *
 * These helpers keep the payload building and follow-up creation pure and
 * data-driven instead of inlining ~25 conditional spreads + nested branches
 * inside the submit handler.
 */

export type CreateLeadContactPerson = {
  title: string;
  name: string;
  phone_country_code: string;
  phone: string;
  email: string;
};

export type CreateLeadFormState = {
  name: string;
  user_extension: string | null;
  type: "lead" | "opportunity";
  description: string;
  source: string;
  company_name: string;
  company_domain: string;
  company_contact: string;
  company_description: string;
  industry: string;
  business_type: string;
  company_country: string;
  company_province: string;
  company_city: string;
  company_location_other: string;
  company_size: string;
  contact_person_title: string;
  contact_person_name: string;
  contact_phone_country_code: string;
  contact_phone: string;
  stage_id: number | undefined;
  campaign_id: number | undefined;
  crm_data_id: number | undefined;
  lead_potential: string;
  follow_up_date: string;
  other_information: Record<string, unknown>;
  campaign_field_values: Record<string, unknown>;
  contact_persons: CreateLeadContactPerson[];
};

/** Returns the initial empty form state used by both the modal mount and the
 * "Create & add another" reset path. Single source of truth for defaults. */
export function createLeadInitialFormState(
  type: "lead" | "opportunity",
): CreateLeadFormState {
  return {
    name: "",
    user_extension: null,
    type,
    description: "",
    source: "",
    company_name: "",
    company_domain: "",
    company_contact: "",
    company_description: "",
    industry: "",
    business_type: "",
    company_country: "",
    company_province: "",
    company_city: "",
    company_location_other: "",
    company_size: "",
    contact_person_title: "",
    contact_person_name: "",
    contact_phone_country_code: "",
    contact_phone: "",
    stage_id: undefined,
    campaign_id: undefined,
    crm_data_id: undefined,
    lead_potential: "",
    follow_up_date: "",
    other_information: {},
    campaign_field_values: {},
    contact_persons: [
      { title: "Mr.", name: "", phone_country_code: "", phone: "", email: "" },
    ],
  };
}

type BuildLeadPayloadArgs = {
  formData: CreateLeadFormState;
  businessTypeId: number | null;
  businessTypeOther: string;
  templateFieldsData: Record<string, unknown>;
  estimationItems: ReadonlyArray<unknown>;
};

/** Optional-string fields whose value is included on the payload only when
 * the form has a non-empty value. Driven by data instead of long `&&` chains
 * to keep cognitive complexity flat. */
const OPTIONAL_LEAD_PAYLOAD_STRING_FIELDS: ReadonlyArray<
  keyof CreateLeadFormState
> = [
  "source",
  "description",
  "company_name",
  "company_domain",
  "industry",
  "company_country",
  "company_province",
  "company_city",
  "company_location_other",
  "company_size",
  "contact_person_title",
  "contact_person_name",
  "contact_phone_country_code",
  "contact_phone",
  "lead_potential",
  "follow_up_date",
];

function appendIdField(
  payload: Record<string, unknown>,
  key: string,
  value: number | string | undefined,
): void {
  if (value !== undefined && value !== null && value !== "") {
    payload[key] = String(value);
  }
}

function appendStringField(
  payload: Record<string, unknown>,
  key: string,
  value: string | undefined,
): void {
  if (value && String(value).trim() !== "") {
    payload[key] = value;
  }
}

function appendObjectField(
  payload: Record<string, unknown>,
  key: string,
  value: Record<string, unknown> | undefined,
): void {
  if (value && Object.keys(value).length > 0) {
    payload[key] = value;
  }
}

/** Builds the payload object expected by `createLead` / `updateLead` from
 * the form state. Conditional inclusion is data-driven via small helpers
 * to keep the surface flat and easy to read. */
export function buildCreateLeadPayload({
  formData,
  businessTypeId,
  businessTypeOther,
  templateFieldsData,
  estimationItems,
}: BuildLeadPayloadArgs): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: formData.name,
    user_extension:
      formData.user_extension == null ? "" : String(formData.user_extension),
    stage_id: String(formData.stage_id),
  };

  appendIdField(payload, "campaign_id", formData.campaign_id);
  appendIdField(payload, "crm_data_id", formData.crm_data_id);
  appendIdField(payload, "business_type_id", businessTypeId ?? undefined);
  appendStringField(payload, "business_type_other", businessTypeOther);

  for (const field of OPTIONAL_LEAD_PAYLOAD_STRING_FIELDS) {
    appendStringField(payload, field, formData[field] as string | undefined);
  }

  appendObjectField(payload, "other_information", formData.other_information);
  appendObjectField(
    payload,
    "campaign_field_values",
    formData.campaign_field_values,
  );
  appendObjectField(payload, "template_fields_data", templateFieldsData);

  if (estimationItems.length > 0) {
    payload.estimation_items = estimationItems;
  }
  if (formData.contact_persons.length > 0) {
    payload.contact_persons = formData.contact_persons;
  }

  return payload;
}

type MaybeCreateFollowUpArgs = {
  createdLead: unknown;
  followUpDate: string;
  ownerExtensionFromForm: string;
  sessionExtension: string;
};

/** Best-effort creation of a follow-up after the lead was created.
 * Failures are swallowed: `createLeadFollowUp` already surfaces its own
 * toast and we don't want to block the lead-creation success path. */
export async function maybeCreateLeadFollowUp({
  createdLead,
  followUpDate,
  ownerExtensionFromForm,
  sessionExtension,
}: MaybeCreateFollowUpArgs): Promise<void> {
  const trimmedDate = followUpDate.trim();
  if (!trimmedDate) return;

  const createdId = Number((createdLead as { id?: unknown })?.id);
  if (!Number.isFinite(createdId) || createdId <= 0) return;

  const ownerExtension = ownerExtensionFromForm || sessionExtension;
  if (ownerExtension === "") return;

  try {
    await createLeadFollowUp(createdId, {
      follow_up_date: trimmedDate,
      follow_up_status: "Pending",
      communication_channel: "Phone Call",
      notes: "",
      user_extension: ownerExtension,
    });
  } catch (error) {
    // createLeadFollowUp surfaces its own toast; do not block lead creation.
    console.error("createLeadFollowUp failed:", error);
  }
}
