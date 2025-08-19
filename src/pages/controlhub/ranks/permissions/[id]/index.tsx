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
    name: string;
    enabled: boolean;
    description: string;
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

    // Filter permissions based on search term
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
                  {filteredPermissions?.map((group: PermissionGroup, groupIdx: number) => (
                            <React.Fragment key={groupIdx}>
                                {group.permissions.length > 0 && (
                                    <>
                                        <Card className="p-3">
                                            <div className="roles-box" key={groupIdx}>

                                                <div className="roles-box-header clearfix">
                                                    <span className="mb-2" style={{ float: "left" }}><h6> {group.group}</h6> </span>
                                                    <label className="enableSwitch" style={{ float: "right" }}>
                                                        <Form.Check
                                                            type="switch"
                                                            label="Enable All"
                                                            readOnly
                                                            checked={group.enableAll}
                                                        />
                                                    </label>
                                                    <div className="clearfix"></div>
                                                </div>
                                                <div className="row">
                                                    {group.permissions && group.permissions.map((perm: Permission, permIdx: number) => (
                                                        <div className="col-md-4 mb-3" key={permIdx}>
                                                            <OverlayTrigger
                                                                placement="right"
                                                                overlay={<Tooltip id={`tooltip-${permIdx}`}>
                                                                    {perm?.description || 'No description available'}
                                                                    </Tooltip>}
                                                            >
                                                                <div className='d-inline-block'>
                                                                
                                                                    <Form.Check
                                                                        type="switch"
                                                                        id={permIdx.toString()}
                                                                        label={perm.name}
                                                                        readOnly
                                                                        checked={perm.enabled}
                                                                    />
                                                                </div>
                                                            </OverlayTrigger>
                                                        </div>
                                                    ))
                                                    }
                                                </div>
                                            </div>
                                        </Card>
                                    </>
                                )}
                            </React.Fragment>
                        ))}
                  </Col>
            </Row>
        </React.Fragment>
    )
}
ViewRolePermission.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
  };
  
export default ViewRolePermission
