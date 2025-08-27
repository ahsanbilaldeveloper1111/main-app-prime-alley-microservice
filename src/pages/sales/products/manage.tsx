import React, { ReactElement, useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  Card,
  CardBody,
  Col,
  Row,
  Form,
  Button,
  Alert,
  Table,
  Badge,
  Modal,
} from "react-bootstrap";
import Link from "next/link";
import {
  FiArrowLeft,
  FiSave,
  FiPackage,
  FiPlus,
  FiEdit,
  FiTrash2,
} from "react-icons/fi";
import {
  createProduct,
  updateProduct,
  getProduct,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  ProductData,
  ProductVariantData,
} from "@utils/sales";
import { toast } from "react-toastify";

const ManageProduct: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [editingVariant, setEditingVariant] =
    useState<ProductVariantData | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    price: 0,
    buy_cost: 0,
    available_quantity: 0,
    category: "",
    brand: "",
    active: true,
  });

  const [variants, setVariants] = useState<ProductVariantData[]>([]);
  const [variantForm, setVariantForm] = useState({
    variant_name: "",
    variant_value: "",
    sku: "",
    price_adjustment: 0,
    buy_cost_adjustment: 0,
    available_quantity: 0,
    active: true,
  });

  useEffect(() => {
    if (isEditMode && id) {
      loadProduct(Number(id));
    }
  }, [id, isEditMode]);

  const loadProduct = async (productId: number) => {
    try {
      setLoading(true);
      const product = await getProduct(productId);
      setFormData({
        name: product.name,
        description: product.description || "",
        sku: product.sku,
        price: product.price,
        buy_cost: product.buy_cost,
        available_quantity: product.available_quantity,
        category: product.category || "",
        brand: product.brand || "",
        active: product.active,
      });
      setVariants(product.variants || []);
    } catch (error) {
      console.error("Failed to load product:", error);
      toast.error("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: string,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    }

    if (!formData.sku.trim()) {
      newErrors.sku = "SKU is required";
    }

    if (formData.price <= 0) {
      newErrors.price = "Price must be greater than 0";
    }

    if (formData.available_quantity < 0) {
      newErrors.available_quantity = "Available quantity cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (isEditMode) {
        await updateProduct(Number(id), formData);
        toast.success("Product updated successfully!");
      } else {
        await createProduct(formData);
        toast.success("Product created successfully!");
      }
      router.push("/sales/products");
    } catch (error) {
      console.error("Failed to save product:", error);
    } finally {
      setLoading(false);
    }
  };

  // Variant management
  const handleVariantInputChange = (
    field: string,
    value: string | number | boolean
  ) => {
    setVariantForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateVariantForm = () => {
    if (!variantForm.variant_name.trim()) {
      toast.error("Variant name is required");
      return false;
    }
    if (!variantForm.variant_value.trim()) {
      toast.error("Variant value is required");
      return false;
    }
    if (!variantForm.sku.trim()) {
      toast.error("Variant SKU is required");
      return false;
    }
    return true;
  };

  const handleVariantSubmit = async () => {
    if (!validateVariantForm()) return;

    try {
      if (editingVariant) {
        await updateProductVariant(editingVariant.id, variantForm);
        setVariants((prev) =>
          prev.map((v) =>
            v.id === editingVariant.id ? { ...v, ...variantForm } : v
          )
        );
        toast.success("Variant updated successfully!");
      } else {
        const newVariant = await createProductVariant({
          ...variantForm,
          product_id: Number(id),
        });
        setVariants((prev) => [...prev, newVariant]);
        toast.success("Variant created successfully!");
      }

      setShowVariantModal(false);
      setEditingVariant(null);
      resetVariantForm();
    } catch (error) {
      console.error("Failed to save variant:", error);
    }
  };

  const handleEditVariant = (variant: ProductVariantData) => {
    setEditingVariant(variant);
    setVariantForm({
      variant_name: variant.variant_name,
      variant_value: variant.variant_value,
      sku: variant.sku,
      price_adjustment:
        typeof variant.price_adjustment === "string"
          ? parseFloat(variant.price_adjustment)
          : variant.price_adjustment || 0,
      buy_cost_adjustment:
        typeof variant.buy_cost_adjustment === "string"
          ? parseFloat(variant.buy_cost_adjustment)
          : variant.buy_cost_adjustment || 0,
      available_quantity: variant.available_quantity || 0,
      active: variant.active,
    });
    setShowVariantModal(true);
  };

  const handleDeleteVariant = async (variantId: number) => {
    if (window.confirm("Are you sure you want to delete this variant?")) {
      try {
        await deleteProductVariant(variantId);
        setVariants((prev) => prev.filter((v) => v.id !== variantId));
        toast.success("Variant deleted successfully!");
      } catch (error) {
        console.error("Failed to delete variant:", error);
      }
    }
  };

  const resetVariantForm = () => {
    setVariantForm({
      variant_name: "",
      variant_value: "",
      sku: "",
      price_adjustment: 0,
      buy_cost_adjustment: 0,
      available_quantity: 0,
      active: true,
    });
  };

  const openNewVariantModal = () => {
    setEditingVariant(null);
    resetVariantForm();
    setShowVariantModal(true);
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Sales" mainLink="/sales" subTitle="Products" />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0">
              {isEditMode ? "Edit Product" : "Create New Product"}
            </h2>
            <p className="text-muted mb-0">
              {isEditMode
                ? "Update product information"
                : "Add a new product to your catalog"}
            </p>
          </div>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          <Card>
            <CardBody>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Product Name *</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        isInvalid={!!errors.name}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.name}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>SKU *</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.sku}
                        onChange={(e) =>
                          handleInputChange("sku", e.target.value)
                        }
                        isInvalid={!!errors.sku}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.sku}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Category</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.category}
                        onChange={(e) =>
                          handleInputChange("category", e.target.value)
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Brand</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.brand}
                        onChange={(e) =>
                          handleInputChange("brand", e.target.value)
                        }
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Price *</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) =>
                          handleInputChange(
                            "price",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        isInvalid={!!errors.price}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.price}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Buy Cost</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.buy_cost}
                        onChange={(e) =>
                          handleInputChange(
                            "buy_cost",
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Available Quantity</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        value={formData.available_quantity}
                        onChange={(e) =>
                          handleInputChange(
                            "available_quantity",
                            parseInt(e.target.value) || 0
                          )
                        }
                        isInvalid={!!errors.available_quantity}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.available_quantity}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Status</Form.Label>
                      <Form.Check
                        type="switch"
                        id="active-switch"
                        label="Active"
                        checked={formData.active}
                        onChange={(e) =>
                          handleInputChange("active", e.target.checked)
                        }
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                  />
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                    className="d-flex align-items-center gap-2"
                  >
                    <FiSave />
                    {loading
                      ? "Saving..."
                      : isEditMode
                      ? "Update Product"
                      : "Create Product"}
                  </Button>
                  <Link href="/sales/products">
                    <Button
                      variant="outline-secondary"
                      className="d-flex align-items-center gap-2"
                    >
                      <FiArrowLeft />
                      Back to Products
                    </Button>
                  </Link>
                </div>
              </Form>
            </CardBody>
          </Card>
        </Col>

        <Col lg={4}>
          <Card>
            <CardBody>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Product Variants</h5>
                {isEditMode && (
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={openNewVariantModal}
                    className="d-flex align-items-center gap-1"
                  >
                    <FiPlus />
                    Add Variant
                  </Button>
                )}
              </div>

              {isEditMode ? (
                variants.length > 0 ? (
                  <div className="variants-list">
                    {variants.map((variant) => (
                      <div
                        key={variant.id}
                        className="variant-item p-2 border rounded mb-2"
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <div className="fw-medium">
                              {variant.variant_name}: {variant.variant_value}
                            </div>
                            <small className="text-muted">
                              SKU: {variant.sku} | Price: $
                              {(typeof formData.price === "string"
                                ? parseFloat(formData.price)
                                : formData.price +
                                  ((typeof variant.price_adjustment === "string"
                                    ? parseFloat(variant.price_adjustment)
                                    : variant.price_adjustment) || 0)
                              ).toFixed(2)}{" "}
                              | Stock: {variant.available_quantity}
                            </small>
                          </div>
                          <div className="d-flex gap-1">
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => handleEditVariant(variant)}
                            >
                              <FiEdit />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => handleDeleteVariant(variant.id)}
                            >
                              <FiTrash2 />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted text-center py-3">
                    No variants added yet. Create variants to offer different
                    options for this product.
                  </p>
                )
              ) : (
                <Alert variant="info">
                  <FiPackage className="me-2" />
                  Variants can be added after the product is created.
                </Alert>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Variant Modal */}
      <Modal
        show={showVariantModal}
        onHide={() => setShowVariantModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editingVariant ? "Edit Variant" : "Add New Variant"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Variant Name *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., Color, Size, Material"
                  value={variantForm.variant_name}
                  onChange={(e) =>
                    handleVariantInputChange("variant_name", e.target.value)
                  }
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Variant Value *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., Red, Large, Cotton"
                  value={variantForm.variant_value}
                  onChange={(e) =>
                    handleVariantInputChange("variant_value", e.target.value)
                  }
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Variant SKU *</Form.Label>
                <Form.Control
                  type="text"
                  value={variantForm.sku}
                  onChange={(e) =>
                    handleVariantInputChange("sku", e.target.value)
                  }
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Price Adjustment</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  value={variantForm.price_adjustment}
                  onChange={(e) =>
                    handleVariantInputChange(
                      "price_adjustment",
                      parseFloat(e.target.value) || 0
                    )
                  }
                />
                <small className="text-muted">
                  Add or subtract from base price
                </small>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Cost Adjustment</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  value={variantForm.buy_cost_adjustment}
                  onChange={(e) =>
                    handleVariantInputChange(
                      "buy_cost_adjustment",
                      parseFloat(e.target.value) || 0
                    )
                  }
                />
                <small className="text-muted">
                  Add or subtract from base cost
                </small>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Stock Quantity</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  value={variantForm.available_quantity}
                  onChange={(e) =>
                    handleVariantInputChange(
                      "available_quantity",
                      parseInt(e.target.value) || 0
                    )
                  }
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Check
              type="switch"
              id="variant-active-switch"
              label="Active"
              checked={variantForm.active}
              onChange={(e) =>
                handleVariantInputChange("active", e.target.checked)
              }
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowVariantModal(false)}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleVariantSubmit}>
            {editingVariant ? "Update Variant" : "Add Variant"}
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
};

export default ManageProduct;
