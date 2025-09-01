import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useCallback, useMemo } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { getAllRoles, ListRoles, updateRole,deleteRole,addRole } from '@utils/roles';
import { Column } from '@components/CustomDataTable';
import { Button, Modal, Row } from 'react-bootstrap';
import { Col } from 'react-bootstrap';
import RolesFilters from '@components/filters/RolesFilters';
import { toast } from 'react-toastify';
import { useTokenService } from 'src/hooks/useTokenService';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const Ranks = () => {
    const { data:session, status } = useSession();
   
    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [currentFilters, setCurrentFilters] = useState({});
    const [selectedRows, setSelectedRows] = useState<any[]>([]);
    const [rowSelectionEnabled, setRowSelectionEnabled] = useState<boolean>(true);

    const handleSelectionChange = (selectedRows: any[]) => {
        setSelectedRows(selectedRows);
        console.log('Selected rows:', selectedRows);
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
                    
                    <div className="d-flex gap-3">
        
                        {session?.user?.permissions?.includes('edit-ranks')  && (
                            <button className="btn btn-sm btn-outline-primary" onClick={() => handleEditRank(props)}>Edit Rank</button>
                        )}  

                        {session?.user?.permissions?.includes('delete-ranks')  && (
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteRank(props)}>Delete Rank</button>
                        )}

                        {session?.user?.permissions?.includes('view-permissions-ranks')  && (
                            <Link href={`/controlhub/ranks/permissions/${props.id}`} className="btn btn-sm btn-outline-primary">View Permissions</Link>
                        )}
                        
                        {session?.user?.permissions?.includes('assign-permissions-ranks')  && (
                            <Link href={`/controlhub/ranks/permissions/edit/${props.id}`} className="btn btn-sm btn-outline-danger">Assign Permissions</Link>
                        )}
        
                    </div>
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
                <div className="page-header-title">
                <h2 className="mb-0 d-flex align-items-center">
                    Ranks
                    {session?.user?.permissions?.includes('add-ranks') && (
                        <Button variant="outline-primary" size="sm" className="ms-3" onClick={() => setShowCreateRankModal(true)}>New Rank</Button>
                    )}
                    
                    <RolesFilters onFiltersChange={handleFiltersChange} onExport={handleExport} />
                    
                </h2>
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
                                <Button variant="outline-danger" size="sm" onClick={() => console.log('Bulk delete selected rows:', selectedRows)}>Bulk Delete</Button>
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
                 keyField="id"
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
        
        </React.Fragment>
    );
};

Ranks.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default Ranks;
