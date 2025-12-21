import { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Footer from '@components/Footer';
import ApplicationSidebar from './Moduler/AppSidebar';

import ApplicationCustomerSidebar from './Moduler/AppCustomerSidebar';
import ModernSidebar from '@components/custom-sidebar';

import { useSession, signOut } from "next-auth/react";
import { useNotifications } from '../contexts/NotificationContext';
import { HEADER_CONSTANTS} from "@constants/headerConstants";
import ProfileSidebar from '@components/profile-sidebar';

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

{session?.user?.permissions?.includes(PERMISSIONS.DIAL_CALL_CTI) && (
<Button variant="link" size="sm" className="text-dark position-relative" onClick={() => router.push('/cti/dialer')}>
              <PhoneCall size={20} />
             </Button>
             )}


<Button variant="link" size="sm" className="text-dark position-relative">
              <Bell size={20} />
              {/* <Badge bg="danger" pill className="position-absolute translate-middle" style={{top:'10px', left:'37px'}}>3</Badge> */}
            </Button>


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
                  {loggedInUserRole !== '' ? (
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
