import React, { useState } from 'react';
import { Card, Row, Col, ProgressBar, Button } from 'react-bootstrap';
import { ChevronDown, ChevronUp } from 'lucide-react';
// import 'bootstrap/dist/css/bootstrap.min.css';

interface ModuleDistributionItem {
  module: string;
  count: number;
}

const ModuleDistributionCard: React.FC = () => {
  const [showAll, setShowAll] = useState<boolean>(false);
  
  // Sample data with all the modules
  const moduleDistribution: ModuleDistributionItem[] = [
    { module: 'Control Hub / System Control', count: 145 },
    { module: 'Call Logs', count: 132 },
    { module: 'Call Recordings', count: 98 },
    { module: 'AI/ML', count: 87 },
    { module: 'CTI', count: 76 },
    { module: 'TMS (Tenant Management System)', count: 65 },
    { module: 'CRM', count: 54 },
    { module: 'DNCR', count: 43 },
    { module: 'WebRTC', count: 38 },
    { module: 'Omni Channel', count: 32 },
    { module: 'Accounts', count: 28 },
    { module: 'NetOps', count: 21 },
    { module: 'Ticket', count: 18 },
    { module: 'GSM Gateway', count: 15 },
  ];

  const totalTickets = moduleDistribution.reduce((sum, item) => sum + item.count, 0);
  
  // Number of items to show initially
  const INITIAL_DISPLAY_COUNT = 6;
  
  // Determine which items to display
  const displayedModules = showAll 
    ? moduleDistribution 
    : moduleDistribution.slice(0, INITIAL_DISPLAY_COUNT);
  
  const hasMoreItems = moduleDistribution.length > INITIAL_DISPLAY_COUNT;

  return (
    <Col xs={12}>
      <Card className="border-0 shadow-sm">
        <Card.Body>
          <Row className="g-3">
            {displayedModules.map((item, index) => {
              const percentage = totalTickets > 0 
                ? Math.round((item.count / totalTickets) * 100) 
                : 0;
              
              return (
                <Col key={index} lg={4} md={6}>
                  <div 
                    className="p-3 rounded" 
                    style={{ 
                      backgroundColor: '#f8f9fa', 
                      transition: 'all 0.3s ease',
                      border: '1px solid transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e9ecef';
                      e.currentTarget.style.borderColor = '#dee2e6';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                      e.currentTarget.style.borderColor = 'transparent';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-semibold small">{item.module}</span>
                      <span className="badge bg-primary">{item.count}</span>
                    </div>
                    <ProgressBar
                      now={percentage}
                      style={{ height: '8px', backgroundColor: '#dee2e6' }}
                      className="mb-1"
                    />
                    <div className="text-muted small mt-1">{percentage}% of total</div>
                  </div>
                </Col>
              );
            })}
          </Row>

          {/* Show More/Less Button */}
          {hasMoreItems && (
            <div className="text-center mt-4">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => setShowAll(!showAll)}
                className="d-inline-flex align-items-center gap-2 px-4"
                style={{ 
                  borderRadius: '20px',
                  transition: 'all 0.3s ease'
                }}
              >
                {showAll ? (
                  <>
                    <span>Show Less</span>
                    <ChevronUp size={16} />
                  </>
                ) : (
                  <>
                    <span>Show More ({moduleDistribution.length - INITIAL_DISPLAY_COUNT} more)</span>
                    <ChevronDown size={16} />
                  </>
                )}
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
    </Col>
  );
};

export default ModuleDistributionCard;