// ============================================================================
// NOTIFICATIONS SIDEBAR COMPONENT
// ============================================================================
//
// USAGE:
//   import NotificationsSidebar from './NotificationsSidebar';
//
//   const [isOpen, setIsOpen] = useState(false);
//
//   <NotificationsSidebar
//     isOpen={isOpen}
//     onClose={() => setIsOpen(false)}
//   />
//
// PROPS:
//   isOpen   — boolean to control visibility
//   onClose  — called when X is clicked
// ============================================================================

import React, { useState } from 'react';
import { X, Settings, Info, ChevronDown, Trash2, Check } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'unread' | 'all' | 'trash';
type NotificationType = 'all' | 'data' | 'call' | 'task' | 'mention';

interface Notification {
  id: string;
  title: string;
  description?: string;
  time: string;       // e.g. "5d", "8d", "2h"
  read: boolean;
  trashed: boolean;
  type: Exclude<NotificationType, 'all'>;
}

// ── Sample data ───────────────────────────────────────────────────────────────

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    title: 'Contact Data Test Completed',
    description: 'Your data test has completed a test of 22 Contact record(s).',
    time: '5d',
    read: false,
    trashed: false,
    type: 'data',
  },
  {
    id: 'n2',
    title: 'Company Data Test Completed',
    description: 'Your data test has completed a test of 9 Company record(s).',
    time: '5d',
    read: false,
    trashed: false,
    type: 'data',
  },
  {
    id: 'n3',
    title: 'Logged call from Rizwan haider',
    description: undefined,
    time: '8d',
    read: false,
    trashed: false,
    type: 'call',
  },
  {
    id: 'n4',
    title: 'Your call transcript is now available',
    description: undefined,
    time: '8d',
    read: false,
    trashed: false,
    type: 'call',
  },
  {
    id: 'n5',
    title: 'Task assigned to you',
    description: 'Follow up with Acme Corp by Friday.',
    time: '1d',
    read: true,
    trashed: false,
    type: 'task',
  },
  {
    id: 'n6',
    title: 'You were mentioned in a note',
    description: '@you — please review the latest proposal.',
    time: '3d',
    read: true,
    trashed: false,
    type: 'mention',
  },
];

const TYPE_LABELS: Record<NotificationType, string> = {
  all: 'All',
  data: 'Data',
  call: 'Call',
  task: 'Task',
  mention: 'Mention',
};

// ── Component ─────────────────────────────────────────────────────────────────

