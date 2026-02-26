import React, { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Users,
  MessageSquare,
  TrendingUp,
  Edit,
  BarChart3,
  Download,
  Copy,
  Pause,
  Play,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  Bell,
  Target,
  Gift,
  ArrowLeft,
  Plus
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import CampaignAnalyticsPage from '@components/campaign-reports';

interface Campaign {
  id: number;
  name: string;
  icon: React.ReactNode;
  iconColor: string;
  botProfile: string;
  client: string;
  type: 'Inbound' | 'Outbound';
  scheduled: string;
  progress: number;
  progressColor: string;
  callsMade: number;
  answered: number;
  failed: number;
}

interface CampaignDetail {
  name: string;
  callsMade: number;
  answered: number;
  keyOutcomes: number;
  successRate: number;
  failed: number;
  recentOutcomes: { label: string; color: string }[];
}

interface CampaignListingPageProps {
  onCreateCampaign?: () => void;
}

const CampaignListingPage: React.FC<CampaignListingPageProps> = ({ onCreateCampaign }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBotProfile, setSelectedBotProfile] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('running');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [expandedActions, setExpandedActions] = useState<number | null>(null);
  const [showReports, setShowReports] = useState<boolean>(false);
  
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignDetail>({
    name: 'Follow-Up Campaign',
    callsMade: 225,
    answered: 167,
    keyOutcomes: 9,
    successRate: 74,
    failed: 14,
    recentOutcomes: [
      { label: '5 Follow Up Scheduled', color: 'primary' },
      { label: '2 Left Voicemail', color: 'info' },
      { label: '11 Escalated to Support', color: 'warning' }
    ]
  });

  const [campaigns] = useState<Campaign[]>([
    {
      id: 1,
      name: 'Follow-Up Campaign',
      icon: <Phone size={20} color="white" />,
      iconColor: '#3b82f6',
      botProfile: 'Gandalf Support Bot',
      client: 'Client A',
      type: 'Inbound',
      scheduled: 'This Week',
      progress: 74,
      progressColor: '#20c997',
      callsMade: 225,
      answered: 167,
      failed: 14
    },
    {
      id: 2,
      name: 'Spanish Sales Campaign',
      icon: <Bell size={20} color="white" />,
      iconColor: '#f59e0b',
      botProfile: 'Spanish Sales Bot',
      client: 'Client B',
      type: 'Outbound',
      scheduled: 'This Week',
      progress: 76,
      progressColor: '#ffc107',
      callsMade: 189,
      answered: 143,
      failed: 12
    },
    {
      id: 3,
      name: 'Customer Feedback',
      icon: <Target size={20} color="white" />,
      iconColor: '#8b5cf6',
      botProfile: 'Support Bot',
      client: 'Client C',
      type: 'Inbound',
      scheduled: 'Last 7 Days',
      progress: 96,
      progressColor: '#20c997',
      callsMade: 312,
      answered: 299,
      failed: 8
    },
    {
      id: 4,
      name: 'Holiday Promotion',
      icon: <Gift size={20} color="white" />,
      iconColor: '#ec4899',
      botProfile: 'Sales Bot',
      client: 'Client D',
      type: 'Outbound',
      scheduled: 'Next Week',
      progress: 45,
      progressColor: '#ffc107',
      callsMade: 98,
      answered: 44,
      failed: 22
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active': return <CheckCircle size={14} />;
      case 'Paused': return <Clock size={14} />;
      case 'Scheduled': return <Calendar size={14} />;
      default: return <XCircle size={14} />;
    }
  };

  const totalPages = 3;

  // Prepare pie chart data
  const pieChartData = [
    { name: 'Answered', value: selectedCampaign.answered, color: '#198754' },
    { name: 'Failed', value: selectedCampaign.failed, color: '#dc3545' },
    { name: 'Pending', value: selectedCampaign.callsMade - selectedCampaign.answered - selectedCampaign.failed, color: '#ffc107' }
  ];

  // Show reports view if enabled
  if (showReports) {
    return (
      <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <div style={{ padding: '2rem', paddingBottom: '1rem' }}>
          <button
            onClick={() => setShowReports(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: 'white',
              color: '#495057',
              fontSize: '0.95rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: '1rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f8f9fa';
              e.currentTarget.style.borderColor = '#ced4da';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            <ArrowLeft size={18} />
            Back to Campaigns
          </button>
        </div>
        <CampaignAnalyticsPage />
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '700', margin: 0, color: '#1f2937' }}>
          Campaigns
        </h2>
        <button
          onClick={onCreateCampaign}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 20px',
            backgroundColor: '#0d6efd',
            border: 'none',
            color: 'white',
            fontSize: '14px',
            fontWeight: 500,
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0b5ed7'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0d6efd'}
        >
          <Plus size={18} />
          Create Campaign
        </button>
      </div>

      {/* Main Content */}
      <Row className="g-3">
        {/* Left Section - Stats & Campaign List */}
        <Col xs={12} xl={9}>
          {/* Stats Cards */}
          <Row className="g-3 mb-3">
            <Col xs={12} md={4}>
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ color: '#6c757d', marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '500' }}>Active Campaigns</div>
                    <div style={{ fontSize: '3rem', fontWeight: '700', color: '#0d6efd' }}>4</div>
                  </div>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '12px',
                    backgroundColor: '#e7f1ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Users size={32} style={{ color: '#0d6efd' }} />
                  </div>
                </div>
              </div>
            </Col>

            <Col xs={12} md={4}>
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ color: '#6c757d', marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '500' }}>Total Calls</div>
                    <div style={{ fontSize: '3rem', fontWeight: '700', color: '#0dcaf0' }}>824</div>
                  </div>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '12px',
                    backgroundColor: '#cff4fc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <MessageSquare size={32} style={{ color: '#0dcaf0' }} />
                  </div>
                </div>
              </div>
            </Col>

            <Col xs={12} md={4}>
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ color: '#6c757d', marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '500' }}>Avg Success Rate</div>
                    <div style={{ fontSize: '3rem', fontWeight: '700', color: '#198754' }}>73%</div>
                  </div>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '12px',
                    backgroundColor: '#d1e7dd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <TrendingUp size={32} style={{ color: '#198754' }} />
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          {/* Campaign List Table */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            {/* Filters */}
            <Row className="g-3 mb-4">
              <Col xs={12} md={3}>
                <div style={{ position: 'relative' }}>
                  <Search size={18} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    placeholder="Search campaigns..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 40px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '14px',
                      color: '#1f2937'
                    }}
                  />
                </div>
              </Col>
              
              <Col xs={12} sm={6} md={3}>
                <select
                  value={selectedBotProfile}
                  onChange={(e) => setSelectedBotProfile(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    paddingRight: '40px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#1f2937',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%239ca3af\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '20px'
                  }}
                >
                  <option value="all">All Bot Profiles</option>
                  <option value="gandalf">Gandalf Support Bot</option>
                  <option value="spanish">Spanish Sales Bot</option>
                </select>
              </Col>

              <Col xs={12} sm={6} md={3}>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    paddingRight: '40px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#1f2937',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%239ca3af\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '20px'
                  }}
                >
                  <option value="all">All Clients</option>
                  <option value="a">Client A</option>
                  <option value="b">Client B</option>
                  <option value="c">Client C</option>
                </select>
              </Col>

              <Col xs={12} md={3}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setStatusFilter('running')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      backgroundColor: statusFilter === 'running' ? '#198754' : 'white',
                      color: statusFilter === 'running' ? 'white' : '#495057',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setStatusFilter('paused')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      backgroundColor: statusFilter === 'paused' ? '#6c757d' : 'white',
                      color: statusFilter === 'paused' ? 'white' : '#495057',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Paused
                  </button>
                </div>
              </Col>
            </Row>

            {/* Table */}
            <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>ID</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Campaign Name</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Bot Profile</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Client</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Type</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Progress</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
                    <tr 
                      key={campaign.id} 
                      style={{ transition: 'background-color 0.2s', cursor: 'pointer' }}
                      onClick={() => setSelectedCampaign({
                        name: campaign.name,
                        callsMade: campaign.callsMade,
                        answered: campaign.answered,
                        keyOutcomes: 9,
                        successRate: campaign.progress,
                        failed: campaign.failed,
                        recentOutcomes: [
                          { label: '5 Follow Up Scheduled', color: 'primary' },
                          { label: '2 Left Voicemail', color: 'info' },
                          { label: '11 Escalated to Support', color: 'warning' }
                        ]
                      })}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#1f2937', borderBottom: '1px solid #f3f4f6' }}>{campaign.id}</td>
                      <td style={{ padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            backgroundColor: campaign.iconColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {campaign.icon}
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>{campaign.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280', borderBottom: '1px solid #f3f4f6' }}>{campaign.botProfile}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#1f2937', borderBottom: '1px solid #f3f4f6' }}>{campaign.client}</td>
                      <td style={{ padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          backgroundColor: campaign.type === 'Inbound' ? '#d1ecf1' : '#fff3cd',
                          color: campaign.type === 'Inbound' ? '#0c5460' : '#856404',
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: 500
                        }}>
                          {campaign.type}
                        </span>
                      </td>
                      <td style={{ padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ 
                            flex: 1, 
                            height: '8px', 
                            backgroundColor: '#e9ecef',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            minWidth: '100px'
                          }}>
                            <div 
                              style={{ 
                                width: `${campaign.progress}%`,
                                height: '100%',
                                background: campaign.progressColor,
                                borderRadius: '4px',
                                transition: 'width 0.3s'
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 500, color: '#6b7280', minWidth: '45px' }}>
                            {campaign.progress}%
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px', borderBottom: '1px solid #f3f4f6', position: 'relative' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedActions(expandedActions === campaign.id ? null : campaign.id);
                          }}
                          style={{
                            padding: '6px',
                            backgroundColor: 'transparent',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <MoreVertical size={16} color="#6b7280" />
                        </button>
                        {expandedActions === campaign.id && (
                          <div style={{
                            position: 'absolute',
                            right: '16px',
                            top: '50px',
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            zIndex: 10,
                            minWidth: '180px'
                          }}>
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedActions(null);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 16px',
                                fontSize: '14px',
                                color: '#1f2937',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s',
                                borderBottom: '1px solid #f3f4f6'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <Edit size={16} />
                              Edit Campaign
                            </div>
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedActions(null);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 16px',
                                fontSize: '14px',
                                color: '#1f2937',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s',
                                borderBottom: '1px solid #f3f4f6'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <BarChart3 size={16} />
                              View Analytics
                            </div>
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedActions(null);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 16px',
                                fontSize: '14px',
                                color: '#1f2937',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <Pause size={16} />
                              Pause Campaign
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Col>

        {/* Right Sidebar - Campaign Details */}
        <Col xs={12} xl={3}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>{selectedCampaign.name}</h3>
              <button style={{
                padding: '6px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                color: '#6c757d'
              }}>
                <Edit size={18} />
              </button>
            </div>

            {/* Call Distribution Chart */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#495057' }}>
                Call Distribution
              </h4>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                    formatter={(value, entry: any) => (
                      <span style={{ fontSize: '0.875rem', color: '#495057' }}>
                        {value}: {entry.payload.value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ 
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '4px solid #0d6efd'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.25rem' }}>
                  Total Calls
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
                  {selectedCampaign.callsMade}
                </div>
              </div>
              <div style={{ 
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '4px solid #198754'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.25rem' }}>
                  Answered
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
                  {selectedCampaign.answered}
                </div>
              </div>
              <div style={{ 
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '4px solid #dc3545'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.25rem' }}>
                  Failed
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
                  {selectedCampaign.failed}
                </div>
              </div>
              <div style={{ 
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '4px solid #0dcaf0'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.25rem' }}>
                  Success Rate
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
                  {selectedCampaign.successRate}%
                </div>
              </div>
            </div>

            {/* Recent Outcomes */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#495057', margin: 0 }}>Recent Outcomes</h4>
                <span style={{
                  padding: '4px 8px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>3</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selectedCampaign.recentOutcomes.map((outcome, index) => (
                  <span 
                    key={index}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: outcome.color === 'primary' ? '#cfe2ff' : outcome.color === 'info' ? '#cff4fc' : '#fff3cd',
                      color: outcome.color === 'primary' ? '#084298' : outcome.color === 'info' ? '#055160' : '#664d03',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    {outcome.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#495057', marginBottom: '1rem' }}>
                Quick Actions
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  onClick={() => setShowReports(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    color: '#495057',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                    e.currentTarget.style.borderColor = '#ced4da';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.borderColor = '#e9ecef';
                  }}
                >
                  <BarChart3 size={18} />
                  View Detailed Reports
                </button>
                <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  color: '#495057',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                  e.currentTarget.style.borderColor = '#ced4da';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#e9ecef';
                }}
                >
                  <Pause size={18} />
                  Pause Campaign
                </button>
                <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  color: '#495057',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                  e.currentTarget.style.borderColor = '#ced4da';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#e9ecef';
                }}
                >
                  <Copy size={18} />
                  Duplicate Campaign
                </button>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default CampaignListingPage;
