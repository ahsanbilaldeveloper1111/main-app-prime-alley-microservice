import { useState } from 'react';

interface User {
    name: string;
    extension: string;
    lastLogin: string;
}

export const useUserModal = () => {
    const [showUserModal, setShowUserModal] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

    const openUserModal = (users: User[]) => {
        setSelectedUsers(users);
        setShowUserModal(true);
    };

    const closeUserModal = () => {
        setShowUserModal(false);
        setSelectedUsers([]);
    };

    return {
        showUserModal,
        selectedUsers,
        openUserModal,
        closeUserModal
    };
};

