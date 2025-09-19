import React, { ReactElement, useState, useEffect, useCallback, useMemo } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { Card, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { useRouter } from 'next/router';
import { useTmsSessionContext } from '../../../contexts/TmsSessionContext';
import AnimatedNumber from '@components/AnimatedNumber';
import imgStatus1 from '@assets/images/widget/img-status-1.svg';
import imgStatus2 from '@assets/images/widget/img-status-2.svg';
import imgStatus3 from '@assets/images/widget/img-status-3.svg';
import imgStatus4 from '@assets/images/widget/img-status-4.svg';

interface Summary {
  users: number;
  company: number;
  nonAdminUsers: number;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  bgColor: string;
  iconClass: string;
  image: any;
}

// Reusable StatCard component
const StatCard = React.memo<StatCardProps>(({ title, value, icon, bgColor, iconClass, image }) => (
  <Col md={4}>
    <div className="card statistics-card-1">
      <div className="card-body">
        <img src={image.src} alt="img" className="img-fluid img-bg" />
        <div className="d-flex align-items-center">
          <div className={`avtar ${bgColor} text-white me-3`}>
            <i className={`${iconClass} f-26`}></i>
          </div>
          <div>
            <p className="text-muted mb-0">{title}</p>
            <div className="d-flex align-items-end">
              {value > 0 ? (
                <AnimatedNumber value={value} duration={1000} />
              ) : (
                <h2 className="mb-0 f-w-500">0</h2>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  </Col>
));

StatCard.displayName = 'StatCard';

const TmsDashboard = React.memo(() => {
    const router = useRouter();
    const { session, isAuthenticated, isLoading, isValid, isRefreshing } = useTmsSessionContext();
    const [summary, setSummary] = useState<Summary>({
        users: 0,
        company: 0,
        nonAdminUsers: 0,
    });
    const [error, setError] = useState<string | null>(null);
    const [isDataLoading, setIsDataLoading] = useState(true);

    // Fetch dashboard data
    const fetchDashboardData = useCallback(async () => {
        try {
            setIsDataLoading(true);
            setError(null);
            
            // TODO: Replace with actual API call
            // const response = await fetch('/api/tms/dashboard/summary');
            // const data = await response.json();
            
            // Mock data for now
            const mockData = {
                users: 5000,
                company: 200,
                nonAdminUsers: 4800,
            };
            
            setSummary(mockData);
        } catch (err) {
            setError('Failed to load dashboard data');
            console.error('Dashboard data fetch error:', err);
        } finally {
            setIsDataLoading(false);
        }
    }, []);

    // Handle session validation
    useEffect(() => {
        if (!isLoading && !isRefreshing) {
            if (!isAuthenticated || !isValid) {
                router.push('/tms/verification');
                return;
            }
            
            // Fetch data when session is valid
            fetchDashboardData();
        }
    }, [isLoading, isRefreshing, isAuthenticated, isValid, router, fetchDashboardData]);

    // Memoize stat cards data
    const statCardsData = useMemo(() => [
        {
            title: 'Total Users',
            value: summary.users,
            icon: 'ph-duotone ph-users',
            bgColor: 'bg-brand-color-1',
            iconClass: 'ph-duotone ph-users',
            image: imgStatus1,
        },
        {
            title: 'Total Companies',
            value: summary.company,
            icon: 'ph-duotone ph-buildings',
            bgColor: 'bg-brand-color-2',
            iconClass: 'ph-duotone ph-buildings',
            image: imgStatus2,
        },
        {
            title: 'Non Admin Users',
            value: summary.nonAdminUsers,
            icon: 'ph-duotone ph-user-minus',
            bgColor: 'bg-brand-color-3',
            iconClass: 'ph-duotone ph-user-minus',
            image: imgStatus3,
        },
    ], [summary]);

    // Show loading state while checking session or refreshing
    if (isLoading || isRefreshing) {
        return (
            <React.Fragment>
                <BreadcrumbItem mainTitle="TMS" mainLink="/tms" subTitle="TMS Dashboard" />
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
                    <div className="text-center">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-3">{isRefreshing ? 'Refreshing TMS session...' : 'Loading TMS session...'}</p>
                    </div>
                </div>
            </React.Fragment>
        );
    }

    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="TMS" mainLink="/tms" subTitle="TMS Dashboard" />
            
            <Row className="mb-4">
                <Col md={12}>
                    <h2 className="mb-3">TMS Dashboard</h2>
                </Col>
            </Row>

            {error && (
                <Row className="mb-4">
                    <Col md={12}>
                        <Alert variant="danger" dismissible onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    </Col>
                </Row>
            )}

            <Row>
                {isDataLoading ? (
                    <Col md={12}>
                        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                            <div className="text-center">
                                <Spinner animation="border" variant="primary" />
                                <p className="mt-3">Loading dashboard data...</p>
                            </div>
                        </div>
                    </Col>
                ) : (
                    statCardsData.map((card, index) => (
                        <StatCard key={index} {...card} />
                    ))
                )}
            </Row>
        </React.Fragment>
    );
});

TmsDashboard.displayName = 'TmsDashboard';

// Add getLayout as a static property
(TmsDashboard as any).getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default TmsDashboard;   
