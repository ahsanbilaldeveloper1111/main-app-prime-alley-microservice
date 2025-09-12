import React,{ReactElement, useEffect, useState} from 'react'
import Layout from '@layout/index'
import ImageStatus6 from '@assets/images/widget/img-status-6.svg'
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Button, Col, Row } from 'react-bootstrap';
import AnimatedNumber from '@components/AnimatedNumber';
import "@assets/scss/dashboard.scss";

const Dashboard = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [permissions, setPermissions] = useState<string[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);

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
            id: 'control-hub-services',
            title: 'System Control',
            // subtitle: 'System Control',
            description: 'Centralized control and management of all system services and configurations.',
            icon: <i className="ph-duotone ph-gear"></i>,
            gradient: 'from-blue-500 to-indigo-600'
        },
        // {
        //     id: 'gsm-services',
        //     title: 'GSM Services',
        //     // subtitle: 'GSM Services',
        //     description: 'Comprehensive SMS management and messaging services for your business.',
        //     icon: <i className="ph-duotone ph-phone"></i>,
        //     gradient: 'from-green-500 to-emerald-600'
        // },
        {
            id: 'call-logs-services',
            title: 'Call Logs',
            // subtitle: 'Call Logs',
            description: 'Track and manage all incoming and outgoing call activities.',
            icon: <i className="ph-duotone ph-phone"></i>,
            gradient: 'from-purple-500 to-violet-600'
        },
        {
            id: 'call-recordings-services',
            title: 'Voice Records',
            // subtitle: 'Voice Records',
            description: 'Access and manage recorded calls for quality assurance and compliance.',
            icon: <i className="ph-duotone ph-microphone"></i>,
            gradient: 'from-orange-500 to-red-600'
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
        //     id: 'crm-services',
        //     title: 'CRM',
        //     // subtitle: 'Customer Relationship Management',
        //     description: 'Customer details, history and touchpoints, always at hand.',
        //     icon: <i className="ph-duotone ph-brain"></i>,
        //     gradient: 'from-pink-500 to-rose-600',
        //     link: '/crm'
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
        //     id: 'cti-services',
        //     title: 'CTI',
        //     // subtitle: 'Computer Telephony Integration',
        //     description: 'Connect your calls with applications for quick access and context.',
        //     icon: <i className="ph-duotone ph-brain"></i>,
        //     gradient: 'from-pink-500 to-rose-600',
        //     link: '/coming-soon'
        // },
        // {
        //     id: 'dncr-services',
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
        {
            id: 'omni-channel-servicess',
            title: 'Omni Channel',
            // subtitle: 'Omni Channel',
            description: 'Voice, chat, email, and social, all connected in one window.',
            icon: <i className="ph-duotone ph-brain"></i>,
            gradient: 'from-pink-500 to-rose-600',
            link: '/coming-soon'
        },
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
            title: 'Accounts',
            // subtitle: 'Accounts',
            description: 'Manage your accounts, payroll, and benefits with ease.',
            icon: <i className="ph-duotone ph-brain"></i>,
            gradient: 'from-pink-500 to-rose-600',
            link: '/coming-soon'
        },
        
        
    ];

    return (
        <React.Fragment>

            <p className='topTicker'>
            🚀 New Feature: AI-Powered Call Summaries now available! Check it out
            </p>
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
                    
                    <Col md={4} sm={4} xs={4} className="mb-2">
                        <div className="card text-center">
                            <div className="card-body insights-box">
                                <AnimatedNumber value={100} duration={1000} />
                                <p>Card Text</p>
                            </div>
                        </div>
                    </Col>

                    <Col md={4} sm={4} xs={4} className="mb-2">
                        <div className="card text-center">
                            <div className="card-body insights-box">
                                <AnimatedNumber value={100} duration={1000} />
                                <p>Issue Pending</p>
                            </div>
                        </div>
                    </Col>

                    <Col md={4} sm={4} xs={4} className="mb-2">
                        <div className="card text-center">
                            <div className="card-body insights-box">
                                <AnimatedNumber value={100} duration={1000} />
                                <p>Uptime (this week)</p>
                            </div>
                        </div>
                    </Col>

                   
                </Row>

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
                        <Link href="!#" className={` locked-btn`}
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
                <Link href="!#" className='btn btn-primary'>Visit Community</Link>
            </div>
        </div>
    </div>

    <div className="col-md-6">
        <div className="card">
            <div className="card-body">
                <h5 className="card-title">Knowledge Base</h5>
                <p>Find answers to common questions and tutorials.</p>
                <Link href="!#" className='btn btn-primary'>Visit Knowledge Base</Link>
            </div>
        </div>
    </div>



</div>

              
            </div>
        </React.Fragment>
    )
}

Dashboard.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};
  
export default Dashboard
