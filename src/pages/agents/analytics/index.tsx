import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useCallback, useEffect, useMemo } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, { TableColumn } from "@components/GenericTable";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import {
  getFaqsInboundPaginated,
  type OutboundCallItem,
  type GetFaqsInboundPaginatedResponse,
} from "@utils/aibot";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  Play,
  X,
  Filter,
  ArrowUpDown,
  ThumbsDown,
  FileText,
  Timer,
  Frown,
  DollarSign,
  Phone,
  MessageCircle
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Session {
  id: string;
  contact: string;
  status: 'Connected' | 'Qualing' | 'Queued';
  attempts: number;
  duration: string;
  sentiment: 'Dialing' | 'Negative' | 'Unknown';
  intent: string;
}

interface SessionDetail {
  id: string;
  status: string;
  bot: string;
  statusDuration: string;
  transcriptSnippets: {
    id: string;
    speaker: string;
    text: string;
  }[];
  sentiment: string;
  audioWaveform: {
    id: string;
    height: number;
  }[];
}


const PAGE_SIZE = 50;

function outboundToSession(call: OutboundCallItem): Session {
  const durationSec = Math.round(call.stt_duration ?? 0);
  return {
    id: call.session_id,
    contact: call.participant_identity ?? "",
    status: "Connected",
    attempts: 1,
    duration: `${durationSec} sec`,
    sentiment: "Unknown",
    intent: "Play",
  };
}

function outboundToSessionDetail(call: OutboundCallItem): SessionDetail {
  const conversation: Array<{ role?: string; content?: string }> =
    Array.isArray(call.conversation) ? call.conversation : [];
  const transcriptSnippets = conversation.slice(0, 5).map((m, idx) => ({
      id: `${call.session_id}-snippet-${idx}-${m.role ?? "unknown"}`,
      speaker: m.role === "assistant" ? "Bot" : "User",
      text: m.content ?? "",
    }));
  const durationSec = Math.round(call.stt_duration ?? 0);
  return {
    id: call.session_id,
    status: "Connected",
    bot: call.voice_agent_name ?? "Gandalf Support Bot",
    statusDuration: `${durationSec} secs`,
    transcriptSnippets: transcriptSnippets.length
      ? transcriptSnippets
      : [{ id: `${call.session_id}-snippet-empty`, speaker: "-", text: "No transcript" }],
    sentiment: "Unknown",
    audioWaveform: Array.from({ length: 100 }, (_, idx) => ({
      id: `${call.session_id}-wave-${idx}`,
      height: Math.random() * 100,
    })),
  };
}

