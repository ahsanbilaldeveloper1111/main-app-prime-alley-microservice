import React, { useState, useRef, useEffect, ReactElement } from 'react';
import {
  X, ChevronDown, ChevronRight, ChevronLeft, Mail, Phone, MoreHorizontal,
  Calendar, MessageSquare, ClipboardList, ExternalLink, Copy, RefreshCw,
  ThumbsUp, ThumbsDown, Sparkles, User, Building2, Briefcase,
  FileText, Ticket, Paperclip, Link2, Tag, DollarSign,
  Search, Filter, AlertCircle, ShoppingCart, ShoppingBag
} from 'lucide-react';
import Layout from "@layout/index";
import { useRouter } from 'next/router';
import { getOrder, getDeal, getLead } from "@utils/crm";
import { GetHierarchyData } from "@utils/users";
import { formatDateForTable, ModuleSlug } from "@utils/Helper";
import { toast } from "react-toastify";
import moment from "moment";

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

const OrderRecordPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { id } = router.query;
  const [activeTab, setActiveTab] = useState('about');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showMoreActivities, setShowMoreActivities] = useState(false);
  const [activityFilter, setActivityFilter] = useState('activity');
  const [searchActivity, setSearchActivity] = useState('');
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [relatedDeal, setRelatedDeal] = useState<any>(null);
  const [relatedLead, setRelatedLead] = useState<any>(null);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const moreActivitiesRef = useRef<HTMLDivElement>(null);

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
        const order = await getOrder(Number(id));
        setOrderData(order);

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
      title: 'Order activity',
      description: 'Order was created',
      timestamp: orderData?.created_at ? formatDateForTable(orderData.created_at) : 'N/A',
      user: 'System',
      userLink: '#',
    },
    {
      id: '2',
      type: 'email',
      title: 'Order confirmation email',
      description: 'sent to',
      timestamp: orderData?.created_at ? formatDateForTable(orderData.created_at) : 'N/A',
      entityName: orderData?.customer_email || 'Customer',
      entityLink: '#',
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
                <h4 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#141414',
                  margin: 0,
                }}>
                  {activity.title}
                </h4>
                <FileText size={14} color="#7c98b6" />
              </div>
              
              <p style={{
                fontSize: '14px',
                color: '#141414',
                margin: '4px 0',
                lineHeight: '1.6',
              }}>
                {activity.user && (
                  <>
                    <a
                      href={activity.userLink}
                      style={{
                        color: '#006162',
                        textDecoration: 'none',
                        fontWeight: '500',
                      }}
                    >
                      {activity.user}
                    </a>
                    {' '}
                  </>
                )}
                {activity.description}
                {activity.entityName && (
                  <>
                    {' '}
                    <a
                      href={activity.entityLink}
                      style={{
                        color: '#006162',
                        textDecoration: 'none',
                        fontWeight: '500',
                      }}
                    >
                      {activity.entityName}
                    </a>
                  </>
                )}
              </p>
              
              {activity.alert && isExpanded && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px 16px',
                  backgroundColor: '#fff5f5',
                  border: '1px solid #feb2b2',
                  borderRadius: '5px',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                  }}>
                    <AlertCircle size={16} color="#e53e3e" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <p style={{
                        fontSize: '14px',
                        color: '#141414',
                        margin: 0,
                        lineHeight: '1.6',
                      }}>
                        <strong>{activity.alert.message.split('.')[0]}.</strong>
                        {' '}
                        {activity.alert.message.split('.').slice(1).join('.')}
                        {activity.alert.link && (
                          <>
                            {' '}
                            <a
                              href={activity.alert.link}
                              style={{
                                color: '#006162',
                                textDecoration: 'none',
                                fontWeight: '500',
                              }}
                            >
                              {activity.alert.linkText}
                            </a>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {isExpanded && activity.type === 'email' && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  backgroundColor: '#f7fafc',
                  borderRadius: '5px',
                }}>
                  <p style={{
                    fontSize: '13px',
                    color: '#7c98b6',
                    margin: 0,
                  }}>
                    Order confirmation email sent to customer
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div style={{
            fontSize: '13px',
            color: '#7c98b6',
            whiteSpace: 'nowrap',
          }}>
            {activity.timestamp}
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
                Order Stage
              </div>
              <div style={{
                fontSize: '14px',
                color: '#141414',
                fontWeight: '400',
              }}>
                {orderData?.stage?.name || 'N/A'}
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
              <a
                href="#"
                style={{
                  fontSize: '14px',
                  color: '#006162',
                  textDecoration: 'none',
                  fontWeight: '500',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none';
                }}
              >
                {orderData?.customer_name || 'N/A'}
              </a>
            </div>
            <div>
              <div style={{
                fontSize: '13px',
                color: '#7c98b6',
                marginBottom: '6px',
              }}>
                Order Value
              </div>
              <div style={{
                fontSize: '14px',
                color: '#141414',
                fontWeight: '400',
              }}>
                {orderData?.final_amount || orderData?.total_amount 
                  ? `${orderData?.currency || 'AED'} ${parseFloat(String(orderData.final_amount || orderData.total_amount)).toLocaleString()}`
                  : 'N/A'}
              </div>
            </div>
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
                {orderData?.order_approval_status || 'N/A'}
              </div>
            </div>
            <div>
              <div style={{
                fontSize: '13px',
                color: '#7c98b6',
                marginBottom: '6px',
              }}>
                Fulfillment Status
              </div>
              <div style={{
                fontSize: '14px',
                color: '#141414',
                fontWeight: '400',
              }}>
                {orderData?.fulfillment_status || 'N/A'}
              </div>
            </div>
            <div>
              <div style={{
                fontSize: '13px',
                color: '#7c98b6',
                marginBottom: '6px',
              }}>
                Payment Status
              </div>
              <div style={{
                fontSize: '14px',
                color: '#141414',
                fontWeight: '400',
              }}>
                {orderData?.payment_status || 'N/A'}
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
                {orderData?.industry || 'N/A'}
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
                {orderData?.company_description || 'N/A'}
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
              Order Information
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '13px',
                color: '#7c98b6',
                marginBottom: '6px',
              }}>
                Order Owner
              </div>
              <div style={{
                fontSize: '14px',
                color: '#141414',
                fontWeight: '400',
              }}>
                {extensions.find((ext: any) => ext?.id == orderData?.assigned_to || ext?.extension == orderData?.assigned_to)?.display_name || extensions.find((ext: any) => ext?.id == orderData?.assigned_to || ext?.extension == orderData?.assigned_to)?.name || orderData?.assigned_to || 'N/A'}
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
                  {orderData?.order_approval_status || 'N/A'}
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
                  {orderData?.currency || 'AED'}
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
                  {['Edit', 'Delete', 'Clone', 'Export'].map((action) => (
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
              { icon: ClipboardList, label: 'Note', disabled: false },
              { icon: Mail, label: 'Email', disabled: !orderData?.customer_email },
              { icon: Phone, label: 'Call', disabled: !orderData?.customer_phone },
              { icon: ClipboardList, label: 'Task', disabled: false },
              { icon: Calendar, label: 'Meeting', disabled: false },
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
                    disabled={action.disabled}
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
                  {['Message', 'Task', 'WhatsApp'].map((action) => (
                    <button
                      key={action}
                      onClick={() => setShowMoreActivities(false)}
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
                      <span>Generated {orderData?.updated_at ? moment(orderData.updated_at).format('MMM DD, YYYY') : moment().format('MMM DD, YYYY')}</span>
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
                      This order for {orderData?.customer_name || 'Customer'} is currently in the {orderData?.stage?.name || 'No Stage'} stage with a value of {orderData?.final_amount || orderData?.total_amount 
                        ? `${orderData?.currency || 'AED'} ${parseFloat(String(orderData.final_amount || orderData.total_amount)).toLocaleString()}`
                        : 'N/A'}. {orderData?.expected_delivery_date ? `Expected delivery date is ${formatDateForTable(orderData.expected_delivery_date)}.` : ''} {orderData?.order_approval_status ? `Approval status: ${orderData.order_approval_status}.` : ''} {orderData?.fulfillment_status ? `Fulfillment status: ${orderData.fulfillment_status}.` : ''} {orderData?.payment_status ? `Payment status: ${orderData.payment_status}.` : ''} Recent activity shows order processing and customer engagement. Recommended next steps: monitor fulfillment progress, ensure payment processing, and maintain customer communication.
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
                        onClick={() => {
                          const summaryText = `This order for ${orderData?.customer_name || 'Customer'} is currently in the ${orderData?.stage?.name || 'No Stage'} stage with a value of ${orderData?.final_amount || orderData?.total_amount 
                            ? `${orderData?.currency || 'AED'} ${parseFloat(String(orderData.final_amount || orderData.total_amount)).toLocaleString()}`
                            : 'N/A'}. ${orderData?.expected_delivery_date ? `Expected delivery date is ${formatDateForTable(orderData.expected_delivery_date)}.` : ''} ${orderData?.order_approval_status ? `Approval status: ${orderData.order_approval_status}.` : ''} ${orderData?.fulfillment_status ? `Fulfillment status: ${orderData.fulfillment_status}.` : ''} ${orderData?.payment_status ? `Payment status: ${orderData.payment_status}.` : ''} Recent activity shows order processing and customer engagement. Recommended next steps: monitor fulfillment progress, ensure payment processing, and maintain customer communication.`;
                          copyToClipboard(summaryText);
                        }}
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
                    Order profile
                  </h3>
                </div>

                <div style={{ padding: '20px' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '20px',
                  }}>
                    {[
                      { label: 'Order Number', value: orderData?.order_number || `Order #${id}` || 'N/A' },
                      { label: 'Company Name', value: orderData?.customer_name || 'N/A' },
                      { label: 'Order Value', value: orderData?.final_amount || orderData?.total_amount 
                        ? `${orderData?.currency || 'AED'} ${parseFloat(String(orderData.final_amount || orderData.total_amount)).toLocaleString()}`
                        : 'N/A' },
                      { label: 'Stage', value: orderData?.stage?.name || 'N/A' },
                      { label: 'Order Status', value: orderData?.status || 'N/A' },
                      { label: 'Order Date', value: orderData?.order_date ? formatDateForTable(orderData.order_date) : 'N/A' },
                      { label: 'Expected Delivery', value: orderData?.expected_delivery_date ? formatDateForTable(orderData.expected_delivery_date) : 'N/A' },
                      { label: 'Order Owner', value: extensions.find((ext: any) => ext?.id == orderData?.assigned_to || ext?.extension == orderData?.assigned_to)?.display_name || extensions.find((ext: any) => ext?.id == orderData?.assigned_to || ext?.extension == orderData?.assigned_to)?.name || orderData?.assigned_to || 'N/A' },
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
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
                gap: '16px',
                flexWrap: 'wrap',
              }}>
                <div style={{
                  position: 'relative',
                  flex: '1',
                  minWidth: '250px',
                  maxWidth: '400px',
                }}>
                  <Search
                    size={18}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#7c98b6',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Search activities"
                    value={searchActivity}
                    onChange={(e) => setSearchActivity(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 40px 10px 16px',
                      border: '1px solid #cbd5e0',
                      borderRadius: '20px',
                      fontSize: '14px',
                      outline: 'none',
                      backgroundColor: '#ffffff',
                    }}
                  />
                </div>

                <button
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#ffffff',
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
                  onClick={() => setExpandedActivities(new Set())}
                >
                  Collapse all
                  <ChevronDown size={14} />
                </button>
              </div>

              <div style={{
                display: 'flex',
                gap: '24px',
                marginBottom: '16px',
                borderBottom: '2px solid #eaf0f6',
              }}>
                {[
                  { id: 'activity', label: 'Activity' },
                  { id: 'notes', label: 'Notes' },
                  { id: 'emails', label: 'Emails' },
                  { id: 'calls', label: 'Calls' },
                  { id: 'tasks', label: 'Tasks' },
                  { id: 'meetings', label: 'Meetings' },
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setActivityFilter(filter.id)}
                    style={{
                      padding: '10px 0',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderBottom: activityFilter === filter.id ? '2px solid #141414' : '2px solid transparent',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: activityFilter === filter.id ? '600' : '400',
                      color: activityFilter === filter.id ? '#141414' : '#7c98b6',
                      transition: 'all 0.2s',
                      marginBottom: '-2px',
                    }}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#141414',
                marginBottom: '16px',
              }}>
                {orderData?.created_at ? moment(orderData.created_at).format('MMMM YYYY') : moment().format('MMMM YYYY')}
              </h3>

              <div>
                {activitiesData.map(activity => renderActivityItem(activity))}
              </div>
            </div>
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
                      View all associated Deals
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
                    Companies ({orderData?.customer_name ? 1 : 0})
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
                  {orderData?.customer_name ? (
                    <>
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
                            {orderData.customer_name}
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
                        {orderData?.customer_email && (
                          <p style={{
                            fontSize: '13px',
                            color: '#666666',
                            margin: '4px 0',
                          }}>
                            Email: {orderData.customer_email}
                          </p>
                        )}
                        {orderData?.customer_phone && (
                          <p style={{
                            fontSize: '13px',
                            color: '#666666',
                            margin: '4px 0',
                          }}>
                            Phone: {orderData.customer_phone}
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
                    <div style={{
                      padding: '32px 20px',
                      textAlign: 'center',
                    }}>
                      <Building2 size={48} style={{ color: '#cbd5e0', marginBottom: '16px' }} />
                      <p style={{
                        fontSize: '14px',
                        color: '#718096',
                        margin: 0,
                        lineHeight: '1.6',
                      }}>
                        No companies associated
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

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
    </>
  );
};

OrderRecordPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default OrderRecordPage;
