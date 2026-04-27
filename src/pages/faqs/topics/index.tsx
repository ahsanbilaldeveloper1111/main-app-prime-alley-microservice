import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useCallback, useMemo, useEffect } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { ListFAQTopics, createFAQTopic, updateFAQTopic, deleteFAQTopic, getAllFAQModules } from '@utils/faqs';
import { Column } from '@components/CustomDataTable';
import { Button } from 'react-bootstrap';
import '@assets/scss/common.scss';
import ConfirmModal from '@pages/partial/ConfirmModal';
import SuccessfulModal from '@pages/partial/SuccessfulModal';
import { Edit, Info, Trash2, Tag, Plus, X } from 'lucide-react';
import Select from 'react-select';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CREATE_TOPIC_CONFIG = {
    title: 'New FAQ Topic',
    nameInputId: 'newTopicName',
    descInputId: 'newTopicDescription',
    submitLabel: 'Add Topic',
    submittingLabel: 'Adding...',
    nameHint: 'Enter the name of the FAQ topic you want to create',
    namePlaceholder: 'Topic Name',
} as const;

const EDIT_TOPIC_CONFIG = {
    title: 'Edit FAQ Topic',
    nameInputId: 'editTopicName',
    descInputId: 'editTopicDescription',
    submitLabel: 'Update Topic',
    submittingLabel: 'Updating...',
    nameHint: 'Change the name of the FAQ topic',
    namePlaceholder: '',
} as const;

type TopicSidebarConfig = typeof CREATE_TOPIC_CONFIG | typeof EDIT_TOPIC_CONFIG;

// ---------------------------------------------------------------------------
// Shared field sub-components
// ---------------------------------------------------------------------------

interface TopicModuleFieldProps {
    moduleOptions: { value: any; label: string }[];
    value: string;
    onChange: (value: string) => void;
    isLoading: boolean;
}

