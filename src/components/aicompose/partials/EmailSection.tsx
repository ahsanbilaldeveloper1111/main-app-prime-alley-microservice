import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Card, Badge } from 'react-bootstrap';
import { Star, Mail, Clock } from 'lucide-react';
import type { RegisterFooter, ChannelSectionContext } from '../types';
import { getContextSource } from '../types';

const DEFAULT_DRAFT = `Hi Ms. Shilpa,

Following up on our conversation. Would you have 10 minutes this week for a quick call?

Best regards,
PrimeAlley Team`;

const KEY_POINTS = [
  { id: '1', label: 'Need', value: 'consultation' },
  { id: '2', label: 'CTA', value: 'pick time' },
  { id: '3', label: 'Offer', value: 'quick demo' },
];

const SUGGESTIONS = [
  { id: '1', title: 'Formal follow-up', rating: 5, content: 'Dear Ms. Shilpa, I hope this email finds you well. I would like to schedule a brief call at your convenience.' },
  { id: '2', title: 'Friendly & short', rating: 4, content: 'Hi Ms. Shilpa — when would work for a quick 10-min call this week?' },
];

const EmailSection: React.FC<{ registerFooter?: RegisterFooter } & ChannelSectionContext> = ({ registerFooter, contextPayload }) => {
  const [draftContent, setDraftContent] = useState(DEFAULT_DRAFT);
  const [objective, setObjective] = useState('Book a meeting');
  const [tone, setTone] = useState('Professional + Friendly');

  const source = getContextSource(contextPayload);

  const handleInsert = (content: string) => {
    setDraftContent(content + '\n\n— PrimeAlley Team');
  };

  const handleRegen = () => {
    console.log('Email: Regenerating suggestions...');
  };

  const handleCancel = () => console.log('Email: Cancel');
  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) navigator.clipboard.writeText(draftContent);
  };
  const handleLater = () => console.log('Email: Later');
  const handleSend = () => console.log('Email: Send', { draftContent, objective, tone, contextPayload, source });

  useEffect(() => {
    registerFooter?.({ cancel: handleCancel, copy: handleCopy, later: handleLater, send: handleSend });
    return () => registerFooter?.(null);
  }, [registerFooter, draftContent, objective, tone, contextPayload]);

  return (
    <Row className="g-4">
      <Col lg={7}>
        <div className="small text-muted text-uppercase fw-semibold mb-3">Email section</div>
        {source && (
          <div className="mb-3">
            <Badge bg="secondary" className="px-2 py-1">
              From: {source === 'leads' ? 'Leads' : source === 'deals' ? 'Deals' : 'Orders'}
            </Badge>
          </div>
        )}
        {contextPayload && Object.keys(contextPayload).length > 0 && (
          <div className="mb-3 p-2 rounded border bg-light">
            <div className="small fw-semibold text-muted mb-1">Context payload</div>
            <pre className="mb-0 small" style={{ fontSize: '11px', maxHeight: '120px', overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {JSON.stringify(contextPayload, null, 2)}
            </pre>
          </div>
        )}
        <div className="d-flex flex-wrap gap-2 mb-4">
          <Badge bg="light" text="dark" className="px-3 py-2">Ms. Shilpa</Badge>
          <Badge bg="light" text="dark" className="px-3 py-2">Stage: Contacted</Badge>
          <Badge bg="light" text="dark" className="px-3 py-2">Timezone: UAE</Badge>
        </div>

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

        <div className="mb-4">
          <Form.Label className="fw-semibold">Key points (auto from CRM)</Form.Label>
          <div className="d-flex flex-wrap gap-2">
            {KEY_POINTS.map((point) => (
              <Badge key={point.id} bg="light" text="dark" className="px-3 py-2 border" style={{ fontSize: '0.875rem' }}>
                {point.label}: {point.value}
              </Badge>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Form.Label className="fw-semibold mb-0">Best suggestions</Form.Label>
            <small className="text-muted">1-click insert • regen per card</small>
          </div>
          {SUGGESTIONS.map((suggestion) => (
            <Card key={suggestion.id} className="mb-3 border">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-semibold">{suggestion.title}</span>
                    <div className="d-flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill={i < suggestion.rating ? '#ffc107' : 'none'} stroke={i < suggestion.rating ? '#ffc107' : '#dee2e6'} />
                      ))}
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <Button size="sm" variant="outline-primary" onClick={() => handleInsert(suggestion.content)}>Insert</Button>
                    <Button size="sm" variant="outline-secondary" onClick={handleRegen}>Regen</Button>
                  </div>
                </div>
                <p className="mb-0 text-muted small">{suggestion.content}</p>
              </Card.Body>
            </Card>
          ))}
        </div>

        <div className="mb-3">
          <Form.Label className="fw-semibold">Draft editor</Form.Label>
          <Form.Control as="textarea" rows={6} value={draftContent} onChange={(e) => setDraftContent(e.target.value)} className="font-monospace" />
        </div>

        <Form.Check type="switch" id="activity-tracker-email" label="Log to Activity Tracker" className="mb-3" />
      </Col>

      <Col lg={5}>
        <div style={{ position: 'sticky', top: '20px' }} onClick={(e) => e.stopPropagation()}>
          <Form.Label className="fw-semibold mb-3">Live preview — Email</Form.Label>
          <Card className="border-0 shadow-sm" style={{ maxWidth: '400px', backgroundColor: '#ffebee' }}>
            <Card.Body>
              <div className="d-flex align-items-start gap-2 mb-2">
                <Mail size={20} className="text-danger mt-1" />
                <div className="flex-grow-1">
                  <div className="fw-semibold small">Email • Ms. Shilpa</div>
                  <Badge bg="danger" className="small">Online</Badge>
                </div>
              </div>
              <Card className="mt-3 border-0 shadow-sm">
                <Card.Body className="bg-white">
                  <p className="mb-0" style={{ whiteSpace: 'pre-line', fontSize: '0.95rem' }}>{draftContent}</p>
                  <div className="text-end mt-2">
                    <small className="text-muted d-flex align-items-center justify-content-end gap-1">
                      <Clock size={12} /> 11:02
                    </small>
                  </div>
                </Card.Body>
              </Card>
            </Card.Body>
          </Card>
        </div>
      </Col>
    </Row>
  );
};

export default EmailSection;
