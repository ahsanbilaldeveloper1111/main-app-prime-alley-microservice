import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useCallback, useMemo, useEffect } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { ListTickets,CreateTicket,UpdateTicket,UpdateTicketDetails,DeleteTicket } from '@utils/tickets';
import {GetHierarchyData} from '@utils/users';
import { GetAllStatuses } from '@utils/ticket-statuses';
import { Column } from '@components/CustomDataTable';
import { Button, Modal, Row } from 'react-bootstrap';
import { Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useTokenService } from 'src/hooks/useTokenService';
import { useSession } from 'next-auth/react';
import moment from 'moment';
import { CreateStatus } from '@utils/ticket-statuses';
import { GetAllModules } from '@utils/ticket-module';
import Select from 'react-select';
import TicketsFilters from '@components/filters/TicketFilters';

interface SelectOption {
      value: number;
      label: string;
  }

const TicketList = () => {
    const { data:session, status } = useSession();
   
    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [currentFilters, setCurrentFilters] = useState({});

    const [statuses, setStatuses] = useState<any>([]);
    const [modules, setModules] = useState<any>([]);

    const [hierarchyData, setHierarchyData] = useState<any>([]);
    const [extensions, setExtensions] = useState<any>([]);

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
                    {extensions.find((extension: any) => extension.id.toString() === props.user_extension?.toString())?.display_name || props.user_extension}
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
    ], [session?.user?.permissions, extensions]);

    useEffect(() => {
        const fetchStatuses = async () => {
            const statuses = await GetAllStatuses();
            setStatuses(statuses);
            console.log('Statuses:', statuses);
        };
        fetchStatuses();
    }, []);
    

    useEffect(() => {
        const fetchModules = async () => {
            const modules = await GetAllModules();
            setModules(modules);
            console.log('Modules:', modules);
        };
        fetchModules();
    }, []);

    useEffect(() => {
        const fetchHierarchyData = async () => {
            const hierarchyData = await GetHierarchyData();
            setHierarchyData(hierarchyData);
            console.log('Hierarchy Data:', hierarchyData);
            setExtensions(hierarchyData?.extensions);
            console.log('Extensions:', extensions);
        };
        fetchHierarchyData();
    }, []);
    
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
        console.log('Edit ticket props:', props);
        console.log('User extension from props:', props.user_extension);
        console.log('Available extensions:', extensions);
        
        if (extensions.length === 0) {
            console.log('Extensions not loaded yet, waiting...');
            return;
        }
        
        setSelectedTicket(props);
        setSelectedTicketTitle(props.title);
        setSelectedTicketDescription(props.description);
        setShowEditTicketModal(true);
    }, [extensions]);

    const handleSubmitEditTicket = useCallback(async () => {
        //console.log('Submit edit group:', selectedGroup, selectedGroupName);
        const response = await UpdateTicketDetails(
            selectedTicket.id, 
            selectedTicketTitle, 
            selectedTicketDescription,
            selectedTicket.type,
            selectedTicket.ticket_status_id,
            selectedTicket.module_id,
            selectedTicket.user_extension
        );
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
    const [newTicketType, setNewTicketType] = useState<string>("");
    const [newTicketStatus, setNewTicketStatus] = useState<string>("");
    const [newTicketModule, setNewTicketModule] = useState<string>("");
    const [newTicketUserExtension, setNewTicketUserExtension] = useState<string>("");
    const [newTicketUserExtensionName, setNewTicketUserExtensionName] = useState<string>("");

    const [newTicketImage, setNewTicketImage] = useState<File | null>(null);

    const handleSubmitCreateTicket = useCallback(async () => {
        console.log('=== COMPONENT DEBUG ===');
        console.log('newTicketImage type:', typeof newTicketImage, newTicketImage instanceof File);
        console.log('newTicketImage MIME type:', newTicketImage?.type);
        console.log('newTicketImage size:', newTicketImage?.size);
        
        const formData = new FormData();
        formData.append('title', newTicketTitle);
        formData.append('description', newTicketDescription);
        formData.append('type', newTicketType);
        formData.append('ticket_status_id', newTicketStatus);
        formData.append('module_id', newTicketModule);
        formData.append('user_extension', newTicketUserExtension);
        if (newTicketImage) {
            formData.append('image', newTicketImage);
        }
        
        // Debug FormData contents
        console.log('FormData created successfully');
        console.log('FormData has image:', newTicketImage ? 'Yes' : 'No');
        if (newTicketImage) {
            console.log('Image name:', newTicketImage.name);
            console.log('Image type:', newTicketImage.type);
            console.log('Image size:', newTicketImage.size);
        }
        
        console.log('FormData created type:', typeof formData, formData instanceof FormData);
        console.log('FormData constructor:', formData?.constructor?.name);
        console.log('=== END COMPONENT DEBUG ===');
        
        const response = await CreateTicket(formData);
        if(response){
            setNewTicketTitle("");
            setNewTicketDescription("");
            setNewTicketType("");
            setNewTicketStatus("");
            setNewTicketModule("");
            setNewTicketUserExtension("");
            setNewTicketUserExtensionName("");
            setNewTicketImage(null);
            setShowCreateTicketModal(false);
            setRefreshKey(prev => prev + 1); // Trigger refresh
        }
    }, [newTicketTitle, newTicketDescription, newTicketType, newTicketStatus, newTicketModule, newTicketUserExtension, newTicketImage]);

    const openCreateTicketModal = useCallback(() => setShowCreateTicketModal(true), []);
    const closeCreateTicketModal = useCallback(() => {
        setShowCreateTicketModal(false);
        // Reset all form fields including the file input
        setNewTicketTitle("");
        setNewTicketDescription("");
        setNewTicketType("");
        setNewTicketStatus("");
        setNewTicketModule("");
        setNewTicketUserExtension("");
        setNewTicketUserExtensionName("");
        setNewTicketImage(null);
        
        // Reset the file input element
        const fileInput = document.getElementById('newTicketImage') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    }, []);
    const openEditTicketModal = useCallback(() => setShowEditTicketModal(true), []);
    const closeEditTicketModal = useCallback(() => setShowEditTicketModal(false), []);
    const openDeleteTicketModal = useCallback(() => setShowDeleteTicketModal(true), []);
    const closeDeleteTicketModal = useCallback(() => setShowDeleteTicketModal(false), []);

    const handleNewTicketTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setNewTicketTitle(e.target.value), []);
    const handleNewTicketDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => setNewTicketDescription(e.target.value), []);
    const handleEditTicketTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSelectedTicketTitle(e.target.value), []);
    const handleEditTicketDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => setSelectedTicketDescription(e.target.value), []);
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
                    <TicketsFilters onFiltersChange={handleFiltersChange}  />
                    
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
                    size="lg"
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Edit Ticket</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="row">
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label htmlFor="editTicketTitle">Ticket Title</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        id="editTicketTitle" 
                                        value={selectedTicketTitle} 
                                        onChange={handleEditTicketTitleChange} 
                                        placeholder="Ticket Title" 
                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label htmlFor="editTicketType">Ticket Type</label>
                                    <select 
                                        className="form-control" 
                                        id="editTicketType" 
                                        value={selectedTicket?.type || ''} 
                                        onChange={(e) => setSelectedTicket({...selectedTicket, type: e.target.value})}
                                    >
                                        <option value="">Select Type</option>
                                        <option value="bug" selected={selectedTicket?.type === 'bug'}>Bug</option>
                                        <option value="feature" selected={selectedTicket?.type === 'feature'}>Feature</option>
                                        
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="form-group mb-3">
                            <label htmlFor="editTicketDescription">Ticket Description</label>
                            <textarea 
                                className="form-control" 
                                id="editTicketDescription" 
                                value={selectedTicketDescription} 
                                onChange={handleEditTicketDescriptionChange} 
                                placeholder="Ticket Description"
                                rows={4}
                            ></textarea>
                        </div>

                        <div className="row">
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label htmlFor="editTicketStatus">Status</label>
                                    <select 
                                        className="form-control" 
                                        id="editTicketStatus" 
                                        value={selectedTicket?.ticket_status_id || ''} 
                                        onChange={(e) => setSelectedTicket({...selectedTicket, ticket_status_id: e.target.value})}
                                    >
                                        <option value="">Select Status</option>
                                        {statuses.map((status: any) => (
                                            <option value={status.id} selected={selectedTicket?.ticket_status_id === status.id}>{status.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label htmlFor="editTicketModule">Module</label>
                                    <select 
                                        className="form-control" 
                                        id="editTicketModule" 
                                        value={selectedTicket?.module_id || ''} 
                                        onChange={(e) => setSelectedTicket({...selectedTicket, module_id: e.target.value})}
                                    >
                                        <option value="">Select Module</option>
                                        {modules.length > 0 && modules.map((module: any) => (
                                            <option value={module.id} selected={selectedTicket?.module_id === module.id}>{module.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="form-group mb-3">
                            <label htmlFor="editTicketUserExtension">User Extension</label>
                            <Select 
                              //   className="form-control"
                                id="editTicketUserExtension" 
                                value={selectedTicket?.user_extension ? { 
                                    value: selectedTicket.user_extension, 
                                    label: extensions.find((ext: any) => ext.id.toString() === selectedTicket.user_extension.toString())?.display_name || '' 
                                } : null}
                                onChange={(selectedOption: any) => {
                                    setSelectedTicket({...selectedTicket, user_extension: selectedOption?.value || ''});
                                }}
                                options={extensions.map((extension: any) => ({
                                    value: extension.id,
                                    label: extension.display_name
                                }))}
                                placeholder="Select User Extension"
                                isClearable
                                isSearchable
                            />
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
                    size="lg"
                >
                    <Modal.Header closeButton>
                        <Modal.Title>New Ticket</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="row">
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label htmlFor="newTicketTitle">Ticket Title</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        id="newTicketTitle"  
                                        value={newTicketTitle} 
                                        onChange={handleNewTicketTitleChange} 
                                        placeholder="Ticket Title" 
                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label htmlFor="newTicketType">Ticket Type</label>
                                    <select 
                                        className="form-control" 
                                        id="newTicketType" 
                                        value={newTicketType || ''} 
                                        onChange={(e) => setNewTicketType(e.target.value)}
                                    >
                                        <option value="">Select Type</option>
                                        <option value="bug">Bug</option>
                                        <option value="feature">Feature</option>
                                        <option value="improvement">Improvement</option>
                                        <option value="task">Task</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div className="form-group mb-3">
                            <label htmlFor="newTicketDescription">Ticket Description</label>
                            <textarea 
                                className="form-control" 
                                id="newTicketDescription" 
                                value={newTicketDescription} 
                                onChange={handleNewTicketDescriptionChange} 
                                placeholder="Ticket Description"
                                rows={4}
                            ></textarea>
                        </div>

                        <div className="row">
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label htmlFor="newTicketStatus">Status</label>
                                    <select 
                                        className="form-control" 
                                        id="newTicketStatus" 
                                        value={newTicketStatus || ''} 
                                        onChange={(e) => setNewTicketStatus(e.target.value)}
                                    >
                                        <option value="">Select Status</option>
                                        {statuses.map((status: any) => (
                                            <option key={status.id} value={status.id}>{status.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label htmlFor="newTicketModule">Module</label>
                                    <select 
                                        className="form-control" 
                                        id="newTicketModule" 
                                        value={newTicketModule || ''} 
                                        onChange={(e) => setNewTicketModule(e.target.value)}
                                    >
                                        <option value="">Select Module</option>
                                        {modules.length > 0 && modules.map((module: any) => (
                                            <option key={module.id} value={module.id}>{module.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="form-group mb-3">
                            <label htmlFor="newTicketUserExtension">User Extension</label>
                            <Select 
                              //   className="form-control"
                                id="newTicketUserExtension" 
                                value={newTicketUserExtension ? { value: newTicketUserExtension, label: newTicketUserExtensionName } : null}
                                onChange={(selectedOption: any) => {
                                    setNewTicketUserExtension(selectedOption?.value || '');
                                    setNewTicketUserExtensionName(selectedOption?.label || '');
                                }}
                                options={extensions.map((extension: any) => ({
                                    value: extension.id,
                                    label: extension.display_name
                                }))}
                                placeholder="Select User Extension"
                                isClearable
                                isSearchable
                            />
                        </div>

                        <div className="form-group mb-3">
                            <label htmlFor="newTicketImage">Ticket Image</label>
                            <input 
                                type="file" 
                                className="form-control" 
                                id="newTicketImage" 
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    console.log('File input onChange triggered');
                                    console.log('Selected file:', file);
                                    console.log('File type:', file?.type);
                                    console.log('File size:', file?.size);
                                    setNewTicketImage(file || null);
                                    console.log('newTicketImage state updated to:', file || null);
                                }} 
                            />
                            <small className="text-muted">Supported formats: JPG, PNG, GIF. Max size: 5MB</small>
                            {newTicketImage && (
                                <div className="mt-2">
                                    <small className="text-success">Selected: {newTicketImage.name} ({(newTicketImage.size / 1024 / 1024).toFixed(2)} MB)</small>
                                </div>
                            )}
                            <div className="mt-2">
                                <small className="text-info">Current image state: {newTicketImage ? `File: ${newTicketImage.name}` : 'No image selected'}</small>
                            </div>
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
                                            {/* {viewTicketData?.user_extension} */}
                                            {extensions.find((extension: any) => extension.id === viewTicketData?.user_extension)?.display_name || viewTicketData?.user_extension}
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
