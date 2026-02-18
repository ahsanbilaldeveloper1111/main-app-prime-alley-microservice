import React, { useState, useRef, useEffect, ReactElement } from 'react';
import {
  X, ChevronDown, ChevronRight, ChevronLeft, Mail, Phone, MoreHorizontal,
  Calendar, MessageSquare, ClipboardList, ExternalLink, Copy, RefreshCw,
  ThumbsUp, ThumbsDown, Sparkles, User, Building2, Briefcase,
  FileText, Ticket, Paperclip, Link2, Tag, DollarSign,
  Search, Filter, AlertCircle, ShoppingCart, Handshake, CheckCircle, Edit
} from 'lucide-react';
import Layout from "@layout/index";
import { useRouter } from "next/router";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface KeyInfoField {
  label: string;
  value: string;
  copyable?: boolean;
}

type NextPageWithLayout = React.FC & {
  getLayout?: (page: ReactElement) => ReactElement;
};

interface ActivityItem {
  id: string;
  type: 'invoice' | 'email' | 'subscription' | 'note' | 'call' | 'meeting' | 'task';
  title: string;
  description: string;
  timestamp: string;
  user?: string;
  userLink?: string;
  entityLink?: string;
  entityName?: string;
  alert?: {
    message: string;
    link?: string;
    linkText?: string;
  };
  expanded?: boolean;
}

interface SubscriptionItem {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'cancelled';
  nextBillingDate: string;
  nextPaymentAmount: string;
  contactEmail: string;
  link: string;
}

