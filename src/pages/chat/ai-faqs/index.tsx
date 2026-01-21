import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import { useRouter } from 'next/router';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Building2, Globe, ChevronRight } from 'lucide-react';



const AIChatFAQs = () => {
  const router = useRouter();

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="AI Chat FAQs" />

      <PageHeader
        title="AI Chat FAQs"
        showSearch={false}
      />

      <Container fluid className="">
        <Row className="g-4">
          {/* Tenant FAQs Card */}
          <Col md={6}>
            <Card 
              className="h-100 shadow-sm"
              style={{ 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: '1px solid #e9ecef'
              }}
              onClick={() => router.push('/chat/ai-faqs/tenant')}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }}
            >
              <Card.Body className="d-flex flex-column align-items-center justify-content-center text-center p-5">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center mb-3"
                  style={{
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white'
                  }}
                >
                  <Building2 size={40} />
                </div>
                <h4 className="mb-3" style={{ color: '#263238', fontWeight: '600' }}>
                  Tenant FAQs
                </h4>
                <p className="text-muted mb-4" style={{ fontSize: '0.95rem' }}>
                  Manage and configure tenant-specific frequently asked questions for your AI chat system.
                </p>
                <div className="d-flex align-items-center text-primary" style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                  View Tenant FAQs
                  <ChevronRight size={18} className="ms-1" />
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Global FAQs Card */}
          <Col md={6}>
            <Card 
              className="h-100 shadow-sm"
              style={{ 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: '1px solid #e9ecef'
              }}
              onClick={() => router.push('/chat/ai-faqs/global')}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }}
            >
              <Card.Body className="d-flex flex-column align-items-center justify-content-center text-center p-5">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center mb-3"
                  style={{
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white'
                  }}
                >
                  <Globe size={40} />
                </div>
                <h4 className="mb-3" style={{ color: '#263238', fontWeight: '600' }}>
                  Global FAQs
                </h4>
                <p className="text-muted mb-4" style={{ fontSize: '0.95rem' }}>
                  Manage and configure global frequently asked questions that apply across all tenants.
                </p>
                <div className="d-flex align-items-center text-primary" style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                  View Global FAQs
                  <ChevronRight size={18} className="ms-1" />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

    </React.Fragment>
  );
};

AIChatFAQs.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default AIChatFAQs;
