import '@assets/scss/datatable-style.scss';
import { type ReactElement, useEffect } from 'react';
import Layout from '@layout/index';
import '@assets/scss/common.scss';

import '@assets/scss/report-style.scss';
import '@assets/scss/tabs.scss';
import 'nprogress/nprogress.css';

import {
  CallDashboardBarChartsRow,
  CallDashboardBreadcrumb,
  CallDashboardChartModalsRow,
  CallDashboardPageHeader,
  CallDashboardStatsTablesRow,
  CallStatsSummaryCards,
} from '@components/communications';
import { useAppDispatch } from '@toolkit/hooks';
import { loadCallDashboardInitialThunk } from '@toolkit/callDashboard/thunks';

const CallDashboard = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    void dispatch(loadCallDashboardInitialThunk());
  }, [dispatch]);

  return (
    <>
      <CallDashboardBreadcrumb />

      <CallDashboardPageHeader />

      <CallStatsSummaryCards />

      <CallDashboardBarChartsRow />

      <CallDashboardStatsTablesRow />

      <CallDashboardChartModalsRow />
    </>
  );
};

CallDashboard.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CallDashboard;
