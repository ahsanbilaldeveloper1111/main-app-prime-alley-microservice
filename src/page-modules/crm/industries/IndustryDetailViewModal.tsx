import React from "react";
import { Form, Modal } from "react-bootstrap";
import { Edit } from "lucide-react";
import { CrmDescriptionDetailsBlock } from "@components/crm/crmTruncatedDescriptionCell";
import { MainSettingsFormSidebar } from "@components/main-settings/MainSettingsFormSidebar";
import { useCrmSettingsPrefersSidebar } from "@page-modules/crm/shared/CrmSettingsPanelShell";
import type { CrmProduct, IndustryData } from "@utils/crm";
import { IndustryProductsSection } from "@page-modules/crm/industries/IndustryProductsSection";

export interface IndustryDetailViewModalProps {
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
}

function IndustryDetailFooter({
  canEditIndustry,
  onEditIndustryClick,
  onHide,
}: Readonly<{
  canEditIndustry: boolean;
  onEditIndustryClick: () => void;
  onHide: () => void;
}>) {
  return (
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
      <button type="button" className="industries-crm-btn-secondary" onClick={onHide}>
        Close
      </button>
    </div>
  );
}

function IndustryDetailContent({
  industry,
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
  industry: IndustryData;
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
    <>
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
    </>
  );
}

/** Read-only details for an industry/product group (sidebar in Main Settings). */
export function IndustryDetailViewModal({
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
}: Readonly<IndustryDetailViewModalProps>) {
  const preferSidebar = useCrmSettingsPrefersSidebar();
  const footer = (
    <IndustryDetailFooter
      canEditIndustry={canEditIndustry}
      onEditIndustryClick={onEditIndustryClick}
      onHide={onHide}
    />
  );
  const content = (
    <IndustryDetailContent
      industry={industry}
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
  );

  if (preferSidebar) {
    return (
      <MainSettingsFormSidebar
        show={show}
        onHide={onHide}
        title="Product Group Details"
        footer={footer}
      >
        {content}
      </MainSettingsFormSidebar>
    );
  }

  return (
    <Modal size="xl" show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Product Group Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>{content}</Modal.Body>
      <Modal.Footer className="border-0 pt-0">{footer}</Modal.Footer>
    </Modal>
  );
}
