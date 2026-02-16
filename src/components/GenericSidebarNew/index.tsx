import React, { useState, useEffect, useRef } from 'react';
import { 
  X, ChevronDown, ChevronRight, LucideIcon, Mail, Phone, MoreHorizontal, 
  Calendar, MessageSquare, ClipboardList, ExternalLink, Copy, RefreshCw,
  ThumbsUp, ThumbsDown, Paperclip, Users, Building2, DollarSign,
  FileText, Tag, Zap, ShoppingCart, CreditCard, Link2, Instagram,
  Briefcase, FileCheck, ListTodo, User, Sparkles
} from 'lucide-react';
import { Badge } from 'react-bootstrap';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SidebarField {
  label: string;
  value: any;
  icon?: LucideIcon;
  type?: 'text' | 'date' | 'datetime' | 'badge' | 'tags' | 'link' | 'email' | 'phone';
  badgeVariant?: string;
  show?: boolean;
  hasDetails?: boolean;
  onDetailsClick?: () => void;
  copyable?: boolean;
  externalLink?: string;
}

export interface SidebarSection {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: {
    value: string | number;
    variant?: string;
    icon?: LucideIcon;
  };
  fields?: SidebarField[];
  emptyState?: {
    icon?: LucideIcon;
    message: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
  customContent?: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  isLoading?: boolean;
  actions?: Array<{
    label: string;
    onClick: () => void;
  }>;
  count?: number;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
}

export interface BreezeRecordSummary {
  content: string;
  timestamp: string;
  onRefresh?: () => void;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
  onCopy?: () => void;
  onAskQuestion?: () => void;
}

export interface GenericSidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  
  // Header Information
  title: string;
  subtitle?: string; // Job title
  company?: string;
  avatar?: {
    initials?: string;
    name: string;
    gradient?: string;
    imageUrl?: string;
  };
  
  // Contact Information
  email?: string;
  phone?: string;
  
  // Quick Actions
  quickActions?: QuickAction[];
  onQuickActionClick?: (actionId: string) => void;
  
  // Breeze AI Summary
  breezeRecordSummary?: BreezeRecordSummary;
  
  // Sections
  sections?: SidebarSection[];
  
  // Additional Props
  width?: string;
  recordLink?: {
    label: string;
    onClick: () => void;
  };
  actionsDropdown?: {
    label: string;
    items: Array<{
      label: string;
      onClick: () => void;
    }>;
  };
  permissionMessage?: string;
  
