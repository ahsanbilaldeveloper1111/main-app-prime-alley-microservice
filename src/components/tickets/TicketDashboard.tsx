import React, { useState, useCallback, useEffect } from 'react';
import { Row, Col } from 'react-bootstrap';
import { DashboardData } from '@utils/tickets';
import ChartDonut from '@components/ChartDonut';
import TicketsFilters from '@components/filters/TicketFilters';

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import PageSummaryGrid from '@components/PageSummaryGrid';


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


            <PageHeader
                title="Ticket Dashboard"
                showSearch={false}
                buttons={
                    <TicketsFilters onFiltersChange={handleFiltersChange} />
                }
            />
         
            <PageSummaryGrid 
                cards={[
                    {
                        id: 'total-tickets',
                        title: 'Total Tickets',
                        value: summary?.tickets,
                        description: 'Total tickets in the system',
                        icon: <i className="ph-duotone ph-ticket f-26"></i>,
                        delay: 0.1,
                        showAnimatedNumber: true,
                        animationDuration: 1000,
                        fontStyle: 'style-2',
                        color: 'primary'
                    },
                    ...statusSummary.map((status, index) => ({
                        id: `status-${index}`,
                        title: status.name,
                        value: summary?.tickets > 0 ? status.count : 0,
                        description: `${status.name} tickets`,
                        icon: <i className="ph-duotone ph-ticket f-26"></i>,
                        delay: 0.1 + ((index + 1) * 0.1),
                        showAnimatedNumber: true,
                        animationDuration: 1000,
                        fontStyle: 'style-2',
                        color: 'primary'
                    }))
                ]}
            />

            <Row>
                <Col md={12}>
                    <h4 className="mb-3 app-title-heading">Module Summary</h4>
                </Col>
                {moduleSummary.map((module, index) => {
                    const chartSeries = module.statuses.map(status => status.count);
                    const chartLabels = module.statuses.map(status => status.name);
                    
                    return (
                        <Col md={4} key={index}>
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="app-title-heading mb-0 d-flex align-items-center justify-content-between">
                                        <span className="text-muted">
                                            {module.module_name}
                                        </span>
                                        <span className="status-badge primary">
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
