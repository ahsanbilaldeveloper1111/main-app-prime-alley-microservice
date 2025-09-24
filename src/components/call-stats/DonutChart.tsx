import React, { useState, useEffect } from 'react';
import { Col } from 'react-bootstrap';
import { motion } from "framer-motion";
import ChartDonut from '@components/ChartDonut';

interface Summary {
  total_calls: number;
  answered_calls: number;
  unanswered_calls: number;
  total_cost: number;
  total_duration: number;
  avg_duration: number;
  avg_ring_time: number;
}

interface DonutChartProps {
  summary: Summary;
  dataLoaded: boolean;
}

const DonutChart: React.FC<DonutChartProps> = ({ summary, dataLoaded }) => {
  const [simpleDonut, setSimpleDonut] = React.useState<{ series: number[]; labels: string[] } | null>(null);

  useEffect(() => {
    if (summary && dataLoaded) {
      const answeredCalls = Number(summary.answered_calls) || 0;
      const unansweredCalls = Number(summary.unanswered_calls) || 0;
      
      // Check if both values are 0, if so don't set chart data (will show empty state)
      if (answeredCalls === 0 && unansweredCalls === 0) {
        setSimpleDonut(null);
      } else {
        // Set chart data only when there's actual data
        setSimpleDonut({
          series: [answeredCalls, unansweredCalls],
          labels: ['Answered Calls', 'Unanswered Calls']
        });
      }
    }
  }, [summary, dataLoaded]);

  return (
    <Col md={6}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 * 0 }}
      >
        <div className="report-grid">
          <h5 className="app-title-heading">Total Calls</h5>
          <div className="chart-one">
            {!dataLoaded ? (
              <div className="d-flex flex-column align-items-center justify-content-center text-center" style={{ height: '180px' }}>
                <div className="spinner-border text-primary mb-2" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-muted mb-0">Loading chart data...</p>
              </div>
            ) : (summary.answered_calls === 0 && summary.unanswered_calls === 0 && summary.total_duration === 0) ? (
              <div className="d-flex flex-column align-items-center justify-content-center text-center" style={{ height: '180px' }}>
                <i className="fa fa-chart-pie fa-2x text-muted mb-2"></i>
                <h6 className="text-muted mb-1">No Call Data Available</h6>
                <p className="text-muted mb-0">No call statistics found for the selected filters</p>
              </div>
            ) : !simpleDonut ? (
              <div className="d-flex flex-column align-items-center justify-content-center text-center" style={{ height: '180px' }}>
                <i className="fa fa-chart-pie fa-2x text-muted mb-2"></i>
                <h6 className="text-muted mb-1">No Call Data Available</h6>
                <p className="text-muted mb-0">No call statistics found for the selected filters</p>
              </div>
            ) : simpleDonut ? (
              <ChartDonut 
                series={simpleDonut.series} 
                labels={simpleDonut.labels}
                dataType="calls"
                height={280}
                width={500}
                showDataLabels={true}
                dataLabelsFormatter={(value) => `${value.toFixed(0)}%`}
              />
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center text-center" style={{ height: '180px' }}>
                <div className="spinner-border text-primary mb-2" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-muted mb-0">Preparing chart visualization...</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Col>
  );
};

export default DonutChart;
