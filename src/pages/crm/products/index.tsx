import "@assets/scss/datatable-style.scss";
import "@assets/scss/products-page.scss";
import React, { useMemo } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, {
  type TableColumn,
  type ToolbarConfig,
} from "@components/GenericTable";
import { CrmTruncatedDescriptionCell } from "@components/crm/crmTruncatedDescriptionCell";
import { Button, Badge } from "react-bootstrap";
import {
  PlusCircle,
  Eye,
  Edit,
  Trash2,
  Package,
  X,
  CheckCircle,
} from "lucide-react";
import "@assets/scss/common.scss";
import DeleteConfirmationModal from "@components/page-partials/DeleteConfirmationModal";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import type { CrmSettingsTablePaginationState } from "@hooks/useCrmSettingsTableState";
import type { CrmPageDisplayProps } from "@page-modules/crm/crmPageDisplayProps";
import { useCrmProductsPage } from "@hooks/crm/useCrmProductsPage";
import {
  DEFAULT_PRODUCT_TABLE_COLUMNS,
  PRODUCTS_TABLE_COLUMN_STORAGE_KEY,
  getStatusByFilterId,
  type ProductDisplayData,
  type ProductsPageFilters,
} from "@page-modules/crm/products/productsPageModel";
import ProductsFormSidebar from "@page-modules/crm/products/ProductsFormSidebar";
import ProductsViewModal from "@page-modules/crm/products/ProductsViewModal";

const { PERMISSIONS } = HEADER_CONSTANTS;

