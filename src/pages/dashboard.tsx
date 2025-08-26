import React,{ReactElement, useEffect, useState} from 'react'
import Layout from '@layout/index'
import ImageStatus6 from '@assets/images/widget/img-status-6.svg'
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';

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
            title: 'Control Hub',
            subtitle: 'System Control',
            description: 'Centralized control and management of all system services and configurations.',
            icon: <i className="ph-duotone ph-gear"></i>,
            gradient: 'from-blue-500 to-indigo-600'
        },
        {
            id: 'gsm-services',
            title: 'GSM Management',
            subtitle: 'GSM Services',
            description: 'Comprehensive SMS management and messaging services for your business.',
            icon: <i className="ph-duotone ph-phone"></i>,
            gradient: 'from-green-500 to-emerald-600'
        },
        {
            id: 'call-logs-services',
            title: 'Call Management',
            subtitle: 'Call Logs',
            description: 'Track and manage all incoming and outgoing call activities.',
            icon: <i className="ph-duotone ph-phone"></i>,
            gradient: 'from-purple-500 to-violet-600'
        },
        {
            id: 'call-recordings-services',
            title: 'Call Recording',
            subtitle: 'Voice Records',
            description: 'Access and manage recorded calls for quality assurance and compliance.',
            icon: <i className="ph-duotone ph-microphone"></i>,
            gradient: 'from-orange-500 to-red-600'
        },
        {
            id: 'ai-ml-services',
            title: 'Analytics',
            subtitle: 'AI & ML',
            description: 'AI-driven insights that turn raw data into clear directions.',
            icon: <i className="ph-duotone ph-brain"></i>,
            gradient: 'from-pink-500 to-rose-600'
        },
        {
            id: 'tms-services',
            title: 'TMS',
            subtitle: 'Telephony Management System',
            description: 'Centralized control for all your telephony operations. ',
            icon: <i className="ph-duotone ph-phone"></i>,
            gradient: 'from-pink-500 to-rose-600'
        },
        {
            id: 'crm-services',
            title: 'CRM',
            subtitle: 'Customer Relationship Management',
            description: 'Customer details, history and touchpoints, always at hand.',
            icon: <i className="ph-duotone ph-brain"></i>,
            gradient: 'from-pink-500 to-rose-600',
            link: '/crm'
        },
        {
            id: 'sales-services',
            title: 'Sales',
            subtitle: 'Sales Management',
            description: 'Track leads, deals and sales performance with clarity.',
            icon: <i className="ph-duotone ph-brain"></i>,
            gradient: 'from-pink-500 to-rose-600',
            link: '/coming-soon'
        },
        {
            id: 'cti-services',
            title: 'CTI',
            subtitle: 'Computer Telephony Integration',
            description: 'Connect your calls with applications for quick access and context.',
            icon: <i className="ph-duotone ph-brain"></i>,
            gradient: 'from-pink-500 to-rose-600',
            link: '/coming-soon'
        },
        {
            id: 'dncr-services',
            title: 'DNCR',
            subtitle: 'Do Not Call Registry',
            description: 'Keep your outreach compliant and protected.',
            icon: <i className="ph-duotone ph-brain"></i>,
            gradient: 'from-pink-500 to-rose-600',
            link: '/coming-soon'
        },
        {
            id: 'webrtc-services',
            title: 'WebRTC',
            subtitle: 'Web Real-Time Communication',
            description: 'Call directly through your browser with enterprise-grade clarity.',
            icon: <i className="ph-duotone ph-brain"></i>,
            gradient: 'from-pink-500 to-rose-600',
            link: '/coming-soon'
        },
        {
            id: 'omni-channel-services',
            title: 'Omni Channel',
            subtitle: 'Omni Channel',
            description: 'Voice, chat, email, and social, all connected in one window.',
            icon: <i className="ph-duotone ph-brain"></i>,
            gradient: 'from-pink-500 to-rose-600',
            link: '/coming-soon'
        },
        {
            id: 'hr-services',
            title: 'HR',
            subtitle: 'Human Resources',
            description: 'Manage your employees, payroll, and benefits with ease.',
            icon: <i className="ph-duotone ph-brain"></i>,
            gradient: 'from-pink-500 to-rose-600',
            link: '/coming-soon'
        },
        {
            id: 'accounts-services',
            title: 'Accounts',
            subtitle: 'Accounts',
            description: 'Manage your accounts, payroll, and benefits with ease.',
            icon: <i className="ph-duotone ph-brain"></i>,
            gradient: 'from-pink-500 to-rose-600',
            link: '/coming-soon'
        },
        
        
    ];

    return (
        <React.Fragment>
            <div className="container-fluid px-4 py-5">
                {/* Header Section */}
                <div className="row mb-5">
                    <div className="col-12">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <h1 className="display-6 fw-bold text-dark mb-2">Hello, {session?.user?.name || 'User'}</h1>
                                <p className="text-muted fs-5">Welcome back! Here's an overview of your services.</p>
                            </div>
                            {/* <div className="d-flex align-items-center">
                                <div className="me-3">
                                    <div className="d-flex align-items-center">
                                        <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '50px', height: '50px'}}>
                                            <i className="fas fa-user text-white fs-5"></i>
                                        </div>
                                        <div>
                                            <h6 className="mb-0 fw-semibold">{session?.user?.name || 'User'}</h6>
                                            <small className="text-muted">{isAdmin ? 'Administrator' : 'User'}</small>
                                        </div>
                                    </div>
                                </div>
                            </div> */}
                        </div>
                    </div>
                </div>

                {/* Service Cards Grid */}
                <div className="row g-4">
                    {serviceCards.map((service, index) => (
                        <div key={service.id} className="col-lg-3 col-md-4 col-sm-6 col-xs-12">
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
                                
                                <div className="card-body p-4 d-flex flex-column h-100 pt-5">
                                    {/* Icon and Title */}
                                    <div className="d-flex align-items-center mb-3">
                                        <div>
                                            <h4 className={`fw-bold mb-1 ${
                                                permissions.includes(service.id) ? 'text-dark' : 'text-dark'
                                            }`}>
                                                {service.title}
                                            </h4>
                                            <p className={`mb-0 ${
                                                permissions.includes(service.id) ? 'text-white-75' : 'text-muted'
                                            }`}>
                                                {service.subtitle}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <p className={`flex-grow-1 ${
                                        permissions.includes(service.id) ? 'text-white-75' : 'text-muted'
                                    }`}>
                                        {service.description}
                                    </p>

                                    {/* Action Button */}
                                    <div className="mt-4">
                                        <Link href={service.link || ''} className={`btn w-100 fw-semibold px-4 py-3 border-0 ${
                                            permissions.includes(service.id)
                                                ? 'btn-light text-dark'
                                                : 'btn-primary'
                                        }`}
                                            style={{
                                                borderRadius: '12px',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'scale(1.02)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'scale(1)';
                                            }}>
                                            <i className="fas fa-arrow-right me-2"></i>
                                            View Details
                                        </Link>
                                    </div>
                                </div>

                                {/* Status Indicator */}
                                {permissions.includes(service.id) && (
                                    <div className="position-absolute top-3 start-3">
                                        <span className="badge bg-success rounded-pill px-3 py-2">
                                            <i className="fas fa-check me-1"></i>
                                            Active
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Stats Section
                <div className="row mt-5 g-4">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm" style={{borderRadius: '20px'}}>
                            <div className="card-body p-4">
                                <h5 className="fw-bold text-dark mb-4">
                                    <i className="fas fa-chart-line me-2 text-primary"></i>
                                    Quick Statistics
                                </h5>
                                <div className="row g-4">
                                    <div className="col-md-3 col-sm-6">
                                        <div className="text-center p-3 rounded-3 bg-light">
                                            <div className="fs-2 fw-bold text-primary mb-2">
                                                {permissions.length}
                                            </div>
                                            <div className="text-muted">Active Services</div>
                                        </div>
                                    </div>
                                    <div className="col-md-3 col-sm-6">
                                        <div className="text-center p-3 rounded-3 bg-light">
                                            <div className="fs-2 fw-bold text-success mb-2">
                                                {isAdmin ? 'Full' : 'Limited'}
                                            </div>
                                            <div className="text-muted">Access Level</div>
                                        </div>
                                    </div>
                                    <div className="col-md-3 col-sm-6">
                                        <div className="text-center p-3 rounded-3 bg-light">
                                            <div className="fs-2 fw-bold text-info mb-2">
                                                {serviceCards.length}
                                            </div>
                                            <div className="text-muted">Total Services</div>
                                        </div>
                                    </div>
                                    <div className="col-md-3 col-sm-6">
                                        <div className="text-center p-3 rounded-3 bg-light">
                                            <div className="fs-2 fw-bold text-warning mb-2">
                                                {Math.round((permissions.length / serviceCards.length) * 100)}%
                                            </div>
                                            <div className="text-muted">Access Rate</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div> */}
            </div>
        </React.Fragment>
    )
}

Dashboard.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};
  
export default Dashboard
