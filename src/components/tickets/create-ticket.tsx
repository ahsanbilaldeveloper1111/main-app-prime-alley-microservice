import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge } from 'react-bootstrap';
import {
  ChevronLeft,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  Code,
  MoreHorizontal,
  Paperclip,
  Plus,
  RotateCcw,
  Phone,
  CheckCircle2,
  ChevronRight,
  FileQuestion,
  Clock
} from 'lucide-react';

interface CreateTicketProps {
  onBack: () => void;
}

const CreateTicket: React.FC<CreateTicketProps> = ({ onBack }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedTicketId, setSubmittedTicketId] = useState('');

  const steps = [
    { number: 1, label: 'Describe Issue', active: currentStep === 1 },
    { number: 2, label: 'Select Priority', active: currentStep === 2 },
    { number: 3, label: 'Fill Details', active: currentStep === 3 },
    { number: 4, label: 'Review', active: currentStep === 4 }
  ];

  const suggestedArticles = [
    {
      title: 'Setting Up',
      subtitle: 'Two-Factor Authentication',
      description: 'Browse help articles sosent',
      icon: Plus,
      color: '#4680ff'
    },
    {
      title: 'Resetting Your 2FA',
      subtitle: 'Device',
      description: 'Find out eosents solutions',
      icon: RotateCcw,
      color: '#04a9f5'
    },
    {
      title: 'Troubleshooting',
      subtitle: '2FA Issues',
      description: 'Fix, eweeting- problems',
      icon: FileQuestion,
      color: '#5babf6'
    }
  ];

  const helpSuggestions = [
    {
      title: 'Setting Up Two-Factor Authentication',
      description: 'Read step-by-step guide',
      icon: CheckCircle2,
      color: '#4680ff'
    },
    {
      title: 'Troubleshooting 2FA Issues',
      description: 'Explore common solutions',
      icon: FileQuestion,
      color: '#04a9f5'
    }
  ];

  const frequentTopics = [
    'Setting Up Two-Factor Authentication',
    'How do I change my billing plan?',
    "Can't find your answer?"
  ];

  const handleSubmit = () => {
    // Generate a random ticket ID
    const newTicketId = '#' + Math.floor(100000 + Math.random() * 900000);
    setSubmittedTicketId(newTicketId);
    setIsSubmitted(true);
  };

  return (
    <div style={{ background: '#f4f7fa', minHeight: '100vh', paddingBottom: '40px' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '20px' }}>
        <Button
          variant="link"
          onClick={onBack}
          style={{
            textDecoration: 'none',
            color: '#6c757d',
            fontSize: '14px',
            padding: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <ChevronLeft size={16} /> Help Center
        </Button>
        <span style={{ color: '#6c757d', margin: '0 8px' }}>›</span>
        <span 
          onClick={onBack}
          style={{ color: '#6c757d', fontSize: '14px', cursor: 'pointer' }}
        >
          My Tickets
        </span>
        <span style={{ color: '#6c757d', margin: '0 8px' }}>›</span>
        <span style={{ color: '#2c3e50', fontWeight: '600', fontSize: '14px' }}>
          Create Ticket
        </span>
      </div>
      <Row className="g-3">
        {/* Main Content: Form or Success Message */}
        <Col xs={12} lg={8}>
          {isSubmitted ? (
            <Card style={{
              background: '#fff',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              textAlign: 'center',
              padding: '60px 40px'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: '#1de9b6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px'
              }}>
                <CheckCircle2 size={40} color="#fff" strokeWidth={2.5} />
              </div>

              <h2 style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#2c3e50',
                marginBottom: '16px'
              }}>
                Ticket Submitted!
              </h2>

              <p style={{
                fontSize: '16px',
                color: '#495057',
                marginBottom: '8px'
              }}>
                Your ticket <span style={{ color: '#4680ff', fontWeight: '600' }}>{submittedTicketId}</span> has been successfully created.
              </p>

              <p style={{
                fontSize: '15px',
                color: '#6c757d',
                marginBottom: '40px'
              }}>
                Our support team will get back to you shortly.
              </p>

              {/* Expected Response Time Card */}
              <Card style={{
                background: '#f8f9fa',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                padding: '24px',
                marginBottom: '32px',
                textAlign: 'left'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    background: '#f4c22b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Clock size={24} color="#fff" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h5 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#2c3e50',
                      marginBottom: '8px'
                    }}>
                      Expected Response Time
                    </h5>
                    <p style={{
                      fontSize: '15px',
                      color: '#495057',
                      marginBottom: '8px'
                    }}>
                      Within <Badge bg="secondary" style={{ fontSize: '11px', fontWeight: '500' }}>1 business day</Badge>
                    </p>
                    <p style={{
                      fontSize: '13px',
                      color: '#6c757d',
                      marginBottom: 0
                    }}>
                      Standard Support: Mon-Fri, 9 AM - 5 PM
                    </p>
                  </div>
                </div>
              </Card>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <Button
                  onClick={onBack}
                  style={{
                    background: '#4680ff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '12px 32px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  View My Tickets
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setIsSubmitted(false);
                    setCategory('');
                    setSubject('');
                    setDescription('');
                    setSubmittedTicketId('');
                  }}
                  style={{
                    borderRadius: '6px',
                    padding: '12px 32px',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: '1px solid #dee2e6',
                    color: '#495057'
                  }}
                >
                  Create Another Ticket
                </Button>
              </div>
            </Card>
          ) : (
            <Card style={{
              background: '#fff',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}>
              <Card.Body style={{ padding: '32px' }}>
                {/* Header */}
                <div style={{ marginBottom: '24px' }}>
                  <h2 style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: '#2c3e50',
                    marginBottom: '8px'
                  }}>
                    Create Ticket
                  </h2>
                  <p style={{
                    fontSize: '15px',
                    color: '#6c757d',
                    marginBottom: '24px'
                  }}>
                    Tell us how we can assist you
                  </p>

                  {/* Progress Steps */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap'
                  }}>
                    {steps.map((step, index) => (
                      <React.Fragment key={step.number}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 16px',
                          borderRadius: '20px',
                          background: step.active ? '#4680ff' : '#e9ecef',
                          color: step.active ? '#fff' : '#6c757d',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}>
                          <span>{step.number}</span>
                          <span>{step.label}</span>
                        </div>
                        {index < steps.length - 1 && (
                          <ChevronRight size={16} color="#c0c0c0" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div style={{ marginBottom: '24px' }}>
                  <Form.Label style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#2c3e50',
                    marginBottom: '8px'
                  }}>
                    Category
                  </Form.Label>
                  <Form.Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{
                      fontSize: '14px',
                      padding: '10px 14px',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      color: category ? '#2c3e50' : '#adb5bd'
                    }}
                  >
                    <option value="">Select a category</option>
                    <option value="billing">Billing & Payments</option>
                    <option value="technical">Technical Support</option>
                    <option value="account">Account Management</option>
                    <option value="feature">Feature Request</option>
                    <option value="other">Other</option>
                  </Form.Select>
                </div>

                {/* Subject */}
                <div style={{ marginBottom: '24px' }}>
                  <Form.Label style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#2c3e50',
                    marginBottom: '8px'
                  }}>
                    Subject
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter a brief summary of the issue..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    style={{
                      fontSize: '14px',
                      padding: '10px 14px',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px'
                    }}
                  />
                </div>

                {/* Describe the issue */}
                <div style={{ marginBottom: '24px' }}>
                  <Form.Label style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#2c3e50',
                    marginBottom: '8px'
                  }}>
                    Describe the issue
                  </Form.Label>

                  {/* Rich Text Toolbar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 12px',
                    background: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderBottom: 'none',
                    borderRadius: '6px 6px 0 0'
                  }}>
                    <Button
                      variant="link"
                      style={{
                        padding: '6px',
                        color: '#6c757d',
                        minWidth: 'auto',
                        border: 'none'
                      }}
                    >
                      <Bold size={16} />
                    </Button>
                    <Button
                      variant="link"
                      style={{
                        padding: '6px',
                        color: '#6c757d',
                        minWidth: 'auto',
                        border: 'none'
                      }}
                    >
                      <Italic size={16} />
                    </Button>
                    <Button
                      variant="link"
                      style={{
                        padding: '6px',
                        color: '#6c757d',
                        minWidth: 'auto',
                        border: 'none'
                      }}
                    >
                      <Underline size={16} />
                    </Button>
                    <div style={{
                      width: '1px',
                      height: '20px',
                      background: '#dee2e6',
                      margin: '0 4px'
                    }} />
                    <Button
                      variant="link"
                      style={{
                        padding: '6px',
                        color: '#6c757d',
                        minWidth: 'auto',
                        border: 'none'
                      }}
                    >
                      <List size={16} />
                    </Button>
                    <Button
                      variant="link"
                      style={{
                        padding: '6px',
                        color: '#6c757d',
                        minWidth: 'auto',
                        border: 'none'
                      }}
                    >
                      <ListOrdered size={16} />
                    </Button>
                    <div style={{
                      width: '1px',
                      height: '20px',
                      background: '#dee2e6',
                      margin: '0 4px'
                    }} />
                    <Button
                      variant="link"
                      style={{
                        padding: '6px',
                        color: '#6c757d',
                        minWidth: 'auto',
                        border: 'none'
                      }}
                    >
                      <AlignLeft size={16} />
                    </Button>
                    <Button
                      variant="link"
                      style={{
                        padding: '6px',
                        color: '#6c757d',
                        minWidth: 'auto',
                        border: 'none'
                      }}
                    >
                      <AlignCenter size={16} />
                    </Button>
                    <div style={{
                      width: '1px',
                      height: '20px',
                      background: '#dee2e6',
                      margin: '0 4px'
                    }} />
                    <Button
                      variant="link"
                      style={{
                        padding: '6px',
                        color: '#6c757d',
                        minWidth: 'auto',
                        border: 'none'
                      }}
                    >
                      <Code size={16} />
                    </Button>
                    <div style={{ marginLeft: 'auto' }}>
                      <Button
                        variant="link"
                        style={{
                          padding: '6px',
                          color: '#6c757d',
                          minWidth: 'auto',
                          border: 'none'
                        }}
                      >
                        <MoreHorizontal size={16} />
                      </Button>
                    </div>
                  </div>

                  {/* Text Area */}
                  <Form.Control
                    as="textarea"
                    rows={6}
                    placeholder="Lisa, how little your complete in figh ivvay:"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{
                      fontSize: '14px',
                      padding: '12px 14px',
                      border: '1px solid #dee2e6',
                      borderTop: 'none',
                      borderRadius: '0 0 6px 6px',
                      resize: 'none'
                    }}
                  />
                </div>

                {/* Add Screenshot */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <Button
                      variant="link"
                      style={{
                        padding: '8px 16px',
                        fontSize: '13px',
                        color: '#4680ff',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        border: '1px solid #dee2e6',
                        borderRadius: '6px',
                        background: '#fff'
                      }}
                    >
                      <Paperclip size={16} />
                      Add screenshot
                    </Button>
                    <span style={{
                      fontSize: '12px',
                      color: '#6c757d'
                    }}>
                      Max 3 files (Up to 20MB Each)
                    </span>
                  </div>
                  <Button
                    onClick={handleSubmit}
                    style={{
                      background: '#4680ff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '10px 32px',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    Submit Ticket
                  </Button>
                </div>

                <p style={{
                  fontSize: '12px',
                  color: '#6c757d',
                  marginBottom: '24px'
                }}>
                  Need to share more details? You can send additional screenshots after ticket creation.
                </p>
              </Card.Body>
            </Card>
          )}
        </Col>
        {/* Sidebar - Always Visible */}
        <Col xs={12} lg={4}>
          {/* Help Suggestions */}
          <Card style={{
            background: '#fff',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            marginBottom: '16px'
          }}>
            <Card.Body style={{ padding: '20px' }}>
              <h5 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#2c3e50',
                marginBottom: '16px'
              }}>
                Look like you need help with Two-Factor Authentication?
              </h5>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '20px'
              }}>
                {helpSuggestions.map((suggestion, index) => {
                  const Icon = suggestion.icon;
                  return (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '12px',
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f0f4f8';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f8f9fa';
                      }}
                    >
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: suggestion.color + '20',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Icon size={18} color={suggestion.color} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h6 style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#2c3e50',
                          marginBottom: '2px',
                          lineHeight: '1.3'
                        }}>
                          {suggestion.title}
                        </h6>
                        <p style={{
                          fontSize: '12px',
                          color: '#6c757d',
                          marginBottom: 0,
                          lineHeight: '1.3'
                        }}>
                          {suggestion.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Did this help? */}
              <div style={{
                paddingTop: '16px',
                borderTop: '1px solid #e9ecef'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#2c3e50'
                  }}>
                    Did this help?
                  </span>
                  <ChevronRight size={16} color="#6c757d" />
                </div>

                <Row className="g-2">
                  <Col xs={6}>
                    <Button
                      variant="outline-secondary"
                      style={{
                        width: '100%',
                        padding: '8px',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        border: '1px solid #dee2e6',
                        color: '#495057'
                      }}
                    >
                      <FileQuestion size={16} />
                      FA Q
                    </Button>
                  </Col>
                  <Col xs={6}>
                    <Button
                      variant="outline-secondary"
                      style={{
                        width: '100%',
                        padding: '8px',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        border: '1px solid #dee2e6',
                        color: '#495057'
                      }}
                    >
                      <Phone size={16} />
                      No, continue with ticket
                    </Button>
                  </Col>
                </Row>
              </div>
            </Card.Body>
          </Card>

          {/* Frequently Used Topics */}
          <Card style={{
            background: '#fff',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}>
            <Card.Body style={{ padding: '20px' }}>
              <h5 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#2c3e50',
                marginBottom: '16px'
              }}>
                Frequently Used Topics
              </h5>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0'
              }}>
                {frequentTopics.map((topic, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 0',
                      cursor: 'pointer',
                      borderBottom: index < frequentTopics.length - 1 ? '1px solid #f0f0f0' : 'none'
                    }}
                  >
                    <span style={{
                      fontSize: '13px',
                      color: '#495057'
                    }}>
                      {topic}
                    </span>
                    <ChevronRight size={16} color="#c0c0c0" />
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      {/* Suggested Articles - Always Visible at Bottom */}
      <Row className="g-3" style={{ marginTop: '16px' }}>
        <Col xs={12}>
          <Card style={{
            background: '#fff',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}>
            <Card.Body style={{ padding: '20px' }}>
              <h5 style={{
                fontSize: '15px',
                fontWeight: '600',
                color: '#2c3e50',
                marginBottom: '16px'
              }}>
                Suggested Articles
              </h5>
              <Row className="g-3">
                {suggestedArticles.map((article, index) => {
                  const Icon = article.icon;
                  return (
                    <Col xs={12} sm={4} key={index}>
                      <div style={{
                        padding: '16px',
                        background: '#f8f9fa',
                        border: '1px solid #e9ecef',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        height: '100%'
                      }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f0f4f8';
                          e.currentTarget.style.borderColor = article.color;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#f8f9fa';
                          e.currentTarget.style.borderColor = '#e9ecef';
                        }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          background: article.color + '20',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '12px'
                        }}>
                          <Icon size={20} color={article.color} />
                        </div>
                        <h6 style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#2c3e50',
                          marginBottom: '2px',
                          lineHeight: '1.3'
                        }}>
                          {article.title}
                        </h6>
                        <p style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#2c3e50',
                          marginBottom: '8px',
                          lineHeight: '1.3'
                        }}>
                          {article.subtitle}
                        </p>
                        <p style={{
                          fontSize: '12px',
                          color: '#6c757d',
                          marginBottom: 0,
                          lineHeight: '1.4'
                        }}>
                          {article.description}
                        </p>
                      </div>
                    </Col>
                  );
                })}
              </Row>
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <Button
                  variant="link"
                  style={{
                    fontSize: '13px',
                    color: '#4680ff',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  See All Suggestions <ChevronRight size={16} />
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CreateTicket;