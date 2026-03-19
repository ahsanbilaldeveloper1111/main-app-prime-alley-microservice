import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { X, Settings, Info, ChevronDown, Trash2, Check, CheckCheck, Loader } from 'lucide-react';
import { useNotifications, type NotificationItem } from '../../contexts/NotificationContext';
import { ListNotifications, MarkNotificationAsRead, DeleteNotification } from '../../utils/notifications';
import router from 'next/router';
import { ModuleSlug } from '@utils/Helper';
import { usePermissions } from '@utils/permissionUtils';
import { HEADER_CONSTANTS } from '@constants/headerConstants';

const { PERMISSIONS } = HEADER_CONSTANTS;

// ── Constants ─────────────────────────────────────────────────────────────────

const PER_PAGE = 10;
const SCROLL_LOAD_MORE_THRESHOLD = 80;
const Z_INDEX_BACKDROP = 1099;
const Z_INDEX_PANEL = 1100;
const SIDEBAR_WIDTH = '480px';

const MODULE_SLUGS = {
  crm: ModuleSlug.CRM,
  work_planner: ModuleSlug.WORK_PLANNER,
  staff_management: ModuleSlug.STAFF_MANAGEMENT,
};

const MODULE_SLUGS_LIST = [
  { name: 'All', slug: '' },
  { name: 'CRM', slug: ModuleSlug.CRM },
  { name: 'Work Planner', slug: ModuleSlug.WORK_PLANNER },
  { name: 'Staff Management', slug: ModuleSlug.STAFF_MANAGEMENT },
];

const TARGET_TYPES = [
  { name: 'Prospect', slug: 'prospect', parent: MODULE_SLUGS.crm, permission: PERMISSIONS.VIEW_CRM_DATA_MANAGEMENT },
  { name: 'Lead', slug: 'lead', parent: MODULE_SLUGS.crm, permission: PERMISSIONS.VIEW_CRM_LEADS },
  { name: 'Deal', slug: 'deal', parent: MODULE_SLUGS.crm, permission: PERMISSIONS.VIEW_CRM_DEALS },
  { name: 'Order', slug: 'order', parent: MODULE_SLUGS.crm, permission: PERMISSIONS.VIEW_CRM_ORDERS },
  { name: 'Task', slug: 'task', parent: MODULE_SLUGS.work_planner, permission: PERMISSIONS.VIEW_TASKSLIST_WORK_PLANNER },
  { name: 'Project', slug: 'project', parent: MODULE_SLUGS.work_planner, permission: PERMISSIONS.VIEW_PROJECTS_WORK_PLANNER },
  { name: 'User Profile', slug: 'user_profile', parent: MODULE_SLUGS.staff_management, permission: PERMISSIONS.VIEW_EMPLOYEES_STAFF_MANAGEMENT },
  { name: 'User Requests', slug: 'user_request', parent: MODULE_SLUGS.staff_management, permission: PERMISSIONS.VIEW_EMPLOYEES_APPROVAL_REQUEST_STAFF_MANAGEMENT },
  { name: 'Attendence', slug: 'attendence', parent: MODULE_SLUGS.staff_management, permission: PERMISSIONS.VIEW_ATTENDENCE_STAFF_MANAGEMENT },
];

/** Reusable style for dropdown panels (Module, Target). */
const DROPDOWN_PANEL_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 4px)',
  right: 0,
  width: '160px',
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
  zIndex: 10,
  overflow: 'hidden',
  animation: 'contactDropIn 0.12s ease-out',
};

/** Reusable style for dropdown option buttons. */
const DROPDOWN_OPTION_BASE_STYLE: React.CSSProperties = {
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
  textAlign: 'left',
};

const LOADER_SPIN_STYLE: React.CSSProperties = { animation: 'spin 0.8s linear infinite' };

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'unread' | 'all' | 'trash';
type NotificationType = 'all' | 'data' | 'call' | 'task' | 'mention';

type ActionLoading =
  | null
  | 'mark-read-bulk'
  | 'delete-bulk'
  | { single: 'mark-read' | 'delete'; id: string };

