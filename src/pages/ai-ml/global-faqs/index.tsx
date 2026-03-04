import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";



const GlobalFAQs = () => {


  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Global FAQs" />

      <PageHeader
        title="Global FAQs"
        showSearch={false}
      />

    </React.Fragment>
  );
};

GlobalFAQs.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default GlobalFAQs;
