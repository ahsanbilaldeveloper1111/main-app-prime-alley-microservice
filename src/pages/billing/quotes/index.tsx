import "@assets/scss/datatable-style.scss";
import "react-phone-number-input/style.css";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import type { ReactElement } from "react";
import {
  CrmQuotesListPage,
  getCrmQuotesListPageLayout,
} from "@crm/billing-quotes/CrmQuotesListPage";

function BillingQuotesPage() {
  return <CrmQuotesListPage variant="billing" />;
}

BillingQuotesPage.getLayout = (page: ReactElement) =>
  getCrmQuotesListPageLayout(page);

export default BillingQuotesPage;
