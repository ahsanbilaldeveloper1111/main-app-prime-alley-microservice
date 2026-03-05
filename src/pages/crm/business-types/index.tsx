import "@assets/scss/datatable-style.scss";
import React, { useState, useEffect, ReactElement } from "react";
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
import {
  Button,
  Form,
  Card,
  Table,
  InputGroup,
  Modal,
  Spinner,
} from "react-bootstrap";
import {
  PlusCircle,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
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

  // Handle search
  const handleSearch = () => {
    setPagination({ ...pagination, currentPage: 1 });
    fetchBusinessTypes();
  };

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

  // Pagination helpers
  const totalPages = Math.ceil(totalBusinessTypes / pagination.perPage);
  const startIndex = (pagination.currentPage - 1) * pagination.perPage;
  const endIndex = startIndex + businessTypes.length;

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, currentPage: page });
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="CRM" mainLink="/crm/dashboard" subTitle="Business Types" />
      <div>
        {/* Header */}
        <Card className="border-0 shadow-sm mb-3">
          <Card.Body className="p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                {/* <h5 className="mb-0 fw-bold">Business Types</h5>
                <p className="text-muted mb-0 small">
                  Manage business type categories for your CRM
                </p> */}
              </div>
              {session?.user?.permissions?.includes('add-crm-business-types') && (
              <Button
                variant="primary"
                onClick={() => handleOpenModal()}
                className="d-flex align-items-center gap-2"
              >
                <PlusCircle size={18} />
                Add Business Type
              </Button>
              )}
            </div>
          </Card.Body>
        </Card>

        {/* Search Bar */}
        <Card className="border-0 shadow-sm mb-3">
          <Card.Body className="p-3">
            <Form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
            >
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Search business types by name or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Button variant="outline-secondary" type="submit">
                  <Search size={16} />
                </Button>
              </InputGroup>
            </Form>
          </Card.Body>
        </Card>

        {/* Business Types Table */}
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            {loading ? (
              <div className="text-center p-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Loading business types...</p>
              </div>
            ) : businessTypes.length === 0 ? (
              <div className="text-center p-5">
                <p className="text-muted">No business types found</p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Created At</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {businessTypes && businessTypes.length > 0 && businessTypes.map((businessType) => (
                        <tr key={businessType?.id}>
                          <td>
                            <div className="small text-muted">
                              {businessType?.name}
                            </div>
                          </td>
                          <td>
                            <div className="small text-muted">
                              {businessType?.description || "—"}
                            </div>
                          </td>
                          <td>
                            <div className="small text-muted">
                              {businessType?.created_at ? formatDateTimeToLocal(businessType.created_at, GlobalDateFormat) : "—"}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex justify-content-end gap-2">
                              {session?.user?.permissions?.includes('edit-crm-business-types') && (
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleOpenModal(businessType)}
                              >
                                <Edit size={14} />
                              </Button>
                              )}
                              {session?.user?.permissions?.includes('delete-crm-business-types') && (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => {
                                  setDeletingBusinessType(businessType);
                                  setShowDeleteModal(true);
                                }}
                              >
                                <Trash2 size={14} />
                              </Button>
                              )}
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
                      Showing {startIndex + 1} to {endIndex} of {totalBusinessTypes} business types
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
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
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
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
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
