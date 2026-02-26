import React, { useState, useEffect, useRef } from 'react';
import { X, Maximize2, Minimize2, LucideIcon, User, Phone, Mail, ChevronLeft, ChevronRight, MessageSquare, Video, Calendar } from 'lucide-react';
import { Badge } from 'react-bootstrap';
import AICompose, { type AIComposeOpenedFrom } from '@components/aicompose';
import { usePermissions } from '@utils/permissionUtils';
import { HEADER_CONSTANTS } from '@constants/headerConstants';

const { PERMISSIONS: AI_COMPOSE_PERMISSIONS } = HEADER_CONSTANTS;

// Wrapper component to add close functionality to AICompose - fills flex container so it sticks with sidebar
const AIComposeWrapper: React.FC<{
  onClose: () => void;
  openedFrom?: AIComposeOpenedFrom;
  contextPayload?: Record<string, unknown>;
  moduleSlug?: string;
}> = ({ onClose, openedFrom = 'whatsapp', contextPayload, moduleSlug }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  return (
    <>
      <style>{`
        .ai-compose-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-width: 0;
          overflow-y: auto;
          overflow-x: hidden;
          background-color: rgba(0, 0, 0, 0.02);
        }

        .ai-compose-wrapper {
          position: relative;
          min-height: 100%;
          padding: 20px 0 20px 20px;
          flex: 1;
          display: flex;
          justify-content: flex-end;
        }

        .ai-compose-content {
          position: relative;
          max-width: 900px;
          width: 100%;
          margin-right: 0;
          background-color: #f8f9fa;
          border-radius: 12px 0 0 12px;
          box-shadow: -4px 0 24px rgba(0, 0, 0, 0.08);
        }

        .ai-compose-close-btn {
          position: sticky;
          top: 43px;
          float: right;
          z-index: 1000;
          background: #f3f4f6;
          border: none;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: all 0.2s;
          color: #6b7280;
          margin-right: 20px;
          margin-bottom: -48px;
        }

        .ai-compose-close-btn:hover {
          transform: scale(1.1);
          background-color: #e5e7eb;
        }

        .ai-compose-content.full-screen {
          position: fixed;
          inset: 0;
          max-width: none;
          width: 100%;
          height: 100%;
          border-radius: 0;
          z-index: 9999;
        }

        .ai-compose-content.full-screen .ai-compose-toolbar-btns {
          position: absolute;
          top: 16px;
          right: 16px;
        }
      `}</style>
      
      <div 
        className="ai-compose-container"
        onClick={(e) => {
          if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('ai-compose-wrapper')) {
            onClose();
          }
        }}
      >
        <div className="ai-compose-wrapper">
          <div
            className={`ai-compose-content ${isFullScreen ? 'full-screen' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ai-compose-toolbar-btns d-flex gap-1" style={{ position: 'sticky', top: 43, float: 'right', zIndex: 1000, marginRight: 20, marginBottom: -48 }}>
              <button
                type="button"
                className="ai-compose-close-btn"
                onClick={() => setIsFullScreen(!isFullScreen)}
                title={isFullScreen ? 'Exit full screen' : 'Full screen'}
                aria-label={isFullScreen ? 'Exit full screen' : 'Full screen'}
              >
                {isFullScreen ? <Minimize2 size={16} color="#374151" /> : <Maximize2 size={16} color="#374151" />}
              </button>
              <button
                className="ai-compose-close-btn"
                onClick={onClose}
                title="Close"
                aria-label="Close"
              >
                <X size={16} color="#374151" />
              </button>
            </div>

            <AICompose key={openedFrom} openedFrom={openedFrom} contextPayload={contextPayload} moduleSlug={moduleSlug} />
          </div>
        </div>
      </div>
    </>
  );
};

export interface SidebarField {
  label: string;
  value: any;
  icon?: LucideIcon;
  type?: 'text' | 'date' | 'datetime' | 'badge' | 'tags';
  badgeVariant?: string;
  show?: boolean;
}

export interface SidebarSection {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: {
    value: string | number;
    variant?: string;
  };
  fields?: SidebarField[];
  emptyState?: {
    icon: LucideIcon;
    message: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
  customContent?: React.ReactNode;
}

export interface SidebarTab {
  id: string;
  label: string;
  sections: SidebarSection[];
}

export interface SidebarAvatar {
  initials?: string;
  name: string;
  gradient?: string;
  useIcon?: boolean;
}

export interface SidebarAction {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'secondary' | 'outline-primary' | 'outline-secondary';
  show?: boolean;
  disabled?: boolean;
}

export interface GenericSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  metadata?: string;
  email?: string;
  phone?: string;
  /** Full phone number with country code (e.g. for Call action); optional */
  completePhone?: string;
  avatar?: SidebarAvatar;
  // Quick Action Handlers (receive context payload when provided)
  /** When completePhone is available, Call button passes it so parent can dial via CTI/dialer */
  onCall?: (phone?: string) => void;
  onWhatsApp?: (payload?: Record<string, unknown>) => void;
  onEmail?: (payload?: Record<string, unknown>) => void;
  onSMS?: (payload?: Record<string, unknown>) => void;
  onMeetNow?: (payload?: Record<string, unknown>) => void;
  onSchedule?: () => void;
  /** Context payload (e.g. lead, deal, order) passed to AI Compose and to action handlers */
  contextPayload?: Record<string, unknown>;
  /** Module slug for AI Compose list APIs (page from which compose was opened) */
  moduleSlug?: string;
  sections?: SidebarSection[];
  tabs?: SidebarTab[];
  actions?: SidebarAction[];
  width?: string;
}

const GenericSidebar: React.FC<GenericSidebarProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  metadata,
  email,
  phone,
  completePhone,
  avatar,
  onCall = () => console.log('Call action clicked'),
  onWhatsApp = () => console.log('WhatsApp action clicked'),
  onEmail = () => console.log('Email action clicked'),
  onSMS = () => console.log('SMS action clicked'),
  onMeetNow = () => console.log('Meet Now action clicked'),
  onSchedule = () => console.log('Schedule action clicked'),
  contextPayload,
  moduleSlug,
  sections,
  tabs,
  actions,
  width = '400px'
}) => {
  const { hasPermission } = usePermissions();
  const [activeTab, setActiveTab] = useState(tabs && tabs.length > 0 ? tabs[0].id : '');
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [showAICompose, setShowAICompose] = useState(false);
  const [aiComposeOpenedFrom, setAiComposeOpenedFrom] = useState<AIComposeOpenedFrom>('whatsapp');
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  const canWhatsApp = hasPermission(AI_COMPOSE_PERMISSIONS.SEND_WHATSAPP_MESSAGE_CRM) || hasPermission(AI_COMPOSE_PERMISSIONS.VIEW_WHATSAPP_MESSAGES_CRM);
  const canEmail = hasPermission(AI_COMPOSE_PERMISSIONS.SEND_EMAIL_CRM) || hasPermission(AI_COMPOSE_PERMISSIONS.VIEW_EMAILS_CRM);
  const canSms = hasPermission(AI_COMPOSE_PERMISSIONS.SEND_SMS_CRM) || hasPermission(AI_COMPOSE_PERMISSIONS.VIEW_SMS_CRM);
  const canMeetings = hasPermission(AI_COMPOSE_PERMISSIONS.CREATE_MEETING_CRM) || hasPermission(AI_COMPOSE_PERMISSIONS.VIEW_MEETINGS_CRM);

  // Auto-select first tab when sidebar opens or tabs change
  useEffect(() => {
    if (isOpen && tabs && tabs.length > 0) {
      setActiveTab(tabs[0].id);
    }
  }, [isOpen, tabs]);

  // Check if tabs overflow and update arrow visibility
  const checkTabsOverflow = () => {
    const container = tabsContainerRef.current;
    if (!container) return;

    const isOverflowing = container.scrollWidth > container.clientWidth;
    const isAtStart = container.scrollLeft <= 0;
    const isAtEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 1;

    setShowLeftArrow(isOverflowing && !isAtStart);
    setShowRightArrow(isOverflowing && !isAtEnd);
  };

  // Check overflow on mount, tab changes, and window resize
  useEffect(() => {
    if (tabs && tabs.length > 0) {
      checkTabsOverflow();
      const container = tabsContainerRef.current;
      if (container) {
        container.addEventListener('scroll', checkTabsOverflow);
      }
      window.addEventListener('resize', checkTabsOverflow);
      
      return () => {
        if (container) {
          container.removeEventListener('scroll', checkTabsOverflow);
        }
        window.removeEventListener('resize', checkTabsOverflow);
      };
    }
  }, [tabs, isOpen]);

  const scrollTabs = (direction: 'left' | 'right') => {
    const container = tabsContainerRef.current;
    if (!container) return;

    const scrollAmount = 200; // Scroll 200px at a time
    const newScrollLeft = direction === 'left' 
      ? container.scrollLeft - scrollAmount 
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  if (!isOpen) return null;

  // Fixed header height - matching the application's header
  const headerHeight = '85px';

  // Determine which sections to display
  const displaySections = tabs && tabs.length > 0
    ? tabs.find(tab => tab.id === activeTab)?.sections || []
    : sections || [];

  const formatDate = (dateValue: any, includeTime: boolean = false): string => {
    if (!dateValue) return 'N/A';
    
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return 'N/A';
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();
      
      if (!includeTime) {
        return `${month} ${day}, ${year}`;
      }
      
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${month} ${day}, ${year} ${hours}:${minutes}`;
    } catch (e) {
      return 'N/A';
    }
  };

  const formatValue = (field: SidebarField) => {
    if (!field.value || field.value === 'N/A') return 'N/A';

    switch (field.type) {
      case 'date':
        return formatDate(field.value, false);
      case 'datetime':
        return formatDate(field.value, true);
      case 'tags':
        return Array.isArray(field.value) ? field.value : [];
      default:
        return field.value;
    }
  };

  const renderField = (field: SidebarField, index: number) => {
    if (field.show === false) return null;

    if (field.type === 'tags' && Array.isArray(field.value) && field.value.length > 0) {
      return (
        <div key={index} style={{
          padding: '14px 16px',
          backgroundColor: '#f9fafb',
          borderRadius: '10px',
          border: '1px solid #f3f4f6'
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: '600',
            color: '#6b7280',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {field.label}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {field.value.map((tag: any, idx: number) => (
              <span
                key={idx}
                style={{
                  padding: '4px 10px',
                  backgroundColor: '#e0e7ff',
                  color: '#4f46e5',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                {typeof tag === 'string' ? tag : tag.name}
              </span>
            ))}
          </div>
        </div>
      );
    }

    if (field.type === 'badge') {
      return (
        <div key={index} style={{
          padding: '14px 16px',
          backgroundColor: '#f9fafb',
          borderRadius: '10px',
          border: '1px solid #f3f4f6'
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: '600',
            color: '#6b7280',
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {field.label}
          </div>
          <Badge bg={field.badgeVariant || 'primary'} style={{
            fontSize: '12px',
            padding: '4px 10px',
            borderRadius: '12px',
            fontWeight: '500'
          }}>
            {formatValue(field)}
          </Badge>
        </div>
      );
    }

    return (
      <div key={index} style={{
        padding: '14px 16px',
        backgroundColor: '#f9fafb',
        borderRadius: '10px',
        border: '1px solid #f3f4f6'
      }}>
        <div style={{
          fontSize: '11px',
          fontWeight: '600',
          color: '#6b7280',
          marginBottom: '6px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {field.label}
        </div>
        <div style={{
          fontSize: '14px',
          color: '#111827',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {field.icon && <field.icon size={14} color="#4f46e5" />}
          {formatValue(field)}
        </div>
      </div>
    );
  };

  const renderSection = (section: SidebarSection) => {
    const SectionIcon = section.icon;
    const EmptyIcon = section.emptyState?.icon;

    return (
      <div key={section.id}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '2px solid #f3f4f6'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {SectionIcon && <SectionIcon size={20} style={{ color: '#4f46e5' }} />}
            <h3 style={{
              fontSize: '15px',
              fontWeight: '600',
              color: '#111827',
              margin: 0
            }}>
              {section.title}
            </h3>
          </div>
          {section.badge && (
            <Badge bg={section.badge.variant || 'secondary'} style={{
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: '12px',
              fontWeight: '600'
            }}>
              {section.badge.value}
            </Badge>
          )}
        </div>

        {section.customContent ? (
          section.customContent
        ) : section.fields && section.fields.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '14px'
          }}>
            {section.fields.map((field, index) => renderField(field, index))}
          </div>
        ) : section.emptyState ? (
          <div style={{
            padding: '32px 20px',
            backgroundColor: '#fafafa',
            borderRadius: '10px',
            border: '1px solid #f3f4f6',
            textAlign: 'center'
          }}>
            {EmptyIcon && <EmptyIcon size={40} style={{ color: '#d1d5db', marginBottom: '12px' }} />}
            <p style={{
              fontSize: '13px',
              color: '#6b7280',
              margin: section.emptyState.action ? '0 0 16px 0' : 0,
              lineHeight: '1.5'
            }}>
              {section.emptyState.message}
            </p>
            {section.emptyState.action && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  section.emptyState?.action?.onClick();
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#4f46e5';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#6366f1';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {section.emptyState.action.label}
              </button>
            )}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: headerHeight,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1050,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        overflowX: 'auto',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          .sidebar-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .sidebar-scrollbar::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 10px;
          }
          .sidebar-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
          }
          .sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
        `}
      </style>
      {/* AI Compose panel - immediately to the left of sidebar, no gap, no overlap */}
      {showAICompose && (
        <div
          style={{
            flex: 1,
            minWidth: 280,
            height: `calc(100vh - ${headerHeight})`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            flexShrink: 1,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAICompose(false);
          }}
        >
          <AIComposeWrapper
            openedFrom={aiComposeOpenedFrom}
            onClose={() => setShowAICompose(false)}
            contextPayload={contextPayload}
            moduleSlug={moduleSlug}
          />
        </div>
      )}
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width,
          height: `calc(100vh - ${headerHeight})`,
          backgroundColor: '#ffffff',
          boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideIn 0.3s ease-out',
          flexShrink: 0,
          marginLeft: 0,
        }}
      >
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
                {title}
              </h2>
              {subtitle && (
                <p style={{ 
                  fontSize: '15px', 
                  color: '#6b7280',
                  margin: '0 0 8px 0'
                }}>
                  {subtitle}
                </p>
              )}
              {metadata && (
                <p style={{ 
                  fontSize: '14px', 
                  color: '#9ca3af',
                  margin: '0 0 16px 0'
                }}>
                  {metadata}
                </p>
              )}

              {/* Contact Information */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={16} color="#6b7280" />
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>
                      {phone}
                    </span>
                  </div>
                )}
                {email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={16} color="#6b7280" />
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>
                      {email}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ position: 'relative', flexShrink: 0 }}>
              {/* Close Button */}
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

              {/* Avatar */}
              {avatar && (
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: avatar.useIcon 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : `linear-gradient(135deg, ${avatar.gradient} 0%, ${avatar.gradient}dd 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '30px'
                }}>
                  {avatar.useIcon ? (
                    <User size={40} color="white" />
                  ) : (
                    <span style={{
                      fontSize: '32px',
                      fontWeight: '700',
                      color: 'white'
                    }}>
                      {avatar.initials}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions - Permanent Section */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#fafbfc'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: '#6b7280',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Quick Actions
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px'
          }}>
            {/* Call Button - Always Visible; optional completePhone shown when provided */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (completePhone != null && completePhone.trim() !== '') {
                  onCall(completePhone.trim());
                } else {
                  onCall();
                }
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '14px 10px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Phone 
                size={22} 
                color="#10b981"
                strokeWidth={2.5}
                style={{ marginBottom: '6px' }}
              />
              <span style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#374151',
                textAlign: 'center',
                lineHeight: '1.2'
              }}>
                Call
              </span>
              {completePhone != null && completePhone !== '' && (
                <span style={{
                  fontSize: '10px',
                  color: '#6b7280',
                  textAlign: 'center',
                  lineHeight: '1.2',
                  marginTop: '2px',
                  wordBreak: 'break-all'
                }}>
                  {completePhone}
                </span>
              )}
            </button>

            {/* WhatsApp Button */}
            {canWhatsApp && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setAiComposeOpenedFrom('whatsapp');
                setShowAICompose(true);
                if (contextPayload) console.log('[GenericSidebar] Payload from page (WhatsApp):', contextPayload);
                onWhatsApp(contextPayload);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '14px 10px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <MessageSquare 
                size={22} 
                color="#25D366"
                strokeWidth={2.5}
                style={{ marginBottom: '6px' }}
              />
              <span style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#374151',
                textAlign: 'center',
                lineHeight: '1.2'
              }}>
                WhatsApp
              </span>
            </button>
            )}

            {/* Email Button */}
            {canEmail && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setAiComposeOpenedFrom('email');
                setShowAICompose(true);
                console.log('[GenericSidebar] Payload from page (Email):', contextPayload ?? '(none)');
                onEmail(contextPayload);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '14px 10px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Mail 
                size={22} 
                color="#ef4444"
                strokeWidth={2.5}
                style={{ marginBottom: '6px' }}
              />
              <span style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#374151',
                textAlign: 'center',
                lineHeight: '1.2'
              }}>
                Email
              </span>
            </button>
            )}

            {/* SMS Button */}
            {canSms && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setAiComposeOpenedFrom('sms');
                setShowAICompose(true);
                console.log('[GenericSidebar] Payload from page (SMS):', contextPayload ?? '(none)');
                onSMS(contextPayload);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '14px 10px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <MessageSquare 
                size={22} 
                color="#8b5cf6"
                strokeWidth={2.5}
                style={{ marginBottom: '6px' }}
              />
              <span style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#374151',
                textAlign: 'center',
                lineHeight: '1.2'
              }}>
                SMS
              </span>
            </button>
            )}

            {/* Meet Now Button */}
            {canMeetings && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setAiComposeOpenedFrom('meet-now');
                setShowAICompose(true);
                console.log('[GenericSidebar] Payload from page (Meet Now):', contextPayload ?? '(none)');
                onMeetNow(contextPayload);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '14px 10px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Video 
                size={22} 
                color="#f59e0b"
                strokeWidth={2.5}
                style={{ marginBottom: '6px' }}
              />
              <span style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#374151',
                textAlign: 'center',
                lineHeight: '1.2'
              }}>
                Meet Now
              </span>
            </button>
            )}

            {/* Schedule Button */}
            {canMeetings && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setAiComposeOpenedFrom('schedule');
                setShowAICompose(true);
                onSchedule();
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '14px 10px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Calendar 
                size={22} 
                color="#6366f1"
                strokeWidth={2.5}
                style={{ marginBottom: '6px' }}
              />
              <span style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#374151',
                textAlign: 'center',
                lineHeight: '1.2'
              }}>
                Schedule
              </span>
            </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        {tabs && tabs.length > 0 && (
          <div style={{
            position: 'relative',
            borderBottom: '1px solid #e5e7eb'
          }}>
            {/* Left Arrow */}
            {showLeftArrow && (
              <button
                onClick={() => scrollTabs('left')}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 10,
                  background: 'linear-gradient(to right, #ffffff 70%, transparent)',
                  border: 'none',
                  padding: '8px 12px 8px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  color: '#6366f1'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#4f46e5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#6366f1';
                }}
              >
                <ChevronLeft size={20} />
              </button>
            )}

            {/* Tabs Container */}
            <div
              ref={tabsContainerRef}
              style={{
                display: 'flex',
                padding: '0 24px',
                gap: '24px',
                overflowX: 'hidden',
                scrollBehavior: 'smooth',
                position: 'relative'
              }}
            >
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '16px 0',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
                    color: activeTab === tab.id ? '#6366f1' : '#6b7280',
                    fontSize: '14px',
                    fontWeight: activeTab === tab.id ? '600' : '400',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Right Arrow */}
            {showRightArrow && (
              <button
                onClick={() => scrollTabs('right')}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 10,
                  background: 'linear-gradient(to left, #ffffff 70%, transparent)',
                  border: 'none',
                  padding: '8px 8px 8px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  color: '#6366f1'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#4f46e5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#6366f1';
                }}
              >
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        )}

        {/* Scrollable Content */}
        <div 
          className="sidebar-scrollbar"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            backgroundColor: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {displaySections.map(section => renderSection(section))}
          </div>

          {/* Actions */}
          {actions && actions.length > 0 && (
            <div style={{
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              {actions.filter(action => action.show !== false).map((action, index) => {
                const ActionIcon = action.icon;
                const isOutline = action.variant?.includes('outline');
                
                const baseStyles = {
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 500,
                  fontSize: '14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.2s'
                } as React.CSSProperties;

                const variantStyles: Record<string, React.CSSProperties> = {
                  'primary': { background: '#4680ff', color: 'white' },
                  'success': { background: '#10b981', color: 'white' },
                  'danger': { background: '#ef4444', color: 'white' },
                  'warning': { background: '#f59e0b', color: 'white' },
                  'secondary': { background: '#6b7280', color: 'white' },
                  'outline-primary': { background: 'white', color: '#4680ff', border: '2px solid #4680ff' },
                  'outline-secondary': { background: 'white', color: '#6b7280', border: '2px solid #e5e7eb' }
                };

                return (
                  <button
                    key={index}
                    disabled={action.disabled}
                    onClick={() => { if (!action.disabled) action.onClick(); }}
                    style={{
                      ...baseStyles,
                      ...(variantStyles[action.variant || 'primary']),
                      ...(action.disabled && { opacity: 0.6, cursor: 'not-allowed' })
                    }}
                  >
                    {ActionIcon && <ActionIcon size={16} />}
                    {action.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenericSidebar;
