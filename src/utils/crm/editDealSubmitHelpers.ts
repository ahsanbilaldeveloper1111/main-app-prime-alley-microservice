import type { NextRouter } from "next/router";
import { updateDeal, createEstimate, type DealTemplateData } from "@utils/crm";
import {
  normalizeDealTemplateDataKey,
  isDealTemplatePrimitiveValue,
  getNormalizedDealTemplateValue,
} from "@utils/crm/editDealFetchHelpers";
import {
  validateEditDealStep0,
  validateEditDealStep1,
  validateEditDealStep2,
} from "@utils/crm/editDealStepValidators";
import type { EstimationLineItem } from "@utils/crm/editDealFetchHelpers";

export type SubmitUpdatedDealFromEditPageArgs = Readonly<{
  router: NextRouter;
  id: string | string[] | undefined;
  formStep: number;
  setFormStep: (n: number) => void;
  formData: Record<string, any>;
  dealTemplate: DealTemplateData | null;
  templateFieldsData: Record<string, any>;
  businessTypeId: number | null;
  businessTypeOther: string;
  negotiationBar: number;
  probability: number;
  estimationItems: EstimationLineItem[];
  setLoading: (v: boolean) => void;
  availableTemplates: unknown[];
}>;

/** Advance wizard step when submitting before the final step. */
export function advanceEditDealFormStepOnSubmit(args: {
  formStep: number;
  dealTemplate: DealTemplateData | null;
  availableTemplates: unknown[];
  setFormStep: (n: number) => void;
}): boolean {
  const { formStep, dealTemplate, availableTemplates, setFormStep } = args;
  if (formStep >= 4) return false;
  let nextStep = formStep + 1;
  if (nextStep === 2 && !dealTemplate && availableTemplates.length === 0) {
    nextStep = 3;
  }
  setFormStep(nextStep);
  return true;
}

/** Final-step PATCH + optional estimate create for the deal edit page. */
export async function submitUpdatedDealFromEditPage(
  a: SubmitUpdatedDealFromEditPageArgs,
): Promise<void> {
  const {
    router,
    id,
    formData,
    dealTemplate,
    templateFieldsData,
    businessTypeId,
    businessTypeOther,
    negotiationBar,
    probability,
    estimationItems,
    setLoading,
  } = a;

  if (!id) return;

  if (!validateEditDealStep0(formData) || !validateEditDealStep1(formData)) {
    return;
  }
  if (dealTemplate && !validateEditDealStep2(dealTemplate, templateFieldsData)) {
    return;
  }

  setLoading(true);
  try {
    const payload: Record<string, unknown> = {
      name: formData.name,
      stage_id: formData.stage_id ? String(formData.stage_id) : undefined,
      assigned_to: formData.assigned_to,
      expected_close_date: formData.expected_close_date,
      company_name: formData.company_name,
      industry_ids: formData.industry_ids,
      ...(businessTypeId ? { business_type_id: String(businessTypeId) } : {}),
      ...(businessTypeOther ? { business_type_other: businessTypeOther } : {}),
      decision_maker_title: formData.decision_maker_title,
      decision_maker_name: formData.decision_maker_name,
      decision_maker_phone_country_code:
        formData.decision_maker_phone_country_code,
      decision_maker_phone: formData.decision_maker_phone,
      decision_maker_email: formData.decision_maker_email,
      deal_type: formData.deal_type,
      contract_length: formData.contract_length,
      contract_length_custom: formData.contract_length_custom || "",
      billing_model: formData.billing_model,
      payment_terms: formData.payment_terms,
      payment_terms_custom: formData.payment_terms_custom || "",
      risk_level: formData.risk_level,
      competitors: formData.competitors || "",
      quotation_sent: formData.quotation_sent,
      contract_sent: formData.contract_sent,
      contract_received: formData.contract_received,
      follow_up_date: formData.follow_up_date || "",
      currency: formData.currency,
      negotiation_bar: negotiationBar,
      probability,
    };

    if (dealTemplate?.id) {
      payload.deal_template_id = dealTemplate.id;
      const filteredTemplateData: Record<string, unknown> = {};
      if (dealTemplate.name) {
        filteredTemplateData.template_name = dealTemplate.name;
      }
      Object.entries(templateFieldsData).forEach(([key, value]) => {
        if (key === "template_name") return;
        if (!isDealTemplatePrimitiveValue(value)) return;
        const normalizedValue = getNormalizedDealTemplateValue(value);
        if (!normalizedValue) return;
        payload[`deal_template_field_values[${key}]`] = normalizedValue;
        filteredTemplateData[normalizeDealTemplateDataKey(key)] = normalizedValue;
      });
      if (Object.keys(filteredTemplateData).length > 0) {
        payload.template_data = filteredTemplateData;
      }
    }

    if (formData.ticket_id) {
      payload.ticket_id = formData.ticket_id;
    }

    await updateDeal(Number(id), payload as any);

    if (estimationItems.length > 0) {
      const estimatePayload = {
        deal_id: Number(id),
        estimation_chart: estimationItems.map((item) => ({
          product_id: item.product_id,
          product_service: item.product_service,
          description: item.description || "",
          qty: item.qty,
          unit_price: item.unit_price,
          original_currency: item.original_currency || formData.currency,
          original_price: item.original_price || item.unit_price,
        })),
        standard_discount_percentage: Number.parseFloat(
          formData.standard_discount_percentage || "0",
        ),
        special_discount_percentage: Number.parseFloat(
          formData.special_discount_percentage || "0",
        ),
        tax_percentage: Number.parseFloat(formData.tax_percentage || "0"),
        currency: formData.currency,
      };

      await createEstimate(estimatePayload, false);
    }

    router.push("/crm/deals");
  } catch (error: unknown) {
    console.error("Failed to update deal:", error);
  } finally {
    setLoading(false);
  }
}
