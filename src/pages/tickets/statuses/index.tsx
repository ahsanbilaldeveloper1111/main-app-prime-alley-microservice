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

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import FormModal from "../../partial/FormModal";
import ConfirmModal from "@pages/partial/ConfirmModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import DatatableActionButton from "@components/DatatableActionButton";
import { FiEdit, FiPlus, FiTrash2 } from "react-icons/fi";
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';


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
                
                <DatatableActionButton
                    actions={[
                        ...(session?.user?.permissions?.includes('edit-ticket-status-tickets') ? [{
                            label: 'Edit',
                            icon: <FiEdit />,
                            onClick: () => handleEditStatus(props),
                            className: 'gap-2'
                        }] : []),
                        ...(session?.user?.permissions?.includes('delete-ticket-status-tickets') ? [{
                            label: props?.tickets_count > 0 ? 'Delete (In Use)' : 'Delete',
                            icon: <FiTrash2 />,
                            onClick: () => props?.tickets_count > 0 ? null : handleDeleteStatus(props),
                            className: props?.tickets_count > 0 ? 'text-muted gap-2' : 'text-danger gap-2'
                        }] : [])
                    ]}
                />
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

    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="Tickets" mainLink="/tickets/statuses" subTitle="Ticket Status" />
            <PageHeader
                title="Ticket Statuses"
                showSearch={true}
                searchPlaceholder="Search statuses..."
                searchValue={currentFilters.search || ""}
                onSearchChange={(value) => handleFiltersChange({...currentFilters, search: value})}
                buttons={
                    <>
                    {session?.user?.permissions?.includes('create-ticket-status-tickets') && (
                    <Button variant="primary" size="sm" onClick={openCreateStatusModal}>
                        <FiPlus className="me-2" />
                        New Status
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
                 search={false}
                 tableStyle="table-style-2"
             />
            )}

            <FormModal
                show={showEditStatusModal}
                onHide={closeEditStatusModal}
                title="Edit Status"
                desc="Update the status details below"
                formHtml={
                    <>
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
                    </>
                }
                submitButtonText="Save changes"
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
                confirmButtonText="Delete"
                cancelButtonText="Cancel"
                onConfirm={handleSubmitDeleteStatus}
                onCancel={closeDeleteStatusModal}
                confirmButtonVariant="danger"
                cancelButtonVariant="secondary"
            />

            <FormModal
                show={showCreateStatusModal}
                onHide={closeCreateStatusModal}
                title="New Status"
                desc="Fill in the details below to create a new status"
                formHtml={
                    <>
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
                    </>
                }
                submitButtonText="Create"
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
