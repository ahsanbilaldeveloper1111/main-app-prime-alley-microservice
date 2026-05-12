import "@assets/scss/datatable-style.scss";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  getDealTemplates,
  createDealTemplate,
  updateDealTemplate,
  deleteDealTemplate,
  getIndustries,
  DealTemplateData,
  CreateDealTemplatePayload,
  UpdateDealTemplatePayload,
} from "@utils/crm";
import { normalizeSearchQuery } from "@utils/Helper";
import { reportApiErrorFromCatch } from "@utils/sentryLogger";
import GenericTable, {
  TableColumn,
  ToolbarConfig,
} from "@components/GenericTable";
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
import DeleteConfirmationModal from "@components/page-partials/DeleteConfirmationModal";
import { CrmDescriptionDetailsBlock, CrmTruncatedDescriptionCell } from "@components/crm/crmTruncatedDescriptionCell";
import {
  CRM_DIALOG_FOOTER_ACTIONS_ROW_STYLE,
  CRM_DIALOG_PRIMARY_BUTTON_STYLE,
  CRM_DIALOG_SECONDARY_BUTTON_STYLE,
} from "@components/crm/crmDialogActionButtonStyles";
import { useCrmSettingsTableState } from "@hooks/useCrmSettingsTableState";
import { useDebouncedSearchInput } from "@hooks/useDebouncedSearchInput";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import type { CrmPageDisplayProps } from "@page-modules/crm/crmPageDisplayProps";
import { crmAppKeys } from "../../../query/keys";

const { PERMISSIONS } = HEADER_CONSTANTS;

const DEAL_TEMPLATES_TABLE_COLUMN_STORAGE_KEY =
  "dealTemplatesSelectedColumns";
const DEAL_TEMPLATES_TABLE_SELECTABLE_KEYS = [
  "name",
  "description",
  "fields",
  "actions",
] as const;
const DEFAULT_DEAL_TEMPLATES_TABLE_COLUMNS = [
  "name",
  "description",
  "fields",
  "actions",
];

const TEMPLATE_FORM_LABEL_STYLE: React.CSSProperties = {
  display: "block",
  fontSize: "14px",
  fontWeight: 600,
  color: "#141414",
  marginBottom: "8px",
};

const TEMPLATE_FORM_INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  minHeight: "40px",
  padding: "10px 12px",
  border: "1px solid #8a8a8a",
  borderRadius: "4px",
  fontSize: "14px",
  outline: "none",
};

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

let localFieldIdCounter = 0;


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

  localFieldIdCounter += 1;
  return `field-${Date.now()}-${localFieldIdCounter}`;
}

function consumeHandledApiError(error: unknown, source: string): void {
  reportApiErrorFromCatch(error, source, { scope: "DealTemplates" });
}

