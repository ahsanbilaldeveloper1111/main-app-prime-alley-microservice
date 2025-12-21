import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Form, InputGroup } from 'react-bootstrap';
import { Eye, Phone, CheckCircle, AlertCircle, Maximize2, ExternalLink, Volume2, Mic, Users, Headset, User, Bell, ChevronLeft, ChevronRight, Menu, Search, Filter, ChevronDown, ChevronUp, UserCheck, Clock, Timer, UserX, PhoneIncoming, Hourglass } from 'lucide-react';
import ModernSidebar from '@components/custom-sidebar';
import ProfileSidebar from '@components/profile-sidebar';
import CompanyLogo2 from "@assets/images/ringedge-logo-black-n-blue.png";

import 'bootstrap/dist/css/bootstrap.min.css';

// Type definitions
interface Agent {
    id: number;
    extension: string;
    name: string;
    status: string;
    callStatus?: string;
    duration?: string;
    from: string;
    to: string;
    deviceType: 'phone' | 'soft';
    deviceStatus: 'active' | 'offline';
    agentStatus?: 'active' | 'idle'; // New field for agent active/idle status
    supervisionType?: 'silent-monitor' | 'whisper' | 'barge-in'; // Type of supervision
    supervisedAgent?: string; // The agent being supervised
  }
  
  // Mock data
  const mockData: {
    supervision: Agent[];
    onCall: Agent[];
    activeIdle: Agent[];
    downOffline: Agent[];
  } = {
    supervision: [
      { id: 201, extension: '501', name: 'Supervisor Alice', status: 'Live Coaching', callStatus: 'MONITORING', duration: '00:01:45', from: '501', to: '512', deviceType: 'soft' as const, deviceStatus: 'active' as const, supervisionType: 'silent-monitor' as const, supervisedAgent: 'John Doe (512)' },
      { id: 202, extension: '502', name: 'Supervisor Bob', status: 'Live Coaching', callStatus: 'ACTIVE', duration: '00:03:22', from: '502', to: '545', deviceType: 'phone' as const, deviceStatus: 'active' as const, supervisionType: 'whisper' as const, supervisedAgent: 'Mike Johnson (545)' },
      { id: 203, extension: '503', name: 'Supervisor Carol', status: 'Live Coaching', callStatus: 'ACTIVE', duration: '00:02:10', from: '503', to: '542', deviceType: 'soft' as const, deviceStatus: 'active' as const, supervisionType: 'barge-in' as const, supervisedAgent: 'Sarah Smith (542)' }
    ],
    onCall: [
      { id: 1, extension: '512', name: 'John Doe', status: 'Live Calls', callStatus: 'OUTGOING', duration: '00:02:45', from: '512', to: '585', deviceType: 'soft' as const, deviceStatus: 'active' as const },
      { id: 2, extension: '542', name: 'Sarah Smith', status: 'Live Calls', callStatus: 'OUTGOING', duration: '00:01:12', from: '542', to: '601', deviceType: 'soft' as const, deviceStatus: 'active' as const },
      { id: 3, extension: '545', name: 'Mike Johnson', status: 'Live Calls', callStatus: 'CONNECTED', duration: '00:05:30', from: '545', to: '702', deviceType: 'phone' as const, deviceStatus: 'active' as const },
      { id: 4, extension: '585', name: 'Emily Davis', status: 'Live Calls', callStatus: 'CONNECTED', duration: '00:03:18', from: '585', to: '512', deviceType: 'soft' as const, deviceStatus: 'active' as const }
    ],
    activeIdle: [
      { id: 5, extension: '105', name: 'Alex Brown', status: 'Available & Idle', from: 'N/A', to: 'N/A', deviceType: 'phone' as const, deviceStatus: 'active' as const, agentStatus: 'active' as const },
      { id: 6, extension: '108', name: 'Lisa Wilson', status: 'Available & Idle', from: 'N/A', to: 'N/A', deviceType: 'soft' as const, deviceStatus: 'active' as const, agentStatus: 'idle' as const },
      { id: 7, extension: '513', name: 'Tom Anderson', status: 'Available & Idle', from: 'N/A', to: 'N/A', deviceType: 'phone' as const, deviceStatus: 'active' as const, agentStatus: 'active' as const },
      { id: 8, extension: '521', name: 'Maria Garcia', status: 'Available & Idle', from: 'N/A', to: 'N/A', deviceType: 'soft' as const, deviceStatus: 'active' as const, agentStatus: 'idle' as const },
      { id: 9, extension: '562', name: 'Kevin Lee', status: 'Available & Idle', from: 'N/A', to: 'N/A', deviceType: 'phone' as const, deviceStatus: 'active' as const, agentStatus: 'active' as const },
      { id: 10, extension: '514', name: 'Rachel Green', status: 'Available & Idle', from: 'N/A', to: 'N/A', deviceType: 'soft' as const, deviceStatus: 'active' as const, agentStatus: 'idle' as const }
    ],
    downOffline: [
      { id: 11, extension: '101', name: 'Robert Lee', status: 'Offline', from: 'N/A', to: 'N/A', deviceType: 'soft' as const, deviceStatus: 'offline' as const },
      { id: 12, extension: '102', name: 'Jennifer White', status: 'Offline', from: 'N/A', to: 'N/A', deviceType: 'soft' as const, deviceStatus: 'offline' as const },
      { id: 13, extension: '103', name: 'David Martin', status: 'Offline', from: 'N/A', to: 'N/A', deviceType: 'soft' as const, deviceStatus: 'offline' as const },
      { id: 14, extension: '107', name: 'Susan Taylor', status: 'Offline', from: 'N/A', to: 'N/A', deviceType: 'phone' as const, deviceStatus: 'offline' as const },
      { id: 15, extension: '109', name: 'James Moore', status: 'Offline', from: 'N/A', to: 'N/A', deviceType: 'soft' as const, deviceStatus: 'offline' as const },
      { id: 16, extension: '511', name: 'Patricia Hill', status: 'Offline', from: 'N/A', to: 'N/A', deviceType: 'soft' as const, deviceStatus: 'offline' as const }
    ]
  };

