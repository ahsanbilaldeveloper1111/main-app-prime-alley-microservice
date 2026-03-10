import React, { useState, useRef, useEffect, ReactElement } from 'react';
import {
  ChevronDown, ChevronRight, ChevronLeft, Mail, Phone, MoreHorizontal,
  Calendar, ClipboardList, ExternalLink, Copy, RefreshCw,
  ThumbsUp, ThumbsDown, Sparkles, FileText, Paperclip,
  ShoppingCart, ShoppingBag, Building2
} from 'lucide-react';
import Layout from "@layout/index";
import { useRouter } from 'next/router';
import CrmIntelligenceTab from "@components/CrmIntelligenceTab";
import CrmAssociatedCompaniesCard from "@components/CrmAssociatedCompaniesCard";
import CrmProfileSection from "@components/CrmProfileSection";
import CrmRecordSummarySection from "@components/CrmRecordSummarySection";
import { getOrder, getDeal, getLead } from "@utils/crm";
import { GetHierarchyData } from "@utils/users";
import { formatDateForTable, ModuleSlug } from "@utils/Helper";
import { toast } from "react-toastify";
import moment from "moment";
import { usePermissions } from '@utils/permissionUtils';
import { HEADER_CONSTANTS } from '@constants/headerConstants';
import CrmActivitiesPanel, { CrmActivitiesRecord, type CrmActivitiesPanelRef } from '@components/CrmActivitiesPanel';
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

const OrderRecordPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { id } = router.query;
  const [activeTab, setActiveTab] = useState('about');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showMoreActivities, setShowMoreActivities] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [relatedDeal, setRelatedDeal] = useState<any>(null);
  const [relatedLead, setRelatedLead] = useState<any>(null);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { hasPermission } = usePermissions();
  const canSendWhatsApp = hasPermission(HEADER_CONSTANTS.PERMISSIONS.SEND_WHATSAPP_MESSAGE_CRM);
  const [tasksRefetch, setTasksRefetch] = useState<(() => void) | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const moreActivitiesRef = useRef<HTMLDivElement>(null);
  const activitiesPanelRef = useRef<CrmActivitiesPanelRef>(null);

  // Open a specific tab when navigating with ?section= (e.g. ?section=activities)
  const validTabIds = ["about", "activities", "revenue", "intelligence"];
  useEffect(() => {
    if (!router.isReady) return;
    const section = router.query.section;
    const tabId =
      typeof section === "string" ? section.toLowerCase().trim() : null;
    if (tabId && validTabIds.includes(tabId)) {
      setActiveTab(tabId);
    }
  }, [router.isReady, router.query.section]);

  // Fetch extensions
  useEffect(() => {
    const fetchExtensions = async () => {
      try {
        const hierarchyData = await GetHierarchyData(ModuleSlug.CRM_ORDERS);
        if (hierarchyData?.extensions) {
          setExtensions(hierarchyData.extensions);
        }
      } catch (error) {
        console.error("Failed to fetch extensions:", error);
      }
    };

    fetchExtensions();
  }, []);

  // Fetch order data
  useEffect(() => {
    const fetchOrderData = async () => {
      if (!router.isReady || !id) return;
      
      try {
        setLoading(true);
        setOrderError(null);
        const order = await getOrder(Number(id));
        setOrderData(order);
        setOrderError(null);

        // Fetch related deal if deal_id exists
        if (order.deal_id) {
          try {
            const dealData = await getDeal(Number(order.deal_id));
            setRelatedDeal(dealData);

            // Fetch related lead if ticket_id exists
            if (dealData.ticket_id) {
              try {
                const leadData = await getLead(Number(dealData.ticket_id));
                setRelatedLead(leadData);
              } catch (error) {
                console.error("Failed to fetch lead:", error);
              }
            }
          } catch (error) {
            console.error("Failed to fetch deal:", error);
          }
        }
      } catch (error) {
        console.error("Failed to fetch order:", error);
        setOrderData(null);
        setOrderError("Failed to load order details");
        toast.error("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [router.isReady, id]);

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
      name: 'Order Subscription',
      status: 'active',
      nextBillingDate: '03/13/2026',
      nextPaymentAmount: orderData?.final_amount || orderData?.total_amount 
        ? `${orderData?.currency || 'AED'} ${parseFloat(String(orderData.final_amount || orderData.total_amount)).toLocaleString()}`
        : '$500.00',
      contactEmail: orderData?.customer_email || 'ahmad@gmail.com',
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
    toast.success('Copied to clipboard');
  };

  // Tabs
  const tabs = [
    { id: 'about', label: 'About' },
    { id: 'activities', label: 'Activities' },
    { id: 'revenue', label: 'Revenue' },
    { id: 'intelligence', label: 'Intelligence' },
  ];

  // Include audit_trail so Activity tab shows order history
  const orderRecord: CrmActivitiesRecord | null = orderData
    ? {
        id: orderData.id,
        data: {
          id: orderData.id,
          name: orderData.order_number || orderData.customer_name || '',
          phone: orderData.customer_phone || '',
          data: orderData,
        },
        audit_trail: orderData.audit_trail ?? [],
      }
    : null;

  const orderRecordId = Number(id) || orderData?.id || 0;
  const orderRecordName = orderData?.order_number || orderData?.customer_name || 'Order';
  const orderRecordEmail = orderData?.customer_email ?? '';

  const orderRecordPhone = orderData?.customer_phone ?? '';

  const activityModals = useCrmActivityModals({
    recordType: 'order',
    recordId: orderRecordId,
    recordName: orderRecordName,
    recordEmail: orderRecordEmail,
    recordPhone: orderRecordPhone,
    onTaskCreated: () => tasksRefetch?.(),
    onNoteCreated: () => activitiesPanelRef.current?.refetchNotes?.(),
    onEmailSent: () => activitiesPanelRef.current?.refetchEmails?.(),
    onMeetingScheduled: () => activitiesPanelRef.current?.refetchMeetings?.(),
  });

  // Key Information Fields - Order specific
  const keyInfoFields: KeyInfoField[] = [
    { 
      label: 'Order Value', 
      value: orderData?.final_amount || orderData?.total_amount 
        ? `${orderData?.currency || 'AED'} ${parseFloat(String(orderData.final_amount || orderData.total_amount)).toLocaleString()}`
        : 'N/A', 
      copyable: true 
    },
    { label: 'Stage', value: orderData?.stage?.name || 'N/A' },
    { label: 'Order Status', value: orderData?.status || 'N/A' },
    { label: 'Order Date', value: orderData?.order_date ? formatDateForTable(orderData.order_date) : 'N/A' },
    { label: 'Expected Delivery', value: orderData?.expected_delivery_date ? formatDateForTable(orderData.expected_delivery_date) : 'N/A' },
    { label: 'Company Name', value: orderData?.customer_name || 'N/A' },
    { label: 'Order Owner', value: extensions.find((ext: any) => ext?.id == orderData?.assigned_to || ext?.extension == orderData?.assigned_to)?.display_name || extensions.find((ext: any) => ext?.id == orderData?.assigned_to || ext?.extension == orderData?.assigned_to)?.name || orderData?.assigned_to || 'N/A' },
  ];

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
  // LEFT SIDEBAR (Order Info)
  // ============================================================================

  const renderLeftSidebar = () => {
    if (loading) {
      return (
        <div className="sidebar-scrollbar" style={{
          width: '385px',
          backgroundColor: '#f0f0f0',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          flexShrink: 0,
          overflowY: 'auto',
          marginRight: '10px',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ fontSize: '16px', color: '#718096' }}>Loading...</div>
        </div>
      );
    }

    return (
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
              onClick={() => router.push('/crm/orders')}
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
              Orders
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
                  {['Edit', 'Delete', 'Export'].map((action) => (
                    <button
                      key={action}
                      onClick={() => {
                        setShowActionsDropdown(false);
                        if (action === 'Edit' && id) {
                          router.push(`/crm/orders/${id}/edit`);
                        }
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
                <ShoppingBag size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{
                  fontSize: '22px',
                  fontWeight: '500',
                  color: '#141414',
                  margin: '0 0 4px 0',
                  lineHeight: '1.3',
                }}>
                  {orderData?.order_number || `Order #${id}` || 'Order'}
                </h2>
                <p style={{
                  fontSize: '14px',
                  color: '#718096',
                  margin: '0 0 8px 0',
                  lineHeight: '1.4',
                }}>
                  {orderData?.final_amount || orderData?.total_amount 
                    ? `${orderData?.currency || 'AED'} ${parseFloat(String(orderData.final_amount || orderData.total_amount)).toLocaleString()}`
                    : 'N/A'} • {orderData?.stage?.name || 'No Stage'}
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
                    {orderData?.expected_delivery_date ? `Expected Delivery: ${formatDateForTable(orderData.expected_delivery_date)}` : 'No delivery date'}
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
              { icon: Mail, label: 'Email', disabled: !orderData?.customer_email, onClick: activityModals.openEmail },
              { icon: Phone, label: 'Call', disabled: !orderData?.customer_phone, onClick: undefined },
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
                    onClick={action.disabled ? undefined : action.onClick}
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
                      color: action.disabled ? '#ccc' : '#141414',
                      opacity: action.disabled ? 0.5 : 1,
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
                    { label: 'SMS', onClick: activityModals.openSms },
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
  };

  // ============================================================================
  // MAIN CONTENT (Center with Tabs)
  // ============================================================================

  const renderMainContent = () => {
    if (loading) {
      return (
        <div style={{
          flex: 1,
          backgroundColor: 'transparent',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          marginLeft: '6px',
          marginRight: '6px',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ fontSize: '16px', color: '#718096' }}>Loading order details...</div>
        </div>
      );
    }

    return (
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
              <CrmRecordSummarySection
                isCollapsed={collapsedSections.has('breeze')}
                onToggle={() => toggleSection('breeze')}
                summary={(orderData as any)?.crm_summary?.summary ?? null}
                metaLabel={
                  (orderData as any)?.crm_summary?.updated_at
                    ? `Updated ${new Date(
                        (orderData as any).crm_summary.updated_at,
                      ).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`
                    : undefined
                }
                onRefreshClick={async () => {
                  const idNum = Number(id || orderData?.id);
                  if (!idNum || Number.isNaN(idNum)) {
                    toast.error('Invalid order ID');
                    return;
                  }
                  try {
                    const refreshed = await getOrder(idNum);
                    setOrderData(refreshed);
                    toast.success('Summary refreshed');
                  } catch {
                    toast.error('Failed to refresh summary');
                  }
                }}
              />

              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #cccccc',
                borderRadius: '10px',
                marginBottom: '20px',
              }}>
                <CrmProfileSection
                  title="Order profile"
                  fields={[
                    {
                      label: "Company name",
                      value:
                        (relatedDeal as any)?.company?.enrichment_data?.structured_data
                          ?.official_company_name ??
                        (relatedDeal as any)?.company?.name ??
                        orderData?.customer_name ??
                        "--",
                    },
                    {
                      label: "Street address",
                      value:
                        (relatedDeal as any)?.company?.enrichment_data?.structured_data
                          ?.headquarters?.address ??
                        (relatedDeal as any)?.company?.address ??
                        (orderData as any)?.billing_address ??
                        (orderData as any)?.shipping_address ??
                        "--",
                    },
                    {
                      label: "City",
                      value:
                        (relatedDeal as any)?.company?.enrichment_data?.structured_data
                          ?.headquarters?.city ??
                        (relatedDeal as any)?.company?.city ??
                        (orderData as any)?.billing_city ??
                        (orderData as any)?.city ??
                        "--",
                    },
                    {
                      label: "Postal code",
                      value:
                        (relatedDeal as any)?.company?.enrichment_data?.structured_data
                          ?.headquarters?.postal_code ??
                        (orderData as any)?.postal_code ??
                        (orderData as any)?.billing_postal_code ??
                        "--",
                    },
                    {
                      label: "State/Region",
                      value:
                        (relatedDeal as any)?.company?.enrichment_data?.structured_data
                          ?.headquarters?.state ??
                        (orderData as any)?.state ??
                        (orderData as any)?.billing_state ??
                        "--",
                    },
                    {
                      label: "Email",
                      value:
                        (relatedDeal as any)?.company?.enrichment_data?.structured_data
                          ?.emails?.[0]?.email ??
                        orderData?.customer_email ??
                        "--",
                      link: true,
                    },
                  ]}
                />
              </div>
            </>
          )}

          {activeTab === 'activities' && (
            <CrmActivitiesPanel
              ref={activitiesPanelRef}
              recordType="order"
              recordId={orderRecordId}
              record={orderRecord}
              recordLoading={loading}
              recordName={orderRecordName}
              canSendWhatsApp={canSendWhatsApp}
              extensions={extensions}
              onTasksRefetchReady={(fn) => setTasksRefetch(() => fn)}
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

          {activeTab === 'intelligence' && (
            <CrmIntelligenceTab
              company={(relatedDeal as any)?.company ?? null}
              relatedCompany={orderData?.customer_name ?? relatedDeal?.company_name ?? '—'}
              industryName={(relatedDeal as any)?.industries?.[0]?.name ?? null}
              industryDescription={(relatedDeal as any)?.industries?.[0]?.description ?? null}
            />
          )}
        </div>
      </div>
    );
  };

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
            {relatedDeal && (
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
                  onClick={() => toggleSection('deals')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                    <ChevronDown
                      size={18}
                      style={{
                        color: '#141414',
                        transform: collapsedSections.has('deals') ? 'rotate(-90deg)' : 'rotate(0deg)',
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
                      Deals (1)
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

                {!collapsedSections.has('deals') && (
                  <div style={{ padding: '20px' }}>
                    <div style={{ marginBottom: '16px', border: '1px solid #cccccc', borderRadius: '10px', padding: '15px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '8px',
                      }}>
                        <a
                          href="#"
                          style={{
                            fontSize: '14px',
                            color: '#006162',
                            textDecoration: 'none',
                            fontWeight: '500',
                          }}
                        >
                          {relatedDeal?.name || 'N/A'}
                        </a>
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
                      <p style={{
                        fontSize: '13px',
                        color: '#666666',
                        margin: '4px 0',
                      }}>
                        Deal Value: {relatedDeal?.net_value || relatedDeal?.grand_total 
                          ? `${relatedDeal?.currency || 'AED'} ${parseFloat(String(relatedDeal.net_value || relatedDeal.grand_total)).toLocaleString()}`
                          : 'N/A'}
                      </p>
                    </div>
                   <a
                     href={`/crm/deals/deals-detailpage?id=${encodeURIComponent(String(relatedDeal?.id ?? ''))}`}
                     target="_blank"
                     rel="noopener noreferrer"
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
                      View all associated Deals
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            )}

            {(() => {
              const company = (relatedDeal as any)?.company ?? null;
              const struct = company?.enrichment_data?.structured_data ?? null;
              const companyName =
                struct?.official_company_name ??
                company?.name ??
                orderData?.customer_name ??
                null;
              const primaryPhone =
                struct?.phones?.[0]?.number ??
                company?.phone ??
                orderData?.customer_phone ??
                null;
              const phones =
                struct?.phones?.map((p: any) => ({
                  number: p?.number ?? "",
                  type: p?.type ?? null,
                })) ?? undefined;
              const companyId =
                company?.id ??
                orderData?.customer_id ??
                null;
              return (
                <CrmAssociatedCompaniesCard
                  sectionId="companies"
                  collapsedSections={collapsedSections}
                  toggleSection={toggleSection}
                  companyName={companyName}
                  primaryPhone={primaryPhone}
                  phones={phones}
                  companyId={companyId}
                />
              );
            })()}

            {relatedLead && (
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
                      Contacts (1)
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
                    <div style={{ marginBottom: '16px', border: '1px solid #cccccc', borderRadius: '10px', padding: '15px' }}>
                      <a
                        href="#"
                        style={{
                          fontSize: '14px',
                          color: '#006162',
                          textDecoration: 'none',
                          fontWeight: '500',
                          display: 'block',
                          marginBottom: '8px',
                        }}
                      >
                        {relatedLead?.name || 'N/A'}
                      </a>
                      {relatedLead?.email && (
                        <p style={{
                          fontSize: '13px',
                          color: '#666666',
                          margin: '4px 0',
                        }}>
                          Email: {relatedLead.email}
                        </p>
                      )}
                      {relatedLead?.phone && (
                        <p style={{
                          fontSize: '13px',
                          color: '#666666',
                          margin: '4px 0',
                        }}>
                          Phone: {relatedLead.phone}
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
                      View all associated Contacts
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            )}

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
                    Attachments
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
          </div>
        </div>
      )}
    </div>
  );

  // ============================================================================
  // FULL-PAGE LOADING & ERROR
  // ============================================================================

  if (!router.isReady) {
    return null;
  }

  if (loading && !orderData) {
    return (
      <Layout>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 60px)',
          backgroundColor: 'transparent',
        }}>
          <div style={{ fontSize: '16px', color: '#718096' }}>Loading order details...</div>
        </div>
      </Layout>
    );
  }

  if (orderError) {
    return (
      <Layout>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 60px)',
          backgroundColor: 'transparent',
          gap: '16px',
        }}>
          <p style={{ fontSize: '16px', color: '#718096', margin: 0 }}>{orderError}</p>
          <button
            type="button"
            onClick={() => router.push('/crm/orders')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#006162',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Back to orders
          </button>
        </div>
      </Layout>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

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

OrderRecordPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default OrderRecordPage;
