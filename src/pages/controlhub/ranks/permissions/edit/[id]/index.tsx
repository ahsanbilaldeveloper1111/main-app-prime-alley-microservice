import React,{ReactElement, useEffect, useState} from 'react'
import Layout from '@layout/index'
import BreadcrumbItem from '@common/BreadcrumbItem'
import { Button, Card, Col, Form, Row } from 'react-bootstrap'
import { toast } from 'react-toastify'
import { useRouter } from 'next/router'
import { viewRank, assignPermissions } from '@utils/roles'
import { ArrowLeft } from 'lucide-react'
import { PermissionSwitch } from '@components/controlhub/PermissionSwitch'
import { MAIN_SETTINGS_RANKS_AND_PERMISSIONS_PATH } from '@utils/controlhub/usersNavigation'
import '@assets/scss/common.scss';
import '@page-modules/controlhub/ranks/rankPermissionsPage.scss';
import { RankPermissionsFilterPanel } from '@page-modules/controlhub/ranks/RankPermissionsFilterPanel';
import { RankPermissionsMobileSaveBar } from '@page-modules/controlhub/ranks/RankPermissionsMobileSaveBar';

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
    subGroups?: PermissionGroup[];
}

const EditRolePermission = () => {

    const router = useRouter();
    const { id } = router.query;

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

    const permissionMatchesFilter = (perm: Permission, group: PermissionGroup, includeGroupInSearch: boolean): boolean => {
        const matchesSearch = perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (includeGroupInSearch && group.group.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesAction = selectedAction === 'all' ||
            perm.name.toLowerCase().includes(selectedAction.toLowerCase());
        const matchesSeverity = selectedSeverityLevel === '' ||
            perm.severity_level?.toLowerCase() === selectedSeverityLevel.toLowerCase();
        return matchesSearch && matchesAction && matchesSeverity;
    };

    const filteredPermissions = rolePermissions?.filter((group: PermissionGroup) => {
        const groupMatches = group.group.toLowerCase().includes(searchTerm.toLowerCase());
        const permissionMatches = group.permissions.some((perm) =>
            permissionMatchesFilter(perm, group, false)
        );
        return groupMatches || permissionMatches;
    }).map((group: PermissionGroup) => ({
        ...group,
        permissions: group.permissions.filter((perm) =>
            permissionMatchesFilter(perm, group, true)
        )
    }));

    // Separate permissions into special and non-special
    const separatePermissions = (group: PermissionGroup) => {
        const nonSpecialPermissions = group.permissions.filter(perm => perm.is_special === "0");
        const specialPermissions = group.permissions.filter(perm => perm.is_special === "1");
        
        return { nonSpecialPermissions, specialPermissions };
    };

    const setSubGroupEnabled = (subGroup: PermissionGroup, enabled: boolean): PermissionGroup => ({
        ...subGroup,
        enableAll: enabled,
        permissions: subGroup.permissions.map((p) => ({ ...p, enabled }))
    });

    const setGroupEnabled = (group: PermissionGroup, enabled: boolean): PermissionGroup => {
        const updatedGroup: PermissionGroup = {
            ...group,
            enableAll: enabled,
            permissions: group.permissions.map((p) => ({ ...p, enabled }))
        };
        if (group.subGroups) {
            updatedGroup.subGroups = group.subGroups.map((sg) => setSubGroupEnabled(sg, enabled));
        }
        return updatedGroup;
    };

    const handlePermissionChange = (groupIdx: number, subGroupIdx: number | null, permIdx: number) => {
        const updatedPermissions = [...rolePermissions];

        const targetGroup = subGroupIdx === null
            ? updatedPermissions[groupIdx]
            : (updatedPermissions[groupIdx] as any).subGroups[subGroupIdx];

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

        const targetGroup = subGroupIdx === null
            ? updatedPermissions[groupIdx]
            : (updatedPermissions[groupIdx] as any).subGroups[subGroupIdx];

        const newEnableAllState = !targetGroup.enableAll;
        targetGroup.enableAll = newEnableAllState;

        if (targetGroup.permissions) {
            targetGroup.permissions.forEach((permission: Permission) => {
                permission.enabled = newEnableAllState;
            });
        }

        if (targetGroup.subGroups) {
            targetGroup.subGroups.forEach((subGroup: PermissionGroup) => {
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

    const handleSelectAll = () => {
        setRolePermissions(rolePermissions.map((g) => setGroupEnabled(g, true)));
        toast.success("All permissions selected!");
    };

    const handleUnselectAll = () => {
        setRolePermissions(rolePermissions.map((g) => setGroupEnabled(g, false)));
        toast.success("All permissions unselected!");
    };

    const handleUpdateRole = async () => {
        const payload = {
            role_id: id as string,
            permissions: rolePermissions
        };
        const response = await assignPermissions(payload);
        if(response){
            toast.success("Permissions updated successfully!");
           fetchRole();
        }
    };


   


    

    return (
        <div className="rank-permissions-page rank-permissions-page--assign">
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
                    <Col xs={12} lg={7} className="min-w-0">
                      <h2 className="mb-0 rank-permissions-page__title">
                        <span className="rank-permissions-page__title-lead">Assign permission to </span>
                        <span className="rank-permissions-page__title-name text-primary">{roleName}</span>
                      </h2>
                    </Col>
                    <Col xs={12} lg={5} className="min-w-0">
                    <div className="action-buttons rank-permissions-page__header-actions">
                         <div className="search-container">
                            <i className="fas fa-search search-icon"></i>
                            <input type="text" className="search-bar" placeholder="Search permissions..." onChange={(e) => setSearchTerm(e.target.value)}/>
                        </div>
                        <Button variant="primary" size="sm" className="d-none d-sm-inline-flex rank-permissions-page__update-btn" onClick={handleUpdateRole}>Update Permissions</Button>
                    
                    </div>



                    </Col>
                  </Row>
                </div>
            </Col>
            </Row>

            <Row className="rank-permissions-page__filters rank-permissions-page__filters--assign g-2 align-items-center">
                <Col xs={12} md>
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
                <Col xs={12} md="auto" className="rank-permissions-page__filters-end">
                    <div className="rank-permissions-page__filters-toolbar">
                        <RankPermissionsFilterPanel inline label="Severity level" ariaLabel="Filter by severity level">
                            <Button variant="outline-primary" size="sm" onClick={() => setSelectedSeverityLevel('')}>All</Button>
                            <Button variant="outline-info" size="sm" onClick={() => setSelectedSeverityLevel('Low')}>Low</Button>
                            <Button variant="outline-primary" size="sm" onClick={() => setSelectedSeverityLevel('Medium')}>Medium</Button>
                            <Button variant="outline-warning" size="sm" onClick={() => setSelectedSeverityLevel('High')}>High</Button>
                            <Button variant="outline-danger" size="sm" onClick={() => setSelectedSeverityLevel('Critical')}>Critical</Button>
                        </RankPermissionsFilterPanel>
                        <div className="rank-permissions-page__bulk-actions">
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={handleSelectAll}
                            >
                                Select All
                            </Button>
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={handleUnselectAll}
                            >
                                Unselect All
                            </Button>
                        </div>
                    </div>
                </Col>
            </Row>

            <Row>
                  <Col md={12}>
                  {filteredPermissions?.map((group: PermissionGroup, groupIdx: number) => {
                        const { nonSpecialPermissions, specialPermissions } = separatePermissions(group);
                        const originalGroup = rolePermissions[groupIdx];
                        const groupKey = group.group.toLowerCase().replaceAll(/\s+/g, '');

                        const renderPermissionSwitch = (perm: Permission, tooltipIdPrefix: 'regular' | 'special') => {
                            const originalIndex = originalGroup?.permissions.findIndex(p => p.id === perm.id) ?? -1;
                            return (
                                <PermissionSwitch
                                    key={perm.id}
                                    perm={perm}
                                    groupKey={groupKey}
                                    tooltipIdPrefix={tooltipIdPrefix}
                                    groupIdx={groupIdx}
                                    originalIndex={originalIndex}
                                    onPermissionChange={handlePermissionChange}
                                    getSeverityBadgeClass={getSeverityBadgeClass}
                                />
                            );
                        };

                        return (
                            <React.Fragment key={group.group}>
                                {group.permissions.length > 0 && (
                                
                                        <Card className="rank-permissions-page__group-card">
                                            <div className="roles-box">
                                                <div className="roles-box-header">
                                                    <h6 className="mb-0 roles-box-header__title">{group.group}</h6>
                                                    <Form.Check
                                                        type="switch"
                                                        id={`enable-all-${groupKey}`}
                                                        className="roles-box-header__enable-all"
                                                        label="Enable All"
                                                        checked={group.enableAll}
                                                        onChange={() => handleEnableAllChange(groupIdx)}
                                                    />
                                                </div>

                                                {/* Regular Permissions Section */}
                                                {nonSpecialPermissions.length > 0 && (
                                                    <div className="roles-box__section">
                                                        <div className="row">
                                                            {nonSpecialPermissions.map((perm) => renderPermissionSwitch(perm, 'regular'))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Special Permissions Section */}
                                                {specialPermissions.length > 0 && (
                                                    <div className="roles-box__section">
                                                        <h6 className="text-warning rank-permissions-page__special-heading">
                                                            <i className="fas fa-star me-2" aria-hidden="true" />
                                                            {" "}Special Permissions
                                                        </h6>
                                                        <div className="row">
                                                            {specialPermissions.map((perm) => renderPermissionSwitch(perm, 'special'))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </Card>
                                
                                )}
                            </React.Fragment>
                        );
                    })}
                  </Col>
            </Row>

            <RankPermissionsMobileSaveBar onSave={handleUpdateRole} />
        </div>
    )
}
EditRolePermission.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
  };
  
export default EditRolePermission
