import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useCallback, useMemo, useEffect } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { ListFAQModules, createFAQModule, updateFAQModule, deleteFAQModule } from '@utils/faqs';
import { Column } from '@components/CustomDataTable';
import { Button, Form, InputGroup, Modal } from 'react-bootstrap';
import '@assets/scss/common.scss';
import ConfirmModal from '@pages/partial/ConfirmModal';
import SuccessfulModal from '@pages/partial/SuccessfulModal';
import { Edit, Info, Trash2, Layers, Plus, Search, X } from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ICON_FALLBACK: string[] = ['help_outline', 'info', 'book', 'settings', 'person'];

const CREATE_MODULE_CONFIG = {
    title: 'New FAQ Module',
    nameInputId: 'newModuleName',
    descInputId: 'newModuleDescription',
    iconInputId: 'newModuleIcon',
    submitLabel: 'Add Module',
    submittingLabel: 'Adding...',
} as const;

const EDIT_MODULE_CONFIG = {
    title: 'Edit FAQ Module',
    nameInputId: 'editModuleName',
    descInputId: 'editModuleDescription',
    iconInputId: 'editModuleIcon',
    submitLabel: 'Update Module',
    submittingLabel: 'Updating...',
} as const;

type ModuleSidebarConfig = typeof CREATE_MODULE_CONFIG | typeof EDIT_MODULE_CONFIG;

// ---------------------------------------------------------------------------
// Shared form field sub-components
// ---------------------------------------------------------------------------

interface ModuleNameFieldProps {
    id: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    hint: string;
}

