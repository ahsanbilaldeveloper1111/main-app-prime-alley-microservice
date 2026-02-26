import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Row, Col, Card, Form, Badge, Button } from 'react-bootstrap';
import { GetTicket, GetComments, GetAssigneeComments, AddComment } from '@utils/tickets';
import { toast } from 'react-toastify';
import moment from 'moment';
import {useSession} from 'next-auth/react';
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

interface GetTicketResponse {
  success?: boolean;
  data?: any;
}

interface TicketDetailProps {
  ticketId: string;
  onBack: () => void;
}

const TicketDetail: React.FC<TicketDetailProps> = ({ ticketId, onBack }) => {
  const { data: session } = useSession();
  const [ticketData, setTicketData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyAttachment, setReplyAttachment] = useState<File | null>(null);
  const [messages, setMessages] = useState<Array<{ user: string; avatar: string; time: string; message: string; isAgent?: boolean }>>([]);
  const [loadingComments, setLoadingComments] = useState<boolean>(false);
  const [sendingReply, setSendingReply] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTicket = useCallback(async () => {
    if (!ticketId) return;
    setLoading(true);
    setError(null);
    try {
      const response: GetTicketResponse | undefined = await GetTicket(ticketId);
      if (response?.success === true && response?.data) {
        setTicketData(response.data);
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
  }, [ticketId]);

  const fetchComments = useCallback(async (id: string) => {
    setLoadingComments(true);
    try {
      const [commentsRes, assigneeRes] = await Promise.all([
        GetComments(id),
        GetAssigneeComments(id)
      ]);
      const commentsList = (commentsRes?.data?.data ?? commentsRes?.data ?? commentsRes) ?? [];
      const assigneeList = (assigneeRes?.data?.data ?? assigneeRes?.data ?? assigneeRes) ?? [];
      const merged: Array<{ user: string; avatar: string; time: string; message: string; isAgent?: boolean; sortKey: string }> = [];
      (Array.isArray(commentsList) ? commentsList : []).forEach((c: any) => {
        merged.push({
          user: c.user_name ?? c.user_extension ?? 'Customer',
          avatar: DEFAULT_AVATAR,
          time: c.created_at ? moment(c.created_at).fromNow() : '',
          message: c.content ?? '',
          isAgent: false,
          sortKey: c.created_at ?? ''
        });
      });
      (Array.isArray(assigneeList) ? assigneeList : []).forEach((c: any) => {
        merged.push({
          user: c.user_name ?? c.user_extension ?? 'Support',
          avatar: DEFAULT_AVATAR,
          time: c.created_at ? moment(c.created_at).fromNow() : '',
          message: c.content ?? '',
          isAgent: true,
          sortKey: c.created_at ?? ''
        });
      });
      merged.sort((a, b) => (a.sortKey > b.sortKey ? 1 : -1));
      setMessages(merged.map(({ sortKey, ...rest }) => rest));
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoadingComments(false);
    }
  }, []);

  useEffect(() => {
    if (ticketId) fetchTicket();
  }, [ticketId, fetchTicket]);

  const handleSendReply = useCallback(async () => {
    if (!replyText.trim() || !ticketData) return;
    const userExtension = Array.isArray(ticketData.user_extension)
      ? ticketData.user_extension[0] ?? ''
      : ticketData.user_extension ?? '';
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

  const getPriorityStyle = (priority: string | number) => {
    const p = typeof priority === 'string' ? Number.parseInt(priority, 10) : (priority ?? 0);
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

  const relatedArticles = [
    { title: 'Setting Up Two-Factor Authentication', icon: BookOpen, color: '#4680ff' },
    { title: 'Troubleshooting 2FA Issues', icon: Wrench, color: '#04a9f5' },
    { title: 'Resetting Your 2FA Device', icon: RotateCcw, color: '#1de9b6' }
  ];

  const statusName = ticketData?.status?.name ?? ticketData?.status ?? 'Open';
  const priorityNum = ticketData?.priority ?? 0;
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
        <Button variant="outline-primary" onClick={onBack}>Back to My Tickets</Button>
      </div>
    );
  }

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
          Ticket #{ticketData.id}
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
                Ticket No: #{ticketData.id}
              </div>
              <div style={{
                padding: '12px 20px',
                fontSize: '14px',
                color: '#495057',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}>
                <Flag size={16} color={priorityStyle.dotColor} style={{ flexShrink: 0 }} />
                <div style={{
                  // width: '8px',
                  // height: '8px',
                  // borderRadius: '50%',
                  background: priorityStyle.dotColor
                }} />
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
                <CircleDot size={16} color={statusStyle.bg} style={{ flexShrink: 0 }} />
                <div style={{
                  // width: '0px',
                  // height: '0px',
                  // borderRadius: '50%',
                  background: statusStyle.bg
                }} />
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
                    {ticketData.title}
                  </h3>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    flexWrap: 'wrap'
                  }}>
                    {/* Priority Badge */}
                    {/* <Badge style={{
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
                      <span style={{ textTransform: 'capitalize' }}>{priorityLabel}</span>
                    </Badge> */}

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
                      {statusName}
                    </Badge>
                  </div>
                </div>

                {/* Action Buttons */}
                {/* <div style={{ display: 'flex', gap: '8px' }}>
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
                    <Share2 size={14} /> Share
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
                </div> */}
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
                <>

                {ticketData.due_date && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} color="#6c757d" />
                      <span style={{ fontSize: '13px', color: '#495057', fontWeight: '500' }}>
                        Due {moment(ticketData.due_date).format('MMM D, YYYY')}
                      </span>
                    </div>
                  )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Hash size={14} color="#6c757d" />
                    <span style={{ fontSize: '13px', color: '#6c757d' }}>Channel:</span>
                    <span style={{ fontSize: '13px', color: '#495057', fontWeight: '500' }}>
                      Portal
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px', color: '#6c757d' }}>Created</span>
                    <span style={{ fontSize: '13px', color: '#495057', fontWeight: '500' }}>
                      {ticketData.created_at ? moment(ticketData.created_at).format('MMM D, YYYY') : '—'}
                    </span>
                  </div>
                </>
                {/* <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={DEFAULT_AVATAR}
                    alt="Agent"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                  <span style={{ fontSize: '14px', color: '#495057', fontWeight: '500' }}>
                    {ticketData.assignee?.name ?? ticketData.user_extension ?? 'Support'}
                  </span>
                </div> */}
                {/* <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',gap: '16px' }}>
                  
                  
                </div> */}
              </div>

              {/* Description (initial message) */}
              {ticketData.description && (
                <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <img
                      src={DEFAULT_AVATAR}
                      alt=""
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                          {session?.user?.name ?? 'You'}
                        </span>
                        <span style={{ fontSize: '13px', color: '#6c757d' }}>
                          {ticketData.created_at ? moment(ticketData.created_at).fromNow() : ''}
                        </span>
                      </div>
                      <p style={{ fontSize: '14px', color: '#495057', lineHeight: '1.6', margin: 0 }}>
                        {ticketData.description}
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
                    <div key={index} style={{
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
                    <Paperclip size={16} />
                    Add screenshot
                    <span style={{ fontSize: '12px', color: '#6c757d', marginLeft: '4px' }}>
                      1 file (Up to 1MB)
                    </span>
                  </Button>
                  <Button
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
                    <Send size={16} />
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