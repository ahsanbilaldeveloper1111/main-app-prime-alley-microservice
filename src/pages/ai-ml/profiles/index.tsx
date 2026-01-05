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

import { Container, Row, Col } from 'react-bootstrap';
import {
  Search,
  Plus,
  Edit,
  BarChart3,
  Pause,
  Play,
  Filter,
  Bot,
  Calendar,
  Phone,
  Flag,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  Settings,
  HelpCircle,
  User,
  Home
} from 'lucide-react';
import CampaignListingPage from '@components/campaign-listing';
import VoiceBotCreation from './voicebot-create';
import { useRouter } from 'next/router';

interface Bot {
  id: number;
  name: string;
  description: string;
  language: string;
  languageFlag: string;
  callerId: string;
  trunkId: string;
  status: 'Active' | 'Inactive' | 'Paused';
}

interface Campaign {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Completed' | 'Scheduled';
  botsCount: number;
}



const AIMLProfiles = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [trunkFilter, setTrunkFilter] = useState<string>('all');
  const [expandedActions, setExpandedActions] = useState<number | null>(null);

  const [bots, setBots] = useState<Bot[]>([
    {
      id: 1,
      name: 'Support Bot',
      description: 'Handles support inquiries',
      language: 'English',
      languageFlag: '🇺🇸',
      callerId: '+12223334455',
      trunkId: 'SipCom-01',
      status: 'Active'
    },
    {
      id: 2,
      name: 'Sales Bot',
      description: 'Sales inquiry chatbot',
      language: 'Spanish',
      languageFlag: '🇪🇸',
      callerId: '+34444555666',
      trunkId: 'SipCom-01',
      status: 'Active'
    },
    {
      id: 3,
      name: 'Assistant Bot',
      description: 'General assistant bot',
      language: 'French',
      languageFlag: '🇫🇷',
      callerId: '+551122336644',
      trunkId: 'SipCom-02',
      status: 'Active'
    }
  ]);

  const [campaigns] = useState<Campaign[]>([
    {
      id: 1,
      name: 'Summer Promotion',
      description: 'Summer sales campaign',
      startDate: '2024-06-01',
      endDate: '2024-08-31',
      status: 'Active',
      botsCount: 5
    },
    {
      id: 2,
      name: 'Customer Feedback',
      description: 'Collecting customer feedback',
      startDate: '2024-05-15',
      endDate: '2024-07-15',
      status: 'Active',
      botsCount: 3
    },
    {
      id: 3,
      name: 'Holiday Campaign',
      description: 'End of year holiday campaign',
      startDate: '2024-12-01',
      endDate: '2024-12-31',
      status: 'Scheduled',
      botsCount: 8
    }
  ]);

  const handlePauseBot = (id: number) => {
    setBots(bots.map(bot => 
      bot.id === id 
        ? { ...bot, status: bot.status === 'Active' ? 'Paused' : 'Active' } 
        : bot
    ));
  };

  const filteredBots = bots.filter(bot => {
    const matchesSearch = bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bot.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLanguage = languageFilter === 'all' || bot.language === languageFilter;
    const matchesStatus = statusFilter === 'all' || bot.status === statusFilter;
    const matchesTrunk = trunkFilter === 'all' || bot.trunkId === trunkFilter;
    
    return matchesSearch && matchesLanguage && matchesStatus && matchesTrunk;
  });

  const getStatusVariant = (status: string): string => {
    switch (status) {
      case 'Active': return 'success';
      case 'Paused': return 'warning';
      case 'Inactive': return 'secondary';
      case 'Completed': return 'info';
      case 'Scheduled': return 'primary';
      default: return 'secondary';
    }
  };
const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active': return <CheckCircle size={14} />;
      case 'Paused': return <Clock size={14} />;
      case 'Inactive': return <XCircle size={14} />;
      case 'Completed': return <CheckCircle size={14} />;
      case 'Scheduled': return <Calendar size={14} />;
      default: return <XCircle size={14} />;
    }
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Voice Bot Profiles" />

      <PageHeader
        title="Voice Bot Profiles"
        showSearch={false}
        buttons={
          <button
      onClick={() => router.push('/ai-ml/profiles/voicebot-create')}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '10px 16px',
        backgroundColor: '#667eea',
        border: 'none',
        color: 'white',
        fontSize: '14px',
        fontWeight: 500,
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5568d3'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#667eea'}
    >
      <Plus size={18} />
      Create Bot
    </button>
        }>
        </PageHeader>
    

