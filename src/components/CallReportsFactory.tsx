import React from 'react';
import CallReportsPage, { ReportType, GroupingType } from './CallReportsPage';
import { getCallReportConfig } from '../config/callReportsConfig';

interface CallReportsFactoryProps {
  reportType: ReportType;
  groupingType: GroupingType;
}

const CallReportsFactory: React.FC<CallReportsFactoryProps> = ({ reportType, groupingType }) => {
  const config = getCallReportConfig(reportType, groupingType);
  
  if (!config) {
    return <div>Invalid report configuration</div>;
  }

  return (
    <CallReportsPage
      reportType={config.reportType}
      groupingType={config.groupingType}
      listEndpoint={config.listEndpoint}
      chartEndpoint={config.chartEndpoint}
      reportTypeParam={config.reportTypeParam}
      chartReportTypeParam={config.chartReportTypeParam}
      breadcrumbTitle={config.breadcrumbTitle}
    />
  );
};

export default CallReportsFactory; 