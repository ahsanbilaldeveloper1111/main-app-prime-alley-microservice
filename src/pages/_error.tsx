import React, { ReactElement } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "@layout/index";
import { NextPageContext } from "next";

interface ErrorProps {
  statusCode?: number;
  hasGetInitialPropsRun?: boolean;
  err?: Error;
}

const CustomError = ({ statusCode }: ErrorProps) => {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  const handleGoHome = () => {
    router.push("/");
  };

  const is404 = statusCode === 404;

  return (
    <div className="min-vh-100 d-flex align-items-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Container>
        <Row className="justify-content-center">
          <Col lg={8} md={10} sm={12}>
            <div className="text-center text-white">
              {/* Error Animation/Icon */}
              <div className="mb-4">
                <div 
                  className="d-inline-block position-relative"
                  style={{ 
                    fontSize: '8rem', 
                    fontWeight: 'bold',
                    textShadow: '0 0 20px rgba(255,255,255,0.3)',
                    animation: 'pulse 2s infinite'
                  }}
                >
                  {is404 ? (
                    <>
                      4
                      <span 
                        className="position-absolute"
                        style={{
                          fontSize: '6rem',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          animation: 'bounce 1s infinite'
                        }}
                      >
                        0
                      </span>
                      4
                    </>
                  ) : (
                    statusCode || '500'
                  )}
                </div>
              </div>

              {/* Error Message */}
              <h1 className="display-4 fw-bold mb-3" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                {is404 ? "Oops! Page Not Found" : "Something Went Wrong"}
              </h1>
              
              <p className="lead mb-4" style={{ fontSize: '1.25rem', opacity: 0.9 }}>
                {is404 
                  ? "The page you're looking for seems to have vanished into the digital void."
                  : "We encountered an unexpected error. Our team has been notified."
                }
              </p>
              
              <p className="mb-5" style={{ opacity: 0.8 }}>
                {is404 
                  ? "Don't worry, even the best explorers sometimes take a wrong turn. Let's get you back on track!"
                  : "Please try again in a few moments, or contact support if the problem persists."
                }
              </p>

              {/* Action Buttons */}
              <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
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
                  <i className="fas fa-arrow-left me-2"></i>
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
                    <i className="fas fa-home me-2"></i>
                    Go Home
                  </Button>
                </Link>
              </div>

              {/* Additional Help */}
              <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                <p className="mb-3" style={{ opacity: 0.8 }}>
                  Need help? Try these popular pages:
                </p>
                <div className="d-flex flex-wrap justify-content-center gap-3">
                  <Link href="/dashboard" className="text-white text-decoration-none">
                    <span className="badge bg-light text-dark px-3 py-2 rounded-pill">
                      <i className="fas fa-tachometer-alt me-1"></i>
                      Dashboard
                    </span>
                  </Link>
                  <Link href="/tms/profiling/customers" className="text-white text-decoration-none">
                    <span className="badge bg-light text-dark px-3 py-2 rounded-pill">
                      <i className="fas fa-users me-1"></i>
                      Customer Profiling
                    </span>
                  </Link>
                  <Link href="/cti" className="text-white text-decoration-none">
                    <span className="badge bg-light text-dark px-3 py-2 rounded-pill">
                      <i className="fas fa-phone me-1"></i>
                      CTI
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

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
        
        .min-vh-100 {
          min-height: 100vh;
        }
      `}</style>
    </div>
  );
};

CustomError.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

CustomError.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CustomError;
