import "@assets/scss/datatable-style.scss";
import "@assets/scss/industries-page.scss";
import "@assets/scss/common.scss";
import React, { useCallback, useMemo } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, {
  type ToolbarConfig,
} from "@components/GenericTable";
import { Button } from "react-bootstrap";
import { PlusCircle } from "lucide-react";
import DeleteConfirmationModal from "@components/page-partials/DeleteConfirmationModal";
import type { IndustryData } from "@utils/crm";
import type { CrmPageDisplayProps } from "@page-modules/crm/crmPageDisplayProps";
import { useIndustriesPage } from "@hooks/crm/useIndustriesPage";
import {
  DEFAULT_INDUSTRIES_TABLE_COLUMNS,
  INDUSTRIES_TABLE_COLUMN_STORAGE_KEY,
} from "@page-modules/crm/industries/industriesPageModel";
import { IndustryDetailViewModal } from "@page-modules/crm/industries/IndustryDetailViewModal";
import { IndustryFormModal } from "@page-modules/crm/industries/IndustryFormModal";
import { IndustryProductFormModal } from "@page-modules/crm/industries/IndustryProductFormModal";
import { IndustryProductViewModal } from "@page-modules/crm/industries/IndustryProductViewModal";
import { buildIndustriesTableColumns } from "@page-modules/crm/industries/industriesTableColumns";

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
  const canEditIndustry =
    perms?.includes(PERMISSIONS.EDIT_CRM_INDUSTRY) ?? false;
  const canDeleteIndustry =
    perms?.includes(PERMISSIONS.DELETE_CRM_INDUSTRY) ?? false;
  const canCreateIndustry =
    perms?.includes(PERMISSIONS.CREATE_CRM_INDUSTRY) ?? false;

  const onViewIndustry = useCallback(
    (ind: IndustryData) => {
      handleView(ind);
    },
    [handleView],
  );

  const industriesTableColumns = useMemo(
    () =>
      buildIndustriesTableColumns({
        canEdit: canEditIndustry,
        canDelete: canDeleteIndustry,
        onView: onViewIndustry,
        onEdit: handleOpenModal,
        onDelete: requestDeleteIndustry,
      }),
    [
      canEditIndustry,
      canDeleteIndustry,
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
          {canCreateIndustry && (
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
      canCreateIndustry,
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
          sortable={false}
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

        <IndustryFormModal
          show={showModal}
          submitting={submitting}
          editingIndustry={editingIndustry}
          formData={formData}
          setFormData={setFormData}
          onHide={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />

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
            canEditIndustry={canEditIndustry}
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

        <IndustryProductFormModal
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
          <IndustryProductViewModal
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
