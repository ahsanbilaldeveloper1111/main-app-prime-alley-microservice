import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useCallback, useMemo, useRef } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import {ListTeams, updateTeam, deleteTeam, addTeam, assignUsersToTeam, removeUsersFromTeam, getTeamUsers, addRanksToTeam, removeRanksFromTeam, getTeamRanks } from '@utils/teams';
import { Column } from '@components/CustomDataTable';
import { Button, Form, Modal, Row, Col, Card } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import '@assets/scss/common.scss';
import FormModal from "@pages/partial/FormModal";
import SuccessfulModal from '@pages/partial/SuccessfulModal';
import ConfirmModal from '@pages/partial/ConfirmModal';
import { Edit, Info, Trash2, Users, UserPlus, UserMinus, Award } from 'lucide-react';
import AsyncSelect from 'react-select/async';
import Select, { MultiValue } from 'react-select';
import { getParentUsers } from '@utils/users';
import { getAllRoles } from '@utils/roles';
import { toast } from 'react-toastify';



const Teams = () => {
    const { data: session } = useSession();
   
    const columns: Column[] = [
        { key: 'Name', name: 'Name', selector: (row: any) => row.name, sortable: true },

        { key: 'Ranks', name: 'Rank', selector: (row: any) => row.rank_name, sortable: true,
            cell: (props: any) => (
                <div>
                    {props?.rank_name}
                </div>
            )
        },
       

        ...(session?.user?.permissions?.includes('edit-teams') || session?.user?.permissions?.includes('delete-teams') || session?.user?.permissions?.includes('assign-users-to-teams') || session?.user?.permissions?.includes('assign-ranks-to-teams') ? [
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
                        {session?.user?.permissions?.includes('add-ranks-teams') && (
                            <Button variant="light" className="btn-action-style-2 p-1 text-info" title="Assign Ranks" onClick={() => handleAssignRanks(props)}>
                                <Award size={16} />
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
    const [selectedUsersToAssign, setSelectedUsersToAssign] = useState<string[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);
    const [isLoadingTeamUsers, setIsLoadingTeamUsers] = useState<boolean>(false);

    const handleAssignUsers = async (props: any) => {
        setSelectedTeam(props.id);
        setSelectedTeamName(props.name);
        setShowAssignUsersModal(true);
        setSelectedUsersToAssign([]);
        await fetchTeamUsers(props.id);
    };

    const fetchTeamUsers = async (teamId: number) => {
        setIsLoadingTeamUsers(true);
        try {
            const users = await getTeamUsers(teamId);
            setTeamUsers(users || []);
        } catch (error) {
            console.error('Error fetching team users:', error);
            setTeamUsers([]);
        } finally {
            setIsLoadingTeamUsers(false);
        }
    };

    const fetchAllUsers = async () => {
        if (allUsers.length > 0) return; // Already loaded
        setIsLoadingUsers(true);
        try {
            const response = await getParentUsers();
            if (response && Array.isArray(response)) {
                setAllUsers(response);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const loadUserOptions = (inputValue: string): Promise<Array<{ value: number; label: string }>> => {
        const trimmed = (inputValue || '').trim();
        if (trimmed.length < 2) {
            return Promise.resolve([]);
        }
        
        const ensureData = allUsers.length === 0 && !isLoadingUsers
            ? fetchAllUsers()
            : Promise.resolve();
        
        return ensureData.then(() => {
            const lower = trimmed.toLowerCase();
            const assignedUserIds = new Set(teamUsers.map(u => u.id));
            const options = allUsers
                .filter((user) => !assignedUserIds.has(user.id))
                .filter((user) =>
                    (user.name && user.name.toLowerCase().includes(lower)) ||
                    (user.username && user.username.toLowerCase().includes(lower)) ||
                    (user.email && user.email.toLowerCase().includes(lower))
                )
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

    const handleSubmitAssignUsers = async () => {
        if (selectedUsersToAssign.length === 0) {
            toast.error('Please select at least one user to assign');
            return;
        }

        const userIds = selectedUsersToAssign.map(id => Number.parseInt(id, 10));
        const selectedCount = selectedUsersToAssign.length;
        const response = await assignUsersToTeam(selectedTeam, userIds);
        
        if (response) {
            setSelectedUsersToAssign([]);
            await fetchTeamUsers(selectedTeam);
            setSuccessModalTitle('Users Assigned')
            setSuccessModalDescription(`${selectedCount} user(s) have been assigned to the team successfully`);
            // Close the assign users modal
            handleCloseAssignUsersModal();
            setTimeout(() => {
                setShowSuccessfulModal(true);
            }, 100);
            setRefreshKey(prev => prev + 1);
        }
    };

    const handleRemoveUser = async (userId: number) => {
        const response = await removeUsersFromTeam(selectedTeam, [userId]);
        if (response) {
            await fetchTeamUsers(selectedTeam);
            setSuccessModalTitle('User Removed')
            setSuccessModalDescription('User has been removed from the team successfully');
            setTimeout(() => {
                setShowSuccessfulModal(true);
            }, 100);
            setRefreshKey(prev => prev + 1);
        }
    };

    const handleCloseAssignUsersModal = () => {
        setShowAssignUsersModal(false);
        setSelectedUsersToAssign([]);
        setTeamUsers([]);
        setSelectedTeam(null);
        setSelectedTeamName(null);
    };

    // Rank Assignment State
    const [showAssignRanksModal, setShowAssignRanksModal] = useState<boolean>(false);
    const [teamRanks, setTeamRanks] = useState<any[]>([]);
    const [selectedRankToAssign, setSelectedRankToAssign] = useState<number | null>(null);
    const [allRanks, setAllRanks] = useState<any[]>([]);
    const [isLoadingRanks, setIsLoadingRanks] = useState<boolean>(false);
    const [isLoadingTeamRanks, setIsLoadingTeamRanks] = useState<boolean>(false);

    const handleAssignRanks = async (props: any) => {
        setSelectedTeam(props.id);
        setSelectedTeamName(props.name);
        setShowAssignRanksModal(true);
        // Pre-select the currently assigned rank if exists (use rank_id from table data)
        const currentRankId = props.rank_id ? Number.parseInt(props.rank_id.toString(), 10) : null;
        setSelectedRankToAssign(currentRankId);
        await fetchAllRanks();
        await fetchTeamRanks(props.id);
        // If rank_id wasn't in props, try to get it from fetched ranks
        if (!currentRankId) {
            const ranks = await getTeamRanks(props.id);
            if (ranks && ranks.length > 0 && ranks[0].id) {
                setSelectedRankToAssign(ranks[0].id);
            }
        }
    };

    const fetchTeamRanks = async (teamId: number) => {
        setIsLoadingTeamRanks(true);
        try {
            const ranks = await getTeamRanks(teamId);
            setTeamRanks(ranks || []);
            return ranks || [];
        } catch (error) {
            console.error('Error fetching team ranks:', error);
            setTeamRanks([]);
            return [];
        } finally {
            setIsLoadingTeamRanks(false);
        }
    };

    const fetchAllRanks = async () => {
        if (allRanks.length > 0) return; // Already loaded
        setIsLoadingRanks(true);
        try {
            const ranks = await getAllRoles();
            if (ranks && Array.isArray(ranks)) {
                setAllRanks(ranks);
            }
        } catch (error) {
            console.error('Error fetching ranks:', error);
        } finally {
            setIsLoadingRanks(false);
        }
    };

    const handleRankSelectionChange = (selectedOption: { value: number; label: string } | null) => {
        setSelectedRankToAssign(selectedOption ? selectedOption.value : null);
    };

    const handleSubmitAssignRanks = async () => {
        if (!selectedRankToAssign) {
            toast.error('Please select a rank to assign');
            return;
        }

        const response = await addRanksToTeam(selectedTeam, selectedRankToAssign);
        
        if (response) {
            setSelectedRankToAssign(null);
            await fetchTeamRanks(selectedTeam);
            setSuccessModalTitle('Rank Assigned')
            setSuccessModalDescription('Rank has been assigned to the team successfully');
            // Close the assign ranks modal
            handleCloseAssignRanksModal();
            setTimeout(() => {
                setShowSuccessfulModal(true);
            }, 100);
            setRefreshKey(prev => prev + 1);
        }
    };

    const handleRemoveRank = async (rankId: number) => {
        const response = await removeRanksFromTeam(selectedTeam, [rankId]);
        if (response) {
            await fetchTeamRanks(selectedTeam);
            setSuccessModalTitle('Rank Removed')
            setSuccessModalDescription('Rank has been removed from the team successfully');
            setTimeout(() => {
                setShowSuccessfulModal(true);
            }, 100);
            setRefreshKey(prev => prev + 1);
        }
    };

    const handleCloseAssignRanksModal = () => {
        setShowAssignRanksModal(false);
        setSelectedRankToAssign(null);
        setTeamRanks([]);
        setSelectedTeam(null);
        setSelectedTeamName(null);
    };

    // Prepare rank options for Select component
    // Include all ranks (including currently assigned one) so user can see and update it
    const rankOptions = useMemo(() => {
        return allRanks.map(rank => ({
            value: rank.id,
            label: rank.name || `Rank ${rank.id}`
        }));
    }, [allRanks]);

    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="Controlhub" mainLink="/controlhub/teams" subTitle="Teams" />
            

            <Row className="mb-3">
            <Col md={12}>
                <div className="page-header-title style-2">
                <Row className="d-flex justify-content-between align-items-center">
                    <Col md={4}>
                      
                      <h2 className="mb-0">Teams</h2>
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
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title className="d-flex align-items-center gap-2">
                        <Users size={20} className="text-primary" />
                        Assign Users to Team
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="mb-3">
                        <h6 className="mb-2">Team: <strong>{selectedTeamName}</strong></h6>
                    </div>

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
                                Type at least 2 characters to search for users. Users already assigned to this team will not appear in the list.
                            </span>
                        </Form.Text>
                    </div>

                    <div className="mb-3">
                        <h6 className="mb-3 d-flex align-items-center gap-2">
                            <Users size={18} />
                            Currently Assigned Users ({teamUsers.length})
                        </h6>
                        {isLoadingTeamUsers ? (
                            <div className="text-center py-3">
                                <small className="text-muted">Loading users...</small>
                            </div>
                        ) : teamUsers.length > 0 ? (
                            <Card>
                                <Card.Body className="p-0">
                                    <div className="table-responsive p-0" >
                                        <table className="table table-hover table-sm mb-0">
                                            <thead className="table-light" >
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Email</th>
                                                    <th>Username</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {teamUsers.map((user) => (
                                                    <tr key={user.id}>
                                                        <td>
                                                            <div style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={user.name || 'N/A'}>
                                                                {user.name || 'N/A'}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div title={user.email || 'N/A'}>
                                                                {user.email || 'N/A'}
                                                            </div>
                                                        </td>
                                                        <td>{user.username || 'N/A'}</td>
                                                        <td>
                                                            <Button
                                                                variant="outline-danger"
                                                                size="sm"
                                                                onClick={() => handleRemoveUser(user.id)}
                                                                title="Remove User"
                                                                className="p-1"
                                                            >
                                                                <UserMinus size={14} />
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
                                <small className="text-muted">No users assigned to this team yet.</small>
                            </div>
                        )}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseAssignUsersModal}>
                        Close
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleSubmitAssignUsers}
                        disabled={selectedUsersToAssign.length === 0}
                    >
                        <UserPlus size={16} className="me-1" />
                        Assign Selected Users ({selectedUsersToAssign.length})
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Assign Ranks Modal */}
            <Modal
                show={showAssignRanksModal}
                onHide={handleCloseAssignRanksModal}
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title className="d-flex align-items-center gap-2">
                        <Award size={20} className="text-info" />
                        Assign Ranks to Team
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="mb-3">
                        <h6 className="mb-2">Team: <strong>{selectedTeamName}</strong></h6>
                    </div>

                    <div className="form-group mb-4">
                        <label htmlFor="assignRanks" className="fw-semibold d-flex align-items-center gap-2 form-label">
                            Select Ranks to Assign
                            <span className="text-muted ms-2" title="Search and select ranks to assign to this team">
                                <Info size={14} />
                            </span>
                        </label>
                        <Select
                            options={rankOptions}
                            value={selectedRankToAssign ? rankOptions.find(opt => opt.value === selectedRankToAssign) || null : null}
                            onChange={(opt) => handleRankSelectionChange(opt as { value: number; label: string } | null)}
                            placeholder="Select a rank..."
                            isClearable={true}
                            isSearchable={true}
                            isLoading={isLoadingRanks}
                        />
                        {/* <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                            <Info size={12} />
                            <span style={{ fontSize: '0.813rem' }}>
                                Select a rank to assign to this team. Ranks already assigned to this team will not appear in the list.
                            </span>
                        </Form.Text> */}
                    </div>

                  
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseAssignRanksModal}>
                        Close
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleSubmitAssignRanks}
                        disabled={!selectedRankToAssign}
                    >
                        <Award size={16} className="me-1" />
                        Assign Rank
                    </Button>
                </Modal.Footer>
            </Modal>
           
        <SuccessfulModal
          show={showSuccessfulModal}
          onHide={() => setShowSuccessfulModal(false)}
          title={successModalTitle}
          description={successModalDescription}
        />
        </React.Fragment>
    );
};

Teams.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default Teams;

