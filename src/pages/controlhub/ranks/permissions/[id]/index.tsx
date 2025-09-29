import React,{ReactElement, useEffect, useState} from 'react'
import Layout from '@layout/index'
import BreadcrumbItem from '@common/BreadcrumbItem'
import { Button, Card, Col, Form, Modal, Row, OverlayTrigger, Tooltip } from 'react-bootstrap'
import RolesSourceData from '@views/Table/DataTable/SourceData/RolesSourceData'
import { toast } from 'react-toastify'
import permissionsData from '@common/JsonData/PermissionsData'
import { useRouter } from 'next/router'
import { viewRank } from '@utils/roles'

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
            <Col md={8}>
                <div className="page-header-title">
                <h2 className="mb-0 d-flex align-items-center">
                    View Role <b className='text-primary mx-2'> {roleName} </b> Permission
                </h2>
                </div>
            </Col>
            <Col md={4}>
            <Form.Group>
                        <Form.Control
                            type="text"
                            placeholder="Search permissions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </Form.Group>
            </Col>
            </Row>

           

            <Row>
                  <Col md={12}>
                  {filteredPermissions?.map((group: PermissionGroup, groupIdx: number) => {
                        const { nonSpecialPermissions, specialPermissions } = separatePermissions(group);
                        
                        return (
                            <React.Fragment key={groupIdx}>
                                {group.permissions.length > 0 && (
                                    <>
                                        <Card className="p-3 mb-3">
                                            <div className="roles-box">
                                                <div className="roles-box-header clearfix">
                                                    <span className="mb-2" style={{ float: "left" }}>
                                                        <h6>{group.group}</h6>
                                                    </span>
                                                    {/* <label className="enableSwitch" style={{ float: "right" }}>
                                                        <Form.Check
                                                            type="switch"
                                                            label="Enable All"
                                                            readOnly
                                                            checked={group.enableAll}
                                                        />
                                                    </label> */}
                                                    <div className="clearfix"></div>
                                                </div>

                                                {/* Regular Permissions Section */}
                                                {nonSpecialPermissions.length > 0 && (
                                                    <div className="mb-2">
                                                       
                                                        <div className="row">
                                                            {nonSpecialPermissions.map((perm: Permission, permIdx: number) => (
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
                                                            {specialPermissions.map((perm: Permission, permIdx: number) => (
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
                    })}
                  </Col>
            </Row>
        </React.Fragment>
    )
}
ViewRolePermission.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
  };
  
export default ViewRolePermission
