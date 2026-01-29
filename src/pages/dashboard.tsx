import React,{ReactElement, useEffect, useState} from 'react'
import Layout from '@layout/index'
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
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
  PhoneMissed,
  PhoneIncoming,
  PhoneOff,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import TimezoneSearch from '@components/TimezoneSearch';
import { GetTranscriptionOverview } from '@utils/calls';
import { getCrmDashboardOverview } from '@utils/crm';
import { toast } from 'react-toastify';

// Helper function to format numbers with commas
const formatNumber = (value: number | undefined | null): string => {
  const num = value || 0;
  return num.toLocaleString('en-US');
};

// Custom Tooltip for PieChart to avoid hiding center text
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div
        style={{
          backgroundColor: '#fff',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '0.75rem',
          padding: '6px 10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          pointerEvents: 'none',
          zIndex: 1000,
          position: 'relative'
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{data.name}</div>
        <div style={{ color: '#666' }}>{formatNumber(data.value)}</div>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const router = useRouter();
  const { data: session } = useSession();
    
  const [transcriptionOverview, setTranscriptionOverview] = useState<any>(null);
  const [crmDashboardData, setCrmDashboardData] = useState<any>(null);
  const [meetingCount, setMeetingCount] = useState<number>(0);
  const [followUpCount, setFollowUpCount] = useState<number>(0);
  const [tasksCount, setTasksCount] = useState<number>(0);
  const [missedCallsCount, setMissedCallsCount] = useState<number>(4);
  const [callbacksDueCount, setCallbacksDueCount] = useState<number>(2);
  const [voicemailsCount, setVoicemailsCount] = useState<number>(3);


  useEffect(() => {
    getCrmDashboardOverview().then((data) => {
      console.log("CRM Dashboard Overview", data);
      if (data) {
        setCrmDashboardData(data);
      }
    });
  }, []);



  useEffect(() => {
    GetTranscriptionOverview().then((data) => {
     
      if(data){
        console.log("Transcription Overview summary", data);
        setTranscriptionOverview(data);
      } 
      
    });
    
    // TODO: Replace with actual API call to fetch meeting, follow up, and tasks counts
    // For now using mock data
    setMeetingCount(15);
    setFollowUpCount(8);
    setTasksCount(12);
    
    // TODO: Replace with actual API call to fetch missed calls, callbacks due, and voicemails counts
    // For now using mock data
    setMissedCallsCount(4);
    setCallbacksDueCount(2);
    setVoicemailsCount(3);
  }, []);

    return (
        <React.Fragment>


      {/* Main Content Area */}
      <div className="content-wrapper crm-dashboard-content">
        
        {/* Header Navigation */}
<Row className="mb-4">
  <Col xs={12} md={6}>
    <div className="d-flex gap-2 mb-3">
      {/* <Button variant="primary" size="sm">Today</Button>
      <Button variant="outline-secondary" size="sm">This Week</Button>
      <Button variant="outline-secondary" size="sm">This Month</Button> */}
    </div>
  </Col>
  <Col xs={12} sm={12} md={12} lg={12} xl={12} xxl={6}>
    <div className="d-flex align-items-center justify-content-end bg-white border rounded" style={{ padding: '0' }}>
      <div className="position-relative flex-grow-1">
        <Search className="position-absolute" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d', zIndex: 10 }} size={18} />
        <Form.Control
          type="text"
          placeholder="Search across your workspace"
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
        <h4 className="mb-4 fw-bold">My CRM Workspace</h4>

        {/* Top Row - Main Cards */}
        <Row className="g-3 mb-3">

          {/* My Sales Summary */}
          <Col xs={12} sm={12} md={6} lg={6} xl={6} xxl={3}>
            <Card className="h-100 shadow-sm">
              <Card.Body className="p-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0 fw-bold">My Sales Summary</h6>
                  <span className="text-muted">•••</span>
                </div>
                <div className="d-flex flex-column gap-3">
                  {/* Leads */}
                  {(() => {
                    const totalCount = crmDashboardData?.crm_data_count || 0;
                    const convertedCount = crmDashboardData?.converted_to_tickets || 0;
                    const percentage = totalCount > 0 ? Math.round((convertedCount / totalCount) * 100) : 0;
                    return (
                      <div>
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <div className="d-flex align-items-center gap-2">
                            <FileText className="text-success" size={18} />
                            <span className="small fw-semibold">Leads</span>
                          </div>
                          {/* <span className="fw-bold" style={{ fontSize: '0.85rem' }}>{formatNumber(totalCount)}</span> */}
                        </div>
                        <ProgressBar 
                          now={percentage} 
                          variant="success" 
                          style={{ height: '6px', borderRadius: '3px' }} 
                        />
                        <div className="d-flex justify-content-between mt-1">
                          <small className="text-muted" style={{ fontSize: '0.7rem' }}>{formatNumber(convertedCount)} Converted</small>
                          <small className="text-muted" style={{ fontSize: '0.7rem' }}>{percentage}%</small>
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* Deals */}
                  {(() => {
                    const totalCount = crmDashboardData?.crm_data_count || 0;
                    const convertedCount = crmDashboardData?.leads_converted_to_deals || 0;
                    const percentage = totalCount > 0 ? Math.round((convertedCount / totalCount) * 100) : 0;
                    return (
                      <div>
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <div className="d-flex align-items-center gap-2">
                            <Users className="text-info" size={18} />
                            <span className="small fw-semibold">Deals</span>
                          </div>
                          {/* <span className="fw-bold" style={{ fontSize: '0.85rem' }}>s{formatNumber(totalCount)}</span> */}
                        </div>
                        <ProgressBar 
                          now={percentage} 
                          variant="info" 
                          style={{ height: '6px', borderRadius: '3px' }} 
                        />
                        <div className="d-flex justify-content-between mt-1">
                          <small className="text-muted" style={{ fontSize: '0.7rem' }}>{formatNumber(convertedCount)} Converted</small>
                          <small className="text-muted" style={{ fontSize: '0.7rem' }}>{percentage}%</small>
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* Orders */}
                  {(() => {
                    const totalCount = crmDashboardData?.crm_data_count || 0;
                    const convertedCount = crmDashboardData?.deals_converted_to_orders || 0;
                    const percentage = totalCount > 0 ? Math.round((convertedCount / totalCount) * 100) : 0;
                    return (
                      <div>
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <div className="d-flex align-items-center gap-2">
                            <ShoppingCart className="text-warning" size={18} />
                            <span className="small fw-semibold">Orders</span>
                          </div>
                          {/* <span className="fw-bold" style={{ fontSize: '0.85rem' }}>{formatNumber(totalCount)}</span> */}
                        </div>
                        <ProgressBar 
                          now={percentage} 
                          variant="warning" 
                          style={{ height: '6px', borderRadius: '3px' }} 
                        />
                        <div className="d-flex justify-content-between mt-1">
                          <small className="text-muted" style={{ fontSize: '0.7rem' }}>{formatNumber(convertedCount)} Converted</small>
                          <small className="text-muted" style={{ fontSize: '0.7rem' }}>{percentage}%</small>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Meetings, Follow Ups, Tasks */}
          <Col xs={12} sm={12} md={6} lg={6} xl={6} xxl={3}>
            <Card className="h-100 shadow-sm">
              <Card.Body className="p-3 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0 fw-bold">Meetings, Follow Ups & Tasks</h6>
                  <span className="text-muted">•••</span>
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
                        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                          <Tooltip 
                            content={<CustomPieTooltip />}
                            allowEscapeViewBox={{ x: true, y: true }}
                            cursor={false}
                            offset={15}
                            wrapperStyle={{ zIndex: 1000, pointerEvents: 'none' }}
                          />
                          <Pie
                            data={[
                              { name: 'Meetings', value: crmDashboardData?.total_meetings || 0, color: '#0d6efd' },
                              { name: 'Follow Ups', value: crmDashboardData?.total_followups || 0, color: '#198754' },
                              { name: 'Tasks', value: crmDashboardData?.total_tasks || 0, color: '#ffc107' }
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
                            <Cell fill="#0d6efd" />
                            <Cell fill="#198754" />
                            <Cell fill="#ffc107" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>

                      {/* Center Text */}
                      <div className="position-absolute top-50 start-50 translate-middle d-flex flex-column align-items-center">
                        <span
                          className="fw-bold text-dark"
                          style={{ fontSize: '2rem', lineHeight: 1 }}
                        >
                          {formatNumber((crmDashboardData?.total_meetings || 0) + (crmDashboardData?.total_followups || 0) + (crmDashboardData?.total_tasks || 0))}
                        </span>
                      </div>
                    </div>
                    <small className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>Total</small>
                  </div>

                  {/* Stats Column */}
                  <div
                    className="d-flex flex-column justify-content-center gap-2"
                    style={{ flex: 1 }}
                  >
                    <div>
                      <div className="text-muted small mb-1">
                        Meetings
                      </div>
                      <div className="h4 mb-0 fw-bold text-dark">{formatNumber(crmDashboardData?.total_meetings || 0)}</div>
                    </div>

                    <div>
                      <div className="text-muted small mb-1">
                        Follow Ups
                      </div>
                      <div className="h4 mb-0 fw-bold text-dark">{formatNumber(crmDashboardData?.total_followups || 0)}</div>
                    </div>

                    <div>
                      <div className="text-muted small mb-1">
                        Tasks
                      </div>
                      <div className="h4 mb-0 fw-bold text-dark">{formatNumber(crmDashboardData?.total_tasks || 0)}</div>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          
          {/* Overdue Today */}
          <Col xs={12} sm={12} md={6} lg={6} xl={6} xxl={3}>
            <Card className="h-100 shadow-sm">
              <Card.Body className="p-3 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0 fw-bold">Overdue Today</h6>
                  <span className="text-muted">•••</span>
                </div>
                <div className="d-flex flex-column gap-2 mb-2 flex-grow-1">
                <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <Clock className="text-info" size={18} />
                      <span style={{ fontSize: '0.9rem' }}>Scheduled Calls</span>
                    </div>
                    <Badge bg="info" pill className="d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px', fontSize: '0.75rem' }}>{formatNumber(crmDashboardData?.scheduled_calls || 0)}</Badge>
                  </div>
                  
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <AlertCircle className="text-danger" size={18} />
                      <span style={{ fontSize: '0.9rem' }}>Overdue Tasks</span>
                    </div>
                    <Badge bg="danger" pill className="d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px', fontSize: '0.75rem' }}>{formatNumber(crmDashboardData?.overdue_tasks || 0)}</Badge>
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <Phone className="text-danger" size={18} />
                      <span style={{ fontSize: '0.9rem' }}>Overdue Follow-Ups</span>
                    </div>
                    <Badge bg="danger" pill className="d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px', fontSize: '0.75rem' }}>{formatNumber(crmDashboardData?.overdue_followups || 0)}</Badge>
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <FileText className="text-warning" size={18} />
                      <span style={{ fontSize: '0.9rem' }}>Lost Leads</span>
                    </div>
                    <Badge bg="warning" pill className="d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px', fontSize: '0.75rem' }}>{formatNumber(crmDashboardData?.lost_leads || 0)}</Badge>
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <FileText className="text-warning" size={18} />
                      <span style={{ fontSize: '0.9rem' }}>Lost Deals</span>
                    </div>
                    <Badge bg="warning" pill className="d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px', fontSize: '0.75rem' }}>{formatNumber(crmDashboardData?.lost_deals || 0)}</Badge>
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <DollarSign className="text-warning" size={18} />
                      <span style={{ fontSize: '0.9rem' }}>Cancelled Orders</span>
                    </div>
                    <Badge bg="warning" pill className="d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px', fontSize: '0.75rem' }}>{formatNumber(crmDashboardData?.cancelled_orders || 0)}</Badge>
                  </div>
                  
                </div>
                {session?.user?.permissions?.includes('dashboard-crm') && (
                  <Button 
                    variant="primary" 
                    className="mx-auto d-block mt-auto" 
                    
                    onClick={() => router.push('/crm/dashboard')}
                  >
                    Visit Dashboard
                  </Button>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Next Best Actions */}
          <Col xs={12} sm={12} md={6} lg={6} xl={6} xxl={3}>
            <Card className="h-100 shadow-sm">
              {/* <Card.Body className="p-3 d-flex flex-column">
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
              </Card.Body> */}

<Card.Body className="p-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0 fw-bold">Quick Help</h6>
                  <span className="text-muted">•••</span>
                </div>
                <div className="row g-2">
                  <div className="col-6">
                    <Button variant="primary" size="sm" className="w-100">CRM</Button>
                  </div>
                  <div className="col-6">
                    <Button variant="primary" size="sm" className="w-100">Live Calls</Button>
                  </div>
                  
                  <div className="col-6">
                    <Button variant="primary" size="sm" className="w-100">Dialer</Button>
                  </div>
                  <div className="col-6">
                    <Button variant="primary" size="sm" className="w-100">Live Wallboards</Button>
                  </div>
                  <div className="col-6">
                    <Button variant="primary" size="sm" className="w-100">Billing</Button>
                  </div>                  <div className="col-6">
                    <Button variant="primary" size="sm" className="w-100">Control Hub</Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* My Call Details */}
        <h5 className="mb-2 fw-bold">My Call Details</h5>

        {/* Call Details Row */}
        <Row className="g-3 mb-3">
          {/* Calls Today */}
          <Col xs={12} sm={12} md={6} lg={6} xl={6} xxl={3}>
            <Card className="h-100 shadow-sm">
              <Card.Body className="p-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0 fw-bold">Calls Today</h6>
                  <span className="text-muted">•••</span>
                </div>
                <div className="d-flex justify-content-around align-items-center  mb-3">
                  <div className="text-center">
                    <div className="h3 fw-bold text-primary mb-0">{formatNumber(transcriptionOverview?.calls?.total)}</div>
                    <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Total Calls</small>
                  </div>
                  <div className="text-center">
                    <div className="h3 fw-bold text-dark mb-0">{formatNumber(transcriptionOverview?.calls?.outbound)}</div>
                    <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Outbound</small>
                  </div>
                  <div className="text-center">
                    <div className="h3 fw-bold text-dark mb-0">{formatNumber(transcriptionOverview?.calls?.inbound)}</div>
                    <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Inbound</small>
                  </div>
                </div>

                <div className="d-flex justify-content-around align-items-center">
                  <div className="text-center">
                    <div className="h3 fw-bold text-primary mb-0">{formatNumber(transcriptionOverview?.missed_callbacks?.answered)}</div>
                    <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Answered</small>
                  </div>
                  <div className="text-center">
                    <div className="h3 fw-bold text-dark mb-0">{formatNumber(transcriptionOverview?.missed_callbacks?.unanswered)}</div>
                    <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Unanswered</small>
                  </div>
                  <div className="text-center">
                    <div className="h3 fw-bold text-dark mb-0">{formatNumber(transcriptionOverview?.missed_callbacks?.missed_calls)}</div>
                    <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Missed Calls</small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Missed & Callbacks */}
          <Col xs={12} sm={12} md={6} lg={6} xl={6} xxl={3}>
            <Card 
              className="h-100 shadow-sm" 
              style={{
                opacity: 0.8,
                pointerEvents: 'none',
                cursor: 'not-allowed'
              }}
            >
              <Card.Body className="p-3 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0 fw-bold">AI Analysis</h6>
                  <span className="text-muted">•••</span>
                </div>
                <div className="d-flex gap-3 mb-2 flex-grow-1">
                  {/* Left Column - List */}
                  <div className="d-flex flex-column gap-2" style={{ flex: 1.5 }}>
                    <div className="d-flex align-items-center gap-2">
                      <Badge bg="danger" pill className="d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px', fontSize: '0.75rem' }}>100</Badge>
                      <span style={{ fontSize: '0.9rem' }}>Analyzed Calls</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <Badge bg="danger" pill className="d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px', fontSize: '0.75rem' }}>40</Badge>
                      <span style={{ fontSize: '0.9rem' }}>Qualified Calls</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <Badge bg="warning" pill className="d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px', fontSize: '0.75rem' }}>2</Badge>
                      <span style={{ fontSize: '0.9rem' }}>Unqualified Calls</span>
                    </div>
                   
                    <div className="d-flex align-items-center gap-2">
                      <Badge bg="warning" pill className="d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px', fontSize: '0.75rem' }}>{voicemailsCount}</Badge>
                      <span style={{ fontSize: '0.9rem' }}>Inquiries</span>
                    </div>
                  </div>
                  
                  {/* Right Column - Bar Chart */}
                  <div style={{ flex: 0.5, minWidth: '80px' }}>
                    <ResponsiveContainer width="100%" height={80}>
                      <BarChart
                        data={[
                          { name: 'Missed', value: missedCallsCount, color: '#dc3545' },
                          { name: 'Callback', value: callbacksDueCount, color: '#fd7e14' },
                          { name: 'Voice', value: voicemailsCount, color: '#ffc107' }
                        ]}
                        layout="vertical"
                        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                      >
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" hide />
                        <Tooltip contentStyle={{ fontSize: '0.75rem', padding: '4px 8px' }} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {[
                            { name: 'Missed', value: missedCallsCount, color: '#dc3545' },
                            { name: 'Callback', value: callbacksDueCount, color: '#fd7e14' },
                            { name: 'Voice', value: voicemailsCount, color: '#ffc107' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <Button disabled={true} variant="primary" className="mx-auto d-block mt-auto" style={{  }}>
                  <Phone size={16} className="me-2" /> Go to AI Insights
                </Button>
              </Card.Body>
            </Card>
          </Col>

          {/* Call Analytics - Merged Card */}
          <Col xs={12} sm={12} md={12} lg={12} xl={12} xxl={6}>
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
                          {(() => {
                            const internalCalls = transcriptionOverview?.call_outcomes?.internal_calls || 0;
                            const externalCalls = transcriptionOverview?.call_outcomes?.external_calls || 0;
                            const national = transcriptionOverview?.call_outcomes?.national || 0;
                            const international = transcriptionOverview?.call_outcomes?.international || 0;
                            const total = internalCalls + externalCalls + national + international;
                            
                            if (total === 0) {
                              return (
                                <div style={{ width: '110px', height: '110px' }} className="d-flex flex-column align-items-center justify-content-center">
                                  <Phone className="text-muted" size={18} style={{ opacity: 0.5 }} />
                                  <small className="text-muted mt-2" style={{ fontSize: '0.7rem' }}>No Data</small>
                                </div>
                              );
                            }
                            
                            return (
                              <div style={{ width: '110px', height: '110px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={[
                                        { name: 'Internal Calls', value: internalCalls, color: '#28a745' },
                                        { name: 'External Calls', value: externalCalls, color: '#dc3545' },
                                        { name: 'National', value: national, color: '#ffc107' },
                                        { name: 'International', value: international, color: '#17a2b8' }
                                      ]}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={28}
                                      outerRadius={48}
                                      paddingAngle={2}
                                      dataKey="value"
                                    >
                                      {['#28a745', '#dc3545', '#ffc107', '#17a2b8'].map((color, index) => (
                                        <Cell key={index} fill={color} />
                                      ))}
                                    </Pie>
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Stats Summary */}
                        <div className="d-flex flex-column justify-content-center" style={{ flex: 1, gap: '3px' }}>
                          <div className="d-flex align-items-center gap-1">
                            <Phone className="text-success" size={13} />
                            <span style={{ fontSize: '0.75rem' }}>Internal Calls</span>
                            <span className="fw-bold ms-auto" style={{ fontSize: '0.75rem' }}>{formatNumber(transcriptionOverview?.call_outcomes?.internal_calls)}</span>
                          </div>
                          <div className="d-flex align-items-center gap-1">
                            <Phone className="text-danger" size={13} />
                            <span style={{ fontSize: '0.75rem' }}>External Calls</span>
                            <span className="fw-bold ms-auto" style={{ fontSize: '0.75rem' }}>{formatNumber(transcriptionOverview?.call_outcomes?.external_calls)}</span>
                          </div>
                          <div className="d-flex align-items-center gap-1">
                            <Phone className="text-warning" size={13} />
                            <span style={{ fontSize: '0.75rem' }}>National</span>
                            <span className="fw-bold ms-auto" style={{ fontSize: '0.75rem' }}>{formatNumber(transcriptionOverview?.call_outcomes?.national)}</span>
                          </div>
                          <div className="d-flex align-items-center gap-1">
                            <Phone className="text-info" size={13} />
                            <span style={{ fontSize: '0.75rem' }}>International</span>
                            <span className="fw-bold ms-auto" style={{ fontSize: '0.75rem' }}>{formatNumber(transcriptionOverview?.call_outcomes?.international)}</span>
                          </div>
                          
                        </div>
                      </div>
                      <Button 
                        variant="primary" 
                        className="mx-auto d-block mt-auto" 
                       
                        onClick={() => {
                          if (session?.user?.permissions?.includes('dashboard-call-logs')) {
                            router.push('/call-logs/dashboard');
                          }
                        }}
                        disabled={!session?.user?.permissions?.includes('dashboard-call-logs') && !session?.user?.permissions?.includes('view-call-logs')}
                      >
                        Visit Dashboard
                      </Button>
                    </div>
                  </Col>

                  {/* Vertical Divider */}
                  <Col xs={12} md={6} className="border-start border-md-1 border-0">
                    
                    
                    <div className="d-flex flex-column h-100">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0 fw-bold">Missed & Callbacks</h6>
                        <span className="text-muted">•••</span>
                      </div>
                      <div className="d-flex gap-2 flex-grow-1">
                        {/* Donut Chart */}
                        <div className="d-flex align-items-center justify-content-center" style={{ flex: 1 }}>
                          {(() => {
                            const missedCalls = transcriptionOverview?.missed_callbacks?.missed_calls || 0;
                            const answered = transcriptionOverview?.missed_callbacks?.answered || 0;
                            const unanswered = transcriptionOverview?.missed_callbacks?.unanswered || 0;
                            const total = missedCalls + answered + unanswered;
                            
                            if (total === 0) {
                              return (
                                <div style={{ width: '110px', height: '110px' }} className="d-flex flex-column align-items-center justify-content-center">
                                  <Phone className="text-muted" size={18} style={{ opacity: 0.5 }} />
                                  <small className="text-muted mt-2" style={{ fontSize: '0.7rem' }}>No Data</small>
                                </div>
                              );
                            }
                            
                            return (
                              <div style={{ width: '110px', height: '110px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Tooltip 
                                      content={<CustomPieTooltip />}
                                      allowEscapeViewBox={{ x: true, y: true }}
                                      cursor={false}
                                      offset={70}
                                    />
                                    <Pie
                                      data={[
                                        { name: 'Missed Calls', value: missedCalls, color: '#ffc107' },
                                        { name: 'Answered', value: answered, color: '#28a745' },
                                        { name: 'Unanswered', value: unanswered, color: '#dc3545' }
                                      ]}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={28}
                                      outerRadius={48}
                                      paddingAngle={2}
                                      dataKey="value"
                                    >
                                      {['#ffc107', '#28a745', '#dc3545'].map((color, index) => (
                                        <Cell key={index} fill={color} />
                                      ))}
                                    </Pie>
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Stats Summary */}
                        <div className="d-flex flex-column justify-content-center" style={{ flex: 1, gap: '3px' }}>
                          <div className="d-flex align-items-center gap-1">
                            <PhoneMissed className="text-warning" size={13} />
                            <span style={{ fontSize: '0.75rem' }}>Total Missed Calls</span>
                            <span className="fw-bold ms-auto" style={{ fontSize: '0.75rem' }}>{formatNumber(transcriptionOverview?.missed_callbacks?.missed_calls || 0)}</span>
                          </div>
                          <div className="d-flex align-items-center gap-1">
                            <PhoneIncoming className="text-success" size={13} />
                            <span style={{ fontSize: '0.75rem' }}>Total Answered Calls</span>
                            <span className="fw-bold ms-auto" style={{ fontSize: '0.75rem' }}>{formatNumber(transcriptionOverview?.missed_callbacks?.answered || 0)}</span>
                          </div>
                          <div className="d-flex align-items-center gap-1">
                            <PhoneOff className="text-warning" size={13} />
                            <span style={{ fontSize: '0.75rem' }}>Total Unanswered Calls</span>
                            <span className="fw-bold ms-auto" style={{ fontSize: '0.75rem' }}>{formatNumber(transcriptionOverview?.missed_callbacks?.unanswered || 0)}</span>
                          </div>
                          {/* 
                          <div className="d-flex align-items-center gap-1">
                            <Phone className="text-success" size={13} />
                            <span style={{ fontSize: '0.75rem' }}>Total Voicemails</span>
                            <span className="fw-bold ms-auto" style={{ fontSize: '0.75rem' }}>15</span>
                          </div>
                          <div className="d-flex align-items-center gap-1">
                            <Phone className="text-success" size={13} />
                            <span style={{ fontSize: '0.75rem' }}>Total Failed Calls</span>
                            <span className="fw-bold ms-auto" style={{ fontSize: '0.75rem' }}>12</span>
                          </div> */}
                          
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
          <Col xs={12} sm={12} md={6} lg={6} xl={6} xxl={3}>
            <Card className="h-100 shadow-sm">
            <Card.Body className="p-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0 fw-bold">Quick Help</h6>
                  <span className="text-muted">•••</span>
                </div>
                <div className="row g-2">
                  <div className="col-6">
                    <Button variant="primary" size="sm" className="w-100">CRM</Button>
                  </div>
                  <div className="col-6">
                    <Button variant="primary" size="sm" className="w-100">Live Calls</Button>
                  </div>
                  
                  <div className="col-6">
                    <Button variant="primary" size="sm" className="w-100">AI Insights</Button>
                  </div>
                  <div className="col-6">
                    <Button variant="primary" size="sm" className="w-100">Live Wallboards</Button>
                  </div>
                  <div className="col-6">
                    <Button variant="primary" size="sm" className="w-100">Control Hub</Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Recommended Guides */}
          <Col xs={12} sm={12} md={6} lg={6} xl={6} xxl={3}>
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
          <Col xs={12} sm={12} md={6} lg={6} xl={6} xxl={3}>
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
          <Col xs={12} sm={12} md={6} lg={6} xl={6} xxl={3}>
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
