import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import {
  getCampaigns,
  deleteCampaign,
  createCampaign,
  updateCampaign,
  getCampaign,
} from "@utils/crm";
import { Column } from "@components/CustomDataTable";
import {
  Button,
  Modal,
  Row,
  Col,
  Badge,
  Dropdown,
  Form,
  Card,
  Alert,
} from "react-bootstrap";
import {
  FiEdit,
  FiTrash2,
  FiEye,
  FiPlus,
  FiCalendar,
  FiSettings,
  FiX,
  FiSave,
} from "react-icons/fi";
import Link from "next/link";
import { toast } from "react-toastify";
import CampaignFilters from "@components/filters/CampaignFilters";
import Select from "react-select";
import { GetHierarchyData } from "@utils/users";

const CrmCampaigns = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    status: "active",
    options: {} as Record<string, any>,
  });

  // Campaign fields management
  const [campaignFields, setCampaignFields] = useState<any[]>([]);
  const [newField, setNewField] = useState({
    field_name: "",
    field_type: "string",
    field_options: [] as string[],
    sort_order: 0,
  });

  // Extensions and campaign users
  const [extensions, setExtensions] = useState<any[]>([]);
  const [campaignUsers, setCampaignUsers] = useState<readonly any[]>([]);

  // Fetch extensions data
  useEffect(() => {
    const fetchExtensions = async () => {
      try {
        const hierarchyData = await GetHierarchyData();
        setExtensions(hierarchyData?.extensions || []);
      } catch (error) {
        console.error('Failed to fetch extensions:', error);
      }
    };

    fetchExtensions();
  }, []);

  // Handle filter changes
  const handleFiltersChange = useCallback((filters: Record<string, any>) => {
    setCurrentFilters(filters);
    setRefreshKey((prev) => prev + 1);
  }, []);

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchCampaigns = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      return await getCampaigns({
        page,
        per_page: perPage,
        search,
        filters: memoizedFilters,
      });
    },
    [memoizedFilters]
  );

  // Modal handlers
  const handleCreateCampaign = useCallback(() => {
    setFormData({
      name: "",
      description: "",
      start_date: "",
      end_date: "",
      status: "active",
      options: {},
    });
    setCampaignFields([]);
    setShowCreateModal(true);
  }, []);

  const handleEditCampaign = useCallback(async (campaign: any) => {
    try {
      setLoading(true);
      const campaignData = await getCampaign(campaign.id);
      setSelectedCampaign(campaignData);
      setFormData({
        name: campaignData.name || "",
        description: campaignData.description || "",
        start_date: campaignData.start_date ? campaignData.start_date.split('T')[0] : "",
        end_date: campaignData.end_date ? campaignData.end_date.split('T')[0] : "",
        status: campaignData.status || "active",
        options: campaignData.options || {},
      });
      setCampaignFields(campaignData.fields || []);
      setShowEditModal(true);
    } catch (error) {
      console.error("Failed to fetch campaign:", error);
      toast.error("Failed to fetch campaign details");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleViewCampaign = useCallback(async (campaign: any) => {
    try {
      setLoading(true);
      const campaignData = await getCampaign(campaign.id);
      setSelectedCampaign(campaignData);
      setShowViewModal(true);
    } catch (error) {
      console.error("Failed to fetch campaign:", error);
      toast.error("Failed to fetch campaign details");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDeleteCampaign = useCallback((campaign: any) => {
    setSelectedCampaign(campaign);
    setShowDeleteModal(true);
  }, []);

  const confirmDeleteCampaign = useCallback(async () => {
    if (!selectedCampaign) return;

    try {
      setLoading(true);
      await deleteCampaign(selectedCampaign.id);
      setShowDeleteModal(false);
      setSelectedCampaign(null);
      toast.success("Campaign deleted successfully!");
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to delete campaign:", error);
      toast.error("Failed to delete campaign");
    } finally {
      setLoading(false);
    }
  }, [selectedCampaign]);

  // Form submission handlers
  const handleFormSubmit = useCallback(async () => {
    if (!formData.name.trim()) {
      toast.error("Campaign name is required");
      return;
    }

    try {
      setLoading(true);
      const campaignData = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        status: formData.status as 'active' | 'inactive',
        fields: campaignFields,
        campaign_users: campaignUsers.map(user => user.value),
      };

      if (showEditModal && selectedCampaign) {
        await updateCampaign(selectedCampaign.id, campaignData);
        toast.success("Campaign updated successfully!");
        setShowEditModal(false);
      } else {
        await createCampaign(campaignData);
        toast.success("Campaign created successfully!");
        setShowCreateModal(false);
      }

      setSelectedCampaign(null);
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Failed to save campaign:", error);
      toast.error(error.message || "Failed to save campaign");
    } finally {
      setLoading(false);
    }
  }, [formData, campaignFields, campaignUsers, showEditModal, selectedCampaign]);

  // Field management functions
  const handleAddField = useCallback(() => {
    if (!newField.field_name.trim()) {
      toast.error("Field name is required");
      return;
    }

    const field = {
      ...newField,
      field_name: newField.field_name.trim(),
      sort_order: campaignFields.length,
    };

    setCampaignFields([...campaignFields, field]);
    setNewField({
      field_name: "",
      field_type: "string",
      field_options: [],
      sort_order: 0,
    });
  }, [newField, campaignFields]);

  const handleRemoveField = useCallback((index: number) => {
    setCampaignFields(campaignFields.filter((_, i) => i !== index));
  }, [campaignFields]);

  const handleFieldTypeChange = useCallback((index: number, fieldType: string) => {
    const updatedFields = [...campaignFields];
    updatedFields[index].field_type = fieldType;
    if (fieldType !== "dropdown") {
      updatedFields[index].field_options = [];
    }
    setCampaignFields(updatedFields);
  }, [campaignFields]);

  const handleFieldOptionChange = useCallback((index: number, optionIndex: number, value: string) => {
    const updatedFields = [...campaignFields];
    if (!updatedFields[index].field_options) {
      updatedFields[index].field_options = [];
    }
    updatedFields[index].field_options[optionIndex] = value;
    setCampaignFields(updatedFields);
  }, [campaignFields]);

  const handleAddFieldOption = useCallback((index: number) => {
    const updatedFields = [...campaignFields];
    if (!updatedFields[index].field_options) {
      updatedFields[index].field_options = [];
    }
    updatedFields[index].field_options.push("");
    setCampaignFields(updatedFields);
  }, [campaignFields]);

  const handleRemoveFieldOption = useCallback((index: number, optionIndex: number) => {
    const updatedFields = [...campaignFields];
    updatedFields[index].field_options.splice(optionIndex, 1);
    setCampaignFields(updatedFields);
  }, [campaignFields]);

  // Define columns
  const columns: Column[] = useMemo(
    () => [
      {
        key: "name",
        name: "Campaign Name",
        selector: (row: any) => row.name,
        sortable: true,
        cell: (props: any) => (
          <div>
            <div className="fw-medium">{props.name || "Unnamed Campaign"}</div>
            <small className="text-muted">
              {props.description || "No Description"}
            </small>
          </div>
        ),
      },
      {
        key: "status",
        name: "Status",
        selector: (row: any) => row.status,
        sortable: true,
        cell: (props: any) => {
          const status = props.status || "inactive";
          return (
            <Badge bg={status === "active" ? "success" : "secondary"}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          );
        },
      },
      {
        key: "date_range",
        name: "Date Range",
        selector: (row: any) => row.start_date,
        sortable: true,
        cell: (props: any) => (
          <div>
            <div className="d-flex align-items-center">
              <FiCalendar className="me-1" size={14} />
              <small>
                {props.start_date
                  ? new Date(props.start_date).toLocaleDateString()
                  : "No start date"}
              </small>
            </div>
            <div className="text-muted">
              <small>
                to{" "}
                {props.end_date
                  ? new Date(props.end_date).toLocaleDateString()
                  : "No end date"}
              </small>
            </div>
          </div>
        ),
      },
      {
        key: "created_at",
        name: "Created",
        selector: (row: any) => row.created_at,
        sortable: true,
        cell: (props: any) => (
          <span>
            {props.created_at
              ? new Date(props.created_at).toLocaleDateString()
              : "Unknown"}
          </span>
        ),
      },
      {
        key: "Action",
        name: "ACTION",
        selector: (row: any) => row.id,
        sortable: false,
        cell: (props: any) => (
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" size="sm">
              Actions
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => handleViewCampaign(props)}>
                <FiEye className="me-2" />
                View
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleEditCampaign(props)}>
                <FiEdit className="me-2" />
                Edit
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item
                onClick={() => handleDeleteCampaign(props)}
                className="text-danger"
              >
                <FiTrash2 className="me-2" />
                Delete
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        ),
      },
    ],
    []
  );

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Campaigns"
      />

      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="h3 mb-0">Campaign Management</h1>
                <p className="text-muted">Manage and track your marketing campaigns</p>
              </div>
              <div>
                <Button onClick={handleCreateCampaign} className="btn btn-primary">
                  <FiPlus className="me-2" />
                  New Campaign
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Campaign Filters */}
        <div className="row mb-3">
          <CampaignFilters onFiltersChange={handleFiltersChange} />
        </div>

        {/* Campaigns List */}
        <div className="row">
          <div className="col-12">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <GenericListPage
                  columns={columns}
                  fetchData={fetchCampaigns}
                  title="Campaigns"
                  searchPlaceholder="Search campaigns..."
                  defaultPageSize={15}
                  filters={memoizedFilters}
                  refreshKey={refreshKey}
                />
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>

      {/* Create/Edit Campaign Modal */}
      <Modal 
        show={showCreateModal || showEditModal} 
        onHide={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setSelectedCampaign(null);
          setCampaignUsers([]);
        }}
        size="xl"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {showEditModal ? `Edit Campaign: ${selectedCampaign?.name}` : "Create New Campaign"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Campaign Name *</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter campaign name"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>End Date</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-4">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Enter campaign description (optional)"
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Campaign Users</Form.Label>
            <Select
              isMulti
              value={campaignUsers}
              onChange={(selected) => setCampaignUsers(selected || [])}
              options={extensions.map((extension: { id: string; display_name: string; name: string }) => ({
                value: extension.id,
                label: extension.display_name || extension.name || extension.id
              }))}
              placeholder="Select users for this campaign..."
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: "#ced4da",
                  boxShadow: "none",
                  fontSize: "14px",
                }),
              }}
            />
            <Form.Text className="text-muted">
              Select users who will be assigned to this campaign.
            </Form.Text>
          </Form.Group>

          {/* Campaign Fields Management */}
          <div className="border-top pt-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5>Campaign Fields</h5>
              <Button variant="outline-primary" size="sm" onClick={handleAddField}>
                <FiPlus className="me-1" />
                Add Field
              </Button>
            </div>

            {/* Add New Field Form */}
            <Card className="mb-3">
              <Card.Body>
                <Row>
                  <Col md={4}>
                    <Form.Control
                      type="text"
                      placeholder="Field name"
                      value={newField.field_name}
                      onChange={(e) => setNewField({...newField, field_name: e.target.value})}
                    />
                  </Col>
                  <Col md={3}>
                    <Form.Select
                      value={newField.field_type}
                      onChange={(e) => setNewField({...newField, field_type: e.target.value})}
                    >
                      <option value="string">Text</option>
                      <option value="text">Long Text</option>
                      <option value="integer">Number</option>
                      <option value="date">Date</option>
                      <option value="email">Email</option>
                      <option value="dropdown">Dropdown</option>
                    </Form.Select>
                  </Col>
                  <Col md={3}>
                    <Button variant="success" size="sm" onClick={handleAddField}>
                      Add Field
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Existing Fields */}
            {campaignFields.map((field, index) => (
              <Card key={index} className="mb-2">
                <Card.Body>
                  <Row className="align-items-center">
                    <Col md={3}>
                      <Form.Control
                        type="text"
                        value={field.field_name}
                        onChange={(e) => {
                          const updatedFields = [...campaignFields];
                          updatedFields[index].field_name = e.target.value;
                          setCampaignFields(updatedFields);
                        }}
                      />
                    </Col>
                    <Col md={2}>
                      <Form.Select
                        value={field.field_type}
                        onChange={(e) => handleFieldTypeChange(index, e.target.value)}
                      >
                        <option value="string">Text</option>
                        <option value="text">Long Text</option>
                        <option value="integer">Number</option>
                        <option value="date">Date</option>
                        <option value="email">Email</option>
                        <option value="dropdown">Dropdown</option>
                      </Form.Select>
                    </Col>
                    <Col md={4}>
                      {field.field_type === "dropdown" && (
                        <div>
                          {field.field_options?.map((option: string, optionIndex: number) => (
                            <div key={optionIndex} className="d-flex mb-1">
                              <Form.Control
                                type="text"
                                size="sm"
                                value={option}
                                onChange={(e) => handleFieldOptionChange(index, optionIndex, e.target.value)}
                                placeholder="Option value"
                              />
                              <Button
                                variant="outline-danger"
                                size="sm"
                                className="ms-1"
                                onClick={() => handleRemoveFieldOption(index, optionIndex)}
                              >
                                <FiX />
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleAddFieldOption(index)}
                          >
                            Add Option
                          </Button>
                        </div>
                      )}
                    </Col>
                    <Col md={1}>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleRemoveField(index)}
                      >
                        <FiTrash2 />
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            ))}

            {campaignFields.length === 0 && (
              <Alert variant="info">
                No fields added yet. Click "Add Field" to create custom fields for this campaign.
              </Alert>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowCreateModal(false);
              setShowEditModal(false);
              setSelectedCampaign(null);
              setCampaignUsers([]);
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleFormSubmit}
            disabled={loading}
          >
            {loading ? "Saving..." : showEditModal ? "Update Campaign" : "Create Campaign"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Campaign Modal */}
      <Modal 
        show={showViewModal} 
        onHide={() => {
          setShowViewModal(false);
          setSelectedCampaign(null);
        }}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Campaign Details: {selectedCampaign?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCampaign && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Status:</strong> 
                  <Badge bg={selectedCampaign.status === "active" ? "success" : "secondary"} className="ms-2">
                    {selectedCampaign.status}
                  </Badge>
                </Col>
                <Col md={6}>
                  <strong>Created:</strong> 
                  <span className="ms-2">
                    {new Date(selectedCampaign.created_at).toLocaleDateString()}
                  </span>
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Start Date:</strong> 
                  <span className="ms-2">
                    {selectedCampaign.start_date ? new Date(selectedCampaign.start_date).toLocaleDateString() : "Not set"}
                  </span>
                </Col>
                <Col md={6}>
                  <strong>End Date:</strong> 
                  <span className="ms-2">
                    {selectedCampaign.end_date ? new Date(selectedCampaign.end_date).toLocaleDateString() : "Not set"}
                  </span>
                </Col>
              </Row>

              {selectedCampaign.description && (
                <div className="mb-3">
                  <strong>Description:</strong>
                  <p className="mt-2">{selectedCampaign.description}</p>
                </div>
              )}

              {selectedCampaign.options && Object.keys(selectedCampaign.options).length > 0 && (
                <div className="mb-3">
                  <strong>Options:</strong>
                  <pre className="mt-2 bg-light p-2 rounded" style={{fontSize: '0.9em'}}>
                    {JSON.stringify(selectedCampaign.options, null, 2)}
                  </pre>
                </div>
              )}

              <div className="border-top pt-3">
                <h6>Campaign Fields ({selectedCampaign.fields?.length || 0})</h6>
                {selectedCampaign.fields && selectedCampaign.fields.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Field Name</th>
                          <th>Type</th>
                          <th>Options</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCampaign.fields.map((field: any, index: number) => (
                          <tr key={index}>
                            <td>{field.field_name}</td>
                            <td>
                              <Badge bg="info">{field.field_type}</Badge>
                            </td>
                            <td>
                              {field.field_type === "dropdown" && field.field_options ? (
                                <div>
                                  {field.field_options.map((option: string, optIndex: number) => (
                                    <Badge key={optIndex} bg="light" text="dark" className="me-1">
                                      {option}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Alert variant="info">No custom fields defined for this campaign.</Alert>
                )}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowViewModal(false);
              setSelectedCampaign(null);
            }}
          >
            Close
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              setShowViewModal(false);
              handleEditCampaign(selectedCampaign);
            }}
          >
            Edit Campaign
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Campaign</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the campaign "{selectedCampaign?.name}"? This action cannot be
          undone and will also delete all associated campaign fields.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDeleteCampaign} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
};

CrmCampaigns.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmCampaigns;
