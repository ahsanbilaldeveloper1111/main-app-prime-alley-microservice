import "@assets/scss/datatable-style.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable from "@components/GenericTable";
import { Button, Form, Modal, Spinner } from "react-bootstrap";
import { AlertCircle, Check } from "lucide-react";
import "@assets/scss/common.scss";
import DeleteConfirmationModal from "@components/page-partials/DeleteConfirmationModal";
import {
  CRM_DIALOG_FOOTER_ACTIONS_ROW_STYLE,
  CRM_DIALOG_PRIMARY_BUTTON_STYLE,
  CRM_DIALOG_SECONDARY_BUTTON_STYLE,
} from "@components/crm/crmDialogActionButtonStyles";
import {
  DEFAULT_BUSINESS_TYPES_TABLE_COLUMNS,
  modalTitle,
  primarySubmitLabel,
  useBusinessTypesPage,
} from "@hooks/useBusinessTypesPage";
import type { CrmPageDisplayProps } from "@page-modules/crm/crmPageDisplayProps";
import type { BusinessTypeData } from "@utils/crm";

const BusinessTypes = ({ hideBreadcrumb }: CrmPageDisplayProps = {}) => {
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
        <BreadcrumbItem mainTitle="CRM" mainLink="/crm/dashboard" subTitle="Business Types" />
      )}
      <div>
        <GenericTable<BusinessTypeData>
          data={businessTypes}
          columns={businessTableColumns}
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

        <Modal
          show={showModal}
          onHide={() => {
            if (submitting) return;
            setShowModal(false);
          }}
          centered
        >
          <Modal.Header closeButton={!submitting}>
            <Modal.Title>{modalTitle(editingBusinessType)}</Modal.Title>
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter business type name"
                  required
                />
              </Form.Group>
              <Form.Group className="mb-0">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Enter business type description"
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer
              className="border-top"
              style={{ flexWrap: "wrap", gap: "12px", justifyContent: "space-between" }}
            >
              <Form.Text className="text-muted d-flex align-items-center gap-1 mb-0">
                <AlertCircle size={14} aria-hidden />
                <span style={{ fontSize: "0.813rem" }}>
                  Fields marked with <span className="text-danger fw-bold">*</span> are required
                </span>
              </Form.Text>
              <div style={CRM_DIALOG_FOOTER_ACTIONS_ROW_STYLE}>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={submitting}
                  style={{
                    ...CRM_DIALOG_PRIMARY_BUTTON_STYLE,
                    minWidth: "168px",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ width: 16, display: "inline-flex", justifyContent: "center" }}>
                    {submitting ? (
                      <Spinner size="sm" aria-hidden />
                    ) : (
                      <Check size={16} aria-hidden />
                    )}
                  </span>
                  {primarySubmitLabel(submitting, editingBusinessType)}
                </Button>
                <Button
                  variant="outline-secondary"
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  style={CRM_DIALOG_SECONDARY_BUTTON_STYLE}
                >
                  Cancel
                </Button>
              </div>
            </Modal.Footer>
          </Form>
        </Modal>

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

BusinessTypes.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default BusinessTypes;
