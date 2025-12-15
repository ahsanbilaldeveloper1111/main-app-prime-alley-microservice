import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useCallback, useMemo, useRef } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import {ListGroups, updateGroup,deleteGroup,addGroup, addTeamsToGroup, removeTeamsFromGroup, getGroupTeams } from '@utils/groups';
import { Column } from '@components/CustomDataTable';
import { Button, Form, Modal, Row, Col, Card } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import '@assets/scss/common.scss';
import FormModal from "@pages/partial/FormModal";
import SuccessfulModal from '@pages/partial/SuccessfulModal';
import ConfirmModal from '@pages/partial/ConfirmModal';
import { Edit, Info, Trash2, Users, UserPlus, UserMinus } from 'lucide-react';
import Select, { MultiValue } from 'react-select';
import { getAllTeams } from '@utils/teams';
import { toast } from 'react-toastify';



const Groups = () => {
    const { data: session } = useSession();
   
    const columns: Column[] = [
        { key: 'Name', name: 'Name', selector: (row: any) => row.name, sortable: true },
       

        ...(session?.user?.permissions?.includes('edit-groups') || session?.user?.permissions?.includes('delete-groups') ? [
            {
                key: 'Action',
                name: 'Actions',
                selector: (row: any) => row.id,
                sortable: false,
                cell: (props: any) => (
                    <div className="d-flex gap-2">
                        {session?.user?.permissions?.includes('edit-groups') && (
                            <Button variant="light" className="btn-action-style-2 p-1 text-primary" title="Edit" onClick={() => handleEditGroup(props)}>
                                <Edit size={16} />
                            </Button>
                        )}
                        {(session?.user?.permissions?.includes('assign-teams-groups') || session?.user?.permissions?.includes('remove-teams-groups')) && (
                            <Button variant="light" className="btn-action-style-2 p-1 text-success" title="Assign Teams" onClick={() => handleAssignTeams(props)}>
                                <UserPlus size={16} />
                            </Button>
                        )}
                        {session?.user?.permissions?.includes('delete-groups') && (
                            <Button variant="light" className="btn-action-style-2 p-1 text-danger" title="Delete" onClick={() => handleDeleteGroup(props)}>
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

    const fetchGroups = useCallback(
        async (page = 1, perPage = 15, search = "") => {
            return await ListGroups({ page, perPage, search, filters: memoizedFilters });
        },
        [memoizedFilters]
    );


    
    const [showSuccessfulModal, setShowSuccessfulModal] = useState(false)
    const [successModalTitle, setSuccessModalTitle] = useState('')
    const [successModalDescription, setSuccessModalDescription] = useState('')
    
    const [selectedGroup, setSelectedGroup] = useState<any>(null);
    const [selectedGroupName, setSelectedGroupName] = useState<any>(null);
    const [showEditGroupModal, setShowEditGroupModal] = useState<boolean>(false);

    const handleEditGroup = (props: any) => {
        setSelectedGroup(props.id);
        setSelectedGroupName(props.name);
        setShowEditGroupModal(true);
    };

    const handleSubmitEditGroup = async () => {
        
        const response = await updateGroup(selectedGroup, selectedGroupName);
        if(response){
            setSelectedGroup(null);
            setSelectedGroupName(null);
            setShowEditGroupModal(false);
            setSuccessModalTitle('Group Updated')
            setSuccessModalDescription('Group has been updated successfully');
            setTimeout(() => {
                setShowSuccessfulModal(true);
            }, 100);
            setRefreshKey(prev => prev + 1); // Trigger refresh
        }

        
    };

    const [showDeleteGroupModal, setShowDeleteGroupModal] = useState<boolean>(false);
    
    const handleDeleteGroup = (props: any) => {
        setSelectedGroup(props.id);
        setSelectedGroupName(props.name);
        setShowDeleteGroupModal(true);
    };

    const handleSubmitDeleteGroup = async () => {
        const response = await deleteGroup(selectedGroup);
        if(response){
            setSelectedGroup(null);
            setSelectedGroupName(null);
            setShowDeleteGroupModal(false);
            setSuccessModalTitle('Group Deleted')
            setSuccessModalDescription('Group has been deleted successfully');
            setTimeout(() => {
                setShowSuccessfulModal(true);
            }, 100);
            setRefreshKey(prev => prev + 1); 
        }
    };

    const [showCreateGroupModal, setShowCreateGroupModal] = useState<boolean>(false);
    const [newGroupName, setNewGroupName] = useState<string>("");

    const handleSubmitCreateGroup = async () => {
        const response = await addGroup(newGroupName);
        if(response){
            setNewGroupName("");
            setShowCreateGroupModal(false);
            
            setSuccessModalTitle('Group Created')
            setSuccessModalDescription('New Group has been added successfully');
            setTimeout(() => {
                setShowSuccessfulModal(true);
            }, 100);

            setRefreshKey(prev => prev + 1); 
        }
    };

    // Team Assignment State
    const [showAssignTeamsModal, setShowAssignTeamsModal] = useState<boolean>(false);
    const [groupTeams, setGroupTeams] = useState<any[]>([]);
    const [selectedTeamsToAssign, setSelectedTeamsToAssign] = useState<string[]>([]);
    const [allTeams, setAllTeams] = useState<any[]>([]);
    const [isLoadingTeams, setIsLoadingTeams] = useState<boolean>(false);
    const [isLoadingGroupTeams, setIsLoadingGroupTeams] = useState<boolean>(false);

    const handleAssignTeams = async (props: any) => {
        setSelectedGroup(props.id);
        setSelectedGroupName(props.name);
        setShowAssignTeamsModal(true);
        setSelectedTeamsToAssign([]);
        await fetchGroupTeams(props.id);
        await fetchAllTeams();
    };

    const fetchGroupTeams = async (groupId: number) => {
        setIsLoadingGroupTeams(true);
        try {
            const teams = await getGroupTeams(groupId);
            setGroupTeams(teams || []);
        } catch (error) {
            console.error('Error fetching group teams:', error);
            setGroupTeams([]);
        } finally {
            setIsLoadingGroupTeams(false);
        }
    };

    const fetchAllTeams = async () => {
        if (allTeams.length > 0) return; // Already loaded
        setIsLoadingTeams(true);
        try {
            const teams = await getAllTeams();
            if (teams && Array.isArray(teams)) {
                setAllTeams(teams);
            }
        } catch (error) {
            console.error('Error fetching teams:', error);
        } finally {
            setIsLoadingTeams(false);
        }
    };

    const handleTeamSelectionChange = (selectedOptions: MultiValue<{ value: number; label: string }>) => {
        const values = (selectedOptions || []).map((opt) => opt.value.toString());
        setSelectedTeamsToAssign(values);
    };

    const handleSubmitAssignTeams = async () => {
        if (selectedTeamsToAssign.length === 0) {
            toast.error('Please select at least one team to assign');
            return;
        }

        const teamIds = selectedTeamsToAssign.map(id => Number.parseInt(id, 10));
        const selectedCount = selectedTeamsToAssign.length;
        const response = await addTeamsToGroup(selectedGroup, teamIds);
        
        if (response) {
            setSelectedTeamsToAssign([]);
            await fetchGroupTeams(selectedGroup);
            setSuccessModalTitle('Teams Assigned')
            setSuccessModalDescription(`${selectedCount} team(s) have been assigned to the group successfully`);
            // Close the assign teams modal
            handleCloseAssignTeamsModal();
            setTimeout(() => {
                setShowSuccessfulModal(true);
            }, 100);
            setRefreshKey(prev => prev + 1);
        }
    };

    const handleRemoveTeam = async (teamId: number) => {
        const response = await removeTeamsFromGroup(selectedGroup, [teamId]);
        if (response) {
            await fetchGroupTeams(selectedGroup);
            setSuccessModalTitle('Team Removed')
            setSuccessModalDescription('Team has been removed from the group successfully');
            setTimeout(() => {
                setShowSuccessfulModal(true);
            }, 100);
            setRefreshKey(prev => prev + 1);
        }
    };

    const handleCloseAssignTeamsModal = () => {
        setShowAssignTeamsModal(false);
        setSelectedTeamsToAssign([]);
        setGroupTeams([]);
        setSelectedGroup(null);
        setSelectedGroupName(null);
    };

    // Prepare team options for Select component
    const teamOptions = useMemo(() => {
        const assignedTeamIds = new Set(groupTeams.map(t => t.id));
        return allTeams
            .filter(team => !assignedTeamIds.has(team.id))
            .map(team => ({
                value: team.id,
                label: team.name || `Team ${team.id}`
            }));
    }, [allTeams, groupTeams]);

    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="Controlhub" mainLink="/controlhub/groups" subTitle="Groups" />
            

            <Row className="mb-3">
            <Col md={12}>
                <div className="page-header-title style-2">
                <Row className="d-flex justify-content-between align-items-center">
                    <Col md={4}>
                      
                      <h2 className="mb-0">Groups</h2>
                    </Col>


                    <Col md={8} className="d-flex justify-content-end">
                      
                    <div className="action-buttons">
                    
                    {session?.user?.permissions?.includes('add-groups') && (
                        <Button variant="primary"   onClick={() => setShowCreateGroupModal(true)}>Add Group</Button>
                    )}
                    </div>



                    </Col>
                  </Row>
               
                
                </div>
            </Col>
            </Row>




            {session?.user?.permissions?.includes('list-groups') && (
                 <GenericListPage
                 columns={columns}
                 fetchData={fetchGroups}
                 title="Groups"
                 searchPlaceholder="Search groups..."
                 defaultPageSize={15}
                 filters={memoizedFilters}
                 refreshKey={refreshKey}
                 search={true}
                 tableStyle="table-style-2"
             />
            )}

            <FormModal
                show={showEditGroupModal}
                onHide={() => setShowEditGroupModal(false)}
                title="Edit Group"
                titleIcon={<Users size={20} className="text-primary" />}
                desc="Please fill in the details below to edit the group."
                formHtml={
                    <>
                    <div className="form-group mb-3">
                        <label htmlFor="editGroupName" className="fw-semibold d-flex align-items-center gap-2 form-label">Group Name <span className="text-danger">*</span>
                        <span className="text-muted ms-2" title="Enter the name of the group you want to edit">
                            <Info size={14} />
                        </span>
                        </label>
                        <input className="form-control" type="text" value={selectedGroupName} onChange={(e) => setSelectedGroupName(e.target.value)} />
                        <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                            <Info size={12} />
                            <span style={{ fontSize: '0.813rem' }}>
                                Change the name of an existing group to better reflect its purpose or purpose in the system
                            </span>
                        </Form.Text>
                    </div>
                    </>
                }
                submitButtonText="Update Group"
                isSubmitDisabled={!selectedGroupName}
                cancelButtonText="Cancel"
                onSubmit={handleSubmitEditGroup}
                onCancel={() => setShowEditGroupModal(false)}
            />


            <ConfirmModal
                show={showDeleteGroupModal}
                onHide={() => setShowDeleteGroupModal(false)}
                title="Delete Group"
                description={`Are you sure you want to delete the following group?`}
                targetName={`${selectedGroupName}`}
                onConfirm={handleSubmitDeleteGroup}
                confirmButtonText="Delete"
                confirmButtonVariant="danger"
                requireTextConfirmation={true}
                requiredConfirmationText="delete"
            />

<FormModal
                        show={showCreateGroupModal}
                        onHide={()=>setShowCreateGroupModal(false)}
                        title="New Group"
                        titleIcon={<Users size={20} className="text-primary" />}
                        desc="Please fill in the details below to create a new group."
                        formHtml={
                            <>
                            <div className="form-group mb-3">
                                <label htmlFor="newGroupName" className="fw-semibold d-flex align-items-center gap-2 form-label">Group Name <span className="text-danger">*</span>
                                <span className="text-muted ms-2" title="Enter the name of the group you want to create">
                                    <Info size={14} />
                                </span>
                                </label>
                                <input type="text" className="form-control" id="newGroupName"  value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Group Name" />
                                <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                                    <Info size={12} />
                                    <span style={{ fontSize: '0.813rem' }}>
                                        Enter the name of the group you want to create. This will be used to identify the group in the system.
                                    </span>
                                </Form.Text>
                            </div>
                            </>
                        }
                        submitButtonText="Add Group"
                        isSubmitDisabled={!newGroupName}
                        cancelButtonText="Cancel"
                        onSubmit={handleSubmitCreateGroup}
                        onCancel={()=>setShowCreateGroupModal(false)}
                    />

            {/* Assign Teams Modal */}
            <Modal
                show={showAssignTeamsModal}
                onHide={handleCloseAssignTeamsModal}
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title className="d-flex align-items-center gap-2">
                        <Users size={20} className="text-primary" />
                        Assign Teams to Group
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="mb-3">
                        <h6 className="mb-2">Group: <strong>{selectedGroupName}</strong></h6>
                    </div>

                    <div className="form-group mb-4">
                        <label htmlFor="assignTeams" className="fw-semibold d-flex align-items-center gap-2 form-label">
                            Select Teams to Assign
                            <span className="text-muted ms-2" title="Search and select teams to assign to this group">
                                <Info size={14} />
                            </span>
                        </label>
                        <Select
                            isMulti
                            options={teamOptions}
                            value={selectedTeamsToAssign.map((idStr) => {
                                const t = allTeams.find((t) => t.id.toString() === idStr);
                                return t ? { 
                                    value: t.id, 
                                    label: t.name || `Team ${t.id}` 
                                } : { value: Number.parseInt(idStr, 10), label: idStr };
                            })}
                            onChange={(opts) => handleTeamSelectionChange(opts as MultiValue<{ value: number; label: string }>)}
                            placeholder="Select teams..."
                            isClearable={true}
                            isSearchable={true}
                            isLoading={isLoadingTeams}
                        />
                        <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                            <Info size={12} />
                            <span style={{ fontSize: '0.813rem' }}>
                                Select one or more teams to assign to this group. Teams already assigned to this group will not appear in the list.
                            </span>
                        </Form.Text>
                    </div>

                    <div className="mb-3">
                        <h6 className="mb-3 d-flex align-items-center gap-2">
                            <Users size={18} />
                            Currently Assigned Teams ({groupTeams.length})
                        </h6>
                        {isLoadingGroupTeams ? (
                            <div className="text-center py-3">
                                <small className="text-muted">Loading teams...</small>
                            </div>
                        ) : groupTeams.length > 0 ? (
                            <Card>
                                <Card.Body className="p-0">
                                    <div className="table-responsive p-0">
                                        <table className="table table-hover table-sm mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {groupTeams.map((team) => (
                                                    <tr key={team.id}>
                                                        <td>
                                                            <div title={team.name || 'N/A'}>
                                                                {team.name || 'N/A'}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <Button
                                                                disabled={!session?.user?.permissions?.includes('remove-teams-groups')}
                                                                variant="outline-danger"
                                                                size="sm"
                                                                onClick={() => handleRemoveTeam(team.id)}
                                                                title="Remove Team"
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
                                <small className="text-muted">No teams assigned to this group yet.</small>
                            </div>
                        )}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseAssignTeamsModal}>
                        Close
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleSubmitAssignTeams}
                        disabled={selectedTeamsToAssign.length === 0}
                    >
                        <UserPlus size={16} className="me-1" />
                        Assign Selected Teams ({selectedTeamsToAssign.length})
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

Groups.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default Groups;
