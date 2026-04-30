import type { DealTemplateData } from "@utils/crm";

/**
 * Helpers extracted from `EditDeal` (`pages/crm/deals/[id]/edit.tsx`) to keep
 * the deal-fetch effect under SonarQube's cognitive complexity ceiling.
 *
 * Each helper is a pure data-shaper – they don't read state nor perform IO,
 * so they're trivial to unit test if/when needed.
 *
 * NOTE: This module lives under `src/utils/crm` (not under `src/pages`) on
 * purpose – Next.js's Pages Router treats every file inside `pages/` as a
 * route and rejects modules without a default React-component export.
 */

const formatDateForInput = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  return dateString.split("T")[0];
};

/** Builds the form state object from a fetched deal record. */
export function buildEditDealFormStateFromDeal(deal: any): Record<string, any> {
  const dealAny = deal;
  return {
    name: deal.name || "",
    ticket_id: deal.ticket_id ? Number(deal.ticket_id) : null,
    stage_id: deal.stage_id ? Number(deal.stage_id) : undefined,
    assigned_to: deal.assigned_to || null,
    expected_close_date: formatDateForInput(deal.expected_close_date),
    company_name: deal.company_name || "",
    industry_ids: extractIndustryIds(dealAny),
    decision_maker_title: deal.decision_maker_title || "",
    decision_maker_name:
      deal.decision_maker_name || dealAny.main_decision_maker?.name || "",
    decision_maker_phone_country_code:
      deal.decision_maker_phone_country_code ||
      dealAny.main_decision_maker?.phone_country_code ||
      "",
    decision_maker_phone:
      deal.decision_maker_phone || dealAny.main_decision_maker?.phone || "",
    decision_maker_email: dealAny.main_decision_maker?.email || "",
    deal_type: deal.deal_type || "",
    contract_length: deal.contract_length || "",
    contract_length_custom: deal.contract_length_custom || "",
    billing_model: deal.billing_model || "",
    payment_terms: deal.payment_terms || "",
    payment_terms_custom: deal.payment_terms_custom || "",
    risk_level: deal.risk_level || "",
    competitors: deal.competitors || "",
    quotation_sent: deal.quotation_sent || false,
    contract_sent: deal.contract_sent || false,
    contract_received: deal.contract_received || false,
    follow_up_date: formatDateForInput(deal.follow_up_date),
    currency: deal.currency || "AED",
    tax_percentage: dealAny.tax_percentage?.toString() || "0",
    standard_discount_percentage:
      dealAny.standard_discount_percentage?.toString() || "0",
    special_discount_percentage:
      dealAny.special_discount_percentage?.toString() || "0",
  };
}

function extractIndustryIds(dealAny: any): number[] {
  const rawIds = dealAny.industry_ids;
  if (Array.isArray(rawIds)) {
    return rawIds.map(Number).filter((n: number) => !Number.isNaN(n));
  }
  const industries = dealAny.industries;
  if (Array.isArray(industries)) {
    return industries
      .map((ind: any) =>
        typeof ind === "object" ? Number(ind.id) : Number(ind),
      )
      .filter((n: number) => !Number.isNaN(n));
  }
  return [];
}

export type EditDealBusinessTypeState = {
  businessTypeId: number | null;
  businessTypeOther: string;
  showOther: boolean;
};

/** Resolves the business-type triplet (id / other / showOther flag) from the
 * fetched deal, replacing a 3-branch if/else-if chain in the consumer. */
export function resolveBusinessTypeStateFromDeal(
  deal: any,
): EditDealBusinessTypeState {
  if (deal?.business_type_id) {
    return {
      businessTypeId: Number(deal.business_type_id),
      businessTypeOther: "",
      showOther: false,
    };
  }
  if (deal?.business_type_other) {
    return {
      businessTypeId: null,
      businessTypeOther: deal.business_type_other,
      showOther: true,
    };
  }
  return { businessTypeId: null, businessTypeOther: "", showOther: false };
}

/** Sorts estimates by `created_at` descending. Tolerant of missing dates. */
export function sortEstimatesByCreatedAtDesc<T extends { created_at?: any }>(
  estimates: ReadonlyArray<T> | null | undefined,
): T[] {
  if (!estimates || estimates.length === 0) return [];
  return [...estimates].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });
}

export type EstimationLineItem = {
  product_id: number;
  product_service: string;
  description: string;
  qty: number;
  unit_price: number;
  original_currency: string;
  original_price: number;
};

/** Maps an estimate's `estimation_chart` array into the UI's line-item shape. */
export function mapEstimationChartItems(
  items: ReadonlyArray<any> | null | undefined,
  fallbackCurrency: string | null | undefined = "AED",
): EstimationLineItem[] {
  if (!items || items.length === 0) return [];
  const currency = fallbackCurrency || "AED";
  return items.map((item: any) => ({
    product_id: item.product_id || 0,
    product_service: item.product_service || "",
    description: item.description || "",
    qty: item.qty || 1,
    unit_price: item.unit_price || 0,
    original_currency: item.original_currency || currency,
    original_price: item.original_price || item.unit_price || 0,
  }));
}

export type EstimateOverridesPatch = {
  tax_percentage?: string;
  standard_discount_percentage?: string;
  special_discount_percentage?: string;
};

/** Builds a partial form-data patch with the tax/discount values that are
 * present on the supplied estimate. Empty fields are omitted (preserving
 * the existing form value). */
export function buildEstimateOverridesPatch(
  estimate: any,
): EstimateOverridesPatch {
  const patch: EstimateOverridesPatch = {};
  if (estimate?.tax_percentage) {
    patch.tax_percentage = estimate.tax_percentage.toString();
  }
  if (estimate?.standard_discount_percentage) {
    patch.standard_discount_percentage =
      estimate.standard_discount_percentage.toString();
  }
  if (estimate?.special_discount_percentage) {
    patch.special_discount_percentage =
      estimate.special_discount_percentage.toString();
  }
  return patch;
}

/** Hydrates a deal template's fields from server-side stored values, falling
 * back to a normalized key lookup for legacy storage. */
export function buildHydratedTemplateFieldValues(
  template: DealTemplateData,
  storedValues: Record<string, any>,
  normalizeKey: (key: string) => string,
): Record<string, any> {
  const hydrated: Record<string, any> = {
    template_name: template.name || "",
  };
  for (const field of template.fields || []) {
    const fieldName = field.field_name;
    const normalizedKey = normalizeKey(fieldName);
    hydrated[fieldName] =
      storedValues[fieldName] ?? storedValues[normalizedKey] ?? "";
  }
  return hydrated;
}
