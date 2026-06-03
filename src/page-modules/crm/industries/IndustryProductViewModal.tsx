import React from "react";
import { Badge, Modal } from "react-bootstrap";
import {
  Building2,
  Calendar,
  Edit,
  FileText,
  Package,
  Tag,
  X,
} from "lucide-react";
import { CrmDescriptionDetailsBlock } from "@components/crm/crmTruncatedDescriptionCell";
import { MainSettingsFormSidebar } from "@components/main-settings/MainSettingsFormSidebar";
import { useCrmSettingsPrefersSidebar } from "@page-modules/crm/shared/CrmSettingsPanelShell";
import { formatDateForTable } from "@utils/Helper";
import type { CrmProduct, IndustryData } from "@utils/crm";

export interface IndustryProductViewModalProps {
  product: CrmProduct;
  industry: IndustryData | null;
  show: boolean;
  onHide: () => void;
  canEditProduct: boolean;
  onEditClick: () => void;
}

function formatProductPrice(price: string | null | undefined): string {
  return Number.parseFloat(price || "0").toFixed(2);
}

function IndustryProductViewFooter({
  canEditProduct,
  onEditClick,
  onHide,
}: Readonly<{
  canEditProduct: boolean;
  onEditClick: () => void;
  onHide: () => void;
}>) {
  return (
    <div className="w-100 d-flex justify-content-end industries-crm-dialog-footer">
      {canEditProduct && (
        <button type="button" className="industries-crm-btn-primary" onClick={onEditClick}>
          <Edit size={16} aria-hidden />
          Edit Product
        </button>
      )}
      <button type="button" className="industries-crm-btn-secondary" onClick={onHide}>
        Close
      </button>
    </div>
  );
}

function IndustryProductViewContent({
  product,
  industry,
}: Readonly<{
  product: CrmProduct;
  industry: IndustryData | null;
}>) {
  return (
    <>
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
            <div className="industries-product-view-tile-label">Product Group</div>
            <div className="industries-product-view-tile-value">
              <Badge
                bg="primary"
                className="bg-opacity-10 text-dark industries-product-view-badge"
              >
                <Building2 size={14} className="industries-product-view-inline-icon" />
                {industry.name}
              </Badge>
            </div>
          </div>
        )}
        <div className="industries-product-view-tile">
          <div className="industries-product-view-tile-label">SKU</div>
          <div className="industries-product-view-tile-value">
            <Badge bg="light" text="dark" className="font-monospace industries-product-view-badge">
              {product.sku}
            </Badge>
          </div>
        </div>
        <div className="industries-product-view-tile">
          <div className="industries-product-view-tile-label">Price</div>
          <div className="industries-product-view-tile-value industries-product-view-tile-value--price">
            {product.currency} {formatProductPrice(product.price)}
          </div>
        </div>
        <div className="industries-product-view-tile">
          <div className="industries-product-view-tile-label">Currency</div>
          <div className="industries-product-view-tile-value">{product.currency}</div>
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
            <Calendar size={14} className="industries-product-view-inline-icon" />
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
            <Badge bg="info" className="bg-opacity-10 text-dark industries-product-view-badge">
              {product.category || "N/A"}
            </Badge>
          </div>
        </div>
        <div className="industries-product-view-tile">
          <div className="industries-product-view-tile-label">Brand</div>
          <div className="industries-product-view-tile-value">
            <Building2 size={14} className="industries-product-view-inline-icon" />
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
    </>
  );
}

/** Read-only product details (sidebar in Main Settings). */
export function IndustryProductViewModal({
  product,
  industry,
  show,
  onHide,
  canEditProduct,
  onEditClick,
}: Readonly<IndustryProductViewModalProps>) {
  const preferSidebar = useCrmSettingsPrefersSidebar();
  const footer = (
    <IndustryProductViewFooter
      canEditProduct={canEditProduct}
      onEditClick={onEditClick}
      onHide={onHide}
    />
  );
  const content = <IndustryProductViewContent product={product} industry={industry} />;

  if (preferSidebar) {
    return (
      <MainSettingsFormSidebar
        show={show}
        onHide={onHide}
        title={product.name}
        footer={footer}
      >
        <p className="text-muted small mb-3">Product Details</p>
        {content}
      </MainSettingsFormSidebar>
    );
  }

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

      <Modal.Body className="industries-product-view-body border-0 pt-0">{content}</Modal.Body>
      <Modal.Footer className="border-0 industries-product-view-footer">{footer}</Modal.Footer>
    </Modal>
  );
}
