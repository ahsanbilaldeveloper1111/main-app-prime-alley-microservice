import React, {
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import { Col, Form, Modal, Row, Spinner } from "react-bootstrap";
import { AlertCircle, Check } from "lucide-react";
import { MainSettingsFormSidebar } from "@components/main-settings/MainSettingsFormSidebar";
import { useMainSettingsFormSidebar } from "@components/main-settings/mainSettingsFormContext";
import type { CrmProduct } from "@utils/crm";
import type { ProductFormData } from "@page-modules/crm/industries/industriesPageModel";

export interface IndustryProductFormModalProps {
  show: boolean;
  onHide: () => void;
  productSubmitting: boolean;
  editingProduct: CrmProduct | null;
  productFormData: ProductFormData;
  setProductFormData: Dispatch<SetStateAction<ProductFormData>>;
  onSubmit: (e: FormEvent) => void;
}

function patchField<K extends keyof ProductFormData>(
  setProductFormData: Dispatch<SetStateAction<ProductFormData>>,
  field: K,
  value: ProductFormData[K],
): void {
  setProductFormData((prev) => ({ ...prev, [field]: value }));
}

function IndustryProductFormFooter({
  productSubmitting,
  editingProduct,
  onHide,
  formId,
}: Readonly<{
  productSubmitting: boolean;
  editingProduct: CrmProduct | null;
  onHide: () => void;
  formId?: string;
}>) {
  return (
    <div className="main-settings-form-sidebar-footer w-100">
      <Form.Text className="text-muted d-flex align-items-center gap-1 mb-0 min-w-0">
        <AlertCircle size={14} className="flex-shrink-0" />
        <span className="industries-form-hint-text">
          Fields marked with <span className="text-danger fw-bold">*</span> are required
        </span>
      </Form.Text>
      <div className="main-settings-form-sidebar-footer__actions industries-crm-dialog-footer">
        <button
          type="submit"
          form={formId}
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
  );
}

function IndustryProductFormModalFooter({
  productSubmitting,
  editingProduct,
  onHide,
}: Readonly<{
  productSubmitting: boolean;
  editingProduct: CrmProduct | null;
  onHide: () => void;
}>) {
  return (
    <div className="industries-modal-footer-hint-row w-100">
      <Form.Text className="text-muted d-flex align-items-center gap-1 mb-0 align-self-center min-w-0 flex-shrink-1 pe-2">
        <AlertCircle size={14} className="flex-shrink-0" />
        <span className="industries-form-hint-text">
          Fields marked with <span className="text-danger fw-bold">*</span> are required
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
  );
}

/** Create/edit form for a product belonging to a product group. */
export function IndustryProductFormModal({
  show,
  onHide,
  productSubmitting,
  editingProduct,
  productFormData,
  setProductFormData,
  onSubmit,
}: Readonly<IndustryProductFormModalProps>) {
  const preferSidebar = useMainSettingsFormSidebar();
  const formId = "industry-product-form";

  const handleHide = () => {
    if (productSubmitting) return;
    onHide();
  };

  const title = editingProduct ? "Edit Product" : "Add New Product";

  const formFields = (
    <>
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
                    patchField(setProductFormData, "productName", e.target.value)
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
                    patchField(setProductFormData, "sku", e.target.value)
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
                    patchField(setProductFormData, "price", e.target.value)
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
                    patchField(setProductFormData, "currency", e.target.value)
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
                    patchField(setProductFormData, "category", e.target.value)
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
                    patchField(setProductFormData, "brand", e.target.value)
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
                patchField(setProductFormData, "description", e.target.value)
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
                patchField(setProductFormData, "isActive", e.target.checked)
              }
            />
          </Form.Group>

    </>
  );

  if (preferSidebar) {
    return (
      <MainSettingsFormSidebar
        show={show}
        onHide={handleHide}
        title={title}
        disableClose={productSubmitting}
        footer={
          <IndustryProductFormFooter
            productSubmitting={productSubmitting}
            editingProduct={editingProduct}
            onHide={onHide}
            formId={formId}
          />
        }
      >
        <Form id={formId} onSubmit={onSubmit}>
          {formFields}
        </Form>
      </MainSettingsFormSidebar>
    );
  }

  return (
    <Modal show={show} onHide={handleHide} size="lg" centered>
      <Modal.Header closeButton={!productSubmitting}>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={onSubmit}>
          {formFields}
          <div className="mt-4">
            <IndustryProductFormModalFooter
              productSubmitting={productSubmitting}
              editingProduct={editingProduct}
              onHide={onHide}
            />
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
