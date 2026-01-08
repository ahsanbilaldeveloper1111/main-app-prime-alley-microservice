import "@assets/scss/datatable-style.scss";
import React, { useState, useEffect } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  getIndustries,
  createIndustry,
  updateIndustry,
  deleteIndustry,
  IndustryData,
  CreateIndustryPayload,
  UpdateIndustryPayload,
} from "@utils/crm";
import {
  Button,
  Form,
  Card,
  Table,
  InputGroup,
  Modal,
  Badge,
  Spinner,
} from "react-bootstrap";
import {
  PlusCircle,
  Eye,
  Edit,
  Trash2,
  Search,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import "@assets/scss/common.scss";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";

const IndustriesPage = () => {
  // State
  const [industries, setIndustries] = useState<IndustryData[]>([]);
  const [totalIndustries, setTotalIndustries] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 15,
  });
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingIndustry, setEditingIndustry] = useState<IndustryData | null>(null);
  const [deletingIndustry, setDeletingIndustry] = useState<IndustryData | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingIndustry, setViewingIndustry] = useState<IndustryData | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch industries
  const fetchIndustries = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.currentPage,
        per_page: pagination.perPage,
      };
      if (search) {
        params.search = search;
      }
      const response = await getIndustries(params);
      setIndustries(response.data || []);
      setTotalIndustries(response.total || 0);
    } catch (error: any) {
      console.error("Failed to fetch industries:", error);
      // Error toast is handled in the API function
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndustries();
  }, [pagination.currentPage, pagination.perPage, search]);

  // Handle search
  const handleSearch = () => {
    setPagination({ ...pagination, currentPage: 1 });
    fetchIndustries();
  };

  // Handle open modal
  const handleOpenModal = (industry?: IndustryData) => {
    if (industry) {
      setEditingIndustry(industry);
      setFormData({
        name: industry.name || "",
        description: industry.description || "",
      });
    } else {
      setEditingIndustry(null);
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
      if (editingIndustry) {
        const payload: UpdateIndustryPayload = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        };
        await updateIndustry(editingIndustry.id, payload);
      } else {
        const payload: CreateIndustryPayload = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        };
        await createIndustry(payload);
      }
      setShowModal(false);
      setEditingIndustry(null);
      await fetchIndustries();
    } catch (error: any) {
      // Error toast is handled in the API function
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deletingIndustry) return;
    try {
      await deleteIndustry(deletingIndustry.id);
      setShowDeleteModal(false);
      setDeletingIndustry(null);
      await fetchIndustries();
    } catch (error: any) {
      // Error toast is handled in the API function
    }
  };

  // Handle view
  const handleView = (industry: IndustryData) => {
    setViewingIndustry(industry);
    setShowViewModal(true);
  };

  // Pagination helpers
  const totalPages = Math.ceil(totalIndustries / pagination.perPage);
  const startIndex = (pagination.currentPage - 1) * pagination.perPage;
  const endIndex = startIndex + industries.length;

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, currentPage: page });
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="CRM" mainLink="/crm/dashboard" subTitle="Industries" />
      <div>
        {/* Header */}
        <Card className="border-0 shadow-sm mb-3">
          <Card.Body className="p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0 fw-bold">Industries</h5>
                <p className="text-muted mb-0 small">
                  Manage industry categories for your CRM
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => handleOpenModal()}
                className="d-flex align-items-center gap-2"
              >
                <PlusCircle size={18} />
                Add Industry
              </Button>
            </div>
          </Card.Body>
        </Card>

        {/* Search Bar */}
        <Card className="border-0 shadow-sm mb-3">
          <Card.Body className="p-3">
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Search industries by name or description..."
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
          </Card.Body>
        </Card>

        {/* Industries Table */}
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            {loading ? (
              <div className="text-center p-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Loading industries...</p>
              </div>
            ) : industries.length === 0 ? (
              <div className="text-center p-5">
                <Building2 size={48} className="text-muted mb-3" />
                <p className="text-muted">No industries found</p>
                <Button variant="primary" onClick={() => handleOpenModal()}>
                  <PlusCircle size={18} className="me-2" />
                  Add First Industry
                </Button>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Created At</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {industries.map((industry) => (
                        <tr key={industry.id}>
                          <td>
                            <Badge bg="light" text="dark">
                              #{industry.id}
                            </Badge>
                          </td>
                          <td>
                            <div className="fw-semibold">{industry.name}</div>
                          </td>
                          <td>
                            <div className="text-muted small">
                              {industry.description || (
                                <span className="fst-italic">No description</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="small text-muted">
                              {new Date(industry.created_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex justify-content-end gap-2">
                              <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => handleView(industry)}
                              >
                                <Eye size={14} />
                              </Button>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleOpenModal(industry)}
                              >
                                <Edit size={14} />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => {
                                  setDeletingIndustry(industry);
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
                      Showing {startIndex + 1} to {endIndex} of {totalIndustries} industries
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
              {editingIndustry ? "Edit Industry" : "Add New Industry"}
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
                  placeholder="Enter industry name"
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
                  placeholder="Enter industry description"
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
                    {editingIndustry ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  editingIndustry ? "Update" : "Create"
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
            setDeletingIndustry(null);
          }}
          onConfirm={handleDelete}
          itemName={deletingIndustry?.name}
          itemType="industry"
        />

        {/* View Modal */}
        {viewingIndustry && (
          <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered>
            <Modal.Header closeButton>
              <Modal.Title>Industry Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="mb-3">
                <Form.Label className="text-muted small">ID</Form.Label>
                <div className="fw-semibold">#{viewingIndustry.id}</div>
              </div>
              <div className="mb-3">
                <Form.Label className="text-muted small">Name</Form.Label>
                <div className="fw-semibold">{viewingIndustry.name}</div>
              </div>
              <div className="mb-3">
                <Form.Label className="text-muted small">Description</Form.Label>
                <div>
                  {viewingIndustry.description || (
                    <span className="text-muted fst-italic">No description</span>
                  )}
                </div>
              </div>
              <div className="mb-3">
                <Form.Label className="text-muted small">Created At</Form.Label>
                <div>
                  {new Date(viewingIndustry.created_at).toLocaleString()}
                </div>
              </div>
              {viewingIndustry.updated_at && (
                <div className="mb-3">
                  <Form.Label className="text-muted small">Updated At</Form.Label>
                  <div>
                    {new Date(viewingIndustry.updated_at).toLocaleString()}
                  </div>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowViewModal(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setShowViewModal(false);
                  handleOpenModal(viewingIndustry);
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

IndustriesPage.getLayout = (page: React.ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default IndustriesPage;
