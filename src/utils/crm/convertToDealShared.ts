import { toast } from "react-toastify";
import {
  getCampaignById,
  getIndustries,
  getRelevantDealTemplate,
  DealTemplateData,
  IndustryData,
} from "@utils/crm";
import { ValidationType, checkRequiredFields } from "@utils/Helper";

export interface ConvertDealFormFromLead {
  name: string;
  ticket_id: number | null;
  lead_id: number | null;
  stage_id: number | undefined;
  assigned_to: string | null;
  expected_close_date: string;
  company_name: string;
  company_domain: string;
  industry_ids: number[];
  decision_maker_title: string;
  decision_maker_name: string;
  decision_maker_phone_country_code: string;
  decision_maker_phone: string;
  decision_maker_email: string;
  deal_type: string;
  contract_length: string;
  contract_length_custom: string;
  billing_model: string;
  payment_terms: string;
  payment_terms_custom: string;
  risk_level: string;
  competitors: string;
  quotation_sent: boolean;
  contract_sent: boolean;
  contract_received: boolean;
  follow_up_date: string;
  currency: string;
  tax_percentage: string;
  standard_discount_percentage: string;
  special_discount_percentage: string;
}

function parseContactPersonsArray(leadData: Record<string, unknown>): unknown[] {
  const raw = leadData.contact_persons;
  if (!raw) return [];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Failed to parse contact_persons:", e);
      return [];
    }
  }
  if (Array.isArray(raw)) return raw;
  return [];
}

function asContactRecord(p: unknown): Record<string, unknown> {
  return p && typeof p === "object" ? (p as Record<string, unknown>) : {};
}

function getPrimaryContact(
  contactPersonsArray: Record<string, unknown>[],
): Record<string, unknown> {
  const withEmail = contactPersonsArray.find((cp) => cp.email);
  if (withEmail) return withEmail;
  const withPhone = contactPersonsArray.find((cp) => cp.phone);
  if (withPhone) return withPhone;
  return contactPersonsArray[0] ?? {};
}

export function buildConvertDealFormStateFromLead(
  leadData: Record<string, unknown>,
  leadId: number,
): ConvertDealFormFromLead {
  const contactPersonsArray = parseContactPersonsArray(leadData).map(asContactRecord);
  const primaryContact = getPrimaryContact(contactPersonsArray);
  const contactPersonName =
    (primaryContact.name as string | undefined) ||
    (leadData.contact_person_name as string | undefined) ||
    "";

  const defaultCloseDate = new Date();
  defaultCloseDate.setDate(defaultCloseDate.getDate() + 7);
  const formattedCloseDate = defaultCloseDate.toISOString().split("T")[0];

  return {
    name: (leadData.name as string | undefined) || "",
    ticket_id: leadId,
    lead_id: leadId,
    stage_id: undefined,
    assigned_to: leadData.user_extension ? String(leadData.user_extension) : null,
    expected_close_date: formattedCloseDate,
    company_name: (leadData.company_name as string | undefined) || "",
    company_domain: (leadData.company_domain as string | undefined) ?? "",
    industry_ids: [],
    decision_maker_title:
      (primaryContact.title as string | undefined) ||
      (leadData.contact_person_title as string | undefined) ||
      "",
    decision_maker_name: contactPersonName,
    decision_maker_phone_country_code:
      (primaryContact.phone_country_code as string | undefined) ||
      (leadData.contact_phone_country_code as string | undefined) ||
      "",
    decision_maker_phone:
      (primaryContact.phone as string | undefined) ||
      (leadData.contact_phone as string | undefined) ||
      "",
    decision_maker_email: (primaryContact.email as string | undefined) || "",
    deal_type: "",
    contract_length: "",
    contract_length_custom: "",
    billing_model: "",
    payment_terms: "",
    payment_terms_custom: "",
    risk_level: "",
    competitors: "",
    quotation_sent: false,
    contract_sent: false,
    contract_received: false,
    follow_up_date: "",
    currency: "AED",
    tax_percentage: "0",
    standard_discount_percentage: "0",
    special_discount_percentage: "0",
  };
}

