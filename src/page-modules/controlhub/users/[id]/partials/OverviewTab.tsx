import React, { useState } from 'react';
import { Card, Col, Row } from 'react-bootstrap';
import FormModal from '@components/page-partials/FormModal';
import Select from 'react-select';
import { User, Role, Group } from '@typings/controlhub/users';
import { assignRoleToUser, assignGroupToUser, MarkAsCompanyAdmin } from '@utils/users';
import RecentActivitiesTab from './RecentActivitiesTab';
import UserProfileTab from './UserProfileTab';
import OrganizationalHierarchyTab from './OrganizationalHierarchyTab';
import { getStorageImageUrl } from '@utils/imageUtils';

function buildRoleDropdownValue(
    updatedRole: string,
    roles: Role[],
): { value: number; label: string } | null {
    const role = roles.find((r) => r.id.toString() === updatedRole);
    if (role) {
        return { value: role.id, label: role.name };
    }
    return null;
}

function formatRoleDropdownOptionLabel(role: Role, showCompanyInLabel: boolean): string {
    if (showCompanyInLabel) {
        const companySuffix =
            role.company && role.company !== 'null' ? `(${role.company})` : '';
        if (companySuffix) {
            return `${role.name} ${companySuffix}`;
        }
    }
    return role.name;
}

function displayFieldOrNa(value: string | undefined): string {
    if (value === undefined || value === '' || value === 'N/A') {
        return 'N/A';
    }
    return value;
}

