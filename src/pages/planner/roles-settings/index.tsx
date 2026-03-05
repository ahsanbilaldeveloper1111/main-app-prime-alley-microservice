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
  Users, Shield, User, X, Edit2, Trash2
} from 'lucide-react';
import { Row, Col } from 'react-bootstrap';
import StatsCard from '@components/work-planner/stats-cards';
import WorkflowSettings from '@components/work-planner/workflow';
const WorkPlannerRolesSettings = () => {
    const [activeTab, setActiveTab] = useState('members');
    const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
    const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  
    const members = [
      {
        id: 1,
        name: 'John Dalton',
        email: 'john@example.com',
        avatar: 'JD',
        role: 'Admin',
        roleColor: '#E0E7FF',
        roleTextColor: '#3730A3',
        addedOn: 'Apr 10, 2024, 10:10 AM',
        lastActive: 'Apr 22, 2024, 10:45 AM',
        actionDropdown: 'Date'
      },
      {
        id: 2,
        name: 'Sarah King',
        email: 'sarah@example.com',
        avatar: 'SK',
        role: 'Admin',
        roleColor: '#FEF3C7',
        roleTextColor: '#92400E',
        addedOn: 'Apr 9, 2024, 9:25 AM',
        lastActive: 'Apr 21, 2024, 7:50 AM',
        actionDropdown: 'Pule'
      },
      {
        id: 3,
        name: 'Jason Tran',
        email: 'jason@example.com',
        avatar: 'JT',
        role: 'Admin',
        roleColor: '#E0E7FF',
        roleTextColor: '#3730A3',
        addedOn: 'Apr 9, 2024, 7:50 AM',
        lastActive: 'Apr 22, 2024, 3:30 PM',
        actionDropdown: 'Pule'
      },
      {
        id: 4,
        name: 'Alicia Patterson',
        email: 'alicia@example.com',
        avatar: 'AP',
        role: 'Member',
        roleColor: '#FED7AA',
        roleTextColor: '#7C2D12',
        addedOn: 'Apr 8, 2024, 8:15 AM',
        lastActive: 'Apr 22, 2024, 11:00 AM',
        actionDropdown: 'Rule'
      },
      {
        id: 5,
        name: 'Mike Williams',
        email: 'mike@example.com',
        avatar: 'MW',
        role: 'Member',
        roleColor: '#E5E7EB',
        roleTextColor: '#1F2937',
        addedOn: 'Apr 8, 2024, 8:00 AM',
        lastActive: 'Apr 21, 2024, 8:05 AM',
        actionDropdown: 'Role'
      },
      {
        id: 6,
        name: 'Emily Robertson',
        email: 'emily@example.com',
        avatar: 'ER',
        role: 'Viewer',
        roleColor: '#D1FAE5',
        roleTextColor: '#065F46',
        addedOn: 'Apr 6, 2024, 2:45 PM',
        lastActive: 'Apr 26, 2024, 6:40 PM',
        actionDropdown: 'Pute'
      },
      {
        id: 7,
        name: 'Laura Nichols',
        email: 'laura@example.com',
        avatar: 'LN',
        role: 'Viewer',
        roleColor: '#DBEAFE',
        roleTextColor: '#1E40AF',
        addedOn: 'Apr 5, 2024, 5:35 PM',
        lastActive: 'Apr 22, 2024, 5:10 AM',
        actionDropdown: 'Pate'
      },
      {
        id: 8,
        name: 'Mark Johnson',
        email: 'mark@example.com',
        avatar: 'MJ',
        role: 'Member',
        roleColor: '#E5E7EB',
        roleTextColor: '#1F2937',
        addedOn: 'Apr 5, 2024, 9:30 AM',
        lastActive: 'Apr 25, 2024, 5:35 PM',
        actionDropdown: 'Dule'
      }
    ];
  
    const toggleMemberSelection = (id: number) => {
      setSelectedMembers(prev => 
        prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
      );
    };
  
    const toggleAllMembers = () => {
      setSelectedMembers(prev => 
        prev.length === members.length ? [] : members.map(m => m.id)
      );
    };
  
    const styles = {
      container: { backgroundColor: '#F4F7FA', minHeight: '100vh', paddingBottom: '2rem' },
      header: { backgroundColor: '#fff', borderBottom: '1px solid #E5E9F2', padding: '1rem 0' },
      headerInner: { maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem' },
      headerContent: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: '1rem' },
      headerLeft: { display: 'flex', alignItems: 'center', gap: '1rem' },
      title: { margin: 0, fontWeight: '600', color: '#1F2937', fontSize: '1.5rem' },
      headerRight: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' as const },
      button: { padding: '0.625rem 1.25rem', backgroundColor: '#4680FF', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', transition: 'background 0.2s' },
      tabsContainer: { backgroundColor: '#fff', borderBottom: '1px solid #E5E9F2' },
      tabsInner: { maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', gap: '2rem' },
      tab: { background: 'none', border: 'none', padding: '1rem 0', fontSize: '0.95rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' as const },
      contentContainer: { maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem', marginTop: '1.5rem' },
      card: { backgroundColor: 'white', border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '1.5rem', marginBottom: '1.5rem' },
      filterRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' },
      inputGroup: { position: 'relative' as const, display: 'flex', alignItems: 'center' },
      inputIcon: { position: 'absolute' as const, left: '0.75rem', pointerEvents: 'none' as const },
      input: { width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', border: '1px solid #E5E9F2', borderRadius: '6px', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' },
      select: { width: '100%', padding: '0.75rem', border: '1px solid #E5E9F2', borderRadius: '6px', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', cursor: 'pointer', backgroundColor: 'white' },
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
        borderBottom: '1px solid #E5E9F2' 
      },
      td: { padding: '1rem 0.75rem', borderBottom: '1px solid #F3F4F6', color: '#4B5563', fontSize: '0.9rem' },
      avatar: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.875rem',
        fontWeight: '600',
        marginRight: '0.75rem'
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
      removeButton: {
        padding: '0.375rem 0.75rem',
        backgroundColor: 'transparent',
        color: '#DC2626',
        border: '1px solid #DC2626',
        borderRadius: '6px',
        fontSize: '0.8rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s'
      },
      bottomActions: {
        display: 'flex',
        gap: '1rem',
        marginTop: '1rem',
        paddingTop: '1rem',
        borderTop: '1px solid #E5E9F2'
      },
      buttonPrimary: {
        padding: '0.625rem 1.25rem',
        backgroundColor: '#4680FF',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontWeight: '500',
        cursor: 'pointer',
        fontSize: '0.9rem',
        transition: 'background 0.2s'
      },
      buttonSecondary: {
        padding: '0.625rem 1.25rem',
        backgroundColor: '#F3F4F6',
        color: '#4B5563',
        border: 'none',
        borderRadius: '6px',
        fontWeight: '500',
        cursor: 'pointer',
        fontSize: '0.9rem',
        transition: 'background 0.2s'
      },
      dropdownContainer: {
        position: 'relative' as const
      },
      dropdownMenu: {
        position: 'absolute' as const,
        right: 0,
        top: '100%',
        marginTop: '0.25rem',
        backgroundColor: 'white',
        border: '1px solid #E5E9F2',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
        zIndex: 50,
        minWidth: '160px',
        overflow: 'hidden'
      },
      dropdownItem: {
        padding: '0.75rem 1rem',
        fontSize: '0.875rem',
        color: '#374151',
        cursor: 'pointer',
        border: 'none',
        backgroundColor: 'transparent',
        width: '100%',
        textAlign: 'left' as const,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        transition: 'background-color 0.15s'
      }
    };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Work Planner Roles Settings" />

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
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerInner}>
            <div style={styles.headerContent}>
              <div style={styles.headerLeft}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Users size={32} className="text-primary" style={{ marginRight: '0.5rem' }} />
                  <h2 className="mb-0 fw-bold">Members / Role Settings</h2>
                </div>
              </div>
              
              <div style={styles.headerRight}>
                <button 
                  style={styles.button}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3B66D8'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4680FF'}
                >
                  <Plus size={18} />
                  <span>Add Member</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabsContainer}>
          <div style={styles.tabsInner}>
            {['General', 'Members', 'Labels', 'Workflow / Statuses'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase().replace(' / ', '-'))}
                style={{
                  ...styles.tab,
                  color: activeTab === tab.toLowerCase().replace(' / ', '-') ? '#4680FF' : '#6B7280',
                  borderBottom: activeTab === tab.toLowerCase().replace(' / ', '-') ? '2px solid #4680FF' : '2px solid transparent'
                } as React.CSSProperties}
                onMouseOver={(e) => {
                  if (activeTab !== tab.toLowerCase().replace(' / ', '-')) {
                    e.currentTarget.style.color = '#4680FF';
                  }
                }}
                onMouseOut={(e) => {
                  if (activeTab !== tab.toLowerCase().replace(' / ', '-')) {
                    e.currentTarget.style.color = '#6B7280';
                  }
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={styles.contentContainer}>
          {activeTab === 'workflow-statuses' ? (
            <WorkflowSettings />
          ) : (
            <>
          {/* Summary Stats Cards */}
          <Row className="g-3" style={{ marginBottom: '1.5rem' }}>
            <Col xs={12} sm={6} lg={3} className="d-flex">
              <StatsCard
                title="Total Members"
                value={12}
                icon={Users}
                iconColor="#4680FF"
                iconBgColor="#E3F2FD"
                valueColor="#1F2937"
              />
            </Col>
            <Col xs={12} sm={6} lg={3} className="d-flex">
              <StatsCard
                title="Admins"
                value={4}
                icon={Shield}
                iconColor="#9C27B0"
                iconBgColor="#F3E5F5"
                valueColor="#1F2937"
              />
            </Col>
            <Col xs={12} sm={6} lg={3} className="d-flex">
              <StatsCard
                title="Members"
                value={7}
                icon={Users}
                iconColor="#FFB64D"
                iconBgColor="#FFF3E0"
                valueColor="#1F2937"
              />
            </Col>
            <Col xs={12} sm={6} lg={3} className="d-flex">
              <StatsCard
                title="Viewer"
                value={1}
                icon={User}
                iconColor="#2CA87F"
                iconBgColor="#E8F5E9"
                valueColor="#1F2937"
              />
            </Col>
          </Row>

          {/* Filter Bar */}
          <div style={styles.card}>
            <div style={styles.filterRow}>
              <div style={styles.inputGroup}>
                <Search size={16} color="#6B7280" style={styles.inputIcon} />
                <input 
                  type="text" 
                  placeholder="Search users..."
                  style={styles.input}
                  onFocus={(e) => e.target.style.borderColor = '#4680FF'}
                  onBlur={(e) => e.target.style.borderColor = '#E5E9F2'}
                />
              </div>
              
              <select style={styles.select}>
                <option>All Roles</option>
                <option>Admin</option>
                <option>Member</option>
                <option>Viewer</option>
              </select>
              
              <select style={styles.select}>
                <option>Group</option>
                <option>Development</option>
                <option>Marketing</option>
                <option>Sales</option>
              </select>
            </div>
          </div>

          {/* Members Table */}
          <div style={styles.card}>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{...styles.th, width: '40px'}}>
                      <input 
                        type="checkbox" 
                        style={styles.checkbox}
                        checked={selectedMembers.length === members.length}
                        onChange={toggleAllMembers}
                      />
                    </th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Role</th>
                    <th style={styles.th}>Added On</th>
                    <th style={styles.th}>Last Active</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr 
                      key={member.id}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      <td style={styles.td}>
                        <input 
                          type="checkbox" 
                          style={styles.checkbox}
                          checked={selectedMembers.includes(member.id)}
                          onChange={() => toggleMemberSelection(member.id)}
                        />
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          {/* <div style={styles.avatar}>{member.avatar}</div> */}
                          <span style={{ fontWeight: '500', color: '#1F2937' }}>{member.name}</span>
                        </div>
                      </td>
                      <td style={styles.td}>{member.email}</td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{
                            ...styles.badge,
                            backgroundColor: member.roleColor,
                            color: member.roleTextColor
                          }}>
                            {member.role}
                          </span>
                          <ChevronDown size={14} color="#6B7280" style={{ cursor: 'pointer' }} />
                        </div>
                      </td>
                      <td style={styles.td}>{member.addedOn}</td>
                      <td style={styles.td}>{member.lastActive}</td>
                      <td style={styles.td}>
                        <div style={styles.dropdownContainer}>
                          <button 
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: '0.375rem',
                              cursor: 'pointer',
                              color: '#6B7280',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            onClick={() => setOpenDropdown(openDropdown === member.id ? null : member.id)}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            title="More actions"
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {openDropdown === member.id && (
                            <div style={styles.dropdownMenu}>
                              <button
                                style={styles.dropdownItem}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                onClick={() => {
                                  console.log('Edit member:', member.id);
                                  setOpenDropdown(null);
                                }}
                              >
                                <Edit2 size={16} />
                                Edit
                              </button>
                              <button
                                style={{...styles.dropdownItem, color: '#DC2626'}}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.backgroundColor = '#FEE2E2';
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                                onClick={() => {
                                  console.log('Remove member:', member.id);
                                  setOpenDropdown(null);
                                }}
                              >
                                <Trash2 size={16} />
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Action Buttons */}
            {/* <div style={styles.bottomActions}>
              <button 
                style={styles.buttonPrimary}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3B66D8'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4680FF'}
              >
                Sark 3 Meseber
              </button>
              <button 
                style={styles.buttonSecondary}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E5E7EB'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
              >
                Resort
              </button>
            </div> */}
          </div>            </>
          )}        </div>
      </div>
    </>

    </React.Fragment>
  );
};

WorkPlannerRolesSettings.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default WorkPlannerRolesSettings;
