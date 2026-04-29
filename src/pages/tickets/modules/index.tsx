import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useCallback, useMemo, useEffect } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import {
    CreateModule,
    DeleteModule,
    DeleteSubmodule,
    ListModules,
    ListSubmodules,
    UpdateModule,
} from '@utils/ticket-module';
import { Badge, Button, Card, Col, Form, Row } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import moment from 'moment';
import { GetHierarchyData } from '@utils/users';
import Select from 'react-select';

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import FormModal from "../../partial/FormModal";
import ConfirmModal from "@pages/partial/ConfirmModal";
import { GlobalDateTimeFormat, ModuleSlug } from '@utils/Helper';
import { Package, Eye, Edit, Trash2, Info } from 'lucide-react';
import GenericTable, { TableColumn, TableAction } from '@components/GenericTable';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TicketModule {
    id: string | number;
    name: string;
    description: string;
    color: string;
    user_extension: string | null;
    created_at: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const colorSuggestions = ['#0d6efd', '#198754', '#dc3545', '#fd7e14', '#6f42c1', '#20c997'];

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

const TicketModules = () => {
    const { data: session } = useSession();
    const permissions = session?.user?.permissions;

    const [extensions, setExtensions] = useState<any[]>([]);

    // Table state
    const [data, setData] = useState<TicketModule[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [rowsPerPage, setRowsPerPage] = useState<number>(15);
    const [totalRows, setTotalRows] = useState<number>(0);
    const [searchValue, setSearchValue] = useState<string>('');

    // Edit state
    const [selectedModule, setSelectedModule] = useState<any>(null);
    const [selectedModuleName, setSelectedModuleName] = useState<any>(null);
    const [selectedModuleDescription, setSelectedModuleDescription] = useState<any>(null);
    const [selectedModuleColor, setSelectedModuleColor] = useState<any>(null);
    const [selectedModuleUserExtension, setSelectedModuleUserExtension] = useState<any>(null);
    const [showEditModuleModal, setShowEditModuleModal] = useState<boolean>(false);

    // Delete state
    const [showDeleteModuleModal, setShowDeleteModuleModal] = useState<boolean>(false);

    // Create state
    const [showCreateModuleModal, setShowCreateModuleModal] = useState<boolean>(false);
    const [newModuleName, setNewModuleName] = useState<string>('');
    const [newModuleDescription, setNewModuleDescription] = useState<string>('');
    const [newModuleColor, setNewModuleColor] = useState<string>('#0d6efd');
    const [newModuleUserExtension, setNewModuleUserExtension] = useState<any>(null);

    // Submodule state
    const [selectedModuleForSubmodules, setSelectedModuleForSubmodules] = useState<any>(null);
    const [showSubmoduleModal, setShowSubmoduleModal] = useState<boolean>(false);
    const [submodules, setSubmodules] = useState<any[]>([]);

    // ---- Extensions ----
    useEffect(() => {
        const fetchHierarchyData = async () => {
            const hierarchyData = await GetHierarchyData(ModuleSlug.TICKET);
            setExtensions(hierarchyData?.extensions || []);
        };
        fetchHierarchyData();
    }, []);

    // ---- Data Fetching ----
    const fetchModules = useCallback(async (page: number, perPage: number, search: string) => {
        setLoading(true);
        try {
            const response = await ListModules({ page, perPage, search, filters: { search } });
            if (response) {
                setData(response.data || []);
                setTotalRows(response.total || 0);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchModules(currentPage, rowsPerPage, searchValue);
    }, [fetchModules, currentPage, rowsPerPage, searchValue]);

    const triggerRefresh = useCallback(() => {
        fetchModules(currentPage, rowsPerPage, searchValue);
    }, [fetchModules, currentPage, rowsPerPage, searchValue]);

    // ---- Pagination ----
    const handlePaginationChange = useCallback((page: number, perPage: number) => {
        setCurrentPage(page);
        setRowsPerPage(perPage);
    }, []);

    // ---- Search ----
    const handleSearchChange = useCallback((value: string) => {
        setSearchValue(value);
        setCurrentPage(1);
    }, []);

    // ---- Handlers: Edit ----
    const handleEditModule = useCallback((row: TicketModule) => {
        setSelectedModule(row.id);
        setSelectedModuleName(row.name);
        setSelectedModuleDescription(row.description);
        setSelectedModuleColor(row.color);
        setSelectedModuleUserExtension(row.user_extension || null);
        setShowEditModuleModal(true);
    }, []);

    const closeEditModuleModal = useCallback(() => {
        setShowEditModuleModal(false);
        setSelectedModule(null);
        setSelectedModuleName(null);
        setSelectedModuleDescription(null);
        setSelectedModuleColor(null);
        setSelectedModuleUserExtension(null);
    }, []);

    const handleSubmitEditModule = useCallback(async () => {
        const response = await UpdateModule(selectedModule, selectedModuleName, selectedModuleDescription, selectedModuleColor, selectedModuleUserExtension);
        if (response) {
            closeEditModuleModal();
            triggerRefresh();
        }
    }, [selectedModule, selectedModuleName, selectedModuleDescription, selectedModuleColor, selectedModuleUserExtension, closeEditModuleModal, triggerRefresh]);

    // ---- Handlers: Delete ----
    const handleDeleteModule = useCallback((row: TicketModule) => {
        setSelectedModule(row.id);
        setSelectedModuleName(row.name);
        setShowDeleteModuleModal(true);
    }, []);

    const closeDeleteModuleModal = useCallback(() => setShowDeleteModuleModal(false), []);

    const handleSubmitDeleteModule = useCallback(async () => {
        const response = await DeleteModule(selectedModule);
        if (response) {
            setSelectedModule(null);
            setSelectedModuleName(null);
            setShowDeleteModuleModal(false);
            triggerRefresh();
        }
    }, [selectedModule, triggerRefresh]);

    // ---- Handlers: Create ----
    const openCreateModuleModal = useCallback(() => setShowCreateModuleModal(true), []);
    const closeCreateModuleModal = useCallback(() => {
        setShowCreateModuleModal(false);
        setNewModuleName('');
        setNewModuleDescription('');
        setNewModuleColor('#0d6efd');
        setNewModuleUserExtension(null);
    }, []);

    const handleSubmitCreateModule = useCallback(async () => {
        const response = await CreateModule(newModuleName, newModuleDescription, newModuleColor, newModuleUserExtension);
        if (response) {
            closeCreateModuleModal();
            triggerRefresh();
        }
    }, [newModuleName, newModuleDescription, newModuleColor, newModuleUserExtension, closeCreateModuleModal, triggerRefresh]);

    // ---- Handlers: Submodules ----
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

    const openSubmoduleModal = useCallback((module: any) => {
        setSelectedModuleForSubmodules(module);
        setShowSubmoduleModal(true);
        fetchSubmodulesForModule(module.id);
    }, [fetchSubmodulesForModule]);

    const closeSubmoduleModal = useCallback(() => {
        setShowSubmoduleModal(false);
        setSelectedModuleForSubmodules(null);
        setSubmodules([]);
    }, []);

    const handleDeleteSubmodule = useCallback(async (submodule: any) => {
        if (globalThis.confirm(`Are you sure you want to delete submodule "${submodule.name}"?`)) {
            const response = await DeleteSubmodule(submodule.id);
            if (response) {
                fetchSubmodulesForModule(selectedModuleForSubmodules.id);
            }
        }
    }, [selectedModuleForSubmodules, fetchSubmodulesForModule]);

    // ---- Input change handlers ----
    const handleNewModuleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setNewModuleName(e.target.value), []);
    const handleNewModuleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => setNewModuleDescription(e.target.value), []);
    const handleNewModuleColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setNewModuleColor(e.target.value), []);
    const handleEditModuleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSelectedModuleName(e.target.value), []);
    const handleEditModuleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => setSelectedModuleDescription(e.target.value), []);
    const handleEditModuleColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSelectedModuleColor(e.target.value), []);

    // ---- Columns ----
    const columns: TableColumn<TicketModule>[] = useMemo(() => [
        {
            key: 'name',
            label: 'Name',
            sortable: true,
            render: (row) => (
                <div className="d-flex align-items-center gap-2">
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: row.color, flexShrink: 0 }} />
                    <span className="fw-medium">{row.name}</span>
                </div>
            ),
        },
        {
            key: 'description',
            label: 'Description',
            sortable: true,
            render: (row) => (
                <span className="text-muted" style={{ fontSize: '0.875rem' }}>{row.description}</span>
            ),
        },
        {
            key: 'color',
            label: 'Color',
            sortable: true,
            render: (row) => (
                <div className="d-flex align-items-center gap-2">
                    <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: row.color, border: '1px solid #dee2e6', flexShrink: 0 }} />
                    <code style={{ fontSize: '0.813rem', color: '#6c757d' }}>{row.color}</code>
                </div>
            ),
        },
        {
            key: 'user_extension',
            label: 'User Extension',
            sortable: true,
            render: (row) => (
                <Badge
                    className="px-3 py-2"
                    style={{
                        fontWeight: 500,
                        fontSize: '0.813rem',
                        backgroundColor: `${row.color}20`,
                        color: row.color,
                        border: `1px solid ${row.color}40`,
                    }}
                >
                    {extensions.find((ext: any) => ext.id.toString() === row.user_extension?.toString())?.display_name
                        || row.user_extension
                        || 'Not assigned'}
                </Badge>
            ),
        },
        {
            key: 'created_at',
            label: 'Created At',
            sortable: true,
            render: (row) => (
                <span className="text-muted">
                    {moment(row.created_at).format(GlobalDateTimeFormat)}
                </span>
            ),
        },
    ], [extensions]);

    const canViewList = permissions?.includes('ticket-modules-tickets');

    // ---- Actions ----
    const actions: TableAction<TicketModule>[] = useMemo(() => {
        const canEdit = permissions?.includes('edit-ticket-module-tickets');
        const canDelete = permissions?.includes('delete-ticket-module-tickets');

        const acts: TableAction<TicketModule>[] = [];

        if (canEdit) {
            acts.push({
                label: 'Edit',
                icon: <Edit size={16} />,
                variant: 'light',
                className: 'btn-action-style-2 p-1 text-primary',
                onClick: handleEditModule,
            });
        }

        if (canViewList) {
            acts.push({
                label: 'Submodules',
                icon: <Package size={16} />,
                variant: 'light',
                className: 'btn-action-style-2 p-1 text-info',
                onClick: openSubmoduleModal,
            });
        }

        if (canDelete) {
            acts.push({
                label: 'Delete',
                icon: <Trash2 size={16} />,
                variant: 'light',
                className: 'btn-action-style-2 p-1 text-danger',
                onClick: handleDeleteModule,
            });
        }

        return acts;
    }, [permissions, handleEditModule, handleDeleteModule, openSubmoduleModal, canViewList]);

    const canCreate = permissions?.includes('create-ticket-module-tickets');

    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="Tickets" mainLink="/tickets/modules" subTitle="Ticket Modules" />

            <PageHeader
                title=""
                buttons={
                    canCreate ? (
                        <Button variant="primary" onClick={openCreateModuleModal}>New Module</Button>
                    ) : undefined
                }
            />

            {canViewList && (
                <GenericTable<TicketModule>
                    data={data}
                    columns={columns}
                    loading={loading}
                    actions={actions}
                    showActions={actions.length > 0}
                    actionsLabel="Actions"
                    pagination={{
                        currentPage,
                        rowsPerPage,
                        totalRows,
                        pageSizeOptions: [15, 25, 50, 100],
                    }}
                    onPaginationChange={handlePaginationChange}
                    sortable={true}
                    hover={true}
                    emptyMessage="No modules found."
                    showToolbar={true}
                    toolbar={{
                        showSearch: true,
                        searchValue,
                        searchPlaceholder: 'Search modules...',
                        onSearchChange: handleSearchChange,
                    }}
                    showToolbarActions={false}
                    uniqueKey="id"
                />
            )}

            {/* Edit Module Modal */}
            <FormModal
                show={showEditModuleModal}
                onHide={closeEditModuleModal}
                title="Edit Module"
                size="lg"
                titleIcon={<Package size={20} className="text-primary" />}
                desc="Update the module details below"
                formHtml={
                    <>
                        <div className="form-group mb-3">
                            <label htmlFor="editModuleName" className="fw-semibold d-flex align-items-center gap-2 form-label">
                                Module Name <span className="text-danger">*</span>
                                <span className="text-muted ms-2" title="Enter module name"><Info size={14} /></span>
                            </label>
                            <input type="text" className="form-control" id="editModuleName" value={selectedModuleName} onChange={handleEditModuleNameChange} placeholder="Module Name" />
                            <Form.Text className="text-muted d-flex align-items-center gap-1 mt-2">
                                <Info size={12} />
                                <span style={{ fontSize: '0.813rem' }}>Use descriptive names that clearly indicate the purpose of the module.</span>
                            </Form.Text>
                        </div>

                        <div className="form-group mb-3">
                            <label htmlFor="editModuleDescription" className="fw-semibold d-flex align-items-center gap-2 form-label">
                                Module Description <span className="text-danger">*</span>
                                <span className="text-muted ms-2" title="Enter module description"><Info size={14} /></span>
                            </label>
                            <textarea className="form-control" id="editModuleDescription" value={selectedModuleDescription} onChange={handleEditModuleDescriptionChange} placeholder="Module Description" />
                            <Form.Text className="text-muted d-flex align-items-center gap-1 mt-2">
                                <Info size={12} />
                                <span style={{ fontSize: '0.813rem' }}>Provide a clear description of the module.</span>
                            </Form.Text>
                        </div>

                        <Row>
                            <Col md={6}>
                                <div className="form-group mb-3">
                                    <label htmlFor="editModuleColor" className="fw-semibold d-flex align-items-center gap-2 form-label">
                                        Color <span className="text-danger">*</span>
                                        <span className="text-muted ms-2" title="Select a color that visually represents this module"><Info size={14} /></span>
                                    </label>
                                    <div className="d-flex align-items-center gap-2">
                                        <input type="color" className="form-control form-control-color" id="editModuleColorPicker" value={selectedModuleColor} onChange={handleEditModuleColorChange} style={{ width: '50px', height: '38px' }} />
                                        <input type="text" className="form-control" id="editModuleColor" value={selectedModuleColor} onChange={handleEditModuleColorChange} placeholder="e.g., #FF5733" />
                                    </div>
                                    <Form.Text className="text-muted d-flex align-items-center gap-1 mt-2">
                                        <Info size={12} />
                                        <span style={{ fontSize: '0.813rem' }}>Choose colors that align with module meaning.</span>
                                    </Form.Text>
                                    <div className="d-flex gap-2 mt-2">
                                        {colorSuggestions.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                aria-label={`Select color ${color}`}
                                                onClick={() => setSelectedModuleColor(color)}
                                                className="p-0"
                                                style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '6px',
                                                    backgroundColor: color,
                                                    cursor: 'pointer',
                                                    border: selectedModuleColor === color ? '3px solid #000' : '2px solid #dee2e6',
                                                    transition: 'all 0.2s',
                                                }}
                                                title={color}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className="form-group mb-3">
                                    <label htmlFor="editModuleUserExtension" className="fw-semibold d-flex align-items-center gap-2 form-label">
                                        User Extension (Optional)
                                        {' '}
                                        <span className="text-muted ms-2" title="Select a user extension for this module"><Info size={14} /></span>
                                    </label>
                                    <Select
                                        id="editModuleUserExtension"
                                        value={
                                            selectedModuleUserExtension
                                                ? {
                                                    value: selectedModuleUserExtension,
                                                    label: extensions.find((ext: any) => ext.id.toString() === selectedModuleUserExtension?.toString())?.display_name || '',
                                                }
                                                : null
                                        }
                                        onChange={(selectedOption: any) => setSelectedModuleUserExtension(selectedOption?.value || null)}
                                        options={extensions.map((ext: any) => ({ value: ext.id, label: ext.display_name }))}
                                        placeholder="Select User Extension (Optional)"
                                        isClearable
                                        isSearchable
                                    />
                                </div>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={12}>
                                <Card className="border-0 bg-light mt-3">
                                    <Card.Body className="p-3">
                                        <Form.Label className="fw-semibold mb-3 d-flex align-items-center gap-2">
                                            <Eye size={16} />
                                            Preview
                                        </Form.Label>
                                        <div className="d-flex align-items-center gap-3 p-3 bg-white rounded border">
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: selectedModuleColor, flexShrink: 0 }} />
                                            <div className="flex-grow-1">
                                                <div className="fw-medium mb-1">{selectedModuleName || 'Module Name'}</div>
                                                <div className="text-muted small mb-2">{selectedModuleDescription || 'Module description...'}</div>
                                                <div className="d-flex gap-2 align-items-center">
                                                    {selectedModuleUserExtension && (
                                                        <div style={{ backgroundColor: `${selectedModuleColor}20`, color: selectedModuleColor, border: `1px solid ${selectedModuleColor}40` }} className="px-3 py-1">
                                                            {extensions.find((ext: any) => ext.id.toString() === selectedModuleUserExtension?.toString())?.display_name || selectedModuleUserExtension}
                                                        </div>
                                                    )}
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: selectedModuleColor, border: '1px solid #dee2e6' }} />
                                                        <code className="small">{selectedModuleColor || '#0d6efd'}</code>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </>
                }
                submitButtonText="Update Module"
                isSubmitDisabled={!selectedModuleName}
                cancelButtonText="Cancel"
                onSubmit={handleSubmitEditModule}
                onCancel={closeEditModuleModal}
                submitButtonVariant="primary"
                cancelButtonVariant="secondary"
            />

            {/* Delete Confirm Modal */}
            <ConfirmModal
                show={showDeleteModuleModal}
                onHide={closeDeleteModuleModal}
                title="Delete Module?"
                description="Are you sure you want to delete module {targetName}? This action cannot be undone."
                targetName={selectedModuleName || ''}
                confirmButtonText="Delete"
                cancelButtonText="Cancel"
                onConfirm={handleSubmitDeleteModule}
                onCancel={closeDeleteModuleModal}
                confirmButtonVariant="danger"
                cancelButtonVariant="secondary"
            />

            {/* Create Module Modal */}
            <FormModal
                show={showCreateModuleModal}
                onHide={closeCreateModuleModal}
                title="New Module"
                size="lg"
                titleIcon={<Package size={20} className="text-primary" />}
                desc="Fill in the details below to create a new module"
                formHtml={
                    <>
                        <div className="form-group mb-3">
                            <label htmlFor="newModuleName" className="fw-semibold d-flex align-items-center gap-2 form-label">
                                Module Name <span className="text-danger">*</span>
                                <span className="text-muted ms-2" title="Enter module name"><Info size={14} /></span>
                            </label>
                            <input type="text" className="form-control" id="newModuleName" value={newModuleName} onChange={handleNewModuleNameChange} placeholder="Module Name" />
                            <Form.Text className="text-muted d-flex align-items-center gap-1 mt-2">
                                <Info size={12} />
                                <span style={{ fontSize: '0.813rem' }}>Use descriptive names that clearly indicate the purpose of the module.</span>
                            </Form.Text>
                        </div>

                        <div className="form-group mb-3">
                            <label htmlFor="newModuleDescription" className="fw-semibold d-flex align-items-center gap-2 form-label">
                                Module Description
                                {' '}
                                <span className="text-muted ms-2" title="Enter module description"><Info size={14} /></span>
                            </label>
                            <textarea className="form-control" id="newModuleDescription" value={newModuleDescription} onChange={handleNewModuleDescriptionChange} placeholder="Module Description" />
                            <Form.Text className="text-muted d-flex align-items-center gap-1 mt-2">
                                <Info size={12} />
                                <span style={{ fontSize: '0.813rem' }}>Provide a clear description of the module.</span>
                            </Form.Text>
                        </div>

                        <Row>
                            <Col md={6}>
                                <div className="form-group mb-3">
                                    <label htmlFor="newModuleColor" className="fw-semibold d-flex align-items-center gap-2 form-label">
                                        Color <span className="text-danger">*</span>
                                        <span className="text-muted ms-2" title="Select a color that visually represents this module"><Info size={14} /></span>
                                    </label>
                                    <div className="d-flex align-items-center gap-2">
                                        <input type="color" className="form-control form-control-color" id="colorPicker" value={newModuleColor} onChange={handleNewModuleColorChange} style={{ width: '60px', height: '48px' }} />
                                        <input type="text" className="form-control" id="newModuleColor" value={newModuleColor} onChange={handleNewModuleColorChange} placeholder="e.g., #FF5733" />
                                    </div>
                                    <div className="d-flex gap-2 mt-2">
                                        {colorSuggestions.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                aria-label={`Select color ${color}`}
                                                onClick={() => setNewModuleColor(color)}
                                                className="p-0"
                                                style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '6px',
                                                    backgroundColor: color,
                                                    cursor: 'pointer',
                                                    border: newModuleColor === color ? '3px solid #000' : '2px solid #dee2e6',
                                                    transition: 'all 0.2s',
                                                }}
                                                title={color}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className="form-group mb-3">
                                    <label htmlFor="newModuleUserExtension" className="fw-semibold d-flex align-items-center gap-2 form-label">
                                        User Extension (Optional)
                                        {' '}
                                        <span className="text-muted ms-2" title="Select a user extension for this module"><Info size={14} /></span>
                                    </label>
                                    <Select
                                        id="newModuleUserExtension"
                                        value={
                                            newModuleUserExtension
                                                ? {
                                                    value: newModuleUserExtension,
                                                    label: extensions.find((ext: any) => ext.id.toString() === newModuleUserExtension?.toString())?.display_name || '',
                                                }
                                                : null
                                        }
                                        onChange={(selectedOption: any) => setNewModuleUserExtension(selectedOption?.value || null)}
                                        options={extensions.map((ext: any) => ({ value: ext.id, label: ext.display_name }))}
                                        placeholder="Select User Extension (Optional)"
                                        isClearable
                                        isSearchable
                                    />
                                </div>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={12}>
                                <Card className="border-0 bg-light mt-3">
                                    <Card.Body className="p-3">
                                        <Form.Label className="fw-semibold mb-3 d-flex align-items-center gap-2">
                                            <Eye size={16} />
                                            Preview
                                        </Form.Label>
                                        <div className="d-flex align-items-center gap-3 p-3 bg-white rounded border">
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: newModuleColor, flexShrink: 0 }} />
                                            <div className="flex-grow-1">
                                                <div className="fw-medium mb-1">{newModuleName || 'Module Name'}</div>
                                                <div className="text-muted small mb-2">{newModuleDescription || 'Module description...'}</div>
                                                <div className="d-flex gap-2 align-items-center">
                                                    {newModuleUserExtension && (
                                                        <div style={{ backgroundColor: `${newModuleColor}20`, color: newModuleColor, border: `1px solid ${newModuleColor}40` }} className="px-3 py-1">
                                                            {extensions.find((ext: any) => ext.id.toString() === newModuleUserExtension?.toString())?.display_name || newModuleUserExtension}
                                                        </div>
                                                    )}
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: newModuleColor, border: '1px solid #dee2e6' }} />
                                                        <code className="small">{newModuleColor || '#0d6efd'}</code>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </>
                }
                submitButtonText="Create Module"
                isSubmitDisabled={!newModuleName}
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
                                This module has {submodules.length} submodule{submodules.length === 1 ? '' : 's'}.
                            </p>
                            <Button
                                variant="outline-info"
                                onClick={() => {
                                    closeSubmoduleModal();
                                    globalThis.location.href = '/tickets/modules/submodules';
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
                                                    <Button variant="outline-danger" size="sm" onClick={() => handleDeleteSubmodule(submodule)}>
                                                        Delete
                                                    </Button>
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
