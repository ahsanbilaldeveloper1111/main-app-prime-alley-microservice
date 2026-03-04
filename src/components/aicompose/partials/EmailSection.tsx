import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Card, Badge, Modal, Pagination } from 'react-bootstrap';
import { Mail, Sparkles } from 'lucide-react';
import type { RegisterFooter, ChannelSectionContext } from '../types';
import { getContextSource } from '../types';
import { generateEmail, getEmails, sendEmail } from '@utils/communication';
import { usePermissions } from '@utils/permissionUtils';
import { HEADER_CONSTANTS } from '@constants/headerConstants';

const { PERMISSIONS: P } = HEADER_CONSTANTS;
import moment from 'moment-timezone';
import { GlobalDateTimeFormat } from '@utils/Helper';
import CommonOptionsFields from './CommonOptionsFields';

/** Pagination meta from GET emails response */
interface EmailsMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}

/** Email item from GET emails response (data array item) */
interface EmailItem {
  id: number | string;
  subject?: string;
  from?: string;
  to?: string | string[];
  content?: string;
  content_type?: string;
  created_by?: string;
  cc?: string[] | null;
  bcc?: string[] | null;
  reply_to?: string | null;
  attachments?: string[] | null;
  status?: string;
  status_code?: string;
  error_message?: string | null;
  snippet?: string;
  body_preview?: string;
  created_at?: string;
  date?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

/** Extract HTML from content (strip markdown code fence if present) */
function getEmailPreviewHtml(content: string | undefined): string {
  if (!content || typeof content !== 'string') return '';
  const raw = content.trim();
  const htmlMatch = raw.match(/^```html?\s*([\s\S]*?)```$/im) ?? raw.match(/^```\s*([\s\S]*?)```$/im);
  return htmlMatch ? htmlMatch[1].trim() : raw;
}

const KEY_POINTS = [
  { id: '1', label: 'Need', value: 'consultation' },
  { id: '2', label: 'CTA', value: 'pick time' },
  { id: '3', label: 'Offer', value: 'quick demo' },
];

const EmailSection: React.FC<{ registerFooter?: RegisterFooter } & ChannelSectionContext> = ({ registerFooter, contextPayload, commonOptions: commonOptionsProp, setCommonOptions, moduleSlug }) => {
  const { hasPermission } = usePermissions();
  const canSend = hasPermission(P.SEND_EMAIL_CRM);
  const canView = hasPermission(P.VIEW_EMAILS_CRM);
  const commonOptions = commonOptionsProp ?? { industry: '', customIndustry: '', tone: 'professional', language: 'en', customLanguage: '', urgency: 'normal', ctaType: '', customCtaType: '' };
  const [description, setDescription] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [generateLoading, setGenerateLoading] = useState(false);
  const [contentType, setContentType] = useState('text/html');
  const [emailStyle, setEmailStyle] = useState('modern');
  const [emailLength, setEmailLength] = useState('medium');
  const [descriptionSuggestLoading, setDescriptionSuggestLoading] = useState(false);

  const source = getContextSource(contextPayload);


  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [emailsMeta, setEmailsMeta] = useState<EmailsMeta | null>(null);
  const [emailsPage, setEmailsPage] = useState(1);
  const [emailsPerPage, setEmailsPerPage] = useState(15);

  const fetchEmails = React.useCallback(async (page: number, perPage: number) => {
    setEmailsLoading(true);
    try {
      const res = (await getEmails({
        page: String(page),
        per_page: String(perPage),
        ...(moduleSlug ? { module_slug: moduleSlug } : {}),
      })) as { data?: EmailItem[]; meta?: EmailsMeta };
      setEmails(Array.isArray(res?.data) ? res.data : []);
      if (res?.meta) setEmailsMeta(res.meta);
      else setEmailsMeta(null);
    } catch (e) {
      console.error('Failed to fetch emails', e);
      setEmails([]);
      setEmailsMeta(null);
    } finally {
      setEmailsLoading(false);
    }
  }, [moduleSlug]);

  useEffect(() => {
    fetchEmails(emailsPage, emailsPerPage);
  }, [emailsPage, emailsPerPage, fetchEmails]);

  const [selectedEmailId, setSelectedEmailId] = useState<number | string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const selectedEmail = selectedEmailId != null ? emails.find((e) => e.id === selectedEmailId) ?? null : null;

  const handleSuggestDescription = async () => {
    setDescriptionSuggestLoading(true);
    try {
      const res = await generateEmail({
        query: description,
        ...(source === 'leads' && { lead: contextPayload?.lead }),
        ...(source === 'deals' && { deal: contextPayload?.deal }),
        ...(source === 'orders' && { order: contextPayload?.order }),
        tone: commonOptions.tone,
        urgency: commonOptions.urgency,
        industry: commonOptions.industry === 'custom' ? commonOptions.customIndustry : commonOptions.industry,
        cta_type: commonOptions.ctaType === 'custom' ? commonOptions.customCtaType : commonOptions.ctaType,
        language: commonOptions.language === 'custom' ? commonOptions.customLanguage : commonOptions.language,
        email_style: emailStyle,
        email_length: emailLength,
      });
      const suggested = (res.result ?? '').trim();
      if (suggested) setDescription(suggested);
    } catch (err) {
      console.error('Email suggest description failed:', err);
    } finally {
      setDescriptionSuggestLoading(false);
    }
  };

  const handleAutoGenerate = async () => {
    const query = description.trim();
    if (!query) return;
    setGenerateLoading(true);
    try {
      const res = await generateEmail({
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
        email_style: emailStyle,
        email_length: emailLength,
      });
      setGeneratedContent(res.result ?? '');
    } catch (err) {
      console.error('Email generate failed:', err);
      setGeneratedContent('');
    } finally {
      setGenerateLoading(false);
    }
  };

  const [sendTo, setSendTo] = useState('');
  const [sendSubject, setSendSubject] = useState('');
  const [sendBody, setSendBody] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [customSendPrompt, setCustomSendPrompt] = useState('');
  const [sendGenerateLoading, setSendGenerateLoading] = useState(false);

  const handleSendSectionGenerate = async () => {
    const explicitQuery = customSendPrompt.trim();
    const query = explicitQuery
      ? explicitQuery
      : `Write an email. Subject: ${sendSubject.trim() || '(no subject)'}. Recipient(s): ${sendTo.trim() || '(not specified)'}.`;
    setSendGenerateLoading(true);
    try {
      const res = await generateEmail({
        query,
        ...(source === 'leads' && { lead: contextPayload?.lead }),
        ...(source === 'deals' && { deal: contextPayload?.deal }),
        ...(source === 'orders' && { order: contextPayload?.order }),
        tone: commonOptions.tone,
        urgency: commonOptions.urgency,
        industry: commonOptions.industry === 'custom' ? commonOptions.customIndustry : commonOptions.industry,
        cta_type: commonOptions.ctaType === 'custom' ? commonOptions.customCtaType : commonOptions.ctaType,
        language: commonOptions.language === 'custom' ? commonOptions.customLanguage : commonOptions.language,
      });
      const content = res.result ?? '';
      setSendBody(content);
      setGeneratedContent(content);
    } catch (err) {
      console.error('Email generate for send failed:', err);
    } finally {
      setSendGenerateLoading(false);
    }
  };

  const handleSendEmail = async () => {
    const to = sendTo.trim();
    const subject = sendSubject.trim();
    const content = sendBody.trim() || generatedContent;
    if (!to) return;
    if (!subject) return;
    if (!content) return;
    setSendLoading(true);
    try {
      await sendEmail({
        to: to.includes(',') ? to.split(',').map((e) => e.trim()).filter(Boolean) : to,
        subject,
        content,
      });
      setSendBody('');
      setSendSubject('');
      setSendTo('');
      await fetchEmails(emailsPage, emailsPerPage);
    } catch (e) {
      console.error('Send email failed', e);
    } finally {
      setSendLoading(false);
    }
  };

  const handleCancel = () => console.log('Email: Cancel');
  const handleCopy = () => {
    const text = `Subject: ${sendSubject || '(no subject)'}\n\n${sendBody || generatedContent}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) navigator.clipboard.writeText(text);
  };
  const handleLater = () => console.log('Email: Later');
  const handleSend = () => handleSendEmail();

  useEffect(() => {
    registerFooter?.({ cancel: handleCancel, copy: handleCopy, later: handleLater, send: handleSend });
    return () => registerFooter?.(null);
  }, [registerFooter, sendSubject, sendBody, generatedContent]);

  const [userName, setUserName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  useEffect(() => {
    const payload = contextPayload ?? {} as Record<string, unknown>;
    if (source === 'leads' && payload?.lead) {
      const lead = payload.lead as Record<string, unknown>;
      const raw = lead?.contact_persons;
      let persons: Array<{ name?: string; email?: string }> = [];
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
      setUserName((first?.name as string) ?? (lead?.name as string) ?? '');
      setContactEmail((first?.email as string) ?? '');
    } else {
      setUserName('');
      setContactEmail('');
    }
  }, [source, contextPayload]);

  useEffect(() => {
    if (contactEmail) setSendTo(contactEmail);
  }, [contactEmail]);

  const displaySubject = sendSubject || '(No subject)';
  const displayBody = sendBody || generatedContent;

  if (!canSend && !canView) {
    return (
      <div className="d-flex align-items-center justify-content-center text-muted py-5">
        <p className="mb-0">You don&apos;t have permission to send or view emails here.</p>
      </div>
    );
  }

  return (
    <div className="h-100 d-flex flex-column min-h-0">
     
      <Row className="mb-4 flex-grow-1 min-h-0">
        <Col xs={12}>
          <>
              {canSend && (
              <Row className="g-4">
                <Col lg={7}>
                  <Card className="border">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                        <div>
                          <h5 className="fw-bold mb-1">Send Email</h5>
                          <p className="text-muted small mb-0">Send formatted emails to recipients</p>
                        </div>
                        
                      </div>

                      {commonOptions != null && setCommonOptions != null && (
        <>
        <Row>
        <CommonOptionsFields commonOptions={commonOptions} setCommonOptions={setCommonOptions} />
        <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold">Email Style</Form.Label>
          <Form.Select
          value={emailStyle}
          onChange={(e) => setEmailStyle(e.target.value)}
          >
            <option value="modern">Modern</option>
            <option value="corporate">Corporate</option>
            <option value="minimal">Minimal</option>
            <option value="promotional">Promotional</option>
          </Form.Select>
          
        </Form.Group>
        </Col>
        <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold">Email Length</Form.Label>
          <Form.Select
          value={emailLength}
          onChange={(e) => setEmailLength(e.target.value)}
          >
            <option value="brief">Brief</option>
            <option value="medium">Medium</option>
            <option value="detailed">Detailed</option>
          </Form.Select>
        </Form.Group>
        </Col>

        </Row>
        </>
      )}

                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">To (comma-separated)</Form.Label>
                        <Form.Control
                          type="text"
                          value={sendTo}
                          onChange={(e) => setSendTo(e.target.value)}
                          placeholder="email1@example.com, email2@example.com"
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Subject</Form.Label>
                        <Form.Control
                          value={sendSubject}
                          onChange={(e) => setSendSubject(e.target.value)}
                          placeholder="Email subject"
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Content Type</Form.Label>
                        <Form.Select
                          value={contentType}
                          onChange={(e) => setContentType(e.target.value)}
                        >
                          <option value="text/html">HTML</option>
                          <option value="text/plain">Plain Text</option>
                        </Form.Select>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Query for AI (optional)</Form.Label>
                        <Form.Control
                          value={customSendPrompt}
                          onChange={(e) => setCustomSendPrompt(e.target.value)}
                          placeholder="e.g. Write a follow-up about the pricing proposal."
                        />
                        <Form.Text className="text-muted">
                          Leave empty to auto-build from subject and recipient.
                        </Form.Text>
                      </Form.Group>

                      <Form.Group className="mb-4">
                        <Form.Label className="fw-semibold">Content</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={8}
                          value={sendBody || generatedContent}
                          onChange={(e) => {
                            const v = e.target.value;
                            setSendBody(v);
                            setGeneratedContent(v);
                          }}
                          placeholder="Email content (HTML supported)"
                          className="font-monospace"
                        />
                      </Form.Group>

                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-dark"
                          onClick={handleSendSectionGenerate}
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
                              Auto Generate Content
                            </>
                          )}
                        </Button>
                        <Button
                          variant="dark"
                          onClick={handleSendEmail}
                          disabled={sendLoading || !sendTo.trim() || !sendSubject.trim() || (!sendBody.trim() && !generatedContent)}
                        >
                          {sendLoading ? 'Sending...' : 'Send Email'}
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col lg={5}>
                  <div style={{ position: 'sticky', top: '20px' }} onClick={(e) => e.stopPropagation()}>
                    <Form.Label className="fw-semibold mb-3">Live preview — Email</Form.Label>
                    <Card className="border-0 shadow-sm" style={{  backgroundColor: '#ffebee' }}>
                      <Card.Body>
                        <div className="d-flex align-items-start gap-2 mb-2">
                          <Mail size={20} className="text-danger mt-1" />
                          <div className="flex-grow-1">
                            <div className="fw-semibold small">Email · {userName || sendTo || 'Recipient'}</div>
                            <Badge bg="danger" className="small">Draft</Badge>
                          </div>
                        </div>
                        <Card className="mt-3 border-0 shadow-sm">
                          <Card.Body className="bg-white">
                            <div className="fw-semibold small mb-2">{displaySubject}</div>
                            {displayBody ? (
                              <div
                                className="mb-0 email-preview-body"
                                style={{ fontSize: '0.95rem', overflow: 'auto', maxHeight: '400px' }}
                                dangerouslySetInnerHTML={{ __html: displayBody }}
                              />
                            ) : (
                              <p className="mb-0 text-muted small" style={{ fontSize: '0.875rem' }}>
                                No content yet.
                              </p>
                            )}
                            
                          </Card.Body>
                        </Card>
                      </Card.Body>
                    </Card>
                  </div>
                </Col>
              </Row>
              )}
            </>
        </Col>
      </Row>

      
        {canView && (
        <Row className="mt-3">
          <Col xs={12}>
            <Card className="border">
              <Card.Body>
                <h6 className="fw-semibold mb-3">Emails</h6>
                {emailsLoading ? (
                  <div className="d-flex flex-column align-items-center justify-content-center gap-2 py-4">
                    <span className="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true" />
                    <span className="small text-muted">Loading emails...</span>
                  </div>
                ) : emails.length === 0 ? (
                  <div className="d-flex flex-column align-items-center justify-content-center py-5 px-3 text-center">
                    <Mail size={48} className="text-muted mb-3" strokeWidth={1.2} />
                    <h6 className="fw-semibold text-muted mb-1">No emails yet</h6>
                    <p className="small text-muted mb-0" style={{ maxWidth: '280px' }}>
                      Emails you fetch will appear here. Use the form above to send new emails.
                    </p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {emails.map((email) => (
                      <Card
                        key={String(email.id)}
                        className={`cursor-pointer position-relative ${selectedEmailId === email.id ? 'border-primary bg-light' : ''}`}
                        onClick={() => {
                          setSelectedEmailId(email.id);
                          setShowEmailModal(true);
                        }}
                      >
                        <Card.Body className="py-2 px-3">
                          {email.status != null && (
                            <Badge bg={email.status === 'sent' ? 'success' : 'secondary'} className="position-absolute top-0 end-0 m-2">
                              {email.status}
                            </Badge>
                          )}
                          <div className="fw-semibold small text-truncate">{email.subject || '(No subject)'}</div>
                          <div className="small text-muted text-truncate">
                            {email.from ?? (Array.isArray(email.to) ? email.to.join(', ') : email.to) ?? '—'}
                          </div>
                          {(email.created_at || email.date) && (
                            <small className="text-muted text-nowrap">
                              {moment(email.created_at || email.date).format(GlobalDateTimeFormat)}
                            </small>
                          )}
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                )}
                {emailsMeta && (emailsMeta.total > 0 || emails.length > 0) && (
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3 pt-3 border-top">
                    <div className="d-flex align-items-center gap-2">
                      <span className="small text-muted">Per page:</span>
                      <Form.Select
                        size="sm"
                        style={{ width: 'auto' }}
                        value={emailsPerPage}
                        onChange={(e) => {
                          setEmailsPerPage(Number(e.target.value));
                          setEmailsPage(1);
                        }}
                      >
                        {[5, 10, 15, 25, 50].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </Form.Select>
                      <span className="small text-muted">
                        {emailsMeta.from != null && emailsMeta.to != null
                          ? `Showing ${emailsMeta.from}–${emailsMeta.to} of ${emailsMeta.total}`
                          : `Total ${emailsMeta.total}`}
                      </span>
                    </div>
                    {emailsMeta.last_page > 1 && (
                      <Pagination className="mb-0 flex-wrap gap-1">
                        <Pagination.Prev
                          disabled={emailsPage <= 1}
                          onClick={(e) => { e.preventDefault(); setEmailsPage((p) => Math.max(1, p - 1)); }}
                        />
                        {Array.from({ length: emailsMeta.last_page }, (_, i) => i + 1).map((p) => (
                          <Pagination.Item
                            key={p}
                            active={p === emailsPage}
                            onClick={(e) => { e.preventDefault(); setEmailsPage(p); }}
                          >
                            {p}
                          </Pagination.Item>
                        ))}
                        <Pagination.Next
                          disabled={emailsPage >= emailsMeta.last_page}
                          onClick={(e) => { e.preventDefault(); setEmailsPage((p) => Math.min(emailsMeta.last_page, p + 1)); }}
                        />
                      </Pagination>
                    )}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
        )}

      <Modal show={showEmailModal && selectedEmail != null} onHide={() => { setShowEmailModal(false); setSelectedEmailId(null); }} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{selectedEmail?.subject || '(No subject)'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEmail != null && (
            <>
              <div className="small text-muted mb-2">
                From: {selectedEmail.created_by ?? selectedEmail.from ?? '—'}
                {' · '}
                To: {Array.isArray(selectedEmail.to) ? selectedEmail.to.join(', ') : selectedEmail.to ?? '—'}
              </div>
              <div className="small text-muted mb-2">
                {selectedEmail.created_at && moment(selectedEmail.created_at).format(GlobalDateTimeFormat)}
                {selectedEmail.status != null && (
                  <Badge bg={selectedEmail.status === 'sent' ? 'success' : 'secondary'} className="ms-2">
                    {selectedEmail.status}
                  </Badge>
                )}
              </div>
              <div className="rounded border bg-light overflow-hidden mt-2">
                {(() => {
                  const html = getEmailPreviewHtml(selectedEmail.content);
                  const fallback = selectedEmail.snippet || selectedEmail.body_preview;
                  const toRender = html || (fallback ? `<p>${String(fallback).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>` : '');
                  return toRender ? (
                    <div
                      className="p-3 bg-white email-preview-body"
                      style={{ minHeight: '120px', maxHeight: '70vh', overflow: 'auto', fontSize: '0.9rem' }}
                      dangerouslySetInnerHTML={{ __html: toRender }}
                    />
                  ) : (
                    <div className="p-3 text-muted small">No content</div>
                  );
                })()}
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default EmailSection;
