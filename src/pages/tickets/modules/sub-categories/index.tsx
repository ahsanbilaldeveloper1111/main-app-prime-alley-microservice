import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useCallback, useMemo, useEffect } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { GetAllSubmodules,ListSubmodules, CreateSubmodule, DeleteSubmodule, GetAllModules, ListSubmoduleChildren, CreateSubmoduleChild, DeleteSubmoduleChild } from '@utils/ticket-module';
import { Column } from '@components/CustomDataTable';
import { Button, Row, Col, Card, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import { GetHierarchyData } from '@utils/users';
import Select from 'react-select';

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import FormModal from "@pages/partial/FormModal";
import ConfirmModal from "@pages/partial/ConfirmModal";
import { GlobalDateTimeFormat, ModuleSlug } from '@utils/Helper';
import { Edit, Info, Trash2 } from 'lucide-react';
import moment from 'moment';



interface Submodule {
  id: string;
  name: string;
  description: string;
  module_id: string;
  created_at: string;
  updated_at: string;
}

interface SubmoduleChild {
  id: string;
  name: string;
  description: string;
  submodule_id: string;
  created_at: string;
  updated_at: string;
}

interface Module {
  id: string;
  name: string;
  color: string;
}

const ModuleSubCategories = () => {
  const { data: session, status } = useSession();
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({search: ""});
  const [modules, setModules] = useState<Module[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showSubmoduleChildrenModal, setShowSubmoduleChildrenModal] = useState<boolean>(false);
  const [selectedSubmodule, setSelectedSubmodule] = useState<Submodule | null>(null);

  // Form states
  const [newSubmoduleName, setNewSubmoduleName] = useState<string>("");
  const [newSubmoduleDescription, setNewSubmoduleDescription] = useState<string>("");
  const [newSubmoduleModuleId, setNewSubmoduleModuleId] = useState<string>("");
  const [newSubmoduleUserExtension, setNewSubmoduleUserExtension] = useState<string | null>(null);

  // Submodule children form states
  const [newChildName, setNewChildName] = useState<string>("");
  const [newChildDescription, setNewChildDescription] = useState<string>("");
  const [newChildUserExtension, setNewChildUserExtension] = useState<string | null>(null);
  const [submoduleChildren, setSubmoduleChildren] = useState<SubmoduleChild[]>([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState<boolean>(false);

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);
  

  // Fetch modules and extensions
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [modulesData, hierarchyData] = await Promise.all([
          GetAllModules(),
          GetHierarchyData(ModuleSlug.TICKET)
        ]);
        
        if (modulesData) {
          setModules(modulesData);
        }
        
        if (hierarchyData?.extensions) {
          setExtensions(hierarchyData.extensions);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    fetchData();
  }, []);

  const [newChildSubmoduleId, setNewChildSubmoduleId] = useState<string>("");
  const [newChildModuleId, setNewChildModuleId] = useState<string>("");

  const [submodules, setSubmodules] = useState<Submodule[]>([]);
  const handleChangeModule = useCallback(async (moduleId: string) => {
    setSubmodules([]);
    setNewChildModuleId(moduleId);
    const submodules = await ListSubmodules({ filters: { module_id: moduleId } });
    if (submodules?.data) {
      setSubmodules(submodules.data);
    }
  }, []);

  const fetchSubmodules = useCallback(async (page = 1, perPage = 15, search = "") => {
    // Exclude search from filters since it's passed as a separate parameter
    const { search: _, ...filtersWithoutSearch } = memoizedFilters;
    return await ListSubmoduleChildren({ page, perPage, search: search || currentFilters.search || "", filters: filtersWithoutSearch });
  }, [memoizedFilters, currentFilters]);

  const handleFiltersChange = useCallback((filters: any) => {
    setCurrentFilters(filters);
  }, []);

  const handleCreateSubmodule = useCallback(async () => {
    if (!newSubmoduleName.trim() || !newSubmoduleModuleId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await CreateSubmodule(
        newSubmoduleName,
        newSubmoduleDescription,
        newSubmoduleModuleId,
        newSubmoduleUserExtension
      );

      if (response) {
        setNewSubmoduleName("");
        setNewSubmoduleDescription("");
        setNewSubmoduleModuleId("");
        setNewSubmoduleUserExtension(null);
        setShowCreateModal(false);
        setRefreshKey(prev => prev + 1);
        //toast.success('Submodule created successfully');
      }
    } catch (error) {
      console.error('Error creating submodule:', error);
      toast.error('Failed to create submodule');
    }
  }, [newSubmoduleName, newSubmoduleDescription, newSubmoduleModuleId, newSubmoduleUserExtension]);

  const [selectedSubmoduleForDelete, setSelectedSubmoduleForDelete] = useState<string | null>(null);
  const [showSubmoduleDeleteModal, setShowSubmoduleDeleteModal] = useState<boolean>(false);
  const [selectedSubcategoryForDelete, setSelectedSubcategoryForDelete] = useState<string | null>(null);

  

  const openSubmoduleChildrenModal = useCallback(async (submodule: Submodule) => {
    setSelectedSubmodule(submodule);
    setShowSubmoduleChildrenModal(true);
    await fetchSubmoduleChildren(submodule.id);
  }, []);

  const closeSubmoduleChildrenModal = useCallback(() => {
    setSelectedSubmodule(null);
    setShowSubmoduleChildrenModal(false);
    setSubmoduleChildren([]);
    setNewChildName("");
    setNewChildDescription("");
    setNewChildUserExtension(null);
  }, []);

  const fetchSubmoduleChildren = useCallback(async (submoduleId: string) => {
    try {
      setIsLoadingChildren(true);
      const response = await ListSubmoduleChildren({ 
        filters: { submodule_id: submoduleId },
        perPage: 100 // Get all children for this submodule
      });
      
      if (response?.data) {
        setSubmoduleChildren(response.data);
      } else {
        setSubmoduleChildren([]);
      }
    } catch (error) {
      console.error('Error fetching submodule children:', error);
      toast.error('Failed to fetch submodule children');
      setSubmoduleChildren([]);
    } finally {
      setIsLoadingChildren(false);
    }
  }, []);

  const handleCreateChild = useCallback(async () => {
    if (!newChildName.trim() || !newChildModuleId ||!newChildSubmoduleId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await CreateSubmoduleChild(
        newChildName,
        newChildDescription,
        newChildModuleId,
        newChildSubmoduleId,
        newChildUserExtension
      );

      if (response) {
        setNewChildName("");
        setNewChildDescription("");
        setNewChildUserExtension(null);
        // Refresh the children list
        setRefreshKey(prev => prev + 1);
        setNewChildSubmoduleId("");
        setNewChildModuleId("");
        closeSubmoduleChildrenModal();
      //  toast.success('Submodule child created successfully');
      }
    } catch (error) {
      console.error('Error creating submodule child:', error);
      toast.error('Failed to create submodule child');
    }
  }, [newChildName, newChildDescription, newChildUserExtension, selectedSubmodule, fetchSubmoduleChildren]);

  const handleDeleteChild = useCallback(async () => {
    const response = await DeleteSubmoduleChild(selectedSubcategoryForDelete?.toString() || "");
        if (response) {
          // Refresh the children list
          setRefreshKey(prev => prev + 1);
          setSelectedSubcategoryForDelete(null);
          setShowSubmoduleDeleteModal(false);
          //toast.success('Submodule child deleted successfully');
        }
  }, [selectedSubcategoryForDelete]);

  const columns: Column[] = useMemo(() => [
    {
      key: 'name',
      name: 'Name',
      selector: (row: Submodule) => row.name,
      sortable: true,
      cell: (props: Submodule) => (
        <span className="fw-medium">
          {props.name}
        </span>
      )
    },
    {
      key: 'description',
      name: 'Description',
      selector: (row: Submodule) => row.description || 'No description',
      sortable: true,
      cell: (props: Submodule) => (
        <span className="text-muted" style={{ fontSize: '0.875rem' }}>
           {props.description && props.description.length > 50 ? (
            <span className="text-muted text-overflow-ellipsis" style={{ fontSize: '0.875rem' }}>
              {props.description.substring(0, 50)+'...'}
            </span>
          ) : (
            <span className="text-muted" style={{ fontSize: '0.875rem' }}>
              {props.description || 'No description'}
            </span>
          )}
        </span>
      )
    },
    {
      key: 'module',
      name: 'Category',
      selector: (row: any) => {
        return row.submodule?.name || 'Unknown';
      },
      sortable: true,
      cell: (props: any) => {
        return (
          <span className="px-3 py-2 badge bg-outline-secondary text-secondary" 
          style={{  fontSize: '0.813rem',  border: `1px solid ${props.submodule?.color}40` }}>
            {props.submodule?.name || 'Unknown'}
          </span>
        );
      }
    },
    {
      key: 'created_at',
      name: 'Created At',
      selector: (row: Submodule) => row.created_at,
      sortable: true,
      cell: (props: Submodule) => (
        <span className="text-muted">
          {moment(props.created_at).format(GlobalDateTimeFormat)}
        </span>
      )
    },
    {
      key: 'actions',
      name: 'Actions',
      selector: (row: Submodule) => row.id,
      sortable: false,
      cell: (props: Submodule) => (
      <>
      <div className="d-flex gap-2">


      <Button variant="light" size="sm" className="btn-action-style-2 p-1 text-danger" title="Delete">
            <Trash2 size={16} 
            onClick={() => {
              setSelectedSubcategoryForDelete(props.id);
              setShowSubmoduleDeleteModal(true);
              console.log(props.id);
            }}
            />
          </Button>
      </div>
      </>
      )
    }
  ], [modules, extensions, openSubmoduleChildrenModal, handleDeleteChild]);

  return (
    <React.Fragment>
      <BreadcrumbItem 
        mainTitle="Tickets" 
        mainLink="/tickets/modules" 
        subTitle="Submodules" 
      />

      <PageHeader
        title="Sub Categories"
        buttons={
          <>
         <Button 
                  variant="primary" 
                  onClick={() => setShowSubmoduleChildrenModal(true)}
                >
                  New SubCategory
                </Button>
            
          </>
        }
      />
      

        <GenericListPage
          columns={columns}
          fetchData={fetchSubmodules}
          title="Submodules"
          searchPlaceholder="Search submodules..."
          defaultPageSize={15}
          filters={memoizedFilters}
          refreshKey={refreshKey}
          search={true}
          tableStyle="table-style-2"
        />


      {/* Create Submodule Modal */}
      <FormModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        title="Create New Category"
        desc="Please fill in the details below to create a new category."
        submitButtonText="Create Category"
        isSubmitDisabled={!newSubmoduleName || !newSubmoduleModuleId}
        cancelButtonText="Cancel"
        onSubmit={handleCreateSubmodule}
        onCancel={() => setShowCreateModal(false)}
        formHtml={
          <>
            <div className="form-group mb-3">
              <label htmlFor="submoduleName" className="fw-semibold d-flex align-items-center gap-2 form-label">Category Name <span className="text-danger">*</span>
              <span className="text-muted" title="Enter the name of the category you want to create">
                <Info size={14} />
              </span>
              </label>
              <input
                type="text"
                className="form-control"
                id="submoduleName"
                value={newSubmoduleName}
                onChange={(e) => setNewSubmoduleName(e.target.value)}
                placeholder="Enter submodule name"
              />
              
            </div>
            
            <div className="form-group mb-3">
              <label htmlFor="submoduleDescription" className="fw-semibold d-flex align-items-center gap-2 form-label">Description <span className="text-muted" title="Enter the description of the category you want to create">
                <Info size={14} />
              </span>
              </label>
              <textarea
                className="form-control"
                id="submoduleDescription"
                value={newSubmoduleDescription}
                onChange={(e) => setNewSubmoduleDescription(e.target.value)}
                placeholder="Enter description (optional)"
                rows={3}
              />
            </div>
            
            <div className="form-group mb-3">
              <label htmlFor="submoduleModule" className="fw-semibold d-flex align-items-center gap-2 form-label">Module <span className="text-danger">*</span>
              <span className="text-muted" title="Select the module related to the category you want to create">
                <Info size={14} />
              </span>
              </label>
              <select
                className="form-control"
                id="submoduleModule"
                value={newSubmoduleModuleId}
                onChange={(e) => setNewSubmoduleModuleId(e.target.value)}
              >
                <option value="">Select Module</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        }
      />

      {/* Submodule Children Modal */}
      <FormModal
        show={showSubmoduleChildrenModal}
        onHide={closeSubmoduleChildrenModal}
        title={`Add SubCategory`}
        desc="Please fill in the details below to add a new subcategory."
        submitButtonText="Add SubCategory"
        isSubmitDisabled={!newChildName}
        cancelButtonText="Close"
        onSubmit={handleCreateChild}
        onCancel={closeSubmoduleChildrenModal}
        formHtml={
          <div className="row">
            {/* Create New Child Section */}
            <div className="col-md-12">

            <div className="form-group mb-3">
                <label htmlFor="module">Module</label>
                <select
                  className="form-control"
                  id="module"
                  value={newChildModuleId}
                  onChange={(e) => handleChangeModule(e.target.value)}
                >
                  <option value="">Select Module</option>
                  {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.name}
                  </option>
                ))}
              </select>
            </div>

              <div className="form-group mb-3">
                <label htmlFor="submodule">Category</label>
                <select
                  className="form-control"
                  id="submodule"
                  value={newChildSubmoduleId}
                  onChange={(e) => setNewChildSubmoduleId(e.target.value)}
                >
                  <option value="">Select Category</option>
                  {submodules && submodules.length > 0 && submodules.map((submodule) => (
                  <option key={submodule.id} value={submodule.id}>
                    {submodule.name}
                  </option>
                ))}
              </select>
            </div>


              <div className="form-group mb-3">
                <label htmlFor="childName">SubCategory Name *</label>
                <input
                  type="text"
                  className="form-control"
                  id="childName"
                  value={newChildName}
                  onChange={(e) => setNewChildName(e.target.value)}
                  placeholder="Enter child name"
                />
              </div>
              
              <div className="form-group mb-3">
                <label htmlFor="childDescription">Description</label>
                <textarea
                  className="form-control"
                  id="childDescription"
                  value={newChildDescription}
                  onChange={(e) => setNewChildDescription(e.target.value)}
                  placeholder="Enter description (optional)"
                  rows={3}
                />
              </div>

             
            </div>

           
          </div>
        }
      />

      {/* Delete Submodule Confirmation Modal */}
      <ConfirmModal
        show={showSubmoduleDeleteModal}
        onHide={() => setShowSubmoduleDeleteModal(false)}
        title="Delete SubCategory"
        description="Are you sure you want to delete this subcategory? This action cannot be undone."
        targetName=""
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        onConfirm={() => handleDeleteChild()}
        onCancel={() => setShowSubmoduleDeleteModal(false)}
      />
    </React.Fragment>
  );
};

ModuleSubCategories.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ModuleSubCategories;
