import { useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { Container, Badge, Button } from 'react-bootstrap';
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
  { id: 'agents', label: 'Total Active Agents', value: '126', change: '+4% vs yesterday', icon: <Users size={22} />, accent: '#5e60ce' },
  { id: 'calls', label: 'Today’s Call Volume (In+Out)', value: '3,482', change: '+8% engagement', icon: <Activity size={22} />, accent: '#2ec4b6' },
  { id: 'sla', label: 'Service Level (SLA%)', value: '94.2%', change: 'Target 92%', icon: <ShieldCheck size={22} />, accent: '#ffc107' },
  { id: 'abandon', label: 'Abandon Rate (%) + Queue Wait Time', value: '3.4% / 00:43s', change: 'Abandon / Wait Time', icon: <Clock size={22} />, accent: '#ff6b6b' },
  { id: 'csat', label: 'CSAT', value: '4.6 / 5', change: '+0.2 sentiment', icon: <TrendingUp size={22} />, accent: '#845ef7' },
  { id: 'revenue', label: 'Revenue This Week', value: '$482K', change: '+11% growth', icon: <DollarSign size={22} />, accent: '#20c997' },
];

const ordersSummary = [
  { label: 'Delivered', value: '812' },
  { label: 'Pending', value: '143' },
  { label: 'On Hold', value: '37' },
];

