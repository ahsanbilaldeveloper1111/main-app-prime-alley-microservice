import type { CrmDetailPageLayoutConfig } from "@pages/crm/common/crm-detail-layout";

type SupportedCrmDetailType = Extract<
  CrmDetailPageLayoutConfig["recordType"],
  "lead" | "prospect" | "deal" | "order" | "company"
>;

type CrmDetailStaticConfig = Pick<
  CrmDetailPageLayoutConfig,
  | "breadcrumbLabel"
  | "listPath"
  | "loadingMessage"
  | "errorNoRecordMessage"
  | "deleteItemType"
  | "successTitle"
  | "successDescription"
>;

const DETAIL_STATIC_CONFIG: Record<SupportedCrmDetailType, CrmDetailStaticConfig> = {
  lead: {
    breadcrumbLabel: "Leads",
    listPath: "/crm/leads",
    loadingMessage: "Loading lead...",
    errorNoRecordMessage: "No lead selected",
    deleteItemType: "lead",
    successTitle: "Lead Deleted",
    successDescription: "Lead has been deleted successfully",
  },
  prospect: {
    breadcrumbLabel: "Prospects",
    listPath: "/crm/prospects",
    loadingMessage: "Loading prospect...",
    errorNoRecordMessage: "No prospect selected",
    deleteItemType: "prospect",
    successTitle: "Prospect Deleted",
    successDescription: "Prospect has been deleted successfully",
  },
  deal: {
    breadcrumbLabel: "Deals",
    listPath: "/crm/deals",
    loadingMessage: "Loading deal...",
    errorNoRecordMessage: "No deal selected",
    deleteItemType: "deal",
    successTitle: "Deal Deleted",
    successDescription: "Deal has been deleted successfully",
  },
  order: {
    breadcrumbLabel: "Orders",
    listPath: "/crm/orders",
    loadingMessage: "Loading order...",
    errorNoRecordMessage: "No order selected",
    deleteItemType: "order",
    successTitle: "Order Deleted",
    successDescription: "Order has been deleted successfully",
  },
  company: {
    breadcrumbLabel: "Companies",
    listPath: "/crm/companies",
    loadingMessage: "Loading company...",
    errorNoRecordMessage: "No company selected",
    deleteItemType: "company",
    successTitle: "Company Deleted",
    successDescription: "Company has been deleted successfully",
  },
};

export const getCrmDetailStaticConfig = (
  recordType: SupportedCrmDetailType
): CrmDetailStaticConfig => DETAIL_STATIC_CONFIG[recordType];
