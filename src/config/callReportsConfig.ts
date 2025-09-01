// Define types locally since CallReportsPage component doesn't exist
export type ReportType = 'stats' | 'trend' | 'incoming';
export type GroupingType = 'extension' | 'department' | 'country';

export interface CallReportConfig {
  reportType: ReportType;
  groupingType: GroupingType;
  listEndpoint: string;
  chartEndpoint: string;
  reportTypeParam: string;
  chartReportTypeParam: string;
  breadcrumbTitle: string;
  componentName: string;
}

export const callReportsConfig: Record<string, CallReportConfig> = {
  // Stats Reports
  'stats-extension': {
    reportType: 'stats',
    groupingType: 'extension',
    listEndpoint: 'call-logs/statsByExtension',
    chartEndpoint: 'call-logs/stats/extension/chart',
    reportTypeParam: 'statsExtension',
    chartReportTypeParam: 'chartExtension',
    breadcrumbTitle: 'Call Stats By Extension',
    componentName: 'CallStatsExtension'
  },
  'stats-department': {
    reportType: 'stats',
    groupingType: 'department',
    listEndpoint: 'call-logs/statsByDepartment',
    chartEndpoint: 'call-logs/stats/department/chart',
    reportTypeParam: 'statsDepartment',
    chartReportTypeParam: 'chartDepartment',
    breadcrumbTitle: 'Call Stats By Department',
    componentName: 'CallStatsDepartment'
  },
  'stats-country': {
    reportType: 'stats',
    groupingType: 'country',
    listEndpoint: 'call-logs/statsByCountry',
    chartEndpoint: 'call-logs/stats/country/chart',
    reportTypeParam: 'statsCountry',
    chartReportTypeParam: 'chartCountry',
    breadcrumbTitle: 'Call Stats By Country',
    componentName: 'CallStatsCountry'
  },

  // Trend Reports
  'trend-extension': {
    reportType: 'trend',
    groupingType: 'extension',
    listEndpoint: 'call-logs/statsTrendByExtension',
    chartEndpoint: 'call-logs/stats/extension/chart',
    reportTypeParam: 'trendStatsExtension',
    chartReportTypeParam: 'chartExtension',
    breadcrumbTitle: 'Call Trend By Extension',
    componentName: 'CallTrendExtension'
  },
  'trend-department': {
    reportType: 'trend',
    groupingType: 'department',
    listEndpoint: 'call-logs/statsTrendByDepartment',
    chartEndpoint: 'call-logs/stats/department/chart',
    reportTypeParam: 'trendStatsDepartment',
    chartReportTypeParam: 'chartDepartment',
    breadcrumbTitle: 'Call Trend By Department',
    componentName: 'CallTrendDepartment'
  },
  'trend-country': {
    reportType: 'trend',
    groupingType: 'country',
    listEndpoint: 'call-logs/statsTrendByCountry',
    chartEndpoint: 'call-logs/stats/country/chart',
    reportTypeParam: 'trendStatsCountry',
    chartReportTypeParam: 'chartCountry',
    breadcrumbTitle: 'Call Trend By Country',
    componentName: 'CallTrendCountry'
  },

  // Incoming Reports
  'incoming-extension': {
    reportType: 'incoming',
    groupingType: 'extension',
    listEndpoint: 'call-logs/statsIncomingByExtension',
    chartEndpoint: 'call-logs/stats/extension/chart',
    reportTypeParam: 'incomingStatsExtension',
    chartReportTypeParam: 'chartIncomingExtension',
    breadcrumbTitle: 'Call Incoming By Extension',
    componentName: 'CallIncomingExtension'
  },
  'incoming-department': {
    reportType: 'incoming',
    groupingType: 'department',
    listEndpoint: 'call-logs/statsIncomingByDepartment',
    chartEndpoint: 'call-logs/stats/department/chart',
    reportTypeParam: 'incomingStatsDepartment',
    chartReportTypeParam: 'chartIncomingDepartment',
    breadcrumbTitle: 'Call Incoming By Department',
    componentName: 'CallIncomingDepartment'
  },
  'incoming-country': {
    reportType: 'incoming',
    groupingType: 'country',
    listEndpoint: 'call-logs/statsIncomingByCountry',
    chartEndpoint: 'call-logs/stats/country/chart',
    reportTypeParam: 'incomingStatsCountry',
    chartReportTypeParam: 'chartIncomingCountry',
    breadcrumbTitle: 'Call Incoming By Country',
    componentName: 'CallIncomingCountry'
  }
};

export const getCallReportConfig = (reportType: ReportType, groupingType: GroupingType): CallReportConfig => {
  const key = `${reportType}-${groupingType}`;
  return callReportsConfig[key];
};

export const getAllCallReportConfigs = (): CallReportConfig[] => {
  return Object.values(callReportsConfig);
}; 