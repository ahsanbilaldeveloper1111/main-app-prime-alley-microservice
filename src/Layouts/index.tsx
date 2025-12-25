import { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Footer from '@components/Footer';
import ApplicationSidebar from './Moduler/AppSidebar';

import ApplicationCustomerSidebar from './Moduler/AppCustomerSidebar';

import { useSession } from "next-auth/react";
import { useNotifications, NotificationItem } from '../contexts/NotificationContext';
import { HEADER_CONSTANTS} from "@constants/headerConstants";
import ProfileSidebar from '@components/profile-sidebar';
import { useDialerModal } from '../contexts/DialerModalContext';

import CompanyLogo2 from "@assets/images/Prime3.png";
import { 
	Bell, ChevronLeft, ChevronRight, Users,
  Link,
  PhoneCall
    } from 'lucide-react';
import { Badge, Button, Dropdown } from 'react-bootstrap';
import { useCti } from '@hooks/useCti';

interface LayoutProps {
	children: ReactNode;
}

const { MENU_LABELS, ICONS, PERMISSIONS, MENU_COLORS,BASE_URL } = HEADER_CONSTANTS;

const Layout = ({ children }: LayoutProps) => {

	const router = useRouter();
	const { data: session, status } = useSession();
	const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
	const { openDialer } = useDialerModal();
  const { isInitialized } = useCti()
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

	// Format time ago helper
	const formatTimeAgo = (date: Date) => {
		try {
			const now = new Date();
			const diffMs = now.getTime() - date.getTime();
			const diffMins = Math.floor(diffMs / 60000);
			const diffHours = Math.floor(diffMs / 3600000);
			const diffDays = Math.floor(diffMs / 86400000);

			if (diffMins < 1) return 'Just now';
			if (diffMins < 60) return `${diffMins} min ago`;
			if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
			if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
			return date.toLocaleDateString();
		} catch {
			return 'Just now';
		}
	};

	// Create dummy notifications for testing
	const getDummyNotifications = (): NotificationItem[] => {
		const now = new Date();
		const twoMinutesAgo = new Date(now.getTime() - 2 * 60000);
		const oneHourAgo = new Date(now.getTime() - 60 * 60000);
		const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60000);
		const yesterday = new Date(now.getTime() - 24 * 60 * 60000);
		const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60000);

		return [
			{
				id: 'dummy-1',
				title: 'Keefe Bond added new tags to 💪 Design system',
				body: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
				description: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
				module: 'web design',
				timestamp: twoMinutesAgo,
				read: false,
				icon: undefined,
			},
			{
				id: 'dummy-2',
				title: 'Message',
				body: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
				description: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
				timestamp: oneHourAgo,
				read: false,
			},
			{
				id: 'dummy-3',
				title: 'Challenge invitation',
				body: '<strong>Jonny aber</strong> invites to join the challenge',
				description: '<strong>Jonny aber</strong> invites to join the challenge',
				timestamp: twelveHoursAgo,
				read: false,
			},
			{
				id: 'dummy-4',
				title: 'Forms',
				body: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
				description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
				timestamp: yesterday,
				read: true,
			},
			{
				id: 'dummy-5',
				title: 'Keefe Bond added new tags to 💪 Design system',
				body: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
				description: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
				module: 'Dashboard',
				timestamp: yesterday,
				read: true,
			},
			{
				id: 'dummy-6',
				title: 'Security',
				body: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
				description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
				timestamp: twoDaysAgo,
				read: true,
			},
		];
	};

	// Group notifications by date
	const groupNotificationsByDate = () => {
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		// Merge real notifications with dummy notifications
		const allNotifications = [...notifications, ...getDummyNotifications()];

		const groups: { [key: string]: NotificationItem[] } = {
			today: [],
			yesterday: [],
			older: []
		};

		allNotifications.forEach(notification => {
			const notifDate = new Date(notification.timestamp);
			if (notifDate >= today) {
				groups.today.push(notification);
			} else if (notifDate >= yesterday) {
				groups.yesterday.push(notification);
			} else {
				groups.older.push(notification);
			}
		});

		return groups;
	};

	// Calculate total unread count including dummy notifications
	const totalUnreadCount = unreadCount + getDummyNotifications().filter(n => !n.read).length;

	const [loggedInName, setLoggedInName] = useState('');
	const [loggedInUserRole, setLoggedInUserRole] = useState('');
	const [loggedInUserUsername, setLoggedInUserUsername] = useState('');

  const [showProfileSidebar, setShowProfileSidebar] = useState(false);

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

            {/* Call Button - Opens Dialer Modal */}
            {session?.user?.permissions?.includes(PERMISSIONS.DIAL_CALL_CTI) && (
              <Button 
                variant="link" 
                size="sm" 
                className="text-dark position-relative" 
                disabled={!isInitialized}
                onClick={openDialer}
                title="Open Dialer"
              >
                <PhoneCall size={20} />
              </Button>
            )}

            <Dropdown 
              show={showNotificationDropdown} 
              onToggle={(isOpen) => setShowNotificationDropdown(isOpen)}
              align="end"
            >
              <Dropdown.Toggle 
                as={Button} 
                variant="link" 
                size="sm" 
                className="text-dark position-relative pc-head-link dropdown-toggle arrow-none me-0"
                style={{ border: 'none', padding: '0.5rem' }}
              >
                <Bell size={20} />
                {totalUnreadCount > 0 && (
                  <Badge 
                    bg="success" 
                    pill 
                    className="position-absolute pc-h-badge" 
                    style={{ 
                      top: '0', 
                      right: '0', 
                      fontSize: '0.65rem',
                     // transform: 'translate(25%, -25%)',
                      minWidth: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 4px'
                    }}
                  >
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </Badge>
                )}
              </Dropdown.Toggle>

              <Dropdown.Menu className="dropdown-notification pc-h-dropdown" style={{ width: '350px', maxWidth: '90vw', overflowX: 'hidden' }}>
                <div className="dropdown-header d-flex align-items-center justify-content-between p-3 border-bottom">
                  <h5 className="m-0">Notifications</h5>
                  <ul className="list-inline ms-auto mb-0">
                    <li className="list-inline-item">
                      <Button 
                        variant="link" 
                        className="avtar avtar-s btn-link-hover-primary p-0"
                        style={{ minWidth: 'auto', padding: '0.25rem' }}
                      >
                        <Link size={18} />
                      </Button>
                    </li>
                  </ul>
                </div>

                <div 
                  className="dropdown-body text-wrap header-notification-scroll position-relative p-0" 
                  style={{ maxHeight: 'calc(100vh - 235px)', overflowY: 'auto', overflowX: 'hidden' }}
                >
                  {(() => {
                        const grouped = groupNotificationsByDate();
                        const allNotifications = [
                          ...grouped.today,
                          ...grouped.yesterday,
                          ...grouped.older
                        ].slice(0, 10); // Show max 10 notifications

                        if (allNotifications.length === 0) {
                          return (
                            <div className="p-4 text-center text-muted">
                              <p className="mb-0">No notifications</p>
                            </div>
                          );
                        }

                        return (
                          <ul className="list-group list-group-flush" style={{ overflowX: 'hidden' }}>
                            {allNotifications.map((notification, index) => {
                          const showDateLabel = index === 0 || 
                            (index > 0 && grouped.today.includes(notification) && !grouped.today.includes(allNotifications[index - 1])) ||
                            (index > 0 && grouped.yesterday.includes(notification) && !grouped.yesterday.includes(allNotifications[index - 1]));

                          const dateLabel = grouped.today.includes(notification) ? 'Today' :
                                           grouped.yesterday.includes(notification) ? 'Yesterday' : null;

                          return (
                            <li 
                              key={notification.id} 
                              className={`list-group-item ${notification.read ? '' : 'bg-light'}`}
                              style={{ overflowX: 'hidden', wordWrap: 'break-word' }}
                            >
                              <div
                                role="button"
                                tabIndex={0}
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                  if (notification.read === false && !notification.id.startsWith('dummy-')) {
                                    markAsRead(notification.id);
                                  }
                                  if (notification.url) {
                                    router.push(notification.url);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    if (notification.read === false && !notification.id.startsWith('dummy-')) {
                                      markAsRead(notification.id);
                                    }
                                    if (notification.url) {
                                      router.push(notification.url);
                                    }
                                  }
                                }}
                              >
                                {showDateLabel && dateLabel && (
                                  <p className="text-span text-muted mb-2 fw-semibold" style={{ fontSize: '0.75rem' }}>
                                    {dateLabel}
                                  </p>
                                )}
                                <div className="d-flex">
                                <div className="flex-shrink-0">
                                  {notification.icon ? (
                                    <img 
                                      src={notification.icon} 
                                      alt="notification" 
                                      className="user-avtar avtar avtar-s rounded-circle"
                                      style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                    />
                                  ) : (
                                    <div className={`avtar avtar-s bg-light-${notification.module ? 'primary' : 'info'}`}>
                                      <Bell size={18} />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-grow-1 ms-3" style={{ minWidth: 0, overflow: 'hidden' }}>
                                  <div className="d-flex">
                                    <div className="flex-grow-1 me-3 position-relative" style={{ minWidth: 0 }}>
                                      <h6 className="mb-0 text-truncate" style={{ fontSize: '0.875rem' }}>
                                        {notification.title}
                                      </h6>
                                    </div>
                                    <div className="flex-shrink-0">
                                      <span className="text-sm text-muted" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                        {formatTimeAgo(notification.timestamp)}
                                      </span>
                                    </div>
                                  </div>
                                  <p className="position-relative mt-1 mb-2" style={{ fontSize: '0.8125rem', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                    <span className="d-block" style={{ wordBreak: 'break-word' }}>
                                      {notification.description || notification.body}
                                    </span>
                                  </p>
                                  {notification.module && (
                                    <span className="badge bg-light-primary border border-primary me-1 mt-1" style={{ fontSize: '0.7rem' }}>
                                      {notification.module}
                                    </span>
                                  )}
                                </div>
                                </div>
                              </div>
                            </li>
                            );
                          })}
                          </ul>
                        );
                      })()}
                </div>

                <div className="dropdown-footer p-3 border-top">
                  <div className="row g-3">
                    <div className="col-6">
                      <div className="d-grid">
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={() => {
                            // Archive all functionality can be added here
                            markAllAsRead();
                          }}
                        >
                          Archive all
                        </Button>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="d-grid">
                        <Button 
                          variant="outline-secondary" 
                          size="sm"
                          onClick={markAllAsRead}
                        >
                          Mark all as read
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Dropdown.Menu>
            </Dropdown>


            <div 
              className="d-flex align-items-center gap-2" 
              onClick={() => setShowProfileSidebar(!showProfileSidebar)}
              style={{ cursor: 'pointer' }}
            >
              <div className="bg-primary bg-opacity-10 rounded-circle p-2">
                <Users size={20} className="text-primary" />
              </div>
              <div className="d-none d-md-block">
                <small className="d-block fw-semibold">{loggedInName}</small>
                <small className="text-muted">
                  {loggedInUserRole ? (
                      <span>{loggedInUserRole}</span>
                    ) : (
                      <span>{loggedInUserUsername}</span>
                    )}
                </small>
              </div>
              
            </div>




        
          </div>
        </div>
      </nav>
		
		<div className="d-flex flex-grow-1" style={{ position: 'relative', marginTop:'85px' }}>

          
            <ApplicationCustomerSidebar
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            />
         

				<div className={`flex-grow-1 p-4 main-content-wrapper ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`} style={{ 
				overflowY: 'auto',
				width: '100%'
				}}>
				<div className={"pc-content "}>
					{children}
				</div>
			</div>

			
		</div>
		
				{/* Profile Sidebar */}
        <ProfileSidebar 
        isOpen={showProfileSidebar} 
        onClose={() => setShowProfileSidebar(false)} 
      />


		<Footer />
		</div>
				
		</>
	);
};

export default Layout;
