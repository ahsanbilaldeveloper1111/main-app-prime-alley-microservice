import React, { useState } from 'react';
import { Row, Col } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import { SyncBillingCompanies } from '@utils/users';
import { toast } from 'react-toastify';
import { FiPlus } from 'react-icons/fi';
import { FaSync } from 'react-icons/fa';
import AddUserSidebar from '@pages/tms/profiling/user/create/CreateUserProfileSidebar';

interface UsersHeaderProps {
    
    syncLdapUsers: () => void;
}

const UsersHeader: React.FC<UsersHeaderProps> = (props) => {
  const { syncLdapUsers } = props;
    const { data: session } = useSession();
  const [showAddUserSidebar, setShowAddUserSidebar] = useState(false);

    const syncBillingCompanies = async () => {
        const response = await SyncBillingCompanies();
        if(response){
            toast.success('Billing companies synced successfully');
        }
    };

    const openAddUserSidebar = () => {
      setShowAddUserSidebar(true);
    };

    const closeAddUserSidebar = () => {
      setShowAddUserSidebar(false);
    };

    return (
        <>
        {/* <Row className="mb-3">
            <Col md={12}>
                <div className="page-header-title style-2">
                    <Row className="d-flex justify-content-between align-items-center">
                        <Col md={3}>
                            <h2 className="mb-0">Users Directory</h2>
                        </Col>
                        <Col md={9} className="d-flex justify-content-end">
                            <div className="action-buttons">
                               
                                {session?.user?.permissions?.includes('add-users') && (
                                    <Button variant="primary" 
                                    onClick={() => router.push('/controlhub/users/create')}>
                                        <FiPlus size={16} className="me-2" /> Add User
                                    </Button>
                                )}
                               
                                {session?.user?.permissions?.includes('sync-ldap') && (
                                    <Button variant="info" onClick={() => syncLdapUsers()}>
                                        
                                        <FaSync size={16} className="me-2" /> Sync Users 
                                    </Button>
                                )}

{session?.user?.is_admin == "1" && (
                                    <Button variant="danger" onClick={() => syncBillingCompanies()}>
                                        <FaSync size={16} className="me-2" /> Sync Billing Companies
                                    </Button>
                                )}

                            </div>
                        </Col>
                    </Row>
                </div>
            </Col>
        </Row> */}

<Row className="mb-3">
  <Col md={12}>
    <div className="action-buttons justify-content-end gap-2 align-items-end d-flex">
      {session?.user?.permissions?.includes('add-users') && (
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
      )}
      {session?.user?.permissions?.includes('sync-ldap') && (
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
      )}
      {session?.user?.is_admin == "1" && (
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
      )}
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

