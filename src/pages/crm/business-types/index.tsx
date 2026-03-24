import "@assets/scss/datatable-style.scss";
import React, { useState, useEffect, useMemo, ReactElement } from "react";
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
import { formatDateTimeToLocal, GlobalDateFormat } from "@utils/Helper";
import GenericTable, {
  TableColumn,
  ToolbarConfig,
} from "@components/GenericTable";
import {
  Button,
  Form,
  Card,
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
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch business types
  const fetchBusinessTypes = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.currentPage,
        per_page: pagination.perPage,
      };
      if (search) {
        params.search = search;
      }
      const response = await getBusinessTypes(params);

      console.log(response, "response business types");
      setBusinessTypes(response?.data || []);
      setTotalBusinessTypes(response.total || 0);
    } catch (error: any) {
      console.error("Failed to fetch business types:", error);
      // Error toast is handled in the API function
      setBusinessTypes([]);
      setTotalBusinessTypes(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessTypes();
  }, [pagination.currentPage, pagination.perPage, search]);

  // Handle open modal
  const handleOpenModal = (businessType?: BusinessTypeData) => {
    if (businessType) {
      setEditingBusinessType(businessType);
      setFormData({
        name: businessType.name || "",
        description: businessType.description || "",
      });
    } else {
      setEditingBusinessType(null);
      setFormData({
        name: "",
        description: "",
      });
    }
    setShowModal(true);
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
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
      await fetchBusinessTypes();
    } catch (error: any) {
      // Error toast is handled in the API function
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deletingBusinessType) return;
    try {
      await deleteBusinessType(deletingBusinessType.id);
      setShowDeleteModal(false);
      setDeletingBusinessType(null);
      await fetchBusinessTypes();
    } catch (error: any) {
      // Error toast is handled in the API function
    }
  };

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
            {session?.user?.permissions?.includes(
              "edit-crm-business-types",
            ) && (
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => handleOpenModal(bt)}
              >
                <Edit size={14} />
              </Button>
            )}
            {session?.user?.permissions?.includes(
              "delete-crm-business-types",
            ) && (
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => {
                  setDeletingBusinessType(bt);
                  setShowDeleteModal(true);
                }}
              >
                <Trash2 size={14} />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [session?.user?.permissions],
  );

  const businessToolbarConfig = useMemo<ToolbarConfig>(
    () => ({
      showSearch: true,
      searchValue: search,
      searchPlaceholder: "Search business types by name or description...",
      onSearchChange: setSearch,
      onSearch: () => {
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
      },
      rightActions: (
        <div className="d-flex gap-2">
          {session?.user?.permissions?.includes("add-crm-business-types") && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenModal()}
              className="d-flex align-items-center gap-2"
            >
              <PlusCircle size={16} />
              Add Business Type
            </Button>
          )}
        </div>
      ),
    }),
    [search, session?.user?.permissions],
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
            <Modal.Title>
              {editingBusinessType ? "Edit Business Type" : "Add New Business Type"}
            </Modal.Title>
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
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
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
                    setFormData({ ...formData, description: e.target.value })
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
                    <Spinner size="sm" className="me-2" />
                    {editingBusinessType ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  editingBusinessType ? "Update" : "Create"
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
