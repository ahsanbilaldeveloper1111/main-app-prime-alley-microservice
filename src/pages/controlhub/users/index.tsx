import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useCallback } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
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
import ResetPasswordModal from '@components/ResetPasswordModal';
import ChangeStatusModal from './partials/ChangeStatusModal';

// Import hooks and utilities
import { useUserColumns } from '@hooks/controlhub/users/userColumns';
import { useUserCharts } from '@hooks/controlhub/users/useUserCharts';
import { useUsersData } from '@hooks/controlhub/users/useUsersData';
import { useLdapSync } from '@hooks/controlhub/users/useLdapSync';
import { useUserModal } from '@hooks/controlhub/users/useUserModal';
import { handleUserExport } from '@utils/controlhub/users/userExport';


const Users = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');
    const roleId = router.query.role_id as string | undefined;

    // Reset password modal state
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [selectedUsername, setSelectedUsername] = useState<string>('');

    // Change status modal state
    const [showChangeStatusModal, setShowChangeStatusModal] = useState(false);
    const [changeStatusRow, setChangeStatusRow] = useState<any>(null);
    const [changeStatusNewStatus, setChangeStatusNewStatus] = useState<string | null>(null);

    // Handle reset password button click
    const handleResetPasswordClick = useCallback((username: string) => {
        setSelectedUsername(username);
        setShowResetPasswordModal(true);
    }, []);

    // Handle reset password modal close
    const handleCloseResetPasswordModal = useCallback(() => {
        setShowResetPasswordModal(false);
        setSelectedUsername('');
    }, []);

    // Use custom hooks (baseColumns first so useUsersData can use it)
    const { baseColumns } = useUserColumns(session, [], { onResetPassword: handleResetPasswordClick });
    
    const {
        customFieldColumns,
        currentFilters,
        summaryCards,
        fetchUsers,
        handleFiltersChange
    } = useUsersData(session, baseColumns, roleId);

    // Refresh list after status change
    const handleAfterStatusChange = useCallback(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleStatusOptionSelect = useCallback((row: any, status: string) => {
        setChangeStatusRow(row);
        setChangeStatusNewStatus(status);
        setShowChangeStatusModal(true);
    }, []);

    const handleCloseChangeStatusModal = useCallback(() => {
        setShowChangeStatusModal(false);
        setChangeStatusRow(null);
        setChangeStatusNewStatus(null);
    }, []);

    const { columns } = useUserColumns(session, customFieldColumns, {
        onResetPassword: handleResetPasswordClick,
        onChangeStatus: handleAfterStatusChange,
        onStatusOptionSelect: handleStatusOptionSelect
    });
    
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
        ldapSyncJob,
        showSyncLdapUsersModal,
        refreshLdapJobStatus,
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

                {/* <UsersTabs activeTab={activeTab} setActiveTab={setActiveTab} /> */}

                <div className="tab-content">
                    {/* {activeTab === 'overview' && ( */}
                        <div className="tab-pane fade show active" role="tabpanel">
                            <OverviewTab
                                summaryCards={summaryCards}
                                columns={columns}
                                fetchUsers={fetchUsers}
                                customFieldColumns={customFieldColumns}
                                currentFilters={currentFilters}
                                handleFiltersChange={handleFiltersChange}
                                hasListPermission={session?.user?.permissions?.includes('list-users') || false}
                                growthChart={growthChart}
                                departmentChart={departmentChart}
                            />
                        </div>
                     {/* )} */}
                    {/* {activeTab === 'insight' && (
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
                    )} */}
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
                    job={ldapSyncJob}
                    onRefreshJob={refreshLdapJobStatus}
                />

                <ResetPasswordModal
                    show={showResetPasswordModal}
                    onHide={handleCloseResetPasswordModal}
                    username={selectedUsername}
                />

                <ChangeStatusModal
                    show={showChangeStatusModal}
                    onHide={handleCloseChangeStatusModal}
                    row={changeStatusRow}
                    newStatus={changeStatusNewStatus}
                    onSuccess={handleAfterStatusChange}
                />
            </React.Fragment>
        </ProtectedRoute>
    );
};

Users.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default Users;
