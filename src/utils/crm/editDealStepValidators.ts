import { toast } from "react-toastify";
import type { DealTemplateData } from "@utils/crm";
import { ValidationType, checkRequiredFields } from "@utils/Helper";

export type EditDealFormDataShape = Record<string, any>;

export function validateEditDealStep0(formData: EditDealFormDataShape): boolean {
  const requiredFields = [
    { field: "name" as const, name: "Deal Name" },
    { field: "stage_id" as const, name: "Stage" },
    { field: "expected_close_date" as const, name: "Expected Close Date" },
    { field: "assigned_to" as const, name: "Assigned to" },
    { field: "currency" as const, name: "Currency" },
  ];
  return checkRequiredFields(formData, requiredFields);
}

export function validateEditDealStep1(formData: EditDealFormDataShape): boolean {
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

export function validateEditDealStep2(
  dealTemplate: DealTemplateData | null,
  templateFieldsData: Record<string, any>,
): boolean {
  if (!dealTemplate) {
    return true;
  }
  if (dealTemplate.fields && dealTemplate.fields.length > 0) {
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
  }
  return true;
}

export function validateEditDealCurrentStep(args: {
  formStep: number;
  formData: EditDealFormDataShape;
  dealTemplate: DealTemplateData | null;
  templateFieldsData: Record<string, any>;
}): boolean {
  const { formStep, formData, dealTemplate, templateFieldsData } = args;
  switch (formStep) {
    case 0:
      return validateEditDealStep0(formData);
    case 1:
      return validateEditDealStep1(formData);
    case 2:
      return validateEditDealStep2(dealTemplate, templateFieldsData);
    case 3:
    case 4:
    default:
      return true;
  }
}
