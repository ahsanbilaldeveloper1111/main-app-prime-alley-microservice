import React, { useState } from 'react';
import { Card, Col, Row, Button, Tabs, Tab } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import { Permission } from './types';
import { UpdateExtendedPermission, UpdateBlockedPermission } from '@utils/users';

interface PermissionsTabProps {
    allPermission: Permission[];
    rolePermission: Permission[];
    extended: number[];
    blocked: number[];
    session: any;
    userId: string;
    onPermissionsUpdate: () => void;
}

const PermissionsTab: React.FC<PermissionsTabProps> = ({
    allPermission,
    rolePermission,
    extended,
    blocked,
    session,
    userId,
    onPermissionsUpdate
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchTermBlocked, setSearchTermBlocked] = useState('');
    const [extendedState, setExtendedState] = useState<number[]>(extended);
    const [blockedState, setBlockedState] = useState<number[]>(blocked);

    React.useEffect(() => {
        setExtendedState(extended);
        setBlockedState(blocked);
    }, [extended, blocked]);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value.toLowerCase());
    };

    const handleSearchChangeBlocked = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTermBlocked(event.target.value.toLowerCase());
    };

    const toggleExtendedPermission = (perm: number) => {
        setExtendedState((prev) => {
            const newState = prev.includes(perm)
                ? prev.filter((p) => p !== perm)
                : [...prev, perm];
            return newState;
        });
    };

    const updateExtendedPermissions = async () => {
        const response = await UpdateExtendedPermission(userId, extendedState.map(p => p.toString()));
        if (response) {
            onPermissionsUpdate();
        }
    };

    const toggleBlockedPermission = (perm: number) => {
        setBlockedState((prev) => {
            const newState = prev.includes(perm)
                ? prev.filter((p) => p !== perm)
                : [...prev, perm];
            return newState;
        });
    };

    const updateBlockedPermissions = async () => {
        const response = await UpdateBlockedPermission(userId, blockedState.map(p => p.toString()));
        if (response) {
            onPermissionsUpdate();
        }
    };

    return (
        <Tabs
            defaultActiveKey="extended"
            id="system-tabs"
            className="mb-3 justify-content-center"
        >
            {session?.user?.is_admin && session?.user?.permissions?.includes('extend-permission-users') && (
                <Tab eventKey="extended" title="Extended Permissions">
                    <Row>
                        <Col md={12}>
                            <Card>
                                <Card.Header className="p-3">
                                    <Row className="d-flex justify-content-between align-items-center">
                                        <Col md={6}>
                                            <h5 className="text-capitalize app-title-heading text-primary">
                                                Extended Permissions
                                            </h5>
                                        </Col>
                                        <Col md={6}>
                                            <input
                                                type="text"
                                                className="form-control mb-1"
                                                placeholder="Search permissions..."
                                                value={searchTerm}
                                                onChange={handleSearchChange}
                                            />
                                        </Col>
                                    </Row>
                                </Card.Header>
                                <Card.Body>
                                    <div className="permissions-box">
                                        <div className="mb-2">
                                            {allPermission && allPermission.length > 0 ? (
                                                (() => {
                                                    const filteredPermissions = allPermission.filter((perm) =>
                                                        perm && perm.name.toLowerCase().includes(searchTerm.toLowerCase())
                                                    );

                                                    const groupedPermissions = filteredPermissions.reduce((groups, perm) => {
                                                        const moduleId = perm.module_name || 'Other';
                                                        if (!groups[moduleId]) {
                                                            groups[moduleId] = [];
                                                        }
                                                        groups[moduleId].push(perm);
                                                        return groups;
                                                    }, {} as Record<string, any[]>);

                                                    return Object.entries(groupedPermissions).map(([moduleId, permissions]) => (
                                                        <div key={moduleId} className="mb-4">
                                                            <h5 className="mb-3 text-primary border-bottom pb-2">
                                                                {moduleId === 'Other' ? 'Other Permissions' : `${moduleId}`}
                                                            </h5>
                                                            <Row className="g-3">
                                                                {permissions.map((perm) => (
                                                                    <Col key={perm.id} md={6} lg={4} className="d-flex align-items-center justify-content-between">
                                                                        <div className="form-check form-switch">
                                                                            <input className="form-check-input" type="checkbox" id={`permission-${perm.id}`} checked={extendedState.includes(perm.id)} onChange={() => toggleExtendedPermission(perm.id)} />
                                                                        </div>
                                                                        <div className="flex-grow-1">
                                                                            <h6 className="mb-1">{perm.name}</h6>
                                                                        </div>
                                                                    </Col>
                                                                ))}
                                                            </Row>
                                                        </div>
                                                    ));
                                                })()
                                            ) : (
                                                <Row>
                                                    <Col md={12}>
                                                        <Card>
                                                            <Card.Body className="text-center text-muted">
                                                                No permissions available
                                                            </Card.Body>
                                                        </Card>
                                                    </Col>
                                                </Row>
                                            )}
                                        </div>
                                        <div className="d-flex justify-content-end sticky-bottom bg-white p-3 border-top" style={{ position: 'sticky', bottom: 0, zIndex: 10 }}>
                                            <Button variant="primary" className="app-button" onClick={updateExtendedPermissions}>Update Extended Permissions</Button>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Tab>
            )}

            {session?.user?.is_admin && session?.user?.permissions?.includes('block-permission-users') && (
                <Tab eventKey="blocked" title="Blocked Permissions">
                    <Row>
                        <Col md={12}>
                            <Card>
                                <Card.Header className="p-3">
                                    <Row className="d-flex justify-content-between align-items-center">
                                        <Col md={6}>
                                            <h5 className="text-capitalize app-title-heading text-danger">
                                                Blocked Permissions
                                            </h5>
                                        </Col>
                                        <Col md={6}>
                                            <input
                                                type="text"
                                                className="form-control mb-1"
                                                placeholder="Search permissions..."
                                                value={searchTermBlocked}
                                                onChange={handleSearchChangeBlocked}
                                            />
                                        </Col>
                                    </Row>
                                </Card.Header>
                                <Card.Body>
                                    <div className="permissions-box">
                                        <div className="mb-2">
                                            {rolePermission && rolePermission.length > 0 ? (
                                                (() => {
                                                    const filteredPermissions = rolePermission.filter((perm) =>
                                                        perm && perm.name && perm.name.toLowerCase().includes(searchTermBlocked.toLowerCase())
                                                    );

                                                    const groupedPermissions = filteredPermissions.reduce((groups, perm) => {
                                                        const moduleId = perm.module_name || 'Other';
                                                        if (!groups[moduleId]) {
                                                            groups[moduleId] = [];
                                                        }
                                                        groups[moduleId].push(perm);
                                                        return groups;
                                                    }, {} as Record<string, any[]>);

                                                    return Object.entries(groupedPermissions).map(([moduleId, permissions]) => (
                                                        <div key={moduleId} className="mb-4">
                                                            <h5 className="mb-3 text-danger border-bottom pb-2">
                                                                {moduleId === 'Other' ? 'Other Permissions' : `${moduleId}`}
                                                            </h5>
                                                            <Row className="g-3">
                                                                {permissions.map((perm) => (
                                                                    <Col key={perm.id} md={6} lg={4} className="d-flex align-items-center justify-content-between">
                                                                        <div className="form-check form-switch">
                                                                            <input className="form-check-input" type="checkbox" id={`blocked-permission-${perm.id}`} checked={blockedState.includes(perm.id)} onChange={() => toggleBlockedPermission(perm.id)} />
                                                                        </div>
                                                                        <div className="flex-grow-1">
                                                                            <h6 className="mb-1">{perm.name}</h6>
                                                                        </div>
                                                                    </Col>
                                                                ))}
                                                            </Row>
                                                        </div>
                                                    ));
                                                })()
                                            ) : (
                                                <Row>
                                                    <Col md={12}>
                                                        <Card>
                                                            <Card.Body className="text-center text-muted">
                                                                No permissions available
                                                            </Card.Body>
                                                        </Card>
                                                    </Col>
                                                </Row>
                                            )}
                                        </div>
                                        <div className="d-flex justify-content-end sticky-bottom bg-white p-3 border-top" style={{ position: 'sticky', bottom: 0, zIndex: 10 }}>
                                            <Button variant="danger" className="app-button" onClick={updateBlockedPermissions}>Update Blocked Permissions</Button>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Tab>
            )}
        </Tabs>
    );
};

export default PermissionsTab;

