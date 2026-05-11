import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";

import { useState } from 'react';
import { Container, Row, Col, Card, Table, Badge, Form, Button, Dropdown, ProgressBar } from 'react-bootstrap';
import { Search, Users, TrendingUp, CheckCircle, Phone, MoreVertical, Copy, Volume2, Download, PhoneOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { sampleWaveformJitterPx } from "@utils/sampleWaveformJitter";

interface Session {
  id: string;
  status: string;
  agent: string | null;
  agentFlag: string | null;
  intent: string;
  sentiment: string | null;
  duration: string;
  phone: string | null;
}


const AIMLLiveMonitoring = () => {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState<'transcript' | 'draft' | 'more'>('transcript');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSentiment, setFilterSentiment] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);

  // Sample data for sessions
  const sessions = [
    {
      id: '486df723-7ead-48886',
      status: 'Connected',
      agent: 'Gandalf Support Bot',
      agentFlag: '🇺🇸',
      intent: 'General Support',
      sentiment: 'Positive',
      duration: '51 sec',
      phone: null
    },
    {
      id: '486df723-7ead-48888',
      status: 'Connected',
      agent: 'Gandalf Support Bot',
      agentFlag: '🇺🇸',
      intent: 'General Support',
      sentiment: 'Neutral',
      duration: '46 sec',
      phone: null
    },
    {
      id: '486df723-7ead-48886',
      status: 'Connected',
      agent: 'Gandalf Support Bot',
      agentFlag: '🇺🇸',
      intent: 'General Support',
      sentiment: 'Positive',
      duration: '51 sec',
      phone: null
    },
    {
      id: '486df723-7ead-48883',
      status: 'In Transfer',
      agent: null,
      agentFlag: null,
      intent: 'Gandalf Support',
      sentiment: 'Positive',
      duration: '51 sec',
      phone: '+1987-1234321'
    },
    {
      id: '486df723-7ead-48888',
      status: 'Connected',
      agent: 'Gandalf Support Bot',
      agentFlag: '🇺🇸',
      intent: 'General Support',
      sentiment: 'Neutral',
      duration: '46 sec',
      phone: null
    },
    {
      id: '486df723-7ead-48886',
      status: 'Connected',
      agent: 'Gandalf Support Bot',
      agentFlag: '🇺🇸',
      intent: 'General Support',
      sentiment: 'Neutral',
      duration: '46 sec',
      phone: null
    },
    {
      id: '486df723-7ead-48886',
      status: 'In Transfer',
      agent: null,
      agentFlag: null,
      intent: 'Gandalf Support',
      sentiment: null,
      duration: '52 sec',
      phone: '+1987-1234321'
    },
    {
      id: '486df723-7ead-48886',
      status: 'Connected',
      agent: 'Gandalf Support Bot',
      agentFlag: '🇺🇸',
      intent: 'General Support',
      sentiment: 'Neutral',
      duration: '46 sec',
      phone: null
    },
    {
      id: '486df723-7ead-48886',
      status: 'In Transfer',
      agent: null,
      agentFlag: null,
      intent: 'Gandalf Support',
      sentiment: null,
      duration: '52 sec',
      phone: '+1987-1234321'
    },
    {
      id: '486df723-7ead-48883',
      status: 'In Transfer',
      agent: null,
      agentFlag: null,
      intent: 'Gandalf Support',
      sentiment: 'Positive',
      duration: '51 sec',
      phone: '+1987-1234321'
    }
  ];

  // Sample waveform data
  const waveformData = Array.from({ length: 100 }, (_, i) => ({
    x: i,
    y: Math.sin(i / 5) * 30 + sampleWaveformJitterPx(20) + 30,
  }));

  const getStatusBadge = (status: string): string => {
    const variants: { [key: string]: string } = {
      'Connected': 'success',
      'In Transfer': 'warning'
    };
    return variants[status] || 'secondary';
  };

  const getSentimentBadge = (sentiment: string | null): { bg: string; text: string } => {
    const config: { [key: string]: { bg: string; text: string } } = {
      'Positive': { bg: 'success', text: 'Positive' },
      'Neutral': { bg: 'warning', text: 'Neutral' }
    };
    return sentiment ? (config[sentiment] || { bg: 'secondary', text: sentiment }) : { bg: 'secondary', text: '' };
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Live Monitoring" />

      <div style={{ backgroundColor: '#f4f7fa', minHeight: '100vh'}}>
      <Container fluid>
        {/* Header */}
        <Row className="mb-3">
          <Col>
            <h2 style={{ color: '#2c3e50', fontWeight: '600', fontSize: '28px', marginBottom: '0' }}>Live Monitor</h2>
          </Col>
        </Row>

        <Row className="mb-3">
          {/* Left Column - Stats and Sessions */}
          <Col lg={9}>
            {/* Stats Cards */}
            <Row className="mb-3">
              <Col md={3} className="mb-2">
                <Card style={{ border: 'none', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <Card.Body style={{ padding: '1rem' }}>
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2c3e50', marginBottom: '2px' }}>
                          12
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#95a5a6', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Sessions</div>
                      </div>
                      <div style={{ 
                        backgroundColor: '#e8f5e9', 
                        borderRadius: '8px', 
                        width: '40px', 
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Users size={20} color="#4caf50" />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={3} className="mb-2">
                <Card style={{ border: 'none', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <Card.Body style={{ padding: '1rem' }}>
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2c3e50', marginBottom: '2px' }}>
                          +8
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#95a5a6', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Successful Transfers</div>
                      </div>
                      <div style={{ 
                        backgroundColor: '#e8f5e9', 
                        borderRadius: '8px', 
                        width: '40px', 
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <TrendingUp size={20} color="#4caf50" />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={3} className="mb-2">
                <Card style={{ border: 'none', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <Card.Body style={{ padding: '1rem' }}>
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2c3e50', marginBottom: '2px' }}>
                          21
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#95a5a6', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DNCR Compliant</div>
                      </div>
                      <div style={{ 
                        backgroundColor: '#e3f2fd', 
                        borderRadius: '8px', 
                        width: '40px', 
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <CheckCircle size={20} color="#2196f3" />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={3} className="mb-2">
                <Card style={{ border: 'none', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <Card.Body style={{ padding: '1rem' }}>
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2c3e50', marginBottom: '2px' }}>
                          2:34
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#95a5a6', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg Call Duration</div>
                      </div>
                      <div style={{ 
                        backgroundColor: '#fff3e0', 
                        borderRadius: '8px', 
                        width: '40px', 
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Phone size={20} color="#ff9800" />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Sessions Table */}
            <Card style={{ border: 'none', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <Card.Body>
                {/* Filters */}
                <Row className="mb-3">
                  <Col md={3} sm={6} className="mb-2">
                    <div style={{ position: 'relative' }}>
                      <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#95a5a6' }} />
                      <Form.Control 
                        type="text" 
                        placeholder="Search sessions..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ paddingLeft: '36px', fontSize: '14px', border: '1px solid #e0e0e0', borderRadius: '6px' }}
                      />
                    </div>
                  </Col>
                  <Col md={3} sm={6} className="mb-2">
                    <Form.Select 
                      value={filterAgent}
                      onChange={(e) => setFilterAgent(e.target.value)}
                      style={{ fontSize: '14px', border: '1px solid #e0e0e0', borderRadius: '6px' }}
                    >
                      <option value="">All Agents</option>
                      <option value="gandalf">Gandalf Support Bot</option>
                    </Form.Select>
                  </Col>
                  <Col md={3} sm={6} className="mb-2">
                    <Form.Select 
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      style={{ fontSize: '14px', border: '1px solid #e0e0e0', borderRadius: '6px' }}
                    >
                      <option value="">All Statuses</option>
                      <option value="connected">Connected</option>
                      <option value="transfer">In Transfer</option>
                      <option value="ringing">Ringing</option>
                      <option value="completed">Completed</option>
                    </Form.Select>
                  </Col>
                  <Col md={3} sm={6} className="mb-2">
                    <Form.Select 
                      value={filterSentiment}
                      onChange={(e) => setFilterSentiment(e.target.value)}
                      style={{ fontSize: '14px', border: '1px solid #e0e0e0', borderRadius: '6px' }}
                    >
                      <option value="">All Sentiments</option>
                      <option value="positive">Positive</option>
                      <option value="neutral">Neutral</option>
                      <option value="negative">Negative</option>
                    </Form.Select>
                  </Col>
                </Row>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                  <Table hover responsive style={{ marginBottom: '0' }}>
                    <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
                      <tr>
                        <th style={{ fontSize: '13px', fontWeight: '600', color: '#6c757d', padding: '12px' }}>Session ID</th>
                        <th style={{ fontSize: '13px', fontWeight: '600', color: '#6c757d', padding: '12px' }}>Status</th>
                        <th style={{ fontSize: '13px', fontWeight: '600', color: '#6c757d', padding: '12px' }}>Agent</th>
                        <th style={{ fontSize: '13px', fontWeight: '600', color: '#6c757d', padding: '12px' }}>Intent</th>
                        <th style={{ fontSize: '13px', fontWeight: '600', color: '#6c757d', padding: '12px' }}>Sentiment</th>
                        <th style={{ fontSize: '13px', fontWeight: '600', color: '#6c757d', padding: '12px' }}>Duration</th>
                        <th style={{ fontSize: '13px', fontWeight: '600', color: '#6c757d', padding: '12px', minWidth: 'auto' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((session, idx) => (
                        <tr 
                          key={idx} 
                          style={{ cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
                          onClick={() => setSelectedSession(session)}
                        >
                          <td style={{ fontSize: '13px', padding: '12px', color: '#2c3e50' }}>
                            {session.id}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <Badge 
                              bg={getStatusBadge(session.status)} 
                              style={{ 
                                fontSize: '12px', 
                                fontWeight: '500',
                                padding: '6px 12px',
                                borderRadius: '6px'
                              }}
                            >
                              {session.status}
                            </Badge>
                          </td>
                          <td style={{ fontSize: '13px', padding: '12px', color: '#2c3e50' }}>
                            {session.agent ? (
                              <div className="d-flex align-items-center">
                                <span style={{ marginRight: '8px' }}>{session.agentFlag}</span>
                                <span>{session.agent}</span>
                              </div>
                            ) : (
                              <div className="d-flex align-items-center">
                                <Phone size={14} style={{ marginRight: '6px' }} />
                                <span>{session.phone}</span>
                              </div>
                            )}
                          </td>
                          <td style={{ fontSize: '13px', padding: '12px', color: '#2c3e50' }}>
                            {session.intent}
                          </td>
                          <td style={{ padding: '12px' }}>
                            {session.sentiment && (
                              <div className="d-flex align-items-center">
                                <div 
                                  style={{ 
                                    width: '8px', 
                                    height: '8px', 
                                    borderRadius: '50%', 
                                    backgroundColor: session.sentiment === 'Positive' ? '#4caf50' : '#ff9800',
                                    marginRight: '8px'
                                  }}
                                ></div>
                                <span style={{ fontSize: '13px', color: '#6c757d' }}>{session.sentiment}</span>
                              </div>
                            )}
                          </td>
                          <td style={{ fontSize: '13px', padding: '12px', color: '#2c3e50' }}>
                            {session.duration}
                          </td>
                          <td style={{ padding: '12px', minWidth: 'auto' }}>
                            <MoreVertical size={16} color="#95a5a6" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="d-flex justify-content-between align-items-center mt-3 pt-3" style={{ borderTop: '1px solid #e9ecef' }}>
                  <div style={{ fontSize: '13px', color: '#6c757d' }}>
                    Showing <strong>1-5</strong> of <strong>5</strong> sessions
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      disabled
                      style={{ padding: '4px 8px', border: '1px solid #dee2e6' }}
                    >
                      <ChevronLeft size={14} />
                    </Button>
                    <Button 
                      variant="primary" 
                      size="sm"
                      style={{ padding: '4px 12px', minWidth: '32px' }}
                    >
                      1
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      disabled
                      style={{ padding: '4px 8px', border: '1px solid #dee2e6' }}
                    >
                      <ChevronRight size={14} />
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          {/* Right Column - Session Detail */}
          <Col lg={3}>
            <Card style={{ border: 'none', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', position: 'sticky', top: '24px' }}>
              <Card.Body style={{ padding: '1.25rem' }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 style={{ fontSize: '16px', fontWeight: '600', color: '#2c3e50', margin: 0 }}>Session Detail</h5>
                  <MoreVertical size={18} color="#95a5a6" />
                </div>

                {/* Session ID */}
                <div className="d-flex align-items-center mb-3 p-2" style={{ backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                  <span style={{ fontSize: '13px', color: '#6c757d', flex: 1 }}>48cd7723-7ead-4882-98543251819598</span>
                  <Copy 
                    size={16} 
                    color="#95a5a6" 
                    style={{ cursor: 'pointer' }} 
                    onClick={() => {
                      navigator.clipboard.writeText('48cd7723-7ead-4882-98543251819598');
                      alert('Session ID copied to clipboard!');
                    }}
                  />
                </div>

                {/* Connection Status */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center">
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      backgroundColor: '#e8f5e9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '12px'
                    }}>
                      <Users size={20} color="#4caf50" />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#2c3e50' }}>Connected</span>
                  </div>
                  <div style={{ 
                    backgroundColor: '#e8f5e9', 
                    padding: '4px 12px', 
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#4caf50'
                  }}>
                    51 sec
                  </div>
                </div>

                {/* Agent Info */}
                <div className="mb-3">
                  <div style={{ fontSize: '12px', color: '#95a5a6', marginBottom: '6px' }}>Agent</div>
                  <div style={{ fontSize: '14px', color: '#2c3e50', fontWeight: '500' }}>Gandalf Support Bot</div>
                </div>

                {/* Call Tags */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <span style={{ fontSize: '12px', color: '#95a5a6' }}>Call Tags: </span>
                      <span style={{ fontSize: '13px', color: '#2c3e50' }}>DNCR Valid</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#2c3e50' }}>
                      <TrendingUp size={14} color="#4caf50" style={{ marginRight: '4px' }} />
                      85%
                    </div>
                  </div>
                </div>

                {/* Transfer Status */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <span style={{ fontSize: '12px', color: '#95a5a6' }}>Transfer Status:</span>
                    <div className="d-flex align-items-center">
                      <Badge bg="secondary" style={{ marginRight: '8px' }}>None</Badge>
                      <span style={{ fontSize: '12px', color: '#95a5a6' }}>⟲</span>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="mb-3" style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <div className="d-flex" style={{ gap: '24px' }}>
                    <div 
                      onClick={() => setActiveTab('transcript')}
                      style={{ 
                        paddingBottom: '12px', 
                        borderBottom: activeTab === 'transcript' ? '2px solid #2196f3' : '2px solid transparent',
                        fontSize: '14px',
                        color: activeTab === 'transcript' ? '#2196f3' : '#95a5a6',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      Transcript
                    </div>
                    <div 
                      onClick={() => setActiveTab('draft')}
                      style={{ 
                        paddingBottom: '12px',
                        borderBottom: activeTab === 'draft' ? '2px solid #2196f3' : '2px solid transparent',
                        fontSize: '14px',
                        color: activeTab === 'draft' ? '#2196f3' : '#95a5a6',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      Draft
                    </div>
                    <div 
                      onClick={() => setActiveTab('more')}
                      style={{ 
                        paddingBottom: '12px',
                        borderBottom: activeTab === 'more' ? '2px solid #2196f3' : '2px solid transparent',
                        fontSize: '14px',
                        color: activeTab === 'more' ? '#2196f3' : '#95a5a6',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      More +
                    </div>
                  </div>
                </div>

                {/* Tab Content */}
                <div className="mb-3" style={{ maxHeight: '203px', overflowY: 'auto' }}>
                  {activeTab === 'transcript' && (
                    <>
                      <div className="mb-3">
                        <div style={{ fontSize: '12px', color: '#95a5a6', marginBottom: '6px' }}>Agent:</div>
                        <div style={{ fontSize: '13px', color: '#2c3e50', lineHeight: '1.6' }}>
                          Hello, this is the RingEdge support bot. How can I assist you today?
                        </div>
                      </div>
                      <div className="mb-3">
                        <div style={{ fontSize: '12px', color: '#95a5a6', marginBottom: '6px' }}>Customer:</div>
                        <div style={{ fontSize: '13px', color: '#2c3e50', lineHeight: '1.6' }}>
                          Hi, my bill seems too high this month.
                        </div>
                      </div>
                      <div className="mb-3">
                        <div style={{ fontSize: '12px', color: '#95a5a6', marginBottom: '6px' }}>Agent:</div>
                        <div style={{ fontSize: '13px', color: '#2c3e50', lineHeight: '1.6' }}>
                          I understand your concern. Let me pull up your account details to review your recent charges.
                        </div>
                      </div>
                    </>
                  )}
                  {activeTab === 'draft' && (
                    <div style={{ fontSize: '13px', color: '#6c757d', textAlign: 'center', padding: '2rem' }}>
                      <p>Draft notes and annotations</p>
                      <textarea 
                        className="form-control" 
                        rows={5} 
                        placeholder="Add your notes here..."
                        style={{ fontSize: '13px', marginTop: '1rem' }}
                      />
                    </div>
                  )}
                  {activeTab === 'more' && (
                    <div style={{ fontSize: '13px', color: '#2c3e50' }}>
                      <div className="mb-2">
                        <strong>Session Started:</strong> 10:23:45 AM
                      </div>
                      <div className="mb-2">
                        <strong>Customer Number:</strong> +1 (555) 123-4567
                      </div>
                      <div className="mb-2">
                        <strong>Location:</strong> New York, USA
                      </div>
                      <div className="mb-2">
                        <strong>Call Quality:</strong> Excellent (98%)
                      </div>
                      <div className="mb-2">
                        <strong>Network:</strong> VoIP - Stable
                      </div>
                    </div>
                  )}
                </div>

                {/* Waveform */}
                <div className="mb-3" style={{ height: '87px', backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '8px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={waveformData}>
                      <defs>
                        <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2196f3" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#2196f3" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area 
                        type="monotone" 
                        dataKey="y" 
                        stroke="#2196f3" 
                        strokeWidth={2}
                        fill="url(#waveGradient)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Audio Controls */}
                <div className="d-flex justify-content-between mb-3">
                  <Button 
                    variant={isPlaying ? "secondary" : "primary"} 
                    onClick={() => setIsPlaying(!isPlaying)}
                    style={{ borderRadius: '8px', fontSize: '14px' }}
                  >
                    <Volume2 size={16} style={{ marginRight: '6px' }} />
                    {isPlaying ? 'Playing...' : 'Listen'}
                  </Button>
                  <Button 
                    variant="danger" 
                    onClick={() => setIsPlaying(false)}
                    disabled={!isPlaying}
                    style={{ borderRadius: '8px', fontSize: '14px' }}
                  >
                    Stop
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => alert('Downloading recording...')}
                    style={{ borderRadius: '8px', fontSize: '14px' }}
                  >
                    <Download size={16} style={{ marginRight: '6px' }} />
                    Download
                  </Button>
                  <Dropdown>
                    <Dropdown.Toggle variant="outline-secondary" size="sm">
                      <MoreVertical size={16} />
                    </Dropdown.Toggle>
                  </Dropdown>
                </div>

                {/* Terminate Session */}
                <Button 
                  variant="danger" 
                  className="w-100 d-flex align-items-center justify-content-center" 
                  onClick={() => {
                    if (window.confirm('Are you sure you want to terminate this session?')) {
                      alert('Session terminated');
                      setSelectedSession(null);
                    }
                  }}
                  style={{ borderRadius: '8px', fontSize: '14px', padding: '12px', gap: '8px' }}
                >
                  <PhoneOff size={16} />
                  Terminate Session
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>

    </React.Fragment>
  );
};

AIMLLiveMonitoring.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default AIMLLiveMonitoring;
