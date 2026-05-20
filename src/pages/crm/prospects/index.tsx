import "@assets/scss/datatable-style.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import { CrmProspectsContactsListPage } from "@crm/shared/CrmProspectsContactsListPage";
import { CRM_PROSPECTS_LIST_PAGE_CONFIG } from "@crm/shared/crmProspectsContactsListPageConfig";

/** Prospect list, stats widgets, and filters are implemented in `CrmProspectsContactsListPage`. */
const CrmProspectsManagement = () => (
  <CrmProspectsContactsListPage config={CRM_PROSPECTS_LIST_PAGE_CONFIG} />
);

CrmProspectsManagement.getLayout = (page: ReactElement) => (
  <Layout>{page}</Layout>
);

export default CrmProspectsManagement;
