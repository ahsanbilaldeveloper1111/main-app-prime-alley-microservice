import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useCallback, useMemo, useEffect } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { ListRoles, updateRole,deleteRole,addRole,BulkDeleteRoles, getUserTypes, getModules, getPermissionsByModule, updateSeverityLevel } from '@utils/roles';
import { Column } from '@components/CustomDataTable';
import { Button, Row, Col, Form, OverlayTrigger, Tooltip, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Select, { SingleValue } from 'react-select';
import SelectCheckBox, { SelectCheckBoxOption } from '@components/SelectCheckBox';
import { getParentUsers, assignRankBulk } from '@utils/users';
import { Users } from 'lucide-react';

import '@assets/scss/common.scss';
import SuccessfulModal from '@pages/partial/SuccessfulModal'
import FormModal from '@pages/partial/FormModal'
import ConfirmModal from '@pages/partial/ConfirmModal'

import { FiEdit, FiTrash2, FiEye } from 'react-icons/fi';
import DatatableActionButton from '@components/DatatableActionButton';
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

const Ranks = () => {
    const { data: session } = useSession();
    const router = useRouter();
    
    // We don't need the redirect effect anymore since we're showing the message on page

    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [currentFilters, setCurrentFilters] = useState({});
    const [selectedRows, setSelectedRows] = useState<any[]>([]);
    const [rowSelectionEnabled, setRowSelectionEnabled] = useState<boolean>(false);
    const [clearSelectedRows, setClearSelectedRows] = useState<boolean>(false);

    useEffect(() => {
        if(session?.user?.permissions?.includes('bulk-delete-ranks')){
            setRowSelectionEnabled(true);
        }
    }, [session?.user?.permissions]);

    const handleSelectionChange = (selectedRows: any[]) => {
        setSelectedRows(selectedRows);
        setClearSelectedRows(false);
    };

    const columns = useMemo((): Column[] => {
        return [
            { key: 'Name', name: 'name', selector: (row: any) => row.name, sortable: true },
            { key: 'User Type', name: 'User Type', selector: (row: any) => row.user_type, sortable: true,
                cell: (props: any) => (
                    <div>
                        {props?.user_type?.name && (
                        <span className="status-badge info">
                                {props?.user_type?.name}
                            </span>
                        )}
                    </div>
                )
             },

            { key: 'Severity Level', name: 'Severity Level', selector: (row: any) => row.severity_level, sortable: true,
                cell: (props: any) => {
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
                { key: 'Company', name: 'Created By', selector: (row: any) => row.company, sortable: true },
                { key: 'Assigned Users', name: 'Assigned Users', selector: (row: any) => row.user_assigned_count, sortable: true,
                    cell: (props: any) => (
                        <div>
                            <span className="status-badge primary">
                                {props.user_assigned_count}
                            </span>
                        </div>
                    )
                 }
            ] : []),


            ...(session?.user?.permissions?.includes('delete-ranks') || session?.user?.permissions?.includes('edit-ranks') || session?.user?.permissions?.includes('view-permissions-ranks') || session?.user?.permissions?.includes('assign-permissions-ranks') ? [
                {
                    key: 'Action',
                    name: 'ACTION',
                    selector: (row: any) => row.id,
                    sortable: false,
                    cell: (props: any) => (
                        <DatatableActionButton
                            actions={[
                                ...(session?.user?.permissions?.includes('edit-ranks') ? [{
                                    label: 'Edit',
                                    icon: <FiEdit className="me-2" />,
                                    onClick: () => handleEditRank(props),
                                    className: 'action-edit'
                                }] : []),
                                ...(session?.user?.permissions?.includes('view-permissions-ranks') ? [{
                                    label: 'View Permissions',
                                    icon: <FiEye className="me-2" />,
                                    onClick: () => {
                                        window.location.href = `/controlhub/ranks/permissions/${props.id}`;
                                    },
                                    className: 'action-view'
                                }] : []),
                                ...(session?.user?.permissions?.includes('assign-permissions-ranks') ? [{
                                    label: 'Assign Permissions',
                                    icon: <FiEdit className="me-2" />,
                                    onClick: () => {
                                        window.location.href = `/controlhub/ranks/permissions/edit/${props.id}`;
                                    },
                                    className: 'action-assign'
                                }] : []),
                                ...(session?.user?.permissions?.includes('delete-ranks') ? [{
                                    label: 'Delete',
                                    icon: <FiTrash2 className="me-2" />,
                                    onClick: () => handleDeleteRank(props),
                                    className: 'text-danger'
                                }] : []),

                                ...(session?.user?.is_admin == "1" ? [{
                                    label: 'View Users',
                                    icon: <FiEye className="me-2" />,
                                    onClick: () => {
                                        router.push({
                                            pathname: '/controlhub/users',
                                            query: { role_id: props.id }
                                        });
                                    },
                                    className: 'action-view'
                                }] : []),


                            ]}
                        />
                    )
                }
            ] : [])
        ];
    }, [rowSelectionEnabled, session?.user?.is_admin, session?.user?.permissions]);

    const fetchRoles = useCallback(
        async (page = 1, perPage = 15, search = "") => {
            return await ListRoles({ page, perPage, search, filters: currentFilters });
        },
        [currentFilters]
    );

    const handleFiltersChange = (filters: any) => {
        //console.log('Filters changed:', filters);
        setCurrentFilters(filters);
    };

    const handleExport = async (exportType: string, filters: Record<string, any>) => {
       
        try {
            await ListRoles({ page: 1, perPage: 15, search: "", filters, isExport: true, exportType });
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Export failed. Please try again.');
        }
    };

    const [selectedRank, setSelectedRank] = useState<any>(null);
    const [selectedRankName, setSelectedRankName] = useState<any>(null);
    const [selectedRankUserTypeId, setSelectedRankUserTypeId] = useState<number | null>(null);
    const [showEditRankModal, setShowEditRankModal] = useState<boolean>(false);
    const [userTypes, setUserTypes] = useState<any[]>([]);
    const [isLoadingUserTypes, setIsLoadingUserTypes] = useState<boolean>(false);

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

    const handleEditRank = async (props: any) => {
        setSelectedRank(props.id);
        setSelectedRankName(props.name);
        // Set user_type_id if available in props
        setSelectedRankUserTypeId(props.user_type_id || null);
        await fetchUserTypes();
        setShowEditRankModal(true);
    };

    const handleSubmitEditRank = async () => {
        //console.log('Submit edit rank:', selectedRank, selectedRankName);
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
            setRefreshKey(prev => prev + 1); // Trigger refresh
        }

        
    };

    const [showDeleteRankModal, setShowDeleteRankModal] = useState<boolean>(false);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState<boolean>(false);

    const handleDeleteRank = (props: any) => {
        setSelectedRank(props.id);
        setSelectedRankName(props.name);
        setShowDeleteRankModal(true);
    };

    const handleSubmitDeleteRank = async (confirmationText: string) => {
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
            setRefreshKey(prev => prev + 1); // Trigger refresh
        }
    };

    const [deleteRankResponse, setDeleteRankResponse] = useState<any>(null);
    const [showBulkDeleteSummaryModal, setShowBulkDeleteSummaryModal] = useState<boolean>(false);
    const handleBulkDelete = async (confirmationText: string) => {
        try {
            const selectedIds = selectedRows.map((row: any) => row.id);
            const response = await BulkDeleteRoles(selectedIds);
           
            if(response){
                setDeleteRankResponse(response);
                setShowBulkDeleteSummaryModal(true);
                setShowBulkDeleteModal(false);
                // setSuccessModalTitle('Ranks Deleted');
                // setSuccessModalDescription('The ranks have been deleted successfully');
                // setTimeout(() => {
                //   setShowSuccessfulModal(true);
                //   console.log('Modal state updated:', true);
                // }, 100);
                // Reset selection and refresh table
                setSelectedRows([]);

                setClearSelectedRows(true);
                setRefreshKey(prev => prev + 1);
            }else{
                toast.error('Failed to delete ranks');
            }

            // Reset state
            setSelectedRows([]);
            setShowBulkDeleteModal(false);
            setRefreshKey(prev => prev + 1); // Trigger refresh
        } catch (error) {
            console.error('Bulk delete error:', error);
            toast.error('An error occurred during bulk delete');
        }
    };

    const [showSuccessfulModal, setShowSuccessfulModal] = useState(false)
    const [successModalTitle, setSuccessModalTitle] = useState('')
    const [successModalDescription, setSuccessModalDescription] = useState('')
    const handleCloseSuccessfulModal = () => {
        setShowSuccessfulModal(false)
    }

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
            if (response && response.dataList && Array.isArray(response.dataList)) {
                setAllRanksForBulk(response.dataList);
            }
        } catch (error) {
            console.error('Error fetching ranks:', error);
           // toast.error('Failed to load ranks');
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
                setRefreshKey(prev => prev + 1);
            }
        } catch (error) {
            console.error('Error assigning ranks:', error);
           // toast.error('Failed to assign ranks');
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
            setRefreshKey(prev => prev + 1); // Trigger refresh
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

    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="Controlhub" mainLink="/controlhub/ranks" subTitle={HEADER_CONSTANTS.SUBMENU_LABELS.RANKS} />
            

<Row className="mb-3">
            <Col md={12}>
                <div className="page-header-title style-2">
                <Row className="d-flex justify-content-between align-items-center">
                    <Col md={4}>
                      
                      <h2 className="mb-0">{HEADER_CONSTANTS.SUBMENU_LABELS.RANKS}</h2>
                    </Col>


                    <Col md={8} className="d-flex justify-content-end">
                      
                    <div className="action-buttons">
                    {/* <div className="search-container">
                            <i className="fas fa-search search-icon"></i>
                            <input type="text" className="search-bar" placeholder="Search rank..." onChange={(e) => handleFiltersChange({...currentFilters, search: e.target.value})}/>
                        </div> */}
                    
                    {/* <RolesFilters onFiltersChange={handleFiltersChange} onExport={handleExport} /> */}
                    {session?.user?.permissions?.includes('add-ranks') && (
                        <>
                        <Button variant="primary"  onClick={handleOpenCreateRankModal}>Add Rank</Button>
                        </>
                    )}
                    {session?.user?.permissions?.includes('assign-rank-users') && (
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
                 <GenericListPage
                 columns={columns}
                 fetchData={fetchRoles}
                 title="Ranks"
                 searchPlaceholder="Search ranks..."
                 defaultPageSize={15}
                 filters={currentFilters}
                 refreshKey={refreshKey}
                 rowSelection={rowSelectionEnabled}
                 onSelectionChange={handleSelectionChange}
                 clearSelectedRows={clearSelectedRows}
                 keyField="id"
                 search={true}
                 tableStyle="table-style-2"
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

           

<ConfirmModal
        show={showDeleteRankModal}
        onHide={() => setShowDeleteRankModal(false)}
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
                    <>
                        <div className="d">
                        {deleteRankResponse && deleteRankResponse.map((item: any) => (
                        <div className="form-group alert alert-primary" key={item.id}>
                           Rank: {item.name}
                           <br />
                           Message: {item.message}
                        </div>
                    ))}
                        </div>
                    </>
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
                                {isLoadingPermissions ? 'Loading permissions...' : 
                                 !selectedModuleId ? 'Please select a module first' :
                                 permissions.length === 0 ? 'No permissions available for this module' :
                                 'Select a permission to update its severity level'}
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
                            onChange={(opts) => setSelectedUsersForBulk(opts as SelectCheckBoxOption[])}
                            placeholder="Select users to assign rank..."
                            isLoading={isLoadingUsersForBulk}
                            inputValue={userSearchInput}
                            onInputChange={(newValue, action) => {
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
                                <div className="spinner-border spinner-border-sm me-1" role="status" />
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
