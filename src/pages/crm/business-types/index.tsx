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
  PlusCircle,
  Edit,
  Trash2,
} from "lucide-react";
import "@assets/scss/common.scss";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import { useSession } from "next-auth/react";

const PERMISSION_ADD = "add-crm-business-types";
const PERMISSION_EDIT = "edit-crm-business-types";
const PERMISSION_DELETE = "delete-crm-business-types";

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
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 15,
  });
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingBusinessType, setEditingBusinessType] = useState<BusinessTypeData | null>(null);
  const [deletingBusinessType, setDeletingBusinessType] = useState<BusinessTypeData | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState<BusinessTypeFormState>({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);

  const fetchBusinessTypes = useCallback(async () => {
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
  }, [pagination.currentPage, pagination.perPage, search]);

  useEffect(() => {
    fetchBusinessTypes().catch((error: unknown) => {
      consumeHandledApiError(error, "BusinessTypes.useEffect");
    });
  }, [fetchBusinessTypes]);
  

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
      await deleteBusinessType(deletingBusinessType.id);
      setShowDeleteModal(false);
      setDeletingBusinessType(null);
      await fetchBusinessTypes();
    } catch (error: unknown) {
      consumeHandledApiError(error, "BusinessTypes.handleDelete");
    }
  }, [deletingBusinessType, fetchBusinessTypes]);

  const businessTableColumns = useMemo<TableColumn<BusinessTypeData>[]>(
    () => [
      {
        key: "name",
        label: "Name",
        sortable: true,
        type: "custom",
        render: (bt) => <div className="fw-semibold">{bt.name}</div>,
      },
      {
        key: "description",
        label: "Description",
        sortable: false,
        type: "custom",
        render: (bt) => (
          <div className="text-muted small">{bt.description || "—"}</div>
        ),
      },
      {
        key: "created_at",
        label: "Created At",
        sortable: true,
        type: "custom",
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
        render: (bt) => (
          <div className="d-flex justify-content-end gap-2">
            {session?.user?.permissions?.includes(PERMISSION_EDIT) && (
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => handleOpenModal(bt)}
                aria-label={"Edit business type " + (bt.name ?? "")}
              >
                <Edit size={14} aria-hidden />
              </Button>
            )}
            {session?.user?.permissions?.includes(PERMISSION_DELETE) && (
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
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, []);

  const businessToolbarConfig = useMemo<ToolbarConfig>(
    () => ({
      showSearch: true,
      searchValue: search,
      searchPlaceholder: "Search business types by name or description...",
      onSearchChange: setSearch,
      onSearch: handleToolbarSearch,
      rightActions: (
        <div className="d-flex gap-2">
          {session?.user?.permissions?.includes(PERMISSION_ADD) && (
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
    [search, session?.user?.permissions, handleOpenModal, handleToolbarSearch],
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
            rowsPerPage: pagination.perPage,
            totalRows: totalBusinessTypes,
            pageSizeOptions: [10, 15, 25, 50],
          }}
          onPaginationChange={(page, rowsPerPage) => {
            setPagination({ currentPage: page, perPage: rowsPerPage });
          }}
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
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton>
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
              <Form.Group className="mb-3">
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
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setShowModal(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Spinner size="sm" className="me-2" aria-hidden />
                    {primarySubmitLabel(true, editingBusinessType)}
                  </>
                ) : (
                  primarySubmitLabel(false, editingBusinessType)
                )}
              </Button>
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
        />
      </div>
    </React.Fragment>
  );
};

BusinessTypes.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default BusinessTypes;
