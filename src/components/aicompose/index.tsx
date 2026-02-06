import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import { MessageSquare, Mail, MessageCircle, Video } from 'lucide-react';
import type { AIComposeChannel, AIComposeOpenedFrom, AIComposeProps, FooterHandlers } from './types';
import WhatsAppSection from './partials/WhatsAppSection';
import EmailSection from './partials/EmailSection';
import SmsSection from './partials/SmsSection';
import MeetingsSection from './partials/MeetingsSection';

export type { AIComposeChannel, AIComposeOpenedFrom, AIComposeProps } from './types';

const getChannelFromOpenedFrom = (from: AIComposeOpenedFrom): AIComposeChannel =>
  from === 'meet-now' ? 'meetings' : from;

const CHANNEL_ORDER: Record<AIComposeChannel, number> = {
  whatsapp: 0,
  email: 1,
  sms: 2,
  meetings: 3,
};

const AICompose: React.FC<AIComposeProps> = ({ openedFrom = 'whatsapp', contextPayload }) => {
  const [selectedChannel, setSelectedChannel] = useState<AIComposeChannel>(
    () => getChannelFromOpenedFrom(openedFrom)
  );
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);

  useEffect(() => {
    setSelectedChannel(getChannelFromOpenedFrom(openedFrom));
  }, [openedFrom]);

  const handleTabChange = (e: React.MouseEvent, newChannel: AIComposeChannel) => {
    e.stopPropagation();
    if (newChannel === selectedChannel) return;
    const dir = CHANNEL_ORDER[newChannel] > CHANNEL_ORDER[selectedChannel] ? 1 : -1;
    setSlideDirection(dir);
    setSelectedChannel(newChannel);
  };

  const [footerHandlers, setFooterHandlers] = useState<FooterHandlers | null>(null);
  const registerFooter = useCallback((handlers: FooterHandlers | null) => {
    setFooterHandlers(() => handlers);
  }, []);

  return (
    <Container fluid className="p-0" style={{ backgroundColor: 'transparent', minHeight: 'min-content' }}>
      <style>{`
        .ai-compose-tab-slide-holder { overflow: hidden; min-height: 320px; }
        .ai-compose-tab-slide-content {
          animation-duration: 0.3s;
          animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          animation-fill-mode: both;
        }
        .ai-compose-tab-slide-content.slide-next {
          animation-name: ai-compose-slide-from-right;
        }
        .ai-compose-tab-slide-content.slide-prev {
          animation-name: ai-compose-slide-from-left;
        }
        @keyframes ai-compose-slide-from-right {
          from { transform: translateX(28px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes ai-compose-slide-from-left {
          from { transform: translateX(-28px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      <Card className="border-0" style={{ boxShadow: 'none', backgroundColor: 'white', minHeight: 'min-content' }}>
        <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center py-3 px-4">
          <div>
            <h4 className="mb-1 fw-bold">AI Compose</h4>
            <small className="text-muted">Channel-ready copy with instant preview</small>
          </div>
        </Card.Header>

        <Card.Body className="p-4" style={{ overflowY: 'visible' }}>
          {/* Channel tabs */}
          <div className="mb-4">
                <div className="d-flex gap-2 mb-3">
                  <button
                    onClick={(e) => handleTabChange(e, 'whatsapp')}
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
                    onClick={(e) => handleTabChange(e, 'email')}
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
                  <button
                    onClick={(e) => handleTabChange(e, 'sms')}
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
                    onClick={(e) => handleTabChange(e, 'meetings')}
                    style={{
                      padding: '10px 20px',
                      border: selectedChannel === 'meetings' ? '2px solid #f59e0b' : '2px solid #e5e7eb',
                      backgroundColor: selectedChannel === 'meetings' ? '#fffbeb' : 'white',
                      color: selectedChannel === 'meetings' ? '#f59e0b' : '#6b7280',
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
                      if (selectedChannel !== 'meetings') {
                        e.currentTarget.style.borderColor = '#f59e0b';
                        e.currentTarget.style.backgroundColor = '#fef3c7';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedChannel !== 'meetings') {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    <Video size={18} />
                    Meetings
                  </button>
                </div>
              </div>

          {/* Tab content: one section per channel (slide animation); each partial has its own content + preview */}
          <div className="ai-compose-tab-slide-holder rounded-3 border mb-3" style={{ borderColor: 'var(--bs-border-color)' }}>
            <div
              key={selectedChannel}
              className={`ai-compose-tab-slide-content rounded-3 p-4 ${slideDirection === 1 ? 'slide-next' : 'slide-prev'}`}
              style={{ minHeight: '320px' }}
              onClick={(e) => e.stopPropagation()}
            >
              {selectedChannel === 'whatsapp' && <WhatsAppSection registerFooter={registerFooter} contextPayload={contextPayload} />}
              {selectedChannel === 'email' && <EmailSection registerFooter={registerFooter} contextPayload={contextPayload} />}
              {selectedChannel === 'sms' && <SmsSection registerFooter={registerFooter} contextPayload={contextPayload} />}
              {selectedChannel === 'meetings' && <MeetingsSection registerFooter={registerFooter} contextPayload={contextPayload} />}
            </div>
          </div>
        </Card.Body>

        {/* <Card.Footer className="bg-white border-top d-flex justify-content-between align-items-center py-3">
          <div />
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" onClick={() => footerHandlers?.cancel()}>Cancel</Button>
            <Button variant="outline-primary" onClick={() => footerHandlers?.copy()}>Copy</Button>
            <Button variant="outline-secondary" onClick={() => footerHandlers?.later()}>Later</Button>
            <Button variant="success" className="px-4" onClick={() => footerHandlers?.send()}>Send</Button>
          </div>
        </Card.Footer> */}
      </Card>
    </Container>
  );
};

export default AICompose;