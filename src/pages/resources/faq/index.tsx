import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Button, Row, Accordion, Card } from "react-bootstrap";
import { Col } from "react-bootstrap";
import { useSession } from "next-auth/react";
import { FiChevronDown, FiChevronUp, FiSearch } from "react-icons/fi";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";

const FAQ = () => {
  const { data: session, status } = useSession();
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const faqData = [
    {
      id: "1",
      category: "Account Management",
      question: "How do I access my account settings?",
      answer: "You can access your account settings by clicking on your profile icon in the top-right corner of the dashboard, then selecting 'Account Settings' from the dropdown menu. From there, you can update your personal information, change your password, and manage your preferences."
    },
    {
      id: "2",
      category: "Account Management", 
      question: "What should I do if I forget my password?",
      answer: "If you forget your password, click on the 'Forgot Password' link on the login page. Enter your email address and you'll receive instructions to reset your password. Make sure to check your spam folder if you don't see the email in your inbox."
    },
    {
      id: "3",
      category: "Support",
      question: "How can I contact customer support?",
      answer: "You can contact our customer support team through multiple channels: 1) Use the support ticket system within the application, 2) Send an email to support@company.com, or 3) Call our support hotline at 1-800-SUPPORT during business hours (9 AM - 6 PM EST, Monday-Friday)."
    },
    {
      id: "4",
      category: "Security",
      question: "Is my data secure and encrypted?",
      answer: "Yes, we take data security very seriously. All data is encrypted both in transit and at rest using industry-standard encryption protocols. We also implement regular security audits and comply with relevant data protection regulations to ensure your information remains safe."
    },
    {
      id: "5",
      category: "Data Management",
      question: "How do I export my data?",
      answer: "To export your data, navigate to the 'Data Export' section in your account settings. You can choose to export specific data types or all your data. The export will be generated and sent to your registered email address as a secure download link within 24 hours."
    },
    {
      id: "6",
      category: "Technical",
      question: "What are the system requirements?",
      answer: "Our application works on all modern web browsers including Chrome, Firefox, Safari, and Edge. We recommend using the latest version of your preferred browser for the best experience. The application is also mobile-responsive and works on tablets and smartphones."
    },
    {
      id: "7",
      category: "Billing",
      question: "How do I update my billing information?",
      answer: "To update your billing information, go to the 'Billing' section in your account settings. You can update your payment method, billing address, and view your billing history. All changes are saved immediately and will apply to your next billing cycle."
    },
    {
      id: "8",
      category: "Customization",
      question: "Can I customize the dashboard layout?",
      answer: "Yes, you can customize your dashboard by clicking the 'Customize' button in the top-right corner of the dashboard. You can drag and drop widgets, resize them, and arrange them according to your preferences. Your layout will be saved automatically."
    },
    {
      id: "9",
      category: "Features",
      question: "How do I enable two-factor authentication?",
      answer: "To enable two-factor authentication, go to your Account Settings > Security tab. Click on 'Enable 2FA' and follow the setup instructions. You'll need to scan a QR code with an authenticator app like Google Authenticator or Authy."
    },
    {
      id: "10",
      category: "Troubleshooting",
      question: "Why am I experiencing slow performance?",
      answer: "Slow performance can be caused by several factors: 1) Check your internet connection, 2) Clear your browser cache and cookies, 3) Close unnecessary browser tabs, 4) Try using a different browser. If issues persist, contact our support team."
    }
  ];

  const categories = Array.from(new Set(faqData.map(faq => faq.category)));

  const filteredFAQs = faqData.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAccordionToggle = (eventKey: string | null | undefined) => {
    setActiveKey(activeKey === eventKey ? null : eventKey || null);
  };

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Resources"
        mainLink="/resources"
        subTitle="FAQ"
      />

      <PageHeader
        title="Frequently Asked Questions" leftGrid={12}
      />

      <Row className="mt-4">
        <Col lg={12}>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0 text-white">
                <i className="fas fa-question-circle me-2"></i>
                Search & Browse FAQs
              </h4>
            </Card.Header>
            <Card.Body>
              <Row className="mb-4">
                <Col md={6}>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FiSearch />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search FAQs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </Col>
                <Col md={6}>
                  <div className="d-flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Button
                        key={category}
                        variant={searchTerm === category ? "primary" : "outline-primary"}
                        size="sm"
                        onClick={() => setSearchTerm(category)}
                      >
                        {category}
                      </Button>
                    ))}
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => setSearchTerm("")}
                    >
                      Clear
                    </Button>
                  </div>
                </Col>
              </Row>

              <Accordion activeKey={activeKey} onSelect={(eventKey) => handleAccordionToggle(eventKey as string | null)}>
                {filteredFAQs.map((faq) => (
                  <Accordion.Item eventKey={faq.id} key={faq.id}>
                    <Accordion.Header className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <span className="badge bg-secondary me-3">{faq.category}</span>
                        <span className="fw-semibold">{faq.question}</span>
                      </div>
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

              {filteredFAQs.length === 0 && (
                <div className="text-center py-5">
                  <i className="fas fa-search text-muted fs-1 mb-3"></i>
                  <h5 className="text-muted">No FAQs found</h5>
                  <p className="text-muted">Try adjusting your search terms or browse by category.</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

     

    </React.Fragment>
  );
};

FAQ.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default FAQ;
