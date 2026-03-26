import "@assets/scss/datatable-style.scss";
import React, { useState, useEffect, useMemo, useCallback } from "react";
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
} from "@utils/crm";
import { reportApiErrorFromCatch } from "@utils/sentryLogger";
import GenericTable, {
  TableColumn,
  ToolbarConfig,
} from "@components/GenericTable";
import FormModal from "@pages/partial/FormModal";
import { useSession } from "next-auth/react";
import {
  Button,
  Row,
  Col,
  Form,
  Card,
  InputGroup,
  Modal,
  Badge,
} from "react-bootstrap";
import {
  PlusCircle,
  Eye,
  Edit,
  Trash2,
  X,
  FileText,
  Plus,
  GripVertical,
} from "lucide-react";
import { toast } from "react-toastify";
import "@assets/scss/common.scss";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";

const PERMISSION_ADD_DEAL_TEMPLATES = "add-crm-deal-templates";

type DealTemplateFieldForm = {
  id: string;
  field_name: string;
  field_type: "text" | "dropdown";
  options: string[];
  is_required: boolean;
  require_approval: boolean;
  sort_order: number;
};

type DealTemplateWithDefault = DealTemplateData & { is_default?: unknown };

function templateIsDefault(template: DealTemplateData): boolean {
  const v = (template as DealTemplateWithDefault).is_default;
  if (typeof v === "string") return v === "true" || v === "1";
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  return false;
}



function newLocalFieldId(): string {
  const c = globalThis.crypto as Crypto | undefined;

  if (c !== undefined) {
    if ("randomUUID" in c) {
      return c.randomUUID();
    }
    if ("getRandomValues" in c) {
      const bytes = (c as Crypto).getRandomValues(new Uint8Array(16));
      return "field-" + Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
    }
  }

  return "field-" + String(Date.now()) + "-" + Math.random().toString(36).slice(2, 11);
}

function consumeHandledApiError(error: unknown, source: string): void {
  reportApiErrorFromCatch(error, source, { scope: "DealTemplates" });
}

