import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import tokenService from "../../utils/tokenService";

// Import sidebar styles
import "../../assets/scss/sidebar.scss";

import CompanyLogo from "@assets/images/ringedge-logo.png";
import CompanyLogo2 from "@assets/images/ringedge-logo-black-n-blue.png";

import { authAPI } from "@utils/api";
import { useAuth } from "../../hooks/useAuth";
import { useTmsPermissions } from "../../hooks/useTmsPermissions";

// Constants
const BASE_URL = '';
const DOM_SELECTORS = {
    NAV_LINKS: '#pc-layout-submenus > li > .pc-link',
    SUBMENU_POPUP: '.pc-submenu-popup',
    SIDEBAR: '.pc-sidebar',
    TAB_PANES: '.pc-submenu-popup .tab-pane',
    MENU_ITEMS: '.pc-submenu-popup .tab-pane .pc-item.pc-hasmenu'
} as const;

const TIMING = {
    DOM_RENDER_DELAY: 100,
    HEIGHT_UPDATE_DELAY: 10,
    RETRY_DELAY: 200
} as const;

// Extend Window interface for bootstrap
declare global {
    interface Window {
        bootstrap: any;
        SimpleBar: any;
    }
}

interface HeaderProps {
    themeMode?: any;
}

interface UserState {
    name: string;
    email: string;
    role: string;
    permissions: string[];
    isAdmin: boolean;
}

