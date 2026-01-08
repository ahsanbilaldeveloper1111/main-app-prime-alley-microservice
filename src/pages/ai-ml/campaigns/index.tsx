import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useEffect,
  useCallback
} from "react";
import { useRouter } from 'next/router';
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

import { ListCampaigns, DeleteCampaign, ListVoiceBots, UpdateCampaign, DispatchCampaign, GetCampaignById, GetVoiceBotById } from "@utils/aiml";
import ConfirmModal from "@pages/partial/ConfirmModal";
import { toast } from "react-toastify";
import { Row, Col } from 'react-bootstrap';
import {
  Search,
  MoreVertical,
  Users,
  MessageSquare,
  TrendingUp,
  Edit,
  BarChart3,
  Copy,
  Pause,
  Play,
  Phone,
  Bell,
  Target,
  Gift,
  Plus,
  Trash2
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

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
  status?: string;
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

const AIMLCampaigns = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBotProfile, setSelectedBotProfile] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('running');
  const [currentPage] = useState<number>(1);
  const [expandedActions, setExpandedActions] = useState<number | null>(null);
  const [showReports, setShowReports] = useState<boolean>(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [voiceBots, setVoiceBots] = useState<any[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [selectedCampaignForDelete, setSelectedCampaignForDelete] = useState<Campaign | null>(null);
  const [showDispatchModal, setShowDispatchModal] = useState<boolean>(false);
  const [selectedCampaignForDispatch, setSelectedCampaignForDispatch] = useState<Campaign | null>(null);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignDetail | null>(null);

  // Icon mapping based on campaign name or type
  const getCampaignIcon = (name: string, type?: string) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('follow') || nameLower.includes('support')) {
      return <Phone size={20} color="white" />;
    } else if (nameLower.includes('sales')) {
      return <Bell size={20} color="white" />;
    } else if (nameLower.includes('feedback') || nameLower.includes('survey')) {
      return <Target size={20} color="white" />;
    } else if (nameLower.includes('promotion') || nameLower.includes('holiday')) {
      return <Gift size={20} color="white" />;
    }
    return <Phone size={20} color="white" />;
  };

  const getCampaignIconColor = (index: number) => {
    const colors = ['#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#10b981', '#f97316'];
    return colors[index % colors.length];
  };

  // Normalize campaign data from API
  const normalizeCampaign = (campaign: any, index: number): Campaign => {
    const status = campaign.status || 'inactive';
    const isActive = status === 'active';
    
    // Calculate progress (mock for now, can be replaced with actual data)
    const progress = isActive ? Math.floor(Math.random() * 30 + 60) : 0;
    
    return {
      id: campaign.id || 0,
      name: campaign.name || 'Unnamed Campaign',
      icon: getCampaignIcon(campaign.name || ''),
      iconColor: getCampaignIconColor(index),
      botProfile: campaign.voice_bot_name || 'No Bot Assigned',
      client: campaign.client_workspace || campaign.owner || 'N/A',
      type: campaign.type || 'Outbound',
      scheduled: campaign.schedule_time ? new Date(campaign.schedule_time).toLocaleDateString() : 'Not Scheduled',
      progress: progress,
      progressColor: progress > 70 ? '#20c997' : progress > 40 ? '#ffc107' : '#dc3545',
      callsMade: campaign.numbers_count || 0,
      answered: Math.floor((campaign.numbers_count || 0) * 0.7),
      failed: Math.floor((campaign.numbers_count || 0) * 0.1),
      status: status // Store original status
    };
  };

  // Fetch campaigns from API
  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: currentPage,
        page_size: 50
      };
      
      if (selectedBotProfile !== 'all') {
        params.voice_bot_id = Number.parseInt(selectedBotProfile, 10);
      }

      const response = await ListCampaigns(params);
      const campaignsData = response?.results?.data || [];
      const normalizedCampaigns = campaignsData.map((campaign: any, index: number) => 
        normalizeCampaign(campaign, index)
      );
      
      setCampaigns(normalizedCampaigns);
      
      // Set first campaign as selected if available
      if (normalizedCampaigns.length > 0 && !selectedCampaign) {
        const firstCampaign = normalizedCampaigns[0];
        setSelectedCampaign({
          name: firstCampaign.name,
          callsMade: firstCampaign.callsMade,
          answered: firstCampaign.answered,
          keyOutcomes: 9,
          successRate: firstCampaign.progress,
          failed: firstCampaign.failed,
          recentOutcomes: [
            { label: '5 Follow Up Scheduled', color: 'primary' },
            { label: '2 Left Voicemail', color: 'info' },
            { label: '11 Escalated to Support', color: 'warning' }
          ]
        });
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, selectedBotProfile]);

  // Fetch voice bots for filter dropdown
  const fetchVoiceBots = useCallback(async () => {
    try {
      const response = await ListVoiceBots();
      const botsData = response?.results?.data || response?.bots || response?.data || [];
      setVoiceBots(botsData);
    } catch (error) {
      console.error('Error fetching voice bots:', error);
    }
  }, []);

  // Load data on mount and when filters change
  useEffect(() => {
    fetchVoiceBots();
  }, [fetchVoiceBots]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Filter campaigns based on search and filters
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         campaign.botProfile.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBot = selectedBotProfile === 'all' || campaign.botProfile === selectedBotProfile;
    const matchesStatus = statusFilter === 'running' ? campaign.progress > 0 : campaign.progress === 0;
    
    return matchesSearch && matchesBot && matchesStatus;
  });

  // Handle campaign selection
  const handleCampaignSelect = (campaign: Campaign) => {
    setSelectedCampaign({
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
    });
  };

  // Handle edit campaign
  const handleEditCampaign = (campaignId: number) => {
    router.push(`/ai-ml/campaigns/edit-campaign?id=${campaignId}`);
  };

  // Handle pause/resume campaign
  const handlePauseResumeCampaign = async (campaignId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await UpdateCampaign(campaignId, { status: newStatus });
      // Refresh campaigns list
      fetchCampaigns();
      setExpandedActions(null);
    } catch (error) {
      console.error('Error updating campaign status:', error);
    }
  };

  // Handle delete campaign - show modal
  const handleDeleteCampaign = (campaign: Campaign) => {
    setSelectedCampaignForDelete(campaign);
    setShowDeleteModal(true);
    setExpandedActions(null);
  };

  // Confirm delete campaign
  const handleConfirmDelete = async () => {
    if (!selectedCampaignForDelete) return;

    try {
      await DeleteCampaign(selectedCampaignForDelete.id);
      setShowDeleteModal(false);
      setSelectedCampaignForDelete(null);
      // Refresh campaigns list
      fetchCampaigns();
      // Clear selected campaign if it was deleted
      if (selectedCampaign && selectedCampaign.name === selectedCampaignForDelete.name) {
        setSelectedCampaign(null);
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
      // Error handling is done in DeleteCampaign function
    }
  };

  // Handle dispatch campaign - show modal
  const handleDispatchCampaign = (campaign: Campaign) => {
    setSelectedCampaignForDispatch(campaign);
    setShowDispatchModal(true);
    setExpandedActions(null);
  };

  // Confirm dispatch campaign
  const handleConfirmDispatch = async () => {
    if (!selectedCampaignForDispatch) return;

    setIsDispatching(true);
    try {
      // Fetch campaign details to get phone numbers and voice_bot_id
      const campaignDetails = await GetCampaignById(selectedCampaignForDispatch.id);
      
      if (!campaignDetails) {
        toast.error('Failed to fetch campaign details');
        setIsDispatching(false);
        return;
      }

      // Prepare dispatch payload
      // Convert phone numbers to comma-separated string
      let phoneNumbersString = '';
      if (campaignDetails?.numbers_to_call) {
        if (Array.isArray(campaignDetails.numbers_to_call)) {
          phoneNumbersString = campaignDetails.numbers_to_call.join(',');
        } else if (typeof campaignDetails.numbers_to_call === 'string') {
          phoneNumbersString = campaignDetails.numbers_to_call;
        } else if (typeof campaignDetails.numbers_to_call === 'object') {
          // If it's an object, try to extract values
          phoneNumbersString = Object.values(campaignDetails.numbers_to_call).join(',');
        }
      }

      const dispatchPayload: any = {
        phone_numbers: phoneNumbersString,
        client_info: '3', // Hardcoded as requested
      };

      // Fetch voice bot details to get trunk_id and context
      if (campaignDetails.voice_bot_id) {
        const voiceBotDetails = await GetVoiceBotById(campaignDetails.voice_bot_id);
        
        if (voiceBotDetails) {
          // Get trunk_id from voice bot (could be in trunk or sip_trunk_id field)
          if (voiceBotDetails.trunk) {
            dispatchPayload.trunk_id = voiceBotDetails.trunk.toString();
          } else if (voiceBotDetails.sip_trunk_id) {
            dispatchPayload.trunk_id = voiceBotDetails.sip_trunk_id.toString();
          }
          
          // Get context from voice bot (greeting_prompt)
          if (voiceBotDetails.greeting_prompt) {
            dispatchPayload.vbot_context = voiceBotDetails.greeting_prompt;
          }
        }
      }

      await DispatchCampaign(dispatchPayload);
      
      // Refresh campaigns list
      fetchCampaigns();
      setShowDispatchModal(false);
      setSelectedCampaignForDispatch(null);
    } catch (error) {
      console.error('Error dispatching campaign:', error);
      // Error handling is done in DispatchCampaign function
    } finally {
      setIsDispatching(false);
    }
  };


  // Prepare pie chart data
  const pieChartData = selectedCampaign ? [
    { name: 'Answered', value: selectedCampaign.answered, color: '#198754' },
    { name: 'Failed', value: selectedCampaign.failed, color: '#dc3545' },
    { name: 'Pending', value: selectedCampaign.callsMade - selectedCampaign.answered - selectedCampaign.failed, color: '#ffc107' }
  ] : [];

  // Calculate stats from campaigns
  const activeCampaigns = campaigns.filter(c => c.progress > 0).length;
  const totalCalls = campaigns.reduce((sum, c) => sum + c.callsMade, 0);
  const avgSuccessRate = campaigns.length > 0 
    ? Math.round(campaigns.reduce((sum, c) => sum + c.progress, 0) / campaigns.length)
    : 0;

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Campaigns" />

      <div style={{  backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '700', margin: 0, color: '#1f2937' }}>
          Campaigns
        </h2>
        <button
         onClick={() => router.push('/ai-ml/campaigns/create-campaign')}
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
                    <div style={{ fontSize: '3rem', fontWeight: '700', color: '#0d6efd' }}>{activeCampaigns}</div>
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
                    <div style={{ fontSize: '3rem', fontWeight: '700', color: '#0dcaf0' }}>{totalCalls}</div>
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
                    <div style={{ fontSize: '3rem', fontWeight: '700', color: '#198754' }}>{avgSuccessRate}%</div>
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
                  {voiceBots.map((bot) => (
                    <option key={bot.id} value={bot.id}>
                      {bot.bot_name || bot.name || 'Unnamed Bot'}
                    </option>
                  ))}
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
                    {/* <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Type</th> */}
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Progress</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
                        Loading campaigns...
                      </td>
                    </tr>
                  ) : filteredCampaigns.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
                        No campaigns found
                      </td>
                    </tr>
                  ) : (
                    filteredCampaigns.map((campaign) => (
                    <tr 
                      key={campaign.id} 
                      style={{ transition: 'background-color 0.2s', cursor: 'pointer' }}
                      onClick={() => handleCampaignSelect(campaign)}
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
                      {/* <td style={{ padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
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
                      </td> */}
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
                                handleEditCampaign(campaign.id);
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
                                handleDispatchCampaign(campaign);
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
                              <Phone size={16} />
                              Dispatch Campaign
                            </div>
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePauseResumeCampaign(campaign.id, campaign.status || 'inactive');
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
                              {campaign.status === 'active' ? (
                                <>
                                  <Pause size={16} />
                                  Pause Campaign
                                </>
                              ) : (
                                <>
                                  <Play size={16} />
                                  Resume Campaign
                                </>
                              )}
                            </div>
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCampaign(campaign);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 16px',
                                fontSize: '14px',
                                color: '#dc3545',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <Trash2 size={16} />
                              Delete Campaign
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>
        </Col>

        {/* Right Sidebar - Campaign Details */}
        <Col xs={12} xl={3}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            {selectedCampaign ? (
              <>
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
            {selectedCampaign && pieChartData.length > 0 && (
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
            )}

            {/* Stats Grid */}
            {selectedCampaign && (
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
            )}

            {/* Recent Outcomes */}
            {selectedCampaign && (
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
                  }}>{selectedCampaign.recentOutcomes.length}</span>
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
            )}

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
              </>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
                Select a campaign to view details
              </div>
            )}
          </div>
        </Col>
      </Row>
    </div>

    {/* Delete Confirmation Modal */}
    <ConfirmModal
      show={showDeleteModal}
      onHide={() => {
        setShowDeleteModal(false);
        setSelectedCampaignForDelete(null);
      }}
      title="Delete Campaign"
      description={`Are you sure you want to delete the campaign "${selectedCampaignForDelete?.name}"? This action cannot be undone.`}
      targetName={selectedCampaignForDelete?.name || ''}
      onConfirm={handleConfirmDelete}
      onCancel={() => {
        setShowDeleteModal(false);
        setSelectedCampaignForDelete(null);
      }}
      confirmButtonText="Delete"
      confirmButtonVariant="danger"
      requireTextConfirmation={true}
      requiredConfirmationText="delete"
    />

    {/* Dispatch Confirmation Modal */}
    <ConfirmModal
      show={showDispatchModal}
      onHide={() => {
        setShowDispatchModal(false);
        setSelectedCampaignForDispatch(null);
      }}
      title="Dispatch Campaign"
      description={`Are you sure you want to dispatch the campaign "${selectedCampaignForDispatch?.name}"? This will initiate calls for this campaign.`}
      targetName={selectedCampaignForDispatch?.name || ''}
      onConfirm={handleConfirmDispatch}
      onCancel={() => {
        setShowDispatchModal(false);
        setSelectedCampaignForDispatch(null);
      }}
      confirmButtonText={isDispatching ? "Dispatching..." : "Dispatch"}
      confirmButtonVariant="primary"
      requireTextConfirmation={true}
      requiredConfirmationText="dispatch"
      loading={isDispatching}
    />
    </React.Fragment>
  );
};

AIMLCampaigns.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default AIMLCampaigns;