const alerts = [
  { type: 'SLA Risk Alert', description: 'Team Delta trending toward 88% SLA in the last 30 mins', severity: 'high' },
  { type: 'High Idle Time Alert', description: '6 agents idle > 20 mins in Sales - NA', severity: 'medium' },
  { type: 'High Queue Load Alert', description: 'Queue Retail-Support peaked at 65 waiting callers', severity: 'high' },
  { type: 'Underperforming Campaign Alert', description: 'Campaign “Winter Push” below 12% conversion today', severity: 'low' },
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
            padding: 0.6rem 0.75rem;
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
              padding: 0.75rem;
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

          .scaled-dashboard {
            max-width: 1360px;
            margin: 60px auto 30px;
          }

          .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(24, minmax(0, 1fr));
            gap: 8px;
          }

          .grid-span-24 { grid-column: span 24; }
          .grid-span-14 { grid-column: span 14; }
          .grid-span-12 { grid-column: span 12; }
          .grid-span-10 { grid-column: span 10; }
          .grid-span-6 { grid-column: span 6; }
          .grid-span-5 { grid-column: span 5; }

          @media (max-width: 1200px) {
            .dashboard-grid {
              grid-template-columns: repeat(12, minmax(0, 1fr));
            }
            .grid-span-24,
            .grid-span-14,
            .grid-span-12,
            .grid-span-10,
            .grid-span-6,
            .grid-span-5 {
              grid-column: span 12;
            }
          }

          .grid-item {
            background: #fff;
            border-radius: 8px;
            padding: 9px;
            box-shadow: 0 8px 18px rgba(15,23,42,0.05);
            display: flex;
            flex-direction: column;
            min-height: 0;
            border: 1px solid #e5e9f4;
          }

          @media (max-width: 992px) {
            .grid-item {
              padding: 8px;
            }
            .kpi-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 6px;
            }
          }

          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(115px, 1fr));
            gap: 6px;
          }

          .kpi-card {
            border-radius: 7px;
            padding: 7px;
            border: 1px solid #edf0f5;
            background: #fff;
          }

          .kpi-card small {
            font-size: 0.58rem;
          }

          .kpi-card .fw-bold {
            font-size: 0.95rem;
          }

          .kpi-pill {
            font-size: 0.55rem;
            border-radius: 999px;
            background: #eef2ff;
            padding: 2px 6px;
            display: inline-flex;
            align-items: center;
            gap: 3px;
            color: #334155;
          }

          .mini-section {
            margin-bottom: 10px;
          }

          .mini-chart {
            height: 110px;
          }

          .orders-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
            gap: 5px;
          }

          .orders-chip {
            background: #f3f4ff;
            border-radius: 8px;
            padding: 6px 8px;
          }

          .campaign-card {
            border-radius: 9px;
            padding: 8px 10px;
            background: #f8f9ff;
            border: 1px solid rgba(15,23,42,0.05);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
          }

          .campaign-meta {
            background: white;
            border-radius: 8px;
            padding: 5px 7px;
            min-width: 70px;
            text-align: center;
            font-weight: 600;
            font-size: 0.68rem;
          }

          .campaign-progress {
            height: 3px;
            border-radius: 999px;
            background: #e2e8f0;
            margin-top: 4px;
          }

          .alerts-stack > div {
            border-radius: 8px;
            border: 1px solid rgba(15,23,42,0.08);
            padding: 7px 8px;
            background: #fff;
            font-size: 0.75rem;
          }

          .scrollable {
            overflow: visible;
            max-height: none;
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

        <div className="content-wrapper mt-3">
          <div className="scaled-dashboard">
            <Container fluid className="p-0">
              <div className="dashboard-grid">
              <div className="grid-item grid-span-24">
                <small className="text-uppercase text-muted" style={{ fontSize: '0.6rem', letterSpacing: '0.08em' }}>Manager’s Dashboard</small>
                <h5 className="fw-semibold mt-1 mb-1" style={{ fontSize: '1rem' }}>Your business at a glance.</h5>
                <p className="mb-0 text-muted" style={{ fontSize: '0.82rem' }}>
                  Every insight you need to steer the day with confidence.
                </p>
              </div>


              <div className="grid-item grid-span-24" style={{ paddingBottom: 4 }}>
                <div className="kpi-grid">
                  {kpiCards.map(card => (
                    <div key={card.id} className="kpi-card">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span style={{ color: card.accent }}>{card.icon}</span>
                        <ArrowUpRight size={12} className="text-muted" />
                      </div>
                      <small className="text-uppercase text-muted">{card.label}</small>
                      <div className="fw-bold" style={{ fontSize: '1rem' }}>{card.value}</div>
                      <span className="kpi-pill mt-1">
                        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: card.accent, display: 'inline-block' }}></span>
                        {card.change}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid-item grid-span-14">
                <div className="mini-section">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <h6 className="text-uppercase text-muted mb-0" style={{ fontSize: '0.65rem', letterSpacing: '0.06em' }}>Performance Heatmap</h6>
                    <small className="text-muted" style={{ fontSize: '0.65rem' }}>Teams vs Hours</small>
                  </div>
                  <div className="mini-chart">
                    <ReactApexChart options={heatmapOptions as any} series={heatmapSeries} type="heatmap" height={110} />
                  </div>
                </div>
                <div className="mini-section">
                  <h6 className="text-uppercase text-muted mb-2" style={{ fontSize: '0.65rem', letterSpacing: '0.06em' }}>Orders Snapshot</h6>
                  <div className="orders-grid">
                    {ordersSummary.map(item => (
                      <div key={item.label} className="orders-chip">
                        <small className="text-muted">{item.label}</small>
                        <h6 className="mb-0 fw-semibold">{item.value}</h6>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid-item grid-span-5">
                <div className="mini-section">
                  <h6 className="text-uppercase text-muted mb-1" style={{ fontSize: '0.65rem', letterSpacing: '0.06em' }}>Campaign Conversion</h6>
                  <div className="mini-chart">
                    <ReactApexChart options={campaignTrend.options as any} series={campaignTrend.series} type="line" height={110} />
                  </div>
                </div>
                <div className="mini-section">
                  <h6 className="text-uppercase text-muted mb-1" style={{ fontSize: '0.65rem', letterSpacing: '0.06em' }}>Top Teams</h6>
                  <div className="mini-chart">
                    <ReactApexChart options={teamPerformance.options as any} series={teamPerformance.series} type="bar" height={110} />
                  </div>
                </div>
              </div>

              <div className="grid-item grid-span-5">
                <h6 className="text-uppercase text-muted mb-1" style={{ fontSize: '0.65rem', letterSpacing: '0.06em' }}>Sentiment Trend</h6>
                <div className="mini-chart">
                  <ReactApexChart options={sentimentTrend.options as any} series={sentimentTrend.series} type="area" height={110} />
                </div>
              </div>

              <div className="grid-item grid-span-12">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="text-uppercase text-muted mb-0" style={{ fontSize: '0.65rem', letterSpacing: '0.06em' }}>Top Performing Campaigns</h6>
                  <Button size="sm" variant="link" className="text-decoration-none" style={{ fontSize: '0.65rem' }}>View All</Button>
                </div>
                <div className="d-flex flex-column gap-2">
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
              </div>

              <div className="grid-item grid-span-6">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="text-uppercase text-muted mb-0" style={{ fontSize: '0.65rem', letterSpacing: '0.06em' }}>Alerts</h6>
                  <Button variant="outline-secondary" size="sm" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>View All</Button>
                </div>
                <div className="alerts-stack d-flex flex-column gap-2">
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
              </div>

              <div className="grid-item grid-span-6">
                <h6 className="text-uppercase text-muted mb-2" style={{ fontSize: '0.65rem', letterSpacing: '0.06em' }}>Marketing & Updates</h6>
                <div className="d-flex flex-column gap-2">
                  {marketingHighlights.map(item => (
                    <div key={item.title} className="orders-chip">
                      <p className="fw-semibold mb-1">{item.title}</p>
                      <small className="text-muted d-block mb-1">{item.description}</small>
                      <Button size="sm" variant="outline-primary">{item.cta}</Button>
                    </div>
                  ))}
                </div>
              </div>
              </div>
            </Container>
          </div>
        </div>
      </div>
    </>
  );
};

export default ManagerDashboard;

