import React, { ReactElement, useEffect, useState, useMemo, useCallback } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { Col, Row, Tab, Tabs, Modal, Button } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';
import '@assets/scss/tabs.scss';
import '@assets/scss/common.scss';

import { getUserById, getUserPermissions, GetCustomFields, GetModules, getParentUsers, updateUserStatus, GetCompanies } from '@utils/users';
import { getAllRoles } from '@utils/roles';
import { getAllGroups } from '@utils/groups';
import { ModuleSlug } from '@utils/Helper';
import SuccessfulModal from '@pages/partial/SuccessfulModal';

// Import partial components
import OverviewTab from './partials/OverviewTab';
import PermissionsTab from './partials/PermissionsTab';
import CustomFieldsTab from './partials/CustomFieldsTab';
import UserCallingAccess from './partials/UserCallingAccess';
import { User, Permission, Role, Group, Module } from '@typings/controlhub/users';

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
    const [isLoading, setIsLoading] = useState(true);

    // Fetch all static data (roles, groups, modules, companies) in parallel on mount
    useEffect(() => {
        const fetchStaticData = async () => {
            try {
                // Fetch all static data in parallel
                const [rolesData, groupsData] = await Promise.all([
                    getAllRoles(),
                    getAllGroups(),
                ]);

                if (rolesData) setRoles(rolesData);
                if (groupsData) setGroups(groupsData);
                // if (modulesData) setModules(modulesData);
                // if (companiesData) setDataCompanies(companiesData);
            } catch (error) {
                console.error('Error fetching static data:', error);
            }
        };

        fetchStaticData();
    }, []);

    // Fetch user-specific data in parallel when id changes
    useEffect(() => {
        if (!id) return;

        const fetchUserData = async () => {
            setIsLoading(true);
            try {
                // Fetch all user-specific data in parallel
                //userPermissionsData, parentUsersData
                const [userData, customFieldsData] = await Promise.all([
                    getUserById(id as string),
                    //getUserPermissions(id as string),
                    GetCustomFields(id as string),
                    //getParentUsers()
                ]);

                // Set user data
                if (userData) {
                    setCurrentUser(userData?.userData);
                    //setLinkedUsers(userData?.linkedUsers || []);
                    //setLinkedCompanies(userData?.linkedCompanies || []);
                }

                // Set permissions data
                // if (userPermissionsData) {
                //     setExtended(userPermissionsData?.extended_permissions?.map((p: any) => typeof p === 'string' ? Number.parseInt(p, 10) : p) || []);
                //     setBlocked(userPermissionsData?.blocked_permissions?.map((p: any) => typeof p === 'string' ? Number.parseInt(p, 10) : p) || []);
                //     setAllPermission(userPermissionsData?.role_excluded_permissions || []);
                //     setRolePermission(userPermissionsData?.rolePermissions || []);
                // }

                // Set custom fields
                if (customFieldsData) {
                    setCustomFields(customFieldsData);
                }

                // Set parent users
                // if (parentUsersData) {
                //     setParentUsers(parentUsersData);
                // }
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, [id]);

    // Memoized fetch functions for callbacks
    const fetchUser = useCallback(async () => {
        if (!id) return;
        try {
            // Fetch roles, groups, and user data in parallel
            const [rolesData, groupsData, userData] = await Promise.all([
                getAllRoles(),
                getAllGroups(),
                getUserById(id as string)
            ]);

            if (rolesData) setRoles(rolesData);
            if (groupsData) setGroups(groupsData);
            if (userData) {
                setCurrentUser(userData?.userData);
                setLinkedUsers(userData?.linkedUsers || []);
                setLinkedCompanies(userData?.linkedCompanies || []);
            }
        } catch (error) {
            console.error('Error fetching user:', error);
        }
    }, [id]);

    const fetchUserPermissions = useCallback(async () => {
        if (!id) return;
        try {
            const userPermissions = await getUserPermissions(id as string);
            if (userPermissions) {
                setExtended(userPermissions?.extended_permissions?.map((p: any) => typeof p === 'string' ? Number.parseInt(p, 10) : p) || []);
                setBlocked(userPermissions?.blocked_permissions?.map((p: any) => typeof p === 'string' ? Number.parseInt(p, 10) : p) || []);
                setAllPermission(userPermissions?.role_excluded_permissions || []);
                setRolePermission(userPermissions?.rolePermissions || []);
            }
        } catch (error) {
            console.error('Error fetching user permissions:', error);
        }
    }, [id]);

    const fetchCustomFields = useCallback(async () => {
        if (!id) return;
        try {
            const customFieldsData = await GetCustomFields(id as string);
            if (customFieldsData) {
                setCustomFields(customFieldsData);
            }
        } catch (error) {
            console.error('Error fetching custom fields:', error);
        }
    }, [id]);

    // Memoize filtered modules to avoid recalculation on every render
    const filteredModules = useMemo(() => {
        return modules.filter(module => {
            const moduleSlug = Object.values(ModuleSlug).find(slug => slug === module.slug);
            const hasPermission = moduleSlug && (
                session?.user?.permissions?.includes("view-" + moduleSlug) || 
                session?.user?.permissions?.includes(moduleSlug + "-services")
            );
            return hasPermission;
        });
    }, [modules, session?.user?.permissions]);

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

    const handleSuccess = useCallback((title: string, description: string) => {
        setSuccessModalTitle(title);
        setSuccessModalDescription(description);
        setTimeout(() => {
            setShowSuccessfulModal(true);
        }, 100);
    }, []);

    if (isLoading) {
        return (
            <React.Fragment>
                <BreadcrumbItem mainTitle="Controlhub" mainLink="/controlhub/users" subTitle="Users" />
                <Row>
                    <Col md={12} className="text-center py-5">
                        <div className="spinner-border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-3">Loading user data...</p>
                    </Col>
                </Row>
            </React.Fragment>
        );
    }

    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="Controlhub" mainLink="/controlhub/users" subTitle="Users" />

            <Row className="mb-3">
                <Col md={12}>
                    <Button
                        variant="outline-secondary"
                        onClick={() => router.push('/controlhub/users')}
                        className="d-flex align-items-center gap-2"
                    >
                        <ArrowLeft size={16} />
                        Back to Users
                    </Button>
                </Col>
            </Row>

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

                        {/* {session?.user?.is_admin && (session?.user?.permissions?.includes('extend-permission-users') || session?.user?.permissions?.includes('block-permission-users')) && (
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
                        )} */}

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
                        
                        {session?.user?.is_admin && (session?.user?.permissions?.includes('update-calling-access-users')) && (
                            <Tab eventKey="calling-access" title="Calling Access">
                                <UserCallingAccess userId={id as string} session={session} />
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
