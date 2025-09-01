import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useCallback, useMemo } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { ListStatuses,CreateStatus,UpdateStatus,DeleteStatus } from '@utils/ticket-statuses';
import { Column } from '@components/CustomDataTable';
import { Button, Modal, Row } from 'react-bootstrap';
import { Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useTokenService } from 'src/hooks/useTokenService';
import { useSession } from 'next-auth/react';
import moment from 'moment';

const TicketStatuses = () => {
    const { data:session, status } = useSession();
   
    const columns: Column[] = useMemo(() => [
        { key: 'name', name: 'Name', selector: (row: any) => row.name, sortable: true },
      { key: 'color', name: 'Color', selector: (row: any) => row.color, sortable: true,
            cell: (props: any) => (
                <span className="text-muted" style={{ backgroundColor: props.color, width: '20px', height: '20px', borderRadius: '50%',display: 'inline-block'}}></span>
            )
         },
      //   { key: 'tickets_count', name: 'Tickets Using', selector: (row: any) => row.tickets_count, sortable: true,
      //       cell: (props: any) => (
      //           <span className="badge bg-info">
      //               {props.tickets_count}
      //           </span>
      //       )
      //    },
        { key: 'created_at', name: 'Created At', selector: (row: any) => row.created_at, sortable: true,
            cell: (props: any) => (
                <span className="text-muted">
                    {moment(props.created_at).format('DD/MM/YYYY')}
                </span>
            )
         },
        {
            key: 'Action',
            name: 'ACTION',
            selector: (row: any) => row.id,
            sortable: false,
            cell: (props: any) => (
                
                <div className="action-buttons-container">
    
                    {session?.user?.permissions?.includes('edit-ticket-status-tickets')  && (
                        <button 
                            className="btn btn-sm btn-outline-primary" 
                            onClick={() => handleEditStatus(props)}
                        >
                            Edit
                        </button>
                    )}  

                    {session?.user?.permissions?.includes('delete-ticket-status-tickets')   && (
                        <button 
                            className="btn btn-sm btn-outline-danger" 
                            onClick={() => handleDeleteStatus(props)}
                            disabled={props?.tickets_count > 0}
                        >
                            Delete
                        </button>
                    )}

                    
                </div>
            ),
        },
    ], [session?.user?.permissions]);

    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [currentFilters, setCurrentFilters] = useState({});

    const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

    const fetchStatuses = useCallback(async (page = 1, perPage = 15, search = "") => {
        const response = await ListStatuses({ page, perPage, search, filters: memoizedFilters });
        console.log('Response:', response);
        return response;
    }, [memoizedFilters]);

    const handleFiltersChange = useCallback((filters: any) => {
        //console.log('Filters changed:', filters);
        setCurrentFilters(filters);
    }, []);

    const [selectedStatus, setSelectedStatus] = useState<any>(null);
    const [selectedStatusName, setSelectedStatusName] = useState<any>(null);
    const [selectedStatusColor, setSelectedStatusColor] = useState<any>(null);
    const [showEditStatusModal, setShowEditStatusModal] = useState<boolean>(false);
    const [showDeleteStatusModal, setShowDeleteStatusModal] = useState<boolean>(false);
    const handleEditStatus = useCallback((props: any) => {
        setSelectedStatus(props.id);
        setSelectedStatusName(props.name);
        setSelectedStatusColor(props.color);
        setShowEditStatusModal(true);
    }, []);

    const handleSubmitEditStatus = useCallback(async () => {
        //console.log('Submit edit group:', selectedGroup, selectedGroupName);
        const response = await UpdateStatus(selectedStatus, selectedStatusName, selectedStatusColor);
        if(response){
            setSelectedStatus(null);
            setSelectedStatusName(null);
            setSelectedStatusColor(null);
            setShowEditStatusModal(false);
            setRefreshKey(prev => prev + 1); // Trigger refresh
        }

        
    }, [selectedStatus, selectedStatusName, selectedStatusColor]);

    const [showDeleteModuleModal, setShowDeleteModuleModal] = useState<boolean>(false);
    const [confirmDelete, setConfirmDelete] = useState<string>("");

    const handleDeleteStatus = useCallback((props: any) => {
        setSelectedStatus(props.id);
        setSelectedStatusName(props.name);
        setShowDeleteStatusModal(true);
    }, []);

    const handleSubmitDeleteStatus  = useCallback(async () => {
        const confirmDeleteValue = confirmDelete.trim();
        if(confirmDeleteValue === "DELETE"){
            const response = await DeleteStatus(selectedStatus);
            if(response){
                setSelectedStatus(null);
                setSelectedStatusName(null);
                setShowDeleteStatusModal(false);
                setConfirmDelete("");
                setRefreshKey(prev => prev + 1); // Trigger refresh
            }
        }else{
            toast.error('Please type the word DELETE to confirm');
        }
    }, [confirmDelete, selectedStatus]);

    const [showCreateStatusModal, setShowCreateStatusModal] = useState<boolean>(false);
    const [newStatusName, setNewStatusName] = useState<string>("");
    const [newStatusColor, setNewStatusColor] = useState<string>("");

    const handleSubmitCreateStatus = useCallback(async () => {
        const response = await CreateStatus(newStatusName, newStatusColor);
        if(response){
            setNewStatusName("");
            setNewStatusColor("");
            setShowCreateStatusModal(false);
            setRefreshKey(prev => prev + 1); // Trigger refresh
        }
    }, [newStatusName, newStatusColor]);

    const openCreateStatusModal = useCallback(() => setShowCreateStatusModal(true), []);
    const closeCreateStatusModal = useCallback(() => setShowCreateStatusModal(false), []);
    const openEditStatusModal = useCallback(() => setShowEditStatusModal(true), []);
    const closeEditStatusModal = useCallback(() => setShowEditStatusModal(false), []);
    const openDeleteStatusModal = useCallback(() => setShowDeleteStatusModal(true), []);
    const closeDeleteStatusModal = useCallback(() => setShowDeleteStatusModal(false), []);

    const handleNewStatusNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setNewStatusName(e.target.value), []);
    const handleNewStatusColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setNewStatusColor(e.target.value), []);
    const handleEditStatusNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSelectedStatusName(e.target.value), []);
    const handleEditStatusColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSelectedStatusColor(e.target.value), []);
    const handleConfirmDeleteChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setConfirmDelete(e.target.value), []);

    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="Tickets" mainLink="/tickets/statuses" subTitle="Ticket Status" />
            <Row className="mb-3">
            <Col md={12}>
                <div className="page-header-title">
                <h2 className="mb-0 d-flex align-items-center">
                    Ticket Status
                    {session?.user?.permissions?.includes('create-ticket-status-tickets') && (
                        <Button variant="outline-primary" size="sm" className="ms-3" onClick={openCreateStatusModal}>New Status</Button>
                    )}
                    
                </h2>
                </div>
            </Col>
            </Row>

            {session?.user?.permissions?.includes('ticket-statuses-tickets') && (
                 <GenericListPage
                 columns={columns}
                 fetchData={fetchStatuses}
                 title="Status"
                 searchPlaceholder="Search statuses..."
                 defaultPageSize={15}
                 filters={memoizedFilters}
                 refreshKey={refreshKey}
             />
            )}

            {showEditStatusModal && (
                <Modal
                    show={showEditStatusModal}
                    onHide={closeEditStatusModal}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Edit Status</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="form-group mb-3">
                            <label htmlFor="editStatusName">Status Name</label>
                            <input type="text" className="form-control" id="editStatusName" value={selectedStatusName} onChange={handleEditStatusNameChange} placeholder="Status Name" />
                        </div>

                        <div className="form-group mb-3">
                            <label htmlFor="editStatusColor">Status Color</label>
                            <div className="d-flex align-items-center gap-2">
                                <input type="color" className="form-control form-control-color" id="editStatusColorPicker" value={selectedStatusColor} onChange={handleEditStatusColorChange} style={{ width: '50px', height: '38px' }} />
                                <input type="text" className="form-control" id="editStatusColor" value={selectedStatusColor} onChange={handleEditStatusColorChange} placeholder="e.g., #FF5733 or rgb(255, 87, 51)" />
                            </div>
                        </div>


                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={closeEditStatusModal}>Close</Button>
                        <Button variant="primary" onClick={() => handleSubmitEditStatus()}>Save changes</Button>
                    </Modal.Footer>
                </Modal>
            )}

            {showDeleteStatusModal && (
                <Modal
                    show={showDeleteStatusModal}
                    onHide={closeDeleteStatusModal}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Delete Module?</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p>
                            Are you sure you want to delete this <b className="text-danger">{selectedStatusName}</b> status?
                        </p>
                        <p>
                            Type the word <b className="text-danger">DELETE</b> to confirm
                        </p>
                        <input type="text" className="form-control" id="confirmDelete" value={confirmDelete} onChange={handleConfirmDeleteChange} placeholder="Type the word DELETE to confirm" />

                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={closeDeleteStatusModal}>Close</Button>
                        <Button variant="danger" onClick={() => handleSubmitDeleteStatus()}>Delete</Button>
                    </Modal.Footer>
                    
                </Modal>
            )}

            {showCreateStatusModal && (
                <Modal
                    show={showCreateStatusModal}
                    onHide={closeCreateStatusModal}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>New Status</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        
                        <div className="form-group mb-3">
                            <label htmlFor="newStatusName">Status Name</label>
                            <input type="text" className="form-control" id="newStatusName"  value={newStatusName} onChange={handleNewStatusNameChange} placeholder="Status Name" />
                        </div>

                        <div className="form-group mb-3">
                            <label htmlFor="newStatusColor">Status Color</label>
                            <div className="d-flex align-items-center gap-2">
                                <input 
                                    type="color" 
                                    className="form-control form-control-color" 
                                    id="colorPicker"
                                    value={newStatusColor || "#000000"}
                                    onChange={handleNewStatusColorChange}
                                    style={{ width: '50px', height: '38px' }}
                                />
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    id="newStatusColor" 
                                    value={newStatusColor} 
                                    onChange={handleNewStatusColorChange} 
                                    placeholder="e.g., #FF5733 or rgb(255, 87, 51)"
                                />
                            </div>
                        </div>


                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={closeCreateStatusModal}>Close</Button>
                        <Button variant="primary" onClick={() => handleSubmitCreateStatus()}>Create</Button>
                    </Modal.Footer>
                </Modal>
            )}
        
        </React.Fragment>
    );
};

TicketStatuses.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default TicketStatuses;
