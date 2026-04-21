import "@assets/scss/datatable-style.scss";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import type { ReactElement } from "react";
import Layout from "@layout/index";
import { useCrmLeadsPageModel } from "@crm/leads/useCrmLeadsPageModel";
import { CrmLeadsPageView } from "@crm/leads/CrmLeadsPageView";

const CrmLeads = () => {
  const page = useCrmLeadsPageModel();
  if (!page.session?.user?.permissions?.includes("list-crm-leads")) {
    return null;
  }
  return <CrmLeadsPageView page={page} />;
};

CrmLeads.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmLeads;
