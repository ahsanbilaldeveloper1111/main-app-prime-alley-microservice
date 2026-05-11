import type { IndustryData } from "@utils/crm";
import {
  getProductSubmitButtonLabel,
  normalizeIndustryId,
  PRODUCT_SIDEBAR_SELECT_STYLES,
  type ProductDisplayData,
  type ProductFormData,
} from "@page-modules/crm/products/productsPageModel";
import { Check, X } from "lucide-react";
import {
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import { Col, Form, Row } from "react-bootstrap";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";

function ProductsFormSidebar({
  editingProduct,
  submittingProduct,
  productFormData,
  setProductFormData,
  industries,
  loadingIndustries,
  uniqueCategories,
  onOverlayClick,
  onClose,
  onSubmit,
}: Readonly<{
  editingProduct: ProductDisplayData | null;
  submittingProduct: boolean;
  productFormData: ProductFormData;
  setProductFormData: Dispatch<SetStateAction<ProductFormData>>;
  industries: IndustryData[];
  loadingIndustries: boolean;
  uniqueCategories: string[];
  onOverlayClick: () => void;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
}>) {
  const submitLabel = getProductSubmitButtonLabel(
    submittingProduct,
    Boolean(editingProduct),
  );

  return (
    <>
      <div
        className="products-sidebar-overlay"
        onClick={onOverlayClick}
        aria-hidden="true"
      />

      <div className="products-sidebar">
        <div className="products-sidebar-header">
          <h2 className="products-sidebar-title">
            {editingProduct ? "Edit Product" : "Add New Product"}
          </h2>
          <button
            type="button"
            className="products-sidebar-close"
            onClick={onClose}
            disabled={submittingProduct}
            aria-label="Close product form sidebar"
          >
            <X size={24} />
          </button>
        </div>

        <Form onSubmit={onSubmit} className="products-sidebar-form">
          <div className="products-sidebar-content">
            <Row>
              <Col md={12}>
                <div className="products-sidebar-field">
                  <label htmlFor="product-name-input" className="products-sidebar-label">
                    Product Name <span className="products-sidebar-required">*</span>
                  </label>
                  <input
                    id="product-name-input"
                    type="text"
                    value={productFormData.productName}
                    onChange={(e) =>
                      setProductFormData({
                        ...productFormData,
                        productName: e.target.value,
                      })
                    }
                    placeholder="Enter product name"
                    required
                    className="products-sidebar-input"
                  />
                </div>
              </Col>
              <Col md={12}>
                <div className="products-sidebar-field">
                  <label htmlFor="product-sku-input" className="products-sidebar-label">
                    SKU <span className="products-sidebar-required">*</span>
                  </label>
                  <input
                    id="product-sku-input"
                    type="text"
                    value={productFormData.sku}
                    onChange={(e) =>
                      setProductFormData({
                        ...productFormData,
                        sku: e.target.value,
                      })
                    }
                    placeholder="Enter SKU"
                    required
                    disabled={Boolean(editingProduct) || submittingProduct}
                    className={`products-sidebar-input ${editingProduct ? "products-sidebar-input--readonly" : ""}`}
                  />
                </div>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <div className="products-sidebar-field">
                  <label htmlFor="product-price-input" className="products-sidebar-label">
                    Price <span className="products-sidebar-required">*</span>
                  </label>
                  <input
                    id="product-price-input"
                    type="number"
                    step="0.01"
                    value={productFormData.price}
                    onChange={(e) =>
                      setProductFormData({
                        ...productFormData,
                        price: e.target.value,
                      })
                    }
                    placeholder="0.00"
                    required
                    className="products-sidebar-input"
                  />
                </div>
              </Col>
              <Col md={12}>
                <div className="products-sidebar-field">
                  <label htmlFor="product-currency-select" className="products-sidebar-label">
                    Currency
                  </label>
                  <select
                    id="product-currency-select"
                    value={productFormData.currency}
                    onChange={(e) =>
                      setProductFormData({
                        ...productFormData,
                        currency: e.target.value,
                      })
                    }
                    className="products-sidebar-input"
                  >
                    <option value="AED">AED</option>
                  </select>
                </div>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <div className="products-sidebar-field">
                  <label htmlFor="product-industry-select" className="products-sidebar-label">
                    Product Group <span className="products-sidebar-required">*</span>
                  </label>
                  <Select
                    inputId="product-industry-select"
                    options={industries.map((ind) => ({
                      value: ind.id,
                      label: ind.name,
                    }))}
                    value={
                      productFormData.industry_id
                        ? {
                            value: productFormData.industry_id,
                            label:
                              industries.find(
                                (ind) =>
                                  ind.id ===
                                  Number(productFormData.industry_id),
                              )?.name || "",
                          }
                        : null
                    }
                    onChange={(selected) =>
                      setProductFormData({
                        ...productFormData,
                        industry_id: selected
                          ? normalizeIndustryId(selected.value)
                          : null,
                      })
                    }
                    placeholder="Select product group..."
                    styles={PRODUCT_SIDEBAR_SELECT_STYLES}
                    isLoading={loadingIndustries}
                    isDisabled={loadingIndustries || submittingProduct}
                    isClearable
                  />
                </div>
              </Col>
              <Col md={12}>
                <div className="products-sidebar-field">
                  <label htmlFor="product-category-select" className="products-sidebar-label">
                    Category
                  </label>
                  <CreatableSelect
                    inputId="product-category-select"
                    options={uniqueCategories.map((cat) => ({
                      value: cat,
                      label: cat,
                    }))}
                    value={
                      productFormData.category
                        ? {
                            value: productFormData.category,
                            label: productFormData.category,
                          }
                        : null
                    }
                    onChange={(selected) =>
                      setProductFormData({
                        ...productFormData,
                        category: selected ? String(selected.value) : "",
                      })
                    }
                    placeholder="Select or create category..."
                    styles={PRODUCT_SIDEBAR_SELECT_STYLES}
                    isDisabled={submittingProduct}
                    isClearable
                  />
                </div>
              </Col>
              <Col md={12}>
                <div className="products-sidebar-field">
                  <label htmlFor="product-brand-input" className="products-sidebar-label">
                    Brand
                  </label>
                  <input
                    id="product-brand-input"
                    type="text"
                    value={productFormData.brand}
                    onChange={(e) =>
                      setProductFormData({
                        ...productFormData,
                        brand: e.target.value,
                      })
                    }
                    placeholder="Enter brand name"
                    className="products-sidebar-input"
                  />
                </div>
              </Col>
            </Row>

            <div className="products-sidebar-field">
              <label htmlFor="product-description-input" className="products-sidebar-label">
                Description
              </label>
              <textarea
                id="product-description-input"
                rows={3}
                value={productFormData.description}
                onChange={(e) =>
                  setProductFormData({
                    ...productFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Enter product description"
                className="products-sidebar-textarea"
              />
            </div>

            <div className="products-sidebar-switch-wrap">
              <Form.Check
                type="switch"
                id="product-active-switch-sidebar"
                label="Product Active"
                checked={productFormData.isActive}
                onChange={(e) =>
                  setProductFormData({
                    ...productFormData,
                    isActive: e.target.checked,
                  })
                }
                className="products-sidebar-switch"
              />
            </div>
          </div>

          <div className="products-sidebar-footer">
            <button
              type="submit"
              disabled={submittingProduct}
              className="products-sidebar-submit"
            >
              <Check size={16} aria-hidden />
              {submitLabel}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submittingProduct}
              className="products-sidebar-cancel"
            >
              Cancel
            </button>
          </div>
        </Form>
      </div>
    </>
  );
}

export default ProductsFormSidebar;
