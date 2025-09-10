import React,{ReactElement, useEffect, useState} from 'react'
import Layout from '@layout/index'
import BreadcrumbItem from '@common/BreadcrumbItem'
import { Button, Card, Col, Form, Modal, Row } from 'react-bootstrap'
import RolesSourceData from '@views/Table/DataTable/SourceData/RolesSourceData'
import { toast } from 'react-toastify'
import permissionsData from '@common/JsonData/PermissionsData'
import { useRouter } from 'next/router'
import { viewRank, assignPermissions, GetModules } from "@utils/tms/tmsUserManagement";

interface Permission {
    name: string;
    enabled: boolean;
}

interface PermissionGroup {
    group: string;
    enableAll: boolean;
    permissions: Permission[];
}

const EditTmsRolePermission = () => {

    const router = useRouter();
    const { id } = router.query;

    const [roleName,setRoleName] = useState<string>('');
    const [rolePermissions,setRolePermissions] = useState<PermissionGroup[]>([]);
    const [permissions, setPermissions] = useState(null);
    const [searchTerm, setSearchTerm] = useState<string>('');

    useEffect(() => {
        if (id) {
            fetchModules();
            fetchRole();
        }
    }, [id]);

    const [modules, setModules] = useState<any[]>([]);

    const fetchModules = async () => {
        const modules = await GetModules();
        setModules(modules as any);
        console.log("modules", modules);
    }

    const fetchRole = async () => {
        const role = await viewRank(id as string);
        setRoleName(role.name);
        setRolePermissions(role.permissions);
        setPermissions(role.permissions);
    }

    // Filter permissions based on search term
    const filteredPermissions = rolePermissions?.filter((group: PermissionGroup) => {
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
    

    const updateEnableAllInPermissions = (permissionsData: PermissionGroup[]) => {
        return permissionsData.map((group: PermissionGroup) => {
            const allGroupPermissionsEnabled = group.permissions.every((permission: Permission) => permission.enabled === true);

            return {
                ...group,
                enableAll: allGroupPermissionsEnabled,
            };
        });
    };
    const handlePermissionChange = (groupIdx: number, subGroupIdx: number | null, permIdx: number) => {
        const updatedPermissions = [...rolePermissions];

        const targetGroup = subGroupIdx !== null
            ? (updatedPermissions[groupIdx] as any).subGroups[subGroupIdx]
            : updatedPermissions[groupIdx];

        const targetPermission = targetGroup.permissions[permIdx];

        targetPermission.enabled = !targetPermission.enabled;

        const allChecked = targetGroup.permissions.every((perm: Permission) => perm.enabled);
        targetGroup.enableAll = allChecked;

        if (subGroupIdx !== null) {
            const parentGroup = updatedPermissions[groupIdx];
            const allSubgroupsChecked = (parentGroup as any).subGroups.every(
                (subGroup: any) => subGroup.enableAll
            );
            parentGroup.enableAll = allSubgroupsChecked;
        }

        setRolePermissions(updatedPermissions);
    };
    const handleEnableAllChange = (groupIdx: number, subGroupIdx: number | null = null) => {
        const updatedPermissions = [...rolePermissions];

        const targetGroup = subGroupIdx !== null
            ? (updatedPermissions[groupIdx] as any).subGroups[subGroupIdx]
            : updatedPermissions[groupIdx];

        const newEnableAllState = !targetGroup.enableAll;
        targetGroup.enableAll = newEnableAllState;

        if (targetGroup.permissions) {
            targetGroup.permissions.forEach((permission: Permission) => {
                permission.enabled = newEnableAllState;
            });
        }

        if ((targetGroup as any).subGroups) {
            (targetGroup as any).subGroups.forEach((subGroup: any) => {
                subGroup.enableAll = newEnableAllState;
                subGroup.permissions.forEach((permission: Permission) => {
                    permission.enabled = newEnableAllState;
                });
            });
        }

        if (subGroupIdx !== null) {
            const parentGroup = updatedPermissions[groupIdx];
            const allSubgroupsChecked = (parentGroup as any).subGroups.every(
                (subGroup: any) => subGroup.enableAll
            );
            parentGroup.enableAll = allSubgroupsChecked;
        }

        setRolePermissions(updatedPermissions);
    };

    const handleUpdateRole = async () => {
        const payload = {
            role_id: id as string,
            permissions: rolePermissions
        };
        //console.log("payload", payload);
        const response = await assignPermissions(payload);
        if(response){
            toast.success("Permissions updated successfully!");
           fetchRole();
        }
    };


   


    

    return (

        <React.Fragment>
            <BreadcrumbItem mainTitle="Controlhub" mainLink="controlhub/roles" subTitle="Permissions"  />

            <Row className='mb-3'>
                  <Col md={8}>
                        <div className="page-header-title d-flex justify-content-between">
                        <h2 className="mb-0 ">
                              <b className='text-primary mx-2'>{roleName}</b>
                        </h2>
                        </div>
                  </Col>
                  <Col md={4}>
                        <div className="d-flex justify-content-end gap-2">
                        <Form.Group>
                            <Form.Control
                                type="text"
                                className='form-control-sm'
                                placeholder="Search permissions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />                            
                        </Form.Group>
                        <Button variant="outline-primary" size='sm' onClick={handleUpdateRole}>Update Permissions</Button>
                        </div>
                    </Col>
            </Row>


            <Row>
                  <Col md={12}>
                  {filteredPermissions?.map((group: PermissionGroup, groupIdx: number) => (
                            <React.Fragment key={groupIdx}>
                                {group.permissions.length > 0 && (
                                    <>
                                        <Card className="p-3" key={groupIdx}>
                                            <div className="roles-box" >

                                                <div className="roles-box-header clearfix">
                                                    <span className="mb-2" style={{ float: "left" }}><h6> {group.group}</h6> </span>
                                                    <label className="enableSwitch" style={{ float: "right" }}>
                                                        <Form.Check
                                                            type="switch"
                                                            label="Enable All"
                                                            checked={group.enableAll}
                                                            onChange={() => handleEnableAllChange(groupIdx)}
                                                        />
                                                    </label>
                                                    <div className="clearfix"></div>
                                                </div>
                                                <div className="row">
                                                    {group.permissions && group.permissions.map((perm, permIdx) => (
                                                        <div className="col-md-4 mb-3" key={permIdx}>
                                                            <Form.Check
                                                                type="switch"
                                                                id={permIdx.toString()}
                                                                label={perm.name}
                                                                checked={perm.enabled}
                                                                onChange={() => handlePermissionChange(
                                                                    groupIdx,
                                                                    null,
                                                                    permIdx
                                                                )}
                                                            />
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
EditTmsRolePermission.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
  };
  
export default EditTmsRolePermission
