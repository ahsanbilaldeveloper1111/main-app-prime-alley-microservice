import React, { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import {
  Bell,
  ChevronDown,
  MoreVertical,
  Phone,
  Search,
  User,
  HelpCircle,
  Settings,
  ExternalLink,
  Sparkles,
  Plus,
  MonitorCheck,
} from "lucide-react";
import GlobalFloatingCallBar from "@components/GlobalFloatingCallBar";
import {
  SIDEBAR_WIDTH_COLLAPSED,
  SIDEBAR_WIDTH_EXPANDED,
} from "../Moduler/AppCustomerSidebar";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import { canAccessRoute, getSearchableRoutes } from "../../config/permissions";
import { getAllowedAccountBillingTabs } from "@components/billings/shared/accountBillingTabs";
import { getNotificationsOverflowLabel } from "./layoutCtiHelpers";
import type { SearchableRouteItem } from "./layoutTypes";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../contexts/NotificationContext";
import { useDialerModal } from "../../contexts/DialerModalContext";
import { useCti } from "@hooks/useCti";
import { getCurrentUserCompanyImage } from "@utils/company";
import { getStorageImageUrl } from "@utils/imageUtils";
import { useAppDispatch, useAppSelector } from "../../toolkit/hooks";
import {
  clearSearchField,
  setDialerPosition,
  setHeaderLogoUrl,
  setSearchQuery,
  setShowCreateCompanySidebar,
  setShowCreateDropdown,
  setShowCreateLeadModal,
  setShowCreateTaskSidebar,
  setShowCreateTicketSidebar,
  setShowIconsDropdown,
  setShowNotificationsSidebar,
  setShowSearchSuggestions,
  setShowUserDropdown,
  toggleBreezeAssistant,
  toggleShowIconsDropdown,
} from "../../toolkit/layoutUi/slice";

const { PERMISSIONS } = HEADER_CONSTANTS;

export default function LayoutTopBar() {
  const router = useRouter();
  const { data: session } = useSession();
  const { logout } = useAuth();
  const dispatch = useAppDispatch();
  const { unreadCount: totalUnreadCount } = useNotifications();
  const { isOpen: isDialerOpen, openDialer } = useDialerModal();
  const { isInitialized } = useCti();

  const isSidebarExpanded = useAppSelector((s) => s.layoutUi.isSidebarExpanded);
  const searchQuery = useAppSelector((s) => s.layoutUi.searchQuery);
  const showSearchSuggestions = useAppSelector(
    (s) => s.layoutUi.showSearchSuggestions,
  );
  const showCreateDropdown = useAppSelector((s) => s.layoutUi.showCreateDropdown);
  const showIconsDropdown = useAppSelector((s) => s.layoutUi.showIconsDropdown);
  const showUserDropdown = useAppSelector((s) => s.layoutUi.showUserDropdown);
  const headerLogoUrl = useAppSelector((s) => s.layoutUi.headerLogoUrl);

  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const iconsDropdownRef = useRef<HTMLDivElement>(null);
  const dialerButtonRef = useRef<HTMLButtonElement>(null);
  const headerLogoUrlRef = useRef<string | null>(null);

  const loggedInName = session?.user?.name ?? "";
  const loggedInCompanyName = session?.user?.company_name ?? "";
  const profileImageUrl = session?.user?.profile_picture
    ? getStorageImageUrl(session.user.profile_picture) || null
    : null;

  const searchableRoutes = useMemo<SearchableRouteItem[]>(
    () => getSearchableRoutes() as SearchableRouteItem[],
    [],
  );
  const searchSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const userPerms = session?.user?.permissions;
    return searchableRoutes
      .filter(
        (r: SearchableRouteItem) =>
          (r.path.toLowerCase().includes(q) ||
            r.label.toLowerCase().includes(q)) &&
          canAccessRoute(userPerms, r.path),
      )
      .slice(0, 10);
  }, [searchQuery, searchableRoutes, session?.user?.permissions]);

  useEffect(() => {
    let cancelled = false;
    getCurrentUserCompanyImage()
      .then((blob) => {
        if (cancelled) return;
        if (blob && blob.size > 0) {
          dispatch(setHeaderLogoUrl(""));
        } else {
          dispatch(setHeaderLogoUrl(null));
        }
      })
      .catch(() => {
        if (!cancelled) dispatch(setHeaderLogoUrl(null));
      });
    return () => {
      cancelled = true;
      const url = headerLogoUrlRef.current;
      if (url) {
        URL.revokeObjectURL(url);
        headerLogoUrlRef.current = null;
      }
    };
  }, [dispatch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(e.target as Node)
      ) {
        dispatch(clearSearchField());
      }
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(e.target as Node)
      ) {
        dispatch(setShowUserDropdown(false));
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dispatch]);

  useEffect(() => {
    if (isDialerOpen && dialerButtonRef.current) {
      const buttonRect = dialerButtonRef.current.getBoundingClientRect();
      const popupWidth = Math.min(625, window.innerWidth - 40);
      const popupHeight = 400;
      const spacing = 10;

      let right = window.innerWidth - buttonRect.right;

      if (buttonRect.right - popupWidth < 20) {
        right = 20;
      }

      let top = buttonRect.bottom + spacing;

      if (top + popupHeight > window.innerHeight - 20) {
        top = buttonRect.top - popupHeight - spacing;
        if (top < 90) {
          top = 90;
        }
      }

      dispatch(setDialerPosition({ top, right }));
    }
  }, [isDialerOpen, dispatch]);

  return (
    <>
      {/* Top bar */}
      <nav
          className="navbar navbar-expand-lg app-topbar-merged"
          style={{
            position: "fixed",
            top: 0,
            left: isSidebarExpanded
              ? SIDEBAR_WIDTH_EXPANDED
              : SIDEBAR_WIDTH_COLLAPSED,
            width: `calc(100% - ${isSidebarExpanded ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED}px)`,
            zIndex: 999,
            transition: "left 0.3s ease-in-out, width 0.3s ease-in-out",
          }}
        >
          <div className="container-fluid p-0" style={{ height: "48px" }}>
            <div className="d-flex align-items-center h-100 w-100">
              {/* Search bar */}
              <div
                ref={searchWrapperRef}
                className="crm-prime-search-wrapper"
                style={{ position: "relative" }}
              >
                <Search
                  className="crm-prime-search-icon"
                  size={14}
                  style={{ right: "40px" }}
                />
                <input
                  type="text"
                  className="crm-prime-search-input"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => {
                    dispatch(setSearchQuery(e.target.value));
                    dispatch(setShowSearchSuggestions(true));
                  }}
                />
                {showSearchSuggestions && searchSuggestions.length > 0 && (
                  <div
                    className="create-dropdown-menu"
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      marginTop: 4,
                      maxHeight: 320,
                      overflowY: "auto",
                      zIndex: 1050,
                    }}
                  >
                    {searchSuggestions.map((r: SearchableRouteItem) => (
                      <button
                        key={r.path}
                        type="button"
                        className="create-dropdown-item"
                        onClick={() => {
                          if (canAccessRoute(session?.user?.permissions, r.path)) {
                            router.push(r.path);
                            dispatch(clearSearchField());
                          }
                        }}
                      >
                        <span>{r.label}</span>
                        <span className="text-muted small ms-1">{r.path}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Create Button */}
              <div>
                  <button
                    type="button"
                    className="crm-prime-create-btn"
                    onClick={() =>
                      dispatch(setShowCreateDropdown(!showCreateDropdown))
                    }
                    title="Create new"
                  >
                    <Plus size={14} />
                  </button>

                  {/* Create Dropdown */}
                  {showCreateDropdown && (
                    <>
                      <button
                        type="button"
                        aria-label="Close create menu"
                        style={{
                          position: "fixed",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          zIndex: 1040,
                          background: "transparent",
                          border: "none",
                          padding: 0,
                          cursor: "default",
                        }}
                        onClick={() => dispatch(setShowCreateDropdown(false))}
                      />
                      <div className="create-dropdown-menu">
                        {session?.user?.permissions?.includes(
                          PERMISSIONS.VIEW_CRM_LEADS,
                        ) && (
                          <button
                            type="button"
                            className="create-dropdown-item"
                            onClick={() => {
                              dispatch(setShowCreateDropdown(false));
                              dispatch(setShowCreateLeadModal(true));
                            }}
                          >
                            Lead
                          </button>
                        )}

                        {session?.user?.permissions?.includes(
                          PERMISSIONS.VIEW_COMPANIES_CRM,
                        ) && (
                          <button
                            className="create-dropdown-item"
                            onClick={() => {
                              dispatch(setShowCreateDropdown(false));
                              dispatch(setShowCreateCompanySidebar(true));
                            }}
                          >
                            Company
                          </button>
                        )}

                        {session?.user?.permissions?.includes(
                          PERMISSIONS.VIEW_WHATSAPP_MESSAGES_CRM,
                        ) && (
                          <button
                            type="button"
                            className="create-dropdown-item"
                            onClick={() => {
                              dispatch(setShowCreateDropdown(false));
                              router.push("/crm/inbox");
                            }}
                          >
                            Inbox
                          </button>
                        )}

                        {session?.user?.permissions?.includes(PERMISSIONS.MANAGE_HELP_CENTER) && (
                        <button className="create-dropdown-item" onClick={() => {
                          dispatch(setShowCreateDropdown(false));
                          dispatch(setShowCreateTicketSidebar(true));
                        }}>
                        Ticket
                          </button>
                        )}

                        {session?.user?.permissions?.includes(PERMISSIONS.VIEW_TASKSLIST_WORK_PLANNER) && (
                        <button type="button" className="create-dropdown-item" onClick={() => {
                          dispatch(setShowCreateDropdown(false));
                          dispatch(setShowCreateTaskSidebar(true));
                        }}>
                        Task
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>

            {/* Icons and user menu */}
            <div className="ms-auto d-flex align-items-center" style={{ gap: '10px' }}>
              <GlobalFloatingCallBar />

              <div className="topbar-actions-group">
                <div className="topbar-actions-inline">
                  {session?.user?.permissions?.includes(PERMISSIONS.DIAL_CALL_CTI) && (
                    <button
                      type="button"
                      ref={dialerButtonRef}
                      className="crm-prime-topbar-icon"
                      disabled={!isInitialized}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (isInitialized) {
                          openDialer();
                        }
                      }}
                      title="Open Dialer"
                    >
                      <Phone size={14} />
                    </button>
                  )}

                  {session?.user?.permissions?.includes(PERMISSIONS.COMMUNICATIONS_SERVICES) && session?.user?.permissions?.includes(PERMISSIONS.VIEW_CTI) && (
                    <button
                      type="button"
                      className="crm-prime-topbar-icon"
                      onClick={() => {
                        router.push('/communications/wallboards-live');
                      }}
                      title="Wallboards (Live)"
                    >
                      <MonitorCheck size={14} />
                    </button>
                  )}

                    <button
                      type="button"
                      className={`crm-prime-topbar-icon ${totalUnreadCount > 0 ? 'has-badge' : ''}`}
                      data-badge={totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                      onClick={() => dispatch(setShowNotificationsSidebar(true))}
                      title="Notifications"
                    >
                      <Bell size={14} />
                    </button>
                  

                  {session?.user?.permissions?.includes(PERMISSIONS.FOR_VIEW_HELP_CENTER_SERVICES) && (   
                    <button
                      type="button"
                      className="crm-prime-topbar-icon"
                      title="Help"
                      onClick={() => router.push('/help-center')}
                    >
                      <HelpCircle size={18} />
                    </button>
                    )}
                  

                  {session?.user?.permissions?.includes(PERMISSIONS.GENERAL_SERVICES) && (
                    <button
                      type="button"
                      className="crm-prime-topbar-icon"
                      title="Settings"
                      onClick={() => router.push('/main-settings')}
                    >
                      <Settings size={18} />
                    </button>
                  )}
                </div>

                <div ref={iconsDropdownRef} className="topbar-actions-overflow">
                  <button
                    type="button"
                    className="crm-prime-topbar-icon"
                    onClick={() => dispatch(toggleShowIconsDropdown())}
                    title="More actions"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {showIconsDropdown && (
                    <div className="topbar-overflow-menu">
                      {session?.user?.permissions?.includes(PERMISSIONS.DIAL_CALL_CTI) && (
                        <button
                          type="button"
                          className="topbar-overflow-item"
                          disabled={!isInitialized}
                          onClick={() => {
                            if (!isInitialized) return;
                            dispatch(setShowIconsDropdown(false));
                            openDialer();
                          }}
                        >
                          <Phone size={16} />
                          <span>Dialer</span>
                        </button>
                      )}
                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_CTI) && (
                        <button
                          type="button"
                          className="topbar-overflow-item"
                          onClick={() => {
                            dispatch(setShowIconsDropdown(false));
                            router.push('/communications/wallboards-live');
                          }}
                        >
                          <MonitorCheck size={16} />
                          <span>Wallboards</span>
                        </button>
                      )}

                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_USER_NOTIFICATIONS) && (
                        <button
                          type="button"
                          className="topbar-overflow-item"
                          onClick={() => {
                            dispatch(setShowIconsDropdown(false));
                            dispatch(setShowNotificationsSidebar(true));
                          }}
                        >
                          <Bell size={16} />
                          <span>{getNotificationsOverflowLabel(totalUnreadCount)}</span>
                        </button>
                      )}

                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_HELP_CENTER) && (
                        <button
                          type="button"
                          className="topbar-overflow-item"
                          onClick={() => {
                            dispatch(setShowIconsDropdown(false));
                            router.push('/help-center');
                          }}
                        >
                          <HelpCircle size={16} />
                          <span>Help</span>
                        </button>
                      )}

                      {session?.user?.permissions?.includes(PERMISSIONS.GENERAL_SERVICES) && (
                        <button
                          type="button"
                          className="topbar-overflow-item"
                          onClick={() => {
                            dispatch(setShowIconsDropdown(false));
                            router.push('/main-settings');
                          }}
                        >
                          <Settings size={16} />
                          <span>Settings</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div style={{ 
                width: '1px', 
                height: '28px', 
                background: 'rgba(255, 255, 255, 0.2)',
                margin: '0 4px'
              }} />

              {/* Assistant Icon */}
                {/* <button className="crm-prime-topbar-icon" title="AI Assistant" style={{ width: 'auto', padding: '0 12px', gap: '6px' }}> */}
                {session?.user?.permissions?.includes(PERMISSIONS.AI_ML_SERVICES) && (
              <button 
                type="button"
                className="crm-prime-topbar-icon" 
                title="AI Assistant" 
                style={{ width: 'auto', padding: '0 12px', gap: '6px' }}
                onClick={() => dispatch(toggleBreezeAssistant())}
              >
                <Sparkles size={18} />
                <span className="crm-prime-assistant-label">AI Assistant</span>
                  </button>
                )}

                {/* Divider */}
                <div
                  style={{
                    width: "1px",
                    height: "28px",
                    background: "rgba(255, 255, 255, 0.2)",
                    margin: "0 4px",
                  }}
                />

                {/* User Menu with Dropdown */}
                <div ref={userDropdownRef} style={{ position: "relative" }}>
                  <button
                    type="button"
                    className="crm-prime-user-menu"
                    onClick={() =>
                      dispatch(setShowUserDropdown(!showUserDropdown))
                    }
                  >
                    <div className="crm-prime-user-avatar">
                      {headerLogoUrl ? (
                        <img
                          src={headerLogoUrl}
                          alt={loggedInCompanyName || ""}
                        />
                      ) : (
                        loggedInCompanyName?.charAt(0)?.toUpperCase() || (
                          <User size={14} />
                        )
                      )}
                    </div>
                    <div className="crm-prime-user-info">
                      <div>
                        <div className="crm-prime-user-name">
                          {loggedInCompanyName || ""}
                        </div>
                      </div>
                      <ChevronDown
                        size={14}
                        style={{ color: "rgba(255, 255, 255, 0.6)" }}
                      />
                    </div>
                  </button>

                  {/* User Dropdown Menu */}
                  {showUserDropdown && (
                    <div className="user-dropdown-menu">
                      {/* Header */}
                      <div className="user-dropdown-header">
                        <div className="user-dropdown-avatar">
                          {profileImageUrl ? (
                            <img
                              src={profileImageUrl}
                              alt={loggedInName || ""}
                            />
                          ) : (
                            <div
                              style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "16px",
                                fontWeight: 600,
                                color: "#006162",
                              }}
                            >
                              {loggedInName?.charAt(0)?.toUpperCase() || "H"}
                            </div>
                          )}
                        </div>

                        <div className="user-dropdown-header-text">
                          <div className="user-dropdown-name">
                            {loggedInName || ""}
                          </div>
                          <div className="user-dropdown-email">
                            {session?.user?.role || ""}
                          </div>
                          <a href="/profile" className="user-dropdown-link">
                            Profile & Preferences
                          </a>
                        </div>
                      </div>

                      {/* View Only Badge */}
                      {/* <div className="user-dropdown-view-only">
                        <Eye size={14} style={{ color: '#000000' }} />
                        <span>View Only</span>
                      </div> */}

                      {/* Request edit access */}
                      {/* <div className="user-dropdown-section">
                        <button className="user-dropdown-item">
                          <span className="user-dropdown-item-text">Request edit access</span>
                        </button>
                      </div> */}

                      {/* Theme */}
                      {/* <div className="user-dropdown-section">
                        <div className="user-dropdown-section-label">Theme</div>
                        <button className="user-dropdown-item">
                          <span className="user-dropdown-item-text">Switch to the classic theme</span>
                        </button>
                        <button className="user-dropdown-item">
                          <MessageCircle className="user-dropdown-item-icon" size={14} />
                          <span className="user-dropdown-item-text">Give theme feedback</span>
                        </button>
                      </div> */}

                      {/* Account */}
                      <div className="user-dropdown-section">
                        <div className="user-dropdown-section-label">
                          Account
                        </div>
                        <div className="user-dropdown-account-info">
                          <div className="user-dropdown-account-name">
                            {session?.user?.company_name}
                          </div>
                          <div className="user-dropdown-account-id">
                            {session?.user?.company_identifier}
                          </div>
                        </div>
                      </div>

                      {/* Links */}
                      <div className="user-dropdown-section">
                        
                          {session?.user?.permissions?.includes(PERMISSIONS.TICKETS_SERVICES) && (
                            <button
                              type="button"
                              className="user-dropdown-item"
                              onClick={() => {
                                dispatch(setShowUserDropdown(false));
                                router.push('/crm/tickets');
                              }}
                            >
                              {/* <Ticket className="user-dropdown-item-icon" size={14} /> */}
                              <span className="user-dropdown-item-text">Raise a ticket</span>
                            </button>
                          )}
                          
                          {session?.user?.permissions?.includes(PERMISSIONS.ACCOUNTS_SERVICES) && (
                        <button type="button" className="user-dropdown-item" onClick={() => router.push('/pricing')}>
                          {/* <CreditCard className="user-dropdown-item-icon" size={14} /> */}
                          <span className="user-dropdown-item-text">Pricing & Features</span>
                          <ExternalLink size={10} style={{ marginLeft: 'auto', color: '#666666' }} />
                            </button>
                          )}
                          
                          {getAllowedAccountBillingTabs(
                            session?.user?.permissions ?? [],
                          ).length > 0 && (
                     
                        <button type="button" className="user-dropdown-item" onClick={() => router.push('/billing/account-billing')}>
                          {/* <FileText className="user-dropdown-item-icon" size={14} /> */}
                          <span className="user-dropdown-item-text">Account & Billing</span>
                        </button>
                        )}

                          
                        {session?.user?.permissions?.includes(PERMISSIONS.WORK_PLANNER_SERVICES) && (
                        <button type="button" className="user-dropdown-item" onClick={() => router.push('/planner/tasks')}>
                          {/* <FileText className="user-dropdown-item-icon" size={14} /> */}
                          <span className="user-dropdown-item-text">Tasks</span>
                        </button>
                        )}

                  {   session?.user?.permissions?.includes(PERMISSIONS.VIEW_CALENDAR_WORK_PLANNER) && (   <button
                          type="button"
                          className="user-dropdown-item"
                          onClick={() => router.push("/planner/calendar")}
                        >
                          {/* <FileText className="user-dropdown-item-icon" size={14} /> */}
                          <span className="user-dropdown-item-text">
                            Calendar
                          </span>
                        </button>)}

                        {session?.user?.permissions?.includes(PERMISSIONS.ACCOUNTS_SERVICES) && (
                        <button
                          type="button"
                          className="user-dropdown-item user-dropdown-credits-head"
                        >
                          <div className="d-flex align-items-center justify-content-between w-100 gap-2">
                            <span className="user-dropdown-item-text">Prime Credits</span>
                            <span className="user-dropdown-item-badge">New</span>
                          </div>
                          <div className="user-dropdown-credits-count">0 of 0 credits available</div>
                        </button>
                        )}
                        {session?.user?.permissions?.includes(PERMISSIONS.PRODUCT_UPDATES_SERVICES) && (
                          <button type="button" className="user-dropdown-item">
                          {/* <Briefcase className="user-dropdown-item-icon" size={14} /> */}
                          <span className="user-dropdown-item-text">
                            Product Updates
                          </span>
                        </button>
                        )}

                        {session?.user?.permissions?.includes(PERMISSIONS.GENERAL_SERVICES) && (
                          <button
                          type="button"
                          className="user-dropdown-item"
                          onClick={() => router.push("/main-settings")}
                        >
                            {/* <FileText className="user-dropdown-item-icon" size={14} /> */}
                            <span className="user-dropdown-item-text">
                            Settings
                          </span>
                          </button>
                        )}
                      </div>

                      {/* Footer with Sign out and Privacy */}
                      <div className="user-dropdown-footer">
                        <button
                          type="button"
                          className="user-dropdown-footer-link"
                          onClick={() => {
                            dispatch(setShowUserDropdown(false));
                            logout();
                          }}
                        >
                          Sign out
                        </button>
                        <button
                          type="button"
                          className="user-dropdown-footer-link"
                          onClick={() => router.push('/privacy-policy')}
                        >
                          Privacy policy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>
    </>
  );
}
