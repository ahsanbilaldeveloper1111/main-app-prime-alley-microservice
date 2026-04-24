import "@assets/scss/datatable-style.scss";
import React, { useState, useEffect, useMemo } from "react";
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
import { formatDateTimeToLocal, GlobalDateFormat, formatDateForTable } from "@utils/Helper";
import GenericTable, {
  TableColumn,
  ToolbarConfig,
} from "@components/GenericTable";
import { CrmDescriptionDetailsBlock, CrmTruncatedDescriptionCell } from "@components/crm/crmTruncatedDescriptionCell";
import {
  CRM_DIALOG_FOOTER_ACTIONS_ROW_STYLE,
  CRM_DIALOG_PRIMARY_BUTTON_STYLE,
  CRM_DIALOG_SECONDARY_BUTTON_STYLE,
} from "@components/crm/crmDialogActionButtonStyles";
import {
  Button,
  Form,
  Modal,
  Badge,
  Spinner,
  Row,
  Col,
  Table,
} from "react-bootstrap";
import {
  AlertCircle,
  PlusCircle,
  Eye,
  Edit,
  Trash2,
  X,
  Package,
  Tag,
  FileText,
  Calendar,
  Building2,
  Check,
} from "lucide-react";
import "@assets/scss/common.scss";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import { useSession } from "next-auth/react";
import { HEADER_CONSTANTS } from "@constants/headerConstants";

const { PERMISSIONS } = HEADER_CONSTANTS;
import { useCrmSettingsTableState } from "@hooks/useCrmSettingsTableState";
import { useDebouncedSearchInput } from "@hooks/useDebouncedSearchInput";
import { reportApiErrorFromCatch } from "@utils/sentryLogger";

const INDUSTRIES_TABLE_COLUMN_STORAGE_KEY = "industriesSelectedColumns";
const INDUSTRIES_TABLE_SELECTABLE_KEYS = [
  "name",
  "description",
  "created_at",
  "actions",
] as const;
const DEFAULT_INDUSTRIES_TABLE_COLUMNS = [
  "name",
  "description",
  "created_at",
  "actions",
];

function consumeHandledApiError(error: unknown, source: string): void {
  reportApiErrorFromCatch(error, source, { scope: "IndustriesPage" });
}

