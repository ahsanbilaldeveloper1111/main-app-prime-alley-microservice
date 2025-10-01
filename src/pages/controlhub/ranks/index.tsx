import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useCallback, useMemo, useEffect } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { getAllRoles, ListRoles, updateRole,deleteRole,addRole,BulkDeleteRoles } from '@utils/roles';
import { Column } from '@components/CustomDataTable';
import { Button, DropdownItem, Dropdown, DropdownMenu, Modal, Row, DropdownToggle } from 'react-bootstrap';
import { Col } from 'react-bootstrap';
import RolesFilters from '@components/filters/RolesFilters';
import { toast } from 'react-toastify';
import { useTokenService } from 'src/hooks/useTokenService';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';


import '@assets/scss/common.scss';
import { FiEdit, FiMoreVertical, FiTrash2, FiEye } from 'react-icons/fi';

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

    const columns: Column[] = useMemo(() => {
        const baseColumns: Column[] = [
            { key: 'Name', name: 'name', selector: (row: any) => row.name, sortable: true},

            ...(session?.user?.is_admin === "1" ? [
                { key: 'Company', name: 'company', selector: (row: any) => row.company, sortable: true }
            ] : []),


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
                {session?.user?.permissions?.includes('edit-ranks')  && (
                    <DropdownItem className="action-edit" onClick={() => handleEditRank(props)}>
                        <FiEdit className="me-2" />
                        Edit
                    </DropdownItem>
                )}

{session?.user?.permissions?.includes('view-permissions-ranks')  && (
                    <Link href={`/controlhub/ranks/permissions/${props.id}`} className="dropdown-item action-view">
                        <FiEye className="me-2" />
                        View Permissions
                    </Link>
                )}

{session?.user?.permissions?.includes('assign-permissions-ranks')  && (
                    <Link href={`/controlhub/ranks/permissions/edit/${props.id}`} className="dropdown-item action-assign">
                        <FiEdit className="me-2" />
                        Assign Permissions
                    </Link>
                )}

                    {session?.user?.permissions?.includes('delete-ranks')  && (
                    <DropdownItem className="action-delete" onClick={() => handleDeleteRank(props)}>
                        <FiTrash2 className="me-2" />
                        Delete
                    </DropdownItem>
                    )}
                </DropdownMenu>
            </Dropdown>
                ),
            },
        ];
        
        return baseColumns;
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
            setRefreshKey(prev => prev + 1); // Trigger refresh
        }

        
    };

    const [showDeleteRankModal, setShowDeleteRankModal] = useState<boolean>(false);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState<boolean>(false);
    const [confirmDelete, setConfirmDelete] = useState<string>("");

    const handleDeleteRank = (props: any) => {
        setSelectedRank(props.id);
        setSelectedRankName(props.name);
        setShowDeleteRankModal(true);
    };

    const handleSubmitDeleteRank = async () => {
        const confirmDeleteValue = confirmDelete.trim().toLowerCase();
        if(confirmDeleteValue == "delete"){
            const response = await deleteRole(selectedRank);
            if(response){
                setSelectedRank(null);
                setSelectedRankName(null);
                setShowDeleteRankModal(false);
                setConfirmDelete("");
                setRefreshKey(prev => prev + 1); // Trigger refresh
            }
        }else{
            toast.error('Please type the word delete to confirm');
        }
    };

    const [deleteRankResponse, setDeleteRankResponse] = useState<any>(null);
    const [showBulkDeleteSummaryModal, setShowBulkDeleteSummaryModal] = useState<boolean>(false);
    const handleBulkDelete = async () => {
        const confirmDeleteValue = confirmDelete.trim().toLowerCase();
        if(confirmDeleteValue !== "delete") {
            toast.error('Please type the word delete to confirm');
            return;
        }

        try {
           
            const selectedIds = selectedRows.map((row: any) => row.id);
            console.log(selectedIds);
            const response = await BulkDeleteRoles(selectedIds);
           
            if(response){
                setDeleteRankResponse(response);
                setShowBulkDeleteSummaryModal(true);
                setShowBulkDeleteModal(false);
                setConfirmDelete("");
                
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
            setConfirmDelete("");
            setRefreshKey(prev => prev + 1); // Trigger refresh
        } catch (error) {
            console.error('Bulk delete error:', error);
            toast.error('An error occurred during bulk delete');
        }
    };

    const [showCreateRankModal, setShowCreateRankModal] = useState<boolean>(false);
    const [newRankName, setNewRankName] = useState<string>("");

    const handleSubmitCreateRank = async () => {
        const response = await addRole(newRankName);
        if(response){
            setNewRankName("");
            setShowCreateRankModal(false);
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
                    <div className="search-container">
                            <i className="fas fa-search search-icon"></i>
                            <input type="text" className="search-bar" placeholder="Search rank..." onChange={(e) => handleFiltersChange({...currentFilters, search: e.target.value})}/>
                        </div>
                    
                    {/* <RolesFilters onFiltersChange={handleFiltersChange} onExport={handleExport} /> */}
                    {session?.user?.permissions?.includes('add-ranks') && (
                        <Button variant="primary" size="sm"  onClick={() => setShowCreateRankModal(true)}>New Rank</Button>
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
                 search={false}
                 tableStyle="table-style-2"
             />
            )}

            {showEditRankModal && (
                <Modal
                    show={showEditRankModal}
                    onHide={() => setShowEditRankModal(false)}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Edit Rank</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <input className="form-control" type="text" value={selectedRankName} onChange={(e) => setSelectedRankName(e.target.value)} />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowEditRankModal(false)}>Close</Button>
                        <Button variant="primary" onClick={() => handleSubmitEditRank()}>Save changes</Button>
                    </Modal.Footer>
                </Modal>
            )}

            {showDeleteRankModal && (
                <Modal
                    show={showDeleteRankModal}
                    onHide={() => setShowDeleteRankModal(false)}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Delete Rank?</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p>
                            Are you sure you want to delete this <b className="text-danger">{selectedRankName}</b> rank?
                        </p>
                        <p>
                            Type the word <b className="text-danger">delete</b> to confirm
                        </p>
                        <input type="text" className="form-control" id="confirmDelete" value={confirmDelete} onChange={(e) => setConfirmDelete(e.target.value)} placeholder="Type the word delete to confirm" />

                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowDeleteRankModal(false)}>Close</Button>
                        <Button variant="danger" onClick={() => handleSubmitDeleteRank()}>Delete</Button>
                    </Modal.Footer>
                    
                </Modal>
            )}

            {showCreateRankModal && (
                <Modal
                    show={showCreateRankModal}
                    onHide={() => setShowCreateRankModal(false)}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>New Rank</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <input type="text" className="form-control" id="newRankName"  value={newRankName} onChange={(e) => setNewRankName(e.target.value)} placeholder="Rank Name" />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowCreateRankModal(false)}>Close</Button>
                        <Button variant="primary" onClick={() => handleSubmitCreateRank()}>Create</Button>
                    </Modal.Footer>
                </Modal>
            )}

            {showBulkDeleteModal && (
                <Modal
                    show={showBulkDeleteModal}
                    onHide={() => setShowBulkDeleteModal(false)}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Bulk Delete Ranks</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p>
                            Are you sure you want to delete the selected ranks?
                        </p>
                        <div className="selected-ranks-list mb-3">
                           
                            <ul className="list-unstyled">
                                {selectedRows.map((row, index) => (
                                    <li key={row.id} className="text-danger">
                                        {row.name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <p>
                            Type the word <b className="text-danger">delete</b> to confirm
                        </p>
                        <input type="text" className="form-control" value={confirmDelete} onChange={(e) => setConfirmDelete(e.target.value)} placeholder="Type the word delete to confirm" />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => {
                            setShowBulkDeleteModal(false);
                            setConfirmDelete("");
                        }}>Close</Button>
                        <Button variant="danger" onClick={handleBulkDelete}>Delete</Button>
                    </Modal.Footer>
                </Modal>
            )}

            {showBulkDeleteSummaryModal && (
                <Modal
                    show={showBulkDeleteSummaryModal}
                    onHide={() => setShowBulkDeleteSummaryModal(false)}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Bulk Delete Summary</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      
                    {deleteRankResponse.length > 0 && deleteRankResponse.map((item: any) => (
                        <div className="form-group alert alert-primary" key={item.id}>
                           Rank: {item.name}
                           <br />
                           Message: {item.message}
                        </div>
                    ))}
                        
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowBulkDeleteSummaryModal(false)}>Close</Button>
                    </Modal.Footer>
                </Modal>
            )}
        </React.Fragment>
    );
};

Ranks.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default Ranks;
