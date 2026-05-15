import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useCallback, useMemo, useEffect } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import GenericTable, { TableAction, TableColumn } from '@components/GenericTable';
import { ListRoles, updateRole,deleteRole,addRole,BulkDeleteRoles, getUserTypes, getModules, getPermissionsByModule, updateSeverityLevel, cloneRank } from '@utils/roles';
import { Button, Row, Col, Form, OverlayTrigger, Tooltip, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Select, { MultiValue } from 'react-select';
import SelectCheckBox, { SelectCheckBoxOption } from '@components/SelectCheckBox';
import { useDebouncedValue } from '@hooks/useDebouncedValue';
import { controlhubKeys } from "@query/keys";
import { getParentUsers, assignRankBulk } from '@utils/users';
import { Copy, Users } from 'lucide-react';

import '@assets/scss/common.scss';
import SuccessfulModal from '@components/page-partials/SuccessfulModal'
import FormModal from '@components/page-partials/FormModal'
import ConfirmModal from '@components/page-partials/ConfirmModal'

import { FiEdit, FiTrash2, FiEye } from 'react-icons/fi';
import { HEADER_CONSTANTS } from '@constants/headerConstants';

// Helper function to get badge colors based on severity level
const getSeverityBadgeColors = (severityLevel: string): { bg: string; text: string } => {
    const level = severityLevel?.toLowerCase();
    switch (level) {
        case 'low':
            return { bg: 'rgba(118, 118, 118, 0.15)', text: '#3a7bd5' }; // Light blue
        case 'medium':
            return { bg: 'rgba(31, 119, 219, 0.15)', text: '#2583f2' }; // Light blue
        case 'high':
            return { bg: 'rgba(248, 201, 16, 0.15)', text: '#f1c40f' }; // Light yellow
        case 'critical':
            return { bg: 'rgba(255, 25, 0, 0.15)', text: '#e74c3c' }; // Light red
        case 'unassigned':
            return { bg: 'rgba(118, 118, 118, 0.15)', text: '#767676' }; // Light gray
        default:
            return { bg: 'rgba(37, 131, 242, 0.15)', text: '#2583f2' };
    }
};

interface RankRow {
    id: number;
    name: string;
    user_type_id?: number;
    user_type?: { id?: number; name?: string };
    severity_counts?: Record<string, number>;
    user_assigned_count?: number;
}

const Ranks = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const queryClient = useQueryClient();

    // We don't need the redirect effect anymore since we're showing the message on page

    const [currentFilters] = useState({});
    const [selectedRows, setSelectedRows] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [searchValue, setSearchValue] = useState('');
    const debouncedSearchValue = useDebouncedValue(searchValue, 400);
    const [rowSelectionEnabled, setRowSelectionEnabled] = useState<boolean>(false);

    const filtersListKey = JSON.stringify(currentFilters);
    const ranksListQuery = useQuery({
        queryKey: controlhubKeys.ranks.list({
            page: currentPage,
            perPage: rowsPerPage,
            search: debouncedSearchValue,
            filtersKey: filtersListKey,
        }),
        queryFn: async () => {
            try {
                const response = await ListRoles({
                    page: currentPage,
                    perPage: rowsPerPage,
                    search: debouncedSearchValue,
                    filters: currentFilters,
                });
                const rows = response?.data ?? response?.dataList ?? [];
                const total = response?.total ?? 0;
                return { data: Array.isArray(rows) ? rows : [], total };
            } catch {
                toast.error('Failed to load ranks');
                throw new Error('Failed to load ranks');
            }
        },
        placeholderData: keepPreviousData,
    });
    const tableData = ranksListQuery.data?.data ?? [];
    const totalRows = ranksListQuery.data?.total ?? 0;
    const isTableLoading = ranksListQuery.isPending || ranksListQuery.isFetching;

    const invalidateRanksList = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: controlhubKeys.ranks.all() }).then(() => undefined);
    }, [queryClient]);

    useEffect(() => {
        if(session?.user?.permissions?.includes('bulk-delete-ranks')){
            setRowSelectionEnabled(true);
        }
    }, [session?.user?.permissions]);

    const handleSelectionChange = (selectedRows: any[]) => {
        setSelectedRows(selectedRows);
    };

    const columns = useMemo((): TableColumn<RankRow>[] => {
        return [
            { key: 'name', label: 'Name', accessor: (row) => row.name, sortable: true },
            {
                key: 'user_type',
                label: 'User Type',
                accessor: (row) => row.user_type?.name || '',
                sortable: true,
                render: (props) => (
                    <div>
                        {props?.user_type?.name && (
                        <span className="status-badge info">
                                {props?.user_type?.name}
                            </span>
                        )}
                    </div>
                )
             },

            {
                key: 'severity_level',
                label: 'Severity Level',
                accessor: (row) => {
                    const v = (row as unknown as Record<string, unknown>).severity_level;
                    if (typeof v === 'string') return v;
                    if (typeof v === 'number') return String(v);
                    if (v && typeof v === 'object' && 'name' in v && typeof (v as { name: unknown }).name === 'string') {
                        return (v as { name: string }).name;
                    }
                    return '';
                },
                sortable: true,
                render: (props) => {
                    const severityCounts = props.severity_counts || {};
                    const severityLevels = ['Low', 'Medium', 'High', 'Critical'];
                    
                    return (
                        <div className="d-flex align-items-center" style={{ marginLeft: '0' }}>
                            {severityLevels.map((level, index) => {
                                const count = severityCounts[level] || 0;
                                
                                const colors = getSeverityBadgeColors(level);
                                
                                return (
                                    <OverlayTrigger
                                        key={level}
                                        placement="top"
                                        overlay={<Tooltip id={`tooltip-${level}`}>{level}: {count}</Tooltip>}
                                    >
                                        <span 
                                            className="position-relative d-inline-flex align-items-center justify-content-center"
                                            style={{ 
                                                minWidth: '32px',
                                                height: '32px',
                                                padding: '0 8px',
                                                borderRadius: '16px',
                                                marginLeft: '2px',
                                                cursor: 'help',
                                                border: '2px solid white',
                                                backgroundColor: colors.bg,
                                                color: colors.text,
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                zIndex: severityLevels.length - index,
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {level}
                                            <span 
                                                className="position-absolute top-0 end-0 translate-middle d-inline-flex align-items-center justify-content-center"
                                                style={{
                                                    backgroundColor: colors.bg,
                                                    color: colors.text,
                                                    fontSize: '10px',
                                                    fontWeight: '600',
                                                    width: '16px',
                                                    height: '16px',
                                                    borderRadius: '50%',
                                                    border: '1.5px solid white',
                                                    lineHeight: '1'
                                                }}
                                            >
                                                {count}
                                            </span>
                                        </span>
                                    </OverlayTrigger>
                                );
                            })}
                        </div>
                    );
                }
            },

            ...(session?.user?.is_admin === "1" ? [
                {
                    key: 'company',
                    label: 'Created By',
                    accessor: (row: RankRow) => {
                        const c = (row as unknown as Record<string, unknown>).company;
                        if (typeof c === 'string') return c;
                        if (c && typeof c === 'object' && 'name' in c && typeof (c as { name: unknown }).name === 'string') {
                            return (c as { name: string }).name;
                        }
                        return '';
                    },
                    sortable: true,
                },
                {
                    key: 'user_assigned_count',
                    label: 'Assigned Users',
                    accessor: (row: RankRow) => row.user_assigned_count || 0,
                    sortable: true,
                    render: (props: RankRow) => (
                        <div>
                            <span className="status-badge primary">
                                {props.user_assigned_count}
                            </span>
                        </div>
                    )
                 }
            ] : [])
        ];
    }, [session?.user?.is_admin]);

    const [selectedRank, setSelectedRank] = useState<any>(null);
    const [selectedRankName, setSelectedRankName] = useState<any>(null);
    const [selectedRankUserTypeId, setSelectedRankUserTypeId] = useState<number | null>(null);
    const [showEditRankModal, setShowEditRankModal] = useState<boolean>(false);
    const [userTypes, setUserTypes] = useState<any[]>([]);
    const [isLoadingUserTypes, setIsLoadingUserTypes] = useState<boolean>(false);
    
    // Clone Rank Modal State
    const [showCloneRankModal, setShowCloneRankModal] = useState<boolean>(false);
    const [cloneRankId, setCloneRankId] = useState<string | null>(null);
    const [cloneRankName, setCloneRankName] = useState<string>('');

    // Fetch user types
    const fetchUserTypes = useCallback(async () => {
        if (userTypes.length > 0) return; // Already loaded
        setIsLoadingUserTypes(true);
        try {
            const types = await getUserTypes();
            setUserTypes(types || []);
        } catch (error) {
            console.error('Error fetching user types:', error);
        } finally {
            setIsLoadingUserTypes(false);
        }
    }, [userTypes.length]);

    const handleEditRank = async (props: RankRow) => {
        setSelectedRank(props.id);
        setSelectedRankName(props.name);
        // Set user_type_id if available in props
        setSelectedRankUserTypeId(props.user_type_id || null);
        await fetchUserTypes();
        setShowEditRankModal(true);
    };

    const handleSubmitEditRank = async () => {
        const response = await updateRole(selectedRank, selectedRankName, selectedRankUserTypeId);
        if(response){
            setSelectedRank(null);
            setSelectedRankName(null);
            setSelectedRankUserTypeId(null);
            setShowEditRankModal(false);
            setSuccessModalTitle('Rank Updated');
            setSuccessModalDescription('The rank has been updated successfully');
            setTimeout(() => {
              setShowSuccessfulModal(true);
              console.log('Modal state updated:', true);
            }, 100);
            invalidateRanksList();
        }

        
    };

    const [showDeleteRankModal, setShowDeleteRankModal] = useState<boolean>(false);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState<boolean>(false);

    const handleDeleteRank = (props: RankRow) => {
        setSelectedRank(props.id);
        setSelectedRankName(props.name);
        setShowDeleteRankModal(true);
    };

    const handleCloneRank = (props: RankRow) => {
        setCloneRankId(String(props.id));
        setCloneRankName(`${props.name} (Copy)`);
        setShowCloneRankModal(true);
    };

    const handleSubmitCloneRank = async () => {
        if (!cloneRankName.trim()) {
            toast.error('Please enter a rank name');
            return;
        }
        if (!cloneRankId) {
            toast.error('Invalid rank ID');
            return;
        }
        const response = await cloneRank(cloneRankId, cloneRankName.trim());
        if(response){
            setCloneRankId(null);
            setCloneRankName('');
            setShowCloneRankModal(false);
            setSuccessModalTitle('Rank Cloned');
            setSuccessModalDescription('The rank has been cloned successfully');
            setTimeout(() => {
              setShowSuccessfulModal(true);
              console.log('Modal state updated:', true);
            }, 100);
            invalidateRanksList();
        }
    };

    const handleSubmitDeleteRank = async () => {
        const response = await deleteRole(selectedRank);
        if(response){
            setSelectedRank(null);
            setSelectedRankName(null);
            setShowDeleteRankModal(false);
            setSuccessModalTitle('Rank Deleted');
            setSuccessModalDescription('The rank has been deleted successfully');
            setTimeout(() => {
              setShowSuccessfulModal(true);
              console.log('Modal state updated:', true);
            }, 100);
            invalidateRanksList();
        }
    };

    const [deleteRankResponse, setDeleteRankResponse] = useState<any>(null);
    const [showBulkDeleteSummaryModal, setShowBulkDeleteSummaryModal] = useState<boolean>(false);
    const handleBulkDelete = async () => {
        try {
            const selectedIds = selectedRows.map((row: any) => row.id);
            const response = await BulkDeleteRoles(selectedIds);
           
            if(response){
                setDeleteRankResponse(response);
                setShowBulkDeleteSummaryModal(true);
                setShowBulkDeleteModal(false);
                setSelectedRows([]);

                invalidateRanksList();
            }else{
                toast.error('Failed to delete ranks');
            }

            setSelectedRows([]);
            setShowBulkDeleteModal(false);
            invalidateRanksList();
        } catch (error) {
            console.error('Bulk delete error:', error);
            toast.error('An error occurred during bulk delete');
        }
    };

    const [showSuccessfulModal, setShowSuccessfulModal] = useState(false)
    const [successModalTitle, setSuccessModalTitle] = useState('')
    const [successModalDescription, setSuccessModalDescription] = useState('')
    const [showCreateRankModal, setShowCreateRankModal] = useState<boolean>(false);
    const [newRankName, setNewRankName] = useState<string>("");
    const [newRankUserTypeId, setNewRankUserTypeId] = useState<number | null>(null);

    // Severity Level Modal State
    const [showSeverityLevelModal, setShowSeverityLevelModal] = useState<boolean>(false);

    // Bulk Rank Assignment State
    const [showBulkRankAssignmentModal, setShowBulkRankAssignmentModal] = useState<boolean>(false);
    const [selectedUsersForBulk, setSelectedUsersForBulk] = useState<SelectCheckBoxOption[]>([]);
    const [selectedRankForBulk, setSelectedRankForBulk] = useState<{ value: number | string; label: string } | null>(null);
    const [allUsersForBulk, setAllUsersForBulk] = useState<any[]>([]);
    const [allRanksForBulk, setAllRanksForBulk] = useState<any[]>([]);
    const [isLoadingUsersForBulk, setIsLoadingUsersForBulk] = useState<boolean>(false);
    const [isLoadingRanksForBulk, setIsLoadingRanksForBulk] = useState<boolean>(false);
    const [isSubmittingBulkAssignment, setIsSubmittingBulkAssignment] = useState<boolean>(false);
    const [userSearchInput, setUserSearchInput] = useState<string>('');
    const [modules, setModules] = useState<any[]>([]);
    const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
    const [permissions, setPermissions] = useState<any[]>([]);
    const [selectedPermissionId, setSelectedPermissionId] = useState<number | null>(null);
    const [selectedSeverityLevel, setSelectedSeverityLevel] = useState<string>("");
    const [isLoadingModules, setIsLoadingModules] = useState<boolean>(false);
    const [isLoadingPermissions, setIsLoadingPermissions] = useState<boolean>(false);

    const fetchAllRanksForBulk = async () => {
        setIsLoadingRanksForBulk(true);
        try {
            const response = await ListRoles({ page: 1, perPage: 1000, search: "", filters: {} });
            if (response?.dataList && Array.isArray(response.dataList)) {
                setAllRanksForBulk(response.dataList);
            }
        } catch (error) {
            console.error('Error fetching ranks:', error);
        } finally {
            setIsLoadingRanksForBulk(false);
        }
    };

    const fetchAllUsersForBulk = async () => {
        setIsLoadingUsersForBulk(true);
        try {
            const response = await getParentUsers();
            if (response && Array.isArray(response)) {
                setAllUsersForBulk(response);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load users');
        } finally {
            setIsLoadingUsersForBulk(false);
        }
    };

    const handleBulkRankAssignment = async () => {
        setShowBulkRankAssignmentModal(true);
        setSelectedUsersForBulk([]);
        setSelectedRankForBulk(null);
        setUserSearchInput('');
        await fetchAllUsersForBulk();
        await fetchAllRanksForBulk();
    };

    const handleBulkRankAssignmentSubmit = async () => {
        if (!selectedRankForBulk) {
            toast.error('Please select a rank');
            return;
        }
        if (selectedUsersForBulk.length === 0) {
            toast.error('Please select at least one user');
            return;
        }

        setIsSubmittingBulkAssignment(true);
        try {
            const userIds = selectedUsersForBulk.map(opt => String(opt.value));
            const response = await assignRankBulk(selectedRankForBulk.value, userIds);
            if (response) {
                setShowBulkRankAssignmentModal(false);
                setSelectedUsersForBulk([]);
                setSelectedRankForBulk(null);
                setUserSearchInput('');
                setSuccessModalTitle('Ranks Assigned');
                setSuccessModalDescription(`${selectedUsersForBulk.length} user(s) have been assigned the rank successfully`);
                setTimeout(() => {
                    setShowSuccessfulModal(true);
                }, 100);
                invalidateRanksList();
            }
        } catch (error) {
            console.error('Error assigning ranks:', error);
        } finally {
            setIsSubmittingBulkAssignment(false);
        }
    };

    const handleCloseBulkRankAssignmentModal = () => {
        setShowBulkRankAssignmentModal(false);
        setSelectedUsersForBulk([]);
        setSelectedRankForBulk(null);
        setUserSearchInput('');
    };

    // Prepare user options for SelectCheckBox
    const userOptionsForBulk = useMemo(() => {
        if (allUsersForBulk.length === 0) return [];
        
        return allUsersForBulk.map((user) => ({ 
            value: user.id, 
            label: `${user.name || 'Unknown'} (${user.username || user.email || 'N/A'})` 
        }));
    }, [allUsersForBulk]);

    // Prepare rank options for Select
    const rankOptionsForBulk = useMemo(() => {
        return allRanksForBulk.map((rank) => ({
            value: rank.id,
            label: rank.name || `Rank ${rank.id}`
        }));
    }, [allRanksForBulk]);

    const handleOpenCreateRankModal = async () => {
        await fetchUserTypes();
        setShowCreateRankModal(true);
    };

    const handleSubmitCreateRank = async () => {
        const response = await addRole(newRankName, newRankUserTypeId);
        if(response){
            setNewRankName("");
            setNewRankUserTypeId(null);
            setShowCreateRankModal(false);
            setSuccessModalTitle('Rank Created');
            setSuccessModalDescription('The rank has been created successfully');
            setTimeout(() => {
              setShowSuccessfulModal(true);
              console.log('Modal state updated:', true);
            }, 100);
            invalidateRanksList();
        }
    };

    // Severity Level Modal Handlers
    const handleOpenSeverityLevelModal = async () => {
        setIsLoadingModules(true);
        try {
            const modulesData = await getModules();
            setModules(modulesData || []);
        } catch (error) {
            console.error('Error fetching modules:', error);
        } finally {
            setIsLoadingModules(false);
        }
        setShowSeverityLevelModal(true);
    };

    const handleModuleChange = async (moduleId: number | null) => {
        setSelectedModuleId(moduleId);
        setSelectedPermissionId(null);
        setPermissions([]);
        
        if (moduleId) {
            setIsLoadingPermissions(true);
            try {
                const permissionsData = await getPermissionsByModule(moduleId);
                setPermissions(permissionsData || []);
            } catch (error) {
                console.error('Error fetching permissions:', error);
            } finally {
                setIsLoadingPermissions(false);
            }
        }
    };

    const handleSubmitSeverityLevel = async () => {
        if (!selectedPermissionId || !selectedModuleId || !selectedSeverityLevel) {
            toast.error('Please select module, permission, and severity level');
            return;
        }

        const response = await updateSeverityLevel(selectedPermissionId, selectedModuleId, selectedSeverityLevel);
        if(response){
            setSelectedModuleId(null);
            setSelectedPermissionId(null);
            setSelectedSeverityLevel("");
            setPermissions([]);
            setShowSeverityLevelModal(false);
            setSuccessModalTitle('Severity Level Updated');
            setSuccessModalDescription('The severity level has been updated successfully');
            setTimeout(() => {
              setShowSuccessfulModal(true);
            }, 100);
        }
    };

    let permissionHintText = 'Select a permission to update its severity level';
    if (isLoadingPermissions) {
        permissionHintText = 'Loading permissions...';
    } else if (selectedModuleId == null) {
        permissionHintText = 'Please select a module first';
    } else if (permissions.length === 0) {
        permissionHintText = 'No permissions available for this module';
    }

    const tableActions = useMemo<TableAction<RankRow>[]>(() => {
        const actions: TableAction<RankRow>[] = [];

        if (session?.user?.permissions?.includes('edit-ranks')) {
            actions.push({
                label: 'Edit',
                icon: <FiEdit size={16} />,
                variant: 'light',
                className: 'btn-action-style-2 p-1 text-primary',
                onClick: (row: RankRow) => handleEditRank(row),
            });
        }

        if (session?.user?.permissions?.includes('add-ranks')) {
            actions.push({
                label: 'Clone Rank',
                icon: <Copy size={16} />,
                variant: 'light',
                className: 'btn-action-style-2 p-1 text-info',
                onClick: (row: RankRow) => handleCloneRank(row),
            });
        }

        if (session?.user?.permissions?.includes('view-permissions-ranks')) {
            actions.push({
                label: 'View Permissions',
                icon: <FiEye size={16} />,
                variant: 'light',
                className: 'btn-action-style-2 p-1 text-success',
                onClick: (row: RankRow) => {
                    globalThis.location.href = `/controlhub/ranks/permissions/${row.id}`;
                },
            });
        }

        if (session?.user?.permissions?.includes('assign-permissions-ranks')) {
            actions.push({
                label: 'Assign Permissions',
                icon: <FiEdit size={16} />,
                variant: 'light',
                className: 'btn-action-style-2 p-1 text-warning',
                onClick: (row: RankRow) => {
                    globalThis.location.href = `/controlhub/ranks/permissions/edit/${row.id}`;
                },
            });
        }

        if (session?.user?.permissions?.includes('delete-ranks')) {
            actions.push({
                label: 'Delete',
                icon: <FiTrash2 size={16} />,
                variant: 'light',
                className: 'btn-action-style-2 p-1 text-danger',
                onClick: (row: RankRow) => handleDeleteRank(row),
            });
        }

        if (session?.user?.is_admin === '1') {
            actions.push({
                label: 'View Users',
                icon: <FiEye size={16} />,
                variant: 'light',
                className: 'btn-action-style-2 p-1 text-secondary',
                onClick: (row: RankRow) => {
                    router.push({
                        pathname: '/controlhub/users',
                        query: { role_id: row.id },
                    });
                },
            });
        }

        return actions;
    }, [router, session?.user?.is_admin, session?.user?.permissions]);

    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="Controlhub" mainLink="/controlhub/ranks" subTitle={HEADER_CONSTANTS.SUBMENU_LABELS.RANKS} />
            

<Row className="mb-3">
            <Col md={12}>
                <div className="page-header-title style-2">
                <Row className="d-flex justify-content-between align-items-center">
                    <Col md={4}>
                     
                      {/* <h2 className="mb-0">{HEADER_CONSTANTS.SUBMENU_LABELS.RANKS}</h2> */}
                    </Col>


                    <Col md={8} className="d-flex justify-content-end">
                      
                    <div className="action-buttons">
                    {session?.user?.permissions?.includes('add-ranks') && (
                        <Button variant="primary"  onClick={handleOpenCreateRankModal}>Add Rank</Button>
                    )}
                    {session?.user?.permissions?.includes('bulk-assign-ranks') && (
                        <Button variant="danger"  onClick={handleBulkRankAssignment}>Bulk Rank Assignment</Button>
                    )}
                    {session?.user?.is_admin === "1" && (
                        <Button variant="outline-primary" className="ms-2" onClick={handleOpenSeverityLevelModal}>Severity Level</Button>
                    )}
                    </div>



                    </Col>
                  </Row>
               
                
                </div>
            </Col>
            </Row>

            {rowSelectionEnabled && selectedRows.length > 0 && (
                <Row className="mb-3">
                    <Col md={12}>
                        <div className="alert alert-info d-flex align-items-center justify-content-between .selectionRowBox ">
                            <div className="selected-rows">
                                <strong>{selectedRows.length}</strong> Selected
                            </div>
                            <div className="btn-group">
                                <Button variant="outline-danger" size="sm" onClick={() => setShowBulkDeleteModal(true)}>Bulk Delete</Button>
                            </div>
                        </div>
                    </Col>
                </Row>
            )}

            {session?.user?.permissions?.includes('list-ranks') && (
                <GenericTable<RankRow>
                    data={tableData}
                    columns={columns}
                    loading={isTableLoading}
                    actions={tableActions}
                    showActions={tableActions.length > 0}
                    actionsLabel="Action"
                    uniqueKey="id"
                    selectable={rowSelectionEnabled}
                    selectedRows={selectedRows}
                    onSelectionChange={handleSelectionChange}
                    pagination={{
                        currentPage,
                        rowsPerPage,
                        totalRows,
                        pageSizeOptions: [15, 25, 50, 100],
                    }}
                    onPaginationChange={(page, perPage) => {
                        setCurrentPage(page);
                        setRowsPerPage(perPage);
                    }}
                    showToolbar
                    toolbar={{
                        showSearch: true,
                        searchValue,
                        searchPlaceholder: 'Search ranks...',
                        onSearchChange: (value) => {
                            setSearchValue(value);
                            setCurrentPage(1);
                        },
                    }}
                    showToolbarActions={false}
                    emptyMessage="No ranks found"
                    hover
                    size="md"
                />
            )}

           

            <FormModal
                show={showEditRankModal}
                onHide={() => {
                    setShowEditRankModal(false);
                    setSelectedRankUserTypeId(null);
                }}
                title="Edit Rank"
                desc="Please fill in the details below to edit the rank."
                formHtml={
                    <>
                        <div className="form-group mb-3">
                            <label htmlFor="editRankName" className="form-label">Rank Name</label>
                            <input className="form-control" type="text" value={selectedRankName} onChange={(e) => setSelectedRankName(e.target.value)} />
                            <p className="text-muted mt-2 small">Change the name of an existing rank to better reflect its role or purpose in the system</p>
                        </div>
                        <div className="form-group mb-3">
                            <label htmlFor="editRankUserType" className="form-label">User Type</label>
                            <Form.Select
                                id="editRankUserType"
                                value={selectedRankUserTypeId || ''}
                                onChange={(e) => setSelectedRankUserTypeId(e.target.value ? Number.parseInt(e.target.value, 10) : null)}
                                disabled={isLoadingUserTypes}
                            >
                                <option value="">-- Select User Type (Optional) --</option>
                                {userTypes.map((type) => (
                                    <option key={type.id} value={type.id}>
                                        {type.name}
                                    </option>
                                ))}
                            </Form.Select>
                            <p className="text-muted mt-2 small">Select a user type for this rank. Leave empty to remove user type assignment.</p>
                        </div>
                    </>
                }
                submitButtonText="Save changes"
                cancelButtonText="Cancel"
                onSubmit={handleSubmitEditRank}
                onCancel={() => {
                    setShowEditRankModal(false);
                    setSelectedRankUserTypeId(null);
                }}
            />

            <FormModal
                show={showCloneRankModal}
                onHide={() => {
                    setShowCloneRankModal(false);
                    setCloneRankName('');
                    setCloneRankId(null);
                }}
                title="Clone Rank"
                desc="Please enter a name for the cloned rank."
                formHtml={
                    <div className="form-group mb-3">
                            <label htmlFor="cloneRankName" className="form-label">New Rank Name</label>
                            <input 
                                className="form-control" 
                                type="text" 
                                id="cloneRankName"
                                value={cloneRankName} 
                                onChange={(e) => setCloneRankName(e.target.value)}
                                placeholder="Enter rank name"
                            />
                            <p className="text-muted mt-2 small">Enter a name for the cloned rank. The new rank will have the same permissions and settings as the original.</p>
                        </div>
                }
                submitButtonText="Clone Rank"
                cancelButtonText="Cancel"
                onSubmit={handleSubmitCloneRank}
                onCancel={() => {
                    setShowCloneRankModal(false);
                    setCloneRankName('');
                    setCloneRankId(null);
                }}
            />

           

<ConfirmModal
        show={showDeleteRankModal}
        onHide={() => setShowDeleteRankModal(false)}
        onCancel={() => setShowDeleteRankModal(false)}
        title="Delete Rank"
        description="Are you sure you want to delete this rank?"
        targetName={selectedRankName || ""}
        onConfirm={handleSubmitDeleteRank}
        confirmButtonText="Delete"
        confirmButtonVariant="danger"
        requireTextConfirmation={true}
        requiredConfirmationText="delete"
      />


            <FormModal
                show={showCreateRankModal}
                onHide={() => {
                    setShowCreateRankModal(false);
                    setNewRankUserTypeId(null);
                }}
                title="New Rank"
                desc="Please fill in the details below to create a new rank."
                formHtml={
                    <>
                        <div className="form-group mb-3">
                            <label htmlFor="newRankName" className="form-label">Rank Name</label>
                            <input type="text" className="form-control" id="newRankName"  value={newRankName} onChange={(e) => setNewRankName(e.target.value)} placeholder="Rank Name" />
                            <p className="text-muted mt-2 small">Enter the name of the rank you want to create. This will be used to identify the rank in the system.</p>
                        </div>
                        <div className="form-group mb-3">
                            <label htmlFor="newRankUserType" className="form-label">User Type</label>
                            <Form.Select
                                id="newRankUserType"
                                value={newRankUserTypeId || ''}
                                onChange={(e) => setNewRankUserTypeId(e.target.value ? Number.parseInt(e.target.value, 10) : null)}
                                disabled={isLoadingUserTypes}
                            >
                                <option value="">-- Select User Type (Optional) --</option>
                                {userTypes.map((type) => (
                                    <option key={type.id} value={type.id}>
                                        {type.name}
                                    </option>
                                ))}
                            </Form.Select>
                            <p className="text-muted mt-2 small">Optionally select a user type for this rank.</p>
                        </div>
                    </>
                }
                submitButtonText="Create"
                cancelButtonText="Cancel"
                onSubmit={handleSubmitCreateRank}
                onCancel={() => {
                    setShowCreateRankModal(false);
                    setNewRankUserTypeId(null);
                }}
            />

            <ConfirmModal
                show={showBulkDeleteModal}
                onHide={() => setShowBulkDeleteModal(false)}
                onCancel={() => setShowBulkDeleteModal(false)}
                title="Bulk Delete Ranks"
                description={`Are you sure you want to delete the following ranks?`}
                targetName={``}
                onConfirm={handleBulkDelete}
                confirmButtonText="Delete"
                confirmButtonVariant="danger"
                requireTextConfirmation={true}
                requiredConfirmationText="delete"
            />

            

            <FormModal
                show={showBulkDeleteSummaryModal}
                onHide={() => setShowBulkDeleteSummaryModal(false)}
                title="Bulk Delete Summary"
                desc="Please find the details below to bulk delete the ranks."
                formHtml={
                    <div className="d">
                        {deleteRankResponse?.map((item: any) => (
                        <div className="form-group alert alert-primary" key={item.id}>
                           Rank: {item.name}
                           <br />
                           Message: {item.message}
                        </div>
                    ))}
                    </div>
                }
                submitButtonText="Close"
                cancelButtonText="Cancel"
                onSubmit={() => setShowBulkDeleteSummaryModal(false)}
                onCancel={() => setShowBulkDeleteSummaryModal(false)}
            />

<SuccessfulModal
          show={showSuccessfulModal}
          onHide={() => setShowSuccessfulModal(false)}
          title={successModalTitle}
          description={successModalDescription}
        />

            <FormModal
                show={showSeverityLevelModal}
                onHide={() => {
                    setShowSeverityLevelModal(false);
                    setSelectedModuleId(null);
                    setSelectedPermissionId(null);
                    setSelectedSeverityLevel("");
                    setPermissions([]);
                }}
                title="Update Severity Level"
                desc="Please select module, permission, and severity level to update."
                formHtml={
                    <>
                        <div className="form-group mb-3">
                            <label htmlFor="severityModule" className="form-label">Module <span className="text-danger">*</span></label>
                            <Form.Select
                                id="severityModule"
                                value={selectedModuleId || ''}
                                onChange={(e) => handleModuleChange(e.target.value ? Number.parseInt(e.target.value, 10) : null)}
                                disabled={isLoadingModules}
                            >
                                <option value="">-- Select Module --</option>
                                {modules.map((module) => (
                                    <option key={module.id} value={module.id}>
                                        {module.name || module.title || `Module ${module.id}`}
                                    </option>
                                ))}
                            </Form.Select>
                            <p className="text-muted mt-2 small">Select a module to view its permissions</p>
                        </div>
                        <div className="form-group mb-3">
                            <label htmlFor="severityPermission" className="form-label">Permission <span className="text-danger">*</span></label>
                            <Form.Select
                                id="severityPermission"
                                value={selectedPermissionId || ''}
                                onChange={(e) => setSelectedPermissionId(e.target.value ? Number.parseInt(e.target.value, 10) : null)}
                                disabled={isLoadingPermissions || !selectedModuleId || permissions.length === 0}
                            >
                                <option value="">-- Select Permission --</option>
                                {permissions.map((permission) => (
                                    <option key={permission.id} value={permission.id}>
                                        {permission.name || permission.title || `Permission ${permission.id}`}
                                    </option>
                                ))}
                            </Form.Select>
                            <p className="text-muted mt-2 small">
                                {permissionHintText}
                            </p>
                        </div>
                        <div className="form-group mb-3">
                            <label htmlFor="severityLevel" className="form-label">Severity Level <span className="text-danger">*</span></label>
                            <Form.Select
                                id="severityLevel"
                                value={selectedSeverityLevel}
                                onChange={(e) => setSelectedSeverityLevel(e.target.value)}
                                disabled={!selectedPermissionId}
                            >
                                <option value="">-- Select Severity Level --</option>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                            </Form.Select>
                            <p className="text-muted mt-2 small">Select the severity level for this permission</p>
                        </div>
                    </>
                }
                submitButtonText="Update Severity Level"
                cancelButtonText="Cancel"
                onSubmit={handleSubmitSeverityLevel}
                onCancel={() => {
                    setShowSeverityLevelModal(false);
                    setSelectedModuleId(null);
                    setSelectedPermissionId(null);
                    setSelectedSeverityLevel("");
                    setPermissions([]);
                }}
            />

            {/* Bulk Rank Assignment Modal */}
            <Modal
                show={showBulkRankAssignmentModal}
                onHide={handleCloseBulkRankAssignmentModal}
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title className="d-flex align-items-center gap-2">
                        <Users size={20} className="text-danger" />
                        Bulk Rank Assignment
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="form-group mb-4">
                        <label htmlFor="selectRank" className="fw-semibold d-flex align-items-center gap-2 form-label">
                            Select Rank <span className="text-danger">*</span>
                        </label>
                        <Select
                            options={rankOptionsForBulk}
                            value={selectedRankForBulk}
                            onChange={(opt) => setSelectedRankForBulk(opt as { value: number | string; label: string } | null)}
                            placeholder="Select a rank..."
                            isClearable={true}
                            isSearchable={true}
                            isLoading={isLoadingRanksForBulk}
                        />
                        <Form.Text className="text-muted d-flex align-items-center gap-1 form-text mt-2">
                            <span style={{ fontSize: '0.813rem' }}>
                                Select a single rank to assign to multiple users.
                            </span>
                        </Form.Text>
                    </div>

                    <div className="form-group mb-4">
                        <label htmlFor="selectUsers" className="fw-semibold d-flex align-items-center gap-2 form-label">
                            Select Users <span className="text-danger">*</span>
                        </label>
                        <SelectCheckBox
                            options={userOptionsForBulk}
                            value={selectedUsersForBulk}
                            onChange={(opts: MultiValue<SelectCheckBoxOption>) =>
                                setSelectedUsersForBulk((opts ?? []) as SelectCheckBoxOption[])
                            }
                            placeholder="Select users to assign rank..."
                            isLoading={isLoadingUsersForBulk}
                            inputValue={userSearchInput}
                            onInputChange={(newValue: string, action: { action: string }) => {
                                if (action.action !== 'input-blur' && action.action !== 'menu-close') {
                                    setUserSearchInput(newValue);
                                }
                            }}
                        />
                        <Form.Text className="text-muted d-flex align-items-center gap-1 form-text mt-2">
                            <span style={{ fontSize: '0.813rem' }}>
                                Select multiple users to assign the selected rank. You can search to filter the list.
                            </span>
                        </Form.Text>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseBulkRankAssignmentModal} disabled={isSubmittingBulkAssignment}>
                        Cancel
                    </Button>
                    <Button 
                        variant="danger" 
                        onClick={handleBulkRankAssignmentSubmit}
                        disabled={!selectedRankForBulk || selectedUsersForBulk.length === 0 || isSubmittingBulkAssignment}
                    >
                        {isSubmittingBulkAssignment ? (
                            <>
                                <output className="spinner-border spinner-border-sm me-1" aria-live="polite">
                                    <span className="visually-hidden">Assigning...</span>
                                </output>
                                Assigning...
                            </>
                        ) : (
                            <>
                                Assign Rank to {selectedUsersForBulk.length} User(s)
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </React.Fragment>
    );
};

Ranks.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default Ranks;
