import React, { ReactElement, useEffect, useState } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { Col, Row, Tab, Tabs, Modal, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import '@assets/scss/tabs.scss';
import '@assets/scss/common.scss';

import { getUserById, getUserPermissions, GetCustomFields, GetModules, getParentUsers, updateUserStatus } from '@utils/users';
import { getAllRoles } from '@utils/roles';
import { getAllGroups } from '@utils/groups';
import { ModuleSlug } from '@utils/Helper';
import SuccessfulModal from '@pages/partial/SuccessfulModal';

// Import partial components
import OverviewTab from './partials/OverviewTab';
import PermissionsTab from './partials/PermissionsTab';
import LinkedUsersTab from './partials/LinkedUsersTab';
import CustomFieldsTab from './partials/CustomFieldsTab';
import LinkedCompaniesTab from './partials/LinkedCompaniesTab';
import { User, Permission, Role, Group, Module } from '@typings/controlhub/users';
import { GetCompanies } from '@utils/users';

const UserView = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const { id } = router.query;

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [linkedUsers, setLinkedUsers] = useState<any[]>([]);
    const [linkedCompanies, setLinkedCompanies] = useState<any[]>([]);
    const [dataCompanies, setDataCompanies] = useState<any[]>([]);
    const [customFields, setCustomFields] = useState<any[]>([]);
    const [allPermission, setAllPermission] = useState<Permission[]>([]);
    const [extended, setExtended] = useState<number[]>([]);
    const [blocked, setBlocked] = useState<number[]>([]);
    const [rolePermission, setRolePermission] = useState<Permission[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [modules, setModules] = useState<Module[]>([]);
    const [parentUsers, setParentUsers] = useState<User[]>([]);
    const [updatedStatus, setUpdatedStatus] = useState<string>('');
    const [showChangeStatusModal, setShowChangeStatusModal] = useState(false);
    const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);
    const [successModalTitle, setSuccessModalTitle] = useState('');
    const [successModalDescription, setSuccessModalDescription] = useState('');

    useEffect(() => {
        fetchDataCompanies();
    }, []);

    const fetchDataCompanies = async () => {
        const response = await GetCompanies();
        if (response) {
            setDataCompanies(response);
        }
    };

    useEffect(() => {
        if (id) {
            fetchUser();
            fetchUserPermissions();
            fetchCustomFields();
        }
    }, [id]);

    const fetchUser = async () => {
        await fetchRoles();
        await fetchGroups();
        const getUser = await getUserById(id as string);
        setCurrentUser(getUser?.userData);
        setLinkedUsers(getUser?.linkedUsers);
        setLinkedCompanies(getUser?.linkedCompanies);
    };

    const fetchCustomFields = async () => {
        const customFields = await GetCustomFields(id as string);
        setCustomFields(customFields);
    };

    const fetchUserPermissions = async () => {
        const userPermissions = await getUserPermissions(id as string);
        if (userPermissions) {
            setExtended(userPermissions?.extended_permissions?.map((p: any) => typeof p === 'string' ? parseInt(p) : p) || []);
            setBlocked(userPermissions?.blocked_permissions?.map((p: any) => typeof p === 'string' ? parseInt(p) : p) || []);
            setAllPermission(userPermissions?.role_excluded_permissions || []);
            setRolePermission(userPermissions?.rolePermissions || []);
        }
    };

    const fetchRoles = async () => {
        const roles = await getAllRoles();
        setRoles(roles);
    };

    const fetchGroups = async () => {
        const groups = await getAllGroups();
        setGroups(groups);
    };

    const fetchModules = async () => {
        const response = await GetModules();
        if (response) {
            setModules(response);
        }
    };

    useEffect(() => {
        fetchModules();
    }, []);

    useEffect(() => {
        if (id) {
            fetchParentUsers();
        }
    }, [id]);

    const fetchParentUsers = async () => {
        const response = await getParentUsers();
        if (response) {
            setParentUsers(response);
        }
    };

    // Filter modules based on user permissions
    const filteredModules = modules.filter(module => {
        const moduleSlug = Object.values(ModuleSlug).find(slug => slug === module.slug);
        const hasPermission = moduleSlug && session?.user?.permissions?.includes("view-" + moduleSlug) || moduleSlug && session?.user?.permissions?.includes(moduleSlug + "-services") || moduleSlug && session?.user?.permissions?.includes(moduleSlug + "-services");
        return hasPermission;
    });

    const handleCloseChangeStatusModal = () => {
        setShowChangeStatusModal(false);
    };

    const handleSubmitChangeStatus = async () => {
        const response = await updateUserStatus(id as string, updatedStatus);
        if (response) {
            setShowChangeStatusModal(false);
            fetchUser();
        }
    };

    const handleSuccess = (title: string, description: string) => {
        setSuccessModalTitle(title);
        setSuccessModalDescription(description);
        setTimeout(() => {
            setShowSuccessfulModal(true);
        }, 100);
    };

    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="Controlhub" mainLink="/controlhub/users" subTitle="Users" />

            {showChangeStatusModal && (
                <Modal show={showChangeStatusModal} onHide={handleCloseChangeStatusModal}>
                    <Modal.Header closeButton>
                        <Modal.Title>Change Status</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="form-group">
                            <label htmlFor="status">Status</label>
                            <select className="form-control" id="status"
                                onChange={(e) => {
                                    setUpdatedStatus(e.target.value);
                                }}>
                                <option value="">Select Status</option>
                                <option value="Active" selected={currentUser?.status === "Active"}>Active</option>
                                <option value="Inactive" selected={currentUser?.status === "Inactive"}>Inactive</option>
                            </select>
                            <p className="text-muted mt-2 small">Update the status of a user to reflect their current active or inactive status within the system</p>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseChangeStatusModal}>
                            Close
                        </Button>
                        <Button variant="primary" onClick={handleSubmitChangeStatus}>
                            Change Status
                        </Button>
                    </Modal.Footer>
                </Modal>
            )}

            <Row>
                <Col md={12}>
                    <Tabs
                        defaultActiveKey="overview"
                        id="system-tabs"
                        className="mb-3"
                    >
                        <Tab eventKey="overview" title="Overview">
                            <OverviewTab
                                currentUser={currentUser}
                                roles={roles}
                                groups={groups}
                                session={session}
                                onUserUpdate={fetchUser}
                                onSuccess={handleSuccess}
                            />
                        </Tab>

                        {session?.user?.is_admin && (session?.user?.permissions?.includes('extend-permission-users') || session?.user?.permissions?.includes('block-permission-users')) && (
                            <Tab eventKey="permissions" title="Permissions">
                                <PermissionsTab
                                    allPermission={allPermission}
                                    rolePermission={rolePermission}
                                    extended={extended}
                                    blocked={blocked}
                                    session={session}
                                    userId={id as string}
                                    onPermissionsUpdate={fetchUserPermissions}
                                />
                            </Tab>
                        )}

                        {/* {session?.user?.is_admin && (session?.user?.permissions?.includes('link-users') || session?.user?.permissions?.includes('unlink-users')) && (
                            <Tab eventKey="linked-users" title="Linked Users">
                                <LinkedUsersTab
                                    linkedUsers={linkedUsers}
                                    parentUsers={parentUsers}
                                    filteredModules={filteredModules}
                                    session={session}
                                    userId={id as string}
                                    onUserUpdate={fetchUser}
                                    onSuccess={handleSuccess}
                                />
                            </Tab>
                        )} */}

                        {session?.user?.is_admin && (session?.user?.permissions?.includes('custom-field-users') || session?.user?.permissions?.includes('add-custom-field-users') || session?.user?.permissions?.includes('edit-custom-field-users') || session?.user?.permissions?.includes('delete-custom-field-users') || session?.user?.permissions?.includes('update-custom-field-users')) && (
                            <Tab eventKey="custom-fields-users" title="Custom Fields">
                                <CustomFieldsTab
                                    customFields={customFields}
                                    session={session}
                                    userId={id as string}
                                    onCustomFieldsUpdate={fetchCustomFields}
                                    onSuccess={handleSuccess}
                                />
                            </Tab>
                        )}

                        {/* {(session?.user?.permissions?.includes('company-link-users') || session?.user?.permissions?.includes('company-unlink-users')) && (
                            <Tab eventKey="linked-companies" title="Linked Companies">
                                <LinkedCompaniesTab
                                    linkedCompanies={linkedCompanies}
                                    dataCompanies={dataCompanies}
                                    filteredModules={filteredModules}
                                    session={session}
                                    userId={id as string}
                                    onUserUpdate={fetchUser}
                                    onSuccess={handleSuccess}
                                />
                            </Tab>
                        )} */}
                    </Tabs>
                </Col>
            </Row>

            <SuccessfulModal
                show={showSuccessfulModal}
                onHide={() => setShowSuccessfulModal(false)}
                title={successModalTitle}
                description={successModalDescription}
            />
        </React.Fragment>
    );
};

UserView.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default UserView;
