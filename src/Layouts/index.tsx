import { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Footer from '@components/Footer';
import ApplicationSidebar from './Moduler/AppSidebar';
import ApplicationCustomerSidebar from './Moduler/AppCustomerSidebar';
import { useSession, signOut } from "next-auth/react";
import { useNotifications } from '../contexts/NotificationContext';
import { HEADER_CONSTANTS} from "@constants/headerConstants";

import CompanyLogo2 from "@assets/images/Prime3.png";
import { 
	Bell, ChevronLeft, ChevronRight, Users, LogOut,
	User, X, CheckCheck, Plus, Pencil, Trash2,
  Eye,
  Settings,
  Phone,
  Link,
  PhoneCall,
  PhoneCallIcon,
  Box
    } from 'lucide-react';
import { Badge, Button, Dropdown } from 'react-bootstrap';

interface LayoutProps {
	children: ReactNode;
}

const { MENU_LABELS, ICONS, PERMISSIONS, MENU_COLORS,BASE_URL } = HEADER_CONSTANTS;

const Layout = ({ children }: LayoutProps) => {

	const router = useRouter();
	const { data: session, status } = useSession();
	const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotifications();

	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

	const [loggedInName, setLoggedInName] = useState('');
	const [loggedInUserRole, setLoggedInUserRole] = useState('');
	const [loggedInUserUsername, setLoggedInUserUsername] = useState('');

	useEffect(() => {
		if (status !=="loading" && session) {
		  if (typeof window !== "undefined") {
		    setLoggedInName(session.user.name || '');
		    setLoggedInUserUsername(session.user.username || '');
		    setLoggedInUserRole(session.user.role || '');
		  }
		}
	    }, [ status, session]);



	return (
		<>
		<style>{`
        .main-content-wrapper {
          transition: margin-left 0.3s ease-in-out;
        }
	    .header-logo{
		width: 180px;
		height: auto;
	    }

        @media (min-width: 992px) {
          .main-content-wrapper.sidebar-open {
            margin-left: 280px !important;
          }
          
          .main-content-wrapper.sidebar-closed {
            margin-left: 0 !important;
          }
        }
        
        @media (max-width: 991px) {
          .main-content-wrapper {
            margin-left: 0 !important;
            width: 100% !important;
          }
        }
      `}</style>

<div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: '#f8f9fa' }}>

 {/* Sidebar Toggle Button - Fixed Position */}
 <Button
          variant="primary"
          className="position-fixed d-lg-none"
          style={{
            top: '80px',
            left: sidebarOpen ? '270px' : '10px',
            zIndex: 1100,
            width: '40px',
            height: '40px',
            padding: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            transition: 'left 0.3s ease-in-out'
          }}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </Button>

        {/* Top Navigation */}
        <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top shadow-sm">
        <div className="container-fluid">
          <div className="d-flex align-items-center gap-2">
            <Button 
              variant="link" 
              className="text-dark d-none d-lg-block p-2" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ marginLeft: '-10px' }}
            >
              {sidebarOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
            </Button>
            <a className="navbar-brand fw-bold text-primary mb-0" href="#">
			<img src={CompanyLogo2.src} alt="logo" className="img-fluid header-logo" /></a>
          </div>
          <div className="ms-auto d-flex align-items-center gap-3">

          {session?.user?.permissions?.includes(PERMISSIONS.DIAL_CALL_CTI) && (
            <PhoneCall size={18} className="text-primary" onClick={() => router.push('/cti/dialer')} />
          )}

          <Dropdown align="end" show={showNotificationDropdown} onToggle={(isOpen) => setShowNotificationDropdown(isOpen)}>
              <Dropdown.Toggle 
                variant="link" 
                className="text-primary position-relative p-0 border-0"
                style={{ border: 'none', boxShadow: 'none' }}
              >
                
                  <Bell size={32} className="text-primary" />
               
                {unreadCount > 0 && (
                  <Badge 
                    bg="danger" 
                    pill 
                    className="position-absolute"
                    style={{
                      top: '0px',
                      right: '0px',
                      fontSize: '8px',
                      minWidth: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 5px'
                    }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Dropdown.Toggle>
              <Dropdown.Menu style={{ width: '350px', maxHeight: '400px', overflowY: 'auto', overflowX: 'hidden' }}>
                <div className="d-flex justify-content-between align-items-center px-2 py-2 border-bottom p-0">
                  <h6 className="mb-0 fw-bold">Notifications</h6>
                  {unreadCount > 0 && (
                    <>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAllAsRead();
                      }}
                    >
                      <CheckCheck size={14} className="me-1" />
                      Clear
                    </Button>
                    
                    </>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <Bell size={32} className="mb-2 opacity-50" />
                    <p className="mb-0">No new notification</p>
                  </div>
                ) : (
                  <>
                    {notifications.map((notification: any) => {
                      // Determine action icon based on notification data
                      const getActionIcon = () => {
                        // Check multiple sources for action type
                        const action = notification.data?.action 
                          || notification.data?.type 
                          || notification.title 
                          || notification.description 
                          || '';
                        const actionUpper = action.toUpperCase();
                        
                        if (actionUpper.includes('CREATE') || actionUpper.includes('CREATED') || actionUpper.includes('ADD') || actionUpper.includes('NEW')) {
                          return <Plus size={20} className="m-0" />;
                        } else if (actionUpper.includes('UPDATE') || actionUpper.includes('UPDATED') || actionUpper.includes('EDIT') || actionUpper.includes('MODIFIED') || actionUpper.includes('CHANGE')) {
                          return <Pencil size={20} className="m-0" />;
                        } else if (actionUpper.includes('DELETE') || actionUpper.includes('DELETED') || actionUpper.includes('REMOVE') || actionUpper.includes('REMOVED')) {
                          return <Trash2 size={20} className="m-0" />;
                        }
                        // Default to Bell icon if no action matches
                        return <Bell size={20} className="m-0" />;
                      };

                      // Determine navigation URL based on target_type and action
                      const getNavigationUrl = () => {
                        const targetType = notification.data?.target_type || '';
                        const action = notification.data?.action || '';
                        const targetId = notification.data?.target_id || '';
                        
                        // Handle Ticket CREATE action
                        if (targetType === 'Ticket' && (action === 'CREATE' || action === 'UPDATE')) {
                          return '/tickets/list/' + targetId;
                        }
                        
                        // Add more target_type and action combinations here as needed
                        // Example:
                        // if (targetType === 'Ticket' && action === 'UPDATE') {
                        //   return '/tickets/list';
                        // }
                        
                        // Fallback to notification.url if available
                        return notification.url || null;
                      };

                      const navigationUrl = getNavigationUrl();
                      const hasNavigation = !!navigationUrl;

                      return (
                        <div
                        key={notification.id}
                        className={`d-block p-2 border-bottom radius-0 ${!notification.read ? '' : ''}`}
                        style={{ borderRadius: '0px', cursor: hasNavigation ? 'pointer' : 'default' }}
                        role={hasNavigation ? 'button' : undefined}
                        tabIndex={hasNavigation ? 0 : undefined}
                        onClick={() => {
                          if (navigationUrl) {
                            // Mark as read before navigation
                            if (!notification.read) {
                              markAsRead(notification.id);
                            }
                            // Close dropdown before navigation
                            setShowNotificationDropdown(false);
                            // Navigate to URL
                            router.push(navigationUrl);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (navigationUrl && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            // Mark as read before navigation
                            if (!notification.read) {
                              markAsRead(notification.id);
                            }
                            // Close dropdown before navigation
                            setShowNotificationDropdown(false);
                            // Navigate to URL
                            router.push(navigationUrl);
                          }
                        }}
                      >
                        <div className="d-flex align-items-center gap-3">
                          {/* Block 1: Icon - Based on Action */}
                          <div className="flex-shrink-0 position-relative d-flex align-items-center justify-content-center">
                            {notification.icon ? (
                              <img 
                                src={notification.icon} 
                                alt="notification" 
                                style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }}
                                onError={(e) => {
                                  // Fallback to action icon if image fails to load
                                  e.currentTarget.style.display = 'none';
                                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className="d-flex align-items-center justify-content-center"
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '8px',
                                backgroundColor: !notification.read ? '#0d6efd' : '#e9ecef',
                                color: !notification.read ? '#fff' : '#6c757d',
                                display: notification.icon ? 'none' : 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              {getActionIcon()}
                            </div>
                            {!notification.read && (
                              <span 
                                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-white" 
                                style={{
                                  fontSize: '6px',
                                  padding: '2px 4px',
                                  minWidth: '8px',
                                  height: '8px'
                                }}
                              >
                              </span>
                            )}
                          </div>

                          {/* Block 2: Title, Description, Module, Time */}
                          <div className="flex-grow-1 min-w-0" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <h6 className="mb-0 fw-semibold" style={{ fontSize: '14px', lineHeight: '1.3', overflowWrap: 'break-word', wordBreak: 'break-word', whiteSpace: 'normal' }}>
                                {notification.title}
                              </h6>
                              {!notification.read && (
                                <span 
                                  className="badge bg-primary rounded-circle" 
                                  style={{ width: '8px', height: '8px', padding: 0, flexShrink: 0 }}
                                ></span>
                              )}
                            </div>
                            {notification.description && (
                              <p className="mb-1 text-muted" style={{ fontSize: '13px', lineHeight: '1.4', marginBottom: '4px', overflowWrap: 'break-word', wordBreak: 'break-word', whiteSpace: 'normal' }}>
                                {notification.description}
                              </p>
                            )}
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              {/* {notification.module && (
                                <small className="text-muted" style={{ fontSize: '11px', fontWeight: '500' }}>
                                  {notification.module}
                                </small>
                              )} */}
                              {/* {notification.module && (
                                <span className="text-muted" style={{ fontSize: '11px' }}>•</span>
                              )} */}
                              <small className="text-muted" style={{ fontSize: '10px' }}>
                                {new Date(notification.timestamp).toLocaleString()}
                              </small>
                            </div>
                          </div>

                          {/* Block 3: Action Buttons */}
                          <div className="flex-shrink-0 d-flex align-items-center justify-content-center gap-1">
                            {!notification.read && (
                              <Button
                                variant="link"
                                size="sm"
                                className="p-0 text-primary d-flex align-items-center justify-content-center"
                                style={{ minWidth: '20px', height: '20px' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                title="Mark as read"
                              >
                                <CheckCheck size={14} />
                              </Button>
                            )}
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 text-muted d-flex align-items-center justify-content-center"
                              style={{ minWidth: '20px', height: '20px' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                clearNotification(notification.id);
                              }}
                              title="Delete"
                            >
                              <X size={16} />
                            </Button>
                          </div>
                        </div>
                        </div>
                      );
                    })}
                    
                  </>
                )}
                <Button
                      variant="link"
                      size="sm"
                      className="p-0 text-primary d-block w-100 text-center m-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push('/notifications');
                      }}
                    >
                      <Eye size={14} className="me-1" />
                      Show All Notifications
                    </Button>
              </Dropdown.Menu>
            </Dropdown>
            <Dropdown>
              <Dropdown.Toggle 
                variant="link" 
                className="text-decoration-none p-0 d-flex align-items-center gap-2"
                style={{ border: 'none', boxShadow: 'none' }}
              >
                <div className="bg-primary bg-opacity-10 rounded-circle p-2">
                  <Users size={20} className="text-primary" />
                </div>
                <div className="d-none d-md-block">
                  <small className="d-block fw-semibold">{loggedInName}</small>
                  <small className="text-muted">
                    {loggedInUserRole !== '' ? (
                      <span>{loggedInUserRole}</span>
                    ) : (
                      <span>{loggedInUserUsername}</span>
                    )}
                  </small>
                </div>
              </Dropdown.Toggle>
              <Dropdown.Menu align="end">
				
        <Dropdown.Item 
				href="/profile"
				className="d-flex align-items-center gap-2 text-secondary"
				>
					<User size={16} />
					Profile
				</Dropdown.Item>

        {session?.user?.permissions?.includes(PERMISSIONS.VIEW_CRM_TASKS) && (
          <Dropdown.Item 
            href="/crm/tasks"
            className="d-flex align-items-center gap-2 text-secondary"
          >
            <Settings size={16} />
            Task Manager
          </Dropdown.Item>
        )}

                <Dropdown.Item 
                  onClick={() => signOut({ 
                    callbackUrl: '/auth/signin',
                    redirect: true 
                  })}
                  className="d-flex align-items-center gap-2 text-secondary"
                >
                  <LogOut size={16} />
                  Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
      </nav>
		
		<div className="d-flex flex-grow-1" style={{ position: 'relative', marginTop:'85px' }}>

          {session?.user?.login_as === 'customer' ? (
            <ApplicationCustomerSidebar
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            />
          ) : (
            <ApplicationSidebar
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            />
          )}

				<div className={`flex-grow-1 p-4 main-content-wrapper ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`} style={{ 
				overflowY: 'auto',
				width: '100%'
				}}>
				<div className={"pc-content "}>
					{children}
				</div>
			</div>

			
		</div>
		
				
		<Footer />
		</div>
				
		</>
	);
};

export default Layout;
