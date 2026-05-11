import "@assets/scss/datatable-style.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { useRouter } from "next/router";
import SystemStatus from "@page-modules/help-center/partials/system-status";

const SystemStatusPage = () => {
  const router = useRouter();

  const handleBack = () => {
    router.push('/help-center');
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Help Center" mainLink="/help-center" subTitle="System Status" />
      <SystemStatus onBack={handleBack} />
    </React.Fragment>
  );
};

SystemStatusPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default SystemStatusPage;

