import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { getAllGroups, ListGroups, updateGroup,deleteGroup,addGroup } from '@utils/groups';
import { Column } from '@components/CustomDataTable';
import { Button, Form, Modal, Row } from 'react-bootstrap';
import { Col } from 'react-bootstrap';
import GroupsFilters from '@components/filters/GroupsFilters';
import { toast } from 'react-toastify';
import { useTokenService } from 'src/hooks/useTokenService';
import { useSession } from 'next-auth/react';
import '@assets/scss/common.scss';
import FormModal from "@pages/partial/FormModal";
import '@assets/scss/common.scss';
import SuccessfulModal from '@pages/partial/SuccessfulModal';
import ConfirmModal from '@pages/partial/ConfirmModal';
import { Edit, Info, Trash2, Users } from 'lucide-react';



const Groups = () => {
    const { data:session, status } = useSession();
   
    const columns: Column[] = [
        { key: 'Name', name: 'Name', selector: (row: any) => row.name, sortable: true },
       

        ...(session?.user?.permissions?.includes('edit-groups') || session?.user?.permissions?.includes('delete-groups') ? [
            {
                key: 'Action',
                name: 'Actions',
                selector: (row: any) => row.id,
                sortable: false,
                cell: (props: any) => (
                    // <DatatableActionButton
                    //     actions={[
                    //         ...(session?.user?.permissions?.includes('edit-groups') ? [{
                    //             label: 'Edit',
                    //             icon: <FiEdit className="me-2" />,
                    //             onClick: () => handleEditGroup(props),
                    //             className: 'action-edit'
                    //         }] : []),
                    //         ...(session?.user?.permissions?.includes('delete-groups') ? [{
                    //             label: 'Delete',
                    //             icon: <FiTrash2 className="me-2" />,
                    //             onClick: () => handleDeleteGroup(props),
                    //             className: 'text-danger'
                    //         }] : [])
                    //     ]}
                    // />
                    <div className="d-flex gap-2">
                        {session?.user?.permissions?.includes('edit-groups') && (
                            <Button variant="light" className="btn-action-style-2 p-1 text-primary" title="Edit" onClick={() => handleEditGroup(props)}>
                                <Edit size={16} />
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
    const [currentFilters, setCurrentFilters] = useState({});

    const fetchGroups = async (page = 1, perPage = 15, search = "") => {
        return await ListGroups({ page, perPage, search, filters: currentFilters });
    };


    
    const [showSuccessfulModal, setShowSuccessfulModal] = useState(false)
    const [successModalTitle, setSuccessModalTitle] = useState('')
    const [successModalDescription, setSuccessModalDescription] = useState('')
    const handleCloseSuccessfulModal = () => {
        setShowSuccessfulModal(false)
    }

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
            setSuccessModalTitle('Group Updated')
            setSuccessModalDescription('Group has been updated successfully');
            setTimeout(() => {
                setShowSuccessfulModal(true);
            }, 100);
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
        const response = await deleteGroup(selectedGroup);
        if(response){
            setSelectedGroup(null);
            setSelectedGroupName(null);
            setShowDeleteGroupModal(false);
            setConfirmDelete("");
            setSuccessModalTitle('Group Deleted')
            setSuccessModalDescription('Group has been deleted successfully');
            setTimeout(() => {
                setShowSuccessfulModal(true);
            }, 100);
            setRefreshKey(prev => prev + 1); // Trigger refresh
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
                    {/* <div className="search-container">
                            <i className="fas fa-search search-icon"></i>
                            <input type="text" className="search-bar" placeholder="Search group..." onChange={(e) => handleFiltersChange({...currentFilters, search: e.target.value})}/>
                        </div> */}
                    
                        {/* <GroupsFilters onFiltersChange={handleFiltersChange} onExport={handleExport} /> */}

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
                 filters={currentFilters}
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
