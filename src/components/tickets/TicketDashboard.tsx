import React, { useState, useCallback, useMemo } from 'react';
import { Row, Col, Spinner } from 'react-bootstrap';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { DashboardData } from '@utils/tickets';
import ChartDonut from '@components/ChartDonut';
import TicketsFilters from '@components/filters/TicketFilters';
import { ticketsKeys } from "@query/keys";
import { toast } from 'react-toastify';

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

interface DashboardApiPayload {
    total_tickets?: number;
    statuses?: StatusSummary[];
    modules?: ModuleSummary[];
}

const TicketDashboard: React.FC = () => {
    const [currentFilters, setCurrentFilters] = useState<Record<string, unknown>>({});
    const filtersKey = useMemo(
        () => JSON.stringify(currentFilters ?? {}),
        [currentFilters],
    );

    const dashboardQuery = useQuery({
        queryKey: ticketsKeys.dashboard.byFilters(filtersKey),
        queryFn: async (): Promise<DashboardApiPayload> => {
            try {
                const data = await DashboardData(currentFilters);
                return data && typeof data === 'object' ? (data as DashboardApiPayload) : {};
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                toast.error('Failed to load ticket dashboard');
                throw error instanceof Error ? error : new Error('Failed to load ticket dashboard');
            }
        },
        placeholderData: keepPreviousData,
    });

    const dashboardPayload = dashboardQuery.data;

    const summary: Summary = useMemo(
        () => ({
            tickets: dashboardPayload?.total_tickets ?? 0,
        }),
        [dashboardPayload?.total_tickets],
    );

    const statusSummary = dashboardPayload?.statuses ?? [];
    const moduleSummary = dashboardPayload?.modules ?? [];

    const handleFiltersChange = useCallback((filters: Record<string, unknown>) => {
        setCurrentFilters(filters);
    }, []);

    const showInitialSpinner =
        dashboardQuery.isPending && dashboardPayload === undefined;

    return (
        <React.Fragment>


            <PageHeader
                title="Ticket Dashboard"
                showSearch={false}
                buttons={
                    <TicketsFilters onFiltersChange={handleFiltersChange} />
                }
            />

            {showInitialSpinner ? (
                <div className="d-flex justify-content-center align-items-center py-5">
                    <Spinner animation="border" role="status" variant="primary">
                        <span className="visually-hidden">Loading…</span>
                    </Spinner>
                </div>
            ) : (
                <>
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
                        {moduleSummary.map((module) => {
                            const chartSeries = module.statuses.map(status => status.count);
                            const chartLabels = module.statuses.map(status => status.name);

                            return (
                                <Col
                                    md={4}
                                    key={
                                        module.module_name
                                            ? `module-${module.module_name}`
                                            : `module-${chartLabels.join('-')}`
                                    }
                                >
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
                </>
            )}
        </React.Fragment>
    );
};

export default TicketDashboard;
