import React, { useState } from 'react';
import { Card, Col, Row, Button } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import FormModal from '@pages/partial/FormModal';
import Select from 'react-select';
import { User, Role, Group } from './types';
import { assignRoleToUser, assignGroupToUser, MarkAsCompanyAdmin } from '@utils/users';
import { getAllRoles } from '@utils/roles';
import { getAllGroups } from '@utils/groups';

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

    React.useEffect(() => {
        if (currentUser) {
            setUpdatedGroup(currentUser.group_id || '');
            setUpdatedRole(currentUser.role_id || '');
            setIsCompanyAdmin(currentUser.is_company_admin === "1");
        }
    }, [currentUser]);

    return (
        <>
            <Row>
                <Col md={5}>
                    <Card>
                        <Card.Body className="overview-card">
                            <Row className="align-items-center">
                                <Col md={3}>
                                    <div className="user-avatar">
                                        <div className="text">
                                            <i className="material-icons-two-tone">person</i>
                                        </div>
                                    </div>
                                </Col>
                                <Col md={9}>
                                    <h4 className="text-white mb-1 text-capitalize">{currentUser?.name}</h4>
                                    <p className="text-white mb-0 text-opacity">User Name</p>
                                    <p className="text-white mb-2">{currentUser?.username}</p>
                                    <hr className="theme-hr" />
                                    <p className="text-white mb-0 text-opacity">Company</p>
                                    <p className="text-white mb-2">
                                        {currentUser?.company && currentUser?.company !== 'N/A' ? currentUser?.company : 'N/A'}
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
                                        {currentUser?.department && currentUser?.department !== 'N/A' ? currentUser?.department : 'N/A'}
                                    </p>
                                    <p className="mb-0 small text-primary"><b>Extension</b></p>
                                    <p className="mb-0 text-capitalize">
                                        {currentUser?.phone && currentUser?.phone !== 'N/A' ? currentUser?.phone : 'N/A'}
                                    </p>
                                </Col>
                                <Col md={6}>
                                    <p className="mb-0 small text-primary"><b>Rank</b></p>
                                    <p className="mb-2 text-capitalize d-flex justify-content-between">
                                        {currentUser?.role?.name || 'Rank not assigned'}
                                        <span>
                                            <i className="ti ti-edit" onClick={() => {
                                                setShowChangeRoleModal(true);
                                            }} style={{ cursor: 'pointer' }}></i>
                                        </span>
                                    </p>
                                    <p className="mb-0 small text-primary"><b>Group</b></p>
                                    <p className="mb-2 text-capitalize d-flex justify-content-between">
                                        {currentUser?.group?.name || 'Group not assigned'}
                                        <span>
                                            <i className="ti ti-edit" onClick={() => {
                                                setShowChangeGroupModal(true);
                                            }} style={{ cursor: 'pointer' }}></i>
                                        </span>
                                    </p>
                                    {session?.user?.permissions?.includes('mark-company-admin-users') && (
                                        <div>
                                            <p className="mb-0 small text-primary"><b>Company Admin</b></p>
                                            <p className="mb-0 text-capitalize d-flex justify-content-between">
                                                {currentUser?.is_company_admin === "1" ? "Yes" : "No"}
                                                <span>
                                                    <i className="ti ti-edit" onClick={() => {
                                                        setShowChangeCompanyAdminModal(true);
                                                    }} style={{ cursor: 'pointer' }}></i>
                                                </span>
                                            </p>
                                        </div>
                                    )}
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col md={12}>
                    <Card>
                        <Card.Header>
                            <h5>Recent Activities</h5>
                        </Card.Header>
                        <Card.Body>
                            <Row className="recent-activity">
                                <Col md={1} className="d-flex align-items-center justify-content-center">
                                    <div className="ico">
                                        <i className="ti ti-history"></i>
                                    </div>
                                </Col>
                                <Col md={10} className="d-flex align-items-center">
                                    <div className="info">
                                        <h6>Login to platform</h6>
                                        <p className="mb-2 small">
                                            <span className=""><b>Date: </b> </span>
                                            <span className="text-muted me-4">23 Aug 2024</span>
                                            <span className=""><b>Time: </b> </span>
                                            <span className="text-muted me-4">12:00:00</span>
                                            <span className=""><b>Device: </b> </span>
                                            <span className="text-muted me-4">MacBook Pro</span>
                                            <span className=""><b>Browser: </b> </span>
                                            <span className="text-muted me-4">Chrome</span>
                                        </p>
                                    </div>
                                </Col>
                                <Col md={1} className="d-flex align-items-center justify-content-end">
                                    <i className="ph-duotone ph-dots-three-outline-vertical"></i>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <FormModal
                show={showChangeGroupModal}
                onHide={handleCloseChangeGroupModal}
                title="Change Group"
                desc="Please select the group to change"
                formHtml={
                    <>
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
                    </>
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
                    <>
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
                                value={roles.find(role => role.id.toString() === updatedRole) ? {
                                    value: updatedRole,
                                    label: session?.user?.is_admin === "1"
                                        ? `${roles.find(role => role.id.toString() === updatedRole)?.name}`
                                        : roles.find(role => role.id.toString() === updatedRole)?.name
                                } : null}
                                options={roles.map((role) => ({
                                    value: role.id,
                                    label: session?.user?.is_admin === "1"
                                        ? `${role.name} ${role.company && role.company !== 'null' ? '(' + role.company + ')' : ''}`
                                        : role.name
                                }))}
                                placeholder="Select Rank"
                            />
                            <p className="text-muted mt-2 small">Update the assigned rank for a user to reflect their new role or permissions within the system</p>
                        </div>
                    </>
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
                    <>
                        <div className="form-group">
                            <label htmlFor="companyAdmin">Mark as Company Admin</label>
                            <select className="form-control" id="companyAdmin"
                                onChange={(e) =>
                                    setIsCompanyAdmin(e.target.value === "1")}
                                value={isCompanyAdmin ? "1" : "0"}>
                                <option value="1" selected={isCompanyAdmin === true}>Yes</option>
                                <option value="0" selected={isCompanyAdmin === false}>No</option>
                            </select>
                        </div>
                    </>
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

