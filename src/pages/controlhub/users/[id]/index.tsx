import React, { ReactElement, useEffect, useState, useCallback, useMemo } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { Col, Row, Tab, Tabs, Modal, Button } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';
import '@assets/scss/tabs.scss';
import '@assets/scss/common.scss';

import { getUserById, updateUserStatus } from '@utils/users';
import { getAllRoles } from '@utils/roles';
import { getAllGroups } from '@utils/groups';
import SuccessfulModal from '@components/page-partials/SuccessfulModal';

import OverviewTab from "@page-modules/controlhub/users/[id]/partials/OverviewTab";
import UserCallingAccess from "@page-modules/controlhub/users/[id]/partials/UserCallingAccess";
import { User, Role, Group } from '@typings/controlhub/users';
import {
    DEFAULT_USERS_DIRECTORY_PATH,
    sanitizeReturnPath,
} from '@utils/controlhub/usersNavigation';

const UserView = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const { id, returnTo } = router.query;

    const usersListPath = useMemo(
        () => sanitizeReturnPath(returnTo, DEFAULT_USERS_DIRECTORY_PATH),
        [returnTo],
    );

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [roles, setRoles] = useState<Role[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [updatedStatus, setUpdatedStatus] = useState<string>('');
    const [showChangeStatusModal, setShowChangeStatusModal] = useState(false);
    const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);
    const [successModalTitle, setSuccessModalTitle] = useState('');
    const [successModalDescription, setSuccessModalDescription] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStaticData = async () => {
            try {
                const [rolesData, groupsData] = await Promise.all([
                    getAllRoles(),
                    getAllGroups(),
                ]);

                if (rolesData) setRoles(rolesData);
                if (groupsData) setGroups(groupsData);
            } catch (error) {
                console.error('Error fetching static data:', error);
            }
        };

        fetchStaticData();
    }, []);

    useEffect(() => {
        if (!id) return;

        const fetchUserData = async () => {
            setIsLoading(true);
            try {
                const userData = await getUserById(id as string);

                if (userData) {
                    setCurrentUser(userData?.userData);
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, [id]);

    const fetchUser = useCallback(async () => {
        if (!id) return;
        try {
            const [rolesData, groupsData, userData] = await Promise.all([
                getAllRoles(),
                getAllGroups(),
                getUserById(id as string)
            ]);

            if (rolesData) setRoles(rolesData);
            if (groupsData) setGroups(groupsData);
            if (userData) {
                setCurrentUser(userData?.userData);
            }
        } catch (error) {
            console.error('Error fetching user:', error);
        }
    }, [id]);

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
                <BreadcrumbItem mainTitle="Controlhub" mainLink={usersListPath} subTitle="Users" />
                <Row>
                    <Col md={12} className="text-center py-5">
                        <output aria-live="polite" className="d-block border-0 bg-transparent p-0">
                            <span className="d-inline-flex flex-column align-items-center gap-3">
                                <span className="spinner-border" aria-hidden />
                                <span>Loading user data...</span>
                            </span>
                        </output>
                    </Col>
                </Row>
            </React.Fragment>
        );
    }

    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="Controlhub" mainLink={usersListPath} subTitle="Users" />

            <Row className="mb-3">
                <Col md={12}>
                    <Button
                        variant="outline-secondary"
                        onClick={() => router.push(usersListPath)}
                        className="d-flex align-items-center gap-2"
                    >
                        <ArrowLeft size={16} aria-hidden />
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

                        {session?.user?.is_admin && (session?.user?.permissions?.includes('update-calling-access-users')) && (
                            <Tab eventKey="calling-access" title="Calling Access">
                                <UserCallingAccess userId={id as string} session={session} />
                            </Tab>
                        )}
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