const TopicModuleField: React.FC<TopicModuleFieldProps> = ({ moduleOptions, value, onChange, isLoading }) => (
    <div style={{ marginBottom: '20px' }}>
        {(() => {
            const moduleSelectId = "faq-topic-module";
            return (
                <>
                    <label
                        htmlFor={moduleSelectId}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#141414', marginBottom: '8px' }}
                    >
                        FAQ Module <span style={{ color: '#f2545b' }}>*</span>
                        <span title="Select the FAQ module" style={{ cursor: 'help', color: '#6c757d' }}>
                            <Info size={14} />
                        </span>
                    </label>
                    <Select
                        inputId={moduleSelectId}
                        options={moduleOptions}
                        value={moduleOptions.find((opt) => opt.value.toString() === value) ?? null}
                        onChange={(option: any) => onChange(option?.value?.toString() ?? '')}
                        placeholder="Select module..."
                        isLoading={isLoading}
                        isClearable={false}
                        styles={{
                            control: (base) => ({
                                ...base,
                                minHeight: 40,
                                border: '1px solid #8a8a8a',
                                borderRadius: '4px',
                                fontSize: '14px',
                            }),
                        }}
                    />
                    <p style={{ fontSize: '0.813rem', color: '#6c757d', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Info size={12} />
                        Select the FAQ module this topic belongs to
                    </p>
                </>
            );
        })()}
    </div>
);

interface TopicNameFieldProps {
    id: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    hint: string;
    placeholder: string;
}

const TopicNameField: React.FC<TopicNameFieldProps> = ({ id, value, onChange, hint, placeholder }) => (
    <div style={{ marginBottom: '20px' }}>
        <label
            htmlFor={id}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#141414', marginBottom: '8px' }}
        >
            Topic Name <span style={{ color: '#f2545b' }}>*</span>
            <span title="Enter the name of the FAQ topic" style={{ cursor: 'help', color: '#6c757d' }}>
                <Info size={14} />
            </span>
        </label>
        <input
            id={id}
            type="text"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
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

interface TopicDescriptionFieldProps {
    id: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const TopicDescriptionField: React.FC<TopicDescriptionFieldProps> = ({ id, value, onChange }) => (
    <div style={{ marginBottom: '20px' }}>
        <label
            htmlFor={id}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#141414', marginBottom: '8px' }}
        >
            Description{' '}
            <span title="Enter a description for the FAQ topic" style={{ cursor: 'help', color: '#6c757d' }}>
                <Info size={14} />
            </span>
        </label>
        <textarea
            id={id}
            rows={3}
            value={value}
            onChange={onChange}
            placeholder="Topic Description"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8a8a', borderRadius: '4px', fontSize: '14px', outline: 'none', resize: 'vertical' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#0091ae'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#8a8a8a'; }}
        />
        <p style={{ fontSize: '0.813rem', color: '#6c757d', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Info size={12} />
            Optional description for the FAQ topic
        </p>
    </div>
);

// ---------------------------------------------------------------------------
// FAQTopicSidebar — single sidebar for both Create and Edit
// ---------------------------------------------------------------------------

interface FAQTopicSidebarProps {
    isOpen: boolean;
    config: TopicSidebarConfig;
    name: string;
    description: string;
    moduleId: string;
    moduleOptions: { value: any; label: string }[];
    isLoadingModules: boolean;
    onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onModuleChange: (value: string) => void;
    onSubmit: () => void;
    onClose: () => void;
    isSubmitting?: boolean;
}

const FAQTopicSidebar: React.FC<FAQTopicSidebarProps> = ({
    isOpen,
    config,
    name,
    description,
    moduleId,
    moduleOptions,
    isLoadingModules,
    onNameChange,
    onDescriptionChange,
    onModuleChange,
    onSubmit,
    onClose,
    isSubmitting = false,
}) => {
    if (!isOpen) return null;

    const canSubmit = name.trim() !== '' && moduleId !== '' && !isSubmitting;

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
                        <TopicModuleField
                            moduleOptions={moduleOptions}
                            value={moduleId}
                            onChange={onModuleChange}
                            isLoading={isLoadingModules}
                        />
                        <TopicNameField
                            id={config.nameInputId}
                            value={name}
                            onChange={onNameChange}
                            hint={config.nameHint}
                            placeholder={config.namePlaceholder}
                        />
                        <TopicDescriptionField
                            id={config.descInputId}
                            value={description}
                            onChange={onDescriptionChange}
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
// Table cell renderers
// ---------------------------------------------------------------------------

function renderModuleCell(props: any) {
    if (props.faq_module) {
        return (
            <div>
                <span className="status-badge primary" title={props.faq_module.description || ''}>
                    {props.faq_module.name}
                </span>
            </div>
        );
    }
    return <span className="text-muted">No module</span>;
}

function renderDescriptionCell(props: any) {
    return (
        <div>
            <span className={props.description ? '' : 'text-muted'}>
                {props.description || 'No description'}
            </span>
        </div>
    );
}

function renderFaqsCountCell(props: any) {
    return (
        <div>
            <span className="status-badge primary">{props.faqs_count || 0}</span>
        </div>
    );
}

function buildTopicActionCell(onEdit: (props: any) => void, onDelete: (props: any) => void) {
    return function TopicActionCell(props: any) {
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
// Main page component
// ---------------------------------------------------------------------------

const FAQTopics = () => {
    const [refreshKey, setRefreshKey] = useState<number>(0);

    // Module options (shared between create & edit)
    const [moduleOptions, setModuleOptions] = useState<{ value: any; label: string }[]>([]);
    const [isLoadingModules, setIsLoadingModules] = useState<boolean>(false);

    // Unified sidebar state
    const [showSidebar, setShowSidebar] = useState<boolean>(false);
    const [sidebarMode, setSidebarMode] = useState<'create' | 'edit' | null>(null);
    const [topicName, setTopicName] = useState<string>('');
    const [topicDescription, setTopicDescription] = useState<string>('');
    const [topicModuleId, setTopicModuleId] = useState<string>('');
    const [selectedTopicId, setSelectedTopicId] = useState<any>(null);

    // Delete state
    const [showDeleteTopicModal, setShowDeleteTopicModal] = useState<boolean>(false);
    const [deleteTopicName, setDeleteTopicName] = useState<string>('');

    // Success modal state
    const [showSuccessfulModal, setShowSuccessfulModal] = useState<boolean>(false);
    const [successModalTitle, setSuccessModalTitle] = useState<string>('');
    const [successModalDescription, setSuccessModalDescription] = useState<string>('');

    const triggerRefresh = useCallback(() => setRefreshKey((prev) => prev + 1), []);

    // ---- Module options loader ----
    const fetchModuleOptions = useCallback(async () => {
        if (moduleOptions.length > 0) return;
        setIsLoadingModules(true);
        try {
            const modules = await getAllFAQModules();
            setModuleOptions(modules.map((m: any) => ({ value: m.id, label: m.name })));
        } catch (error) {
            console.error('Error fetching modules:', error);
        } finally {
            setIsLoadingModules(false);
        }
    }, [moduleOptions.length]);

    useEffect(() => {
        if (showSidebar) {
            fetchModuleOptions();
        }
    }, [showSidebar, fetchModuleOptions]);

    // ---- Unified sidebar handlers ----
    const openCreateSidebar = useCallback(() => {
        setSidebarMode('create');
        setTopicName('');
        setTopicDescription('');
        setTopicModuleId('');
        setSelectedTopicId(null);
        setShowSidebar(true);
    }, []);

    const openEditSidebar = useCallback((props: any) => {
        setSidebarMode('edit');
        setSelectedTopicId(props.id);
        setTopicName(props.name);
        setTopicDescription(props.description || '');
        setTopicModuleId(props.faq_module_id?.toString() || '');
        setShowSidebar(true);
    }, []);

    const closeSidebar = useCallback(() => {
        setShowSidebar(false);
        setSidebarMode(null);
        setTopicName('');
        setTopicDescription('');
        setTopicModuleId('');
        setSelectedTopicId(null);
    }, []);

    const handleSubmitTopic = useCallback(async () => {
        if (!topicModuleId || !topicName) return;
        let response;
        if (sidebarMode === 'create') {
            response = await createFAQTopic(Number.parseInt(topicModuleId, 10), topicName, topicDescription);
        } else if (sidebarMode === 'edit') {
            response = await updateFAQTopic(selectedTopicId, Number.parseInt(topicModuleId, 10), topicName, topicDescription);
        }
        if (response) {
            closeSidebar();
            triggerRefresh();
        }
    }, [sidebarMode, topicModuleId, topicName, topicDescription, selectedTopicId, closeSidebar, triggerRefresh]);

    const handleTopicNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setTopicName(e.target.value), []);
    const handleTopicDescChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => setTopicDescription(e.target.value), []);
    const handleTopicModuleChange = useCallback((value: string) => setTopicModuleId(value), []);

    // ---- Delete handlers ----
    const handleDeleteTopic = useCallback((props: any) => {
        setSelectedTopicId(props.id);
        setDeleteTopicName(props.name);
        setShowDeleteTopicModal(true);
    }, []);

    const closeDeleteModal = useCallback(() => {
        setShowDeleteTopicModal(false);
        setSelectedTopicId(null);
        setDeleteTopicName('');
    }, []);

    const handleSubmitDeleteTopic = useCallback(async () => {
        const response = await deleteFAQTopic(selectedTopicId);
        if (response) {
            setSelectedTopicId(null);
            setDeleteTopicName('');
            setShowDeleteTopicModal(false);
            setSuccessModalTitle('FAQ Topic Deleted');
            setSuccessModalDescription('FAQ topic has been deleted successfully');
            setTimeout(() => setShowSuccessfulModal(true), 100);
            triggerRefresh();
        }
    }, [selectedTopicId, triggerRefresh]);

    const closeSuccessModal = useCallback(() => setShowSuccessfulModal(false), []);

    // ---- Data fetching ----
    const fetchTopics = useCallback(
        async (page = 1, perPage = 15, search = '') =>
            ListFAQTopics({ page, perPage, search, filters: {} }),
        [],
    );

    // ---- Columns ----
    const ActionCell = useMemo(
        () => buildTopicActionCell(openEditSidebar, handleDeleteTopic),
        [openEditSidebar, handleDeleteTopic],
    );

    const columns: Column[] = useMemo(() => [
        { key: 'name', name: 'Name', selector: (row: any) => row.name, sortable: true },
        { key: 'faq_module', name: 'Module', selector: (row: any) => row.faq_module?.name || 'N/A', sortable: false, cell: renderModuleCell },
        { key: 'description', name: 'Description', selector: (row: any) => row.description || 'N/A', sortable: false, cell: renderDescriptionCell },
        { key: 'faqs_count', name: 'FAQs Count', selector: (row: any) => row.faqs_count || 0, sortable: true, cell: renderFaqsCountCell },
        { key: 'Action', name: 'Actions', selector: (row: any) => row.id, sortable: false, cell: ActionCell },
    ], [ActionCell]);

    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="FAQs" mainLink="/faqs" subTitle="Topics" />

            <div className="page-header-title style-2 mb-3">
                <div className="d-flex justify-content-end">
                    <Button variant="primary" onClick={openCreateSidebar}>
                        <Plus size={16} className="me-1" />
                        Add Topic
                    </Button>
                </div>
            </div>

            <GenericListPage
                columns={columns}
                fetchData={fetchTopics}
                title="FAQ Topics"
                searchPlaceholder="Search topics..."
                defaultPageSize={15}
                filters={{}}
                refreshKey={refreshKey}
                search={true}
                tableStyle="table-style-2"
            />

            {/* Topic Sidebar */}
            <FAQTopicSidebar
                isOpen={showSidebar}
                config={sidebarMode === 'create' ? CREATE_TOPIC_CONFIG : EDIT_TOPIC_CONFIG}
                name={topicName}
                description={topicDescription}
                moduleId={topicModuleId}
                moduleOptions={moduleOptions}
                isLoadingModules={isLoadingModules}
                onNameChange={handleTopicNameChange}
                onDescriptionChange={handleTopicDescChange}
                onModuleChange={handleTopicModuleChange}
                onSubmit={handleSubmitTopic}
                onClose={closeSidebar}
            />

            {/* Delete Topic Modal */}
            <ConfirmModal
                show={showDeleteTopicModal}
                onHide={closeDeleteModal}
                title="Delete FAQ Topic"
                description="Are you sure you want to delete the following FAQ topic?"
                targetName={deleteTopicName}
                onConfirm={handleSubmitDeleteTopic}
                confirmButtonText="Delete"
                confirmButtonVariant="danger"
                requireTextConfirmation={true}
                requiredConfirmationText="delete"
            />

            {/* Success Modal */}
            <SuccessfulModal
                show={showSuccessfulModal}
                onHide={closeSuccessModal}
                title={successModalTitle}
                description={successModalDescription}
            />
        </React.Fragment>
    );
};

FAQTopics.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default FAQTopics;
