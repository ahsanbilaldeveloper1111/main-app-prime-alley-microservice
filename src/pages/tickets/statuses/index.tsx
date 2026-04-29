import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useCallback, useMemo } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { ListStatuses, CreateStatus, UpdateStatus, DeleteStatus } from '@utils/ticket-statuses';
import { Button } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import moment from 'moment';

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import ConfirmModal from "@pages/partial/ConfirmModal";
import { FiPlus } from "react-icons/fi";
import { Tag, X, Edit, Trash2, Info, Eye } from 'lucide-react';
import { GlobalDateTimeFormat } from '@utils/Helper';
import GenericTable, { TableColumn, TableAction } from '@components/GenericTable';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_COLOR_SUGGESTIONS = [
    { color: '#0d6efd', label: 'Open/New' },
    { color: '#ffc107', label: 'Pending' },
    { color: '#fd7e14', label: 'In Progress' },
    { color: '#198754', label: 'Resolved' },
    { color: '#6c757d', label: 'Closed' },
    { color: '#dc3545', label: 'Blocked' },
] as const;

const DEFAULT_STATUS_COLOR = '#0d6efd';

// ---------------------------------------------------------------------------
// Shared sub-components (used in both Create and Edit flows)
// ---------------------------------------------------------------------------

interface StatusColorFieldProps {
    color: string;
    name: string;
    onColorChange: (color: string) => void;
    colorPickerId: string;
    colorTextId: string;
}

