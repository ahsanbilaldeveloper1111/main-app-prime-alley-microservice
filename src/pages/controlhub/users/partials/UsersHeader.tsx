import React from 'react';
import { Row, Col, Button } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import UsersFilters from '@components/filters/UsersFilters';
import { SyncBillingCompanies } from '@utils/users';
import { toast } from 'react-toastify';

interface UsersHeaderProps {
    currentFilters: any;
    handleFiltersChange: (filters: any) => void;
    handleExport: (exportType: string, filters: Record<string, any>) => void;
    syncLdapUsers: () => void;
}

const UsersHeader: React.FC<UsersHeaderProps> = ({
    currentFilters,
    handleFiltersChange,
    handleExport,
    syncLdapUsers
}) => {
    const { data: session } = useSession();

    const syncBillingCompanies = async () => {
        const response = await SyncBillingCompanies();
        if(response){
            toast.success('Billing companies synced successfully');
        }
    }

    return (
        <Row className="mb-3">
            <Col md={12}>
                <div className="page-header-title style-2">
                    <Row className="d-flex justify-content-between align-items-center">
                        <Col md={3}>
                            <h2 className="mb-0">Users Directory</h2>
                        </Col>
                        <Col md={9} className="d-flex justify-content-end">
                            <div className="action-buttons">
                                {/* <div className="search-container">
                                    <i className="fas fa-search search-icon"></i>
                                    <input 
                                        type="text" 
                                        className="search-bar" 
                                        placeholder="Search users..." 
                                        onChange={(e) => handleFiltersChange({...currentFilters, search: e.target.value})}
                                    />
                                </div> */}
                                {/* <UsersFilters onFiltersChange={handleFiltersChange} onExport={handleExport} /> */}
                                {session?.user?.permissions?.includes('sync-ldap') && (
                                    <Button variant="primary" onClick={() => syncLdapUsers()}>
                                        Sync Users
                                    </Button>
                                )}

{session?.user?.is_admin == "1" && (
                                    <Button variant="danger" onClick={() => syncBillingCompanies()}>
                                        Sync Billing Companies
                                    </Button>
                                )}

                            </div>
                        </Col>
                    </Row>
                </div>
            </Col>
        </Row>
    );
};

export default UsersHeader;

