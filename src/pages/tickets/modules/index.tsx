import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useCallback, useMemo } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { ListModules,CreateModule,UpdateModule,DeleteModule } from '@utils/ticket-module';
import { Column } from '@components/CustomDataTable';
import { Button, Modal, Row } from 'react-bootstrap';
import { Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useTokenService } from 'src/hooks/useTokenService';
import { useSession } from 'next-auth/react';
import moment from 'moment';

const TicketModules = () => {
    const { data:session, status } = useSession();
   
    const columns: Column[] = useMemo(() => [
        { key: 'name', name: 'Name', selector: (row: any) => row.name, sortable: true },
        { key: 'description', name: 'Description', selector: (row: any) => row.description, sortable: true },
        { key: 'color', name: 'Color	', selector: (row: any) => row.color, sortable: true,
            cell: (props: any) => {
                const bgColor = props.color;
                return (
                    <span className="badge" style={{ 
                        backgroundColor: bgColor,
                        color: props.color,
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        display: 'inline-block',
                        marginRight: '5px'
                    }}>
                        
                    </span>
                );
            }
         },
        // { key: 'tickets_count', name: 'Tickets Using', selector: (row: any) => row.tickets_count, sortable: true,
        //     cell: (props: any) => (
        //         <span className="badge bg-info">
        //             {props.tickets_count}
        //         </span>
        //     )
        //  },
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
    
                    {session?.user?.permissions?.includes('edit-ticket-module-tickets')  && (
                        <button 
                            className="btn btn-sm btn-outline-primary" 
                            onClick={() => handleEditModule(props)}
                        >
                            Edit
                        </button>
                    )}  

                    {/* {session?.user?.permissions?.includes('delete-ticket-module-tickets')  && props.tickets_count == 0 && ( */}
                        <button 
                            className="btn btn-sm btn-outline-danger" 
                            onClick={() => handleDeleteModule(props)}
                            //disabled={props.tickets_count > 0}
                        >
                            Delete
                        </button>
                    {/* )} */}

                    
                </div>
            ),
        },
    ], [session?.user?.permissions]);

    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [currentFilters, setCurrentFilters] = useState({});

    const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

    const fetchModules = useCallback(async (page = 1, perPage = 15, search = "") => {
        return await ListModules({ page, perPage, search, filters: memoizedFilters });
    }, [memoizedFilters]);

    const handleFiltersChange = useCallback((filters: any) => {
        //console.log('Filters changed:', filters);
        setCurrentFilters(filters);
    }, []);

    const [selectedModule, setSelectedModule] = useState<any>(null);
    const [selectedModuleName, setSelectedModuleName] = useState<any>(null);
    const [selectedModuleDescription, setSelectedModuleDescription] = useState<any>(null);
    const [selectedModuleColor, setSelectedModuleColor] = useState<any>(null);
    const [showEditModuleModal, setShowEditModuleModal] = useState<boolean>(false);

    const handleEditModule = useCallback((props: any) => {
        setSelectedModule(props.id);
        setSelectedModuleName(props.name);
        setSelectedModuleDescription(props.description);
        setSelectedModuleColor(props.color);
        setShowEditModuleModal(true);
    }, []);

    const handleSubmitEditModule = useCallback(async () => {
        //console.log('Submit edit group:', selectedGroup, selectedGroupName);
        const response = await UpdateModule(selectedModule, selectedModuleName, selectedModuleDescription, selectedModuleColor);
        if(response){
            setSelectedModule(null);
            setSelectedModuleName(null);
            setSelectedModuleDescription(null);
            setSelectedModuleColor(null);
            setShowEditModuleModal(false);
            setRefreshKey(prev => prev + 1); // Trigger refresh
        }

        
    }, [selectedModule, selectedModuleName, selectedModuleDescription, selectedModuleColor]);

    const [showDeleteModuleModal, setShowDeleteModuleModal] = useState<boolean>(false);
    const [confirmDelete, setConfirmDelete] = useState<string>("");

    const handleDeleteModule = useCallback((props: any) => {
        setSelectedModule(props.id);
        setSelectedModuleName(props.name);
        setShowDeleteModuleModal(true);
    }, []);

    const handleSubmitDeleteModule = useCallback(async () => {
        const confirmDeleteValue = confirmDelete.trim().toLowerCase();
        if(confirmDeleteValue == "delete"){
            const response = await DeleteModule(selectedModule);
            if(response){
                setSelectedModule(null);
                setSelectedModuleName(null);
                setShowDeleteModuleModal(false);
                setConfirmDelete("");
                setRefreshKey(prev => prev + 1); // Trigger refresh
            }
        }else{
            toast.error('Please type the word delete to confirm');
        }
    }, [confirmDelete, selectedModule]);

    const [showCreateModuleModal, setShowCreateModuleModal] = useState<boolean>(false);
    const [newModuleName, setNewModuleName] = useState<string>("");
    const [newModuleDescription, setNewModuleDescription] = useState<string>("");
    const [newModuleColor, setNewModuleColor] = useState<string>("");

    const handleSubmitCreateModule = useCallback(async () => {
        const response = await CreateModule(newModuleName, newModuleDescription, newModuleColor);
        if(response){
            setNewModuleName("");
            setNewModuleDescription("");
            setNewModuleColor("");
            setShowCreateModuleModal(false);
            setRefreshKey(prev => prev + 1); // Trigger refresh
        }
    }, [newModuleName, newModuleDescription, newModuleColor]);

    const openCreateModuleModal = useCallback(() => setShowCreateModuleModal(true), []);
    const closeCreateModuleModal = useCallback(() => setShowCreateModuleModal(false), []);
    const openEditModuleModal = useCallback(() => setShowEditModuleModal(true), []);
    const closeEditModuleModal = useCallback(() => setShowEditModuleModal(false), []);
    const openDeleteModuleModal = useCallback(() => setShowDeleteModuleModal(true), []);
    const closeDeleteModuleModal = useCallback(() => setShowDeleteModuleModal(false), []);

    const handleNewModuleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setNewModuleName(e.target.value), []);
    const handleNewModuleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => setNewModuleDescription(e.target.value), []);
    const handleNewModuleColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setNewModuleColor(e.target.value), []);
    const handleEditModuleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSelectedModuleName(e.target.value), []);
    const handleEditModuleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => setSelectedModuleDescription(e.target.value), []);
    const handleEditModuleColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSelectedModuleColor(e.target.value), []);
    const handleConfirmDeleteChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setConfirmDelete(e.target.value), []);

    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="Tickets" mainLink="/tickets/modules" subTitle="Ticket Modules" />
            <Row className="mb-3">
            <Col md={12}>
                <div className="page-header-title">
                <h2 className="mb-0 d-flex align-items-center">
                    Ticket Modules
                    {session?.user?.permissions?.includes('create-ticket-module-tickets') && (
                        <Button variant="outline-primary" size="sm" className="ms-3" onClick={openCreateModuleModal}>New Module</Button>
                    )}
                    
                </h2>
                </div>
            </Col>
            </Row>

            {session?.user?.permissions?.includes('ticket-modules-tickets') && (
                 <GenericListPage
                 columns={columns}
                 fetchData={fetchModules}
                 title="Modules"
                 searchPlaceholder="Search modules..."
                 defaultPageSize={15}
                 filters={memoizedFilters}
                 refreshKey={refreshKey}
             />
            )}

            {showEditModuleModal && (
                <Modal
                    show={showEditModuleModal}
                    onHide={closeEditModuleModal}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Edit Module</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="form-group mb-3">
                            <label htmlFor="editModuleName">Module Name</label>
                            <input type="text" className="form-control" id="editModuleName" value={selectedModuleName} onChange={handleEditModuleNameChange} placeholder="Module Name" />
                        </div>

                        <div className="form-group mb-3">
                            <label htmlFor="editModuleDescription">Module Description</label>
                            <textarea className="form-control" id="editModuleDescription" value={selectedModuleDescription} onChange={handleEditModuleDescriptionChange} placeholder="Module Description"></textarea>
                        </div>

                        <div className="form-group mb-3">
                            <label htmlFor="editModuleColor">Module Color</label>   
                            <div className="d-flex align-items-center gap-2">
                                <input type="color" className="form-control form-control-color" id="editModuleColorPicker" value={selectedModuleColor} onChange={handleEditModuleColorChange} style={{ width: '50px', height: '38px' }} />
                                <input type="text" className="form-control" id="editModuleColor" value={selectedModuleColor} onChange={handleEditModuleColorChange} placeholder="e.g., #FF5733 or rgb(255, 87, 51)" />
                            </div>
                        </div>


                        
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={closeEditModuleModal}>Close</Button>
                        <Button variant="primary" onClick={() => handleSubmitEditModule()}>Save changes</Button>
                    </Modal.Footer>
                </Modal>
            )}

            {showDeleteModuleModal && (
                <Modal
                    show={showDeleteModuleModal}
                    onHide={closeDeleteModuleModal}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Delete Module?</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p>
                            Are you sure you want to delete this <b className="text-danger">{selectedModuleName}</b> module?
                        </p>
                        <p>
                            Type the word <b className="text-danger">delete</b> to confirm
                        </p>
                        <input type="text" className="form-control" id="confirmDelete" value={confirmDelete} onChange={handleConfirmDeleteChange} placeholder="Type the word delete to confirm" />

                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={closeDeleteModuleModal}>Close</Button>
                        <Button variant="danger" onClick={() => handleSubmitDeleteModule()}>Delete</Button>
                    </Modal.Footer>
                    
                </Modal>
            )}

            {showCreateModuleModal && (
                <Modal
                    show={showCreateModuleModal}
                    onHide={closeCreateModuleModal}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>New Module</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        
                        <div className="form-group mb-3">
                            <label htmlFor="newModuleName">Module Name</label>
                            <input type="text" className="form-control" id="newModuleName"  value={newModuleName} onChange={handleNewModuleNameChange} placeholder="Module Name" />
                        </div>

                        <div className="form-group mb-3">
                            <label htmlFor="newModuleDescription">Module Description</label>
                            <textarea className="form-control" id="newModuleDescription" value={newModuleDescription} onChange={handleNewModuleDescriptionChange} placeholder="Module Description"></textarea>
                        </div>

                        <div className="form-group mb-3">
                            <label htmlFor="newModuleColor">Module Color</label>
                            <div className="d-flex align-items-center gap-2">
                                <input 
                                    type="color" 
                                    className="form-control form-control-color" 
                                    id="colorPicker"
                                    value={newModuleColor || "#000000"}
                                    onChange={handleNewModuleColorChange}
                                    style={{ width: '50px', height: '38px' }}
                                />
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    id="newModuleColor" 
                                    value={newModuleColor} 
                                    onChange={handleNewModuleColorChange} 
                                    placeholder="e.g., #FF5733 or rgb(255, 87, 51)"
                                />
                            </div>
                        </div>


                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={closeCreateModuleModal}>Close</Button>
                        <Button variant="primary" onClick={() => handleSubmitCreateModule()}>Create</Button>
                    </Modal.Footer>
                </Modal>
            )}
        
        </React.Fragment>
    );
};

TicketModules.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default TicketModules;
