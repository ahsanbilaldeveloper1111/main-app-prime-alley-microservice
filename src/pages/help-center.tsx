import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Col, Row, Tab, Tabs, Card } from "react-bootstrap";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";

// Import Tickets component
import TicketsDashboard from "@pages/tickets/dashboard";

// Import Resources components
import Resources from "@pages/resources";
import FAQ from "@pages/resources/faq";
import HelpMaterials from "@pages/resources/help-materials";
import ContactSupport from "@pages/resources/contact-support";

const HelpCenter = () => {
  const [activeTab, setActiveTab] = useState<string>("tickets");

  return (
    <React.Fragment>
      <style>{`
        #help-center-tabs .nav-link {
          font-weight: 500;
          padding: 12px 24px;
          margin-right: 8px;
          border-radius: 8px 8px 0 0;
          transition: all 0.3s ease;
          color: #6c757d;
          border: none;
          background: transparent;
        }
        
        #help-center-tabs .nav-link:hover {
          color: #0d6efd;
          background-color: rgba(13, 110, 253, 0.05);
        }
        
        #help-center-tabs .nav-link.active {
          color: #0d6efd;
          background-color: #fff;
          border-bottom: 3px solid #0d6efd;
          font-weight: 600;
        }
      `}</style>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Help Center" />

      <PageHeader
        title="Help Center"
        showSearch={false}
      />

      <Row>
        <Col md={12}>
          <Card className="shadow-sm border-0">
            <Card.Body className="p-0">
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k || "tickets")}
                id="help-center-tabs"
                className="help-center-main-tabs"
                style={{
                  borderBottom: '2px solid #e9ecef',
                  padding: '0 20px',
                  marginBottom: 0
                }}
              >
                <Tab eventKey="tickets" title="Tickets">
                  <div style={{ padding: '20px', backgroundColor: '#f8f9fa', minHeight: '400px' }}>
                    <TicketsDashboard />
                  </div>
                </Tab>

                <Tab eventKey="resources" title="Resources">
                  <div style={{ padding: '20px', backgroundColor: '#f8f9fa', minHeight: '400px' }}>
                    <Resources />
                  </div>
                </Tab>

                <Tab eventKey="faq" title="FAQ">
                  <div style={{ padding: '20px', backgroundColor: '#f8f9fa', minHeight: '400px' }}>
                    <FAQ />
                  </div>
                </Tab>

                <Tab eventKey="help-materials" title="Help Materials">
                  <div style={{ padding: '20px', backgroundColor: '#f8f9fa', minHeight: '400px' }}>
                    <HelpMaterials />
                  </div>
                </Tab>

                <Tab eventKey="contact-support" title="Contact Support">
                  <div style={{ padding: '20px', backgroundColor: '#f8f9fa', minHeight: '400px' }}>
                    <ContactSupport />
                  </div>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
};

HelpCenter.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default HelpCenter;