interface Notification {
  id: string;
  title: string;
  description?: string;
  time: string;
  read: boolean;
  trashed: boolean;
  type: Exclude<NotificationType, 'all'>;
  action?: string;
  target_id?: string;
  target_type?: string;
  module?: string;
  source_service?: string | null;
  priority?: string;
  extension_id?: number | string | null;
  triggered_by_extension_id?: number | string | null;
}

// ── Helpers: real-time from context ───────────────────────────────────────────

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffM = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffM < 1) return 'now';
  if (diffM < 60) return `${diffM}m`;
  if (diffH < 24) return `${diffH}h`;
  if (diffD < 7) return `${diffD}d`;
  return `${Math.floor(diffD / 7)}w`;
}

function deriveType(item: NotificationItem): Exclude<NotificationType, 'all'> {
  const targetType = (item.data as { target_type?: string } | undefined)?.target_type?.toLowerCase();
  const moduleName = (item.module ?? '').toLowerCase();
  if (targetType === 'task' || moduleName.includes('task') || moduleName.includes('work-planner')) return 'task';
  if (targetType === 'call' || moduleName.includes('call')) return 'call';
  if (targetType === 'mention' || moduleName.includes('mention')) return 'mention';
  return 'data';
}

function mapContextToNotification(item: NotificationItem, trashedIds: Set<string>): Notification {
  const data = item.data as {
    action?: string;
    target_id?: string;
    target_type?: string;
    module?: string;
    source_service?: string | null;
    priority?: string;
    extension_id?: number | string | null;
    triggered_by_extension_id?: number | string | null;
  } | undefined;
  return {
    id: item.id,
    title: item.title,
    description: item.description || item.body || undefined,
    time: formatRelativeTime(item.timestamp),
    read: item.read,
    trashed: trashedIds.has(item.id),
    type: deriveType(item),
    action: data?.action,
    target_id: data?.target_id != null ? String(data.target_id) : undefined,
    target_type: data?.target_type,
    module: data?.module ?? item.module,
    source_service: data?.source_service,
    priority: data?.priority,
    extension_id: data?.extension_id,
    triggered_by_extension_id: data?.triggered_by_extension_id,
  };
}

/** API notification row (ListNotifications response). */
interface ApiNotificationRow {
  id: number;
  title?: string;
  description?: string;
  created_at?: string;
  status?: string;
  action?: string;
  target_id?: string | number;
  target_type?: string;
  module?: string;
  source_service?: string | null;
  priority?: string;
  extension_id?: number | string | null;
  triggered_by_extension_id?: number | string | null;
  [key: string]: unknown;
}

function deriveTypeFromApiRow(row: ApiNotificationRow): Exclude<NotificationType, 'all'> {
  const t = (row.target_type ?? '').toLowerCase();
  const m = (row.module ?? '').toLowerCase();
  if (t === 'task' || m.includes('task') || m.includes('work-planner')) return 'task';
  if (t === 'call' || m.includes('call')) return 'call';
  if (t === 'mention' || m.includes('mention')) return 'mention';
  return 'data';
}

