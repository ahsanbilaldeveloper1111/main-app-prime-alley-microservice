import React, { useState } from 'react';
import { Card, Col, Row, Button, Modal } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import Select, { MultiValue } from 'react-select';
import AsyncSelect from 'react-select/async';
import FormModal from '@pages/partial/FormModal';
import ConfirmModal from '@pages/partial/ConfirmModal';
import { User, SelectOption, Module } from '@typings/controlhub/users';
import { linkUsers, unlinkUsers, getParentUsers } from '@utils/users';
import { ModuleSlug } from '@utils/Helper';

interface LinkedUsersTabProps {
    linkedUsers: any[];
    parentUsers: User[];
    filteredModules: Module[];
    session: any;
    userId: string;
    onUserUpdate: () => void;
    onSuccess: (title: string, description: string) => void;
}

const LinkedUsersTab: React.FC<LinkedUsersTabProps> = ({
    linkedUsers,
    parentUsers,
    filteredModules,
    session,
    userId,
    onUserUpdate,
    onSuccess
}) => {
    const [showAddLinkedUserModal, setShowAddLinkedUserModal] = useState(false);
    const [showDeleteLinkedUserModal, setShowDeleteLinkedUserModal] = useState(false);
    const [showBulkDeleteLinkedUserModal, setShowBulkDeleteLinkedUserModal] = useState(false);
    const [deleteLinkedUserData, setDeleteLinkedUserData] = useState<{ delinkedUser: number, moduleId: number } | null>(null);
    const [selectedLinkedUsers, setSelectedLinkedUsers] = useState<string[]>([]);
    const [selectedParentUsers, setSelectedParentUsers] = useState<string[]>([]);
    const [selectedModules, setSelectedModules] = useState<string[]>([]);
    const [isParentUsersLoading, setIsParentUsersLoading] = useState(true);

    const handleCloseAddLinkedUserModal = () => {
        setShowAddLinkedUserModal(false);
        setSelectedParentUsers([]);
        setSelectedModules([]);
    };

    const handleLinkedUserChange = (selectedOptions: MultiValue<SelectOption>) => {
        const values = (selectedOptions || []).map((opt) => opt.value.toString());
        setSelectedParentUsers(values);
    };

    const handleModuleChange = (selectedOptions: MultiValue<{ value: string; label: string }>) => {
        const values = (selectedOptions || []).map((opt) => opt.value);
        if (values.includes('all')) {
            const allModuleIds = filteredModules.map(module => module.id.toString());
            setSelectedModules(allModuleIds);
        } else {
            setSelectedModules(values);
        }
    };

    const loadParentUserOptions = (inputValue: string): Promise<SelectOption[]> => {
        const trimmed = (inputValue || '').trim();
        if (trimmed.length < 2) {
            return Promise.resolve([]);
        }
        const ensureData = parentUsers.length === 0 && !isParentUsersLoading
            ? fetchParentUsers()
            : Promise.resolve();
        return ensureData.then(() => {
            const lower = trimmed.toLowerCase();
            const options = parentUsers
                .filter((user) => !linkedUsers.some((lu) => lu.id === user.id))
                .filter((user) =>
                    (user.name && user.name.toLowerCase().includes(lower)) ||
                    (user.username && user.username.toLowerCase().includes(lower)) ||
                    (user.email && user.email.toLowerCase().includes(lower))
                )
                .slice(0, 200)
                .map((user) => ({ value: user.id, label: `${user.name} (${user.username})` }));
            return options;
        });
    };

    const fetchParentUsers = async () => {
        setIsParentUsersLoading(true);
        const response = await getParentUsers();
        setIsParentUsersLoading(false);
        return response;
    };

    const handleSubmitAddLinkedUser = async () => {
        if (selectedParentUsers.length === 0) {
            toast.error('Please select at least one user to link');
            return;
        }

        if (selectedModules.length === 0) {
            toast.error('Please select at least one module');
            return;
        }

        const responses = await Promise.all(
            selectedParentUsers.flatMap((parentId) =>
                selectedModules.map((moduleId) => linkUsers(userId, parentId, moduleId))
            )
        );
        if (responses.every(Boolean)) {
            setShowAddLinkedUserModal(false);
            onUserUpdate();
            onSuccess('Linked Users Added', 'Selected users have been linked successfully');
        }
    };

    const handleCloseDeleteLinkedUserModal = () => {
        setShowDeleteLinkedUserModal(false);
        setDeleteLinkedUserData(null);
    };

    const handleDeleteLinkedUserClick = (delinkedUser: number, moduleId: number) => {
        setDeleteLinkedUserData({ delinkedUser, moduleId });
        setShowDeleteLinkedUserModal(true);
    };

    const handleLinkedUserCheckboxChange = (linkedUserId: string, isChecked: boolean) => {
        if (isChecked) {
            setSelectedLinkedUsers(prev => [...prev, linkedUserId]);
        } else {
            setSelectedLinkedUsers(prev => prev.filter(id => id !== linkedUserId));
        }
    };

    const handleSelectAllLinkedUsers = (isChecked: boolean) => {
        if (isChecked) {
            const allLinkedUserIds = linkedUsers?.map(linkedUser => `${linkedUser.linked_user.id}-${linkedUser.module.id}`) || [];
            setSelectedLinkedUsers(allLinkedUserIds);
        } else {
            setSelectedLinkedUsers([]);
        }
    };

    const handleBulkDeleteLinkedUsersClick = () => {
        if (selectedLinkedUsers.length === 0) {
            toast.error('Please select at least one linked user to delete');
            return;
        }
        setShowBulkDeleteLinkedUserModal(true);
    };

    const handleCloseBulkDeleteLinkedUserModal = () => {
        setShowBulkDeleteLinkedUserModal(false);
    };

    const handleDeleteLinkedUser = async () => {
        if (!deleteLinkedUserData) return;

        const response = await unlinkUsers(userId, deleteLinkedUserData.delinkedUser + "", deleteLinkedUserData.moduleId + "");
        if (response) {
            setShowDeleteLinkedUserModal(false);
            setDeleteLinkedUserData(null);
            onUserUpdate();
            onSuccess('User Unlinked', 'The user has been unlinked successfully');
        }
    };

    const handleBulkDeleteLinkedUsers = async () => {
        if (selectedLinkedUsers.length === 0) return;

        try {
            const deletePromises = selectedLinkedUsers.map(linkedUserId => {
                const [linkedUserIdValue, moduleId] = linkedUserId.split('-');
                return unlinkUsers(userId, linkedUserIdValue, moduleId);
            });

            const responses = await Promise.all(deletePromises);

            if (responses.every(Boolean)) {
                setShowBulkDeleteLinkedUserModal(false);
                setSelectedLinkedUsers([]);
                onUserUpdate();
                onSuccess('Linked Users Deleted', `${selectedLinkedUsers.length} linked user(s) have been unlinked successfully`);
            }
        } catch (error) {
            console.error('Error deleting linked users:', error);
            toast.error('Error deleting linked users');
        }
    };

    return (
        <>
            <Row>
                <Col md={12}>
                    <FormModal
                        show={showAddLinkedUserModal}
                        onHide={handleCloseAddLinkedUserModal}
                        title="Add Linked User"
                        desc="Please select the user and module to add a linked user."
                        formHtml={
                            <>
                                <div className="form-group">
                                    <label htmlFor="linkedUser">Select User</label>
                                    <AsyncSelect
                                        className="basic-single"
                                        classNamePrefix="select"
                                        cacheOptions
                                        defaultOptions={false}
                                        isClearable={true}
                                        isSearchable={true}
                                        isMulti={true}
                                        loadOptions={loadParentUserOptions as any}
                                        onChange={(opts) => handleLinkedUserChange(opts as MultiValue<SelectOption>)}
                                        name="users"
                                        value={selectedParentUsers.map((idStr) => {
                                            const u = parentUsers.find((pu) => pu.id.toString() === idStr);
                                            return u ? { value: u.id, label: `${u.name} (${u.username})` } : { value: Number(idStr), label: idStr };
                                        })}
                                        noOptionsMessage={() => 'Type at least 2 characters'}
                                        placeholder={'Type at least 2 characters to search users'}
                                    />
                                    <p className="text-muted mt-2 small">
                                        You must type at least two characters to begin searching, and selecting at least one user is required.
                                    </p>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="linkedUser">Select Module</label>
                                    <Select
                                        className="basic-single"
                                        classNamePrefix="select"
                                        isClearable={true}
                                        isSearchable={true}
                                        onChange={(opts) => handleModuleChange(opts as MultiValue<{ value: string; label: string }>)}
                                        name="module"
                                        isMulti={true}
                                        value={(() => {
                                            const allModuleIds = filteredModules.map(module => module.id.toString());
                                            const isAllSelected = allModuleIds.length > 0 && allModuleIds.every(id => selectedModules.includes(id));

                                            if (isAllSelected) {
                                                return [{ value: 'all', label: 'All Modules' }];
                                            } else {
                                                return filteredModules
                                                    .filter((m) => selectedModules.includes(m.id.toString()))
                                                    .map((m) => ({ value: m.id.toString(), label: `${m.name}` }));
                                            }
                                        })()}
                                        options={[
                                            { value: 'all', label: 'All Modules' },
                                            ...filteredModules.map((module) => ({
                                                value: module.id.toString(),
                                                label: `${module.name}`
                                            }))
                                        ]}
                                        placeholder="Select Module"
                                    />
                                    <p className="text-muted mt-2 small">
                                        Choose the module you want to associate with the selected user(s). At least one module can be selected per link action.
                                    </p>
                                </div>
                            </>
                        }
                        submitButtonText="Add Linked User"
                        cancelButtonText="Cancel"
                        onSubmit={handleSubmitAddLinkedUser}
                        onCancel={handleCloseAddLinkedUserModal}
                    />

                    <Card>
                        <Card.Body>
                            <h5 className="d-flex justify-content-between">
                                Linked Users
                                <div className="d-flex gap-2">
                                    {selectedLinkedUsers.length > 0 && session?.user?.is_admin && session?.user?.permissions?.includes('unlink-users') && (
                                        <Button variant="danger" className="app-button" size="sm" onClick={handleBulkDeleteLinkedUsersClick}>
                                            Unlink Selected ({selectedLinkedUsers.length})
                                        </Button>
                                    )}
                                    <Button variant="primary" className="app-button" size="sm" onClick={() => {
                                        setShowAddLinkedUserModal(true);
                                        setSelectedParentUsers([]);
                                        setSelectedModules([]);
                                    }}>Add Linked User</Button>
                                </div>
                            </h5>

                            <table className="table table-bordered">
                                <thead>
                                    <tr>
                                        <th>
                                            <input
                                                type="checkbox"
                                                checked={selectedLinkedUsers.length > 0 && selectedLinkedUsers.length === (linkedUsers?.length || 0)}
                                                onChange={(e) => handleSelectAllLinkedUsers(e.target.checked)}
                                            />
                                        </th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Department</th>
                                        <th>Company</th>
                                        <th>Module</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {linkedUsers && linkedUsers.length > 0 ? (
                                        linkedUsers.map((obj) => (
                                            <tr key={obj.id}>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedLinkedUsers.includes(`${obj?.linked_user?.id}-${obj?.module?.id}`)}
                                                        onChange={(e) => handleLinkedUserCheckboxChange(`${obj?.linked_user?.id}-${obj?.module?.id}`, e.target.checked)}
                                                    />
                                                </td>
                                                <td>{obj?.linked_user?.name}</td>
                                                <td>{obj?.linked_user?.email}</td>
                                                <td>{obj?.linked_user?.phone}</td>
                                                <td>{obj?.linked_user?.department}</td>
                                                <td>{obj?.linked_user?.company}</td>
                                                <td>
                                                    {obj?.module?.name}
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-2 justify-content-end">
                                                        {session?.user?.is_admin && session?.user?.permissions?.includes('unlink-users') && (
                                                            <Button size="sm" className="app-button" variant="danger" onClick={() => {
                                                                handleDeleteLinkedUserClick(obj?.linked_user?.id, obj?.module?.id);
                                                            }}>DeLink</Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={8} className="text-center">No linked users found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <ConfirmModal
                show={showDeleteLinkedUserModal}
                onHide={handleCloseDeleteLinkedUserModal}
                title="Unlink User"
                description="Are you sure you want to unlink this user from the module? This action cannot be undone."
                targetName="this user"
                confirmButtonText="Yes, Unlink"
                cancelButtonText="Cancel"
                onConfirm={handleDeleteLinkedUser}
                onCancel={handleCloseDeleteLinkedUserModal}
                confirmButtonVariant="danger"
                requireTextConfirmation={true}
                requiredConfirmationText="unlink"
                confirmationPlaceholder="Type 'unlink' to confirm"
                confirmationLabel="Confirmation Required"
            />

            <ConfirmModal
                show={showBulkDeleteLinkedUserModal}
                onHide={handleCloseBulkDeleteLinkedUserModal}
                title="Bulk Unlink Users"
                description="Are you sure you want to unlink {selectedLinkedUsers.length} selected user(s) from their modules? This action cannot be undone."
                targetName={`${selectedLinkedUsers.length} selected user(s)`}
                confirmButtonText="Yes, Unlink All"
                cancelButtonText="Cancel"
                onConfirm={handleBulkDeleteLinkedUsers}
                onCancel={handleCloseBulkDeleteLinkedUserModal}
                confirmButtonVariant="danger"
                requireTextConfirmation={true}
                requiredConfirmationText="unlink all"
                confirmationPlaceholder="Type 'unlink all' to confirm"
                confirmationLabel="Confirmation Required"
            />
        </>
    );
};

export default LinkedUsersTab;

