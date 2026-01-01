import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";


import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";

import { Container, Row, Col, Card, Form, InputGroup, Badge, Button, Table, Dropdown } from 'react-bootstrap';
import { 
  BookOpen, 
  Ticket, 
  Headphones, 
  Activity,
  MapPin,
  Receipt,
  Link,
  WrenchIcon,
  MessageCircle,
  Bell,
  Grid3x3,
  Search,
  CheckCircle2,
  ChevronLeft,
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  Plus,
  Menu,
  ChevronRight,
  Users
} from 'lucide-react';

import TicketDetail from '@components/tickets/ticket-details';
import CreateTicket from '@components/tickets/create-ticket';
import ContactSupport from '@components/tickets/contact-support';
import SystemStatus from '@components/tickets/system-status';
import KnowledgeBase from '@components/tickets/knowledge-base';
import ArticleDetail from '@components/tickets/article-detail';


const HelpCenter = () => {
  const [currentView, setCurrentView] = useState('home'); // 'home', 'tickets', 'ticket-detail', 'create-ticket', 'contact-support', 'system-status', 'knowledge-base'
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedSidebar, setSelectedSidebar] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('2FA');

  const mainCategories = [
    {
      icon: BookOpen,
      title: 'Knowledge Base',
      description: 'Browse help articles',
      color: '#4680ff',
      action: 'knowledge'
    },
    {
      icon: Ticket,
      title: 'My Tickets',
      description: 'View your tickets',
      color: '#04a9f5',
      action: 'tickets'
    },
    {
      icon: Headphones,
      title: 'Contact Support',
      description: 'Get in touch',
      color: '#1de9b6',
      action: 'contact'
    },
    {
      icon: Activity,
      title: 'System Status',
      description: 'Check platform status',
      color: '#f4c22b',
      action: 'status'
    }
  ];

  const featuredTopics = [
    {
      icon: MapPin,
      title: 'Getting Started',
      description: 'Begin with 2-step verification',
      color: '#4680ff'
    },
    {
      icon: Receipt,
      title: 'Billing',
      description: 'Handling invoices',
      color: '#04a9f5'
    },
    {
      icon: Link,
      title: 'Integrations',
      description: 'API & Passwords',
      color: '#1de9b6'
    },
    {
      icon: WrenchIcon,
      title: 'Troubleshooting',
      description: 'Resolving issues',
      color: '#f4c22b'
    }
  ];

  const trendingSearches = [
    'API Integration Guide',
    'Unable to access billing page',
    'Two-Factor Authentication'
  ];

  const tickets = [
    { id: '#107423', subject: 'Question about recent charge', category: 'Low', priority: 'low', status: 'Open', updated: '3 mins ago' },
    { id: '#107335', subject: 'Integration setup not working', category: 'Medium', priority: 'medium', status: 'Pending', updated: '1 hour ago' },
    { id: '#107254', subject: "Can't enable 2FA", category: 'Urgent', priority: 'urgent', status: 'Open', updated: 'Yesterday' },
    { id: '#107198', subject: 'Website not loading properly', category: 'Low', priority: 'low', status: 'Resolved', updated: '2 days ago' },
    { id: '#107132', subject: 'Unable to make outbound calls', category: 'Medium', priority: 'medium', status: 'Pending', updated: '1 week ago' },
    { id: '#107094', subject: 'Need to update account info', category: 'Medium', priority: 'medium', status: 'Pending', updated: '2 weeks ago' },
    { id: '#106957', subject: 'API authentication issue', category: 'Urgent', priority: 'urgent', status: 'Open', updated: '3 weeks ago' },
    { id: '#106957', subject: 'Billing invoice missing', category: 'Low', priority: 'low', status: 'Closed', updated: '3 weeks ago' },
    { id: '#106889', subject: 'Billing invoice missing', category: 'Low', priority: 'low', status: 'Closed', updated: '3 weeks ago' }
  ];

  const sidebarCounts = {
    all: 28,
    open: 5,
    pending: 4,
    resolved: 12,
    closed: 7
  };

  const tabCounts = {
    all: 28,
    open: 5,
    pending: 4,
    resolved: 12,
    closed: 7
  };

  const handleCategoryClick = (action: string) => {
    if (action === 'tickets') {
      setCurrentView('tickets');
    } else if (action === 'contact') {
      setCurrentView('contact-support');
    } else if (action === 'status') {
      setCurrentView('system-status');
    } else if (action === 'knowledge') {
      setCurrentView('knowledge-base');
    }
  };
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'low': return '#6c757d';
      case 'medium': return '#f4c22b';
      case 'urgent': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: { bg: string; color: string } } = {
        Open:     { bg: '#e7f1ff', color: '#084298' }, // light blue
        Pending:  { bg: '#fff3cd', color: '#856404' },
        Resolved: { bg: '#d4edda', color: '#155724' },
        Closed:   { bg: '#e2e3e5', color: '#383d41' }
      };
      
    return styles[status] || styles['Open'];
  };

  const filteredTickets = tickets.filter(ticket => {
    if (selectedTab === 'all') return true;
    return ticket.status.toLowerCase() === selectedTab;
  });

  return (
    <React.Fragment>
     
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Help Center" />

      {/* <PageHeader
        title="Help Center"
        showSearch={false}
      /> */}


<style>{`
        /* General card style */
        .card {
          border-radius: 14px !important;
          border: 1px solid #e9eef5 !important;
          box-shadow: 0 2px 12px 0 rgba(70,128,255,0.06);
          transition: box-shadow 0.18s, background 0.18s;
        }
        .card:hover {
          box-shadow: 0 6px 24px 0 rgba(70,128,255,0.13);
        }
        /* Main categories */
        .help-main-category-card {
          background: linear-gradient(120deg, #f8f9fb 80%, #e3f0ff 100%) !important;
          border: 1px solid #e9ecef !important;
          border-radius: 8px !important;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          transition: all 0.2s ease;
        }
        .help-main-category-card:hover {
          background: #f0f4f8 !important;
          border-color: #4680ff !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transform: translateY(-3px);
        }
        /* Featured topics */
        .help-featured-card {
          background: linear-gradient(120deg, #f8f9fb 80%, #e3f0ff 100%) !important;
        }
        /* Trending searches */
        .help-trending-card {
          background: linear-gradient(120deg, #f9fafb 80%, #f4f7fa 100%) !important;
        }
        /* Sidebar cards */
        .help-sidebar-card {
          background: linear-gradient(120deg, #f7fcff 80%, #e3f0ff 100%) !important;
        }
        /* Table card */
        .help-table-card {
          background: linear-gradient(120deg, #f8fafd 80%, #e3f0ff 100%) !important;
        }
        /* Removed .crm-dashboard-wrapper::before for pure white background */
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
       
        `}</style>
{currentView === 'home' ? (
          <>
            {/* Hero Section */}
            <div style={{
              borderRadius: '10px',
              padding: '40px 20px',
              textAlign: 'center',
              marginBottom: '25px'
            }}>
              <h1 style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#2c3e50',
                marginBottom: '8px'
              }}>Help Center</h1>
              <p style={{
                fontSize: '16px',
                color: '#6c757d',
                marginBottom: 0
              }}>How can we assist you today?</p>
            </div>

            {/* Main Categories */}
            <Row className="g-3 mb-4">
              {mainCategories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <Col xs={12} sm={6} lg={3} key={index}>
                    <div
                      className="help-main-category-card"
                      onClick={() => handleCategoryClick(category.action)}
                      style={{
                        padding: '24px 16px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        height: '100%'
                      }}
                    >
                      <div style={{
                        width: '56px',
                        height: '56px',
                        margin: '0 auto 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        
                      }}>
                        <Icon size={28} color={category.color} strokeWidth={2} />
                      </div>
                      <h5 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#2c3e50',
                        marginBottom: '4px'
                      }}>{category.title}</h5>
                      <p style={{
                        fontSize: '13px',
                        color: '#6c757d',
                        marginBottom: 0
                      }}>{category.description}</p>
                    </div>
                  </Col>
                );
              })}
            </Row>
              <Row className="g-3 mb-4">
                {/* Removed duplicate main categories row */}
              </Row>

            {/* Featured Topics and Trending */}
            <Row className="g-3">
              <Col xs={12} lg={9}>
                <Card style={{
                  background: '#fff',
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  padding: '20px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}>
                  <Card className="help-featured-card" style={{
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}>
                    <h4 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#2c3e50',
                      marginBottom: '16px'
                    }}>Featured Topics</h4>
                    <Row className="g-3">
                      {featuredTopics.map((topic, index) => {
                        const Icon = topic.icon;
                        return (
                          <Col xs={12} sm={3} key={index}>
                            <div style={{
                              background: '#fafbfc',
                              border: '1px solid #e9ecef',
                              borderRadius: '6px',
                              padding: '16px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              height: '100%',
                              textAlign: 'center'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#f0f4f8';
                              e.currentTarget.style.borderColor = '#4680ff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#fafbfc';
                              e.currentTarget.style.borderColor = '#e9ecef';
                            }}>
                              <div style={{
                                width: '44px',
                                height: '44px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 10px auto'
                              }}>
                                <Icon size={24} color={topic.color} strokeWidth={2} />
                              </div>
                              <h6 style={{
                                fontSize: '15px',
                                fontWeight: '600',
                                color: '#2c3e50',
                                marginBottom: '4px'
                              }}>{topic.title}</h6>
                              <p style={{
                                fontSize: '12px',
                                color: '#6c757d',
                                marginBottom: 0
                              }}>{topic.description}</p>
                            </div>
                          </Col>
                        );
                      })}
                    </Row>
                  </Card>
                </Card>
              </Col>

              <Col xs={12} lg={3}>
                <Card style={{
                  background: '#fff',
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  padding: '20px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}>
                  <Card className="help-trending-card" style={{
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}>
                    <h4 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#2c3e50',
                      marginBottom: '16px'
                    }}>Trending Searches</h4>
                    <div>
                      {trendingSearches.map((search, index) => (
                        <div key={index} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 0',
                          cursor: 'pointer'
                        }}>
                          <div style={{
                            width: '6px',
                            height: '6px',
                            background: '#4680ff',
                            borderRadius: '50%',
                            flexShrink: 0
                          }} />
                          <p style={{
                            fontSize: '13px',
                            color: '#495057',
                            margin: 0
                          }}>{search}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </Card>
              </Col>
            </Row>
          </>
        ) : currentView === 'tickets' ? (
          <>
            {/* Breadcrumb */}
            <div style={{ marginBottom: '20px' }}>
              <Button
                variant="link"
                onClick={() => setCurrentView('home')}
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
              <span style={{ color: '#2c3e50', fontWeight: '600', fontSize: '14px' }}>My Tickets</span>
            </div>

            {/* Tickets Layout */}
            <Row className="g-3">
              {/* Left Sidebar */}
              {/* <Col xs={12} lg={2}>
                <Card style={{
                  background: '#fff',
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  overflow: 'hidden'
                }}>
                  <div style={{ padding: '0' }}>
                    <div
                      onClick={() => setSelectedSidebar('all')}
                      style={{
                        padding: '12px 20px',
                        cursor: 'pointer',
                        background: selectedSidebar === 'all' ? '#f0f4f8' : '#fff',
                        borderLeft: selectedSidebar === 'all' ? '3px solid #4680ff' : '3px solid transparent',
                        fontSize: '14px',
                        fontWeight: selectedSidebar === 'all' ? '600' : '400',
                        color: selectedSidebar === 'all' ? '#4680ff' : '#495057',
                        transition: 'all 0.2s'
                      }}
                    >
                      All ({sidebarCounts.all})
                    </div>
                    <div
                      onClick={() => setSelectedSidebar('open')}
                      style={{
                        padding: '12px 20px',
                        cursor: 'pointer',
                        background: selectedSidebar === 'open' ? '#f0f4f8' : '#fff',
                        borderLeft: selectedSidebar === 'open' ? '3px solid #4680ff' : '3px solid transparent',
                        fontSize: '14px',
                        fontWeight: selectedSidebar === 'open' ? '600' : '400',
                        color: selectedSidebar === 'open' ? '#4680ff' : '#495057',
                        transition: 'all 0.2s'
                      }}
                    >
                      Open ({sidebarCounts.open})
                    </div>
                    <div
                      onClick={() => setSelectedSidebar('pending')}
                      style={{
                        padding: '12px 20px',
                        cursor: 'pointer',
                        background: selectedSidebar === 'pending' ? '#f0f4f8' : '#fff',
                        borderLeft: selectedSidebar === 'pending' ? '3px solid #4680ff' : '3px solid transparent',
                        fontSize: '14px',
                        fontWeight: selectedSidebar === 'pending' ? '600' : '400',
                        color: selectedSidebar === 'pending' ? '#4680ff' : '#495057',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span>Pending ({sidebarCounts.pending})</span>
                      <ChevronDown size={14} />
                    </div>
                    <div
                      onClick={() => setSelectedSidebar('resolved')}
                      style={{
                        padding: '12px 20px',
                        cursor: 'pointer',
                        background: selectedSidebar === 'resolved' ? '#f0f4f8' : '#fff',
                        borderLeft: selectedSidebar === 'resolved' ? '3px solid #4680ff' : '3px solid transparent',
                        fontSize: '14px',
                        fontWeight: selectedSidebar === 'resolved' ? '600' : '400',
                        color: selectedSidebar === 'resolved' ? '#4680ff' : '#495057',
                        transition: 'all 0.2s'
                      }}
                    >
                      Resolved ({sidebarCounts.resolved})
                    </div>
                  </div>
                </Card>
              </Col> */}

              {/* Main Content */}
              <Col xs={12} lg={12}>
                <Row className="g-3">
                  {/* Tickets Table */}
                  <Col xs={12} lg={9}>
                    <Card style={{
                      background: '#fff',
                      border: '1px solid #e9ecef',
                      borderRadius: '8px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                      <Card.Body style={{ padding: '20px' }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '20px'
                        }}>
                          <h4 style={{
                            fontSize: '20px',
                            fontWeight: '600',
                            color: '#2c3e50',
                            margin: 0
                          }}>My Tickets</h4>
                          <Button
                            onClick={() => setCurrentView('create-ticket')}
                            style={{
                              background: '#4680ff',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '8px 16px',
                              fontSize: '14px',
                              fontWeight: '500',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            Create new ticket
                          </Button>
                        </div>

                        {/* Tabs */}
                        <div style={{
                          display: 'flex',
                          gap: '0',
                          marginBottom: '20px',
                          borderBottom: '1px solid #e9ecef'
                        }}>
                          {['all', 'open', 'pending', 'resolved', 'closed'].map((tab) => (
                            <div
                              key={tab}
                              onClick={() => setSelectedTab(tab)}
                              style={{
                                padding: '10px 20px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: selectedTab === tab ? '600' : '400',
                                color: selectedTab === tab ? '#4680ff' : '#6c757d',
                                borderBottom: selectedTab === tab ? '2px solid #4680ff' : '2px solid transparent',
                                marginBottom: '-1px',
                                textTransform: 'capitalize'
                              }}
                            >
                              {tab === 'all' ? `All` : `${tab.charAt(0).toUpperCase() + tab.slice(1)} (${tabCounts[tab as keyof typeof tabCounts]})`}
                            </div>
                          ))}
                        </div>

                        {/* Search and Sort */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '16px'
                        }}>
                          <InputGroup style={{ maxWidth: '250px' }}>
                            <InputGroup.Text style={{
                              background: '#fff',
                              border: '1px solid #dee2e6',
                              borderRight: 'none'
                            }}>
                              <Search size={14} color="#6c757d" />
                            </InputGroup.Text>
                            <Form.Control
                              type="search"
                              placeholder="Search tickets..."
                              style={{
                                borderLeft: 'none',
                                fontSize: '13px',
                                padding: '6px 10px'
                              }}
                            />
                          </InputGroup>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '13px',
                            color: '#6c757d'
                          }}>
                            <span>Sort by:</span>
                            <Form.Select
                              size="sm"
                              style={{
                                width: 'auto',
                                fontSize: '13px',
                                padding: '4px 30px 4px 10px',
                                border: '1px solid #dee2e6',
                                borderRadius: '4px'
                              }}
                            >
                              <option>Last Updated</option>
                              <option>Created Date</option>
                              <option>Priority</option>
                            </Form.Select>
                          </div>
                        </div>

                        {/* Table */}
                        <div style={{ overflowX: 'auto' }}>
                          <Table hover style={{ marginBottom: 0, fontSize: '13px' }}>
                            <thead style={{ background: '#f8f9fa', borderTop: '1px solid #e9ecef' }}>
                              <tr>
                                <th style={{
                                  fontWeight: '600',
                                  color: '#495057',
                                  padding: '12px',
                                  border: 'none',
                                  fontSize: '13px'
                                }}>Ticket ID</th>
                                <th style={{
                                  fontWeight: '600',
                                  color: '#495057',
                                  padding: '12px',
                                  border: 'none',
                                  fontSize: '13px'
                                }}>Subject</th>
                                <th style={{
                                  fontWeight: '600',
                                  color: '#495057',
                                  padding: '12px',
                                  border: 'none',
                                  fontSize: '13px'
                                }}>Category</th>
                                <th style={{
                                  fontWeight: '600',
                                  color: '#495057',
                                  padding: '12px',
                                  border: 'none',
                                  fontSize: '13px'
                                }}>Priority</th>
                                <th style={{
                                  fontWeight: '600',
                                  color: '#495057',
                                  padding: '12px',
                                  border: 'none',
                                  fontSize: '13px'
                                }}>Status</th>
                                <th style={{
                                  fontWeight: '600',
                                  color: '#495057',
                                  padding: '12px',
                                  border: 'none',
                                  fontSize: '13px'
                                }}>Last updated</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredTickets.map((ticket, index) => {
                                const statusStyle = getStatusBadge(ticket.status);
                                return (
                                  <tr 
                                    key={index} 
                                    style={{
                                      cursor: 'pointer',
                                      borderBottom: '1px solid #f0f0f0'
                                    }}
                                    onClick={() => {
                                      setSelectedTicket(ticket.id);
                                      setCurrentView('ticket-detail');
                                    }}
                                  >
                                    <td style={{
                                      padding: '12px',
                                      color: '#4680ff',
                                      fontWeight: '500',
                                      border: 'none'
                                    }}>{ticket.id}</td>
                                    <td style={{
                                      padding: '12px',
                                      color: '#2c3e50',
                                      border: 'none'
                                    }}>{ticket.subject}</td>
                                    <td style={{
                                      padding: '12px',
                                      color: '#2c3e50',
                                      border: 'none'
                                    }}>{ticket.category}</td>
                                    <td style={{ padding: '12px', border: 'none' }}>
                                      <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                      }}>
                                        <div style={{
                                          width: '8px',
                                          height: '8px',
                                          borderRadius: '50%',
                                          background: getPriorityColor(ticket.priority)
                                        }} />
                                        <span style={{ color: '#495057' }}>{ticket.category}</span>
                                      </div>
                                    </td>
                                    <td style={{ padding: '12px', border: 'none' }}>
                                    <div
  style={{
    display: 'inline-block',
    background: statusStyle.bg,
    color: statusStyle.color,
    padding: '4px 10px',
    borderRadius: '4px',
    fontWeight: '500',
    fontSize: '12px'
  }}
>
  {ticket.status}
</div>

                                    </td>
                                    <td style={{ padding: '12px', border: 'none' }}>
                                      <span style={{ color: '#6c757d' }}>{ticket.updated}</span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </Table>
                        </div>

                        {/* Footer */}
                        <div style={{
                          marginTop: '24px',
                          paddingTop: '20px',
                          borderTop: '1px solid #e9ecef'
                        }}>
                          <p style={{
                            fontSize: '14px',
                            color: '#495057',
                            marginBottom: '12px',
                            fontWeight: '500'
                          }}>Was this article helpful?</p>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 16px',
                                fontSize: '13px'
                              }}
                            >
                              <ThumbsUp size={14} /> Yes
                            </Button>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 16px',
                                fontSize: '13px'
                              }}
                            >
                              <ThumbsDown size={14} /> No
                            </Button>
                          </div>
                          <p style={{
                            fontSize: '13px',
                            color: '#4680ff',
                            marginTop: '16px',
                            marginBottom: 0,
                            cursor: 'pointer'
                          }}>
                            Need more help? Create a ticket →
                          </p>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* Right Sidebar */}
                  <Col xs={12} lg={3}>
                    {/* SLA Card */}
                    <Card style={{
                      background: '#fff',
                      border: '1px solid #e9ecef',
                      borderRadius: '8px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      marginBottom: '16px'
                    }}>
                      <Card.Body style={{ padding: '20px' }}>
                        <h5 style={{
                          fontSize: '15px',
                          fontWeight: '600',
                          color: '#2c3e50',
                          marginBottom: '16px'
                        }}>SLA & Support Plan</h5>
                        <div style={{
                          background: '#f0f4f8',
                          padding: '16px',
                          borderRadius: '6px',
                          marginBottom: '12px'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '8px'
                          }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              background: '#4680ff',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <CheckCircle2 size={18} color="#fff" />
                            </div>
                            <div>
                              <h6 style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#2c3e50',
                                margin: 0
                              }}>Basic Support</h6>
                            </div>
                          </div>
                          <p style={{
                            fontSize: '13px',
                            color: '#6c757d',
                            margin: 0
                          }}>SLA: Within 24 hours</p>
                        </div>
                        <a href="#" style={{
                          fontSize: '13px',
                          color: '#4680ff',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          View full SLA →
                        </a>
                      </Card.Body>
                    </Card>

                    {/* Chat with Support */}
                    <Card style={{
                      background: '#fff',
                      border: '1px solid #e9ecef',
                      borderRadius: '8px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      marginBottom: '16px'
                    }}>
                      <Card.Body style={{ padding: '20px' }}>
                        <h5 style={{
                          fontSize: '15px',
                          fontWeight: '600',
                          color: '#2c3e50',
                          marginBottom: '16px'
                        }}>Chat with support</h5>
                        <Button
                          style={{
                            background: '#4680ff',
                            border: 'none',
                            borderRadius: '6px',
                            width: '100%',
                            padding: '10px',
                            fontSize: '14px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                          }}
                        >
                          <MessageCircle size={18} />
                          Chat with support
                        </Button>
                      </Card.Body>
                    </Card>

                    {/* Ticket Tips */}
                    <Card style={{
                      background: '#fff',
                      border: '1px solid #e9ecef',
                      borderRadius: '8px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                      <Card.Body style={{ padding: '20px' }}>
                        <h5 style={{
                          fontSize: '15px',
                          fontWeight: '600',
                          color: '#2c3e50',
                          marginBottom: '16px'
                        }}>Ticket Tips</h5>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px'
                          }}>
                            <CheckCircle2 size={16} color="#1de9b6" style={{ marginTop: '2px', flexShrink: 0 }} />
                            <p style={{
                              fontSize: '13px',
                              color: '#495057',
                              margin: 0
                            }}>Describe your issue clearly</p>
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px'
                          }}>
                            <CheckCircle2 size={16} color="#1de9b6" style={{ marginTop: '2px', flexShrink: 0 }} />
                            <p style={{
                              fontSize: '13px',
                              color: '#495057',
                              margin: 0
                            }}>Attach screenshots or relevant details</p>
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px'
                          }}>
                            <CheckCircle2 size={16} color="#1de9b6" style={{ marginTop: '2px', flexShrink: 0 }} />
                            <p style={{
                              fontSize: '13px',
                              color: '#495057',
                              margin: 0
                            }}>Check your ticket regularly for updates</p>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Col>
            </Row>
          </>
        ) : currentView === 'ticket-detail' && selectedTicket ? (
          <TicketDetail 
            ticketId={selectedTicket}
            onBack={() => {
              setCurrentView('tickets');
              setSelectedTicket(null);
            }}
          />
        ) : currentView === 'create-ticket' ? (
            <CreateTicket 
              onBack={() => setCurrentView('tickets')}
            />
          ) : currentView === 'contact-support' ? (
            <ContactSupport 
              onBack={() => setCurrentView('home')}
              onStartChat={() => {
                // Handle start chat action
                console.log('Start chat clicked');
              }}
              onRequestCall={() => {
                // Handle request call action
                console.log('Request call clicked');
              }}
              onSendMessage={() => {
                // Navigate to create ticket or handle message
                setCurrentView('create-ticket');
              }}
            />
          ) : currentView === 'system-status' ? (
            <SystemStatus 
              onBack={() => setCurrentView('home')}
            />
          ) : currentView === 'knowledge-base' ? (
            <KnowledgeBase 
              onBack={() => setCurrentView('home')}
              searchQuery={searchQuery}
              onArticleClick={(articleId) => {
                setSelectedArticle(articleId);
                setCurrentView('article-detail');
              }}
            />
          ) : currentView === 'article-detail' && selectedArticle ? (
            <ArticleDetail 
              onBack={() => {
                setCurrentView('knowledge-base');
                setSelectedArticle(null);
              }}
              articleId={selectedArticle}
            />
          ) : null}

    </React.Fragment>
  );
};

HelpCenter.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default HelpCenter;