const LiveViewPage = () => {
  const [fullscreen, setFullscreen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(typeof window !== 'undefined' && window.innerWidth >= 1200);
  const [activeScreen, setActiveScreen] = useState<string>('live-view');
  const [showProfileSidebar, setShowProfileSidebar] = useState(false);
  const contentWrapperRef = React.useRef<HTMLDivElement>(null);
  
  // Filter and sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('none');
  
  // Applied filters (only update on button click)
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedTeam, setAppliedTeam] = useState('all');
  const [appliedStatus, setAppliedStatus] = useState('all');
  const [appliedSort, setAppliedSort] = useState('none');
  
  // Collapsible sections state
  const [collapsedSections, setCollapsedSections] = useState<{ [key: string]: boolean }>({
    supervision: false,
    onCall: false,
    activeIdle: false,
    downOffline: false
  });
  
  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  const expandAll = () => {
    setCollapsedSections({
      supervision: false,
      onCall: false,
      activeIdle: false,
      downOffline: false
    });
  };
  
  const collapseAll = () => {
    setCollapsedSections({
      supervision: true,
      onCall: true,
      activeIdle: true,
      downOffline: true
    });
  };
  
  // Apply filters function
  const applyFilters = () => {
    setAppliedSearch(searchQuery);
    setAppliedTeam(selectedTeam);
    setAppliedStatus(selectedStatus);
    setAppliedSort(sortBy);
  };
  
  // Clear filters function
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTeam('all');
    setSelectedStatus('all');
    setSortBy('none');
    setAppliedSearch('');
    setAppliedTeam('all');
    setAppliedStatus('all');
    setAppliedSort('none');
  };
  
  // Filter and sort function
  const filterAndSortAgents = (agents: Agent[]) => {
    let filtered = [...agents];
    
    // Apply search filter
    if (appliedSearch) {
      filtered = filtered.filter(agent => 
        agent.name.toLowerCase().includes(appliedSearch.toLowerCase()) ||
        agent.extension.includes(appliedSearch)
      );
    }
    
    // Apply status filter
    if (appliedStatus !== 'all') {
      const statusMap: { [key: string]: string } = {
        'supervision': 'Live Coaching',
        'oncall': 'Live Calls',
        'active': 'Available & Idle',
        'offline': 'Offline'
      };
      filtered = filtered.filter(agent => agent.status === statusMap[appliedStatus]);
    }
    
    // Apply sort
    if (appliedSort !== 'none' && filtered.some(a => a.duration)) {
      filtered.sort((a, b) => {
        const durationA = a.duration || '00:00:00';
        const durationB = b.duration || '00:00:00';
        const [hA, mA, sA] = durationA.split(':').map(Number);
        const [hB, mB, sB] = durationB.split(':').map(Number);
        const totalA = hA * 3600 + mA * 60 + sA;
        const totalB = hB * 3600 + mB * 60 + sB;
        return appliedSort === 'longest' ? totalB - totalA : totalA - totalB;
      });
    }
    
    return filtered;
  };

  // Handle fullscreen mode
  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        await contentWrapperRef.current?.requestFullscreen();
      } else {
        // Exit fullscreen
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  // Handle window resize to manage sidebar state
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1200) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ...existing code...

 // ...existing code...

 const renderAgentCard = (agent: Agent, showCallControls: boolean = false) => {
    // Determine card border based on status - Consistent color scheme
    // Green = Active/Connected, Amber = Idle/Wrap-up/Ringing, Red = Offline/Disconnected, Grey = Unknown
    const getCardStyle = () => {
      if (agent.status === 'Live Coaching') {
        return {
          borderLeft: '4px solid #f59e0b' // Amber for monitoring
        };
      } else if (agent.status === 'Live Calls') {
        return {
          borderLeft: '4px solid #22c55e' // Green for active calls
        };
      } else if (agent.status === 'Available & Idle') {
        // Green for active, Amber for idle
        return {
          borderLeft: agent.agentStatus === 'active' ? '4px solid #22c55e' : '4px solid #f59e0b'
        };
      } else if (agent.status === 'Offline') {
        return {
          borderLeft: '4px solid #ef4444' // Red for offline/disconnected
        };
      } else {
        return {
          borderLeft: '4px solid #94a3b8' // Grey for unknown
        };
      }
    };

    const cardStyle = getCardStyle();

    return (
      <Col key={agent.id} xs={12} sm={6} md={4} lg={3} xl={2} className="mb-3">
        <Card 
          className="shadow-sm border-0" 
          style={{ 
            borderRadius: '8px',
            ...cardStyle,
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
        >
          <Card.Body className="p-2 d-flex flex-column">
            {/* User Avatar and Status */}
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center flex-grow-1" style={{ minWidth: 0 }}>
                <div 
                  className="position-relative me-2" 
                  style={{ 
                    width: '36px', 
                    height: '36px', 
                    minWidth: '36px'
                  }}
                >
                  <img 
                    src={"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRqY-XfJc1xS05PNGE0khicaIyUILD73E2MLw&s"} 
                    alt={agent.name}
                    className="rounded-circle"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      border: '2px solid #e5e7eb'
                    }}
                  />
                  {/* Green dot indicator for Live Calls agents (Active/Connected) */}
                  {agent.status === 'Live Calls' && (
                    <span 
                      className="position-absolute rounded-circle" 
                      style={{ 
                        width: '10px', 
                        height: '10px',
                        backgroundColor: '#22c55e',
                        top: '-2px',
                        right: '-2px',
                        border: '2px solid white',
                        boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)',
                        animation: 'pulse 2s infinite'
                      }}
                    />
                  )}
                </div>
                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                  <h6 className="mb-0 fw-semibold text-truncate" style={{ fontSize: 'clamp(0.875rem, 1.5vw, 0.95rem)', color: '#1f2937' }}>
                    {agent.name}
                  </h6>
                </div>
              </div>
              
              {/* Supervision Badge - For Live Coaching agents */}
              {agent.status === 'Live Coaching' && agent.supervisionType && (
                <div 
                  className="d-flex align-items-center gap-1 px-2 py-1 rounded" 
                  style={{ 
                    fontSize: '0.6rem', 
                    fontWeight: '600',
                    backgroundColor: agent.supervisionType === 'silent-monitor' ? '#dbeafe' : 
                                     agent.supervisionType === 'whisper' ? '#e9d5ff' : '#fed7aa',
                    color: agent.supervisionType === 'silent-monitor' ? '#1e40af' : 
                           agent.supervisionType === 'whisper' ? '#6b21a8' : '#9a3412',
                    border: `1px solid ${agent.supervisionType === 'silent-monitor' ? '#bfdbfe' : 
                            agent.supervisionType === 'whisper' ? '#d8b4fe' : '#fdba74'}`,
                    whiteSpace: 'nowrap',
                    marginLeft: '8px',
                    textTransform: 'uppercase'
                  }}
                >
                  {agent.supervisionType === 'silent-monitor' ? <Eye size={10} /> : 
                   agent.supervisionType === 'whisper' ? <Mic size={10} /> : <Volume2 size={10} />}
                  <span>{agent.supervisionType === 'silent-monitor' ? 'Monitor' : 
                         agent.supervisionType === 'whisper' ? 'Whisper' : 'Barge'}</span>
                </div>
              )}

              {/* Agent Status Badge - For Available & Idle agents */}
              {/* Green = Active, Amber = Idle */}
              {agent.status === 'Available & Idle' && agent.agentStatus && (
                <div 
                  className="d-flex align-items-center gap-1 px-2 py-1 rounded" 
                  style={{ 
                    fontSize: '0.6rem', 
                    fontWeight: '600',
                    backgroundColor: agent.agentStatus === 'active' ? '#dcfce7' : '#fef3c7',
                    color: agent.agentStatus === 'active' ? '#166534' : '#92400e',
                    border: `1px solid ${agent.agentStatus === 'active' ? '#bbf7d0' : '#fde68a'}`,
                    whiteSpace: 'nowrap',
                    marginLeft: '8px'
                  }}
                >
                  {agent.agentStatus === 'active' ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                  <span style={{ textTransform: 'capitalize' }}>{agent.agentStatus}</span>
                </div>
              )}

              {/* Call Status Badge - For Live Calls agents */}
              {/* Green = CONNECTED (Active), Amber = OUTGOING (Ringing) */}
              {showCallControls && agent.callStatus && agent.status !== 'Live Coaching' && (
                <div 
                  className="d-flex flex-column align-items-end gap-1"
                  style={{ marginLeft: '8px' }}
                >
                  <div 
                    className="d-flex align-items-center gap-1 px-2 py-1 rounded" 
                    style={{ 
                      fontSize: '0.6rem', 
                      fontWeight: '600',
                      backgroundColor: agent.callStatus === 'CONNECTED' ? '#dcfce7' : '#fef3c7',
                      color: agent.callStatus === 'CONNECTED' ? '#166534' : '#92400e',
                      border: `1px solid ${agent.callStatus === 'CONNECTED' ? '#bbf7d0' : '#fde68a'}`,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {agent.callStatus === 'CONNECTED' ? <CheckCircle size={10} /> : <Phone size={10} />}
                    <span>{agent.callStatus}</span>
                  </div>
                  {agent.duration && (
                    <div 
                      className="px-2 py-1 rounded" 
                      style={{ 
                        fontSize: '0.55rem', 
                        fontWeight: '600',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        color: '#1e40af',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {agent.duration}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Call Details */}
            <div 
              className="rounded p-2 mb-2" 
              style={{ 
                fontSize: '0.65rem',
                backgroundColor: 'transparent',
                border: 'none'
              }}
            >
              {agent.status === 'Live Coaching' && agent.supervisedAgent ? (
                <>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Supervisor:</span>
                    <span className="fw-semibold text-dark">{agent.extension}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Supervising:</span>
                    <span className="fw-semibold text-dark" style={{ fontSize: '0.6rem' }}>{agent.supervisedAgent}</span>
                  </div>
                  {agent.duration && (
                    <div className="d-flex justify-content-between mb-0">
                      <span className="text-muted">Duration:</span>
                      <span className="fw-semibold text-dark">{agent.duration}</span>
                    </div>
                  )}
                </>
              ) : (agent.status === 'Available & Idle' || agent.status === 'Offline') ? (
                <>
                  <div className="d-flex justify-content-between mb-0">
                    <span className="text-muted">EXT:</span>
                    <span className="fw-semibold text-dark">{agent.extension}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">EXT:</span>
                    <span className="fw-semibold text-dark">{agent.extension}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">From:</span>
                    <span className="fw-semibold text-dark">{agent.from}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-0">
                    <span className="text-muted">To:</span>
                    <span className="fw-semibold text-dark">{agent.to}</span>
                  </div>
                </>
              )}
            </div>

            {/* Bottom Section - Device & Controls */}
            {/* Green = Active, Red = Offline */}
            <div className="d-flex justify-content-between align-items-center mt-auto">
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ 
                  width: '28px', 
                  height: '28px',
                  backgroundColor: agent.deviceStatus === 'active' ? '#dcfce7' : '#fee2e2',
                  color: agent.deviceStatus === 'active' ? '#166534' : '#991b1b',
                  border: `2px solid ${agent.deviceStatus === 'active' ? '#bbf7d0' : '#fecaca'}`
                }}
              >
                {agent.deviceType === 'phone' ? <Phone size={12} /> : <Headset size={12} />}
              </div>

              {showCallControls && (
                <div className="d-flex gap-1">
                  <Button 
                    variant="light" 
                    size="sm" 
                    className="p-0 border" 
                    style={{ 
                      width: '24px', 
                      height: '24px', 
                      borderRadius: '4px',
                      backgroundColor: '#dbeafe',
                      color: '#1e40af',
                      borderColor: '#bfdbfe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                    title="Silent Monitor"
                  >
                    <Volume2 size={11} />
                  </Button>
                  <Button 
                    variant="light" 
                    size="sm" 
                    className="p-0 border" 
                    style={{ 
                      width: '24px', 
                      height: '24px', 
                      borderRadius: '4px',
                      backgroundColor: '#e9d5ff',
                      color: '#6b21a8',
                      borderColor: '#d8b4fe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                    title="Whisper"
                  >
                    <Mic size={11} />
                  </Button>
                  <Button 
                    variant="light" 
                    size="sm" 
                    className="p-0 border" 
                    style={{ 
                      width: '24px', 
                      height: '24px', 
                      borderRadius: '4px',
                      backgroundColor: '#fed7aa',
                      color: '#9a3412',
                      borderColor: '#fdba74',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                    title="Barge In"
                  >
                    <Users size={11} />
                  </Button>
                </div>
              )}
            </div>
          </Card.Body>
        </Card>
      </Col>
    );
  };

// ...existing code...


// ...existing code...

  const renderSection = (title: string, icon: React.ReactNode, data: Agent[], badgeColor: string, showCallControls: boolean = false, sectionKey: string) => {
    const isCollapsed = collapsedSections[sectionKey];
    
    return (
      <div className="mb-4">
        {/* Section Header */}
        <Card className="border-0 shadow-sm mb-3">
          <Card.Body className="p-3">
            <div className="d-flex justify-content-between align-items-center">
              <Button
                variant="link"
                className="p-0 text-dark text-decoration-none d-flex align-items-center gap-2"
                onClick={() => toggleSection(sectionKey)}
                style={{ fontSize: '1.1rem', fontWeight: '600' }}
              >
                {isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
                <div style={{ 
                  color: sectionKey === 'supervision' ? '#f59e0b' : 
                         sectionKey === 'onCall' ? '#22c55e' : 
                         sectionKey === 'activeIdle' ? '#6b7280' : 
                         sectionKey === 'downOffline' ? '#ef4444' : '#6b7280'
                }}>{icon}</div>
                <span>{title}</span>
              </Button>
              <Badge 
                bg="light" 
                text="dark" 
                className="px-3 py-2 border"
                style={{ fontSize: '0.85rem', fontWeight: '600' }}
              >
                {data.length}
              </Badge>
            </div>
          </Card.Body>
        </Card>

        {/* Section Content */}
        {!isCollapsed && (
          data.length > 0 ? (
            <Row className="g-3">
              {data.map((agent: Agent) => renderAgentCard(agent, showCallControls))}
            </Row>
          ) : (
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center py-5">
                <AlertCircle size={40} className="mb-3 text-muted opacity-25" />
                <p className="mb-0 text-muted small">No agents in this category</p>
              </Card.Body>
            </Card>
          )
        )}
      </div>
    );
  };

  return (
    <div className="live-view-wrapper" style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      {/* Sidebar Toggle Button - Shows below 1200px */}
      <style>{`
        .mobile-sidebar-toggle {
          display: none;
        }
          svg {
          width: auto !important;
          height: auto !important;
          }
          .sidebar-card {
          top: 77px !important;
          }
        @media (max-width: 1199px) {
          .mobile-sidebar-toggle {
            display: flex !important;
          }
        }
        .live-view-content {
          margin-left: 0;
          transition: margin-left 0.3s ease, width 0.3s ease;
          width: 100%;
        }
        @media (min-width: 1200px) {
          .live-view-content {
            margin-left: ${sidebarOpen ? '280px' : '0'};
            width: ${sidebarOpen ? 'calc(100% - 280px)' : '100%'};
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
      
      <Button 
        variant="primary" 
        className="mobile-sidebar-toggle position-fixed rounded-circle shadow"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          top: '20px',
          left: '20px',
          zIndex: 1051,
          width: '50px',
          height: '50px',
          padding: '0',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Menu size={24} />
      </Button>

      {/* Sidebar with ModernSidebar Component */}
      <ModernSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top shadow-sm">
        <div className="container-fluid">
          <div className="d-flex align-items-center gap-2">
            <style>{`
              .desktop-sidebar-toggle {
                display: none;
              }
              @media (min-width: 1200px) {
                .desktop-sidebar-toggle {
                  display: block !important;
                }
              }
            `}</style>
            <Button 
              variant="link" 
              className="text-dark desktop-sidebar-toggle p-2" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ 
                marginLeft: '-10px'
              }}
            >
              {sidebarOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
            </Button>
            <a className="navbar-brand fw-bold text-primary mb-0" href="#"><img src={CompanyLogo2.src} alt="logo" className="img-fluid" /></a>
          </div>
          <div className="ms-auto d-flex align-items-center gap-3">
            <Button variant="link" className="text-dark position-relative">
              <Bell size={20} />
              <Badge bg="danger" pill className="position-absolute translate-middle" style={{top:'10px', left:'37px'}}>3</Badge>
            </Button>
            <div 
              className="d-flex align-items-center gap-2" 
              onClick={() => setShowProfileSidebar(!showProfileSidebar)}
              style={{ cursor: 'pointer' }}
            >
              <div className="bg-primary bg-opacity-10 rounded-circle p-2">
                <Users size={20} className="text-primary" />
              </div>
              <div className="d-none d-md-block">
                <small className="d-block fw-semibold">John Doe</small>
                <small className="text-muted">john@example.com</small>
              </div>
              
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div 
        ref={contentWrapperRef}
        className="content-wrapper live-view-content"
        style={{
          backgroundColor: fullscreen ? '#f8f9fa' : 'transparent',
          overflow: fullscreen ? 'auto' : 'visible',
          paddingTop: '0'
        }}
      >
        <Container fluid className="px-3 px-md-4 px-lg-5" style={{paddingTop: fullscreen ? '24px' : '0', paddingBottom: '24px', maxWidth: '100%', overflowX: 'hidden'}}>
          {/* Page Header */}
          <Row className="mb-3 mb-md-4 g-3" style={{ display: fullscreen ? 'none' : 'flex', paddingTop: '24px' }}>
            <Col xs={12} md={6} lg={5} xl={6}>
              <h2 className="mb-1 fw-bold" style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', color: '#1f2937' }}>Live View</h2>
              <p className="text-muted mb-0" style={{ fontSize: 'clamp(0.813rem, 1.5vw, 0.875rem)' }}>Real time agent monitoring dashboard</p>
            </Col>
            <Col xs={12} md={6} lg={7} xl={6} className="d-flex align-items-center justify-content-md-end">
              <div className="d-flex flex-wrap align-items-center gap-2 w-100 w-md-auto justify-content-start justify-content-md-end">
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => {
                    const allCollapsed = Object.values(collapsedSections).every(val => val === true);
                    if (allCollapsed) {
                      expandAll();
                    } else {
                      collapseAll();
                    }
                  }}
                  className="d-flex align-items-center"
                  style={{ 
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    padding: '0.5rem 1rem'
                  }}
                >
                  {Object.values(collapsedSections).every(val => val === true) ? (
                    <>
                      <ChevronDown size={16} className="me-1" />
                      Expand All
                    </>
                  ) : (
                    <>
                      <ChevronUp size={16} className="me-1" />
                      Collapse All
                    </>
                  )}
                </Button>
                {/* <Button 
                  variant="primary" 
                  className="d-flex align-items-center"
                  style={{ 
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    padding: '0.5rem 1rem',
                    minWidth: 'fit-content'
                  }}
                  onClick={() => window.open('/cti/dialer', '_blank')}
                >
                  <ExternalLink size={18} className="me-2" />
                  Dialer
                </Button> */}
                <Button 
                  onClick={toggleFullscreen}
                  className="btn-icon-text"
                  style={{ 
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    border: fullscreen ? 'none' : '1px solid #e0e6ed',
                    borderRadius: '0.375rem',
                    background: fullscreen ? 'linear-gradient(60deg, #ef5350, #e53935)' : '#ffffff',
                    color: fullscreen ? '#ffffff' : '#4c5667',
                    boxShadow: fullscreen ? '0 4px 20px 0 rgba(239, 83, 80, 0.3)' : '0 1px 3px rgba(0,0,0,0.06)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    minWidth: 'fit-content'
                  }}
                  onMouseEnter={(e) => {
                    if (!fullscreen) {
                      e.currentTarget.style.background = '#f8f9fa';
                      e.currentTarget.style.borderColor = '#d0d5dd';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!fullscreen) {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.borderColor = '#e0e6ed';
                    }
                  }}
                >
                  {fullscreen ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                      </svg>
                      <span>Exit Full Screen</span>
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                      </svg>
                      <span>Full Screen</span>
                    </>
                  )}
                </Button>
              </div>
            </Col>
          </Row>

          {/* Summary Dashboard */}
          <div className="mb-4">
            <Row className="g-3">
              {/* Live Coaching Card */}
              <Col xs={6} sm={6} md={4} lg={3} xl>
                <Card 
                  className="border-0 shadow-sm h-100" 
                  style={{ 
                    backgroundColor: '#ffffff',
                    borderLeft: '4px solid #f59e0b'
                  }}
                >
                  <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                    <div 
                      className="rounded d-flex align-items-center justify-content-center"
                      style={{ 
                        width: '48px', 
                        height: '48px',
                        minWidth: '48px',
                        backgroundColor: '#fef3c7',
                        color: '#f59e0b'
                      }}
                    >
                      <Headset size={22} />
                    </div>
                    <div className="text-end ms-3">
                      <div className="fw-bold mb-1" style={{ fontSize: '1.75rem', lineHeight: '1', color: '#1f2937' }}>
                        {mockData.supervision.length}
                      </div>
                      <div className="text-muted fw-semibold" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Live Coaching
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              {/* Live Calls Card */}
              <Col xs={6} sm={6} md={4} lg={3} xl>
                <Card 
                  className="border-0 shadow-sm h-100" 
                  style={{ 
                    backgroundColor: '#ffffff',
                    borderLeft: '4px solid #22c55e'
                  }}
                >
                  <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                    <div 
                      className="rounded d-flex align-items-center justify-content-center"
                      style={{ 
                        width: '48px', 
                        height: '48px',
                        minWidth: '48px',
                        backgroundColor: '#dcfce7',
                        color: '#22c55e'
                      }}
                    >
                      <PhoneIncoming size={22} />
                    </div>
                    <div className="text-end ms-3">
                      <div className="fw-bold mb-1" style={{ fontSize: '1.75rem', lineHeight: '1', color: '#1f2937' }}>
                        {mockData.onCall.length}
                      </div>
                      <div className="text-muted fw-semibold" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Live Calls
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              {/* Available Card */}
              <Col xs={6} sm={6} md={4} lg={3} xl>
                <Card 
                  className="border-0 shadow-sm h-100" 
                  style={{ 
                    backgroundColor: '#ffffff',
                    borderLeft: '4px solid #6b7280'
                  }}
                >
                  <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                    <div 
                      className="rounded d-flex align-items-center justify-content-center"
                      style={{ 
                        width: '48px', 
                        height: '48px',
                        minWidth: '48px',
                        backgroundColor: '#f3f4f6',
                        color: '#6b7280'
                      }}
                    >
                      <UserCheck size={22} />
                    </div>
                    <div className="text-end ms-3">
                      <div className="fw-bold mb-1" style={{ fontSize: '1.75rem', lineHeight: '1', color: '#1f2937' }}>
                        {mockData.activeIdle.filter(a => a.agentStatus === 'active').length}
                      </div>
                      <div className="text-muted fw-semibold" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Available
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              {/* Idle Card */}
              <Col xs={6} sm={6} md={4} lg={3} xl>
                <Card 
                  className="border-0 shadow-sm h-100" 
                  style={{ 
                    backgroundColor: '#ffffff',
                    borderLeft: '4px solid #f59e0b'
                  }}
                >
                  <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                    <div 
                      className="rounded d-flex align-items-center justify-content-center"
                      style={{ 
                        width: '48px', 
                        height: '48px',
                        minWidth: '48px',
                        backgroundColor: '#fef3c7',
                        color: '#f59e0b'
                      }}
                    >
                      <Clock size={22} />
                    </div>
                    <div className="text-end ms-3">
                      <div className="fw-bold mb-1" style={{ fontSize: '1.75rem', lineHeight: '1', color: '#1f2937' }}>
                        {mockData.activeIdle.filter(a => a.agentStatus === 'idle').length}
                      </div>
                      <div className="text-muted fw-semibold" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Idle
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              {/* Offline Card */}
              <Col xs={6} sm={6} md={4} lg={3} xl>
                <Card 
                  className="border-0 shadow-sm h-100" 
                  style={{ 
                    backgroundColor: '#ffffff',
                    borderLeft: '4px solid #ef4444'
                  }}
                >
                  <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                    <div 
                      className="rounded d-flex align-items-center justify-content-center"
                      style={{ 
                        width: '48px', 
                        height: '48px',
                        minWidth: '48px',
                        backgroundColor: '#fee2e2',
                        color: '#ef4444'
                      }}
                    >
                      <UserX size={22} />
                    </div>
                    <div className="text-end ms-3">
                      <div className="fw-bold mb-1" style={{ fontSize: '1.75rem', lineHeight: '1', color: '#1f2937' }}>
                        {mockData.downOffline.length}
                      </div>
                      <div className="text-muted fw-semibold" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Offline
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              {/* Longest Call Duration Card */}
              <Col xs={6} sm={6} md={4} lg={3} xl>
                <Card 
                  className="border-0 shadow-sm h-100" 
                  style={{ 
                    backgroundColor: '#ffffff',
                    borderLeft: '4px solid #22c55e'
                  }}
                >
                  <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                    <div 
                      className="rounded d-flex align-items-center justify-content-center"
                      style={{ 
                        width: '48px', 
                        height: '48px',
                        minWidth: '48px',
                        backgroundColor: '#dcfce7',
                        color: '#22c55e'
                      }}
                    >
                      <Phone size={22} />
                    </div>
                    <div className="text-end ms-3">
                      <div className="fw-bold mb-1" style={{ fontSize: '1.75rem', lineHeight: '1', color: '#1f2937' }}>
                        {(() => {
                          const allCalls = [...mockData.supervision, ...mockData.onCall].filter(a => a.duration);
                          if (allCalls.length === 0) return '--:--';
                          const longest = allCalls.reduce((max, agent) => {
                            const [hMax, mMax, sMax] = (max.duration || '00:00:00').split(':').map(Number);
                            const [hAgent, mAgent, sAgent] = (agent.duration || '00:00:00').split(':').map(Number);
                            const maxTotal = hMax * 3600 + mMax * 60 + sMax;
                            const agentTotal = hAgent * 3600 + mAgent * 60 + sAgent;
                            return agentTotal > maxTotal ? agent : max;
                          });
                          const dur = longest.duration || '00:00:00';
                          const parts = dur.split(':');
                          return parts[0] !== '00' ? dur : `${parts[1]}:${parts[2]}`;
                        })()}
                      </div>
                      <div className="text-muted fw-semibold" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                        Longest Call
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              {/* Oldest Idle Time Card */}
              <Col xs={6} sm={6} md={4} lg={3} xl>
                <Card 
                  className="border-0 shadow-sm h-100" 
                  style={{ 
                    backgroundColor: '#ffffff',
                    borderLeft: '4px solid #f59e0b'
                  }}
                >
                  <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                    <div 
                      className="rounded d-flex align-items-center justify-content-center"
                      style={{ 
                        width: '48px', 
                        height: '48px',
                        minWidth: '48px',
                        backgroundColor: '#fef3c7',
                        color: '#f59e0b'
                      }}
                    >
                      <Hourglass size={22} />
                    </div>
                    <div className="text-end ms-3">
                      <div className="fw-bold mb-1" style={{ fontSize: '1.75rem', lineHeight: '1', color: '#1f2937' }}>
                        {mockData.activeIdle.filter(a => a.agentStatus === 'idle').length > 0 ? '15:32' : '--:--'}
                      </div>
                      <div className="text-muted fw-semibold" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                        Oldest Idle
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </div>

          {/* Sticky Filter Bar */}
          <div 
            className="bg-white shadow-sm mb-4 rounded" 
            style={{ 
              position: 'sticky',
              top: '56px',
              zIndex: 1020,
              paddingLeft: '1rem',
              paddingRight: '1rem',
              paddingTop: '1rem',
              paddingBottom: '1rem',
              backgroundColor: '#ffffff'
            }}
          >
            <Row className="g-2 align-items-center">
              {/* Search */}
              <Col xs={12} sm={12} md={12} lg={3} xl={3}>
                <InputGroup size="sm">
                  <InputGroup.Text className="bg-white border-end-0">
                    <Search size={16} className="text-muted" />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search name or extension..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                    className="border-start-0 ps-0"
                    style={{ fontSize: '0.875rem' }}
                  />
                </InputGroup>
              </Col>

              {/* Team Filter */}
              <Col xs={6} sm={3} md={3} lg={2} xl={2}>
                <Form.Select 
                  size="sm" 
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  style={{ fontSize: '0.875rem' }}
                >
                  <option value="all">All Teams</option>
                  <option value="sales">Sales</option>
                  <option value="support">Support</option>
                  <option value="billing">Billing</option>
                </Form.Select>
              </Col>

              {/* Status Filter */}
              <Col xs={6} sm={3} md={3} lg={2} xl={2}>
                <Form.Select 
                  size="sm"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  style={{ fontSize: '0.875rem' }}
                >
                  <option value="all">All Status</option>
                  <option value="supervision">Live Coaching</option>
                  <option value="oncall">Live Calls</option>
                  <option value="active">Available & Idle</option>
                  <option value="offline">Offline</option>
                </Form.Select>
              </Col>

              {/* Sort By Duration */}
              <Col xs={6} sm={3} md={3} lg={2} xl={2}>
                <Form.Select 
                  size="sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ fontSize: '0.875rem' }}
                >
                  <option value="none">Sort by Duration</option>
                  <option value="longest">Longest First</option>
                  <option value="shortest">Shortest First</option>
                </Form.Select>
              </Col>

              {/* Spacer to push buttons to right */}
              <Col xs={0} sm={0} md={0} lg={1} xl={1} className="d-none d-lg-block"></Col>

              {/* Filter Button */}
              <Col xs={3} sm={1.5} md={1.5} lg={1} xl={1}>
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={applyFilters}
                  className="w-100"
                  style={{ fontSize: '0.875rem', whiteSpace: 'nowrap', padding: '0.25rem 0.5rem' }}
                >
                  <Filter size={14} className="me-1" />
                  Filter
                </Button>
              </Col>

              {/* Clear Filters Button */}
              <Col xs={3} sm={1.5} md={1.5} lg={1} xl={1}>
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={clearFilters}
                  className="w-100"
                  style={{ fontSize: '0.875rem', whiteSpace: 'nowrap', padding: '0.25rem 0.5rem' }}
                >
                  Clear
                </Button>
              </Col>
            </Row>
          </div>

          {/* Sections */}
          {renderSection('Live Coaching', <Eye size={20} />, filterAndSortAgents(mockData.supervision), 'warning', true, 'supervision')}
          {renderSection('Live Calls', <Phone size={20} />, filterAndSortAgents(mockData.onCall), 'danger', true, 'onCall')}
          {renderSection('Available & Idle', <CheckCircle size={20} />, filterAndSortAgents(mockData.activeIdle), 'success', false, 'activeIdle')}
          {renderSection('Offline', <AlertCircle size={20} />, filterAndSortAgents(mockData.downOffline), 'secondary', false, 'downOffline')}
        </Container>
      </div>

      {/* Profile Sidebar */}
      <ProfileSidebar 
        isOpen={showProfileSidebar} 
        onClose={() => setShowProfileSidebar(false)} 
      />
    </div>
  );
};

export default LiveViewPage;