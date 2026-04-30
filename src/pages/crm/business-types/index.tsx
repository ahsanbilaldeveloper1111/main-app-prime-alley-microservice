import "@assets/scss/datatable-style.scss";
import React, { useState, useEffect, useMemo, useCallback, ReactElement } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  getBusinessTypes,
  createBusinessType,
  updateBusinessType,
  deleteBusinessType,
  BusinessTypeData,
  CreateBusinessTypePayload,
  UpdateBusinessTypePayload,
} from "@utils/crm";
import { reportApiErrorFromCatch } from "@utils/sentryLogger";
import { formatDateTimeToLocal, GlobalDateFormat } from "@utils/Helper";
import GenericTable, {
  TableColumn,
  ToolbarConfig,
} from "@components/GenericTable";
import {
  Button,
  Form,
  Modal,
  Spinner,
} from "react-bootstrap";
import {
  AlertCircle,
  PlusCircle,
  Edit,
  Trash2,
  Check,
} from "lucide-react";
import "@assets/scss/common.scss";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import { CrmTruncatedDescriptionCell } from "@components/crm/crmTruncatedDescriptionCell";
import {
  CRM_DIALOG_FOOTER_ACTIONS_ROW_STYLE,
  CRM_DIALOG_PRIMARY_BUTTON_STYLE,
  CRM_DIALOG_SECONDARY_BUTTON_STYLE,
} from "@components/crm/crmDialogActionButtonStyles";
import { useSession } from "next-auth/react";
import { useCrmSettingsTableState } from "@hooks/useCrmSettingsTableState";
import { useDebouncedSearchInput } from "@hooks/useDebouncedSearchInput";
import { HEADER_CONSTANTS } from "@constants/headerConstants";

const { PERMISSIONS } = HEADER_CONSTANTS;
const BUSINESS_TYPES_TABLE_COLUMN_STORAGE_KEY =
  "businessTypesSelectedColumns";
const BUSINESS_TYPES_TABLE_SELECTABLE_KEYS = [
  "name",
  "description",
  "created_at",
  "actions",
] as const;
const DEFAULT_BUSINESS_TYPES_TABLE_COLUMNS = [
  "name",
  "description",
  "created_at",
  "actions",
];

function consumeHandledApiError(error: unknown, source: string): void {
  reportApiErrorFromCatch(error, source, { scope: "BusinessTypes" });
}

type BusinessTypeFormState = {
  name: string;
  description: string;
};

const EMPTY_FORM: BusinessTypeFormState = {
  name: "",
  description: "",
};

function modalTitle(editing: BusinessTypeData | null): string {
  return editing ? "Edit Business Type" : "Add New Business Type";
}

function primarySubmitLabel(submitting: boolean, editing: BusinessTypeData | null): string {
  if (submitting) return editing ? "Updating..." : "Creating...";
  return editing ? "Update" : "Create";
}

