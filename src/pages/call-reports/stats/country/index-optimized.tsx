import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useCallback } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { ExportCallLogs, DownloadStreamingExport } from '@utils/calls';
import { Column } from '@components/CustomDataTable';
import { Button, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CallLogsFilters from '@components/filters/CallLogsFilters';
import '@assets/scss/report-style.scss';
import '@assets/scss/tabs.scss';
import '@assets/scss/common.scss';
import { ModuleSlug } from '@utils/Helper';

// Custom hooks
import { useCallStatsData } from '@hooks/useCallStatsData';
import { useCallStatsCharts } from '@hooks/useCallStatsCharts';
import { useCallStatsFilters } from '@hooks/useCallStatsFilters';

// Components
import SummaryCards from '@components/call-stats/SummaryCards';
import DonutChart from '@components/call-stats/DonutChart';
import ChartsTabs from '@components/call-stats/ChartsTabs';
import CallLogsTable from '@components/call-stats/CallLogsTable';
import ChartModal from '@components/call-stats/ChartModal';

const CallStatsCountry = () => {
  const [showChartModal, setShowChartModal] = useState(false);
  const [currentChartData, setCurrentChartData] = useState<{ series: any[]; categories: string[] } | null>(null);
  const [currentChartTitle, setCurrentChartTitle] = useState('');

  // Custom hooks
  const { filtersReady, currentFilters, refreshKey, handleFiltersChange } = useCallStatsFilters();
  const { loading, dataLoaded, summary, fetchCallLogs, setDataLoaded, setSummary } = useCallStatsData({
    currentFilters,
    filtersReady
  });
  const { chartCalls, chartRingTime, chartCost, chartDuration, chartLoading } = useCallStatsCharts({
    currentFilters,
    filtersReady
  });

  const columns: Column[] = [
    { key: 'Country', name: 'Country', selector: (row: any) => row.Country, sortable: true },
    { key: 'Answered', name: 'Answered', selector: (row: any) => row.Answered, sortable: true },
    { key: 'Avg Cost', name: 'Avg Cost', selector: (row: any) => row.AvgCost, sortable: true },
    { key: 'AvgDuration', name: 'Avg Duration', selector: (row: any) => row.AvgDuration, sortable: true },
    { key: 'AvgRingTime', name: 'Avg Ring Time', selector: (row: any) => row.AvgRingTime, sortable: true },
    { key: 'Calls', name: 'Calls', selector: (row: any) => row.Calls, sortable: true },
    { key: 'Cost', name: 'Cost', selector: (row: any) => row.Cost, sortable: true },
    { key: 'Duration', name: 'Duration', selector: (row: any) => row.Duration, sortable: true },
    { key: 'MaxRingTime', name: 'Max Ring Time', selector: (row: any) => row.MaxRingTime, sortable: true },
    { key: 'TotalDuration', name: 'Total Duration', selector: (row: any) => row.TotalDuration, sortable: true },
    { key: 'Unanswered', name: 'Un Answered', selector: (row: any) => row.Unanswered, sortable: true },
  ];

  const handleExport = useCallback(async (exportType: string, filters: Record<string, any>) => {
    try {
      if (exportType === 'excel') {
        await DownloadStreamingExport(
          { filters: currentFilters, isExport: true, exportType, reportType: 'statsCountry' }, 
          'call-logs/statsByCountry',
          'statsCountry'
        );
      }
    } catch (error: unknown) {
      console.error('Export error:', error);
      toast.error('Export failed');
    }
  }, [currentFilters]);

  const handleOpenChartModal = useCallback((chartData: { series: any[]; categories: string[] } | null, title: string, dataType: 'calls' | 'time' | 'cost' | 'custom') => {
    if (chartData) {
      setCurrentChartData(chartData);
      setCurrentChartTitle(title);
      setShowChartModal(true);
    }
  }, []);

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Call Stats By Country" />
      
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2">
            <Row className="d-flex justify-content-between align-items-center">
              <Col md={5}>
                <h2 className="mb-0">Call Stats By Country</h2>
              </Col>
              <Col md={7} className="d-flex justify-content-end">
                <div className="action-buttons">
                  <CallLogsFilters
                    onFiltersChange={handleFiltersChange} 
                    onExport={handleExport} 
                    isVisibleCallDirection={false} 
                    moduleSlug={ModuleSlug.CALL_REPORTS} 
                  />
                </div>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Row>
            <SummaryCards summary={summary} dataLoaded={dataLoaded} />
          </Row>
        </Col>

        <DonutChart summary={summary} dataLoaded={dataLoaded} />
      </Row>

      <ChartsTabs
        chartCalls={chartCalls}
        chartRingTime={chartRingTime}
        chartCost={chartCost}
        chartDuration={chartDuration}
        chartLoading={chartLoading}
        onOpenChartModal={handleOpenChartModal}
      />

      <CallLogsTable
        columns={columns}
        fetchCallLogs={fetchCallLogs}
        currentFilters={currentFilters}
        refreshKey={refreshKey}
        summary={summary}
        dataLoaded={dataLoaded}
      />

      <ChartModal
        show={showChartModal}
        onHide={() => setShowChartModal(false)}
        chartData={currentChartData}
        title={currentChartTitle}
      />
    </React.Fragment>
  );
};

CallStatsCountry.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CallStatsCountry;
