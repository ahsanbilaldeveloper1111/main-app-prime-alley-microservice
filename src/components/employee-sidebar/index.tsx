import React, { useState } from 'react';
import { X, Phone, Mail, Calendar, ChevronDown, Video, List, Grid, ChevronRight, FileText, Archive, Lock, MapPin, Clock, Shield, AlertTriangle, User } from 'lucide-react';

interface ActivityItem {
  id: string;
  avatar: string;
  title: string;
  subtitle: string;
  timestamp: string;
}

interface RequestItem {
  id: string;
  avatar: string;
  dateRange: string;
  status: string;
  label: string;
  timestamp: string;
}

/** Profile from API (getUserProfile) – may include address_locations */
export interface EmployeeSidebarProfile {
  id: number;
  tenant_id?: string | null;
  user_id?: string | null;
  department_id?: string | number | null;
  employee_code?: string | null;
  identification_number?: string | null;
  job_title?: string | null;
  employment_type?: string | null;
  contract_type?: string | null;
  location_id?: number | null;
  phone?: string | null;
  status?: string | null;
  designation?: string | null;
  parent_id?: number | null;
  address_locations?: Array<{
    id: number;
    name?: string;
    zip_code?: string;
    city?: string;
    country?: string;
    address?: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

interface DepartmentOption {
  id: number;
  name?: string;
  [key: string]: unknown;
}

interface UserOption {
  id: number;
  name: string;
}

export interface EmployeeDetailSidebarProps {
  profile: EmployeeSidebarProfile | null;
  departments: DepartmentOption[];
  users: UserOption[];
  onClose?: () => void;
}

const EmployeeDetailSidebar: React.FC<EmployeeDetailSidebarProps> = ({ profile, departments, users, onClose }) => {
  const [activeTab, setActiveTab] = useState('Job');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [show360Dropdown, setShow360Dropdown] = useState(false);

  const tabs = ['Job', 'Location & Employment'];//'Personal', 

  const requestItems: RequestItem[] = [
    {
      id: '1',
      avatar: 'user',
      dateRange: 'Jan 29-30, Apr 25-30',
      status: 'No Requests',
      label: 'Overdue',
      timestamp: '4 hrs ago'
    }
  ];

  const activityItems: ActivityItem[] = [
    {
      id: '1',
      avatar: 'user',
      title: 'Bulk export performed',
      subtitle: 'Redeem 922-2150-2re 200-138',
      timestamp: '4 days ago'
    },
    {
      id: '2',
      avatar: 'user',
      title: 'Permissions changed on Docs',
      subtitle: 'Reduce visibility',
      timestamp: '3 hours ago'
    },
    {
      id: '3',
      avatar: 'user',
      title: 'Reset password for Sarah Malik',
      subtitle: 'Request ID: 476-98009a4',
      timestamp: '2 hours ago'
    }
  ];

  const riskItems: ActivityItem[] = [
    {
      id: '1',
      avatar: 'user',
      title: 'Hassan Mir: Deactivated by Hassan Mir',
      subtitle: 'Record: 922-755-486',
      timestamp: '1 day ago'
    },
    {
      id: '2',
      avatar: 'user',
      title: 'Risk Activity: 30-300-6035',
      subtitle: '7 hours ago',
      timestamp: ''
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Personal':
        return (
          <>
            {/* Performance Reviews Section */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                  Performance Reviews
                </h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShow360Dropdown(!show360Dropdown)}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        backgroundColor: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      <Calendar size={14} />
                      <span>Last 360 days</span>
                      <ChevronDown size={14} />
                    </button>
                    {show360Dropdown && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '4px',
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        zIndex: 10,
                        minWidth: '150px'
                      }}>
                        {['Last 30 days', 'Last 90 days', 'Last 180 days', 'Last 360 days'].map(period => (
                          <div
                            key={period}
                            onClick={() => setShow360Dropdown(false)}
                            style={{
                              padding: '10px 16px',
                              cursor: 'pointer',
                              fontSize: '13px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                          >
                            {period}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <button
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}
                >
                  <Video size={14} />
                  <span>1 Request Pending</span>
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setViewMode('list')}
                    style={{
                      padding: '6px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      backgroundColor: viewMode === 'list' ? '#f3f4f6' : 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <List size={16} color={viewMode === 'list' ? '#6366f1' : '#6b7280'} />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    style={{
                      padding: '6px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      backgroundColor: viewMode === 'grid' ? '#f3f4f6' : 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Grid size={16} color={viewMode === 'grid' ? '#6366f1' : '#6b7280'} />
                  </button>
                </div>
              </div>

              {/* Request Items */}
              {requestItems.map(item => (
                <div
                  key={item.id}
                  style={{
                    padding: '16px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    marginBottom: '12px'
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#e0e7ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <User size={20} color="#6366f1" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                          {item.dateRange}
                        </span>
                        <span style={{
                          padding: '2px 8px',
                          backgroundColor: '#fef3c7',
                          color: '#92400e',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '500'
                        }}>
                          {item.label}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: '#6b7280' }}>
                          {item.status}
                        </span>
                        <span style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} />
                          {item.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pending Section */}
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={16} color="#6b7280" />
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>
                    <strong style={{ color: '#1f2937' }}>0 Pending</strong> (Assigned to This Employee)
                  </span>
                </div>
                <MapPin size={16} color="#6b7280" />
              </div>
            </div>

            {/* Recent Activity Section */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                  Recent Activity
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    style={{
                      padding: '6px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Calendar size={16} color="#6b7280" />
                  </button>
                  <button
                    style={{
                      padding: '6px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <ChevronRight size={16} color="#6b7280" />
                  </button>
                </div>
              </div>

              {/* Activity Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activityItems.map(item => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '12px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: '#e0e7ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <User size={18} color="#6366f1" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        color: '#1f2937',
                        marginBottom: '2px'
                      }}>
                        {item.title}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#6b7280',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {item.subtitle}
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#9ca3af',
                      whiteSpace: 'nowrap',
                      alignSelf: 'flex-start',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Clock size={12} />
                      {item.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Score Section */}
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                    Risk Score
                  </h3>
                  <div style={{
                    padding: '4px 12px',
                    backgroundColor: '#fef3c7',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Shield size={14} color="#92400e" />
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: '700', 
                      color: '#92400e' 
                    }}>
                      80
                    </span>
                    <span style={{ 
                      fontSize: '13px', 
                      fontWeight: '500', 
                      color: '#92400e' 
                    }}>
                      Medium
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    style={{
                      padding: '6px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <FileText size={16} color="#6b7280" />
                  </button>
                  <button
                    style={{
                      padding: '6px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Archive size={16} color="#6b7280" />
                  </button>
                  <button
                    style={{
                      padding: '6px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <ChevronRight size={16} color="#6b7280" />
                  </button>
                </div>
              </div>

              {/* Risk Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {riskItems.map(item => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '12px',
                      backgroundColor: '#fef2f2',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      borderLeft: '3px solid #ef4444'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: '#fecaca',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <AlertTriangle size={18} color="#dc2626" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        color: '#1f2937',
                        marginBottom: '2px'
                      }}>
                        {item.title}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#6b7280',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        );
      
      case 'Job':
        return (
          <div style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
              Job Information
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {profile?.job_title != null && profile.job_title !== '' && (
                <div>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>Job title</span>
                  <div style={{ fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>{String(profile.job_title)}</div>
                </div>
              )}
              {profile?.department_id != null && (
                <div>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>Department</span>
                  <div style={{ fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                    {departments.find((d) => String(d.id) === String(profile.department_id))?.name ?? String(profile.department_id)}
                  </div>
                </div>
              )}
              {profile?.employment_type != null && profile.employment_type !== '' && (
                <div>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>Employment type</span>
                  <div style={{ fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>{String(profile.employment_type)}</div>
                </div>
              )}
              {profile?.contract_type != null && profile.contract_type !== '' && (
                <div>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>Contract type</span>
                  <div style={{ fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>{String(profile.contract_type)}</div>
                </div>
              )}
              {!profile?.job_title && profile?.department_id == null && !profile?.employment_type && !profile?.contract_type && (
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>No job details</p>
              )}
            </div>
          </div>
        );

      case 'Location & Employment':
        return (
          <div style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
              Location & Employment
            </h4>
            {profile?.address_locations && profile.address_locations.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {profile.address_locations.map((loc) => (
                  <div
                    key={loc.id}
                    style={{
                      padding: '16px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    {loc.name && <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>{loc.name}</div>}
                    {loc.address && <div style={{ fontSize: '14px', color: '#374151', marginBottom: '4px' }}>{loc.address}</div>}
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      {[loc.city, loc.country].filter(Boolean).join(', ')}
                      {loc.zip_code ? ` ${loc.zip_code}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>No address locations</p>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  const displayName = profile ? (users.find((u) => String(u.id) === String(profile.user_id))?.name ?? String(profile.user_id ?? profile.employee_code ?? profile.id ?? "—")) : "—";
  const departmentName = profile?.department_id != null ? (departments.find((d) => String(d.id) === String(profile.department_id))?.name ?? String(profile.department_id)) : null;

  return (
    <div style={{
      width: '420px',
      height: '100vh',
      backgroundColor: '#ffffff',
      boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header Section */}
      <div style={{
        padding: '24px',
        borderBottom: '1px solid #e5e7eb',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, paddingRight: '40px' }}>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: '600', 
              color: '#1f2937',
              margin: '0 0 4px 0'
            }}>
              {displayName}
            </h2>
            {profile?.job_title != null && profile.job_title !== '' && (
              <p style={{ fontSize: '15px', color: '#6b7280', margin: '0 0 8px 0' }}>
                {String(profile.job_title)}
              </p>
            )}
            {departmentName != null && (
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>
                {departmentName}
              </p>
            )}
            {profile?.employee_code != null && profile.employee_code !== '' && (
              <p style={{ fontSize: '14px', color: '#9ca3af', margin: '0 0 16px 0' }}>
                {String(profile.employee_code)}
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {profile?.phone != null && profile.phone !== '' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={16} color="#6b7280" />
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>{String(profile.phone)}</span>
                </div>
              )}
              {(profile as { email?: string })?.email != null && (profile as { email?: string }).email !== '' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={16} color="#6b7280" />
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>{(profile as { email?: string }).email}</span>
                </div>
              )}
            </div>
          </div>

          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#f3f4f6',
                border: 'none',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b7280',
                transition: 'all 0.2s',
                zIndex: 10
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb';
                e.currentTarget.style.color = '#111827';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.color = '#6b7280';
              }}
            >
              <X size={16} />
            </button>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: '30px'
            }}>
              <User size={40} color="white" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 24px',
        gap: '24px'
      }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '16px 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #6366f1' : '2px solid transparent',
              color: activeTab === tab ? '#6366f1' : '#6b7280',
              fontSize: '14px',
              fontWeight: activeTab === tab ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            {tab}
          </button>
        ))}
        <button
          style={{
            padding: '16px 0',
            background: 'none',
            border: 'none',
            color: '#6b7280',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          •••
        </button>
      </div>

      {/* Scrollable Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px'
      }}>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default EmployeeDetailSidebar;