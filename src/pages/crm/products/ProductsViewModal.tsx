import { CrmDescriptionDetailsBlock } from "@components/crm/crmTruncatedDescriptionCell";
import type { ReactNode } from "react";
import type { IndustryData } from "@utils/crm";
import type { ProductDisplayData } from "@pages/crm/products/productsPageModel";
import {
  Building2,
  Calendar,
  Edit,
  FileText,
  Package,
  Tag,
  X,
} from "lucide-react";
import { Badge, Modal } from "react-bootstrap";

function ProductDetailTile({
  label,
  children,
}: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <section className="products-detail-card" aria-label={label}>
      <div className="products-detail-card-label">{label}</div>
      <div className="products-detail-card-value">{children}</div>
    </section>
  );
}

function ProductsViewModal({
  product,
  industries,
  show,
  onHide,
  canEditProduct,
  onEdit,
}: Readonly<{
  product: ProductDisplayData;
  industries: IndustryData[];
  show: boolean;
  onHide: () => void;
  canEditProduct: boolean;
  onEdit: () => void;
}>) {
  const industryLabel =
    product.industry?.name ??
    industries.find((ind) => ind.id === product.industry_id)?.name ??
    "N/A";

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <div className="products-view-header">
        <button
          type="button"
          className="products-view-close"
          onClick={onHide}
          aria-label="Close"
        >
          <X size={20} />
        </button>
        <h3 className="products-view-title">{product.productName}</h3>
        <p className="products-view-subtitle">Product Details</p>
      </div>

      <Modal.Body className="products-view-body border-0 pt-0">
        <div className="products-view-section-title">
          <Package size={18} className="products-view-section-icon" />
          Basic Information
        </div>
        <div className="products-view-grid">
          <ProductDetailTile label="Product Name">{product.productName}</ProductDetailTile>
          {(product.industry || product.industry_id) && (
            <ProductDetailTile label="Product Group">
              <Badge
                bg="primary"
                className="bg-opacity-10 text-dark products-view-badge"
              >
                <Building2 size={14} className="products-view-inline-icon" />
                {industryLabel}
              </Badge>
            </ProductDetailTile>
          )}
          <ProductDetailTile label="SKU">
            <Badge
              bg="light"
              text="dark"
              className="font-monospace products-view-badge"
            >
              {product.sku}
            </Badge>
          </ProductDetailTile>
          <ProductDetailTile label="Price">
            <div className="products-detail-card-price">
              {product.currency} {product.price.toFixed(2)}
            </div>
          </ProductDetailTile>
          <ProductDetailTile label="Currency">{product.currency}</ProductDetailTile>
          <ProductDetailTile label="Status">
            <Badge
              bg={product.status === "Active" ? "success" : "secondary"}
              className="products-view-badge--pill"
            >
              {product.status}
            </Badge>
          </ProductDetailTile>
          <ProductDetailTile label="Created Date">
            <Calendar size={14} className="products-view-inline-icon" />
            {product.created}
          </ProductDetailTile>
        </div>

        <div className="products-view-section-title">
          <Tag size={18} className="products-view-section-icon" />
          Product Details
        </div>
        <div className="products-view-grid">
          <ProductDetailTile label="Category">
            <Badge
              bg="info"
              className="bg-opacity-10 text-dark products-view-badge"
            >
              {product.category || "N/A"}
            </Badge>
          </ProductDetailTile>
          <ProductDetailTile label="Brand">
            <Building2 size={14} className="products-view-inline-icon" />
            {product.brand || "N/A"}
          </ProductDetailTile>
        </div>

        <div className="products-view-section-title">
          <FileText size={18} className="products-view-section-icon" />
          Description
        </div>
        <CrmDescriptionDetailsBlock
          text={product.description}
          emptyDisplay="No description available"
        />
      </Modal.Body>

      <Modal.Footer className="border-0 products-view-footer">
        <div className="w-100 d-flex justify-content-end products-crm-dialog-footer">
          {canEditProduct && (
            <button type="button" className="products-crm-btn-primary" onClick={onEdit}>
              <Edit size={16} aria-hidden />
              Edit Product
            </button>
          )}
          <button type="button" className="products-crm-btn-secondary" onClick={onHide}>
            Close
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}

export default ProductsViewModal;
