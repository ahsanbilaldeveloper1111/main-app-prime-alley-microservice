import React from 'react';
import { Row } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import { SummaryCard } from '@components/PageSummaryGrid';
import UsersList from './UsersList';
import RecentActivities from './RecentActivities';
import { Column } from '@components/CustomDataTable';

interface OverviewTabProps {
    
    summaryCards: SummaryCard[];
    columns: Column[];
    fetchUsers: (page?: number, perPage?: number, search?: string) => Promise<any>;
    customFieldColumns: Column[];
    currentFilters: any;
    handleFiltersChange: (filters: any) => void;
    hasListPermission: boolean;
    showFilters?: boolean;
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
    columns,
    fetchUsers,
    customFieldColumns,
    currentFilters,
    handleFiltersChange,
    hasListPermission,
    showFilters = true,
}) => {
    const { data: session } = useSession();
    const canShowFilters =
        showFilters && (session?.user?.permissions?.includes('filters-users') || false);

    return (
        <>
            {/* <PageSummaryGrid cards={summaryCards} /> */}

            <UsersList
                columns={columns}
                fetchData={fetchUsers}
                customFieldColumns={customFieldColumns}
                currentFilters={currentFilters}
                handleFiltersChange={handleFiltersChange}
                hasPermission={hasListPermission}
                showFilters={canShowFilters}
            />

            <Row className="mt-3">
                {/* <UserGrowthChart chartData={growthChart} />
                <DepartmentDistributionChart chartData={departmentChart} /> */}
                <RecentActivities />
            </Row>
        </>
    );
};

export default OverviewTab;

