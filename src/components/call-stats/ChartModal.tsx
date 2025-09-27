import React from 'react';
import { Modal } from 'react-bootstrap';
import ChartBar from '@components/ChartBar';

interface ChartModalProps {
  show: boolean;
  onHide: () => void;
  chartData: { series: any[]; categories: string[] } | null;
  title: string;
}

export const ChartModal: React.FC<ChartModalProps> = ({
  show,
  onHide,
  chartData,
  title
}) => {
  return (
    <Modal 
      show={show} 
      onHide={onHide}
      size="xl"
      centered
      className="chart-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {chartData ? (
          <div className="chart-container" style={{ minHeight: '500px' }}>
            <ChartBar 
              series={chartData.series}
              categories={chartData.categories}
              height={500}
              dataType="custom"
            />
          </div>
        ) : (
          <div className="d-flex flex-column align-items-center justify-content-center text-center" style={{ height: '500px' }}>
            <i className="fa fa-chart-area fa-4x text-muted mb-3"></i>
            <h5 className="text-muted mb-2">No Chart Data Available</h5>
            <p className="text-muted mb-0">The selected chart data is not available or has been cleared.</p>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};