import { useState } from 'react';
import Head from 'next/head';
import { Container, Button, Badge } from 'react-bootstrap';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  Bell,
  PhoneCall,
  Target,
  TrendingUp,
  Award,
  Users,
  ClipboardList,
  CheckCircle2,
  Timer,
} from 'lucide-react';
import ExpandableSidebar from '@components/updated-sidebar';
import CompanyLogo2 from '@assets/images/ringedge-logo-black-n-blue.png';

const myDayOverview = [
  { id: 'next-call', label: 'Next Scheduled Calls', value: '3:30 PM', detail: '2 calls queued', icon: <PhoneCall size={16} /> },
  { id: 'follow-ups', label: 'Follow-Ups Due', value: '5', detail: 'Today', icon: <ClipboardList size={16} /> },
  { id: 'overdue', label: 'Overdue Activities', value: '3', detail: 'Past due', icon: <Timer size={16} /> },
  { id: 'new-leads', label: 'New Leads Assigned', value: '4', detail: 'Since morning', icon: <Users size={16} /> },
];

const performanceTiles = [
  { id: 'calls', label: 'My Calls Today', value: '38', change: '+12 vs avg' },
  { id: 'deals', label: 'Deals Won (Today)', value: '3', change: '$18.4K value' },
  { id: 'target', label: 'Target vs Achieved', value: '72%', change: '18% remaining' },
  { id: 'quality', label: 'Quality Score', value: '4.7 / 5', change: '+0.2 vs yesterday' },
];

const pipelineSnapshot = [
  { id: 'prospects', label: 'Prospects', value: 48 },
  { id: 'leads', label: 'Leads', value: 32 },
  { id: 'deals', label: 'Deals', value: 15 },
  { id: 'orders', label: 'Orders', value: 9 },
];

const callOutcomes = [
  { id: 'answered', label: 'Answered', value: 24 },
  { id: 'unanswered', label: 'Unanswered', value: 8 },
  { id: 'successful', label: 'Successful', value: 12 },
  { id: 'unsuccessful', label: 'Unsuccessful', value: 6 },
  { id: 'followup', label: 'Follow-up Scheduled', value: 5 },
  { id: 'escalated', label: 'Escalated', value: 2 },
];

const recognitionAlerts = [
  { id: 'milestone', title: 'Target Milestone Achieved', description: 'You closed 75% of your daily target.' },
  { id: 'feedback', title: '5-Star Feedback', description: 'Customer Sophia C. rated the call 5/5.' },
  { id: 'leaderboard', title: 'Top 3 in Team Leaderboard', description: 'Ranked #2 in today’s conversions.' },
  { id: 'deals', title: 'Deals Closed', description: '$18.4K booked from 3 deals.' },
  { id: 'comments', title: 'Positive Customer Comments', description: '"Great experience—very helpful!"' },
  { id: 'zero-escalations', title: 'Zero Escalations Today', description: 'Keep the momentum going.' },
];

const AgentDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeScreen, setActiveScreen] = useState('dashboards-agent');

  return (
    <>
      <Head>
        <title>Agent Dashboard • RingEdge</title>
      </Head>
      <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#f5f7fb' }}>
        <style>{`
          .content-wrapper {
            flex: 1;
            padding: 0.75rem;
            margin-left: 0;
            transition: margin-left 0.3s ease;
          }

          @media (min-width: 992px) {
            .content-wrapper {
              margin-left: 280px;
              padding: 1.25rem 1.5rem;
            }
          }

          .mobile-toggle-btn {
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 1100;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }

          @media (min-width: 992px) {
            .mobile-toggle-btn {
              display: none;
            }
          }

          .dashboard-shell {
            max-width: 1360px;
            margin: 55px auto 24px;
          }

          .agent-grid {
            display: grid;
            grid-template-columns: repeat(24, minmax(0, 1fr));
            gap: 6px;
          }

          .grid-span-24 { grid-column: span 24; }
          .grid-span-14 { grid-column: span 14; }
          .grid-span-12 { grid-column: span 12; }
          .grid-span-10 { grid-column: span 10; }

          @media (max-width: 1200px) {
            .agent-grid {
              grid-template-columns: repeat(12, minmax(0, 1fr));
            }
            .grid-span-24,
            .grid-span-14,
            .grid-span-12,
            .grid-span-10 { grid-column: span 12; }
          }

          .agent-card {
            background: #fff;
            border-radius: 8px;
            padding: 6px;
            border: 1px solid #e6eaf2;
            box-shadow: 0 4px 10px rgba(15,23,42,0.04);
            min-height: 0;
          }

          .micro-card {
            border-radius: 6px;
            padding: 5px;
            border: 1px solid #eef1f9;
            background: #fdfdff;
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .micro-card small {
            font-size: 0.48rem;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: #64748b;
          }

          .micro-card h5 {
            font-size: 0.76rem;
            margin: 0;
          }

          .stacked-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
            gap: 4px;
          }

          .pipeline-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
            gap: 4px;
          }

          .pipeline-chip {
            background: #eef2ff;
            border-radius: 6px;
            padding: 4px;
            text-align: center;
          }

          .call-outcomes {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(72px, 1fr));
            gap: 4px;
          }

          .call-tile {
            border: 1px solid #e7ebf5;
            border-radius: 6px;
            padding: 4px;
            text-align: center;
            background: #fff;
          }

          .call-tile h6 {
            font-size: 0.7rem;
            margin: 0;
          }

          .recognition-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 4px;
          }

          .recognition-item {
            border-radius: 7px;
            padding: 6px;
            background: #f8faff;
            border: 1px solid #e0e7ff;
          }

          @media (max-width: 992px) {
            .agent-grid {
              grid-template-columns: repeat(6, minmax(0, 1fr));
            }
            .grid-span-24,
            .grid-span-14,
            .grid-span-12,
            .grid-span-10 { grid-column: span 6; }
          }
        `}</style>

        <Button
          variant="primary"
          className="mobile-toggle-btn d-lg-none"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu size={22} />
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
                {sidebarOpen ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
              </Button>
              <a className="navbar-brand fw-bold text-primary mb-0" href="#">
                <img src={CompanyLogo2.src} alt="logo" className="img-fluid" width={130} />
              </a>
            </div>
            <div className="ms-auto d-flex align-items-center gap-3">
              <Button variant="link" className="text-dark position-relative">
                <Bell size={18} />
                <Badge bg="danger" pill className="position-absolute translate-middle" style={{ top: '8px', left: '28px' }}>2</Badge>
              </Button>
              <div className="d-flex align-items-center gap-2">
                <div className="bg-primary bg-opacity-10 rounded-circle p-2">
                  <Users size={18} className="text-primary" />
                </div>
                <div className="d-none d-md-block">
                  <small className="d-block fw-semibold">Agent Ava</small>
                  <small className="text-muted">ava@ringedge.com</small>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div className="content-wrapper mt-3">
          <div className="dashboard-shell">
            <Container fluid className="p-0">
              <div className="agent-grid">
                <div className="agent-card grid-span-24">
                  <small className="text-uppercase text-muted" style={{ fontSize: '0.6rem', letterSpacing: '0.08em' }}>Agent’s Dashboard</small>
                  <h5 className="fw-semibold mt-1 mb-1" style={{ fontSize: '1rem' }}>Welcome back.</h5>
                  <p className="mb-0 text-muted" style={{ fontSize: '0.8rem' }}>
                    Your tasks, targets, and leads are ready to move forward.
                  </p>
                </div>

                <div className="agent-card grid-span-12">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="text-uppercase text-muted mb-0" style={{ fontSize: '0.65rem', letterSpacing: '0.06em' }}>My Day Overview</h6>
                    <Button variant="link" size="sm" className="text-decoration-none p-0">View calendar</Button>
                  </div>
                  <div className="stacked-grid">
                    {myDayOverview.map(item => (
                      <div key={item.id} className="micro-card">
                        <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '0.7rem' }}>
                          {item.icon}
                          <small>{item.label}</small>
                        </div>
                        <h5 className="fw-bold">{item.value}</h5>
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>{item.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="agent-card grid-span-12">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="text-uppercase text-muted mb-0" style={{ fontSize: '0.65rem', letterSpacing: '0.06em' }}>Performance Tiles</h6>
                    <Button variant="outline-primary" size="sm">Daily Report</Button>
                  </div>
                  <div className="stacked-grid">
                    {performanceTiles.map(tile => (
                      <div key={tile.id} className="micro-card">
                        <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '0.68rem' }}>
                          <Target size={14} />
                          <small>{tile.label}</small>
                        </div>
                        <h5 className="fw-bold">{tile.value}</h5>
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>{tile.change}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="agent-card grid-span-12">
                  <h6 className="text-uppercase text-muted mb-2" style={{ fontSize: '0.65rem', letterSpacing: '0.06em' }}>Pipeline Snapshot</h6>
                  <div className="pipeline-grid">
                    {pipelineSnapshot.map(stage => (
                      <div key={stage.id} className="pipeline-chip">
                        <small className="text-muted d-block" style={{ fontSize: '0.65rem' }}>{stage.label}</small>
                        <h5 className="fw-bold mb-0">{stage.value}</h5>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="agent-card grid-span-12">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="text-uppercase text-muted mb-0" style={{ fontSize: '0.65rem', letterSpacing: '0.06em' }}>Call Outcome Summary (Today)</h6>
                    <Button variant="link" size="sm" className="p-0 d-flex align-items-center gap-1">
                      <TrendingUp size={14} />
                      View dispositions
                    </Button>
                  </div>
                  <div className="call-outcomes">
                    {callOutcomes.map(outcome => (
                      <div key={outcome.id} className="call-tile">
                        <small className="text-muted d-block" style={{ fontSize: '0.65rem' }}>{outcome.label}</small>
                        <h6 className="fw-bold">{outcome.value}</h6>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="agent-card grid-span-24">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="text-uppercase text-muted mb-0" style={{ fontSize: '0.65rem', letterSpacing: '0.06em' }}>Recognition Alerts</h6>
                    <Button size="sm" variant="outline-success" className="d-flex align-items-center gap-1">
                      <Award size={14} />
                      Celebrate
                    </Button>
                  </div>
                  <div className="recognition-list">
                    {recognitionAlerts.map(alert => (
                      <div key={alert.id} className="recognition-item">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <CheckCircle2 size={16} className="text-success" />
                          <strong style={{ fontSize: '0.55rem' }}>{alert.title}</strong>
                        </div>
                        <p className="mb-0 text-muted" style={{ fontSize: '0.58rem' }}>{alert.description}</p>
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

export default AgentDashboard;

