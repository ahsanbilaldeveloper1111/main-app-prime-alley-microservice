"use client";

import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useCallback } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import SchedulePage from "@components/SchedulePage";
import { getTasksCalendar } from "@utils/work-planner";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

/** Calendar week bounds use local midnight; ISO date strings must match that (not UTC via toISOString). */
function toLocalDateParam(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const Calendar = () => {
  const fetchCalendarData = useCallback(
    (start: Date, end: Date, timeZone: string) =>
      getTasksCalendar({
        start: toLocalDateParam(start),
        end: toLocalDateParam(end),
        timezone: timeZone,
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
