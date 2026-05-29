import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Row, Col, Card, Form, Badge, Button } from 'react-bootstrap';
import { GetTicket, GetComments, GetAssigneeComments, AddComment } from '@utils/tickets';
import { toast } from 'react-toastify';
import moment from 'moment';
import { useSession } from 'next-auth/react';
import type { LucideIcon } from 'lucide-react';
import {
  ChevronLeft,
  Clock,
  Hash,
  AlertTriangle,
  FileText,
  RefreshCw,
  Phone,
  Send,
  Paperclip,
  BookOpen,
  Wrench,
  RotateCcw,
  ChevronRight,
  Flag,
  CircleDot
} from 'lucide-react';

const PRIORITY_LABELS = ['Low', 'Medium', 'High', 'Critical'];
const DEFAULT_AVATAR = 'https://i.pravatar.cc/150?img=48';

const RELATED_ARTICLES: Array<{ title: string; icon: LucideIcon; color: string }> = [
  { title: 'Setting Up Two-Factor Authentication', icon: BookOpen, color: '#4680ff' },
  { title: 'Troubleshooting 2FA Issues', icon: Wrench, color: '#04a9f5' },
  { title: 'Resetting Your 2FA Device', icon: RotateCcw, color: '#1de9b6' }
];

/** Normalized view-ticket record from `GetTicket` / `normalizeViewTicketPayload`. */
type ViewTicketRecord = Record<string, unknown>;

type ChatMessage = {
  id: string;
  user: string;
  avatar: string;
  time: string;
  message: string;
  isAgent?: boolean;
};

type CommentSourceRow = Record<string, unknown>;

