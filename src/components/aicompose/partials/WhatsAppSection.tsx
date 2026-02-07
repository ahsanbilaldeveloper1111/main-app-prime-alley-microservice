import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Card, Badge } from 'react-bootstrap';
import { Star, MessageCircle, Clock, Sparkles } from 'lucide-react';
import type { RegisterFooter, ChannelSectionContext } from '../types';
import { getContextSource } from '../types';
import { generateWhatsApp, getWhatsAppChatMessages, getChats, sendWhatsApp } from '@utils/communication';
import type { GenerateWhatsAppPayload } from '@utils/communication';
import parsePhoneNumber from 'libphonenumber-js';
import moment from 'moment-timezone';
import { GlobalDateTimeFormat } from '@utils/Helper';
import CommonOptionsFields from './CommonOptionsFields';

/** Chat item from GET chats response (data array item) */
interface WhatsAppChatItem {
  id: number;
  phone_number: string;
  last_message_preview?: string;
  last_message_at?: string;
  window_started_at?: string;
  messages?: WhatsAppMessage[];
}

/** Single message from chat-messages or chat.messages */
interface WhatsAppMessage {
  id: number;
  direction: 'inbound' | 'outbound';
  message: string;
  status?: string;
  from_number?: string;
  to_number?: string;
  created_at: string;
}

const DEFAULT_DRAFT = `Hi Ms. Shilpa, this is PrimeAlley.
Can we schedule a 10-minute call this week to understand your requirement and discuss next steps?

— PrimeAlley Team`;

const KEY_POINTS = [
  { id: '1', label: 'Need', value: 'consultation' },
  { id: '2', label: 'CTA', value: 'pick time' },
  { id: '3', label: 'Offer', value: 'quick demo' },
  { id: '4', label: 'Add', value: 'meeting link' },
];

const SUGGESTIONS = [
  { id: '1', title: 'High converting', rating: 5, content: 'Hi Ms. Shilpa, this is PrimeAlley. Can we schedule a 10-minute call this week to understand your requirement and discuss next steps?' },
  { id: '2', title: 'Short & direct', rating: 4, content: 'Hi Ms. Shilpa — can we book a quick 10-minute call today or tomorrow?' },
];

const DEFAULT_COMMON_OPTIONS = {
  industry: '',
  customIndustry: '',
  tone: 'professional',
  language: 'en',
  customLanguage: '',
  urgency: 'normal',
  ctaType: '',
  customCtaType: '',
};

