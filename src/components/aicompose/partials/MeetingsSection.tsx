import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Card, Modal, Badge, Pagination } from 'react-bootstrap';
import { Video, Clock, Sparkles } from 'lucide-react';
import type { RegisterFooter, ChannelSectionContext } from '../types';
import { getContextSource } from '../types';
import {
  getMeetings,
  getMeetingByEventId,
  createInstantMeeting,
  createScheduledMeeting,
} from '@utils/communication';
import { generateEmail } from '@utils/communication';
import moment from 'moment-timezone';
import { GlobalDateTimeFormat } from '@utils/Helper';

/** Pagination meta from GET meetings response */
interface MeetingsMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}

/** Meeting item from GET meetings response (list or detail) */
interface MeetingItem {
  event_id?: string;
  id?: string | number;
  summary?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  meeting_link?: string;
  html_link?: string;
  created_by?: string;
  created_at?: string;
  meeting_type?: 'instant' | 'scheduled' | string;
  attendees?: string[];
}

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

const MeetingsSection: React.FC<{ registerFooter?: RegisterFooter; initialMeetingType?: 'instant' | 'scheduled' } & ChannelSectionContext> = ({
  registerFooter,
  contextPayload,
  commonOptions: commonOptionsProp,
  setCommonOptions,
  initialMeetingType,
}) => {
  const commonOptions = commonOptionsProp ?? DEFAULT_COMMON_OPTIONS;
  const source = getContextSource(contextPayload);

  const [meetingType, setMeetingType] = useState<'instant' | 'scheduled'>(initialMeetingType ?? 'instant');
  useEffect(() => {
    if (initialMeetingType != null) setMeetingType(initialMeetingType);
  }, [initialMeetingType]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attendeesStr, setAttendeesStr] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [timezone, setTimezone] = useState(moment.tz.guess());
  const [createLoading, setCreateLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);

  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [meetingsMeta, setMeetingsMeta] = useState<MeetingsMeta | null>(null);
  const [meetingsPage, setMeetingsPage] = useState(1);
  const [meetingsPerPage, setMeetingsPerPage] = useState(15);

  const fetchMeetings = React.useCallback(async (page: number, perPage: number) => {
    setMeetingsLoading(true);
    try {
      const res = (await getMeetings({
        page: String(page),
        per_page: String(perPage),
      })) as { data?: MeetingItem[]; events?: MeetingItem[]; meta?: MeetingsMeta };
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res?.events) ? res.events : [];
      setMeetings(list);
      if (res?.meta) setMeetingsMeta(res.meta);
      else setMeetingsMeta(null);
    } catch (e) {
      console.error('Failed to fetch meetings', e);
      setMeetings([]);
      setMeetingsMeta(null);
    } finally {
      setMeetingsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings(meetingsPage, meetingsPerPage);
  }, [meetingsPage, meetingsPerPage, fetchMeetings]);

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingDetail, setMeetingDetail] = useState<MeetingItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  useEffect(() => {
    if (!selectedEventId) {
      setMeetingDetail(null);
      return;
    }
    const fetchDetail = async () => {
      setDetailLoading(true);
      try {
        const res = (await getMeetingByEventId(selectedEventId)) as { data?: MeetingItem; status?: string } | MeetingItem;
        const detail = res && typeof res === 'object' && 'data' in res && res.data != null ? res.data : (res as MeetingItem);
        setMeetingDetail(detail || null);
      } catch (e) {
        console.error('Failed to fetch meeting detail', e);
        setMeetingDetail(null);
      } finally {
        setDetailLoading(false);
      }
    };
    fetchDetail();
  }, [selectedEventId]);

 
  const handleCreateMeeting = async () => {
    const attendees = attendeesStr
      ? attendeesStr.split(',').map((e) => e.trim()).filter(Boolean)
      : undefined;

    if (meetingType === 'instant') {
      setCreateLoading(true);
      try {
        const res = await createInstantMeeting({
          summary: title.trim() || undefined,
          description: description.trim() || undefined,
          attendees,
        });
        setTitle('');
        setDescription('');
        setAttendeesStr('');
        if (res?.data) {
          const newMeeting: MeetingItem = {
            event_id: res.data.event_id,
            meeting_link: res.data.meeting_link,
            html_link: res.data.html_link,
            summary: res.data.summary,
            start_time: res.data.start_time,
            end_time: res.data.end_time,
          };
          setMeetings((prev) => [newMeeting, ...prev]);
        } 
      } catch (e) {
        console.error('Create instant meeting failed', e);
      } finally {
        setCreateLoading(false);
      }
      return;
    }

    if (!startTime.trim()) return;
    setCreateLoading(true);
    try {
      const res = await createScheduledMeeting({
        start_time: startTime.trim(),
        end_time: endTime.trim() || undefined,
        summary: title.trim() || undefined,
        description: description.trim() || undefined,
        attendees,
        timezone: timezone || undefined,
      });
      setTitle('');
      setDescription('');
      setAttendeesStr('');
      setStartTime('');
      setEndTime('');
      await fetchMeetings(meetingsPage, meetingsPerPage);
    } catch (e) {
      console.error('Create scheduled meeting failed', e);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCancel = () => console.log('Meetings: Cancel');
  const handleCopy = () => {
    const text = `${title || '(No title)'}\n\n${description || ''}\n\nAttendees: ${attendeesStr || '—'}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) navigator.clipboard.writeText(text);
  };
  const handleLater = () => console.log('Meetings: Later');
  const handleSend = () => handleCreateMeeting();

  useEffect(() => {
    registerFooter?.({ cancel: handleCancel, copy: handleCopy, later: handleLater, send: handleSend });
    return () => registerFooter?.(null);
  }, [registerFooter, title, description, attendeesStr]);

  const [contactEmail, setContactEmail] = useState('');
  useEffect(() => {
    const payload = contextPayload ?? ({} as Record<string, unknown>);
    if (source === 'leads' && payload?.lead) {
      const lead = payload.lead as Record<string, unknown>;
      const raw = lead?.contact_persons;
      let persons: Array<{ email?: string }> = [];
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
      setContactEmail((first?.email as string) ?? '');
    } else {
      setContactEmail('');
    }
  }, [source, contextPayload]);

  useEffect(() => {
    if (contactEmail && !attendeesStr) setAttendeesStr(contactEmail);
  }, [contactEmail]);

  const eventId = (m: MeetingItem) => m.event_id ?? (m as { id?: string }).id;

  return (
    <div className="h-100 d-flex flex-column min-h-0">
      
      <Row className="mb-4 flex-grow-1 min-h-0">
        <Col xs={12}>
          <>
              <Row className="g-4">
                <Col lg={7}>
                  <Card className="border">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                        <div>
                          <h5 className="fw-bold mb-1">Create Google Meet</h5>
                          <p className="text-muted small mb-0">
                            Create instant or scheduled Google Meet meetings
                          </p>
                        </div>
                        
                      </div>

                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Meeting Type</Form.Label>
                        <Form.Select
                          value={meetingType}
                          onChange={(e) => setMeetingType(e.target.value as 'instant' | 'scheduled')}
                        >
                          <option value="instant">Instant Meeting</option>
                          <option value="scheduled">Scheduled Meeting</option>
                        </Form.Select>
                      </Form.Group>

                      

                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Title</Form.Label>
                        <Form.Control
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Meeting title"
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Description</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Meeting description"
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Attendees (comma-separated emails)</Form.Label>
                        <Form.Control
                          type="email"
                          value={attendeesStr}
                          onChange={(e) => setAttendeesStr(e.target.value)}
                          placeholder="email1@example.com, email2@example.com"
                        />
                      </Form.Group>

                      {meetingType === 'scheduled' && (
                        <>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Start time</Form.Label>
                            <Form.Control
                              type="datetime-local"
                              value={startTime}
                              onChange={(e) => setStartTime(e.target.value)}
                            />
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">End time (optional)</Form.Label>
                            <Form.Control
                              type="datetime-local"
                              value={endTime}
                              onChange={(e) => setEndTime(e.target.value)}
                            />
                          </Form.Group>
                          {/* <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Timezone</Form.Label>
                            <Form.Control
                              value={timezone}
                              onChange={(e) => setTimezone(e.target.value)}
                              placeholder="e.g. America/New_York"
                            />
                          </Form.Group> */}
                        </>
                      )}

                      <div className="d-flex gap-2">
                       
                        <Button
                          variant="dark"
                          onClick={handleCreateMeeting}
                          disabled={
                            createLoading ||
                            (meetingType === 'scheduled' && !startTime.trim())
                          }
                        >
                          {createLoading ? 'Creating...' : 'Create Meeting'}
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col lg={5}>
                  <div style={{ position: 'sticky', top: '20px' }} onClick={(e) => e.stopPropagation()}>
                    <Form.Label className="fw-semibold mb-3">Preview — Meeting</Form.Label>
                    <Card className="border-0 shadow-sm" style={{ maxWidth: '400px', backgroundColor: '#fff8e1' }}>
                      <Card.Body>
                        <div className="d-flex align-items-start gap-2 mb-2">
                          <Video size={20} className="text-warning mt-1" />
                          <div className="flex-grow-1">
                            <div className="fw-semibold small">
                              {meetingType === 'instant' ? 'Instant' : 'Scheduled'} Meeting
                            </div>
                            <span className="badge bg-warning text-dark small">Draft</span>
                          </div>
                        </div>
                        <Card className="mt-3 border-0 shadow-sm">
                          <Card.Body className="bg-white">
                            <div className="fw-semibold small mb-2">{title}</div>
                            {description ? (
                              <p className="mb-0 small" style={{ whiteSpace: 'pre-line' }}>{description}</p>
                            ) : (
                              <p className="mb-0 text-muted small">No description yet.</p>
                            )}
                            {attendeesStr && (
                              <p className="mb-0 small text-muted mt-2">
                                Attendees: {attendeesStr}
                              </p>
                            )}
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
            </>
        </Col>
      </Row>

      <Modal show={showMeetingModal && selectedEventId != null} onHide={() => { setShowMeetingModal(false); setSelectedEventId(null); }} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{meetingDetail?.summary ?? 'Meeting Details'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailLoading ? (
            <div className="d-flex align-items-center gap-2 py-3">
              <span className="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true" />
              <span className="small text-muted">Loading meeting...</span>
            </div>
          ) : meetingDetail != null ? (
            <>
              <div className="small text-muted mb-2">
                {meetingDetail.start_time
                  ? moment(meetingDetail.start_time).format(GlobalDateTimeFormat)
                  : '—'}
                {meetingDetail.end_time && ` – ${moment(meetingDetail.end_time).format(GlobalDateTimeFormat)}`}
              </div>
              
              {meetingDetail.meeting_link && (
                <a href={meetingDetail.meeting_link} target="_blank" rel="noopener noreferrer" className="d-block mb-2 text-primary">
                  {meetingDetail.meeting_link}
                </a>
              )}
              {meetingDetail.html_link && (
                <a href={meetingDetail.html_link} target="_blank" rel="noopener noreferrer" className="d-block mb-2">
                  Open in Calendar
                </a>
              )}
              {meetingDetail.description && (
                <div className="mt-2 pt-2 border-top">
                  <div className="small fw-semibold text-muted mb-1">Description</div>
                  <p className="mb-0 small" style={{ whiteSpace: 'pre-line' }}>{meetingDetail.description}</p>
                </div>
              )}
              {meetingDetail.attendees && meetingDetail.attendees.length > 0 && (
                <div className="mt-2 pt-2 border-top">
                  <div className="small fw-semibold text-muted mb-1">Attendees</div>
                  <p className="mb-0 small">{meetingDetail.attendees.join(', ')}</p>
                </div>
              )}
            </>
          ) : null}
        </Modal.Body>
      </Modal>

        <Row className="mt-3">
          <Col xs={12}>
            <Card className="border">
              <Card.Body>
                <h6 className="fw-semibold mb-3">Meetings</h6>
                {meetingsLoading ? (
                  <div className="d-flex flex-column align-items-center justify-content-center gap-2 py-4">
                    <span className="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true" />
                    <span className="small text-muted">Loading meetings...</span>
                  </div>
                ) : meetings.length === 0 ? (
                  <div className="d-flex flex-column align-items-center justify-content-center py-5 px-3 text-center">
                    <Video size={48} className="text-muted mb-3" strokeWidth={1.2} />
                    <h6 className="fw-semibold text-muted mb-1">No meetings yet</h6>
                    <p className="small text-muted mb-0" style={{ maxWidth: '280px' }}>
                      Meetings you create will appear here. Use the form above to create a new meeting.
                    </p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {meetings.map((m) => {
                      const id = eventId(m);
                      if (!id) return null;
                      return (
                        <Card
                          key={id}
                          className={`cursor-pointer mb-2 position-relative ${selectedEventId === id ? 'border-primary bg-light' : ''}`}
                          onClick={() => {
                            setSelectedEventId(id);
                            setShowMeetingModal(true);
                          }}
                        >
                          <Card.Body className="py-3 px-3">
                            {m.meeting_type != null && (
                              <Badge bg="info" className="position-absolute top-0 end-0 m-2 text-capitalize">
                                {String(m.meeting_type)}
                              </Badge>
                            )}
                            <div className="fw-semibold mb-1">{m.summary ?? 'Meeting Details'}</div>
                            {m.meeting_link && (
                              <a
                                href={m.meeting_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className=" small text-primary text-truncate mb-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {m.meeting_link}
                              </a>
                            )}
                            <div className="small text-muted">
                              {/* By: {m.created_by ?? '—'} |  */}
                              {m.created_at ? moment(m.created_at).format(GlobalDateTimeFormat) : '—'}
                            </div>
                          </Card.Body>
                        </Card>
                      );
                    })}
                  </div>
                )}
                {meetingsMeta && (meetingsMeta.total > 0 || meetings.length > 0) && (
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3 pt-3 border-top">
                    <div className="d-flex align-items-center gap-2">
                      <span className="small text-muted">
                        Per page:
                      </span>
                      <Form.Select
                        size="sm"
                        style={{ width: 'auto' }}
                        value={meetingsPerPage}
                        onChange={(e) => {
                          setMeetingsPerPage(Number(e.target.value));
                          setMeetingsPage(1);
                        }}
                      >
                        {[5, 10, 15, 25, 50].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </Form.Select>
                      <span className="small text-muted">
                        {meetingsMeta.from != null && meetingsMeta.to != null
                          ? `Showing ${meetingsMeta.from}–${meetingsMeta.to} of ${meetingsMeta.total}`
                          : `Total ${meetingsMeta.total}`}
                      </span>
                    </div>
                    {meetingsMeta.last_page > 1 && (
                      <Pagination className="mb-0 flex-wrap gap-1">
                        <Pagination.Prev
                          disabled={meetingsPage <= 1}
                          onClick={(e) => { e.preventDefault(); setMeetingsPage((p) => Math.max(1, p - 1)); }}
                        />
                        {Array.from({ length: meetingsMeta.last_page }, (_, i) => i + 1).map((p) => (
                          <Pagination.Item
                            key={p}
                            active={p === meetingsPage}
                            onClick={(e) => { e.preventDefault(); setMeetingsPage(p); }}
                          >
                            {p}
                          </Pagination.Item>
                        ))}
                        <Pagination.Next
                          disabled={meetingsPage >= meetingsMeta.last_page}
                          onClick={(e) => { e.preventDefault(); setMeetingsPage((p) => Math.min(meetingsMeta.last_page, p + 1)); }}
                        />
                      </Pagination>
                    )}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      
    </div>
  );
};

export default MeetingsSection;
