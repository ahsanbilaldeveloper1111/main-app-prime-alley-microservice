import React, { useState, useRef, useEffect, ReactElement } from 'react';
import { useRouter } from 'next/router';
import {
  ChevronDown, ChevronRight, ChevronLeft, Mail, Phone, MoreHorizontal,
  Calendar, ClipboardList, ExternalLink, Copy, RefreshCw,
  ThumbsUp, ThumbsDown, Sparkles, FileText, Paperclip,
  AlertCircle, ShoppingCart, Handshake
} from 'lucide-react';
import Layout from "@layout/index";
import { getDeal, type DealData } from '@utils/crm';
import { usePermissions } from '@utils/permissionUtils';
import { HEADER_CONSTANTS } from '@constants/headerConstants';
import CrmActivitiesPanel from '@components/CrmActivitiesPanel';
import { useCrmActivityModals } from '@hooks/useCrmActivityModals';

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

const DealRecordPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { id: dealId } = router.query;
  const { hasPermission } = usePermissions();
  const canSendWhatsApp = hasPermission(HEADER_CONSTANTS.PERMISSIONS.SEND_WHATSAPP_MESSAGE_CRM);

  const [deal, setDeal] = useState<DealData | null>(null);
  const [dealLoading, setDealLoading] = useState(true);
  const [dealError, setDealError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('about');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showMoreActivities, setShowMoreActivities] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const moreActivitiesRef = useRef<HTMLDivElement>(null);

  // Load deal by ID from URL
  useEffect(() => {
    if (!router.isReady || dealId == null || dealId === '') {
      setDealLoading(false);
      return;
    }
    const id = Number(dealId);
    if (Number.isNaN(id)) {
      setDealError('Invalid deal ID');
      setDealLoading(false);
      return;
    }
    setDealLoading(true);
    setDealError(null);
    getDeal(id)
      .then((data: DealData) => {
        setDeal(data);
        setDealError(null);
      })
      .catch(() => {
        setDeal(null);
        setDealError('Failed to load deal');
      })
      .finally(() => {
        setDealLoading(false);
      });
  }, [router.isReady, dealId]);

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

  const subscriptionsData: SubscriptionItem[] = [
    {
      id: '1',
      name: 'Connect Pro',
      status: 'active',
      nextBillingDate: '03/13/2026',
      nextPaymentAmount: '$500.00',
      contactEmail: 'ahmad@gmail.com',
      link: '#',
    },
  ];

  const revenueSections: RevenueSection[] = [
    {
      id: 'quotes',
      title: 'Quotes',
      count: 0,
      description: 'Track the sales documents associated with this record.',
      buttonText: 'Create quote',
      buttonIcon: FileText,
      onButtonClick: () => console.log('Create quote'),
      addButtonText: 'Add',
      onAddClick: () => console.log('Add quote'),
    },
    {
      id: 'invoices',
      title: 'Invoices',
      count: 0,
      description: 'Send your customer a request for payment and associate it with this record.',
      buttonText: 'Set up payments',
      onButtonClick: () => console.log('Set up payments'),
      addButtonText: 'Add',
      onAddClick: () => console.log('Add invoice'),
    },
    {
      id: 'payment-links',
      title: 'Payment Links',
      count: 0,
      description: 'Add a payment link to accept a payment and associate it with this record.',
      buttonText: 'Set up payments',
      onButtonClick: () => console.log('Set up payments'),
      addButtonText: 'Add',
      onAddClick: () => console.log('Add payment link'),
    },
    {
      id: 'subscriptions',
      title: 'Subscriptions',
      count: 1,
      description: '',
      buttonText: '',
      items: subscriptionsData,
      onButtonClick: () => console.log('Subscriptions'),
      addButtonText: 'Add',
      onAddClick: () => console.log('Add subscription'),
    },
    {
      id: 'payments',
      title: 'Payments',
      count: 0,
      description: 'Track payments associated with this record. A payment is created when a customer pays or a recurring payment is processed.',
      buttonText: 'Set up payments',
      onButtonClick: () => console.log('Set up payments'),
    },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDealAmount = (d: DealData | null) => {
    if (!d) return '--';
    const curr = d.currency ?? '';
    const val = d.net_value ?? d.grand_total ?? '';
    return val ? `${curr} ${val}` : '--';
  };
  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '--';

  // Tabs
  const tabs = [
    { id: 'about', label: 'About' },
    { id: 'activities', label: 'Activities' },
    { id: 'revenue', label: 'Revenue' },
    { id: 'intelligence', label: 'Intelligence' },
  ];

  // Key Information Fields - from deal API
  const keyInfoFields: KeyInfoField[] = [
    { label: 'Deal Value', value: formatDealAmount(deal), copyable: true },
    { label: 'Stage', value: deal?.stage?.name ?? deal?.status ?? '--' },
    { label: 'Probability', value: deal != null ? `${deal.probability ?? 0}%` : '--' },
    { label: 'Expected Close Date', value: formatDate(deal?.expected_close_date) },
    { label: 'Deal Type', value: deal?.deal_type ?? '--' },
    { label: 'Company Name', value: deal?.company_name ?? '--' },
    { label: 'Deal Owner', value: deal?.assigned_to ?? '--' },
  ];

  // Normalize deal for CrmActivitiesPanel
  const dealRecord = deal
    ? {
        id: deal.id,
        data: {
          id: deal.id,
          name: deal.name,
          phone: deal.decision_maker_phone ?? (deal as any).phone ?? null,
          data: {},
        },
      }
    : null;

  const dealRecordId = Number(dealId) || deal?.id || 0;
  const dealRecordName = deal?.name ?? 'Deal';
  const dealRecordEmail = (deal as any)?.decision_maker_email ?? (deal as any)?.contact_email ?? '';

  const dealRecordPhone = deal?.decision_maker_phone ?? (deal as any)?.phone ?? '';

  const activityModals = useCrmActivityModals({
    recordType: 'deal',
    recordId: dealRecordId,
    recordName: dealRecordName,
    recordEmail: dealRecordEmail,
    recordPhone: dealRecordPhone,
  });

  const renderIntelligenceTab = () => {
    return (
      <div>
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #eaf0f6',
          borderRadius: '5px',
          padding: '20px',
          marginBottom: '20px',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '20px',
            marginBottom: '16px',
          }}>
            <div>
              <div style={{
                fontSize: '13px',
                color: '#7c98b6',
                marginBottom: '6px',
              }}>
                Deal Stage
              </div>
              <div style={{
                fontSize: '14px',
                color: '#141414',
                fontWeight: '400',
              }}>
                {deal?.stage?.name ?? deal?.status ?? '--'}
              </div>
            </div>
            <div>
              <div style={{
                fontSize: '13px',
                color: '#7c98b6',
                marginBottom: '6px',
              }}>
                Related Company
              </div>
              <span style={{
                fontSize: '14px',
                color: '#006162',
                fontWeight: '500',
              }}>
                {deal?.company_name ?? '--'}
              </span>
            </div>
            <div>
              <div style={{
                fontSize: '13px',
                color: '#7c98b6',
                marginBottom: '6px',
              }}>
                Deal Value
              </div>
              <div style={{
                fontSize: '14px',
                color: '#141414',
                fontWeight: '400',
              }}>
                {formatDealAmount(deal)}
              </div>
            </div>
            <div>
              <div style={{
                fontSize: '13px',
                color: '#7c98b6',
                marginBottom: '6px',
              }}>
                Probability
              </div>
              <div style={{
                fontSize: '14px',
                color: '#141414',
                fontWeight: '400',
              }}>
                {deal != null ? `${deal.probability ?? 0}%` : '--'}
              </div>
            </div>
            <div>
              <div style={{
                fontSize: '13px',
                color: '#7c98b6',
                marginBottom: '6px',
              }}>
                Expected Close Date
              </div>
              <div style={{
                fontSize: '14px',
                color: '#141414',
                fontWeight: '400',
              }}>
                {formatDate(deal?.expected_close_date)}
              </div>
            </div>
            <div>
              <div style={{
                fontSize: '13px',
                color: '#7c98b6',
                marginBottom: '6px',
              }}>
                Deal Type
              </div>
              <div style={{
                fontSize: '14px',
                color: '#141414',
                fontWeight: '400',
              }}>
                {deal?.deal_type ?? '--'}
              </div>
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #eaf0f6',
            borderRadius: '5px',
            padding: '20px',
          }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '13px',
                color: '#7c98b6',
                marginBottom: '6px',
              }}>
                Industry
              </div>
              <div style={{
                fontSize: '14px',
                color: '#141414',
                fontWeight: '400',
              }}>
                {deal?.industry ?? '--'}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '13px',
                color: '#7c98b6',
                marginBottom: '6px',
              }}>
                Company description
              </div>
              <div style={{
                fontSize: '14px',
                color: '#141414',
                fontWeight: '400',
              }}>
                {deal?.company_name ? `${deal.company_name} deal` : '--'}
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #eaf0f6',
            borderRadius: '5px',
            padding: '20px',
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#141414',
              margin: '0 0 16px 0',
            }}>
              Deal Information
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '13px',
                color: '#7c98b6',
                marginBottom: '6px',
              }}>
                Deal Owner
              </div>
              <div style={{
                fontSize: '14px',
                color: '#141414',
                fontWeight: '400',
              }}>
                {deal?.assigned_to ?? '--'}
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '20px',
            }}>
              <div>
                <div style={{
                  fontSize: '13px',
                  color: '#7c98b6',
                  marginBottom: '6px',
                }}>
                  Approval Status
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#141414',
                  fontWeight: '400',
                }}>
                  {deal?.is_lost ? 'Lost' : (deal?.status ?? '--')}
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: '13px',
                  color: '#7c98b6',
                  marginBottom: '6px',
                }}>
                  Currency
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#141414',
                  fontWeight: '400',
                }}>
                  {deal?.currency ?? '--'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRevenueSection = (section: RevenueSection) => {
    return (
      <div
        key={section.id}
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #eaf0f6',
          borderRadius: '5px',
          padding: '20px',
          marginBottom: '16px',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: section.items ? '16px' : '12px',
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#141414',
            margin: 0,
          }}>
            {section.title} ({section.count})
          </h3>
          {section.addButtonText && (
            <button
              onClick={section.onAddClick}
              style={{
                padding: '6px 12px',
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '14px',
                fontWeight: '500',
                color: '#006162',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none';
              }}
            >
              +{section.addButtonText}
              <ChevronDown size={14} />
            </button>
          )}
        </div>
  
        {section.items && section.items.length > 0 ? (
          <>
            {section.items.map(item => (
              <div
                key={item.id}
                style={{
                  padding: '16px',
                  backgroundColor: '#f7fafc',
                  border: '1px solid #eaf0f6',
                  borderRadius: '5px',
                  marginBottom: '12px',
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  marginBottom: '12px',
                }}>
                  <FileText size={18} color="#7c98b6" />
                  <a
                    href={item.link}
                    style={{
                      fontSize: '15px',
                      fontWeight: '600',
                      color: '#006162',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.textDecoration = 'underline';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.textDecoration = 'none';
                    }}
                  >
                    {item.name}
                  </a>
                </div>
  
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  fontSize: '14px',
                }}>
                  <div>
                    <span style={{ color: '#141414' }}>Status: </span>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#141414',
                    }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: item.status === 'active' ? '#10b981' : '#ef4444',
                        display: 'inline-block',
                      }} />
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </div>
                  <div style={{ color: '#141414' }}>
                    Next billing date: {item.nextBillingDate}
                  </div>
                  <div style={{ color: '#141414' }}>
                    Next payment amount: {item.nextPaymentAmount}
                  </div>
                  <div>
                    <span style={{ color: '#141414' }}>Contact email: </span>
                    <a
                      href={`mailto:${item.contactEmail}`}
                      style={{
                        color: '#006162',
                        textDecoration: 'none',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.textDecoration = 'underline';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.textDecoration = 'none';
                      }}
                    >
                      {item.contactEmail}
                    </a>
                    <ExternalLink size={12} style={{ marginLeft: '4px', display: 'inline' }} />
                  </div>
                </div>
              </div>
            ))}
  
            <button
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                border: '1px solid #cbd5e0',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#141414',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f7fafc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              View all associated {section.title}
              <ExternalLink size={14} />
            </button>
          </>
        ) : (
          <>
            <p style={{
              fontSize: '14px',
              color: '#141414',
              lineHeight: '1.6',
              marginBottom: '16px',
            }}>
              {section.description}
            </p>
  
            {section.buttonText && (
              <button
                onClick={section.onButtonClick}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: '1px solid #cbd5e0',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#141414',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f7fafc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {section.buttonIcon && <section.buttonIcon size={16} />}
                {section.buttonText}
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  // ============================================================================
  // LEFT SIDEBAR (Deal Info)
  // ============================================================================

  const renderLeftSidebar = () => (
    <div className="sidebar-scrollbar" style={{
      width: '385px',
      backgroundColor: '#f0f0f0',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      flexShrink: 0,
      overflowY: 'auto',
      marginRight: '10px',
    }}>
      <div style={{
        padding: '10px 0px',
        borderRadius: '10px',
        backgroundColor: '#ffffff',
        marginBottom: '12px',
        border: '1px solid #cccccc',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '10px',
          borderBottom: '1px solid #cccccc',
          paddingLeft: '24px',
          paddingRight: '24px',
        }}>
          <button
            onClick={() => window.history.back()}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: '#141414',
              fontWeight: '500',
            }}
          >
            <ChevronDown size={16} style={{ transform: 'rotate(90deg)' }} />
            Deals
          </button>

          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              onClick={() => setShowActionsDropdown(!showActionsDropdown)}
              style={{
                padding: '6px 14px',
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '14px',
                fontWeight: '500',
                color: '#141414',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '3px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f8fa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Actions
              <ChevronDown size={14} />
            </button>

            {showActionsDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '5px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                minWidth: '180px',
                zIndex: 1000,
                overflow: 'hidden',
              }}>
                {['Edit', 'Delete', 'Clone', 'Export'].map((action) => (
                  <button
                    key={action}
                    onClick={() => setShowActionsDropdown(false)}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      fontSize: '14px',
                      color: '#141414',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f7fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{
          paddingTop: '16px',
          paddingBottom: '0px',
          paddingLeft: '24px',
          paddingRight: '24px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: '12px',
          }}>
            <div style={{
              width: '40px',
              height: '37px',
              borderRadius: '26px',
              background: '#e3f2fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: '400',
              color: '#141414',
              flexShrink: 0,
            }}>
              <Handshake size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{
                fontSize: '22px',
                fontWeight: '500',
                color: '#141414',
                margin: '0 0 4px 0',
                lineHeight: '1.3',
              }}>
                {deal?.name ?? 'Unknown'}
              </h2>
              <p style={{
                fontSize: '14px',
                color: '#718096',
                margin: '0 0 8px 0',
                lineHeight: '1.4',
              }}>
                {formatDealAmount(deal)} • {deal?.stage?.name ?? deal?.status ?? '--'}
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{
                  fontSize: '14px',
                  color: '#718096',
                }}>
                  Expected Close: {formatDate(deal?.expected_close_date)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '17px',
          paddingTop: '6px',
          paddingBottom: '4px',
          paddingLeft: '24px',
          paddingRight: '24px',
        }}>
          {[
            { icon: ClipboardList, label: 'Note', disabled: false, onClick: activityModals.openNote },
            { icon: Mail, label: 'Email', disabled: false, onClick: activityModals.openEmail },
            { icon: Phone, label: 'Call', disabled: false, onClick: undefined },
            { icon: ClipboardList, label: 'Task', disabled: false, onClick: activityModals.openTask },
            { icon: Calendar, label: 'Meeting', disabled: false, onClick: activityModals.openMeeting },
          ].map((action, index) => {
            const Icon = action.icon;
            return (
              <div key={index} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
              }}>
                <button
                  type="button"
                  disabled={action.disabled}
                  onClick={action.onClick}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '9px 7px',
                    background: '#ffffff',
                    border: '1px solid #8a8a8a',
                    borderRadius: '50%',
                    cursor: action.disabled ? 'not-allowed' : 'pointer',
                    width: '30px',
                    height: '30px',
                    color: '#141414',
                  }}
                >
                  <Icon size={20} />
                </button>
                <span style={{
                  fontSize: '12px',
                  color: '#141414',
                  fontWeight: '300',
                }}>
                  {action.label}
                </span>
              </div>
            );
          })}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            position: 'relative',
          }} ref={moreActivitiesRef}>
            <button
              onClick={() => setShowMoreActivities(!showMoreActivities)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '9px 7px',
                background: '#ffffff',
                border: '1px solid #8a8a8a',
                borderRadius: '50%',
                cursor: 'pointer',
                width: '30px',
                height: '30px',
                color: '#141414',
              }}
            >
              <MoreHorizontal size={20} />
            </button>
            <span style={{
              fontSize: '12px',
              color: '#141414',
              fontWeight: '300',
            }}>
              More
            </span>

            {showMoreActivities && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '5px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                minWidth: '150px',
                zIndex: 1000,
              }}>
                {[
                  { label: 'Message', onClick: activityModals.openSms },
                  { label: 'Task', onClick: activityModals.openTask },
                  { label: 'WhatsApp', onClick: activityModals.openWhatsApp },
                ].map(({ label, onClick }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setShowMoreActivities(false);
                      onClick();
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      fontSize: '14px',
                      color: '#141414',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f7fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '5px',
        marginBottom: '12px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
        border: '1px solid #cccccc',
      }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            cursor: 'pointer',
            backgroundColor: '#ffffff',
            borderBottom: collapsedSections.has('key-info') ? 'none' : '1px solid #cccccc',
          }}
          onClick={() => toggleSection('key-info')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ChevronDown
              size={18}
              style={{
                color: '#141414',
                transform: collapsedSections.has('key-info') ? 'rotate(-90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            />
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#141414',
              margin: 0,
            }}>
              Key information
            </h3>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '6px',
              cursor: 'pointer',
              color: '#141414',
              fontSize: '14px',
              fontWeight: '500',
              borderRadius: '3px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f8fa';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Actions
          </button>
        </div>

        {!collapsedSections.has('key-info') && (
          <div style={{ padding: '20px' }}>
            {keyInfoFields.map((field, index) => (
              <div key={index} style={{ marginBottom: '16px' }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '400',
                  color: '#666',
                  marginBottom: '4px',
                }}>
                  {field.label}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}>
                  <div style={{
                    fontSize: '14px',
                    color: '#141414',
                    fontWeight: '400',
                    flex: 1,
                  }}>
                    {field.value}
                  </div>
                  {field.copyable && (
                    <button
                      onClick={() => copyToClipboard(field.value)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '4px',
                        cursor: 'pointer',
                        color: '#141414',
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '3px',
                      }}
                      title="Copy"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f5f8fa';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Copy size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ============================================================================
  // MAIN CONTENT (Center with Tabs)
  // ============================================================================

  const renderMainContent = () => (
    <div style={{
      flex: 1,
      backgroundColor: 'transparent',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      marginLeft: '6px',
      marginRight: '6px',
      borderTop: '1px solid #cccccc',
      borderRadius: '10px',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${tabs.length}, 1fr)`,
        backgroundColor: '#f5f8fa',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        gap: '0',
        borderLeft: '1px solid #cccccc',
        borderRight: '1px solid #cccccc',
        borderRadius: '10px 10px 0 0',
      }}>
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '14px 20px',
              backgroundColor: activeTab === tab.id ? '#ffffff' : '#f5f5f5',
              border: 'none',
              borderRight: index < tabs.length - 1 ? '1px solid #cbd5e0' : 'none',
              borderBottom: activeTab === tab.id ? '1px solid #ffffff' : '1px solid #cbd5e0',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? '600' : '400',
              color: activeTab === tab.id ? '#141414' : '#141414',
              transition: 'all 0.2s',
              textAlign: 'center',
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.backgroundColor = '#eaf0f6';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.backgroundColor = '#f5f8fa';
              }
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '14px 0', flex: 1 }}>
        {activeTab === 'about' && (
          <>
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #cccccc',
              borderRadius: '10px',
              marginBottom: '20px',
              overflow: 'hidden',
            }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  cursor: 'pointer',
                  borderBottom: collapsedSections.has('breeze') ? 'none' : '1px solid #eaf0f6',
                }}
                onClick={() => toggleSection('breeze')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ChevronDown
                    size={18}
                    style={{
                      color: '#141414',
                      transform: collapsedSections.has('breeze') ? 'rotate(-90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#141414',
                    margin: 0,
                  }}>
                    Breeze record summary
                  </h3>
                  <div style={{
                    padding: '3px 10px',
                    background: 'linear-gradient(114deg, rgb(255, 56, 66) 0%, rgb(210, 6, 136) 100%)',
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                  }}>
                    AI
                  </div>
                </div>
              </div>

              {!collapsedSections.has('breeze') && (
                <div style={{ padding: '20px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    color: '#141414',
                    marginBottom: '12px',
                  }}>
                    <span>Generated Feb 14, 2026</span>
                    <button
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '2px',
                        cursor: 'pointer',
                        color: '#141414',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Refresh"
                    >
                      <RefreshCw size={12} />
                    </button>
                  </div>

                  <div style={{
                    fontSize: '14px',
                    color: '#141414',
                    lineHeight: '1.6',
                    marginBottom: '16px',
                    border: '1px solid #ff9fcc',
                    padding: '18px 20px',
                    borderRadius: '10px',
                  }}>
                    {deal?.name ?? 'This deal'} for {deal?.company_name ?? 'N/A'} is currently in the {deal?.stage?.name ?? deal?.status ?? 'N/A'} stage with a value of {formatDealAmount(deal)} and a {deal?.probability ?? 0}% probability of closing. The expected close date is {formatDate(deal?.expected_close_date)}. The deal owner is {deal?.assigned_to ?? 'N/A'}. Recommended next steps: prepare presentation materials, schedule final negotiation meeting, and ensure all stakeholders are aligned before the expected close date.
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    paddingTop: '12px',
                    borderTop: '1px solid #fee',
                  }}>
                    <button
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '6px',
                        cursor: 'pointer',
                        color: '#141414',
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '3px',
                      }}
                      title="Good summary"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f7fafc';
                        e.currentTarget.style.color = '#2d3748';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#141414';
                      }}
                    >
                      <ThumbsUp size={16} />
                    </button>
                    <button
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '6px',
                        cursor: 'pointer',
                        color: '#141414',
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '3px',
                      }}
                      title="Bad summary"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f7fafc';
                        e.currentTarget.style.color = '#2d3748';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#141414';
                      }}
                    >
                      <ThumbsDown size={16} />
                    </button>
                    <button
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '6px',
                        cursor: 'pointer',
                        color: '#141414',
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '3px',
                      }}
                      title="Copy"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f7fafc';
                        e.currentTarget.style.color = '#2d3748';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#141414';
                      }}
                    >
                      <Copy size={16} />
                    </button>
                  </div>

                  <button
                    style={{
                      marginTop: '16px',
                      padding: '6px 16px',
                      backgroundColor: 'transparent',
                      border: '1px solid #d20688',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#d20688',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fff5f7';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Sparkles size={16} />
                    Ask a question
                  </button>
                </div>
              )}
            </div>

            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #cccccc',
              borderRadius: '10px',
              marginBottom: '20px',
            }}>
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #eaf0f6',
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#141414',
                  margin: 0,
                }}>
                  Deal profile
                </h3>
              </div>

              <div style={{ padding: '20px' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '20px',
                }}>
                  {[
                    { label: 'Deal Name', value: deal?.name ?? '--' },
                    { label: 'Company Name', value: deal?.company_name ?? '--' },
                    { label: 'Deal Value', value: formatDealAmount(deal) },
                    { label: 'Stage', value: deal?.stage?.name ?? deal?.status ?? '--' },
                    { label: 'Probability', value: deal != null ? `${deal.probability ?? 0}%` : '--' },
                    { label: 'Expected Close Date', value: formatDate(deal?.expected_close_date) },
                    { label: 'Deal Type', value: deal?.deal_type ?? '--' },
                    { label: 'Deal Owner', value: deal?.assigned_to ?? '--' },
                  ].map((field, index) => (
                    <div key={index}>
                      <div style={{
                        fontSize: '13px',
                        color: '#666666',
                        marginBottom: '4px',
                      }}>
                        {field.label}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#141414',
                      }}>
                        {field.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'activities' && (
          <CrmActivitiesPanel
            recordType="deal"
            recordId={dealRecordId}
            record={dealRecord}
            recordLoading={dealLoading}
            recordName={dealRecordName}
            canSendWhatsApp={canSendWhatsApp}
            {...activityModals.crmActivitiesPanelProps}
          />
        )}

        {activeTab === 'revenue' && (
          <div>
            <div style={{
              marginBottom: '24px',
            }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                  cursor: 'pointer',
                }}
                onClick={() => toggleSection('quote-to-cash')}
              >
                <ChevronDown
                  size={20}
                  style={{
                    color: '#141414',
                    transform: collapsedSections.has('quote-to-cash') ? 'rotate(-90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                />
                <h2 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#141414',
                  margin: 0,
                }}>
                  Quote-to-cash
                </h2>
              </div>

              {!collapsedSections.has('quote-to-cash') && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                  gap: '16px',
                }}>
                  {revenueSections.slice(0, 5).map(section => renderRevenueSection(section))}
                </div>
              )}
            </div>

            <div style={{
              marginBottom: '24px',
            }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                  cursor: 'pointer',
                }}
                onClick={() => toggleSection('e-commerce')}
              >
                <ChevronDown
                  size={20}
                  style={{
                    color: '#141414',
                    transform: collapsedSections.has('e-commerce') ? 'rotate(-90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                />
                <h2 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#141414',
                  margin: 0,
                }}>
                  e-Commerce
                </h2>
              </div>

              {!collapsedSections.has('e-commerce') && (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  backgroundColor: '#f7fafc',
                  borderRadius: '5px',
                  border: '1px solid #eaf0f6',
                }}>
                  <ShoppingCart size={48} style={{ marginBottom: '16px', color: '#cbd5e0' }} />
                  <p style={{
                    fontSize: '14px',
                    color: '#7c98b6',
                    margin: 0,
                  }}>
                    No e-commerce data available
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'intelligence' && renderIntelligenceTab()}
      </div>
    </div>
  );

  // ============================================================================
  // RIGHT SIDEBAR (Associated Records)
  // ============================================================================

  const renderRightSidebar = () => (
    <div style={{
      position: 'relative',
      width: isRightSidebarCollapsed ? '0px' : '385px',
      marginLeft: isRightSidebarCollapsed ? '0px' : '10px',
      flexShrink: 0,
      transition: 'width 0.3s ease, margin-left 0.3s ease',
    }}>
      <button
        onClick={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
        style={{
          position: 'fixed',
          top: '100px',
          right: isRightSidebarCollapsed ? '10px' : 'calc(395px)',
          zIndex: 101,
          backgroundColor: '#ffffff',
          border: '1px solid #8a8a8a',
          borderRadius: '30px',
          padding: '3px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f5f8fa';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#ffffff';
        }}
        title={isRightSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isRightSidebarCollapsed ? (
          <ChevronLeft size={20} style={{ color: '#141414' }} />
        ) : (
          <ChevronRight size={20} style={{ color: '#141414' }} />
        )}
      </button>

      {!isRightSidebarCollapsed && (
        <div className="sidebar-scrollbar" style={{
          width: '100%',
          backgroundColor: '#f0f0f0',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflowY: 'auto',
          padding: '0',
          borderRadius: '10px',
        }}>
          <div style={{ paddingTop: '0px', paddingBottom: '0' }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              marginBottom: '12px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
              border: '1px solid #cccccc',
            }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 20px 0',
                  cursor: 'pointer',
                  backgroundColor: '#ffffff',
                }}
                onClick={() => toggleSection('companies')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                  <ChevronDown
                    size={18}
                    style={{
                      color: '#141414',
                      transform: collapsedSections.has('companies') ? 'rotate(-90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#141414',
                    margin: 0,
                    lineHeight: '1.2',
                  }}>
                    Companies ({deal?.company_name ? 1 : 0})
                  </h3>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#141414',
                    fontSize: '12px',
                    fontWeight: '500',
                    padding: '6px',
                    borderRadius: '3px',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f8fa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: '300' }}>+</span> <span style={{ fontSize: '12px', fontWeight: '500' }}>Add</span>
                </button>
              </div>

              {!collapsedSections.has('companies') && (
                <div style={{ padding: '20px' }}>
                  {deal?.company_name ? (
                    <>
                      <div style={{ marginBottom: '16px', border: '1px solid #cccccc', borderRadius: '10px', padding: '15px' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '8px',
                        }}>
                          <span style={{
                            fontSize: '14px',
                            color: '#006162',
                            fontWeight: '500',
                          }}>
                            {deal.company_name}
                          </span>
                          <span style={{
                            padding: '2px 8px',
                            backgroundColor: '#e6f3ff',
                            color: '#006162',
                            borderRadius: '3px',
                            fontSize: '11px',
                            fontWeight: '600',
                          }}>
                            Primary
                          </span>
                        </div>
                        {deal.industry && (
                          <p style={{
                            fontSize: '13px',
                            color: '#666666',
                            margin: '4px 0',
                          }}>
                            Industry: {deal.industry}
                          </p>
                        )}
                      </div>
                      <a
                        href="#"
                        style={{
                          fontSize: '12px',
                          color: '#141414',
                          textDecoration: 'none',
                          fontWeight: '300',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          border: '1px solid #cccccc',
                          borderRadius: '6px',
                          padding: '6px 12px',
                        }}
                      >
                        View all associated Companies
                        <ExternalLink size={12} />
                      </a>
                    </>
                  ) : (
                    <p style={{ fontSize: '13px', color: '#666666', margin: 0 }}>No companies associated.</p>
                  )}
                </div>
              )}
            </div>

            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              marginBottom: '12px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
              border: '1px solid #cccccc',
            }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 20px 0',
                  cursor: 'pointer',
                  backgroundColor: '#ffffff',
                }}
                onClick={() => toggleSection('contacts')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                  <ChevronDown
                    size={18}
                    style={{
                      color: '#141414',
                      transform: collapsedSections.has('contacts') ? 'rotate(-90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#141414',
                    margin: 0,
                    lineHeight: '1.2',
                  }}>
                    Contacts ({deal?.decision_maker_name ?? deal?.decision_maker_email ? 1 : 0})
                  </h3>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#141414',
                    fontSize: '12px',
                    fontWeight: '500',
                    padding: '6px',
                    borderRadius: '3px',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f8fa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: '300' }}>+</span> <span style={{ fontSize: '12px', fontWeight: '500' }}>Add</span>
                </button>
              </div>

              {!collapsedSections.has('contacts') && (
                <div style={{ padding: '20px' }}>
                  {(deal?.decision_maker_name ?? deal?.decision_maker_email ?? (deal as any)?.main_decision_maker?.name) ? (
                    <>
                      <div style={{ marginBottom: '16px', border: '1px solid #cccccc', borderRadius: '10px', padding: '15px' }}>
                        <span style={{
                          fontSize: '14px',
                          color: '#006162',
                          fontWeight: '500',
                          display: 'block',
                          marginBottom: '8px',
                        }}>
                          {deal?.decision_maker_name ?? (deal as any)?.main_decision_maker?.name ?? 'Contact'}
                        </span>
                        <p style={{
                          fontSize: '13px',
                          color: '#666666',
                          margin: '4px 0',
                        }}>
                          Email: {deal?.decision_maker_email ?? (deal as any)?.main_decision_maker?.email ?? '--'}
                        </p>
                        <p style={{
                          fontSize: '13px',
                          color: '#666666',
                          margin: '4px 0',
                        }}>
                          Phone: {[deal?.decision_maker_phone_country_code, deal?.decision_maker_phone].filter(Boolean).join(' ') || (deal as any)?.main_decision_maker?.phone || '--'}
                        </p>
                      </div>
                      <a
                        href="#"
                        style={{
                          fontSize: '12px',
                          color: '#141414',
                          textDecoration: 'none',
                          fontWeight: '300',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          border: '1px solid #cccccc',
                          borderRadius: '6px',
                          padding: '6px 12px',
                        }}
                      >
                        View all associated Contacts
                        <ExternalLink size={12} />
                      </a>
                    </>
                  ) : (
                    <p style={{ fontSize: '13px', color: '#666666', margin: 0 }}>No contacts associated.</p>
                  )}
                </div>
              )}
            </div>

            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              marginBottom: '12px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
              border: '1px solid #cccccc',
            }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 20px 0',
                  cursor: 'pointer',
                  backgroundColor: '#ffffff',
                }}
                onClick={() => toggleSection('attachments')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                  <ChevronDown
                    size={18}
                    style={{
                      color: '#141414',
                      transform: collapsedSections.has('attachments') ? 'rotate(-90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#141414',
                    margin: 0,
                    lineHeight: '1.2',
                  }}>
                    Attachments ({deal?.attachments?.length ?? 0})
                  </h3>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#141414',
                    fontSize: '14px',
                    fontWeight: '500',
                    padding: '6px',
                    borderRadius: '3px',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f8fa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: '300' }}>+</span> <span style={{ fontSize: '12px', fontWeight: '500' }}>Add</span>
                </button>
              </div>

              {!collapsedSections.has('attachments') && (
                <div style={{ padding: '20px' }}>
                  {(deal?.attachments?.length ?? 0) > 0 ? (
                    <>
                      {deal!.attachments!.map((att: any) => (
                        <div
                          key={att.id}
                          style={{
                            marginBottom: '12px',
                            border: '1px solid #cccccc',
                            borderRadius: '8px',
                            padding: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <Paperclip size={18} style={{ color: '#718096' }} />
                          <a
                            href={att.file_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: '14px',
                              color: '#006162',
                              textDecoration: 'none',
                              fontWeight: '500',
                            }}
                          >
                            {att.file_path?.split('/').pop() ?? `Attachment ${att.id}`}
                          </a>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div style={{
                      padding: '32px 20px',
                      textAlign: 'center',
                    }}>
                      <Paperclip size={48} style={{ color: '#cbd5e0', marginBottom: '16px' }} />
                      <p style={{
                        fontSize: '14px',
                        color: '#718096',
                        margin: 0,
                        lineHeight: '1.6',
                      }}>
                        No attachments yet
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (dealLoading) {
    return (
      <Layout>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 120px)',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <RefreshCw size={32} style={{ color: '#006162', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: '14px', color: '#718096' }}>Loading deal...</p>
        </div>
      </Layout>
    );
  }

  if (dealError || (!dealId && !deal)) {
    return (
      <Layout>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 120px)',
          flexDirection: 'column',
          gap: '12px',
          padding: '24px',
        }}>
          <AlertCircle size={48} style={{ color: '#e53e3e' }} />
          <p style={{ fontSize: '16px', color: '#141414', fontWeight: 500 }}>
            {dealError || 'No deal selected'}
          </p>
          <button
            onClick={() => router.push('/crm/deals')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#006162',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Back to deals
          </button>
        </div>
      </Layout>
    );
  }

  if (!deal) {
    return null;
  }

  return (
    <>
      <style>
        {`
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }

          ::-webkit-scrollbar-track {
            background: #f7fafc;
          }

          ::-webkit-scrollbar-thumb {
            background: #cbd5e0;
            border-radius: 4px;
          }

          ::-webkit-scrollbar-thumb:hover {
            background: #a0aec0;
          }

          .sidebar-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .sidebar-scrollbar::-webkit-scrollbar-track {
            background: #f7fafc;
          }
          .sidebar-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e0;
            border-radius: 4px;
          }
          .sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #a0aec0;
          }
        `}
      </style>

      <div style={{
        display: 'flex',
        width: '100%',
        height: 'calc(100vh - 60px)',
        overflow: 'hidden',
        backgroundColor: 'transparent',
      }}>
        {renderLeftSidebar()}
        {renderMainContent()}
        {renderRightSidebar()}
      </div>

      {activityModals.modals}
    </>
  );
};

DealRecordPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default DealRecordPage;