const StatusColorField: React.FC<StatusColorFieldProps> = ({
    color,
    name,
    onColorChange,
    colorPickerId,
    colorTextId,
}) => (
    <div className="contact-form-field" style={{ marginBottom: '20px' }}>
        <label
            htmlFor={colorPickerId}
            style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#141414', marginBottom: '8px' }}
            className="d-flex align-items-center gap-2"
        >
            Status Color <span style={{ color: '#f2545b' }}>*</span>
            <span className="text-muted" title="Select a color that visually represents this status" style={{ cursor: 'help' }}>
                <Info size={14} />
            </span>
        </label>

        <div className="d-flex align-items-center gap-2">
            <input
                type="color"
                id={colorPickerId}
                value={color}
                onChange={(e) => onColorChange(e.target.value)}
                style={{ width: '50px', height: '38px', padding: '2px', border: '1px solid #8a8a8a', borderRadius: '4px', cursor: 'pointer' }}
            />
            <input
                type="text"
                id={colorTextId}
                value={color}
                onChange={(e) => onColorChange(e.target.value)}
                placeholder="e.g., #FF5733"
                style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: '1px solid #8a8a8a',
                    borderRadius: '4px',
                    fontSize: '14px',
                    outline: 'none',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#0091ae'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#8a8a8a'; }}
            />
        </div>

        <p style={{ fontSize: '0.813rem', color: '#6c757d', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Info size={12} />
            Choose colors that align with status meaning (e.g., green for completed, yellow for pending, red for critical).
        </p>

        {/* Color Suggestions */}
        <div style={{ marginTop: '12px' }}>
            <small style={{ color: '#6c757d', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Suggested Colors:</small>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {STATUS_COLOR_SUGGESTIONS.map((suggestion) => (
                    <button
                        key={suggestion.color}
                        type="button"
                        onClick={() => onColorChange(suggestion.color)}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 12px',
                            backgroundColor: 'transparent',
                            border: '1px solid #8a8a8a',
                            borderRadius: '4px',
                            fontSize: '13px',
                            color: '#141414',
                            cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f7fafc'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                        <div style={{ width: '14px', height: '14px', backgroundColor: suggestion.color, borderRadius: '3px', border: '1px solid #dee2e6', flexShrink: 0 }} />
                        <small>{suggestion.label}</small>
                    </button>
                ))}
            </div>
        </div>

        {/* Live Preview */}
        <div style={{ marginTop: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, color: '#141414', marginBottom: '10px' }}>
                <Eye size={16} />
                Status Preview
            </label>
            <div style={{ backgroundColor: '#f8f9fa', borderRadius: '6px', padding: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Badge preview */}
                    <div>
                        <small style={{ color: '#6c757d', display: 'block', marginBottom: '6px' }}>As Badge:</small>
                        <div style={{
                            backgroundColor: color,
                            padding: '4px 12px',
                            fontSize: '14px',
                            borderRadius: '3px',
                            color: '#ffffff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}>
                            <Tag size={13} />
                            {name || 'Status Name'}
                        </div>
                    </div>
                    {/* Indicator preview */}
                    <div>
                        <small style={{ color: '#6c757d', display: 'block', marginBottom: '6px' }}>As Status Indicator:</small>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 10px', backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #dee2e6' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#141414' }}>{name || 'Status Name'}</span>
                        </div>
                    </div>
                </div>
            </div>
            <p style={{ fontSize: '0.813rem', color: '#6c757d', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Info size={12} />
                This is how your status will appear in tickets, dashboards, and reports
            </p>
        </div>
    </div>
);

// ---------------------------------------------------------------------------
// StatusSidebar — single sidebar used for both Create and Edit flows
// ---------------------------------------------------------------------------

interface StatusSidebarConfig {
    title: string;
    namePlaceholder: string;
    submitLabel: string;
    submittingLabel: string;
    colorPickerId: string;
    colorTextId: string;
    nameInputId: string;
}

const CREATE_SIDEBAR_CONFIG: StatusSidebarConfig = {
    title: 'Create New Status',
    namePlaceholder: 'e.g., Open, In Progress, Resolved, Pending Review, etc.',
    submitLabel: 'Create Status',
    submittingLabel: 'Creating...',
    colorPickerId: 'createStatusColorPicker',
    colorTextId: 'createStatusColorText',
    nameInputId: 'createStatusName',
};

const EDIT_SIDEBAR_CONFIG: StatusSidebarConfig = {
    title: 'Edit Status',
    namePlaceholder: 'Status Name',
    submitLabel: 'Update Status',
    submittingLabel: 'Updating...',
    colorPickerId: 'editStatusColorPicker',
    colorTextId: 'editStatusColorText',
    nameInputId: 'editStatusName',
};

interface StatusSidebarProps {
    isOpen: boolean;
    config: StatusSidebarConfig;
    name: string;
    color: string;
    onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onColorChange: (color: string) => void;
    onSubmit: () => void;
    onClose: () => void;
    isSubmitting?: boolean;
}

const StatusSidebar: React.FC<StatusSidebarProps> = ({
    isOpen,
    config,
    name,
    color,
    onNameChange,
    onColorChange,
    onSubmit,
    onClose,
    isSubmitting = false,
}) => {
    if (!isOpen) return null;

    const isFormValid = name.trim() !== '' && color.trim() !== '';
    const canSubmit = isFormValid && !isSubmitting;

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit();
    };

    return (
        <>
            <div aria-hidden="true" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'transparent' }} />

            <div style={{ position: 'fixed', top: 0, right: 0, width: '600px', height: '100vh', backgroundColor: '#ffffff', boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.1)', zIndex: 999999, display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #eaf0f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Tag size={20} style={{ color: '#0091ae' }} />
                        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#141414', margin: 0 }}>
                            {config.title}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer', color: '#718096', display: 'flex', alignItems: 'center' }}
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                    {/* Body */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
                        {/* Status Name */}
                        <div style={{ marginBottom: '20px' }}>
                            <label
                                htmlFor={config.nameInputId}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#141414', marginBottom: '8px' }}
                            >
                                Status Name <span style={{ color: '#f2545b' }}>*</span>
                                <span title="Enter a clear name that represents the ticket state" style={{ cursor: 'help', color: '#6c757d' }}>
                                    <Info size={14} />
                                </span>
                            </label>
                            <input
                                id={config.nameInputId}
                                type="text"
                                value={name}
                                onChange={onNameChange}
                                placeholder={config.namePlaceholder}
                                style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8a8a', borderRadius: '4px', fontSize: '14px', outline: 'none' }}
                                onFocus={(e) => { e.currentTarget.style.borderColor = '#0091ae'; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = '#8a8a8a'; }}
                            />
                            <p style={{ fontSize: '0.813rem', color: '#6c757d', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Info size={12} />
                                Use descriptive names that clearly indicate the current state of a ticket in your workflow.
                            </p>
                        </div>

                        {/* Color picker + preview */}
                        <StatusColorField
                            color={color}
                            name={name}
                            onColorChange={onColorChange}
                            colorPickerId={config.colorPickerId}
                            colorTextId={config.colorTextId}
                        />
                    </div>

                    {/* Footer */}
                    <div style={{ padding: '16px 24px', borderTop: '1px solid #eaf0f6', display: 'flex', gap: '12px' }}>
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            style={{ padding: '10px 20px', backgroundColor: canSubmit ? '#0091ae' : '#cbd5e0', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: canSubmit ? 'pointer' : 'not-allowed' }}
                            onMouseEnter={(e) => { if (canSubmit) e.currentTarget.style.backgroundColor = '#007a94'; }}
                            onMouseLeave={(e) => { if (canSubmit) e.currentTarget.style.backgroundColor = '#0091ae'; }}
                        >
                            {isSubmitting ? config.submittingLabel : config.submitLabel}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{ padding: '10px 20px', backgroundColor: 'transparent', color: '#141414', border: '1px solid #8a8a8a', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f7fafc'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TicketStatus {
    id: string | number;
    name: string;
    color: string;
    created_at: string;
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

const TicketStatuses = () => {
    const { data: session } = useSession();
    const permissions = session?.user?.permissions;

    const [data, setData] = useState<TicketStatus[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [rowsPerPage, setRowsPerPage] = useState<number>(15);
    const [totalRows, setTotalRows] = useState<number>(0);
    const [searchValue, setSearchValue] = useState<string>('');

    // Edit state
    const [selectedStatus, setSelectedStatus] = useState<any>(null);
    const [selectedStatusName, setSelectedStatusName] = useState<string>('');
    const [selectedStatusColor, setSelectedStatusColor] = useState<string>('');
    const [showEditStatusModal, setShowEditStatusModal] = useState<boolean>(false);

    // Delete state
    const [showDeleteStatusModal, setShowDeleteStatusModal] = useState<boolean>(false);

    // Create state
    const [showCreateStatusSidebar, setShowCreateStatusSidebar] = useState<boolean>(false);
    const [newStatusName, setNewStatusName] = useState<string>('');
    const [newStatusColor, setNewStatusColor] = useState<string>(DEFAULT_STATUS_COLOR);

    // ---- Data Fetching ----
    const fetchStatuses = useCallback(async (page: number, perPage: number, search: string) => {
        setLoading(true);
        try {
            const response = await ListStatuses({ page, perPage, search, filters: { search } });
            if (response) {
                setData(response.data || []);
                setTotalRows(response.total || 0);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch and re-fetch on page/perPage/search change
    React.useEffect(() => {
        fetchStatuses(currentPage, rowsPerPage, searchValue);
    }, [fetchStatuses, currentPage, rowsPerPage, searchValue]);

    const triggerRefresh = useCallback(() => {
        fetchStatuses(currentPage, rowsPerPage, searchValue);
    }, [fetchStatuses, currentPage, rowsPerPage, searchValue]);

    // ---- Handlers: Edit ----
    const handleEditStatus = useCallback((row: TicketStatus) => {
        setSelectedStatus(row.id);
        setSelectedStatusName(row.name);
        setSelectedStatusColor(row.color);
        setShowEditStatusModal(true);
    }, []);

    const closeEditStatusModal = useCallback(() => setShowEditStatusModal(false), []);

    const handleSubmitEditStatus = useCallback(async () => {
        const response = await UpdateStatus(selectedStatus, selectedStatusName, selectedStatusColor);
        if (response) {
            setSelectedStatus(null);
            setSelectedStatusName('');
            setSelectedStatusColor('');
            setShowEditStatusModal(false);
            triggerRefresh();
        }
    }, [selectedStatus, selectedStatusName, selectedStatusColor, triggerRefresh]);

    const handleEditStatusNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSelectedStatusName(e.target.value), []);
    const handleEditStatusColorChange = useCallback((color: string) => setSelectedStatusColor(color), []);

    // ---- Handlers: Delete ----
    const handleDeleteStatus = useCallback((row: TicketStatus) => {
        setSelectedStatus(row.id);
        setSelectedStatusName(row.name);
        setShowDeleteStatusModal(true);
    }, []);

    const closeDeleteStatusModal = useCallback(() => setShowDeleteStatusModal(false), []);

    const handleSubmitDeleteStatus = useCallback(async () => {
        const response = await DeleteStatus(selectedStatus);
        if (response) {
            setSelectedStatus(null);
            setSelectedStatusName('');
            setShowDeleteStatusModal(false);
            triggerRefresh();
        }
    }, [selectedStatus, triggerRefresh]);

    // ---- Handlers: Create ----
    const openCreateStatusSidebar = useCallback(() => setShowCreateStatusSidebar(true), []);
    const closeCreateStatusSidebar = useCallback(() => {
        setShowCreateStatusSidebar(false);
        setNewStatusName('');
        setNewStatusColor(DEFAULT_STATUS_COLOR);
    }, []);

    const handleNewStatusNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setNewStatusName(e.target.value), []);
    const handleNewStatusColorChange = useCallback((color: string) => setNewStatusColor(color), []);

    const handleSubmitCreateStatus = useCallback(async () => {
        const response = await CreateStatus(newStatusName, newStatusColor);
        if (response) {
            closeCreateStatusSidebar();
            triggerRefresh();
        }
    }, [newStatusName, newStatusColor, closeCreateStatusSidebar, triggerRefresh]);

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

    // ---- Columns ----
    const columns: TableColumn<TicketStatus>[] = useMemo(() => [
        {
            key: 'name',
            label: 'Status Name',
            sortable: true,
            render: (row) => (
                <div className="font-weight-500" style={{ display: 'flex', alignItems: 'center' }}>
                    <span
                        className="rounded-circle"
                        style={{ width: '8px', height: '8px', backgroundColor: row.color, flexShrink: 0, display: 'inline-block' }}
                    />
                    <span className="ms-2">{row.name}</span>
                </div>
            ),
        },
        {
            key: 'color',
            label: 'Color',
            sortable: true,
            render: (row) => (
                <div className="d-flex align-items-center gap-2">
                    <span style={{ backgroundColor: row.color, width: '24px', height: '24px', borderRadius: '8px', display: 'inline-block' }} />
                    <code style={{ fontSize: '0.813rem', color: row.color, backgroundColor: '#f8f9fa', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                        {row.color}
                    </code>
                </div>
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
    ], []);

    // ---- Actions ----
    const actions: TableAction<TicketStatus>[] = useMemo(() => {
        const canEdit = permissions?.includes('edit-ticket-status-tickets');
        const canDelete = permissions?.includes('delete-ticket-status-tickets');

        const acts: TableAction<TicketStatus>[] = [];

        if (canEdit) {
            acts.push({
                label: 'Edit',
                icon: <Edit size={16} />,
                variant: 'light',
                className: 'btn-action-style-2 p-1 text-primary',
                onClick: handleEditStatus,
            });
        }

        if (canDelete) {
            acts.push({
                label: 'Delete',
                icon: <Trash2 size={16} />,
                variant: 'light',
                className: 'btn-action-style-2 p-1 text-danger',
                onClick: handleDeleteStatus,
            });
        }

        return acts;
    }, [permissions, handleEditStatus, handleDeleteStatus]);

    const canViewList = permissions?.includes('ticket-statuses-tickets');
    const canCreate = permissions?.includes('create-ticket-status-tickets');

    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="Tickets" mainLink="/tickets/statuses" subTitle="Ticket Status" />

            <PageHeader
                title=""
                description=""
                showSearch={false}
                searchPlaceholder="Search statuses..."
                searchValue={searchValue}
                onSearchChange={handleSearchChange}
                buttons={
                    canCreate ? (
                        <Button variant="primary" onClick={openCreateStatusSidebar}>
                            <FiPlus className="me-2" />
                            Add Status
                        </Button>
                    ) : undefined
                }
            />

            {canViewList && (
                <GenericTable<TicketStatus>
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
                    emptyMessage="No statuses found."
                    showToolbar={true}
                    toolbar={{
                        showSearch: true,
                        searchValue,
                        searchPlaceholder: 'Search statuses...',
                        onSearchChange: handleSearchChange,
                    }}
                    showToolbarActions={false}
                    uniqueKey="id"
                />
            )}

            {/* Create Status Sidebar */}
            <StatusSidebar
                isOpen={showCreateStatusSidebar}
                config={CREATE_SIDEBAR_CONFIG}
                name={newStatusName}
                color={newStatusColor}
                onNameChange={handleNewStatusNameChange}
                onColorChange={handleNewStatusColorChange}
                onSubmit={handleSubmitCreateStatus}
                onClose={closeCreateStatusSidebar}
            />

            {/* Edit Status Sidebar */}
            <StatusSidebar
                isOpen={showEditStatusModal}
                config={EDIT_SIDEBAR_CONFIG}
                name={selectedStatusName}
                color={selectedStatusColor}
                onNameChange={handleEditStatusNameChange}
                onColorChange={handleEditStatusColorChange}
                onSubmit={handleSubmitEditStatus}
                onClose={closeEditStatusModal}
            />

            {/* Delete Confirm Modal */}
            <ConfirmModal
                show={showDeleteStatusModal}
                onHide={closeDeleteStatusModal}
                title="Delete Status?"
                description="Are you sure you want to delete status {targetName}? This action cannot be undone."
                targetName={selectedStatusName || ''}
                confirmButtonText="Delete Status"
                cancelButtonText="Cancel"
                onConfirm={handleSubmitDeleteStatus}
                onCancel={closeDeleteStatusModal}
                confirmButtonVariant="danger"
                cancelButtonVariant="secondary"
            />
        </React.Fragment>
    );
};

TicketStatuses.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default TicketStatuses;
