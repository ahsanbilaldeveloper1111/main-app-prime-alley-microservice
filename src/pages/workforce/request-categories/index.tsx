import "@assets/scss/datatable-style.scss";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import "@page-modules/workforce/request-categories/requestCategoriesPage.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import { RequestCategoriesPanel } from "@page-modules/workforce/request-categories/RequestCategoriesPanel";

const RequestCategories = () => {
  return <RequestCategoriesPanel />;
};

RequestCategories.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default RequestCategories;
