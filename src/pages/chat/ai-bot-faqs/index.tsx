import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import ComingSoon from "@components/ComingSoon";



const AIBotFAQs = () => {


  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="AIBot FAQs" />

      <PageHeader
        title="AI Bot FAQs"
        showSearch={false}
      />

      <ComingSoon 
        title="Coming Soon"
        description="AI Bot FAQs feature is under development and will be available soon."
        icon="ph-duotone ph-clock"
      />

    </React.Fragment>
  );
};

AIBotFAQs.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default AIBotFAQs;