function mapApiRowToNotification(row: ApiNotificationRow): Notification {
  return {
    id: String(row.id),
    title: row.title ?? 'Notification',
    description: row.description,
    time: row.created_at ? formatRelativeTime(new Date(row.created_at)) : 'now',
    read: row.status === 'read',
    trashed: false,
    type: deriveTypeFromApiRow(row),
    action: row.action,
    target_id: row.target_id != null ? String(row.target_id) : undefined,
    target_type: row.target_type,
    module: row.module,
    source_service: row.source_service,
    priority: row.priority,
    extension_id: row.extension_id,
    triggered_by_extension_id: row.triggered_by_extension_id,
  };
}

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
  const { notifications: contextNotifications, markAsRead } = useNotifications();
  const { hasPermission } = usePermissions();

  // Tabs and filters
  const [activeTab, setActiveTab] = useState<Tab>('unread');
  const [typeFilter, setTypeFilter] = useState<NotificationType>('all');
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [targetFilter, setTargetFilter] = useState<string>('');
  const [showTargetMenu, setShowTargetMenu] = useState(false);
  const [moduleFilter, setModuleFilter] = useState<string>('');
  const [showModuleMenu, setShowModuleMenu] = useState(false);

  // Selection and local state
  const [trashedIds, setTrashedIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // API data and pagination
  const [apiListAllTab, setApiListAllTab] = useState<Notification[]>([]);
  const [apiLoadingAllTab, setApiLoadingAllTab] = useState(false);
  const [apiListUnreadTab, setApiListUnreadTab] = useState<Notification[]>([]);
  const [apiLoadingUnreadTab, setApiLoadingUnreadTab] = useState(false);
  const [apiListTrashTab, setApiListTrashTab] = useState<Notification[]>([]);
  const [apiLoadingTrashTab, setApiLoadingTrashTab] = useState(false);
  const [countAll, setCountAll] = useState(0);
  const [countUnread, setCountUnread] = useState(0);
  const [countTrash, setCountTrash] = useState(0);
  const [pageAll, setPageAll] = useState(1);
  const [pageUnread, setPageUnread] = useState(1);
  const [pageTrash, setPageTrash] = useState(1);
  const [loadingMoreAll, setLoadingMoreAll] = useState(false);
  const [loadingMoreUnread, setLoadingMoreUnread] = useState(false);
  const [loadingMoreTrash, setLoadingMoreTrash] = useState(false);

  // Row/bulk action loading and refs
  const [actionLoading, setActionLoading] = useState<ActionLoading>(null);
  const listScrollRef = useRef<HTMLDivElement>(null);

  const notifications = useMemo(
    () => contextNotifications.map((item) => mapContextToNotification(item, trashedIds)),
    [contextNotifications, trashedIds]
  );

  const parseNotificationResponse = (res: {
    notifications?: ApiNotificationRow[] | { dataList?: ApiNotificationRow[]; meta?: { total?: number } };
  }): { list: Notification[]; total: number } => {
    const raw = res?.notifications;
    const meta = raw && typeof raw === 'object' && !Array.isArray(raw) && 'meta' in raw ? raw.meta : undefined;
    const total = typeof meta?.total === 'number' ? meta.total : 0;
    const rows: ApiNotificationRow[] = Array.isArray(raw)
      ? raw
      : (raw && typeof raw === 'object' && 'dataList' in raw ? raw.dataList : []) ?? [];
    const list = rows.map(mapApiRowToNotification);
    return { list, total: total > 0 ? total : list.length };
  };

  // Build filters per tab: only the active tab's request gets target_type and module
  const baseFiltersAll = useMemo(
    () => ({
      ...(activeTab === 'all' && targetFilter ? { target_type: targetFilter } : {}),
      ...(activeTab === 'all' && moduleFilter ? { module: moduleFilter } : {}),
    }),
    [activeTab, targetFilter, moduleFilter]
  );
  const baseFiltersUnread = useMemo(
    () => ({
      ...(activeTab === 'unread' && targetFilter ? { target_type: targetFilter } : {}),
      ...(activeTab === 'unread' && moduleFilter ? { module: moduleFilter } : {}),
      read: 'false',
    }),
    [activeTab, targetFilter, moduleFilter]
  );
  const baseFiltersTrash = useMemo(
    () => ({
      ...(activeTab === 'trash' && targetFilter ? { target_type: targetFilter } : {}),
      ...(activeTab === 'trash' && moduleFilter ? { module: moduleFilter } : {}),
      deleted: 'only',
    }),
    [activeTab, targetFilter, moduleFilter]
  );

  const visibleTargetTypes = useMemo(
    () =>
      TARGET_TYPES.filter(
        (t) => hasPermission(t.permission) && (!moduleFilter || t.parent === moduleFilter)
      ),
    [hasPermission, moduleFilter]
  );

  useEffect(() => {
    if (targetFilter && !visibleTargetTypes.some((t) => t.slug === targetFilter)) {
      setTargetFilter('');
    }
  }, [visibleTargetTypes, targetFilter]);

  // Fetch all three tabs when sidebar opens or target filter changes (page 1)
  useEffect(() => {
    if (!isOpen) return;

    const params = { perPage: PER_PAGE, page: 1 };
    const filtersAll = Object.keys(baseFiltersAll).length ? { filters: baseFiltersAll } : {};
    const filtersUnread = { filters: baseFiltersUnread };
    const filtersTrash = { filters: baseFiltersTrash };

    setPageAll(1);
    setPageUnread(1);
    setPageTrash(1);
    setApiLoadingAllTab(true);
    setApiLoadingUnreadTab(true);
    setApiLoadingTrashTab(true);

    Promise.all([
      ListNotifications({ ...params, ...filtersAll }).then(parseNotificationResponse),
      ListNotifications({ ...params, ...filtersUnread }).then(parseNotificationResponse),
      ListNotifications({ ...params, ...filtersTrash }).then(parseNotificationResponse),
    ])
      .then(([all, unread, trash]) => {
        setApiListAllTab(all.list);
        setCountAll(all.total);
        setApiListUnreadTab(unread.list);
        setCountUnread(unread.total);
        setApiListTrashTab(trash.list);
        setCountTrash(trash.total);
      })
      .catch(() => {
        setApiListAllTab([]);
        setCountAll(0);
        setApiListUnreadTab([]);
        setCountUnread(0);
        setApiListTrashTab([]);
        setCountTrash(0);
      })
      .finally(() => {
        setApiLoadingAllTab(false);
        setApiLoadingUnreadTab(false);
        setApiLoadingTrashTab(false);
      });
  }, [isOpen, baseFiltersAll, baseFiltersUnread, baseFiltersTrash]);

  const refetchLists = useCallback(() => {
    const params = { perPage: PER_PAGE, page: 1 };
    const filtersAll = Object.keys(baseFiltersAll).length ? { filters: baseFiltersAll } : {};
    const filtersUnread = { filters: baseFiltersUnread };
    const filtersTrash = { filters: baseFiltersTrash };
    setPageAll(1);
    setPageUnread(1);
    setPageTrash(1);
    return Promise.all([
      ListNotifications({ ...params, ...filtersAll }).then(parseNotificationResponse),
      ListNotifications({ ...params, ...filtersUnread }).then(parseNotificationResponse),
      ListNotifications({ ...params, ...filtersTrash }).then(parseNotificationResponse),
    ])
      .then(([all, unread, trash]) => {
        setApiListAllTab(all.list);
        setCountAll(all.total);
        setApiListUnreadTab(unread.list);
        setCountUnread(unread.total);
        setApiListTrashTab(trash.list);
        setCountTrash(trash.total);
      })
      .catch(() => {});
  }, [baseFiltersAll, baseFiltersUnread, baseFiltersTrash]);

  const appendDedupe = (prev: Notification[], next: Notification[]): Notification[] => {
    const ids = new Set(prev.map((n) => n.id));
    const added = next.filter((n) => !ids.has(n.id));
    return added.length ? [...prev, ...added] : prev;
  };

  const loadMore = useCallback(() => {
    const filtersAll = Object.keys(baseFiltersAll).length ? baseFiltersAll : undefined;
    const filtersUnread = { ...baseFiltersUnread, status: 'unread' };
    const filtersTrash = { ...baseFiltersTrash };

    if (activeTab === 'all') {
      if (loadingMoreAll || apiLoadingAllTab || apiListAllTab.length >= countAll) return;
      setLoadingMoreAll(true);
      const nextPage = pageAll + 1;
      ListNotifications({ perPage: PER_PAGE, page: nextPage, ...(filtersAll ? { filters: filtersAll } : {}) })
        .then(parseNotificationResponse)
        .then(({ list }) => {
          setApiListAllTab((prev) => appendDedupe(prev, list));
          setPageAll(nextPage);
        })
        .finally(() => setLoadingMoreAll(false));
      return;
    }
    if (activeTab === 'unread') {
      if (loadingMoreUnread || apiLoadingUnreadTab || apiListUnreadTab.length >= countUnread) return;
      setLoadingMoreUnread(true);
      const nextPage = pageUnread + 1;
      ListNotifications({ perPage: PER_PAGE, page: nextPage, filters: filtersUnread })
        .then(parseNotificationResponse)
        .then(({ list }) => {
          setApiListUnreadTab((prev) => appendDedupe(prev, list));
          setPageUnread(nextPage);
        })
        .finally(() => setLoadingMoreUnread(false));
      return;
    }
    if (activeTab === 'trash') {
      if (loadingMoreTrash || apiLoadingTrashTab || apiListTrashTab.length >= countTrash) return;
      setLoadingMoreTrash(true);
      const nextPage = pageTrash + 1;
      ListNotifications({ perPage: PER_PAGE, page: nextPage, filters: filtersTrash })
        .then(parseNotificationResponse)
        .then(({ list }) => {
          setApiListTrashTab((prev) => appendDedupe(prev, list));
          setPageTrash(nextPage);
        })
        .finally(() => setLoadingMoreTrash(false));
    }
  }, [
    activeTab,
    targetFilter,
    baseFiltersAll,
    pageAll,
    pageUnread,
    pageTrash,
    countAll,
    countUnread,
    countTrash,
    apiListAllTab.length,
    apiListUnreadTab.length,
    apiListTrashTab.length,
    loadingMoreAll,
    loadingMoreUnread,
    loadingMoreTrash,
    apiLoadingAllTab,
    apiLoadingUnreadTab,
    apiLoadingTrashTab,
  ]);

  const handleListScroll = useCallback(() => {
    const el = listScrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollTop + clientHeight >= scrollHeight - SCROLL_LOAD_MORE_THRESHOLD) loadMore();
  }, [loadMore]);

  if (!isOpen) return null;

  // ── Derived lists ─────────────────────────────────────────────────────────
  const visibleForTab =
    activeTab === 'all'
      ? apiListAllTab
      : activeTab === 'unread'
        ? apiListUnreadTab
        : apiListTrashTab;

  const visible = typeFilter === 'all'
    ? visibleForTab
    : visibleForTab.filter((n) => n.type === typeFilter);

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
    const ids = Array.from(selected);
    ids.forEach((id) => markAsRead(id));
    setActionLoading('mark-read-bulk');
    Promise.all(ids.map((id) => MarkNotificationAsRead(id)))
      .then(() => refetchLists())
      .catch((err) => console.error('Mark as read API failed:', err))
      .finally(() => {
        setActionLoading(null);
        setSelected(new Set());
      });
  };

  const trashSelected = () => {
    const ids = Array.from(selected);
    setTrashedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
    setActionLoading('delete-bulk');
    Promise.all(ids.map((id) => DeleteNotification(id)))
      .then(() => refetchLists())
      .catch(() => {})
      .finally(() => {
        setActionLoading(null);
        setSelected(new Set());
      });
  };

  const restoreSelected = () => {
    setTrashedIds((prev) => {
      const next = new Set(prev);
      selected.forEach((id) => next.delete(id));
      return next;
    });
    if (activeTab === 'trash') {
      setApiListTrashTab((prev) => prev.filter((n) => !selected.has(n.id)));
    }
    setSelected(new Set());
  };

  const markOneRead = (id: string) => {
    markAsRead(id);
    setActionLoading({ single: 'mark-read', id });
    MarkNotificationAsRead(id)
      .then(() => refetchLists())
      .catch(() => {})
      .finally(() => setActionLoading(null));
  };

  const trashOne = (id: string) => {
    setTrashedIds((prev) => new Set(prev).add(id));
    setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
    setActionLoading({ single: 'delete', id });
    DeleteNotification(id)
      .then(() => refetchLists())
      .catch(() => {})
      .finally(() => setActionLoading(null));
  };

  const allSelected = visible.length > 0 && selected.size === visible.length;
  const someSelected = selected.size > 0;

  const isRowActionLoading = (action: 'mark-read' | 'delete', id: string) =>
    Boolean(
      actionLoading &&
        typeof actionLoading === 'object' &&
        actionLoading.single === action &&
        actionLoading.id === id
    );

  // ── Tab change resets selection ───────────────────────────────────────────

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    setSelected(new Set());
    setTypeFilter('all');
    setShowTypeMenu(false);
  };

  const handleNotificationClick = (notif: Notification) => {
    onClose();
    markAsRead(notif.id);
    MarkNotificationAsRead(notif.id).catch(() => {});

    const { target_id, target_type, module } = notif;

    switch (module) {


      case 'staff-management':
        if (!hasPermission(PERMISSIONS.STAFF_MANAGEMENT_SERVICES)) break;
        switch (target_type) {
          case 'user_request':
            if (hasPermission(PERMISSIONS.VIEW_EMPLOYEES_APPROVAL_REQUEST_STAFF_MANAGEMENT) && target_id) {
              router.push(`/workforce/approval-requests?openId=${encodeURIComponent(target_id)}`);
            }
            break;
          case 'attendence':
            if (hasPermission(PERMISSIONS.VIEW_ATTENDENCE_STAFF_MANAGEMENT)) {
              router.push(`/workforce/attendance`);
            }
            break;

          case 'user_profile':
            if (hasPermission(PERMISSIONS.VIEW_EMPLOYEES_STAFF_MANAGEMENT) && target_id) {
              router.push(`/workforce/employees?openId=${encodeURIComponent(target_id)}`);
            }
            break;
        }
        break;

      case 'work-planner':
        if (!hasPermission(PERMISSIONS.WORK_PLANNER_SERVICES)) break;
        switch (target_type) {
          case 'task':
            if (hasPermission(PERMISSIONS.VIEW_TASKSLIST_WORK_PLANNER)) {
              router.push(`/planner/tasks/${target_id}`);
            }
            break;

          case 'project':
            if (hasPermission(PERMISSIONS.VIEW_PROJECTS_WORK_PLANNER)) {
              router.push(`/planner/projects/${target_id}`);
            }
            break;
        }
        break;

      case 'crm':
        if (!hasPermission(PERMISSIONS.CRM_SERVICES)) break;
        switch (target_type) {
          case 'prospect':
            if (hasPermission(PERMISSIONS.VIEW_CRM_DATA_MANAGEMENT)) {
              router.push(`/crm/detailspage?type=prospect&id=${target_id}`);
            }
            break;
          case 'lead':
            if (hasPermission(PERMISSIONS.VIEW_CRM_LEADS)) {
              router.push(`/crm/detailspage?type=lead&id=${target_id}`);
            }
            break;
          case 'deal':
            if (hasPermission(PERMISSIONS.VIEW_CRM_DEALS)) {
              router.push(`/crm/detailspage?type=deal&id=${target_id}`);
            }
            break;
          case 'order':
            if (hasPermission(PERMISSIONS.VIEW_CRM_ORDERS)) {
              router.push(`/crm/orders/${target_id}/order-detailpage`);
            }
            break;
        }
        break;
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: Z_INDEX_BACKDROP,
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
          width: SIDEBAR_WIDTH,
          backgroundColor: '#ffffff',
          zIndex: Z_INDEX_PANEL,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.10)',
          borderLeft: '1px solid #cccccc',
          animation: 'slideInRight 0.22s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
              { key: 'unread', label: `Unread (${countUnread})` },
              { key: 'all', label: `All (${countAll})` },
              { key: 'trash', label: `Trash (${countTrash})` },
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
                    disabled={!!actionLoading}
                    style={{
                      padding: '3px 10px',
                      border: '1px solid #cccccc',
                      borderRadius: '4px',
                      background: actionLoading ? '#f0f0f0' : '#ffffff',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#141414',
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                      opacity: actionLoading ? 0.8 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '72px',
                    }}
                    onMouseEnter={(e) => { if (!actionLoading) e.currentTarget.style.backgroundColor = '#f5f8fa'; }}
                    onMouseLeave={(e) => { if (!actionLoading) e.currentTarget.style.backgroundColor = '#ffffff'; }}
                  >
                    {actionLoading === 'mark-read-bulk' ? (
                      <Loader size={14} style={LOADER_SPIN_STYLE} />
                    ) : (
                      'Mark read'
                    )}
                  </button>
                )}
                {activeTab !== 'trash' && (
                  <button
                    onClick={trashSelected}
                    disabled={!!actionLoading}
                    style={{
                      padding: '3px 10px',
                      border: '1px solid #cccccc',
                      borderRadius: '4px',
                      background: actionLoading ? '#fff0f0' : '#ffffff',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#e53e3e',
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                      opacity: actionLoading ? 0.8 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '52px',
                    }}
                    onMouseEnter={(e) => { if (!actionLoading) e.currentTarget.style.backgroundColor = '#fff5f5'; }}
                    onMouseLeave={(e) => { if (!actionLoading) e.currentTarget.style.backgroundColor = '#ffffff'; }}
                  >
                    {actionLoading === 'delete-bulk' ? (
                      <Loader size={14} style={LOADER_SPIN_STYLE} />
                    ) : (
                      'Delete'
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Module filter — selection sent as module in payload */}
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#141414' }}>
              <span style={{ color: '#718096' }}>Module:</span>
              <button
                onClick={() => { setShowModuleMenu((v) => !v); setShowTargetMenu(false); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#141414',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '2px 4px',
                  borderRadius: '4px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f8fa')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                {moduleFilter ? (MODULE_SLUGS_LIST.find((m) => m.slug === moduleFilter)?.name ?? moduleFilter) : 'All'}
                <ChevronDown size={13} style={{ transition: 'transform 0.15s', transform: showModuleMenu ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>
            </div>
            {showModuleMenu && (
              <div style={DROPDOWN_PANEL_STYLE}>
                {MODULE_SLUGS_LIST.map((m) => {
                  const isSelected = moduleFilter === m.slug;
                  return (
                    <button
                      key={m.slug || 'all'}
                      onClick={() => { setModuleFilter(m.slug); setShowModuleMenu(false); }}
                      style={{
                        ...DROPDOWN_OPTION_BASE_STYLE,
                        fontWeight: isSelected ? '600' : '400',
                        backgroundColor: isSelected ? '#f5f8fa' : 'transparent',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f8fa')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isSelected ? '#f5f8fa' : 'transparent')}
                    >
                      {m.name}
                      {isSelected && <Check size={13} strokeWidth={2.5} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Target filter — filtered by selected module_slug (parent); only show if user has at least one permitted target */}
          {visibleTargetTypes.length > 0 && (
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#141414' }}>
              <span style={{ color: '#718096' }}>Target:</span>
              <button
                onClick={() => { setShowTargetMenu((v) => !v); setShowModuleMenu(false); }}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  fontSize: '13px', fontWeight: '600', color: '#141414',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '3px',
                  padding: '2px 4px', borderRadius: '4px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f8fa')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                {targetFilter ? (visibleTargetTypes.find((t) => t.slug === targetFilter)?.name ?? targetFilter) : 'All'}
                <ChevronDown size={13} style={{ transition: 'transform 0.15s', transform: showTargetMenu ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>
            </div>

            {showTargetMenu && (
              <div style={DROPDOWN_PANEL_STYLE}>
                <button
                  onClick={() => { setTargetFilter(''); setShowTargetMenu(false); }}
                  style={{
                    ...DROPDOWN_OPTION_BASE_STYLE,
                    fontWeight: !targetFilter ? '600' : '400',
                    backgroundColor: !targetFilter ? '#f5f8fa' : 'transparent',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f8fa')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = !targetFilter ? '#f5f8fa' : 'transparent')}
                >
                  All
                  {!targetFilter && <Check size={13} strokeWidth={2.5} />}
                </button>
                {visibleTargetTypes.map((t) => {
                  const isSelected = targetFilter === t.slug;
                  return (
                    <button
                      key={t.slug}
                      onClick={() => { setTargetFilter(t.slug); setShowTargetMenu(false); }}
                      style={{
                        ...DROPDOWN_OPTION_BASE_STYLE,
                        fontWeight: isSelected ? '600' : '400',
                        backgroundColor: isSelected ? '#f5f8fa' : 'transparent',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f8fa')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isSelected ? '#f5f8fa' : 'transparent')}
                    >
                      {t.name}
                      {isSelected && <Check size={13} strokeWidth={2.5} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          )}
        </div>

        {/* ── Notification list ── */}
        <div
          ref={listScrollRef}
          onScroll={handleListScroll}
          style={{ flex: 1, overflowY: 'auto', position: 'relative' }}
        >
          {(activeTab === 'all' && apiLoadingAllTab) ||
          (activeTab === 'unread' && apiLoadingUnreadTab) ||
          (activeTab === 'trash' && apiLoadingTrashTab) ? (
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
              <div style={{ fontSize: '24px' }}>⋯</div>
              <p style={{ fontSize: '14px', color: '#718096', margin: 0 }}>Loading notifications…</p>
            </div>
          ) : visible.length === 0 ? (
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
            <>
            {visible.map((notif) => {
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
                      onClick={() => handleNotificationClick(notif)}
                      style={{
                        fontSize: '14px',
                        fontWeight: notif.read ? '400' : '700',
                        color: '#141414',
                        marginBottom: notif.description ? '4px' : 0,
                        lineHeight: '1.4',
                        cursor: 'pointer',
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
                      {activeTab !== 'trash' && (notif.read ? (
                        <span title="Read" style={{ display: 'flex', padding: '3px', color: '#2563eb' }}>
                          <CheckCheck size={14} />
                        </span>
                      ) : (
                        <button
                          onClick={() => markOneRead(notif.id)}
                          disabled={!!actionLoading}
                          title="Mark as read"
                          style={{
                            background: 'transparent', border: 'none', cursor: actionLoading ? 'not-allowed' : 'pointer',
                            color: '#718096', padding: '3px', display: 'flex', borderRadius: '3px',
                            opacity: actionLoading ? 0.6 : 1,
                          }}
                          onMouseEnter={(e) => { if (!actionLoading) { e.currentTarget.style.backgroundColor = '#f0f0f0'; e.currentTarget.style.color = '#141414'; } }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#718096'; }}
                        >
                          {isRowActionLoading('mark-read', notif.id) ? (
                            <Loader size={14} style={LOADER_SPIN_STYLE} />
                          ) : (
                            <Check size={14} />
                          )}
                        </button>
                      ))}
                      {activeTab !== 'trash' && (
                        <button
                          onClick={() => trashOne(notif.id)}
                          disabled={!!actionLoading}
                          title="Delete"
                          style={{
                            background: 'transparent', border: 'none', cursor: actionLoading ? 'not-allowed' : 'pointer',
                            color: '#718096', padding: '3px', display: 'flex', borderRadius: '3px',
                            opacity: actionLoading ? 0.6 : 1,
                          }}
                          onMouseEnter={(e) => { if (!actionLoading) { e.currentTarget.style.backgroundColor = '#fff0f0'; e.currentTarget.style.color = '#e53e3e'; } }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#718096'; }}
                        >
                          {isRowActionLoading('delete', notif.id) ? (
                            <Loader size={14} style={LOADER_SPIN_STYLE} />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {((activeTab === 'all' && loadingMoreAll) ||
              (activeTab === 'unread' && loadingMoreUnread) ||
              (activeTab === 'trash' && loadingMoreTrash)) && (
              <div style={{ padding: '12px 24px', textAlign: 'center', fontSize: '13px', color: '#718096' }}>
                Loading more…
              </div>
            )}
          </>
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