function DealTemplatesPage({ hideBreadcrumb }: CrmPageDisplayProps = {}) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const {
    pagination,
    setPagination,
    selectedColumns,
    setSelectedColumns,
    handlePaginationChange,
  } = useCrmSettingsTableState({
    defaultSelectedColumns: DEFAULT_DEAL_TEMPLATES_TABLE_COLUMNS,
    selectableColumnKeys: DEAL_TEMPLATES_TABLE_SELECTABLE_KEYS,
    columnStorageKey: DEAL_TEMPLATES_TABLE_COLUMN_STORAGE_KEY,
  });
  const {
    inputValue: searchInput,
    queryValue: search,
    handleInputChange: handleSearchChange,
    submitQuery: submitSearch,
  } = useDebouncedSearchInput({ normalize: normalizeSearchQuery });
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<DealTemplateData | null>(null);
  const [deletingTemplate, setDeletingTemplate] =
    useState<DealTemplateData | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTemplatePending, setDeletingTemplatePending] = useState(false);
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

  const templatesListQuery = useQuery({
    queryKey: crmAppKeys.dealTemplatesPage.list({
      page: pagination.currentPage,
      perPage: pagination.rowsPerPage,
      search: search || "",
    }),
    queryFn: async () => {
      const params: { page: number; per_page: number; search?: string } = {
        page: pagination.currentPage,
        per_page: pagination.rowsPerPage,
      };
      if (search) {
        params.search = search;
      }
      try {
        return await getDealTemplates(params);
      } catch (error: unknown) {
        consumeHandledApiError(error, "DealTemplates.fetchTemplates");
        throw error;
      }
    },
  });

  const industriesQuery = useQuery({
    queryKey: crmAppKeys.campaigns.industries(),
    queryFn: async () => {
      try {
        const res = await getIndustries({ per_page: 1000, page: 1 });
        return res?.data ?? [];
      } catch (error: unknown) {
        consumeHandledApiError(error, "DealTemplates.fetchIndustries");
        throw error;
      }
    },
  });

  const templates = templatesListQuery.data?.data ?? [];
  const totalTemplates = templatesListQuery.data?.total ?? 0;
  const loading = templatesListQuery.isFetching;
  const industries = industriesQuery.data ?? [];

  useEffect(() => {
    setPagination((prev) =>
      prev.currentPage === 1 ? prev : { ...prev, currentPage: 1 },
    );
  }, [search, setPagination]);

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
        await updateDealTemplate(
          editingTemplate.id,
          {
            industry_id: formData.industry_id ?? undefined,
            name: formData.name.trim(),
            description: formData.description.trim() || undefined,
            fields: fieldsPayload,
            is_default: formData.is_default ? "true" : "false",
          } as UpdateDealTemplatePayload & { industry_id?: number; is_default?: string },
        );
      } else {
        await createDealTemplate({
          industry_id: formData.industry_id ?? undefined,
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          fields: fieldsPayload,
          is_default: formData.is_default ? "true" : "false",
        } as CreateDealTemplatePayload & { industry_id?: number; is_default?: string });
      }
      setShowModal(false);
      setEditingTemplate(null);
      await queryClient.invalidateQueries({ queryKey: crmAppKeys.dealTemplatesPage.all() });
      await queryClient.invalidateQueries({ queryKey: crmAppKeys.campaigns.dealTemplates() });
    } catch (error: unknown) {
      consumeHandledApiError(error, "DealTemplates.handleSubmit");
    } finally {
      setSubmitting(false);
    }
  }, [editingTemplate, fields, formData, queryClient]);

  const handleDelete = useCallback(async () => {
    if (!deletingTemplate) return;
    try {
      setDeletingTemplatePending(true);
      await deleteDealTemplate(deletingTemplate.id);
      setShowDeleteModal(false);
      setDeletingTemplate(null);
      await queryClient.invalidateQueries({ queryKey: crmAppKeys.dealTemplatesPage.all() });
      await queryClient.invalidateQueries({ queryKey: crmAppKeys.campaigns.dealTemplates() });
    } catch (error: unknown) {
      consumeHandledApiError(error, "DealTemplates.handleDelete");
    } finally {
      setDeletingTemplatePending(false);
    }
  }, [deletingTemplate, queryClient]);

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
        width: "260px",
        render: (template) => (
          <div className="fw-semibold">{template.name}</div>
        ),
      },
      {
        key: "description",
        label: "Description",
        sortable: false,
        type: "custom",
        width: "420px",
        render: (template) => (
          <CrmTruncatedDescriptionCell
            text={template.description}
            emptyDisplay={<span className="fst-italic">No description</span>}
          />
        ),
      },
      {
        key: "fields",
        label: "Fields",
        sortable: false,
        type: "custom",
        width: "140px",
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
        width: "170px",
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
            {session?.user?.permissions?.includes(
              PERMISSIONS.EDIT_CRM_DEAL_TEMPLATES,
            ) && (
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => handleOpenModal(template)}
                aria-label={"Edit deal template " + (template.name ?? "")}
              >
                <Edit size={14} />
              </Button>
            )}
            {session?.user?.permissions?.includes(
              PERMISSIONS.DELETE_CRM_DEAL_TEMPLATES,
            ) && (
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => handlePromptDelete(template)}
                aria-label={"Delete deal template " + (template.name ?? "")}
              >
                <Trash2 size={14} />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [
      handleView,
      handleOpenModal,
      handlePromptDelete,
      session?.user?.permissions,
    ],
  );

  const templatesToolbarConfig = useMemo<ToolbarConfig>(
    () => ({
      showSearch: true,
      searchValue: searchInput,
      searchPlaceholder: "Search templates by name or description...",
      onSearchChange: handleSearchChange,
      onSearch: () => {
        submitSearch();
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
      },
      rightActions: (
        <div className="d-flex gap-2">
          {session?.user?.permissions?.includes(PERMISSIONS.CREATE_CRM_DEAL_TEMPLATES) && (
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
    [
      handleOpenModal,
      handleSearchChange,
      searchInput,
      session?.user?.permissions,
      submitSearch,
    ],
  );

  return (
    <React.Fragment>
      {!hideBreadcrumb && (
        <BreadcrumbItem
          mainTitle="CRM"
          mainLink="/crm/dashboard"
          subTitle="Deal Templates"
        />
      )}
      <div>
        <GenericTable<DealTemplateData>
          data={templates}
          columns={templatesTableColumns}
          showToolbar
          toolbar={templatesToolbarConfig}
          pagination={{
            currentPage: pagination.currentPage,
            rowsPerPage: pagination.rowsPerPage,
            totalRows: totalTemplates,
            pageSizeOptions: [10, 15, 25, 50],
          }}
          onPaginationChange={handlePaginationChange}
          customizableColumns
          selectedColumns={selectedColumns}
          defaultSelectedColumns={DEFAULT_DEAL_TEMPLATES_TABLE_COLUMNS}
          onColumnChange={setSelectedColumns}
          columnStorageKey={DEAL_TEMPLATES_TABLE_COLUMN_STORAGE_KEY}
          loading={loading}
          emptyMessage={
            <div className="text-center p-5">
              <FileText size={48} className="text-muted mb-3" />
              <p className="text-muted">No deal templates found</p>
              {session?.user?.permissions?.includes(PERMISSIONS.CREATE_CRM_DEAL_TEMPLATES) && (
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

        {/* Create/Edit Sidebar */}
        {showModal && (
          <>
            <button
              type="button"
              className="contact-sidebar-overlay"
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1000,
                background: "transparent",
                border: "none",
                padding: 0,
              }}
              onClick={() => {
                if (!submitting) {
                  setShowModal(false);
                }
              }}
              aria-label="Close deal template sidebar"
              disabled={submitting}
            />

            <div
              className="contact-sidebar-container"
              style={{
                position: "fixed",
                top: 0,
                right: 0,
                width: "600px",
                maxWidth: "100%",
                height: "100vh",
                backgroundColor: "#ffffff",
                boxShadow: "-2px 0 8px rgba(0, 0, 0, 0.1)",
                zIndex: 999999,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                className="contact-sidebar-header"
                style={{
                  padding: "20px 24px",
                  borderBottom: "1px solid #eaf0f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <h2
                  className="contact-sidebar-title"
                  style={{
                    fontSize: "20px",
                    fontWeight: "600",
                    color: "#141414",
                    margin: 0,
                  }}
                >
                  {editingTemplate ? "Edit Deal Template" : "Add New Deal Template"}
                </h2>
                <button
                  type="button"
                  className="contact-sidebar-close-btn"
                  onClick={() => {
                    if (!submitting) {
                      setShowModal(false);
                    }
                  }}
                  disabled={submitting}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: "4px",
                    cursor: submitting ? "not-allowed" : "pointer",
                    color: "#718096",
                    display: "flex",
                    alignItems: "center",
                  }}
                  aria-label="Close deal template sidebar"
                >
                  <X size={24} />
                </button>
              </div>

              <Form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit().catch((error: unknown) => {
                    consumeHandledApiError(error, "DealTemplates.sidebarSubmit");
                  });
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  minHeight: 0,
                }}
              >
                <div
                  className="contact-sidebar-content"
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "40px",
                  }}
                >
                  <p
                    style={{
                      color: "#64748b",
                      fontSize: "14px",
                      marginTop: 0,
                      marginBottom: "20px",
                    }}
                  >
                    Please fill in the details below to create or update a deal template.
                  </p>

                  <Form.Group className="mb-3">
                    <Form.Label style={TEMPLATE_FORM_LABEL_STYLE}>
                      Name <span style={{ color: "#f2545b" }}>*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter template name"
                      required
                      style={TEMPLATE_FORM_INPUT_STYLE}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label style={TEMPLATE_FORM_LABEL_STYLE}>
                      Product Group
                    </Form.Label>
                    <Form.Select
                      value={formData.industry_id == null ? "" : String(formData.industry_id)}
                      onChange={(e) => {
                        const v = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          industry_id: v ? Number(v) : null,
                        }));
                      }}
                      style={TEMPLATE_FORM_INPUT_STYLE}
                      disabled={industries.length === 0}
                    >
                      <option value="">
                        {industries.length === 0
                          ? "No product groups found"
                          : "Select product group (optional)"}
                      </option>
                      {industries.map((ind) => (
                        <option key={ind.id} value={ind.id}>
                          {ind.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label style={TEMPLATE_FORM_LABEL_STYLE}>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter template description"
                      style={{
                        ...TEMPLATE_FORM_INPUT_STYLE,
                        minHeight: "96px",
                        resize: "vertical",
                      }}
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

                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <Form.Label className="mb-0" style={TEMPLATE_FORM_LABEL_STYLE}>
                        Fields <span style={{ color: "#f2545b" }}>*</span>
                      </Form.Label>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        type="button"
                        onClick={handleAddField}
                        className="d-flex align-items-center gap-1"
                        disabled={submitting}
                      >
                        <Plus size={14} aria-hidden />
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
                                  <span className="fw-semibold">Field {index + 1}</span>
                                </div>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  type="button"
                                  onClick={() => handleRemoveField(index)}
                                  aria-label={"Remove field " + String(index + 1)}
                                  disabled={submitting}
                                >
                                  <X size={14} aria-hidden />
                                </Button>
                              </div>

                              <Row className="g-3">
                                <Col md={6}>
                                  <Form.Group>
                                    <Form.Label style={TEMPLATE_FORM_LABEL_STYLE}>
                                      Field Name <span style={{ color: "#f2545b" }}>*</span>
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
                                      disabled={submitting}
                                      style={TEMPLATE_FORM_INPUT_STYLE}
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={6}>
                                  <Form.Group>
                                    <Form.Label style={TEMPLATE_FORM_LABEL_STYLE}>
                                      Field Type <span style={{ color: "#f2545b" }}>*</span>
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
                                      disabled={submitting}
                                      style={TEMPLATE_FORM_INPUT_STYLE}
                                    >
                                      <option value="text">Text</option>
                                      <option value="dropdown">Dropdown</option>
                                    </Form.Select>
                                  </Form.Group>
                                </Col>
                              </Row>

                              {field.field_type === "dropdown" && (
                                <div className="mt-3">
                                  <Form.Label style={TEMPLATE_FORM_LABEL_STYLE}>Options</Form.Label>
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
                                          disabled={submitting}
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
                                          const input = e.target as HTMLInputElement;
                                          handleAddOption(index, input.value);
                                          input.value = "";
                                        }
                                      }}
                                      disabled={submitting}
                                      style={TEMPLATE_FORM_INPUT_STYLE}
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
                                      disabled={submitting}
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
                                    disabled={submitting}
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
                                    disabled={submitting}
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

                <div
                  className="contact-sidebar-footer"
                  style={{
                    padding: "16px 24px",
                    borderTop: "1px solid #eaf0f6",
                    display: "flex",
                    gap: "12px",
                    justifyContent: "flex-start",
                  }}
                >
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: submitting ? "#cbd5e0" : "#0091ae",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "14px",
                      fontWeight: "500",
                      cursor: submitting ? "not-allowed" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                    onMouseEnter={(e) => {
                      if (submitting) {
                        return;
                      }
                      e.currentTarget.style.backgroundColor = "#007a94";
                    }}
                    onMouseLeave={(e) => {
                      if (submitting) {
                        return;
                      }
                      e.currentTarget.style.backgroundColor = "#0091ae";
                    }}
                  >
                    {editingTemplate ? "Update" : "Create"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!submitting) {
                        setShowModal(false);
                      }
                    }}
                    disabled={submitting}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "transparent",
                      color: submitting ? "#a0aec0" : "#141414",
                      border: "1px solid #8a8a8a",
                      borderRadius: "4px",
                      fontSize: "14px",
                      fontWeight: "500",
                      cursor: submitting ? "not-allowed" : "pointer",
                    }}
                    onMouseEnter={(e) => {
                      if (submitting) {
                        return;
                      }
                      e.currentTarget.style.backgroundColor = "#f7fafc";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </Form>
            </div>
          </>
        )}

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
          loading={deletingTemplatePending}
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
                <Form.Label className="text-muted small">Name</Form.Label>
                <div className="fw-semibold">{viewingTemplate.name}</div>
              </div>
              <div className="mb-3">
                <Form.Label className="text-muted small">
                  Description
                </Form.Label>
                <CrmDescriptionDetailsBlock
                  text={viewingTemplate.description}
                  emptyDisplay="No description"
                />
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
            <Modal.Footer className="border-0 pt-0">
              <div
                className="w-100 d-flex justify-content-end"
                style={CRM_DIALOG_FOOTER_ACTIONS_ROW_STYLE}
              >
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowViewModal(false);
                    handleOpenModal(viewingTemplate);
                  }}
                  style={CRM_DIALOG_PRIMARY_BUTTON_STYLE}
                >
                  <Edit size={16} aria-hidden />
                  Edit
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowViewModal(false)}
                  style={CRM_DIALOG_SECONDARY_BUTTON_STYLE}
                >
                  Close
                </Button>
              </div>
            </Modal.Footer>
          </Modal>
        )}
      </div>
    </React.Fragment>
  );
}

DealTemplatesPage.getLayout = (page: React.ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default DealTemplatesPage;
