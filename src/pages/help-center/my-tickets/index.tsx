import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect, useMemo } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { useRouter } from "next/router";
import { ListTickets } from "@utils/tickets";
import { ModuleSlug } from "@utils/Helper";
import moment from "moment";
import Link from "next/link";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

import { Row, Col, Card, Form, InputGroup, Button, Table } from 'react-bootstrap';
import { 
  Search,
  ChevronLeft,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  MessageCircle,
  Plus
} from 'lucide-react';

const MyTicketsPage = () => {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState('all');
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState<boolean>(false);
  const [ticketsSearch, setTicketsSearch] = useState<string>('');

  // Fetch tickets
  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const response = await ListTickets({
        page: 1,
        perPage: 100,
        search: ticketsSearch,
        filters: {
          ticket_category:'user'
        },
        moduleSlug: ModuleSlug.TICKET,
        
      });
      
      if (response && response.data) {
        setTickets(Array.isArray(response.data) ? response.data : []);
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [ticketsSearch]);

  // Calculate tab counts from actual tickets
  const tabCounts = useMemo(() => {
    const counts = {
      all: tickets.length,
      open: 0,
      pending: 0,
      resolved: 0,
      closed: 0
    };
    
    tickets.forEach(ticket => {
      const statusName = ticket.status?.name?.toLowerCase() || '';
      if (statusName.includes('open')) counts.open++;
      else if (statusName.includes('pending')) counts.pending++;
      else if (statusName.includes('resolved')) counts.resolved++;
      else if (statusName.includes('closed')) counts.closed++;
    });
    
    return counts;
  }, [tickets]);

  const getPriorityColor = (priority: number | string) => {
    const priorityNum = typeof priority === 'string' ? Number.parseInt(priority, 10) : priority;
    switch(priorityNum) {
      case 0: return '#28a745';
      case 1: return '#17a2b8';
      case 2: return '#ffc107';
      case 3: return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getPriorityLabel = (priority: number | string) => {
    const priorityNum = typeof priority === 'string' ? Number.parseInt(priority, 10) : priority;
    const labels = ["Low", "Medium", "High", "Critical"];
    return labels[priorityNum] || "Low";
  };

  const getStatusBadge = (status: any) => {
    if (status && status.color) {
      const color = status.color;
      return {
        bg: color + '20',
        color: color
      };
    }
    
    const statusName = status?.name || status || '';
    const styles: { [key: string]: { bg: string; color: string } } = {
      'open': { bg: '#e7f1ff', color: '#084298' },
      'openn': { bg: '#e7f1ff', color: '#084298' },
      'pending': { bg: '#fff3cd', color: '#856404' },
      'resolved': { bg: '#d4edda', color: '#155724' },
      'closed': { bg: '#e2e3e5', color: '#383d41' },
      'in progress': { bg: '#fff3cd', color: '#856404' }
    };
    
    return styles[statusName.toLowerCase()] || styles['open'];
  };

  const filteredTickets = tickets.filter(ticket => {
    if (selectedTab === 'all') return true;
    const statusName = ticket.status?.name?.toLowerCase() || '';
    if (selectedTab === 'open') return statusName.includes('open');
    return statusName.includes(selectedTab);
  });

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Help Center" mainLink="/help-center" subTitle="My Tickets" />

      {/* Breadcrumb */}
      <div style={{ marginBottom: '20px' }}>
        <Link href="/help-center" style={{ textDecoration: 'none' }}>
          <Button
            variant="link"
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
        </Link>
        <span style={{ color: '#6c757d', margin: '0 8px' }}>›</span>
        <span style={{ color: '#2c3e50', fontWeight: '600', fontSize: '14px' }}>My Tickets</span>
      </div>

      {/* Tickets Layout */}
      <Row className="g-3">
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
                    <Link href="/help-center/my-tickets/new">
                      <Button
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
                        <Plus size={16} />
                        Create new ticket
                      </Button>
                    </Link>
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
                        value={ticketsSearch}
                        onChange={(e) => setTicketsSearch(e.target.value)}
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
                        {loadingTickets ? (
                          <tr>
                            <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
                              Loading tickets...
                            </td>
                          </tr>
                        ) : filteredTickets.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
                              No tickets found
                            </td>
                          </tr>
                        ) : (
                          filteredTickets.map((ticket, index) => {
                            const statusStyle = getStatusBadge(ticket.status);
                            const statusName = ticket.status?.name || 'Open';
                            return (
                              <tr 
                                key={ticket.id || index} 
                                style={{
                                  cursor: 'pointer',
                                  borderBottom: '1px solid #f0f0f0'
                                }}
                                onClick={() => {
                                  router.push(`/help-center/my-tickets/${ticket.id}`);
                                }}
                              >
                                <td style={{
                                  padding: '12px',
                                  color: '#4680ff',
                                  fontWeight: '500',
                                  border: 'none'
                                }}>#{ticket.id}</td>
                                <td style={{
                                  padding: '12px',
                                  color: '#2c3e50',
                                  border: 'none'
                                }}>{ticket.title || 'No subject'}</td>
                                <td style={{
                                  padding: '12px',
                                  color: '#2c3e50',
                                  border: 'none'
                                }}>{ticket?.type?.name || 'N/A'}</td>
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
                                    <span style={{ color: '#495057' }}>{getPriorityLabel(ticket.priority)}</span>
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
                                    {statusName}
                                  </div>
                                </td>
                                <td style={{ padding: '12px', border: 'none' }}>
                                  <span style={{ color: '#6c757d' }}>
                                    {ticket.updated_at ? moment(ticket.updated_at).fromNow() : 'N/A'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
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
                    <Link href="/help-center/my-tickets/new">
                      <p style={{
                        fontSize: '13px',
                        color: '#4680ff',
                        marginTop: '16px',
                        marginBottom: 0,
                        cursor: 'pointer'
                      }}>
                        Need more help? Create a ticket →
                      </p>
                    </Link>
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
                  <Button
                    variant="link"
                    onClick={() => {}}
                    style={{
                      fontSize: '13px',
                      color: '#4680ff',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0,
                      border: 'none'
                    }}
                  >
                    View full SLA →
                  </Button>
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
                  <Link href="/help-center/contact-support">
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
                  </Link>
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
    </React.Fragment>
  );
};

MyTicketsPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default MyTicketsPage;

