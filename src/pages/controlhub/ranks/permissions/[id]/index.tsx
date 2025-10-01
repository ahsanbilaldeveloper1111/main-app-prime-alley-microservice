import React,{ReactElement, useEffect, useState} from 'react'
import Layout from '@layout/index'
import BreadcrumbItem from '@common/BreadcrumbItem'
import { Button, Card, Col, Form, Modal, Row, OverlayTrigger, Tooltip } from 'react-bootstrap'
import RolesSourceData from '@views/Table/DataTable/SourceData/RolesSourceData'
import { toast } from 'react-toastify'
import permissionsData from '@common/JsonData/PermissionsData'
import { useRouter } from 'next/router'
import { viewRank } from '@utils/roles'
import '@assets/scss/common.scss';

interface Permission {
    id: number;
    name: string;
    key: string;
    enabled: boolean;
    description: string;
    module_id: number;
    is_special: string;
}

interface PermissionGroup {
    group: string;
    enableAll: boolean;
    permissions: Permission[];
}

const ViewRolePermission = () => {

    const router = useRouter();
    const { id } = router.query;

    const [roleName,setRoleName] = useState<string>('');
    const [rolePermissions,setRolePermissions] = useState<PermissionGroup[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');

    useEffect(() => {
        if (id) {
            fetchRole();
        }
    }, [id]);

    const fetchRole = async () => {
        const role = await viewRank(id as string);
        setRoleName(role.name);
        setRolePermissions(role.permissions);
    }

    // Filter permissions based on search term and separate special/non-special
    const filteredPermissions = rolePermissions.filter((group: PermissionGroup) => {
        const groupMatches = group.group.toLowerCase().includes(searchTerm.toLowerCase());
        const permissionMatches = group.permissions.some((perm: Permission) => 
            perm.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return groupMatches || permissionMatches;
    }).map((group: PermissionGroup) => ({
        ...group,
        permissions: group.permissions.filter((perm: Permission) => 
            perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            group.group.toLowerCase().includes(searchTerm.toLowerCase())
        )
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
                <div className="page-header-title style-2">
                <Row className="d-flex justify-content-between align-items-center">
                    <Col md={6}>
                      
                      <h2 className="mb-0">View Rank Permission</h2>
                    </Col>


                    <Col md={6} className="d-flex justify-content-end">
                      
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

           

            <Row>
                  <Col md={12}>
                  {filteredPermissions?.some(group => group.permissions.some(perm => perm.enabled)) ? (
                        filteredPermissions.map((group: PermissionGroup, groupIdx: number) => {
                            const { nonSpecialPermissions, specialPermissions } = separatePermissions(group);
                            
                            return (
                                <React.Fragment key={groupIdx}>
                                    {group.permissions.some(perm => perm.enabled) && (
                                        <>
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
                                                                    .map((perm: Permission, permIdx: number) => (
                                                                    <div className="col-md-4 mb-3" key={permIdx}>
                                                                        <OverlayTrigger
                                                                            placement="right"
                                                                            overlay={<Tooltip id={`tooltip-regular-${permIdx}`}>
                                                                                {perm?.description || 'No description available'}
                                                                            </Tooltip>}
                                                                        >
                                                                            <div className='d-inline-block'>
                                                                                <Form.Check
                                                                                    type="switch"
                                                                                    id={`regular-${permIdx}`}
                                                                                    label={perm.name}
                                                                                    readOnly
                                                                                    checked={perm.enabled}
                                                                                />
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
                                                                <i className="fas fa-star me-2"></i>
                                                                Special Permissions
                                                            </h6>
                                                            <div className="row">
                                                                {specialPermissions
                                                                    .filter((perm: Permission) => perm.enabled)
                                                                    .map((perm: Permission, permIdx: number) => (
                                                                    <div className="col-md-4 mb-3" key={permIdx}>
                                                                        <OverlayTrigger
                                                                            placement="right"
                                                                            overlay={<Tooltip id={`tooltip-special-${permIdx}`}>
                                                                                {perm?.description || 'No description available'}
                                                                            </Tooltip>}
                                                                        >
                                                                            <div className='d-inline-block'>
                                                                                <Form.Check
                                                                                    type="switch"
                                                                                    id={`special-${permIdx}`}
                                                                                    label={perm.name}
                                                                                    readOnly
                                                                                    checked={perm.enabled}
                                                                                />
                                                                            </div>
                                                                        </OverlayTrigger>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </Card>
                                        </>
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
