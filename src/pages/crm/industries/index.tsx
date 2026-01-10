import "@assets/scss/datatable-style.scss";
import React, { useState, useEffect } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  getIndustries,
  createIndustry,
  updateIndustry,
  deleteIndustry,
  getCrmProducts,
  IndustryData,
  CreateIndustryPayload,
  UpdateIndustryPayload,
  CrmProduct,
} from "@utils/crm";
import { hasPermission } from "@utils/Helper";
import { formatDateTimeToLocal } from "@utils/Helper";
import { GlobalDateFormat } from "@utils/Helper";
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
import { useSession } from "next-auth/react";
const IndustriesPage = () => {
  const { data: session } = useSession();
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
  const [industryProducts, setIndustryProducts] = useState<CrmProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

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

      console.log(response, "response industries");
      setIndustries(response?.data || []);
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
  const handleView = async (industry: IndustryData) => {
    setViewingIndustry(industry);
    setShowViewModal(true);
    // Fetch products for this industry
    await fetchIndustryProducts(industry.id);
  };

  // Fetch products for an industry
  const fetchIndustryProducts = async (industryId: number) => {
    setLoadingProducts(true);
    try {
      const response = await getCrmProducts({
        page: 1,
        per_page: 100,
        industry_id: industryId,
      });
      setIndustryProducts(response.data || []);
    } catch (error: any) {
      console.error("Failed to fetch industry products:", error);
      setIndustryProducts([]);
    } finally {
      setLoadingProducts(false);
    }
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
              {session?.user?.permissions?.includes('add-crm-industry') && (
              <Button
                variant="primary"
                onClick={() => handleOpenModal()}
                className="d-flex align-items-center gap-2"
              >
                <PlusCircle size={18} />
                Add Industry
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
                  placeholder="Search industries by name or description..."
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

        {/* Industries Table */}
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            {loading ? (
              <div className="text-center p-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Loading industries...</p>
              </div>
            ) : industries.length === 0 ? (
              <></>
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
                      {industries && industries.length > 0 && industries.map((industry) => (
                        <tr key={industry?.id}>
                          <td>
                            <div className="small text-muted">
                              {industry?.name}
                            </div>
                          </td>
                          <td>
                            <div className="small text-muted">
                              {industry?.description}
                            </div>
                          </td>
                          <td>
                            <div className="small text-muted">
                              {formatDateTimeToLocal(industry?.created_at, GlobalDateFormat)}
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
                              {session?.user?.permissions?.includes('edit-crm-industry') && (
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleOpenModal(industry)}
                              >
                                <Edit size={14} />
                              </Button>
                              )}
                              {session?.user?.permissions?.includes('delete-crm-industry') && (
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

              {/* Products Section */}
              <div className="mb-3 mt-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <Form.Label className="text-muted small mb-0">Products</Form.Label>
                  <Badge bg="primary">{industryProducts.length}</Badge>
                </div>
                {loadingProducts ? (
                  <div className="text-center py-3">
                    <Spinner animation="border" size="sm" variant="primary" />
                    <p className="text-muted small mt-2 mb-0">Loading products...</p>
                  </div>
                ) : industryProducts.length === 0 ? (
                  <div className="text-center py-3 border rounded">
                    <p className="text-muted small mb-0">No products found for this industry</p>
                  </div>
                ) : (
                  <div className="border rounded" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <Table hover size="sm" className="mb-0">
                      <thead className="table-light">
                        <tr>
                          <th style={{ fontSize: '0.75rem', padding: '8px' }}>Product Name</th>
                          <th style={{ fontSize: '0.75rem', padding: '8px' }}>SKU</th>
                          <th style={{ fontSize: '0.75rem', padding: '8px' }}>Price</th>
                          <th style={{ fontSize: '0.75rem', padding: '8px' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {industryProducts.map((product) => (
                          <tr key={product.id}>
                            <td style={{ fontSize: '0.875rem', padding: '8px' }}>
                              {product.name}
                            </td>
                            <td style={{ fontSize: '0.875rem', padding: '8px' }}>
                              <Badge bg="light" text="dark" className="font-monospace">
                                {product.sku}
                              </Badge>
                            </td>
                            <td style={{ fontSize: '0.875rem', padding: '8px' }}>
                              {product.currency} {Number.parseFloat(product.price || '0').toFixed(2)}
                            </td>
                            <td style={{ fontSize: '0.875rem', padding: '8px' }}>
                              <Badge bg={product.active ? "success" : "secondary"}>
                                {product.active ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </div>
              
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
