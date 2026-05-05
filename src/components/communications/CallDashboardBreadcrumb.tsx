import React from 'react';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { useAppSelector } from '../../toolkit/hooks';

const CallDashboardBreadcrumb: React.FC = () => {
  const showPageLoader = useAppSelector((s) => s.callDashboard.showPageLoader);

  return (
    <BreadcrumbItem
      mainTitle="Call Logs"
      mainLink="/call-logs/dashboard"
      subTitle="Call Dashboard"
      showPageLoader={showPageLoader}
    />
  );
};

export default CallDashboardBreadcrumb;