function ProductsPage(props: CrmPageDisplayProps = {}) {
  const { hideBreadcrumb } = props;
  const page = useCrmProductsPage();
  const {
    session,
    loading,
    productsSearch,
    handleProductsSearchChange,
    handleProductsSearchSubmit,
    setProductsFilters,
    showProductModal,
    setShowProductModal,
    editingProduct,
    submittingProduct,
    productsPagination,
    setProductsPagination,
    selectedProductsColumns,
    setSelectedProductsColumns,
    handleProductsPaginationChange,
    productFormData,
    setProductFormData,
    industries,
    loadingIndustries,
    deletingProduct,
    showProductDeleteModal,
    setShowProductDeleteModal,
    setDeletingProduct,
    deletingProductPending,
    showProductViewModal,
    setShowProductViewModal,
    viewingProduct,
    activeFilter,
    setActiveFilter,
    displayProducts,
    uniqueCategories,
    productFilterPills,
    handleOpenProductModal,
    handleProductSubmit,
    handleDeleteProduct,
    requestDeleteProduct,
    openProductView,
    totalProducts,
  } = page;

  const canEditProduct =
    session?.user?.permissions?.includes(PERMISSIONS.EDIT_CRM_PRODUCTS) ?? false;
  const canDeleteProduct =
    session?.user?.permissions?.includes(PERMISSIONS.DELETE_CRM_PRODUCTS) ?? false;
  const canCreateProduct =
    session?.user?.permissions?.includes(PERMISSIONS.CREATE_CRM_PRODUCTS) ?? false;

  const productsTableColumns = useMemo<TableColumn<ProductDisplayData>[]>(() => {
    const cols: TableColumn<ProductDisplayData>[] = [];

    if (selectedProductsColumns.includes("productName")) {
      cols.push({
        key: "productName",
        label: "Product Name",
        sortable: true,
        type: "custom",
        render: (product) => (
          <span className="fw-semibold">{product.productName}</span>
        ),
      });
    }

    if (selectedProductsColumns.includes("sku")) {
      cols.push({
        key: "sku",
        label: "SKU",
        sortable: true,
        type: "custom",
        render: (product) => (
          <Badge bg="light" text="dark" className="font-monospace">
            {product.sku}
          </Badge>
        ),
      });
    }

    if (selectedProductsColumns.includes("price")) {
      cols.push({
        key: "price",
        label: "Price",
        sortable: true,
        type: "custom",
        render: (product) => (
          <span className="fw-semibold text-success">
            {product.currency} {product.price.toFixed(2)}
          </span>
        ),
      });
    }

    if (selectedProductsColumns.includes("currency")) {
      cols.push({
        key: "currency",
        label: "Currency",
        sortable: true,
      });
    }

    if (selectedProductsColumns.includes("category")) {
      cols.push({
        key: "category",
        label: "Category",
        sortable: true,
        type: "custom",
        render: (product) => (
          <Badge bg="info" className="bg-opacity-10 text-dark">
            {product.category || "N/A"}
          </Badge>
        ),
      });
    }

    if (selectedProductsColumns.includes("brand")) {
      cols.push({
        key: "brand",
        label: "Brand",
        sortable: true,
        type: "custom",
        render: (product) => <span>{product.brand || "N/A"}</span>,
      });
    }

    if (selectedProductsColumns.includes("status")) {
      cols.push({
        key: "status",
        label: "Status",
        sortable: true,
        type: "custom",
        render: (product) => (
          <Badge bg={product.status === "Active" ? "success" : "secondary"}>
            {product.status}
          </Badge>
        ),
      });
    }

    if (selectedProductsColumns.includes("description")) {
      cols.push({
        key: "description",
        label: "Description",
        sortable: false,
        type: "custom",
        width: "260px",
        render: (product) => (
          <CrmTruncatedDescriptionCell
            text={product.description}
            emptyDisplay="N/A"
          />
        ),
      });
    }

    if (selectedProductsColumns.includes("created")) {
      cols.push({
        key: "created",
        label: "Created",
        sortable: true,
        type: "custom",
        render: (product) => (
          <span className="text-muted">{product.created}</span>
        ),
      });
    }

    if (selectedProductsColumns.includes("actions")) {
      cols.push({
        key: "actions",
        label: "Actions",
        sortable: false,
        type: "custom",
        render: (product) => (
          <div className="d-flex gap-1">
            <Button
              variant="link"
              size="sm"
              className="p-1"
              title="View"
              onClick={() => openProductView(product)}
            >
              <Eye size={16} />
            </Button>
            {canEditProduct && (
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
            {canDeleteProduct && (
              <Button
                variant="link"
                size="sm"
                className="p-1 text-danger"
                title="Delete"
                onClick={() => requestDeleteProduct(product)}
              >
                <Trash2 size={16} />
              </Button>
            )}
          </div>
        ),
      });
    }

    return cols;
  }, [
    selectedProductsColumns,
    canEditProduct,
    canDeleteProduct,
    openProductView,
    handleOpenProductModal,
    requestDeleteProduct,
  ]);

  const productsToolbarConfig = useMemo<ToolbarConfig>(
    () => ({
      showSearch: true,
      searchValue: productsSearch,
      searchPlaceholder: "Search by product name or SKU...",
      onSearchChange: handleProductsSearchChange,
      onSearch: handleProductsSearchSubmit,
      showTabs: true,
      showFilterPills: true,
      filterPills: productFilterPills,
      showMoreFiltersButton: false,
      tabs: [
        {
          id: "all",
          label: "All Products",
          icon: <Package size={14} />,
          removable: false,
        },
        {
          id: "active",
          label: "Active",
          icon: <CheckCircle size={14} />,
          removable: false,
        },
        {
          id: "inactive",
          label: "Inactive",
          icon: <X size={14} />,
          removable: false,
        },
      ],
      activeTab: activeFilter,
      onTabChange: (filterId) => {
        setActiveFilter(filterId);
        const nextStatus = getStatusByFilterId(filterId);
        setProductsFilters((prev: ProductsPageFilters) => ({
          ...prev,
          status: nextStatus,
        }));
        setProductsPagination((prev: CrmSettingsTablePaginationState) => ({
          ...prev,
          currentPage: 1,
        }));
      },
      rightActions: (
        <div className="d-flex gap-2">
          {canCreateProduct && (
            <Button
              onClick={() => handleOpenProductModal()}
              className="products-toolbar-add-btn"
            >
              <PlusCircle size={15} />
              Add Product
            </Button>
          )}
        </div>
      ),
    }),
    [
      productFilterPills,
      productsSearch,
      activeFilter,
      handleProductsSearchChange,
      handleProductsSearchSubmit,
      canCreateProduct,
      handleOpenProductModal,
      setActiveFilter,
      setProductsFilters,
      setProductsPagination,
    ],
  );

  if (!session?.user?.permissions?.includes(PERMISSIONS.VIEW_CRM_PRODUCTS)) {
    return null;
  }

  return (
    <React.Fragment>
      {!hideBreadcrumb && (
        <BreadcrumbItem
          mainTitle="CRM"
          mainLink="/crm/dashboard"
          subTitle="Products"
        />
      )}
      <div>
        {showProductModal && (
          <ProductsFormSidebar
            editingProduct={editingProduct}
            submittingProduct={submittingProduct}
            productFormData={productFormData}
            setProductFormData={setProductFormData}
            industries={industries}
            loadingIndustries={loadingIndustries}
            uniqueCategories={uniqueCategories}
            onOverlayClick={() => {
              if (!submittingProduct) setShowProductModal(false);
            }}
            onClose={() => {
              if (!submittingProduct) setShowProductModal(false);
            }}
            onSubmit={handleProductSubmit}
          />
        )}

        <DeleteConfirmationModal
          show={showProductDeleteModal}
          onHide={() => {
            setShowProductDeleteModal(false);
            setDeletingProduct(null);
          }}
          onConfirm={handleDeleteProduct}
          itemName={deletingProduct?.productName}
          itemType="product"
          loading={deletingProductPending}
        />

        {viewingProduct && (
          <ProductsViewModal
            product={viewingProduct}
            industries={industries}
            show={showProductViewModal}
            onHide={() => setShowProductViewModal(false)}
            canEditProduct={canEditProduct}
            onEdit={() => {
              setShowProductViewModal(false);
              handleOpenProductModal(viewingProduct);
            }}
          />
        )}

        <div className="products-table-wrapper mb-4">
          <GenericTable<ProductDisplayData>
            data={displayProducts}
            columns={productsTableColumns}
            actions={[]}
            showActions={false}
            loading={loading}
            loadingMessage="Loading products..."
            emptyMessage="No products found matching your criteria"
            pagination={{
              currentPage: productsPagination.currentPage,
              rowsPerPage: productsPagination.rowsPerPage,
              totalRows: totalProducts,
              pageSizeOptions: [15, 25, 50, 100],
            }}
            onPaginationChange={handleProductsPaginationChange}
            sortable
            customizableColumns
            selectedColumns={selectedProductsColumns}
            defaultSelectedColumns={DEFAULT_PRODUCT_TABLE_COLUMNS}
            onColumnChange={setSelectedProductsColumns}
            columnStorageKey={PRODUCTS_TABLE_COLUMN_STORAGE_KEY}
            showToolbar
            toolbar={productsToolbarConfig}
            showToolbarActions={false}
            uniqueKey="id"
          />
        </div>
      </div>
    </React.Fragment>
  );
}

ProductsPage.getLayout = (page: React.ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ProductsPage;
