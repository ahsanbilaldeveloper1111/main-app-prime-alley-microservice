import React from 'react';
import { Row, Col, Card, Button } from 'react-bootstrap';
import {
  ChevronLeft,
  MessageCircle,
  Phone,
  Mail,
  Clock,
  PhoneCall,
  ChevronRight,
  Ticket,
  Shield,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/router';
import { FaWhatsapp } from 'react-icons/fa';

interface ContactSupportProps {
  onBack: () => void;
  onStartChat?: () => void;
  onRequestCall?: () => void;
  onSendMessage?: () => void;
}

const ContactSupport: React.FC<ContactSupportProps> = ({ 
  onBack, 
  onStartChat,
  onRequestCall,
  onSendMessage 
}) => {
  const router = useRouter();
  const handleEmailSupport = () => {
    globalThis.location.href = 'mailto:info@primealley.com';
  };

  const handleRequestCall = () => {
    globalThis.location.href = 'tel:+97143035555';
  };

  const handleWhatsApp = () => {
    // Format phone number for WhatsApp (remove spaces and keep +)
    const phoneNumber = '+97143035555';
    // Pre-filled message
    const message = encodeURIComponent('Hello, I need support assistance.');
    // Open WhatsApp
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const mainOptions = [
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with a live agent for immediate assistance.',
      buttonText: 'Online',
      buttonAction: onStartChat,
      color: '#5babf6',
      disabled: false
    },
    {
      icon: Phone,
      title: 'Request Call Back',
      description: 'Schedule a call with our support team to get help.',
      buttonText: 'Request a call',
      buttonAction: handleRequestCall,
      color: '#5babf6'
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Submit a support ticket for assistance via email.',
      buttonText: 'Send a message',
      buttonAction: handleEmailSupport,
      color: '#5babf6'
    }
  ];

  const suggestedArticles = [
    {
      icon: Shield,
      title: 'Setting Up Two-Factor Authentication',
      description: 'Chat with information waûlor issues.',
      color: '#4680ff'
    },
    {
      icon: RotateCcw,
      title: 'Resetting Your 2FA Device',
      description: 'Resolve screenshots, and webis ûssues.',
      color: '#04a9f5'
    },
    {
      icon: AlertCircle,
      title: 'Tnroubleshoot 2FA Issues',
      description: 'Fix, aweeting. problems. problems.',
      color: '#5babf6'
    }
  ];

  const faqs = [
    'How do I recover my account?',
    'How can I change my billing plan?',
    'Cant find your answer?'
  ];

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
        <span style={{ color: '#2c3e50', fontWeight: '600', fontSize: '14px' }}>
          Contact Support
        </span>
      </div>

      {/* Hero Section */}
      <div style={{
        textAlign: 'center',
        marginBottom: '40px'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#2c3e50',
          marginBottom: '8px'
        }}>
          Contact Support
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#6c757d',
          marginBottom: 0
        }}>
          How can we assist you today?
        </p>
      </div>

      <Row className="g-3">
        {/* Main Content - Left Side */}
        <Col xs={12} lg={8}>
          {/* Contact Options */}
          <Row className="g-3 mb-3">
            {mainOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Col xs={12} md={4} key={option.title}>
                  <Card style={{
                    background: '#fff',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    height: '100%',
                    padding: '24px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '12px',
                      background: option.color + '15',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 20px'
                    }}>
                      <Icon size={32} color={option.color} strokeWidth={1.5} />
                    </div>
                    <h5 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#2c3e50',
                      marginBottom: '12px'
                    }}>
                      {option.title}
                    </h5>
                    <p style={{
                      fontSize: '13px',
                      color: '#6c757d',
                      marginBottom: '20px',
                      lineHeight: '1.5'
                    }}>
                      {option.description}
                    </p>
                    <Button
                      onClick={option.buttonAction}
                      disabled={option.disabled || false}
                      style={{
                        background: option.disabled ? '#c0c0c0' : option.color,
                        border: 'none',
                        borderRadius: '6px',
                        padding: '10px 20px',
                        fontSize: '14px',
                        fontWeight: '500',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: option.disabled ? 'not-allowed' : 'pointer',
                        opacity: option.disabled ? 0.6 : 1
                      }}
                    >
                      {option.buttonText} <ChevronRight size={16} />
                    </Button>
                  </Card>
                </Col>
              );
            })}
          </Row>

          {/* Prefer to call us */}
          <Card style={{
            background: '#fff',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            marginBottom: '16px'
          }}>
            <Card.Body style={{ padding: '20px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#2c3e50'
                  }}>
                    Prefer to call us?
                  </span>
                 
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}>
                  <Button
                    variant="outline-primary"
                    style={{
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                     
                    }}
                    onClick={handleRequestCall}
                  >
                    <PhoneCall size={18} />
                    +971 4 303 5555
                  </Button>
                  <Button
                    variant="outline-success"
                    onClick={handleWhatsApp}
                    style={{
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                     
                    }}
                  >
                    <FaWhatsapp size={18} />
                    WhatsApp
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={() => router.push('/help-center/my-tickets/new')}
                    style={{
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      
                    }}
                  >
                    <Ticket size={18} />
                    Submit a ticket
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Suggested Articles */}
          <Card style={{
            background: '#fff',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}>
            <Card.Body style={{ padding: '24px' }}>
              <h5 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#2c3e50',
                marginBottom: '20px'
              }}>
                Suggested Articles
              </h5>
              <Row className="g-3 mb-3">
                {suggestedArticles.map((article) => {
                  const Icon = article.icon;
                  return (
                    <Col xs={12} sm={4} key={article.title}>
                      <div style={{
                        padding: '20px',
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
                          width: '48px',
                          height: '48px',
                          borderRadius: '8px',
                          background: article.color + '20',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '16px'
                        }}>
                          <Icon size={24} color={article.color} strokeWidth={2} />
                        </div>
                        <h6 style={{
                          fontSize: '15px',
                          fontWeight: '600',
                          color: '#2c3e50',
                          marginBottom: '8px',
                          lineHeight: '1.4'
                        }}>
                          {article.title}
                        </h6>
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
              <div style={{ textAlign: 'center' }}>
                <Button
                  variant="link"
                  onClick={() => router.push('/help-center/knowledge-base')}
                  style={{
                    fontSize: '14px',
                    color: '#4680ff',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 0'
                  }}
                >
                  See All Suggestions <ChevronRight size={16} />
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Right Sidebar */}
        <Col xs={12} lg={4}>
          {/* Support Hours */}
          <Card style={{
            background: '#fff',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            marginBottom: '16px'
          }}>
            <Card.Body style={{ padding: '20px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <Clock size={24} color="#4680ff" />
                <h5 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#2c3e50',
                  margin: 0
                }}>
                  Support Hours
                </h5>
              </div>
              <p style={{
                fontSize: '14px',
                color: '#495057',
                marginBottom: '8px',
                lineHeight: '1.5'
              }}>
                Mon - Fri: 9am - 6pm (GMT 4+)
              </p>
              <p style={{
                fontSize: '14px',
                color: '#495057',
                marginBottom: '20px',
                lineHeight: '1.5'
              }}>
                Weekend: Limited support
              </p>
              <div style={{
                display: 'flex',
                gap: '12px'
              }}>
                <Button
                  variant="outline-primary"
                  style={{
                    flex: 1,
                    borderRadius: '6px',
                    padding: '10px',
                    fontSize: '13px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    
                  }}
                  onClick={handleRequestCall}
                >
                  <PhoneCall size={16} />
                  Click to call
                </Button>
                <Button
                  variant="outline-success"
                  onClick={handleWhatsApp}
                  style={{
                    flex: 1,
                    borderRadius: '6px',
                    padding: '10px',
                    fontSize: '13px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    
                  }}
                >
                  <FaWhatsapp size={16} />
                  WhatsApp
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* FAQs */}
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
                FAQs
              </h5>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0'
              }}>
                {faqs.map((faq) => (
                  <div
                    key={faq}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 0',
                      cursor: 'pointer',
                      borderBottom: faqs.indexOf(faq) < faqs.length - 1 ? '1px solid #f0f0f0' : 'none'
                    }}
                  >
                    <span style={{
                      fontSize: '13px',
                      color: '#495057'
                    }}>
                      {faq}
                    </span>
                    <ChevronRight size={16} color="#c0c0c0" />
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>

        
        </Col>
      </Row>
    </div>
  );
};

export default ContactSupport;