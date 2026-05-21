import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import { useRouter } from 'next/router';
import { Container, Row, Col, Card, Button, Modal, Spinner } from 'react-bootstrap';
import { Building2, Globe, ChevronRight, Bot, X } from 'lucide-react';
import {
  postChatTraining,
  formatChatTrainingResultMessage,
  type ChatTrainingResponse,
} from '@utils/chat';
import { toast } from 'react-toastify';



const AIChatFAQs = () => {
  const router = useRouter();
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [trainingResponse, setTrainingResponse] = useState<ChatTrainingResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTrainBot = async () => {
    try {
      setLoading(true);
      const payload = {
        tenant_id: "tenant_123",
        chunk_size: 1000,
        chunk_overlap: 200
      };
      
      const response = await postChatTraining(payload);
      setTrainingResponse(response);
      setShowTrainingModal(true);
    } catch (error: unknown) {
      console.error('Error training bot:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to train bot.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="AI Chat FAQs" />

      <PageHeader
        title="AI Chat FAQs"
        showSearch={false}
        buttons={
          <Button 
            variant="primary" 
            onClick={handleTrainBot}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Training...
              </>
            ) : (
              <>
                <Bot size={16} className="me-2" />
                Train Bot
              </>
            )}
          </Button>
        }
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

      {/* Training Response Modal */}
      <Modal 
        show={showTrainingModal} 
        onHide={() => {
          setShowTrainingModal(false);
          setTrainingResponse(null);
        }}
        size="lg"
        centered
      >
        <Modal.Header style={{ borderBottom: '1px solid #e8eef5' }}>
          <Modal.Title style={{ fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bot size={20} color="#4e6fa5" />
            Training Results
          </Modal.Title>
          <Button
            variant="link"
            onClick={() => {
              setShowTrainingModal(false);
              setTrainingResponse(null);
            }}
            style={{ 
              background: 'none',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              color: '#6c757d',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={20} />
          </Button>
        </Modal.Header>
        <Modal.Body>
          {trainingResponse && (
            <div style={{ 
              padding: '20px',
              textAlign: 'center'
            }}>
              <p style={{ 
                fontSize: '16px',
                color: '#2d3748',
                margin: 0,
                lineHeight: '1.6'
              }}>
                {formatChatTrainingResultMessage(trainingResponse)}
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowTrainingModal(false);
              setTrainingResponse(null);
            }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

    </React.Fragment>
  );
};

AIChatFAQs.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default AIChatFAQs;
