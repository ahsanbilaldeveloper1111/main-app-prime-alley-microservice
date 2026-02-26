import React from 'react';
import { Col } from 'react-bootstrap';
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';

interface Summary {
  total_calls: number;
  answered_calls: number;
  unanswered_calls: number;
  total_cost: number;
  total_duration: number;
  avg_duration: number;
  avg_ring_time: number;
}

interface SummaryCardsProps {
  summary: Summary;
  dataLoaded: boolean;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, dataLoaded }) => {
  if (!dataLoaded) {
    return (
      <>
        {[...Array(4)].map((_, index) => (
          <Col md={6} className="mb-3" key={index}>
            <div className="card report-shadow h-100">
              <div className="card-body d-flex flex-column align-items-center justify-content-center text-center" style={{ minHeight: '120px' }}>
                <div className="spinner-border text-primary mb-2" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-muted mb-0">Loading...</p>
              </div>
            </div>
          </Col>
        ))}
      </>
    );
  }

  if (dataLoaded && summary.total_calls === 0 && summary.total_cost === 0 && summary.answered_calls === 0 && summary.unanswered_calls === 0) {
    return (
      <Col md={12}>
        <div className="card report-shadow">
          <div className="card-body d-flex flex-column align-items-center justify-content-center text-center" style={{ minHeight: '120px' }}>
            <i className="fa fa-database fa-3x text-muted mb-3"></i>
            <h5 className="text-muted mb-2">No Data Available</h5>
            <p className="text-muted mb-0">No call statistics found for the selected filters and date range.</p>
          </div>
        </div>
      </Col>
    );
  }

  const summaryData = [
    {
      id: 'total-calls',
      title: 'Total Calls',
      description: 'Total number of calls',
      value: summary.total_calls,
      valueType: 'number',
      icon: 'phone',
      color: 'primary',
      percentage: null
    },
    {
      id: 'avg-ring-time',
      title: 'Avg Ring Time',
      description: 'Average ring time per call',
      value: summary.avg_ring_time,
      valueType: 'seconds',
      icon: 'phone_in_talk',
      color: 'success',
      percentage: null
    },
    {
      id: 'avg-duration',
      title: 'Avg Duration',
      description: 'Average call duration',
      value: summary.avg_duration,
      valueType: 'seconds',
      icon: 'info',
      color: 'warning',
      percentage: null
    },
    {
      id: 'total-cost',
      title: 'Cost',
      description: 'Total cost of calls',
      value: summary.total_cost,
      valueType: 'cost',
        icon: 'payment',
        color: 'danger',
        percentage: null
    }
  ];

  return (
    <PageSummaryGrid 
      cards={summaryData as SummaryCard[]}
      className="mb-3"
    />
  );
};