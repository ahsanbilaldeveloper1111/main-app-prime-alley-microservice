import React,{ReactElement, useEffect, useState} from 'react'
import Layout from '@layout/index'
import BreadcrumbItem from '@common/BreadcrumbItem'
import { Button, Card, Col, Form, Modal, Row, OverlayTrigger, Tooltip } from 'react-bootstrap'
import RolesSourceData from '@views/Table/DataTable/SourceData/RolesSourceData'
import { toast } from 'react-toastify'
import permissionsData from '@common/JsonData/PermissionsData'
import { useRouter } from 'next/router'
import { viewRank, assignPermissions } from '@utils/roles'
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

const EditRolePermission = () => {

    const router = useRouter();
    const { id } = router.query;

    const [roleName,setRoleName] = useState<string>('');
    const [rolePermissions,setRolePermissions] = useState<PermissionGroup[]>([]);
    const [permissions, setPermissions] = useState(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedAction, setSelectedAction] = useState<string>('all');

    useEffect(() => {
        if (id) {
            fetchRole();
        }
    }, [id]);

    const fetchRole = async () => {
        const role = await viewRank(id as string);
        setRoleName(role.name);
        setRolePermissions(role.permissions);
        setPermissions(role.permissions);
    }

    // Filter permissions based on search term and action filter
    const filteredPermissions = rolePermissions?.filter((group: PermissionGroup) => {
        const groupMatches = group.group.toLowerCase().includes(searchTerm.toLowerCase());
        const permissionMatches = group.permissions.some((perm: Permission) => {
            const matchesSearch = perm.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesAction = selectedAction === 'all' || 
                perm.name.toLowerCase().includes(selectedAction.toLowerCase());
            return matchesSearch && matchesAction;
        });
        return groupMatches || permissionMatches;
    }).map((group: PermissionGroup) => ({
        ...group,
        permissions: group.permissions.filter((perm: Permission) => {
            const matchesSearch = perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                group.group.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesAction = selectedAction === 'all' || 
                perm.name.toLowerCase().includes(selectedAction.toLowerCase());
            return matchesSearch && matchesAction;
        })
    }));

    // Separate permissions into special and non-special
    const separatePermissions = (group: PermissionGroup) => {
        const nonSpecialPermissions = group.permissions.filter(perm => perm.is_special === "0");
        const specialPermissions = group.permissions.filter(perm => perm.is_special === "1");
        
        return { nonSpecialPermissions, specialPermissions };
    };
    

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

            {/* <Row className='mb-3'>
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
            </Row> */}
            <Row className="mb-3">
            <Col md={12}>
                <div className="page-header-title style-2">
                <Row className="d-flex justify-content-between align-items-center">
                    <Col md={7}>
                      
                      <h2 className="mb-0">Assign Permission to <b className='text-primary'>{roleName}</b></h2>
                    </Col>


                    <Col md={5} className="d-flex justify-content-end">
                      
                    <div className="action-buttons">
                         <div className="search-container">
                            <i className="fas fa-search search-icon"></i>
                            <input type="text" className="search-bar" placeholder="Search permissions..." onChange={(e) => setSearchTerm(e.target.value)}/>
                        </div>
                        <Button variant="primary" onClick={handleUpdateRole}>Update Permissions</Button>
                    
                    </div>



                    </Col>
                  </Row>
                </div>
            </Col>
            </Row>

            <Row className="mb-3">
                <Col md={12}>
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

                                                {/* Regular Permissions Section */}
                                                {nonSpecialPermissions.length > 0 && (
                                                    <div className="mb-2">
                                                        <div className="row">
                                                            {nonSpecialPermissions.map((perm: Permission, permIdx: number) => {
                                                                const originalIndex = group.permissions.findIndex(p => p.id === perm.id);
                                                                const groupKey = group.group.toLowerCase().replace(/\s+/g, '');
                                                                return (
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
                                                                                    id={`${perm.key}_${groupKey}`}
                                                                                    label={perm.name}
                                                                                    checked={perm.enabled}
                                                                                    onChange={() => handlePermissionChange(
                                                                                        groupIdx,
                                                                                        null,
                                                                                        originalIndex
                                                                                    )}
                                                                                />
                                                                            </div>
                                                                        </OverlayTrigger>
                                                                    </div>
                                                                );
                                                            })}
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
                                                            {specialPermissions.map((perm: Permission, permIdx: number) => {
                                                                const originalIndex = group.permissions.findIndex(p => p.id === perm.id);
                                                                const groupKey = group.group.toLowerCase().replace(/\s+/g, '');
                                                                return (
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
                                                                                    id={`${perm.key}_${groupKey}`}
                                                                                    label={perm.name}
                                                                                    checked={perm.enabled}
                                                                                    onChange={() => handlePermissionChange(
                                                                                        groupIdx,
                                                                                        null,
                                                                                        originalIndex
                                                                                    )}
                                                                                />
                                                                            </div>
                                                                        </OverlayTrigger>
                                                                    </div>
                                                                );
                                                            })}
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
EditRolePermission.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
  };
  
export default EditRolePermission
