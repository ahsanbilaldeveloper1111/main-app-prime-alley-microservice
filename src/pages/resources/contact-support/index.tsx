import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Button, Row, Card, Form, Alert } from "react-bootstrap";
import { Col } from "react-bootstrap";
import { useSession } from "next-auth/react";
import { FiMail, FiPhone, FiMessageSquare, FiClock, FiSend } from "react-icons/fi";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";

const ContactSupport = () => {
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    priority: 'medium',
    category: 'general',
    message: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const supportChannels = [
    {
      id: 1,
      title: "Email Support",
      description: "Send us an email and we'll respond within 24 hours",
      icon: FiMail,
      color: "primary",
      contact: "support@company.com",
      responseTime: "24 hours"
    },
    {
      id: 2,
      title: "Phone Support",
      description: "Call us for immediate assistance during business hours",
      icon: FiPhone,
      color: "success",
      contact: "1-800-SUPPORT",
      responseTime: "Immediate"
    },
    {
      id: 3,
      title: "Live Chat",
      description: "Chat with our support team in real-time",
      icon: FiMessageSquare,
      color: "info",
      contact: "Available 9 AM - 6 PM EST",
      responseTime: "Immediate"
    }
  ];

  const businessHours = [
    { day: "Monday - Friday", hours: "9:00 AM - 6:00 PM EST" },
    { day: "Saturday", hours: "10:00 AM - 4:00 PM EST" },
    { day: "Sunday", hours: "Closed" }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Form submitted:", formData);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 5000);
  };

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Resources"
        mainLink="/resources"
        subTitle="Contact Support"
      />

      <PageHeader
        title="Contact Support" leftGrid={12}
      />

      {showSuccess && (
        <Row className="mt-3">
          <Col lg={12}>
            <Alert variant="success" onClose={() => setShowSuccess(false)} dismissible>
              <Alert.Heading>Support Request Submitted!</Alert.Heading>
              <p>Thank you for contacting us. We'll get back to you within 24 hours.</p>
            </Alert>
          </Col>
        </Row>
      )}

      <Row className="mt-4">
        <Col lg={8}>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0 text-white">
                <i className="fas fa-headset me-2"></i>
                Submit Support Request
              </h4>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Your full name"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email *</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="your.email@example.com"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Subject *</Form.Label>
                      <Form.Control
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        placeholder="Brief description of your issue"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Priority</Form.Label>
                      <Form.Select
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Category</Form.Label>
                      <Form.Select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                      >
                        <option value="general">General</option>
                        <option value="technical">Technical</option>
                        <option value="billing">Billing</option>
                        <option value="feature">Feature Request</option>
                        <option value="bug">Bug Report</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Message *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={6}
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    placeholder="Please provide detailed information about your issue or question..."
                  />
                </Form.Group>

                <div className="d-flex justify-content-end">
                  <Button type="submit" variant="primary" className="app-button">
                    <FiSend className="me-2" />
                    Submit Request
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          {/* <Card className="mb-4">
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0 text-white">
                <i className="fas fa-phone me-2"></i>
                Contact Channels
              </h5>
            </Card.Header>
            <Card.Body>
              {supportChannels.map((channel) => (
                <div key={channel.id} className="d-flex align-items-start mb-3">
                  <div className="flex-shrink-0">
                    <channel.icon className={`text-${channel.color} fs-4`} />
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h6 className="mb-1">{channel.title}</h6>
                    <p className="text-muted small mb-1">{channel.description}</p>
                    <p className="mb-1 fw-semibold">{channel.contact}</p>
                    <small className="text-muted">Response: {channel.responseTime}</small>
                  </div>
                </div>
              ))}
            </Card.Body>
          </Card> */}

          <Card className="mb-4">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0 text-white">
                <FiClock className="me-2" />
                Business Hours
              </h5>
            </Card.Header>
            <Card.Body>
              {businessHours.map((schedule, index) => (
                <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-semibold">{schedule.day}</span>
                  <span className="text-muted">{schedule.hours}</span>
                </div>
              ))}
            </Card.Body>
          </Card>

          {/* <Card>
            <Card.Header className="bg-warning text-white">
              <h5 className="mb-0 text-white">
                <FiMapPin className="me-2" />
                Office Location
              </h5>
            </Card.Header>
            <Card.Body>
              <p className="mb-2">
                <strong>Headquarters</strong><br />
                123 Business Street<br />
                Suite 100<br />
                New York, NY 10001
              </p>
              <p className="mb-0 text-muted small">
                <i className="fas fa-phone me-1"></i>
                +1 (555) 123-4567
              </p>
            </Card.Body>
          </Card> */}
        </Col>
      </Row>

     
    </React.Fragment>
  );
};

ContactSupport.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ContactSupport;