const AIMLCampaignReports = () => {
  const [selectedSession, setSelectedSession] = useState<SessionDetail>({
    id: "",
    status: "Connected",
    bot: "Gandalf Support Bot",
    statusDuration: "0 secs",
    transcriptSnippets: [],
    sentiment: "Unknown",
    audioWaveform: [],
  });

  const [sessions, setSessions] = useState<Session[]>([]);
  const [outboundCalls, setOutboundCalls] = useState<OutboundCallItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const loadPage = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getFaqsInboundPaginated({ page, page_size: PAGE_SIZE });
      const data: GetFaqsInboundPaginatedResponse = res.data;
      const list = data?.results?.OutBound_CALL ?? [];
      setOutboundCalls(list);
      setSessions(list.map(outboundToSession));
      setTotalCount(data?.count ?? 0);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load campaign data");
      setSessions([]);
      setOutboundCalls([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  const [activeTab, setActiveTab] = useState<string>("outcomes");

  const sessionColumns = useMemo<TableColumn<Session>[]>(() => [
    {
      key: "id",
      label: "Session ID",
      type: "custom",
      render: (session) => <span className="font-monospace small">{session.id}</span>,
    },
    {
      key: "contact",
      label: "Contact",
      type: "custom",
      render: (session) => <span className="font-monospace small">{session.contact}</span>,
    },
    {
      key: "status",
      label: "Status",
      sortable: false,
      type: "custom",
      render: (session) => {
        const color = getStatusBadgeColor(session.status);
        return (
          <span className={`badge bg-${color} bg-opacity-10 text-${color} fw-normal px-3`}>
            {session.status}
          </span>
        );
      },
    },
    {
      key: "attempts",
      label: "Attempts",
      type: "custom",
      render: (session) => <span>{session.attempts}</span>,
    },
    {
      key: "duration",
      label: "Duration",
      type: "custom",
      render: (session) => <span>{session.duration}</span>,
    },
    {
      key: "sentiment",
      label: "Sentiment",
      sortable: false,
      type: "custom",
      render: (session) => {
        const color = getSentimentBadgeColor(session.sentiment);
        return (
          <span className={`badge bg-${color} bg-opacity-10 text-${color} fw-normal px-3`}>
            {session.sentiment}
          </span>
        );
      },
    },
    {
      key: "intent",
      label: "Intent",
      sortable: false,
      type: "custom",
      render: (session) => (
        <button className="btn btn-sm btn-primary rounded-pill px-3" onClick={(e) => e.stopPropagation()}>
          <Play size={12} className="me-1" fill="currentColor" />
          {session.intent}
        </button>
      ),
    },
    {
      key: "dismiss",
      label: "",
      sortable: false,
      type: "custom",
      render: () => (
        <button className="btn btn-sm btn-light rounded-circle" onClick={(e) => e.stopPropagation()}>
          <X size={16} />
        </button>
      ),
    },
  ], []);

  // Pie Chart Data
  const pieData = [
    { name: 'Connected', value: 50, color: '#6366f1' },
    { name: 'Failed', value: 25, color: '#f87171' },
    { name: 'Transferred', value: 25, color: '#a78bfa' }
  ];

  // Bar Chart Data
  const barData = [
    { date: 'Apr 20', connected: 30, failed: 20, transferred: 15 },
    { date: 'Apr 23', connected: 25, failed: 30, transferred: 20 },
    { date: 'Apr 26', connected: 35, failed: 25, transferred: 18 },
    { date: 'Apr 28', connected: 20, failed: 35, transferred: 22 },
    { date: 'Apr 30', connected: 40, failed: 20, transferred: 15 },
    { date: 'May 2', connected: 28, failed: 30, transferred: 25 },
    { date: 'May 5', connected: 35, failed: 28, transferred: 30 }
  ];

  const getStatusBadgeColor = (status: string): string => {
    switch (status) {
      case 'Connected': return 'success';
      case 'Qualing': return 'info';
      case 'Queued': return 'warning';
      default: return 'secondary';
    }
  };

  const getSentimentBadgeColor = (sentiment: string): string => {
    switch (sentiment) {
      case 'Dialing': return 'primary';
      case 'Negative': return 'danger';
      case 'Unknown': return 'secondary';
      default: return 'secondary';
    }
  };
  return (
    <React.Fragment>
      <style jsx global>{`
        .generic-table-responsive {
          margin: 0 !important;
          width: 100% !important;
          border-radius: 0px !important;
        }
      `}</style>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Campaign Reports" />

      <div className="bg-light min-vh-100 ">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <h1 className="fs-3 fw-semibold text-dark mb-0">Campaign Results & Analytics</h1>
        
        <div className="d-flex flex-wrap gap-2">
          <div className="dropdown">
            <button className="btn btn-light border d-flex align-items-center gap-2" data-bs-toggle="dropdown">
              <Calendar size={16} />
              Last 7 Days
              <ChevronDown size={16} />
            </button>
          </div>
          
          <div className="dropdown">
            <button className="btn btn-light border d-flex align-items-center gap-2" data-bs-toggle="dropdown">
              <FileText size={16} />
              Bot: Gandalf Support Bot
              <ChevronDown size={16} />
            </button>
          </div>
          
          <div className="dropdown">
            <button className="btn btn-light border d-flex align-items-center gap-2" data-bs-toggle="dropdown">
              <Filter size={16} />
              Campaign: All
              <ChevronDown size={16} />
            </button>
          </div>
          
          <div className="dropdown">
            <button className="btn btn-light border d-flex align-items-center gap-2" data-bs-toggle="dropdown">
              <ArrowUpDown size={16} />
              Status: All
              <ChevronDown size={16} />
            </button>
          </div>
          
          <button className="btn btn-primary">
            Export
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="row g-3">
        {/* Left Section */}
        <div className="col-12 col-xl-9">
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body p-3 p-md-4">
              <h2 className="fs-5 fw-semibold mb-4">Overview</h2>

              <div className="row g-3 mb-4">
                {/* Left Column - Pie Chart */}
                <div className="col-12 col-lg-4">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body p-3">
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px' }}>
                          <div className="bg-primary rounded-circle" style={{ width: '8px', height: '8px' }} />
                        </div>
                        <small className="text-muted fw-semibold">Total Calls</small>
                      </div>
                      <div className="position-relative" style={{ height: '340px' }}>
                        <div style={{ width: '220px', height: '220px', margin: '0 auto', position: 'relative' }}>
                          <ResponsiveContainer>
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={100}
                                paddingAngle={3}
                                dataKey="value"
                                startAngle={90}
                                endAngle={-270}
                              >
                                {pieData.map((entry) => (
                                  <Cell key={`cell-${entry.name}-${entry.color}`} fill={entry.color} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="position-absolute top-50 start-50 translate-middle text-center">
                            <div style={{ fontSize: '3rem', fontWeight: '700', lineHeight: '1' }}>63</div>
                            <div style={{ fontSize: '1.75rem', fontWeight: '600', color: '#6c757d' }}>50%</div>
                          </div>
                        </div>
                        <div className="position-absolute bottom-0 start-0 end-0">
                          <div className="d-flex justify-content-center flex-wrap gap-2 small">
                            <div className="d-flex align-items-center gap-1">
                              <div className="rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: '#6366f1' }} />
                              <span className="text-muted">50%</span>
                            </div>
                            <div className="d-flex align-items-center gap-1">
                              <div className="rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: '#10b981' }} />
                              <span className="text-muted">Connected</span>
                            </div>
                            <div className="d-flex align-items-center gap-1">
                              <div className="rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: '#f87171' }} />
                              <span className="text-muted">Failed</span>
                            </div>
                            <div className="d-flex align-items-center gap-1">
                              <div className="rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: '#a78bfa' }} />
                              <span className="text-muted">Transferred</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Two Rows */}
                <div className="col-12 col-lg-8">
                  {/* Row 1: Stats Cards */}
                  <div className="row g-3 mb-3">
                    {/* Connected */}
                    <div className="col-6 col-md-3">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body p-3">
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '20px', height: '20px' }}>
                              <div className="bg-success rounded-circle" style={{ width: '8px', height: '8px' }} />
                            </div>
                            <small className="text-muted fw-semibold">Connected</small>
                          </div>
                          <div style={{ fontSize: '2rem', fontWeight: '700', lineHeight: '1', marginTop: '0.5rem' }}>33</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#10b981', marginTop: '0.25rem' }}>53%</div>
                        </div>
                      </div>
                    </div>

                    {/* Failed */}
                    <div className="col-6 col-md-3">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body p-3">
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <div className="bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '20px', height: '20px' }}>
                              <div className="bg-danger rounded-circle" style={{ width: '8px', height: '8px' }} />
                            </div>
                            <small className="text-muted fw-semibold">Failed</small>
                          </div>
                          <div style={{ fontSize: '2rem', fontWeight: '700', lineHeight: '1', marginTop: '0.5rem' }}>29</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#f87171', marginTop: '0.25rem' }}>46%</div>
                        </div>
                      </div>
                    </div>

                    {/* Transfers */}
                    <div className="col-6 col-md-3">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body p-3">
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <div className="bg-info bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '20px', height: '20px' }}>
                              <div className="bg-info rounded-circle" style={{ width: '8px', height: '8px' }} />
                            </div>
                            <small className="text-muted fw-semibold">Transfers</small>
                          </div>
                          <div style={{ fontSize: '2rem', fontWeight: '700', lineHeight: '1', marginTop: '0.5rem' }}>4</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#0dcaf0', marginTop: '0.25rem' }}>6%</div>
                        </div>
                      </div>
                    </div>

                    {/* Avg. Durations */}
                    <div className="col-6 col-md-3">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body p-3">
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <div className="bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '20px', height: '20px' }}>
                              <div className="bg-warning rounded-circle" style={{ width: '8px', height: '8px' }} />
                            </div>
                            <small className="text-muted fw-semibold">Avg. Duration</small>
                          </div>
                          <div style={{ fontSize: '2rem', fontWeight: '700', lineHeight: '1', marginTop: '0.5rem' }}>30</div>
                          <div className="text-muted small" style={{ marginTop: '0.25rem' }}>SEC</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Bar Chart + Stats Cards */}
                  <div className="row g-3">
                    {/* Bar Chart */}
                    <div className="col-12 col-md-6">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body p-3">
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <div className="bg-primary bg-opacity-10 rounded-circle p-1" style={{ width: '20px', height: '20px' }}>
                              <div className="bg-primary rounded-circle" style={{ width: '12px', height: '12px' }} />
                            </div>
                            <small className="text-muted fw-medium">Call Outcomes Over Time</small>
                          </div>
                          <div style={{ height: '180px' }}>
                            <ResponsiveContainer>
                              <BarChart data={barData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip />
                                <Bar dataKey="connected" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="failed" fill="#f87171" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="transferred" fill="#6366f1" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Total Duration Card */}
                    <div className="col-12 col-md-3">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body p-3">
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <div className="bg-warning bg-opacity-10 rounded-circle p-1" style={{ width: '20px', height: '20px' }}>
                              <div className="bg-warning rounded-circle" style={{ width: '12px', height: '12px' }} />
                            </div>
                            <small className="text-muted fw-medium">Total Duration</small>
                          </div>
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <Timer size={20} className="text-warning" />
                            <div>
                              <div className="fs-3 fw-bold">59</div>
                            </div>
                          </div>
                          <div className="text-muted small">MIN</div>
                          <div className="mt-3">
                            <small className="text-muted d-block">Longest:</small>
                            <div className="fw-semibold">51 sec</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Estimated Cost Card */}
                    <div className="col-12 col-md-3">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body p-3">
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <div className="bg-success bg-opacity-10 rounded-circle p-1" style={{ width: '20px', height: '20px' }}>
                              <div className="bg-success rounded-circle" style={{ width: '12px', height: '12px' }} />
                            </div>
                            <small className="text-muted fw-medium">Estimated Cost</small>
                          </div>
                          <div className="d-flex align-items-center gap-1 mb-2">
                            <DollarSign size={20} className="text-success" />
                            <div className="fs-3 fw-bold text-success">25.40</div>
                          </div>
                          <div className="small text-muted mb-3">@ $0.43/min</div>
                          <div className="mt-3">
                            <small className="text-muted d-block">Total Calls:</small>
                            <div className="fw-semibold">63</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <ul className="nav nav-tabs border-0 mb-3">
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'outcomes' ? 'active border-bottom border-primary border-3' : 'text-muted'}`}
                    onClick={() => setActiveTab('outcomes')}
                    style={{ border: 'none', background: 'none' }}
                  >
                    Outcomes
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'transcripts' ? 'active border-bottom border-primary border-3' : 'text-muted'}`}
                    onClick={() => setActiveTab('transcripts')}
                    style={{ border: 'none', background: 'none' }}
                  >
                    Transcripts
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'duration' ? 'active border-bottom border-primary border-3' : 'text-muted'}`}
                    onClick={() => setActiveTab('duration')}
                    style={{ border: 'none', background: 'none' }}
                  >
                    Duration
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'sentiments' ? 'active border-bottom border-primary border-3' : 'text-muted'}`}
                    onClick={() => setActiveTab('sentiments')}
                    style={{ border: 'none', background: 'none' }}
                  >
                    Sentiments
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'intent' ? 'active border-bottom border-primary border-3' : 'text-muted'}`}
                    onClick={() => setActiveTab('intent')}
                    style={{ border: 'none', background: 'none' }}
                  >
                    Intent
                  </button>
                </li>
              </ul>

              {/* Search and Actions */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="input-group" style={{ maxWidth: '300px' }}>
                  <span className="input-group-text bg-white border-end-0">
                    <Search size={16} className="text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 ps-0"
                    placeholder="Search..."
                  />
                </div>
                <div className="d-flex gap-2">
                  <div className="dropdown">
                    <button className="btn btn-light border d-flex align-items-center gap-2" data-bs-toggle="dropdown">
                      <Filter size={16} />
                      Filter Status
                      <ChevronDown size={14} />
                    </button>
                  </div>
                  <div className="dropdown">
                    <button className="btn btn-light border d-flex align-items-center gap-2" data-bs-toggle="dropdown">
                      <Download size={16} />
                      Export
                      <ChevronDown size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="alert alert-danger py-2 mb-3" role="alert">
                  {error}
                </div>
              )}

              <GenericTable<Session>
                data={sessions}
                columns={sessionColumns}
                loading={loading}
                loadingMessage="Loading..."
                emptyMessage="No sessions found"
                sortable={false}
                showToolbar={false}
                showToolbarActions={false}
                rowClassName={() => "cursor-pointer"}
                onRowClick={(session, index) => {
                  const call = outboundCalls[index];
                  if (call) {
                    setSelectedSession(outboundToSessionDetail(call));
                    return;
                  }
                  setSelectedSession((prev) => ({
                    ...prev,
                    id: session.id,
                    statusDuration: session.duration,
                  }));
                }}
                pagination={{
                  currentPage,
                  rowsPerPage: PAGE_SIZE,
                  totalRows: totalCount,
                  pageSizeOptions: [PAGE_SIZE],
                }}
                onPaginationChange={(page) => {
                  if (page !== currentPage && page >= 1 && page <= totalPages) {
                    loadPage(page);
                  }
                }}
                uniqueKey="id"
                noBorder
              />
            </div>
          </div>
        </div>

        {/* Right Section - Session Insight */}
        <div className="col-12 col-xl-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-3 p-md-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fs-5 fw-semibold mb-0">Session Insight</h3>
                <div className="d-flex gap-2">
                  <button className="btn btn-light btn-sm border-0">
                    <ChevronLeft size={18} />
                  </button>
                  <button className="btn btn-light btn-sm border-0">
                    <div className="bg-primary rounded-circle" style={{ width: '8px', height: '8px' }} />
                  </button>
                  <button className="btn btn-light btn-sm border-0">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              {/* Session ID */}
              <div className="d-flex align-items-center gap-2 mb-3">
                <div className="bg-primary bg-opacity-10 rounded-circle p-2">
                  <div className="bg-primary rounded-circle" style={{ width: '12px', height: '12px' }} />
                </div>
                <span className="font-monospace small text-muted">{selectedSession.id}</span>
              </div>

              {/* Status and Bot */}
              <div className="row g-3 mb-4">
                <div className="col-6">
                  <div className="small text-muted mb-1">Status:</div>
                  <span className="badge bg-success fw-normal px-3">{selectedSession.status}</span>
                </div>
                <div className="col-6">
                  <div className="small text-muted mb-1">Duration:</div>
                  <div className="fw-medium">{selectedSession.statusDuration}</div>
                </div>
                <div className="col-6">
                  <div className="small text-muted mb-1">Bot Profile:</div>
                  <div className="fw-medium">{selectedSession.bot}</div>
                </div>
                <div className="col-6">
                  <div className="small text-muted mb-1">Attempts:</div>
                  <div className="fw-medium">1</div>
                </div>
              </div>

              {/* Transcript Snippets */}
              <div className="mb-4">
                <h4 className="fs-6 fw-semibold mb-3">Transcript Snippets</h4>
                {selectedSession.transcriptSnippets.map((snippet) => (
                  <div key={snippet.id} className="mb-3">
                    <div className="fw-semibold text-primary small mb-1">{snippet.speaker}:</div>
                    <p className="text-muted mb-0" style={{ lineHeight: '1.6' }}>{snippet.text}</p>
                  </div>
                ))}
              </div>

              {/* Sentiment Badge */}
              <div className="d-flex align-items-center gap-3 mb-4 p-3 bg-light rounded">
                <div className="bg-danger bg-opacity-10 rounded-circle p-2">
                  <Frown size={24} className="text-danger" />
                </div>
                <div className="flex-grow-1">
                  <div className="fw-semibold">Billing Inquiry</div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <ThumbsDown size={18} className="text-danger" fill="currentColor" />
                  <span className="badge bg-danger fw-normal">{selectedSession.sentiment}</span>
                  <ChevronDown size={16} className="text-muted" />
                </div>
              </div>

              {/* Audio Waveform */}
              <div className="mb-4">
                <div className="bg-primary bg-opacity-10 rounded p-3">
                  <div className="d-flex align-items-center gap-1" style={{ height: '60px' }}>
                    {selectedSession.audioWaveform.slice(0, 80).map((wave) => (
                      <div
                        key={wave.id}
                        className="bg-primary"
                        style={{
                          width: '2px',
                          height: `${wave.height}%`,
                          opacity: 0.7
                        }}
                      />
                    ))}
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <div className="bg-primary rounded-pill" style={{ width: '40%', height: '4px' }} />
                    <div className="bg-light rounded-pill" style={{ width: '55%', height: '4px' }} />
                  </div>
                </div>
              </div>

              {/* Sentiment and Download */}
              <div className="mb-4">
                <div className="d-flex gap-2 mb-3">
                  <div className="dropdown flex-grow-1">
                    <button className="btn btn-light border d-flex align-items-center justify-content-center gap-2 w-100" data-bs-toggle="dropdown">
                      <MessageCircle size={16} />
                      Sentiment
                      <span className="badge bg-danger ms-2">Negative</span>
                    </button>
                  </div>
                </div>
                <button className="btn btn-light border d-flex align-items-center justify-content-center gap-2 w-100">
                  <Download size={16} />
                  Download Recording
                </button>
              </div>

              {/* Call Summary */}
              <div className="d-flex align-items-center gap-2 mb-4 p-3 border rounded">
                <Phone size={18} className="text-primary" />
                <div className="flex-grow-1">
                  <div className="fw-semibold small">Call Summary</div>
                  <div className="text-muted small">Billing inquiry resolved</div>
                </div>
              </div>

              {/* Open Full Transcript */}
              <button className="btn btn-primary w-100">
                Open full transcript
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>


    

    </React.Fragment>
  );
};

AIMLCampaignReports.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default AIMLCampaignReports;
