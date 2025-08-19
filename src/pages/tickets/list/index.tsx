import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useCallback, useMemo } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { ListTickets,CreateTicket,UpdateTicket,DeleteTicket } from '@utils/tickets';
import { Column } from '@components/CustomDataTable';
import { Button, Modal, Row } from 'react-bootstrap';
import { Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useTokenService } from 'src/hooks/useTokenService';
import { useSession } from 'next-auth/react';
import moment from 'moment';
import { CreateStatus } from '@utils/ticket-statuses';

const TicketList = () => {
    const { data:session, status } = useSession();
   
    const columns: Column[] = useMemo(() => [
        { key: 'title', name: 'Title', selector: (row: any) => row.title, sortable: true },
        { key: 'type', name: 'Type', selector: (row: any) => row.type, sortable: true,
            cell: (props: any) => (
                <span className={`badge ${props?.type?.toLowerCase() === 'bug' ? 'bg-danger' : 'bg-primary'} text-uppercase`}>
                    {props?.type}
                </span>
            )
        },
        { key: 'description', name: 'Description', selector: (row: any) => row.description, sortable: true },
        { key: 'user_extension', name: 'User Extension', selector: (row: any) => row.user_extension, sortable: true,
            cell: (props: any) => (
                <span className="badge bg-info">
                    {props.user_extension}
                </span>
            )
         },
        { key: 'status', name: 'Status & Module', selector: (row: any) => row.status, sortable: true,
            cell: (props: any) => (
                <div className="d-flex flex-column gap-1">
                  <span className="badge" style={{ backgroundColor: `${props.status?.color}30`,color: props.status?.color,fontWeight: 'bold' }}>
                  {props.status?.name}
                </span>
                <span className="badge" style={{ backgroundColor: `${props.module?.color}30`,color: props.module?.color,fontWeight: 'bold' }}>
                  {props.module?.name}
                </span>
                </div>
            )
         },
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

                  {session?.user?.permissions?.includes('view-ticket-tickets') && (
                    <button 
                        className="btn btn-sm btn-outline-primary" 
                        onClick={() => handleViewTicket(props)}
                    >
                        View
                    </button>
                  )}
                    {session?.user?.permissions?.includes('edit-ticket-tickets')  && (
                        <button 
                            className="btn btn-sm btn-outline-primary" 
                            onClick={() => handleEditTicket(props)}
                        >
                            Edit
                        </button>
                    )}  

                    {session?.user?.permissions?.includes('delete-ticket-tickets')   && (
                        <button 
                            className="btn btn-sm btn-outline-danger" 
                            onClick={() => handleDeleteTicket(props)}
                            //disabled={props.tickets_count > 0}
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

    const fetchTickets = useCallback(async (page = 1, perPage = 15, search = "") => {
        return await ListTickets({ page, perPage, search, filters: memoizedFilters });
    }, [memoizedFilters]);

    const handleFiltersChange = useCallback((filters: any) => {
        //console.log('Filters changed:', filters);
        setCurrentFilters(filters);
    }, []);



    const [showViewTicketModal, setShowViewTicketModal] = useState<boolean>(false);
    const [viewTicketData, setViewTicketData] = useState<any>([]);
    const [showImageModal, setShowImageModal] = useState<boolean>(false);
    const [selectedImage, setSelectedImage] = useState<string>("");
    const handleViewTicket = useCallback((props: any) => {
        setViewTicketData(props);
        console.log('View ticket:', props);
        setShowViewTicketModal(true);
    }, []);

    const closeViewTicketModal = useCallback(() => setShowViewTicketModal(false), []);

    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [selectedTicketTitle, setSelectedTicketTitle] = useState<any>(null);
    const [selectedTicketDescription, setSelectedTicketDescription] = useState<any>(null);
    const [showEditTicketModal, setShowEditTicketModal] = useState<boolean>(false);
    const [showDeleteTicketModal, setShowDeleteTicketModal] = useState<boolean>(false);
    const handleEditTicket = useCallback((props: any) => {
        setSelectedTicket(props.id);
        setSelectedTicketTitle(props.title);
        setSelectedTicketDescription(props.description);
        setShowEditTicketModal(true);
    }, []);

    const handleSubmitEditTicket = useCallback(async () => {
        //console.log('Submit edit group:', selectedGroup, selectedGroupName);
        const response = await UpdateTicket(selectedTicket, selectedTicketTitle, selectedTicketDescription);
        if(response){
            setSelectedTicket(null);
            setSelectedTicketTitle(null);
            setSelectedTicketDescription(null);
            setShowEditTicketModal(false);
            setRefreshKey(prev => prev + 1); // Trigger refresh
        }

        
    }, [selectedTicket, selectedTicketTitle, selectedTicketDescription]);

    const [confirmDelete, setConfirmDelete] = useState<string>("");

    const handleDeleteTicket = useCallback((props: any) => {
        setSelectedTicket(props.id);
        setSelectedTicketTitle(props.title);
        setShowDeleteTicketModal(true);
    }, []);

    const handleSubmitDeleteTicket  = useCallback(async () => {
        const confirmDeleteValue = confirmDelete.trim().toLowerCase();
        if(confirmDeleteValue == "delete"){
            const response = await DeleteTicket(selectedTicket);
            if(response){
                setSelectedTicket(null);
                setSelectedTicketTitle(null);
                setShowDeleteTicketModal(false);
                setConfirmDelete("");
                setRefreshKey(prev => prev + 1); // Trigger refresh
            }
        }else{
            toast.error('Please type the word delete to confirm');
        }
    }, [confirmDelete, selectedTicket]);

    const [showCreateTicketModal, setShowCreateTicketModal] = useState<boolean>(false);
    const [newTicketTitle, setNewTicketTitle] = useState<string>("");
    const [newTicketDescription, setNewTicketDescription] = useState<string>("");

    const handleSubmitCreateTicket = useCallback(async () => {
        const response = await CreateTicket(newTicketTitle, newTicketDescription);
        if(response){
            setNewTicketTitle("");
            setNewTicketDescription("");
            setShowCreateTicketModal(false);
            setRefreshKey(prev => prev + 1); // Trigger refresh
        }
    }, [newTicketTitle, newTicketDescription]);

    const openCreateTicketModal = useCallback(() => setShowCreateTicketModal(true), []);
    const closeCreateTicketModal = useCallback(() => setShowCreateTicketModal(false), []);
    const openEditTicketModal = useCallback(() => setShowEditTicketModal(true), []);
    const closeEditTicketModal = useCallback(() => setShowEditTicketModal(false), []);
    const openDeleteTicketModal = useCallback(() => setShowDeleteTicketModal(true), []);
    const closeDeleteTicketModal = useCallback(() => setShowDeleteTicketModal(false), []);

    const handleNewTicketTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setNewTicketTitle(e.target.value), []);
    const handleNewTicketDescriptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setNewTicketDescription(e.target.value), []);
    const handleEditTicketTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSelectedTicketTitle(e.target.value), []);
    const handleEditTicketDescriptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSelectedTicketDescription(e.target.value), []);
    const handleConfirmDeleteChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setConfirmDelete(e.target.value), []);

    const handleImageClick = useCallback((imageUrl: string) => {
        setSelectedImage(imageUrl);
        setShowImageModal(true);
    }, []);

    const closeImageModal = useCallback(() => setShowImageModal(false), []);

    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="Tickets" mainLink="/tickets/list" subTitle="Tickets" />
            <Row className="mb-3">
            <Col md={12}>
                <div className="page-header-title">
                <h2 className="mb-0 d-flex align-items-center">
                    Tickets
                    {session?.user?.permissions?.includes('create-ticket-tickets') && (
                        <Button variant="outline-primary" size="sm" className="ms-3" onClick={openCreateTicketModal}>New Ticket</Button>
                    )}
                    
                </h2>
                </div>
            </Col>
            </Row>

            {session?.user?.permissions?.includes('tickets-tickets') && (
                 <GenericListPage
                 columns={columns}
                 fetchData={fetchTickets}
                 title="Tickets"
                 searchPlaceholder="Search tickets..."
                 defaultPageSize={15}
                 filters={memoizedFilters}
                 refreshKey={refreshKey}
             />
            )}

            {showEditTicketModal && (
                <Modal
                    show={showEditTicketModal}
                    onHide={closeEditTicketModal}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Edit Ticket</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="form-group mb-3">
                            <label htmlFor="editTicketTitle">Ticket Title</label>
                            <input type="text" className="form-control" id="editTicketTitle" value={selectedTicketTitle} onChange={handleEditTicketTitleChange} placeholder="Ticket Title" />
                        </div>

                        <div className="form-group mb-3">
                            <label htmlFor="editTicketDescription">Ticket Description</label>
                            <textarea className="form-control" id="editTicketDescription" value={selectedTicketDescription} onChange={handleEditTicketDescriptionChange} placeholder="Ticket Description"></textarea>
                        </div>


                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={closeEditTicketModal}>Close</Button>
                        <Button variant="primary" onClick={() => handleSubmitEditTicket()}>Save changes</Button>
                    </Modal.Footer>
                </Modal>
            )}

            {showDeleteTicketModal && (
                <Modal
                    show={showDeleteTicketModal}
                    onHide={closeDeleteTicketModal}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Delete Ticket?</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p>
                            Are you sure you want to delete this <b className="text-danger">{selectedTicketTitle}</b> ticket?
                        </p>
                        <p>
                            Type the word <b className="text-danger">delete</b> to confirm
                        </p>
                        <input type="text" className="form-control" id="confirmDelete" value={confirmDelete} onChange={handleConfirmDeleteChange} placeholder="Type the word delete to confirm" />

                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={closeDeleteTicketModal}>Close</Button>
                        <Button variant="danger" onClick={() => handleSubmitDeleteTicket()}>Delete</Button>
                    </Modal.Footer>
                    
                </Modal>
            )}

            {showCreateTicketModal && (
                <Modal
                    show={showCreateTicketModal}
                    onHide={closeCreateTicketModal}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>New Ticket</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        
                        <div className="form-group mb-3">
                            <label htmlFor="newTicketTitle">Ticket Title</label>
                            <input type="text" className="form-control" id="newTicketTitle"  value={newTicketTitle} onChange={handleNewTicketTitleChange} placeholder="Ticket Title" />
                        </div>

                        <div className="form-group mb-3">
                            <label htmlFor="newTicketDescription">Ticket Description</label>
                            <textarea className="form-control" id="newTicketDescription" value={newTicketDescription} onChange={handleNewTicketDescriptionChange} placeholder="Ticket Description"></textarea>
                        </div>

                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={closeCreateTicketModal}>Close</Button>
                        <Button variant="primary" onClick={() => handleSubmitCreateTicket()}>Create</Button>
                    </Modal.Footer>
                </Modal>
            )}


            {showViewTicketModal && (
                <Modal
                    show={showViewTicketModal}
                    onHide={closeViewTicketModal}
                    size="lg"
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Ticket Information</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <table className="table table-bordered">
                            <tbody>
                                {/* <tr>
                                    <td><strong>Ticket ID</strong></td>
                                    <td>{viewTicketData?.id}</td>
                                </tr> */}
                                <tr>
                                    <td><strong>Ticket Title</strong></td>
                                    <td>{viewTicketData?.title}</td>
                                </tr>
                                <tr>            
                                    <td><strong>Ticket Description</strong></td>
                                    <td>{viewTicketData?.description}</td>
                                </tr>
                                <tr>
                                    <td><strong>Ticket Type</strong></td>
                                    <td>
                                        <span className={`badge ${viewTicketData?.type?.toLowerCase() === 'bug' ? 'bg-danger' : 'bg-primary'} text-uppercase`}>
                                            {viewTicketData?.type}
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>Ticket Status</strong></td>
                                    <td>
                                        <span className="badge" style={{ backgroundColor: `${viewTicketData?.status?.color}30`, color: viewTicketData?.status?.color, fontWeight: 'bold' }}>
                                            {viewTicketData?.status?.name}
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>Module</strong></td>
                                    <td>
                                        <span className="badge" style={{ backgroundColor: `${viewTicketData?.module?.color}30`, color: viewTicketData?.module?.color, fontWeight: 'bold' }}>
                                            {viewTicketData?.module?.name}
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>User Extension</strong></td>
                                    <td>
                                        <span className="badge bg-info">
                                            {viewTicketData?.user_extension}
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>Ticket Image</strong></td>
                                    <td>
                                        {viewTicketData?.image ? (
                                            <img 
                                                src={`http://crmstaging.sipzon.com:7518/storage/${viewTicketData.image}`} 
                                                alt="Ticket Image" 
                                                className="img-fluid" 
                                                style={{ maxWidth: '200px', maxHeight: '200px', cursor: 'pointer' }}
                                                onClick={() => handleImageClick(`http://crmstaging.sipzon.com:7518/storage/${viewTicketData.image}`)}
                                            />
                                        ) : (
                                            <span className="text-muted">No image</span>
                                        )}
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>Created At</strong></td>
                                    <td>{moment(viewTicketData?.created_at).format('DD/MM/YYYY HH:mm:ss')}</td>
                                </tr>
                                <tr>
                                    <td><strong>Updated At</strong></td>
                                    <td>{moment(viewTicketData?.updated_at).format('DD/MM/YYYY HH:mm:ss')}</td>
                                </tr>
                            </tbody>
                        </table>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={closeViewTicketModal}>Close</Button>
                    </Modal.Footer>
                </Modal>
            )}

            {showImageModal && (
                <Modal
                    show={showImageModal}
                    onHide={closeImageModal}
                    size="xl"
                    centered
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Ticket Image</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="text-center">
                        <img 
                            src={selectedImage} 
                            alt="Ticket Image Full Size" 
                            className="img-fluid"
                            style={{ maxHeight: '70vh' }}
                        />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={closeImageModal}>Close</Button>
                    </Modal.Footer>
                </Modal>
            )}
        
        </React.Fragment>
    );
};

TicketList.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default TicketList;
