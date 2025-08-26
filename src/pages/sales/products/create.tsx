import React, { ReactElement, useState } from "react";
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
} from "react-bootstrap";
import Link from "next/link";
import { FiArrowLeft, FiSave, FiPackage } from "react-icons/fi";
import { createProduct, ProductData } from "@utils/sales";
import { toast } from "react-toastify";

const CreateProduct: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
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
      await createProduct(formData);
      toast.success("Product created successfully!");
      router.push("/sales/products");
    } catch (error) {
      console.error("Failed to create product:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Sales"
        mainLink="/sales"
        subTitle="Products"
        subLink="/sales/products"
        currentTitle="Create"
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0">Create New Product</h2>
            <p className="text-muted mb-0">Add a new product to your catalog</p>
          </div>
        </Col>
      </Row>

      <Form onSubmit={handleSubmit}>
        <Row>
          {/* Basic Information */}
          <Col lg={8}>
            <Card className="border-0 shadow-sm">
              <CardBody className="p-4">
                <div className="d-flex align-items-center mb-3">
                  <FiPackage size={20} className="me-2 text-primary" />
                  <h5 className="mb-0">Product Information</h5>
                </div>

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
                        placeholder="Enter product name"
                      />
                      {errors.name && (
                        <Form.Control.Feedback type="invalid">
                          {errors.name}
                        </Form.Control.Feedback>
                      )}
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
                        placeholder="Enter SKU"
                      />
                      {errors.sku && (
                        <Form.Control.Feedback type="invalid">
                          {errors.sku}
                        </Form.Control.Feedback>
                      )}
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
                    placeholder="Enter product description"
                  />
                </Form.Group>

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
                        placeholder="Enter category"
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
                        placeholder="Enter brand"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>

          {/* Pricing & Inventory */}
          <Col lg={4}>
            <Card className="border-0 shadow-sm">
              <CardBody className="p-4">
                <h5 className="mb-3">Pricing & Inventory</h5>

                <Form.Group className="mb-3">
                  <Form.Label>Price *</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      handleInputChange("price", Number(e.target.value))
                    }
                    isInvalid={!!errors.price}
                    placeholder="0.00"
                  />
                  {errors.price && (
                    <Form.Control.Feedback type="invalid">
                      {errors.price}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Buy Cost</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.buy_cost}
                    onChange={(e) =>
                      handleInputChange("buy_cost", Number(e.target.value))
                    }
                    placeholder="0.00"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Available Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={formData.available_quantity}
                    onChange={(e) =>
                      handleInputChange("available_quantity", Number(e.target.value))
                    }
                    isInvalid={!!errors.available_quantity}
                    placeholder="0"
                  />
                  {errors.available_quantity && (
                    <Form.Control.Feedback type="invalid">
                      {errors.available_quantity}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Active Product"
                    checked={formData.active}
                    onChange={(e) =>
                      handleInputChange("active", e.target.checked)
                    }
                  />
                </Form.Group>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Action Buttons */}
        <Row className="mt-4">
          <Col lg={12}>
            <div className="d-flex justify-content-between">
              <Link href="/sales/products">
                <Button variant="secondary">
                  <FiArrowLeft size={16} className="me-2" />
                  Back to Products
                </Button>
              </Link>
              <div>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                >
                  {loading ? (
                    "Creating..."
                  ) : (
                    <>
                      <FiSave size={16} className="me-2" />
                      Create Product
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </Form>
    </React.Fragment>
  );
};

CreateProduct.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CreateProduct;
