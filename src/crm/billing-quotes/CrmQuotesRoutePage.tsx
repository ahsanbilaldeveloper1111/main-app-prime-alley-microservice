import "@assets/scss/datatable-style.scss";
import "react-phone-number-input/style.css";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import type { ReactElement } from "react";
import {
  CrmQuotesListPage,
  getCrmQuotesListPageLayout,
} from "@crm/billing-quotes/CrmQuotesListPage";

function createQuotesListRoutePage(variant: "billing" | "crm") {
  function QuotesRoutePage() {
    return <CrmQuotesListPage variant={variant} />;
  }
  QuotesRoutePage.getLayout = (page: ReactElement) =>
    getCrmQuotesListPageLayout(page);
  return QuotesRoutePage;
}

export const BillingQuotesRoutePage = createQuotesListRoutePage("billing");
export const CrmQuotesRoutePage = createQuotesListRoutePage("crm");
