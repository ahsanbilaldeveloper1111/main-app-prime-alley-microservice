import React, { useMemo, useState } from 'react';
import { Row, Col, Form } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import { SyncBillingCompanies } from '@utils/users';
import { toast } from 'react-toastify';
import { FiPlus } from 'react-icons/fi';
import { FaSync } from 'react-icons/fa';
import AddUserSidebar from "@page-modules/tms/profiling/user/create/CreateUserProfileSidebar";

interface UsersHeaderProps {
    syncLdapUsers: () => void;
}

type UsersHeaderAction = 'add-user' | 'sync-users' | 'sync-billing';

const UsersHeader: React.FC<UsersHeaderProps> = (props) => {
  const { syncLdapUsers } = props;
  const { data: session } = useSession();
  const [showAddUserSidebar, setShowAddUserSidebar] = useState(false);
  const [mobileAction, setMobileAction] = useState('');

  const canAddUsers = session?.user?.permissions?.includes('add-users') ?? false;
  const canSyncLdap = session?.user?.permissions?.includes('sync-ldap') ?? false;
  const canSyncBilling = session?.user?.is_admin == "1";

  const mobileActionOptions = useMemo(() => {
    const options: Array<{ value: UsersHeaderAction; label: string }> = [];
    if (canAddUsers) {
      options.push({ value: 'add-user', label: 'Add User' });
    }
    if (canSyncLdap) {
      options.push({ value: 'sync-users', label: 'Sync Users' });
    }
    if (canSyncBilling) {
      options.push({ value: 'sync-billing', label: 'Sync Billing Companies' });
    }
    return options;
  }, [canAddUsers, canSyncLdap, canSyncBilling]);

  const syncBillingCompanies = async () => {
    const response = await SyncBillingCompanies();
    if (response) {
      toast.success('Billing companies synced successfully');
    }
  };

  const openAddUserSidebar = () => {
    setShowAddUserSidebar(true);
  };

  const closeAddUserSidebar = () => {
    setShowAddUserSidebar(false);
  };

  const runAction = (action: UsersHeaderAction) => {
    if (action === 'add-user') {
      openAddUserSidebar();
      return;
    }
    if (action === 'sync-users') {
      syncLdapUsers();
      return;
    }
    syncBillingCompanies();
  };

  const handleMobileActionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const action = event.target.value as UsersHeaderAction | '';
    if (!action) return;
    runAction(action);
    setMobileAction('');
  };

  if (mobileActionOptions.length === 0) {
    return null;
  }

  return (
    <>
      <Row className="mb-3">
        <Col md={12}>
          {mobileActionOptions.length > 0 ? (
            <Form.Select
              className="main-settings-form-select d-md-none mb-3"
              aria-label="User directory actions"
              value={mobileAction}
              onChange={handleMobileActionChange}
            >
              <option value="">Select action</option>
              {mobileActionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Form.Select>
          ) : null}

          <div className="action-buttons d-none d-md-flex justify-content-end gap-2 align-items-end">
            {canAddUsers ? (
              <button
                type="button"
                onClick={openAddUserSidebar}
                style={{
                  padding: '9px 13px',
                  backgroundColor: 'rgb(0, 0, 0)',
                  color: 'rgb(255, 255, 255)',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <FiPlus size={16} className="me-2" />
                Add User
              </button>
            ) : null}
            {canSyncLdap ? (
              <button
                type="button"
                onClick={() => syncLdapUsers()}
                style={{
                  padding: '9px 13px',
                  backgroundColor: 'rgb(0, 0, 0)',
                  color: 'rgb(255, 255, 255)',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <FaSync size={16} className="me-2" />
                Sync Users
              </button>
            ) : null}
            {canSyncBilling ? (
              <button
                type="button"
                onClick={() => syncBillingCompanies()}
                style={{
                  padding: '9px 13px',
                  backgroundColor: 'rgb(0, 0, 0)',
                  color: 'rgb(255, 255, 255)',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <FaSync size={16} className="me-2" />
                Sync Billing Companies
              </button>
            ) : null}
          </div>
        </Col>
      </Row>

      <AddUserSidebar
        isOpen={showAddUserSidebar}
        onClose={closeAddUserSidebar}
        title="Add User Profile"
      />
    </>
  );
};

export default UsersHeader;
