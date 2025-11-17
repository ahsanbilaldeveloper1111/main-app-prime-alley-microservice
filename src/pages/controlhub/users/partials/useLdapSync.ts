import { useState } from 'react';
import { SyncLdapUsers } from '@utils/users';

export const useLdapSync = () => {
    const [loadingLdapUsers, setLoadingLdapUsers] = useState(false);
    const [responseDataLdapUsers, setResponseDataLdapUsers] = useState<any>(null);
    const [showSyncLdapUsersModal, setShowSyncLdapUsersModal] = useState(false);
    const [errorLdapUsers, setErrorLdapUsers] = useState<any>(null);

    const handleCloseSyncLdapUsersModal = () => {
        setShowSyncLdapUsersModal(false);
    };

    const syncLdapUsers = async () => {
        try {
            console.log('Syncing LDAP users');
            setLoadingLdapUsers(true);
            setErrorLdapUsers(null);
            setShowSyncLdapUsersModal(true);

            const response = await SyncLdapUsers();
            if(response){
                console.log('Response fun:', response);
                setResponseDataLdapUsers(response);
                setLoadingLdapUsers(false);
            }
        } catch (error) {
            console.error(error);
            setLoadingLdapUsers(false);
        }
    };

    return {
        loadingLdapUsers,
        responseDataLdapUsers,
        showSyncLdapUsersModal,
        errorLdapUsers,
        handleCloseSyncLdapUsersModal,
        syncLdapUsers
    };
};

