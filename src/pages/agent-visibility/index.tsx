import React,{ReactElement, useEffect, useState} from 'react'
import Layout from '@layout/index'
import ImageStatus6 from '@assets/images/widget/img-status-6.svg'
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Button, Col, Row } from 'react-bootstrap';
import AnimatedNumber from '@components/AnimatedNumber';
import "@assets/scss/dashboard.scss";
import "@assets/scss/common.scss";
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import { HEADER_CONSTANTS } from '@constants/headerConstants';
import { useFCM } from '@hooks/useFCM';
const { BASE_URL, MENU_LABELS, SUBMENU_LABELS, ICONS, PERMISSIONS } = HEADER_CONSTANTS;

interface Summary {
    online_agents: number;
    calls_handled: number;
    active_calls: number;
}

const AgentVisibility = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [permissions, setPermissions] = useState<string[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const { permission: notificationPermission, isSupported: isNotificationSupported, requestPermission } = useFCM(false, false);

    const [summary, setSummary] = useState<Summary>({
        online_agents: 22,
        calls_handled: 550,
        active_calls: 150,
    });
    const [summaryCards, setSummaryCards] = useState<SummaryCard[]>([
        {
            id: 'online-agents',
            title: 'Online Agents',
            value: summary.online_agents,
            description: 'Online agents in the system',
            delay: 0.1,
        },
        {
            id: 'calls-handled',
            title: 'Calls Handled',
            value: summary.calls_handled,
            description: 'Calls handled in the system',
            delay: 0.2,
        },
        {
            id: 'active-calls',
            title: 'Active Calls',
            value: summary.active_calls,
            description: 'Active calls in the system',
            delay: 0.3,
        },
    ]);

    useEffect(() => {
        if (status !== "loading") {
            if (session && status === "authenticated") {
                setPermissions(session.user?.permissions || []);
                setIsAdmin(Boolean(session.user?.is_admin));
            }
        }
    }, [status, session]);

    const serviceCards = [
        
      
        {
            id: 'call-logs-services',
            title: MENU_LABELS.CALL_HISTORY,
            // subtitle: 'Call Logs',
            description: 'Monitor, record, and manage all incoming and outgoing call history and activity.',
            icon: <i className="ph-duotone ph-phone"></i>,
            gradient: 'from-purple-500 to-violet-600',
            link: '/call-logs/dashboard'
        },
        // {
        //     id: 'call-recordings-services',
        //     title: MENU_LABELS.CALL_RECORDINGS,
        //     // subtitle: 'Voice Records',
        //     description: 'Access and manage recorded calls for quality assurance and compliance.',
        //     icon: <i className="ph-duotone ph-microphone"></i>,
        //     gradient: 'from-orange-500 to-red-600',
        //     link: '/call-recordings'
        // },
        {
            id: 'health-care-services',
            title: MENU_LABELS.NETOPS,
            // subtitle: 'Accounts',
            description: 'Track, monitor, and control all network operations seamlessly with NetOps',
            icon: <i className="ph-duotone ph-brain"></i>,
            gradient: 'from-pink-500 to-rose-600',
            link: '/netops/dashboard'
        },
       
        {
            id: 'gsm-services',
            title: MENU_LABELS.SIM_GATEWAY,
            // subtitle: 'GSM Services',
            description: 'Comprehensive SMS management and messaging services for your business.',
            icon: <i className="ph-duotone ph-phone"></i>,
            gradient: 'from-green-500 to-emerald-600',
            link: '/gsm/dashboard'
        },
        
        
        // {
        //     id: 'ai-ml-services',
        //     title: 'Analytics',
        //     // subtitle: 'AI & ML',
        //     description: 'AI-driven insights that turn raw data into clear directions.',
        //     icon: <i className="ph-duotone ph-brain"></i>,
        //     gradient: 'from-pink-500 to-rose-600'
        // },
        // {
        //     id: 'tms-services',
        //     title: 'TMS',
        //     // subtitle: 'Telephony Management System',
        //     description: 'Centralized control for all your telephony operations. ',
        //     icon: <i className="ph-duotone ph-phone"></i>,
        //     gradient: 'from-pink-500 to-rose-600'
        // },
        
        // {
        //     id: 'sales-services',
        //     title: 'Sales Management',
        //     // subtitle: 'Sales Management',
        //     description: 'Track leads, deals and sales performance with clarity.',
        //     icon: <i className="ph-duotone ph-brain"></i>,
        //     gradient: 'from-pink-500 to-rose-600',
        //     link: '/coming-soon'
        // },
       
        // {
        //     id: 'dncr-servicess',
        //     title: 'Do Not Call Registry',
        //     // subtitle: 'Do Not Call Registry',
        //     description: 'Keep your outreach compliant and protected.',
        //     icon: <i className="ph-duotone ph-brain"></i>,
        //     gradient: 'from-pink-500 to-rose-600',
        //     link: '/coming-soon'
        // },
        // {
        //     id: 'webrtc-servicess',
        //     title: 'WebRTC',
        //     // subtitle: 'Web Real-Time Communication',
        //     description: 'Call directly through your browser with enterprise-grade clarity.',
        //     icon: <i className="ph-duotone ph-brain"></i>,
        //     gradient: 'from-pink-500 to-rose-600',
        //     link: '/coming-soon'
        // },
        // {
        //     id: 'omni-channel-servicess',
        //     title: 'Omni Channel',
        //     // subtitle: 'Omni Channel',
        //     description: 'Voice, chat, email, and social, all connected in one window.',
        //     icon: <i className="ph-duotone ph-brain"></i>,
        //     gradient: 'from-pink-500 to-rose-600',
        //     link: '/coming-soon'
        // },
        // {
        //     id: 'hr-servicess',
        //     title: 'Human Resources',
        //     // subtitle: 'Human Resources',
        //     description: 'Manage your employees, payroll, and benefits with ease.',
        //     icon: <i className="ph-duotone ph-brain"></i>,
        //     gradient: 'from-pink-500 to-rose-600',
        //     link: '/coming-soon'
        // },
        {
            id: 'accounts-servicess',
            title: MENU_LABELS.BILLING,
            // subtitle: 'Accounts',
            description: 'Manage your accounts, payroll, and benefits with ease.',
            icon: <i className="ph-duotone ph-brain"></i>,
            gradient: 'from-pink-500 to-rose-600',
            link: '/accounts'
        },
        {
            id: 'crm-servicess',
            title: MENU_LABELS.CRM,
            // subtitle: 'Customer Relationship Management',
            description: 'Instant access to customer profiles, interaction history, and key touch points, all in one place.',
            icon: <i className="ph-duotone ph-brain"></i>,
            gradient: 'from-pink-500 to-rose-600',
            link: '/crm/dashboard'
        },
         {
            id: 'cti-servicess',
            title: MENU_LABELS.LIVE_CALLS,
            // subtitle: 'Computer Telephony Integration',
            description: 'Connect calls with external applications for quick access and context.',
            icon: <i className="ph-duotone ph-brain"></i>,
            gradient: 'from-pink-500 to-rose-600',
            link: '/cti'
        },
      
        
        
        
    ];

    return (
        <React.Fragment>

            <p className='topTicker'>
            🚀 New Feature: AI-Powered Call Summaries now available! Check it out
            </p>
            {/* {isNotificationSupported && notificationPermission !== 'granted' && (
                <div className="container-fluid py-2">
                    <div className="alert alert-warning alert-dismissible fade show d-flex align-items-center" role="alert">
                        <div className="flex-grow-1">
                            <strong className="d-block mb-2">
                                <i className="fas fa-bell me-2"></i>
                                Notification Permission Required
                            </strong>
                            <p className="mb-2">
                                Please enable browser notifications to receive important updates and alerts.
                                {notificationPermission === 'denied' && (
                                    <span className="d-block mt-1 text-muted small">
                                        You have previously denied notifications. Please enable them in your browser settings or click below to try again.
                                    </span>
                                )}
                            </p>
                            <button 
                                type="button" 
                                className="btn btn-primary btn-sm"
                                onClick={async () => {
                                    const result = await requestPermission();
                                    if (result === 'granted') {
                                        // Permission granted - alert will disappear automatically
                                    }
                                }}
                            >
                                <i className="fas fa-bell me-1"></i>
                                {notificationPermission === 'denied' ? 'Request Permission Again' : 'Allow Notifications'}
                            </button>
                        </div>
                        <button type="button" className="btn-close ms-2" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                </div>
            )} */}
            <div className="container-fluid  py-5">
                {/* Header Section */}
                <div className="row mb-2">
                    <div className="col-12">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <h1 className="display-6 fw-bold text-dark mb-2">Hello, {session?.user?.name || 'User'} 👋                                </h1>
                                <p className="text-muted fs-5">Welcome back! Here's an overview of your services.</p>
                            </div>
                            
                        </div>
                    </div>
                </div>
                
                <Row className="mb-5">
                    <Col md={12}>
                        <div className="alert alert-primary dashboard-alert">
                            <h1 className="alert-heading" style={{color:'white'}}>AI-Powered Insights for your business</h1>
                            <p className="mb-3" style={{color:'white'}}>
                                Transform your call operations with actionable analytics and automation designed for enterprise-grade performance.
                            </p>
                            <div>
                            <button className="btn">Get Started</button>
                            </div>
                        </div>
                    </Col>
                </Row>


                <Row className="">
                    <Col md={12}>
                        <h2 className="mb-4 f-w-600">Your Insights</h2>
                    </Col>
                    
                </Row>
                <PageSummaryGrid cards={summaryCards} />

                {/* Service Cards Grid */}
                <div className="row g-4 mt-2">

                <div className="col-xs-12">
                    <h2 className="mb-2 f-w-600">Your Services</h2>
                </div>

                    {serviceCards
                        .filter(service => permissions.includes(service.id))
                        .map((service, index) => (
                        <div key={service.id} className="col-lg-4 col-md-4 col-sm-6 col-xs-12">
                            <div className={`card h-100 border-0 shadow-lg position-relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                                permissions.includes(service.id) 
                                    ? `bg-gradient ${service.gradient} text-dark` 
                                    : 'bg-white'
                            }`}
                            style={{
                                borderRadius: '20px',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-8px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}>
                                
                                <div className="card-body p-4 d-flex flex-column h-100">
                                    {/* Icon and Title */}
                                    <div className="d-block mb-3">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <h4 className={`fw-bold mb-1 serviceHeading  ${
                                                permissions.includes(service.id) ? 'text-dark' : 'text-dark'
                                            }`}>
                                                
                                               {service.title}
                                            </h4>

                                            {permissions.includes(service.id) && (
                                                    <span className="badge bg-success rounded-pill px-3 py-2 service-badge">
                                                    <i className="fas fa-check me-1"></i>
                                                    Active
                                                </span>
                                                )}
                                        </div>
                                    </div>

                                    
                                    {/* Description */}
                                    <p className="text-muted">
                                        {service.description}
                                    </p>

                                    {/* Action Button */}
                                    <div className="text-left mt-3">
                                        <Link href={service.link || ''} className={`btnServices ${
                                            permissions.includes(service.id)
                                                ? ''
                                                : ''
                                        }`}
                                            >
                                            
                                            Open
                                        </Link>
                                    </div>
                                </div>

                              
                                
                            </div>
                        </div>
                    ))}
                </div>


                 {/* Other Services Cards Grid */}
                 <div className="row g-4 mt-5">

<div className="col-xs-12">
    <h2 className="mb-2 f-w-600">Explore More Services</h2>
</div>

    {serviceCards
        .filter(service => !permissions.includes(service.id))
        .map((service, index) => (
        <div key={service.id} className="col-lg-4 col-md-4 col-sm-6 col-xs-12">
            <div className={`card h-100 border-0 shadow-lg position-relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                !permissions.includes(service.id) 
                    ? `bg-gradient ${service.gradient} text-dark` 
                    : 'bg-white'
            }`}
            style={{
                borderRadius: '20px',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
            }}>
                
                <div className="card-body p-4 d-flex flex-column h-100">
                    {/* Icon and Title */}
                    <div className="d-block mb-3">
                        <div className="d-flex justify-content-between align-items-center">
                            <h4 className={`fw-bold mb-1 serviceHeading  ${
                                permissions.includes(service.id) ? 'text-dark' : 'text-dark'
                            }`}>
                                
                               {service.title}
                            </h4>

                            
                                    <span className="badge bg-dark rounded-pill px-3 py-2 service-badge">
                                    <i className="fas fa-lock me-1"></i>
                                    Locked
                                </span>
                               
                        </div>
                    </div>

                

                    {/* Description */}
                    <p className="text-muted">
                        {service.description}
                    </p>

                    {/* Action Button */}
                    <div className="text-left mt-3">
                        <Link href="plan-upgrade" className="btn app-button btn-primary d-inline-block"
                            >
                            
                            Upgrade to Unlock
                        </Link>
                    </div>
                </div>

              
                
            </div>
        </div>
    ))}
</div>


 {/* Other Services Cards Grid */}
 <div className="row g-4 mt-5">
    <div className="col-xs-12">
        <h2 className="mb-2 f-w-600">Resources & Support</h2>
    </div>


    <div className="col-md-6">
        <div className="card">
            <div className="card-body">
                <h5 className="card-title">Community Support</h5>
                <p>Join our community to get help from other users.</p>
                <Link href="/resources/contact-support" className='btn btn-primary app-button d-inline-block'>Visit Community</Link>
            </div>
        </div>
    </div>

    <div className="col-md-6">
        <div className="card">
            <div className="card-body">
                <h5 className="card-title">Knowledge Base</h5>
                <p>Find answers to common questions and tutorials.</p>
                <Link href="/resources/help-materials" className='btn btn-primary app-button d-inline-block'>Visit Knowledge Base</Link>
            </div>
        </div>
    </div>



</div>

              
            </div>
        </React.Fragment>
    )
}

AgentVisibility.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};
  
export default AgentVisibility