const IndustriesPage = () => {
  const { data: session } = useSession();
  // State
  const [industries, setIndustries] = useState<IndustryData[]>([]);
  const [totalIndustries, setTotalIndustries] = useState(0);
  const [loading, setLoading] = useState(true);
  const {
    pagination,
    setPagination,
    selectedColumns,
    setSelectedColumns,
    handlePaginationChange,
  } = useCrmSettingsTableState({
    defaultSelectedColumns: DEFAULT_INDUSTRIES_TABLE_COLUMNS,
    selectableColumnKeys: INDUSTRIES_TABLE_SELECTABLE_KEYS,
    columnStorageKey: INDUSTRIES_TABLE_COLUMN_STORAGE_KEY,
  });
  const {
    inputValue: searchInput,
    queryValue: search,
    handleInputChange: handleSearchChange,
    submitQuery: submitSearch,
  } = useDebouncedSearchInput();
  const [showModal, setShowModal] = useState(false);
  const [editingIndustry, setEditingIndustry] = useState<IndustryData | null>(null);
  const [deletingIndustry, setDeletingIndustry] = useState<IndustryData | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingIndustryPending, setDeletingIndustryPending] = useState(false);
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
  const [deletingProductPending, setDeletingProductPending] = useState(false);
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
        per_page: pagination.rowsPerPage,
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
  }, [pagination.currentPage, pagination.rowsPerPage, search]);

  useEffect(() => {
    setPagination((prev) =>
      prev.currentPage === 1 ? prev : { ...prev, currentPage: 1 },
    );
  }, [search, setPagination]);

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
      consumeHandledApiError(error, "IndustriesPage.handleSubmit");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deletingIndustry) return;
    try {
      setDeletingIndustryPending(true);
      await deleteIndustry(deletingIndustry.id);
      setShowDeleteModal(false);
      setDeletingIndustry(null);
      await fetchIndustries();
    } catch (error: any) {
      consumeHandledApiError(error, "IndustriesPage.handleDelete");
    } finally {
      setDeletingIndustryPending(false);
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
      consumeHandledApiError(error, "IndustriesPage.handleProductSubmit");
    } finally {
      setProductSubmitting(false);
    }
  };

  // Handle delete product
  const handleDeleteProduct = async () => {
    if (!deletingProduct || !viewingIndustry) return;
    try {
      setDeletingProductPending(true);
      await deleteProduct(deletingProduct.id);
      setShowProductDeleteModal(false);
      setDeletingProduct(null);
      // Refresh products after delete
      await fetchIndustryProducts(viewingIndustry.id);
    } catch (error: any) {
      consumeHandledApiError(error, "IndustriesPage.handleDeleteProduct");
    } finally {
      setDeletingProductPending(false);
    }
  };

  const industriesTableColumns = useMemo<TableColumn<IndustryData>[]>(
    () => [
      {
        key: "name",
        label: "Name",
        sortable: true,
        type: "custom",
        width: "240px",
        render: (ind) => <div className="fw-semibold">{ind.name}</div>,
      },
      {
        key: "description",
        label: "Description",
        sortable: false,
        type: "custom",
        width: "420px",
        render: (ind) => <CrmTruncatedDescriptionCell text={ind.description} />,
      },
      {
        key: "created_at",
        label: "Created At",
        sortable: true,
        type: "custom",
        width: "200px",
        render: (ind) => (
          <div className="text-muted small">
            {formatDateTimeToLocal(ind.created_at, GlobalDateFormat)}
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
        render: (ind) => (
          <div className="d-flex justify-content-end gap-2">
            <Button
              variant="outline-info"
              size="sm"
              onClick={() => handleView(ind)}
            >
              <Eye size={14} />
            </Button>
            {session?.user?.permissions?.includes(PERMISSIONS.EDIT_CRM_INDUSTRY) && (
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => handleOpenModal(ind)}
              >
                <Edit size={14} />
              </Button>
            )}
            {session?.user?.permissions?.includes(
              PERMISSIONS.DELETE_CRM_INDUSTRY,
            ) && (
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => {
                  setDeletingIndustry(ind);
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

  const industriesToolbarConfig = useMemo<ToolbarConfig>(
    () => ({
      showSearch: true,
      searchValue: searchInput,
      searchPlaceholder: "Search product groups by name or description...",
      onSearchChange: handleSearchChange,
      onSearch: () => {
        submitSearch();
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
      },
      rightActions: (
        <div className="d-flex gap-2">
          {session?.user?.permissions?.includes(PERMISSIONS.CREATE_CRM_INDUSTRY) && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenModal()}
              className="d-flex align-items-center gap-2"
            >
              <PlusCircle size={16} />
              Add Product Group
            </Button>
          )}
        </div>
      ),
    }),
    [handleSearchChange, searchInput, session?.user?.permissions, submitSearch],
  );

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Product Groups"
      />
      <div>
        <GenericTable<IndustryData>
          data={industries}
          columns={industriesTableColumns}
          showToolbar
          toolbar={industriesToolbarConfig}
          pagination={{
            currentPage: pagination.currentPage,
            rowsPerPage: pagination.rowsPerPage,
            totalRows: totalIndustries,
            pageSizeOptions: [10, 15, 25, 50],
          }}
          onPaginationChange={handlePaginationChange}
          customizableColumns
          selectedColumns={selectedColumns}
          defaultSelectedColumns={DEFAULT_INDUSTRIES_TABLE_COLUMNS}
          onColumnChange={setSelectedColumns}
          columnStorageKey={INDUSTRIES_TABLE_COLUMN_STORAGE_KEY}
          loading={loading}
          emptyMessage="No product groups found"
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
          size="lg"
          centered
        >
          <Modal.Header closeButton={!submitting}>
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
            <Modal.Footer className="border-0 pt-2">
              <div className="d-flex justify-content-between align-items-center w-100 gap-3 flex-nowrap">
                <Form.Text className="text-muted d-flex align-items-center gap-1 mb-0 min-w-0 flex-shrink-1 pe-2">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span style={{ fontSize: "0.813rem" }}>
                    Fields marked with <span className="text-danger fw-bold">*</span> are required
                  </span>
                </Form.Text>
                <div
                  className="flex-shrink-0"
                  style={{
                    ...CRM_DIALOG_FOOTER_ACTIONS_ROW_STYLE,
                    flexWrap: "nowrap",
                  }}
                >
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={submitting}
                    className="d-inline-flex align-items-center justify-content-center gap-2"
                    style={{
                      ...CRM_DIALOG_PRIMARY_BUTTON_STYLE,
                      minWidth: "148px",
                    }}
                  >
                    {submitting ? (
                      <>
                        <Spinner size="sm" />
                        {editingIndustry ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      <>
                        <Check size={16} aria-hidden />
                        {editingIndustry ? "Update" : "Create"}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={() => setShowModal(false)}
                    disabled={submitting}
                    style={CRM_DIALOG_SECONDARY_BUTTON_STYLE}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
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
          loading={deletingIndustryPending}
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
                <CrmDescriptionDetailsBlock
                  text={viewingIndustry.description}
                  emptyDisplay="No description"
                />
              </div>

              {/* Products Section */}
              <div className="mb-3 mt-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <Form.Label className="text-muted small mb-0">
                    Products ({industryProducts.length})</Form.Label>
                  <div className="d-flex align-items-center gap-2">
                    
                    {session?.user?.permissions?.includes(PERMISSIONS.CREATE_CRM_PRODUCTS) && (
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
                                {session?.user?.permissions?.includes(PERMISSIONS.EDIT_CRM_PRODUCTS) && (
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
                                {session?.user?.permissions?.includes(PERMISSIONS.DELETE_CRM_PRODUCTS) && (
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
            <Modal.Footer className="border-0 pt-0">
              <div
                className="w-100 d-flex justify-content-end"
                style={CRM_DIALOG_FOOTER_ACTIONS_ROW_STYLE}
              >
                {session?.user?.permissions?.includes(PERMISSIONS.EDIT_CRM_INDUSTRY) && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      setShowViewModal(false);
                      handleOpenModal(viewingIndustry);
                    }}
                    style={CRM_DIALOG_PRIMARY_BUTTON_STYLE}
                  >
                    <Edit size={16} aria-hidden />
                    Edit Product Group
                  </Button>
                )}
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

        {/* Product Form Modal */}
        <Modal
          show={showProductModal}
          onHide={() => {
            if (productSubmitting) return;
            setShowProductModal(false);
            setEditingProduct(null);
          }}
          size="lg"
          centered
        >
          <Modal.Header closeButton={!productSubmitting}>
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

              <div className="d-flex justify-content-between align-items-center gap-3 flex-nowrap mt-4 w-100">
                <Form.Text className="text-muted d-flex align-items-center gap-1 mb-0 align-self-center min-w-0 flex-shrink-1 pe-2">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span style={{ fontSize: "0.813rem" }}>
                    Fields marked with <span className="text-danger fw-bold">*</span> are required
                  </span>
                </Form.Text>
                <div
                  className="flex-shrink-0"
                  style={{
                    ...CRM_DIALOG_FOOTER_ACTIONS_ROW_STYLE,
                    flexWrap: "nowrap",
                  }}
                >
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={productSubmitting}
                    className="d-inline-flex align-items-center justify-content-center gap-2"
                    style={{
                      ...CRM_DIALOG_PRIMARY_BUTTON_STYLE,
                      minWidth: "170px",
                    }}
                  >
                    {productSubmitting ? (
                      <>
                        <Spinner size="sm" />
                        {editingProduct ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      <>
                        <Check size={16} aria-hidden />
                        {editingProduct ? "Update Product" : "Add Product"}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={() => {
                      setShowProductModal(false);
                      setEditingProduct(null);
                    }}
                    disabled={productSubmitting}
                    style={CRM_DIALOG_SECONDARY_BUTTON_STYLE}
                  >
                    Cancel
                  </Button>
                </div>
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
          loading={deletingProductPending}
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
                    {formatDateForTable(viewingProduct.created_at)}
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
              <CrmDescriptionDetailsBlock
                text={viewingProduct.description}
                emptyDisplay="No description available"
              />
            </Modal.Body>

            <Modal.Footer
              className="border-0"
              style={{ borderTop: "1px solid #e5e7eb", padding: "20px 30px" }}
            >
              <div
                className="w-100 d-flex justify-content-end"
                style={CRM_DIALOG_FOOTER_ACTIONS_ROW_STYLE}
              >
                {session?.user?.permissions?.includes(PERMISSIONS.EDIT_CRM_PRODUCTS) && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      setShowProductViewModal(false);
                      handleOpenProductModal(viewingProduct);
                    }}
                    style={CRM_DIALOG_PRIMARY_BUTTON_STYLE}
                  >
                    <Edit size={16} aria-hidden />
                    Edit Product
                  </Button>
                )}
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowProductViewModal(false)}
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
};

IndustriesPage.getLayout = (page: React.ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default IndustriesPage;
