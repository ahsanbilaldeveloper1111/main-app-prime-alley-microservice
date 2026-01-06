import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, InputGroup, Badge, Button, Dropdown } from 'react-bootstrap';
import { 
  ChevronLeft,
  User,
  Clock,
  Hash,
  Share2,
  ChevronDown,
  AlertTriangle,
  FileText,
  RefreshCw,
  Phone,
  Send,
  Paperclip,
  BookOpen,
  Wrench,
  RotateCcw,
  ChevronRight
} from 'lucide-react';

interface TicketDetailProps {
  ticketId: string;
  onBack: () => void;
}

const TicketDetail: React.FC<TicketDetailProps> = ({ ticketId, onBack }) => {
  const [replyText, setReplyText] = useState('');

  // Sample ticket data
  const ticketData = {
    id: '#107254',
    subject: "Can't enable 2FA",
    priority: 'urgent',
    status: 'Open',
    assignedAgent: {
      name: 'Assigned Agent',
      avatar: 'https://i.pravatar.cc/150?img=48'
    },
    sla: 'R',
    timeRemaining: '00:59:17',
    channel: 'Portal',
    timeline: [
      { status: 'New', time: '1:07 pm', endTime: '2:02pm', progress: 100 },
      { status: 'Open', time: '1:15 pm', endTime: '1:07pm', progress: 100 },
      { status: 'Pending', time: 'x:xx x', endTime: 'x:xxxx', progress: 30 },
      { status: 'Resolved', time: 'x:xx x', endTime: 'x:xxxx', progress: 0 }
    ],
    messages: [
      {
        user: 'Lisa Smith',
        avatar: 'https://i.pravatar.cc/150?img=47',
        time: '6 hours ago',
        message: "Hi, I'm having issues enabling two-factor authentication (2FA) for my account. After entering the received code in the field, it says it's invalid. Could you please help me with this?"
      },
      {
        user: 'Sarah Lee',
        avatar: 'https://i.pravatar.cc/150?img=45',
        time: '5 hours ago',
        message: 'Hi Lisa, I\'m sorry to hear about the trouble with 2FA. Please make sure that the clock on your phone is set to "automatic" and synchronized with the correct time. Try to enter the code again and let me know if it works. If you\'re still having issues, I\'ll be here to assist further!',
        isAgent: true
      },
      {
        user: 'Lisa Smith',
        avatar: 'https://i.pravatar.cc/150?img=47',
        time: '2 hours ago',
        message: "I tried entering the code again, but I'm still getting the same error message."
      }
    ]
  };

  const relatedArticles = [
    { title: 'Setting Up Two-Factor Authentication', icon: BookOpen, color: '#4680ff' },
    { title: 'Troubleshooting 2FA Issues', icon: Wrench, color: '#04a9f5' },
    { title: 'Resetting Your 2FA Device', icon: RotateCcw, color: '#1de9b6' }
  ];

  const getPriorityStyle = (priority: string) => {
    switch(priority) {
      case 'urgent':
        return { bg: '#fee', color: '#dc3545', dotColor: '#dc3545' };
      case 'medium':
        return { bg: '#fff3cd', color: '#856404', dotColor: '#f4c22b' };
      case 'low':
        return { bg: '#f0f0f0', color: '#6c757d', dotColor: '#6c757d' };
      default:
        return { bg: '#f0f0f0', color: '#6c757d', dotColor: '#6c757d' };
    }
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'Open':
        return { bg: '#4680ff', color: '#fff' };
      case 'Pending':
        return { bg: '#fff3cd', color: '#856404' };
      case 'Resolved':
        return { bg: '#d4edda', color: '#155724' };
      case 'Closed':
        return { bg: '#e2e3e5', color: '#383d41' };
      default:
        return { bg: '#4680ff', color: '#fff' };
    }
  };

  const priorityStyle = getPriorityStyle(ticketData.priority);
  const statusStyle = getStatusStyle(ticketData.status);

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
          Ticket {ticketData.id}
        </span>
      </div>

      <Row className="g-3">
        {/* Left Sidebar */}
        <Col xs={12} lg={2}>
          <Card style={{
            background: '#fff',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '0' }}>
              <div style={{
                padding: '12px 20px',
                background: '#f0f4f8',
                borderLeft: '3px solid #4680ff',
                fontSize: '14px',
                fontWeight: '600',
                color: '#4680ff'
              }}>
                {ticketData.id}
              </div>
              <div style={{
                padding: '12px 20px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#495057',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: priorityStyle.dotColor
                }} />
                <span style={{ textTransform: 'capitalize' }}>{ticketData.priority}</span>
              </div>
              <div style={{
                padding: '12px 20px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#495057',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: statusStyle.bg
                }} />
                <span>{ticketData.status}</span>
              </div>
              <div style={{
                padding: '12px 20px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#495057'
              }}>
                Pending
              </div>
              <div style={{
                padding: '12px 20px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#495057'
              }}>
                Resolved
              </div>
            </div>
          </Card>
        </Col>

        {/* Main Content */}
        <Col xs={12} lg={7}>
          <Card style={{
            background: '#fff',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}>
            <Card.Body style={{ padding: '24px' }}>
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '20px',
                paddingBottom: '20px',
                borderBottom: '1px solid #e9ecef'
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '22px',
                    fontWeight: '600',
                    color: '#2c3e50',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <span style={{ color: '#6c757d', fontWeight: '500' }}>{ticketData.id}</span>
                    {ticketData.subject}
                  </h3>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    flexWrap: 'wrap'
                  }}>
                    {/* Priority Badge */}
                    <Badge style={{
                      background: priorityStyle.bg,
                      color: priorityStyle.color,
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontWeight: '500',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: priorityStyle.dotColor
                      }} />
                      <span style={{ textTransform: 'capitalize' }}>{ticketData.priority}</span>
                    </Badge>

                    {/* Status Badge */}
                    <Badge style={{
                      background: statusStyle.bg,
                      color: statusStyle.color,
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontWeight: '500',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: statusStyle.color
                      }} />
                      {ticketData.status}
                    </Badge>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      fontSize: '13px',
                      border: '1px solid #dee2e6'
                    }}
                  >
                    <Share2 size={14} /> Drop it a spancen
                  </Button>
                  <Dropdown>
                    <Dropdown.Toggle
                      variant="outline-secondary"
                      size="sm"
                      style={{
                        padding: '6px 10px',
                        fontSize: '13px',
                        border: '1px solid #dee2e6'
                      }}
                    >
                      <ChevronDown size={14} />
                    </Dropdown.Toggle>
                  </Dropdown>
                </div>
              </div>

              {/* Agent and SLA Info */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                padding: '16px',
                background: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={ticketData.assignedAgent.avatar}
                    alt="Agent"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                  <span style={{ fontSize: '14px', color: '#495057', fontWeight: '500' }}>
                    {ticketData.assignedAgent.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px', color: '#6c757d' }}>SLA</span>
                    <Badge style={{
                      background: '#dc3545',
                      color: '#fff',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {ticketData.sla}
                    </Badge>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} color="#6c757d" />
                    <span style={{ fontSize: '13px', color: '#495057', fontWeight: '500' }}>
                      {ticketData.timeRemaining}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Hash size={14} color="#6c757d" />
                    <span style={{ fontSize: '13px', color: '#6c757d' }}>Channel:</span>
                    <span style={{ fontSize: '13px', color: '#495057', fontWeight: '500' }}>
                      {ticketData.channel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <div style={{ marginBottom: '30px' }}>
                <h5 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#2c3e50',
                  marginBottom: '16px'
                }}>
                  Status Timeline
                </h5>
                <div style={{ position: 'relative', paddingLeft: '20px' }}>
                  {ticketData.timeline.map((item, index) => (
                    <div key={index} style={{ position: 'relative', paddingBottom: '24px' }}>
                      {/* Vertical Line */}
                      {index < ticketData.timeline.length - 1 && (
                        <div style={{
                          position: 'absolute',
                          left: '-15px',
                          top: '12px',
                          bottom: '-12px',
                          width: '2px',
                          background: '#e9ecef'
                        }} />
                      )}
                      
                      {/* Status Dot */}
                      <div style={{
                        position: 'absolute',
                        left: '-19px',
                        top: '4px',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: item.progress > 0 ? '#4680ff' : '#e9ecef',
                        border: '2px solid #fff',
                        boxShadow: '0 0 0 2px #e9ecef'
                      }} />

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ flex: 1 }}>
                          <span style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            color: item.progress > 0 ? '#2c3e50' : '#adb5bd'
                          }}>
                            {item.status}
                          </span>
                        </div>
                        <div style={{ flex: 2, marginLeft: '16px', marginRight: '16px' }}>
                          <div style={{
                            width: '100%',
                            height: '6px',
                            background: '#e9ecef',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${item.progress}%`,
                              height: '100%',
                              background: '#4680ff',
                              borderRadius: '3px',
                              transition: 'width 0.3s ease'
                            }} />
                          </div>
                        </div>
                        <div style={{ flex: 1, textAlign: 'right' }}>
                          <span style={{
                            fontSize: '12px',
                            color: '#6c757d'
                          }}>
                            {item.time} <span style={{ margin: '0 4px' }}>x</span> {item.endTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div style={{ marginBottom: '24px' }}>
                {ticketData.messages.map((message, index) => (
                  <div key={index} style={{
                    marginBottom: '24px',
                    paddingBottom: '24px',
                    borderBottom: index < ticketData.messages.length - 1 ? '1px solid #f0f0f0' : 'none'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px'
                    }}>
                      <img
                        src={message.avatar}
                        alt={message.user}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          flexShrink: 0
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '8px'
                        }}>
                          <span style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#2c3e50'
                          }}>
                            {message.user}
                          </span>
                          <span style={{
                            fontSize: '13px',
                            color: '#6c757d'
                          }}>
                            {message.time}
                          </span>
                        </div>
                        <p style={{
                          fontSize: '14px',
                          color: '#495057',
                          lineHeight: '1.6',
                          margin: 0
                        }}>
                          {message.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              <div style={{
                padding: '20px',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Write a reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  style={{
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    fontSize: '14px',
                    marginBottom: '12px',
                    resize: 'none'
                  }}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Button
                    variant="link"
                    style={{
                      padding: '6px 12px',
                      fontSize: '13px',
                      color: '#4680ff',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Paperclip size={16} />
                    Add screenshot
                    <span style={{ fontSize: '12px', color: '#6c757d', marginLeft: '4px' }}>
                      Max 3 Statens (or up to 20MB Each)
                    </span>
                  </Button>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ fontSize: '13px', color: '#6c757d' }}>or</span>
                    <Button
                      variant="link"
                      style={{
                        padding: 0,
                        fontSize: '13px',
                        color: '#4680ff',
                        textDecoration: 'none'
                      }}
                    >
                      Add internal note
                    </Button>
                    <Button
                      style={{
                        background: '#4680ff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 20px',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <Send size={16} />
                      Send reply
                    </Button>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Right Sidebar */}
        <Col xs={12} lg={3}>
          {/* Actions Card */}
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
                Actions
              </h5>
              
              {/* Escalate Button */}
              <Button
                style={{
                  width: '100%',
                  background: '#fff3cd',
                  border: 'none',
                  color: '#856404',
                  borderRadius: '6px',
                  padding: '10px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                  justifyContent: 'flex-start'
                }}
              >
                <AlertTriangle size={18} />
                Escalate this ticket
              </Button>

              {/* Add Internal Note */}
              <Button
                variant="outline-secondary"
                style={{
                  width: '100%',
                  borderRadius: '6px',
                  padding: '10px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                  justifyContent: 'flex-start',
                  border: '1px solid #dee2e6',
                  color: '#495057'
                }}
              >
                <FileText size={18} />
                Add internal note
              </Button>

              {/* Change Status */}
              <Button
                variant="outline-secondary"
                style={{
                  width: '100%',
                  borderRadius: '6px',
                  padding: '10px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                  border: '1px solid #dee2e6',
                  color: '#495057'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RefreshCw size={18} />
                  <div style={{ textAlign: 'left' }}>
                    <div>Change status:</div>
                    <div style={{ fontSize: '12px', color: '#6c757d', fontWeight: '400' }}>
                      Reopen or close this ticket
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} />
              </Button>

              {/* Request Call Back */}
              <Button
                variant="outline-secondary"
                style={{
                  width: '100%',
                  borderRadius: '6px',
                  padding: '10px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  justifyContent: 'flex-start',
                  border: '1px solid #dee2e6',
                  color: '#495057'
                }}
              >
                <Phone size={18} />
                Request a call back
              </Button>
            </Card.Body>
          </Card>

          {/* Related Knowledge Base */}
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
                Related Knowledge Base Articles
              </h5>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {relatedArticles.map((article, index) => {
                  const Icon = article.icon;
                  return (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        background: '#f8f9fa',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: '1px solid transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f0f4f8';
                        e.currentTarget.style.borderColor = '#4680ff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f8f9fa';
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                    >
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '6px',
                        background: article.color + '20',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Icon size={18} color={article.color} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{
                          fontSize: '13px',
                          color: '#2c3e50',
                          fontWeight: '500',
                          lineHeight: '1.4'
                        }}>
                          {article.title}
                        </span>
                      </div>
                      <ChevronRight size={16} color="#6c757d" />
                    </div>
                  );
                })}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TicketDetail;