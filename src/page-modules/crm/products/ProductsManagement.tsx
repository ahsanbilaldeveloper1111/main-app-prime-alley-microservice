import "@assets/scss/datatable-style.scss";
import "@assets/scss/products-page.scss";
import "@assets/scss/common.scss";
import React, { useMemo } from "react";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, { type ToolbarConfig } from "@components/GenericTable";
import { Button } from "react-bootstrap";
import { CheckCircle, Package, PlusCircle, X } from "lucide-react";
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
import { buildProductsTableColumns } from "@page-modules/crm/products/productsTableColumns";
import { CrmSettingsTableWrap } from "@page-modules/crm/shared/CrmSettingsTableWrap";

const { PERMISSIONS } = HEADER_CONSTANTS;

function ProductsPage(props: CrmPageDisplayProps = {}) {
  const { hideBreadcrumb, breadcrumbMainLink } = props;
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

  const productsTableColumns = useMemo(
    () =>
      buildProductsTableColumns({
        selectedColumns: selectedProductsColumns,
        canEdit: canEditProduct,
        canDelete: canDeleteProduct,
        onView: openProductView,
        onEdit: handleOpenProductModal,
        onDelete: requestDeleteProduct,
      }),
    [
      selectedProductsColumns,
      canEditProduct,
      canDeleteProduct,
      openProductView,
      handleOpenProductModal,
      requestDeleteProduct,
    ],
  );

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
          mainLink={breadcrumbMainLink ?? "/crm/dashboard"}
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

        <CrmSettingsTableWrap
          hideBreadcrumb={hideBreadcrumb}
          standaloneWrapperClass="products-table-wrapper mb-4"
        >
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
            sortable={false}
            customizableColumns
            selectedColumns={selectedProductsColumns}
            defaultSelectedColumns={DEFAULT_PRODUCT_TABLE_COLUMNS}
            onColumnChange={setSelectedProductsColumns}
            columnStorageKey={PRODUCTS_TABLE_COLUMN_STORAGE_KEY}
            showToolbar
            toolbar={productsToolbarConfig}
            showToolbarActions={false}
            uniqueKey="id"
            hover
            size="md"
          />
        </CrmSettingsTableWrap>
      </div>
    </React.Fragment>
  );
}

export default ProductsPage;