<div>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              {/* Filters and Actions */}
              <Row className="g-3 mb-4">
                <Col xs={12} md={6} lg={4} xl={2}>
                  <div style={{ position: 'relative' }}>
                    <Search size={18} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input
                      type="text"
                      placeholder="Search bots..."
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
                
                <Col xs={12} sm={6} md={3} lg={2} xl={2}>
                  <select
                    value={languageFilter}
                    onChange={(e) => setLanguageFilter(e.target.value)}
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
                    <option value="all">All Languages</option>
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                  </select>
                </Col>
  
                <Col xs={12} sm={6} md={3} lg={2} xl={2}>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
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
                    <option value="all">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Paused">Paused</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </Col>
  
                <Col xs={12} sm={6} md={6} lg={2} xl={2}>
                  <select
                    value={trunkFilter}
                    onChange={(e) => setTrunkFilter(e.target.value)}
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
                    <option value="all">All Trunks</option>
                    <option value="SipCom-01">SipCom-01</option>
                    <option value="SipCom-02">SipCom-02</option>
                  </select>
                </Col>
  
              </Row>
  
              {/* Bots Table */}
              <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>ID</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Bot Name</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Description</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Language</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Caller ID</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Trunk ID</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBots.map((bot) => (
                      <tr key={bot.id} style={{ transition: 'background-color 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#1f2937', borderBottom: '1px solid #f3f4f6' }}>{bot.id}</td>
                        <td style={{ padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #667eea 0%, #667eea  100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <Bot size={20} color="white" />
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>{bot.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280', borderBottom: '1px solid #f3f4f6' }}>{bot.description}</td>
                        <td style={{ padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Flag size={16} color="#6b7280" />
                            <span style={{ fontSize: '14px', color: '#1f2937' }}>{bot.language}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', fontFamily: 'monospace', color: '#1f2937', borderBottom: '1px solid #f3f4f6' }}>{bot.callerId}</td>
                        <td style={{ padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 12px',
                            backgroundColor: '#f3f4f6',
                            color: '#6b7280',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: 500
                          }}>
                            <Phone size={12} />
                            {bot.trunkId}
                          </span>
                        </td>
                        <td style={{ padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            backgroundColor: bot.status === 'Active' ? '#d1fae5' : bot.status === 'Paused' ? '#fef3c7' : '#f3f4f6',
                            color: bot.status === 'Active' ? '#059669' : bot.status === 'Paused' ? '#d97706' : '#6b7280',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: 500
                          }}>
                            {getStatusIcon(bot.status)}
                            {bot.status}
                          </span>
                        </td>
                        <td style={{ padding: '16px', borderBottom: '1px solid #f3f4f6', position: 'relative' }}>
                          <button
                            onClick={() => setExpandedActions(expandedActions === bot.id ? null : bot.id)}
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
                          {expandedActions === bot.id && (
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
                                onClick={() => setExpandedActions(null)}
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
                                Edit Bot
                              </div>
                              <div
                                onClick={() => setExpandedActions(null)}
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
                                View Reports
                              </div>
                              <div
                                onClick={() => {
                                  handlePauseBot(bot.id);
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
                                {bot.status === 'Active' ? (
                                  <>
                                    <Pause size={16} />
                                    Pause Bot
                                  </>
                                ) : (
                                  <>
                                    <Play size={16} />
                                    Resume Bot
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
  
              {filteredBots.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <Bot size={48} color="#d1d5db" style={{ marginBottom: '16px' }} />
                  <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>No bots found matching your criteria</p>
                </div>
              )}
            </div>
          </div>

    </React.Fragment>
  );
};

AIMLProfiles.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default AIMLProfiles;
