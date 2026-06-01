import "@assets/scss/datatable-style.scss";
import React from "react";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable from "@components/GenericTable";
import "@assets/scss/common.scss";
import DeleteConfirmationModal from "@components/page-partials/DeleteConfirmationModal";
import { BusinessTypeFormModal } from "@page-modules/crm/business-types/BusinessTypeFormModal";
import {
  DEFAULT_BUSINESS_TYPES_TABLE_COLUMNS,
  useBusinessTypesPage,
} from "@hooks/useBusinessTypesPage";
import type { CrmPageDisplayProps } from "@page-modules/crm/crmPageDisplayProps";
import type { BusinessTypeData } from "@utils/crm";

const BusinessTypes = ({ hideBreadcrumb, breadcrumbMainLink }: CrmPageDisplayProps = {}) => {
  const {
    businessTypes,
    totalBusinessTypes,
    loading,
    pagination,
    selectedColumns,
    setSelectedColumns,
    handlePaginationChange,
    showModal,
    setShowModal,
    editingBusinessType,
    deletingBusinessType,
    showDeleteModal,
    closeDeleteModal,
    deletingBusinessTypePending,
    formData,
    setFormData,
    submitting,
    handleSubmit,
    handleDelete,
    businessTableColumns,
    businessToolbarConfig,
    columnStorageKey,
  } = useBusinessTypesPage();

  return (
    <React.Fragment>
      {!hideBreadcrumb && (
        <BreadcrumbItem
          mainTitle="CRM"
          mainLink={breadcrumbMainLink ?? "/crm/dashboard"}
          subTitle="Business Types"
        />
      )}
      <div>
        <GenericTable<BusinessTypeData>
          data={businessTypes}
          columns={businessTableColumns}
          sortable={false}
          showToolbar
          toolbar={businessToolbarConfig}
          pagination={{
            currentPage: pagination.currentPage,
            rowsPerPage: pagination.rowsPerPage,
            totalRows: totalBusinessTypes,
            pageSizeOptions: [10, 15, 25, 50],
          }}
          onPaginationChange={handlePaginationChange}
          customizableColumns
          selectedColumns={selectedColumns}
          defaultSelectedColumns={DEFAULT_BUSINESS_TYPES_TABLE_COLUMNS}
          onColumnChange={setSelectedColumns}
          columnStorageKey={columnStorageKey}
          loading={loading}
          emptyMessage={
            <div className="text-center p-5">
              <p className="text-muted">No business types found</p>
            </div>
          }
          uniqueKey="id"
          showToolbarActions={false}
        />

        <BusinessTypeFormModal
          show={showModal}
          submitting={submitting}
          editingBusinessType={editingBusinessType}
          formData={formData}
          setFormData={setFormData}
          onHide={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />

        <DeleteConfirmationModal
          show={showDeleteModal}
          onHide={closeDeleteModal}
          onConfirm={handleDelete}
          itemName={deletingBusinessType?.name}
          itemType="business type"
          loading={deletingBusinessTypePending}
        />
      </div>
    </React.Fragment>
  );
};

export default BusinessTypes;
