import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useCallback, useMemo } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { ListFAQTopics, createFAQTopic, updateFAQTopic, deleteFAQTopic, getAllFAQModules } from '@utils/faqs';
import { Column } from '@components/CustomDataTable';
import { Button } from 'react-bootstrap';
import '@assets/scss/common.scss';
import ConfirmModal from '@pages/partial/ConfirmModal';
import SuccessfulModal from '@pages/partial/SuccessfulModal';
import { Tag, Plus } from 'lucide-react';
import { FaqFormSidebar } from '@components/faqFormSidebar';
import { FaqLabeledSelect, FaqLabeledTextInput, FaqLabeledTextarea } from '@components/faqFormFields';
import { createFaqEditDeleteActionCell, renderFaqDescriptionCell, renderFaqModuleCell, renderFaqCountCell } from '@components/faqTableCells';
import { useLoadWhenOpen } from '@components/useLoadWhenOpen';

// ===== FAQ Topics Page =====
// Uses shared FAQ components to eliminate duplication with other FAQ modules/items pages



// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

const FAQTopics = () => {
    const [refreshKey, setRefreshKey] = useState<number>(0);

    // Shared state
    const [showSidebar, setShowSidebar] = useState<boolean>(false);
    const [sidebarMode, setSidebarMode] = useState<'create' | 'edit' | null>(null);
    const [moduleOptions, setModuleOptions] = useState<{ value: any; label: string }[]>([]);
    const [isLoadingModules, setIsLoadingModules] = useState<boolean>(false);
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
        setIsLoadingModules(true);
        try {
            const modules = await getAllFAQModules();
            setModuleOptions(modules.map((m: any) => ({ value: m.id, label: m.name })));
        } catch (error) {
            console.error('Error fetching modules:', error);
        } finally {
            setIsLoadingModules(false);
        }
    }, []);

    useLoadWhenOpen(showSidebar, moduleOptions.length > 0, fetchModuleOptions);

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
        () => createFaqEditDeleteActionCell(openEditSidebar, handleDeleteTopic),
        [openEditSidebar, handleDeleteTopic],
    );

    const columns: Column[] = useMemo(() => [
        { key: 'name', name: 'Name', selector: (row: any) => row.name, sortable: true },
        { key: 'faq_module', name: 'Module', selector: (row: any) => row.faq_module?.name || 'N/A', sortable: false, cell: renderFaqModuleCell },
        { key: 'description', name: 'Description', selector: (row: any) => row.description || 'N/A', sortable: false, cell: renderFaqDescriptionCell },
        { key: 'faqs_count', name: 'FAQs Count', selector: (row: any) => row.faqs_count || 0, sortable: true, cell: renderFaqCountCell },
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
            <FaqFormSidebar
                isOpen={showSidebar}
                title={sidebarMode === 'create' ? 'New FAQ Topic' : 'Edit FAQ Topic'}
                headerIcon={<Tag size={20} style={{ color: '#0091ae' }} />}
                canSubmit={topicName.trim() !== '' && topicModuleId !== ''}
                isSubmitting={false}
                submitLabel={sidebarMode === 'create' ? 'Add Topic' : 'Update Topic'}
                submittingLabel={sidebarMode === 'create' ? 'Adding...' : 'Updating...'}
                onSubmit={handleSubmitTopic}
                onClose={closeSidebar}
            >
                <FaqLabeledSelect
                    inputId="faq-topic-module"
                    label="FAQ Module"
                    options={moduleOptions}
                    value={topicModuleId}
                    onChange={handleTopicModuleChange}
                    required
                    helpTitle="Select the FAQ module"
                    hint="Select the FAQ module this topic belongs to"
                    placeholder="Select module..."
                    isLoading={isLoadingModules}
                />
                <FaqLabeledTextInput
                    id={sidebarMode === 'create' ? 'newTopicName' : 'editTopicName'}
                    label="Topic Name"
                    value={topicName}
                    onChange={handleTopicNameChange}
                    required
                    helpTitle="Enter the name of the FAQ topic"
                    hint={sidebarMode === 'create' ? 'Enter the name of the FAQ topic you want to create' : 'Change the name of the FAQ topic'}
                    placeholder={sidebarMode === 'create' ? 'Topic Name' : ''}
                />
                <FaqLabeledTextarea
                    id={sidebarMode === 'create' ? 'newTopicDescription' : 'editTopicDescription'}
                    label="Description"
                    value={topicDescription}
                    onChange={handleTopicDescChange}
                    helpTitle="Enter a description for the FAQ topic"
                    hint="Optional description for the FAQ topic"
                    placeholder="Topic Description"
                />
            </FaqFormSidebar>

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
