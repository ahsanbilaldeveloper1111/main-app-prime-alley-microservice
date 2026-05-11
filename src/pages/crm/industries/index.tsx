import "@assets/scss/datatable-style.scss";
import "@assets/scss/industries-page.scss";
import React, {
  useCallback,
  useMemo,
  type FormEvent,
  type Dispatch,
  type SetStateAction,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { IndustryData, type CrmProduct } from "@utils/crm";
import {
  formatDateTimeToLocal,
  GlobalDateFormat,
  formatDateForTable,
} from "@utils/Helper";
import GenericTable, {
  TableColumn,
  ToolbarConfig,
} from "@components/GenericTable";
import {
  CrmDescriptionDetailsBlock,
  CrmTruncatedDescriptionCell,
} from "@components/crm/crmTruncatedDescriptionCell";
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
import DeleteConfirmationModal from "@components/page-partials/DeleteConfirmationModal";
import type { CrmPageDisplayProps } from "@page-modules/crm/crmPageDisplayProps";
import { useIndustriesPage } from "@hooks/crm/useIndustriesPage";
import {
  DEFAULT_INDUSTRIES_TABLE_COLUMNS,
  INDUSTRIES_TABLE_COLUMN_STORAGE_KEY,
  type ProductFormData,
} from "@page-modules/crm/industries/industriesPageModel";

function IndustryProductsSection({
  industryProducts,
  loadingProducts,
  canCreateProduct,
  canEditProduct,
  canDeleteProduct,
  onAddProduct,
  onViewProduct,
  onEditProduct,
  onDeleteProduct,
}: Readonly<{
  industryProducts: CrmProduct[];
  loadingProducts: boolean;
  canCreateProduct: boolean;
  canEditProduct: boolean;
  canDeleteProduct: boolean;
  onAddProduct: () => void;
  onViewProduct: (p: CrmProduct) => void;
  onEditProduct: (p: CrmProduct) => void;
  onDeleteProduct: (p: CrmProduct) => void;
}>) {
  return (
    <div className="mb-3 mt-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <Form.Label className="text-muted small mb-0">
          Products ({industryProducts.length})
        </Form.Label>
        <div className="d-flex align-items-center gap-2">
          {canCreateProduct && (
            <Button
              variant="primary"
              size="sm"
              onClick={onAddProduct}
              className="d-flex align-items-center gap-1"
            >
              <PlusCircle size={14} />
              Add Product
            </Button>
          )}
        </div>
      </div>
      {loadingProducts && (
        <div className="text-center py-3">
          <Spinner animation="border" size="sm" variant="primary" />
          <p className="text-muted small mt-2 mb-0">Loading products...</p>
        </div>
      )}
      {!loadingProducts && industryProducts.length === 0 && (
        <div className="text-center py-3 border rounded">
          <p className="text-muted small mb-0">
            No products found for this industry
          </p>
        </div>
      )}
      {!loadingProducts && industryProducts.length > 0 && (
        <div className="border rounded industries-product-table-wrap">
          <Table hover className="mb-0 industries-product-table">
            <thead className="bg-light">
              <tr>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Currency</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Status</th>
                <th className="industries-product-table-actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {industryProducts.map((product) => (
                <tr key={product.id}>
                  <td className="fw-semibold">{product.name}</td>
                  <td>
                    <Badge bg="light" text="dark" className="font-monospace">
                      {product.sku}
                    </Badge>
                  </td>
                  <td className="fw-semibold text-success">
                    {product.currency}{" "}
                    {Number.parseFloat(product.price || "0").toFixed(2)}
                  </td>
                  <td>{product.currency}</td>
                  <td>
                    <Badge bg="info" className="bg-opacity-10 text-dark">
                      {product.category || "N/A"}
                    </Badge>
                  </td>
                  <td>{product.brand || "N/A"}</td>
                  <td>
                    <Badge bg={product.active ? "success" : "secondary"}>
                      {product.active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="industries-product-table-actions-col">
                    <div className="d-flex gap-1">
                      <Button
                        variant="link"
                        size="sm"
                        className="p-1"
                        title="View"
                        onClick={() => onViewProduct(product)}
                      >
                        <Eye size={16} />
                      </Button>
                      {canEditProduct && (
                        <Button
                          variant="link"
                          size="sm"
                          className="p-1"
                          title="Edit"
                          onClick={() => onEditProduct(product)}
                        >
                          <Edit size={16} />
                        </Button>
                      )}
                      {canDeleteProduct && (
                        <Button
                          variant="link"
                          size="sm"
                          className="p-1 text-danger"
                          title="Delete"
                          onClick={() => onDeleteProduct(product)}
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
  );
}

function IndustryDetailViewModal({
  industry,
  show,
  onHide,
  industryProducts,
  loadingProducts,
  canCreateProduct,
  canEditProduct,
  canDeleteProduct,
  canEditIndustry,
  onAddProduct,
  onViewProduct,
  onEditProduct,
  onDeleteProduct,
  onEditIndustryClick,
}: Readonly<{
  industry: IndustryData;
  show: boolean;
  onHide: () => void;
  industryProducts: CrmProduct[];
  loadingProducts: boolean;
  canCreateProduct: boolean;
  canEditProduct: boolean;
  canDeleteProduct: boolean;
  canEditIndustry: boolean;
  onAddProduct: () => void;
  onViewProduct: (p: CrmProduct) => void;
  onEditProduct: (p: CrmProduct) => void;
  onDeleteProduct: (p: CrmProduct) => void;
  onEditIndustryClick: () => void;
}>) {
  return (
    <Modal size="xl" show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Product Group Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3">
          <Form.Label className="text-muted small">Name</Form.Label>
          <div className="fw-semibold">{industry.name}</div>
        </div>
        <div className="mb-3">
          <Form.Label className="text-muted small">Description</Form.Label>
          <CrmDescriptionDetailsBlock
            text={industry.description}
            emptyDisplay="No description"
          />
        </div>
        <IndustryProductsSection
          industryProducts={industryProducts}
          loadingProducts={loadingProducts}
          canCreateProduct={canCreateProduct}
          canEditProduct={canEditProduct}
          canDeleteProduct={canDeleteProduct}
          onAddProduct={onAddProduct}
          onViewProduct={onViewProduct}
          onEditProduct={onEditProduct}
          onDeleteProduct={onDeleteProduct}
        />
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0">
        <div className="w-100 d-flex justify-content-end industries-crm-dialog-footer">
          {canEditIndustry && (
            <button
              type="button"
              className="industries-crm-btn-primary"
              onClick={onEditIndustryClick}
            >
              <Edit size={16} aria-hidden />
              Edit Product Group
            </button>
          )}
          <button
            type="button"
            className="industries-crm-btn-secondary"
            onClick={onHide}
          >
            Close
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}

function ProductFormModal({
  show,
  onHide,
  productSubmitting,
  editingProduct,
  productFormData,
  setProductFormData,
  onSubmit,
}: Readonly<{
  show: boolean;
  onHide: () => void;
  productSubmitting: boolean;
  editingProduct: CrmProduct | null;
  productFormData: ProductFormData;
  setProductFormData: Dispatch<SetStateAction<ProductFormData>>;
  onSubmit: (e: FormEvent) => void;
}>) {
  return (
    <Modal
      show={show}
      onHide={() => {
        if (productSubmitting) return;
        onHide();
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
        <Form onSubmit={onSubmit}>
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
                    setProductFormData({
                      ...productFormData,
                      productName: e.target.value,
                    })
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
                    setProductFormData({
                      ...productFormData,
                      sku: e.target.value,
                    })
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
                    setProductFormData({
                      ...productFormData,
                      price: e.target.value,
                    })
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
                    setProductFormData({
                      ...productFormData,
                      currency: e.target.value,
                    })
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
                    setProductFormData({
                      ...productFormData,
                      category: e.target.value,
                    })
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
                    setProductFormData({
                      ...productFormData,
                      brand: e.target.value,
                    })
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
                setProductFormData({
                  ...productFormData,
                  description: e.target.value,
                })
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
                setProductFormData({
                  ...productFormData,
                  isActive: e.target.checked,
                })
              }
            />
          </Form.Group>

          <div className="industries-modal-footer-hint-row mt-4">
            <Form.Text className="text-muted d-flex align-items-center gap-1 mb-0 align-self-center min-w-0 flex-shrink-1 pe-2">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span className="industries-form-hint-text">
                Fields marked with{" "}
                <span className="text-danger fw-bold">*</span> are required
              </span>
            </Form.Text>
            <div className="flex-shrink-0 industries-crm-dialog-footer industries-crm-dialog-footer--nowrap">
              <button
                type="submit"
                disabled={productSubmitting}
                className="industries-crm-btn-primary industries-crm-btn-primary--min170 d-inline-flex align-items-center justify-content-center gap-2"
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
              </button>
              <button
                type="button"
                className="industries-crm-btn-secondary"
                onClick={onHide}
                disabled={productSubmitting}
              >
                Cancel
              </button>
            </div>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

function ProductViewModal({
  product,
  industry,
  show,
  onHide,
  canEditProduct,
  onEditClick,
}: Readonly<{
  product: CrmProduct;
  industry: IndustryData | null;
  show: boolean;
  onHide: () => void;
  canEditProduct: boolean;
  onEditClick: () => void;
}>) {
  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <div className="industries-product-view-header">
        <button
          type="button"
          className="industries-product-view-close"
          onClick={onHide}
          aria-label="Close"
        >
          <X size={20} />
        </button>
        <h3 className="industries-product-view-title">{product.name}</h3>
        <p className="industries-product-view-subtitle">Product Details</p>
      </div>

      <Modal.Body className="industries-product-view-body border-0 pt-0">
        <div className="industries-product-view-section-title">
          <Package size={18} className="industries-product-view-section-icon" />
          Basic Information
        </div>
        <div className="industries-product-view-grid">
          <div className="industries-product-view-tile">
            <div className="industries-product-view-tile-label">Product Name</div>
            <div className="industries-product-view-tile-value">{product.name}</div>
          </div>
          {industry && (
            <div className="industries-product-view-tile">
              <div className="industries-product-view-tile-label">Industry</div>
              <div className="industries-product-view-tile-value">
                <Badge
                  bg="primary"
                  className="bg-opacity-10 text-dark industries-product-view-badge"
                >
                  <Building2
                    size={14}
                    className="industries-product-view-inline-icon"
                  />
                  {industry.name}
                </Badge>
              </div>
            </div>
          )}
          <div className="industries-product-view-tile">
            <div className="industries-product-view-tile-label">SKU</div>
            <div className="industries-product-view-tile-value">
              <Badge
                bg="light"
                text="dark"
                className="font-monospace industries-product-view-badge"
              >
                {product.sku}
              </Badge>
            </div>
          </div>
          <div className="industries-product-view-tile">
            <div className="industries-product-view-tile-label">Price</div>
            <div className="industries-product-view-tile-value industries-product-view-tile-value--price">
              {product.currency}{" "}
              {Number.parseFloat(product.price || "0").toFixed(2)}
            </div>
          </div>
          <div className="industries-product-view-tile">
            <div className="industries-product-view-tile-label">Currency</div>
            <div className="industries-product-view-tile-value">
              {product.currency}
            </div>
          </div>
          <div className="industries-product-view-tile">
            <div className="industries-product-view-tile-label">Status</div>
            <div className="industries-product-view-tile-value">
              <Badge
                bg={product.active ? "success" : "secondary"}
                className="industries-product-view-badge--pill"
              >
                {product.active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
          <div className="industries-product-view-tile">
            <div className="industries-product-view-tile-label">Created Date</div>
            <div className="industries-product-view-tile-value">
              <Calendar
                size={14}
                className="industries-product-view-inline-icon"
              />
              {formatDateForTable(product.created_at)}
            </div>
          </div>
        </div>

        <div className="industries-product-view-section-title">
          <Tag size={18} className="industries-product-view-section-icon" />
          Product Details
        </div>
        <div className="industries-product-view-grid">
          <div className="industries-product-view-tile">
            <div className="industries-product-view-tile-label">Category</div>
            <div className="industries-product-view-tile-value">
              <Badge
                bg="info"
                className="bg-opacity-10 text-dark industries-product-view-badge"
              >
                {product.category || "N/A"}
              </Badge>
            </div>
          </div>
          <div className="industries-product-view-tile">
            <div className="industries-product-view-tile-label">Brand</div>
            <div className="industries-product-view-tile-value">
              <Building2
                size={14}
                className="industries-product-view-inline-icon"
              />
              {product.brand || "N/A"}
            </div>
          </div>
        </div>

        <div className="industries-product-view-section-title">
          <FileText size={18} className="industries-product-view-section-icon" />
          Description
        </div>
        <CrmDescriptionDetailsBlock
          text={product.description}
          emptyDisplay="No description available"
        />
      </Modal.Body>

      <Modal.Footer className="border-0 industries-product-view-footer">
        <div className="w-100 d-flex justify-content-end industries-crm-dialog-footer">
          {canEditProduct && (
            <button
              type="button"
              className="industries-crm-btn-primary"
              onClick={onEditClick}
            >
              <Edit size={16} aria-hidden />
              Edit Product
            </button>
          )}
          <button
            type="button"
            className="industries-crm-btn-secondary"
            onClick={onHide}
          >
            Close
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}

const IndustriesPage = ({ hideBreadcrumb }: CrmPageDisplayProps = {}) => {
  const {
    session,
    PERMISSIONS,
    industries,
    totalIndustries,
    loading,
    pagination,
    setPagination,
    selectedColumns,
    setSelectedColumns,
    handlePaginationChange,
    searchInput,
    handleSearchChange,
    submitSearch,
    showModal,
    setShowModal,
    editingIndustry,
    deletingIndustry,
    showDeleteModal,
    setShowDeleteModal,
    setDeletingIndustry,
    deletingIndustryPending,
    showViewModal,
    setShowViewModal,
    viewingIndustry,
    formData,
    setFormData,
    submitting,
    industryProducts,
    loadingProducts,
    showProductModal,
    setShowProductModal,
    editingProduct,
    setEditingProduct,
    deletingProduct,
    showProductDeleteModal,
    setShowProductDeleteModal,
    setDeletingProduct,
    deletingProductPending,
    showProductViewModal,
    setShowProductViewModal,
    viewingProduct,
    productSubmitting,
    productFormData,
    setProductFormData,
    handleOpenModal,
    handleSubmit,
    handleDelete,
    handleView,
    handleOpenProductModal,
    handleProductSubmit,
    handleDeleteProduct,
    requestDeleteIndustry,
    requestDeleteProduct,
    openProductView,
  } = useIndustriesPage();

  const perms = session?.user?.permissions;
  const canCreateProduct =
    perms?.includes(PERMISSIONS.CREATE_CRM_PRODUCTS) ?? false;
  const canEditProduct =
    perms?.includes(PERMISSIONS.EDIT_CRM_PRODUCTS) ?? false;
  const canDeleteCrmProduct =
    perms?.includes(PERMISSIONS.DELETE_CRM_PRODUCTS) ?? false;
  const canEditIndustryDetail =
    perms?.includes(PERMISSIONS.EDIT_CRM_INDUSTRY) ?? false;

  const onViewIndustry = useCallback(
    (ind: IndustryData) => {
      handleView(ind).catch(() => undefined);
    },
    [handleView],
  );

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
              onClick={() => onViewIndustry(ind)}
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
                onClick={() => requestDeleteIndustry(ind)}
              >
                <Trash2 size={14} />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [
      session?.user?.permissions,
      PERMISSIONS,
      onViewIndustry,
      handleOpenModal,
      requestDeleteIndustry,
    ],
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
    [
      handleSearchChange,
      searchInput,
      session?.user?.permissions,
      PERMISSIONS,
      submitSearch,
      setPagination,
      handleOpenModal,
    ],
  );

  return (
    <React.Fragment>
      {!hideBreadcrumb && (
        <BreadcrumbItem
          mainTitle="CRM"
          mainLink="/crm/dashboard"
          subTitle="Product Groups"
        />
      )}
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
              <div className="industries-modal-footer-hint-row">
                <Form.Text className="text-muted d-flex align-items-center gap-1 mb-0 min-w-0 flex-shrink-1 pe-2">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span className="industries-form-hint-text">
                    Fields marked with{" "}
                    <span className="text-danger fw-bold">*</span> are required
                  </span>
                </Form.Text>
                <div className="flex-shrink-0 industries-crm-dialog-footer industries-crm-dialog-footer--nowrap">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="industries-crm-btn-primary industries-crm-btn-primary--min148 d-inline-flex align-items-center justify-content-center gap-2"
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
                  </button>
                  <button
                    type="button"
                    className="industries-crm-btn-secondary"
                    onClick={() => setShowModal(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Modal.Footer>
          </Form>
        </Modal>

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

        {viewingIndustry && (
          <IndustryDetailViewModal
            industry={viewingIndustry}
            show={showViewModal}
            onHide={() => setShowViewModal(false)}
            industryProducts={industryProducts}
            loadingProducts={loadingProducts}
            canCreateProduct={canCreateProduct}
            canEditProduct={canEditProduct}
            canDeleteProduct={canDeleteCrmProduct}
            canEditIndustry={canEditIndustryDetail}
            onAddProduct={() => handleOpenProductModal()}
            onViewProduct={openProductView}
            onEditProduct={handleOpenProductModal}
            onDeleteProduct={requestDeleteProduct}
            onEditIndustryClick={() => {
              setShowViewModal(false);
              handleOpenModal(viewingIndustry);
            }}
          />
        )}

        <ProductFormModal
          show={showProductModal}
          onHide={() => {
            setShowProductModal(false);
            setEditingProduct(null);
          }}
          productSubmitting={productSubmitting}
          editingProduct={editingProduct}
          productFormData={productFormData}
          setProductFormData={setProductFormData}
          onSubmit={handleProductSubmit}
        />

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

        {viewingProduct && (
          <ProductViewModal
            product={viewingProduct}
            industry={viewingIndustry}
            show={showProductViewModal}
            onHide={() => setShowProductViewModal(false)}
            canEditProduct={canEditProduct}
            onEditClick={() => {
              setShowProductViewModal(false);
              handleOpenProductModal(viewingProduct);
            }}
          />
        )}
      </div>
    </React.Fragment>
  );
};

IndustriesPage.getLayout = (page: React.ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default IndustriesPage;
