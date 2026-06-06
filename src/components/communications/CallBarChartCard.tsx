import React from 'react';
import { Maximize2 } from 'lucide-react';
import { Col } from 'react-bootstrap';
import type { ApexOptions } from 'apexcharts';
import EmptyState from '@components/EmptyState';
import { cloneForApexCharts } from './apexChartMutableClone';
import CallDashboardApexChart from './CallDashboardApexChart';

type ApexChartSeries = NonNullable<ApexOptions['series']>;

export interface CallBarChartCardProps {
  show: boolean;
  dataLength: number;
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  onExpand: () => void;
  chartOptions: ApexOptions;
  chartSeries: ApexChartSeries;
  height?: number;
}

const CallBarChartCard: React.FC<CallBarChartCardProps> = ({
  show,
  dataLength,
  title,
  emptyTitle,
  emptyDescription,
  onExpand,
  chartOptions,
  chartSeries,
  height = 200,
}) => {
  if (!show) return null;

  return (
    <Col xs={12} lg={4}>
      <div className="card">
        <div className="card-body">
          {dataLength === 0 ? (
            <EmptyState
              title={emptyTitle}
              description={emptyDescription}
              className="table-empty-state"
            />
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 app-title-heading">{title}</h5>
                <button type="button" className="btn btn-sm btn-light" onClick={onExpand} aria-label="Expand chart">
                  <Maximize2 size={16} aria-hidden />
                </button>
              </div>
              <CallDashboardApexChart
                options={cloneForApexCharts(chartOptions)}
                series={cloneForApexCharts(chartSeries)}
                type="bar"
                height={height}
              />
            </>
          )}
        </div>
      </div>
    </Col>
  );
};

export default CallBarChartCard;