const Header = ({ themeMode }: HeaderProps) => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { logout } = useAuth();
    const { hasPermission: hasTmsPermission, permissions, isValid } = useTmsPermissions();
    
    const [userState, setUserState] = useState<UserState>({
        name: '',
        email: '',
        role: '',
        permissions: [],
        isAdmin: false
    });
    
    // Memoized user data
    const userData = useMemo(() => {
        if (!session?.user) return null;
        return {
            name: session.user.name || '',
            email: session.user.email || '',
            role: session.user.role || '',
            permissions: session.user.permissions || [],
            isAdmin: Boolean(session.user.is_admin)
        };
    }, [session?.user]);

    // Session management effect
    useEffect(() => {
        if (status === "loading") return;

        if (session && status === "authenticated" && userData) {
            setUserState(userData);
                if (typeof window !== "undefined") {
                    tokenService.initializeFromSession(session);
                }
            } else if (status === "unauthenticated") {
                tokenService.clearTokens();
                router.push('/auth/signin');
            }
    }, [status, session, userData, router]);

    const handleLogout = useCallback(async () => {
        try {
          await authAPI.logout();
          await logout();
        } catch (error) {
          console.error('Logout failed:', error);
          await logout();
        }
    }, [logout]);

    // Utility functions
    const hideSubmenuPopup = useCallback(() => {
        const submenuPopup = document.querySelector(DOM_SELECTORS.SUBMENU_POPUP) as HTMLElement;
            if (submenuPopup) {
                submenuPopup.classList.remove('active');
                submenuPopup.style.display = 'none';
            }
    }, []);

    const updateSubmenuHeight = useCallback((tabPane: HTMLElement) => {
        const submenuPopup = document.querySelector(DOM_SELECTORS.SUBMENU_POPUP) as HTMLElement;
        if (submenuPopup && tabPane) {
            const tabContentHeight = tabPane.offsetHeight;
            submenuPopup.style.height = `${tabContentHeight}px`;
            submenuPopup.style.minHeight = `${tabContentHeight}px`;
        }
    }, []);

    const showTabPane = useCallback((tabPane: HTMLElement) => {
        const allTabPanes = document.querySelectorAll(DOM_SELECTORS.TAB_PANES);
        allTabPanes.forEach((pane) => {
            pane.classList.remove('active', 'show');
            (pane as HTMLElement).style.display = 'none';
        });
        
        tabPane.classList.add('active', 'show');
        tabPane.style.display = 'block';
        tabPane.style.opacity = '1';
        tabPane.style.visibility = 'visible';
        
        setTimeout(() => updateSubmenuHeight(tabPane), TIMING.HEIGHT_UPDATE_DELAY);
    }, [updateSubmenuHeight]);

    // Route change handler
    useEffect(() => {
        const handleRouteChange = hideSubmenuPopup;
        router.events.on('routeChangeStart', handleRouteChange);
        return () => router.events.off('routeChangeStart', handleRouteChange);
    }, [router, hideSubmenuPopup]);

    // Event handlers
    const createMouseEnterHandler = useCallback(() => {
        return function(e: Event) {
                        const target = e.target as HTMLElement;
            if (!target || !target.closest(DOM_SELECTORS.NAV_LINKS.split(' > ')[0]) || 
                !target.classList.contains('pc-link') || target.tagName === 'BUTTON') {
                            return;
                        }
                        
                        const computedStyle = window.getComputedStyle(target);
                        if (computedStyle.position === 'absolute' || computedStyle.position === 'fixed') {
                            return;
                        }
                        
            const submenuPopup = document.querySelector(DOM_SELECTORS.SUBMENU_POPUP) as HTMLElement;
                        if (submenuPopup) {
                            submenuPopup.classList.add('active');
                            submenuPopup.style.display = 'block';
                            
                            const tabRect = target.getBoundingClientRect();
                const sidebarRect = document.querySelector(DOM_SELECTORS.SIDEBAR)?.getBoundingClientRect();
                            
                            if (sidebarRect) {
                                const relativeTop = tabRect.top - sidebarRect.top;
                                submenuPopup.style.top = `${relativeTop}px`;
                                submenuPopup.style.position = 'absolute';
                                submenuPopup.style.left = '100%';
                                submenuPopup.style.zIndex = '1000';
                            }
                        }
                        
                        const targetId = target.getAttribute('data-bs-target');
                        const tabPane = targetId ? document.querySelector(targetId) as HTMLElement : null;
                        if (tabPane) {
                showTabPane(tabPane);
            }
        };
    }, [showTabPane]);

    const createMouseLeaveHandler = useCallback(() => {
        return function(e: Event) {
                        const target = e.target as HTMLElement;
            if (!target || !target.closest(DOM_SELECTORS.NAV_LINKS.split(' > ')[0]) || 
                !target.classList.contains('pc-link') || target.tagName === 'BUTTON') {
                            return;
                        }
                        
                        const computedStyle = window.getComputedStyle(target);
                        if (computedStyle.position === 'absolute' || computedStyle.position === 'fixed') {
                            return;
                        }
                        
                        const mouseEvent = e as MouseEvent;
                        const relatedTarget = mouseEvent.relatedTarget as HTMLElement;
            const submenuPopup = document.querySelector(DOM_SELECTORS.SUBMENU_POPUP) as HTMLElement;
                        
                        if (relatedTarget && submenuPopup && submenuPopup.contains(relatedTarget)) {
                            return;
                        }
                        
            hideSubmenuPopup();
        };
    }, [hideSubmenuPopup]);

    // Main hover events effect
    useEffect(() => {
        const timer = setTimeout(() => {
            const addNavigationEvents = () => {
                const navLinks = document.querySelectorAll(DOM_SELECTORS.NAV_LINKS);
                
                if (navLinks.length === 0) {
                    console.warn('No navigation links found, retrying...');
                    return false;
                }
                
                const mouseEnterHandler = createMouseEnterHandler();
                const mouseLeaveHandler = createMouseLeaveHandler();
                
                navLinks.forEach((link) => {
                    if (!link.getAttribute('data-bs-target')) return;
                    
                    link.addEventListener('mouseenter', mouseEnterHandler);
                    link.addEventListener('mouseleave', mouseLeaveHandler);
                });
                
                return true;
            };

            // Add submenu popup events
            const addSubmenuPopupEvents = () => {
                const submenuPopup = document.querySelector(DOM_SELECTORS.SUBMENU_POPUP) as HTMLElement;
                if (!submenuPopup) return;
                
                const submenuEnterHandler = () => {
                    submenuPopup.classList.add('active');
                        const activeTabPane = submenuPopup.querySelector('.tab-pane.active') as HTMLElement;
                        if (activeTabPane) {
                        setTimeout(() => updateSubmenuHeight(activeTabPane), TIMING.HEIGHT_UPDATE_DELAY);
                    }
                };
                
                const submenuLeaveHandler = () => {
                    submenuPopup.classList.remove('active');
                    submenuPopup.style.display = 'none';
                    const tabPanes = document.querySelectorAll(DOM_SELECTORS.TAB_PANES);
                    tabPanes.forEach((tabPane) => {
                        tabPane.classList.remove('active', 'show');
                });
            };

                submenuPopup.addEventListener('mouseenter', submenuEnterHandler);
                submenuPopup.addEventListener('mouseleave', submenuLeaveHandler);
            };

            // Add sidebar mouse leave event
            const addSidebarMouseLeaveEvent = () => {
                const sidebar = document.querySelector(DOM_SELECTORS.SIDEBAR) as HTMLElement;
                if (!sidebar) return;
                
                sidebar.addEventListener('mouseleave', () => {
                    const submenuPopup = document.querySelector(DOM_SELECTORS.SUBMENU_POPUP) as HTMLElement;
                    if (submenuPopup) {
                        submenuPopup.classList.remove('active');
                        submenuPopup.style.display = 'none';
                        const tabPanes = document.querySelectorAll(DOM_SELECTORS.TAB_PANES);
                        tabPanes.forEach((tabPane) => {
                            tabPane.classList.remove('active', 'show');
                        });
                    }
                });
            };

            // Add tab pane menu events
            const addTabPaneMenuEvents = () => {
                const menuItems = document.querySelectorAll(DOM_SELECTORS.MENU_ITEMS);
                
                menuItems.forEach((menuItem) => {
                    const submenu = menuItem.querySelector('.pc-submenu') as HTMLElement;
                    if (!submenu) return;

                    const parentLink = menuItem.querySelector('.pc-link') as HTMLElement;
                    if (parentLink && parentLink.parentElement === menuItem) {
                        parentLink.addEventListener('click', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            const isActive = menuItem.classList.contains('active');
                            
                            // Close all other submenus
                            const allMenuItems = document.querySelectorAll(DOM_SELECTORS.MENU_ITEMS);
                            allMenuItems.forEach((item) => {
                                if (item !== menuItem) {
                                    item.classList.remove('active');
                                    const itemSubmenu = item.querySelector('.pc-submenu') as HTMLElement;
                                    if (itemSubmenu) {
                                        itemSubmenu.style.display = 'none';
                                    }
                                    const itemChevron = item.querySelector('.pc-arrow i');
                                    if (itemChevron) {
                                        itemChevron.className = 'ph-duotone ph-caret-right';
                                    }
                                }
                            });
                            
                            // Toggle current submenu
                            if (isActive) {
                                menuItem.classList.remove('active');
                                submenu.style.display = 'none';
                                const chevron = menuItem.querySelector('.pc-arrow i');
                                if (chevron) {
                                    chevron.className = 'ph-duotone ph-caret-right';
                                }
                            } else {
                                menuItem.classList.add('active');
                                submenu.style.display = 'block';
                                const chevron = menuItem.querySelector('.pc-arrow i');
                                if (chevron) {
                                    chevron.className = 'ph-duotone ph-caret-down';
                                }
                            }
                            
                            setTimeout(() => {
                                const activeTabPane = document.querySelector('.tab-pane.active') as HTMLElement;
                                if (activeTabPane) {
                                    updateSubmenuHeight(activeTabPane);
                                }
                            }, TIMING.HEIGHT_UPDATE_DELAY);
                        });
                    }
                });
            };
            
            // Initialize all events
            const navigationSuccess = addNavigationEvents();
            addSubmenuPopupEvents();
            addSidebarMouseLeaveEvent();
            addTabPaneMenuEvents();
            
            // Initialize dropdown arrows
            const allMenuItems = document.querySelectorAll(DOM_SELECTORS.MENU_ITEMS);
            allMenuItems.forEach((menuItem) => {
                const arrow = menuItem.querySelector('.pc-arrow i');
                if (arrow) {
                    arrow.className = 'ph-duotone ph-caret-right';
                }
            });
            
            if (!navigationSuccess) {
                setTimeout(() => addNavigationEvents(), TIMING.RETRY_DELAY);
            }
        }, TIMING.DOM_RENDER_DELAY);
        
        return () => clearTimeout(timer);
    }, [userState.permissions, createMouseEnterHandler, createMouseLeaveHandler, updateSubmenuHeight, hideSubmenuPopup]);


    // Types for menu items
    interface MenuItem {
        key: string;
        permission: string;
        icon: string;
        label: string;
        target: string;
    }

    interface SubmenuItem {
        key: string;
        permission: string;
        icon: string;
        label: string;
        href: string;
        pathMatch?: string;
    }

    interface SubmenuSection {
        id: string;
        title: string;
        items: SubmenuItem[];
    }

    // Memoized navigation items
    const navigationItems = useMemo((): MenuItem[] => [
        {
            key: 'controlhub',
            permission: 'control-hub-services',
            icon: 'ti ti-settings',
            label: 'Control Hub',
            target: '#pc-tab-controlhub'
        },
        {
            key: 'gsm',
            permission: 'gsm-services',
            icon: 'ti ti-antenna-bars-4',
            label: 'Sim Gateway',
            target: '#pc-tab-1'
        },
        {
            key: 'call-logs',
            permission: 'call-logs-services',
            icon: 'ph-duotone ph-file-text',
            label: 'Call Logs',
            target: '#pc-tab-2'
        },
        {
            key: 'call-recording',
            permission: 'call-recordings-services',
            icon: 'ph-duotone ph-record',
            label: 'Call Recordings',
            target: '#pc-tab-3'
        },
        {
            key: 'call-reports',
            permission: 'reports-services',
            icon: 'ph-duotone ph-file-text',
            label: 'Reports',
            target: '#pc-tab-5'
        },
        
        {
            key: 'ai-ml',
            permission: 'ai-ml-services',
            icon: 'ph-duotone ph-robot',
            label: 'Ai Insights',
            target: '#pc-tab-4'
        },
        {
            key: 'cti',
            permission: 'cti-services',
            icon: 'ph-duotone ph-phone-call',
            label: 'Live Calls',
            target: '#pc-tab-9'
        },
        {
            key: 'tickets',
            permission: 'tickets-services',
            icon: 'ph-duotone ph-ticket',
            label: 'Tickets',
            target: '#pc-tab-14'
        },
        {
            key: 'tms',
            permission: 'tms-services',
            icon: 'ph-duotone ph-link',
            label: 'Automation',
            target: '#pc-tab-6'
        },
        {
            key: 'accounts',
            permission: 'accounts-services',
            icon: 'ph-duotone ph-link',
            label: 'Billing',
            target: '#pc-tab-15'
        },
        {
            key: 'crm',
            permission: 'crm-services',
            icon: 'ph-duotone ph-link',
            label: 'CRM',
            target: '#pc-tab-7'
        },
        {
            key: 'dncr',
            permission: 'dncr-services',
            icon: 'ph-duotone ph-link',
            label: 'DNCR',
            target: '#pc-tab-10'
        },
        {
            key: 'netops',
            permission: 'netops-services',
            icon: 'ph-duotone ph-heartbeat',
            label: 'NetOps',
            target: '#pc-tab-16'
        }
    ], []);

    // Memoized submenu sections data
    const submenuSections = useMemo((): SubmenuSection[] => [
        {
            id: 'pc-tab-controlhub',
            title: 'Control Hub',
            items: [
                {
                    key: 'view-users',
                    permission: 'view-users',
                    icon: 'ph-duotone ph-users',
                    label: 'User Directory',
                    href: '/controlhub/users',
                    pathMatch: 'controlhub/users'
                },
                {
                    key: 'view-ranks',
                    permission: 'view-ranks',
                    icon: 'ph-duotone ph-users',
                    label: 'Ranks',
                    href: '/controlhub/ranks',
                    pathMatch: 'controlhub/ranks'
                },
                {
                    key: 'view-groups',
                    permission: 'view-groups',
                    icon: 'ph-duotone ph-users',
                    label: 'Groups',
                    href: '/controlhub/groups',
                    pathMatch: 'controlhub/groups'
                },
                {
                    key: 'view-gsm-management',
                    permission: 'view-gsm-management',
                    icon: 'ph-duotone ph-list',
                    label: 'Gsm List',
                    href: '/gsm/list'
                },
                {
                    key: 'view-gsm-assignment',
                    permission: 'view-gsm-assignment',
                    icon: 'ph-duotone ph-list',
                    label: 'Company Assign',
                    href: '/gsm/assign'
                },
                {
                    key: 'view-company-po',
                    permission: 'view-gsm-management',
                    icon: 'ph-duotone ph-building',
                    label: 'Company Profiling',
                    href: '/company/po'
                }
            ]
        },
        {
            id: 'pc-tab-1',
            title: 'Sim Gateway',
            items: [
                {
                    key: 'dashboard-gsm-management',
                    permission: 'dashboard-gsm-management',
                    icon: 'ph-duotone ph-gauge',
                    label: 'Dashboard',
                    href: '/gsm/dashboard'
                },
                {
                    key: 'view-gsm-management',
                    permission: 'view-gsm-management',
                    icon: 'ph-duotone ph-list',
                    label: 'Gsm List',
                    href: '/gsm/list'
                },
                {
                    key: 'view-gsm-assignment',
                    permission: 'view-gsm-assignment',
                    icon: 'ph-duotone ph-list',
                    label: 'Company Assign',
                    href: '/gsm/assign'
                },
                {
                    key: 'view-gsm-ports',
                    permission: 'view-gsm-ports',
                    icon: 'ph-duotone ph-list',
                    label: 'Ports',
                    href: '/gsm/ports'
                },
                {
                    key: 'view-gsm-inbox',
                    permission: 'view-gsm-inbox',
                    icon: 'ph-duotone ph-envelope',
                    label: 'Inbox',
                    href: '/gsm/inbox'
                },
                {
                    key: 'view-gsm-sync',
                    permission: 'view-gsm-inbox',
                    icon: 'ph-duotone ph-arrows-clockwise',
                    label: 'Sync GSM',
                    href: '/gsm/sync'
                },
                {
                    key: 'view-company-po',
                    permission: 'view-gsm-management',
                    icon: 'ph-duotone ph-building',
                    label: 'Company PO',
                    href: '/company/po'
                }
            ]
        },
        {
            id: 'pc-tab-2',
            title: 'Calls',
            items: [
                {
                    key: 'dashboard-call-logs',
                    permission: 'dashboard-call-logs',
                    icon: 'ph-duotone ph-gauge',
                    label: 'Dashboard',
                    href: '/call-logs/dashboard'
                },
                {
                    key: 'view-call-logs',
                    permission: 'view-call-logs',
                    icon: 'ph-duotone ph-gauge',
                    label: 'Call Logs',
                    href: '/call-logs'
                }
            ]
        },
        {
            id: 'pc-tab-4',
            title: 'Ai Insights',
            items: [
                {
                    key: 'transcriptions-analysis-aiml',
                    permission: 'transcriptions-analysis-aiml',
                    icon: 'ti ti-file-analytics',
                    label: 'Analysis',
                    href: '/ai-ml/analysis'
                },
                {
                    key: 'transcriptions-aiml',
                    permission: 'transcriptions-aiml',
                    icon: 'ti ti-file-analytics',
                    label: 'Transcription',
                    href: '/ai-ml/transcriptions'
                },
                {
                    key: 'translate-aiml',
                    permission: 'translate-aiml',
                    icon: 'ph-duotone ph-translate',
                    label: 'Translate',
                    href: '/ai-ml/translate'
                }
            ]
        },
        {
            id: 'pc-tab-8',
            title: 'Sales',
            items: [
                {
                    key: 'sales-dashboard',
                    permission: 'sales-dashboard',
                    icon: 'ph-duotone ph-gauge',
                    label: 'Dashboard',
                    href: '/sales'
                },
                {
                    key: 'sales-orders',
                    permission: 'sales-orders',
                    icon: 'ph-duotone ph-shopping-cart',
                    label: 'Orders',
                    href: '/sales/orders'
                },
                {
                    key: 'sales-products',
                    permission: 'sales-products',
                    icon: 'ph-duotone ph-package',
                    label: 'Products',
                    href: '/sales/products'
                },
                {
                    key: 'sales-stages',
                    permission: 'sales-stages',
                    icon: 'ph-duotone ph-trending-up',
                    label: 'Order Stages',
                    href: '/sales/stages'
                },
                {
                    key: 'sales-lost-reasons',
                    permission: 'sales-lost-reasons',
                    icon: 'ph-duotone ph-x-circle',
                    label: 'Lost Reasons',
                    href: '/sales/lost-reasons'
                }
            ]
        },
        {
            id: 'pc-tab-9',
            title: 'Live Calls',
            items: [
                {
                    key: 'view-cti',
                    permission: 'view-cti',
                    icon: 'ph-duotone ph-link',
                    label: 'Live View',
                    href: '/cti'
                },
                {
                    key: 'view-cti',
                    permission: 'view-cti',
                    icon: 'ph-duotone ph-phone-call',
                    label: 'Call Monitoring',
                    href: '/cti/monitoring'
                },
                {
                    key: 'dial-call-cti',
                    permission: 'dial-call-cti',
                    icon: 'ph-duotone ph-link',
                    label: 'Dialer',
                    href: '/cti/dialer'
                }
            ]
        },
        {
            id: 'pc-tab-10',
            title: 'DNCR',
            items: [
                {
                    key: 'check-numbers-dncr',
                    permission: 'check-numbers-dncr',
                    icon: 'ph-duotone ph-phone-call',
                    label: 'Check Number',
                    href: '/dncr/check-number'
                }
            ]
        },
        {
            id: 'pc-tab-11',
            title: 'Web RTC',
            items: [
                {
                    key: 'webrtc',
                    permission: 'webrtc',
                    icon: 'ph-duotone ph-link',
                    label: 'Web RTC',
                    href: '/coming-soon'
                }
            ]
        },
        {
            id: 'pc-tab-12',
            title: 'Omni Channel',
            items: [
                {
                    key: 'omni-channel',
                    permission: 'omni-channel',
                    icon: 'ph-duotone ph-link',
                    label: 'Omni Channel',
                    href: '/coming-soon'
                }
            ]
        },
        {
            id: 'pc-tab-13',
            title: 'HR Services',
            items: [
                {
                    key: 'hr',
                    permission: 'hr',
                    icon: 'ph-duotone ph-link',
                    label: 'HR',
                    href: '/coming-soon'
                }
            ]
        },
        {
            id: 'pc-tab-14',
            title: 'Tickets',
            items: [
                {
                    key: 'dashboard-tickets',
                    permission: 'dashboard-tickets',
                    icon: 'ph-duotone ph-link',
                    label: 'Dashboard',
                    href: '/tickets/dashboard'
                },
                {
                    key: 'tickets-tickets',
                    permission: 'tickets-tickets',
                    icon: 'ph-duotone ph-link',
                    label: 'Tickets',
                    href: '/tickets/list'
                },
                {
                    key: 'ticket-statuses-tickets',
                    permission: 'ticket-statuses-tickets',
                    icon: 'ph-duotone ph-link',
                    label: 'Status',
                    href: '/tickets/statuses'
                },
                {
                    key: 'ticket-modules-tickets',
                    permission: 'ticket-modules-tickets',
                    icon: 'ph-duotone ph-link',
                    label: 'Modules',
                    href: '/tickets/modules'
                },
                {
                    key: 'view-ticket-types-tickets',
                    permission: 'view-ticket-types-tickets',
                    icon: 'ph-duotone ph-link',
                    label: 'Types',
                    href: '/tickets/types'
                }
            ]
        },
    ], []);

    // Reusable submenu item component
    const SubmenuItem = useCallback(({ item }: { item: SubmenuItem }) => {
        if (!userState.permissions.includes(item.permission)) return null;
        
        const isActive = item.pathMatch ? router.asPath.includes(item.pathMatch) : false;
        
        return (
            <li className="pc-item">
                                                <Link 
                    href={`${BASE_URL}${item.href}`} 
                    className={`pc-link ${isActive ? ' active' : ''}`}
                                                >
                                                <span className="pc-micon">
                        <i className={item.icon}></i>
                                                </span>
                    <span className="pc-mtext" data-i18n={item.label}>{item.label}</span>
                                                </Link>
                                        </li>
        );
    }, [userState.permissions, router.asPath]);

    // Call Recording submenu component with nested menus
    const CallRecordingSubmenu = useCallback(() => (
        <div className="tab-pane" id="pc-tab-3" role="tabpanel" aria-labelledby="pc-tab-link-3" tabIndex={1}>
            <div className="pc-submenu-title">Call Recordings</div>
            <ul className="pc-navbar">
                <li className="pc-item">
                    <Link className="pc-link" href={`${BASE_URL}/call-recordings/dashboard`}>
                        <span className="pc-micon"><i className="ph-duotone ph-gauge"></i></span>
                        <span className="pc-mtext">Dashboard</span>
                                                </Link>
                                            </li>
                
                <li className="pc-item">
                    <Link className="pc-link" href={`${BASE_URL}/call-recordings`}>
                        <span className="pc-micon"><i className="ph-duotone ph-play-circle"></i></span>
                        <span className="pc-mtext">Recordings List</span>
                                                </Link>
                                            </li>

                
            </ul>
        </div>
    ), []);

    // Reports submenu component with nested menus
    const ReportsSubmenu = useCallback(() => (
        <div className="tab-pane" id="pc-tab-5" role="tabpanel" aria-labelledby="pc-tab-link-5" tabIndex={1}>
            <div className="pc-submenu-title">Reports</div>
            <ul className="pc-navbar">
                 
                                   
                                    <li className="pc-item">
                                        <Link className="pc-link" href={`${BASE_URL}/call-reports/stats/country`}>
                                        <span className="pc-micon"><i className="ph-duotone ph-phone-call"></i></span>
                                        <span className="pc-mtext">Call Stats by Country</span>
                                                </Link>
                                            </li>
                                    
                                    <li className="pc-item">
                                        <Link className="pc-link" href={`${BASE_URL}/call-reports/stats/department`}>
                                        <span className="pc-micon"><i className="ph-duotone ph-phone-call"></i></span>
                                        <span className="pc-mtext">Call Stats by Department</span>
                                                </Link>
                                            </li>
                                        
                                        <li className="pc-item">
                                            <Link className="pc-link" href={`${BASE_URL}/call-reports/stats/extension`}>
                                            <span className="pc-micon"><i className="ph-duotone ph-phone-call"></i></span>
                                            <span className="pc-mtext">Call Stats by Extension</span>
                                                </Link>
                                            </li>
                                        
                                        <li className="pc-item">
                                            <Link className="pc-link" href={`${BASE_URL}/call-reports/incoming/country`}>
                                        <span className="pc-micon"><i className="ph-duotone ph-phone-call"></i></span>
                                        <span className="pc-mtext">Incoming Stats by Country</span>
                                                </Link>
                                            </li>
                                        
                                        <li className="pc-item   ">
                                            <Link className="pc-link" href={`${BASE_URL}/call-reports/incoming/department`}>
                                            <span className="pc-micon"><i className="ph-duotone ph-phone-call"></i></span>
                                            <span className="pc-mtext">Incoming Stats by Department</span></Link>
                                            </li>
                                        
                                        <li className="pc-item">
                                            <Link className="pc-link" href={`${BASE_URL}/call-reports/incoming/extension`}>
                                        <span className="pc-micon"><i className="ph-duotone ph-phone-call"></i></span>
                                        <span className="pc-mtext">Incoming Stats by Extension</span>
                                                </Link>
                                            </li>
                                        
                                        <li className="pc-item">
                                            <Link className="pc-link" href={`${BASE_URL}/call-reports/trend/country`}>
                                            <span className="pc-micon"><i className="ph-duotone ph-phone-call"></i></span>
                                            <span className="pc-mtext">Call Trend by Country</span></Link>
                                            </li>
                                        
                                        <li className="pc-item">
                                            <Link className="pc-link" href={`${BASE_URL}/call-reports/trend/department`}>
                                        <span className="pc-micon"><i className="ph-duotone ph-phone-call"></i></span>
                                        <span className="pc-mtext">Call Trend by Department</span></Link>
                                            </li>
                                        
                                        <li className="pc-item">
                                            <Link className="pc-link" href={`${BASE_URL}/call-reports/trend/extension`}>
                                            <span className="pc-micon"><i className="ph-duotone ph-phone-call"></i></span>
                                            <span className="pc-mtext">Call Trend by Extension</span>
                                                </Link>
                                            </li>
               
            </ul>
        </div>
    ), []);

    // CRM submenu component with nested menus
    const CrmSubmenu = useCallback(() => (
        <div className="tab-pane" id="pc-tab-7" role="tabpanel" aria-labelledby="pc-tab-link-7" tabIndex={1}>
            <div className="pc-submenu-title">CRM</div>
            <ul className="pc-navbar">
                                    <li className="pc-item">
                                        <Link className="pc-link" href={`${BASE_URL}/crm/dashboard`}>
                                            <span className="pc-micon"><i className="ph-duotone ph-gauge"></i></span>
                                            <span className="pc-mtext">Dashboard</span>
                                                </Link>
                                            </li>
                                    <li className="pc-item">
                                        <Link className="pc-link" href={`${BASE_URL}/crm/leads`}>
                                            <span className="pc-micon"><i className="ph-duotone ph-users"></i></span>
                                            <span className="pc-mtext">Leads</span>
                                                </Link>
                                            </li>
                                    <li className="pc-item">
                                        <Link className="pc-link" href={`${BASE_URL}/crm/opportunities`}>
                                            <span className="pc-micon"><i className="ph-duotone ph-target"></i></span>
                                            <span className="pc-mtext">Opportunities</span>
                                                </Link>
                                            </li>
                                    <li className="pc-item">
                                        <Link className="pc-link" href={`${BASE_URL}/crm/stages`}>
                                            <span className="pc-micon"><i className="ph-duotone ph-trending-up"></i></span>
                                            <span className="pc-mtext">Stages</span>
                                                </Link>
                                            </li>
                                    <li className="pc-item">
                                        <Link className="pc-link" href={`${BASE_URL}/crm/lost-reasons`}>
                                            <span className="pc-micon"><i className="ph-duotone ph-x-circle"></i></span>
                                            <span className="pc-mtext">Lost Reasons</span>
                                                </Link>
                                            </li>
                                    <li className="pc-item">
                                        <Link className="pc-link" href={`${BASE_URL}/crm/data`}>
                                            <span className="pc-micon"><i className="ph-duotone ph-database"></i></span>
                                            <span className="pc-mtext">Data Management</span>
                                                </Link>
                                            </li>
                                    <li className="pc-item">
                                        <Link className="pc-link" href={`${BASE_URL}/crm/campaigns`}>
                                            <span className="pc-micon"><i className="ph-duotone ph-megaphone"></i></span>
                                            <span className="pc-mtext">Campaigns</span>
                                        </Link>
                                    </li>
                                        </ul>
                                    </div>
    ), []);

    // Accounts submenu component with nested menus
    const AccountsSubmenu = useCallback(() => (
        <div className="tab-pane" id="pc-tab-15" role="tabpanel" aria-labelledby="pc-tab-link-15" tabIndex={1}>
            <div className="pc-submenu-title">Billing</div>
            <ul className="pc-navbar">
                <li className="pc-item">
                    <Link className="pc-link" href={`${BASE_URL}/accounts`} >
                        <span className="pc-micon"><i className="ph-duotone ph-gauge"></i></span>
                        <span className="pc-mtext">Dashboard</span>
                    </Link>
                </li>
                <li className="pc-item">
                    <Link className="pc-link" href={`${BASE_URL}/accounting/resellers`} >
                        <span className="pc-micon"><i className="ph-duotone ph-users"></i></span>
                        <span className="pc-mtext">Resellers</span>
                    </Link>
                </li>
                <li className="pc-item">
                    <Link className="pc-link" href={`${BASE_URL}/accounting/companies`} >
                        <span className="pc-micon"><i className="ph-duotone ph-building"></i></span>
                        <span className="pc-mtext">Companies</span>
                    </Link>
                </li>
                <li className="pc-item">
                    <Link className="pc-link" href={`${BASE_URL}/accounting/invoices`} >
                        <span className="pc-micon"><i className="ph-duotone ph-file-text"></i></span>
                        <span className="pc-mtext">Invoices</span>
                    </Link>
                </li>
                <li className="pc-item">
                    <Link className="pc-link" href={`${BASE_URL}/accounting/expenses`} >
                        <span className="pc-micon"><i className="ph-duotone ph-credit-card"></i></span>
                        <span className="pc-mtext">Expenses</span>
                    </Link>
                </li>
                <li className="pc-item">
                    <Link className="pc-link" href={`${BASE_URL}/accounting/products`} >
                        <span className="pc-micon"><i className="ph-duotone ph-package"></i></span>
                        <span className="pc-mtext">Products</span>
                    </Link>
                </li>
                <li className="pc-item">
                    <Link className="pc-link" href={`${BASE_URL}/accounting/inventory`} >
                        <span className="pc-micon"><i className="ph-duotone ph-warehouse"></i></span>
                        <span className="pc-mtext">Inventory</span>
                    </Link>
                </li>
                <li className="pc-item">
                    <Link className="pc-link" href={`${BASE_URL}/accounting/locations`} >
                        <span className="pc-micon"><i className="ph-duotone ph-map-pin"></i></span>
                        <span className="pc-mtext">Locations</span>
                    </Link>
                </li>
                <li className="pc-item">
                    <Link className="pc-link" href={`${BASE_URL}/accounting/suppliers`} >
                        <span className="pc-micon"><i className="ph-duotone ph-truck"></i></span>
                        <span className="pc-mtext">Suppliers</span>
                    </Link>
                </li>
            </ul>                       
        </div>
    ), []);

    // NetOps submenu component with nested menus
    const NetOpsSubmenu = useCallback(() => (
        <div className="tab-pane" id="pc-tab-16" role="tabpanel" aria-labelledby="pc-tab-link-16" tabIndex={1}>
            <div className="pc-submenu-title">NetOps</div>
            <ul className="pc-navbar">
                                    <li className="pc-item">
                                        <Link className="pc-link" href={`${BASE_URL}/coming-soon`} >
                                            <span className="pc-micon"><i className="ph-duotone ph-link"></i></span>
                                            <span className="pc-mtext">NetOps</span>
                                        </Link>
                                    </li>
                                </ul>                      
                            </div>
    ), []);

    // TMS submenu component with nested menus
    const TmsSubmenu = useCallback(() => (
        <div className="tab-pane" id="pc-tab-6" role="tabpanel" aria-labelledby="pc-tab-link-6" tabIndex={1}>
                                <div className="pc-submenu-title">Automation</div>
                                <ul className="pc-navbar">
                                    <li className="pc-item">
                    <Link className="pc-link" href={`${BASE_URL}/tms`}>
                                            <span className="pc-micon"><i className="ph-duotone ph-link"></i></span>
                                            <span className="pc-mtext">Dashboard</span>
                                        </Link>
                                    </li>

                                   {(hasTmsPermission('view','cisco_db') || hasTmsPermission('admin','global')) && (
                                    <li className="pc-item pc-hasmenu">
                                        <Link className="pc-link" href="#!">
                                            <span className="pc-micon">
                                                <i className="ph-duotone ph-phone"></i>
                                            </span>
                                            <span className="pc-mtext" data-i18n="Cisco PBX">Cisco PBX</span>
                                            <span className="pc-arrow"><i className="ph-duotone ph-caret-right"></i></span>
                                        </Link>
                                        <ul className="pc-submenu">
                                            <li className="pc-item">
                                <Link className="pc-link" href={`${BASE_URL}/tms/cisco-pbx/users`}>
                                                    <span className="pc-mtext">Users</span>
                                                </Link>
                                <Link className="pc-link" href={`${BASE_URL}/tms/cisco-pbx/users-directory`}>
                                                    <span className="pc-mtext">Users Directory</span>
                                                </Link>
                                <Link className="pc-link" href={`${BASE_URL}/tms/cisco-pbx/app-users`}>
                                                    <span className="pc-mtext">App Users</span>
                                                </Link>
                                <Link className="pc-link" href={`${BASE_URL}/tms/cisco-pbx/custom-users`}>
                                                    <span className="pc-mtext">Custom Users</span>
                                                </Link>
                                <Link className="pc-link" href={`${BASE_URL}/tms/cisco-pbx/facilities-info`}>
                                                    <span className="pc-mtext">Facilities Info</span>
                                                </Link>
                                <Link className="pc-link" href={`${BASE_URL}/tms/cisco-pbx/recording-profile`}>
                                                    <span className="pc-mtext">Recording Profile</span>
                                                </Link>
                                <Link className="pc-link" href={`${BASE_URL}/tms/cisco-pbx/remote-destination`}>
                                                    <span className="pc-mtext">Remote Destination</span>
                                                </Link>
                                <Link className="pc-link" href={`${BASE_URL}/tms/cisco-pbx/remote-destination/profile`}>
                                                    <span className="pc-mtext">Remote Destination Profile</span>
                                                </Link>
                                <Link className="pc-link" href={`${BASE_URL}/tms/cisco-pbx/line`}>
                                                    <span className="pc-mtext">Line</span>
                                                </Link>
                                <Link className="pc-link" href={`${BASE_URL}/tms/cisco-pbx/phone`}>
                                                    <span className="pc-mtext">Phone</span>
                                                </Link>
                                <Link className="pc-link" href={`${BASE_URL}/tms/cisco-pbx/sip-trunks`}>
                                                    <span className="pc-mtext">SIP Trunks</span>
                                                </Link>
                                <Link className="pc-link" href={`${BASE_URL}/tms/cisco-pbx/translation-patterns`}>
                                                    <span className="pc-mtext">Translation Patterns</span>
                                                </Link>
                                <Link className="pc-link" href={`${BASE_URL}/tms/cisco-pbx/device-pool`}>
                                                    <span className="pc-mtext">Device Pool</span>
                                                </Link>
                                <Link className="pc-link" href={`${BASE_URL}/tms/cisco-pbx/locations`}>
                                                    <span className="pc-mtext">Locations</span>
                                                </Link>
                                <Link className="pc-link" href={`${BASE_URL}/tms/cisco-pbx/route-partitions`}>
                                                    <span className="pc-mtext">Route Partitions</span>
                                                </Link>
                                <Link className="pc-link" href={`${BASE_URL}/tms/cisco-pbx/css`}>
                                                    <span className="pc-mtext">CSS</span>
                                                </Link>
                                <Link className="pc-link" href={`${BASE_URL}/tms/cisco-pbx/regions`}>
                                                    <span className="pc-mtext">Regions</span>
                                                </Link>
                                <Link className="pc-link" href={`${BASE_URL}/tms/cisco-pbx/route-pattern`}>
                                                    <span className="pc-mtext">Route Pattern</span>
                                                </Link>
                                            </li>
                                        </ul>
                                    </li>
                                    )}

                                    {(hasTmsPermission('view','unified_op') || hasTmsPermission('admin','global')) && (
                                    <li className="pc-item">
                        <Link className="pc-link" href={`${BASE_URL}/tms/unified-ops`}>
                                            <span className="pc-micon"><i className="ph-duotone ph-link"></i></span>
                                            <span className="pc-mtext">Unified Ops</span>
                                        </Link>
                                    </li>
                                    )}

                                    {(hasTmsPermission('view','audit_log') || hasTmsPermission('admin','global')) && (
                                        <li className="pc-item">
                        <Link className="pc-link" href={`${BASE_URL}/tms/audit-logs`}>
                                                <span className="pc-micon"><i className="ph-duotone ph-list"></i></span>
                                                <span className="pc-mtext">Audit Log</span>
                                            </Link>
                                        </li>
                                    )}

                                    {(hasTmsPermission('view','user') || 
                                    hasTmsPermission('view','rank') ||
                hasTmsPermission('admin','global')) && (
                                    <li className="pc-item pc-hasmenu">
                                        <Link className="pc-link" href="#!">
                                            <span className="pc-micon">
                                                <i className="ph-duotone ph-users"></i>
                                            </span>
                                            <span className="pc-mtext" data-i18n="KB Access">Users Management</span>
                                            <span className="pc-arrow"><i className="ph-duotone ph-caret-right"></i></span>
                                        </Link>
                                        <ul className="pc-submenu">
                                            <li className="pc-item">
                                            {(hasTmsPermission('view','user') || hasTmsPermission('update','user') || hasTmsPermission('admin','global')) && (
                                    <Link className="pc-link" href={`${BASE_URL}/tms/management/users`}>
                                                    <span className="pc-mtext">Users</span>
                                                </Link>
                                                )}
                                            {(hasTmsPermission('view','rank','admin') || hasTmsPermission('admin','global')) && (
                                    <Link className="pc-link" href={`${BASE_URL}/tms/management/rank-permissions`}>
                                                    <span className="pc-mtext">Rank Permissions</span>
                                                </Link>
                                            )}
                                            </li>
                                        </ul>
                                    </li>
                                    )}

                                    {(hasTmsPermission('view','company')
                                    || hasTmsPermission('view','customer_profiling')
                                    || hasTmsPermission('view','user')
                || hasTmsPermission('admin','global')) && (
                                    <li className="pc-item pc-hasmenu">
                                        <Link className="pc-link" href="#!">
                                            <span className="pc-micon">
                                                <i className="ph-duotone ph-users"></i>
                                            </span>
                                            <span className="pc-mtext" data-i18n="Profiling">Profiling</span>
                                            <span className="pc-arrow"><i className="ph-duotone ph-caret-right"></i></span>
                                        </Link>
                                        <ul className="pc-submenu">
                                            <li className="pc-item">
                                            {(hasTmsPermission('view','company', 'admin') || hasTmsPermission('admin','global')) && (
                                    <Link className="pc-link" href={`${BASE_URL}/tms/profiling/customers`}>
                                                    <span className="pc-mtext">Customers</span>
                                                </Link>
                                                )}
                                              {(hasTmsPermission('create','customer_profiling','admin') || hasTmsPermission('admin','global')) && (
                                    <Link className="pc-link" href={`${BASE_URL}/tms/profiling/customers/create`}>
                                                    <span className="pc-mtext">Create Profile</span>
                                                </Link>
                                                )}
                                {(hasTmsPermission('create','user') || hasTmsPermission('admin','global')) && (
                                    <Link className="pc-link" href={`${BASE_URL}/tms/profiling/user`}>
                                                    <span className="pc-mtext">User Profiles</span>
                                                </Link>
                                                )}
                                                {(hasTmsPermission('create','user') || hasTmsPermission('admin','global')) && (
                                    <Link className="pc-link" href={`${BASE_URL}/tms/profiling/user/create`}>
                                                    <span className="pc-mtext">Create User Profile</span>
                                                </Link>
                                                )}
                                                {(hasTmsPermission('view','user_profiling_error_log') || hasTmsPermission('admin','global')) && (
                                    <Link className="pc-link" href={`${BASE_URL}/tms/profiling/logs`}>
                                                    <span className="pc-mtext">Error Logs</span>
                                                </Link>
                                                )}
                                            </li>
                                        </ul>
                                    </li>
                                    )}
                                </ul>
                            </div>
    ), [hasTmsPermission]);

    // Reusable submenu section component
    const SubmenuSection = useCallback(({ section }: { section: SubmenuSection }) => (
        <div className="tab-pane" id={section.id} role="tabpanel" aria-labelledby={`pc-tab-link-${section.id.replace('pc-tab-', '')}`} tabIndex={1}>
            <div className="pc-submenu-title">{section.title}</div>
                                <ul className="pc-navbar">
                {section.items.map((item) => (
                    <SubmenuItem key={item.key} item={item} />
                ))}
                                </ul>
                            </div>
    ), [SubmenuItem]);

    return (
        <React.Fragment>
            <style jsx>{`
                .pc-arrow i {
                    transition: all 0.3s ease;
                    display: inline-block;
                }
                .pc-item.pc-hasmenu.active .pc-arrow i {
                    transform: rotate(90deg);
                }
                .pc-arrow {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: absolute;
    top: 0;
    bottom: 0;
    right: 10px;
                }
            `}</style>
           <nav className="pc-sidebar">
                <div className="navbar-wrapper">
                    <div className="m-header">
                    <Link href={`${BASE_URL}/dashboard`}  className="b-brand text-primary">
                        <img src={CompanyLogo2.src} alt="logo" className="img-fluid" />
                                        </Link>
                            </div>


                    <div className="navbar-content pc-trigger simplebar-scrollable-y" data-simplebar="init">
                    <div className="simplebar-wrapper" style={{margin: "-10px 0px"}}>
                        <div className="simplebar-height-auto-observer-wrapper">
                            <div className="simplebar-height-auto-observer"></div>
                        </div>
                        <div className="simplebar-mask">
                            <div className="simplebar-offset" style={{right: "0px", bottom: "0px"}}>
                                <div className="simplebar-content-wrapper" tabIndex={0} role="region" aria-label="scrollable content" style={{height: "100%", overflow: "hidden scroll"}}>
                                    <div className="simplebar-content" style={{padding: "10px 0px"}}>
                                    
                                        <ul className="pc-navbar main-caption nav" role="tablist" id="pc-layout-submenus" style={{display: "block"}}>

                                       <li className="pc-item nav-item NoTab">
                                                <Link 
                                                    className={`pc-link nav-link${router.asPath=='/dashboard' ? ' active' : ''}`} 
                                                    href={`${BASE_URL}/dashboard`} 
                                                    role="" 
                                                    aria-selected="false"
                                                >
                                                <span className="pc-micon">
                                                    <i className="ti ti-settings"></i>
                                                </span>
                                                <span className="pc-mtext">Dashboard</span>
                                        </Link>
                                    </li>
                                            
                                            {/* Dynamic Navigation Items */}
                                            {navigationItems.map((item) => {
                                                // Special handling for Accounts and NetOps - show if user has any permissions or is admin
                                                const shouldShow = item.key === 'accounts' || item.key === 'netops' 
                                                    ? (userState.permissions.includes(item.permission) || userState.isAdmin || userState.permissions.length > 0)
                                                    : userState.permissions.includes(item.permission);
                                                
                                                return shouldShow && (
                                                    <li key={item.key} className="pc-item nav-item" role="presentation">
                                                <Link 
                                                            className={`pc-link nav-link${router.asPath.includes(item.key) ? ' active' : ''}`} 
                                                    href="#!" 
                                                            id={`pc-tab-link-${item.key}`} 
                                                            data-bs-target={item.target} 
                                                    role="tab" 
                                                    data-bs-toggle="tab" 
                                                    aria-selected="false"
                                                >
                                                <span className="pc-micon">
                                                                <i className={item.icon}></i>
                                                </span>
                                                            <span className="pc-mtext">{item.label}</span>
                                        </Link>
                                    </li>
                                                );
                                            })}
                                </ul>
                                        
                            </div>
                            </div>
                            </div>
                        </div>
                    
                            </div>
                    
                            </div>


                    <div className="pc-submenu-popup" data-simplebar="init">
                        <div className="tab-content" id="pc-layout-tab">
                            {/* Dynamic Submenu Sections */}
                            {submenuSections.map((section) => (
                                <SubmenuSection key={section.id} section={section} />
                            ))}
                            
                            {/* Complex submenus with nested structures */}
                            <CallRecordingSubmenu />
                            <ReportsSubmenu />
                            <CrmSubmenu />
                            <TmsSubmenu />
                            <AccountsSubmenu />
                            <NetOpsSubmenu />

                            </div>
                            </div>

                    <div className="card pc-user-card">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="flex-shrink-0">
                                    <span className="user-avtar bg rounded-circle text-white sidebar-user-icon">
                                        {userState.name.split(' ')[0][0]}
                                    </span>
                                </div>
                                <div className="flex-grow-1 ms-2">
                                    <div className="dropdown">
                                    <div className="d-flex align-items-center">
                                                <div className="flex-grow-1 me-2">
                                                <h6 className="mb-0 username-ellipsis">{userState.name}</h6>
                                                <small>{userState.role}</small>
                                                </div>
                                                <div className="">
                                                    <div className="sidebar-logout-icon" onClick={handleLogout}>
                                                        <i className="ti ti-logout"></i>
                                                    </div>
                                                </div>
                                            </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
    </nav>
        </React.Fragment>
    );
};

export default Header;