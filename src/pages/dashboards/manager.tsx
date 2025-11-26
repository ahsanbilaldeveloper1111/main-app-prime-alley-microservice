import { useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  Bell,
  Users,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import ExpandableSidebar from '@components/updated-sidebar';
import CompanyLogo2 from '@assets/images/ringedge-logo-black-n-blue.png';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const kpiCards = [
  { id: 'agents', label: 'Active Agents', value: '126', change: '+4% vs yesterday', icon: <Users size={22} />, accent: '#5e60ce' },
  { id: 'calls', label: 'Call Volume (In/Out)', value: '3,482', change: '+8% engagement', icon: <Activity size={22} />, accent: '#2ec4b6' },
  { id: 'sla', label: 'Service Level', value: '94.2%', change: 'Target 92%', icon: <ShieldCheck size={22} />, accent: '#ffc107' },
  { id: 'abandon', label: 'Queue Health', value: '3.4% / 00:43s', change: 'Abandon / Wait Time', icon: <Clock size={22} />, accent: '#ff6b6b' },
  { id: 'csat', label: 'CSAT', value: '4.6 / 5', change: '+0.2 sentiment', icon: <TrendingUp size={22} />, accent: '#845ef7' },
  { id: 'revenue', label: 'Revenue This Week', value: '$482K', change: '+11% growth', icon: <DollarSign size={22} />, accent: '#20c997' },
];

const statusSnapshot = [
  { title: 'SLA Health', value: 'High confidence', sentiment: 'Positive', color: '#20c997' },
  { title: 'Idle Risk', value: '6 agents over 20m', sentiment: 'Investigate', color: '#ff922b' },
  { title: 'Campaign Pulse', value: 'Winter Push 12%', sentiment: 'Needs boost', color: '#845ef7' },
];

const ordersSummary = [
  { label: 'Delivered', value: '812' },
  { label: 'Pending', value: '143' },
  { label: 'On Hold', value: '37' },
  { label: 'Escalated', value: '9' },
];

const alerts = [
  { type: 'SLA Risk Alert', description: 'Team Delta trending toward 88% SLA in the last 30 mins', severity: 'high' },
  { type: 'High Idle Time', description: '6 agents idle > 20 mins in Sales - NA', severity: 'medium' },
  { type: 'High Queue Load', description: 'Queue Retail-Support peaked at 65 waiting callers', severity: 'high' },
  { type: 'Campaign Alert', description: 'Campaign “Winter Push” below 12% conversion today', severity: 'low' },
];

const marketingHighlights = [
  { title: 'RingEdge Growth Pack', description: 'Unlock agent AI-coaching, analytics bundles, and CX consulting.', cta: 'View Packages' },
  { title: 'Leadership Updates', description: 'Q1 regional goals released. Align scorecards with the latest targets.', cta: 'View Updates' },
  { title: 'Product Announcements', description: 'New call sentiment monitor rolling out to all enterprise plans.', cta: 'See Announcement' },
];

const topCampaigns = [
  { name: 'Holiday Blitz', conversion: 18, status: 'On track', color: '#22c55e' },
  { name: 'Retention X', conversion: 21, status: 'Surging', color: '#3b82f6' },
  { name: 'Upsell Wave', conversion: 24, status: 'On track', color: '#a855f7' },
];

const ManagerDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeScreen, setActiveScreen] = useState('dashboards-manager');
  const [heatmapSeries] = useState([
    {
      name: 'Team Alpha',
      data: [42, 39, 35, 48, 52, 60, 55, 48, 39, 33, 28, 26],
    },
    {
      name: 'Team Beta',
      data: [30, 28, 25, 40, 45, 50, 48, 45, 36, 32, 30, 24],
    },
    {
      name: 'Team Delta',
      data: [20, 20, 24, 35, 42, 46, 45, 40, 32, 30, 26, 22],
    },
  ]);

  const heatmapOptions = {
    chart: { type: 'heatmap', toolbar: { show: false } },
    dataLabels: { enabled: false },
    xaxis: { categories: ['8a', '9a', '10a', '11a', '12p', '1p', '2p', '3p', '4p', '5p', '6p', '7p'] },
    colors: ['#0d6efd'],
  };

  const teamPerformance = {
    series: [{ data: [92, 88, 84, 82, 79] }],
    options: {
      chart: { type: 'bar', toolbar: { show: false } },
      plotOptions: { bar: { horizontal: true, borderRadius: 6 } },
      xaxis: { categories: ['Team Alpha', 'Team Beta', 'Team Delta', 'Team Gamma', 'Team Ops'] },
      colors: ['#20c997'],
    },
  };

  const campaignTrend = {
    series: [{ name: 'Conversion Rate', data: [14, 16, 15, 17, 19, 22, 21] }],
    options: {
      chart: { type: 'line', toolbar: { show: false } },
      stroke: { width: 3, curve: 'smooth' },
      xaxis: { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
      colors: ['#845ef7'],
      markers: { size: 4 },
    },
  };

  const sentimentTrend = {
    series: [{ name: 'Negative Sentiment', data: [12, 11, 13, 10, 9, 11, 8] }],
    options: {
      chart: { type: 'area', toolbar: { show: false } },
      stroke: { curve: 'smooth' },
      xaxis: { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
      fill: { type: 'gradient', gradient: { shadeIntensity: 0.4, opacityFrom: 0.6, opacityTo: 0.1 } },
      colors: ['#ff922b'],
    },
  };

  return (
    <>
      <Head>
        <title>Manager Dashboard • RingEdge</title>
      </Head>
      <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <style>{`
          .content-wrapper {
            flex: 1;
            padding: 2rem;
            margin-left: 0;
            transition: margin-left 0.3s ease;
            overflow-x: hidden;
            max-width: 100vw;
          }

          @media (min-width: 992px) {
            .content-wrapper {
              margin-left: 280px;
            }
          }

          @media (max-width: 991px) {
            .content-wrapper {
              padding: 1rem;
            }
          }

          .mobile-toggle-btn {
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 1100;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }

          @media (min-width: 992px) {
            .mobile-toggle-btn {
              display: none;
            }
          }

          .manager-hero {
            border-radius: 36px;
            padding: 36px;
            color: #fff;
            position: relative;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.15);
            box-shadow: 0 30px 80px rgba(30, 64, 175, 0.25);
            background: linear-gradient(135deg, #2145ff 0%, #5a67ff 42%, #8a4dff 100%);
          }

          .manager-hero::before,
          .manager-hero::after {
            content: '';
            position: absolute;
            border-radius: 50%;
            opacity: 0.3;
            animation: pulse 8s ease-in-out infinite;
          }

          .manager-hero::before {
            width: 360px;
            height: 360px;
            top: -120px;
            right: -60px;
            background: radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%);
          }

          .manager-hero::after {
            width: 220px;
            height: 220px;
            bottom: -80px;
            left: -40px;
            background: radial-gradient(circle, rgba(255,255,255,0.35) 0%, transparent 70%);
          }

          @keyframes pulse {
            0% { transform: scale(0.95); opacity: 0.25; }
            50% { transform: scale(1.05); opacity: 0.45; }
            100% { transform: scale(0.95); opacity: 0.25; }
          }

          .glass-card {
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(255,255,255,0.4);
            box-shadow: 0 18px 40px rgba(15,23,42, 0.08);
            border-radius: 24px;
            padding: 24px;
          }

          .status-chip {
            border-radius: 18px;
            padding: 16px 20px;
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.4);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.6);
            backdrop-filter: blur(18px);
          }

          .kpi-card {
            border-radius: 28px;
            padding: 24px;
            border: none;
            box-shadow: 0 28px 60px rgba(15, 23, 42, 0.12);
            height: 100%;
            position: relative;
            overflow: hidden;
            background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
          }

          .kpi-card::after {
            content: '';
            position: absolute;
            inset: 16px;
            border-radius: 22px;
            background: linear-gradient(120deg, rgba(94,96,206,0.22), rgba(46,196,182,0.08));
            opacity: 0;
            transition: opacity 0.3s ease;
          }

          .kpi-card:hover::after {
            opacity: 1;
          }

          .kpi-pill {
            font-size: 0.75rem;
            border-radius: 999px;
            background: #eef2ff;
            padding: 6px 12px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: #334155;
          }

          .campaign-card {
            border-radius: 18px;
            padding: 18px 20px;
            background: #f9fbff;
            border: 1px solid rgba(15,23,42,0.05);
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 10px 25px rgba(15,23,42,0.04);
          }

          .campaign-meta {
            background: white;
            border-radius: 14px;
            padding: 10px 14px;
            min-width: 110px;
            text-align: center;
            font-weight: 600;
            font-size: 0.85rem;
          }

          .campaign-progress {
            height: 6px;
            border-radius: 999px;
            background: #e2e8f0;
            overflow: hidden;
          }

          .alerts-stack > div {
            border-radius: 18px;
            border: 1px solid rgba(15,23,42,0.08);
            padding: 18px;
            background: #fff;
          }
        `}</style>

        <Button
          variant="primary"
          className="mobile-toggle-btn d-lg-none"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu size={24} />
        </Button>

        <ExpandableSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeScreen={activeScreen}
          setActiveScreen={setActiveScreen}
        />

        <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top shadow-sm" style={{ position: 'fixed', left: sidebarOpen ? 0 : 0, right: 0, zIndex: 1000 }}>
          <div className="container-fluid">
            <div className="d-flex align-items-center gap-2">
              <Button
                variant="link"
                className="text-dark d-none d-lg-block p-2"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{ marginLeft: '-10px' }}
              >
                {sidebarOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
              </Button>
              <a className="navbar-brand fw-bold text-primary mb-0" href="#">
                <img src={CompanyLogo2.src} alt="logo" className="img-fluid" width={140} />
              </a>
            </div>
            <div className="ms-auto d-flex align-items-center gap-3">
              <Button variant="link" className="text-dark position-relative">
                <Bell size={20} />
                <Badge bg="danger" pill className="position-absolute translate-middle" style={{ top: '8px', left: '30px' }}>3</Badge>
              </Button>
              <div className="d-flex align-items-center gap-2">
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

        <div className="content-wrapper">
          <Container fluid style={{ marginTop: '85px' }}>
            <Row className="mb-4">
              <Col>
                <div className="manager-hero text-white">
                  <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-4 position-relative">
                    <div style={{ maxWidth: 520 }}>
                      <Badge bg="light" text="dark" className="text-uppercase mb-3">Manager’s Command Center</Badge>
                      <h1 className="fw-semibold display-6 mb-3">Your business at a glance.</h1>
                      <p className="mb-4 fs-5 text-white-50">Live insights to steer workforce, revenue, and customer sentiment with confidence.</p>
                      <div className="d-flex gap-3 flex-wrap">
                        {statusSnapshot.map(item => (
                          <div key={item.title} className="status-chip text-dark flex-grow-1" style={{ minWidth: 180 }}>
                            <small className="text-uppercase text-white-50">{item.title}</small>
                            <div className="d-flex justify-content-between align-items-center mt-2">
                              <span className="fw-semibold text-white">{item.value}</span>
                              <Badge bg="" style={{ backgroundColor: `${item.color}30`, color: '#fff' }}>
                                {item.sentiment}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="glass-card" style={{ minWidth: 260, background: 'rgba(14, 19, 57, 0.35)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}>
                      <div className="text-muted text-uppercase small mb-2">Efficiency boost</div>
                      <div className="d-flex align-items-end gap-2">
                        <div style={{ fontSize: '3.5rem', fontWeight: 700, lineHeight: 1 }}>+18%</div>
                        <div className="pb-2">
                          <small className="d-block text-white-50">vs last week</small>
                          <Badge bg="success" className="mt-1">Trending up</Badge>
                        </div>
                      </div>
                      <hr className="border-light opacity-25 my-3" />
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <small className="text-white-50">Peak utilization</small>
                          <p className="mb-0 fw-semibold">92% • Tue 11:30 AM</p>
                        </div>
                        <ArrowUpRight size={18} className="text-white-50" />
                      </div>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>

            <Row className="g-4 mb-4">
              {kpiCards.map(card => (
                <Col key={card.id} xxl={4} md={6}>
                  <Card className="kpi-card">
                    <div className="position-relative" style={{ zIndex: 1 }}>
                      <div className="d-flex justify-content-between align-items-start">
                        <div style={{ backgroundColor: '#f4f6ff', borderRadius: 18, padding: 14, color: card.accent, boxShadow: `0 10px 25px ${card.accent}30` }}>
                          {card.icon}
                        </div>
                        <ArrowUpRight size={20} className="text-muted" />
                      </div>
                      <p className="text-muted text-uppercase small mt-4 mb-2">{card.label}</p>
                      <h2 className="fw-bold mb-2">{card.value}</h2>
                      <span className="kpi-pill">
                        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: card.accent, display: 'inline-block' }}></span>
                        {card.change}
                      </span>
                      <div className="progress mt-3" style={{ height: 6, borderRadius: 999, background: '#eef2ff' }}>
                        <div className="progress-bar" role="progressbar" style={{ width: '72%', background: `linear-gradient(90deg, ${card.accent}, ${card.accent}90)` }}></div>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>

            <Row className="g-4 mb-4">
              <Col xl={4} md={6}>
                <Card className="shadow-sm border-0 h-100 glass-card">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="text-uppercase text-muted mb-0">Orders Summary</h6>
                      <ArrowUpRight size={18} className="text-muted" />
                    </div>
                    <Row className="g-3">
                      {ordersSummary.map(item => (
                        <Col xs={6} key={item.label}>
                          <div className="p-3 rounded" style={{ backgroundColor: '#f6f8ff', borderRadius: 16 }}>
                            <p className="text-muted small mb-1">{item.label}</p>
                            <h5 className="mb-0 fw-semibold">{item.value}</h5>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
              <Col xl={8} md={6}>
                <Card className="shadow-sm border-0 h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="text-uppercase text-muted mb-0">Performance Heatmap</h6>
                      <span className="text-muted small">Teams vs Hours</span>
                    </div>
                    <ReactApexChart options={heatmapOptions as any} series={heatmapSeries} type="heatmap" height={280} />
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Row className="g-4 mb-4">
              <Col lg={6}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body>
                    <h6 className="text-uppercase text-muted mb-3">Campaign Conversion Rate</h6>
                    <ReactApexChart options={campaignTrend.options as any} series={campaignTrend.series} type="line" height={260} />
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={6}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body>
                    <h6 className="text-uppercase text-muted mb-3">Top Performing Teams</h6>
                    <ReactApexChart options={teamPerformance.options as any} series={teamPerformance.series} type="bar" height={260} />
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Row className="g-4 mb-4">
              <Col lg={6}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body>
                    <h6 className="text-uppercase text-muted mb-3">Negative Sentiment Trend</h6>
                    <ReactApexChart options={sentimentTrend.options as any} series={sentimentTrend.series} type="area" height={260} />
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={6}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="text-uppercase text-muted mb-0">Top Performing Campaigns</h6>
                      <Button size="sm" variant="link" className="text-decoration-none">View All</Button>
                    </div>
                    <div className="d-flex flex-column gap-3">
                      {topCampaigns.map(campaign => (
                        <div key={campaign.name} className="campaign-card">
                          <div>
                            <p className="mb-1 fw-semibold">{campaign.name}</p>
                            <small className="text-muted">Conversion {campaign.conversion}%</small>
                            <div className="campaign-progress mt-2">
                              <div style={{ width: `${campaign.conversion}%`, background: campaign.color, height: '100%' }}></div>
                            </div>
                          </div>
                          <div className="campaign-meta" style={{ color: campaign.color, border: `1px solid ${campaign.color}40` }}>
                            {campaign.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Row className="g-4 mb-4">
              <Col lg={6}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="text-uppercase text-muted mb-0">Alerts</h6>
                      <Button variant="outline-secondary" size="sm">View All</Button>
                    </div>
                    <div className="d-flex flex-column gap-3 alerts-stack">
                      {alerts.map(alert => (
                        <div key={alert.type}>
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <p className="fw-semibold mb-1">{alert.type}</p>
                              <small className="text-muted">{alert.description}</small>
                            </div>
                            <Badge bg={alert.severity === 'high' ? 'danger' : alert.severity === 'medium' ? 'warning' : 'secondary'}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={6}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body>
                    <h6 className="text-uppercase text-muted mb-3">Marketing & Updates</h6>
                    <div className="d-flex flex-column gap-3">
                      {marketingHighlights.map(item => (
                        <div key={item.title} className="p-3 rounded bg-light">
                          <p className="fw-semibold mb-1">{item.title}</p>
                          <small className="text-muted d-block mb-2">{item.description}</small>
                          <Button size="sm" variant="outline-primary">{item.cta}</Button>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        </div>
      </div>
    </>
  );
};

export default ManagerDashboard;

