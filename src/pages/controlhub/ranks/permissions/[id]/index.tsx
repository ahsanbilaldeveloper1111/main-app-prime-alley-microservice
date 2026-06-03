import React,{ReactElement, useEffect, useState} from 'react'
import Layout from '@layout/index'
import BreadcrumbItem from '@common/BreadcrumbItem'
import { Button, Card, Col, Form, Row, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { useRouter } from 'next/router'
import { viewRank } from '@utils/roles'
import { MAIN_SETTINGS_RANKS_AND_PERMISSIONS_PATH } from '@utils/controlhub/usersNavigation'
import { ArrowLeft } from 'lucide-react'
import '@assets/scss/common.scss';
import '@page-modules/controlhub/ranks/rankPermissionsPage.scss';
import { RankPermissionsFilterPanel } from '@page-modules/controlhub/ranks/RankPermissionsFilterPanel';

interface Permission {
    id: number;
    name: string;
    key: string;
    enabled: boolean;
    description: string;
    module_id: number;
    is_special: string;
    severity_level?: string;
}

interface PermissionGroup {
    group: string;
    enableAll: boolean;
    permissions: Permission[];
}

// Helper function to get badge class based on severity level
const getSeverityBadgeClass = (severityLevel: string): string => {
    const level = severityLevel?.toLowerCase();
    switch (level) {
        case 'low':
            return 'info';
        case 'medium':
            return 'primary';
        case 'high':
            return 'warning';
        case 'critical':
            return 'danger';
        default:
            return 'primary';
    }
};

const ViewRolePermission = () => {

    const router = useRouter();
    const { id } = router.query;

    const [roleName,setRoleName] = useState<string>('');
    const [rolePermissions,setRolePermissions] = useState<PermissionGroup[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedAction, setSelectedAction] = useState<string>('all');
    const [selectedSeverityLevel, setSelectedSeverityLevel] = useState<string>('');

    useEffect(() => {
        if (!router.isReady || id == null) return;
        void fetchRole();
    }, [router.isReady, id]);

    const fetchRole = async () => {
        const role = await viewRank(id);
        if (!role || typeof role !== "object") return;
        setRoleName(role.name);
        setRolePermissions(role.permissions);
    }

    // Filter permissions based on search term, action filter, and severity level
    const filteredPermissions = rolePermissions.filter((group: PermissionGroup) => {
        const groupMatches = group.group.toLowerCase().includes(searchTerm.toLowerCase());
        const permissionMatches = group.permissions.some((perm: Permission) => {
            const matchesSearch = perm.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesAction = selectedAction === 'all' || 
                perm.name.toLowerCase().includes(selectedAction.toLowerCase());
            const matchesSeverity = selectedSeverityLevel === '' || 
                perm.severity_level?.toLowerCase() === selectedSeverityLevel.toLowerCase();
            return matchesSearch && matchesAction && matchesSeverity;
        });
        return groupMatches || permissionMatches;
    }).map((group: PermissionGroup) => ({
        ...group,
        permissions: group.permissions.filter((perm: Permission) => {
            const matchesSearch = perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                group.group.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesAction = selectedAction === 'all' || 
                perm.name.toLowerCase().includes(selectedAction.toLowerCase());
            const matchesSeverity = selectedSeverityLevel === '' || 
                perm.severity_level?.toLowerCase() === selectedSeverityLevel.toLowerCase();
            return matchesSearch && matchesAction && matchesSeverity;
        })
    }));

    // Separate permissions into special and non-special
    const separatePermissions = (group: PermissionGroup) => {
        const nonSpecialPermissions = group.permissions.filter(perm => perm.is_special === "0");
        const specialPermissions = group.permissions.filter(perm => perm.is_special === "1");
        
        return { nonSpecialPermissions, specialPermissions };
    };

    return (
        <div className="rank-permissions-page">
            <BreadcrumbItem
                mainTitle="Controlhub"
                mainLink={MAIN_SETTINGS_RANKS_AND_PERMISSIONS_PATH}
                subTitle="Permissions"
            />

            <Row className="rank-permissions-page__back">
                <Col md={12}>
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => router.push(MAIN_SETTINGS_RANKS_AND_PERMISSIONS_PATH)}
                        className="d-flex align-items-center gap-2"
                    >
                        <ArrowLeft size={16} />
                        Back to Ranks
                    </Button>
                </Col>
            </Row>

            <Row className="rank-permissions-page__header">
            <Col md={12}>
                <div className="page-header-title style-2">
                <Row className="rank-permissions-page__header-row g-2 align-items-lg-center">
                    <Col xs={12} lg={8} className="min-w-0">
                      <h2 className="mb-0 rank-permissions-page__title">
                        <span className="rank-permissions-page__title-lead">View permission for </span>
                        <span className="rank-permissions-page__title-name text-primary">{roleName}</span>
                      </h2>
                    </Col>
                    <Col xs={12} lg={4} className="min-w-0">
                    <div className="action-buttons rank-permissions-page__header-actions">
                    <div className="search-container">
                            <i className="fas fa-search search-icon"></i>
                            <input type="text" className="search-bar" placeholder="Search permissions..." onChange={(e) => setSearchTerm(e.target.value)}/>
                        </div>
                    
                    </div>



                    </Col>
                  </Row>
                </div>
            </Col>
            </Row>

            <Row className="rank-permissions-page__filters g-2 align-items-lg-end">
                <Col xs={12} lg={6}>
                    <RankPermissionsFilterPanel label="Filter by action" ariaLabel="Filter by action">
                        <Button
                            variant={selectedAction === 'all' ? 'primary' : 'outline-primary'}
                            size="sm"
                            onClick={() => setSelectedAction('all')}
                        >
                            All
                        </Button>
                        <Button
                            variant={selectedAction === 'view' ? 'primary' : 'outline-primary'}
                            size="sm"
                            onClick={() => setSelectedAction('view')}
                        >
                            View
                        </Button>
                        <Button
                            variant={selectedAction === 'add' ? 'primary' : 'outline-primary'}
                            size="sm"
                            onClick={() => setSelectedAction('add')}
                        >
                            Add
                        </Button>
                        <Button
                            variant={selectedAction === 'edit' ? 'primary' : 'outline-primary'}
                            size="sm"
                            onClick={() => setSelectedAction('edit')}
                        >
                            Edit
                        </Button>
                        <Button
                            variant={selectedAction === 'delete' ? 'primary' : 'outline-primary'}
                            size="sm"
                            onClick={() => setSelectedAction('delete')}
                        >
                            Delete
                        </Button>
                        <Button
                            variant={selectedAction === 'update' ? 'primary' : 'outline-primary'}
                            size="sm"
                            onClick={() => setSelectedAction('update')}
                        >
                            Update
                        </Button>
                    </RankPermissionsFilterPanel>
                </Col>
                <Col xs={12} lg={6} className="rank-permissions-page__filter-col--severity">
                    <RankPermissionsFilterPanel label="Severity level" ariaLabel="Filter by severity level">
                        <Button 
                            variant={selectedSeverityLevel === '' ? 'primary' : 'outline-primary'} 
                            size="sm" 
                            onClick={() => setSelectedSeverityLevel('')}
                        >
                            All
                        </Button>
                        <Button 
                            variant={selectedSeverityLevel === 'Low' ? 'info' : 'outline-info'} 
                            size="sm" 
                            onClick={() => setSelectedSeverityLevel('Low')}
                        >
                            Low
                        </Button>
                        <Button 
                            variant={selectedSeverityLevel === 'Medium' ? 'primary' : 'outline-primary'} 
                            size="sm" 
                            onClick={() => setSelectedSeverityLevel('Medium')}
                        >
                            Medium
                        </Button>
                        <Button 
                            variant={selectedSeverityLevel === 'High' ? 'warning' : 'outline-warning'} 
                            size="sm" 
                            onClick={() => setSelectedSeverityLevel('High')}
                        >
                            High
                        </Button>
                        <Button 
                            variant={selectedSeverityLevel === 'Critical' ? 'danger' : 'outline-danger'} 
                            size="sm" 
                            onClick={() => setSelectedSeverityLevel('Critical')}
                        >
                            Critical
                        </Button>
                    </RankPermissionsFilterPanel>
                </Col>
            </Row>

           

            <Row>
                  <Col md={12}>
                  {filteredPermissions?.some(group => group.permissions.some(perm => perm.enabled)) ? (
                        filteredPermissions.map((group: PermissionGroup) => {
                            const { nonSpecialPermissions, specialPermissions } = separatePermissions(group);
                            
                            return (
                                <React.Fragment key={group.group}>
                                    {group.permissions.some(perm => perm.enabled) && (
                                            <Card className="rank-permissions-page__group-card">
                                                <div className="roles-box">
                                                    <div className="roles-box-header">
                                                        <h6 className="mb-0">{group.group}</h6>
                                                    </div>

                                                    {/* Regular Permissions Section */}
                                                    {nonSpecialPermissions.length > 0 && (
                                                        <div className="roles-box__section">
                                                            <div className="row">
                                                                {nonSpecialPermissions
                                                                    .filter((perm: Permission) => perm.enabled)
                                                                    .map((perm: Permission) => (
                                                                    <div className="col-12 col-md-6 col-lg-4 rank-permissions-page__perm-col" key={perm.id}>
                                                                        <OverlayTrigger
                                                                            placement="top"
                                                                            overlay={<Tooltip id={`tooltip-regular-${perm.id}`}>
                                                                                {perm?.description || 'No description available'}
                                                                            </Tooltip>}
                                                                        >
                                                                            <div className="rank-permissions-page__perm-item">
                                                                                <Form.Check
                                                                                    type="switch"
                                                                                    id={`regular-${perm.id}`}
                                                                                    label={perm.name}
                                                                                    readOnly
                                                                                    checked={perm.enabled}
                                                                                />
                                                                                {perm?.severity_level && perm?.severity_level !== "" && (
                                                                                    <div className="rank-permissions-page__perm-meta">
                                                                                    <span className={`status-badge ${getSeverityBadgeClass(perm.severity_level)} small`}>
                                                                                        {perm?.severity_level}
                                                                                    </span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </OverlayTrigger>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Special Permissions Section */}
                                                    {specialPermissions.length > 0 && (
                                                        <div className="roles-box__section">
                                                            <h6 className="text-warning rank-permissions-page__special-heading">
                                                                <i className="fas fa-star me-2" aria-hidden></i>
                                                                {" "}Special Permissions
                                                            </h6>
                                                            <div className="row">
                                                                {specialPermissions
                                                                    .filter((perm: Permission) => perm.enabled)
                                                                    .map((perm: Permission) => (
                                                                    <div className="col-12 col-md-6 col-lg-4 rank-permissions-page__perm-col" key={perm.id}>
                                                                        <OverlayTrigger
                                                                            placement="top"
                                                                            overlay={<Tooltip id={`tooltip-special-${perm.id}`}>
                                                                                {perm?.description || 'No description available'}
                                                                            </Tooltip>}
                                                                        >
                                                                            <div className="rank-permissions-page__perm-item">
                                                                                <Form.Check
                                                                                    type="switch"
                                                                                    id={`special-${perm.id}`}
                                                                                    label={perm.name}
                                                                                    readOnly
                                                                                    checked={perm.enabled}
                                                                                />
                                                                                {perm?.severity_level && perm?.severity_level !== "" && (
                                                                                    <div className="rank-permissions-page__perm-meta">
                                                                                    <span className={`status-badge ${getSeverityBadgeClass(perm.severity_level)} small`}>
                                                                                        {perm?.severity_level}
                                                                                    </span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </OverlayTrigger>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </Card>
                                    )}
                                </React.Fragment>
                            );
                        })
                    ) : (
                        <Card className="rank-permissions-page__empty text-center">
                            <div className="empty-state">
                                <i className="fas fa-lock fa-3x text-muted mb-3"></i>
                                <h5 className="text-muted">No Enabled Permissions Found</h5>
                                <p className="text-muted">This rank currently has no enabled permissions.</p>
                            </div>
                        </Card>
                    )}
                  </Col>
            </Row>
        </div>
    )
}
ViewRolePermission.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
  };
  
export default ViewRolePermission
