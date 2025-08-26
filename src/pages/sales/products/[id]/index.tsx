import React, { ReactElement, useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  Card,
  CardBody,
  Col,
  Row,
  Table,
  Badge,
  Button,
  Alert,
  Spinner,
  Modal,
  Form,
} from "react-bootstrap";
import Link from "next/link";
import { FiEdit, FiTrash2, FiPlus, FiPackage, FiDollarSign, FiTrendingUp } from "react-icons/fi";
import { 
  getProduct, 
  deleteProduct, 
  createProductVariant, 
  updateProductVariant, 
  deleteProductVariant,
  ProductData, 
  ProductVariantData 
} from "@utils/sales";
import { toast } from "react-toastify";

const ProductView: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariantData | null>(null);
  const [variantFormData, setVariantFormData] = useState({
    variant_name: "",
    variant_value: "",
    price_adjustment: 0,
    buy_cost_adjustment: 0,
    available_quantity: 0,
    sku: "",
    active: true,
  });

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const productData = await getProduct(Number(id));
      setProduct(productData);
    } catch (error) {
      console.error("Failed to load product:", error);
      toast.error("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!product) return;
    
    if (confirm(`Are you sure you want to delete product "${product.name}"? This action cannot be undone.`)) {
      try {
        await deleteProduct(product.id);
        toast.success("Product deleted successfully");
        router.push("/sales/products");
      } catch (error) {
        console.error("Failed to delete product:", error);
      }
    }
  };

  const handleVariantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingVariant) {
        await updateProductVariant(editingVariant.id, variantFormData);
        toast.success("Variant updated successfully");
      } else {
        await createProductVariant({
          ...variantFormData,
          product_id: Number(id),
        });
        toast.success("Variant created successfully");
      }
      
      setShowVariantModal(false);
      setEditingVariant(null);
      resetVariantForm();
      loadProduct(); // Reload to get updated variants
    } catch (error) {
      console.error("Failed to save variant:", error);
    }
  };

  const handleEditVariant = (variant: ProductVariantData) => {
    setEditingVariant(variant);
    setVariantFormData({
      variant_name: variant.variant_name,
      variant_value: variant.variant_value,
      price_adjustment: variant.price_adjustment || 0,
      buy_cost_adjustment: variant.buy_cost_adjustment || 0,
      available_quantity: variant.available_quantity,
      sku: variant.sku,
      active: variant.active,
    });
    setShowVariantModal(true);
  };

  const handleDeleteVariant = async (variant: ProductVariantData) => {
    if (confirm(`Are you sure you want to delete variant "${variant.variant_name}: ${variant.variant_value}"?`)) {
      try {
        await deleteProductVariant(variant.id);
        toast.success("Variant deleted successfully");
        loadProduct();
      } catch (error) {
        console.error("Failed to delete variant:", error);
      }
    }
  };

  const resetVariantForm = () => {
    setVariantFormData({
      variant_name: "",
      variant_value: "",
      price_adjustment: 0,
      buy_cost_adjustment: 0,
      available_quantity: 0,
      sku: "",
      active: true,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="container-fluid">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
            <Spinner color="primary" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page-content">
        <div className="container-fluid">
          <Alert color="danger">Product not found</Alert>
        </div>
      </div>
    );
  }

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Sales"
        mainLink="/sales"
        subTitle="Products"
        subLink="/sales/products"
        currentTitle={product.name}
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0">{product.name}</h2>
            <p className="text-muted mb-0">Product Details & Management</p>
          </div>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          {/* Product Information */}
          <Card className="border-0 shadow-sm mb-4">
            <CardBody className="p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="d-flex align-items-center">
                  <FiPackage size={20} className="me-2 text-primary" />
                  <h5 className="mb-0">Product Information</h5>
                </div>
                <div className="d-flex gap-2">
                  <Link href={`/sales/products/${product.id}/edit`}>
                    <Button variant="warning" size="sm">
                      <FiEdit size={16} className="me-2" />
                      Edit
                    </Button>
                  </Link>
                  <Button variant="danger" size="sm" onClick={handleDeleteProduct}>
                    <FiTrash2 size={16} className="me-2" />
                    Delete
                  </Button>
                </div>
              </div>

              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <label className="form-label fw-medium">SKU</label>
                    <p className="mb-0">{product.sku}</p>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-medium">Category</label>
                    <p className="mb-0">
                      {product.category ? (
                        <Badge bg="secondary">{product.category}</Badge>
                      ) : (
                        <span className="text-muted">Uncategorized</span>
                      )}
                    </p>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-medium">Brand</label>
                    <p className="mb-0">
                      {product.brand || <span className="text-muted">No brand</span>}
                    </p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <label className="form-label fw-medium">Price</label>
                    <p className="mb-0 text-success fw-bold fs-5">
                      {formatCurrency(product.price)}
                    </p>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-medium">Buy Cost</label>
                    <p className="mb-0">
                      {product.buy_cost ? formatCurrency(product.buy_cost) : <span className="text-muted">Not set</span>}
                    </p>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-medium">Available Quantity</label>
                    <p className="mb-0">
                      <Badge bg={product.available_quantity > 0 ? "success" : "danger"}>
                        {product.available_quantity}
                      </Badge>
                    </p>
                  </div>
                </Col>
              </Row>

              {product.description && (
                <div className="mb-3">
                  <label className="form-label fw-medium">Description</label>
                  <p className="mb-0 text-muted">{product.description}</p>
                </div>
              )}

              <div className="d-flex gap-2">
                <Badge bg={product.active ? "success" : "danger"}>
                  {product.active ? "Active" : "Inactive"}
                </Badge>
                {product.profit_margin && (
                  <Badge bg="info">
                    Profit: {product.profit_margin.toFixed(1)}%
                  </Badge>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Product Variants */}
          <Card className="border-0 shadow-sm">
            <CardBody className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Product Variants</h5>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setEditingVariant(null);
                    resetVariantForm();
                    setShowVariantModal(true);
                  }}
                >
                  <FiPlus size={16} className="me-2" />
                  Add Variant
                </Button>
              </div>

              {product.variants && product.variants.length > 0 ? (
                <div className="table-responsive">
                  <Table className="table-nowrap align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Variant</th>
                        <th>SKU</th>
                        <th>Price Adjustment</th>
                        <th>Quantity</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.variants.map((variant) => (
                        <tr key={variant.id}>
                          <td>
                            <div className="fw-medium">
                              {variant.variant_name}: {variant.variant_value}
                            </div>
                          </td>
                          <td>
                            <small className="text-muted">{variant.sku}</small>
                          </td>
                          <td>
                            <span className={variant.price_adjustment >= 0 ? "text-success" : "text-danger"}>
                              {variant.price_adjustment >= 0 ? "+" : ""}
                              {formatCurrency(variant.price_adjustment)}
                            </span>
                          </td>
                          <td>
                            <Badge bg={variant.available_quantity > 0 ? "success" : "danger"}>
                              {variant.available_quantity}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg={variant.active ? "success" : "danger"}>
                              {variant.active ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <Button
                                variant="outline-warning"
                                size="sm"
                                onClick={() => handleEditVariant(variant)}
                              >
                                <FiEdit size={14} />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDeleteVariant(variant)}
                              >
                                <FiTrash2 size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted mb-3">No variants created yet</p>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setEditingVariant(null);
                      resetVariantForm();
                      setShowVariantModal(true);
                    }}
                  >
                    <FiPlus className="me-2" />
                    Create First Variant
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>

        <Col lg={4}>
          {/* Quick Stats */}
          <Card className="border-0 shadow-sm mb-4">
            <CardBody className="p-4">
              <h5 className="mb-3">Quick Stats</h5>
              <div className="d-flex align-items-center mb-3">
                <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                  <FiPackage className="text-primary" size={20} />
                </div>
                <div>
                  <div className="fw-medium">Total Variants</div>
                  <div className="text-muted">{product.variants?.length || 0}</div>
                </div>
              </div>
              <div className="d-flex align-items-center mb-3">
                <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                  <FiDollarSign className="text-success" size={20} />
                </div>
                <div>
                  <div className="fw-medium">Total Value</div>
                  <div className="text-muted">
                    {formatCurrency((product.variants?.length || 0) * product.price)}
                  </div>
                </div>
              </div>
              <div className="d-flex align-items-center">
                <div className="bg-info bg-opacity-10 p-2 rounded me-3">
                  <FiTrendingUp className="text-info" size={20} />
                </div>
                <div>
                  <div className="fw-medium">Total Quantity</div>
                  <div className="text-muted">
                    {product.total_available_quantity || product.available_quantity}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Variant Modal */}
      <Modal show={showVariantModal} onHide={() => setShowVariantModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingVariant ? "Edit Product Variant" : "Create New Product Variant"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleVariantSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Variant Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={variantFormData.variant_name}
                    onChange={(e) =>
                      setVariantFormData((prev) => ({ ...prev, variant_name: e.target.value }))
                    }
                    placeholder="e.g., Size, Color, Material"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Variant Value *</Form.Label>
                  <Form.Control
                    type="text"
                    value={variantFormData.variant_value}
                    onChange={(e) =>
                      setVariantFormData((prev) => ({ ...prev, variant_value: e.target.value }))
                    }
                    placeholder="e.g., Large, Red, Cotton"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>SKU *</Form.Label>
                  <Form.Control
                    type="text"
                    value={variantFormData.sku}
                    onChange={(e) =>
                      setVariantFormData((prev) => ({ ...prev, sku: e.target.value }))
                    }
                    placeholder="Enter SKU"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Available Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={variantFormData.available_quantity}
                    onChange={(e) =>
                      setVariantFormData((prev) => ({ ...prev, available_quantity: Number(e.target.value) }))
                    }
                    placeholder="0"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Price Adjustment</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={variantFormData.price_adjustment}
                    onChange={(e) =>
                      setVariantFormData((prev) => ({ ...prev, price_adjustment: Number(e.target.value) }))
                    }
                    placeholder="0.00"
                  />
                  <small className="text-muted">
                    Positive for markup, negative for discount
                  </small>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Buy Cost Adjustment</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={variantFormData.buy_cost_adjustment}
                    onChange={(e) =>
                      setVariantFormData((prev) => ({ ...prev, buy_cost_adjustment: Number(e.target.value) }))
                    }
                    placeholder="0.00"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Active Variant"
                checked={variantFormData.active}
                onChange={(e) =>
                  setVariantFormData((prev) => ({ ...prev, active: e.target.checked }))
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowVariantModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleVariantSubmit}>
            {editingVariant ? "Update Variant" : "Create Variant"}
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
};

ProductView.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ProductView;