interface NotificationsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationsSidebar: React.FC<NotificationsSidebarProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab]           = useState<Tab>('unread');
  const [typeFilter, setTypeFilter]         = useState<NotificationType>('all');
  const [showTypeMenu, setShowTypeMenu]     = useState(false);
  const [notifications, setNotifications]   = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [selected, setSelected]             = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  // ── Derived lists ─────────────────────────────────────────────────────────

  const visibleForTab = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.read && !n.trashed;
    if (activeTab === 'all')    return !n.trashed;
    if (activeTab === 'trash')  return n.trashed;
    return false;
  });

  const visible = typeFilter === 'all'
    ? visibleForTab
    : visibleForTab.filter((n) => n.type === typeFilter);

  const unreadCount = notifications.filter((n) => !n.read && !n.trashed).length;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === visible.length && visible.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(visible.map((n) => n.id)));
    }
  };

  const markReadSelected = () => {
    setNotifications((prev) =>
      prev.map((n) => (selected.has(n.id) ? { ...n, read: true } : n))
    );
    setSelected(new Set());
  };

  const trashSelected = () => {
    setNotifications((prev) =>
      prev.map((n) => (selected.has(n.id) ? { ...n, trashed: true } : n))
    );
    setSelected(new Set());
  };

  const restoreSelected = () => {
    setNotifications((prev) =>
      prev.map((n) => (selected.has(n.id) ? { ...n, trashed: false } : n))
    );
    setSelected(new Set());
  };

  const markOneRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const trashOne = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, trashed: true } : n))
    );
    setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
  };

  const allSelected = visible.length > 0 && selected.size === visible.length;
  const someSelected = selected.size > 0;

  // ── Tab change resets selection ───────────────────────────────────────────

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    setSelected(new Set());
    setTypeFilter('all');
    setShowTypeMenu(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1099,
          backgroundColor: 'transparent',
        }}
      />

      {/* Sidebar panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: '480px',
          backgroundColor: '#ffffff',
          zIndex: 1100,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.10)',
          borderLeft: '1px solid #cccccc',
          animation: 'slideInRight 0.22s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Header ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 20px 16px 24px',
            flexShrink: 0,
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#141414', margin: 0 }}>
            Notifications
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#141414', padding: '4px', display: 'flex', borderRadius: '4px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f8fa')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            borderBottom: '2px solid #e2e8f0',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
            {([ 
              { key: 'unread', label: `Unread (${unreadCount})` },
              { key: 'all',    label: 'All'   },
              { key: 'trash',  label: 'Trash' },
            ] as { key: Tab; label: string }[]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => switchTab(tab.key)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.key ? '2px solid #141414' : '2px solid transparent',
                  marginBottom: '-2px',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeTab === tab.key ? '600' : '400',
                  color: activeTab === tab.key ? '#141414' : '#718096',
                  fontFamily: 'inherit',
                  transition: 'color 0.15s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => { if (activeTab !== tab.key) e.currentTarget.style.color = '#141414'; }}
                onMouseLeave={(e) => { if (activeTab !== tab.key) e.currentTarget.style.color = '#718096'; }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Settings gear */}
          <button
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#718096', padding: '4px', display: 'flex', borderRadius: '4px',
            }}
            title="Notification settings"
            onMouseEnter={(e) => (e.currentTarget.style.color = '#141414')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#718096')}
          >
            <Settings size={18} />
          </button>
        </div>

        {/* ── Toolbar: Select all + Type filter ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 24px',
            borderBottom: '1px solid #eaf0f6',
            flexShrink: 0,
          }}
        >
          {/* Select all */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              onClick={toggleSelectAll}
              style={{
                width: '16px',
                height: '16px',
                border: `1.5px solid ${allSelected ? '#141414' : '#cccccc'}`,
                borderRadius: '3px',
                backgroundColor: allSelected ? '#141414' : '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.15s',
              }}
            >
              {allSelected && <Check size={11} color="#ffffff" strokeWidth={3} />}
              {!allSelected && someSelected && (
                <div style={{ width: '8px', height: '2px', backgroundColor: '#141414', borderRadius: '1px' }} />
              )}
            </div>

            <button
              onClick={toggleSelectAll}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontSize: '13px', color: '#141414', fontWeight: '500',
                fontFamily: 'inherit', padding: 0,
                display: 'flex', alignItems: 'center', gap: '4px',
              }}
            >
              Select all
            </button>
            <button
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: '#718096', display: 'flex', padding: '1px',
              }}
              title="Select all notifications on this tab"
            >
              <Info size={14} />
            </button>

            {/* Bulk action buttons — show when items selected */}
            {someSelected && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '4px' }}>
                {activeTab !== 'trash' && (
                  <button
                    onClick={markReadSelected}
                    style={{
                      padding: '3px 10px',
                      border: '1px solid #cccccc',
                      borderRadius: '4px',
                      background: '#ffffff',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#141414',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f8fa')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                  >
                    Mark read
                  </button>
                )}
                {activeTab === 'trash' ? (
                  <button
                    onClick={restoreSelected}
                    style={{
                      padding: '3px 10px',
                      border: '1px solid #cccccc',
                      borderRadius: '4px',
                      background: '#ffffff',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#141414',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f8fa')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                  >
                    Restore
                  </button>
                ) : (
                  <button
                    onClick={trashSelected}
                    style={{
                      padding: '3px 10px',
                      border: '1px solid #cccccc',
                      borderRadius: '4px',
                      background: '#ffffff',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#e53e3e',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fff5f5')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Type filter */}
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#141414' }}>
              <span style={{ color: '#718096' }}>Type:</span>
              <button
                onClick={() => setShowTypeMenu((v) => !v)}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  fontSize: '13px', fontWeight: '600', color: '#141414',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '3px',
                  padding: '2px 4px', borderRadius: '4px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f8fa')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                {TYPE_LABELS[typeFilter]}
                <ChevronDown size={13} style={{ transition: 'transform 0.15s', transform: showTypeMenu ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>
            </div>

            {showTypeMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  right: 0,
                  width: '140px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                  zIndex: 10,
                  overflow: 'hidden',
                  animation: 'contactDropIn 0.12s ease-out',
                }}
              >
                {(Object.keys(TYPE_LABELS) as NotificationType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTypeFilter(t); setShowTypeMenu(false); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '9px 14px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: '#141414',
                      fontFamily: 'inherit',
                      fontWeight: typeFilter === t ? '600' : '400',
                      backgroundColor: typeFilter === t ? '#f5f8fa' : 'transparent',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f8fa')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = typeFilter === t ? '#f5f8fa' : 'transparent')}
                  >
                    {TYPE_LABELS[t]}
                    {typeFilter === t && <Check size={13} strokeWidth={2.5} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Notification list ── */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {visible.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '200px',
                gap: '10px',
              }}
            >
              <div style={{ fontSize: '32px' }}>🔔</div>
              <p style={{ fontSize: '14px', color: '#718096', margin: 0 }}>
                {activeTab === 'trash' ? 'Trash is empty' : 'No notifications'}
              </p>
            </div>
          ) : (
            visible.map((notif) => {
              const isSelected = selected.has(notif.id);
              return (
                <div
                  key={notif.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    padding: '14px 24px',
                    borderBottom: '1px solid #eaf0f6',
                    backgroundColor: isSelected ? '#f8fafc' : '#ffffff',
                    transition: 'background-color 0.1s',
                    cursor: 'default',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLDivElement).style.backgroundColor = '#fafafa';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLDivElement).style.backgroundColor = '#ffffff';
                  }}
                >
                  {/* Checkbox */}
                  <div
                    onClick={() => toggleSelect(notif.id)}
                    style={{
                      width: '16px',
                      height: '16px',
                      border: `1.5px solid ${isSelected ? '#141414' : '#cccccc'}`,
                      borderRadius: '3px',
                      backgroundColor: isSelected ? '#141414' : '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                      transition: 'all 0.15s',
                    }}
                  >
                    {isSelected && <Check size={11} color="#ffffff" strokeWidth={3} />}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: notif.read ? '400' : '700',
                        color: '#141414',
                        marginBottom: notif.description ? '4px' : 0,
                        lineHeight: '1.4',
                      }}
                    >
                      {notif.title}
                    </div>
                    {notif.description && (
                      <div
                        style={{
                          fontSize: '13px',
                          color: '#666666',
                          lineHeight: '1.5',
                        }}
                      >
                        {notif.description}
                      </div>
                    )}
                  </div>

                  {/* Time + actions */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '6px',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: '12px', color: '#718096', whiteSpace: 'nowrap' }}>
                      {notif.time}
                    </span>

                    {/* Row actions — visible on hover via group styling */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {!notif.read && activeTab !== 'trash' && (
                        <button
                          onClick={() => markOneRead(notif.id)}
                          title="Mark as read"
                          style={{
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: '#718096', padding: '3px', display: 'flex', borderRadius: '3px',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0f0f0'; e.currentTarget.style.color = '#141414'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#718096'; }}
                        >
                          <Check size={14} />
                        </button>
                      )}
                      {activeTab !== 'trash' && (
                        <button
                          onClick={() => trashOne(notif.id)}
                          title="Delete"
                          style={{
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: '#718096', padding: '3px', display: 'flex', borderRadius: '3px',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fff0f0'; e.currentTarget.style.color = '#e53e3e'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#718096'; }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      {activeTab === 'trash' && (
                        <button
                          onClick={() => {
                            setNotifications((prev) =>
                              prev.map((n) => (n.id === notif.id ? { ...n, trashed: false } : n))
                            );
                          }}
                          title="Restore"
                          style={{
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: '#718096', padding: '3px', display: 'flex', borderRadius: '3px',
                            fontSize: '11px', fontFamily: 'inherit', fontWeight: '500',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0f0f0'; e.currentTarget.style.color = '#141414'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#718096'; }}
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(40px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes contactDropIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </>
  );
};

export default NotificationsSidebar;
