import "@assets/scss/datatable-style.scss";
import React, { useState, useEffect } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  getDealTemplates,
  createDealTemplate,
  updateDealTemplate,
  deleteDealTemplate,
  DealTemplateData,
  CreateDealTemplatePayload,
  UpdateDealTemplatePayload,
  getIndustries,
  IndustryData,
} from "@utils/crm";
import FormModal from "@pages/partial/FormModal";
import { useSession } from "next-auth/react";
import {
  Button,
  Row,
  Col,
  Form,
  Card,
  Table,
  InputGroup,
  Modal,
  Badge,
  Spinner,
} from "react-bootstrap";
import Select from "react-select";
import {
  PlusCircle,
  Eye,
  Edit,
  Trash2,
  Search,
  X,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  GripVertical,
} from "lucide-react";
import { toast } from "react-toastify";
import "@assets/scss/common.scss";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";

const DealTemplatesPage = () => {
  const { data: session } = useSession();
  // State
  const [templates, setTemplates] = useState<DealTemplateData[]>([]);
  const [industries, setIndustries] = useState<IndustryData[]>([]);
  const [totalTemplates, setTotalTemplates] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingIndustries, setLoadingIndustries] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 15,
  });
  const [search, setSearch] = useState("");
  const [selectedIndustryFilter, setSelectedIndustryFilter] = useState<
    number | null
  >(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<DealTemplateData | null>(null);
  const [deletingTemplate, setDeletingTemplate] =
    useState<DealTemplateData | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingTemplate, setViewingTemplate] =
    useState<DealTemplateData | null>(null);
  const [formData, setFormData] = useState({
    industry_id: null as number | null,
    name: "",
    description: "",
    is_default: false,
  });
  const [fields, setFields] = useState<
    Array<{
      id: string;
      field_name: string;
      field_type: "text" | "dropdown";
      options: string[];
      is_required: boolean;
      require_approval: boolean;
      sort_order: number;
    }>
  >([]);
  const [submitting, setSubmitting] = useState(false);

  // Fetch industries
  const fetchIndustries = async () => {
    setLoadingIndustries(true);
    try {
      const response = await getIndustries({ per_page: 1000 });
      setIndustries(response.data || []);
    } catch (error: any) {
      console.error("Failed to fetch industries:", error);
      // Error toast is handled in the API function
    } finally {
      setLoadingIndustries(false);
    }
  };

  // Fetch templates
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.currentPage,
        per_page: pagination.perPage,
      };
      if (search) {
        params.search = search;
      }
      if (selectedIndustryFilter) {
        params.industry_id = selectedIndustryFilter;
      }
      const response = await getDealTemplates(params);
      setTemplates(response.data || []);
      setTotalTemplates(response.total || 0);
    } catch (error: any) {
      console.error("Failed to fetch deal templates:", error);
      // Error toast is handled in the API function
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndustries();
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [
    pagination.currentPage,
    pagination.perPage,
    search,
    selectedIndustryFilter,
  ]);

  // Handle search
  const handleSearch = () => {
    setPagination({ ...pagination, currentPage: 1 });
    fetchTemplates();
  };

  // Handle open modal
  const handleOpenModal = async (template?: DealTemplateData) => {
    if (template) {
      setEditingTemplate(template);
      const isDefaultValue = (template as any).is_default;
      // Handle both string and boolean values
      const isDefault =
        typeof isDefaultValue === "string"
          ? isDefaultValue === "true"
          : Boolean(isDefaultValue);

      setFormData({
        industry_id: template.industry_id,
        name: template.name || "",
        description: template.description || "",
        is_default: isDefault,
      });
      setFields(
        (template.fields || []).map((field) => ({
          id: `field-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          field_name: field.field_name,
          field_type: field.field_type,
          options: field.options || [],
          is_required: field.is_required,
          require_approval: field?.require_approval || false,
          sort_order: field.sort_order,
        })),
      );
    } else {
      setEditingTemplate(null);
      setFormData({
        industry_id: null,
        name: "",
        description: "",
        is_default: false,
      });
      setFields([]);
    }
    setShowModal(true);
  };

  // Handle add field
  const handleAddField = () => {
    setFields([
      ...fields,
      {
        id: `field-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        field_name: "",
        field_type: "text",
        options: [],
        is_required: false,
        require_approval: false,
        sort_order: fields.length,
      },
    ]);
  };

  // Handle remove field
  const handleRemoveField = (index: number) => {
    setFields(
      fields
        .filter((_, i) => i !== index)
        .map((f, i) => ({ ...f, sort_order: i })),
    );
  };

  // Handle field change
  const handleFieldChange = (
    index: number,
    field: Partial<{
      field_name: string;
      field_type: "text" | "dropdown";
      options: string[];
      is_required: boolean;
      require_approval: boolean;
    }>,
  ) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...field };
    setFields(newFields);
  };

  // Handle add option to dropdown
  const handleAddOption = (fieldIndex: number, option: string) => {
    if (!option.trim()) return;
    const newFields = [...fields];
    if (!newFields[fieldIndex].options) {
      newFields[fieldIndex].options = [];
    }
    if (!newFields[fieldIndex].options.includes(option.trim())) {
      newFields[fieldIndex].options.push(option.trim());
    }
    setFields(newFields);
  };

  // Handle remove option from dropdown
  const handleRemoveOption = (fieldIndex: number, optionIndex: number) => {
    const newFields = [...fields];
    newFields[fieldIndex].options = newFields[fieldIndex].options.filter(
      (_, i) => i !== optionIndex,
    );
    setFields(newFields);
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    // Validate fields
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      if (!field.field_name.trim()) {
        toast.error(`Please enter a name for field ${i + 1}`);
        return;
      }
      if (
        field.field_type === "dropdown" &&
        (!field.options || field.options.length === 0)
      ) {
        toast.error(
          `Please add at least one option for dropdown field "${field.field_name}"`,
        );
        return;
      }
    }

    try {
      setSubmitting(true);

      const fieldsPayload = fields.map((f) => ({
        field_name: f.field_name.trim(),
        field_type: f.field_type,
        options: f.field_type === "dropdown" ? f.options : null,
        is_required: f.is_required,
        require_approval: f.require_approval,
        sort_order: f.sort_order,
      }));

      if (editingTemplate) {
        // Update payload doesn't require industry_id
        const updatePayload: UpdateDealTemplatePayload & {
          is_default?: string;
        } = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          fields: fieldsPayload,
          is_default: formData.is_default ? "true" : "false",
        };
        await updateDealTemplate(editingTemplate.id, updatePayload);
      } else {
        // Create payload requires industry_id

        const createPayload: CreateDealTemplatePayload & {
          is_default?: string;
        } = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          fields: fieldsPayload,
          is_default: formData.is_default ? "true" : "false",
        };
        await createDealTemplate(createPayload);
      }
      setShowModal(false);
      setEditingTemplate(null);
      await fetchTemplates();
    } catch (error: any) {
      // Error toast is handled in the API function
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deletingTemplate) return;
    try {
      await deleteDealTemplate(deletingTemplate.id);
      setShowDeleteModal(false);
      setDeletingTemplate(null);
      await fetchTemplates();
    } catch (error: any) {
      // Error toast is handled in the API function
    }
  };

  // Handle view
  const handleView = (template: DealTemplateData) => {
    setViewingTemplate(template);
    setShowViewModal(true);
  };

  // Pagination helpers
  const totalPages = Math.ceil(totalTemplates / pagination.perPage);
  const startIndex = (pagination.currentPage - 1) * pagination.perPage;
  const endIndex = startIndex + templates.length;

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, currentPage: page });
  };

  // Industry options for select
  const industryOptions = industries.map((ind) => ({
    value: ind.id,
    label: ind.name,
  }));

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Deal Templates"
      />
      <div>
        {/* Header */}
        <Card className="border-0 shadow-sm mb-3">
          <Card.Body className="p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0 fw-bold">Deal Templates</h5>
                <p className="text-muted mb-0 small">
                  Manage deal templates with custom fields for different
                  Business Types
                </p>
              </div>
              {session?.user?.permissions?.includes(
                "add-crm-deal-templates",
              ) && (
                <Button
                  variant="primary"
                  onClick={() => handleOpenModal()}
                  className="d-flex align-items-center gap-2"
                >
                  <PlusCircle size={18} />
                  Add Template
                </Button>
              )}
            </div>
          </Card.Body>
        </Card>

        {/* Search and Filter Bar */}
        <Card className="border-0 shadow-sm mb-3">
          <Card.Body className="p-3">
            <Row className="g-3">
              <Col md={12}>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Search templates by name or description..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearch();
                      }
                    }}
                  />
                  <Button variant="outline-secondary" onClick={handleSearch}>
                    <Search size={16} />
                  </Button>
                </InputGroup>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Templates Table */}
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            {loading ? (
              <div className="text-center p-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Loading templates...</p>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center p-5">
                <FileText size={48} className="text-muted mb-3" />
                <p className="text-muted">No deal templates found</p>
                <Button variant="primary" onClick={() => handleOpenModal()}>
                  <PlusCircle size={18} className="me-2" />
                  Add First Template
                </Button>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Name</th>

                        <th>Description</th>
                        <th>Fields</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {templates &&
                        templates.length > 0 &&
                        templates.map((template) => (
                          <tr key={template.id}>
                            <td>
                              <div className="fw-semibold">{template.name}</div>
                            </td>

                            <td>
                              <div className="text-muted small">
                                {template.description || (
                                  <span className="fst-italic">
                                    No description
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <Badge bg="secondary">
                                {template.fields?.length || 0} field(s)
                              </Badge>
                            </td>
                            <td>
                              <div className="d-flex justify-content-end gap-2">
                                <Button
                                  variant="outline-info"
                                  size="sm"
                                  onClick={() => handleView(template)}
                                >
                                  <Eye size={14} />
                                </Button>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleOpenModal(template)}
                                >
                                  <Edit size={14} />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => {
                                    setDeletingTemplate(template);
                                    setShowDeleteModal(true);
                                  }}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="d-flex justify-content-between align-items-center p-3 border-top">
                    <div className="text-muted small">
                      Showing {startIndex + 1} to {endIndex} of {totalTemplates}{" "}
                      templates
                    </div>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handlePageChange(1)}
                        disabled={pagination.currentPage === 1}
                      >
                        <ChevronsLeft size={16} />
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() =>
                          handlePageChange(pagination.currentPage - 1)
                        }
                        disabled={pagination.currentPage === 1}
                      >
                        <ChevronLeft size={16} />
                      </Button>
                      <div className="d-flex align-items-center px-3">
                        <span className="small">
                          Page {pagination.currentPage} of {totalPages}
                        </span>
                      </div>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() =>
                          handlePageChange(pagination.currentPage + 1)
                        }
                        disabled={pagination.currentPage === totalPages}
                      >
                        <ChevronRight size={16} />
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={pagination.currentPage === totalPages}
                      >
                        <ChevronsRight size={16} />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card.Body>
        </Card>

        {/* Create/Edit Modal */}
        <FormModal
          show={showModal}
          onHide={() => setShowModal(false)}
          title={
            editingTemplate ? "Edit Deal Template" : "Add New Deal Template"
          }
          desc="Please fill in the details below to create or update a deal template."
          size="lg"
          formHtml={
            <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Name <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter template name"
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter template description"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Check
                  type="switch"
                  id="is-default-switch"
                  label="Default"
                  checked={formData.is_default}
                  onChange={(e) =>
                    setFormData({ ...formData, is_default: e.target.checked })
                  }
                />
                <Form.Text className="text-muted">
                  Mark this template as the default template
                </Form.Text>
              </Form.Group>

              {/* Fields Section */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <Form.Label className="mb-0">
                    Fields <span className="text-danger">*</span>
                  </Form.Label>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    type="button"
                    onClick={handleAddField}
                    className="d-flex align-items-center gap-1"
                  >
                    <Plus size={14} />
                    Add Field
                  </Button>
                </div>
                {fields.length === 0 ? (
                  <div className="text-center p-4 border rounded text-muted">
                    <p className="mb-0">
                      No fields added. Click "Add Field" to get started.
                    </p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {fields.map((field, index) => (
                      <Card key={field.id} className="border">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div className="d-flex align-items-center gap-2">
                              <GripVertical size={16} className="text-muted" />
                              <span className="fw-semibold">
                                Field {index + 1}
                              </span>
                            </div>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              type="button"
                              onClick={() => handleRemoveField(index)}
                            >
                              <X size={14} />
                            </Button>
                          </div>
                          <Row className="g-3">
                            <Col md={6}>
                              <Form.Group>
                                <Form.Label>
                                  Field Name{" "}
                                  <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                  type="text"
                                  value={field.field_name}
                                  onChange={(e) =>
                                    handleFieldChange(index, {
                                      field_name: e.target.value,
                                    })
                                  }
                                  placeholder="e.g., License Type"
                                  required
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group>
                                <Form.Label>
                                  Field Type{" "}
                                  <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Select
                                  value={field.field_type}
                                  onChange={(e) =>
                                    handleFieldChange(index, {
                                      field_type: e.target.value as
                                        | "text"
                                        | "dropdown",
                                      options:
                                        e.target.value === "dropdown" ? [] : [],
                                    })
                                  }
                                >
                                  <option value="text">Text</option>
                                  <option value="dropdown">Dropdown</option>
                                </Form.Select>
                              </Form.Group>
                            </Col>
                          </Row>
                          {field.field_type === "dropdown" && (
                            <div className="mt-3">
                              <Form.Label>Options</Form.Label>
                              <div className="d-flex flex-wrap gap-2 mb-2">
                                {field.options.map((option, optIndex) => (
                                  <Badge
                                    key={`option-${index}-${optIndex}-${option}`}
                                    bg="primary"
                                    className="d-flex align-items-center gap-1"
                                    style={{
                                      fontSize: "0.875rem",
                                      padding: "0.5rem",
                                    }}
                                  >
                                    {option}
                                    <X
                                      size={12}
                                      style={{ cursor: "pointer" }}
                                      onClick={() =>
                                        handleRemoveOption(index, optIndex)
                                      }
                                    />
                                  </Badge>
                                ))}
                              </div>
                              <InputGroup>
                                <Form.Control
                                  type="text"
                                  placeholder="Enter option and press Enter"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      const input =
                                        e.target as HTMLInputElement;
                                      handleAddOption(index, input.value);
                                      input.value = "";
                                    }
                                  }}
                                />
                                <Button
                                  variant="outline-secondary"
                                  type="button"
                                  onClick={(e) => {
                                    const input = e.currentTarget
                                      .previousElementSibling as HTMLInputElement;
                                    handleAddOption(index, input.value);
                                    input.value = "";
                                  }}
                                >
                                  <Plus size={14} />
                                </Button>
                              </InputGroup>
                              <Form.Text className="text-muted">
                                Add options for the dropdown field
                              </Form.Text>
                            </div>
                          )}

                          <Row>
                            <Col md={6}>
                              <Form.Check
                                type="switch"
                                id={`field-required-${index}`}
                                label="Required"
                                checked={field.is_required}
                                onChange={(e) =>
                                  handleFieldChange(index, {
                                    is_required: e.target.checked,
                                  })
                                }
                                className="mt-3"
                              />
                            </Col>
                            <Col md={6}>
                              <Form.Check
                                type="switch"
                                id={`field_require_approval-${index}`}
                                label="Require Approval"
                                checked={field.require_approval}
                                onChange={(e) =>
                                  handleFieldChange(index, {
                                    require_approval: e.target.checked,
                                  })
                                }
                                className="mt-3"
                              />
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          }
          submitButtonText={editingTemplate ? "Update" : "Create"}
          cancelButtonText="Cancel"
          onSubmit={handleSubmit}
          onCancel={() => setShowModal(false)}
          submitButtonVariant="primary"
          cancelButtonVariant="secondary"
          isSubmitting={submitting}
          isSubmitDisabled={submitting}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          show={showDeleteModal}
          onHide={() => {
            setShowDeleteModal(false);
            setDeletingTemplate(null);
          }}
          onConfirm={handleDelete}
          itemName={deletingTemplate?.name}
          itemType="deal template"
        />

        {/* View Modal */}
        {viewingTemplate && (
          <Modal
            show={showViewModal}
            onHide={() => setShowViewModal(false)}
            centered
            size="lg"
          >
            <Modal.Header closeButton>
              <Modal.Title>Deal Template Details</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
              <div className="mb-3">
                <Form.Label className="text-muted small">ID</Form.Label>
                <div className="fw-semibold">#{viewingTemplate.id}</div>
              </div>
              <div className="mb-3">
                <Form.Label className="text-muted small">Name</Form.Label>
                <div className="fw-semibold">{viewingTemplate.name}</div>
              </div>
              <div className="mb-3">
                <Form.Label className="text-muted small">Industry</Form.Label>
                <div>
                  {viewingTemplate.industry ? (
                    <Badge bg="info">{viewingTemplate.industry.name}</Badge>
                  ) : (
                    <span className="text-muted">N/A</span>
                  )}
                </div>
              </div>
              <div className="mb-3">
                <Form.Label className="text-muted small">
                  Description
                </Form.Label>
                <div>
                  {viewingTemplate.description || (
                    <span className="text-muted fst-italic">
                      No description
                    </span>
                  )}
                </div>
              </div>
              <div className="mb-3">
                <Form.Label className="text-muted small">Default</Form.Label>
                <div>
                  {(viewingTemplate as any).is_default ? (
                    <Badge bg="success">Yes</Badge>
                  ) : (
                    <Badge bg="secondary">No</Badge>
                  )}
                </div>
              </div>
              <div className="mb-3">
                <Form.Label className="text-muted small">Fields</Form.Label>
                {viewingTemplate.fields && viewingTemplate.fields.length > 0 ? (
                  <div className="d-flex flex-column gap-2">
                    {viewingTemplate.fields.map((field, fieldIndex) => (
                      <Card
                        key={`view-field-${field.id || fieldIndex}-${field.field_name}-${field.sort_order}`}
                        className="border"
                      >
                        <Card.Body className="p-3">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <div className="fw-semibold">
                                {field.field_name}
                              </div>
                              <div className="small text-muted">
                                Type: {field.field_type}
                                {field.is_required && (
                                  <Badge bg="danger" className="ms-2">
                                    Required
                                  </Badge>
                                )}
                              </div>
                              {field.field_type === "dropdown" &&
                                field.options && (
                                  <div className="mt-2">
                                    <div className="small text-muted mb-1">
                                      Options:
                                    </div>
                                    <div className="d-flex flex-wrap gap-1">
                                      {field.options.map((option, optIndex) => (
                                        <Badge
                                          key={`view-option-${field.id || fieldIndex}-${optIndex}-${option}`}
                                          bg="secondary"
                                        >
                                          {option}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted fst-italic">No fields</span>
                )}
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setShowViewModal(false)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setShowViewModal(false);
                  handleOpenModal(viewingTemplate);
                }}
              >
                Edit
              </Button>
            </Modal.Footer>
          </Modal>
        )}
      </div>
    </React.Fragment>
  );
};

DealTemplatesPage.getLayout = (page: React.ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default DealTemplatesPage;
