import "@assets/scss/datatable-style.scss";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import { FaqProfilesPageView } from "@page-modules/chat/faq-profiles/components/FaqProfilesPageView";
import { useFaqProfilesPage } from "@page-modules/chat/faq-profiles/useFaqProfilesPage";

const FaqProfiles = () => {
  const ctx = useFaqProfilesPage();
  return <FaqProfilesPageView ctx={ctx} />;
};

FaqProfiles.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default FaqProfiles;
