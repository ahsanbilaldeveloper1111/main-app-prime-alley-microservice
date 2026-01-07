import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";

import { useState } from 'react';
import { Container, Row, Col, Card, Badge, Dropdown, Form, Table } from 'react-bootstrap';
import { 
  Server, 
  HardDrive, 
  Cpu, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  ChevronDown,
  Database,
  Play,
  AlertCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const ApplicationMonitoring = () => {

      const [autoRefresh, setAutoRefresh] = useState(true);
      const [selectedServer, setSelectedServer] = useState({
        name: 'unifiedops-proxy',
        ip: '10.80.50.245'
      });
      const [selectedEnvironment, setSelectedEnvironment] = useState('Production');
      const [showPackages, setShowPackages] = useState(false);
    
      // Server options
      const servers = [
        { name: 'unifiedops-proxy', ip: '10.80.50.245' },
        { name: 'unifiedops-web-01', ip: '10.80.50.246' },
        { name: 'unifiedops-api-01', ip: '10.80.50.247' },
        { name: 'unifiedops-db-01', ip: '10.80.50.248' },
        { name: 'unifiedops-cache-01', ip: '10.80.50.249' },
      ];
    
      // Environment options
      const environments = ['Production', 'Staging', 'Development', 'Testing', 'UAT'];
    
      // Sample data for charts
      const cpuMemoryData = [
        { time: '00:00', cpu: 8, memory: 75 },
        { time: '00:05', cpu: 12, memory: 78 },
        { time: '00:10', cpu: 7, memory: 82 },
        { time: '00:15', cpu: 10, memory: 85 },
        { time: '00:20', cpu: 9, memory: 87 },
        { time: '00:25', cpu: 11, memory: 88 },
      ];
    
      const cpuSparklineData = [
        { value: 8 }, { value: 9 }, { value: 12 }, { value: 10 }, { value: 8 }, { value: 10 }, { value: 9 }
      ];
    
      const diskSparklineData = [
        { value: 7.5 }, { value: 7.8 }, { value: 7.9 }, { value: 8.1 }, { value: 8.0 }, { value: 7.9 }, { value: 8.0 }
      ];
    
      const systemLoadData = [
        { value: 0.10 }, { value: 0.12 }, { value: 0.14 }, { value: 0.13 }, { value: 0.15 }, { value: 0.14 }, { value: 0.15 }
      ];
    
      const customStyles = `
      .table-responsive .table th:last-child, .table-responsive .table td:last-child {
        min-width: auto !important;
      }
        .btn-light:active,
    .btn-light:focus,
    .btn-light.show,
    .btn-light:not(:disabled):not(.disabled):active {
      background-color: #f1f5f9 !important;
      color: #000 !important;
      box-shadow: none !important;
    }
        .metric-card {
          border: none;
          border-radius: 12px;
          height: 100%;
          transition: all 0.3s ease;
        }
        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .progress-ring {
          transform: rotate(-90deg);
        }
        .progress-ring-circle {
          transition: stroke-dashoffset 0.35s;
          transform-origin: 50% 50%;
        }
        .cpu-card {
          background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
         
        }
        .memory-card {
          background: linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%);
          
        }
        .disk-card {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          
        }
        .system-load-card {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          
        }
        .metric-value {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 0;
          line-height: 1;
        }
        .metric-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.5rem;
        }
        .metric-subtitle {
          font-size: 0.875rem;
          color: #94a3b8;
          margin-top: 0.25rem;
        }
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.75rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .info-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .info-item:last-child {
          border-bottom: none;
        }
        .info-label {
          color: #64748b;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .info-value {
          color: #1e293b;
          font-size: 0.875rem;
          font-weight: 600;
        }
        .service-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem;
          border-radius: 8px;
          background: #f8fafc;
          margin-bottom: 0.5rem;
          transition: background 0.2s ease;
        }
        .service-item:hover {
          background: #f1f5f9;
        }
        .database-card {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 1rem;
          margin-bottom: 1rem;
          transition: all 0.2s ease;
        }
        .database-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .alert-card {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }
        .process-table {
          font-size: 0.875rem;
        }
        .process-table th {
          background: #f8fafc;
          font-weight: 600;
          color: #475569;
          border: none;
          padding: 0.75rem 0.5rem;
        }
        .process-table td {
          padding: 0.75rem 0.5rem;
          vertical-align: middle;
          border-color: #f1f5f9;
        }
        .memory-bar {
          height: 6px;
          background: #e2e8f0;
          border-radius: 3px;
          overflow: hidden;
          margin-left: 0.5rem;
          flex: 1;
          max-width: 100px;
        }
        .memory-bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s ease;
        }
        .port-badge {
          padding: 0.125rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .section-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .header-section {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .failed-service-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.875rem;
          background: #fef2f2;
          border-radius: 8px;
          border-left: 3px solid #ef4444;
          margin-bottom: 0.5rem;
        }
        .sparkline-container {
          height: 40px;
          margin-top: 0.5rem;
        }
      `;
    
  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Application Monitoring" />

      {/* <PageHeader
        title="Application Monitoring"
        showSearch={false}
      /> */}

<>
      <style>{customStyles}</style>
      
        {/* Header */}
        <div className="header-section">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h2 style={{ fontWeight: 700, color: '#1e293b', margin: 0 }}>OS & Application Monitoring</h2>
              <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
                Monitor system and app health across servers
              </p>
            </div>
            <div className="d-flex gap-2 align-items-center">
              <button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2">
                <RefreshCw size={16} />
                Refresh
              </button>
              <div className="d-flex align-items-center gap-2">
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Auto</span>
                <Form.Check 
                  type="switch"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  style={{ fontSize: '1.25rem' }}
                />
              </div>
            </div>
          </div>

         <Row className="g-3">
            <Col md={3}>
              <Dropdown>
                <Dropdown.Toggle variant="light" className="w-100 text-start d-flex align-items-center gap-2" style={{ background: '#f1f5f9' }}>
                  <Server size={16} className="text-primary" />
                  {selectedServer.name} - {selectedServer.ip}
                </Dropdown.Toggle>
                <Dropdown.Menu className="w-100">
                  {servers.map((server, index) => (
                    <Dropdown.Item 
                      key={index}
                      active={selectedServer.name === server.name}
                      onClick={() => setSelectedServer(server)}
                    >
                      <div className="d-flex align-items-center gap-2">
                        {/* <Server size={14} /> */}
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{server.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{server.ip}</div>
                        </div>
                      </div>
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </Col>
            <Col md={2}>
              <Dropdown>
                <Dropdown.Toggle variant="light" className="w-100 text-start d-flex align-items-center gap-2" style={{ background: '#f1f5f9' }}>
                  <Database size={16} className="text-primary" />
                  {selectedEnvironment}
                </Dropdown.Toggle>
                <Dropdown.Menu className="w-100">
                  {environments.map((env, index) => (
                    <Dropdown.Item 
                      key={index}
                      active={selectedEnvironment === env}
                      onClick={() => setSelectedEnvironment(env)}
                    >
                      <div className="d-flex align-items-center gap-2">
                        {/* <Database size={14} /> */}
                        <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{env}</span>
                      </div>
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </Col>
            {/* <Col md={4}>
              <Dropdown>
                <Dropdown.Toggle variant="light" className="w-100 text-start" style={{ background: '#f1f5f9' }}>
                  🕐 Last 24h
                </Dropdown.Toggle>
              </Dropdown>
            </Col> */}
          </Row>

          <Row className="mt-3 g-3">
            <Col md={3}>
              <div className="info-item">
                <Server size={16} className="text-primary" />
                <div className="flex-grow-1">
                  <div className="info-label">Hostname</div>
                  <div className="info-value">prod-server-01.domain.local</div>
                </div>
              </div>
            </Col>
            <Col md={3}>
              <div className="info-item">
                <HardDrive size={16} className="text-success" />
                <div className="flex-grow-1">
                  <div className="info-label">OS</div>
                  <div className="info-value">Ubuntu 22.04.3 LTS x86_64</div>
                </div>
              </div>
            </Col>
            <Col md={3}>
              <div className="info-item">
                <Cpu size={16} className="text-warning" />
                <div className="flex-grow-1">
                  <div className="info-label">Kernel</div>
                  <div className="info-value">Linux 5.15.0-89-generic</div>
                </div>
              </div>
            </Col>
            <Col md={3}>
              <div className="info-item">
                <Activity size={16} className="text-info" />
                <div className="flex-grow-1">
                  <div className="info-label">Uptime</div>
                  <div className="info-value">15 days, 7h 32m</div>
                </div>
              </div>
            </Col>
          </Row>
        </div>

        {/* Metrics Cards */}
        <Row className="g-3 mb-4">
          <Col lg={3} md={6}>
            <Card className="metric-card cpu-card">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <div className="metric-label">CPU USAGE</div>
                    <h1 className="metric-value" style={{ color: '#4c6ef5' }}>10<span style={{ fontSize: '1.5rem' }}>%</span></h1>
                    <div className="metric-subtitle">4 Cores @ 2.5GHz</div>
                  </div>
                  <svg width="60" height="60">
                    <circle cx="30" cy="30" r="25" fill="none" stroke="#e0e7ff" strokeWidth="5"/>
                    <circle 
                      cx="30" cy="30" r="25" 
                      fill="none" 
                      stroke="#4c6ef5" 
                      strokeWidth="5"
                      strokeDasharray={`${10 * 1.57} ${100 * 1.57}`}
                      className="progress-ring-circle"
                      style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                    />
                  </svg>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-1" style={{ color: '#4c6ef5', fontSize: '0.875rem' }}>
                    <Activity size={14} />
                    <span>Avg Load: 0.15</span>
                  </div>
                  <Badge bg="success" style={{ fontSize: '0.7rem' }}>Normal</Badge>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6}>
            <Card className="metric-card memory-card">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <div className="metric-label">MEMORY USAGE</div>
                    <h1 className="metric-value" style={{ color: '#f03e3e' }}>88<span style={{ fontSize: '1.5rem' }}>%</span></h1>
                    <div className="metric-subtitle">14.1 / 16.0 GB</div>
                  </div>
                  <svg width="60" height="60">
                    <circle cx="30" cy="30" r="25" fill="none" stroke="#ffe8e8" strokeWidth="5"/>
                    <circle 
                      cx="30" cy="30" r="25" 
                      fill="none" 
                      stroke="#f03e3e" 
                      strokeWidth="5"
                      strokeDasharray={`${88 * 1.57} ${100 * 1.57}`}
                      className="progress-ring-circle"
                      style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                    />
                  </svg>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-1">
                    <AlertTriangle size={14} style={{ color: '#f03e3e' }} />
                    <span style={{ color: '#f03e3e', fontSize: '0.875rem', fontWeight: 600 }}>High Usage</span>
                  </div>
                  <Badge bg="warning" style={{ fontSize: '0.7rem' }}>Warning</Badge>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6}>
            <Card className="metric-card disk-card">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <div className="metric-label">DISK USAGE</div>
                    <h1 className="metric-value" style={{ color: '#3b82f6' }}>45<span style={{ fontSize: '1.5rem' }}>%</span></h1>
                    <div className="metric-subtitle">225 / 500 GB</div>
                  </div>
                  <svg width="60" height="60">
                    <circle cx="30" cy="30" r="25" fill="none" stroke="#e0f2fe" strokeWidth="5"/>
                    <circle 
                      cx="30" cy="30" r="25" 
                      fill="none" 
                      stroke="#3b82f6" 
                      strokeWidth="5"
                      strokeDasharray={`${45 * 1.57} ${100 * 1.57}`}
                      className="progress-ring-circle"
                      style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                    />
                  </svg>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-1" style={{ color: '#3b82f6', fontSize: '0.875rem' }}>
                    <HardDrive size={14} />
                    <span>I/O: 125 MB/s</span>
                  </div>
                  <Badge bg="success" style={{ fontSize: '0.7rem' }}>Healthy</Badge>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6}>
            <Card className="metric-card system-load-card">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <div className="metric-label">NETWORK I/O</div>
                    <h1 className="metric-value" style={{ color: '#22c55e' }}>23<span style={{ fontSize: '1.5rem' }}>%</span></h1>
                    <div className="metric-subtitle">↓ 45 Mbps ↑ 12 Mbps</div>
                  </div>
                  <svg width="60" height="60">
                    <circle cx="30" cy="30" r="25" fill="none" stroke="#dcfce7" strokeWidth="5"/>
                    <circle 
                      cx="30" cy="30" r="25" 
                      fill="none" 
                      stroke="#22c55e" 
                      strokeWidth="5"
                      strokeDasharray={`${23 * 1.57} ${100 * 1.57}`}
                      className="progress-ring-circle"
                      style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                    />
                  </svg>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-1" style={{ color: '#22c55e', fontSize: '0.875rem' }}>
                    <Activity size={14} />
                    <span>Bandwidth Used</span>
                  </div>
                  <Badge bg="success" style={{ fontSize: '0.7rem' }}>Active</Badge>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="g-3">
          {/* Left Column */}
          <Col lg={6}>
            {/* Services Status */}
            <Card className="mb-3" style={{ border: 'none', borderRadius: '12px' }}>
              <Card.Body>
                <div className="section-title">
                  <Activity className="text-primary" size={20} />
                  Services Status
                </div>
                
                <div className="service-item">
                  <div className="d-flex align-items-center gap-2">
                    <CheckCircle size={18} className="text-success" />
                    <span style={{ fontWeight: 600 }}>UnifiedOps-API</span>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <Badge bg="success" className="status-badge">Running</Badge>
                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>55 ms</span>
                    <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Latency</span>
                  </div>
                </div>

                <div className="service-item">
                  <div className="d-flex align-items-center gap-2">
                    <CheckCircle size={18} className="text-success" />
                    <span style={{ fontWeight: 600 }}>UnifiedOps-Web</span>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <Badge bg="success" className="status-badge">Running</Badge>
                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>7h 5m</span>
                    <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Latency</span>
                  </div>
                </div>

                <div className="service-item">
                  <div className="d-flex align-items-center gap-2">
                    <CheckCircle size={18} className="text-success" />
                    <span style={{ fontWeight: 600 }}>mssql-server</span>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <Badge bg="success" className="status-badge">Running</Badge>
                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>45 ms</span>
                    <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Latency</span>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* SQL Server Databases */}
            <Card className="mb-3" style={{ border: 'none', borderRadius: '12px' }}>
              <Card.Body>
                <div className="section-title">
                  <Database className="text-primary" size={20} />
                  SQL Server Databases
                </div>

                <div className="database-card">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div style={{ width: 32, height: 32, background: '#4c6ef5', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600 }}>
                        A
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>AppDB</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>0 Tables</div>
                      </div>
                    </div>
                    <Badge bg="success" className="status-badge">
                      <CheckCircle size={14} />
                      Healthy
                    </Badge>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                    Storage: 0 GB / 13.4 GB. 0% used
                  </div>
                </div>

                <div className="database-card">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div style={{ width: 32, height: 32, background: '#3b82f6', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600 }}>
                        C
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>CiscoDB</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>1 Table</div>
                      </div>
                    </div>
                    <Badge bg="success" className="status-badge">
                      <CheckCircle size={14} />
                      Healthy
                    </Badge>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                    Storage: 0.1 / 1 GB 1% used
                  </div>
                </div>

                <div className="database-card" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div style={{ width: 32, height: 32, background: '#f59e0b', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600 }}>
                        ⚠
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>TransactionLog</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>High growth rate</div>
                      </div>
                    </div>
                    <Badge bg="warning" className="status-badge">
                      <AlertTriangle size={14} />
                      Warning
                    </Badge>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                    Storage: 2.8 / 5 GB • 56% used
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Filesystems */}
            <Card className="mb-3" style={{ border: 'none', borderRadius: '12px' }}>
              <Card.Body>
                <div className="section-title">
                  <HardDrive className="text-primary" size={20} />
                  Filesystems
                </div>

                <Row className="g-3">
                  <Col md={4}>
                    <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <HardDrive size={18} className="text-primary" />
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>/dev/sda1</span>
                      </div>
                      <Badge bg="success" className="status-badge mb-2">
                        <CheckCircle size={12} />
                        Mounted
                      </Badge>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Root: 225 / 500 GB • 45% used
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                        Type: ext4
                      </div>
                    </div>
                  </Col>

                  <Col md={4}>
                    <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <HardDrive size={18} className="text-success" />
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>/dev/sdb1</span>
                      </div>
                      <Badge bg="success" className="status-badge mb-2">
                        <CheckCircle size={12} />
                        Mounted
                      </Badge>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Data: 820 / 2000 GB • 41% used
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                        Type: ext4
                      </div>
                    </div>
                  </Col>

                  <Col md={4}>
                    <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <HardDrive size={18} className="text-info" />
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>/dev/sdc1</span>
                      </div>
                      <Badge bg="success" className="status-badge mb-2">
                        <CheckCircle size={12} />
                        Mounted
                      </Badge>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Backup: 145 / 1000 GB • 14% used
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                        Type: xfs
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Listening Ports */}
            <Card className="mb-3" style={{ border: 'none', borderRadius: '12px' }}>
              <Card.Body>
                <div className="section-title">
                  <Activity className="text-primary" size={20} />
                  Listening Ports
                  <Badge bg="secondary" style={{ fontSize: '0.75rem' }}>32</Badge>
                </div>

                <Table className="process-table" hover>
                  <thead>
                    <tr>
                      <th>Protocol</th>
                      <th>Port</th>
                      <th>State</th>
                      <th>Process</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>TCP</td>
                      <td>3308 3306</td>
                      <td><Badge bg="info" className="port-badge">Open</Badge></td>
                      <td>mysql</td>
                    </tr>
                    <tr>
                      <td>TCP</td>
                      <td>1453 <Badge bg="danger" className="port-badge ms-2">Risky</Badge></td>
                      <td><Badge bg="info" className="port-badge">Open</Badge></td>
                      <td>node</td>
                    </tr>
                    <tr>
                      <td>22</td>
                      <td>22 <Badge bg="danger" className="port-badge ms-2">Risky</Badge></td>
                      <td><Badge bg="info" className="port-badge">Open</Badge></td>
                      <td>sshd</td>
                    </tr>
                    <tr>
                      <td>123</td>
                      <td>123 <Badge bg="danger" className="port-badge ms-2">Risky</Badge></td>
                      <td><Badge bg="info" className="port-badge">Open</Badge></td>
                      <td>2023.6</td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>

            {/* Failed Services */}
            <Card className="mb-3" style={{ border: 'none', borderRadius: '12px' }}>
              <Card.Body>
                <div className="section-title">
                  <XCircle className="text-danger" size={20} />
                  Failed Services
                  <Badge bg="danger" style={{ fontSize: '0.75rem', marginLeft: '0.5rem' }}>2</Badge>
                </div>

                <div className="failed-service-item">
                  <div className="d-flex align-items-center gap-2">
                    <XCircle size={18} className="text-danger" />
                    <div>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>auditd.rules</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Failed to load.</div>
                    </div>
                  </div>
                  <button className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1">
                    <RefreshCw size={14} />
                    Restart
                  </button>
                </div>

                <div className="failed-service-item">
                  <div className="d-flex align-items-center gap-2">
                    <XCircle size={18} className="text-danger" />
                    <div>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>dnfas-makecache</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Failed to sync cache.</div>
                    </div>
                  </div>
                  <Badge bg="danger" className="status-badge">Critical</Badge>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Right Column */}
          <Col lg={6}>
            {/* Alert */}
            <div className="alert-card">
              <div className="d-flex align-items-start gap-2">
                <AlertTriangle size={20} className="text-warning mt-1" />
                <div>
                  <div style={{ fontWeight: 600, color: '#92400e', marginBottom: '0.25rem' }}>
                    High memory usage detected.
                  </div>
                </div>
              </div>
            </div>

            {/* CPU & Memory Chart */}
            <Card className="mb-3" style={{ border: 'none', borderRadius: '12px' }}>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="d-flex align-items-center gap-2">
                      <div style={{ width: 12, height: 3, background: '#3b82f6', borderRadius: '2px' }}></div>
                      <span style={{ fontSize: '0.875rem', color: '#64748b' }}>CPU Usage</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <div style={{ width: 12, height: 3, background: '#f43f5e', borderRadius: '2px' }}></div>
                      <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Memory Usage</span>
                    </div>
                  </div>
                  <Badge bg="success" className="status-badge">Running</Badge>
                </div>

                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={cpuMemoryData}>
                    <defs>
                      <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '0.75rem' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '0.75rem' }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" />
                    <Area type="monotone" dataKey="memory" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorMemory)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>

            {/* Top Processes */}
            <Card className="mb-3" style={{ border: 'none', borderRadius: '12px' }}>
              <Card.Body>
                <div className="section-title">
                  <Cpu className="text-primary" size={20} />
                  Top Processes by CPU
                  <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 400, marginLeft: 'auto' }}>Real-time</span>
                </div>

                <Table className="process-table" hover responsive>
                  <thead>
                    <tr>
                      <th>Process Name</th>
                      <th>PID</th>
                      <th>CPU %</th>
                      <th>Memory</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Server size={14} className="text-primary" />
                          <span style={{ fontWeight: 500 }}>node (UnifiedOps-API)</span>
                        </div>
                      </td>
                      <td>1842</td>
                      <td><span style={{ fontWeight: 600, color: '#f59e0b' }}>8.2%</span></td>
                      <td>
                        <div className="d-flex align-items-center">
                          <span style={{ fontSize: '0.875rem', minWidth: '60px' }}>2.1 GB</span>
                          <div className="memory-bar">
                            <div className="memory-bar-fill" style={{ width: '13%', background: '#3b82f6' }}></div>
                          </div>
                          <span className="ms-2" style={{ fontSize: '0.875rem', color: '#64748b' }}>13%</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Database size={14} className="text-success" />
                          <span style={{ fontWeight: 500 }}>sqlservr</span>
                        </div>
                      </td>
                      <td>1256</td>
                      <td><span style={{ fontWeight: 600, color: '#f59e0b' }}>5.8%</span></td>
                      <td>
                        <div className="d-flex align-items-center">
                          <span style={{ fontSize: '0.875rem', minWidth: '60px' }}>4.8 GB</span>
                          <div className="memory-bar">
                            <div className="memory-bar-fill" style={{ width: '30%', background: '#f59e0b' }}></div>
                          </div>
                          <span className="ms-2" style={{ fontSize: '0.875rem', color: '#64748b' }}>30%</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Activity size={14} className="text-info" />
                          <span style={{ fontWeight: 500 }}>node (UnifiedOps-Web)</span>
                        </div>
                      </td>
                      <td>2145</td>
                      <td><span style={{ fontWeight: 600, color: '#3b82f6' }}>3.5%</span></td>
                      <td>
                        <div className="d-flex align-items-center">
                          <span style={{ fontSize: '0.875rem', minWidth: '60px' }}>1.8 GB</span>
                          <div className="memory-bar">
                            <div className="memory-bar-fill" style={{ width: '11%', background: '#3b82f6' }}></div>
                          </div>
                          <span className="ms-2" style={{ fontSize: '0.875rem', color: '#64748b' }}>11%</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Activity size={14} className="text-secondary" />
                          <span style={{ fontWeight: 500 }}>dockerd</span>
                        </div>
                      </td>
                      <td>892</td>
                      <td><span style={{ fontWeight: 600, color: '#3b82f6' }}>2.1%</span></td>
                      <td>
                        <div className="d-flex align-items-center">
                          <span style={{ fontSize: '0.875rem', minWidth: '60px' }}>856 MB</span>
                          <div className="memory-bar">
                            <div className="memory-bar-fill" style={{ width: '5%', background: '#22c55e' }}></div>
                          </div>
                          <span className="ms-2" style={{ fontSize: '0.875rem', color: '#64748b' }}>5%</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Server size={14} className="text-warning" />
                          <span style={{ fontWeight: 500 }}>nginx</span>
                        </div>
                      </td>
                      <td>1034</td>
                      <td><span style={{ fontWeight: 600, color: '#22c55e' }}>1.2%</span></td>
                      <td>
                        <div className="d-flex align-items-center">
                          <span style={{ fontSize: '0.875rem', minWidth: '60px' }}>245 MB</span>
                          <div className="memory-bar">
                            <div className="memory-bar-fill" style={{ width: '2%', background: '#22c55e' }}></div>
                          </div>
                          <span className="ms-2" style={{ fontSize: '0.875rem', color: '#64748b' }}>2%</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>

            {/* Python Environment */}
            <Card className="mb-3" style={{ border: 'none', borderRadius: '12px' }}>
              <Card.Body>
                <div className="section-title">
                  <Activity className="text-primary" size={20} />
                  Python Environment
                </div>

                <div style={{ display: 'grid', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ 
                      fontSize: '0.875rem', 
                      color: '#6b7280', 
                      fontWeight: '600',
                      minWidth: '180px'
                    }}>
                      Version:
                    </span>
                    <span style={{ fontSize: '0.875rem', color: '#111827' }}>
                      3.10.12 (main, Jun 21 16:53) [GCC 14.2.1 20240110 (Red Hat 14.2.1-7)]
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ 
                      fontSize: '0.875rem', 
                      color: '#6b7280', 
                      fontWeight: '600',
                      minWidth: '180px'
                    }}>
                      Executable:
                    </span>
                    <span style={{ fontSize: '0.875rem', color: '#111827' }}>
                      /usr/bin/python3.10
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ 
                      fontSize: '0.875rem', 
                      color: '#6b7280', 
                      fontWeight: '600',
                      minWidth: '180px'
                    }}>
                      Virtual Environment:
                    </span>
                    <span style={{ fontSize: '0.875rem', color: '#ef4444', fontWeight: '500' }}>
                      Not Active
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ 
                      fontSize: '0.875rem', 
                      color: '#6b7280', 
                      fontWeight: '600',
                      minWidth: '180px'
                    }}>
                      Packages:
                    </span>
                    <span style={{ fontSize: '0.875rem', color: '#111827' }}>
                      5 installed
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => setShowPackages(!showPackages)}
                  className="btn btn-sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  <Database size={18} />
                  {showPackages ? 'Hide Packages' : 'View Packages'}
                </button>

                {showPackages && (
                  <Table className="process-table mt-3" hover responsive>
                    <thead>
                      <tr>
                        <th>Package</th>
                        <th>Version</th>
                        <th>Location</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 500 }}>django</td>
                        <td>4.2.7</td>
                        <td style={{ fontSize: '0.75rem', color: '#64748b' }}>/usr/lib/python3.10</td>
                        <td><Badge bg="success" style={{ fontSize: '0.75rem' }}>Up to date</Badge></td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 500 }}>requests</td>
                        <td>2.31.0</td>
                        <td style={{ fontSize: '0.75rem', color: '#64748b' }}>/usr/lib/python3.10</td>
                        <td><Badge bg="success" style={{ fontSize: '0.75rem' }}>Up to date</Badge></td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 500 }}>numpy</td>
                        <td>1.24.3</td>
                        <td style={{ fontSize: '0.75rem', color: '#64748b' }}>/usr/lib/python3.10</td>
                        <td><Badge bg="warning" style={{ fontSize: '0.75rem' }}>Update available</Badge></td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 500 }}>pandas</td>
                        <td>2.0.3</td>
                        <td style={{ fontSize: '0.75rem', color: '#64748b' }}>/usr/lib/python3.10</td>
                        <td><Badge bg="success" style={{ fontSize: '0.75rem' }}>Up to date</Badge></td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 500 }}>sqlalchemy</td>
                        <td>2.0.21</td>
                        <td style={{ fontSize: '0.75rem', color: '#64748b' }}>/usr/lib/python3.10</td>
                        <td><Badge bg="success" style={{ fontSize: '0.75rem' }}>Up to date</Badge></td>
                      </tr>
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>

            {/* Scheduled Tasks (Cron Jobs) */}
            <Card className="mb-3" style={{ border: 'none', borderRadius: '12px' }}>
              <Card.Body>
                <div className="section-title">
                  <Clock className="text-primary" size={20} />
                  Scheduled Tasks (Cron Jobs)
                  <Badge bg="secondary" style={{ fontSize: '0.75rem', marginLeft: '0.5rem' }}>5 Active</Badge>
                </div>

                <Table className="process-table" hover responsive>
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Schedule</th>
                      <th>Last Run</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Database size={14} className="text-primary" />
                          <div>
                            <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>Database Backup</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>/scripts/backup-db.sh</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.75rem', color: '#475569', fontFamily: 'monospace' }}>0 2 * * *</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Daily 2AM</div>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#64748b' }}>2h ago</td>
                      <td><Badge bg="success" style={{ fontSize: '0.75rem' }}>Success</Badge></td>
                      <td>
                        <button className="btn btn-link btn-sm p-0" style={{ fontSize: '0.75rem' }}>View Log</button>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <RefreshCw size={14} className="text-success" />
                          <div>
                            <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>Log Rotation</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>/usr/sbin/logrotate</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.75rem', color: '#475569', fontFamily: 'monospace' }}>0 0 * * *</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Daily midnight</div>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#64748b' }}>7h ago</td>
                      <td><Badge bg="success" style={{ fontSize: '0.75rem' }}>Success</Badge></td>
                      <td>
                        <button className="btn btn-link btn-sm p-0" style={{ fontSize: '0.75rem' }}>View Log</button>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Activity size={14} className="text-info" />
                          <div>
                            <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>Cache Clear</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>/scripts/clear-cache.sh</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.75rem', color: '#475569', fontFamily: 'monospace' }}>*/30 * * * *</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Every 30min</div>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#64748b' }}>12m ago</td>
                      <td><Badge bg="success" style={{ fontSize: '0.75rem' }}>Success</Badge></td>
                      <td>
                        <button className="btn btn-link btn-sm p-0" style={{ fontSize: '0.75rem' }}>View Log</button>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Server size={14} className="text-warning" />
                          <div>
                            <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>System Updates</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>/usr/bin/apt-get update</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.75rem', color: '#475569', fontFamily: 'monospace' }}>0 3 * * 0</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Sun 3AM</div>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#f59e0b' }}>Running (2m)</td>
                      <td><Badge bg="warning" style={{ fontSize: '0.75rem' }}>Running</Badge></td>
                      <td>
                        <button className="btn btn-link btn-sm p-0" style={{ fontSize: '0.75rem' }}>Monitor</button>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <AlertCircle size={14} className="text-danger" />
                          <div>
                            <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>Report Generation</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>/scripts/generate-report.py</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.75rem', color: '#475569', fontFamily: 'monospace' }}>0 8 * * 1</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Mon 8AM</div>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#dc3545' }}>1d ago (failed)</td>
                      <td><Badge bg="danger" style={{ fontSize: '0.75rem' }}>Failed</Badge></td>
                      <td>
                        <button className="btn btn-sm btn-outline-danger" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}>
                          Retry
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      
    </>

    </React.Fragment>
  );
};

ApplicationMonitoring.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ApplicationMonitoring;