  // Context payload for integrations
  contextPayload?: Record<string, unknown>;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const GenericSidebar: React.FC<GenericSidebarProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  company,
  avatar,
  email,
  phone,
  quickActions,
  onQuickActionClick,
  breezeRecordSummary,
  sections = [],
  width = '470px',
  recordLink,
  actionsDropdown,
  permissionMessage,
  contextPayload,
}) => {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showSectionActions, setShowSectionActions] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sectionDropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Initialize collapsed sections based on defaultExpanded
  // All sections are EXPANDED by default - only collapse if explicitly set to defaultExpanded: false
  useEffect(() => {
    const collapsed = new Set<string>();
    if (sections && sections.length > 0) {
      sections.forEach(section => {
        // Only collapse if collapsible AND explicitly set to defaultExpanded: false
        // If defaultExpanded is undefined or true, section remains expanded
        if (section.collapsible && section.defaultExpanded === false) {
          collapsed.add(section.id);
        }
      });
    }
    // Set collapsed sections (empty set means all sections are expanded)
    setCollapsedSections(collapsed);
  }, [sections]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowActionsDropdown(false);
      }
      
      // Close section dropdowns
      Object.entries(sectionDropdownRefs.current).forEach(([key, ref]) => {
        if (ref && !ref.contains(event.target as Node)) {
          setShowSectionActions(prev => prev === key ? null : prev);
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You can add a toast notification here
  };

  // Default quick actions matching HubSpot design
  const defaultQuickActions: QuickAction[] = quickActions || [
    { id: 'note', label: 'Note', icon: ClipboardList, onClick: () => console.log('Note'), disabled: false },
    { id: 'email', label: 'Email', icon: Mail, onClick: () => console.log('Email'), disabled: true },
    { id: 'call', label: 'Call', icon: Phone, onClick: () => console.log('Call'), disabled: true },
    { id: 'task', label: 'Task', icon: ClipboardList, onClick: () => console.log('Task'), disabled: true },
    { id: 'meeting', label: 'Meeting', icon: Calendar, onClick: () => console.log('Meeting'), disabled: false },
    { id: 'more', label: 'More', icon: MoreHorizontal, onClick: () => console.log('More'), disabled: false }
  ];

  const renderField = (field: SidebarField, index: number) => {
    if (field.show === false) return null;

    if (field.type === 'tags' && Array.isArray(field.value) && field.value.length > 0) {
      return (
        <div key={index} style={{ marginBottom: '16px' }}>
          <div style={{
            fontSize: '13px',
            fontWeight: '400',
            color: '#666',
            marginBottom: '8px'
          }}>
            {field.label}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {field.value.map((tag: any, idx: number) => (
              <span
                key={idx}
                style={{
                  padding: '4px 10px',
                  backgroundColor: '#eaf0f6',
                  color: '#33475b',
                  borderRadius: '3px',
                  fontSize: '13px',
                  fontWeight: '400'
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
        <div key={index} style={{ marginBottom: '16px' }}>
          <div style={{
            fontSize: '13px',
            fontWeight: '400',
            color: '#666',
            marginBottom: '8px'
          }}>
            {field.label}
          </div>
          <Badge bg={field.badgeVariant || 'primary'} style={{
            fontSize: '12px',
            padding: '4px 10px',
            borderRadius: '3px',
            fontWeight: '500'
          }}>
            {field.value}
          </Badge>
        </div>
      );
    }

    return (
      <div key={index} style={{ marginBottom: '16px' }}>
        <div style={{
          fontSize: '13px',
          fontWeight: '400',
          color: '#666',
          marginBottom: '4px'
        }}>
          {field.label}
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}>
          <div style={{
            fontSize: '14px',
            color: '#141414',
            fontWeight: '400',
            flex: 1,
            wordBreak: 'break-word'
          }}>
            {field.value || '--'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {field.copyable && field.value && (
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
                  borderRadius: '3px'
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
            {field.externalLink && (
              <a
                href={field.externalLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  color: '#141414',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '3px',
                  textDecoration: 'none'
                }}
                title="Open in new tab"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f8fa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <ExternalLink size={14} />
              </a>
            )}
            {field.hasDetails && (
              <button
                onClick={field.onDetailsClick}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '2px 6px',
                  cursor: 'pointer',
                  color: '#0091ae',
                  fontSize: '13px',
                  fontWeight: '400',
                  borderRadius: '3px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f8fa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Details
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSection = (section: SidebarSection) => {
    const SectionIcon = section.icon;
    const EmptyIcon = section.emptyState?.icon;
    const isCollapsed = collapsedSections.has(section.id);
    const showActions = showSectionActions === section.id;

    return (
      <div 
        key={section.id} 
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          marginBottom: '12px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
          border: '1px solid #cccccc',
        }}
      >
        {/* Section Header */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            cursor: section.collapsible ? 'pointer' : 'default',
            backgroundColor: '#ffffff',
            borderBottom: isCollapsed ? 'none' : '1px solid #eaf0f6'
          }}
          onClick={() => section.collapsible && toggleSection(section.id)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
            {section.collapsible && (
              <ChevronDown 
                size={18} 
                style={{ 
                  color: '#141414',
                  transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }} 
              />
            )}
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#141414',
              margin: 0,
              lineHeight: '1.2'
            }}>
              {section.title}
            </h3>
            {section.count !== undefined && (
              <span style={{
                fontSize: '13px',
                color: '#7c98b6',
                fontWeight: '400'
              }}>
                ({section.count})
              </span>
            )}
            {section.badge && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 10px',
                backgroundColor: section.badge.variant === 'danger' ? '#ffe8ec' : '#e3f2fd',
                borderRadius: '12px'
              }}>
                {section.badge.icon && <section.badge.icon size={12} style={{ color: section.badge.variant === 'danger' ? '#f44336' : '#2196f3' }} />}
                <span style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: section.badge.variant === 'danger' ? '#f44336' : '#2196f3',
                  textTransform: 'uppercase'
                }}>
                  {section.badge.value}
                </span>
              </div>
            )}
          </div>

          {/* Section Actions Dropdown */}
          {section.actions && section.actions.length > 0 && (
            <div 
              style={{ position: 'relative' }} 
              ref={el => { sectionDropdownRefs.current[section.id] = el; }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowSectionActions(showActions ? null : section.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '6px',
                  cursor: 'pointer',
                  color: '#141414',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '3px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f8fa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Actions
                <ChevronDown size={14} style={{ marginLeft: '4px' }} />
              </button>
              
              {showActions && (
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
                  overflow: 'hidden'
                }}>
                  {section.actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        action.onClick();
                        setShowSectionActions(null);
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        fontSize: '14px',
                        color: '#33475b',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f7fafc';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section Content */}
        {!isCollapsed && (
          <div style={{ padding: '20px' }}>
            {section.isLoading ? (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '24px',
                color: '#141414'
              }}>
                <RefreshCw size={16} className="spin" style={{ marginRight: '8px' }} />
                Loading...
              </div>
            ) : section.customContent ? (
              section.customContent
            ) : section.fields && section.fields.length > 0 ? (
              <div>
                {section.fields.map((field, index) => renderField(field, index))}
              </div>
            ) : section.emptyState ? (
              <div style={{
                padding: '32px 20px',
                textAlign: 'center'
              }}>
                {EmptyIcon && <EmptyIcon size={48} style={{ color: '#cbd5e0', marginBottom: '16px' }} />}
                <p style={{
                  fontSize: '14px',
                  color: '#718096',
                  margin: section.emptyState.action ? '0 0 20px 0' : 0,
                  lineHeight: '1.6'
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
                      backgroundColor: '#0091ae',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#007a8c';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#0091ae';
                    }}
                  >
                    {section.emptyState.action.label}
                  </button>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <style>
        {`
          @keyframes slideInRight {
            from { 
              transform: translateX(20px);
              opacity: 0;
            }
            to { 
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .spin {
            animation: spin 1s linear infinite;
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

          .quick-action-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 11px 10px;
            background: #ffffff;
            border: 1px solid #8a8a8a;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.2s ease;
            width: 40px;
            height: 40px;
            position: relative;
          }

          .quick-action-btn:not(.disabled):hover {
            background-color: #f7fafc;
            border-color: #cbd5e0;
            transform: translateY(-2px);
          }

          .quick-action-btn.disabled {
            background-color: rgb(245, 245, 245);
  border-color: rgb(230, 230, 230);
  color: rgb(138, 138, 138);
  cursor: not-allowed;
          }

          .quick-action-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
          }

          .quick-action-label {
            font-size: 12px;
            color: #33475b;
            font-weight: '500';
            white-space: nowrap;
            text-align: center;
          }

          .contact-info-link {
            color: '#0091ae';
            text-decoration: none;
            font-size: 14px;
            font-weight: 400;
          }

          .contact-info-link:hover {
            text-decoration: underline;
          }
        `}
      </style>

      <div
        style={{
          width,
          backgroundColor: '#f0f0f0',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 43px)',
          maxHeight: 'calc(100vh - 43px)',
          overflow: 'hidden',
          animation: 'slideInRight 0.3s ease-out',
          flexShrink: 0,
          marginTop: '43px',
        }}
      >
        {/* Fixed Top Bar - Title and Close (Non-scrollable) */}
        <div style={{
          padding: '20px 24px',
          border: '1px solid #cccccc',
          backgroundColor: '#ffffff',
          flexShrink: 0,
          borderRadius: '10px 10px 0 0',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '500',
              color: '#141414',
              margin: 0
            }}>
              {title}
            </h2>

            {onClose && (
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#718096',
                  transition: 'all 0.2s',
                  borderRadius: '4px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#2d3748';
                  e.currentTarget.style.backgroundColor = '#f7fafc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#718096';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div 
          className="sidebar-scrollbar"
          style={{
            flex: 1,
            overflowY: 'auto',
            backgroundColor: '#f0f0f0',
            maxHeight: 'calc(100vh - 252px)',
            borderBottom: '1px solid #cccccc',
            borderRadius: '0 0 10px 10px',
          }}
        >
          {/* Contact & Actions Section */}
          <div style={{
            backgroundColor: '#ffffff',
            padding: '16px 24px',
            marginBottom: '12px',
            borderLeft: '1px solid #cccccc',
              borderRight: '1px solid #cccccc',
              
              borderBottom: '1px solid #cccccc',
              borderRadius: '0 0 10px 10px',
          }}>
            {/* Record Link and Actions */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              paddingBottom: '10px',
              
            }}>
            {recordLink && (
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  recordLink.onClick();
                }}
                style={{
                  fontSize: '14px',
                  color: '#006162',
                  textDecoration: 'underline',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#007a8c';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#0091ae';
                }}
              >
                {recordLink.label}
              </a>
            )}

            {actionsDropdown && (
              <div style={{ position: 'relative' }} ref={dropdownRef}>
                <button
                  onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                  style={{
                    padding: '6px 14px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#33475b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f7fafc';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {actionsDropdown.label}
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
                    overflow: 'hidden'
                  }}>
                    {actionsDropdown.items.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          item.onClick();
                          setShowActionsDropdown(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          textAlign: 'left',
                          fontSize: '14px',
                          color: '#33475b',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f7fafc';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Permission Message */}
          {permissionMessage && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '5px',
              fontSize: '13px',
              color: '#92400e',
              marginBottom: '16px',
              lineHeight: '1.5',
            }}>
              {permissionMessage}
            </div>
          )}

          {/* Avatar and Name Section */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              marginBottom: '12px',
            }}>
              {avatar && (
                <div style={{
                  width: '40px',
                  height: '37px',
                  borderRadius: '26px',
                  background: '#efe7f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: '400',
                  color: '#141414',
                  flexShrink: 0,
                  backgroundImage: avatar.imageUrl ? `url(${avatar.imageUrl})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}>
                  {!avatar.imageUrl && (avatar.initials || avatar.name.substring(0, 2).toUpperCase())}
                </div>
              )}
              <div style={{ flex: 1}}>
                <h1 style={{
                  fontSize: '22px',
                  fontWeight: '500',
                  color: '#141414',
                  margin: '0 0 4px 0',
                  lineHeight: '1.3'
                }}>
                  {title}
                </h1>
                {/* {subtitle && (
                  <p style={{
                    fontSize: '14px',
                    color: '#718096',
                    margin: 0,
                    lineHeight: '1.4'
                  }}>
                    {subtitle}
                  </p>
                  
                )} */}
              </div>
            </div>

            {/* Email */}
            {email && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                marginBottom: '8px'
              }}>
                <a
                  href={`mailto:${email}`}
                  style={{
                    fontSize: '14px',
                    color: '#0091ae',
                    textDecoration: 'none',
                    fontWeight: '400',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.textDecoration = 'underline';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = 'none';
                  }}
                >
                  {email}
                </a>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  <button
                    onClick={() => copyToClipboard(email)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '4px',
                      cursor: 'pointer',
                      color: '#718096',
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: '3px'
                    }}
                    title="Copy email"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f7fafc';
                      e.currentTarget.style.color = '#2d3748';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#718096';
                    }}
                  >
                    <Copy size={14} />
                  </button>
                  <a
                    href={`mailto:${email}`}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '4px',
                      cursor: 'pointer',
                      color: '#718096',
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: '3px',
                      textDecoration: 'none'
                    }}
                    title="Send email"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f7fafc';
                      e.currentTarget.style.color = '#2d3748';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#718096';
                    }}
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            )}

            {/* Phone */}
            {phone && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                gap: '8px',
                marginBottom: '16px',
              }}>
                <div  style={{ flex: 1 }}>
                  <p style={{ 
                    fontSize: '13px', 
                    color: '#141414',
                    fontWeight: '400',
                    marginBottom: '1px'
                  }}>
                    Phone Number
                  </p>
                  <p style={{ 
                    fontSize: '13px', 
                    color: '#141414',
                    fontWeight: '400'
                  }}>
                    {subtitle}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',      // vertical center
            justifyContent: 'center',  // horizontal center
            gap: '23px',
            paddingTop: '5px',
            flexWrap: 'wrap',
          }}>
            {defaultQuickActions.map((action) => {
              const ActionIcon = action.icon;
              return (
                <div key={action.id} className="quick-action-wrapper">
                  <button
                    onClick={() => {
                      if (!action.disabled) {
                        action.onClick();
                        onQuickActionClick?.(action.id);
                      }
                    }}
                    className={`quick-action-btn ${action.disabled ? 'disabled' : ''}`}
                    title={action.label}
                    disabled={action.disabled}
                  >
                    <ActionIcon 
                      size={20} 
                      color={action.disabled ? '#cbd5e0' : '#718096'} 
                    />
                  </button>
                  <span className="quick-action-label">{action.label}</span>
                </div>
              );
            })}
          </div>
        </div>

          {/* Breeze Record Summary */}
          {breezeRecordSummary && (
            <div style={{
              backgroundColor: '#ffffff',
              
              borderRadius: '10px',
              marginBottom: '12px',
              overflow: 'hidden',
              border: '1px solid #cccccc',
            }}>
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 20px',
                  cursor: 'pointer',
                  backgroundColor: '#ffffff'
                }}
                onClick={() => toggleSection('breeze-summary')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ChevronDown 
                    size={18} 
                    style={{ 
                      color: '#141414',
                      transform: collapsedSections.has('breeze-summary') ? 'rotate(-90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }} 
                  />
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#141414',
                    margin: 0,
                    lineHeight: '1.2'
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
                    textTransform: 'uppercase'
                  }}>
                    AI
                  </div>
                </div>
              </div>

              {!collapsedSections.has('breeze-summary') && (
                <div style={{ 
                  padding: '20px',
                  
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    color: '#141414',
                    marginBottom: '12px'
                  }}>
                    <span> {breezeRecordSummary.timestamp}</span>
                    {breezeRecordSummary.onRefresh && (
                      <button
                        onClick={breezeRecordSummary.onRefresh}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: '2px',
                          cursor: 'pointer',
                          color: '#141414',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Refresh"
                      >
                        <RefreshCw size={12} />
                      </button>
                    )}
                  </div>

                  <div style={{
                    fontSize: '14px',
                    color: '#141414',
                    lineHeight: '1.6',
                    marginBottom: '16px',
                    border: '1px solid #ff9fcc',
                    padding: '18px 20px',
                    borderRadius: '5px',
                  }}>
                    {breezeRecordSummary.content}
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    paddingTop: '12px',
                    borderTop: '1px solid #fee'
                  }}>
                    {breezeRecordSummary.onThumbsUp && (
                      <button
                        onClick={breezeRecordSummary.onThumbsUp}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: '6px',
                          cursor: 'pointer',
                          color: '#141414',
                          display: 'flex',
                          alignItems: 'center',
                          borderRadius: '3px'
                        }}
                        title="Good summary"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f7fafc';
                          e.currentTarget.style.color = '#2d3748';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#718096';
                        }}
                      >
                        <ThumbsUp size={16} />
                      </button>
                    )}
                    {breezeRecordSummary.onThumbsDown && (
                      <button
                        onClick={breezeRecordSummary.onThumbsDown}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: '6px',
                          cursor: 'pointer',
                          color: '#141414',
                          display: 'flex',
                          alignItems: 'center',
                          borderRadius: '3px'
                        }}
                        title="Bad summary"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f7fafc';
                          e.currentTarget.style.color = '#2d3748';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#718096';
                        }}
                      >
                        <ThumbsDown size={16} />
                      </button>
                    )}
                    {breezeRecordSummary.onCopy && (
                      <button
                        onClick={breezeRecordSummary.onCopy}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: '6px',
                          cursor: 'pointer',
                          color: '#141414',
                          display: 'flex',
                          alignItems: 'center',
                          borderRadius: '3px'
                        }}
                        title="Copy"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f7fafc';
                          e.currentTarget.style.color = '#2d3748';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#718096';
                        }}
                      >
                        <Copy size={16} />
                      </button>
                    )}
                  </div>

                  {breezeRecordSummary.onAskQuestion && (
                    <button
                      onClick={breezeRecordSummary.onAskQuestion}
                      style={{
                        marginTop: '16px',
                        width: '36%',
                        padding: '6px 0',
                        backgroundColor: 'transparent',
                        border: '1px solid #d20688',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#d20688',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px'
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
                  )}
                </div>
              )}
            </div>
          )}

          {/* Sections */}
          {sections.map(section => renderSection(section))}
        </div>
      </div>
    </>
  );
};

export default GenericSidebar;
