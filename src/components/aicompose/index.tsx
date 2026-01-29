import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Badge, ButtonGroup } from 'react-bootstrap';
import { MessageSquare, Mail, MessageCircle, X, Star, Clock } from 'lucide-react';

interface KeyPoint {
  id: string;
  label: string;
  value: string;
}

interface Suggestion {
  id: string;
  title: string;
  rating: number;
  content: string;
}

const AICompose: React.FC = () => {
  const [selectedChannel, setSelectedChannel] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');
  const [objective, setObjective] = useState('Book a meeting');
  const [tone, setTone] = useState('Professional + Friendly');
  const [draftContent, setDraftContent] = useState(
    `Hi Ms. Shilpa, this is PrimeAlley.
Can we schedule a 10-minute call this week to understand your requirement and discuss next steps?

— PrimeAlley Team`
  );

  const keyPoints: KeyPoint[] = [
    { id: '1', label: 'Need', value: 'consultation' },
    { id: '2', label: 'CTA', value: 'pick time' },
    { id: '3', label: 'Offer', value: 'quick demo' },
    { id: '4', label: 'Add', value: 'meeting link' },
  ];

  const suggestions: Suggestion[] = [
    {
      id: '1',
      title: 'High converting',
      rating: 5,
      content: 'Hi Ms. Shilpa, this is PrimeAlley. Can we schedule a 10-minute call this week to understand your requirement and discuss next steps?',
    },
    {
      id: '2',
      title: 'Short & direct',
      rating: 4,
      content: 'Hi Ms. Shilpa — can we book a quick 10-minute call today or tomorrow?',
    },
  ];

  const handleInsert = (content: string) => {
    setDraftContent(content + '\n\n— PrimeAlley Team');
  };

  const handleRegen = () => {
    // Regeneration logic would go here
    console.log('Regenerating suggestions...');
  };

  return (
    <Container fluid className="p-0" style={{ backgroundColor: 'transparent', minHeight: 'min-content' }}>
      <Card className="border-0" style={{ boxShadow: 'none', backgroundColor: 'white', minHeight: 'min-content' }}>
        <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center py-3 px-4">
          <div>
            <h4 className="mb-1 fw-bold">AI Compose</h4>
            <small className="text-muted">Channel-ready copy with instant preview</small>
          </div>
        </Card.Header>

        <Card.Body className="p-4" style={{ overflowY: 'visible' }}>
          <Row className="g-4">
            {/* Left Column - Configuration */}
            <Col lg={7}>
              {/* Channel Selection */}
              <div className="mb-4">
                <div className="d-flex gap-2 mb-3">
                  <button
                    onClick={() => setSelectedChannel('whatsapp')}
                    style={{
                      padding: '10px 20px',
                      border: selectedChannel === 'whatsapp' ? '2px solid #25D366' : '2px solid #e5e7eb',
                      backgroundColor: selectedChannel === 'whatsapp' ? '#d4f4dd' : 'white',
                      color: selectedChannel === 'whatsapp' ? '#25D366' : '#6b7280',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: '600',
                      fontSize: '14px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedChannel !== 'whatsapp') {
                        e.currentTarget.style.borderColor = '#25D366';
                        e.currentTarget.style.backgroundColor = '#f0fdf4';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedChannel !== 'whatsapp') {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    <MessageCircle size={18} />
                    WhatsApp
                  </button>
                  <button
                    onClick={() => setSelectedChannel('sms')}
                    style={{
                      padding: '10px 20px',
                      border: selectedChannel === 'sms' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                      backgroundColor: selectedChannel === 'sms' ? '#dbeafe' : 'white',
                      color: selectedChannel === 'sms' ? '#3b82f6' : '#6b7280',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: '600',
                      fontSize: '14px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedChannel !== 'sms') {
                        e.currentTarget.style.borderColor = '#3b82f6';
                        e.currentTarget.style.backgroundColor = '#eff6ff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedChannel !== 'sms') {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    <MessageSquare size={18} />
                    SMS
                  </button>
                  <button
                    onClick={() => setSelectedChannel('email')}
                    style={{
                      padding: '10px 20px',
                      border: selectedChannel === 'email' ? '2px solid #ef4444' : '2px solid #e5e7eb',
                      backgroundColor: selectedChannel === 'email' ? '#fee2e2' : 'white',
                      color: selectedChannel === 'email' ? '#ef4444' : '#6b7280',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: '600',
                      fontSize: '14px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedChannel !== 'email') {
                        e.currentTarget.style.borderColor = '#ef4444';
                        e.currentTarget.style.backgroundColor = '#fef2f2';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedChannel !== 'email') {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    <Mail size={18} />
                    Email
                  </button>
                </div>

                <div className="mt-3 d-flex flex-wrap gap-2">
                  <Badge bg="light" text="dark" className="px-3 py-2">Ms. Shilpa</Badge>
                  <Badge bg="light" text="dark" className="px-3 py-2">Stage: Contacted</Badge>
                  <Badge bg="light" text="dark" className="px-3 py-2">Timezone: UAE</Badge>
                </div>
              </div>

              {/* Objective and Tone */}
              <Row className="mb-4">
                <Col md={6} className="mb-3 mb-md-0">
                  <Form.Group>
                    <Form.Label className="fw-semibold">Objective</Form.Label>
                    <Form.Select value={objective} onChange={(e) => setObjective(e.target.value)}>
                      <option>Book a meeting</option>
                      <option>Follow up</option>
                      <option>Send proposal</option>
                      <option>Request feedback</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Tone</Form.Label>
                    <Form.Select value={tone} onChange={(e) => setTone(e.target.value)}>
                      <option>Professional + Friendly</option>
                      <option>Casual</option>
                      <option>Formal</option>
                      <option>Enthusiastic</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              {/* Key Points */}
              <div className="mb-4">
                <Form.Label className="fw-semibold">Key points (auto from CRM)</Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  {keyPoints.map((point) => (
                    <Badge 
                      key={point.id} 
                      bg="light" 
                      text="dark" 
                      className="px-3 py-2 border"
                      style={{ fontSize: '0.875rem' }}
                    >
                      {point.label}: {point.value}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Best Suggestions */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <Form.Label className="fw-semibold mb-0">Best suggestions</Form.Label>
                  <small className="text-muted">1-click insert • regen per card</small>
                </div>

                {suggestions.map((suggestion) => (
                  <Card key={suggestion.id} className="mb-3 border">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-semibold">{suggestion.title}</span>
                          <div className="d-flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                fill={i < suggestion.rating ? '#ffc107' : 'none'}
                                stroke={i < suggestion.rating ? '#ffc107' : '#dee2e6'}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="d-flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline-primary"
                            onClick={() => handleInsert(suggestion.content)}
                          >
                            Insert
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline-secondary"
                            onClick={handleRegen}
                          >
                            Regen
                          </Button>
                        </div>
                      </div>
                      <p className="mb-0 text-muted small">{suggestion.content}</p>
                    </Card.Body>
                  </Card>
                ))}
              </div>

              {/* Draft Editor */}
              <div className="mb-3">
                <Form.Label className="fw-semibold">Draft editor</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={6}
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  className="font-monospace"
                />
              </div>

              {/* Activity Tracker Toggle */}
              <Form.Check
                type="switch"
                id="activity-tracker"
                label="Log to Activity Tracker"
                className="mb-3"
              />
            </Col>

            {/* Right Column - Live Preview */}
            <Col lg={5}>
              <div style={{ position: 'sticky', top: '20px' }}>
                <Form.Label className="fw-semibold mb-3">Live preview</Form.Label>
                
                <Card className="border-0 shadow-sm" style={{ backgroundColor: '#e8f5e9', maxWidth: '400px' }}>
                  <Card.Body>
                    <div className="d-flex align-items-start gap-2 mb-2">
                      <MessageCircle size={20} className="text-success mt-1" />
                      <div className="flex-grow-1">
                        <div className="fw-semibold small">WhatsApp • Ms. Shilpa</div>
                        <Badge bg="success" className="small">Online</Badge>
                      </div>
                    </div>
                    
                    <Card className="mt-3 border-0 shadow-sm">
                      <Card.Body className="bg-white">
                        <p className="mb-0" style={{ whiteSpace: 'pre-line', fontSize: '0.95rem' }}>
                          {draftContent}
                        </p>
                        <div className="text-end mt-2">
                          <small className="text-muted d-flex align-items-center justify-content-end gap-1">
                            <Clock size={12} />
                            11:02
                          </small>
                        </div>
                      </Card.Body>
                    </Card>
                  </Card.Body>
                </Card>
              </div>
            </Col>
          </Row>
        </Card.Body>

        <Card.Footer className="bg-white border-top d-flex justify-content-between align-items-center py-3">
          <div></div>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary">Cancel</Button>
            <Button variant="outline-primary">Copy</Button>
            <Button variant="outline-secondary">Later</Button>
            <Button variant="success" className="px-4">Send</Button>
          </div>
        </Card.Footer>
      </Card>
    </Container>
  );
};

export default AICompose;