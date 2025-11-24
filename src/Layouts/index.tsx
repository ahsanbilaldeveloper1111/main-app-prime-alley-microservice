import { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Footer from '@components/Footer';
import ApplicationSidebar from './Moduler/AppSidebar';
import { useSession, signOut } from "next-auth/react";

import CompanyLogo2 from "@assets/images/Prime3.png";
import { 
	Bell, ChevronLeft, ChevronRight, Users, LogOut,
	User
    } from 'lucide-react';
import { Badge, Button, Dropdown } from 'react-bootstrap';
import Link from 'next/link';

interface LayoutProps {
	children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {

	const router = useRouter();
	const { data: session, status } = useSession();

	const [hasTmsSession, setHasTmsSession] = useState<boolean | null>(null);
	const [sidebarOpen, setSidebarOpen] = useState(true);

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


	// Check for TMS session changes using cookies
	useEffect(() => {
		if (typeof window === 'undefined') return;
		
		const checkTmsSession = () => {
			// Get tmsSessionId from cookies instead of sessionStorage
			const cookies = document.cookie.split(';');
			const tmsSessionIdCookie = cookies.find(cookie =>
				cookie.trim().startsWith('tmsSessionId=')
			);
			const sessionId = tmsSessionIdCookie ? tmsSessionIdCookie.split('=')[1] : null;
			setHasTmsSession(!!sessionId);
		};
		
		// Check initially
		checkTmsSession();
		
		// Check periodically to catch session changes
		const interval = setInterval(checkTmsSession, 2000);
		
		return () => {
			clearInterval(interval);
		};
	}, []);

	//	TMS route guard: block /tms routes unless TMS session ID is valid (except /tms/verification)
	useEffect(() => {
		if (typeof window === 'undefined' || hasTmsSession === null) return;
		const path = router.pathname;
		const isTmsRoute = path.startsWith('/tms') && path !== '/tms/verification';
		if (isTmsRoute) {
			
			
			if (!hasTmsSession) {
				if (router.asPath !== '/tms/verification') {
					
					router.replace('/tms/verification');
				}
			} 
		}
	}, [router.pathname, hasTmsSession]);

	// Prevent rendering protected TMS content while redirecting
	const isTmsRoute = router.pathname.startsWith('/tms') && router.pathname !== '/tms/verification';
	if (isTmsRoute && typeof window !== 'undefined' && hasTmsSession === false) {
		return null;
	}

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
            {/* <Button variant="link" className="text-dark position-relative">
              <Bell size={20} />
              <Badge bg="danger" pill className="position-absolute translate-middle" style={{top:'10px', left:'37px'}}>3</Badge>
            </Button> */}
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


			<ApplicationSidebar
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
		
				
		<Footer />
		</div>
				
		</>
	);
};

export default Layout;
