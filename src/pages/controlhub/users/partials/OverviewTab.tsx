import React from 'react';
import { Row } from 'react-bootstrap';
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import UsersList from './UsersList';
import UserGrowthChart from './UserGrowthChart';
import DepartmentDistributionChart from './DepartmentDistributionChart';
import RecentActivities from './RecentActivities';
import { Column } from '@components/CustomDataTable';

interface OverviewTabProps {
    summaryCards: SummaryCard[];
    columns: Column[];
    fetchUsers: (page?: number, perPage?: number, search?: string) => Promise<any>;
    customFieldColumns: Column[];
    currentFilters: any;
    hasListPermission: boolean;
    growthChart: {
        series: Array<{ name: string; data: number[] }>;
        options: any;
    };
    departmentChart: {
        series: number[];
        options: any;
    };
}

const OverviewTab: React.FC<OverviewTabProps> = ({
    summaryCards,
    columns,
    fetchUsers,
    customFieldColumns,
    currentFilters,
    hasListPermission,
    growthChart,
    departmentChart
}) => {
    return (
        <>
            <PageSummaryGrid cards={summaryCards} />
            
            <UsersList
                columns={columns}
                fetchData={fetchUsers}
                customFieldColumns={customFieldColumns}
                currentFilters={currentFilters}
                hasPermission={hasListPermission}
            />

            <Row className="mt-3">
                <UserGrowthChart chartData={growthChart} />
                <DepartmentDistributionChart chartData={departmentChart} />
                <RecentActivities />
            </Row>
        </>
    );
};

export default OverviewTab;

