import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { getAllGroups, ListGroups, updateGroup,deleteGroup,addGroup } from '@utils/groups';
import { Column } from '@components/CustomDataTable';
import { Button, Modal, Row } from 'react-bootstrap';
import { Col } from 'react-bootstrap';
import GroupsFilters from '@components/filters/GroupsFilters';
import { toast } from 'react-toastify';
import { useTokenService } from 'src/hooks/useTokenService';
import { useSession } from 'next-auth/react';

const Groups = () => {
    const { data:session, status } = useSession();
   
    const columns: Column[] = [
        { key: 'Name', name: 'NAME', selector: (row: any) => row.name, sortable: true },
        {
            key: 'Action',
            name: 'ACTION',
            selector: (row: any) => row.id,
            sortable: false,
            cell: (props: any) => (
                
                <div className="action-buttons-container">
    
                    {session?.user?.permissions?.includes('edit-groups')  && (
                        <button className="btn btn-sm btn-outline-primary" onClick={() => handleEditGroup(props)}>Edit Group</button>
                    )}  

                    {session?.user?.permissions?.includes('delete-groups')  && (
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteGroup(props)}>Delete Group</button>
                    )}

                    
                </div>
            ),
        },
    ];

    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [currentFilters, setCurrentFilters] = useState({});

    const fetchGroups = async (page = 1, perPage = 15, search = "") => {
        return await ListGroups({ page, perPage, search, filters: currentFilters });
    };

    const handleFiltersChange = (filters: any) => {
        //console.log('Filters changed:', filters);
        setCurrentFilters(filters);
    };

    const handleExport = async (exportType: string, filters: Record<string, any>) => {
       
        try {
            await ListGroups({ page: 1, perPage: 15, search: "", filters, isExport: true, exportType });
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Export failed. Please try again.');
        }
    };

    const [selectedGroup, setSelectedGroup] = useState<any>(null);
    const [selectedGroupName, setSelectedGroupName] = useState<any>(null);
    const [showEditGroupModal, setShowEditGroupModal] = useState<boolean>(false);

    const handleEditGroup = (props: any) => {
        setSelectedGroup(props.id);
        setSelectedGroupName(props.name);
        setShowEditGroupModal(true);
    };

    const handleSubmitEditGroup = async () => {
        //console.log('Submit edit group:', selectedGroup, selectedGroupName);
        const response = await updateGroup(selectedGroup, selectedGroupName);
        if(response){
            setSelectedGroup(null);
            setSelectedGroupName(null);
            setShowEditGroupModal(false);
            setRefreshKey(prev => prev + 1); // Trigger refresh
        }

        
    };

    const [showDeleteGroupModal, setShowDeleteGroupModal] = useState<boolean>(false);
    const [confirmDelete, setConfirmDelete] = useState<string>("");

    const handleDeleteGroup = (props: any) => {
        setSelectedGroup(props.id);
        setSelectedGroupName(props.name);
        setShowDeleteGroupModal(true);
    };

    const handleSubmitDeleteGroup = async () => {
        const confirmDeleteValue = confirmDelete.trim().toLowerCase();
        if(confirmDeleteValue == "delete"){
            const response = await deleteGroup(selectedGroup);
            if(response){
                setSelectedGroup(null);
                setSelectedGroupName(null);
                setShowDeleteGroupModal(false);
                setConfirmDelete("");
                setRefreshKey(prev => prev + 1); // Trigger refresh
            }
        }else{
            toast.error('Please type the word delete to confirm');
        }
    };

    const [showCreateGroupModal, setShowCreateGroupModal] = useState<boolean>(false);
    const [newGroupName, setNewGroupName] = useState<string>("");

    const handleSubmitCreateGroup = async () => {
        const response = await addGroup(newGroupName);
        if(response){
            setNewGroupName("");
            setShowCreateGroupModal(false);
            setRefreshKey(prev => prev + 1); // Trigger refresh
        }
    };

    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="Controlhub" mainLink="/controlhub/groups" subTitle="Groups" />
            <Row className="mb-3">
            <Col md={12}>
                <div className="page-header-title">
                <h2 className="mb-0 d-flex align-items-center">
                    Groups
                    {session?.user?.permissions?.includes('add-groups') && (
                        <Button variant="outline-primary" size="sm" className="ms-3" onClick={() => setShowCreateGroupModal(true)}>New Group</Button>
                    )}
                    

                    <GroupsFilters onFiltersChange={handleFiltersChange} onExport={handleExport} />
                    
                </h2>
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
                 filters={currentFilters}
                 refreshKey={refreshKey}
             />
            )}

            {showEditGroupModal && (
                <Modal
                    show={showEditGroupModal}
                    onHide={() => setShowEditGroupModal(false)}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Edit Group</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <input className="form-control" type="text" value={selectedGroupName} onChange={(e) => setSelectedGroupName(e.target.value)} />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowEditGroupModal(false)}>Close</Button>
                        <Button variant="primary" onClick={() => handleSubmitEditGroup()}>Save changes</Button>
                    </Modal.Footer>
                </Modal>
            )}

            {showDeleteGroupModal && (
                <Modal
                    show={showDeleteGroupModal}
                    onHide={() => setShowDeleteGroupModal(false)}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Delete Group?</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p>
                            Are you sure you want to delete this <b className="text-danger">{selectedGroupName}</b> group?
                        </p>
                        <p>
                            Type the word <b className="text-danger">delete</b> to confirm
                        </p>
                        <input type="text" className="form-control" id="confirmDelete" value={confirmDelete} onChange={(e) => setConfirmDelete(e.target.value)} placeholder="Type the word delete to confirm" />

                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowDeleteGroupModal(false)}>Close</Button>
                        <Button variant="danger" onClick={() => handleSubmitDeleteGroup()}>Delete</Button>
                    </Modal.Footer>
                    
                </Modal>
            )}

            {showCreateGroupModal && (
                <Modal
                    show={showCreateGroupModal}
                    onHide={() => setShowCreateGroupModal(false)}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>New Group</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <input type="text" className="form-control" id="newGroupName"  value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Group Name" />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowCreateGroupModal(false)}>Close</Button>
                        <Button variant="primary" onClick={() => handleSubmitCreateGroup()}>Create</Button>
                    </Modal.Footer>
                </Modal>
            )}
        
        </React.Fragment>
    );
};

Groups.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default Groups;
