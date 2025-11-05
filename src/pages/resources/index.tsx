import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useCallback, useMemo } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import {
  ListTypes,
  CreateType,
  UpdateType,
  DeleteType,
} from "@utils/ticket-types";
import { Column } from "@components/CustomDataTable";
import { Button, Modal, Row, Accordion, Card } from "react-bootstrap";
import { Col } from "react-bootstrap";
import { toast } from "react-toastify";
import { useTokenService } from "src/hooks/useTokenService";
import { useSession } from "next-auth/react";
import moment from "moment";
import Link from "next/link";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import FormModal from "@pages/partial/FormModal";
import ConfirmModal from "@pages/partial/ConfirmModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import DatatableActionButton from "@components/DatatableActionButton";
import { FiEdit, FiTrash2, FiEye, FiPlus, FiChevronDown, FiChevronUp } from "react-icons/fi";



const Resources = () => {
  const { data: session, status } = useSession();
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const faqData = [
    {
      id: "1",
      question: "How do I access my account settings?",
      answer: "You can access your account settings by clicking on your profile icon in the top-right corner of the dashboard, then selecting 'Account Settings' from the dropdown menu. From there, you can update your personal information, change your password, and manage your preferences."
    },
    {
      id: "2", 
      question: "What should I do if I forget my password?",
      answer: "If you forget your password, click on the 'Forgot Password' link on the login page. Enter your email address and you'll receive instructions to reset your password. Make sure to check your spam folder if you don't see the email in your inbox."
    },
    {
      id: "3",
      question: "How can I contact customer support?",
      answer: "You can contact our customer support team through multiple channels: 1) Use the support ticket system within the application, 2) Send an email to support@company.com, or 3) Call our support hotline at 1-800-SUPPORT during business hours (9 AM - 6 PM EST, Monday-Friday)."
    },
    {
      id: "4",
      question: "Is my data secure and encrypted?",
      answer: "Yes, we take data security very seriously. All data is encrypted both in transit and at rest using industry-standard encryption protocols. We also implement regular security audits and comply with relevant data protection regulations to ensure your information remains safe."
    },
    {
      id: "5",
      question: "How do I export my data?",
      answer: "To export your data, navigate to the 'Data Export' section in your account settings. You can choose to export specific data types or all your data. The export will be generated and sent to your registered email address as a secure download link within 24 hours."
    },
    {
      id: "6",
      question: "What are the system requirements?",
      answer: "Our application works on all modern web browsers including Chrome, Firefox, Safari, and Edge. We recommend using the latest version of your preferred browser for the best experience. The application is also mobile-responsive and works on tablets and smartphones."
    },
    {
      id: "7",
      question: "How do I update my billing information?",
      answer: "To update your billing information, go to the 'Billing' section in your account settings. You can update your payment method, billing address, and view your billing history. All changes are saved immediately and will apply to your next billing cycle."
    },
    {
      id: "8",
      question: "Can I customize the dashboard layout?",
      answer: "Yes, you can customize your dashboard by clicking the 'Customize' button in the top-right corner of the dashboard. You can drag and drop widgets, resize them, and arrange them according to your preferences. Your layout will be saved automatically."
    }
  ];

  const handleAccordionToggle = (eventKey: string | null | undefined) => {
    setActiveKey(activeKey === eventKey ? null : eventKey || null);
  };

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Resources"
        mainLink="/resources"
        subTitle="Resources"
      />

      <PageHeader
        title="Resources" leftGrid={12}
      />

      <Row className="mt-4">
        <Col lg={12}>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0 text-white">
                <i className="fas fa-question-circle me-2"></i>
                Frequently Asked Questions
              </h4>
            </Card.Header>
            <Card.Body>
              <Accordion activeKey={activeKey} onSelect={(eventKey) => handleAccordionToggle(eventKey as string | null)}>
                {faqData.slice(0, 4).map((faq) => (
                  <Accordion.Item eventKey={faq.id} key={faq.id}>
                    <Accordion.Header className="d-flex justify-content-between align-items-center">
                      <span className="fw-semibold">{faq.question}</span>
                      {activeKey === faq.id ? (
                        <FiChevronUp className="ms-2" />
                      ) : (
                        <FiChevronDown className="ms-2" />
                      )}
                    </Accordion.Header>
                    <Accordion.Body className="pt-3">
                      <p className="mb-0 text-muted">{faq.answer}</p>
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
              <div className="text-center mt-3">
                <Link href="/resources/faq">
                  <Button variant="primary" className="app-button">
                    <i className="fas fa-arrow-right me-2"></i>
                    View All FAQs
                  </Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col lg={12}>
          <Card>
            <Card.Header className="bg-info text-white">
              <h4 className="mb-0 text-white">
                <i className="fas fa-book me-2"></i>
                Helping Materials
              </h4>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6} className="mb-4">
                  <div className="d-flex align-items-start">
                    <div className="flex-shrink-0">
                      <i className="fas fa-file-pdf text-danger fs-3"></i>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h5 className="mb-2">User Guide</h5>
                      <p className="text-muted mb-3">
                        Complete step-by-step guide to help you get started with all features.
                      </p>
                      <Button variant="danger" className="app-button" size="sm">
                        <i className="fas fa-download me-2"></i>
                        Download PDF
                      </Button>
                    </div>
                  </div>
                </Col>
                <Col md={6} className="mb-4">
                  <div className="d-flex align-items-start">
                    <div className="flex-shrink-0">
                      <i className="fas fa-video text-primary fs-3"></i>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h5 className="mb-2">Video Tutorials</h5>
                      <p className="text-muted mb-3">
                        Watch our comprehensive video tutorials to master the platform.
                      </p>
                      <Button variant="primary" className="app-button" size="sm">
                        <i className="fas fa-play me-2"></i>
                        Watch Videos
                      </Button>
                    </div>
                  </div>
                </Col>
                <Col md={6} className="mb-4">
                  <div className="d-flex align-items-start">
                    <div className="flex-shrink-0">
                      <i className="fas fa-code text-warning fs-3"></i>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h5 className="mb-2">API Documentation</h5>
                      <p className="text-muted mb-3">
                        Technical documentation for developers and API integration.
                      </p>
                      <Button variant="warning" className="app-button" size="sm">
                        <i className="fas fa-external-link-alt me-2"></i>
                        View Docs
                      </Button>
                    </div>
                  </div>
                </Col>
                <Col md={6} className="mb-4">
                  <div className="d-flex align-items-start">
                    <div className="flex-shrink-0">
                      <i className="fas fa-graduation-cap text-info fs-3"></i>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h5 className="mb-2">Training Courses</h5>
                      <p className="text-muted mb-3">
                        Interactive courses to enhance your skills and knowledge.
                      </p>
                      <Button variant="info" className="app-button" size="sm">
                        <i className="fas fa-chalkboard-teacher me-2"></i>
                        Start Learning
                      </Button>
                    </div>
                  </div>
                </Col>
              </Row>
              <div className="text-center mt-3">
                <Link href="/resources/help-materials">
                  <Button variant="info" className="app-button">
                    <i className="fas fa-arrow-right me-2"></i>
                    View All Materials
                  </Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col lg={12}>
          <Card className="border-info">
            <Card.Body className="text-center">
              <h5 className="text-info mb-3">Still have questions?</h5>
              <p className="text-muted mb-3">
                Can't find the answer you're looking for? Our support team is here to help!
              </p>
              <div className="d-flex justify-content-center gap-3">
                <Link href="/resources/contact-support">
                  <Button variant="info" className="app-button">
                    <i className="fas fa-envelope me-2"></i>
                    Contact Support
                  </Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

    </React.Fragment>
  );
};

Resources.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default Resources;
