import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useCallback, useMemo, useEffect } from 'react';
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
import { GetHierarchyData } from '@utils/users';
import Select from 'react-select';
import { ListSubmodules, DeleteSubmodule } from '@utils/ticket-module';

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import FormModal from "../../partial/FormModal";
import ConfirmModal from "@pages/partial/ConfirmModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import DatatableActionButton from "@components/DatatableActionButton";
import { FiEdit, FiTrash2, FiEye,FiPlus } from "react-icons/fi";




const TicketModules = () => {
    const { data:session, status } = useSession();
    const [extensions, setExtensions] = useState<any>([]);
   
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
        { key: 'user_extension', name: 'User Extension', selector: (row: any) => row.user_extension, sortable: true,
            cell: (props: any) => (
                <span className="status-badge primary">
                    {extensions.find(
                        (extension: any) =>
                            extension.id.toString() === props.user_extension?.toString()
                    )?.display_name || props.user_extension || 'Not assigned'}
                </span>
            )
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
                <DatatableActionButton
                    actions={[
                        ...(session?.user?.permissions?.includes('edit-ticket-module-tickets') ? [{
                            label: 'Edit',
                            icon: <FiEdit />,
                            onClick: () => handleEditModule(props),
                            className: 'gap-2'
                        }] : []),
                        {
                            label: 'Manage Submodules',
                            icon: <FiEye />,
                            onClick: () => openSubmoduleModal(props),
                            className: 'gap-2'
                        },
                        ...(session?.user?.permissions?.includes('delete-ticket-module-tickets') ? [{
                            label: props?.tickets_count > 0 ? 'Delete (In Use)' : 'Delete',
                            icon: <FiTrash2 />,
                            onClick: () => props?.tickets_count > 0 ? null : handleDeleteModule(props),
                            className: props?.tickets_count > 0 ? 'text-muted gap-2' : 'text-danger gap-2'
                        }] : [])
                    ]}
                />
            ),
        },
    ], [session?.user?.permissions, extensions]);

    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [currentFilters, setCurrentFilters] = useState({
        search: ""
    });

    // Extension-related states
    const [hierarchyData, setHierarchyData] = useState<any>([]);

    const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

    // Fetch extensions data
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

    const fetchModules = useCallback(async (page = 1, perPage = 15, search = "") => {
        return await ListModules({ page, perPage, search:currentFilters.search || search, filters: memoizedFilters });
    }, [memoizedFilters]);

    const handleFiltersChange = useCallback((filters: any) => {
        //console.log('Filters changed:', filters);
        setCurrentFilters(filters);
    }, [currentFilters]);

    const [selectedModule, setSelectedModule] = useState<any>(null);
    const [selectedModuleName, setSelectedModuleName] = useState<any>(null);
    const [selectedModuleDescription, setSelectedModuleDescription] = useState<any>(null);
    const [selectedModuleColor, setSelectedModuleColor] = useState<any>(null);
    const [selectedModuleUserExtension, setSelectedModuleUserExtension] = useState<any>(null);
    const [showEditModuleModal, setShowEditModuleModal] = useState<boolean>(false);

    const handleEditModule = useCallback((props: any) => {
        setSelectedModule(props.id);
        setSelectedModuleName(props.name);
        setSelectedModuleDescription(props.description);
        setSelectedModuleColor(props.color);
        setSelectedModuleUserExtension(props.user_extension || null);
        setShowEditModuleModal(true);
    }, []);

    const handleSubmitEditModule = useCallback(async () => {
        //console.log('Submit edit group:', selectedGroup, selectedGroupName);
        const response = await UpdateModule(selectedModule, selectedModuleName, selectedModuleDescription, selectedModuleColor, selectedModuleUserExtension);
        if(response){
            setSelectedModule(null);
            setSelectedModuleName(null);
            setSelectedModuleDescription(null);
            setSelectedModuleColor(null);
            setSelectedModuleUserExtension(null);
            setShowEditModuleModal(false);
            setRefreshKey(prev => prev + 1); // Trigger refresh
        }

        
    }, [selectedModule, selectedModuleName, selectedModuleDescription, selectedModuleColor, selectedModuleUserExtension]);

    const [showDeleteModuleModal, setShowDeleteModuleModal] = useState<boolean>(false);

    const handleDeleteModule = useCallback((props: any) => {
        setSelectedModule(props.id);
        setSelectedModuleName(props.name);
        setShowDeleteModuleModal(true);
    }, []);

    const handleSubmitDeleteModule = useCallback(async () => {
        const response = await DeleteModule(selectedModule);
            if(response){
                setSelectedModule(null);
                setSelectedModuleName(null);
                setShowDeleteModuleModal(false);
                setRefreshKey(prev => prev + 1); // Trigger refresh
            }
    }, [selectedModule]);

    const [showCreateModuleModal, setShowCreateModuleModal] = useState<boolean>(false);
    const [newModuleName, setNewModuleName] = useState<string>("");
    const [newModuleDescription, setNewModuleDescription] = useState<string>("");
    const [newModuleColor, setNewModuleColor] = useState<string>("");
    const [newModuleUserExtension, setNewModuleUserExtension] = useState<any>(null);

    const handleSubmitCreateModule = useCallback(async () => {
        const response = await CreateModule(newModuleName, newModuleDescription, newModuleColor, newModuleUserExtension);
        if(response){
            setNewModuleName("");
            setNewModuleDescription("");
            setNewModuleColor("");
            setNewModuleUserExtension(null);
            setShowCreateModuleModal(false);
            setRefreshKey(prev => prev + 1); // Trigger refresh
        }
    }, [newModuleName, newModuleDescription, newModuleColor, newModuleUserExtension]);

    const openCreateModuleModal = useCallback(() => setShowCreateModuleModal(true), []);
    const closeCreateModuleModal = useCallback(() => {
        setShowCreateModuleModal(false);
        setNewModuleName("");
        setNewModuleDescription("");
        setNewModuleColor("");
        setNewModuleUserExtension(null);
    }, []);
    const openEditModuleModal = useCallback(() => setShowEditModuleModal(true), []);
    const closeEditModuleModal = useCallback(() => {
        setShowEditModuleModal(false);
        setSelectedModule(null);
        setSelectedModuleName(null);
        setSelectedModuleDescription(null);
        setSelectedModuleColor(null);
        setSelectedModuleUserExtension(null);
    }, []);
    const openDeleteModuleModal = useCallback(() => setShowDeleteModuleModal(true), []);
    const closeDeleteModuleModal = useCallback(() => setShowDeleteModuleModal(false), []);

    const handleNewModuleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setNewModuleName(e.target.value), []);
    const handleNewModuleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => setNewModuleDescription(e.target.value), []);
    const handleNewModuleColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setNewModuleColor(e.target.value), []);
    const handleEditModuleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSelectedModuleName(e.target.value), []);
    const handleEditModuleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => setSelectedModuleDescription(e.target.value), []);
    const handleEditModuleColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSelectedModuleColor(e.target.value), []);

    // Submodule management functions
    const [selectedModuleForSubmodules, setSelectedModuleForSubmodules] = useState<any>(null);
    const [showSubmoduleModal, setShowSubmoduleModal] = useState<boolean>(false);
    const [submodules, setSubmodules] = useState<any[]>([]);




    const openSubmoduleModal = useCallback((module: any) => {
        setSelectedModuleForSubmodules(module);
        setShowSubmoduleModal(true);
        fetchSubmodulesForModule(module.id);
    }, []);

    const closeSubmoduleModal = useCallback(() => {
        setShowSubmoduleModal(false);
        setSelectedModuleForSubmodules(null);
        setSubmodules([]);
    }, []);

    const fetchSubmodulesForModule = useCallback(async (moduleId: string) => {
        try {
            const response = await ListSubmodules({ filters: { module_id: moduleId } });
            if (response?.data) {
                setSubmodules(response.data);
            }
        } catch (error) {
            console.error('Error fetching submodules:', error);
        }
    }, []);







    const handleDeleteSubmodule = useCallback(async (submodule: any) => {
        if (window.confirm(`Are you sure you want to delete submodule "${submodule.name}"?`)) {
            const response = await DeleteSubmodule(submodule.id);
            if (response) {
                fetchSubmodulesForModule(selectedModuleForSubmodules.id);
            }
        }
    }, [selectedModuleForSubmodules]);



    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="Tickets" mainLink="/tickets/modules" subTitle="Ticket Modules" />

            <PageHeader
                title="Ticket Modules"
                showSearch={true}
                searchPlaceholder="Search modules..."
                searchValue={currentFilters.search || ""}
                onSearchChange={(value) => handleFiltersChange({...currentFilters, search: value})}
                buttons={
                    <>
                        <Button variant="info"  onClick={() => window.location.href = '/tickets/modules/submodules'}>Manage Submodules</Button>
                        {session?.user?.permissions?.includes('create-ticket-module-tickets') && (
                            <Button variant="primary" onClick={openCreateModuleModal}>New Module</Button>
                        )}
                    </>
                }
            />

            {session?.user?.permissions?.includes('ticket-modules-tickets') && (
                 <GenericListPage
                 columns={columns}
                 fetchData={fetchModules}
                 title="Modules"
                 searchPlaceholder="Search modules..."
                 defaultPageSize={15}
                 filters={memoizedFilters}
                 refreshKey={refreshKey}
                 search={false}
                 tableStyle="table-style-2"
             />
            )}

            <FormModal
                show={showEditModuleModal}
                onHide={closeEditModuleModal}
                title="Edit Module"
                desc="Update the module details below"
                formHtml={
                    <>
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

                        <div className="form-group mb-3">
                            <label htmlFor="editModuleUserExtension">User Extension (Optional)</label>
                            <Select
                                id="editModuleUserExtension"
                                value={
                                    selectedModuleUserExtension
                                        ? {
                                            value: selectedModuleUserExtension,
                                            label: extensions.find(
                                                (ext: any) =>
                                                    ext.id.toString() === selectedModuleUserExtension?.toString()
                                            )?.display_name || "",
                                        }
                                        : null
                                }
                                onChange={(selectedOption: any) => {
                                    setSelectedModuleUserExtension(selectedOption?.value || null);
                                }}
                                options={extensions.map((extension: any) => ({
                                    value: extension.id,
                                    label: extension.display_name,
                                }))}
                                placeholder="Select User Extension (Optional)"
                                isClearable
                                isSearchable
                            />
                        </div>
                    </>
                }
                submitButtonText="Save changes"
                cancelButtonText="Cancel"
                onSubmit={handleSubmitEditModule}
                onCancel={closeEditModuleModal}
                submitButtonVariant="primary"
                cancelButtonVariant="secondary"
            />

            <ConfirmModal
                show={showDeleteModuleModal}
                onHide={closeDeleteModuleModal}
                title="Delete Module?"
                description="Are you sure you want to delete module {targetName}? This action cannot be undone."
                targetName={selectedModuleName || ""}
                confirmButtonText="Delete"
                cancelButtonText="Cancel"
                onConfirm={handleSubmitDeleteModule}
                onCancel={closeDeleteModuleModal}
                confirmButtonVariant="danger"
                cancelButtonVariant="secondary"
            />

            <FormModal
                show={showCreateModuleModal}
                onHide={closeCreateModuleModal}
                title="New Module"
                desc="Fill in the details below to create a new module"
                formHtml={
                    <>
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

                        <div className="form-group mb-3">
                            <label htmlFor="newModuleUserExtension">User Extension (Optional)</label>
                            <Select
                                id="newModuleUserExtension"
                                value={newModuleUserExtension}
                                onChange={(selectedOption: any) => {
                                    setNewModuleUserExtension(selectedOption?.value || null);
                                }}
                                options={extensions.map((extension: any) => ({
                                    value: extension.id,
                                    label: extension.display_name,
                                }))}
                                placeholder="Select User Extension (Optional)"
                                isClearable
                                isSearchable
                            />
                        </div>
                    </>
                }
                submitButtonText="Create"
                cancelButtonText="Cancel"
                onSubmit={handleSubmitCreateModule}
                onCancel={closeCreateModuleModal}
                submitButtonVariant="primary"
                cancelButtonVariant="secondary"
            />

            {/* Submodule Management Modal */}
            <FormModal
                show={showSubmoduleModal}
                onHide={closeSubmoduleModal}
                title={`Module Submodules - ${selectedModuleForSubmodules?.name || ''}`}
                desc="Manage submodules for this module"
                formHtml={
                    <>
                        <div className="text-center mb-4">
                            <h5>Submodule Management</h5>
                            <p className="text-muted">
                                This module has {submodules.length} submodule{submodules.length !== 1 ? 's' : ''}.
                            </p>
                            <Button 
                                variant="outline-info" 
                                onClick={() => {
                                    closeSubmoduleModal();
                                    window.location.href = '/tickets/modules/submodules';
                                }}
                            >
                                Go to Submodules Management Page
                            </Button>
                        </div>
                        
                        {submodules.length > 0 && (
                            <div>
                                <h6>Current Submodules:</h6>
                                <div className="submodules-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {submodules.map((submodule: any) => (
                                        <div key={submodule.id} className="card mb-2">
                                            <div className="card-body p-2">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <h6 className="mb-1">{submodule.name}</h6>
                                                        <p className="mb-1 text-muted small">{submodule.description || 'No description'}</p>
                                                    </div>
                                                    <div>
                                                        <Button 
                                                            variant="outline-danger" 
                                                            size="sm" 
                                                            onClick={() => handleDeleteSubmodule(submodule)}
                                                        >
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                }
                ShowSubmitButton={false}
                cancelButtonText="Close"
                onCancel={closeSubmoduleModal}
                submitButtonText="Create"
                onSubmit={handleSubmitCreateModule}
                submitButtonVariant="primary"
                cancelButtonVariant="secondary"
            />
        
        </React.Fragment>
    );
};

TicketModules.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default TicketModules;
