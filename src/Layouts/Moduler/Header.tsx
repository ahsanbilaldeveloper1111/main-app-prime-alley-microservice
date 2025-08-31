import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import tokenService from "../../utils/tokenService";

// Import sidebar styles
import "../../assets/scss/sidebar.scss";

import navCarBg from '@assets/images/layout/nav-card-bg.svg'
import logoDark from "@assets/images/logo-dark.svg";
import logoLight from "@assets/images/logo-white.svg";
import avatar1 from "@assets/images/user/avatar-1.jpg"
import SimpleBarReact from "simplebar-react";
import { Card, Dropdown, Form } from "react-bootstrap";

//import CompanyLogo from "@assets/images/Prime-Alley-Logo.png";
import CompanyLogo from "@assets/images/ringedge-logo.png";
import { authAPI } from "@utils/api";
import { useAuth } from "../../hooks/useAuth";

const baseUrl = '';

// Extend Window interface for bootstrap
declare global {
    interface Window {
        bootstrap: any;
        SimpleBar: any;
    }
}

const Header = ({ themeMode }: any) => {

    const { data: session, status } = useSession();
    const router = useRouter();
    const { logout } = useAuth();

    const [permissions, setPermissions] = useState<string[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);

    const [loggedInUserName, setLoggedInUserName] = useState('');
    const [loggedInUserEmail, setLoggedInUserEmail] = useState('');
    const [loggedInUserRole, setLoggedInUserRole] = useState('');
    
    useEffect(() => {
        if (status !== "loading") {
            if (session && status === "authenticated") {
                if (typeof window !== "undefined") {
                    setPermissions(session.user?.permissions || []);
                    setIsAdmin(Boolean(session.user?.is_admin));
                    setLoggedInUserName(session.user?.name || '');
                    setLoggedInUserEmail(session.user?.email || '');
                    setLoggedInUserRole(session.user?.role || '');
                    // Initialize token service with session data
                    tokenService.initializeFromSession(session);
                }
            } else if (status === "unauthenticated") {
                // Clear tokens and redirect to login if session is invalid
                tokenService.clearTokens();
                router.push('/auth/signin');
            }
        }
    }, [status, session, router]);

    const handleLogout = async () => {
        try {
          await authAPI.logout();
          await logout();
        } catch (error) {
          console.error('Logout failed:', error);
          await logout();
        }
      };

    useEffect(() => {
        const handleRouteChange = () => {
            const submenuPopup = document.querySelector('.pc-submenu-popup') as HTMLElement;
            if (submenuPopup) {
                submenuPopup.classList.remove('active');
                submenuPopup.style.display = 'none';
            }
        };

        router.events.on('routeChangeStart', handleRouteChange);

        return () => {
            router.events.off('routeChangeStart', handleRouteChange);
        };
    }, [router]);

    useEffect(() => {
        // Only initialize events when permissions are loaded
        if (permissions.length === 0) return;

        // Add a small delay to ensure DOM is fully rendered
        const timer = setTimeout(() => {
            // Add mouse enter/leave event listeners for navigation links
            const addNavigationEvents = () => {
                // More specific selector to target only main navigation tabs, not submenu items
                const navLinks = document.querySelectorAll('#pc-layout-submenus > li > .pc-link');
                
                if (navLinks.length === 0) {
                    console.warn('No navigation links found, retrying...');
                    return false; // Return false to indicate failure
                }
                
                navLinks.forEach((link) => {
                    // Mouse enter event
                    link.addEventListener('mouseenter', function(e) {
                        const target = e.target as HTMLElement;
                        if (!target) return;
                        
                        // Additional check to ensure we're only handling main navigation tabs, not submenu items
                        if (!target.closest('#pc-layout-submenus')) {
                            return;
                        }
                        
                        // Check if the target is actually a navigation link (not a button or other element)
                        if (!target.classList.contains('pc-link') || target.tagName === 'BUTTON') {
                            return;
                        }
                        
                        // Check if the target is absolutely positioned (exclude buttons and other positioned elements)
                        const computedStyle = window.getComputedStyle(target);
                        if (computedStyle.position === 'absolute' || computedStyle.position === 'fixed') {
                            return;
                        }
                        
                        // Get the submenu popup
                        const submenuPopup = document.querySelector('.pc-submenu-popup') as HTMLElement;
                        if (submenuPopup) {
                            submenuPopup.classList.add('active');
                            submenuPopup.style.display = 'block';
                            
                            // Calculate position to align with the hovered tab
                            const tabRect = target.getBoundingClientRect();
                            const sidebarRect = document.querySelector('.pc-sidebar')?.getBoundingClientRect();
                            
                            if (sidebarRect) {
                                // Calculate relative position within the sidebar
                                const relativeTop = tabRect.top - sidebarRect.top;
                                submenuPopup.style.top = `${relativeTop}px`;
                                submenuPopup.style.position = 'absolute';
                                submenuPopup.style.left = '100%';
                                submenuPopup.style.zIndex = '1000';
                            }
                        }
                        
                        // Get the target tab pane dynamically using data-bs-target
                        const targetId = target.getAttribute('data-bs-target');
                        const tabPane = targetId ? document.querySelector(targetId) as HTMLElement : null;
                        if (tabPane) {
                            // Hide all tab panes first
                            const allTabPanes = document.querySelectorAll('.pc-submenu-popup .tab-pane');
                            allTabPanes.forEach((pane) => {
                                pane.classList.remove('active');
                                pane.classList.remove('show');
                                (pane as HTMLElement).style.display = 'none';
                            });
                            
                            // Show the target tab pane
                            tabPane.classList.add('active');
                            tabPane.classList.add('show');
                            tabPane.style.display = 'block';
                            tabPane.style.opacity = '1';
                            tabPane.style.visibility = 'visible';
                            
                            // Calculate and set the height based on the active tab content
                            setTimeout(() => {
                                const submenuPopup = document.querySelector('.pc-submenu-popup') as HTMLElement;
                                if (submenuPopup && tabPane) {
                                    // Get only the actual content height of the active tab pane
                                    const tabContentHeight = tabPane.offsetHeight;
                                    
                                    // Set the height to match exactly the content height
                                    submenuPopup.style.height = `${tabContentHeight}px`;
                                    submenuPopup.style.minHeight = `${tabContentHeight}px`;
                                }
                            }, 10);
                        }
                    });
                    
                    // Mouse leave event - only hide if not hovering over submenu popup
                    link.addEventListener('mouseleave', function(e: Event) {
                        const target = e.target as HTMLElement;
                        if (!target) return;
                        
                        // Additional check to ensure we're only handling main navigation tabs
                        if (!target.closest('#pc-layout-submenus')) {
                            return;
                        }
                        
                        // Check if the target is actually a navigation link (not a button or other element)
                        if (!target.classList.contains('pc-link') || target.tagName === 'BUTTON') {
                            return;
                        }
                        
                        // Check if the target is absolutely positioned (exclude buttons and other positioned elements)
                        const computedStyle = window.getComputedStyle(target);
                        if (computedStyle.position === 'absolute' || computedStyle.position === 'fixed') {
                            return;
                        }
                        
                        // Check if mouse is moving to the submenu popup
                        const mouseEvent = e as MouseEvent;
                        const relatedTarget = mouseEvent.relatedTarget as HTMLElement;
                        const submenuPopup = document.querySelector('.pc-submenu-popup') as HTMLElement;
                        
                        if (relatedTarget && submenuPopup && submenuPopup.contains(relatedTarget)) {
                            // Mouse is moving to submenu popup, don't hide
                            return;
                        }
                        
                        // Get the submenu popup
                        if (submenuPopup) {
                            submenuPopup.classList.remove('active');
                            submenuPopup.style.display = 'none';
                        }
                        
                        // Get the target tab pane dynamically using data-bs-target
                        const targetId = target.getAttribute('data-bs-target');
                        const tabPane = targetId ? document.querySelector(targetId) as HTMLElement : null;
                        if (tabPane) {
                            // Hide all tab panes first
                            const allTabPanes = document.querySelectorAll('.pc-submenu-popup .tab-pane');
                            allTabPanes.forEach((pane) => {
                                pane.classList.remove('active');
                                pane.classList.remove('show');
                                (pane as HTMLElement).style.display = 'none';
                            });
                            
                            // Show the target tab pane
                            tabPane.classList.add('active');
                            tabPane.classList.add('show');
                            tabPane.style.display = 'block';
                            tabPane.style.opacity = '1';
                            tabPane.style.visibility = 'visible';
                        }
                    });
                });
                
                return true; // Return true to indicate success
            };

            // Add mouse events for submenu popup to maintain visibility
            const addSubmenuPopupEvents = () => {
                const submenuPopup = document.querySelector('.pc-submenu-popup') as HTMLElement;
                if (!submenuPopup) return;
                
                // Mouse enter submenu popup - keep it visible and reset height
                submenuPopup.addEventListener('mouseenter', function() {
                    submenuPopup.classList.add('active');
                    
                    // Update height with fresh calculation
                    setTimeout(() => {
                        const activeTabPane = submenuPopup.querySelector('.tab-pane.active') as HTMLElement;
                        if (activeTabPane) {
                            // Get only the actual content height of the active tab pane
                            const tabContentHeight = activeTabPane.offsetHeight;
                            
                            // Set the height to match exactly the content height
                            submenuPopup.style.height = `${tabContentHeight}px`;
                            submenuPopup.style.minHeight = `${tabContentHeight}px`;
                        }
                    }, 10);
                });
                
                // Mouse leave submenu popup - hide it
                submenuPopup.addEventListener('mouseleave', function() {
                    submenuPopup.classList.remove('active');
                    submenuPopup.style.display = 'none';
                    
                    // Also hide all tab panes
                    const tabPanes = document.querySelectorAll('.pc-submenu-popup .tab-pane');
                    tabPanes.forEach((tabPane) => {
                        tabPane.classList.remove('active');
                        tabPane.classList.remove('show');
                    });
                });
            };

            // Add mouse leave event to the entire sidebar
            const addSidebarMouseLeaveEvent = () => {
                const sidebar = document.querySelector('.pc-sidebar') as HTMLElement;
                if (!sidebar) return;
                
                sidebar.addEventListener('mouseleave', function() {
                    const submenuPopup = document.querySelector('.pc-submenu-popup') as HTMLElement;
                    if (submenuPopup) {
                        submenuPopup.classList.remove('active');
                        submenuPopup.style.display = 'none';
                        
                        // Also hide all tab panes
                        const tabPanes = document.querySelectorAll('.pc-submenu-popup .tab-pane');
                        tabPanes.forEach((tabPane) => {
                            tabPane.classList.remove('active');
                            tabPane.classList.remove('show');
                        });
                    }
                });
            };

            // Add hover event listeners for menu items in tab panes
            const addTabPaneMenuEvents = () => {
                const menuItems = document.querySelectorAll('.pc-submenu-popup .tab-pane .pc-item.pc-hasmenu');
                
                // Function to update submenu popup height
                const updateSubmenuPopupHeight = () => {
                    const submenuPopup = document.querySelector('.pc-submenu-popup') as HTMLElement;
                    if (!submenuPopup) return;
                    
                    const activeTabPane = submenuPopup.querySelector('.tab-pane.active') as HTMLElement;
                    if (!activeTabPane) return;
                    
                    // Get only the actual content height of the active tab pane
                    const tabContentHeight = activeTabPane.offsetHeight;
                    
                    // Set the height to match exactly the content height
                    submenuPopup.style.height = `${tabContentHeight}px`;
                    submenuPopup.style.minHeight = `${tabContentHeight}px`;
                };
                
                menuItems.forEach((menuItem) => {
                    const submenu = menuItem.querySelector('.pc-submenu') as HTMLElement;
                    if (!submenu) return;

                    // Only add click handler to the parent menu item, not to child links
                    const parentLink = menuItem.querySelector('.pc-link') as HTMLElement;
                    if (parentLink && parentLink.parentElement === menuItem) {
                        parentLink.addEventListener('click', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            // Toggle the submenu
                            const isActive = menuItem.classList.contains('active');
                            
                            // Close all other submenus first
                            const allMenuItems = document.querySelectorAll('.pc-submenu-popup .tab-pane .pc-item.pc-hasmenu');
                            allMenuItems.forEach((item) => {
                                if (item !== menuItem) {
                                    item.classList.remove('active');
                                    const itemSubmenu = item.querySelector('.pc-submenu') as HTMLElement;
                                    if (itemSubmenu) {
                                        itemSubmenu.style.display = 'none';
                                    }
                                    // Reset chevron for other items to right (closed state)
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
                                // Reset chevron to right (closed state)
                                const chevron = menuItem.querySelector('.pc-arrow i');
                                if (chevron) {
                                    chevron.className = 'ph-duotone ph-caret-right';
                                }
                            } else {
                                menuItem.classList.add('active');
                                submenu.style.display = 'block';
                                // Change chevron to down (open state)
                                const chevron = menuItem.querySelector('.pc-arrow i');
                                if (chevron) {
                                    chevron.className = 'ph-duotone ph-caret-down';
                                }
                            }
                            
                            // Update popup height after toggling
                            setTimeout(updateSubmenuPopupHeight, 10);
                        });
                    }
                });
                
                // Also update height when tab changes - use more specific selector
                const tabLinks = document.querySelectorAll('#pc-layout-submenus > li > .pc-link');
                tabLinks.forEach((link) => {
                    link.addEventListener('click', function() {
                        setTimeout(updateSubmenuPopupHeight, 100);
                    });
                });
            };
            
            // Initialize events after component mounts
            const navigationSuccess = addNavigationEvents();
            addSubmenuPopupEvents();
            addSidebarMouseLeaveEvent(); // Add this line
            addTabPaneMenuEvents();
            
            // Initialize all dropdown arrows to point right (closed state)
            const allMenuItems = document.querySelectorAll('.pc-submenu-popup .tab-pane .pc-item.pc-hasmenu');
            allMenuItems.forEach((menuItem) => {
                const arrow = menuItem.querySelector('.pc-arrow i');
                if (arrow) {
                    arrow.className = 'ph-duotone ph-caret-right';
                }
            });
            
            // If navigation events failed, retry after a short delay
            if (!navigationSuccess) {
                setTimeout(() => {
                    addNavigationEvents();
                }, 100);
            }
        }, 50); // 50ms delay to ensure DOM is rendered
        
        // Cleanup function
        return () => {
            clearTimeout(timer);
            
            // Clean up navigation link event listeners - use more specific selector
            const navLinks = document.querySelectorAll('#pc-layout-submenus > li > .pc-link');
            navLinks.forEach((link: Element) => {
                // Remove event listeners by recreating the element or using a different approach
                const newLink = link.cloneNode(true);
                if (link.parentNode) {
                    link.parentNode.replaceChild(newLink, link);
                }
            });
            
            // Clean up submenu popup event listeners
            const submenuPopup = document.querySelector('.pc-submenu-popup') as HTMLElement;
            if (submenuPopup) {
                const newSubmenuPopup = submenuPopup.cloneNode(true) as HTMLElement;
                if (submenuPopup.parentNode) {
                    submenuPopup.parentNode.replaceChild(newSubmenuPopup, submenuPopup);
                }
            }
            
            // Clean up sidebar mouse leave event listener
            const sidebar = document.querySelector('.pc-sidebar') as HTMLElement;
            if (sidebar) {
                const newSidebar = sidebar.cloneNode(true) as HTMLElement;
                if (sidebar.parentNode) {
                    sidebar.parentNode.replaceChild(newSidebar, sidebar);
                }
            }
            
            // Clean up menu items event listeners
            const menuItems = document.querySelectorAll('.pc-submenu-popup .tab-pane .pc-item.pc-hasmenu');
            menuItems.forEach((menuItem: Element) => {
                const newMenuItem = menuItem.cloneNode(true);
                if (menuItem.parentNode) {
                    menuItem.parentNode.replaceChild(newMenuItem, menuItem);
                }
            });
        };
    }, [permissions]); // Add permissions as dependency

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
                }
            `}</style>
           <nav className="pc-sidebar">
                <div className="navbar-wrapper">
                    <div className="m-header">
                    <Link href={`${baseUrl}/dashboard`}  className="b-brand text-primary">
                        <img src={CompanyLogo.src} alt="logo" className="img-fluid" />
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


                                       
                                            
                                        {permissions.includes('control-hub-services') && (
                                            <li className="pc-item nav-item" role="presentation">
                                                <Link 
                                                    className={`pc-link nav-link${router.asPath.includes('controlhub') ? ' active' : ''}`} 
                                                    href="#!" 
                                                    id="pc-tab-link-controlhub" 
                                                    data-bs-target="#pc-tab-controlhub" 
                                                    role="tab" 
                                                    data-bs-toggle="tab" 
                                                    aria-selected="false"
                                                >
                                                <span className="pc-micon">
                                                    <i className="ti ti-settings"></i>
                                                </span>
                                                <span className="pc-mtext">Control Hub</span>
                                                </Link>
                                            </li>
                                            )}

                                            {permissions.includes('gsm-services') && (
                                            <li className="pc-item nav-item" role="presentation">
                                                <Link 
                                                className={`pc-link nav-link${router.asPath.includes('gsm') ? ' active' : ''}`} 
                                                href="#!" id="pc-tab-link-1" data-bs-target="#pc-tab-1" role="tab" data-bs-toggle="tab" aria-selected="false">
                                                <span className="pc-micon">
                                                    <i className="ti ti-antenna-bars-4"></i>
                                                </span>
                                                <span className="pc-mtext">GSM</span>
                                                </Link>
                                            </li>
                                            )}

                                            {permissions.includes('call-logs-services') && (
                                            <li className="pc-item nav-item" role="presentation">
                                                <Link 
                                                className={`pc-link nav-link${router.asPath.includes('call-logs') ? ' active' : ''}`} 
                                                
                                                href="#!"  id="pc-tab-link-2" data-bs-target="#pc-tab-2" role="tab" data-bs-toggle="tab" aria-selected="false">
                                                <span className="pc-micon">
                                                    <i className="ph-duotone ph-file-text"></i>
                                                </span>
                                                <span className="pc-mtext">Call Logs</span>
                                                </Link>
                                            </li>
                                            )}
                                            
                                            {permissions.includes('reports-services') && (
                                            <li className="pc-item nav-item" role="presentation">
                                                <Link 
                                                className={`pc-link nav-link${router.asPath.includes('call-reports') ? ' active' : ''}`} 
                                                href="#!"  id="pc-tab-link-5" data-bs-target="#pc-tab-5" role="tab" data-bs-toggle="tab" aria-selected="false">
                                                <span className="pc-micon">
                                                    <i className="ph-duotone ph-file-text"></i>
                                                </span>
                                                <span className="pc-mtext">Reports</span>
                                                </Link>
                                            </li>
                                            )}

                                            {permissions.includes('call-recordings-services') && (
                                            <li className="pc-item nav-item" role="presentation">
                                                <Link 
                                                className={`pc-link nav-link${router.asPath.includes('call-recording') ? ' active' : ''}`} 
                                                href="#!"  id="pc-tab-link-3" data-bs-target="#pc-tab-3" role="tab" data-bs-toggle="tab" aria-selected="false">
                                                <span className="pc-micon">
                                                    <i className="ph-duotone ph-record"></i>
                                                </span>
                                                <span className="pc-mtext">Call Recordings</span>
                                                </Link>
                                            </li>
                                            )}

                                            {permissions.includes('ai-ml-services') && (
                                            <li className="pc-item nav-item" role="presentation">
                                                <Link 
                                                className={`pc-link nav-link${router.asPath.includes('ai-ml') ? ' active' : ''}`} 
                                                href="#!"  id="pc-tab-link-4" data-bs-target="#pc-tab-4" role="tab" data-bs-toggle="tab" aria-selected="false">
                                                <span className="pc-micon">
                                                    <i className="ph-duotone ph-robot"></i>
                                                </span>
                                                <span className="pc-mtext">Ai ML</span>
                                                </Link>
                                            </li>
                                            )}

                                            {permissions.includes('cti-services') && (
                                            <li className="pc-item nav-item" role="presentation">
                                                <Link 
                                                className={`pc-link nav-link${router.asPath.includes('cti') ? ' active' : ''}`} 
                                                href="#!"  id="pc-tab-link-9" data-bs-target="#pc-tab-9" role="tab" data-bs-toggle="tab" aria-selected="false">
                                                <span className="pc-micon">
                                                    <i className="ph-duotone ph-phone-call"></i>
                                                </span>
                                                <span className="pc-mtext">CTI</span>
                                                </Link>
                                            </li>
                                            )}
                                            
                                            {permissions.includes('tickets-services') && (
                                            <li className="pc-item nav-item" role="presentation">
                                                <Link 
                                                className={`pc-link nav-link${router.asPath.includes('tickets') ? ' active' : ''}`} 
                                                href="#!"  id="pc-tab-link-14" data-bs-target="#pc-tab-14" role="tab" data-bs-toggle="tab" aria-selected="false">
                                                <span className="pc-micon">
                                                    <i className="ph-duotone ph-ticket"></i>
                                                </span>
                                                <span className="pc-mtext">Tickets</span>
                                                </Link>
                                            </li>
                                            )}
                                            
                                            {permissions.includes('tms-services') && (
                                            <li className="pc-item nav-item" role="presentation">
                                                <Link 
                                                className={`pc-link nav-link${router.asPath.includes('tms') ? ' active' : ''}`} 
                                                href="#!"  id="pc-tab-link-6" data-bs-target="#pc-tab-6" role="tab" data-bs-toggle="tab" aria-selected="false">
                                                <span className="pc-micon">
                                                    <i className="ph-duotone ph-link"></i>
                                                </span>
                                                <span className="pc-mtext">TMS</span>
                                                </Link>
                                            </li>
                                            )}
                                            
                                            {permissions.includes('crm-services') && (
                                            <li className="pc-item nav-item" role="presentation">
                                                <Link 
                                                className={`pc-link nav-link${router.asPath.includes('crm') ? ' active' : ''}`} 
                                                href="#!"  id="pc-tab-link-7" data-bs-target="#pc-tab-7" role="tab" data-bs-toggle="tab" aria-selected="false">
                                                <span className="pc-micon">
                                                    <i className="ph-duotone ph-link"></i>
                                                </span>
                                                <span className="pc-mtext">CRM</span>
                                                </Link>
                                            </li>
                                            )}
                                            
                                            {permissions.includes('sales-services') && (
                                            <li className="pc-item nav-item" role="presentation">
                                                <Link 
                                                className={`pc-link nav-link${router.asPath.includes('sales') ? ' active' : ''}`} 
                                                href="#!"  id="pc-tab-link-8" data-bs-target="#pc-tab-8" role="tab" data-bs-toggle="tab" aria-selected="false">
                                                <span className="pc-micon">
                                                    <i className="ph-duotone ph-shopping-cart"></i>
                                                </span>
                                                <span className="pc-mtext">Sales</span>
                                                </Link>
                                            </li>
                                            )}
                                            
                                            
                                            
                                            {permissions.includes('dncr-services') && (
                                            <li className="pc-item nav-item" role="presentation">
                                                <Link 
                                                className={`pc-link nav-link${router.asPath.includes('dncr') ? ' active' : ''}`} 
                                                href="#!"  id="pc-tab-link-10" data-bs-target="#pc-tab-10" role="tab" data-bs-toggle="tab" aria-selected="false">
                                                <span className="pc-micon">
                                                    <i className="ph-duotone ph-link"></i>
                                                </span>
                                                <span className="pc-mtext">DNCR</span>
                                                </Link>
                                            </li>
                                            )}
                                            
                                            {permissions.includes('webrtc-services') && (
                                            <li className="pc-item nav-item bg-danger" role="presentation">
                                                <Link 
                                                className={`pc-link nav-link${router.asPath.includes('webrtc') ? ' active' : ''}`} 
                                                href="#!"  id="pc-tab-link-11" data-bs-target="#pc-tab-11" role="tab" data-bs-toggle="tab" aria-selected="false">
                                                <span className="pc-micon">
                                                    <i className="ph-duotone ph-link"></i>
                                                </span>
                                                <span className="pc-mtext">WebRTC</span>
                                                </Link>
                                            </li>
                                            )}
                                            
                                            {permissions.includes('omni-channel-services') && (
                                            <li className="pc-item nav-item bg-danger" role="presentation">
                                                <Link 
                                                className={`pc-link nav-link${router.asPath.includes('omni-channel') ? ' active' : ''}`} 
                                                href="#!"  id="pc-tab-link-12" data-bs-target="#pc-tab-12" role="tab" data-bs-toggle="tab" aria-selected="false">
                                                <span className="pc-micon">
                                                    <i className="ph-duotone ph-link"></i>
                                                </span>
                                                <span className="pc-mtext">Omni Channel</span>
                                                </Link>
                                            </li>
                                            )}

                                            {permissions.includes('hr-services') && (
                                            <li className="pc-item nav-item bg-danger" role="presentation">
                                                <Link 
                                                className={`pc-link nav-link${router.asPath.includes('hr') ? ' active' : ''}`} 
                                                href="#!"  id="pc-tab-link-13" data-bs-target="#pc-tab-13" role="tab" data-bs-toggle="tab" aria-selected="false">
                                                <span className="pc-micon">
                                                    <i className="ph-duotone ph-link"></i>
                                                </span>
                                                <span className="pc-mtext">HR</span>
                                                </Link>
                                            </li>
                                            )}
                                            
                                            {permissions.includes('accounts-services') && (
                                            <li className="pc-item nav-item bg-danger" role="presentation">
                                                <Link 
                                                className={`pc-link nav-link${router.asPath.includes('accounts') ? ' active' : ''}`} 
                                                href="#!"  id="pc-tab-link-15" data-bs-target="#pc-tab-15" role="tab" data-bs-toggle="tab" aria-selected="false">
                                                <span className="pc-micon">
                                                    <i className="ph-duotone ph-link"></i>
                                                </span>
                                                <span className="pc-mtext">Accounts</span>
                                                </Link>
                                            </li>
                                            )}
                                            
                                            {permissions.includes('health-care-services') && (
                                            <li className="pc-item nav-item bg-danger" role="presentation">
                                                <Link 
                                                className={`pc-link nav-link${router.asPath.includes('health-care') ? ' active' : ''}`} 
                                                href="#!"  id="pc-tab-link-16" data-bs-target="#pc-tab-16" role="tab" data-bs-toggle="tab" aria-selected="false">
                                                <span className="pc-micon">
                                                    <i className="ph-duotone ph-heartbeat"></i>
                                                </span>
                                                <span className="pc-mtext">Health Care</span>
                                                </Link>
                                            </li>
                                            )}

                                           
                                           

                                        </ul>
                                        
                                    </div>
                                </div>
                            </div>
                        </div>
                    
                    </div>
                    
                </div>


                    <div className="pc-submenu-popup" data-simplebar="init">
                        <div className="tab-content" id="pc-layout-tab">

                             {/* tab pane start */}
                             <div className="tab-pane" id="pc-tab-controlhub" role="tabpanel" aria-labelledby="pc-tab-link-controlhub" tabIndex={1} >
                                    <div className="pc-submenu-title">Control Hub</div>
                                    <ul className="pc-navbar">
                                    
                                    {permissions.includes('view-users') && (
                                        <li className="pc-item">
                                            <Link href={`${baseUrl}/controlhub/users`} 
                                            className={`pc-link ${router.asPath.includes('controlhub/users') ? ' active' : ''}`} 
                                            >
                                            <span className="pc-micon">
                                                <i className="ph-duotone ph-users"></i>
                                            </span>
                                            <span className="pc-mtext" data-i18n="Users">User Directory</span>
                                            </Link>
                                        </li>
                                    )}
                                    
                                    {permissions.includes('view-ranks') && (
                                        <li className="pc-item">
                                            <Link href={`${baseUrl}/controlhub/ranks`} 
                                            className={`pc-link ${router.asPath.includes('controlhub/ranks') ? ' active' : ''}`} 
                                            >
                                            <span className="pc-micon">
                                                <i className="ph-duotone ph-users"></i>
                                            </span>
                                            <span className="pc-mtext" data-i18n="Users">Ranks</span>
                                            </Link>
                                        </li>
                                    )}
                                    
                                    {permissions.includes('view-groups') && (
                                        <li className="pc-item">
                                            <Link href={`${baseUrl}/controlhub/groups`} 
                                            className={`pc-link ${router.asPath.includes('controlhub/groups') ? ' active' : ''}`} 
                                            >
                                            <span className="pc-micon">
                                                <i className="ph-duotone ph-users"></i>
                                            </span>
                                            <span className="pc-mtext" data-i18n="Users">Groups</span>
                                            </Link>
                                        </li>
                                    )}

{permissions.includes('view-gsm-management') && (
                                        <li className="pc-item">
                                            <Link href={`${baseUrl}/gsm/list`} className="pc-link">
                                            <span className="pc-micon">
                                                <i className="ph-duotone ph-list"></i>
                                            </span>
                                            <span className="pc-mtext" data-i18n="Dashboard">Gsm List</span>
                                            </Link>
                                        </li>
                                    )}

                                    {permissions.includes('view-gsm-assignment') && (
                                        <li className="pc-item">
                                            <Link href={`${baseUrl}/gsm/assign`} className="pc-link">
                                            <span className="pc-micon">
                                                <i className="ph-duotone ph-list"></i>
                                            </span>
                                            <span className="pc-mtext" data-i18n="Dashboard">Company Assign</span>
                                            </Link>
                                        </li>
                                    )}

                                    </ul>
                            </div>
                            {/* tab pane end */}
              
                            
                            {/* tab pane start */}
                            <div className="tab-pane" id="pc-tab-1" role="tabpanel" aria-labelledby="pc-tab-link-1" tabIndex={1} >
                                <div className="pc-submenu-title">Gsm</div>
                                <ul className="pc-navbar">
                                    
                                    {permissions.includes('dashboard-gsm-management') && (
                                        <li className="pc-item">
                                            <Link href={`${baseUrl}/gsm/dashboard`} className="pc-link">
                                            <span className="pc-micon">
                                                <i className="ph-duotone ph-gauge"></i>
                                            </span>
                                            <span className="pc-mtext" data-i18n="Dashboard">Dashboard</span>
                                            </Link>
                                        </li>
                                    )}

                                    {permissions.includes('view-gsm-management') && (
                                        <li className="pc-item">
                                            <Link href={`${baseUrl}/gsm/list`} className="pc-link">
                                            <span className="pc-micon">
                                                <i className="ph-duotone ph-list"></i>
                                            </span>
                                            <span className="pc-mtext" data-i18n="Dashboard">Gsm List</span>
                                            </Link>
                                        </li>
                                    )}

                                    {permissions.includes('view-gsm-assignment') && (
                                        <li className="pc-item">
                                            <Link href={`${baseUrl}/gsm/assign`} className="pc-link">
                                            <span className="pc-micon">
                                                <i className="ph-duotone ph-list"></i>
                                            </span>
                                            <span className="pc-mtext" data-i18n="Dashboard">Company Assign</span>
                                            </Link>
                                        </li>
                                    )}

                                    {permissions.includes('view-gsm-ports') && (
                                        <li className="pc-item">
                                            <Link href={`${baseUrl}/gsm/ports`} className="pc-link">
                                            <span className="pc-micon">
                                                <i className="ph-duotone ph-list"></i>
                                            </span>
                                            <span className="pc-mtext" data-i18n="Dashboard">Ports</span>
                                            </Link>
                                        </li>
                                    )}

                                    {permissions.includes('view-gsm-inbox') && (
                                        <li className="pc-item">
                                            <Link href={`${baseUrl}/gsm/inbox`} className="pc-link">
                                            <span className="pc-micon">
                                                <i className="ph-duotone ph-envelope"></i>
                                            </span>
                                            <span className="pc-mtext" data-i18n="Dashboard">Inbox</span>
                                            </Link>
                                        </li>
                                    )}

                                </ul>
                            </div>
                            {/* tab pane end */}

                            {/* tab pane start */}
                            <div className="tab-pane" id="pc-tab-2" role="tabpanel" aria-labelledby="pc-tab-link-2" tabIndex={2} >
                                <div className="pc-submenu-title">Calls</div>
                                <ul className="pc-navbar">
                                
                                {permissions.includes('dashboard-call-logs') && (
                                    <li className="pc-item">
                                        <Link href={`${baseUrl}/call-logs/dashboard`} className="pc-link">
                                            <span className="pc-micon">
                                                <i className="ph-duotone ph-gauge"></i>
                                            </span>
                                            <span className="pc-mtext" data-i18n="Dashboard">Dashboard</span>
                                        </Link>
                                    </li>
                                    )}

                                    {permissions.includes('view-call-logs') && (
                                    <li className="pc-item">
                                    <Link href={`${baseUrl}/call-logs`} className="pc-link">
                                            <span className="pc-micon">
                                                <i className="ph-duotone ph-gauge"></i>
                                            </span>
                                            <span className="pc-mtext" data-i18n="Dashboard">Call Logs</span>
                                        </Link>
                                    </li>
                                    )}
                                </ul>                        
                            </div>
                            {/* tab pane end */}


                            {/* tab pane start */}
                            <div className="tab-pane" id="pc-tab-3" role="tabpanel" aria-labelledby="pc-tab-link-3" tabIndex={3} >
                                <div className="pc-submenu-title">Call Recordings</div>
                                <ul className="pc-navbar">
                                    <li className="pc-item">
                                        <Link href={`${baseUrl}/call-recordings/dashboard`} className="pc-link">
                                            <span className="pc-micon">
                                                <i className="ph-duotone ph-gauge"></i>
                                            </span>
                                            <span className="pc-mtext" data-i18n="Dashboard">Dashboard</span>
                                        </Link>
                                    </li>
                                    <li className="pc-item">
                                    <Link href={`${baseUrl}/call-recordings`} className="pc-link">
                                            <span className="pc-micon">
                                                <i className="ph-duotone ph-gauge"></i>
                                            </span>
                                            <span className="pc-mtext" data-i18n="Dashboard">Call Recording</span>
                                        </Link>
                                    </li>
                                </ul>                        
                            </div>
                            {/* tab pane end */}

                            {/* tab pane start */}
                            <div className="tab-pane" id="pc-tab-4" role="tabpanel" aria-labelledby="pc-tab-link-4" tabIndex={4} >
                                <div className="pc-submenu-title">Ai ML</div>
                                <ul className="pc-navbar">

                                    {permissions.includes('transcriptions-analysis-aiml') && (
                                    <li className="pc-item">
                                    <Link href={`${baseUrl}/ai-ml/analysis`} className="pc-link">
                                            <span className="pc-micon">
                                                <i className="ti ti-file-analytics"></i>
                                            </span>
                                            <span className="pc-mtext" data-i18n="Dashboard">Analysis</span>
                                        </Link>
                                    </li>
                                    )}
                                    
                                    

                                    {permissions.includes('transcriptions-aiml') && (
                                    <li className="pc-item">
                                    <Link href={`${baseUrl}/ai-ml/transcriptions`} className="pc-link">
                                            <span className="pc-micon">
                                                <i className="ti ti-file-analytics"></i>
                                            </span>
                                            <span className="pc-mtext" data-i18n="Dashboard">Transcription</span>
                                        </Link>
                                    </li>
                                    )}
                                    
                                    {permissions.includes('translate-aiml') && (
                                    <li className="pc-item">
                                    <Link href={`${baseUrl}/ai-ml/translate`} className="pc-link">
                                            <span className="pc-micon">
                                                <i className="ph-duotone ph-translate"></i>
                                            </span>
                                            <span className="pc-mtext" data-i18n="Dashboard">Translate</span>
                                        </Link>
                                    </li>
                                    )}
                                    
                                </ul>                        
                            </div>
                            {/* tab pane end */}

                            {/* tab pane start */}
                            <div className="tab-pane" id="pc-tab-5" role="tabpanel" aria-labelledby="pc-tab-link-5" tabIndex={5}>
                                <div className="pc-submenu-title">Reports</div>
                                <ul className="pc-navbar">
                                    
                                    {/* <li className="pc-item">
                                        <Link className="pc-link" href={`${baseUrl}/call-logs/reports/stats/general`}>
                                        <span className="pc-micon"><i className="ph-duotone ph-phone-call"></i></span>
                                        <span className="pc-mtext">General Call Statistics</span></Link>
                                    </li> */}
                                    
                                    <li className="pc-item">
                                        <Link className="pc-link" href={`${baseUrl}/call-reports/stats/country`}>
                                        <span className="pc-micon"><i className="ph-duotone ph-phone-call"></i></span>
                                        <span className="pc-mtext">Call Stats by Country</span>
                                        </Link>
                                    </li>
                                    
                                    <li className="pc-item">
                                        <Link className="pc-link" href={`${baseUrl}/call-reports/stats/department`}>
                                        <span className="pc-micon"><i className="ph-duotone ph-phone-call"></i></span>
                                        <span className="pc-mtext">Call Stats by Department</span>
                                        </Link>
                                    </li>
                                        
                                        <li className="pc-item">
                                            <Link className="pc-link" href={`${baseUrl}/call-reports/stats/extension`}>
                                            <span className="pc-micon"><i className="ph-duotone ph-phone-call"></i></span>
                                            <span className="pc-mtext">Call Stats by Extension</span>
                                            </Link>
                                            </li>
                                        
                                        <li className="pc-item">
                                            <Link className="pc-link" href={`${baseUrl}/call-reports/incoming/country`}>
                                        <span className="pc-micon"><i className="ph-duotone ph-phone-call"></i></span>
                                        <span className="pc-mtext">Incoming Stats by Country</span>
                                        </Link>
                                        </li>
                                        
                                        <li className="pc-item   ">
                                            <Link className="pc-link" href={`${baseUrl}/call-reports/incoming/department`}>
                                            <span className="pc-micon"><i className="ph-duotone ph-phone-call"></i></span>
                                            <span className="pc-mtext">Incoming Stats by Department</span></Link>
                                        </li>
                                        
                                        <li className="pc-item">
                                            <Link className="pc-link" href={`${baseUrl}/call-reports/incoming/extension`}>
                                        <span className="pc-micon"><i className="ph-duotone ph-phone-call"></i></span>
                                        <span className="pc-mtext">Incoming Stats by Extension</span>
                                        </Link>
                                        </li>
                                        
                                        <li className="pc-item">
                                            <Link className="pc-link" href={`${baseUrl}/call-reports/trend/country`}>
                                            <span className="pc-micon"><i className="ph-duotone ph-phone-call"></i></span>
                                            <span className="pc-mtext">Call Trend by Country</span></Link>
                                        </li>
                                        
                                        <li className="pc-item">
                                            <Link className="pc-link" href={`${baseUrl}/call-reports/trend/department`}>
                                        <span className="pc-micon"><i className="ph-duotone ph-phone-call"></i></span>
                                        <span className="pc-mtext">Call Trend by Department</span></Link>
                                        </li>
                                        
                                        <li className="pc-item">
                                            <Link className="pc-link" href={`${baseUrl}/call-reports/trend/extension`}>
                                            <span className="pc-micon"><i className="ph-duotone ph-phone-call"></i></span>
                                            <span className="pc-mtext">Call Trend by Extension</span>
                                            </Link>
                                        </li>
                                </ul>                        
                            </div>
                            {/* tab pane end */}

                            {/* tab pane start */}
                            <div className="tab-pane" id="pc-tab-6" role="tabpanel" aria-labelledby="pc-tab-link-6" tabIndex={6}>
                                <div className="pc-submenu-title">TMS</div>
                                <ul className="pc-navbar">
                                    
                                    
                                    <li className="pc-item">
                                        <Link className="pc-link" href={`${baseUrl}/tms`}>
                                            <span className="pc-micon"><i className="ph-duotone ph-link"></i></span>
                                            <span className="pc-mtext">Dashboard</span>
                                        </Link>
                                    </li>


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
                                                
                                                
                                                <Link className="pc-link" href={`${baseUrl}/tms/cisco-pbx/users`}>
                                                    <span className="pc-mtext">Users</span>
                                                </Link>

                                                <Link className="pc-link" href={`${baseUrl}/tms/cisco-pbx/users-directory`}>
                                                    <span className="pc-mtext">Users Directory</span>
                                                </Link>

                                                <Link className="pc-link" href={`${baseUrl}/tms/cisco-pbx/app-users`}>
                                                    <span className="pc-mtext">App Users</span>
                                                </Link>

                                                <Link className="pc-link" href={`${baseUrl}/tms/cisco-pbx/custom-users`}>
                                                    <span className="pc-mtext">Custom Users</span>
                                                </Link>

                                                <Link className="pc-link" href={`${baseUrl}/tms/cisco-pbx/facilities-info`}>
                                                    <span className="pc-mtext">Facilities Info</span>
                                                </Link>

                                                <Link className="pc-link" href={`${baseUrl}/tms/cisco-pbx/recording-profile`}>
                                                    <span className="pc-mtext">Recording Profile</span>
                                                </Link>

                                                <Link className="pc-link" href={`${baseUrl}/tms/cisco-pbx/remote-destination`}>
                                                    <span className="pc-mtext">Remote Destination</span>
                                                </Link>

                                                <Link className="pc-link" href={`${baseUrl}/tms/cisco-pbx/remote-destination/profile`}>
                                                    <span className="pc-mtext">Remote Destination Profile</span>
                                                </Link>

                                                <Link className="pc-link" href={`${baseUrl}/tms/cisco-pbx/line`}>
                                                    <span className="pc-mtext">Line</span>
                                                </Link>

                                                <Link className="pc-link" href={`${baseUrl}/tms/cisco-pbx/phone`}>
                                                    <span className="pc-mtext">Phone</span>
                                                </Link>

                                                <Link className="pc-link" href={`${baseUrl}/tms/cisco-pbx/sip-trunks`}>
                                                    <span className="pc-mtext">SIP Trunks</span>
                                                </Link>

                                                <Link className="pc-link" href={`${baseUrl}/tms/cisco-pbx/translation-patterns`}>
                                                    <span className="pc-mtext">Translation Patterns</span>
                                                </Link>

                                                <Link className="pc-link" href={`${baseUrl}/tms/cisco-pbx/device-pool`}>
                                                    <span className="pc-mtext">Device Pool</span>
                                                </Link>

                                                <Link className="pc-link" href={`${baseUrl}/tms/cisco-pbx/locations`}>
                                                    <span className="pc-mtext">Locations</span>
                                                </Link>

                                                <Link className="pc-link" href={`${baseUrl}/tms/cisco-pbx/route-partitions`}>
                                                    <span className="pc-mtext">Route Partitions</span>
                                                </Link>

                                                <Link className="pc-link" href={`${baseUrl}/tms/cisco-pbx/css`}>
                                                    <span className="pc-mtext">CSS</span>
                                                </Link>

                                                <Link className="pc-link" href={`${baseUrl}/tms/cisco-pbx/regions`}>
                                                    <span className="pc-mtext">Regions</span>
                                                </Link>

                                                <Link className="pc-link" href={`${baseUrl}/tms/cisco-pbx/route-pattern`}>
                                                    <span className="pc-mtext">Route Pattern</span>
                                                </Link>


                                            </li>
                                        </ul>
                                    </li>

                                    <li className="pc-item">
                                        <Link className="pc-link" href={`${baseUrl}/tms/unified-ops`}>
                                            <span className="pc-micon"><i className="ph-duotone ph-link"></i></span>
                                            <span className="pc-mtext">Unified Ops</span>
                                        </Link>
                                    </li>

                                    <li className="pc-item">
                                        <Link className="pc-link" href={`${baseUrl}/tms/audit-logs`}>
                                            <span className="pc-micon"><i className="ph-duotone ph-list"></i></span>
                                            <span className="pc-mtext">Audit Log</span>
                                        </Link>
                                    </li>

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
                                                
                                                
                                                <Link className="pc-link" href={`${baseUrl}/tms/management/users`}>
                                                    <span className="pc-mtext">Users</span>
                                                </Link>

                                                <Link className="pc-link" href={`${baseUrl}/tms/management/rank-permissions`}>
                                                    <span className="pc-mtext">Rank Permissions</span>
                                                </Link>


                                            </li>
                                        </ul>
                                    </li>


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
                                                
                                                <Link className="pc-link" href={`${baseUrl}/tms/profiling/customers`}>
                                                    <span className="pc-mtext">Customers</span>
                                                </Link>

                                                <Link className="pc-link" href={`${baseUrl}/tms/profiling/customers/create`}>
                                                    <span className="pc-mtext">Create Profile</span>
                                                </Link>

                                                <Link className="pc-link" href={`${baseUrl}/tms/profiling/user`}>
                                                    <span className="pc-mtext">User Profiles</span>
                                                </Link>

                                                <Link className="pc-link" href={`${baseUrl}/tms/profiling/user/create`}>
                                                    <span className="pc-mtext">Create User Profile</span>
                                                </Link>

                                                <Link className="pc-link" href={`${baseUrl}/tms/profiling/logs`}>
                                                    <span className="pc-mtext">Error Logs</span>
                                                </Link>



                                            </li>
                                        </ul>
                                    </li>

                                    



                                </ul>
                            </div>
                            {/* tab pane end */}

                            {/* tab pane start */}
                            <div className="tab-pane" id="pc-tab-7" role="tabpanel" aria-labelledby="pc-tab-link-7" tabIndex={7}>
                                <div className="pc-submenu-title">CRM</div>
                                <ul className="pc-navbar">
                                    <li className="pc-item">
                                        <Link className="pc-link" href={`${baseUrl}/crm/dashboard`}>
                                            <span className="pc-micon"><i className="ph-duotone ph-gauge"></i></span>
                                            <span className="pc-mtext">Dashboard</span>
                                        </Link>
                                    </li>
                                    <li className="pc-item">
                                        <Link className="pc-link" href={`${baseUrl}/crm/leads`}>
                                            <span className="pc-micon"><i className="ph-duotone ph-users"></i></span>
                                            <span className="pc-mtext">Leads</span>
                                        </Link>
                                    </li>
                                    <li className="pc-item">
                                        <Link className="pc-link" href={`${baseUrl}/crm/opportunities`}>
                                            <span className="pc-micon"><i className="ph-duotone ph-target"></i></span>
                                            <span className="pc-mtext">Opportunities</span>
                                        </Link>
                                    </li>
                                    <li className="pc-item">
                                        <Link className="pc-link" href={`${baseUrl}/crm/stages`}>
                                            <span className="pc-micon"><i className="ph-duotone ph-trending-up"></i></span>
                                            <span className="pc-mtext">Stages</span>
                                        </Link>
                                    </li>
                                    <li className="pc-item">
                                        <Link className="pc-link" href={`${baseUrl}/crm/lost-reasons`}>
                                            <span className="pc-micon"><i className="ph-duotone ph-x-circle"></i></span>
                                            <span className="pc-mtext">Lost Reasons</span>
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                            {/* tab pane end */}

                            {/* tab pane start */}
                            <div className="tab-pane" id="pc-tab-8" role="tabpanel" aria-labelledby="pc-tab-link-8" tabIndex={8}>
                                <div className="pc-submenu-title">Sales</div>
                                <ul className="pc-navbar">
                                    <li className="pc-item">
                                        <Link className="pc-link" href={`${baseUrl}/sales`}>
                                            <span className="pc-micon"><i className="ph-duotone ph-gauge"></i></span>
                                            <span className="pc-mtext">Dashboard</span>
                                        </Link>
                                    </li>
                                    <li className="pc-item">
                                        <Link className="pc-link" href={`${baseUrl}/sales/orders`}>
                                            <span className="pc-micon"><i className="ph-duotone ph-shopping-cart"></i></span>
                                            <span className="pc-mtext">Orders</span>
                                        </Link>
                                    </li>
                                    <li className="pc-item">
                                        <Link className="pc-link" href={`${baseUrl}/sales/products`}>
                                            <span className="pc-micon"><i className="ph-duotone ph-package"></i></span>
                                            <span className="pc-mtext">Products</span>
                                        </Link>
                                    </li>
                                    <li className="pc-item">
                                        <Link className="pc-link" href={`${baseUrl}/sales/stages`}>
                                            <span className="pc-micon"><i className="ph-duotone ph-trending-up"></i></span>
                                            <span className="pc-mtext">Order Stages</span>
                                        </Link>
                                    </li>
                                    <li className="pc-item">
                                        <Link className="pc-link" href={`${baseUrl}/sales/lost-reasons`}>
                                            <span className="pc-micon"><i className="ph-duotone ph-x-circle"></i></span>
                                            <span className="pc-mtext">Lost Reasons</span>
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                            {/* tab pane end */}

                            

                            {/* tab pane start */}
                            <div className="tab-pane" id="pc-tab-9" role="tabpanel" aria-labelledby="pc-tab-link-9" tabIndex={9}>
                                <div className="pc-submenu-title">CTI</div>
                                <ul className="pc-navbar">
                                  
                                   {permissions.includes('view-cti') && (
                                    <li className="pc-item">
                                        <Link className="pc-link" href={`${baseUrl}/cti`}>
                                            <span className="pc-micon"><i className="ph-duotone ph-link"></i></span>
                                            <span className="pc-mtext">CTI</span>
                                        </Link>
                                    </li>
                                    )}
                                    
                                    {permissions.includes('dial-call-cti') && (
                                    <li className="pc-item">
                                        <Link className="pc-link" href={`${baseUrl}/cti/dialer`}>
                                            <span className="pc-micon"><i className="ph-duotone ph-link"></i></span>
                                            <span className="pc-mtext">Dialer</span>
                                        </Link>
                                    </li>
                                    )}

                                </ul>
                            </div>
                            {/* tab pane end */}

                            {/* tab pane start */}
                            <div className="tab-pane" id="pc-tab-10" role="tabpanel" aria-labelledby="pc-tab-link-10" tabIndex={10}>
                                <div className="pc-submenu-title">DNCR</div>
                                <ul className="pc-navbar">
                                    <li className="pc-item">
                                        {permissions.includes('check-numbers-dncr') && (
                                            <Link className="pc-link" href={`${baseUrl}/dncr/check-number`}>
                                                <span className="pc-micon"><i className="ph-duotone ph-phone-call"></i></span>
                                                <span className="pc-mtext">Check Number</span>
                                            </Link>
                                        )}
                                    </li>
                                </ul>
                            </div>
                            {/* tab pane end */}

                            {/* tab pane start */}
                            <div className="tab-pane" id="pc-tab-11" role="tabpanel" aria-labelledby="pc-tab-link-11" tabIndex={11}>
                                <div className="pc-submenu-title">Web RTC</div>
                                <ul className="pc-navbar">
                                    <li className="pc-item">
                                        <Link className="pc-link" href={`${baseUrl}/coming-soon`}>
                                            <span className="pc-micon"><i className="ph-duotone ph-link"></i></span>
                                            <span className="pc-mtext">Web RTC</span>
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                            {/* tab pane end */}

                            {/* tab pane start */}
                            <div className="tab-pane" id="pc-tab-12" role="tabpanel" aria-labelledby="pc-tab-link-12" tabIndex={12}>
                                <div className="pc-submenu-title">Omni Channel</div>
                                <ul className="pc-navbar">
                                    <li className="pc-item">
                                        <Link className="pc-link" href={`${baseUrl}/coming-soon`}>
                                            <span className="pc-micon"><i className="ph-duotone ph-link"></i></span>
                                            <span className="pc-mtext">Omni Channel</span>
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                            {/* tab pane end */}

                            {/* tab pane start */}
                            <div className="tab-pane" id="pc-tab-13" role="tabpanel" aria-labelledby="pc-tab-link-13" tabIndex={13}>
                                <div className="pc-submenu-title">HR Services</div>
                                <ul className="pc-navbar">
                                    <li className="pc-item">
                                        <Link className="pc-link" href={`${baseUrl}/coming-soon`} >
                                            <span className="pc-micon"><i className="ph-duotone ph-link"></i></span>
                                            <span className="pc-mtext">HR</span>
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                            {/* tab pane end */}

                            {/* tab pane start */}
                            <div className="tab-pane" id="pc-tab-14" role="tabpanel" aria-labelledby="pc-tab-link-14" tabIndex={14}>
                                <div className="pc-submenu-title">Tickets</div>
                                <ul className="pc-navbar">
                                    
                                    {permissions.includes('dashboard-tickets') && (
                                    <li className="pc-item">
                                        <Link className="pc-link" href={`${baseUrl}/tickets/dashboard`} >
                                            <span className="pc-micon"><i className="ph-duotone ph-link"></i></span>
                                            <span className="pc-mtext">Dashboard</span>
                                        </Link>
                                    </li>
                                    )}
                                    
                                    {permissions.includes('tickets-tickets') && (
                                    <li className="pc-item">
                                        <Link className="pc-link" href={`${baseUrl}/tickets/list`} >
                                            <span className="pc-micon"><i className="ph-duotone ph-link"></i></span>
                                            <span className="pc-mtext">Tickets</span>
                                        </Link>
                                    </li>
                                    )}

                                    {permissions.includes('ticket-statuses-tickets') && (
                                    <li className="pc-item">
                                        <Link className="pc-link" href={`${baseUrl}/tickets/statuses`} >
                                            <span className="pc-micon"><i className="ph-duotone ph-link"></i></span>
                                            <span className="pc-mtext">Status</span>
                                        </Link>
                                    </li>
                                    )}

                                    {permissions.includes('ticket-modules-tickets') && (
                                    <li className="pc-item">
                                        <Link className="pc-link" href={`${baseUrl}/tickets/modules`} >
                                            <span className="pc-micon"><i className="ph-duotone ph-link"></i></span>
                                            <span className="pc-mtext">Modules</span>
                                        </Link>
                                    </li>
                                    )}
                                    {permissions.includes('view-ticket-types-tickets') && (
                                    <li className="pc-item">
                                        <Link className="pc-link" href={`${baseUrl}/tickets/types`} >
                                            <span className="pc-micon"><i className="ph-duotone ph-link"></i></span>
                                            <span className="pc-mtext">Types</span>
                                        </Link>
                                    </li>
                                )}
                                </ul>
                            </div>
                            {/* tab pane end */}

                            {/* tab pane start */}
                            <div className="tab-pane" id="pc-tab-15" role="tabpanel" aria-labelledby="pc-tab-link-15" tabIndex={15}>
                                <div className="pc-submenu-title">Accounts</div>
                                <ul className="pc-navbar">
                                    <li className="pc-item">
                                        <Link className="pc-link" href={`${baseUrl}/coming-soon`} >
                                            <span className="pc-micon"><i className="ph-duotone ph-link"></i></span>
                                            <span className="pc-mtext">Accounts</span>
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                            {/* tab pane end */}

                            {/* tab pane start */}
                            <div className="tab-pane" id="pc-tab-16" role="tabpanel" aria-labelledby="pc-tab-link-16" tabIndex={16}>
                                <div className="pc-submenu-title">Health Care</div>
                                <ul className="pc-navbar">
                                    <li className="pc-item">
                                        <Link className="pc-link" href={`${baseUrl}/coming-soon`} >
                                            <span className="pc-micon"><i className="ph-duotone ph-link"></i></span>
                                            <span className="pc-mtext">Health Care</span>
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                            {/* tab pane end */}

                        </div>
                    </div>


                    <div className="card pc-user-card">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="flex-shrink-0">
                                <span className="user-avtar bg rounded-circle text-white sidebar-user-icon">{loggedInUserName.split(' ')[0][0]}</span>
                                </div>
                                <div className="flex-grow-1 ms-2">
                                    <div className="dropdown">
                                    <div className="d-flex align-items-center">
                                                <div className="flex-grow-1 me-2">
                                                    <h6 className="mb-0 username-ellipsis">{loggedInUserName}</h6>
                                                    <small>{loggedInUserRole}</small>
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