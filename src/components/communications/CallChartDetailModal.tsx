import React from 'react';
import { Modal } from 'react-bootstrap';
import type { ApexOptions } from 'apexcharts';
import { cloneForApexCharts } from './apexChartMutableClone';
import CallDashboardApexChart from './CallDashboardApexChart';

type ApexChartSeries = NonNullable<ApexOptions['series']>;

export interface CallChartDetailModalProps {
  show: boolean;
  title: string;
  onHide: () => void;
  chartOptions: ApexOptions;
  chartSeries: ApexChartSeries;
  chartHeight?: number;
}

const CallChartDetailModal: React.FC<CallChartDetailModalProps> = ({
  show,
  title,
  onHide,
  chartOptions,
  chartSeries,
  chartHeight = 500,
}) => {
  const optionsForModal = cloneForApexCharts({
    ...chartOptions,
    chart: {
      ...chartOptions.chart,
      height: chartHeight,
      toolbar: {
        show: true,
      },
    },
  });

  return (
    <Modal show={show} onHide={onHide} size="xl" centered className="chart-modal">
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="chart-container" style={{ minHeight: `${chartHeight}px` }}>
          <CallDashboardApexChart
            options={optionsForModal}
            series={cloneForApexCharts(chartSeries)}
            type="bar"
            height={chartHeight}
          />
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default CallChartDetailModal;
