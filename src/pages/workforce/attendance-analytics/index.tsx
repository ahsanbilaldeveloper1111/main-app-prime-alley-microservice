import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import "@assets/css/GenericTable.css";
import "@assets/scss/datatable-style.scss";
import "@page-modules/workforce/shared/workforcePages.scss";
import "@components/main-settings/settingsEmbeddedFilters.scss";
import "@page-modules/workforce/attendance-reports/attendanceAnalyticsPage.scss";
import "@page-modules/workforce/attendance-reports/attendanceCorrectionModal.scss";

import React, { type ReactElement } from "react";
import Layout from "@layout/index";
import { AttendanceAnalyticsTab } from "@page-modules/workforce/attendance-reports/AttendanceAnalyticsTab";
import { EMPLOYEES_LIST_SCOPED_LAYOUT } from "@page-modules/workforce/shared/workforceListPageConfig";
import { WorkforceListPageShell } from "@page-modules/workforce/shared/WorkforceListPageShell";

const AttendanceAnalyticsPage = () => (
  <WorkforceListPageShell
    breadcrumbSubTitle="Attendance Analytics"
    tableWrapperClass="workforce-attendance-analytics-wrapper"
    scopedLayout={EMPLOYEES_LIST_SCOPED_LAYOUT}
  >
    <AttendanceAnalyticsTab />
  </WorkforceListPageShell>
);

AttendanceAnalyticsPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default AttendanceAnalyticsPage;
