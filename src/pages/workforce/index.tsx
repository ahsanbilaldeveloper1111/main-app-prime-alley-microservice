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
import EmployeesDashboard from "./dashboard";

const StaffManagement = () => {


  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Staff Management" />

<EmployeesDashboard />
    </React.Fragment>
  );
};

StaffManagement.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default StaffManagement;
