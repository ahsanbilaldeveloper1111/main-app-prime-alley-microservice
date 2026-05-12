import React from "react";
import { Form, Modal } from "react-bootstrap";
import { Edit } from "lucide-react";
import {
  CrmDescriptionDetailsBlock,
} from "@components/crm/crmTruncatedDescriptionCell";
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

/** Read-only details modal for an industry/product group, including its products. */
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
