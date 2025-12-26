import React,{ReactElement, useEffect, useState} from 'react'
import Layout from '@layout/index'
import { useSession } from 'next-auth/react';
import "@assets/scss/dashboard.scss";
import "@assets/scss/common.scss";
import {  Row, Col, Card, Button, ProgressBar, Badge, Form } from 'react-bootstrap';
import {
  Search,
  FileText,
  Users,
  ShoppingCart,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  PhoneCall,
  AlertOctagon,
  DollarSign,
  Wrench,
  Package,
  Ban,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import TimezoneSearch from '@components/TimezoneSearch';

const Dashboard = () => {
    

    return (
        <React.Fragment>


      {/* Main Content Area */}
      <div className="content-wrapper crm-dashboard-content">
        
        {/* Header Navigation */}
<Row className="mb-4">
  <Col xs={12} md={5}>
    <div className="d-flex gap-2 mb-3">
      <Button variant="primary" size="sm">Today</Button>
      <Button variant="outline-secondary" size="sm">This Week</Button>
      <Button variant="outline-secondary" size="sm">This Month</Button>
    </div>
  </Col>
  <Col xs={12} md={7}>
    <div className="d-flex align-items-center bg-white border rounded" style={{ padding: '0' }}>
      <div className="position-relative flex-grow-1">
        <Search className="position-absolute" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d', zIndex: 10 }} size={18} />
        <Form.Control
          type="text"
          placeholder="Search accross your workspace"
          className="ps-5"
          style={{ height: '40px', border: 'none', boxShadow: 'none' }}
        />
      </div>
      <div style={{ borderLeft: '1px solid #e0e0e0', paddingLeft: '12px', paddingRight: '4px' }}>
        <TimezoneSearch />
      </div>
    </div>
  </Col>
</Row>

        {/* Title */}
        <h4 className="mb-4 fw-bold">My CRM & Sales</h4>

        {/* Top Row - Main Cards */}
        <Row className="g-3 mb-3">
          {/* Overdue Today */}
          <Col xs={12} lg={3}>
            <Card className="h-100 shadow-sm">
              <Card.Body className="p-3 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0 fw-bold">Overdue Today</h6>
                  <span className="text-muted">•••</span>
                </div>
                <div className="d-flex flex-column gap-2 mb-2 flex-grow-1">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <AlertCircle className="text-danger" size={18} />
                      <span style={{ fontSize: '0.9rem' }}>Overdue Tasks</span>
                    </div>
                    <Badge bg="danger" pill className="d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px', fontSize: '0.75rem' }}>3</Badge>
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <Phone className="text-danger" size={18} />
                      <span style={{ fontSize: '0.9rem' }}>Overdue Follow-Ups</span>
                    </div>
                    <Badge bg="danger" pill className="d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px', fontSize: '0.75rem' }}>2</Badge>
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <FileText className="text-warning" size={18} />
                      <span style={{ fontSize: '0.9rem' }}>Overdue Proposals</span>
                    </div>
                    <Badge bg="warning" pill className="d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px', fontSize: '0.75rem' }}>1</Badge>
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <DollarSign className="text-warning" size={18} />
                      <span style={{ fontSize: '0.9rem' }}>Pending Quotes</span>
                    </div>
                    <Badge bg="warning" pill className="d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px', fontSize: '0.75rem' }}>1</Badge>
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <Clock className="text-info" size={18} />
                      <span style={{ fontSize: '0.9rem' }}>Scheduled Calls</span>
                    </div>
                    <Badge bg="info" pill className="d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px', fontSize: '0.75rem' }}>2</Badge>
                  </div>
                </div>
                <Button variant="primary" className="mx-auto d-block mt-auto" style={{ width: '160px' }}>View Overdue</Button>
              </Card.Body>
            </Card>
          </Col>

          {/* This Month: Achieved vs Target */}
          <Col xs={12} lg={3}>
            <Card className="h-100 shadow-sm" style={{ background: 'linear-gradient(95deg, rgb(96 142 211) 0%, rgb(62 131 229) 100%)' }}>
              <Card.Body className="p-3 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0 fw-bold text-white">This Month: Achieved vs Target</h6>
                  <span className="text-white">•••</span>
                </div>
                <div className="d-flex gap-3 mb-2 flex-grow-1">
  {/* Chart Column */}
  <div
    className="d-flex flex-column align-items-center justify-content-center"
    style={{ flex: 1 }}
  >
    <div
      className="position-relative"
      style={{ width: '120px', height: '120px' }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={[
              { name: 'Achieved', value: 70 },
              { name: 'Remaining', value: 30 }
            ]}
            cx="50%"
            cy="50%"
            innerRadius={42}
            outerRadius={58}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            strokeWidth={0}
          >
            <Cell fill="#ffffff" />
            <Cell fill="rgba(255, 255, 255, 0.25)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Center Text */}
      <div className="position-absolute top-50 start-50 translate-middle d-flex flex-column align-items-center">
        <span
          className="fw-bold text-white"
          style={{ fontSize: '2rem', lineHeight: 1 }}
        >
          70%
        </span>
      </div>
    </div>
    <small className="text-white mt-1" style={{ fontSize: '0.75rem', opacity: 0.9 }}>Complete</small>
  </div>

  {/* Stats Column */}
  <div
    className="d-flex flex-column justify-content-center gap-2"
    style={{ flex: 1 }}
  >
    <div>
      <div className="text-white small mb-1" style={{ opacity: 0.9 }}>
        Achieved
      </div>
      <div className="h4 mb-0 fw-bold text-white">£4,200</div>
    </div>

    <div>
      <div className="text-white small mb-1" style={{ opacity: 0.9 }}>
        Target
      </div>
      <div className="h4 mb-0 fw-bold text-white">£6,000</div>
    </div>
  </div>
</div>

                <div className="mt-auto pt-2 border-top border-white border-opacity-25">
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-white" style={{ opacity: 0.9 }}><span className="fw-semibold">£1,800</span> Remaining</small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* My Sales Summary */}
          <Col xs={12} lg={3}>
            <Card className="h-100 shadow-sm">
              <Card.Body className="p-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0 fw-bold">My Sales Summary</h6>
                  <span className="text-muted">•••</span>
                </div>
                <div className="d-flex flex-column gap-3">
                  {/* Prospects */}
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <div className="d-flex align-items-center gap-2">
                        <FileText className="text-success" size={18} />
                        <span className="small fw-semibold">Prospects</span>
                      </div>
                      <span className="fw-bold" style={{ fontSize: '0.85rem' }}>5/18</span>
                    </div>
                    <ProgressBar now={28} variant="success" style={{ height: '6px', borderRadius: '3px' }} />
                    <div className="d-flex justify-content-between mt-1">
                      <small className="text-muted" style={{ fontSize: '0.7rem' }}>5 New</small>
                      <small className="text-muted" style={{ fontSize: '0.7rem' }}>28%</small>
                    </div>
                  </div>
                  
                  {/* Leads */}
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <div className="d-flex align-items-center gap-2">
                        <Users className="text-info" size={18} />
                        <span className="small fw-semibold">Leads</span>
                      </div>
                      <span className="fw-bold" style={{ fontSize: '0.85rem' }}>4/13</span>
                    </div>
                    <ProgressBar now={31} variant="info" style={{ height: '6px', borderRadius: '3px' }} />
                    <div className="d-flex justify-content-between mt-1">
                      <small className="text-muted" style={{ fontSize: '0.7rem' }}>4 New</small>
                      <small className="text-muted" style={{ fontSize: '0.7rem' }}>31%</small>
                    </div>
                  </div>
                  
                  {/* Orders */}
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <div className="d-flex align-items-center gap-2">
                        <ShoppingCart className="text-warning" size={18} />
                        <span className="small fw-semibold">Orders</span>
                      </div>
                      <span className="fw-bold" style={{ fontSize: '0.85rem' }}>4/10</span>
                    </div>
                    <ProgressBar now={40} variant="warning" style={{ height: '6px', borderRadius: '3px' }} />
                    <div className="d-flex justify-content-between mt-1">
                      <small className="text-muted" style={{ fontSize: '0.7rem' }}>4 Done</small>
                      <small className="text-muted" style={{ fontSize: '0.7rem' }}>40%</small>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Next Best Actions */}
          <Col xs={12} lg={3}>
            <Card className="h-100 shadow-sm">
              <Card.Body className="p-3 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0 fw-bold">Next Best Actions</h6>
                  <span className="text-muted">•••</span>
                </div>
                <ul className="list-unstyled mb-2 flex-grow-1">
                  <li className="mb-1" style={{ fontSize: '0.9rem' }}>• Call: Next Lead</li>
                  <li className="mb-1" style={{ fontSize: '0.9rem' }}>• Update: Pending Deal</li>
                  <li className="mb-1" style={{ fontSize: '0.9rem' }}>• Follow-Up: Overdue Quote</li>
                  <li className="mb-1" style={{ fontSize: '0.9rem' }}>• Review: New Prospect</li>
                  <li className="mb-1" style={{ fontSize: '0.9rem' }}>• Send: Proposal Email</li>
                </ul>
                <Button variant="primary" className="mx-auto d-block mt-auto" style={{ width: '160px' }}>Start Work</Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* My Call Details */}
        <h5 className="mb-2 fw-bold">My Call Details</h5>

        {/* Call Details Row */}
        <Row className="g-3 mb-3">
          {/* Calls Today */}
          <Col xs={12} md={6} lg={3}>
            <Card className="h-100 shadow-sm">
              <Card.Body className="p-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0 fw-bold">Calls Today</h6>
                  <span className="text-muted">•••</span>
                </div>
                <div className="d-flex justify-content-around align-items-center">
                  <div className="text-center">
                    <div className="h3 fw-bold text-primary mb-0">25</div>
                    <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Total Calls</small>
                  </div>
                  <div className="text-center">
                    <div className="h3 fw-bold text-dark mb-0">12</div>
                    <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Outbound</small>
                  </div>
                  <div className="text-center">
                    <div className="h3 fw-bold text-dark mb-0">13</div>
                    <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Inbound</small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Missed & Callbacks */}
          <Col xs={12} md={6} lg={3}>
            <Card className="h-100 shadow-sm">
              <Card.Body className="p-3 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0 fw-bold">Missed & Callbacks</h6>
                  <span className="text-muted">•••</span>
                </div>
                <div className="d-flex flex-column gap-2 mb-2 flex-grow-1">
                  <div className="d-flex align-items-center gap-2">
                    <Badge bg="danger" pill className="d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px', fontSize: '0.75rem' }}>4</Badge>
                    <span style={{ fontSize: '0.9rem' }}>Missed Calls</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <Badge bg="danger" pill className="d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px', fontSize: '0.75rem' }}>2</Badge>
                    <span style={{ fontSize: '0.9rem' }}>Callbacks Due</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <Badge bg="warning" pill className="d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px', fontSize: '0.75rem' }}>3</Badge>
                    <span style={{ fontSize: '0.9rem' }}>Voicemails</span>
                  </div>
                </div>
                <div className="mb-2">
                  <small className="text-muted" style={{ fontSize: '0.8rem' }}>Oldest: <span className="fw-semibold text-dark">1h 15m</span></small>
                </div>
                <Button variant="primary" className="mx-auto d-block mt-auto" style={{ width: '160px' }}>
                  <Phone size={16} className="me-2" /> Start
                </Button>
              </Card.Body>
            </Card>
          </Col>

          {/* Call Analytics - Merged Card */}
          <Col xs={12} md={12} lg={6}>
            <Card className="h-100 shadow-sm">
              <Card.Body className="p-3 d-flex flex-column">
                <Row className="g-3 mb-2 flex-grow-1">
                  {/* Call Outcomes Section */}
                  <Col xs={12} md={6}>
                    <div className="d-flex flex-column h-100">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0 fw-bold">Call Outcomes</h6>
                        <span className="text-muted">•••</span>
                      </div>
                      <div className="d-flex gap-2 mb-2 flex-grow-1">
                        {/* Donut Chart */}
                        <div className="d-flex align-items-center justify-content-center" style={{ flex: 1 }}>
                          <div style={{ width: '110px', height: '110px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={[
                                    { name: 'Answered', value: 18, color: '#28a745' },
                                    { name: 'No Answer', value: 4, color: '#dc3545' },
                                    { name: 'Busy', value: 2, color: '#ffc107' },
                                    { name: 'Voicemail', value: 3, color: '#17a2b8' },
                                    { name: 'Failed', value: 1, color: '#6c757d' }
                                  ]}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={28}
                                  outerRadius={48}
                                  paddingAngle={2}
                                  dataKey="value"
                                >
                                  {['#28a745', '#dc3545', '#ffc107', '#17a2b8', '#6c757d'].map((color, index) => (
                                    <Cell key={index} fill={color} />
                                  ))}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Stats Summary */}
                        <div className="d-flex flex-column justify-content-center" style={{ flex: 1, gap: '3px' }}>
                          <div className="d-flex align-items-center gap-1">
                            <CheckCircle className="text-success" size={13} />
                            <span style={{ fontSize: '0.75rem' }}>Answered</span>
                            <span className="fw-bold ms-auto" style={{ fontSize: '0.75rem' }}>18</span>
                          </div>
                          <div className="d-flex align-items-center gap-1">
                            <XCircle className="text-danger" size={13} />
                            <span style={{ fontSize: '0.75rem' }}>No Answer</span>
                            <span className="fw-bold ms-auto" style={{ fontSize: '0.75rem' }}>4</span>
                          </div>
                          <div className="d-flex align-items-center gap-1">
                            <Clock className="text-warning" size={13} />
                            <span style={{ fontSize: '0.75rem' }}>Busy</span>
                            <span className="fw-bold ms-auto" style={{ fontSize: '0.75rem' }}>2</span>
                          </div>
                          <div className="d-flex align-items-center gap-1">
                            <Phone className="text-info" size={13} />
                            <span style={{ fontSize: '0.75rem' }}>Voicemail</span>
                            <span className="fw-bold ms-auto" style={{ fontSize: '0.75rem' }}>3</span>
                          </div>
                          <div className="d-flex align-items-center gap-1">
                            <XCircle className="text-secondary" size={13} />
                            <span style={{ fontSize: '0.75rem' }}>Failed</span>
                            <span className="fw-bold ms-auto" style={{ fontSize: '0.75rem' }}>1</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="primary" className="mx-auto d-block mt-auto" size="sm" style={{ width: '160px' }}>Open Call Log</Button>
                    </div>
                  </Col>

                  {/* Vertical Divider */}
                  <Col xs={12} md={6} className="border-start border-md-1 border-0">
                    <div className="d-flex flex-column h-100">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0 fw-bold">Top Call Reasons</h6>
                        <span className="text-muted">•••</span>
                      </div>
                      <div className="d-flex gap-2 flex-grow-1">
                        {/* Donut Chart */}
                        <div className="d-flex align-items-center justify-content-center" style={{ flex: 1 }}>
                          <div style={{ width: '110px', height: '110px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={[
                                    { name: 'Billing Issue', value: 25, color: '#ffc107' },
                                    { name: 'Pricing', value: 20, color: '#fd7e14' },
                                    { name: 'Tech Support', value: 18, color: '#dc3545' },
                                    { name: 'Order Status', value: 15, color: '#28a745' },
                                    { name: 'Cancellation', value: 12, color: '#20c997' },
                                    { name: 'General', value: 10, color: '#17a2b8' }
                                  ]}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={28}
                                  outerRadius={48}
                                  paddingAngle={2}
                                  dataKey="value"
                                >
                                  {['#ffc107', '#fd7e14', '#dc3545', '#28a745', '#20c997', '#17a2b8'].map((color, index) => (
                                    <Cell key={index} fill={color} />
                                  ))}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Stats Summary */}
                        <div className="d-flex flex-column justify-content-center" style={{ flex: 1, gap: '3px' }}>
                          <div className="d-flex align-items-center gap-1">
                            <AlertCircle className="text-warning" size={13} />
                            <span style={{ fontSize: '0.75rem' }}>Billing Issue</span>
                            <span className="fw-bold ms-auto" style={{ fontSize: '0.75rem' }}>25</span>
                          </div>
                          <div className="d-flex align-items-center gap-1">
                            <DollarSign className="text-warning" size={13} />
                            <span style={{ fontSize: '0.75rem' }}>Pricing</span>
                            <span className="fw-bold ms-auto" style={{ fontSize: '0.75rem' }}>20</span>
                          </div>
                          <div className="d-flex align-items-center gap-1">
                            <Wrench className="text-warning" size={13} />
                            <span style={{ fontSize: '0.75rem' }}>Tech Support</span>
                            <span className="fw-bold ms-auto" style={{ fontSize: '0.75rem' }}>18</span>
                          </div>
                          <div className="d-flex align-items-center gap-1">
                            <Package className="text-success" size={13} />
                            <span style={{ fontSize: '0.75rem' }}>Order Status</span>
                            <span className="fw-bold ms-auto" style={{ fontSize: '0.75rem' }}>15</span>
                          </div>
                          <div className="d-flex align-items-center gap-1">
                            <Ban className="text-success" size={13} />
                            <span style={{ fontSize: '0.75rem' }}>Cancellation</span>
                            <span className="fw-bold ms-auto" style={{ fontSize: '0.75rem' }}>12</span>
                          </div>
                          <div className="d-flex align-items-center gap-1">
                            <Phone className="text-info" size={13} />
                            <span style={{ fontSize: '0.75rem' }}>General</span>
                            <span className="fw-bold ms-auto" style={{ fontSize: '0.75rem' }}>10</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>

        </Row>

        {/* Resources & Knowledge */}
        <h5 className="mb-2 fw-bold">Resources & Knowledge</h5>

        <Row className="g-3 mb-3">
          {/* Quick Help */}
          <Col xs={12} md={6} lg={3}>
            <Card className="h-100 shadow-sm">
              <Card.Body className="p-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0 fw-bold">Quick Help</h6>
                  <span className="text-muted">•••</span>
                </div>
                <div className="d-flex gap-2">
                  <Button variant="primary" size="sm">CRM Help</Button>
                  <Button variant="primary" size="sm">Calling Help</Button>
                  <Button variant="primary" size="sm">AI Help</Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Recommended Guides */}
          <Col xs={12} md={6} lg={3}>
            <Card className="h-100 shadow-sm">
              <Card.Body className="p-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0 fw-bold">Recommended Guides</h6>
                  <span className="text-muted">•••</span>
                </div>
                <ul className="list-unstyled mb-0">
                  <li className="mb-1" style={{ fontSize: '0.9rem' }}>• Lead Follow-Up Tips</li>
                  <li className="mb-1" style={{ fontSize: '0.9rem' }}>• Effective Call Scripts</li>
                  <li className="mb-1" style={{ fontSize: '0.9rem' }}>• Handling Objections</li>
                  <li className="mb-1" style={{ fontSize: '0.9rem' }}>• Email Templates</li>
                  <li className="mb-1" style={{ fontSize: '0.9rem' }}>• Closing Techniques</li>
                  <li className="mb-1" style={{ fontSize: '0.9rem' }}>• Product Knowledge Base</li>
                </ul>
              </Card.Body>
            </Card>
          </Col>

          {/* Templates */}
          <Col xs={12} md={6} lg={3}>
            <Card className="h-100 shadow-sm">
              <Card.Body className="p-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0 fw-bold">Templates</h6>
                  <span className="text-muted">•••</span>
                </div>
                <Row className="g-2">
                  <Col xs={4}>
                    <div className="text-center p-3 border rounded" style={{ cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#0d6efd'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#dee2e6'}>
                      <MessageSquare className="text-primary mb-2" size={28} />
                      <small className="d-block fw-semibold" style={{ fontSize: '0.7rem', lineHeight: '1.2' }}>Messages</small>
                    </div>
                  </Col>
                  <Col xs={4}>
                    <div className="text-center p-3 border rounded" style={{ cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#0d6efd'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#dee2e6'}>
                      <PhoneCall className="text-primary mb-2" size={28} />
                      <small className="d-block fw-semibold" style={{ fontSize: '0.7rem', lineHeight: '1.2' }}>Call Script</small>
                    </div>
                  </Col>
                  <Col xs={4}>
                    <div className="text-center p-3 border rounded" style={{ cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#0d6efd'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#dee2e6'}>
                      <AlertOctagon className="text-primary mb-2" size={28} />
                      <small className="d-block fw-semibold" style={{ fontSize: '0.7rem', lineHeight: '1.2' }}>Objection</small>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>

          {/* My Day Summary */}
          <Col xs={12} md={6} lg={3}>
            <Card className="h-100 shadow-sm">
              <Card.Body className="p-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0 fw-bold">My Day Summary</h6>
                </div>
                <div className="mb-0">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <Badge bg="primary" pill className="d-flex align-items-center justify-content-center" style={{ width: '22px', height: '22px' }}>
                      <Clock size={12} />
                    </Badge>
                    <span style={{ fontSize: '0.85rem' }}>Online Time</span>
                    <span className="ms-auto fw-bold" style={{ fontSize: '0.9rem' }}>5h 20m</span>
                  </div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <Badge bg="primary" pill className="d-flex align-items-center justify-content-center" style={{ width: '22px', height: '22px' }}>
                      <Phone size={12} />
                    </Badge>
                    <span style={{ fontSize: '0.85rem' }}>On-Call Time</span>
                    <span className="ms-auto fw-bold" style={{ fontSize: '0.9rem' }}>2h 15m</span>
                  </div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <Badge bg="success" pill className="d-flex align-items-center justify-content-center" style={{ width: '22px', height: '22px' }}>
                      <CheckCircle size={12} />
                    </Badge>
                    <span style={{ fontSize: '0.85rem' }}>Tasks Done</span>
                    <span className="ms-auto fw-bold" style={{ fontSize: '0.9rem' }}>8/12</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <Badge bg="warning" pill className="d-flex align-items-center justify-content-center" style={{ width: '22px', height: '22px' }}>
                      <ShoppingCart size={12} />
                    </Badge>
                    <span style={{ fontSize: '0.85rem' }}>Deals Closed</span>
                    <span className="ms-auto fw-bold" style={{ fontSize: '0.9rem' }}>3</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
     
      </div>

  
        </React.Fragment>
    )
}

Dashboard.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};
  
export default Dashboard
