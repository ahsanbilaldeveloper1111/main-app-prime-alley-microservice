import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useCallback, useMemo, useEffect } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { getAllRoles, ListRoles, updateRole,deleteRole,addRole,BulkDeleteRoles } from '@utils/roles';
import { Column } from '@components/CustomDataTable';
import { Button, Modal, Row } from 'react-bootstrap';
import { Col } from 'react-bootstrap';
import RolesFilters from '@components/filters/RolesFilters';
import { toast } from 'react-toastify';
import { useTokenService } from 'src/hooks/useTokenService';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import '@assets/scss/common.scss';
import SuccessfulModal from '@pages/partial/SuccessfulModal'
import FormModal from '@pages/partial/FormModal'
import ConfirmModal from '@pages/partial/ConfirmModal'

import { FiEdit, FiTrash2, FiEye } from 'react-icons/fi';
import DatatableActionButton from '@components/DatatableActionButton';


const Ranks = () => {
    const { data:session, status } = useSession();
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

            ...(session?.user?.is_admin === "1" ? [
                { key: 'Company', name: 'company', selector: (row: any) => row.company, sortable: true },
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
    const [showEditRankModal, setShowEditRankModal] = useState<boolean>(false);

    const handleEditRank = (props: any) => {
        setSelectedRank(props.id);
        setSelectedRankName(props.name);
        setShowEditRankModal(true);
    };

    const handleSubmitEditRank = async () => {
        //console.log('Submit edit rank:', selectedRank, selectedRankName);
        const response = await updateRole(selectedRank, selectedRankName);
        if(response){
            setSelectedRank(null);
            setSelectedRankName(null);
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

    const handleSubmitCreateRank = async () => {
        const response = await addRole(newRankName);
        if(response){
            setNewRankName("");
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

    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="Controlhub" mainLink="/controlhub/ranks" subTitle="Ranks" />
            

<Row className="mb-3">
            <Col md={12}>
                <div className="page-header-title style-2">
                <Row className="d-flex justify-content-between align-items-center">
                    <Col md={4}>
                      
                      <h2 className="mb-0">Ranks</h2>
                    </Col>


                    <Col md={8} className="d-flex justify-content-end">
                      
                    <div className="action-buttons">
                    {/* <div className="search-container">
                            <i className="fas fa-search search-icon"></i>
                            <input type="text" className="search-bar" placeholder="Search rank..." onChange={(e) => handleFiltersChange({...currentFilters, search: e.target.value})}/>
                        </div> */}
                    
                    {/* <RolesFilters onFiltersChange={handleFiltersChange} onExport={handleExport} /> */}
                    {session?.user?.permissions?.includes('add-ranks') && (
                        <Button variant="primary"  onClick={() => setShowCreateRankModal(true)}>Add Rank</Button>
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
                onHide={() => setShowEditRankModal(false)}
                title="Edit Rank"
                desc="Please fill in the details below to edit the rank."
                formHtml={
                    <>
                        <div className="form-group mb-3">
                            <label htmlFor="editRankName" className="form-label">Rank Name</label>
                            <input className="form-control" type="text" value={selectedRankName} onChange={(e) => setSelectedRankName(e.target.value)} />
                            <p className="text-muted mt-2 small">Change the name of an existing rank to better reflect its role or purpose in the system</p>
                        </div>
                    </>
                }
                submitButtonText="Save changes"
                cancelButtonText="Cancel"
                onSubmit={handleSubmitEditRank}
                onCancel={() => setShowEditRankModal(false)}
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
                onHide={() => setShowCreateRankModal(false)}
                title="New Rank"
                desc="Please fill in the details below to create a new rank."
                formHtml={
                    <>
                        <div className="form-group mb-3">
                            <label htmlFor="newRankName" className="form-label">Rank Name</label>
                            <input type="text" className="form-control" id="newRankName"  value={newRankName} onChange={(e) => setNewRankName(e.target.value)} placeholder="Rank Name" />
                            <p className="text-muted mt-2 small">Enter the name of the rank you want to create. This will be used to identify the rank in the system.</p>
                        </div>
                    </>
                }
                submitButtonText="Create"
                cancelButtonText="Cancel"
                onSubmit={handleSubmitCreateRank}
                onCancel={() => setShowCreateRankModal(false)}
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
        </React.Fragment>
    );
};

Ranks.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default Ranks;