function asTrimmedString(value: unknown, fallback: string): string {
  if (value == null) {
    return fallback;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  return fallback;
}

function commentRowId(
  row: CommentSourceRow,
  sortKey: string,
  isAgent: boolean,
  index: number
): string {
  const rawId = row.id;
  if (typeof rawId === 'string' || typeof rawId === 'number') {
    return String(rawId);
  }
  return `local-${sortKey}-${isAgent ? 'a' : 'c'}-${index}`;
}

function mapCommentToMerged(
  c: CommentSourceRow,
  isAgent: boolean,
  fallbackName: string,
  index: number
): ChatMessage & { sortKey: string } {
  const sortKey = asTrimmedString(c.created_at, '');
  const id = commentRowId(c, sortKey, isAgent, index);
  const userRaw = c.user_name ?? c.user_extension;
  const user = asTrimmedString(userRaw, fallbackName) || fallbackName;
  const created = c.created_at;
  let time = '';
  if (typeof created === 'string' || typeof created === 'number') {
    time = moment(String(created)).fromNow();
  }
  return {
    id,
    user,
    avatar: DEFAULT_AVATAR,
    time,
    message: asTrimmedString(c.content, ''),
    isAgent,
    sortKey
  };
}

function readTicketUserExtension(ticket: ViewTicketRecord): string {
  const raw = ticket.user_extension;
  if (Array.isArray(raw)) {
    return asTrimmedString(raw[0], '');
  }
  return asTrimmedString(raw, '');
}

function getTicketStatusLabel(status: unknown): string {
  if (status == null) {
    return 'Open';
  }
  if (typeof status === 'string') {
    return status || 'Open';
  }
  if (typeof status === 'object' && 'name' in status) {
    const name = (status as { name?: unknown }).name;
    const label = asTrimmedString(name, '');
    return label === '' ? 'Open' : label;
  }
  return 'Open';
}

interface TicketDetailProps {
  ticketId: string;
  onBack: () => void;
}

const TicketDetail: React.FC<TicketDetailProps> = ({ ticketId, onBack }) => {
  const { data: session } = useSession();
  const [ticketData, setTicketData] = useState<ViewTicketRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyAttachment, setReplyAttachment] = useState<File | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingComments, setLoadingComments] = useState<boolean>(false);
  const [sendingReply, setSendingReply] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchComments = useCallback(async (id: string) => {
    setLoadingComments(true);
    try {
      const [commentsRes, assigneeRes] = await Promise.all([
        GetComments(id),
        GetAssigneeComments(id)
      ]);
      const commentsList = (commentsRes?.data?.data ?? commentsRes?.data ?? commentsRes) ?? [];
      const assigneeList = (assigneeRes?.data?.data ?? assigneeRes?.data ?? assigneeRes) ?? [];
      const customerRows = (Array.isArray(commentsList) ? commentsList : []).map((c, i) =>
        mapCommentToMerged(c as CommentSourceRow, false, 'Customer', i)
      );
      const agentRows = (Array.isArray(assigneeList) ? assigneeList : []).map((c, i) =>
        mapCommentToMerged(c as CommentSourceRow, true, 'Support', i)
      );
      const merged = [...customerRows, ...agentRows];
      merged.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
      setMessages(merged.map(({ sortKey, ...rest }) => rest));
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoadingComments(false);
    }
  }, []);

  const fetchTicket = useCallback(async () => {
    if (!ticketId) return;
    setLoading(true);
    setError(null);
    try {
      const ticket = await GetTicket(ticketId);
      if (ticket) {
        setTicketData(ticket);
        fetchComments(ticketId);
      } else {
        setError('Failed to load ticket');
        toast.error('Failed to load ticket');
      }
    } catch (err) {
      setError('Failed to load ticket');
      toast.error('Failed to load ticket');
      if (err instanceof Error) {
        console.error('GetTicket error:', err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [ticketId, fetchComments]);

  useEffect(() => {
    if (ticketId) fetchTicket();
  }, [ticketId, fetchTicket]);

  const handleSendReply = useCallback(async () => {
    if (!replyText.trim() || !ticketData) return;
    const userExtension = readTicketUserExtension(ticketData);
    setSendingReply(true);
    try {
      const ok = await AddComment(
        String(ticketData.id),
        replyText.trim(),
        userExtension,
        replyAttachment ?? undefined
      );
      if (ok) {
        setReplyText('');
        setReplyAttachment(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchComments(String(ticketData.id));
      }
    } finally {
      setSendingReply(false);
    }
  }, [replyText, replyAttachment, ticketData, fetchComments]);

  const getPriorityStyle = (priority: string | number | unknown) => {
    const raw = typeof priority === 'string' ? Number.parseInt(priority, 10) : Number(priority ?? 0);
    const p = Number.isNaN(raw) ? 0 : raw;
    switch (p) {
      case 3: return { bg: '#fee', color: '#dc3545', dotColor: '#dc3545' };
      case 2: return { bg: '#fff3cd', color: '#856404', dotColor: '#f4c22b' };
      case 1: return { bg: '#e7f3ff', color: '#0d6efd', dotColor: '#0d6efd' };
      case 0:
      default: return { bg: '#f0f0f0', color: '#6c757d', dotColor: '#6c757d' };
    }
  };

  const getStatusStyle = (status: string) => {
    const s = (status ?? '').toLowerCase();
    if (s.includes('open')) return { bg: '#4680ff', color: '#fff' };
    if (s.includes('pending')) return { bg: '#fff3cd', color: '#856404' };
    if (s.includes('resolved')) return { bg: '#d4edda', color: '#155724' };
    if (s.includes('closed')) return { bg: '#e2e3e5', color: '#383d41' };
    return { bg: '#4680ff', color: '#fff' };
  };

  const statusName = getTicketStatusLabel(ticketData?.status);
  const priorityNum =
    typeof ticketData?.priority === 'string' || typeof ticketData?.priority === 'number'
      ? ticketData.priority
      : 0;
  const priorityLabel = PRIORITY_LABELS[Number(priorityNum)] ?? 'Low';
  const priorityStyle = getPriorityStyle(priorityNum);
  const statusStyle = getStatusStyle(statusName);

  if (loading && !ticketData) {
    return (
      <div style={{ background: '#f4f7fa', minHeight: '100vh', padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#6c757d' }}>Loading ticket...</p>
      </div>
    );
  }
  if (error || !ticketData) {
    return (
      <div style={{ background: '#f4f7fa', minHeight: '100vh', padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#dc3545' }}>{error ?? 'Ticket not found'}</p>
        <Button type="button" variant="outline-primary" onClick={onBack}>Back to My Tickets</Button>
      </div>
    );
  }

  return (
    <div style={{ background: '#f4f7fa', minHeight: '100vh', paddingBottom: '40px' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '20px' }}>
        <Button
          type="button"
          variant="link"
          onClick={onBack}
          aria-label="Back to Help Center"
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
          <ChevronLeft size={16} aria-hidden focusable={false} /> Help Center
        </Button>
        <span style={{ color: '#6c757d', margin: '0 8px' }} aria-hidden>›</span>
        <Button
          type="button"
          variant="link"
          onClick={onBack}
          aria-label="Back to My Tickets"
          style={{
            color: '#6c757d',
            fontSize: '14px',
            padding: 0,
            textDecoration: 'none',
            display: 'inline'
          }}
        >
          My Tickets
        </Button>
        <span style={{ color: '#6c757d', margin: '0 8px' }} aria-hidden>›</span>
        <span style={{ color: '#2c3e50', fontWeight: '600', fontSize: '14px' }}>
          Ticket #{asTrimmedString(ticketData.id, '—')}
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
                Ticket No: #{asTrimmedString(ticketData.id, '—')}
              </div>
              <div style={{
                padding: '12px 20px',
                fontSize: '14px',
                color: '#495057',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}>
                <Flag size={16} color={priorityStyle.dotColor} style={{ flexShrink: 0 }} aria-hidden focusable={false} />
                <span style={{ textTransform: 'capitalize' }}>
                  {priorityLabel}
                </span>
              </div>
              <div style={{
                padding: '12px 20px',
                fontSize: '14px',
                color: '#495057',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}>
                <CircleDot size={16} color={statusStyle.bg} style={{ flexShrink: 0 }} aria-hidden focusable={false} />
                <span>{statusName}</span>
              </div>
            </div>
          </Card>
        </Col>

        {/* Main Content */}
        <Col xs={12} lg={10}>
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
                    {asTrimmedString(ticketData.title, '')}
                  </h3>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    flexWrap: 'wrap'
                  }}>
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
                      {statusName}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Agent and meta Info */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                padding: '16px',
                background: '#f8f9fa',
                borderRadius: '8px'
              }}>
                {asTrimmedString(ticketData.due_date, '') && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} color="#6c757d" aria-hidden focusable={false} />
                      <span style={{ fontSize: '13px', color: '#495057', fontWeight: '500' }}>
                        Due {moment(asTrimmedString(ticketData.due_date, '')).format('MMM D, YYYY')}
                      </span>
                    </div>
                  )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Hash size={14} color="#6c757d" aria-hidden focusable={false} />
                    <span style={{ fontSize: '13px', color: '#6c757d' }}>Channel:</span>
                    <span style={{ fontSize: '13px', color: '#495057', fontWeight: '500' }}>
                      Portal
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px', color: '#6c757d' }}>Created</span>
                    <span style={{ fontSize: '13px', color: '#495057', fontWeight: '500' }}>
                      {asTrimmedString(ticketData.created_at, '')
                        ? moment(asTrimmedString(ticketData.created_at, '')).format('MMM D, YYYY')
                        : '—'}
                    </span>
                  </div>
              </div>

              {/* Description (initial message) */}
              {asTrimmedString(ticketData.description, '') && (
                <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <img
                      src={DEFAULT_AVATAR}
                      alt={session?.user?.name ? `${session.user.name} avatar` : 'Your avatar'}
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                          {session?.user?.name ?? 'You'}
                        </span>
                        <span style={{ fontSize: '13px', color: '#6c757d' }}>
                          {asTrimmedString(ticketData.created_at, '')
                            ? moment(asTrimmedString(ticketData.created_at, '')).fromNow()
                            : ''}
                        </span>
                      </div>
                      <p style={{ fontSize: '14px', color: '#495057', lineHeight: '1.6', margin: 0 }}>
                        {asTrimmedString(ticketData.description, '')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages / Comments */}
              <div style={{ marginBottom: '24px' }}>
                {loadingComments ? (
                  <p style={{ fontSize: '14px', color: '#6c757d' }}>Loading replies...</p>
                ) : (
                  messages.map((message, index) => (
                    <div key={message.id} style={{
                      marginBottom: '24px',
                      paddingBottom: '24px',
                      borderBottom: index < messages.length - 1 ? '1px solid #f0f0f0' : 'none'
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
                  ))
                )}
              </div>

              {/* Reply Box */}
              <div style={{
                padding: '20px',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setReplyAttachment(f);
                  }}
                  style={{ display: 'none' }}
                />
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
                    type="button"
                    variant="link"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!!replyAttachment}
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
                    <Paperclip size={16} aria-hidden focusable={false} />
                    Add screenshot
                    <span style={{ fontSize: '12px', color: '#6c757d', marginLeft: '4px' }}>
                      1 file (Up to 1MB)
                    </span>
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSendReply}
                    disabled={sendingReply || !replyText.trim()}
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
                    <Send size={16} aria-hidden focusable={false} />
                    {sendingReply ? 'Sending...' : 'Send reply'}
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Right Sidebar */}
        <Col xs={12} lg={3} style={{ display: 'none' }}>
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
                type="button"
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
                type="button"
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
                type="button"
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
                type="button"
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
                {RELATED_ARTICLES.map((article) => {
                  const Icon = article.icon;
                  return (
                    <button
                      key={article.title}
                      type="button"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        background: '#f8f9fa',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: '1px solid transparent',
                        width: '100%',
                        textAlign: 'left',
                        font: 'inherit',
                        color: 'inherit'
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
                        <Icon size={18} color={article.color} aria-hidden focusable={false} />
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
                      <ChevronRight size={16} color="#6c757d" aria-hidden focusable={false} />
                    </button>
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