import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";



const BackendOperations = () => {


  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Backend Operations" />

      <PageHeader
        title="Backend Operations"
        showSearch={false}
      />

    </React.Fragment>
  );
};

BackendOperations.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default BackendOperations;
