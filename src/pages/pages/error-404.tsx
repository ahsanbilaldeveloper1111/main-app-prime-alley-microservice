import React, { ReactElement } from "react";
import NonLayout from "@layout/NonLayout";
import { Card, Button } from "react-bootstrap";
import Link from "next/link";
import { useRouter } from "next/router";

const Error404 = () => {
    const router = useRouter();

    const handleGoBack = () => {
        router.back();
    };

    return (
        <>
            <div className="auth-main v1" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <div className="auth-wrapper">
                    <div className="auth-form">
                        <div className="error-card">
                            <Card.Body>
                                {/* 404 Animation/Icon */}
                                <div className="text-center mb-4">
                                    <div 
                                        className="d-inline-block position-relative"
                                        style={{ 
                                            fontSize: '6rem', 
                                            fontWeight: 'bold',
                                            color: 'white',
                                            textShadow: '0 0 20px rgba(255,255,255,0.3)',
                                            animation: 'pulse 2s infinite'
                                        }}
                                    >
                                        4
                                        <span 
                                            className="position-absolute"
                                            style={{
                                                fontSize: '4rem',
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                animation: 'bounce 1s infinite'
                                            }}
                                        >
                                            0
                                        </span>
                                        4
                                    </div>
                                </div>

                                <div className="text-center">
                                    <h1 className="mt-2 text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                                        Oops! Page Not Found
                                    </h1>
                                    <p className="mt-2 mb-4 text-white f-20" style={{ opacity: 0.9 }}>
                                        The page you're looking for seems to have vanished into the digital void.
                                    </p>
                                    <p className="mb-4 text-white" style={{ opacity: 0.8 }}>
                                        Don't worry, even the best explorers sometimes take a wrong turn. Let's get you back on track!
                                    </p>

                                    {/* Action Buttons */}
                                    <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center mb-4">
                                        <Button
                                            variant="light"
                                            size="lg"
                                            className="px-4 py-3 rounded-pill shadow"
                                            onClick={handleGoBack}
                                            style={{ 
                                                fontWeight: '600',
                                                transition: 'all 0.3s ease',
                                                border: 'none'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                                            }}
                                        >
                                            <i className="ph-duotone ph-arrow-left me-2"></i>
                                            Go Back
                                        </Button>
                                        
                                        <Link href="/" passHref>
                                            <Button
                                                variant="outline-light"
                                                size="lg"
                                                className="px-4 py-3 rounded-pill shadow"
                                                style={{ 
                                                    fontWeight: '600',
                                                    transition: 'all 0.3s ease',
                                                    border: '2px solid rgba(255,255,255,0.5)'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                                                }}
                                            >
                                                <i className="ph-duotone ph-house me-2"></i>
                                                Go Home
                                            </Button>
                                        </Link>
                                    </div>

                                   
                                </div>
                            </Card.Body>
                        </div>
                    </div>
                </div>

                {/* Custom CSS for animations */}
                <style jsx>{`
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.05); }
                    }
                    
                    @keyframes bounce {
                        0%, 20%, 50%, 80%, 100% { transform: translate(-50%, -50%) translateY(0); }
                        40% { transform: translate(-50%, -50%) translateY(-10px); }
                        60% { transform: translate(-50%, -50%) translateY(-5px); }
                    }
                    
                    .error-card {
                        background: rgba(255, 255, 255, 0.1);
                        backdrop-filter: blur(10px);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        border-radius: 15px;
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                    }
                `}</style>
            </div>
        </>
    )
}

Error404.getLayout = (page: ReactElement) => {
    return (
        <NonLayout>
            {page}
        </NonLayout>
    )
};

export default Error404;