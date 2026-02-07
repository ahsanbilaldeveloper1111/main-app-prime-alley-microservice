import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Card, Badge } from 'react-bootstrap';
import { Star, MessageSquare, Clock, Info } from 'lucide-react';
import type { RegisterFooter, ChannelSectionContext } from '../types';
import { getContextSource } from '../types';
import CommonOptionsFields from './CommonOptionsFields';

const DEFAULT_DRAFT = `Hi Ms. Shilpa, this is PrimeAlley. Can we schedule a 10-min call this week?`;

const KEY_POINTS = [
  { id: '1', label: 'Need', value: 'consultation' },
  { id: '2', label: 'CTA', value: 'pick time' },
];

const SUGGESTIONS = [
  { id: '1', title: 'Short SMS', rating: 5, content: 'Hi — 10 min call this week? PrimeAlley' },
  { id: '2', title: 'With context', rating: 4, content: 'Hi Ms. Shilpa, PrimeAlley here. Free for a quick call?' },
];

const SmsSection: React.FC<{ registerFooter?: RegisterFooter } & ChannelSectionContext> = ({ registerFooter, contextPayload, commonOptions, setCommonOptions }) => {
  const [draftContent, setDraftContent] = useState(DEFAULT_DRAFT);
  const [objective, setObjective] = useState('Book a meeting');
  const [tone, setTone] = useState('Professional + Friendly');

  const source = getContextSource(contextPayload);

  const handleInsert = (content: string) => {
    setDraftContent(content + '\n\n— PrimeAlley');
  };

  const handleRegen = () => {
    console.log('SMS: Regenerating suggestions...');
  };

  const handleCancel = () => console.log('SMS: Cancel');
  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) navigator.clipboard.writeText(draftContent);
  };
  const handleLater = () => console.log('SMS: Later');
  const handleSend = () => console.log('SMS: Send', { draftContent, objective, tone, contextPayload, source });

  useEffect(() => {
    registerFooter?.({ cancel: handleCancel, copy: handleCopy, later: handleLater, send: handleSend });
    return () => registerFooter?.(null);
  }, [registerFooter, draftContent, objective, tone, contextPayload]);

  return (
    <>
    <div className="alert alert-info">
      <div className="d-flex align-items-center gap-2">
        <Info size={20} className="text-primary" />
        <div>
          
          <p className="text-muted small mb-0">Cooming Soon!</p>
        </div>
      </div>
    </div>
      
    {/* <Row className="g-4">
      <Col lg={7}>
        

        

       

        <div className="mb-3">
          <Form.Label className="fw-semibold">Draft editor</Form.Label>
          <Form.Control as="textarea" rows={6} value={draftContent} onChange={(e) => setDraftContent(e.target.value)} className="font-monospace" />
        </div>

        <Form.Check type="switch" id="activity-tracker-sms" label="Log to Activity Tracker" className="mb-3" />
      </Col>

      <Col lg={5}>
        <div style={{ position: 'sticky', top: '20px' }} onClick={(e) => e.stopPropagation()}>
          <Form.Label className="fw-semibold mb-3">Live preview — SMS</Form.Label>
          <Card className="border-0 shadow-sm" style={{ maxWidth: '400px', backgroundColor: '#e3f2fd' }}>
            <Card.Body>
              <div className="d-flex align-items-start gap-2 mb-2">
                <MessageSquare size={20} className="text-primary mt-1" />
                <div className="flex-grow-1">
                  <div className="fw-semibold small">SMS • Ms. Shilpa</div>
                  <Badge bg="primary" className="small">Online</Badge>
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
    </Row> */}
    </>
  );
};

export default SmsSection;
