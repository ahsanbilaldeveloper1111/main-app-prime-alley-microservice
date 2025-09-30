import React, { useState } from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import styled from 'styled-components';
import { FaPhone } from 'react-icons/fa';
import PageHeader from '../../components/PageHeader';
import DialerModal from '../../components/Dialer/DialerModal';
import Moduler from '../../Layouts/Moduler';

const FeatureCard = styled(Card)`
  height: 100%;
  border: none;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.03);
  border-radius: 5px;
  background: #fff;

  .card-header {
    background: transparent;
    border-bottom: 1px solid #f1f1f1;
    padding: 15px 25px;

    h5 {
      margin: 0;
      font-weight: 600;
      color: #111;
    }
  }

  .card-body {
    padding: 25px;
  }
`;

const FeatureList = styled.div`
  .feature-item {
    padding: 16px 0;
    border-bottom: 1px solid #f1f1f1;
    display: flex;
    align-items: center;
    gap: 12px;

    &:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    &:first-child {
      padding-top: 0;
    }

    i {
      width: 35px;
      height: 35px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 5px;
      background: rgba(13, 110, 253, 0.1);
      color: #0d6efd;
      font-size: 1.2rem;
    }

    .feature-content {
      flex: 1;

      h6 {
        margin: 0 0 4px 0;
        font-weight: 500;
      }

      p {
        margin: 0;
        color: #6c757d;
        font-size: 13px;
      }
    }
  }
`;

const GuideList = styled.div`
  .guide-item {
    padding: 12px 0;
    display: flex;
    align-items: flex-start;
    gap: 12px;

    .step-number {
      width: 24px;
      height: 24px;
      min-width: 24px;
      border-radius: 12px;
      background: rgba(13, 110, 253, 0.1);
      color: #0d6efd;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
    }

    .guide-content {
      flex: 1;
      color: #495057;
      font-size: 14px;
    }
  }
`;

const features = [
  {
    icon: 'ti ti-phone',
    title: 'Interactive Dialer',
    description: 'Modern dial pad with real-time input and clear controls'
  },
  {
    icon: 'ti ti-list',
    title: 'Call History',
    description: 'View and manage your call logs and interactions'
  },
  {
    icon: 'ti ti-clipboard',
    title: 'Pre-Call Assessment',
    description: 'Complete checklist before initiating calls'
  },
  {
    icon: 'ti ti-user',
    title: 'Lead Management',
    description: 'Capture and update lead information during calls'
  },
  {
    icon: 'ti ti-settings',
    title: 'Call Controls',
    description: 'Hold, merge, transfer, and end calls with ease'
  }
];

const steps = [
  'Open the dialer using the button in the header',
  'Enter the phone number using keypad or direct input',
  'Complete the pre-call assessment checklist',
  'Review lead information if available',
  'Initiate the call and use controls as needed',
  'Document call outcomes and update lead status'
];

const DialerTestContent: React.FC = () => {
  const [isDialerOpen, setIsDialerOpen] = useState(false);

  const handleOpenDialer = () => {
    setIsDialerOpen(true);
  };

  const handleCloseDialer = () => {
    setIsDialerOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Dialer"
        buttons={
          <button className="btn btn-primary d-flex align-items-center gap-2" onClick={handleOpenDialer}>
            <FaPhone /> Open Dialer
          </button>
        }
      />

      <Row>
        <Col md={8}>
          <FeatureCard>
            <Card.Header>
              <h5>Features & Capabilities</h5>
            </Card.Header>
            <Card.Body>
              <FeatureList>
                {features.map((feature, index) => (
                  <div key={index} className="feature-item">
                    <i className={feature.icon} />
                    <div className="feature-content">
                      <h6>{feature.title}</h6>
                      <p>{feature.description}</p>
                    </div>
                  </div>
                ))}
              </FeatureList>
            </Card.Body>
          </FeatureCard>
        </Col>

        <Col md={4}>
          <FeatureCard className="mb-4">
            <Card.Header>
              <h5>Quick Start Guide</h5>
            </Card.Header>
            <Card.Body>
              <GuideList>
                {steps.map((step, index) => (
                  <div key={index} className="guide-item">
                    <div className="step-number">{index + 1}</div>
                    <div className="guide-content">{step}</div>
                  </div>
                ))}
              </GuideList>
            </Card.Body>
          </FeatureCard>

          <FeatureCard>
            <Card.Header>
              <h5>Tips</h5>
            </Card.Header>
            <Card.Body>
              <FeatureList>
                <div className="feature-item">
                  <i className="ti ti-bulb" />
                  <div className="feature-content">
                    <h6>Expand View</h6>
                    <p>Use the expand button to access additional features and information</p>
                  </div>
                </div>
                <div className="feature-item">
                  <i className="ti ti-checklist" />
                  <div className="feature-content">
                    <h6>Pre-Call Check</h6>
                    <p>Always complete the assessment before initiating calls</p>
                  </div>
                </div>
                <div className="feature-item">
                  <i className="ti ti-notes" />
                  <div className="feature-content">
                    <h6>Documentation</h6>
                    <p>Keep lead information up-to-date during and after calls</p>
                  </div>
                </div>
              </FeatureList>
            </Card.Body>
          </FeatureCard>
        </Col>
      </Row>

      <DialerModal 
        isOpen={isDialerOpen} 
        onClose={handleCloseDialer} 
      />
    </>
  );
};

// Wrap the page content with the Moduler layout
const DialerTestPage: React.FC = () => {
  return (
    <Moduler
      themeMode="light"
      changeThemeMode={() => {}}
      handleOffcanvasToggle={() => {}}
      toogleSidebarHide={() => {}}
      toogleMobileSidebarHide={() => {}}
    >
      <DialerTestContent />
    </Moduler>
  );
};

export default DialerTestPage;