export function getBusinessTypeUiStateFromLead(leadData: Record<string, unknown>): {
  businessTypeId: number | null;
  businessTypeOther: string;
  showOtherBusinessType: boolean;
} {
  if (leadData.business_type_id) {
    return {
      businessTypeId: Number(leadData.business_type_id),
      businessTypeOther: "",
      showOtherBusinessType: false,
    };
  }
  if (leadData.business_type_other) {
    return {
      businessTypeId: null,
      businessTypeOther: String(leadData.business_type_other),
      showOtherBusinessType: true,
    };
  }
  return { businessTypeId: null, businessTypeOther: "", showOtherBusinessType: false };
}

export async function loadDealTemplateForLead(leadId: number): Promise<{
  template: DealTemplateData | null;
  templateFieldsData: Record<string, string>;
}> {
  const template = await getRelevantDealTemplate({ lead_id: leadId });
  const templateFieldsData: Record<string, string> = {};
  if (template?.fields) {
    for (const field of template.fields) {
      templateFieldsData[field.field_name] = "";
    }
  }
  return { template, templateFieldsData };
}

export type CampaignIndustryContext = {
  campaignData: unknown;
  campaignIndustryIds: number[];
  filteredIndustries: IndustryData[];
};

export async function loadCampaignIndustryContext(
  campaignId: number,
): Promise<CampaignIndustryContext> {
  const campaignData = await getCampaignById(campaignId);
  const industriesData = (campaignData as { industries?: unknown }).industries;
  const industryIds = (campaignData as { industry_ids?: unknown }).industry_ids;

  let campaignIndustryIds: number[] = [];
  if (industriesData && Array.isArray(industriesData)) {
    campaignIndustryIds = industriesData.map((ind: unknown) =>
      typeof ind === "object" && ind !== null && "id" in ind
        ? (ind as { id: number }).id
        : (ind as number),
    );
  } else if (industryIds && Array.isArray(industryIds)) {
    campaignIndustryIds = industryIds as number[];
  }

  if (campaignIndustryIds.length === 0) {
    return { campaignData, campaignIndustryIds: [], filteredIndustries: [] };
  }

  const allIndustriesResponse = await getIndustries({ per_page: 1000 });
  const allInds = allIndustriesResponse.data || [];
  const filteredIndustries = allInds.filter((ind: IndustryData) =>
    campaignIndustryIds.includes(ind.id),
  );

  return { campaignData, campaignIndustryIds, filteredIndustries };
}

type FormSliceForStep0 = {
  name: string;
  stage_id?: number;
  expected_close_date: string;
  assigned_to: string | null;
  currency: string;
};

export function validateConvertDealStep0(
  formData: FormSliceForStep0,
  ownerFieldLabel: string,
): boolean {
  const requiredFields = [
    { field: "name" as const, name: "Deal Name" },
    { field: "stage_id" as const, name: "Stage" },
    { field: "expected_close_date" as const, name: "Expected Close Date" },
    { field: "assigned_to" as const, name: ownerFieldLabel },
    { field: "currency" as const, name: "Currency" },
  ];
  return checkRequiredFields(formData, requiredFields);
}

type FormSliceForStep1 = {
  company_name: string;
  decision_maker_name: string;
  decision_maker_email: string;
  decision_maker_phone: string;
};

export function validateConvertDealStep1(formData: FormSliceForStep1): boolean {
  const requiredFields = [
    { field: "company_name" as const, name: "Company Name" },
    { field: "decision_maker_name" as const, name: "Decision Maker Name" },
    {
      field: "decision_maker_email" as const,
      name: "Decision Maker Email",
      type: ValidationType.EMAIL,
    },
    { field: "decision_maker_phone" as const, name: "Decision Maker Phone" },
  ];
  return checkRequiredFields(formData, requiredFields);
}

export function validateConvertDealStep2(
  dealTemplate: DealTemplateData | null,
  templateFieldsData: Record<string, unknown>,
): boolean {
  if (!dealTemplate?.fields?.length) return true;

  for (const field of dealTemplate.fields) {
    if (field.is_required) {
      const fieldValue = templateFieldsData[field.field_name];
      if (
        !fieldValue ||
        (typeof fieldValue === "string" && fieldValue.trim() === "")
      ) {
        toast.error(`${field.field_name} is required`);
        return false;
      }
    }
  }
  return true;
}

export function validateConvertDealStep4(
  estimationItems: unknown[] | null | undefined,
): boolean {
  if (!estimationItems || estimationItems.length === 0) {
    toast.error("Please add at least one product to the estimation chart");
    return false;
  }
  return true;
}
