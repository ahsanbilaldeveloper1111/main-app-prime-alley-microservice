import "@assets/scss/datatable-style.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import SchedulePage from "@components/SchedulePage";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

const Calendar = () => {
  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Calendar" />
      <SchedulePage />
    </React.Fragment>
  );
};

Calendar.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default Calendar;
