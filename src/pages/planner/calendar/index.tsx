"use client";

import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useCallback } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import SchedulePage from "@components/SchedulePage";
import { getTasksCalendar } from "@utils/work-planner";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

const Calendar = () => {
  const fetchCalendarData = useCallback(
    (start: Date, end: Date) =>
      getTasksCalendar({
        start_date: start.toISOString().slice(0, 10),
        end_date: end.toISOString().slice(0, 10),
      }),
    [],
  );

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Calendar" />
      <SchedulePage fetchCalendarData={fetchCalendarData} />
    </React.Fragment>
  );
};

Calendar.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default Calendar;
