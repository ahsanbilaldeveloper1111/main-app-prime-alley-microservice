import "@assets/scss/datatable-style.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import { CrmProspectsContactsListPage } from "@crm/shared/CrmProspectsContactsListPage";
import { CRM_CONTACTS_LIST_PAGE_CONFIG } from "@crm/shared/crmProspectsContactsListPageConfig";

const CrmContactsManagement = () => (
  <CrmProspectsContactsListPage config={CRM_CONTACTS_LIST_PAGE_CONFIG} />
);

CrmContactsManagement.getLayout = (page: ReactElement) => (
  <Layout>{page}</Layout>
);

export default CrmContactsManagement;
