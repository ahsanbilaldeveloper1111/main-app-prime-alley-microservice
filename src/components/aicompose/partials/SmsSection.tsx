import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Form, Button, Card, Badge, Modal, Pagination } from 'react-bootstrap';
import { MessageSquare, Clock, Sparkles } from 'lucide-react';
import { useSession } from 'next-auth/react';
import type { RegisterFooter, ChannelSectionContext } from '../types';
import { getContextSource } from '../types';
import { sendSms, getSmsList, generateSms } from '@utils/communication';
import type { SmsListItem, SmsListMeta } from '@utils/communication';
import moment from 'moment-timezone';
import { GlobalDateTimeFormat } from '@utils/Helper';

const DEFAULT_MESSAGE = 'Hi, this is PrimeAlley. Can we schedule a 10-min call this week?';

const SmsSection: React.FC<{ registerFooter?: RegisterFooter } & ChannelSectionContext> = ({
  registerFooter,
  contextPayload,
}) => {
  const { data: session } = useSession();
  const source = getContextSource(contextPayload);

  const [sendTo, setSendTo] = useState('');
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [sendLoading, setSendLoading] = useState(false);
  const [customSendPrompt, setCustomSendPrompt] = useState('');
  const [sendGenerateLoading, setSendGenerateLoading] = useState(false);

  const [smsList, setSmsList] = useState<SmsListItem[]>([]);
  const [smsLoading, setSmsLoading] = useState(false);
  const [smsMeta, setSmsMeta] = useState<SmsListMeta | null>(null);
  const [smsPage, setSmsPage] = useState(1);
  const [smsPerPage, setSmsPerPage] = useState(15);

  const extension = (session?.user as { extension?: string; phone?: string } | undefined)?.extension
    ?? (session?.user as { extension?: string; phone?: string } | undefined)?.phone
    ?? 'unknown';
  const tenantId = (session?.user as { tenant_id?: string; tenant?: string } | undefined)?.tenant_id
    ?? (session?.user as { tenant_id?: string; tenant?: string } | undefined)?.tenant
    ?? '';

  const fetchSms = useCallback(async (page: number, perPage: number) => {
    setSmsLoading(true);
    try {
      const res = await getSmsList({
        page: String(page),
        per_page: String(perPage),
        ...(extension && extension !== 'unknown' ? { user_extension: extension } : {}),
      });
      setSmsList(Array.isArray(res?.data) ? res.data : []);
      setSmsMeta(res?.meta ?? null);
    } catch (e) {
      console.error('Failed to fetch SMS list', e);
      setSmsList([]);
      setSmsMeta(null);
    } finally {
      setSmsLoading(false);
    }
  }, [extension]);

  useEffect(() => {
    fetchSms(smsPage, smsPerPage);
  }, [smsPage, smsPerPage, fetchSms]);

  const [contactPhone, setContactPhone] = useState('');
  useEffect(() => {
    const payload = contextPayload ?? {} as Record<string, unknown>;
    if (source === 'leads' && payload?.lead) {
      const lead = payload.lead as Record<string, unknown>;
      const raw = lead?.contact_persons;
      let persons: Array<{ phone?: string; phone_country_code?: string }> = [];
      if (raw != null) {
        if (typeof raw === 'string') {
          try {
            persons = JSON.parse(raw) as typeof persons;
          } catch {
            persons = [];
          }
        } else if (Array.isArray(raw)) {
          persons = raw as typeof persons;
        }
      }
      const first = persons[0];
      const phone = first ? [first.phone_country_code, first.phone].filter(Boolean).join('').trim() : '';
      setContactPhone(phone || '');
    } else {
      setContactPhone('');
    }
  }, [source, contextPayload]);

  useEffect(() => {
    if (contactPhone) setSendTo(contactPhone);
  }, [contactPhone]);

  const handleAutoGenerate = async () => {
    const query = customSendPrompt.trim()
      || 'Write a short, professional SMS message (concise, suitable for text).';
    setSendGenerateLoading(true);
    try {
      const res = await generateSms({
        query,
        previous_content: message.trim() || undefined,
        ...(source === 'leads' && { lead: contextPayload?.lead }),
        ...(source === 'deals' && { deal: contextPayload?.deal }),
        ...(source === 'orders' && { order: contextPayload?.order }),
        tone: 'professional',
        language: 'en',
      });
      setMessage((res.result ?? '').trim() || message);
    } catch (err) {
      console.error('SMS auto-generate failed:', err);
    } finally {
      setSendGenerateLoading(false);
    }
  };

  const handleSendSms = async () => {
    const to = sendTo.trim();
    const body = message.trim();
    if (!to || !body) return;
    if (!tenantId) {
      console.warn('SMS: tenant_id not in session; backend may reject or derive from auth.');
    }
    setSendLoading(true);
    try {
      await sendSms({
        to,
        message: body,
        tenant_id: tenantId || 'default',
        extension,
      });
      setMessage(DEFAULT_MESSAGE);
      await fetchSms(smsPage, smsPerPage);
    } catch (e) {
      console.error('Send SMS failed', e);
    } finally {
      setSendLoading(false);
    }
  };

  const handleCancel = () => console.log('SMS: Cancel');
  const handleCopy = () => {
    const text = message.trim();
    if (typeof navigator !== 'undefined' && navigator.clipboard && text) {
      navigator.clipboard.writeText(text);
    }
  };
  const handleLater = () => console.log('SMS: Later');
  const handleSend = () => handleSendSms();

  useEffect(() => {
    registerFooter?.({ cancel: handleCancel, copy: handleCopy, later: handleLater, send: handleSend });
    return () => registerFooter?.(null);
  }, [registerFooter, message, sendTo]);

  const [selectedSmsId, setSelectedSmsId] = useState<number | null>(null);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const selectedSms =
    selectedSmsId === null ? null : smsList.find((s) => s.id === selectedSmsId) ?? null;

  const displayMessage = message.trim() || '(No message)';

  return (
    <div className="h-100 d-flex flex-column min-h-0">
      <Row className="mb-4 flex-grow-1 min-h-0">
        <Col xs={12}>
          <Row className="g-4">
            <Col lg={7}>
              <Card className="border">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                    <div>
                      <h5 className="fw-bold mb-1">Send SMS</h5>
                      <p className="text-muted small mb-0">Send SMS to a recipient</p>
                    </div>
                  </div>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">To (phone, E.164)</Form.Label>
                    <Form.Control
                      type="tel"
                      value={sendTo}
                      onChange={(e) => setSendTo(e.target.value)}
                      placeholder="+971501234567"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Query for AI (optional)</Form.Label>
                    <Form.Control
                      type="text"
                      value={customSendPrompt}
                      onChange={(e) => setCustomSendPrompt(e.target.value)}
                      placeholder="e.g. Follow-up for a meeting, or confirm appointment time"
                    />
                    <Form.Text className="text-muted">
                      Leave empty to use a default prompt for a short professional SMS.
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">Message (max 1600 chars)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="SMS body"
                      className="font-monospace"
                      maxLength={1600}
                    />
                    <Form.Text className="text-muted">{message.length} / 1600</Form.Text>
                  </Form.Group>

                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-dark"
                      onClick={() => void handleAutoGenerate()}
                      disabled={sendGenerateLoading}
                    >
                      {sendGenerateLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} className="me-1" />
                          Auto Generate
                        </>
                      )}
                    </Button>
                    <Button
                      variant="dark"
                      onClick={() => void handleSendSms()}
                      disabled={sendLoading || !sendTo.trim() || !message.trim()}
                    >
                      {sendLoading ? 'Sending...' : 'Send SMS'}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={5}>
              <div style={{ position: 'sticky', top: '20px' }} onClick={(e) => e.stopPropagation()}>
                <Form.Label className="fw-semibold mb-3">Live preview — SMS</Form.Label>
                <Card className="border-0 shadow-sm" style={{ maxWidth: '400px', backgroundColor: '#e3f2fd' }}>
                  <Card.Body>
                    <div className="d-flex align-items-start gap-2 mb-2">
                      <MessageSquare size={20} className="text-primary mt-1" />
                      <div className="flex-grow-1">
                        <div className="fw-semibold small">SMS · {sendTo || 'Recipient'}</div>
                        <Badge bg="primary" className="small">Outbound</Badge>
                      </div>
                    </div>
                    <Card className="mt-3 border-0 shadow-sm">
                      <Card.Body className="bg-white" style={{ maxHeight: '284px', overflowY: 'auto' }}>
                        <p className="mb-0" style={{ whiteSpace: 'pre-line', fontSize: '0.95rem' }}>{displayMessage}</p>
                        <div className="text-end mt-2">
                          <small className="text-muted d-flex align-items-center justify-content-end gap-1">
                            <Clock size={12} /> Preview
                          </small>
                        </div>
                      </Card.Body>
                    </Card>
                  </Card.Body>
                </Card>
              </div>
            </Col>
          </Row>
        </Col>
      </Row>

      <Row className="mt-3">
        <Col xs={12}>
          <Card className="border">
            <Card.Body>
              <h6 className="fw-semibold mb-3">Sent SMS</h6>
              {smsLoading ? (
                <div className="d-flex flex-column align-items-center justify-content-center gap-2 py-4">
                  <span className="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true" />
                  <span className="small text-muted">Loading SMS...</span>
                </div>
              ) : smsList.length === 0 ? (
                <div className="d-flex flex-column align-items-center justify-content-center py-5 px-3 text-center">
                  <MessageSquare size={48} className="text-muted mb-3" strokeWidth={1.2} />
                  <h6 className="fw-semibold text-muted mb-1">No SMS yet</h6>
                  <p className="small text-muted mb-0" style={{ maxWidth: '280px' }}>
                    SMS you send will appear here.
                  </p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {smsList.map((sms) => (
                    <Card
                      key={sms.id}
                      role="button"
                      tabIndex={0}
                      className={`cursor-pointer position-relative ${selectedSmsId === sms.id ? 'border-primary bg-light' : ''}`}
                      onClick={() => {
                        setSelectedSmsId(sms.id);
                        setShowSmsModal(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedSmsId(sms.id);
                          setShowSmsModal(true);
                        }
                      }}
                    >
                      <Card.Body className="py-2 px-3">
                        {sms.status != null && (
                          <Badge
                            bg={
                              sms.status === 'sent'
                                ? 'success'
                                : sms.status === 'failed'
                                  ? 'danger'
                                  : 'secondary'
                            }
                            className="position-absolute top-0 end-0 m-2"
                          >
                            {sms.status}
                          </Badge>
                        )}
                        <div className="fw-semibold small text-truncate">To: {sms.to}</div>
                        <div className="small text-muted text-truncate">{sms.message || '—'}</div>
                        {sms.created_at && (
                          <small className="text-muted text-nowrap">
                            {moment(sms.created_at).format(GlobalDateTimeFormat)}
                          </small>
                        )}
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
              {smsMeta && (smsMeta.total > 0 || smsList.length > 0) && (
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3 pt-3 border-top">
                  <div className="d-flex align-items-center gap-2">
                    <span className="small text-muted">Per page:</span>
                    <Form.Select
                      size="sm"
                      style={{ width: 'auto' }}
                      value={smsPerPage}
                      onChange={(e) => {
                        setSmsPerPage(Number(e.target.value));
                        setSmsPage(1);
                      }}
                    >
                      {[5, 10, 15, 25, 50].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </Form.Select>
                    <span className="small text-muted">
                      {smsMeta.from != null && smsMeta.to != null
                        ? `Showing ${smsMeta.from}–${smsMeta.to} of ${smsMeta.total}`
                        : `Total ${smsMeta.total}`}
                    </span>
                  </div>
                  {smsMeta.last_page > 1 && (
                    <Pagination className="mb-0 flex-wrap gap-1">
                      <Pagination.Prev
                        disabled={smsPage <= 1}
                        onClick={(e) => { e.preventDefault(); setSmsPage((p) => Math.max(1, p - 1)); }}
                      />
                      {Array.from({ length: smsMeta.last_page }, (_, i) => i + 1).map((p) => (
                        <Pagination.Item
                          key={p}
                          active={p === smsPage}
                          onClick={(e) => { e.preventDefault(); setSmsPage(p); }}
                        >
                          {p}
                        </Pagination.Item>
                      ))}
                      <Pagination.Next
                        disabled={smsPage >= smsMeta.last_page}
                        onClick={(e) => { e.preventDefault(); setSmsPage((p) => Math.min(smsMeta.last_page, p + 1)); }}
                      />
                    </Pagination>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showSmsModal && selectedSms != null} onHide={() => { setShowSmsModal(false); setSelectedSmsId(null); }} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>SMS to {selectedSms?.to ?? '—'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSms != null && (
            <>
              <div className="small text-muted mb-2">
                To: {selectedSms.to}
                {' · '}
                From (extension): {selectedSms.created_by ?? '—'}
              </div>
              <div className="small text-muted mb-2">
                {selectedSms.created_at && moment(selectedSms.created_at).format(GlobalDateTimeFormat)}
                {selectedSms.status != null && (
                  <Badge
                    bg={
                      selectedSms.status === 'sent'
                        ? 'success'
                        : selectedSms.status === 'failed'
                          ? 'danger'
                          : 'secondary'
                    }
                    className="ms-2"
                  >
                    {selectedSms.status}
                  </Badge>
                )}
              </div>
              {selectedSms.error_message && (
                <div className="small text-danger mb-2">{selectedSms.error_message}</div>
              )}
              <div className="rounded border bg-light p-3" style={{ whiteSpace: 'pre-wrap' }}>
                {selectedSms.message || '—'}
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default SmsSection;
