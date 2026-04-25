import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useCallback, useMemo, useEffect } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { ListFAQItems, createFAQItem, updateFAQItem, deleteFAQItem, getAllFAQTopics } from '@utils/faqs';
import { Column } from '@components/CustomDataTable';
import { Button } from 'react-bootstrap';
import '@assets/scss/common.scss';
import ConfirmModal from '@pages/partial/ConfirmModal';
import SuccessfulModal from '@pages/partial/SuccessfulModal';
import { Edit, Info, Trash2, HelpCircle, Plus, X } from 'lucide-react';
import Select from 'react-select';
import RichTextEditor from '@pages/help-center/partials/RichTextEditor';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FAQItemFormData {
    topic_id: string;
    question: string;
    answer: string;
    description: string;
    type: string;
}

const EMPTY_FORM_DATA: FAQItemFormData = {
    topic_id: '',
    question: '',
    answer: '',
    description: '',
    type: '',
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CREATE_ITEM_CONFIG = {
    title: 'New FAQ',
    questionInputId: 'newItemQuestion',
    descInputId: 'newItemDescription',
    typeInputId: 'newItemType',
    submitLabel: 'Add FAQ',
    submittingLabel: 'Adding...',
    questionPlaceholder: 'Enter the question',
    descPlaceholder: 'Optional description',
    editorKey: (id: any, open: boolean) => `create-${open}`,
} as const;

const EDIT_ITEM_CONFIG = {
    title: 'Edit FAQ',
    questionInputId: 'editItemQuestion',
    descInputId: 'editItemDescription',
    typeInputId: 'editItemType',
    submitLabel: 'Update FAQ',
    submittingLabel: 'Updating...',
    questionPlaceholder: '',
    descPlaceholder: '',
    editorKey: (id: any, open: boolean) => `edit-${id}-${open}`,
} as const;

type FAQItemSidebarConfig = typeof CREATE_ITEM_CONFIG | typeof EDIT_ITEM_CONFIG;

// ---------------------------------------------------------------------------
// Shared field sub-components
// ---------------------------------------------------------------------------

interface ItemTopicFieldProps {
    topicOptions: { value: any; label: string }[];
    value: string;
    onChange: (value: string) => void;
    isLoading: boolean;
}

const ItemTopicField: React.FC<ItemTopicFieldProps> = ({ topicOptions, value, onChange, isLoading }) => (
    <div style={{ marginBottom: '20px' }}>
        {(() => {
            const topicSelectId = "faq-item-topic";
            return (
                <>
                    <label
                        htmlFor={topicSelectId}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#141414', marginBottom: '8px' }}
                    >
                        FAQ Topic <span style={{ color: '#f2545b' }}>*</span>
                        <span title="Select the FAQ topic" style={{ cursor: 'help', color: '#6c757d' }}>
                            <Info size={14} />
                        </span>
                    </label>
                    <Select
                        inputId={topicSelectId}
                        options={topicOptions}
                        value={topicOptions.find((opt) => opt.value.toString() === value) ?? null}
                        onChange={(option: any) => onChange(option?.value?.toString() ?? '')}
                        placeholder="Select topic..."
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
                        Select the FAQ topic this item belongs to
                    </p>
                </>
            );
        })()}
    </div>
);

interface ItemQuestionFieldProps {
    id: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder: string;
}

const ItemQuestionField: React.FC<ItemQuestionFieldProps> = ({ id, value, onChange, placeholder }) => (
    <div style={{ marginBottom: '20px' }}>
        <label
            htmlFor={id}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#141414', marginBottom: '8px' }}
        >
            Question <span style={{ color: '#f2545b' }}>*</span>
            <span title="Enter the question" style={{ cursor: 'help', color: '#6c757d' }}>
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
    </div>
);

interface ItemAnswerFieldProps {
    value: string;
    onChange: (html: string) => void;
    editorKey: string;
}

const ItemAnswerField: React.FC<ItemAnswerFieldProps> = ({ value, onChange, editorKey }) => (
    <div style={{ marginBottom: '20px' }}>
        {(() => {
            // RichTextEditor does not accept id prop, so we remove it to avoid type error
            return (
                <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#141414', marginBottom: '8px' }}>
                        Answer <span style={{ color: '#f2545b' }}>*</span>
                        <span title="Enter the answer" style={{ cursor: 'help', color: '#6c757d' }}>
                            <Info size={14} />
                        </span>
                    </div>
                    <div style={{ border: '1px solid #8a8a8a', borderRadius: '4px' }}>
                        <RichTextEditor
                            key={editorKey}
                            value={value}
                            onChange={onChange}
                            placeholder="Enter the answer..."
                            minHeight="150px"
                        />
                    </div>
                    <p style={{ fontSize: '0.813rem', color: '#6c757d', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Info size={12} />
                        Use the rich text editor to format your answer with headings, lists, and more
                    </p>
                </>
            );
        })()}
    </div>
);

interface ItemDescriptionFieldProps {
    id: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder: string;
}

const ItemDescriptionField: React.FC<ItemDescriptionFieldProps> = ({ id, value, onChange, placeholder }) => (
    <div style={{ marginBottom: '20px' }}>
        <label
            htmlFor={id}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#141414', marginBottom: '8px' }}
        >
            Description{' '}
            <span title="Enter an optional description" style={{ cursor: 'help', color: '#6c757d' }}>
                <Info size={14} />
            </span>
        </label>
        <textarea
            id={id}
            rows={3}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8a8a', borderRadius: '4px', fontSize: '14px', outline: 'none', resize: 'vertical' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#0091ae'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#8a8a8a'; }}
        />
    </div>
);

interface ItemTypeFieldProps {
    id: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ItemTypeField: React.FC<ItemTypeFieldProps> = ({ id, value, onChange }) => (
    <div style={{ marginBottom: '20px' }}>
        <label
            htmlFor={id}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#141414', marginBottom: '8px' }}
        >
            Type{' '}
            <span title="Enter the FAQ type" style={{ cursor: 'help', color: '#6c757d' }}>
                <Info size={14} />
            </span>
        </label>
        <input
            id={id}
            type="text"
            value={value}
            onChange={onChange}
            placeholder="e.g., general, technical, billing"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #8a8a8a', borderRadius: '4px', fontSize: '14px', outline: 'none' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#0091ae'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#8a8a8a'; }}
        />
    </div>
);

// ---------------------------------------------------------------------------
// FAQItemSidebar — single sidebar for both Create and Edit
// ---------------------------------------------------------------------------

interface FAQItemSidebarProps {
    isOpen: boolean;
    config: FAQItemSidebarConfig;
    selectedItemId: any;
    formData: FAQItemFormData;
    topicOptions: { value: any; label: string }[];
    isLoadingTopics: boolean;
    onTopicChange: (value: string) => void;
    onQuestionChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onAnswerChange: (html: string) => void;
    onDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onTypeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: () => void;
    onClose: () => void;
    isSubmitting?: boolean;
}

const FAQItemSidebar: React.FC<FAQItemSidebarProps> = ({
    isOpen,
    config,
    selectedItemId,
    formData,
    topicOptions,
    isLoadingTopics,
    onTopicChange,
    onQuestionChange,
    onAnswerChange,
    onDescriptionChange,
    onTypeChange,
    onSubmit,
    onClose,
    isSubmitting = false,
}) => {
    if (!isOpen) return null;

    const canSubmit = formData.topic_id !== '' && formData.question.trim() !== '' && formData.answer.trim() !== '' && !isSubmitting;

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
                        <HelpCircle size={20} style={{ color: '#0091ae' }} />
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
                        <ItemTopicField
                            topicOptions={topicOptions}
                            value={formData.topic_id}
                            onChange={onTopicChange}
                            isLoading={isLoadingTopics}
                        />
                        <ItemQuestionField
                            id={config.questionInputId}
                            value={formData.question}
                            onChange={onQuestionChange}
                            placeholder={config.questionPlaceholder}
                        />
                        <ItemAnswerField
                            value={formData.answer}
                            onChange={onAnswerChange}
                            editorKey={config.editorKey(selectedItemId, isOpen)}
                        />
                        <ItemDescriptionField
                            id={config.descInputId}
                            value={formData.description}
                            onChange={onDescriptionChange}
                            placeholder={config.descPlaceholder}
                        />
                        <ItemTypeField
                            id={config.typeInputId}
                            value={formData.type}
                            onChange={onTypeChange}
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

function renderTopicCell(props: any) {
    if (!props.topic) return <span className="text-muted">No topic</span>;
    return (
        <div>
            <span className="status-badge primary" title={props.topic.description || ''}>
                {props.topic.name}
                {props.topic.faq_module && (
                    <span className="text-muted ms-1" style={{ fontSize: '0.85em' }}>
                        ({props.topic.faq_module.name})
                    </span>
                )}
            </span>
        </div>
    );
}

function renderTypeCell(props: any) {
    if (!props.type) return <span className="text-muted">N/A</span>;
    return <span className="status-badge primary">{props.type}</span>;
}

function renderViewCountCell(props: any) {
    return <span className="status-badge primary">{props.view_count || 0}</span>;
}

function renderCreatedAtCell(props: any) {
    return <span>{props.created_at ? new Date(props.created_at).toLocaleDateString() : 'N/A'}</span>;
}

function buildItemActionCell(onEdit: (props: any) => void, onDelete: (props: any) => void) {
    return function ItemActionCell(props: any) {
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

const FAQItems = () => {
    const [refreshKey, setRefreshKey] = useState<number>(0);

    // Shared form data (one object for both create & edit — sidebar only shows one at a time)
    const [formData, setFormData] = useState<FAQItemFormData>(EMPTY_FORM_DATA);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    // Sidebar visibility
    const [showCreateSidebar, setShowCreateSidebar] = useState<boolean>(false);
    const [showEditSidebar, setShowEditSidebar] = useState<boolean>(false);

    // Delete state
    const [showDeleteItemModal, setShowDeleteItemModal] = useState<boolean>(false);

    // Success modal
    const [showSuccessfulModal, setShowSuccessfulModal] = useState<boolean>(false);
    const [successModalTitle, setSuccessModalTitle] = useState<string>('');
    const [successModalDescription, setSuccessModalDescription] = useState<string>('');

    // Topic options
    const [topicOptions, setTopicOptions] = useState<{ value: any; label: string }[]>([]);
    const [isLoadingTopics, setIsLoadingTopics] = useState<boolean>(false);

    const triggerRefresh = useCallback(() => setRefreshKey((prev) => prev + 1), []);

    // ---- Topic options loader ----
    const fetchTopicOptions = useCallback(async () => {
        if (topicOptions.length > 0) return;
        setIsLoadingTopics(true);
        try {
            const topics = await getAllFAQTopics();
            setTopicOptions(topics.map((t: any) => {
                let label = t.name;
                if (t.faq_module) {
                    label += ' (' + String(t.faq_module.name) + ')';
                }
                return {
                    value: t.id,
                    label,
                };
            }));
        } catch (error) {
            console.error('Error fetching topics:', error);
        } finally {
            setIsLoadingTopics(false);
        }
    }, [topicOptions.length]);

    useEffect(() => {
        if (showCreateSidebar || showEditSidebar) {
            fetchTopicOptions();
        }
    }, [showCreateSidebar, showEditSidebar, fetchTopicOptions]);

    // ---- Shared form field handlers ----
    const handleTopicChange = useCallback((value: string) => setFormData((prev) => ({ ...prev, topic_id: value })), []);
    const handleQuestionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, question: e.target.value })), []);
    const handleAnswerChange = useCallback((html: string) => setFormData((prev) => ({ ...prev, answer: html })), []);
    const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData((prev) => ({ ...prev, description: e.target.value })), []);
    const handleTypeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, type: e.target.value })), []);

    // ---- Create handlers ----
    const openCreateSidebar = useCallback(() => {
        setFormData(EMPTY_FORM_DATA);
        setShowCreateSidebar(true);
    }, []);

    const closeCreateSidebar = useCallback(() => {
        setShowCreateSidebar(false);
        setFormData(EMPTY_FORM_DATA);
    }, []);

    const handleSubmitCreateItem = useCallback(async () => {
        if (!formData.topic_id || !formData.question || !formData.answer) return;
        const response = await createFAQItem({
            topic_id: Number.parseInt(formData.topic_id, 10),
            question: formData.question,
            answer: formData.answer,
            description: formData.description,
            type: formData.type,
        });
        if (response) {
            closeCreateSidebar();
            triggerRefresh();
        }
    }, [formData, closeCreateSidebar, triggerRefresh]);

    // ---- Edit handlers ----
    const handleEditItem = useCallback((props: any) => {
        setSelectedItem(props.id);
        setFormData({
            topic_id: props.topic_id?.toString() || '',
            question: props.question || '',
            answer: props.answer || '',
            description: props.description || '',
            type: props.type || '',
        });
        setShowEditSidebar(true);
    }, []);

    const closeEditSidebar = useCallback(() => {
        setShowEditSidebar(false);
        setSelectedItem(null);
        setFormData(EMPTY_FORM_DATA);
    }, []);

    const handleSubmitEditItem = useCallback(async () => {
        if (!formData.topic_id || !formData.question || !formData.answer) return;
        const response = await updateFAQItem(selectedItem, {
            topic_id: Number.parseInt(formData.topic_id, 10),
            question: formData.question,
            answer: formData.answer,
            description: formData.description,
            type: formData.type,
        });
        if (response) {
            closeEditSidebar();
            triggerRefresh();
        }
    }, [selectedItem, formData, closeEditSidebar, triggerRefresh]);

    // ---- Delete handlers ----
    const handleDeleteItem = useCallback((props: any) => {
        setSelectedItem(props.id);
        setShowDeleteItemModal(true);
    }, []);

    const closeDeleteModal = useCallback(() => {
        setShowDeleteItemModal(false);
        setSelectedItem(null);
    }, []);

    const handleSubmitDeleteItem = useCallback(async () => {
        const response = await deleteFAQItem(selectedItem);
        if (response) {
            setSelectedItem(null);
            setShowDeleteItemModal(false);
            setSuccessModalTitle('FAQ Deleted');
            setSuccessModalDescription('FAQ has been deleted successfully');
            setTimeout(() => setShowSuccessfulModal(true), 100);
            triggerRefresh();
        }
    }, [selectedItem, triggerRefresh]);

    const closeSuccessModal = useCallback(() => setShowSuccessfulModal(false), []);

    // ---- Data fetching ----
    const fetchItems = useCallback(
        async (page = 1, perPage = 15, search = '') =>
            ListFAQItems({ page, perPage, search, filters: {} }),
        [],
    );

    // ---- Columns ----
    const ActionCell = useMemo(
        () => buildItemActionCell(handleEditItem, handleDeleteItem),
        [handleEditItem, handleDeleteItem],
    );

    const columns: Column[] = useMemo(() => [
        { key: 'question', name: 'Question', selector: (row: any) => row.question, sortable: true },
        { key: 'topic', name: 'Topic', selector: (row: any) => row.topic?.name || 'N/A', sortable: false, cell: renderTopicCell },
        { key: 'type', name: 'Type', selector: (row: any) => row.type || 'N/A', sortable: true, cell: renderTypeCell },
        { key: 'view_count', name: 'Views', selector: (row: any) => row.view_count || 0, sortable: true, cell: renderViewCountCell },
        { key: 'created_at', name: 'Created At', selector: (row: any) => row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A', sortable: true, cell: renderCreatedAtCell },
        { key: 'Action', name: 'Actions', selector: (row: any) => row.id, sortable: false, cell: ActionCell },
    ], [ActionCell]);

    return (
        <React.Fragment>
            <BreadcrumbItem mainTitle="FAQs" mainLink="/faqs" subTitle="FAQ Items" />

            <div className="page-header-title style-2 mb-3">
                <div className="d-flex justify-content-end">
                    <Button variant="primary" onClick={openCreateSidebar}>
                        <Plus size={16} className="me-1" />
                        Add FAQ
                    </Button>
                </div>
            </div>

            <GenericListPage
                columns={columns}
                fetchData={fetchItems}
                title="FAQ Items"
                searchPlaceholder="Search FAQs..."
                defaultPageSize={15}
                filters={{}}
                refreshKey={refreshKey}
                search={true}
                tableStyle="table-style-2"
            />

            {/* Create FAQ Sidebar */}
            <FAQItemSidebar
                isOpen={showCreateSidebar}
                config={CREATE_ITEM_CONFIG}
                selectedItemId={null}
                formData={formData}
                topicOptions={topicOptions}
                isLoadingTopics={isLoadingTopics}
                onTopicChange={handleTopicChange}
                onQuestionChange={handleQuestionChange}
                onAnswerChange={handleAnswerChange}
                onDescriptionChange={handleDescriptionChange}
                onTypeChange={handleTypeChange}
                onSubmit={handleSubmitCreateItem}
                onClose={closeCreateSidebar}
            />

            {/* Edit FAQ Sidebar */}
            <FAQItemSidebar
                isOpen={showEditSidebar}
                config={EDIT_ITEM_CONFIG}
                selectedItemId={selectedItem}
                formData={formData}
                topicOptions={topicOptions}
                isLoadingTopics={isLoadingTopics}
                onTopicChange={handleTopicChange}
                onQuestionChange={handleQuestionChange}
                onAnswerChange={handleAnswerChange}
                onDescriptionChange={handleDescriptionChange}
                onTypeChange={handleTypeChange}
                onSubmit={handleSubmitEditItem}
                onClose={closeEditSidebar}
            />

            {/* Delete FAQ Modal */}
            <ConfirmModal
                show={showDeleteItemModal}
                onHide={closeDeleteModal}
                title="Delete FAQ"
                description="Are you sure you want to delete this FAQ?"
                targetName="this FAQ"
                onConfirm={handleSubmitDeleteItem}
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

FAQItems.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default FAQItems;
