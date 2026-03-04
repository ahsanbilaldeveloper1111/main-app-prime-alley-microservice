import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import {
  ListFAQTopics,
  createFAQTopic,
  updateFAQTopic,
  deleteFAQTopic,
  getAllFAQModules
} from '@utils/faqs';
import { Column } from '@components/CustomDataTable';
import { Button, Form, Row, Col } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import '@assets/scss/common.scss';
import FormModal from "@pages/partial/FormModal";
import SuccessfulModal from '@pages/partial/SuccessfulModal';
import ConfirmModal from '@pages/partial/ConfirmModal';
import { Edit, Info, Trash2, Tag, Plus } from 'lucide-react';
import Select from 'react-select';

const FAQTopics = () => {
  const { data: session } = useSession();
  
  const columns: Column[] = [
    { key: 'name', name: 'Name', selector: (row: any) => row.name, sortable: true },
    { 
      key: 'faq_module', 
      name: 'Module', 
      selector: (row: any) => row.faq_module?.name || 'N/A', 
      sortable: false,
      cell: (props: any) => (
        <div>
          {props.faq_module ? (
            <span className="status-badge primary" title={props.faq_module.description || ''}>
              {props.faq_module.name}
            </span>
          ) : (
            <span className="text-muted">No module</span>
          )}
        </div>
      )
    },
    { 
      key: 'description', 
      name: 'Description', 
      selector: (row: any) => row.description || 'N/A', 
      sortable: false,
      cell: (props: any) => (
        <div>
          <span className={props.description ? '' : 'text-muted'}>
            {props.description || 'No description'}
          </span>
        </div>
      )
    },
    { 
      key: 'faqs_count', 
      name: 'FAQs Count', 
      selector: (row: any) => row.faqs_count || 0, 
      sortable: true,
      cell: (props: any) => (
        <div>
          <span className="status-badge primary">
            {props.faqs_count || 0}
          </span>
        </div>
      )
    },
    {
      key: 'Action',
      name: 'Actions',
      selector: (row: any) => row.id,
      sortable: false,
      cell: (props: any) => (
        <div className="d-flex gap-2">
          <Button variant="light" className="btn-action-style-2 p-1 text-primary" title="Edit" onClick={() => handleEditTopic(props)}>
            <Edit size={16} />
          </Button>
          <Button variant="light" className="btn-action-style-2 p-1 text-danger" title="Delete" onClick={() => handleDeleteTopic(props)}>
            <Trash2 size={16} />
          </Button>
        </div>
      )
    }
  ];

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters] = useState({});

  // Memoize filters to prevent unnecessary re-renders
  const prevFiltersStringRef = useRef<string>('');
  const prevFiltersRef = useRef<any>({});
  
  const memoizedFilters = useMemo(() => {
    const filtersString = JSON.stringify(currentFilters || {});
    if (filtersString !== prevFiltersStringRef.current) {
      prevFiltersStringRef.current = filtersString;
      prevFiltersRef.current = currentFilters || {};
      return currentFilters || {};
    }
    return prevFiltersRef.current;
  }, [currentFilters]);

  const fetchTopics = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      return await ListFAQTopics({ page, perPage, search, filters: memoizedFilters });
    },
    [memoizedFilters]
  );

  // Topic State
  const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState('');
  const [successModalDescription, setSuccessModalDescription] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [selectedTopicName, setSelectedTopicName] = useState<string>('');
  const [selectedTopicDescription, setSelectedTopicDescription] = useState<string>('');
  const [selectedTopicModuleId, setSelectedTopicModuleId] = useState<string>('');
  const [showEditTopicModal, setShowEditTopicModal] = useState<boolean>(false);
  const [showCreateTopicModal, setShowCreateTopicModal] = useState<boolean>(false);
  const [newTopicName, setNewTopicName] = useState<string>('');
  const [newTopicDescription, setNewTopicDescription] = useState<string>('');
  const [newTopicModuleId, setNewTopicModuleId] = useState<string>('');
  const [showDeleteTopicModal, setShowDeleteTopicModal] = useState<boolean>(false);
  const [moduleOptions, setModuleOptions] = useState<any[]>([]);
  const [isLoadingModules, setIsLoadingModules] = useState<boolean>(false);

  useEffect(() => {
    if (showCreateTopicModal || showEditTopicModal) {
      fetchModuleOptions();
    }
  }, [showCreateTopicModal, showEditTopicModal]);

  const fetchModuleOptions = async () => {
    if (moduleOptions.length > 0) return;
    setIsLoadingModules(true);
    try {
      const modules = await getAllFAQModules();
      setModuleOptions(modules.map((m: any) => ({
        value: m.id,
        label: m.name
      })));
    } catch (error) {
      console.error('Error fetching modules:', error);
    } finally {
      setIsLoadingModules(false);
    }
  };

  const handleEditTopic = (props: any) => {
    setSelectedTopic(props.id);
    setSelectedTopicName(props.name);
    setSelectedTopicDescription(props.description || '');
    setSelectedTopicModuleId(props.faq_module_id?.toString() || '');
    setShowEditTopicModal(true);
  };

  const handleSubmitEditTopic = async () => {
    if (!selectedTopicModuleId || !selectedTopicName) {
      return;
    }
    const response = await updateFAQTopic(
      selectedTopic,
      Number.parseInt(selectedTopicModuleId, 10),
      selectedTopicName,
      selectedTopicDescription
    );
    if (response) {
      setSelectedTopic(null);
      setSelectedTopicName('');
      setSelectedTopicDescription('');
      setSelectedTopicModuleId('');
      setShowEditTopicModal(false);
      setRefreshKey(prev => prev + 1);
    }
  };

  const handleDeleteTopic = (props: any) => {
    setSelectedTopic(props.id);
    setSelectedTopicName(props.name);
    setShowDeleteTopicModal(true);
  };

  const handleSubmitDeleteTopic = async () => {
    const response = await deleteFAQTopic(selectedTopic);
    if (response) {
      setSelectedTopic(null);
      setSelectedTopicName('');
      setShowDeleteTopicModal(false);
      setSuccessModalTitle('FAQ Topic Deleted');
      setSuccessModalDescription('FAQ topic has been deleted successfully');
      setTimeout(() => {
        setShowSuccessfulModal(true);
      }, 100);
      setRefreshKey(prev => prev + 1);
    }
  };

  const handleSubmitCreateTopic = async () => {
    if (!newTopicModuleId || !newTopicName) {
      return;
    }
    const response = await createFAQTopic(
      Number.parseInt(newTopicModuleId, 10),
      newTopicName,
      newTopicDescription
    );
    if (response) {
      setNewTopicName('');
      setNewTopicDescription('');
      setNewTopicModuleId('');
      setShowCreateTopicModal(false);
      setRefreshKey(prev => prev + 1);
    }
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="FAQs" mainLink="/faqs" subTitle="Topics" />
      
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2">
            <Row className="d-flex justify-content-between align-items-center">
              <Col md={4}>
                {/* <h2 className="mb-0">FAQ Topics</h2> */}
              </Col>
              <Col md={8} className="d-flex justify-content-end">
                <div className="action-buttons">
                  <Button variant="primary" onClick={() => setShowCreateTopicModal(true)}>
                    <Plus size={16} className="me-1" />
                    Add Topic
                  </Button>
                </div>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      <GenericListPage
        columns={columns}
        fetchData={fetchTopics}
        title="FAQ Topics"
        searchPlaceholder="Search topics..."
        defaultPageSize={15}
        filters={memoizedFilters}
        refreshKey={refreshKey}
        search={true}
        tableStyle="table-style-2"
      />

      {/* Edit Topic Modal */}
      <FormModal
        show={showEditTopicModal}
        onHide={() => {
          setShowEditTopicModal(false);
          setSelectedTopic(null);
          setSelectedTopicName('');
          setSelectedTopicDescription('');
          setSelectedTopicModuleId('');
        }}
        title="Edit FAQ Topic"
        titleIcon={<Tag size={20} className="text-primary" />}
        desc="Please fill in the details below to edit the FAQ topic."
        formHtml={
          <>
            <div className="form-group mb-3">
              <label htmlFor="editTopicModule" className="fw-semibold d-flex align-items-center gap-2 form-label">
                FAQ Module <span className="text-danger">*</span>
                <span className="text-muted ms-2" title="Select the FAQ module">
                  <Info size={14} />
                </span>
              </label>
              <Select
                options={moduleOptions}
                value={moduleOptions.find(opt => opt.value.toString() === selectedTopicModuleId)}
                onChange={(option: any) => setSelectedTopicModuleId(option?.value?.toString() || '')}
                placeholder="Select module..."
                isLoading={isLoadingModules}
                isClearable={false}
              />
              <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                <Info size={12} />
                <span style={{ fontSize: '0.813rem' }}>
                  Select the FAQ module this topic belongs to
                </span>
              </Form.Text>
            </div>
            <div className="form-group mb-3">
              <label htmlFor="editTopicName" className="fw-semibold d-flex align-items-center gap-2 form-label">
                Topic Name <span className="text-danger">*</span>
                <span className="text-muted ms-2" title="Enter the name of the FAQ topic">
                  <Info size={14} />
                </span>
              </label>
              <input 
                className="form-control" 
                type="text" 
                id="editTopicName"
                value={selectedTopicName} 
                onChange={(e) => setSelectedTopicName(e.target.value)} 
              />
              <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                <Info size={12} />
                <span style={{ fontSize: '0.813rem' }}>
                  Change the name of the FAQ topic
                </span>
              </Form.Text>
            </div>
            <div className="form-group mb-3">
              <label htmlFor="editTopicDescription" className="fw-semibold d-flex align-items-center gap-2 form-label">
                Description
                <span className="text-muted ms-2" title="Enter a description for the FAQ topic">
                  <Info size={14} />
                </span>
              </label>
              <textarea 
                className="form-control" 
                id="editTopicDescription"
                rows={3}
                value={selectedTopicDescription} 
                onChange={(e) => setSelectedTopicDescription(e.target.value)} 
              />
              <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                <Info size={12} />
                <span style={{ fontSize: '0.813rem' }}>
                  Optional description for the FAQ topic
                </span>
              </Form.Text>
            </div>
          </>
        }
        submitButtonText="Update Topic"
        isSubmitDisabled={!selectedTopicModuleId || !selectedTopicName}
        cancelButtonText="Cancel"
        onSubmit={handleSubmitEditTopic}
        onCancel={() => {
          setShowEditTopicModal(false);
          setSelectedTopic(null);
          setSelectedTopicName('');
          setSelectedTopicDescription('');
          setSelectedTopicModuleId('');
        }}
      />

      {/* Create Topic Modal */}
      <FormModal
        show={showCreateTopicModal}
        onHide={() => {
          setShowCreateTopicModal(false);
          setNewTopicName('');
          setNewTopicDescription('');
          setNewTopicModuleId('');
        }}
        title="New FAQ Topic"
        titleIcon={<Tag size={20} className="text-primary" />}
        desc="Please fill in the details below to create a new FAQ topic."
        formHtml={
          <>
            <div className="form-group mb-3">
              <label htmlFor="newTopicModule" className="fw-semibold d-flex align-items-center gap-2 form-label">
                FAQ Module <span className="text-danger">*</span>
                <span className="text-muted ms-2" title="Select the FAQ module">
                  <Info size={14} />
                </span>
              </label>
              <Select
                options={moduleOptions}
                value={moduleOptions.find(opt => opt.value.toString() === newTopicModuleId)}
                onChange={(option: any) => setNewTopicModuleId(option?.value?.toString() || '')}
                placeholder="Select module..."
                isLoading={isLoadingModules}
                isClearable={false}
              />
              <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                <Info size={12} />
                <span style={{ fontSize: '0.813rem' }}>
                  Select the FAQ module this topic belongs to
                </span>
              </Form.Text>
            </div>
            <div className="form-group mb-3">
              <label htmlFor="newTopicName" className="fw-semibold d-flex align-items-center gap-2 form-label">
                Topic Name <span className="text-danger">*</span>
                <span className="text-muted ms-2" title="Enter the name of the FAQ topic">
                  <Info size={14} />
                </span>
              </label>
              <input 
                type="text" 
                className="form-control" 
                id="newTopicName"
                value={newTopicName} 
                onChange={(e) => setNewTopicName(e.target.value)} 
                placeholder="Topic Name" 
              />
              <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                <Info size={12} />
                <span style={{ fontSize: '0.813rem' }}>
                  Enter the name of the FAQ topic you want to create
                </span>
              </Form.Text>
            </div>
            <div className="form-group mb-3">
              <label htmlFor="newTopicDescription" className="fw-semibold d-flex align-items-center gap-2 form-label">
                Description
                <span className="text-muted ms-2" title="Enter a description for the FAQ topic">
                  <Info size={14} />
                </span>
              </label>
              <textarea 
                className="form-control" 
                id="newTopicDescription"
                rows={3}
                value={newTopicDescription} 
                onChange={(e) => setNewTopicDescription(e.target.value)} 
                placeholder="Topic Description"
              />
              <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                <Info size={12} />
                <span style={{ fontSize: '0.813rem' }}>
                  Optional description for the FAQ topic
                </span>
              </Form.Text>
            </div>
          </>
        }
        submitButtonText="Add Topic"
        isSubmitDisabled={!newTopicModuleId || !newTopicName}
        cancelButtonText="Cancel"
        onSubmit={handleSubmitCreateTopic}
        onCancel={() => {
          setShowCreateTopicModal(false);
          setNewTopicName('');
          setNewTopicDescription('');
          setNewTopicModuleId('');
        }}
      />

      {/* Delete Topic Modal */}
      <ConfirmModal
        show={showDeleteTopicModal}
        onHide={() => {
          setShowDeleteTopicModal(false);
          setSelectedTopic(null);
          setSelectedTopicName('');
        }}
        title="Delete FAQ Topic"
        description="Are you sure you want to delete the following FAQ topic?"
        targetName={selectedTopicName}
        onConfirm={handleSubmitDeleteTopic}
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
    </React.Fragment>
  );
};

FAQTopics.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default FAQTopics;

