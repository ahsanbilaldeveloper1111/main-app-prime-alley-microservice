import React, { useState, useCallback, useEffect } from 'react';
import { Row, Col } from 'react-bootstrap';
import { DashboardData } from '@utils/tickets';
import AnimatedNumber from '@components/AnimatedNumber';
import ChartDonut from '@components/ChartDonut';
import imgStatus1 from '@assets/images/widget/img-status-1.svg';
import TicketsFilters from '@components/filters/TicketFilters';

interface Summary {
    tickets: number;
}

interface StatusSummary {
    name: string;
    count: number;
}

interface ModuleSummary {
    module_name: string;
    total_tickets: number;
    statuses: StatusSummary[];
}

const TicketDashboard: React.FC = () => {
    const [currentFilters, setCurrentFilters] = useState({});
    const [dashboardData, setDashboardData] = useState<any>([]);
    const [summary, setSummary] = useState<Summary>({
        tickets: 0
    });
    const [statusSummary, setStatusSummary] = useState<StatusSummary[]>([]);
    const [moduleSummary, setModuleSummary] = useState<ModuleSummary[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const data = await DashboardData(currentFilters);
                setDashboardData(data);
                
                if (data && data.total_tickets !== undefined) {
                    setSummary(prev => ({
                        ...prev,
                        tickets: data.total_tickets || 0
                    }));
                }
                if (data && data.statuses !== undefined) {
                    setStatusSummary(data.statuses);
                }
                if (data && data.modules !== undefined) {
                    setModuleSummary(data.modules);
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            }
        };

        fetchDashboardData();
    }, [currentFilters]);

    const handleFiltersChange = useCallback((filters: any) => {
        setCurrentFilters(filters);
    }, []);

    return (
        <React.Fragment>
            <Row className="mb-3">
                <Col md={12}>
                    <div className="page-header-title">
                        <h2 className="mb-0 d-flex align-items-center">
                            Ticket Dashboard 
                            <TicketsFilters onFiltersChange={handleFiltersChange} />
                        </h2>
                    </div>
                </Col>
            </Row>

            <Row>
                <Col md={3}>
                    <div className="card statistics-card-1">
                        <div className="card-body">
                            <img src={imgStatus1.src} alt="img" className="img-fluid img-bg" />
                            <div className="d-flex align-items-center">
                                <div className="avtar bg-brand-color-1 text-white me-3">
                                    <i className="ph-duotone ph-ticket f-26"></i>
                                </div>
                                <div>
                                    <p className="text-muted mb-0">Tickets</p>
                                    <div className="d-flex align-items-end">
                                        {summary?.tickets > 0 ? (
                                            <AnimatedNumber value={summary?.tickets} duration={1000} />
                                        ) : (
                                            <h2 className="mb-0 f-w-500">0</h2>
                                        )}
                                    </div>
                                </div>  
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>

            <Row>
                <Col md={12}>
                    <h4>Ticket Status Summary</h4>
                </Col>
                {statusSummary.map((status, index) => (
                    <Col md={3} key={index}>
                        <div className="card statistics-card-1">
                            <div className="card-body">
                                <img src={imgStatus1.src} alt="img" className="img-fluid img-bg" />
                                <div className="d-flex align-items-center">
                                    <div className="avtar bg-brand-color-1 text-white me-3">
                                        <i className="ph-duotone ph-ticket f-26"></i>
                                    </div>
                                    <div>
                                        <p className="text-muted mb-0">{status.name}</p>
                                        <div className="d-flex align-items-end">
                                            {summary?.tickets > 0 ? (
                                                <AnimatedNumber value={status.count} duration={1000} />
                                            ) : (
                                                <h2 className="mb-0 f-w-500">0</h2>
                                            )}
                                        </div>
                                    </div>  
                                </div>
                            </div>
                        </div>
                    </Col>
                ))}
            </Row>

            <Row>
                <Col md={12}>
                    <h4>Module Summary</h4>
                </Col>
                {moduleSummary.map((module, index) => {
                    const chartSeries = module.statuses.map(status => status.count);
                    const chartLabels = module.statuses.map(status => status.name);
                    
                    return (
                        <Col md={4} key={index}>
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0 d-flex align-items-center justify-content-between">
                                        <span className="text-muted">
                                            {module.module_name}
                                        </span>
                                        <span className="badge bg-primary">
                                            Total: {module.total_tickets}
                                        </span>
                                    </h5>
                                </div>
                                <div className="card-body">
                                    {module.statuses.length > 0 && module.total_tickets > 0 ? (
                                        <ChartDonut 
                                            series={chartSeries}
                                            labels={chartLabels}
                                            dataType="percentage"
                                            height={250}
                                            width="100%"
                                            showDataLabels={true}
                                            showLegend={true}
                                            legendPosition="bottom"
                                            donutWidth="60%"
                                            title=""
                                        />
                                    ) : (
                                        <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '250px' }}>
                                            <div className="avtar bg-light text-muted mb-3" style={{ width: '60px', height: '60px' }}>
                                                <i className="ph-duotone ph-ticket f-24"></i>
                                            </div>
                                            <h6 className="text-muted mb-1">No Tickets</h6>
                                            <p className="text-muted mb-0 small">This module has no tickets yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Col>
                    );
                })}
            </Row>
        </React.Fragment>
    );
};

export default TicketDashboard;
