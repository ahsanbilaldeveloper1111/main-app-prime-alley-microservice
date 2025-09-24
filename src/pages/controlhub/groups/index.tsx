import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { getAllGroups, ListGroups, updateGroup,deleteGroup,addGroup } from '@utils/groups';
import { Column } from '@components/CustomDataTable';
import { Button, DropdownItem, DropdownToggle, Dropdown, DropdownMenu, Modal, Row } from 'react-bootstrap';
import { Col } from 'react-bootstrap';
import GroupsFilters from '@components/filters/GroupsFilters';
import { toast } from 'react-toastify';
import { useTokenService } from 'src/hooks/useTokenService';
import { useSession } from 'next-auth/react';
import '@assets/scss/common.scss';
import { FiEdit, FiMoreVertical, FiTrash2 } from 'react-icons/fi';
import { Link } from 'feather-icons-react';

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

                <Dropdown
                className="table-action-dropdown"
                //drop="start"
                placement="top-start"
            >
                <DropdownToggle variant="outline-secondary" size="sm">
                    <FiMoreVertical size={14} />
                </DropdownToggle>
                <DropdownMenu>
                {session?.user?.permissions?.includes('edit-groups')  && (
                    <DropdownItem className="action-edit" onClick={() => handleEditGroup(props)}>
                        <FiEdit className="me-2" />
                        Edit
                    </DropdownItem>
                )}

{session?.user?.permissions?.includes('delete-groups')   && (
                    <DropdownItem className="action-delete" onClick={() => handleDeleteGroup(props)}>
                        <FiTrash2 className="me-2" />
                        Delete
                    </DropdownItem>
                    )}
                </DropdownMenu>

            </Dropdown>
                
               
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
                <div className="page-header-title style-2">
                <Row className="d-flex justify-content-between align-items-center">
                    <Col md={4}>
                      
                      <h2 className="mb-0">Groups</h2>
                    </Col>


                    <Col md={8} className="d-flex justify-content-end">
                      
                    <div className="action-buttons">
                    <div className="search-container">
                            <i className="fas fa-search search-icon"></i>
                            <input type="text" className="search-bar" placeholder="Search group..." onChange={(e) => handleFiltersChange({...currentFilters, search: e.target.value})}/>
                        </div>
                    
                        {/* <GroupsFilters onFiltersChange={handleFiltersChange} onExport={handleExport} /> */}

                    {session?.user?.permissions?.includes('add-groups') && (
                        <Button variant="primary" size="sm"  onClick={() => setShowCreateGroupModal(true)}>New Group</Button>
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
                 filters={currentFilters}
                 refreshKey={refreshKey}
                 search={false}
                 tableStyle="table-style-2"
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
