import React from 'react';
import { Col, Row } from 'react-bootstrap';
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

const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, dataLoaded }) => {
  // Create cards data for PageSummaryGrid
  const summaryCards: SummaryCard[] = [
    {
      id: 'total-calls',
      title: 'Total Calls',
      value: summary.total_calls,
      description: 'Total number of calls',
      delay: 0,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: 'style-2',
      valueType: 'number'
    },
    {
      id: 'avg-ring-time',
      title: 'Avg Ring Time',
      value: summary.avg_ring_time,
      description: 'Average ring time in seconds',
      delay: 1,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: 'style-2',
      valueType: 'seconds'
    },
    {
      id: 'avg-duration',
      title: 'Avg Duration',
      value: summary.avg_duration,
      description: 'Average call duration in seconds',
      delay: 2,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: 'style-2',
      valueType: 'seconds'
    },
    {
      id: 'total-cost',
      title: 'Cost',
      value: summary.total_cost,
      description: 'Total cost of calls',
      delay: 3,
      showAnimatedNumber: true,
      animationDuration: 1000,
      fontStyle: 'style-2',
      valueType: 'cost'
    }
  ];

  if (!dataLoaded) {
    // Loading state for stat cards
    return (
      <>
        {Array.from({ length: 4 }).map((_, index) => (
          <Col md={6} key={index} className="mb-3">
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
    // Empty state when no data is available
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

  // Normal stat cards when data is available
  return (
    <PageSummaryGrid 
      cards={summaryCards}
      className="dashboard-grid"
      cardClassName="dashboard-card"
      baseDelay={0.1}
    />
  );
};

export default SummaryCards;
