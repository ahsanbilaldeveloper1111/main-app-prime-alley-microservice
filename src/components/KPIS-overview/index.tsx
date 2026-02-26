import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { TrendingUp } from 'lucide-react';

export interface KPIItem {
  icon: React.ReactNode;
  iconColor: string;
  label: string;
  value: string | number;
  trend?: {
    value: string;
    isPositive: boolean;
    label: string;
  };
}

export interface KPIOverviewProps {
  title: string;
  items: KPIItem[];
}

const KPIOverview: React.FC<KPIOverviewProps> = ({ title, items }) => {
  return (
    <div style={{ marginBottom: '24px' }}>
      <h6 className="mb-3" style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
        {title}
      </h6>
      <Row className="g-3">
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {/* Desktop version - 5 columns (20% width each) */}
            <Col 
              xs={12} 
              sm={6} 
              md={4} 
              style={{ flex: '0 0 auto', width: '20%' }} 
              className="d-none d-lg-block"
            >
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <div className="d-flex align-items-end justify-content-between mb-3">
                    <div style={{ color: item.iconColor }}>
                      {item.icon}
                    </div>
                    <div className="text-end">
                      <p 
                        className="text-muted text-uppercase small mb-1" 
                        style={{ fontSize: '0.75rem', fontWeight: 500 }}
                      >
                        {item.label}
                      </p>
                    </div>
                  </div>
                  <h2 className="mb-2 fw-bold text-end" style={{ fontSize: '1.75rem' }}>
                    {item.value}
                  </h2>
                  {item.trend ? (
                    <div className="d-flex align-items-center justify-content-end mt-2">
                      {item.trend.isPositive && (
                        <TrendingUp 
                          size={16} 
                          className="text-success" 
                          style={{ marginRight: '0.25rem' }}
                        />
                      )}
                      <span 
                        className={`small ${item.trend.isPositive ? 'text-success' : 'text-muted'}`} 
                        style={{ fontSize: '0.8rem', fontWeight: 500 }}
                      >
                        {item.trend.value}
                      </span>
                      <span 
                        className="text-muted small ms-1" 
                        style={{ fontSize: '0.8rem' }}
                      >
                        {item.trend.label}
                      </span>
                    </div>
                  ) : (
                    <div className="d-flex align-items-center justify-content-end mt-2" style={{ minHeight: '20px' }}>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Mobile/Tablet version */}
            <Col xs={12} sm={6} md={4} className="d-lg-none">
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <div className="d-flex align-items-end justify-content-between mb-3">
                    <div style={{ color: item.iconColor }}>
                      {item.icon}
                    </div>
                    <div className="text-end">
                      <p 
                        className="text-muted text-uppercase small mb-1" 
                        style={{ fontSize: '1rem', fontWeight: 500 }}
                      >
                        {item.label}
                      </p>
                    </div>
                  </div>
                  <h2 className="mb-2 fw-bold text-end" style={{ fontSize: '1.75rem' }}>
                    {item.value}
                  </h2>
                  {item.trend ? (
                    <div className="d-flex align-items-center justify-content-end mt-2">
                      {item.trend.isPositive && (
                        <TrendingUp 
                          size={16} 
                          className="text-success" 
                          style={{ marginRight: '0.25rem' }}
                        />
                      )}
                      <span 
                        className={`small ${item.trend.isPositive ? 'text-success' : 'text-muted'}`} 
                        style={{ fontSize: '0.9rem', fontWeight: 500 }}
                      >
                        {item.trend.value}
                      </span>
                      <span 
                        className="text-muted small ms-1" 
                        style={{ fontSize: '0.9rem' }}
                      >
                        {item.trend.label}
                      </span>
                    </div>
                  ) : (
                    <div className="d-flex align-items-center justify-content-end mt-2" style={{ minHeight: '20px' }}>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </React.Fragment>
        ))}
      </Row>
    </div>
  );
};

export default KPIOverview;
