import "@assets/scss/datatable-style.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PlannerDashboard from "./dashboard";

const PlannerPage = () => {
  return <PlannerDashboard />;
};

PlannerPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default PlannerPage;