const WhatsAppSection: React.FC<{ registerFooter?: RegisterFooter } & ChannelSectionContext> = ({ registerFooter, contextPayload, commonOptions: commonOptionsProp, setCommonOptions }) => {
  const commonOptions = commonOptionsProp ?? DEFAULT_COMMON_OPTIONS;
  const [draftContent, setDraftContent] = useState(DEFAULT_DRAFT);
  const [objective, setObjective] = useState('Book a meeting');
  const [description, setDescription] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [generateLoading, setGenerateLoading] = useState(false);
  const [emojiLevel, setEmojiLevel] = useState('moderate');
  const [descriptionSuggestLoading, setDescriptionSuggestLoading] = useState(false);

  const source = getContextSource(contextPayload);

  const handleInsert = (content: string) => {
    setDraftContent(content + '\n\n— PrimeAlley Team');
  };

  const handleRegen = () => {
    console.log('WhatsApp: Regenerating suggestions...');
  };

  const handleSuggestDescription = async () => {
    setDescriptionSuggestLoading(true);
    try {
      const res = await generateWhatsApp({
        query: 'Suggest a brief one-line description or prompt for a WhatsApp message to this contact. Reply with only that description, no other text.',
        ...(source === 'leads' && { lead: contextPayload?.lead }),
        ...(source === 'deals' && { deal: contextPayload?.deal }),
        ...(source === 'orders' && { order: contextPayload?.order }),
      });
      const suggested = (res.result ?? '').trim();
      if (suggested) setDescription(suggested);
    } catch (err) {
      console.error('WhatsApp suggest description failed:', err);
    } finally {
      setDescriptionSuggestLoading(false);
    }
  };

  const handleAutoGenerate = async () => {
    const query = description.trim();
    if (!query) return;
    setGenerateLoading(true);
    try {
      const res = await generateWhatsApp({
        query,
        previous_content: generatedContent || undefined,
        ...(source === 'leads' && { lead: contextPayload?.lead }),
        ...(source === 'deals' && { deal: contextPayload?.deal }),
        ...(source === 'orders' && { order: contextPayload?.order }),
        tone: commonOptions.tone,
        urgency: commonOptions.urgency,
        industry: commonOptions.industry === 'custom' ? commonOptions.customIndustry : commonOptions.industry,
        cta_type: commonOptions.ctaType === 'custom' ? commonOptions.customCtaType : commonOptions.ctaType,
        language: commonOptions.language === 'custom' ? commonOptions.customLanguage : commonOptions.language,
        emoji_level: emojiLevel,
      });
      setGeneratedContent(res.result ?? '');
    } catch (err) {
      console.error('WhatsApp generate failed:', err);
      setGeneratedContent('');
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleCancel = () => console.log('WhatsApp: Cancel');
  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) navigator.clipboard.writeText(draftContent);
  };
  const handleLater = () => console.log('WhatsApp: Later');
  const handleSend = () => console.log('WhatsApp: Send', { draftContent, objective, contextPayload, source });

  // useEffect(() => {
  //   registerFooter?.({ cancel: handleCancel, copy: handleCopy, later: handleLater, send: handleSend });
  //   return () => registerFooter?.(null);
  // }, [registerFooter, draftContent, objective, tone, contextPayload]);


  const [userTitle, setUserTitle] = useState('');
  const [userName, setUserName] = useState('');
  const [stage, setStage] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  useEffect(() => {
    const parsedContextPayload = JSON.parse(JSON.stringify(contextPayload ?? {}));
    if (source === 'leads') {
      const raw = parsedContextPayload?.lead?.contact_persons;
      let contactPersons: Array<{ title?: string; name?: string; phone?: string; phone_country_code?: string; email?: string }> = [];
      if (raw != null) {
        if (typeof raw === 'string') {
          try {
            contactPersons = JSON.parse(raw) as typeof contactPersons;
          } catch {
            contactPersons = [];
          }
        } else if (Array.isArray(raw)) {
          contactPersons = raw as typeof contactPersons;
        }
      }
      const first = contactPersons[0];
      if (first) {
        setUserTitle(first.title ?? '');
        setUserName(first.name ?? parsedContextPayload?.lead?.name ?? '');
        const phone = [first.phone_country_code, first.phone].filter(Boolean).join('').trim();
        setContactPhone(phone || '');
        setContactEmail(first.email ?? '');
      } else {
        setUserTitle('');
        setUserName(parsedContextPayload?.lead?.name ?? '');
        setContactPhone('');
        setContactEmail('');
      }
      setStage(parsedContextPayload?.lead?.stage?.name ?? '');
    } else if (source === 'deals') {
      setUserTitle('');
      setUserName(parsedContextPayload?.deal?.fullData?.title ?? parsedContextPayload?.deal?.name ?? '');
      setStage(parsedContextPayload?.deal?.stage?.name ?? '');
      setContactPhone('');
      setContactEmail('');
    } else if (source === 'orders') {
      setUserTitle('');
      setUserName(parsedContextPayload?.order?.fullData?.order_number ?? parsedContextPayload?.order?.order_number ?? '');
      setStage(parsedContextPayload?.order?.stage?.name ?? '');
      setContactPhone('');
      setContactEmail('');
    }
  }, [contextPayload, source]);

  const [chats, setChats] = useState<WhatsAppChatItem[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  useEffect(() => {
    const fetchChats = async () => {
      setChatsLoading(true);
      try {
        const res = await getChats() as { data?: WhatsAppChatItem[] };
        setChats(Array.isArray(res?.data) ? res.data : []);
      } catch (e) {
        console.error('Failed to fetch chats', e);
        setChats([]);
      } finally {
        setChatsLoading(false);
      }
    };
    fetchChats();
  }, []);

  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [viewChatMessages, setViewChatMessages] = useState<WhatsAppMessage[]>([]);
  const [chatWindowInfo, setChatWindowInfo] = useState<{
    phone_number?: string;
    is_within_24h_window?: boolean;
    window_started_at?: string;
    window_minutes_remaining?: number;
  } | null>(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  useEffect(() => {
    if (selectedChat == null) {
      setViewChatMessages([]);
      setChatWindowInfo(null);
      return;
    }
    const fetchMessages = async () => {
      setMessagesLoading(true);
      try {
        const res = await getWhatsAppChatMessages({ chat_id: String(selectedChat) }) as {
          messages?: WhatsAppMessage[];
          chat?: { phone_number?: string; is_within_24h_window?: boolean; window_started_at?: string; window_minutes_remaining?: number };
        };
        setViewChatMessages(Array.isArray(res?.messages) ? res.messages : []);
        setChatWindowInfo(res?.chat ?? null);
      } catch (e) {
        console.error('Failed to fetch chat messages', e);
        setViewChatMessages([]);
        setChatWindowInfo(null);
      } finally {
        setMessagesLoading(false);
      }
    };
    fetchMessages();
  }, [selectedChat]);

  const [sendMode, setSendMode] = useState<'two-way' | 'template'>('two-way');
  const [sendPhone, setSendPhone] = useState('');
  const [templateValue, setTemplateValue] = useState('');
  const [sendMessageText, setSendMessageText] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [customSendPrompt, setCustomSendPrompt] = useState('');
  const [sendGenerateLoading, setSendGenerateLoading] = useState(false);
  const [sendPhoneError, setSendPhoneError] = useState<string | null>(null);
  useEffect(() => {
    if (contactPhone) setSendPhone(contactPhone);
  }, [contactPhone]);

  const isSendPhoneE164 = (value: string): boolean => {
    if (!value.trim()) return false;
    const parsed = parsePhoneNumber(value.trim());
    return parsed?.isValid() ?? false;
  };

  const sanitizePhoneInput = (value: string): string => {
    const hasPlus = value.startsWith('+');
    const digits = value.replace(/\D/g, '');
    return hasPlus ? `+${digits}` : digits;
  };

  const handleSendSectionGenerate = async () => {
    const query = customSendPrompt.trim();
    if (!query) return;
    setSendGenerateLoading(true);
    try {
      const res = await generateWhatsApp({
        query,
        ...(source === 'leads' && { lead: contextPayload?.lead }),
        ...(source === 'deals' && { deal: contextPayload?.deal }),
        ...(source === 'orders' && { order: contextPayload?.order }),
        tone: commonOptions.tone,
        urgency: commonOptions.urgency,
        industry: commonOptions.industry === 'custom' ? commonOptions.customIndustry : commonOptions.industry,
        cta_type: commonOptions.ctaType === 'custom' ? commonOptions.customCtaType : commonOptions.ctaType,
        language: commonOptions.language === 'custom' ? commonOptions.customLanguage : commonOptions.language,
        emoji_level: emojiLevel,
      });
      setSendMessageText(res.result ?? '');
    } catch (err) {
      console.error('WhatsApp generate for send failed:', err);
    } finally {
      setSendGenerateLoading(false);
    }
  };

  const handleSendMessage = async () => {
    const phone = sendPhone.trim();
    if (!phone) {
      setSendPhoneError('Phone number is required.');
      return;
    }
    if (!isSendPhoneE164(phone)) {
      setSendPhoneError('Please enter a valid phone number in E.164 format (e.g. +97143035555).');
      return;
    }
    setSendPhoneError(null);
    setSendLoading(true);
    try {
      if (sendMode === 'two-way') {
        await sendWhatsApp({ number: phone, message: sendMessageText || generatedContent });
      } else {
        await sendWhatsApp({ number: phone, content_sid: templateValue, content_variables: undefined });
      }
      setSendMessageText('');
    } catch (e) {
      console.error('Send WhatsApp failed', e);
    } finally {
      setSendLoading(false);
    }
  };

  const [replyQuery, setReplyQuery] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [replyContentSid, setReplyContentSid] = useState('');
  const [replyGenerateLoading, setReplyGenerateLoading] = useState(false);
  const [replySendLoading, setReplySendLoading] = useState(false);
  const handleReplyAutoGenerate = async () => {
    const query = replyQuery.trim();
    if (!query || !chatWindowInfo?.phone_number) return;
    setReplyGenerateLoading(true);
    try {
      const res = await generateWhatsApp({ query, previous_content: replyMessage || undefined });
      setReplyMessage(res.result ?? '');
    } catch (e) {
      console.error('Reply generate failed', e);
    } finally {
      setReplyGenerateLoading(false);
    }
  };
  const handleReplySend = async () => {
    const phone = chatWindowInfo?.phone_number?.trim();
    if (!phone) return;
    setReplySendLoading(true);
    try {
      if (replyContentSid) {
        await sendWhatsApp({ number: phone, content_sid: replyContentSid, content_variables: undefined });
      } else {
        await sendWhatsApp({ number: phone, message: replyMessage });
      }
      setReplyMessage('');
      if (selectedChat != null) {
        const res = await getWhatsAppChatMessages({ chat_id: String(selectedChat) }) as { messages?: WhatsAppMessage[] };
        setViewChatMessages(Array.isArray(res?.messages) ? res.messages : []);
      }
    } catch (e) {
      console.error('Reply send failed', e);
    } finally {
      setReplySendLoading(false);
    }
  };

  return (
    <div className="h-100 d-flex flex-column min-h-0">
      
    <Row className="mb-4 flex-grow-1 min-h-0" style={{ flexWrap: 'nowrap' }}>
          <Col md={3} className="border-end d-flex flex-column min-h-0" style={{ overflowY: 'auto' }}>
            {chatsLoading ? (
              <div className="d-flex flex-column align-items-center justify-content-center gap-2 py-4">
                <span className="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true" />
                <span className="small text-muted">Loading chats...</span>
              </div>
            ) : chats.length === 0 ? (
              <div className="d-flex flex-column align-items-center justify-content-center py-4 px-3 text-center">
                <MessageCircle size={40} className="text-muted mb-2" strokeWidth={1.2} />
                <h6 className="fw-semibold text-muted mb-1">No chats yet</h6>
                <p className="small text-muted mb-0" style={{ maxWidth: '240px' }}>
                  WhatsApp chats will appear here. Start a new message below to send.
                </p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-1">
                {selectedChat != null && (
                  <Button  className="mb-2" variant="outline-primary" onClick={() => setSelectedChat(null)}>
                    <MessageCircle size={16} className="me-1" />
                    New message
                  </Button>
                )}

                {chats.map((chat) => (
                  <Card
                    key={chat.id}
                    className={`cursor-pointer mb-2 ${selectedChat === chat.id ? 'border-primary bg-light' : ''}`}
                    onClick={() => setSelectedChat(chat.id)}
                  >
                    <Card.Body className="py-2 px-3">
                      <div className="fw-semibold small text-truncate">{chat.phone_number}</div>
                      <div className="small text-muted text-truncate">
                        {chat.last_message_preview || 'No messages'}
                      </div>
                      {chat.last_message_at && (
                        <small className="text-muted text-nowrap">{chat.last_message_at? moment(chat.last_message_at).format(GlobalDateTimeFormat) : ''}</small>
                      )}
                    </Card.Body>
                  </Card>
                ))}
              </div>
            )}
          </Col>
          <Col md={9}>
            {selectedChat == null ? (
              <Card className="border">
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Mode</Form.Label>
                    <Form.Select value={sendMode} onChange={(e) => setSendMode(e.target.value as 'two-way' | 'template')}>
                      <option value="two-way">Two way communication</option>
                      <option value="template">Template</option>
                    </Form.Select>
                  </Form.Group>
                  {sendMode === 'template' && (
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Template (content_sid / value)</Form.Label>
                      <Form.Control
                        value={templateValue}
                        onChange={(e) => setTemplateValue(e.target.value)}
                        placeholder="Template SID or selected value"
                      />
                    </Form.Group>
                  )}
                  {sendMode === 'two-way' && (
                  <>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Phone number (E.164)</Form.Label>
                    <Form.Control
                      type="tel"
                      value={sendPhone}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const sanitized = sanitizePhoneInput(raw);
                        setSendPhone(sanitized);
                        if (sendPhoneError) setSendPhoneError(null);
                      }}
                      onBlur={() => {
                        if (sendPhone.trim() && !isSendPhoneE164(sendPhone)) {
                          setSendPhoneError('Please enter a valid phone number in E.164 format (e.g. +97143035555).');
                        } else {
                          setSendPhoneError(null);
                        }
                      }}
                      placeholder="+97143035555"
                      isInvalid={!!sendPhoneError}
                    />
                    {sendPhoneError && (
                      <Form.Control.Feedback type="invalid">{sendPhoneError}</Form.Control.Feedback>
                    )}
                  </Form.Group>
                  {sendMode === 'two-way' && (
                    <>

{commonOptions != null && setCommonOptions != null && (
        <>
        <Row>
        <CommonOptionsFields commonOptions={commonOptions} setCommonOptions={setCommonOptions} />
        <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold">Emoji Level</Form.Label>
          <Form.Select
          value={emojiLevel}
          onChange={(e) => setEmojiLevel(e.target.value)}
          >
          <option value="none">None</option>
          <option value="minimal">Minimal</option>
          <option value="moderate">Moderate</option>
          <option value="high">High</option>
          </Form.Select>
        </Form.Group>
        </Col>
        </Row>
        </>
      )}
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Custom message (prompt for AI)</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={1}
                        value={customSendPrompt}
                        onChange={(e) => setCustomSendPrompt(e.target.value)}
                        placeholder="Describe what you want to say..."
                      />
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="mt-2"
                        onClick={handleSendSectionGenerate}
                        disabled={sendGenerateLoading || !customSendPrompt.trim()}
                      >
                        {sendGenerateLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles size={16} className="me-1" />
                            Generate from AI
                          </>
                        )}
                      </Button>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Message</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={sendMessageText}
                        onChange={(e) => setSendMessageText(e.target.value)}
                        placeholder="Type message or use generated content above"
                      />
                    </Form.Group>
                    <Button
                      variant="primary"
                      onClick={handleSendMessage}
                      disabled={sendLoading || !sendPhone.trim() || !isSendPhoneE164(sendPhone)}
                    >
                      {sendLoading ? 'Sending...' : 'Send'}
                    </Button>
                    </>
                  )}
                  </>
                  )}
                </Card.Body>
              </Card>
            ) : (
              <Card className="border">
                <Card.Body className="p-3">
                  {/* Header: Chat with +number, Real-time updates, Xh Xm remaining */}
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <div className="fw-semibold" style={{ fontSize: '1.05rem' }}>
                        Chat with {chatWindowInfo?.phone_number ?? '—'}
                      </div>
                      <div className="d-flex align-items-center gap-1 mt-1 small text-muted">
                        <span className="rounded-circle bg-success d-inline-block" style={{ width: 6, height: 6 }} />
                        Real-time updates active
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      
                      <div className="d-flex align-items-center gap-1 small text-muted">
                      {chatWindowInfo?.is_within_24h_window !== false && (() => {
                        let minutesRemaining = chatWindowInfo?.window_minutes_remaining;
                        if (minutesRemaining == null && chatWindowInfo?.window_started_at) {
                          const start = new Date(chatWindowInfo.window_started_at).getTime();
                          const end = start + 24 * 60 * 60 * 1000;
                          minutesRemaining = Math.max(0, Math.floor((end - Date.now()) / 60000));
                        }
                        if (minutesRemaining == null || minutesRemaining <= 0) return null;
                        const h = Math.floor(minutesRemaining / 60);
                        const m = minutesRemaining % 60;
                        return (
                          <>
                            <span className="rounded-circle bg-success d-inline-block" style={{ width: 6, height: 6 }} />
                            {h}h {m}m remaining
                          </>
                        );
                      })()}
                      </div>
                    </div>
                  </div>

                  {/* Message list */}
                  {messagesLoading ? (
                    <div className="small text-muted py-3">Loading messages...</div>
                  ) : viewChatMessages.length === 0 ? (
                    <div className="small text-muted py-3">No messages in this chat</div>
                  ) : (
                    <div className="d-flex flex-column gap-2 mb-3" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                      {viewChatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`d-flex ${msg.direction === 'outbound' ? 'justify-content-end' : 'justify-content-start'}`}
                        >
                          <div
                            className={`rounded-3 px-3 py-2  ${msg.direction === 'outbound' ? 'bg-primary text-white' : 'bg-light text-dark border'}`}
                            style={{ maxWidth: '85%' }}
                          >
                            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.message}</div>
                            <div className={`d-flex align-items-center gap-2 mt-1 ${msg.direction === 'outbound' ? 'justify-content-end' : 'justify-content-start'}`}>
                              <small className={msg.direction === 'outbound' ? 'text-white-50' : 'text-muted'}>
                                {msg.created_at? moment(msg.created_at).format(GlobalDateTimeFormat) : ''}
                              </small>
                              {msg.status && (
                                <small className={msg.direction === 'outbound' ? 'text-success' : 'text-muted'}>{msg.status}</small>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  

                  {/* Input area: Query for AI, Message, Content SID, Auto Generate, Send */}
                  <div className="border-top pt-3">
                    <Form.Group className="mb-2">
                      <Form.Label className="small fw-semibold text-muted">Query for AI (optional)</Form.Label>
                      <div className="d-flex gap-2 align-items-center">
                        <Form.Control
                          size="sm"
                          className="flex-grow-1"
                          value={replyQuery}
                          onChange={(e) => setReplyQuery(e.target.value)}
                          placeholder="e.g. Write a WhatsApp message to confirm the meeting time."
                        />
                        <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={handleReplyAutoGenerate}
                        style={{ minWidth: '120px' }}
                        disabled={replyGenerateLoading || !replyQuery.trim()}
                      >
                        {replyGenerateLoading ? 'Generating...' : 'Auto Generate'}
                      </Button>
                      </div>
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="small"
                        style={{ resize: 'vertical' }}
                      />
                    </Form.Group>
                    {/* <Form.Group className="mb-2">
                      <Form.Label className="small fw-semibold text-muted">Content SID (optional)</Form.Label>
                      <Form.Control
                        size="sm"
                        value={replyContentSid}
                        onChange={(e) => setReplyContentSid(e.target.value)}
                        placeholder="Content SID for template"
                      />
                    </Form.Group> */}
                    <div className="d-flex gap-2 justify-content-end">
                      {replyMessage && 
                      <Button
                       
                        variant="outline-primary"
                        onClick={() => setReplyMessage('')}
                      >
                        Clear
                      </Button>
                      }
                     
                      <Button
                        
                        variant="primary"
                        onClick={handleReplySend}
                        disabled={replySendLoading || (!replyMessage.trim() && !replyContentSid.trim())}
                      >
                        {replySendLoading ? 'Sending...' : 'Send WhatsApp Message'}
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>

    <Row className="g-4 d-none" >
      <Col lg={7}>
        
        <div className="small text-muted text-uppercase fw-semibold mb-3">WhatsApp section</div>
        {/* {source && (
          <div className="mb-3">
            <Badge bg="secondary" className="px-2 py-1">
              From: {source === 'leads' ? 'Leads' : source === 'deals' ? 'Deals' : 'Orders'}
            </Badge>
          </div>
        )} */}
        {/* {contextPayload && Object.keys(contextPayload).length > 0 && (
          <div className="mb-3 p-2 rounded border bg-light">
            <div className="small fw-semibold text-muted mb-1">Context payload</div>
            <pre className="mb-0 small" style={{ fontSize: '11px', maxHeight: '120px', overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {JSON.stringify(contextPayload, null, 2)}
            </pre>
          </div>
        )} */}

        {source && source === 'leads' && (userName || contactPhone || contactEmail || stage) && (
          <div className="d-flex flex-wrap gap-2 mb-4">
            {(userTitle || userName) && (
              <Badge bg="light" text="dark" className="px-3 py-2">{[userTitle, userName].filter(Boolean).join(' ')}</Badge>
            )}
            {stage && <Badge bg="light" text="dark" className="px-3 py-2">Stage: {stage}</Badge>}
            {contactPhone && <Badge bg="light" text="dark" className="px-3 py-2">Phone: {contactPhone}</Badge>}
            {contactEmail && <Badge bg="light" text="dark" className="px-3 py-2">Email: {contactEmail}</Badge>}
          </div>
        )}
        

        

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

        

        {/* <div className="mb-4">
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
        </div> */}

        <div className="mb-3 d-flex align-items-center gap-2 flex-wrap">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={handleSuggestDescription}
            disabled={descriptionSuggestLoading || generateLoading}
          >
            {descriptionSuggestLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                Getting suggestion...
              </>
            ) : (
              <>
                <Sparkles size={16} className="me-1" />
                Suggest description with AI
              </>
            )}
          </Button>
          <span className="text-muted small">AI will generate a prompt and fill it in Description below.</span>
        </div>

        <div className="mb-3">
          <Form.Label className="fw-semibold">Description sss</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            placeholder="Describe what you want to say (e.g. follow-up for a meeting, product intro...)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="font-monospace"
          />
          <Button
            variant="primary"
            size="sm"
            className="mt-2"
            onClick={handleAutoGenerate}
            disabled={generateLoading || !description.trim()}
          >
            {generateLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={16} className="me-1" />
                Auto Generate Content
              </>
            )}
          </Button>
        </div>
        <div className="mb-3">
          <Form.Label className="fw-semibold">Message</Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            value={generatedContent}
            onChange={(e) => setGeneratedContent(e.target.value)}
            placeholder="Generated message will appear here (or enter your own)"
            className="font-monospace"
          />
        </div>

        
        <Form.Check type="switch" id="activity-tracker-whatsapp" label="Log to Activity Tracker" className="mb-3" />
      </Col>

      <Col lg={5}>
        <div style={{ position: 'sticky', top: '20px' }} onClick={(e) => e.stopPropagation()}>
          <Form.Label className="fw-semibold mb-3">Live preview — WhatsApp</Form.Label>
          <Card className="border-0 shadow-sm" style={{ maxWidth: '400px', backgroundColor: '#e8f5e9' }}>
            <Card.Body>
              <div className="d-flex align-items-start gap-2 mb-2">
                <MessageCircle size={20} className="text-success mt-1" />
                <div className="flex-grow-1">
                  <div className="fw-semibold small">WhatsApp • {[userTitle, userName].filter(Boolean).join(' ') || 'Contact'}</div>
                  <Badge bg="success" className="small">Online</Badge>
                </div>
              </div>
              <Card className="mt-3 border-0 shadow-sm">
                <Card.Body className="bg-white">
                  {generatedContent ? (
                    <>
                      <p className="mb-0" style={{ whiteSpace: 'pre-line', fontSize: '0.95rem' }}>{generatedContent}</p>
                      {/* <div className="text-end mt-2">
                        <small className="text-muted d-flex align-items-center justify-content-end gap-1">
                          <Clock size={12} /> 11:02
                        </small>
                      </div> */}
                    </>
                  ) : (
                    <p className="mb-0 text-muted small" style={{ fontSize: '0.875rem' }}>
                      No description provided.
                    </p>
                  )}
                </Card.Body>
              </Card>
            </Card.Body>
          </Card>
        </div>
      </Col>
    </Row>
    </div>
  );
};

export default WhatsAppSection;
