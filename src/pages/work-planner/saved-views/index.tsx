import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

import  { useState } from 'react';
import { 
  Grid3x3, Bell, Plus, Search, ChevronDown, MoreVertical,
  Folder, Users, Clock, X, Check
} from 'lucide-react';
import { Row, Col } from 'react-bootstrap';
import StatsCard from '@components/work-planner/stats-cards';

const WorkPlannerSavedViews = () => {
    const [activeTab, setActiveTab] = useState('my-views');
    const [selectedViews, setSelectedViews] = useState<number[]>([]);
  
    const views = [
      {
        id: 1,
        name: 'My Overdue Tasks',
        owner: 'Me',
        ownerAvatar: 'ME',
        shared: false,
        defaultViewType: 'List',
        viewTypeColor: '#FEF3C7',
        viewTypeTextColor: '#92400E',
        updated: '2 days ago'
      },
      {
        id: 2,
        name: 'Critical Bugs',
        owner: 'John Dalton',
        ownerAvatar: 'JD',
        shared: true,
        defaultViewType: 'Board',
        viewTypeColor: '#DBEAFE',
        viewTypeTextColor: '#1E40AF',
        updated: '4 days ago'
      },
      {
        id: 3,
        name: 'Q2 Marketing Plan',
        owner: 'Me',
        ownerAvatar: 'ME',
        shared: false,
        defaultViewType: 'Board',
        viewTypeColor: '#DBEAFE',
        viewTypeTextColor: '#1E40AF',
        updated: '4 week ago'
      },
      {
        id: 4,
        name: 'All UI/UX Tasks',
        owner: 'Sarah King',
        ownerAvatar: 'SK',
        shared: true,
        defaultViewType: 'Board',
        viewTypeColor: '#DBEAFE',
        viewTypeTextColor: '#1E40AF',
        updated: '2 weeks ago'
      },
      {
        id: 5,
        name: 'My CRM Tickets',
        owner: 'Me',
        ownerAvatar: 'ME',
        shared: false,
        defaultViewType: 'List',
        viewTypeColor: '#FEF3C7',
        viewTypeTextColor: '#92400E',
        updated: '2 weeks ago'
      }
    ];
  
    const toggleViewSelection = (id: number) => {
      setSelectedViews(prev => 
        prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
      );
    };
  
    const toggleAllViews = () => {
      setSelectedViews(prev => 
        prev.length === views.length ? [] : views.map(v => v.id)
      );
    };
  
    const styles = {
      container: { backgroundColor: '#F4F7FA', minHeight: '100vh', paddingBottom: '2rem' },
      header: { backgroundColor: '#fff', borderBottom: '1px solid #E5E9F2', padding: '1rem 0' },
      headerInner: { },
      headerContent: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: '1rem' },
      headerLeft: { display: 'flex', alignItems: 'center', gap: '1rem' },
      title: { margin: 0, fontWeight: '600', color: '#1F2937', fontSize: '1.5rem' },
      headerRight: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' as const },
      button: { padding: '0.625rem 1.25rem', backgroundColor: '#4680FF', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', transition: 'background 0.2s' },
      tabsContainer: { backgroundColor: '#fff', borderBottom: '1px solid #E5E9F2' },
      tabsInner: { maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', gap: '2rem' },
      tab: { background: 'none', border: 'none', padding: '1rem 0', fontSize: '0.95rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' as const },
      contentContainer: { maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem', marginTop: '1.5rem' },
      pageTitle: { fontSize: '1.75rem', fontWeight: '700', color: '#1F2937', marginBottom: '1.5rem' },
      card: { backgroundColor: 'white', border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '1.5rem', marginBottom: '1.5rem' },
      filterRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'center' },
      inputGroup: { position: 'relative' as const, display: 'flex', alignItems: 'center' },
      inputIcon: { position: 'absolute' as const, left: '0.75rem', pointerEvents: 'none' as const },
      input: { width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', border: '1px solid #E5E9F2', borderRadius: '6px', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' },
      select: { width: '100%', padding: '0.75rem', border: '1px solid #E5E9F2', borderRadius: '6px', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', cursor: 'pointer', backgroundColor: 'white' },
      buttonOutline: { 
        padding: '0.625rem 1.25rem', 
        backgroundColor: 'white', 
        color: '#4680FF', 
        border: '1px solid #4680FF', 
        borderRadius: '6px', 
        fontWeight: '500', 
        cursor: 'pointer', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem', 
        fontSize: '0.9rem', 
        transition: 'all 0.2s'
      },
      table: { width: '100%', borderCollapse: 'collapse' as const },
      th: { 
        fontSize: '0.75rem', 
        fontWeight: '600', 
        color: '#6B7280', 
        textTransform: 'uppercase' as const, 
        letterSpacing: '0.5px', 
        padding: '0.75rem', 
        textAlign: 'left' as const, 
        backgroundColor: '#F9FAFB', 
        borderBottom: '1px solid #E5E9F2',
        cursor: 'pointer'
      },
      td: { padding: '1rem 0.75rem', borderBottom: '1px solid #F3F4F6', color: '#4B5563', fontSize: '0.9rem' },
      avatar: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.75rem',
        fontWeight: '600',
        marginRight: '0.5rem'
      },
      badge: { 
        padding: '0.25rem 0.75rem', 
        borderRadius: '6px', 
        fontSize: '0.75rem', 
        fontWeight: '600', 
        display: 'inline-block',
        cursor: 'pointer'
      },
      tableWrapper: { overflowX: 'auto' as const },
      checkbox: { 
        width: '16px', 
        height: '16px', 
        cursor: 'pointer',
        accentColor: '#4680FF'
      },
      actionButton: {
        padding: '0.375rem',
        backgroundColor: 'transparent',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.2s'
      }
    };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Work Planner Saved Views" />

      <>
      <style>{`
        .stat-card {
          border: none;
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
          transition: transform 0.2s, box-shadow 0.2s;
          min-height: 120px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          flex-shrink: 0;
        }
        
        .stat-number {
          font-size: 2rem;
          font-weight: 700;
          margin: 0.5rem 0 0.25rem 0;
        }
        
        .stat-label {
          font-size: 0.875rem;
          color: #6B7280;
          font-weight: 500;
          margin: 0;
        }
      `}</style>

     
      <div style={styles.container}>
       

        {/* Content */}
        <div style={styles.contentContainer}>
          {/* Page Title */}
         

          {/* Summary Stats Cards */}
          <Row className="g-3" style={{ marginBottom: '1.5rem' }}>
            <Col xs={12} sm={6} lg={3} className="d-flex">
              <StatsCard
                title="My Views"
                value={5}
                icon={Folder}
                iconColor="#4680FF"
                iconBgColor="#E3F2FD"
                valueColor="#1F2937"
              />
            </Col>
            <Col xs={12} sm={6} lg={3} className="d-flex">
              <StatsCard
                title="Shared with Me"
                value={3}
                icon={Users}
                iconColor="#4FC3F7"
                iconBgColor="#E1F5FE"
                valueColor="#1F2937"
              />
            </Col>
            <Col xs={12} sm={6} lg={3} className="d-flex">
              <StatsCard
                title="Team Views"
                value={7}
                icon={Users}
                iconColor="#2CA87F"
                iconBgColor="#E8F5E9"
                valueColor="#1F2937"
              />
            </Col>
            <Col xs={12} sm={6} lg={3} className="d-flex">
              <div className="stat-card w-100" style={{ 
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.25rem 1.5rem'
              }}>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="stat-label">Yesterday</h6>
                    <p style={{ 
                      fontSize: '0.875rem', 
                      color: '#6B7280', 
                      margin: '0.5rem 0 0 0' 
                    }}>
                      Last update
                    </p>
                  </div>
                  <div 
                    className="stat-icon" 
                    style={{ 
                      backgroundColor: '#FFF3E0',
                      color: '#FFB64D'
                    }}
                  >
                    <Clock />
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          {/* Tabs */}
          <div style={styles.tabsContainer}>
            <div style={styles.tabsInner}>
              {['My Views', 'Team Views'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase().replace(' ', '-'))}
                  style={{
                    ...styles.tab,
                    color: activeTab === tab.toLowerCase().replace(' ', '-') ? '#4680FF' : '#6B7280',
                    borderBottom: activeTab === tab.toLowerCase().replace(' ', '-') ? '2px solid #4680FF' : '2px solid transparent'
                  } as React.CSSProperties}
                  onMouseOver={(e) => {
                    if (activeTab !== tab.toLowerCase().replace(' ', '-')) {
                      e.currentTarget.style.color = '#4680FF';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (activeTab !== tab.toLowerCase().replace(' ', '-')) {
                      e.currentTarget.style.color = '#6B7280';
                    }
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Bar */}
          <div style={styles.card}>
            <div style={styles.filterRow}>
              <div style={styles.inputGroup}>
                <Search size={16} color="#6B7280" style={styles.inputIcon} />
                <input 
                  type="text" 
                  placeholder="Search views..."
                  style={styles.input}
                  onFocus={(e) => e.target.style.borderColor = '#4680FF'}
                  onBlur={(e) => e.target.style.borderColor = '#E5E9F2'}
                />
              </div>
              
              <select style={styles.select}>
                <option>Owner</option>
                <option>Me</option>
                <option>John Dalton</option>
                <option>Sarah King</option>
              </select>
              
              <select style={styles.select}>
                <option>Type</option>
                <option>Board</option>
                <option>List</option>
                <option>Calendar</option>
              </select>

              <select style={styles.select}>
                <option>Type</option>
                <option>Board</option>
                <option>List</option>
                <option>Calendar</option>
              </select>
              
              <button 
                style={{...styles.buttonOutline, justifyContent: 'center'}}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                <X size={16} />
                Clear Filters
              </button>
            </div>
          </div>

          {/* Views Table */}
          <div style={styles.card}>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{...styles.th, width: '40px'}}>
                      <input 
                        type="checkbox" 
                        style={styles.checkbox}
                        checked={selectedViews.length === views.length}
                        onChange={toggleAllViews}
                      />
                    </th>
                    <th style={styles.th}>View Name</th>
                    <th style={styles.th}>
                      Owner
                      <ChevronDown size={14} style={{ marginLeft: '0.25rem', display: 'inline' }} />
                    </th>
                    <th style={styles.th}>
                      Shared
                      <ChevronDown size={14} style={{ marginLeft: '0.25rem', display: 'inline' }} />
                    </th>
                    <th style={styles.th}>
                      Default View Type
                      <ChevronDown size={14} style={{ marginLeft: '0.25rem', display: 'inline' }} />
                    </th>
                    <th style={styles.th}>
                      Updated
                      <ChevronDown size={14} style={{ marginLeft: '0.25rem', display: 'inline' }} />
                    </th>
                    <th style={styles.th}>
                      Actions
                      <ChevronDown size={14} style={{ marginLeft: '0.25rem', display: 'inline' }} />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {views.map((view) => (
                    <tr 
                      key={view.id}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      <td style={styles.td}>
                        <input 
                          type="checkbox" 
                          style={styles.checkbox}
                          checked={selectedViews.includes(view.id)}
                          onChange={() => toggleViewSelection(view.id)}
                        />
                      </td>
                      <td style={styles.td}>
                        <span style={{ fontWeight: '500', color: '#1F2937' }}>{view.name}</span>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={styles.avatar}>{view.ownerAvatar}</div>
                          <span>{view.owner}</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        {view.shared ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#2CA87F' }}>
                            <Check size={16} />
                            <span style={{ fontWeight: '500' }}>Yes</span>
                          </div>
                        ) : (
                          <span style={{ color: '#6B7280' }}>No</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{
                            ...styles.badge,
                            backgroundColor: view.viewTypeColor,
                            color: view.viewTypeTextColor
                          }}>
                            {view.defaultViewType}
                          </span>
                          <ChevronDown size={14} color="#6B7280" style={{ cursor: 'pointer' }} />
                        </div>
                      </td>
                      <td style={styles.td}>{view.updated}</td>
                      <td style={styles.td}>
                        <button 
                          style={styles.actionButton}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <MoreVertical size={18} color="#6B7280" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>

    </React.Fragment>
  );
};

WorkPlannerSavedViews.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default WorkPlannerSavedViews;
