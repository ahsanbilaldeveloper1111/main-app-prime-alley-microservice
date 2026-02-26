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
  createProduct,
  updateProduct,
  deleteProduct,
  IndustryData,
  CreateIndustryPayload,
  UpdateIndustryPayload,
  CrmProduct,
} from "@utils/crm";
import { formatDateTimeToLocal, GlobalDateFormat } from "@utils/Helper";
import {
  Button,
  Form,
  Card,
  Table,
  InputGroup,
  Modal,
  Badge,
  Spinner,
  Row,
  Col,
} from "react-bootstrap";
import {
  PlusCircle,
  Eye,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Package,
  Tag,
  FileText,
  Calendar,
  Building2,
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
  
  // Product CRUD state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CrmProduct | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<CrmProduct | null>(null);
  const [showProductDeleteModal, setShowProductDeleteModal] = useState(false);
  const [showProductViewModal, setShowProductViewModal] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<CrmProduct | null>(null);
  const [productSubmitting, setProductSubmitting] = useState(false);
  const [productFormData, setProductFormData] = useState({
    productName: "",
    sku: "",
    price: "",
    currency: "AED",
    category: "",
    brand: "",
    isActive: true,
    description: "",
  });

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

  // Handle open product modal
  const handleOpenProductModal = (product?: CrmProduct) => {
    if (product) {
      setEditingProduct(product);
      setProductFormData({
        productName: product.name,
        sku: product.sku,
        price: product.price || "",
        currency: product.currency || "AED",
        category: product.category || "",
        brand: product.brand || "",
        isActive: product.active,
        description: product.description || "",
      });
    } else {
      setEditingProduct(null);
      setProductFormData({
        productName: "",
        sku: "",
        price: "",
        currency: "AED",
        category: "",
        brand: "",
        isActive: true,
        description: "",
      });
    }
    setShowProductModal(true);
  };

  // Handle product submit
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingIndustry) return;

    try {
      setProductSubmitting(true);
      if (editingProduct) {
        // Update existing product
        const updatePayload: any = {
          id: editingProduct.id,
          name: productFormData.productName.trim(),
          description: productFormData.description.trim(),
          sku: productFormData.sku.trim(),
          price: Number.parseFloat(productFormData.price) || 0,
          category: productFormData.category.trim() || undefined,
          brand: productFormData.brand.trim() || undefined,
          active: productFormData.isActive,
          currency: productFormData.currency,
          industry_id: viewingIndustry.id,
        };
        await updateProduct(updatePayload);
      } else {
        // Create new product
        const createPayload: any = {
          name: productFormData.productName.trim(),
          description: productFormData.description.trim() || undefined,
          sku: productFormData.sku.trim(),
          price: Number.parseFloat(productFormData.price) || 0,
          category: productFormData.category.trim() || undefined,
          brand: productFormData.brand.trim() || undefined,
          active: productFormData.isActive,
          currency: productFormData.currency,
          industry_id: viewingIndustry.id,
        };
        await createProduct(createPayload);
      }
      setShowProductModal(false);
      setEditingProduct(null);
      // Refresh products after create/update
      if (viewingIndustry) {
        await fetchIndustryProducts(viewingIndustry.id);
      }
    } catch (error: any) {
      // Error toast is handled in the API function
    } finally {
      setProductSubmitting(false);
    }
  };

  // Handle delete product
  const handleDeleteProduct = async () => {
    if (!deletingProduct || !viewingIndustry) return;
    try {
      await deleteProduct(deletingProduct.id);
      setShowProductDeleteModal(false);
      setDeletingProduct(null);
      // Refresh products after delete
      await fetchIndustryProducts(viewingIndustry.id);
    } catch (error: any) {
      // Error toast is handled in the API function
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
                <h5 className="mb-0 fw-bold">Product Groups</h5>
                <p className="text-muted mb-0 small">
                  Manage product groups for your CRM
                </p>
              </div>
              {session?.user?.permissions?.includes('add-crm-industry') && (
              <Button
                variant="primary"
                onClick={() => handleOpenModal()}
                className="d-flex align-items-center gap-2"
              >
                <PlusCircle size={18} />
                Add Product Group
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
              {editingIndustry ? "Edit Product Group" : "Add New Product Group"}
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
                  placeholder="Enter product group name"
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
                  placeholder="Enter product group description"
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
          itemType="product group"
        />

        {/* View Modal */}
        {viewingIndustry && (
          <Modal 
          size="xl"
          show={showViewModal} onHide={() => setShowViewModal(false)} centered>
            <Modal.Header closeButton>
              <Modal.Title>Product Group Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              
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
                  <Form.Label className="text-muted small mb-0">
                    Products ({industryProducts.length})</Form.Label>
                  <div className="d-flex align-items-center gap-2">
                    
                    {session?.user?.permissions?.includes('add-crm-products') && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenProductModal()}
                        className="d-flex align-items-center gap-1"
                      >
                        <PlusCircle size={14} />
                        Add Product
                      </Button>
                    )}
                  </div>
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
                  <div className="border rounded" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <Table hover className="mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th style={{ fontSize: '0.875rem', padding: '12px' }}>Product Name</th>
                          <th style={{ fontSize: '0.875rem', padding: '12px' }}>SKU</th>
                          <th style={{ fontSize: '0.875rem', padding: '12px' }}>Price</th>
                          <th style={{ fontSize: '0.875rem', padding: '12px' }}>Currency</th>
                          <th style={{ fontSize: '0.875rem', padding: '12px' }}>Category</th>
                          <th style={{ fontSize: '0.875rem', padding: '12px' }}>Brand</th>
                          <th style={{ fontSize: '0.875rem', padding: '12px' }}>Status</th>
                          <th style={{ fontSize: '0.875rem', padding: '12px', width: '120px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {industryProducts.map((product) => (
                          <tr key={product.id}>
                            <td style={{ fontSize: '0.875rem', padding: '12px' }} className="fw-semibold">
                              {product.name}
                            </td>
                            <td style={{ fontSize: '0.875rem', padding: '12px' }}>
                              <Badge bg="light" text="dark" className="font-monospace">
                                {product.sku}
                              </Badge>
                            </td>
                            <td style={{ fontSize: '0.875rem', padding: '12px' }} className="fw-semibold text-success">
                              {product.currency} {Number.parseFloat(product.price || '0').toFixed(2)}
                            </td>
                            <td style={{ fontSize: '0.875rem', padding: '12px' }}>
                              {product.currency}
                            </td>
                            <td style={{ fontSize: '0.875rem', padding: '12px' }}>
                              <Badge bg="info" className="bg-opacity-10 text-dark">
                                {product.category || "N/A"}
                              </Badge>
                            </td>
                            <td style={{ fontSize: '0.875rem', padding: '12px' }}>
                              {product.brand || "N/A"}
                            </td>
                            <td style={{ fontSize: '0.875rem', padding: '12px' }}>
                              <Badge bg={product.active ? "success" : "secondary"}>
                                {product.active ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                            <td style={{ fontSize: '0.875rem', padding: '12px', width: '120px' }}>
                              <div className="d-flex gap-1">
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-1"
                                  title="View"
                                  onClick={() => {
                                    setViewingProduct(product);
                                    setShowProductViewModal(true);
                                  }}
                                >
                                  <Eye size={16} />
                                </Button>
                                {session?.user?.permissions?.includes('edit-crm-products') && (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="p-1"
                                    title="Edit"
                                    onClick={() => handleOpenProductModal(product)}
                                  >
                                    <Edit size={16} />
                                  </Button>
                                )}
                                {session?.user?.permissions?.includes('delete-crm-products') && (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="p-1 text-danger"
                                    title="Delete"
                                    onClick={() => {
                                      setDeletingProduct(product);
                                      setShowProductDeleteModal(true);
                                    }}
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                )}
                              </div>
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

        {/* Product Form Modal */}
        <Modal
          show={showProductModal}
          onHide={() => {
            setShowProductModal(false);
            setEditingProduct(null);
          }}
          size="lg"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>
              {editingProduct ? "Edit Product" : "Add New Product"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleProductSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Product Name <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={productFormData.productName}
                      onChange={(e) =>
                        setProductFormData({ ...productFormData, productName: e.target.value })
                      }
                      placeholder="Enter product name"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      SKU <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={productFormData.sku}
                      onChange={(e) =>
                        setProductFormData({ ...productFormData, sku: e.target.value })
                      }
                      placeholder="Enter SKU"
                      required
                      disabled={!!editingProduct}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Price <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      value={productFormData.price}
                      onChange={(e) =>
                        setProductFormData({ ...productFormData, price: e.target.value })
                      }
                      placeholder="0.00"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Currency</Form.Label>
                    <Form.Select
                      value={productFormData.currency}
                      onChange={(e) =>
                        setProductFormData({ ...productFormData, currency: e.target.value })
                      }
                    >
                      <option value="AED">AED</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Category</Form.Label>
                    <Form.Control
                      type="text"
                      value={productFormData.category}
                      onChange={(e) =>
                        setProductFormData({ ...productFormData, category: e.target.value })
                      }
                      placeholder="Enter category"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Brand</Form.Label>
                    <Form.Control
                      type="text"
                      value={productFormData.brand}
                      onChange={(e) =>
                        setProductFormData({ ...productFormData, brand: e.target.value })
                      }
                      placeholder="Enter brand"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={productFormData.description}
                  onChange={(e) =>
                    setProductFormData({ ...productFormData, description: e.target.value })
                  }
                  placeholder="Enter product description"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Check
                  type="switch"
                  id="product-active-switch"
                  label="Product Active"
                  checked={productFormData.isActive}
                  onChange={(e) =>
                    setProductFormData({ ...productFormData, isActive: e.target.checked })
                  }
                />
              </Form.Group>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowProductModal(false);
                    setEditingProduct(null);
                  }}
                  disabled={productSubmitting}
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={productSubmitting}>
                  {productSubmitting ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      {editingProduct ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    editingProduct ? "Update Product" : "Add Product"
                  )}
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>

        {/* Product Delete Confirmation Modal */}
        <DeleteConfirmationModal
          show={showProductDeleteModal}
          onHide={() => {
            setShowProductDeleteModal(false);
            setDeletingProduct(null);
          }}
          onConfirm={handleDeleteProduct}
          itemName={deletingProduct?.name}
          itemType="product"
        />

        {/* Product View Modal */}
        {viewingProduct && (
          <Modal
            show={showProductViewModal}
            onHide={() => setShowProductViewModal(false)}
            size="xl"
            centered
          >
            <div
              style={{
                color: "black",
                padding: "30px",
                position: "relative",
                borderTopLeftRadius: "8px",
                borderTopRightRadius: "8px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <button
                onClick={() => setShowProductViewModal(false)}
                style={{
                  position: "absolute",
                  top: "20px",
                  right: "20px",
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  color: "black",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.3)";
                  e.currentTarget.style.transform = "rotate(90deg)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                  e.currentTarget.style.transform = "rotate(0deg)";
                }}
              >
                <X size={20} />
              </button>
              <h3 style={{ margin: 0, fontWeight: 600, fontSize: "24px" }}>
                {viewingProduct.name}
              </h3>
              <p style={{ margin: "8px 0 0 0", opacity: 0.9, fontSize: "14px" }}>
                Product Details
              </p>
            </div>

            <Modal.Body style={{ padding: "30px" }}>
              {/* Basic Information Section */}
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#1f2937",
                  marginBottom: "20px",
                  paddingBottom: "10px",
                  borderBottom: "2px solid #f8f9fa",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <Package size={18} style={{ color: "#4680ff" }} />
                Basic Information
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "20px",
                  marginBottom: "30px",
                }}
              >
                <div
                  style={{
                    background: "#f8f9fa",
                    padding: "16px",
                    borderRadius: "10px",
                    transition: "all 0.3s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#e5e7eb";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#f8f9fa";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: "6px",
                    }}
                  >
                    Product Name
                  </div>
                  <div style={{ fontSize: "15px", color: "#1f2937", fontWeight: 500 }}>
                    {viewingProduct.name}
                  </div>
                </div>
                {viewingIndustry && (
                  <div
                    style={{
                      background: "#f8f9fa",
                      padding: "16px",
                      borderRadius: "10px",
                      transition: "all 0.3s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#e5e7eb";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "#f8f9fa";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        marginBottom: "6px",
                      }}
                    >
                      Industry
                    </div>
                    <div style={{ fontSize: "15px", color: "#1f2937", fontWeight: 500 }}>
                      <Badge
                        bg="primary"
                        className="bg-opacity-10 text-dark"
                        style={{ padding: "6px 14px", fontSize: "13px" }}
                      >
                        <Building2 size={14} style={{ marginRight: "6px" }} />
                        {viewingIndustry.name}
                      </Badge>
                    </div>
                  </div>
                )}
                <div
                  style={{
                    background: "#f8f9fa",
                    padding: "16px",
                    borderRadius: "10px",
                    transition: "all 0.3s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#e5e7eb";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#f8f9fa";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: "6px",
                    }}
                  >
                    SKU
                  </div>
                  <div style={{ fontSize: "15px", color: "#1f2937", fontWeight: 500 }}>
                    <Badge
                      bg="light"
                      text="dark"
                      className="font-monospace"
                      style={{ padding: "6px 14px", fontSize: "13px" }}
                    >
                      {viewingProduct.sku}
                    </Badge>
                  </div>
                </div>
                <div
                  style={{
                    background: "#f8f9fa",
                    padding: "16px",
                    borderRadius: "10px",
                    transition: "all 0.3s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#e5e7eb";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#f8f9fa";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: "6px",
                    }}
                  >
                    Price
                  </div>
                  <div style={{ fontSize: "20px", color: "#10b981", fontWeight: 700 }}>
                    {viewingProduct.currency} {Number.parseFloat(viewingProduct.price || '0').toFixed(2)}
                  </div>
                </div>
                <div
                  style={{
                    background: "#f8f9fa",
                    padding: "16px",
                    borderRadius: "10px",
                    transition: "all 0.3s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#e5e7eb";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#f8f9fa";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: "6px",
                    }}
                  >
                    Currency
                  </div>
                  <div style={{ fontSize: "15px", color: "#1f2937", fontWeight: 500 }}>
                    {viewingProduct.currency}
                  </div>
                </div>
                <div
                  style={{
                    background: "#f8f9fa",
                    padding: "16px",
                    borderRadius: "10px",
                    transition: "all 0.3s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#e5e7eb";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#f8f9fa";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: "6px",
                    }}
                  >
                    Status
                  </div>
                  <div style={{ fontSize: "15px", color: "#1f2937", fontWeight: 500 }}>
                    <Badge
                      bg={viewingProduct.active ? "success" : "secondary"}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      {viewingProduct.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div
                  style={{
                    background: "#f8f9fa",
                    padding: "16px",
                    borderRadius: "10px",
                    transition: "all 0.3s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#e5e7eb";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#f8f9fa";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: "6px",
                    }}
                  >
                    Created Date
                  </div>
                  <div style={{ fontSize: "15px", color: "#1f2937", fontWeight: 500 }}>
                    <Calendar size={14} style={{ color: "#4680ff", marginRight: "6px" }} />
                    {new Date(viewingProduct.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Product Details Section */}
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#1f2937",
                  marginBottom: "20px",
                  paddingBottom: "10px",
                  borderBottom: "2px solid #f8f9fa",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <Tag size={18} style={{ color: "#4680ff" }} />
                Product Details
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "20px",
                  marginBottom: "30px",
                }}
              >
                <div
                  style={{
                    background: "#f8f9fa",
                    padding: "16px",
                    borderRadius: "10px",
                    transition: "all 0.3s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#e5e7eb";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#f8f9fa";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: "6px",
                    }}
                  >
                    Category
                  </div>
                  <div style={{ fontSize: "15px", color: "#1f2937", fontWeight: 500 }}>
                    <Badge
                      bg="info"
                      className="bg-opacity-10 text-dark"
                      style={{ padding: "6px 14px", fontSize: "13px" }}
                    >
                      {viewingProduct.category || "N/A"}
                    </Badge>
                  </div>
                </div>
                <div
                  style={{
                    background: "#f8f9fa",
                    padding: "16px",
                    borderRadius: "10px",
                    transition: "all 0.3s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#e5e7eb";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#f8f9fa";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: "6px",
                    }}
                  >
                    Brand
                  </div>
                  <div style={{ fontSize: "15px", color: "#1f2937", fontWeight: 500 }}>
                    <Building2 size={14} style={{ color: "#4680ff", marginRight: "6px" }} />
                    {viewingProduct.brand || "N/A"}
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#1f2937",
                  marginBottom: "20px",
                  paddingBottom: "10px",
                  borderBottom: "2px solid #f8f9fa",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <FileText size={18} style={{ color: "#4680ff" }} />
                Description
              </div>
              <div
                style={{
                  background: "#f8f9fa",
                  padding: "20px",
                  borderRadius: "10px",
                  marginBottom: "30px",
                }}
              >
                <p style={{ margin: 0, fontSize: "15px", color: "#4b5563", lineHeight: "1.6" }}>
                  {viewingProduct.description || "No description available"}
                </p>
              </div>
            </Modal.Body>

            <Modal.Footer style={{ borderTop: "1px solid #e5e7eb", padding: "20px 30px" }}>
              {session?.user?.permissions?.includes('edit-crm-products') && (
                <Button
                  variant="outline-primary"
                  onClick={() => {
                    setShowProductViewModal(false);
                    handleOpenProductModal(viewingProduct);
                  }}
                  className="d-flex align-items-center gap-2"
                >
                  <Edit size={16} />
                  Edit Product
                </Button>
              )}
              <Button variant="secondary" onClick={() => setShowProductViewModal(false)}>
                Close
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
