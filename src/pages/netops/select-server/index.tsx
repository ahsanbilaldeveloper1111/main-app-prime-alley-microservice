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

import  { useState } from 'react';
import { 
  Search, 
  Server, 
  Globe, 
  Layout as LayoutIcon, 
  Database, 
  Star,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
  LayoutGrid,
  List,
  Cpu,
  HardDrive,
  Activity
} from 'lucide-react';

const SelectServer = () => {
      const [viewMode, setViewMode] = useState('cards');
      const [selectedGroup, setSelectedGroup] = useState('all');
      const [selectedEnvironment, setSelectedEnvironment] = useState('All Environments');
      const [selectedRegion, setSelectedRegion] = useState('All Regions');
      const [showEnvDropdown, setShowEnvDropdown] = useState(false);
      const [showRegionDropdown, setShowRegionDropdown] = useState(false);
    
      // Environment options
      const environments = ['All Environments', 'Production', 'Staging', 'Development', 'Testing', 'UAT'];
    
      // Region options
      const regions = ['All Regions', 'US East', 'US West', 'Europe', 'Asia Pacific', 'South America'];
    
      const servers = [
        {
          name: 'unifiedops-proxy',
          ip: '10.80.50.245',
          environment: 'Production',
          cpu: 24,
          memory: 2.3,
          disk: 6.9,
          status: 'Healthy',
          statusColor: 'success',
          trend: 'up'
        },
        {
          name: 'app-server-1',
          ip: '10.80.03.64',
          environment: 'Production',
          cpu: 75,
          memory: 6.8,
          disk: 3.9,
          status: 'Healthy',
          statusColor: 'success',
          trend: 'up'
        },
        {
          name: 'db-primary-global',
          ip: '10.18.00.261',
          environment: 'Production',
          cpu: 26,
          memory: 3.9,
          disk: 3.9,
          status: 'Healthy',
          statusColor: 'success',
          trend: 'up'
        },
        {
          name: 'web-backend-02',
          ip: '10.185.196.472',
          environment: 'Production',
          cpu: 75,
          memory: 6.9,
          disk: 1.2,
          status: 'Active',
          statusColor: 'success',
          trend: 'up'
        },
        {
          name: 'mq-central-1',
          ip: '10.156.123.53',
          environment: 'Warning',
          cpu: 16,
          memory: 6.1,
          disk: 2.81,
          status: 'Warning',
          statusColor: 'warning',
          trend: 'up'
        },
        {
          name: 'db-replica-east',
          ip: '10.105.2.1174',
          environment: 'Critical',
          cpu: 42,
          memory: 20.5,
          disk: 3.9,
          status: 'Critical',
          statusColor: 'danger',
          trend: 'down'
        },
        {
          name: 'bastion-host',
          ip: '10.123.140.199',
          environment: 'Development',
          cpu: 3.4,
          memory: 2.3,
          disk: 4.4,
          status: 'Active',
          statusColor: 'success',
          trend: 'stable'
        },
        {
          name: 'api-gateway-03',
          ip: '10.160.160.95',
          environment: 'Critical',
          cpu: 35,
          memory: 3.6,
          disk: 2.9,
          status: 'Critical',
          statusColor: 'danger',
          trend: 'down'
        },
        {
          name: 'staging-web-01',
          ip: '10.25.159.220',
          environment: 'Staging',
          cpu: 28,
          memory: 2.9,
          disk: 2.9,
          status: 'Healthy',
          statusColor: 'success',
          trend: 'stable'
        },
        {
          name: 'rest-ipr-01',
          ip: '10.813.162.05',
          environment: 'Healthy',
          cpu: 12,
          memory: 3.2,
          disk: 1.8,
          status: 'Active',
          statusColor: 'success',
          trend: 'up'
        },
        {
          name: 'analytics-01',
          ip: '10.148.210.02',
          environment: 'Production',
          cpu: 45,
          memory: 5.4,
          disk: 2.1,
          status: 'Healthy',
          statusColor: 'success',
          trend: 'up'
        },
        {
          name: 'redis-prod-01',
          ip: '10.152.199.66',
          environment: 'Critical',
          cpu: 82,
          memory: 15.2,
          disk: 8.5,
          status: 'Critical',
          statusColor: 'danger',
          trend: 'down'
        }
      ];
    
      const alerts = [
        { name: 'app-server-2', ip: '10.234.88.54', status: 'Warning', color: 'warning' },
        { name: 'db-replica-east', ip: '10.100.21.11:74', status: 'Warning', color: 'warning' },
        { name: 'mq-central-1', ip: '10.106.122.28', status: 'Warning', color: 'warning' },
        { name: 'redis-prod-01', ip: '10.189.199.08', status: 'Critical', color: 'danger' },
        { name: 'api-gateway-03', ip: '10.148.10.0.9.90', status: 'Critical', color: 'danger' }
      ];
    
      const getStatusIcon = (status: string) => {
        switch (status) {
          case 'Healthy':
          case 'Active':
            return <CheckCircle size={16} />;
          case 'Warning':
            return <AlertTriangle size={16} />;
          case 'Critical':
            return <XCircle size={16} />;
          default:
            return <AlertCircle size={16} />;
        }
      };
    
      const getEnvironmentColor = (env: string) => {
        const colors = {
          'Production': '#28a745',
          'Warning': '#ffc107',
          'Critical': '#dc3545',
          'Development': '#17a2b8',
          'Staging': '#ffc107',
          'Healthy': '#28a745'
        };
        return colors[env as keyof typeof colors] || '#6c757d';
      };
    

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Select Server" />

      {/* <PageHeader
        title="Select Server"
        showSearch={false}
      /> */}


      <style>{`
        * {
          box-sizing: border-box;
        }
        
        .container-fluid {
          width: 100%;
          max-width: 1600px;
          margin: 0 auto;
        }

        .btn {
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid;
          background: white;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #4da6ff;
          color: white;
          border-color: #4da6ff;
        }

        .btn-primary:hover {
          background: #3d96ef;
          border-color: #3d96ef;
        }

        .btn-outline {
          background: white;
          color: #6c757d;
          border-color: #dee2e6;
        }

        .btn-outline:hover {
          background: #f8f9fa;
          border-color: #adb5bd;
        }

        .btn-link {
          background: transparent;
          border: none;
          color: #4da6ff;
          padding: 4px 8px;
          text-decoration: none;
        }

        .btn-link:hover {
          text-decoration: underline;
        }

        .form-control {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
        }

        .form-control:focus {
          outline: none;
          border-color: #4da6ff;
          box-shadow: 0 0 0 3px rgba(77, 166, 255, 0.1);
        }

        .badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .badge-success {
          background: #28a745;
          color: white;
        }

        .badge-warning {
          background: #ffc107;
          color: #212529;
        }

        .badge-danger {
          background: #dc3545;
          color: white;
        }

        .badge-info {
          background: #17a2b8;
          color: white;
        }

        .badge-secondary {
          background: #6c757d;
          color: white;
        }

        .progress-container {
          background: #e9ecef;
          border-radius: 6px;
          height: 6px;
          overflow: hidden;
          margin-top: 6px;
        }

        .progress-bar {
          height: 100%;
          border-radius: 6px;
          transition: width 0.3s ease;
        }

        .metric-item {
          margin-bottom: 12px;
        }

        .metric-item:last-child {
          margin-bottom: 0;
        }

        .metric-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #495057;
          margin-bottom: 4px;
        }

        .metric-value {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          font-weight: 600;
        }

        .card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          transition: all 0.2s;
        }

        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }

        .list-item {
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .list-item:hover {
          background: #f8f9fa;
        }

        .list-item.active {
          background: #e7f3ff;
          color: #4da6ff;
        }

        .switch {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 24px;
        }

        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
          border-radius: 24px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }

        input:checked + .slider {
          background-color: #4da6ff;
        }

        input:checked + .slider:before {
          transform: translateX(24px);
        }

        .dropdown {
          position: relative;
          display: inline-block;
          min-width: 200px;
        }

        .dropdown-toggle {
          width: 100%;
          text-align: left;
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: space-between;
          background: #f1f5f9;
          padding: 10px 14px;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .dropdown-toggle:hover {
          background: #e2e8f0;
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          z-index: 1000;
          display: none;
          width: 100%;
          padding: 8px 0;
          margin: 4px 0 0;
          background-color: #fff;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          max-height: 300px;
          overflow-y: auto;
        }

        .dropdown.show .dropdown-menu {
          display: block;
        }

        .dropdown-item {
          display: block;
          width: 100%;
          padding: 10px 16px;
          clear: both;
          font-weight: 400;
          color: #212529;
          text-align: inherit;
          white-space: nowrap;
          background-color: transparent;
          border: 0;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .dropdown-item:hover {
          background-color: #f8f9fa;
        }

        .dropdown-item.active {
          background-color: #e7f3ff;
          color: #4da6ff;
          font-weight: 500;
        }

        @media (max-width: 1200px) {
          .grid-3 {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .grid-3 {
            grid-template-columns: 1fr;
          }
          
          .layout-row {
            flex-direction: column;
          }
          
          .sidebar {
            width: 100% !important;
            margin-bottom: 20px;
          }
        }
      `}</style>

      
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
         
        }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '600',
            color: '#1a1a1a',
            margin: 0
          }}>
            Select a Server
          </h2>
          {/* <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
              className={`btn ${viewMode === 'cards' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setViewMode('cards')}
            >
              <LayoutGrid size={18} /> Cards
            </button>
            <button 
              className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setViewMode('list')}
            >
              <List size={18} /> List
            </button>
            <label className="switch">
              <input type="checkbox" />
              <span className="slider"></span>
            </label>
          </div> */}
        </div>

        <div className="layout-row" style={{ display: 'flex', gap: '20px' }}>
          {/* Sidebar */}
          <div className="sidebar" style={{ width: '240px', flexShrink: 0 }}>
            <div className="card" style={{ marginBottom: '20px' }}>
              <div style={{ padding: '16px' }}>
                {/* Search */}
                <div style={{ position: 'relative', marginBottom: '20px' }}>
                  <Search 
                    size={18} 
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#6c757d'
                    }} 
                  />
                  <input 
                    type="text" 
                    placeholder="Search"
                    className="form-control"
                    style={{ paddingLeft: '40px' }}
                  />
                </div>

                {/* Groups */}
                <div style={{ marginBottom: '20px' }}>
                  <h6 style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    color: '#6c757d',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <LayoutIcon size={16} />
                    Groups
                  </h6>
                  <div>
                    <div 
                      className={`list-item ${selectedGroup === 'all' ? 'active' : ''}`}
                      onClick={() => setSelectedGroup('all')}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Server size={16} />
                        All Servers
                      </span>
                      <span className="badge badge-secondary">128</span>
                    </div>
                    <div 
                      className={`list-item ${selectedGroup === 'Production' ? 'active' : ''}`}
                      onClick={() => setSelectedGroup('Production')}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#28a745'
                        }}></span>
                        Production
                      </span>
                      <span className="badge badge-secondary">64</span>
                    </div>
                    <div 
                      className={`list-item ${selectedGroup === 'Staging' ? 'active' : ''}`}
                      onClick={() => setSelectedGroup('Staging')}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#ffc107'
                        }}></span>
                        Staging
                      </span>
                      <span className="badge badge-secondary">32</span>
                    </div>
                    <div 
                      className={`list-item ${selectedGroup === 'Development' ? 'active' : ''}`}
                      onClick={() => setSelectedGroup('Development')}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#17a2b8'
                        }}></span>
                        Development
                      </span>
                      <span className="badge badge-secondary">32</span>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div style={{ marginBottom: '20px' }}>
                  <h6 style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    color: '#6c757d',
                    marginBottom: '12px'
                  }}>
                    Tags
                  </h6>
                  <div>
                    <div className="list-item">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <LayoutIcon size={16} />
                        Frontend
                      </span>
                      <ChevronRight size={16} />
                    </div>
                    <div className="list-item">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Server size={16} />
                        Backend
                      </span>
                      <ChevronRight size={16} />
                    </div>
                    <div className="list-item">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Database size={16} />
                        Database
                      </span>
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </div>

                {/* Favorites */}
                <div>
                  <h6 style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    color: '#6c757d',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Star size={16} />
                    Favorites
                  </h6>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Filter Dropdowns */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              {/* Environment Dropdown */}
              <div className={`dropdown ${showEnvDropdown ? 'show' : ''}`} style={{ minWidth: '220px' }}>
                <div 
                  className="dropdown-toggle"
                  onClick={() => {
                    setShowEnvDropdown(!showEnvDropdown);
                    setShowRegionDropdown(false);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Server size={16} style={{ color: '#4da6ff' }} />
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>{selectedEnvironment}</span>
                  </div>
                  <ChevronDown size={16} style={{ color: '#6c757d' }} />
                </div>
                <div className="dropdown-menu">
                  {environments.map((env, index) => (
                    <div
                      key={index}
                      className={`dropdown-item ${selectedEnvironment === env ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedEnvironment(env);
                        setShowEnvDropdown(false);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* <Server size={14} /> */}
                        <span>{env}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Region Dropdown */}
              <div className={`dropdown ${showRegionDropdown ? 'show' : ''}`} style={{ minWidth: '200px' }}>
                <div 
                  className="dropdown-toggle"
                  onClick={() => {
                    setShowRegionDropdown(!showRegionDropdown);
                    setShowEnvDropdown(false);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Globe size={16} style={{ color: '#4da6ff' }} />
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>{selectedRegion}</span>
                  </div>
                  <ChevronDown size={16} style={{ color: '#6c757d' }} />
                </div>
                <div className="dropdown-menu">
                  {regions.map((region, index) => (
                    <div
                      key={index}
                      className={`dropdown-item ${selectedRegion === region ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedRegion(region);
                        setShowRegionDropdown(false);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* <Globe size={14} /> */}
                        <span>{region}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid-3" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px'
            }}>
              {servers
                .filter(server => {
                  if (selectedGroup === 'all') return true;
                  return server.environment === selectedGroup;
                })
                .map((server, idx) => (
                <div key={idx} className="card" style={{ cursor: 'pointer' }}>
                  <div style={{ padding: '16px' }}>
                    <div style={{ marginBottom: '12px' }}>
                      <h6 style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        marginBottom: '4px',
                        color: '#1a1a1a'
                      }}>
                        {server.name}
                      </h6>
                      <div style={{
                        fontSize: '12px',
                        color: '#6c757d',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Server size={12} />
                        {server.ip}
                      </div>
                    </div>

                    <span 
                      className={`badge badge-${server.environment === 'Production' ? 'success' : 
                                               server.environment === 'Critical' ? 'danger' :
                                               server.environment === 'Warning' ? 'warning' :
                                               server.environment === 'Development' ? 'info' : 'warning'}`}
                      style={{ marginBottom: '16px' }}
                    >
                      {server.environment}
                    </span>

                    {/* Resource Usage Progress Bars */}
                    <div style={{ marginBottom: '16px' }}>
                      {/* CPU Usage */}
                      <div className="metric-item">
                        <div className="metric-label">
                          <Cpu size={14} />
                          <span>CPU Usage</span>
                        </div>
                        <div className="metric-value">
                          <span>{server.cpu}%</span>
                        </div>
                        <div className="progress-container">
                          <div 
                            className="progress-bar" 
                            style={{
                              width: `${server.cpu}%`,
                              background: server.cpu > 80 ? '#dc3545' : 
                                         server.cpu > 60 ? '#ffc107' : '#4da6ff'
                            }}
                          />
                        </div>
                      </div>

                      {/* Memory Usage */}
                      <div className="metric-item">
                        <div className="metric-label">
                          <Activity size={14} />
                          <span>Memory</span>
                        </div>
                        <div className="metric-value">
                          <span>{server.memory} GB</span>
                          <span style={{ fontSize: '11px', color: '#6c757d' }}>of 16 GB</span>
                        </div>
                        <div className="progress-container">
                          <div 
                            className="progress-bar" 
                            style={{
                              width: `${(server.memory / 16) * 100}%`,
                              background: (server.memory / 16) * 100 > 80 ? '#dc3545' : 
                                         (server.memory / 16) * 100 > 60 ? '#ffc107' : '#28a745'
                            }}
                          />
                        </div>
                      </div>

                      {/* Disk Usage */}
                      <div className="metric-item">
                        <div className="metric-label">
                          <HardDrive size={14} />
                          <span>Disk Usage</span>
                        </div>
                        <div className="metric-value">
                          <span>{server.disk}%</span>
                          <span style={{ 
                            fontSize: '11px', 
                            color: server.disk < 10 ? '#28a745' : '#6c757d',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}>
                            {server.disk < 10 ? '↑' : ''} Available
                          </span>
                        </div>
                        <div className="progress-container">
                          <div 
                            className="progress-bar" 
                            style={{
                              width: `${server.disk}%`,
                              background: server.disk > 80 ? '#dc3545' : 
                                         server.disk > 60 ? '#ffc107' : '#17a2b8'
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '12px',
                      borderTop: '1px solid #e9ecef'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        color: server.statusColor === 'danger' ? '#dc3545' :
                               server.statusColor === 'warning' ? '#ffc107' : '#28a745'
                      }}>
                        {getStatusIcon(server.status)}
                        {server.status}
                      </div>
                      <button className="btn btn-link" style={{ fontSize: '12px' }}>
                        Open Monitoring
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar */}
          <div style={{ width: '280px', flexShrink: 0 }}>
            <div className="card" style={{ marginBottom: '20px' }}>
              <div style={{ padding: '20px' }}>
                <h5 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '20px',
                  color: '#1a1a1a'
                }}>
                  Server Summary
                </h5>

                {(() => {
                  const filteredServers = servers.filter(server => {
                    if (selectedGroup === 'all') return true;
                    return server.environment === selectedGroup;
                  });
                  
                  const totalServers = filteredServers.length;
                  const healthyCount = filteredServers.filter(s => s.status === 'Healthy' || s.status === 'Active').length;
                  const warningCount = filteredServers.filter(s => s.status === 'Warning').length;
                  const criticalCount = filteredServers.filter(s => s.status === 'Critical').length;
                  const offlineCount = 0; // No offline servers in current data
                  
                  return (
                    <>
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px'
                        }}>
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px'
                          }}>
                            <CheckCircle size={16} color="#28a745" />
                            Healthy Servers
                          </span>
                          <div>
                            <strong style={{ fontSize: '18px' }}>{healthyCount}</strong>
                            <span style={{
                              fontSize: '13px',
                              color: '#6c757d',
                              marginLeft: '4px'
                            }}>{totalServers > 0 ? Math.round((healthyCount / totalServers) * 100) : 0}%</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px'
                        }}>
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px'
                          }}>
                            <AlertTriangle size={16} color="#ffc107" />
                            Warning Servers
                          </span>
                          <div>
                            <strong style={{ fontSize: '18px' }}>{warningCount}</strong>
                            <span style={{
                              fontSize: '13px',
                              color: '#6c757d',
                              marginLeft: '4px'
                            }}>{totalServers > 0 ? Math.round((warningCount / totalServers) * 100) : 0}%</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px'
                        }}>
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px'
                          }}>
                            <XCircle size={16} color="#dc3545" />
                            Critical Servers
                          </span>
                          <div>
                            <strong style={{ fontSize: '18px' }}>{criticalCount}</strong>
                            <span style={{
                              fontSize: '13px',
                              color: '#6c757d',
                              marginLeft: '4px'
                            }}>{totalServers > 0 ? Math.round((criticalCount / totalServers) * 100) : 0}%</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px'
                        }}>
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px'
                          }}>
                            <AlertCircle size={16} color="#6c757d" />
                            Offline Servers
                          </span>
                          <div>
                            <strong style={{ fontSize: '18px' }}>{offlineCount}</strong>
                            <span style={{
                              fontSize: '13px',
                              color: '#6c757d',
                              marginLeft: '4px'
                            }}>{totalServers > 0 ? Math.round((offlineCount / totalServers) * 100) : 0}%</span>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="card" style={{ marginBottom: '20px' }}>
              <div style={{ padding: '20px' }}>
                <h5 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '16px',
                  color: '#1a1a1a'
                }}>
                  Recent Alerts
                </h5>

                <div>
                  {alerts.map((alert, idx) => (
                    <div 
                      key={idx}
                      style={{
                        padding: '12px 0',
                        borderBottom: idx < alerts.length - 1 ? '1px solid #e9ecef' : 'none'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '4px'
                          }}>
                            {alert.color === 'warning' ? 
                              <AlertTriangle size={14} color="#ffc107" /> : 
                              <XCircle size={14} color="#dc3545" />
                            }
                            <span style={{
                              fontSize: '14px',
                              fontWeight: '500',
                              color: '#1a1a1a'
                            }}>
                              {alert.name}
                            </span>
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: '#6c757d',
                            paddingLeft: '20px'
                          }}>
                            {alert.ip}
                          </div>
                        </div>
                        <span 
                          className={`badge badge-${alert.color}`}
                          style={{ fontSize: '11px' }}
                        >
                          {alert.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button 
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontWeight: '600',
                justifyContent: 'center',
                fontSize: '15px'
              }}
            >
              Open Monitoring <ChevronRight size={20} />
            </button>
          </div>
        </div>
     
 

    </React.Fragment>
  );
};

SelectServer.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default SelectServer;
