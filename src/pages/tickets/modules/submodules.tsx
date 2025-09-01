import '@assets/scss/datatable-style.scss';
import React, { ReactElement, useState, useCallback, useMemo, useEffect } from 'react';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import GenericListPage from '@components/GenericListPage';
import { ListSubmodules, CreateSubmodule, DeleteSubmodule, GetAllModules, ListSubmoduleChildren, CreateSubmoduleChild, DeleteSubmoduleChild } from '@utils/ticket-module';
import { Column } from '@components/CustomDataTable';
import { Button, Modal, Row, Col, Card, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import { GetHierarchyData } from '@utils/users';
import Select from 'react-select';

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

const SubmodulesPage = () => {
  const { data: session, status } = useSession();
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({});
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
          GetHierarchyData()
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

  const fetchSubmodules = useCallback(async (page = 1, perPage = 15, search = "") => {
    return await ListSubmodules({ page, perPage, search, filters: memoizedFilters });
  }, [memoizedFilters]);

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
        toast.success('Submodule created successfully');
      }
    } catch (error) {
      console.error('Error creating submodule:', error);
      toast.error('Failed to create submodule');
    }
  }, [newSubmoduleName, newSubmoduleDescription, newSubmoduleModuleId, newSubmoduleUserExtension]);

  const handleDeleteSubmodule = useCallback(async (submodule: Submodule) => {
    if (window.confirm(`Are you sure you want to delete submodule "${submodule.name}"?`)) {
      try {
        const response = await DeleteSubmodule(submodule.id);
        if (response) {
          setRefreshKey(prev => prev + 1);
          toast.success('Submodule deleted successfully');
        }
      } catch (error) {
        console.error('Error deleting submodule:', error);
        toast.error('Failed to delete submodule');
      }
    }
  }, []);

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
    if (!newChildName.trim() || !selectedSubmodule) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await CreateSubmoduleChild(
        newChildName,
        newChildDescription,
        selectedSubmodule.module_id,
        selectedSubmodule.id,
        newChildUserExtension
      );

      if (response) {
        setNewChildName("");
        setNewChildDescription("");
        setNewChildUserExtension(null);
        // Refresh the children list
        await fetchSubmoduleChildren(selectedSubmodule.id);
        toast.success('Submodule child created successfully');
      }
    } catch (error) {
      console.error('Error creating submodule child:', error);
      toast.error('Failed to create submodule child');
    }
  }, [newChildName, newChildDescription, newChildUserExtension, selectedSubmodule, fetchSubmoduleChildren]);

  const handleDeleteChild = useCallback(async (child: SubmoduleChild) => {
    if (window.confirm(`Are you sure you want to delete submodule child "${child.name}"?`)) {
      try {
        const response = await DeleteSubmoduleChild(child.id);
        if (response && selectedSubmodule) {
          // Refresh the children list
          await fetchSubmoduleChildren(selectedSubmodule.id);
          toast.success('Submodule child deleted successfully');
        }
      } catch (error) {
        console.error('Error deleting submodule child:', error);
        toast.error('Failed to delete submodule child');
      }
    }
  }, [selectedSubmodule, fetchSubmoduleChildren]);

  const columns: Column[] = useMemo(() => [
    {
      key: 'name',
      name: 'Name',
      selector: (row: Submodule) => row.name,
      sortable: true,
    },
    {
      key: 'description',
      name: 'Description',
      selector: (row: Submodule) => row.description || 'No description',
      sortable: true,
    },
    {
      key: 'module',
      name: 'Module',
      selector: (row: Submodule) => {
        const moduleItem = modules.find(m => m.id == row.module_id);
        return moduleItem?.name || 'Unknown';
      },
      sortable: true,
      cell: (props: Submodule) => {
        const moduleItem = modules.find(m => m.id == props.module_id);
        return (
          <Badge 
            style={{ 
              backgroundColor: moduleItem?.color || '#6c757d',
              color: 'white'
            }}
          >
            {moduleItem?.name || 'Unknown'}
          </Badge>
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
          {new Date(props.created_at).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'actions',
      name: 'Actions',
      selector: (row: Submodule) => row.id,
      sortable: false,
      cell: (props: Submodule) => (
        <div className="d-flex gap-2">
          <Button
            variant="outline-info"
            size="sm"
            onClick={() => openSubmoduleChildrenModal(props)}
          >
            Manage Children
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => handleDeleteSubmodule(props)}
          >
            Delete
          </Button>
        </div>
      )
    }
  ], [modules, extensions, openSubmoduleChildrenModal, handleDeleteSubmodule]);

  return (
    <React.Fragment>
      <BreadcrumbItem 
        mainTitle="Tickets" 
        mainLink="/tickets/modules" 
        subTitle="Submodules" 
      />
      
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0 d-flex align-items-center">
              Submodules
              {session?.user?.permissions?.includes('create-ticket-module-tickets') && (
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  className="ms-3" 
                  onClick={() => setShowCreateModal(true)}
                >
                  New Submodule
                </Button>
              )}
            </h2>
          </div>
        </Col>
      </Row>

      {session?.user?.permissions?.includes('ticket-modules-tickets') && (
        <GenericListPage
          columns={columns}
          fetchData={fetchSubmodules}
          title="Submodules"
          searchPlaceholder="Search submodules..."
          defaultPageSize={15}
          filters={memoizedFilters}
          refreshKey={refreshKey}
        />
      )}

      {/* Create Submodule Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Submodule</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="form-group mb-3">
            <label htmlFor="submoduleName">Submodule Name *</label>
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
            <label htmlFor="submoduleDescription">Description</label>
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
            <label htmlFor="submoduleModule">Module *</label>
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
          
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreateSubmodule}
            disabled={!newSubmoduleName.trim() || !newSubmoduleModuleId}
          >
            Create Submodule
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Submodule Children Modal */}
      <Modal 
        show={showSubmoduleChildrenModal} 
        onHide={closeSubmoduleChildrenModal}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Manage Submodule Children - {selectedSubmodule?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row">
            {/* Create New Child Section */}
            <div className="col-md-6">
              <h5>Create New Child</h5>
              <div className="form-group mb-3">
                <label htmlFor="childName">Child Name *</label>
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
              
              
              <Button 
                variant="primary" 
                onClick={handleCreateChild}
                disabled={!newChildName.trim()}
              >
                Create Child
              </Button>
            </div>

            {/* Existing Children Section */}
            <div className="col-md-6">
              <h5>Existing Children</h5>
              {isLoadingChildren ? (
                <div className="text-center">
                  <p className="text-muted">Loading children...</p>
                </div>
              ) : submoduleChildren.length === 0 ? (
                <div className="text-center">
                  <p className="text-muted">No children created yet.</p>
                </div>
              ) : (
                <div className="submodule-children-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {submoduleChildren.map((child: SubmoduleChild) => (
                    <div key={child.id} className="card mb-2">
                      <div className="card-body p-2">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h6 className="mb-1">{child.name}</h6>
                            <p className="mb-1 text-muted small">{child.description || 'No description'}</p>
                          </div>
                          <Button 
                            variant="outline-danger" 
                            size="sm" 
                            onClick={() => handleDeleteChild(child)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeSubmoduleChildrenModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
};

SubmodulesPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default SubmodulesPage;
