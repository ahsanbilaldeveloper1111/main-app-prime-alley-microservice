import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useCallback, useMemo } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { ListStatuses,CreateStatus,UpdateStatus,DeleteStatus } from '@utils/ticket-statuses';
import { Column } from '@components/CustomDataTable';
import { Badge, Button, Card, Form, Modal, Row } from 'react-bootstrap';
import { Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useTokenService } from 'src/hooks/useTokenService';
import { useSession } from 'next-auth/react';
import moment from 'moment';

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import FormModal from "../../partial/FormModal";
import ConfirmModal from "@pages/partial/ConfirmModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import DatatableActionButton from "@components/DatatableActionButton";
import { FiEdit, FiPlus, FiTrash2 } from "react-icons/fi";
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import { CheckCircle, Tag, X, Edit, Trash2, Circle, Info, Eye } from 'lucide-react';
import { GlobalDateTimeFormat } from '@utils/Helper';


const TicketStatuses = () => {
    const { data:session, status } = useSession();
   
    const columns: Column[] = useMemo(() => [
        { key: 'name', name: 'Status Name', selector: (row: any) => row.name, sortable: true, cell: (props: any) => (
            <div className="font-weight-500">
                <span className="rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: props.color, flexShrink: 0,display: 'inline-block'}}></span>
                <span className="ms-2">{props.name}</span>
            </div>
        ) },

      { key: 'color', name: 'Color', selector: (row: any) => row.color, sortable: true,
            cell: (props: any) => (
                <div className="d-flex align-items-center gap-2">
                <span className="text-muted" style={{ backgroundColor: props.color, width: '24px', height: '24px', borderRadius: '8px',display: 'inline-block'}}></span>
                    <code style={{ fontSize: '0.813rem', color: props.color, backgroundColor: '#f8f9fa', padding: '0.25rem 0.5rem', borderRadius: '4px'}}>{props.color}</code>
                </div>
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
                    {moment(props.created_at).format(GlobalDateTimeFormat)}
                </span>
            )
         },
        {
            key: 'Action',
            name: 'Actions',
            selector: (row: any) => row.id,
            sortable: false,
            cell: (props: any) => (
                
                // <DatatableActionButton
                //     actions={[
                //         ...(session?.user?.permissions?.includes('edit-ticket-status-tickets') ? [{
                //             label: 'Edit',
                //             icon: <FiEdit />,
                //             onClick: () => handleEditStatus(props),
                //             className: 'gap-2'
                //         }] : []),
                //         ...(session?.user?.permissions?.includes('delete-ticket-status-tickets') ? [{
                //             label: props?.tickets_count > 0 ? 'Delete (In Use)' : 'Delete',
                //             icon: <FiTrash2 />,
                //             onClick: () => props?.tickets_count > 0 ? null : handleDeleteStatus(props),
                //             className: props?.tickets_count > 0 ? 'text-muted gap-2' : 'text-danger gap-2'
                //         }] : [])
                //     ]}
                // />
                <div className="d-flex gap-2">
                    {session?.user?.permissions?.includes('edit-ticket-status-tickets') && (
                       <Button variant="light" size="sm" className="btn-action-style-2 p-1 text-primary" title="Edit">
                       <Edit size={16}  onClick={() => handleEditStatus(props)} />
                     </Button>
                    )}
                    {session?.user?.permissions?.includes('delete-ticket-status-tickets') && (
                        <Button variant="light" size="sm" className="btn-action-style-2 p-1 text-danger gap-2" title="Delete">
                            <Trash2 size={16}  onClick={() => handleDeleteStatus(props)} />
                        </Button>
                    )}
                </div>
            ),
        },
    ], [session?.user?.permissions]);

    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [currentFilters, setCurrentFilters] = useState({search: ""});

    const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

    const fetchStatuses = useCallback(async (page = 1, perPage = 15, search = "") => {
        const response = await ListStatuses({ page, perPage, search:currentFilters.search || search, filters: memoizedFilters });
        console.log('Response:', response);
        return response;
    }, [memoizedFilters, currentFilters]);

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

    const handleDeleteStatus = useCallback((props: any) => {
        setSelectedStatus(props.id);
        setSelectedStatusName(props.name);
        setShowDeleteStatusModal(true);
    }, []);

    const handleSubmitDeleteStatus  = useCallback(async () => {
        const response = await DeleteStatus(selectedStatus);
            if(response){
                setSelectedStatus(null);
                setSelectedStatusName(null);
                setShowDeleteStatusModal(false);
                setRefreshKey(prev => prev + 1); // Trigger refresh
            }
    }, [selectedStatus]);

    const [showCreateStatusModal, setShowCreateStatusModal] = useState<boolean>(false);
    const [newStatusName, setNewStatusName] = useState<string>("");
    const [newStatusColor, setNewStatusColor] = useState<string>("#0d6efd");

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

    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="Tickets" mainLink="/tickets/statuses" subTitle="Ticket Status" />
            <PageHeader
                title=""
                description=""
                showSearch={false}
                searchPlaceholder="Search statuses..."
                searchValue={currentFilters.search || ""}
                onSearchChange={(value) => handleFiltersChange({...currentFilters, search: value})}
                buttons={
                    <>
                    {session?.user?.permissions?.includes('create-ticket-status-tickets') && (
                    <Button variant="primary"  onClick={openCreateStatusModal}>
                        <FiPlus className="me-2" />
                        Add Status
                    </Button>
                    )}
                    </>
                    
                }
            />

          
           

            {session?.user?.permissions?.includes('ticket-statuses-tickets') && (
                 <GenericListPage
                 columns={columns}
                 fetchData={fetchStatuses}
                 title="Status"
                 searchPlaceholder="Search statuses..."
                 defaultPageSize={15}
                 filters={memoizedFilters}
                 refreshKey={refreshKey}
                 search={true}
                 tableStyle="table-style-2"
             />
            )}

            <FormModal
                show={showEditStatusModal}
                onHide={closeEditStatusModal}
                title="Edit Status"
                titleIcon={<Tag size={20} className="text-primary" />}
                desc="Update the status details below"
                formHtml={
                    <>
                        <div className="form-group mb-3">
                            <label htmlFor="editStatusName" className="fw-semibold d-flex align-items-center gap-2 form-label">Status Name <span className="text-danger">*</span>
                            <span 
                                className="text-muted" 
                                title="Enter a clear name that represents the ticket state"
                                style={{ cursor: 'help' }}
                            >
                                <Info size={14} />
                            </span>
                            </label>
                            <input type="text" className="form-control" id="editStatusName" value={selectedStatusName} onChange={handleEditStatusNameChange} placeholder="Status Name" />
                        </div>

                        <div className="form-group mb-3">
                            <label htmlFor="editStatusColor" className="fw-semibold d-flex align-items-center gap-2 form-label">Status Color <span className="text-danger">*</span>
                            <span 
                                className="text-muted" 
                                title="Select a color that visually represents this status"
                                style={{ cursor: 'help' }}
                            >
                                <Info size={14} />
                            </span>
                            </label>
                            <div className="d-flex align-items-center gap-2">
                                <input type="color" className="form-control form-control-color" id="editStatusColorPicker" value={selectedStatusColor} onChange={handleEditStatusColorChange} style={{ width: '50px', height: '38px' }} />
                                <input type="text" className="form-control" id="editStatusColor" value={selectedStatusColor} onChange={handleEditStatusColorChange} placeholder="e.g., #FF5733 or rgb(255, 87, 51)" />
                            </div>
                            <Form.Text className="text-muted d-flex align-items-center gap-1 mt-2">
                            <Info size={12} />
                            <span style={{ fontSize: '0.813rem' }}>
                                Choose colors that align with status meaning (e.g., green for completed, yellow for pending, red for critical).
                            </span>
                            </Form.Text>

                            {/* Color Suggestions */}
                            <div className="mt-3">
                            <small className="text-muted fw-semibold d-block mb-2">Suggested Colors:</small>
                            <div className="d-flex gap-2 flex-wrap">
                                {[
                                { name: 'Blue', color: '#0d6efd', label: 'Open/New' },
                                { name: 'Yellow', color: '#ffc107', label: 'Pending' },
                                { name: 'Orange', color: '#fd7e14', label: 'In Progress' },
                                { name: 'Green', color: '#198754', label: 'Resolved' },
                                { name: 'Gray', color: '#6c757d', label: 'Closed' },
                                { name: 'Red', color: '#dc3545', label: 'Blocked' },
                                ].map((suggestion) => (
                                <Button
                                    key={suggestion.color}
                                    variant="outline-secondary"
                                    size="sm"
                                    className="d-flex align-items-center gap-2"
                                    onClick={() => setSelectedStatusColor(suggestion.color)}
                                    style={{ padding: '0.25rem 0.75rem' }}
                                >
                                    <div 
                                    style={{ 
                                        width: '16px', 
                                        height: '16px', 
                                        backgroundColor: suggestion.color,
                                        borderRadius: '3px',
                                        border: '1px solid #dee2e6'
                                    }}
                                    />
                                    <small>{suggestion.label}</small>
                                </Button>
                                ))}
                            </div>
                            </div>
                        </div>

                        {/* Preview */}
                        <Form.Group>
                            <Form.Label className="fw-semibold mb-3 d-flex align-items-center gap-2">
                            <Eye size={16} />
                            Status Preview
                            </Form.Label>
                            <Card className="border-0 bg-light">
                            <Card.Body className="p-3">
                                <div className="d-flex flex-column gap-3">
                                    {/* Badge Preview */}
                                    <div>
                                        <small className="text-muted d-block mb-2">As Badge:</small>
                                        <div 
                                        style={{ 
                                            backgroundColor: selectedStatusColor,
                                            padding: '0.3rem 1rem',
                                            fontSize: '0.9rem',
                                            borderRadius: '3px',
                                            border: `1px solid ${selectedStatusColor}`,
                                            color: 'white',
                                            gap: '0.2rem',
                                            display:'inline-block',
                                        }}
                                        >
                                        <Tag size={14} className="me-2" />
                                        {selectedStatusName || 'Status Name'}
                                        </div>
                                    </div>
                                    
                                    {/* Pill Preview */}
                                    <div>
                                        <small className="text-muted d-block mb-2">As Status Indicator:</small>
                                        <div className="d-flex align-items-center gap-2 p-2 bg-white rounded border">
                                        <div 
                                            className="rounded-circle"
                                            style={{ 
                                            width: '12px', 
                                            height: '12px', 
                                            backgroundColor: selectedStatusColor 
                                            }}
                                        />
                                        <span className="fw-semibold" style={{ fontSize: '0.875rem' }}>
                                            {selectedStatusName || 'Status Name'}
                                        </span>
                                        </div>
                                    </div>
                                    </div>
                                </Card.Body>
                                </Card>
                                <Form.Text className="text-muted d-block mt-2" style={{ fontSize: '0.813rem' }}>
                                <Info size={12} className="me-1" />
                                This is how your status will appear in tickets, dashboards, and reports
                                </Form.Text>
                            </Form.Group>
                        </>
                }
                submitButtonText="Update Status"
                isSubmitDisabled={!selectedStatusName}
                cancelButtonText="Cancel"
                onSubmit={handleSubmitEditStatus}
                onCancel={closeEditStatusModal}
                submitButtonVariant="primary"
                cancelButtonVariant="secondary"
            />

            <ConfirmModal
                show={showDeleteStatusModal}
                onHide={closeDeleteStatusModal}
                title="Delete Status?"
                description="Are you sure you want to delete status {targetName}? This action cannot be undone."
                targetName={selectedStatusName || ""}
                confirmButtonText="Delete Status"
                cancelButtonText="Cancel"
                onConfirm={handleSubmitDeleteStatus}
                onCancel={closeDeleteStatusModal}
                confirmButtonVariant="danger"
                cancelButtonVariant="secondary"
            />


            <FormModal
                show={showCreateStatusModal}
                onHide={closeCreateStatusModal}
                title="Create New Status"
                titleIcon={<Tag size={20} className="text-primary" />}
                desc="Fill in the details below to create a new status"
                formHtml={
                    <>
                        <div className="form-group mb-3">
                            <label htmlFor="newStatusName" className="fw-semibold d-flex align-items-center gap-2 form-label">Status Name <span className="text-danger">*</span>
                            <span 
                                className="text-muted" 
                                title="Enter a clear name that represents the ticket state"
                                style={{ cursor: 'help' }}
                            >
                                <Info size={14} />
                            </span>

                            </label>
                            <input type="text" className="form-control" id="newStatusName" placeholder="e.g., Open, In Progress, Resolved, Pending Review, etc." value={newStatusName} onChange={handleNewStatusNameChange} />

                            <Form.Text className="text-muted d-flex align-items-center gap-1 mt-2">
                            <Info size={12} />
                            <span style={{ fontSize: '0.813rem' }}>
                                Use descriptive names that clearly indicate the current state of a ticket in your workflow.
                            </span>
                            </Form.Text>
                        </div>

                        <div className="form-group mb-3">
                        <label className="fw-semibold d-flex align-items-center gap-2 form-label">Status Color 
                            <span className="text-danger">*</span>
                            <span className="text-muted" title="Select a color that visually represents this status" style={{ cursor: 'help' }}><Info size={14} /></span></label>
                            <div className="d-flex align-items-center gap-2">
                                <input 
                                    type="color" 
                                    className="form-control form-control-color" 
                                    id="colorPicker"
                                    value={newStatusColor}
                                    onChange={handleNewStatusColorChange}
                                    style={{ width: '60px', height: '48px' }}
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
                            <Form.Text className="text-muted d-block mt-2" style={{ fontSize: '0.813rem' }}>
                            <Info size={12} className="me-1" />
                            Choose colors that align with status meaning (e.g., green for completed, yellow for pending, red for critical).
                            </Form.Text>

                            {/* Color Suggestions */}
                            <div className="mt-3">
                            <small className="text-muted fw-semibold d-block mb-2">Suggested Colors:</small>
                            <div className="d-flex gap-2 flex-wrap">
                                {[
                                { name: 'Blue', color: '#0d6efd', label: 'Open/New' },
                                { name: 'Yellow', color: '#ffc107', label: 'Pending' },
                                { name: 'Orange', color: '#fd7e14', label: 'In Progress' },
                                { name: 'Green', color: '#198754', label: 'Resolved' },
                                { name: 'Gray', color: '#6c757d', label: 'Closed' },
                                { name: 'Red', color: '#dc3545', label: 'Blocked' },
                                ].map((suggestion) => (
                                <Button
                                    key={suggestion.color}
                                    variant="outline-secondary"
                                    size="sm"
                                    className="d-flex align-items-center gap-2"
                                    onClick={() => setNewStatusColor(suggestion.color)}
                                    style={{ padding: '0.25rem 0.75rem' }}
                                >
                                    <div 
                                    style={{ 
                                        width: '16px', 
                                        height: '16px', 
                                        backgroundColor: suggestion.color,
                                        borderRadius: '3px',
                                        border: '1px solid #dee2e6'
                                    }}
                                    />
                                    <small>{suggestion.label}</small>
                                </Button>
                                ))}
                            </div>
                            </div>
                        </div>

                        {/* Preview */}
                        <Form.Group>
                            <Form.Label className="fw-semibold mb-3 d-flex align-items-center gap-2">
                            <Eye size={16} />
                            Status Preview
                            </Form.Label>
                            <Card className="border-0 bg-light">
                            <Card.Body className="p-3">
                                <div className="d-flex flex-column gap-3">
                                {/* Badge Preview */}
                                <div>
                                    <small className="text-muted d-block mb-2">As Badge:</small>
                                    <div 
                                    style={{ 
                                       backgroundColor: newStatusColor,
                                       padding: '0.3rem 1rem',
                                       fontSize: '0.9rem',
                                       borderRadius: '3px',
                                       border: `1px solid ${newStatusColor}`,
                                       color: 'white',
                                       gap: '0.2rem',

                                       display:'inline-block',
                                    }}
                                    >
                                    <Tag size={14} className="me-2" />
                                    {newStatusName || 'Status Name'}
                                    </div>
                                </div>
                                
                                {/* Pill Preview */}
                                <div>
                                    <small className="text-muted d-block mb-2">As Status Indicator:</small>
                                    <div className="d-flex align-items-center gap-2 p-2 bg-white rounded border">
                                    <div 
                                        className="rounded-circle"
                                        style={{ 
                                        width: '12px', 
                                        height: '12px', 
                                        backgroundColor: newStatusColor 
                                        }}
                                    />
                                    <span className="fw-semibold" style={{ fontSize: '0.875rem' }}>
                                        {newStatusName || 'Status Name'}
                                    </span>
                                    </div>
                                </div>
                                </div>
                            </Card.Body>
                            </Card>
                            <Form.Text className="text-muted d-block mt-2" style={{ fontSize: '0.813rem' }}>
                            <Info size={12} className="me-1" />
                            This is how your status will appear in tickets, dashboards, and reports
                            </Form.Text>
                        </Form.Group>
                    </>
                }
                submitButtonText="Create Status"
                isSubmitDisabled={!newStatusName.trim() || !newStatusColor.trim()}
                cancelButtonText="Cancel"
                onSubmit={handleSubmitCreateStatus}
                onCancel={closeCreateStatusModal}
                submitButtonVariant="primary"
                cancelButtonVariant="secondary"
            />
        
        </React.Fragment>
    );
};

TicketStatuses.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default TicketStatuses;