interface RevenueSection {
  id: string;
  title: string;
  count: number;
  description: string;
  buttonText: string;
  buttonIcon?: React.ComponentType<{ size?: number }>;
  items?: SubscriptionItem[];
  onButtonClick: () => void;
  addButtonText?: string;
  onAddClick?: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const DealApprovedRecordPage: NextPageWithLayout = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('about');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showMoreActivities, setShowMoreActivities] = useState(false);
  const [activityFilter, setActivityFilter] = useState('activity');
  const [searchActivity, setSearchActivity] = useState('');
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const moreActivitiesRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowActionsDropdown(false);
      }
      if (moreActivitiesRef.current && !moreActivitiesRef.current.contains(event.target as Node)) {
        setShowMoreActivities(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleActivity = (activityId: string) => {
    setExpandedActivities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  };
  
  // Sample activity data
  const activitiesData: ActivityItem[] = [
    {
      id: '1',
      type: 'invoice',
      title: 'Invoice activity',
      description: 'sent invoice INV-1004 to',
      timestamp: 'Feb 14, 2026 at 2:50 AM GMT+5',
      user: 'Rizwan Haider',
      userLink: '#',
      entityName: 'Ahmad Hussain <ahmad@gmail.com>',
      entityLink: '#',
    },
    {
      id: '2',
      type: 'email',
      title: 'Marketing email',
      description: 'sent to Ahmad Hussain <Ahmad Hussain <ahmad@gmail.com>>',
      timestamp: 'Feb 14, 2026 at 2:50 AM GMT+5',
      alert: {
        message: 'There was an issue sending an email to this contact. An email to this recipient has bounced.',
        link: '#',
        linkText: 'Learn more.',
      },
      expanded: true,
    },
    {
      id: '3',
      type: 'invoice',
      title: 'Invoice activity',
      description: 'finalized invoice INV-1004',
      timestamp: 'Feb 14, 2026 at 2:50 AM GMT+5',
      user: 'Rizwan Haider',
      userLink: '#',
    },
    {
      id: '4',
      type: 'meeting',
      title: 'Meeting scheduled',
      description: 'Meeting scheduled with',
      timestamp: 'Feb 14, 2026 at 2:49 AM GMT+5',
      entityName: 'Ahmad Hussain',
      entityLink: '#',
      user: 'Rizwan Haider',
      userLink: '#',
    },
  ];
  
  const renderActivityItem = (activity: ActivityItem) => {
    const isExpanded = expandedActivities.has(activity.id) || activity.expanded;
    
    return (
      <div
        key={activity.id}
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #eaf0f6',
          borderRadius: '5px',
          padding: '16px 20px',
          marginBottom: '12px',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1 }}>
            {activity.expanded !== undefined && (
              <button
                onClick={() => toggleActivity(activity.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  color: '#141414',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            )}
            
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px',
              }}>
                {activity.type === 'invoice' && <FileText size={16} color="#0d6efd" />}
                {activity.type === 'email' && <Mail size={16} color="#0d6efd" />}
                {activity.type === 'meeting' && <Calendar size={16} color="#0d6efd" />}
                {activity.type === 'note' && <ClipboardList size={16} color="#0d6efd" />}
                {activity.type === 'call' && <Phone size={16} color="#0d6efd" />}
                {activity.type === 'task' && <CheckCircle size={16} color="#0d6efd" />}
                <span style={{ fontWeight: 500, color: '#141414' }}>{activity.title}</span>
              </div>
              <div style={{ color: '#6c757d', fontSize: '14px', lineHeight: '1.5' }}>
                {activity.description}
                {activity.entityName && (
                  <a href={activity.entityLink || '#'} style={{ color: '#0d6efd', textDecoration: 'none' }}>
                    {' '}{activity.entityName}
                  </a>
                )}
                {activity.user && (
                  <>
                    {' by '}
                    <a href={activity.userLink || '#'} style={{ color: '#0d6efd', textDecoration: 'none' }}>
                      {activity.user}
                    </a>
                  </>
                )}
              </div>
              {activity.alert && (
                <div style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '4px',
                  fontSize: '13px',
                  color: '#856404',
                }}>
                  <AlertCircle size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  {activity.alert.message}
                  {activity.alert.link && (
                    <a href={activity.alert.link} style={{ color: '#0d6efd', textDecoration: 'none', marginLeft: '4px' }}>
                      {activity.alert.linkText}
                    </a>
                  )}
                </div>
              )}
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#6c757d' }}>
                {activity.timestamp}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const isSectionCollapsed = (sectionId: string) => collapsedSections.has(sectionId);

  // Key information fields
  const keyInfoFields: KeyInfoField[] = [
    { label: 'Deal ID', value: router.query.id as string || 'N/A', copyable: true },
    { label: 'Deal Name', value: 'Sample Deal Name', copyable: false },
    { label: 'Company', value: 'Sample Company', copyable: false },
    { label: 'Stage', value: 'Negotiation', copyable: false },
    { label: 'Value', value: 'AED 50,000', copyable: false },
    { label: 'Expected Close Date', value: '2026-03-15', copyable: false },
  ];

  const handleBack = () => {
    router.push('/crm/deals-approval');
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        backgroundColor: '#ffffff',
        padding: '20px 24px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={handleBack}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              color: '#6c757d',
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: '#141414' }}>
              Deal Approved Details
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6c757d' }}>
              View and manage approved deal information
            </p>
          </div>
        </div>
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            onClick={() => setShowActionsDropdown(!showActionsDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: '#0d6efd',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Actions
            <MoreHorizontal size={16} />
          </button>
          {showActionsDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              backgroundColor: '#ffffff',
              border: '1px solid #eaf0f6',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              minWidth: '200px',
              zIndex: 1000,
            }}>
              <button style={{
                width: '100%',
                textAlign: 'left',
                padding: '12px 16px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#141414',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <Edit size={16} />
                Edit Deal
              </button>
              <button style={{
                width: '100%',
                textAlign: 'left',
                padding: '12px 16px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#141414',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <Copy size={16} />
                Duplicate
              </button>
              <button style={{
                width: '100%',
                textAlign: 'left',
                padding: '12px 16px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#dc3545',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <X size={16} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Main Content */}
        <div style={{ flex: 1 }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '24px',
            backgroundColor: '#ffffff',
            padding: '8px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            {['about', 'activity', 'notes'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  background: activeTab === tab ? '#0d6efd' : 'transparent',
                  color: activeTab === tab ? '#ffffff' : '#6c757d',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  textTransform: 'capitalize',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'about' && (
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 600, color: '#141414' }}>
                Deal Information
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                {keyInfoFields.map((field, index) => (
                  <div key={index}>
                    <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px', fontWeight: 500 }}>
                      {field.label}
                    </div>
                    <div style={{ fontSize: '14px', color: '#141414', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {field.value}
                      {field.copyable && (
                        <button
                          onClick={() => navigator.clipboard.writeText(field.value)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#6c757d',
                          }}
                        >
                          <Copy size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#141414' }}>
                  Activity
                </h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setActivityFilter('activity')}
                    style={{
                      padding: '6px 12px',
                      border: 'none',
                      background: activityFilter === 'activity' ? '#0d6efd' : 'transparent',
                      color: activityFilter === 'activity' ? '#ffffff' : '#6c757d',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    All Activity
                  </button>
                  <button
                    onClick={() => setActivityFilter('notes')}
                    style={{
                      padding: '6px 12px',
                      border: 'none',
                      background: activityFilter === 'notes' ? '#0d6efd' : 'transparent',
                      color: activityFilter === 'notes' ? '#ffffff' : '#6c757d',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    Notes
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} />
                  <input
                    type="text"
                    placeholder="Search activity..."
                    value={searchActivity}
                    onChange={(e) => setSearchActivity(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 40px',
                      border: '1px solid #eaf0f6',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  />
                </div>
              </div>
              {activitiesData.map(activity => renderActivityItem(activity))}
            </div>
          )}

          {activeTab === 'notes' && (
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 600, color: '#141414' }}>
                Notes
              </h2>
              <textarea
                placeholder="Add a note about this deal..."
                style={{
                  width: '100%',
                  minHeight: '200px',
                  padding: '12px',
                  border: '1px solid #eaf0f6',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
              />
              <button
                style={{
                  marginTop: '12px',
                  padding: '10px 20px',
                  backgroundColor: '#0d6efd',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                Save Note
              </button>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div style={{
          width: '320px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}>
          {/* Key Information */}
          <div style={{
            backgroundColor: '#ffffff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#141414' }}>
                Key Information
              </h3>
              <button
                onClick={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: '#6c757d',
                }}
              >
                {isRightSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
            {!isRightSidebarCollapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {keyInfoFields.slice(0, 4).map((field, index) => (
                  <div key={index}>
                    <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>
                      {field.label}
                    </div>
                    <div style={{ fontSize: '14px', color: '#141414', fontWeight: 500 }}>
                      {field.value}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

DealApprovedRecordPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default DealApprovedRecordPage;

