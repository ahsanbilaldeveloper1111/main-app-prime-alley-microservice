import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useCallback, useMemo, useRef } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import {ListTeams, updateTeam, deleteTeam, addTeam, assignUsersToTeam, removeUsersFromTeam, removeOwnersFromTeam, getTeamUsers, removeModulesFromTeam, getTeamModules, updateTeamModules } from '@utils/teams';
import { Column } from '@components/CustomDataTable';
import { Button, Form, Modal, Row, Col, Card } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import '@assets/scss/common.scss';
import FormModal from "@pages/partial/FormModal";
import SuccessfulModal from '@pages/partial/SuccessfulModal';
import ConfirmModal from '@pages/partial/ConfirmModal';
import { Edit, Info, Trash2, Users, UserPlus, UserMinus, Package } from 'lucide-react';
import AsyncSelect from 'react-select/async';
import Select, { MultiValue } from 'react-select';
import { getParentUsers } from '@utils/users';
import { getModules } from '@utils/roles';
import { toast } from 'react-toastify';
import { HEADER_CONSTANTS } from '@constants/headerConstants';



const Teams = () => {
    const { data: session } = useSession();
   
    const columns: Column[] = [
        { key: 'Name', name: 'Name', selector: (row: any) => row.name, sortable: true },

        { key: 'Assigned Modules', name: 'Assigned Modules', selector: (row: any) => row.module_names?.join(', ') || '', sortable: true,
            cell: (props: any) => (
                <div>
                    {props?.module_names && props.module_names.length > 0 ? (
                        <div className="d-flex flex-wrap gap-1">
                            {props.module_names.map((moduleName: string, index: number) => (
                                <span key={`${moduleName}-${index}`} className="status-badge primary">
                                    {moduleName}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <span className="status-badge info">Modules not assigned</span>
                    )}
                </div>
            )
        },
        { key: 'owner_count', name: 'Assigned Owners', selector: (row: any) => row.owner_count, sortable: true,
            cell: (props: any) => (
                <div>
                    <span className="status-badge primary">
                        {props?.owner_count}
                    </span>
                </div>
            )
        },
        { key: 'assigned_user_count', name: 'Assigned Users', selector: (row: any) => row.assigned_user_count, sortable: true,
            cell: (props: any) => (
                <div>
                    <span className="status-badge primary">
                        {props.assigned_user_count}
                    </span>
                </div>
            )
         },
       

        ...(session?.user?.permissions?.includes('edit-teams') || session?.user?.permissions?.includes('delete-teams') || session?.user?.permissions?.includes('assign-users-to-teams') || session?.user?.permissions?.includes('assign-modules-to-teams') ? [
            {
                key: 'Action',
                name: 'Actions',
                selector: (row: any) => row.id,
                sortable: false,
                cell: (props: any) => (
                    <div className="d-flex gap-2">
                        {session?.user?.permissions?.includes('edit-teams') && (
                            <Button variant="light" className="btn-action-style-2 p-1 text-primary" title="Edit" onClick={() => handleEditTeam(props)}>
                                <Edit size={16} />
                            </Button>
                        )}
                        {(session?.user?.permissions?.includes('assign-teams-groups') || session?.user?.permissions?.includes('remove-teams-groups')) && (
                            <Button variant="light" className="btn-action-style-2 p-1 text-success" title="Assign Users" onClick={() => handleAssignUsers(props)}>
                                <UserPlus size={16} />
                            </Button>
                        )}
                       
                        {session?.user?.permissions?.includes('add-modules-teams') && (
                            <Button variant="light" className="btn-action-style-2 p-1 text-warning" title="Assign Modules" onClick={() => handleAssignModules(props)}>
                                <Package size={16} />
                            </Button>
                        )}
                        {session?.user?.permissions?.includes('delete-teams') && (
                            <Button variant="light" className="btn-action-style-2 p-1 text-danger" title="Delete" onClick={() => handleDeleteTeam(props)}>
                                <Trash2 size={16} />
                            </Button>
                        )}
                    </div>
                )
            }
        ] : [])
    ];

    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [currentFilters] = useState({});

    // Memoize filters to prevent unnecessary re-renders when object reference changes but values are the same
    const prevFiltersStringRef = useRef<string>('');
    const prevFiltersRef = useRef<any>({});
    
    const memoizedFilters = useMemo(() => {
        const filtersString = JSON.stringify(currentFilters || {});
        // Only update if the stringified filters actually changed
        if (filtersString !== prevFiltersStringRef.current) {
            prevFiltersStringRef.current = filtersString;
            prevFiltersRef.current = currentFilters || {};
            return currentFilters || {};
        }
        // Return the previous reference to maintain stability
        return prevFiltersRef.current;
    }, [currentFilters]);

    const fetchTeams = useCallback(
        async (page = 1, perPage = 15, search = "") => {
            return await ListTeams({ page, perPage, search, filters: memoizedFilters });
        },
        [memoizedFilters]
    );


    
    const [showSuccessfulModal, setShowSuccessfulModal] = useState(false)
    const [successModalTitle, setSuccessModalTitle] = useState('')
    const [successModalDescription, setSuccessModalDescription] = useState('')
    
    const [selectedTeam, setSelectedTeam] = useState<any>(null);
    const [selectedTeamName, setSelectedTeamName] = useState<any>(null);
    const [showEditTeamModal, setShowEditTeamModal] = useState<boolean>(false);

    const handleEditTeam = (props: any) => {
        setSelectedTeam(props.id);
        setSelectedTeamName(props.name);
        setShowEditTeamModal(true);
    };

    const handleSubmitEditTeam = async () => {
        
        const response = await updateTeam(selectedTeam, selectedTeamName);
        if(response){
            setSelectedTeam(null);
            setSelectedTeamName(null);
            setShowEditTeamModal(false);
            setSuccessModalTitle('Team Updated')
            setSuccessModalDescription('Team has been updated successfully');
            setTimeout(() => {
                setShowSuccessfulModal(true);
            }, 100);
            setRefreshKey(prev => prev + 1); // Trigger refresh
        }

        
    };

    const [showDeleteTeamModal, setShowDeleteTeamModal] = useState<boolean>(false);
    
    const handleDeleteTeam = (props: any) => {
        setSelectedTeam(props.id);
        setSelectedTeamName(props.name);
        setShowDeleteTeamModal(true);
    };

    const handleSubmitDeleteTeam = async () => {
        const response = await deleteTeam(selectedTeam);
        if(response){
            setSelectedTeam(null);
            setSelectedTeamName(null);
            setShowDeleteTeamModal(false);
            setSuccessModalTitle('Team Deleted')
            setSuccessModalDescription('Team has been deleted successfully');
            setTimeout(() => {
                setShowSuccessfulModal(true);
            }, 100);
            setRefreshKey(prev => prev + 1); 
        }
    };

    const [showCreateTeamModal, setShowCreateTeamModal] = useState<boolean>(false);
    const [newTeamName, setNewTeamName] = useState<string>("");

    const handleSubmitCreateTeam = async () => {
        const response = await addTeam(newTeamName);
        if(response){
            setNewTeamName("");
            setShowCreateTeamModal(false);
            
            setSuccessModalTitle('Team Created')
            setSuccessModalDescription('New Team has been added successfully');
            setTimeout(() => {
                setShowSuccessfulModal(true);
            }, 100);

            setRefreshKey(prev => prev + 1); 
        }
    };

    // User Assignment State
    const [showAssignUsersModal, setShowAssignUsersModal] = useState<boolean>(false);
    const [teamUsers, setTeamUsers] = useState<any[]>([]);
    const [teamOwners, setTeamOwners] = useState<any[]>([]);
    const [selectedUsersToAssign, setSelectedUsersToAssign] = useState<string[]>([]);
    const [selectedOwnersToAssign, setSelectedOwnersToAssign] = useState<string[]>([]);
    const [selectedUsersToRemove, setSelectedUsersToRemove] = useState<number[]>([]);
    const [selectedOwnersToRemove, setSelectedOwnersToRemove] = useState<number[]>([]);
    const [showRemoveUsersConfirmModal, setShowRemoveUsersConfirmModal] = useState<boolean>(false);
    const [showRemoveOwnersConfirmModal, setShowRemoveOwnersConfirmModal] = useState<boolean>(false);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);
    const [isLoadingTeamUsers, setIsLoadingTeamUsers] = useState<boolean>(false);

    const handleAssignUsers = async (props: any) => {
        setSelectedTeam(props.id);
        setSelectedTeamName(props.name);
        setShowAssignUsersModal(true);
        setSelectedUsersToAssign([]);
        setSelectedOwnersToAssign([]);
        // Load all users when modal opens to ensure value mapping works
        await fetchAllUsers();
        await fetchTeamUsers(props.id);
    };

    const fetchTeamUsers = async (teamId: number) => {
        setIsLoadingTeamUsers(true);
        try {
            const response = await getTeamUsers(teamId);
            // Handle new API response structure
            if (response && typeof response === 'object' && !Array.isArray(response)) {
                setTeamUsers(response.team_member || []);
                setTeamOwners(response.team_owners || []);
            } else if (Array.isArray(response)) {
                // Fallback for old response format
                setTeamUsers(response || []);
                setTeamOwners([]);
            } else {
                setTeamUsers([]);
                setTeamOwners([]);
            }
        } catch (error) {
            console.error('Error fetching team users:', error);
            setTeamUsers([]);
            setTeamOwners([]);
        } finally {
            setIsLoadingTeamUsers(false);
        }
    };

    const fetchAllUsers = async (): Promise<any[]> => {
        if (allUsers.length > 0 && !isLoadingUsers) return allUsers; // Already loaded
        setIsLoadingUsers(true);
        try {
            const response = await getParentUsers();
            if (response && Array.isArray(response)) {
                setAllUsers(response);
                return response;
            }
            return [];
        } catch (error) {
            console.error('Error fetching users:', error);
            return [];
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const loadUserOptions = (inputValue: string): Promise<Array<{ value: number; label: string }>> => {
        const trimmed = (inputValue || '').trim();
        if (trimmed.length < 2) {
            return Promise.resolve([]);
        }
        
        // Ensure users are loaded
        const ensureData = allUsers.length === 0 && !isLoadingUsers
            ? fetchAllUsers()
            : Promise.resolve(allUsers);
        
        return ensureData.then((users) => {
            // Use the returned users or fallback to state
            const usersToSearch = users && users.length > 0 ? users : allUsers;
            
            if (usersToSearch.length === 0) {
                return [];
            }
            
            const lower = trimmed.toLowerCase();
            const assignedUserIds = new Set([...teamUsers.map(u => u.id), ...teamOwners.map(u => u.id)]);
            const selectedOwnerIds = new Set(selectedOwnersToAssign.map(id => Number.parseInt(id, 10)));
            const selectedUserIds = new Set(selectedUsersToAssign.map(id => Number.parseInt(id, 10)));
            
            const options = usersToSearch
                .filter((user) => !assignedUserIds.has(user.id))
                .filter((user) => !selectedOwnerIds.has(user.id))
                .filter((user) => !selectedUserIds.has(user.id))
                .filter((user) => {
                    const nameMatch = user.name && user.name.toLowerCase().includes(lower);
                    const usernameMatch = user.username && user.username.toLowerCase().includes(lower);
                    const emailMatch = user.email && user.email.toLowerCase().includes(lower);
                    return nameMatch || usernameMatch || emailMatch;
                })
                .slice(0, 200)
                .map((user) => ({ 
                    value: user.id, 
                    label: `${user.name || 'Unknown'} (${user.username || user.email || 'N/A'})` 
                }));
            return options;
        });
    };

    const loadOwnerOptions = (inputValue: string): Promise<Array<{ value: number; label: string }>> => {
        const trimmed = (inputValue || '').trim();
        if (trimmed.length < 2) {
            return Promise.resolve([]);
        }
        
        // Ensure users are loaded
        // Ensure users are loaded
        const ensureData = allUsers.length === 0 && !isLoadingUsers
            ? fetchAllUsers()
            : Promise.resolve(allUsers);
        
        return ensureData.then((users) => {
            // Use the returned users or fallback to state
            const usersToSearch = users && users.length > 0 ? users : allUsers;
            
            if (usersToSearch.length === 0) {
                return [];
            }
            
            const lower = trimmed.toLowerCase();
            const assignedUserIds = new Set([...teamUsers.map(u => u.id), ...teamOwners.map(u => u.id)]);
            const selectedUserIds = new Set(selectedUsersToAssign.map(id => Number.parseInt(id, 10)));
            const selectedOwnerIds = new Set(selectedOwnersToAssign.map(id => Number.parseInt(id, 10)));
            
            const options = usersToSearch
                .filter((user) => !assignedUserIds.has(user.id))
                .filter((user) => !selectedUserIds.has(user.id))
                .filter((user) => !selectedOwnerIds.has(user.id))
                .filter((user) => {
                    const nameMatch = user.name && user.name.toLowerCase().includes(lower);
                    const usernameMatch = user.username && user.username.toLowerCase().includes(lower);
                    const emailMatch = user.email && user.email.toLowerCase().includes(lower);
                    return nameMatch || usernameMatch || emailMatch;
                })
                .slice(0, 200)
                .map((user) => ({ 
                    value: user.id, 
                    label: `${user.name || 'Unknown'} (${user.username || user.email || 'N/A'})` 
                }));
            return options;
        });
    };

    const handleUserSelectionChange = (selectedOptions: MultiValue<{ value: number; label: string }>) => {
        const values = (selectedOptions || []).map((opt) => opt.value.toString());
        setSelectedUsersToAssign(values);
    };

    const handleOwnerSelectionChange = (selectedOptions: MultiValue<{ value: number; label: string }>) => {
        const values = (selectedOptions || []).map((opt) => opt.value.toString());
        setSelectedOwnersToAssign(values);
    };

    const handleSubmitAssignUsers = async () => {
        if (selectedUsersToAssign.length === 0 && selectedOwnersToAssign.length === 0) {
            toast.error('Please select at least one user or owner to assign');
            return;
        }

        const userIds = selectedUsersToAssign.map(id => Number.parseInt(id, 10));
        const ownerIds = selectedOwnersToAssign.length > 0 
            ? selectedOwnersToAssign.map(id => Number.parseInt(id, 10))
            : undefined;
        const response = await assignUsersToTeam(selectedTeam, userIds, ownerIds);
        
        if (response) {
            setSelectedUsersToAssign([]);
            setSelectedOwnersToAssign([]);
            await fetchTeamUsers(selectedTeam);
            
            // Close the assign users modal
            //handleCloseAssignUsersModal();
            
            setRefreshKey(prev => prev + 1);
        }
    };

    const handleRemoveUser = async (userId: number) => {
        // Check if user is an owner
        const isOwner = teamOwners.some(owner => owner.id === userId);
        
        const response = isOwner 
            ? await removeOwnersFromTeam(selectedTeam, [userId])
            : await removeUsersFromTeam(selectedTeam, [userId]);
            
        if (response) {
            await fetchTeamUsers(selectedTeam);
            setRefreshKey(prev => prev + 1);
        }
    };

    const handleSelectUserToRemove = (userId: number, isOwner: boolean) => {
        if (isOwner) {
            setSelectedOwnersToRemove(prev => 
                prev.includes(userId) 
                    ? prev.filter(id => id !== userId)
                    : [...prev, userId]
            );
        } else {
            setSelectedUsersToRemove(prev => 
                prev.includes(userId) 
                    ? prev.filter(id => id !== userId)
                    : [...prev, userId]
            );
        }
    };

    const handleSelectAllUsersToRemove = (isOwner: boolean) => {
        if (isOwner) {
            const allOwnerIds = teamOwners.map(owner => owner.id);
            setSelectedOwnersToRemove(prev => 
                prev.length === allOwnerIds.length ? [] : allOwnerIds
            );
        } else {
            const allUserIds = teamUsers.map(user => user.id);
            setSelectedUsersToRemove(prev => 
                prev.length === allUserIds.length ? [] : allUserIds
            );
        }
    };

    const handleConfirmRemoveUsers = async () => {
        if (selectedUsersToRemove.length === 0 && selectedOwnersToRemove.length === 0) {
            toast.error('Please select at least one user or owner to remove');
            return;
        }

        let success = true;

        // Remove owners
        if (selectedOwnersToRemove.length > 0) {
            const response = await removeOwnersFromTeam(selectedTeam, selectedOwnersToRemove);
            if (!response) {
                success = false;
            }
        }

        // Remove users
        if (selectedUsersToRemove.length > 0) {
            const response = await removeUsersFromTeam(selectedTeam, selectedUsersToRemove);
            if (!response) {
                success = false;
            }
        }

        if (success) {
            setSelectedUsersToRemove([]);
            setSelectedOwnersToRemove([]);
            setShowRemoveUsersConfirmModal(false);
            setShowRemoveOwnersConfirmModal(false);
            await fetchTeamUsers(selectedTeam);
            setRefreshKey(prev => prev + 1);
        }
    };

    const handleCloseAssignUsersModal = () => {
        setShowAssignUsersModal(false);
        setSelectedUsersToAssign([]);
        setSelectedOwnersToAssign([]);
        setSelectedUsersToRemove([]);
        setSelectedOwnersToRemove([]);
        setTeamUsers([]);
        setTeamOwners([]);
        setSelectedTeam(null);
        setSelectedTeamName(null);
    };

    // Module Assignment State
    const [showAssignModulesModal, setShowAssignModulesModal] = useState<boolean>(false);
    const [teamModules, setTeamModules] = useState<any[]>([]);
    const [selectedModulesToAssign, setSelectedModulesToAssign] = useState<number[]>([]);
    const [allModules, setAllModules] = useState<any[]>([]);
    const [isLoadingModules, setIsLoadingModules] = useState<boolean>(false);
    const [isLoadingTeamModules, setIsLoadingTeamModules] = useState<boolean>(false);

    const handleAssignModules = async (props: any) => {
        setSelectedTeam(props.id);
        setSelectedTeamName(props.name);
        setShowAssignModulesModal(true);
        setSelectedModulesToAssign([]);
        await fetchAllModules();
        await fetchTeamModules(props.id);
    };

    const fetchTeamModules = async (teamId: number) => {
        setIsLoadingTeamModules(true);
        try {
            const modules = await getTeamModules(teamId);
            setTeamModules(modules || []);
            // Pre-select currently assigned modules
            if (modules && modules.length > 0) {
                const moduleIds = modules.map((m: any) => m.id || m.module_id).filter((id: any) => id);
                setSelectedModulesToAssign(moduleIds);
            }
            return modules || [];
        } catch (error) {
            console.error('Error fetching team modules:', error);
            setTeamModules([]);
            return [];
        } finally {
            setIsLoadingTeamModules(false);
        }
    };

    const fetchAllModules = async () => {
        if (allModules.length > 0) return; // Already loaded
        setIsLoadingModules(true);
        try {
            const modules = await getModules();
            if (modules && Array.isArray(modules)) {
                setAllModules(modules);
            }
        } catch (error) {
            console.error('Error fetching modules:', error);
        } finally {
            setIsLoadingModules(false);
        }
    };

    const handleModuleSelectionChange = (selectedOptions: MultiValue<{ value: number; label: string }>) => {
        const values = (selectedOptions || []).map((opt) => opt.value);
        setSelectedModulesToAssign(values);
    };

    const handleSubmitAssignModules = async () => {
        if (selectedModulesToAssign.length === 0) {
            toast.error('Please select at least one module to assign');
            return;
        }

        const selectedCount = selectedModulesToAssign.length;
        const response = await updateTeamModules(selectedTeam, selectedModulesToAssign);
        
        if (response) {
            // Clear selected modules immediately after successful submission
            setSelectedModulesToAssign([]);
            // Fetch updated team modules but don't re-populate selectedModulesToAssign since we're closing
            setIsLoadingTeamModules(true);
            try {
                const modules = await getTeamModules(selectedTeam);
                setTeamModules(modules || []);
            } catch (error) {
                console.error('Error fetching team modules:', error);
                setTeamModules([]);
            } finally {
                setIsLoadingTeamModules(false);
            }
            
            setSuccessModalTitle('Modules Updated')
            setSuccessModalDescription(`${selectedCount} module(s) have been assigned to the team successfully`);
            // Close the assign modules modal
            handleCloseAssignModulesModal();
            setTimeout(() => {
                setShowSuccessfulModal(true);
            }, 100);
            setRefreshKey(prev => prev + 1);
        }
    };

    const handleRemoveModule = async (moduleId: number) => {
        const response = await removeModulesFromTeam(selectedTeam, [moduleId]);
        if (response) {
            await fetchTeamModules(selectedTeam);
            setSuccessModalTitle('Module Removed')
            setSuccessModalDescription('Module has been removed from the team successfully');
            setTimeout(() => {
                setShowSuccessfulModal(true);
            }, 100);
            setRefreshKey(prev => prev + 1);
        }
    };

    const handleCloseAssignModulesModal = () => {
        setShowAssignModulesModal(false);
        setSelectedModulesToAssign([]);
        setTeamModules([]);
        setSelectedTeam(null);
        setSelectedTeamName(null);
    };

    // Prepare module options for Select component
    const moduleOptions = useMemo(() => {
        return allModules.map(module => ({
            value: module.id,
            label: module.name || `Module ${module.id}`
        }));
    }, [allModules]);

    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="Controlhub" mainLink="/controlhub/teams" subTitle={HEADER_CONSTANTS.SUBMENU_LABELS.TEAMS} />
            

            <Row className="mb-3">
            <Col md={12}>
                <div className="page-header-title style-2">
                <Row className="d-flex justify-content-between align-items-center">
                    <Col md={4}>
                      
                      <h2 className="mb-0">{HEADER_CONSTANTS.SUBMENU_LABELS.TEAMS}</h2>
                    </Col>


                    <Col md={8} className="d-flex justify-content-end">
                      
                    <div className="action-buttons">
                    
                    {session?.user?.permissions?.includes('add-teams') && (
                        <Button variant="primary"   onClick={() => setShowCreateTeamModal(true)}>Add Team</Button>
                    )}
                    </div>



                    </Col>
                  </Row>
               
                
                </div>
            </Col>
            </Row>




            {/* {session?.user?.permissions?.includes('list-teams') && ( */}
                 <GenericListPage
                 columns={columns}
                 fetchData={fetchTeams}
                 title="Teams"
                 searchPlaceholder="Search teams..."
                 defaultPageSize={15}
                 filters={memoizedFilters}
                 refreshKey={refreshKey}
                 search={true}
                 tableStyle="table-style-2"
             />
            {/* )} */}

            <FormModal
                show={showEditTeamModal}
                onHide={() => setShowEditTeamModal(false)}
                title="Edit Team"
                titleIcon={<Users size={20} className="text-primary" />}
                desc="Please fill in the details below to edit the team."
                formHtml={
                    <>
                    <div className="form-group mb-3">
                        <label htmlFor="editTeamName" className="fw-semibold d-flex align-items-center gap-2 form-label">Team Name <span className="text-danger">*</span>
                        <span className="text-muted ms-2" title="Enter the name of the team you want to edit">
                            <Info size={14} />
                        </span>
                        </label>
                        <input className="form-control" type="text" value={selectedTeamName} onChange={(e) => setSelectedTeamName(e.target.value)} />
                        <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                            <Info size={12} />
                            <span style={{ fontSize: '0.813rem' }}>
                                Change the name of an existing team to better reflect its purpose or purpose in the system
                            </span>
                        </Form.Text>
                    </div>
                    </>
                }
                submitButtonText="Update Team"
                isSubmitDisabled={!selectedTeamName}
                cancelButtonText="Cancel"
                onSubmit={handleSubmitEditTeam}
                onCancel={() => setShowEditTeamModal(false)}
            />


            <ConfirmModal
                show={showDeleteTeamModal}
                onHide={() => setShowDeleteTeamModal(false)}
                title="Delete Team"
                description={`Are you sure you want to delete the following team?`}
                targetName={`${selectedTeamName}`}
                onConfirm={handleSubmitDeleteTeam}
                confirmButtonText="Delete"
                confirmButtonVariant="danger"
                requireTextConfirmation={true}
                requiredConfirmationText="delete"
            />

<FormModal
                        show={showCreateTeamModal}
                        onHide={()=>setShowCreateTeamModal(false)}
                        title="New Team"
                        titleIcon={<Users size={20} className="text-primary" />}
                        desc="Please fill in the details below to create a new team."
                        formHtml={
                            <>
                            <div className="form-group mb-3">
                                <label htmlFor="newTeamName" className="fw-semibold d-flex align-items-center gap-2 form-label">Team Name <span className="text-danger">*</span>
                                <span className="text-muted ms-2" title="Enter the name of the team you want to create">
                                    <Info size={14} />
                                </span>
                                </label>
                                <input type="text" className="form-control" id="newTeamName"  value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="Team Name" />
                                <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                                    <Info size={12} />
                                    <span style={{ fontSize: '0.813rem' }}>
                                        Enter the name of the team you want to create. This will be used to identify the team in the system.
                                    </span>
                                </Form.Text>
                            </div>
                            </>
                        }
                        submitButtonText="Add Team"
                        isSubmitDisabled={!newTeamName}
                        cancelButtonText="Cancel"
                        onSubmit={handleSubmitCreateTeam}
                        onCancel={()=>setShowCreateTeamModal(false)}
                    />

            {/* Assign Users Modal */}
            <Modal
                show={showAssignUsersModal}
                onHide={handleCloseAssignUsersModal}
                size="xl"
            >
                <Modal.Header closeButton>
                    <Modal.Title className="d-flex align-items-center gap-2">
                        <Users size={20} className="text-primary" />
                        Assign Users to Team ({selectedTeamName})
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>



                    <Row>
                        <Col md={6}>
                        <div className="form-group mb-4">
                        <label htmlFor="assignOwners" className="fw-semibold d-flex align-items-center gap-2 form-label">
                            Select Owners to Assign
                            <span className="text-muted ms-2" title="Search and select owners to assign to this team">
                                <Info size={14} />
                            </span>
                        </label>
                        <AsyncSelect
                            className="basic-single"
                            classNamePrefix="select"
                            cacheOptions
                            defaultOptions={false}
                            isClearable={true}
                            isSearchable={true}
                            isMulti={true}
                            loadOptions={loadOwnerOptions as any}
                            onChange={(opts) => handleOwnerSelectionChange(opts as MultiValue<{ value: number; label: string }>)}
                            value={selectedOwnersToAssign.map((idStr) => {
                                const u = allUsers.find((u) => u.id.toString() === idStr);
                                return u ? { 
                                    value: u.id, 
                                    label: `${u.name || 'Unknown'} (${u.username || u.email || 'N/A'})` 
                                } : { value: Number(idStr), label: idStr };
                            })}
                            noOptionsMessage={() => 'Type at least 2 characters to search'}
                            placeholder="Type at least 2 characters to search owners..."
                        />
                        <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                            <Info size={12} />
                            <span style={{ fontSize: '0.813rem' }}>
                                Type at least 2 characters to search for owners. Users already assigned to this team or selected as regular users will not appear in the list.
                            </span>
                        </Form.Text>
                    </div>

                    {/* Team Owners Section */}
                    <div className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="mb-0 d-flex align-items-center gap-2">
                                <Users size={18} className="text-warning" />
                                Team Owners ({teamOwners.length})
                            </h6>
                            {selectedOwnersToRemove.length > 0 && (
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => setShowRemoveOwnersConfirmModal(true)}
                                >
                                    <UserMinus size={14} className="me-1" />
                                    Remove Selected ({selectedOwnersToRemove.length})
                                </Button>
                            )}
                        </div>
                        {isLoadingTeamUsers ? (
                            <div className="text-center py-3">
                                <small className="text-muted">Loading owners...</small>
                            </div>
                        ) : teamOwners.length > 0 ? (
                            <Card>
                                <Card.Body className="p-0">
                                    
                                        <table className="table table-hover table-justify-content-center table-sm mb-0 w-100">
                                            <thead className="table-light">
                                                <tr>
                                                    <th style={{ width: '40px' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={teamOwners.length > 0 && selectedOwnersToRemove.length === teamOwners.length}
                                                            onChange={() => handleSelectAllUsersToRemove(true)}
                                                            title="Select All Owners"
                                                        />
                                                    </th>
                                                    <th>Name</th>
                                                    <th>Extension</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {teamOwners.map((owner) => (
                                                    <tr key={owner.id}>
                                                        <td>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedOwnersToRemove.includes(owner.id)}
                                                                onChange={() => handleSelectUserToRemove(owner.id, true)}
                                                            />
                                                        </td>
                                                        <td>
                                                            <div style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={owner.name || 'N/A'}>
                                                                {owner.name || 'N/A'}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div title={owner.phone || 'N/A'}>
                                                                {owner.phone || 'N/A'}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    
                                </Card.Body>
                            </Card>
                        ) : (
                            <div className="text-center py-3 border rounded">
                                <small className="text-muted">No owners assigned to this team yet.</small>
                            </div>
                        )}
                    </div>
                        </Col>
                        <Col md={6}>
                        <div className="form-group mb-4">
                        <label htmlFor="assignUsers" className="fw-semibold d-flex align-items-center gap-2 form-label">
                            Select Users to Assign
                            <span className="text-muted ms-2" title="Search and select users to assign to this team">
                                <Info size={14} />
                            </span>
                        </label>
                        <AsyncSelect
                            className="basic-single"
                            classNamePrefix="select"
                            cacheOptions
                            defaultOptions={false}
                            isClearable={true}
                            isSearchable={true}
                            isMulti={true}
                            loadOptions={loadUserOptions as any}
                            onChange={(opts) => handleUserSelectionChange(opts as MultiValue<{ value: number; label: string }>)}
                            value={selectedUsersToAssign.map((idStr) => {
                                const u = allUsers.find((u) => u.id.toString() === idStr);
                                return u ? { 
                                    value: u.id, 
                                    label: `${u.name || 'Unknown'} (${u.username || u.email || 'N/A'})` 
                                } : { value: Number(idStr), label: idStr };
                            })}
                            noOptionsMessage={() => 'Type at least 2 characters to search'}
                            placeholder="Type at least 2 characters to search users..."
                        />
                        <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                            <Info size={12} />
                            <span style={{ fontSize: '0.813rem' }}>
                                Type at least 2 characters to search for users. Users already assigned to this team or selected as owners will not appear in the list.
                            </span>
                        </Form.Text>
                    </div>

                    {/* Team Members Section */}
                    <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="mb-0 d-flex align-items-center gap-2">
                                <Users size={18} />
                                Team Members ({teamUsers.length})
                            </h6>
                            {selectedUsersToRemove.length > 0 && (
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => setShowRemoveUsersConfirmModal(true)}
                                >
                                    <UserMinus size={14} className="me-1" />
                                    Remove Selected ({selectedUsersToRemove.length})
                                </Button>
                            )}
                        </div>
                        {isLoadingTeamUsers ? (
                            <div className="text-center py-3">
                                <small className="text-muted">Loading members...</small>
                            </div>
                        ) : teamUsers.length > 0 ? (
                            <Card>
                                <Card.Body className="p-0">
                                    
                                        <table className="table table-hover table-sm mb-0 w-100 justify-content-center">
                                            <thead className="table-light">
                                                <tr>
                                                    <th style={{ width: '40px' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={teamUsers.length > 0 && selectedUsersToRemove.length === teamUsers.length}
                                                            onChange={() => handleSelectAllUsersToRemove(false)}
                                                            title="Select All Members"
                                                        />
                                                    </th>
                                                    <th>Name</th>
                                                    <th>Extension</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {teamUsers.map((user) => (
                                                    <tr key={user.id}>
                                                        <td>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedUsersToRemove.includes(user.id)}
                                                                onChange={() => handleSelectUserToRemove(user.id, false)}
                                                            />
                                                        </td>
                                                        <td>
                                                            <div style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={user.name || 'N/A'}>
                                                                {user.name || 'N/A'}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div title={user.phone || 'N/A'}>
                                                                {user.phone || 'N/A'}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    
                                </Card.Body>
                            </Card>
                        ) : (
                            <div className="text-center py-3 border rounded">
                                <small className="text-muted">No members assigned to this team yet.</small>
                            </div>
                        )}
                    </div>
                        </Col>
                    </Row>

                    

                    

                    
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseAssignUsersModal}>
                        Close
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleSubmitAssignUsers}
                        disabled={selectedUsersToAssign.length === 0 && selectedOwnersToAssign.length === 0}
                    >
                        <UserPlus size={16} className="me-1" />
                        Assign ({selectedUsersToAssign.length} users, {selectedOwnersToAssign.length} owners)
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Assign Modules Modal */}
            <Modal
                show={showAssignModulesModal}
                onHide={handleCloseAssignModulesModal}
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title className="d-flex align-items-center gap-2">
                        <Package size={20} className="text-warning" />
                        Assign Modules to Team
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="mb-3">
                        <h6 className="mb-2">Team: <strong>{selectedTeamName}</strong></h6>
                    </div>

                    <div className="form-group mb-4">
                        <label htmlFor="assignModules" className="fw-semibold d-flex align-items-center gap-2 form-label">
                            Select Modules to Assign
                            <span className="text-muted ms-2" title="Search and select modules to assign to this team">
                                <Info size={14} />
                            </span>
                        </label>
                        <Select
                            options={moduleOptions}
                            value={selectedModulesToAssign.map((id) => {
                                const option = moduleOptions.find(opt => opt.value === id);
                                return option || { value: id, label: `Module ${id}` };
                            })}
                            onChange={(opts) => handleModuleSelectionChange(opts as MultiValue<{ value: number; label: string }>)}
                            placeholder="Select modules..."
                            isClearable={true}
                            isSearchable={true}
                            isMulti={true}
                            isLoading={isLoadingModules}
                        />
                        <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                            <Info size={12} />
                            <span style={{ fontSize: '0.813rem' }}>
                                Select one or more modules to assign to this team. You can search and select multiple modules.
                            </span>
                        </Form.Text>
                    </div>

                    <div className="mb-3">
                        <h6 className="mb-3 d-flex align-items-center gap-2">
                            <Package size={18} />
                            Currently Assigned Modules ({teamModules.length})
                        </h6>
                        {isLoadingTeamModules ? (
                            <div className="text-center py-3">
                                <small className="text-muted">Loading modules...</small>
                            </div>
                        ) : teamModules.length > 0 ? (
                            <Card>
                                <Card.Body className="p-0">
                                    <div className="table-responsive p-0">
                                        <table className="table table-hover table-sm mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Description</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {teamModules.map((module) => (
                                                    <tr key={module.id || module.module_id}>
                                                        <td>
                                                            <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={module.name || 'N/A'}>
                                                                {module.name || 'N/A'}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={module.description || 'N/A'}>
                                                                {module.description || 'N/A'}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <Button
                                                                variant="outline-danger"
                                                                size="sm"
                                                                onClick={() => handleRemoveModule(module.id || module.module_id)}
                                                                title="Remove Module"
                                                                className="p-1"
                                                            >
                                                                <Trash2 size={14} />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card.Body>
                            </Card>
                        ) : (
                            <div className="text-center py-3 border rounded">
                                <small className="text-muted">No modules assigned to this team yet.</small>
                            </div>
                        )}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseAssignModulesModal}>
                        Close
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleSubmitAssignModules}
                        disabled={selectedModulesToAssign.length === 0}
                    >
                        <Package size={16} className="me-1" />
                        Update Modules ({selectedModulesToAssign.length})
                    </Button>
                </Modal.Footer>
            </Modal>
           
        <SuccessfulModal
          show={showSuccessfulModal}
          onHide={() => setShowSuccessfulModal(false)}
          title={successModalTitle}
          description={successModalDescription}
        />

            {/* Remove Owners Confirmation Modal */}
            <ConfirmModal
                show={showRemoveOwnersConfirmModal}
                onHide={() => {
                    setShowRemoveOwnersConfirmModal(false);
                    setSelectedOwnersToRemove([]);
                }}
                title="Remove Owners"
                description={`Are you sure you want to remove ${selectedOwnersToRemove.length} owner(s) from this team?`}
                targetName={selectedOwnersToRemove.length === 1 
                    ? teamOwners.find(o => o.id === selectedOwnersToRemove[0])?.name || 'this owner'
                    : `${selectedOwnersToRemove.length} owners`}
                onConfirm={async () => {
                    if (selectedOwnersToRemove.length > 0) {
                        const response = await removeOwnersFromTeam(selectedTeam, selectedOwnersToRemove);
                        if (response) {
                            setSelectedOwnersToRemove([]);
                            setShowRemoveOwnersConfirmModal(false);
                            await fetchTeamUsers(selectedTeam);
                            setRefreshKey(prev => prev + 1);
                        }
                    }
                }}
                confirmButtonText="Remove Owners"
                confirmButtonVariant="danger"
                requireTextConfirmation={true}
                requiredConfirmationText="remove"
            />

            {/* Remove Users Confirmation Modal */}
            <ConfirmModal
                show={showRemoveUsersConfirmModal}
                onHide={() => {
                    setShowRemoveUsersConfirmModal(false);
                    setSelectedUsersToRemove([]);
                }}
                title="Remove Members"
                description={`Are you sure you want to remove ${selectedUsersToRemove.length} member(s) from this team?`}
                targetName={selectedUsersToRemove.length === 1 
                    ? teamUsers.find(u => u.id === selectedUsersToRemove[0])?.name || 'this member'
                    : `${selectedUsersToRemove.length} members`}
                onConfirm={async () => {
                    if (selectedUsersToRemove.length > 0) {
                        const response = await removeUsersFromTeam(selectedTeam, selectedUsersToRemove);
                        if (response) {
                            setSelectedUsersToRemove([]);
                            setShowRemoveUsersConfirmModal(false);
                            await fetchTeamUsers(selectedTeam);
                            setRefreshKey(prev => prev + 1);
                        }
                    }
                }}
                confirmButtonText="Remove Members"
                confirmButtonVariant="danger"
                requireTextConfirmation={true}
                requiredConfirmationText="remove"
            />
        </React.Fragment>
    );
};

Teams.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default Teams;