const DealTemplatesPage = () => {
  const { data: session } = useSession();
  // State
  const [templates, setTemplates] = useState<DealTemplateData[]>([]);
  const [totalTemplates, setTotalTemplates] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 15,
  });
  const [search, setSearch] = useState("");
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
  const [fields, setFields] = useState<DealTemplateFieldForm[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const params: { page: number; per_page: number; search?: string } = {
        page: pagination.currentPage,
        per_page: pagination.perPage,
      };
      const trimmed = search.trim();
      if (trimmed) {
        params.search = trimmed;
      }
      const response = await getDealTemplates(params);
      setTemplates(response.data || []);
      setTotalTemplates(response.total || 0);
    } catch (error: unknown) {
      consumeHandledApiError(error, "DealTemplates.fetchTemplates");
      setTemplates([]);
      setTotalTemplates(0);
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.perPage, search]);

  useEffect(() => {
    void fetchTemplates();
  }, [fetchTemplates]);

  const handleOpenModal = useCallback((template?: DealTemplateData) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        industry_id: template.industry_id,
        name: template.name || "",
        description: template.description || "",
        is_default: templateIsDefault(template),
      });
      setFields(
        (template.fields || []).map((field) => ({
          id: newLocalFieldId(),
          field_name: field.field_name,
          field_type: field.field_type,
          options: field.options || [],
          is_required: field.is_required,
          require_approval: field.require_approval ?? false,
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
  }, []);

  // Handle add field
  const handleAddField = () => {
    setFields((prev) => [
      ...prev,
      {
        id: newLocalFieldId(),
        field_name: "",
        field_type: "text",
        options: [],
        is_required: false,
        require_approval: false,
        sort_order: prev.length,
      },
    ]);
  };

  // Handle remove field
  const handleRemoveField = (index: number) => {
    setFields((prev) =>
      prev
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
    setFields((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...field };
      return next;
    });
  };

  // Handle add option to dropdown
  const handleAddOption = (fieldIndex: number, option: string) => {
    const trimmed = option.trim();
    if (!trimmed) return;
    setFields((prev) => {
      const next = [...prev];
      const row = next[fieldIndex];
      if (!row) return prev;
      const opts = row.options ?? [];
      if (opts.includes(trimmed)) return prev;
      next[fieldIndex] = { ...row, options: [...opts, trimmed] };
      return next;
    });
  };

  // Handle remove option from dropdown
  const handleRemoveOption = (fieldIndex: number, optionIndex: number) => {
    setFields((prev) => {
      const next = [...prev];
      const row = next[fieldIndex];
      if (!row) return prev;
      next[fieldIndex] = {
        ...row,
        options: row.options.filter((_, i) => i !== optionIndex),
      };
      return next;
    });
  };

  const handleSubmit = useCallback(async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a template name");
      return;
    }

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
        const updatePayload: UpdateDealTemplatePayload & { is_default?: string } = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          fields: fieldsPayload,
          is_default: formData.is_default ? "true" : "false",
        };
        await updateDealTemplate(editingTemplate.id, updatePayload);
      } else {
        const createPayload: CreateDealTemplatePayload & { is_default?: string } = {
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
    } catch (error: unknown) {
      consumeHandledApiError(error, "DealTemplates.handleSubmit");
    } finally {
      setSubmitting(false);
    }
  }, [editingTemplate, fields, formData, fetchTemplates]);

  const handleDelete = useCallback(async () => {
    if (!deletingTemplate) return;
    try {
      await deleteDealTemplate(deletingTemplate.id);
      setShowDeleteModal(false);
      setDeletingTemplate(null);
      await fetchTemplates();
    } catch (error: unknown) {
      consumeHandledApiError(error, "DealTemplates.handleDelete");
    }
  }, [deletingTemplate, fetchTemplates]);

  const handleView = useCallback((template: DealTemplateData) => {
    setViewingTemplate(template);
    setShowViewModal(true);
  }, []);

  const handlePromptDelete = useCallback((template: DealTemplateData) => {
    setDeletingTemplate(template);
    setShowDeleteModal(true);
  }, []);

  const templatesTableColumns = useMemo<TableColumn<DealTemplateData>[]>(
    () => [
      {
        key: "name",
        label: "Name",
        sortable: true,
        type: "custom",
        render: (template) => (
          <div className="fw-semibold">{template.name}</div>
        ),
      },
      {
        key: "description",
        label: "Description",
        sortable: false,
        type: "custom",
        render: (template) => (
          <div className="text-muted small">
            {template.description || (
              <span className="fst-italic">No description</span>
            )}
          </div>
        ),
      },
      {
        key: "fields",
        label: "Fields",
        sortable: false,
        type: "custom",
        render: (template) => (
          <Badge bg="secondary">{template.fields?.length || 0} field(s)</Badge>
        ),
      },
      {
        key: "actions",
        label: "Actions",
        sortable: false,
        align: "right",
        type: "custom",
        render: (template) => (
          <div className="d-flex justify-content-end gap-2">
            <Button
              variant="outline-info"
              size="sm"
              onClick={() => handleView(template)}
              aria-label={"View deal template " + (template.name ?? "")}
            >
              <Eye size={14} />
            </Button>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => handleOpenModal(template)}
              aria-label={"Edit deal template " + (template.name ?? "")}
            >
              <Edit size={14} />
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => handlePromptDelete(template)}
              aria-label={"Delete deal template " + (template.name ?? "")}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        ),
      },
    ],
    [handleView, handleOpenModal, handlePromptDelete],
  );

  const templatesToolbarConfig = useMemo<ToolbarConfig>(
    () => ({
      showSearch: true,
      searchValue: search,
      searchPlaceholder: "Search templates by name or description...",
      onSearchChange: setSearch,
      onSearch: () => {
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
      },
      rightActions: (
        <div className="d-flex gap-2">
          {session?.user?.permissions?.includes(PERMISSION_ADD_DEAL_TEMPLATES) && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenModal()}
              className="d-flex align-items-center gap-2"
            >
              <PlusCircle size={16} />
              Add Template
            </Button>
          )}
        </div>
      ),
    }),
    [search, session?.user?.permissions, handleOpenModal],
  );

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Deal Templates"
      />
      <div>
        <GenericTable<DealTemplateData>
          data={templates}
          columns={templatesTableColumns}
          showToolbar
          toolbar={templatesToolbarConfig}
          pagination={{
            currentPage: pagination.currentPage,
            rowsPerPage: pagination.perPage,
            totalRows: totalTemplates,
            pageSizeOptions: [10, 15, 25, 50],
          }}
          onPaginationChange={(page, rowsPerPage) => {
            setPagination({ currentPage: page, perPage: rowsPerPage });
          }}
          loading={loading}
          emptyMessage={
            <div className="text-center p-5">
              <FileText size={48} className="text-muted mb-3" />
              <p className="text-muted">No deal templates found</p>
              {session?.user?.permissions?.includes(PERMISSION_ADD_DEAL_TEMPLATES) && (
                <Button variant="primary" onClick={() => handleOpenModal()}>
                  <PlusCircle size={18} className="me-2" />
                  Add First Template
                </Button>
              )}
            </div>
          }
          uniqueKey="id"
          showToolbarActions={false}
        />

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
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter template description"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Check
                  type="switch"
                  id="is-default-switch"
                  label="Default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData((prev) => ({ ...prev, is_default: e.target.checked }))}
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
                              aria-label={"Remove field " + String(index + 1)}
                            >
                              <X size={14} aria-hidden />
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
                                  onChange={(e) => {
                                    const ft = e.target.value as "text" | "dropdown";
                                    handleFieldChange(index, {
                                      field_type: ft,
                                      options: ft === "text" ? [] : field.options,
                                    });
                                  }}
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
                                    <span>{option}</span>
                                    <button
                                      type="button"
                                      className="btn btn-link text-white p-0 border-0 lh-1 ms-1"
                                      aria-label={"Remove option " + option}
                                      onClick={() => handleRemoveOption(index, optIndex)}
                                    >
                                      <X size={12} aria-hidden />
                                    </button>
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
                                  aria-label="Add dropdown option"
                                  onClick={(e) => {
                                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                    handleAddOption(index, input.value);
                                    input.value = "";
                                  }}
                                >
                                  <Plus size={14} aria-hidden />
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
                  {templateIsDefault(viewingTemplate) ? (
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
