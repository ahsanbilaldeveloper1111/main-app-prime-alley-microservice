import React from 'react';
import { Row } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import UsersList from './UsersList';
import RecentActivities from './RecentActivities';
import { Column } from '@components/CustomDataTable';

interface OverviewTabProps {
    columns: Column[];
    fetchUsers: (page?: number, perPage?: number, search?: string) => Promise<any>;
    customFieldColumns: Column[];
    currentFilters: any;
    handleFiltersChange: (filters: any) => void;
    /** Bumps when parent invalidates the users list cache (e.g. after status change). */
    listRefreshToken?: number;
    hasListPermission: boolean;
    showFilters?: boolean;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
    columns,
    fetchUsers,
    customFieldColumns,
    currentFilters,
    handleFiltersChange,
    listRefreshToken = 0,
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
                listRefreshToken={listRefreshToken}
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