interface OverviewTabProps {
    currentUser: User | null;
    roles: Role[];
    groups: Group[];
    session: any;
    onUserUpdate: () => void;
    onSuccess: (title: string, description: string) => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
    currentUser,
    roles,
    groups,
    session,
    onUserUpdate,
    onSuccess
}) => {
    const [showChangeGroupModal, setShowChangeGroupModal] = useState(false);
    const [showChangeRoleModal, setShowChangeRoleModal] = useState(false);
    const [showChangeCompanyAdminModal, setShowChangeCompanyAdminModal] = useState(false);
    const [updatedGroup, setUpdatedGroup] = useState<string>('');
    const [updatedRole, setUpdatedRole] = useState<string>('');
    const [isCompanyAdmin, setIsCompanyAdmin] = useState<boolean>(false);

    const handleCloseChangeGroupModal = () => {
        setShowChangeGroupModal(false);
    };

    const handleSubmitChangeGroup = async () => {
        const response = await assignGroupToUser(currentUser?.id?.toString() || '', updatedGroup);
        if (response) {
            setShowChangeGroupModal(false);
            onSuccess('Group Changed', 'The group has been changed successfully');
            onUserUpdate();
        }
    };

    const handleCloseChangeRoleModal = () => {
        setShowChangeRoleModal(false);
    };

    const handleSubmitChangeRole = async () => {
        const assignRole = await assignRoleToUser(currentUser?.id?.toString() || '', updatedRole);
        if (assignRole) {
            setShowChangeRoleModal(false);
            onSuccess('Rank Changed', 'The rank has been changed successfully');
            onUserUpdate();
        }
    };

    const handleCloseChangeCompanyAdminModal = () => {
        setShowChangeCompanyAdminModal(false);
    };

    const handleSubmitChangeCompanyAdmin = async () => {
        const response = await MarkAsCompanyAdmin(currentUser?.id?.toString() || '', isCompanyAdmin);
        if (response) {
            setShowChangeCompanyAdminModal(false);
            onSuccess('Company Admin Changed', 'The company admin has been changed successfully');
            onUserUpdate();
        }
    };

    const [profilePicture, setProfilePicture] = useState<string>('');
    React.useEffect(() => {
        if (currentUser) {
            setUpdatedGroup(currentUser.group_id || '');
            setUpdatedRole(currentUser.role_id || '');
            setIsCompanyAdmin(currentUser.is_company_admin === "1");
            setProfilePicture(currentUser.profile?.profile_picture || '');
        }
    }, [currentUser]);

    const avatarContent = profilePicture ? (
        <img
            src={getStorageImageUrl(profilePicture) || ''}
            alt="Profile"
            className="img-fluid rounded-circle"
        />
    ) : (
        <div className="text">
            <i className="material-icons-two-tone">person</i>
        </div>
    );

    const isSessionAdmin = session?.user?.is_admin === '1';

    const roleSelectOptions = roles.map((role) => ({
        value: role.id,
        label: formatRoleDropdownOptionLabel(role, isSessionAdmin),
    }));

    const roleSelectValue =
        updatedRole === '' ? null : buildRoleDropdownValue(updatedRole, roles);

    return (
        <>
            <Row>
                <Col md={5}>
                    <Card>
                        <Card.Body className="overview-card">
                            <Row className="align-items-center">
                                <Col xs={3}>
                                    <div className="user-avatar">
                                        {avatarContent}
                                    </div>
                                </Col>
                                <Col xs={9}>
                                    <h4 className="text-white mb-1 text-capitalize">{currentUser?.name}</h4>
                                    <p className="text-white mb-0 text-opacity">User Name</p>
                                    <p className="text-white mb-2">{currentUser?.username}</p>
                                    <hr className="theme-hr" />
                                    <p className="text-white mb-0 text-opacity">Company</p>
                                    <p className="text-white mb-2">
                                        {displayFieldOrNa(currentUser?.company)}
                                    </p>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={7}>
                    <Card className="no-shadow">
                        <Card.Body>
                            <Row>
                                <Col md={6}>
                                    <p className="mb-0 small text-primary"><b>Status</b></p>
                                    <p className="mb-2 text-capitalize d-flex justify-content-between">
                                        {currentUser?.status}
                                        <span></span>
                                    </p>
                                    <p className="mb-0 small text-primary"><b>Department</b></p>
                                    <p className="mb-2 text-capitalize">
                                        {displayFieldOrNa(currentUser?.department)}
                                    </p>
                                    <p className="mb-0 small text-primary"><b>Extension</b></p>
                                    <p className="mb-0 text-capitalize">
                                        {displayFieldOrNa(currentUser?.phone)}
                                    </p>
                                </Col>
                                <Col md={6}>
                                    <p className="mb-0 small text-primary"><b>Rank</b></p>
                                    <p className="mb-2 text-capitalize d-flex justify-content-between">
                                        {currentUser?.role?.name || 'Rank not assigned'}
                                        {session?.user?.permissions?.includes('assign-rank-users') && (
                                            <button
                                                type="button"
                                                className="p-0 border-0 bg-transparent d-inline-flex align-items-center text-white"
                                                aria-label="Change rank"
                                                onClick={() => setShowChangeRoleModal(true)}
                                            >
                                                <i className="ti ti-edit" aria-hidden />
                                            </button>
                                        )}
                                    </p>
                                    <p className="mb-0 small text-primary"><b>Group</b></p>
                                    <p className="mb-2 text-capitalize d-flex justify-content-between">
                                        {currentUser?.group?.name || 'Group not assigned'}
                                        {session?.user?.permissions?.includes('assign-group-users') && (
                                            <button
                                                type="button"
                                                className="p-0 border-0 bg-transparent d-inline-flex align-items-center text-white"
                                                aria-label="Change group"
                                                onClick={() => setShowChangeGroupModal(true)}
                                            >
                                                <i className="ti ti-edit" aria-hidden />
                                            </button>
                                        )}
                                    </p>
                                    {session?.user?.permissions?.includes('mark-company-admin-users') && (
                                        <div>
                                            <p className="mb-0 small text-primary"><b>Company Admin</b></p>
                                            <p className="mb-0 text-capitalize d-flex justify-content-between">
                                                {currentUser?.is_company_admin === "1" ? "Yes" : "No"}
                                                <button
                                                    type="button"
                                                    className="p-0 border-0 bg-transparent d-inline-flex align-items-center text-white"
                                                    aria-label="Change company admin"
                                                    onClick={() => setShowChangeCompanyAdminModal(true)}
                                                >
                                                    <i className="ti ti-edit" aria-hidden />
                                                </button>
                                            </p>
                                        </div>
                                    )}
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <UserProfileTab
                profileData={null}
                profilePicturePreview={null}
                isLoadingProfile={false}
                session={session}
                currentUser={currentUser}
                onUserUpdate={onUserUpdate}
                onSuccess={onSuccess}
            />

            {/* Organizational Chart Section */}
            <OrganizationalHierarchyTab currentUser={currentUser} />

            <RecentActivitiesTab />

            <FormModal
                show={showChangeGroupModal}
                onHide={handleCloseChangeGroupModal}
                title="Change Group"
                desc="Please select the group to change"
                formHtml={
                    <div className="form-group">
                        <label htmlFor="group">Group</label>
                        <select className="form-control" id="group"
                            onChange={(e) => {
                                setUpdatedGroup(e.target.value);
                            }}
                            value={updatedGroup}>
                            <option value="">Select Group</option>
                            {groups.map((group) => (
                                <option
                                    key={group.id}
                                    value={group.id}>
                                    {group.name}
                                </option>
                            ))}
                        </select>
                        <p className="text-muted mt-2 small">Update the assigned group for a user to reflect their new group or permissions within the system</p>
                    </div>
                }
                submitButtonText="Change Group"
                cancelButtonText="Cancel"
                onSubmit={handleSubmitChangeGroup}
                onCancel={handleCloseChangeGroupModal}
            />

            <FormModal
                show={showChangeRoleModal}
                onHide={handleCloseChangeRoleModal}
                title="Change Rank"
                desc="Please select the rank to change"
                formHtml={
                    <div className="form-group">
                        <label htmlFor="role">Role</label>
                        <Select
                            className="basic-single"
                            classNamePrefix="select"
                            isClearable={true}
                            isSearchable={true}
                            onChange={(selectedOption: any) => {
                                setUpdatedRole(selectedOption ? selectedOption.value.toString() : '');
                            }}
                            value={roleSelectValue}
                            options={roleSelectOptions}
                            placeholder="Select Rank"
                        />
                        <p className="text-muted mt-2 small">Update the assigned rank for a user to reflect their new role or permissions within the system</p>
                    </div>
                }
                submitButtonText="Change Rank"
                cancelButtonText="Cancel"
                onSubmit={handleSubmitChangeRole}
                onCancel={handleCloseChangeRoleModal}
            />

            <FormModal
                show={showChangeCompanyAdminModal}
                onHide={handleCloseChangeCompanyAdminModal}
                title="Mark as Company Admin"
                desc="Please select the company admin to change"
                formHtml={
                    <div className="form-group">
                        <label htmlFor="companyAdmin">Mark as Company Admin</label>
                        <select className="form-control" id="companyAdmin"
                            onChange={(e) =>
                                setIsCompanyAdmin(e.target.value === "1")}
                            value={isCompanyAdmin ? "1" : "0"}>
                            <option value="1">Yes</option>
                            <option value="0">No</option>
                        </select>
                    </div>
                }
                submitButtonText="Mark as Company Admin"
                cancelButtonText="Cancel"
                onSubmit={handleSubmitChangeCompanyAdmin}
                onCancel={handleCloseChangeCompanyAdminModal}
            />

        </>
    );
};

export default OverviewTab;