const BusinessTypes = () => {
  const { data: session } = useSession();
  // State
  const [businessTypes, setBusinessTypes] = useState<BusinessTypeData[]>([]);
  const [totalBusinessTypes, setTotalBusinessTypes] = useState(0);
  const [loading, setLoading] = useState(true);
  const {
    pagination,
    setPagination,
    selectedColumns,
    setSelectedColumns,
    handlePaginationChange,
  } = useCrmSettingsTableState({
    defaultSelectedColumns: DEFAULT_BUSINESS_TYPES_TABLE_COLUMNS,
    selectableColumnKeys: BUSINESS_TYPES_TABLE_SELECTABLE_KEYS,
    columnStorageKey: BUSINESS_TYPES_TABLE_COLUMN_STORAGE_KEY,
  });
  const {
    inputValue: searchInput,
    queryValue: search,
    handleInputChange: handleSearchChange,
    submitQuery: submitSearch,
  } = useDebouncedSearchInput();
  const [showModal, setShowModal] = useState(false);
  const [editingBusinessType, setEditingBusinessType] = useState<BusinessTypeData | null>(null);
  const [deletingBusinessType, setDeletingBusinessType] = useState<BusinessTypeData | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingBusinessTypePending, setDeletingBusinessTypePending] = useState(false);
  const [formData, setFormData] = useState<BusinessTypeFormState>({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);

  const fetchBusinessTypes = useCallback(async () => {
    setLoading(true);
    try {
      const params: { page: number; per_page: number; search?: string } = {
        page: pagination.currentPage,
        per_page: pagination.rowsPerPage,
      };
      const trimmed = search.trim();
      if (trimmed) {
        params.search = trimmed;
      }
      const response = await getBusinessTypes(params);
      setBusinessTypes(response?.data || []);
      setTotalBusinessTypes(response.total || 0);
    } catch (error: unknown) {
      consumeHandledApiError(error, "BusinessTypes.fetchBusinessTypes");
      setBusinessTypes([]);
      setTotalBusinessTypes(0);
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.rowsPerPage, search]);

  useEffect(() => {
    fetchBusinessTypes().catch((error: unknown) => {
      consumeHandledApiError(error, "BusinessTypes.useEffect");
    });
  }, [fetchBusinessTypes]);

  useEffect(() => {
    setPagination((prev) =>
      prev.currentPage === 1 ? prev : { ...prev, currentPage: 1 },
    );
  }, [search, setPagination]);
  

  const handleOpenModal = useCallback((businessType?: BusinessTypeData) => {
    if (businessType) {
      setEditingBusinessType(businessType);
      setFormData({
        name: businessType.name || "",
        description: businessType.description || "",
      });
    } else {
      setEditingBusinessType(null);
      setFormData({ ...EMPTY_FORM });
    }
    setShowModal(true);
  }, []);

  const openDeleteModal = useCallback((bt: BusinessTypeData) => {
    setDeletingBusinessType(bt);
    setShowDeleteModal(true);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        setSubmitting(true);
        if (editingBusinessType) {
          const payload: UpdateBusinessTypePayload = {
            name: formData.name.trim(),
            description: formData.description.trim() || "",
          };
          await updateBusinessType(editingBusinessType.id, payload);
        } else {
          const payload: CreateBusinessTypePayload = {
            name: formData.name.trim(),
            description: formData.description.trim() || "",
          };
          await createBusinessType(payload);
        }
        setShowModal(false);
        setEditingBusinessType(null);
        setFormData({ ...EMPTY_FORM });
        await fetchBusinessTypes();
      } catch (error: unknown) {
        consumeHandledApiError(error, "BusinessTypes.handleSubmit");
      } finally {
        setSubmitting(false);
      }
    },
    [editingBusinessType, formData, fetchBusinessTypes],
  );

  const handleDelete = useCallback(async () => {
    if (!deletingBusinessType) return;
    try {
      setDeletingBusinessTypePending(true);
      await deleteBusinessType(deletingBusinessType.id);
      setShowDeleteModal(false);
      setDeletingBusinessType(null);
      await fetchBusinessTypes();
    } catch (error: unknown) {
      consumeHandledApiError(error, "BusinessTypes.handleDelete");
    } finally {
      setDeletingBusinessTypePending(false);
    }
  }, [deletingBusinessType, fetchBusinessTypes]);

  const businessTableColumns = useMemo<TableColumn<BusinessTypeData>[]>(
    () => [
      {
        key: "name",
        label: "Name",
        sortable: true,
        type: "custom",
        width: "260px",
        render: (bt) => <div className="fw-semibold">{bt.name}</div>,
      },
      {
        key: "description",
        label: "Description",
        sortable: false,
        type: "custom",
        width: "420px",
        render: (bt) => <CrmTruncatedDescriptionCell text={bt.description} />,
      },
      {
        key: "created_at",
        label: "Created At",
        sortable: true,
        type: "custom",
        width: "200px",
        render: (bt) => (
          <div className="text-muted small">
            {bt.created_at
              ? formatDateTimeToLocal(bt.created_at, GlobalDateFormat)
              : "—"}
          </div>
        ),
      },
      {
        key: "actions",
        label: "Actions",
        sortable: false,
        align: "right",
        type: "custom",
        width: "160px",
        render: (bt) => (
          <div className="d-flex justify-content-end gap-2">
            {session?.user?.permissions?.includes(PERMISSIONS.EDIT_CRM_BUSINESS_TYPES) && (
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => handleOpenModal(bt)}
                aria-label={"Edit business type " + (bt.name ?? "")}
              >
                <Edit size={14} aria-hidden />
              </Button>
            )}
            {session?.user?.permissions?.includes(PERMISSIONS.DELETE_CRM_BUSINESS_TYPES) && (
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => openDeleteModal(bt)}
                aria-label={"Delete business type " + (bt.name ?? "")}
              >
                <Trash2 size={14} aria-hidden />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [session?.user?.permissions, handleOpenModal, openDeleteModal],
  );

  const handleToolbarSearch = useCallback(() => {
    submitSearch();
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, [setPagination, submitSearch]);

  const businessToolbarConfig = useMemo<ToolbarConfig>(
    () => ({
      showSearch: true,
      searchValue: searchInput,
      searchPlaceholder: "Search business types by name or description...",
      onSearchChange: handleSearchChange,
      onSearch: handleToolbarSearch,
      rightActions: (
        <div className="d-flex gap-2">
          {session?.user?.permissions?.includes(
            PERMISSIONS.CREATE_CRM_BUSINESS_TYPES,
          ) && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenModal()}
              className="d-flex align-items-center gap-2"
            >
              <PlusCircle size={16} aria-hidden />
              Add Business Type
            </Button>
          )}
        </div>
      ),
    }),
    [
      handleOpenModal,
      handleSearchChange,
      handleToolbarSearch,
      searchInput,
      session?.user?.permissions,
    ],
  );

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="CRM" mainLink="/crm/dashboard" subTitle="Business Types" />
      <div>
        <GenericTable<BusinessTypeData>
          data={businessTypes}
          columns={businessTableColumns}
          showToolbar
          toolbar={businessToolbarConfig}
          pagination={{
            currentPage: pagination.currentPage,
            rowsPerPage: pagination.rowsPerPage,
            totalRows: totalBusinessTypes,
            pageSizeOptions: [10, 15, 25, 50],
          }}
          onPaginationChange={handlePaginationChange}
          customizableColumns
          selectedColumns={selectedColumns}
          defaultSelectedColumns={DEFAULT_BUSINESS_TYPES_TABLE_COLUMNS}
          onColumnChange={setSelectedColumns}
          columnStorageKey={BUSINESS_TYPES_TABLE_COLUMN_STORAGE_KEY}
          loading={loading}
          emptyMessage={
            <div className="text-center p-5">
              <p className="text-muted">No business types found</p>
            </div>
          }
          uniqueKey="id"
          showToolbarActions={false}
        />

        {/* Create/Edit Modal */}
        <Modal
          show={showModal}
          onHide={() => {
            if (submitting) return;
            setShowModal(false);
          }}
          centered
        >
          <Modal.Header closeButton={!submitting}>
            <Modal.Title>{modalTitle(editingBusinessType)}</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>
                  Name <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter business type name"
                  required
                />
              </Form.Group>
              <Form.Group className="mb-0">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Enter business type description"
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer
              className="border-top"
              style={{ flexWrap: "wrap", gap: "12px", justifyContent: "space-between" }}
            >
              <Form.Text className="text-muted d-flex align-items-center gap-1 mb-0">
                <AlertCircle size={14} aria-hidden />
                <span style={{ fontSize: "0.813rem" }}>
                  Fields marked with <span className="text-danger fw-bold">*</span> are required
                </span>
              </Form.Text>
              <div style={CRM_DIALOG_FOOTER_ACTIONS_ROW_STYLE}>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={submitting}
                  style={{
                    ...CRM_DIALOG_PRIMARY_BUTTON_STYLE,
                    minWidth: "168px",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ width: 16, display: "inline-flex", justifyContent: "center" }}>
                    {submitting ? (
                      <Spinner size="sm" aria-hidden />
                    ) : (
                      <Check size={16} aria-hidden />
                    )}
                  </span>
                  {primarySubmitLabel(submitting, editingBusinessType)}
                </Button>
                <Button
                  variant="outline-secondary"
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  style={CRM_DIALOG_SECONDARY_BUTTON_STYLE}
                >
                  Cancel
                </Button>
              </div>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          show={showDeleteModal}
          onHide={() => {
            setShowDeleteModal(false);
            setDeletingBusinessType(null);
          }}
          onConfirm={handleDelete}
          itemName={deletingBusinessType?.name}
          itemType="business type"
          loading={deletingBusinessTypePending}
        />
      </div>
    </React.Fragment>
  );
};

BusinessTypes.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default BusinessTypes;
