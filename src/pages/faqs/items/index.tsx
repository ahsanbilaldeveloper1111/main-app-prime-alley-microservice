import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import {
  ListFAQItems,
  createFAQItem,
  updateFAQItem,
  deleteFAQItem,
  getAllFAQTopics
} from '@utils/faqs';
import { Column } from '@components/CustomDataTable';
import { Button, Form, Row, Col } from 'react-bootstrap';
import '@assets/scss/common.scss';
import FormModal from "@pages/partial/FormModal";
import SuccessfulModal from '@pages/partial/SuccessfulModal';
import ConfirmModal from '@pages/partial/ConfirmModal';
import { Edit, Info, Trash2, HelpCircle, Plus } from 'lucide-react';
import Select from 'react-select';

// Dynamically import CKEditor only on client side to avoid SSR issues
const CKEditorWrapper = dynamic(
  () => import('@components/CKEditorWrapper'),
  { 
    ssr: false,
    loading: () => (
      <div className="p-3 text-center text-muted" style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Loading editor...
      </div>
    )
  }
);

const FAQItems = () => {
  const columns: Column[] = [
    { key: 'question', name: 'Question', selector: (row: any) => row.question, sortable: true },
    { 
      key: 'topic', 
      name: 'Topic', 
      selector: (row: any) => row.topic?.name || 'N/A', 
      sortable: false,
      cell: (props: any) => (
        <div>
          {props.topic ? (
            <span className="status-badge primary" title={props.topic.description || ''}>
              {props.topic.name}
              {props.topic.faq_module && (
                <span className="text-muted ms-1" style={{ fontSize: '0.85em' }}>
                  ({props.topic.faq_module.name})
                </span>
              )}
            </span>
          ) : (
            <span className="text-muted">No topic</span>
          )}
        </div>
      )
    },
    { 
      key: 'type', 
      name: 'Type', 
      selector: (row: any) => row.type || 'N/A', 
      sortable: true,
      cell: (props: any) => (
        <div>
          {props.type ? (
            <span className="status-badge primary">
              {props.type}
            </span>
          ) : (
            <span className="text-muted">N/A</span>
          )}
        </div>
      )
    },
    { 
      key: 'view_count', 
      name: 'Views', 
      selector: (row: any) => row.view_count || 0, 
      sortable: true,
      cell: (props: any) => (
        <div>
          <span className="status-badge primary">
            {props.view_count || 0}
          </span>
        </div>
      )
    },
    { 
      key: 'created_at', 
      name: 'Created At', 
      selector: (row: any) => row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A', 
      sortable: true 
    },
    // ...(session?.user?.permissions?.includes('edit-faq-items') || session?.user?.permissions?.includes('delete-faq-items') ? [
      {
        key: 'Action',
        name: 'Actions',
        selector: (row: any) => row.id,
        sortable: false,
        cell: (props: any) => (
          <div className="d-flex gap-2">
            {/* {session?.user?.permissions?.includes('edit-faq-items') && ( */}
              <Button variant="light" className="btn-action-style-2 p-1 text-primary" title="Edit" onClick={() => handleEditItem(props)}>
                <Edit size={16} />
              </Button>
            {/* )} */}
            {/* {session?.user?.permissions?.includes('delete-faq-items') && ( */}
              <Button variant="light" className="btn-action-style-2 p-1 text-danger" title="Delete" onClick={() => handleDeleteItem(props)}>
                <Trash2 size={16} />
              </Button>
            {/* )} */}
          </div>
        )
      }
    // ] : [])
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

  const fetchItems = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      return await ListFAQItems({ page, perPage, search, filters: memoizedFilters });
    },
    [memoizedFilters]
  );

  // Item State
  const [showEditItemModal, setShowEditItemModal] = useState<boolean>(false);
  const [showCreateItemModal, setShowCreateItemModal] = useState<boolean>(false);
  const [showDeleteItemModal, setShowDeleteItemModal] = useState<boolean>(false);
  const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState('');
  const [successModalDescription, setSuccessModalDescription] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [itemFormData, setItemFormData] = useState({
    topic_id: '',
    question: '',
    answer: '',
    description: '',
    type: ''
  });
  const [topicOptions, setTopicOptions] = useState<any[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState<boolean>(false);
  const [isCreateModalEntered, setIsCreateModalEntered] = useState<boolean>(false);
  const [isEditModalEntered, setIsEditModalEntered] = useState<boolean>(false);

  useEffect(() => {
    if (showCreateItemModal || showEditItemModal) {
      fetchTopicOptions();
    }
  }, [showCreateItemModal, showEditItemModal]);

  useEffect(() => {
    if (!showCreateItemModal) {
      setIsCreateModalEntered(false);
    }
  }, [showCreateItemModal]);

  useEffect(() => {
    if (!showEditItemModal) {
      setIsEditModalEntered(false);
    }
  }, [showEditItemModal]);

  const fetchTopicOptions = async () => {
    if (topicOptions.length > 0) return;
    setIsLoadingTopics(true);
    try {
      const topics = await getAllFAQTopics();
      setTopicOptions(topics.map((t: any) => ({
        value: t.id,
        label: `${t.name}${t.faq_module ? ` (${t.faq_module.name})` : ''}`
      })));
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setIsLoadingTopics(false);
    }
  };

  const handleEditItem = (props: any) => {
    setSelectedItem(props.id);
    setItemFormData({
      topic_id: props.topic_id?.toString() || '',
      question: props.question || '',
      answer: props.answer || '',
      description: props.description || '',
      type: props.type || ''
    });
    setShowEditItemModal(true);
  };

  const handleSubmitEditItem = async () => {
    if (!itemFormData.topic_id || !itemFormData.question || !itemFormData.answer) {
      return;
    }
    const response = await updateFAQItem(selectedItem, {
      topic_id: Number.parseInt(itemFormData.topic_id, 10),
      question: itemFormData.question,
      answer: itemFormData.answer,
      description: itemFormData.description,
      type: itemFormData.type
    });
    if (response) {
      setSelectedItem(null);
      setItemFormData({
        topic_id: '',
        question: '',
        answer: '',
        description: '',
        type: ''
      });
      setShowEditItemModal(false);
      setRefreshKey(prev => prev + 1);
    }
  };

  const handleDeleteItem = (props: any) => {
    setSelectedItem(props.id);
    setShowDeleteItemModal(true);
  };

  const handleSubmitDeleteItem = async () => {
    const response = await deleteFAQItem(selectedItem);
    if (response) {
      setSelectedItem(null);
      setShowDeleteItemModal(false);
      setSuccessModalTitle('FAQ Deleted');
      setSuccessModalDescription('FAQ has been deleted successfully');
      setTimeout(() => {
        setShowSuccessfulModal(true);
      }, 100);
      setRefreshKey(prev => prev + 1);
    }
  };

  const handleSubmitCreateItem = async () => {
    if (!itemFormData.topic_id || !itemFormData.question || !itemFormData.answer) {
      return;
    }
    const response = await createFAQItem({
      topic_id: Number.parseInt(itemFormData.topic_id, 10),
      question: itemFormData.question,
      answer: itemFormData.answer,
      description: itemFormData.description,
      type: itemFormData.type
    });
    if (response) {
      setItemFormData({
        topic_id: '',
        question: '',
        answer: '',
        description: '',
        type: ''
      });
      setShowCreateItemModal(false);
      setRefreshKey(prev => prev + 1);
    }
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="FAQs" mainLink="/faqs" subTitle="FAQ Items" />
      
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2">
            <Row className="d-flex justify-content-between align-items-center">
              <Col md={4}>
                <h2 className="mb-0">FAQ Items</h2>
              </Col>
              <Col md={8} className="d-flex justify-content-end">
                <div className="action-buttons">
                  {/* {session?.user?.permissions?.includes('add-faq-items') && ( */}
                    <Button variant="primary" onClick={() => setShowCreateItemModal(true)}>
                      <Plus size={16} className="me-1" />
                      Add FAQ
                    </Button>
                  {/* )} */}
                </div>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      <GenericListPage
        columns={columns}
        fetchData={fetchItems}
        title="FAQ Items"
        searchPlaceholder="Search FAQs..."
        defaultPageSize={15}
        filters={memoizedFilters}
        refreshKey={refreshKey}
        search={true}
        tableStyle="table-style-2"
      />

      {/* Edit Item Modal */}
      <FormModal
        show={showEditItemModal}
        onHide={() => {
          setShowEditItemModal(false);
          setSelectedItem(null);
          setItemFormData({
            topic_id: '',
            question: '',
            answer: '',
            description: '',
            type: ''
          });
        }}
        onEntered={() => {
          setIsEditModalEntered(true);
        }}
        onExited={() => {
          setIsEditModalEntered(false);
        }}
        title="Edit FAQ"
        titleIcon={<HelpCircle size={20} className="text-primary" />}
        desc="Please fill in the details below to edit the FAQ."
        formHtml={
          <>
            <div className="form-group mb-3">
              <label htmlFor="editItemTopic" className="fw-semibold d-flex align-items-center gap-2 form-label">
                FAQ Topic <span className="text-danger">*</span>
                <span className="text-muted ms-2" title="Select the FAQ topic">
                  <Info size={14} />
                </span>
              </label>
              <Select
                options={topicOptions}
                value={topicOptions.find(opt => opt.value.toString() === itemFormData.topic_id)}
                onChange={(option: any) => setItemFormData({ ...itemFormData, topic_id: option?.value?.toString() || '' })}
                placeholder="Select topic..."
                isLoading={isLoadingTopics}
                isClearable={false}
              />
              <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                <Info size={12} />
                <span style={{ fontSize: '0.813rem' }}>
                  Select the FAQ topic this item belongs to
                </span>
              </Form.Text>
            </div>
            <div className="form-group mb-3">
              <label htmlFor="editItemQuestion" className="fw-semibold d-flex align-items-center gap-2 form-label">
                Question <span className="text-danger">*</span>
                <span className="text-muted ms-2" title="Enter the question">
                  <Info size={14} />
                </span>
              </label>
              <input 
                className="form-control" 
                type="text" 
                id="editItemQuestion"
                value={itemFormData.question} 
                onChange={(e) => setItemFormData({ ...itemFormData, question: e.target.value })} 
              />
            </div>
            <div className="form-group mb-3">
              <label htmlFor="editItemAnswer" className="fw-semibold d-flex align-items-center gap-2 form-label">
                Answer <span className="text-danger">*</span>
                <span className="text-muted ms-2" title="Enter the answer">
                  <Info size={14} />
                </span>
              </label>
              <div style={{ border: '1px solid #ced4da', borderRadius: '0.375rem' }}>
                {isEditModalEntered && (
                  <CKEditorWrapper
                    key={`edit-${selectedItem}-${showEditItemModal}`}
                    data={itemFormData.answer}
                    onChange={(_event: any, editor: any) => {
                      try {
                        const data = editor.getData();
                        setItemFormData({ ...itemFormData, answer: data });
                      } catch (error) {
                        console.error('Error getting editor data:', error);
                      }
                    }}
                    config={{
                      toolbar: 'undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist | link | removeformat | help'
                    }}
                  />
                )}
              </div>
              <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                <Info size={12} />
                <span style={{ fontSize: '0.813rem' }}>
                  Use the rich text editor to format your answer with headings, lists, and more
                </span>
              </Form.Text>
            </div>
            <div className="form-group mb-3">
              <label htmlFor="editItemDescription" className="fw-semibold d-flex align-items-center gap-2 form-label">
                Description
                <span className="text-muted ms-2" title="Enter an optional description">
                  <Info size={14} />
                </span>
              </label>
              <textarea 
                className="form-control" 
                id="editItemDescription"
                rows={3}
                value={itemFormData.description} 
                onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })} 
              />
            </div>
            <div className="form-group mb-3">
              <label htmlFor="editItemType" className="fw-semibold d-flex align-items-center gap-2 form-label">
                Type
                <span className="text-muted ms-2" title="Enter the FAQ type">
                  <Info size={14} />
                </span>
              </label>
              <input 
                className="form-control" 
                type="text" 
                id="editItemType"
                value={itemFormData.type} 
                onChange={(e) => setItemFormData({ ...itemFormData, type: e.target.value })} 
                placeholder="e.g., general, technical, billing"
              />
            </div>
          </>
        }
        submitButtonText="Update FAQ"
        isSubmitDisabled={!itemFormData.topic_id || !itemFormData.question || !itemFormData.answer}
        cancelButtonText="Cancel"
        onSubmit={handleSubmitEditItem}
        onCancel={() => {
          setShowEditItemModal(false);
          setSelectedItem(null);
          setItemFormData({
            topic_id: '',
            question: '',
            answer: '',
            description: '',
            type: ''
          });
        }}
        size="lg"
      />

      {/* Create Item Modal */}
      <FormModal
        show={showCreateItemModal}
        onHide={() => {
          setShowCreateItemModal(false);
          setItemFormData({
            topic_id: '',
            question: '',
            answer: '',
            description: '',
            type: ''
          });
        }}
        onEntered={() => {
          setIsCreateModalEntered(true);
        }}
        onExited={() => {
          setIsCreateModalEntered(false);
        }}
        title="New FAQ"
        titleIcon={<HelpCircle size={20} className="text-primary" />}
        desc="Please fill in the details below to create a new FAQ."
        formHtml={
          <>
            <div className="form-group mb-3">
              <label htmlFor="newItemTopic" className="fw-semibold d-flex align-items-center gap-2 form-label">
                FAQ Topic <span className="text-danger">*</span>
                <span className="text-muted ms-2" title="Select the FAQ topic">
                  <Info size={14} />
                </span>
              </label>
              <Select
                options={topicOptions}
                value={topicOptions.find(opt => opt.value.toString() === itemFormData.topic_id)}
                onChange={(option: any) => setItemFormData({ ...itemFormData, topic_id: option?.value?.toString() || '' })}
                placeholder="Select topic..."
                isLoading={isLoadingTopics}
                isClearable={false}
              />
              <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                <Info size={12} />
                <span style={{ fontSize: '0.813rem' }}>
                  Select the FAQ topic this item belongs to
                </span>
              </Form.Text>
            </div>
            <div className="form-group mb-3">
              <label htmlFor="newItemQuestion" className="fw-semibold d-flex align-items-center gap-2 form-label">
                Question <span className="text-danger">*</span>
                <span className="text-muted ms-2" title="Enter the question">
                  <Info size={14} />
                </span>
              </label>
              <input 
                className="form-control" 
                type="text" 
                id="newItemQuestion"
                value={itemFormData.question} 
                onChange={(e) => setItemFormData({ ...itemFormData, question: e.target.value })} 
                placeholder="Enter the question"
              />
            </div>
            <div className="form-group mb-3">
              <label htmlFor="newItemAnswer" className="fw-semibold d-flex align-items-center gap-2 form-label">
                Answer <span className="text-danger">*</span>
                <span className="text-muted ms-2" title="Enter the answer">
                  <Info size={14} />
                </span>
              </label>
              <div style={{ border: '1px solid #ced4da', borderRadius: '0.375rem' }}>
                {isCreateModalEntered && (
                  <CKEditorWrapper
                    key={`create-${showCreateItemModal}`}
                    data={itemFormData.answer}
                    onChange={(_event: any, editor: any) => {
                      try {
                        const data = editor.getData();
                        setItemFormData({ ...itemFormData, answer: data });
                      } catch (error) {
                        console.error('Error getting editor data:', error);
                      }
                    }}
                    config={{
                      toolbar: 'undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist | link | removeformat | help'
                    }}
                  />
                )}
              </div>
              <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                <Info size={12} />
                <span style={{ fontSize: '0.813rem' }}>
                  Use the rich text editor to format your answer with headings, lists, and more
                </span>
              </Form.Text>
            </div>
            <div className="form-group mb-3">
              <label htmlFor="newItemDescription" className="fw-semibold d-flex align-items-center gap-2 form-label">
                Description
                <span className="text-muted ms-2" title="Enter an optional description">
                  <Info size={14} />
                </span>
              </label>
              <textarea 
                className="form-control" 
                id="newItemDescription"
                rows={3}
                value={itemFormData.description} 
                onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })} 
                placeholder="Optional description"
              />
            </div>
            <div className="form-group mb-3">
              <label htmlFor="newItemType" className="fw-semibold d-flex align-items-center gap-2 form-label">
                Type
                <span className="text-muted ms-2" title="Enter the FAQ type">
                  <Info size={14} />
                </span>
              </label>
              <input 
                className="form-control" 
                type="text" 
                id="newItemType"
                value={itemFormData.type} 
                onChange={(e) => setItemFormData({ ...itemFormData, type: e.target.value })} 
                placeholder="e.g., general, technical, billing"
              />
            </div>
          </>
        }
        submitButtonText="Add FAQ"
        isSubmitDisabled={!itemFormData.topic_id || !itemFormData.question || !itemFormData.answer}
        cancelButtonText="Cancel"
        onSubmit={handleSubmitCreateItem}
        onCancel={() => {
          setShowCreateItemModal(false);
          setItemFormData({
            topic_id: '',
            question: '',
            answer: '',
            description: '',
            type: ''
          });
        }}
        size="lg"
      />

      {/* Delete Item Modal */}
      <ConfirmModal
        show={showDeleteItemModal}
        onHide={() => {
          setShowDeleteItemModal(false);
          setSelectedItem(null);
        }}
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
        onHide={() => setShowSuccessfulModal(false)}
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

