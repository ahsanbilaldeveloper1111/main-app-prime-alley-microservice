import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '@components/ProtectedRoute';
import '@assets/scss/tabs.scss';
import '@assets/scss/common.scss';

// Import partial components
import UsersTabs from './partials/UsersTabs';
import UsersHeader from './partials/UsersHeader';
import OverviewTab from './partials/OverviewTab';
import InsightTab from './partials/InsightTab';
import UserDetailsModal from './partials/UserDetailsModal';
import SyncLdapUsersModal from './partials/SyncLdapUsersModal';

// Import hooks and utilities
import { useUserColumns } from '@hooks/controlhub/users/userColumns';
import { useUserCharts } from '@hooks/controlhub/users/useUserCharts';
import { useUsersData } from '@hooks/controlhub/users/useUsersData';
import { useLdapSync } from '@hooks/controlhub/users/useLdapSync';
import { useUserModal } from '@hooks/controlhub/users/useUserModal';
import { handleUserExport } from '@utils/controlhub/users/userExport';


const Users = () => {
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState('overview');

    // Use custom hooks
    const { baseColumns } = useUserColumns(session, []);
    
    const {
        customFieldColumns,
        currentFilters,
        summaryCards,
        fetchUsers,
        handleFiltersChange
    } = useUsersData(session, baseColumns);
    
    // Get columns with custom fields
    const { columns } = useUserColumns(session, customFieldColumns);
    
    const {
        growthChart,
        departmentChart,
        userActivityChart,
        FailedLoginAttemptsChart,
        departmentGrowthChart,
        userLocationChart,
        loginHeatMapChart
    } = useUserCharts();

    const {
        loadingLdapUsers,
        responseDataLdapUsers,
        showSyncLdapUsersModal,
        handleCloseSyncLdapUsersModal,
        syncLdapUsers
    } = useLdapSync();

    const {
        showUserModal,
        selectedUsers,
        closeUserModal
    } = useUserModal();

    const handleExport = async (exportType: string, filters: Record<string, any>) => {
        handleUserExport(exportType, filters);
    };










    return (
        <ProtectedRoute requiredPermissions={['view-users']}>
            <React.Fragment>
                <BreadcrumbItem mainTitle="Controlhub" mainLink="/controlhub/users" subTitle="Users" />
                
                <UsersHeader
                    currentFilters={currentFilters}
                    handleFiltersChange={handleFiltersChange}
                    handleExport={handleExport}
                    syncLdapUsers={syncLdapUsers}
                />

                <UsersTabs activeTab={activeTab} setActiveTab={setActiveTab} />

                <div className="tab-content">
                    {activeTab === 'overview' && (
                        <div className="tab-pane fade show active" role="tabpanel">
                            <OverviewTab
                                summaryCards={summaryCards}
                                columns={columns}
                                fetchUsers={fetchUsers}
                                customFieldColumns={customFieldColumns}
                                currentFilters={currentFilters}
                                hasListPermission={session?.user?.permissions?.includes('list-users') || false}
                                growthChart={growthChart}
                                departmentChart={departmentChart}
                            />
                        </div>
                    )}
                    {activeTab === 'insight' && (
                        <div className="tab-pane fade show active" role="tabpanel">
                            <InsightTab
                                summaryCards={summaryCards}
                                userActivityChart={userActivityChart}
                                failedLoginAttemptsChart={FailedLoginAttemptsChart}
                                departmentGrowthChart={departmentGrowthChart}
                                loginHeatMapChart={loginHeatMapChart}
                                userLocationChart={userLocationChart}
                            />
                        </div>
                    )}
                </div>

                <UserDetailsModal
                    show={showUserModal}
                    onHide={closeUserModal}
                    selectedUsers={selectedUsers}
                />

                <SyncLdapUsersModal
                    show={showSyncLdapUsersModal}
                    onHide={handleCloseSyncLdapUsersModal}
                    loading={loadingLdapUsers}
                    responseData={responseDataLdapUsers}
                />
            </React.Fragment>
        </ProtectedRoute>
    );
};

Users.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default Users;
