import '@assets/scss/datatable-style.scss';
import '@page-modules/controlhub/users/usersTeamsTablePage.scss';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import ProtectedRoute from '@components/ProtectedRoute';
import '@assets/scss/tabs.scss';
import '@assets/scss/common.scss';

import UsersHeader from '@page-modules/controlhub/users/partials/UsersHeader';
import { UsersDirectoryToolbarActions } from '@page-modules/controlhub/users/partials/UsersDirectoryToolbarActions';
import { UsersTeamsEmbeddedToolbar } from '@page-modules/controlhub/users/UsersTeamsEmbeddedToolbar';
import { useDebouncedValue } from '@hooks/useDebouncedValue';
import OverviewTab from '@page-modules/controlhub/users/partials/OverviewTab';
import UserDetailsModal from '@page-modules/controlhub/users/partials/UserDetailsModal';
import SyncLdapUsersModal from '@page-modules/controlhub/users/partials/SyncLdapUsersModal';
import ResetPasswordModal from '@components/ResetPasswordModal';
import ChangeStatusModal from '@page-modules/controlhub/users/partials/ChangeStatusModal';

import { useUserColumns } from '@hooks/controlhub/users/userColumns';
import { useUsersData } from '@hooks/controlhub/users/useUsersData';
import { useLdapSync } from '@hooks/controlhub/users/useLdapSync';
import { useUserModal } from '@hooks/controlhub/users/useUserModal';
import { useUsersTeamsPanelChrome } from '@page-modules/controlhub/users/useUsersTeamsPanelChrome';
import { MainSettingsFormProvider } from '@components/main-settings/mainSettingsFormContext';

const UsersDirectory = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const roleId = router.query.role_id as string | undefined;
  const { showBreadcrumb, breadcrumbMainLink, embeddedInMainSettings } =
    useUsersTeamsPanelChrome('user-directory');
  const [embeddedSearchValue, setEmbeddedSearchValue] = useState('');
  const debouncedEmbeddedSearch = useDebouncedValue(embeddedSearchValue, 400);

  const [listRefreshToken, setListRefreshToken] = useState(0);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUsername, setSelectedUsername] = useState<string>('');
  const [showChangeStatusModal, setShowChangeStatusModal] = useState(false);
  const [changeStatusRow, setChangeStatusRow] = useState<any>(null);
  const [changeStatusNewStatus, setChangeStatusNewStatus] = useState<string | null>(null);

  const handleResetPasswordClick = useCallback((username: string) => {
    setSelectedUsername(username);
    setShowResetPasswordModal(true);
  }, []);

  const handleCloseResetPasswordModal = useCallback(() => {
    setShowResetPasswordModal(false);
    setSelectedUsername('');
  }, []);

  const { baseColumns } = useUserColumns(session, [], {
    onResetPassword: handleResetPasswordClick,
  });

  const {
    customFieldColumns,
    currentFilters,
    fetchUsers,
    handleFiltersChange,
    invalidateUsersList,
  } = useUsersData(session, baseColumns, roleId);

  const handleAfterStatusChange = useCallback(() => {
    invalidateUsersList();
    setListRefreshToken((t) => t + 1);
  }, [invalidateUsersList]);

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
    onStatusOptionSelect: handleStatusOptionSelect,
  });

  const {
    loadingLdapUsers,
    ldapSyncJob,
    showSyncLdapUsersModal,
    refreshLdapJobStatus,
    handleCloseSyncLdapUsersModal,
    syncLdapUsers,
  } = useLdapSync();

  const { showUserModal, selectedUsers, closeUserModal } = useUserModal();

  const currentFiltersRef = useRef(currentFilters);
  const handleFiltersChangeRef = useRef(handleFiltersChange);
  currentFiltersRef.current = currentFilters;
  handleFiltersChangeRef.current = handleFiltersChange;

  useEffect(() => {
    if (!embeddedInMainSettings) {
      return;
    }
    const search = debouncedEmbeddedSearch.trim() ? debouncedEmbeddedSearch : undefined;
    const prev = currentFiltersRef.current;
    if (prev.search === search) {
      return;
    }
    handleFiltersChangeRef.current({
      ...prev,
      search,
    });
  }, [debouncedEmbeddedSearch, embeddedInMainSettings]);

  const directoryToolbarActions = (
    <UsersDirectoryToolbarActions syncLdapUsers={syncLdapUsers} embedded />
  );

  return (
    <MainSettingsFormProvider preferSidebarForms>
    <ProtectedRoute requiredPermissions={['view-users']}>
      {showBreadcrumb ? (
        <BreadcrumbItem mainTitle="Controlhub" mainLink={breadcrumbMainLink} subTitle="Users" />
      ) : null}

      <div className={embeddedInMainSettings ? 'users-teams-settings-panel' : undefined}>
        <div className="users-teams-table-page users-teams-table-page--user-directory">
          {embeddedInMainSettings ? (
            <div className="users-teams-settings-page">
              <UsersTeamsEmbeddedToolbar
                searchValue={embeddedSearchValue}
                onSearchChange={setEmbeddedSearchValue}
                searchPlaceholder="Search users..."
                actions={directoryToolbarActions}
              />
            </div>
          ) : (
            <UsersHeader syncLdapUsers={syncLdapUsers} />
          )}

          <div className="tab-content">
            <div className="tab-pane fade show active" role="tabpanel">
              <OverviewTab
                columns={columns}
                fetchUsers={fetchUsers}
                customFieldColumns={customFieldColumns}
                currentFilters={currentFilters}
                handleFiltersChange={handleFiltersChange}
                listRefreshToken={listRefreshToken}
                hasListPermission={session?.user?.permissions?.includes('list-users') || false}
                embeddedInMainSettings={embeddedInMainSettings}
              />
            </div>
          </div>
        </div>
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
    </ProtectedRoute>
    </MainSettingsFormProvider>
  );
};

export default UsersDirectory;
