import React,{ReactElement, useEffect, useState} from 'react'
import Layout from '@layout/index'
import BreadcrumbItem from '@common/BreadcrumbItem'
import { Button, Card, Col, Form, Row, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { useRouter } from 'next/router'
import { viewRank } from '@utils/roles'
import { ArrowLeft } from 'lucide-react'
import '@assets/scss/common.scss';

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

        <React.Fragment>
            <BreadcrumbItem mainTitle="Controlhub" mainLink="controlhub/roles" subTitle="Permissions"  />

            <Row className="mb-3">
                <Col md={12}>
                    <Button
                        variant="outline-secondary"
                        onClick={() => router.push('/controlhub/ranks')}
                        className="d-flex align-items-center gap-2"
                    >
                        <ArrowLeft size={16} />
                        Back to Ranks
                    </Button>
                </Col>
            </Row>

            <Row className="mb-3">
            <Col md={12}>
                <div className="page-header-title style-2">
                <Row className="d-flex justify-content-between align-items-center">
                    <Col md={8}>
                      
                      <h2 className="mb-0">View Permission for <b className='text-primary'>{roleName}</b></h2>
                    </Col>


                    <Col md={4} className="d-flex justify-content-end">
                      
                    <div className="action-buttons">
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

            <Row className="mb-3">
                <Col md={6}>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className="fw-semibold">Filter by Action:</span>
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
                    </div>
                </Col>
                <Col md={6}>
                    <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end">
                        <span className="fw-semibold">Severity Level:</span>
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
                    </div>
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
                                            <Card className="p-3 mb-3">
                                                <div className="roles-box">
                                                    <div className="roles-box-header clearfix">
                                                        <span className="mb-2" style={{ float: "left" }}>
                                                            <h6>{group.group}</h6>
                                                        </span>
                                                        <div className="clearfix"></div>
                                                    </div>

                                                    {/* Regular Permissions Section */}
                                                    {nonSpecialPermissions.length > 0 && (
                                                        <div className="mb-2">
                                                           
                                                            <div className="row">
                                                                {nonSpecialPermissions
                                                                    .filter((perm: Permission) => perm.enabled)
                                                                    .map((perm: Permission) => (
                                                                    <div className="col-md-4 mb-3" key={perm.id}>
                                                                        <OverlayTrigger
                                                                            placement="right"
                                                                            overlay={<Tooltip id={`tooltip-regular-${perm.id}`}>
                                                                                {perm?.description || 'No description available'}
                                                                            </Tooltip>}
                                                                        >
                                                                            <div className='d-inline-block'>
                                                                                <Form.Check
                                                                                    type="switch"
                                                                                    id={`regular-${perm.id}`}
                                                                                    label={perm.name}
                                                                                    readOnly
                                                                                    checked={perm.enabled}
                                                                                />
                                                                                {perm?.severity_level && perm?.severity_level !== "" && (
                                                                                    <span className={`status-badge ${getSeverityBadgeClass(perm.severity_level)} ms-1 small`}>
                                                                                        {perm?.severity_level}
                                                                                    </span>
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
                                                        <div className="mb-4">
                                                            <h6 className="text-warning mb-4" style={{borderBottom: '1px #d6d6d6 solid',paddingBottom: '10px'}}>
                                                                <i className="fas fa-star me-2" aria-hidden></i>
                                                                {" "}Special Permissions
                                                            </h6>
                                                            <div className="row">
                                                                {specialPermissions
                                                                    .filter((perm: Permission) => perm.enabled)
                                                                    .map((perm: Permission) => (
                                                                    <div className="col-md-4 mb-3" key={perm.id}>
                                                                        <OverlayTrigger
                                                                            placement="right"
                                                                            overlay={<Tooltip id={`tooltip-special-${perm.id}`}>
                                                                                {perm?.description || 'No description available'}
                                                                            </Tooltip>}
                                                                        >
                                                                            <div className='d-inline-block'>
                                                                                <Form.Check
                                                                                    type="switch"
                                                                                    id={`special-${perm.id}`}
                                                                                    label={perm.name}
                                                                                    readOnly
                                                                                    checked={perm.enabled}
                                                                                />
                                                                                {perm?.severity_level && perm?.severity_level !== "" && (
                                                                                    <span className={`status-badge ${getSeverityBadgeClass(perm.severity_level)} ms-1 small`}>
                                                                                        {perm?.severity_level}
                                                                                    </span>
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
                        <Card className="p-5 text-center">
                            <div className="empty-state">
                                <i className="fas fa-lock fa-3x text-muted mb-3"></i>
                                <h5 className="text-muted">No Enabled Permissions Found</h5>
                                <p className="text-muted">This rank currently has no enabled permissions.</p>
                            </div>
                        </Card>
                    )}
                  </Col>
            </Row>
        </React.Fragment>
    )
}
ViewRolePermission.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
  };
  
export default ViewRolePermission