const ModuleNameField: React.FC<ModuleNameFieldProps> = ({ id, value, onChange, hint }) => (
    <div style={{ marginBottom: '20px' }}>
        <label
            htmlFor={id}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#141414', marginBottom: '8px' }}
        >
            Module Name <span style={{ color: '#f2545b' }}>*</span>
            <span title="Enter the name of the FAQ module" style={{ cursor: 'help', color: '#6c757d' }}>
                <Info size={14} />
            </span>
        </label>
        <input
            id={id}
            type="text"
            value={value}
            onChange={onChange}
            placeholder="Module Name"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8a8a', borderRadius: '4px', fontSize: '14px', outline: 'none' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#0091ae'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#8a8a8a'; }}
        />
        <p style={{ fontSize: '0.813rem', color: '#6c757d', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Info size={12} />
            {hint}
        </p>
    </div>
);

interface ModuleDescriptionFieldProps {
    id: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const ModuleDescriptionField: React.FC<ModuleDescriptionFieldProps> = ({ id, value, onChange }) => (
    <div style={{ marginBottom: '20px' }}>
        <label
            htmlFor={id}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#141414', marginBottom: '8px' }}
        >
            Description{' '}
            <span title="Enter a description for the FAQ module" style={{ cursor: 'help', color: '#6c757d' }}>
                <Info size={14} />
            </span>
        </label>
        <textarea
            id={id}
            rows={3}
            value={value}
            onChange={onChange}
            placeholder="Module Description"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8a8a', borderRadius: '4px', fontSize: '14px', outline: 'none', resize: 'vertical' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#0091ae'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#8a8a8a'; }}
        />
        <p style={{ fontSize: '0.813rem', color: '#6c757d', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Info size={12} />
            Optional description for the FAQ module
        </p>
    </div>
);

interface ModuleIconFieldProps {
    id: string;
    value: string;
    onTextChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onPickerOpen: () => void;
}

const ModuleIconField: React.FC<ModuleIconFieldProps> = ({ id, value, onTextChange, onPickerOpen }) => (
    <div style={{ marginBottom: '20px' }}>
        <label
            htmlFor={id}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#141414', marginBottom: '8px' }}
        >
            Icon{' '}
            <span title="Enter icon identifier" style={{ cursor: 'help', color: '#6c757d' }}>
                <Info size={14} />
            </span>
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
            <input
                id={id}
                type="text"
                value={value}
                onChange={onTextChange}
                placeholder="e.g., question-circle"
                style={{ flex: 1, padding: '10px 12px', border: '1px solid #8a8a8a', borderRadius: '4px', fontSize: '14px', outline: 'none' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#0091ae'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#8a8a8a'; }}
            />
            <button
                type="button"
                onClick={onPickerOpen}
                title="Choose Icon"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px 14px', backgroundColor: 'transparent', border: '1px solid #8a8a8a', borderRadius: '4px', cursor: 'pointer', color: '#141414' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f7fafc'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
                <Layers size={16} />
            </button>
        </div>
        {value && (
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.813rem', color: '#6c757d' }}>Preview:</span>
                <i className="material-icons-two-tone" style={{ fontSize: '24px' }}>{value}</i>
            </div>
        )}
        <p style={{ fontSize: '0.813rem', color: '#6c757d', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Info size={12} />
            Optional icon identifier for the FAQ module
        </p>
    </div>
);

// ---------------------------------------------------------------------------
// FAQModuleSidebar — single sidebar for both Create and Edit
// ---------------------------------------------------------------------------

interface FAQModuleSidebarProps {
    isOpen: boolean;
    config: ModuleSidebarConfig;
    name: string;
    description: string;
    icon: string;
    onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onIconTextChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onIconPickerOpen: () => void;
    onSubmit: () => void;
    onClose: () => void;
    isSubmitting?: boolean;
    nameHint: string;
}

const FAQModuleSidebar: React.FC<FAQModuleSidebarProps> = ({
    isOpen,
    config,
    name,
    description,
    icon,
    onNameChange,
    onDescriptionChange,
    onIconTextChange,
    onIconPickerOpen,
    onSubmit,
    onClose,
    isSubmitting = false,
    nameHint,
}) => {
    if (!isOpen) return null;

    const canSubmit = name.trim() !== '' && !isSubmitting;

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
                        <Layers size={20} style={{ color: '#0091ae' }} />
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
                        <ModuleNameField
                            id={config.nameInputId}
                            value={name}
                            onChange={onNameChange}
                            hint={nameHint}
                        />
                        <ModuleDescriptionField
                            id={config.descInputId}
                            value={description}
                            onChange={onDescriptionChange}
                        />
                        <ModuleIconField
                            id={config.iconInputId}
                            value={icon}
                            onTextChange={onIconTextChange}
                            onPickerOpen={onIconPickerOpen}
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
// Table cell renderers (extracted to keep useMemo lean)
// ---------------------------------------------------------------------------

function renderIconCell(props: any) {
    return (
        <div>
            <i className="material-icons-two-tone" style={{ fontSize: '24px' }}>{props.icon}</i>
        </div>
    );
}

function renderDescriptionCell(props: any) {
    return (
        <div style={{ maxWidth: '200px', whiteSpace: 'normal' }}>
            <span className={props.description ? '' : 'text-muted'}>
                {props.description || 'No description'}
            </span>
        </div>
    );
}

function buildModuleActionCell(onEdit: (props: any) => void, onDelete: (props: any) => void) {
    return function ModuleActionCell(props: any) {
        return (
            <div className="d-flex gap-2">
                <Button variant="light" className="btn-action-style-2 p-1 text-primary" title="Edit" onClick={() => onEdit(props)}>
                    <Edit size={16} />
                </Button>
                <Button variant="light" className="btn-action-style-2 p-1 text-danger" title="Delete" onClick={() => onDelete(props)}>
                    <Trash2 size={16} />
                </Button>
            </div>
        );
    };
}

// ---------------------------------------------------------------------------
// Icon picker content (extracted to reduce JSX complexity in main component)
// ---------------------------------------------------------------------------

interface IconPickerBodyProps {
    allIcons: string[];
    filteredIcons: string[];
    iconSearchQuery: string;
    onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onIconSelect: (name: string) => void;
}

const IconPickerBody: React.FC<IconPickerBodyProps> = ({
    allIcons,
    filteredIcons,
    iconSearchQuery,
    onSearchChange,
    onIconSelect,
}) => (
    <>
        <div className="mb-3">
            <InputGroup>
                <InputGroup.Text><Search size={16} /></InputGroup.Text>
                <Form.Control
                    type="text"
                    placeholder="Search icons..."
                    value={iconSearchQuery}
                    onChange={onSearchChange}
                />
            </InputGroup>
        </div>

        <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '4px', padding: '10px' }}>
            {filteredIcons.length === 0 ? (
                <div className="text-center text-muted py-4">
                    {allIcons.length === 0 ? 'Loading icons...' : 'No icons found'}
                </div>
            ) : (
                <div className="d-flex flex-wrap gap-2">
                    {filteredIcons.map((iconName) => (
                        <button
                            key={iconName}
                            type="button"
                            title={iconName}
                            onClick={() => onIconSelect(iconName)}
                            style={{ width: '60px', height: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #dee2e6', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s', background: '#fff', padding: 0 }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f8f9fa';
                                e.currentTarget.style.borderColor = '#4680ff';
                                e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#fff';
                                e.currentTarget.style.borderColor = '#dee2e6';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            <i className="material-icons-two-tone" style={{ fontSize: '24px' }}>{iconName}</i>
                            <span style={{ fontSize: '10px', color: '#6c757d', marginTop: '4px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', padding: '0 2px' }}>
                                {iconName.length > 10 ? `${iconName.substring(0, 8)}...` : iconName}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>

        <div className="mt-2 text-muted small">
            Showing {filteredIcons.length} of {allIcons.length} icons
        </div>
    </>
);

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

const FAQModules = () => {
    const [refreshKey, setRefreshKey] = useState<number>(0);

    // Create state
    const [showCreateSidebar, setShowCreateSidebar] = useState<boolean>(false);
    const [newModuleName, setNewModuleName] = useState<string>('');
    const [newModuleDescription, setNewModuleDescription] = useState<string>('');
    const [newModuleIcon, setNewModuleIcon] = useState<string>('');

    // Edit state
    const [showEditSidebar, setShowEditSidebar] = useState<boolean>(false);
    const [selectedModule, setSelectedModule] = useState<any>(null);
    const [selectedModuleName, setSelectedModuleName] = useState<string>('');
    const [selectedModuleDescription, setSelectedModuleDescription] = useState<string>('');
    const [selectedModuleIcon, setSelectedModuleIcon] = useState<string>('');

    // Delete state
    const [showDeleteModuleModal, setShowDeleteModuleModal] = useState<boolean>(false);

    // Success modal state
    const [showSuccessfulModal, setShowSuccessfulModal] = useState<boolean>(false);
    const [successModalTitle, setSuccessModalTitle] = useState<string>('');
    const [successModalDescription, setSuccessModalDescription] = useState<string>('');

    // Icon picker state
    const [showIconPicker, setShowIconPicker] = useState<boolean>(false);
    const [iconPickerMode, setIconPickerMode] = useState<'create' | 'edit'>('create');
    const [iconSearchQuery, setIconSearchQuery] = useState<string>('');
    const [allIcons, setAllIcons] = useState<string[]>([]);

    const triggerRefresh = useCallback(() => setRefreshKey((prev) => prev + 1), []);

    // ---- Icon loading ----
    useEffect(() => {
        const loadIcons = async () => {
            try {
                const iconData = await import('./icon-list.json');
                const iconList = iconData.default || iconData;
                if (Array.isArray(iconList) && iconList.length > 0) {
                    setAllIcons(iconList);
                } else {
                    throw new Error('Invalid icon data format');
                }
            } catch (e) {
                console.error('Error loading icons from JSON file:', e);
                setAllIcons(ICON_FALLBACK);
            }
        };
        loadIcons();
    }, []);

    const filteredIcons = useMemo(() => {
        if (!iconSearchQuery) return allIcons;
        return allIcons.filter((icon) => icon.toLowerCase().includes(iconSearchQuery.toLowerCase()));
    }, [allIcons, iconSearchQuery]);

    // ---- Icon picker handlers ----
    const openIconPicker = useCallback((mode: 'create' | 'edit') => {
        setIconPickerMode(mode);
        setShowIconPicker(true);
    }, []);

    const closeIconPicker = useCallback(() => {
        setShowIconPicker(false);
        setIconSearchQuery('');
    }, []);

    const handleIconSelect = useCallback((iconName: string) => {
        if (iconPickerMode === 'create') {
            setNewModuleIcon(iconName);
        } else {
            setSelectedModuleIcon(iconName);
        }
        setShowIconPicker(false);
        setIconSearchQuery('');
    }, [iconPickerMode]);

    const handleIconSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setIconSearchQuery(e.target.value), []);

    // ---- Create handlers ----
    const openCreateSidebar = useCallback(() => setShowCreateSidebar(true), []);

    const closeCreateSidebar = useCallback(() => {
        setShowCreateSidebar(false);
        setNewModuleName('');
        setNewModuleDescription('');
        setNewModuleIcon('');
    }, []);

    const handleSubmitCreateModule = useCallback(async () => {
        const response = await createFAQModule(newModuleName, newModuleDescription, newModuleIcon);
        if (response) {
            closeCreateSidebar();
            triggerRefresh();
        }
    }, [newModuleName, newModuleDescription, newModuleIcon, closeCreateSidebar, triggerRefresh]);

    const handleNewModuleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setNewModuleName(e.target.value), []);
    const handleNewModuleDescChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => setNewModuleDescription(e.target.value), []);
    const handleNewModuleIconTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setNewModuleIcon(e.target.value), []);
    const openCreateIconPicker = useCallback(() => openIconPicker('create'), [openIconPicker]);

    // ---- Edit handlers ----
    const handleEditModule = useCallback((props: any) => {
        setSelectedModule(props.id);
        setSelectedModuleName(props.name);
        setSelectedModuleDescription(props.description || '');
        setSelectedModuleIcon(props.icon || '');
        setShowEditSidebar(true);
    }, []);

    const closeEditSidebar = useCallback(() => {
        setShowEditSidebar(false);
        setSelectedModule(null);
        setSelectedModuleName('');
        setSelectedModuleDescription('');
        setSelectedModuleIcon('');
    }, []);

    const handleSubmitEditModule = useCallback(async () => {
        const response = await updateFAQModule(selectedModule, selectedModuleName, selectedModuleDescription, selectedModuleIcon);
        if (response) {
            closeEditSidebar();
            triggerRefresh();
        }
    }, [selectedModule, selectedModuleName, selectedModuleDescription, selectedModuleIcon, closeEditSidebar, triggerRefresh]);

    const handleEditModuleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSelectedModuleName(e.target.value), []);
    const handleEditModuleDescChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => setSelectedModuleDescription(e.target.value), []);
    const handleEditModuleIconTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSelectedModuleIcon(e.target.value), []);
    const openEditIconPicker = useCallback(() => openIconPicker('edit'), [openIconPicker]);

    // ---- Delete handlers ----
    const handleDeleteModule = useCallback((props: any) => {
        setSelectedModule(props.id);
        setSelectedModuleName(props.name);
        setShowDeleteModuleModal(true);
    }, []);

    const closeDeleteModal = useCallback(() => {
        setShowDeleteModuleModal(false);
        setSelectedModule(null);
        setSelectedModuleName('');
    }, []);

    const handleSubmitDeleteModule = useCallback(async () => {
        const response = await deleteFAQModule(selectedModule);
        if (response) {
            setSelectedModule(null);
            setSelectedModuleName('');
            setShowDeleteModuleModal(false);
            setSuccessModalTitle('FAQ Module Deleted');
            setSuccessModalDescription('FAQ module has been deleted successfully');
            setTimeout(() => setShowSuccessfulModal(true), 100);
            triggerRefresh();
        }
    }, [selectedModule, triggerRefresh]);

    // ---- Data fetching ----
    const fetchModules = useCallback(
        async (page = 1, perPage = 15, search = '') =>
            ListFAQModules({ page, perPage, search, filters: {} }),
        [],
    );

    // ---- Columns ----
    const ActionCell = useMemo(
        () => buildModuleActionCell(handleEditModule, handleDeleteModule),
        [handleEditModule, handleDeleteModule],
    );

    const columns: Column[] = useMemo(() => [
        { key: 'name', name: 'Name', selector: (row: any) => row.name, sortable: true },
        { key: 'icon', name: 'Icon', selector: (row: any) => row.icon, sortable: true, cell: renderIconCell },
        { key: 'description', name: 'Description', selector: (row: any) => row.description || 'N/A', sortable: false, cell: renderDescriptionCell },
        { key: 'Action', name: 'Actions', selector: (row: any) => row.id, sortable: false, cell: ActionCell },
    ], [ActionCell]);

    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="FAQs" mainLink="/faqs" subTitle="Modules" />

            <div className="page-header-title style-2 mb-3">
                <div className="d-flex justify-content-end">
                    <Button variant="primary" onClick={openCreateSidebar}>
                        <Plus size={16} className="me-1" />
                        Add Module
                    </Button>
                </div>
            </div>

            <GenericListPage
                columns={columns}
                fetchData={fetchModules}
                title="FAQ Modules"
                searchPlaceholder="Search modules..."
                defaultPageSize={15}
                filters={{}}
                refreshKey={refreshKey}
                search={true}
                tableStyle="table-style-2"
            />

            {/* Create Module Sidebar */}
            <FAQModuleSidebar
                isOpen={showCreateSidebar}
                config={CREATE_MODULE_CONFIG}
                name={newModuleName}
                description={newModuleDescription}
                icon={newModuleIcon}
                onNameChange={handleNewModuleNameChange}
                onDescriptionChange={handleNewModuleDescChange}
                onIconTextChange={handleNewModuleIconTextChange}
                onIconPickerOpen={openCreateIconPicker}
                onSubmit={handleSubmitCreateModule}
                onClose={closeCreateSidebar}
                nameHint="Enter the name of the FAQ module you want to create"
            />

            {/* Edit Module Sidebar */}
            <FAQModuleSidebar
                isOpen={showEditSidebar}
                config={EDIT_MODULE_CONFIG}
                name={selectedModuleName}
                description={selectedModuleDescription}
                icon={selectedModuleIcon}
                onNameChange={handleEditModuleNameChange}
                onDescriptionChange={handleEditModuleDescChange}
                onIconTextChange={handleEditModuleIconTextChange}
                onIconPickerOpen={openEditIconPicker}
                onSubmit={handleSubmitEditModule}
                onClose={closeEditSidebar}
                nameHint="Change the name of the FAQ module"
            />

            {/* Delete Module Modal */}
            <ConfirmModal
                show={showDeleteModuleModal}
                onHide={closeDeleteModal}
                title="Delete FAQ Module"
                description="Are you sure you want to delete the following FAQ module?"
                targetName={selectedModuleName}
                onConfirm={handleSubmitDeleteModule}
                confirmButtonText="Delete"
                confirmButtonVariant="danger"
                requireTextConfirmation={true}
                requiredConfirmationText="delete"
            />

            {/* Success Modal */}
            <SuccessfulModal
                show={showSuccessfulModal}
                onHide={() => setShowSuccessfulModal(false)}
                title={successModalTitle}
                description={successModalDescription}
            />

            {/* Icon Picker Modal — kept as modal intentionally (grid picker UX) */}
            <Modal show={showIconPicker} onHide={closeIconPicker} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title className="d-flex align-items-center gap-2">
                        <Layers size={20} />
                        Choose Icon
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <IconPickerBody
                        allIcons={allIcons}
                        filteredIcons={filteredIcons}
                        iconSearchQuery={iconSearchQuery}
                        onSearchChange={handleIconSearchChange}
                        onIconSelect={handleIconSelect}
                    />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={closeIconPicker}>Close</Button>
                </Modal.Footer>
            </Modal>
        </React.Fragment>
    );
};

FAQModules.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default FAQModules;
