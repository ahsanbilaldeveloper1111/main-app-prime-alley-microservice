import React, { useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { Container, Badge, Button } from 'react-bootstrap';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
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
  { label: 'Escalations', value: '12' },
];

const alerts = [
  { type: 'SLA Risk Alert', description: 'Team Delta trending toward 88% SLA in the last 30 mins', severity: 'high' },
  { type: 'High Idle Time Alert', description: '6 agents idle > 20 mins in Sales - NA', severity: 'medium' },
  { type: 'High Queue Load Alert', description: 'Queue Retail-Support peaked at 65 waiting callers', severity: 'high' },
  { type: 'Underperforming Campaign Alert', description: 'Campaign “Winter Push” below 12% conversion today', severity: 'low' },
];

const primaryMetricIds = ['agents', 'abandon', 'csat', 'sla'];
const secondaryMetricIds = ['calls', 'revenue'];

const campaignSchedule = [
  {
    time: '10 AM',
    entries: [
      { name: 'Campaign 1', conversion: 80, border: '#6b7280' },
      { name: 'Campaign 2', conversion: 60, border: '#94a3b8' },
      { name: 'Campaign 3', conversion: 52, border: '#cbd5f5' },
      { name: 'Campaign 4', conversion: 49, border: '#cbd5f5' },
      { name: 'Campaign 5', conversion: 45, border: '#d1d5db' },
      { name: 'Campaign 6', conversion: 42, border: '#d1d5db' },
    ],
  },
  {
    time: '1 PM',
    entries: [
      { name: 'Campaign 1', conversion: 72, border: '#6b7280' },
      { name: 'Campaign 2', conversion: 54, border: '#94a3b8' },
      { name: 'Campaign 3', conversion: 58, border: '#cbd5f5' },
      { name: 'Campaign 4', conversion: 50, border: '#cbd5f5' },
      { name: 'Campaign 5', conversion: 46, border: '#d1d5db' },
      { name: 'Campaign 6', conversion: 44, border: '#d1d5db' },
    ],
  },
  {
    time: '4 PM',
    entries: [
      { name: 'Campaign 1', conversion: 66, border: '#6b7280' },
      { name: 'Campaign 2', conversion: 58, border: '#94a3b8' },
      { name: 'Campaign 3', conversion: 62, border: '#cbd5f5' },
      { name: 'Campaign 4', conversion: 57, border: '#cbd5f5' },
      { name: 'Campaign 5', conversion: 53, border: '#d1d5db' },
      { name: 'Campaign 6', conversion: 47, border: '#d1d5db' },
    ],
  },
  {
    time: '6 PM',
    entries: [
      { name: 'Campaign 1', conversion: 63, border: '#6b7280' },
      { name: 'Campaign 2', conversion: 55, border: '#94a3b8' },
      { name: 'Campaign 3', conversion: 59, border: '#cbd5f5' },
      { name: 'Campaign 4', conversion: 53, border: '#cbd5f5' },
      { name: 'Campaign 5', conversion: 52, border: '#d1d5db' },
      { name: 'Campaign 6', conversion: 45, border: '#d1d5db' },
    ],
  },
];

const ManagerDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeScreen, setActiveScreen] = useState('dashboards-manager');

  const campaignTrend = {
    series: [{ name: 'Conversion Rate', data: [14, 16, 15, 17, 19, 22, 21] }],
    options: {
      chart: { type: 'line', toolbar: { show: false }, animations: { enabled: false } },
      stroke: { width: 4, curve: 'smooth', colors: ['#111827'] },
      xaxis: {
        categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        axisBorder: { color: '#e5e7eb' },
        axisTicks: { color: '#e5e7eb' },
        labels: { style: { colors: '#111827', fontSize: '11px' } },
      },
      yaxis: {
        labels: { style: { colors: '#6b7280', fontSize: '11px' } },
        axisBorder: { color: '#e5e7eb' },
        axisTicks: { color: '#e5e7eb' },
      },
      grid: { strokeDashArray: 4, borderColor: '#e5e7eb' },
      colors: ['#111827'],
      markers: { size: 0 },
    },
  };

  const primaryMetrics = kpiCards.filter(card => primaryMetricIds.includes(card.id));
  const secondaryMetrics = kpiCards.filter(card => secondaryMetricIds.includes(card.id));
  const campaignNames = Array.from(
    new Set(campaignSchedule.flatMap(slot => slot.entries.map(entry => entry.name)))
  );

  const severityRank: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const sortedAlerts = [...alerts].sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

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
            gap: 10px;
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
            border-radius: 10px;
            padding: 10px;
            box-shadow: 0 8px 18px rgba(15,23,42,0.05);
            display: flex;
            flex-direction: column;
            min-height: 0;
            border: 1px solid #e5e9f4;
          }

          .overview-shell {
            padding: 0;
            background: transparent;
            border: none;
            box-shadow: none;
          }

          .overview-layout {
            width: 100%;
            display: flex;
            gap: 20px;
            border: 1px solid #e4e7ec;
            border-radius: 14px;
            padding: 18px;
            background: #fff;
          }

          .overview-left {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .metric-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 14px;
          }

          .metric-card {
            border-radius: 10px;
            border: 1px solid #e5e7eb;
            background: #fff;
            padding: 12px;
            min-height: 100px;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .metric-label {
            font-size: 0.6rem;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #667085;
          }

          .metric-value {
            font-size: 1.1rem;
            font-weight: 700;
            color: #0f172a;
          }

          .metric-change {
            font-size: 0.64rem;
            color: #6b7280;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .summary-card {
            grid-column: span 2;
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 12px;
            box-shadow: none;
          }

          .summary-title {
            font-size: 0.62rem;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #475467;
            margin-bottom: 8px;
          }

          .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 6px;
          }

          .summary-tile {
            border-radius: 9px;
            border: 1px dashed #d5d9e2;
            padding: 8px 4px;
            background: #fafbff;
            text-align: center;
          }

          .summary-tile small {
            display: block;
            font-size: 0.54rem;
            text-transform: uppercase;
            color: #6b7280;
          }

          .summary-tile strong {
            font-size: 0.9rem;
            display: block;
            color: #111827;
          }

          .alerts-panel {
            width: 28%;
            min-width: 240px;
            max-width: 320px;
            border-left: 1px solid #e4e7ec;
            padding-left: 14px;
            position: relative;
            display: flex;
            flex-direction: column;
          }

          .alerts-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
          }

          .alerts-title {
            font-size: 0.54rem;
            text-transform: uppercase;
            color: #475467;
            letter-spacing: 0.08em;
          }

          .alerts-panel {
            width: 28%;
            min-width: 240px;
            max-width: 320px;
            border-left: 1px solid #e4e7ec;
            padding-left: 14px;
            position: relative;
            display: flex;
            flex-direction: column;
          }

          .alerts-panel .alerts-scroll {
            flex: 0 0 auto;
            display: flex;
            flex-direction: column;
            gap: 5px;
            padding-right: 6px;
            height: 165px;
            max-height: 165px;
            overflow-y: auto;
            overflow-x: hidden;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: thin;
            scrollbar-color: transparent transparent;
          }

          .alerts-panel .alerts-scroll::-webkit-scrollbar {
            width: 8px;
          }

          .alerts-panel .alerts-scroll::-webkit-scrollbar-track {
            background: transparent;
          }

          .alerts-panel .alerts-scroll::-webkit-scrollbar-thumb {
            background: transparent;
            border-radius: 999px;
            border: 2px solid transparent;
          }

          .alerts-panel:hover .alerts-scroll {
            scrollbar-color: #9ca3c7 transparent;
          }

          .alerts-panel:hover .alerts-scroll::-webkit-scrollbar-thumb {
            background: #d5d9eb;
            border: 2px solid #f8f9ff;
          }

          .alert-item {
            border-radius: 8px;
            border: 1px solid #eceff5;
            padding: 5px 7px;
            background: #fff;
            font-size: 0.64rem;
          }

          .alert-item p {
            font-size: 0.7rem;
            margin-bottom: 1px;
          }

          .alert-item small {
            font-size: 0.6rem;
          }

          .custom-scroll-track,
          .scroll-arrow,
          .scroll-bar-shell,
          .custom-scroll-thumb {
            display: none;
          }

          .panel-title {
            font-size: 0.68rem;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #475569;
            margin-bottom: 12px;
          }

          .schedule-panel {
            border: 1px solid #e4e7ec;
            background: #fff;
          }

          .campaign-table {
            border: 1px solid #d4d8e2;
            border-radius: 10px;
            background: #fff;
            overflow: hidden;
          }

          .campaign-grid {
            width: 100%;
            border-collapse: collapse;
          }

          .campaign-grid th,
          .campaign-grid td {
            border: 1px solid #e5e7eb;
            padding: 8px 10px;
            font-size: 0.78rem;
            font-weight: 600;
            color: #0f172a;
          }

          .campaign-grid th {
            background: #f9fafb;
            text-transform: uppercase;
            font-size: 0.62rem;
            letter-spacing: 0.06em;
            color: #4b5563;
            text-align: left;
          }

          .campaign-grid td:first-child {
            text-transform: capitalize;
          }

          .conversion-chart-panel {
            position: relative;
            border: 1px solid #e4e7ec;
          }

          .filter-chip {
            position: relative;
          }

          .filter-trigger {
            border: 1px solid #f97316;
            background: transparent;
            color: #f97316;
            border-radius: 999px;
            padding: 2px 10px;
            font-size: 0.65rem;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-weight: 600;
          }

          .filter-menu {
            position: absolute;
            right: 0;
            top: calc(100% + 6px);
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 4px;
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 140px;
            opacity: 0;
            visibility: hidden;
            transform: translateY(-4px);
            transition: all 0.15s ease;
            z-index: 2;
          }

          .filter-menu button {
            border: none;
            background: transparent;
            padding: 6px 8px;
            text-align: left;
            font-size: 0.75rem;
            border-radius: 4px;
            color: #111827;
            transition: background 0.15s ease;
          }

          .filter-menu button:hover {
            background: #fef3c7;
            color: #92400e;
          }

          .filter-chip:focus-within .filter-menu,
          .filter-chip:hover .filter-menu {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
          }

          .metric-span-2 {
            grid-column: span 2;
          }

          @media (max-width: 1200px) {
            .metric-grid {
              grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            }

            .metric-span-2 {
              grid-column: span 1;
            }
          }

          @media (max-width: 992px) {
            .overview-layout {
              flex-direction: column;
            }

            .metric-grid {
              grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            }

            .summary-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .alerts-panel {
              width: 100%;
              max-width: 100%;
              border-left: none;
              border-top: 2px solid #981b1b;
              padding-left: 0;
              padding-top: 16px;
            }

            .custom-scroll-track {
              display: none;
            }
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

        <div className="content-wrapper mt-4">
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

                <div className="grid-item grid-span-24 overview-shell">
                  <div className="overview-layout">
                    <div className="overview-left">
                      <div className="metric-grid">
                        {[...primaryMetrics, ...secondaryMetrics].map(card => (
                          <div key={card.id} className="metric-card">
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="metric-label">{card.label}</span>
                              <span style={{ color: card.accent }}>{card.icon}</span>
                            </div>
                            <span className="metric-value">{card.value}</span>
                            <span className="metric-change">
                              <ArrowUpRight size={13} />
                              {card.change}
                            </span>
                          </div>
                        ))}
                        <div className="metric-card summary-card metric-span-2">
                          <p className="summary-title mb-0">Summary</p>
                          <div className="summary-grid mt-2">
                            {ordersSummary.map(item => (
                              <div key={item.label} className="summary-tile">
                                <strong>{item.value}</strong>
                                <small>{item.label}</small>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="alerts-panel">
                      <div className="alerts-head">
                        <p className="alerts-title mb-0">Alerts & Updates</p>
                      </div>
                      <div className="alerts-scroll">
                        {sortedAlerts.map(alert => (
                          <div key={alert.type} className="alert-item">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <p className="fw-semibold mb-1">{alert.type}</p>
                                <small className="text-muted d-block">{alert.description}</small>
                              </div>
                              <Badge bg={alert.severity === 'high' ? 'danger' : alert.severity === 'medium' ? 'warning' : 'secondary'}>
                                {alert.severity.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid-item grid-span-14 schedule-panel">
                  <p className="panel-title mb-0">Campaign cadence</p>
                  <div className="campaign-table">
                    <table className="campaign-grid">
                      <thead>
                        <tr>
                          <th>Timings</th>
                          {campaignSchedule.map(slot => (
                            <th key={slot.time}>{slot.time}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {campaignNames.map(name => (
                          <tr key={name}>
                            <td>{name}</td>
                            {campaignSchedule.map(slot => {
                              const entry = slot.entries.find(item => item.name === name);
                              return <td key={`${name}-${slot.time}`}>{entry ? `${entry.conversion}%` : '—'}</td>;
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid-item grid-span-10 conversion-chart-panel">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="panel-title mb-0">Campaign Conversion Trend</div>
                    <div className="filter-chip">
                      <button type="button" className="filter-trigger">
                        <span>Duration</span>
                        <ChevronDown size={12} />
                      </button>
                      <div className="filter-menu">
                        <button type="button">1st Week</button>
                        <button type="button">Last Week</button>
                        <button type="button">Last Month</button>
                        <button type="button">Previous Month</button>
                      </div>
                    </div>
                  </div>
                  <div style={{ minHeight: 240 }}>
                    <ReactApexChart options={campaignTrend.options as any} series={campaignTrend.series} type="line" height={220} />
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


