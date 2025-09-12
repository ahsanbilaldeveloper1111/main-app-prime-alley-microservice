import React, { ReactElement, useEffect, useState, useCallback, useMemo } from 'react'
import Layout from '@layout/index'
import BreadcrumbItem from '@common/BreadcrumbItem'
import { Button, Card, Col, Form, Row } from 'react-bootstrap'
import { toast } from 'react-toastify'
import { useRouter } from 'next/router'
import { viewRank, assignPermissions, GetModules } from "@utils/tms/tmsUserManagement";

interface Permission {
    id: number;
    name: string;
    enabled: boolean;
    action: string;
    module_id: string;
}

interface PermissionGroup {
    group: string;
    enableAll: boolean;
    permissions: Permission[];
}

interface Module {
    id: number;
    name: string;
    description: string | null;
    permissions: PermissionGroup[];
}

interface RolePermission {
    action: string;
    module_id: string;
}

interface Role {
    name: string;
    permissions: RolePermission[];
}

const EditTmsRolePermission = () => {
    const router = useRouter();
    const { id } = router.query;

    // Consolidated state management
    const [state, setState] = useState({
        roleName: '',
        rolePermissions: [] as RolePermission[],
        modules: [] as Module[],
        dataRankPermission: [] as number[],
        searchTerm: '',
        loading: false
    });

    // Memoized search filter
    const filteredModules = useMemo(() => {
        if (!state.searchTerm) return state.modules;
        
        const searchLower = state.searchTerm.toLowerCase();
        return state.modules.map(module => ({
            ...module,
            permissions: module.permissions.map(group => ({
                ...group,
                permissions: group.permissions.filter(perm => 
                    perm.name.toLowerCase().includes(searchLower) ||
                    group.group.toLowerCase().includes(searchLower) ||
                    module.name.toLowerCase().includes(searchLower)
                )
            })).filter(group => group.permissions.length > 0)
        })).filter(module => module.permissions.length > 0);
    }, [state.modules, state.searchTerm]);

    // Memoized permission count
    const selectedPermissionCount = useMemo(() => state.dataRankPermission.length, [state.dataRankPermission]);

    const formatPermissionName = (action: string, moduleName: string): string => {
        // Capitalize first letter of action
        const capitalizedAction = action.charAt(0).toUpperCase() + action.slice(1);
        
        // Convert module name from snake_case to Title Case
        const formattedModuleName = moduleName
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        
        return `${capitalizedAction} ${formattedModuleName}`;
    };

    const transformApiResponse = useCallback((apiResponse: any[]): Module[] => {
        return apiResponse.map((module: any) => {
            const transformedGroups = module.permissions.map((permissionGroup: any) => {
                const transformedPermissions = permissionGroup.permissions.map((permission: any) => ({
                    id: permission.id,
                    name: formatPermissionName(permission.action, module.name),
                    enabled: false,
                    action: permission.action,
                    module_id: permission.module_id
                }));

                return {
                    group: permissionGroup.group,
                    enableAll: false,
                    permissions: transformedPermissions
                };
            });

            return {
                id: module.id,
                name: module.name,
                description: module.description,
                permissions: transformedGroups
            };
        });
    }, []);

    const fetchModules = useCallback(async () => {
        try {
            setState(prev => ({ ...prev, loading: true }));
            const modules = await GetModules();
            const transformedModules = transformApiResponse(modules);
            setState(prev => ({ ...prev, modules: transformedModules, loading: false }));
        } catch (error) {
            console.error('Error fetching modules:', error);
            setState(prev => ({ ...prev, loading: false }));
        }
    }, [transformApiResponse]);

    const syncRolePermissionsWithModules = useCallback((rolePermissions: RolePermission[], modules: Module[]) => {
        const enabledPermissionIds: number[] = [];
        
        const updatedModules = modules.map(module => ({
            ...module,
            permissions: module.permissions.map(group => ({
                ...group,
                permissions: group.permissions.map(permission => {
                    const rolePermission = rolePermissions.find(rp => 
                        rp.action === permission.action && 
                        rp.module_id === permission.module_id
                    );
                    const isEnabled = !!rolePermission;
                    
                    if (isEnabled) {
                        enabledPermissionIds.push(permission.id);
                    }
                    
                    return {
                        ...permission,
                        enabled: isEnabled
                    };
                })
            }))
        }));

        // Update enableAll for each group
        updatedModules.forEach(module => {
            module.permissions.forEach(group => {
                group.enableAll = group.permissions.every(perm => perm.enabled);
            });
        });

        return { updatedModules, enabledPermissionIds };
    }, []);

    const fetchRole = useCallback(async () => {
        try {
            const role: Role = await viewRank(id as string);
            setState(prev => ({ 
                ...prev, 
                roleName: role.name, 
                rolePermissions: role.permissions 
            }));
            
            // Sync role permissions with modules if modules are already loaded
            if (state.modules.length > 0) {
                const { updatedModules, enabledPermissionIds } = syncRolePermissionsWithModules(role.permissions, state.modules);
                setState(prev => ({ 
                    ...prev, 
                    modules: updatedModules, 
                    dataRankPermission: enabledPermissionIds 
                }));
            }
        } catch (error) {
            console.error('Error fetching role:', error);
        }
    }, [id, state.modules.length, syncRolePermissionsWithModules]);

    const handlePermissionChange = useCallback((moduleIdx: number, groupIdx: number, permIdx: number) => {
        setState(prev => {
            const updatedModules = [...prev.modules];
            const targetModule = updatedModules[moduleIdx];
            const targetGroup = targetModule.permissions[groupIdx];
            const targetPermission = targetGroup.permissions[permIdx];

            targetPermission.enabled = !targetPermission.enabled;

            // Update enableAll for the group
            const allChecked = targetGroup.permissions.every(perm => perm.enabled);
            targetGroup.enableAll = allChecked;

            // Update dataRankPermission array
            let updatedDataRankPermission = [...prev.dataRankPermission];
            if (targetPermission.enabled) {
                if (!updatedDataRankPermission.includes(targetPermission.id)) {
                    updatedDataRankPermission.push(targetPermission.id);
                }
            } else {
                updatedDataRankPermission = updatedDataRankPermission.filter(id => id !== targetPermission.id);
            }

            return {
                ...prev,
                modules: updatedModules,
                dataRankPermission: updatedDataRankPermission
            };
        });
    }, []);
    const handleEnableAllChange = useCallback((moduleIdx: number, groupIdx: number) => {
        setState(prev => {
            const updatedModules = [...prev.modules];
            const targetModule = updatedModules[moduleIdx];
            const targetGroup = targetModule.permissions[groupIdx];

            const newEnableAllState = !targetGroup.enableAll;
            targetGroup.enableAll = newEnableAllState;

            // Update permissions and dataRankPermission array
            let updatedDataRankPermission = [...prev.dataRankPermission];
            
            targetGroup.permissions.forEach(permission => {
                permission.enabled = newEnableAllState;
                
                if (newEnableAllState) {
                    if (!updatedDataRankPermission.includes(permission.id)) {
                        updatedDataRankPermission.push(permission.id);
                    }
                } else {
                    updatedDataRankPermission = updatedDataRankPermission.filter(id => id !== permission.id);
                }
            });

            return {
                ...prev,
                modules: updatedModules,
                dataRankPermission: updatedDataRankPermission
            };
        });
    }, []);

    const handleUpdateRole = useCallback(async () => {
        try {
            setState(prev => ({ ...prev, loading: true }));
            
            // Extract permissions from modules structure
            const permissions = state.modules.flatMap(module => 
                module.permissions.flatMap(group => 
                    group.permissions.filter(perm => perm.enabled).map(perm => ({
                        action: perm.action,
                        module_id: perm.module_id
                    }))
                )
            );

            const payload = {
                id: id as string,
                permissions: state.dataRankPermission
            };

            const response = await assignPermissions(payload);
            if (response) {
                toast.success("Permissions updated successfully!");
                await fetchRole();
            }
        } catch (error) {
            console.error('Error updating role:', error);
            toast.error("Failed to update permissions");
        } finally {
            setState(prev => ({ ...prev, loading: false }));
        }
    }, [id, state.modules, fetchRole]);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setState(prev => ({ ...prev, searchTerm: e.target.value }));
    }, []);

    useEffect(() => {
        if (id) {
            fetchModules();
            fetchRole();
        }
    }, [id, fetchModules, fetchRole]);

    // Sync modules with role permissions when both are loaded
    useEffect(() => {
        if (state.modules.length > 0 && state.rolePermissions.length > 0) {
            const { updatedModules, enabledPermissionIds } = syncRolePermissionsWithModules(state.rolePermissions, state.modules);
            setState(prev => ({ 
                ...prev, 
                modules: updatedModules, 
                dataRankPermission: enabledPermissionIds 
            }));
        }
    }, [state.modules.length, state.rolePermissions.length, syncRolePermissionsWithModules]);

    if (state.loading) {
        return (
            <React.Fragment>
                <BreadcrumbItem mainTitle="Controlhub" mainLink="controlhub/roles" subTitle="Permissions" />
                <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </React.Fragment>
        );
    }

    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="Controlhub" mainLink="controlhub/roles" subTitle="Rank Permissions" />

            <Row className='mb-3'>
                <Col md={8}>
                    <div className="page-header-title d-flex justify-content-between">
                        <h2 className="mb-0">
                            <b className='text-primary mx-2'>{state.roleName}</b>
                            {/* <small className="text-muted ms-2">
                                ({selectedPermissionCount} permissions selected)
                            </small> */}
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
                                value={state.searchTerm}
                                onChange={handleSearchChange}
                            />
                        </Form.Group>
                        <Button 
                            variant="outline-primary" 
                            size='sm' 
                            onClick={handleUpdateRole}
                            disabled={state.loading}
                        >
                            {state.loading ? 'Updating...' : 'Update Permissions'}
                        </Button>
                    </div>
                </Col>
            </Row>

            <Row>
                <Col md={12}>
                    {filteredModules.map((module, moduleIdx) => (
                        <React.Fragment key={module.id}>
                            {module.permissions.map((group, groupIdx) => (
                                <React.Fragment key={`${module.id}-${groupIdx}`}>
                                    {group.permissions.length > 0 && (
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
                                                            onChange={() => handleEnableAllChange(moduleIdx, groupIdx)}
                                                        />
                                                    </label>
                                                    <div className="clearfix"></div>
                                                </div>
                                                <div className="row">
                                                    {group.permissions.map((perm, permIdx) => (
                                                        <div className="col-md-4 mb-3" key={perm.id}>
                                                            <Form.Check
                                                                type="switch"
                                                                id={`${module.id}-${groupIdx}-${perm.id}`}
                                                                label={perm.name}
                                                                checked={perm.enabled}
                                                                onChange={() => handlePermissionChange(
                                                                    moduleIdx,
                                                                    groupIdx,
                                                                    permIdx
                                                                )}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </Card>
                                    )}
                                </React.Fragment>
                            ))}
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
