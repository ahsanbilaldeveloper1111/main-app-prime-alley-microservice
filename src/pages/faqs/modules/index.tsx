import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useCallback, useMemo, useRef } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import {
  ListFAQModules,
  createFAQModule,
  updateFAQModule,
  deleteFAQModule
} from '@utils/faqs';
import { useRouter } from 'next/router';
import { Column } from '@components/CustomDataTable';
import { Button, Form, Row, Col } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import '@assets/scss/common.scss';
import FormModal from "@pages/partial/FormModal";
import SuccessfulModal from '@pages/partial/SuccessfulModal';
import ConfirmModal from '@pages/partial/ConfirmModal';
import { Edit, Info, Trash2, Layers, Plus, ArrowLeft } from 'lucide-react';

const FAQModules = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const columns: Column[] = [
    { key: 'name', name: 'Name', selector: (row: any) => row.name, sortable: true },
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
    // { 
    //   key: 'created_at', 
    //   name: 'Created At', 
    //   selector: (row: any) => row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A', 
    //   sortable: true 
    // },
    
    // ...(session?.user?.permissions?.includes('edit-faq-modules') || session?.user?.permissions?.includes('delete-faq-modules') ? [
      {
        key: 'Action',
        name: 'Actions',
        selector: (row: any) => row.id,
        sortable: false,
        cell: (props: any) => (
          <div className="d-flex gap-2">
            {/* {session?.user?.permissions?.includes('edit-faq-modules') && ( */}
              <Button variant="light" className="btn-action-style-2 p-1 text-primary" title="Edit" onClick={() => handleEditModule(props)}>
                <Edit size={16} />
              </Button>
            {/* )} */}
            {/* {session?.user?.permissions?.includes('delete-faq-modules') && ( */}
              <Button variant="light" className="btn-action-style-2 p-1 text-danger" title="Delete" onClick={() => handleDeleteModule(props)}>
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

  const fetchModules = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      return await ListFAQModules({ page, perPage, search, filters: memoizedFilters });
    },
    [memoizedFilters]
  );

  // Module State
  const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState('');
  const [successModalDescription, setSuccessModalDescription] = useState('');
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [selectedModuleName, setSelectedModuleName] = useState<string>('');
  const [selectedModuleDescription, setSelectedModuleDescription] = useState<string>('');
  const [selectedModuleIcon, setSelectedModuleIcon] = useState<string>('');
  const [showEditModuleModal, setShowEditModuleModal] = useState<boolean>(false);
  const [showCreateModuleModal, setShowCreateModuleModal] = useState<boolean>(false);
  const [newModuleName, setNewModuleName] = useState<string>('');
  const [newModuleDescription, setNewModuleDescription] = useState<string>('');
  const [newModuleIcon, setNewModuleIcon] = useState<string>('');
  const [showDeleteModuleModal, setShowDeleteModuleModal] = useState<boolean>(false);

  const handleEditModule = (props: any) => {
    setSelectedModule(props.id);
    setSelectedModuleName(props.name);
    setSelectedModuleDescription(props.description || '');
    setSelectedModuleIcon(props.icon || '');
    setShowEditModuleModal(true);
  };

  const handleSubmitEditModule = async () => {
    const response = await updateFAQModule(selectedModule, selectedModuleName, selectedModuleDescription, selectedModuleIcon);
    if (response) {
      setSelectedModule(null);
      setSelectedModuleName('');
      setSelectedModuleDescription('');
      setSelectedModuleIcon('');
      setShowEditModuleModal(false);
      setRefreshKey(prev => prev + 1);
    }
  };

  const handleDeleteModule = (props: any) => {
    setSelectedModule(props.id);
    setSelectedModuleName(props.name);
    setShowDeleteModuleModal(true);
  };

  const handleSubmitDeleteModule = async () => {
    const response = await deleteFAQModule(selectedModule);
    if (response) {
      setSelectedModule(null);
      setSelectedModuleName('');
      setShowDeleteModuleModal(false);
      setSuccessModalTitle('FAQ Module Deleted');
      setSuccessModalDescription('FAQ module has been deleted successfully');
      setTimeout(() => {
        setShowSuccessfulModal(true);
      }, 100);
      setRefreshKey(prev => prev + 1);
    }
  };

  const handleSubmitCreateModule = async () => {
    const response = await createFAQModule(newModuleName, newModuleDescription, newModuleIcon);
    if (response) {
      setNewModuleName('');
      setNewModuleDescription('');
      setNewModuleIcon('');
      setShowCreateModuleModal(false);
      setRefreshKey(prev => prev + 1);
    }
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="FAQs" mainLink="/faqs" subTitle="Modules" />
      
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2">
            <Row className="d-flex justify-content-between align-items-center">
              <Col md={4}>
                <h2 className="mb-0">FAQ Modules</h2>
              </Col>
              <Col md={8} className="d-flex justify-content-end">
                <div className="action-buttons">

                

                  {/* {session?.user?.permissions?.includes('add-faq-modules') && ( */}
                    <Button variant="primary" onClick={() => setShowCreateModuleModal(true)}>
                      <Plus size={16} className="me-1" />
                      Add Module
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
        fetchData={fetchModules}
        title="FAQ Modules"
        searchPlaceholder="Search modules..."
        defaultPageSize={15}
        filters={memoizedFilters}
        refreshKey={refreshKey}
        search={true}
        tableStyle="table-style-2"
      />

      {/* Edit Module Modal */}
      <FormModal
        show={showEditModuleModal}
        onHide={() => {
          setShowEditModuleModal(false);
          setSelectedModule(null);
          setSelectedModuleName('');
          setSelectedModuleDescription('');
          setSelectedModuleIcon('');
        }}
        title="Edit FAQ Module"
        titleIcon={<Layers size={20} className="text-primary" />}
        desc="Please fill in the details below to edit the FAQ module."
        formHtml={
          <>
            <div className="form-group mb-3">
              <label htmlFor="editModuleName" className="fw-semibold d-flex align-items-center gap-2 form-label">
                Module Name <span className="text-danger">*</span>
                <span className="text-muted ms-2" title="Enter the name of the FAQ module">
                  <Info size={14} />
                </span>
              </label>
              <input 
                className="form-control" 
                type="text" 
                id="editModuleName"
                value={selectedModuleName} 
                onChange={(e) => setSelectedModuleName(e.target.value)} 
              />
              <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                <Info size={12} />
                <span style={{ fontSize: '0.813rem' }}>
                  Change the name of the FAQ module
                </span>
              </Form.Text>
            </div>
            <div className="form-group mb-3">
              <label htmlFor="editModuleDescription" className="fw-semibold d-flex align-items-center gap-2 form-label">
                Description
                <span className="text-muted ms-2" title="Enter a description for the FAQ module">
                  <Info size={14} />
                </span>
              </label>
              <textarea 
                className="form-control" 
                id="editModuleDescription"
                rows={3}
                value={selectedModuleDescription} 
                onChange={(e) => setSelectedModuleDescription(e.target.value)} 
              />
              <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                <Info size={12} />
                <span style={{ fontSize: '0.813rem' }}>
                  Optional description for the FAQ module
                </span>
              </Form.Text>
            </div>
            <div className="form-group mb-3">
              <label htmlFor="editModuleIcon" className="fw-semibold d-flex align-items-center gap-2 form-label">
                Icon
                <span className="text-muted ms-2" title="Enter icon identifier">
                  <Info size={14} />
                </span>
              </label>
              <input 
                className="form-control" 
                type="text" 
                id="editModuleIcon"
                value={selectedModuleIcon} 
                onChange={(e) => setSelectedModuleIcon(e.target.value)} 
                placeholder="e.g., question-circle"
              />
              <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                <Info size={12} />
                <span style={{ fontSize: '0.813rem' }}>
                  Optional icon identifier for the FAQ module
                </span>
              </Form.Text>
            </div>
          </>
        }
        submitButtonText="Update Module"
        isSubmitDisabled={!selectedModuleName}
        cancelButtonText="Cancel"
        onSubmit={handleSubmitEditModule}
        onCancel={() => {
          setShowEditModuleModal(false);
          setSelectedModule(null);
          setSelectedModuleName('');
          setSelectedModuleDescription('');
          setSelectedModuleIcon('');
        }}
      />

      {/* Create Module Modal */}
      <FormModal
        show={showCreateModuleModal}
        onHide={() => {
          setShowCreateModuleModal(false);
          setNewModuleName('');
          setNewModuleDescription('');
          setNewModuleIcon('');
        }}
        title="New FAQ Module"
        titleIcon={<Layers size={20} className="text-primary" />}
        desc="Please fill in the details below to create a new FAQ module."
        formHtml={
          <>
            <div className="form-group mb-3">
              <label htmlFor="newModuleName" className="fw-semibold d-flex align-items-center gap-2 form-label">
                Module Name <span className="text-danger">*</span>
                <span className="text-muted ms-2" title="Enter the name of the FAQ module">
                  <Info size={14} />
                </span>
              </label>
              <input 
                type="text" 
                className="form-control" 
                id="newModuleName"
                value={newModuleName} 
                onChange={(e) => setNewModuleName(e.target.value)} 
                placeholder="Module Name" 
              />
              <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                <Info size={12} />
                <span style={{ fontSize: '0.813rem' }}>
                  Enter the name of the FAQ module you want to create
                </span>
              </Form.Text>
            </div>
            <div className="form-group mb-3">
              <label htmlFor="newModuleDescription" className="fw-semibold d-flex align-items-center gap-2 form-label">
                Description
                <span className="text-muted ms-2" title="Enter a description for the FAQ module">
                  <Info size={14} />
                </span>
              </label>
              <textarea 
                className="form-control" 
                id="newModuleDescription"
                rows={3}
                value={newModuleDescription} 
                onChange={(e) => setNewModuleDescription(e.target.value)} 
                placeholder="Module Description"
              />
              <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                <Info size={12} />
                <span style={{ fontSize: '0.813rem' }}>
                  Optional description for the FAQ module
                </span>
              </Form.Text>
            </div>
            <div className="form-group mb-3">
              <label htmlFor="newModuleIcon" className="fw-semibold d-flex align-items-center gap-2 form-label">
                Icon
                <span className="text-muted ms-2" title="Enter icon identifier">
                  <Info size={14} />
                </span>
              </label>
              <input 
                className="form-control" 
                type="text" 
                id="newModuleIcon"
                value={newModuleIcon} 
                onChange={(e) => setNewModuleIcon(e.target.value)} 
                placeholder="e.g., question-circle"
              />
              <Form.Text className="text-muted d-flex align-items-center gap-1 form-text">
                <Info size={12} />
                <span style={{ fontSize: '0.813rem' }}>
                  Optional icon identifier for the FAQ module
                </span>
              </Form.Text>
            </div>
          </>
        }
        submitButtonText="Add Module"
        isSubmitDisabled={!newModuleName}
        cancelButtonText="Cancel"
        onSubmit={handleSubmitCreateModule}
        onCancel={() => {
          setShowCreateModuleModal(false);
          setNewModuleName('');
          setNewModuleDescription('');
          setNewModuleIcon('');
        }}
      />

      {/* Delete Module Modal */}
      <ConfirmModal
        show={showDeleteModuleModal}
        onHide={() => {
          setShowDeleteModuleModal(false);
          setSelectedModule(null);
          setSelectedModuleName('');
        }}
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
    </React.Fragment>
  );
};

FAQModules.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default FAQModules;

