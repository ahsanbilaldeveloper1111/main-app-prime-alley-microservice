import React, { useState, useEffect } from "react";
import Layout from "@layout/index";
import { useRouter } from "next/router";
import {
  Card,
  CardBody,
  Col,
  Row,
  Form,
  Button,
  Table,
  Badge,
  Alert,
  Spinner,
} from "react-bootstrap";
import Select from "react-select";
import {
  getOrder,
  updateOrder,
  listOrderStages,
  listProducts,
  OrderData,
  OrderStageData,
  ProductData,
  ProductVariantData,
  UpdateOrderRequest,
} from "../../../../utils/sales";
import { toast } from "react-toastify";
import Link from "next/link";
import {
  FiPackage,
  FiPlus,
  FiCalendar,
  FiUser,
  FiArrowLeft,
  FiSave,
  FiTrash2,
} from "react-icons/fi";

interface OrderItem {
  product_id: number;
  product_variant_id?: number;
  quantity: number;
  unit_price: number;
  product?: ProductData;
  variant?: ProductVariantData;
}

const EditOrder = () => {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [stages, setStages] = useState<OrderStageData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);

  // Form data
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_address: "",
    order_date: "",
    expected_delivery_date: "",
    order_stage_id: "",
    notes: "",
    tax_amount: 0,
    discount_amount: 0,
  });

  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Add item form
  const [selectedProduct, setSelectedProduct] = useState<number | "">("");
  const [selectedVariant, setSelectedVariant] = useState<number | "">("");
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);

  useEffect(() => {
    if (id) {
      loadOrder();
      loadStages();
      loadProducts();
    }
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const orderData = await getOrder(Number(id));
      setOrder(orderData);

      // Populate form data
      setFormData({
        customer_name: orderData.customer_name,
        customer_email: orderData.customer_email || "",
        customer_phone: orderData.customer_phone || "",
        customer_address: orderData.customer_address || "",
        order_date: orderData.order_date.split("T")[0],
        expected_delivery_date: orderData.expected_delivery_date
          ? orderData.expected_delivery_date.split("T")[0]
          : "",
        order_stage_id: orderData.order_stage_id?.toString() || "",
        notes: orderData.notes || "",
        tax_amount: orderData.tax_amount,
        discount_amount: orderData.discount_amount,
      });

      // Populate order items
      if (orderData.items) {
        setOrderItems(
          orderData.items.map((item: any) => ({
            product_id: item.product_id,
            product_variant_id: item.product_variant_id || undefined,
            quantity: item.quantity,
            unit_price: item.unit_price,
            product: item.product,
            variant: item.variant,
            product_name: item.product_name,
            ...item,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to load order:", error);
      toast.error("Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  const loadStages = async () => {
    try {
      const stagesData = await listOrderStages();
      setStages(stagesData);
    } catch (error) {
      console.error("Failed to load stages:", error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await listProducts({ active: true });
      setProducts(response.data);
    } catch (error) {
      console.error("Failed to load products:", error);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleProductChange = (productId: number) => {
    setSelectedProduct(productId);
    setSelectedVariant("");
    setUnitPrice(0);

    const product = products.find((p) => p.id === productId);
    if (product) {
      setUnitPrice(product.price);
    }
  };

  const handleVariantChange = (variantId: number) => {
    setSelectedVariant(variantId);

    const product = products.find((p) => p.id === selectedProduct);
    if (product) {
      const variant = product.variants?.find((v) => v.id === variantId);
      if (variant) {
        setUnitPrice(
          (typeof variant?.price_adjustment === "string"
            ? parseFloat(variant?.price_adjustment)
            : variant?.price_adjustment) || 0
        );
      }
    }
  };

  const addOrderItem = () => {
    if (!selectedProduct || quantity <= 0 || unitPrice <= 0) {
      toast.error("Please fill in all required fields for the order item");
      return;
    }

    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;

    const variant = selectedVariant
      ? product.variants?.find((v) => v.id === selectedVariant)
      : undefined;

    const newItem: OrderItem = {
      product_id: selectedProduct,
      product_variant_id: selectedVariant || undefined,
      quantity,
      unit_price: unitPrice,
      product,
      variant,
    };

    setOrderItems((prev) => [...prev, newItem]);

    // Reset form
    setSelectedProduct("");
    setSelectedVariant("");
    setQuantity(1);
    setUnitPrice(0);
  };

  const removeOrderItem = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateOrderItem = (
    index: number,
    field: keyof OrderItem,
    value: any
  ) => {
    setOrderItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const calculateSubtotal = () => {
    return orderItems.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = formData.tax_amount || 0;
    const discount = formData.discount_amount || 0;
    return subtotal + tax - discount;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = "Customer name is required";
    }

    if (!formData.order_stage_id) {
      newErrors.order_stage_id = "Order stage is required";
    }

    if (orderItems.length === 0) {
      newErrors.items = "At least one order item is required";
    }

    if (
      formData.customer_email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)
    ) {
      newErrors.customer_email = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const orderData: UpdateOrderRequest = {
        id: Number(id),
        customer_name: formData.customer_name,
        customer_email: formData.customer_email || undefined,
        customer_phone: formData.customer_phone || undefined,
        customer_address: formData.customer_address || undefined,
        order_date: formData.order_date,
        expected_delivery_date: formData.expected_delivery_date || undefined,
        order_stage_id: parseInt(formData.order_stage_id),
        notes: formData.notes || undefined,
        items: orderItems.map((item) => ({
          product_variant_id: item.product_variant_id,
          ...item,
        })),
      };

      await updateOrder(Number(id), orderData);
      toast.success("Order updated successfully!");
      router.push(`/sales/orders/${id}`);
    } catch (error) {
      console.error("Failed to update order:", error);
    } finally {
      setSaving(false);
    }
  };

  const getSelectedProduct = () => {
    return products.find((p) => p.id === selectedProduct);
  };

  const getSelectedProductVariants = () => {
    const product = getSelectedProduct();
    return product?.variants || [];
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="container-fluid">
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ minHeight: "400px" }}
          >
            <Spinner color="primary" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page-content">
        <div className="container-fluid">
          <Alert color="danger">Order not found</Alert>
        </div>
      </div>
    );
  }

  if (!order.can_be_edited) {
    return (
      <div className="page-content">
        <div className="container-fluid">
          <Alert color="warning">
            <div className="d-flex align-items-center">
              <div>
                <h5 className="mb-1">Order Cannot Be Edited</h5>
                <p className="mb-0">
                  This order has been completed and cannot be modified.
                </p>
              </div>
            </div>
          </Alert>
          <div className="mt-3">
            <Link href={`/sales/orders/${order.id}`}>
              <Button color="secondary">Back to Order</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="page-title-box d-flex align-items-center justify-content-between">
              <h4 className="mb-0">Edit Order #{order.order_number}</h4>
              <div className="page-title-right">
                <ol className="breadcrumb m-0">
                  <li className="breadcrumb-item">
                    <Link href="/dashboard">Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link href="/sales">Sales</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link href="/sales/orders">Orders</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link href={`/sales/orders/${order.id}`}>
                      {order.order_number}
                    </Link>
                  </li>
                  <li className="breadcrumb-item active">Edit</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <Form onSubmit={handleSubmit}>
          <Row>
            {/* Customer Information */}
            <Col lg={6}>
              <Card className="border-0 shadow-sm">
                <CardBody className="p-4">
                  <div className="d-flex align-items-center mb-3">
                    <FiUser size={20} className="me-2 text-primary" />
                    <h5 className="mb-0">Customer Information</h5>
                  </div>

                  <Form.Group>
                    <Form.Label>Customer Name *</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.customer_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInputChange("customer_name", e.target.value)
                      }
                      isInvalid={!!errors.customer_name}
                    />
                    {errors.customer_name && (
                      <Form.Control.Feedback type="invalid">
                        {errors.customer_name}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                          type="email"
                          value={formData.customer_email}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleInputChange("customer_email", e.target.value)
                          }
                          isInvalid={!!errors.customer_email}
                        />
                        {errors.customer_email && (
                          <Form.Control.Feedback type="invalid">
                            {errors.customer_email}
                          </Form.Control.Feedback>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Phone</Form.Label>
                        <Form.Control
                          type="tel"
                          value={formData.customer_phone}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleInputChange("customer_phone", e.target.value)
                          }
                          isInvalid={!!errors.customer_phone}
                        />
                        {errors.customer_phone && (
                          <Form.Control.Feedback type="invalid">
                            {errors.customer_phone}
                          </Form.Control.Feedback>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group>
                    <Form.Label>Address</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={formData.customer_address}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        handleInputChange("customer_address", e.target.value)
                      }
                      isInvalid={!!errors.customer_address}
                    />
                    {errors.customer_address && (
                      <Form.Control.Feedback type="invalid">
                        {errors.customer_address}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                </CardBody>
              </Card>
            </Col>

            {/* Order Details */}
            <Col lg={6}>
              <Card className="border-0 shadow-sm">
                <CardBody className="p-4">
                  <div className="d-flex align-items-center mb-3">
                    <FiCalendar size={20} className="me-2 text-primary" />
                    <h5 className="mb-0">Order Details</h5>
                  </div>

                  <Row>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Order Date *</Form.Label>
                        <Form.Control
                          type="date"
                          value={formData.order_date}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleInputChange("order_date", e.target.value)
                          }
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Expected Delivery</Form.Label>
                        <Form.Control
                          type="date"
                          value={formData.expected_delivery_date}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleInputChange(
                              "expected_delivery_date",
                              e.target.value
                            )
                          }
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group>
                    <Form.Label>Order Stage *</Form.Label>
                    <Select
                      options={stages.map((stage) => ({
                        value: stage.id.toString(),
                        label: stage.name,
                      }))}
                      value={
                        formData.order_stage_id
                          ? {
                              value: formData.order_stage_id,
                              label:
                                stages.find(
                                  (s) =>
                                    s.id.toString() === formData.order_stage_id
                                )?.name || "",
                            }
                          : null
                      }
                      onChange={(selectedOption) =>
                        handleInputChange(
                          "order_stage_id",
                          selectedOption?.value || ""
                        )
                      }
                      placeholder="Select Stage"
                      isClearable
                      className={errors.order_stage_id ? "is-invalid" : ""}
                      classNamePrefix="react-select"
                    />
                    {errors.order_stage_id && (
                      <div className="invalid-feedback d-block">
                        {errors.order_stage_id}
                      </div>
                    )}
                  </Form.Group>

                  <Form.Group>
                    <Form.Label>Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={formData.notes}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        handleInputChange("notes", e.target.value)
                      }
                    />
                  </Form.Group>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* Order Items */}
          <Row className="mt-4">
            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <CardBody className="p-4">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center">
                      <FiPackage size={20} className="me-2 text-primary" />
                      <h5 className="mb-0">Order Items</h5>
                    </div>
                    {errors.items && (
                      <Alert color="danger" className="mb-0">
                        {errors.items}
                      </Alert>
                    )}
                  </div>

                  {/* Add Item Form */}
                  <Row className="mb-4">
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Product *</Form.Label>
                        <Select
                          options={products.map((product) => ({
                            value: product.id,
                            label: `${product.name} - $${product.price}`,
                          }))}
                          value={
                            selectedProduct
                              ? {
                                  value: selectedProduct,
                                  label: getSelectedProduct()?.name || "",
                                }
                              : null
                          }
                          onChange={(selectedOption) =>
                            handleProductChange(
                              Number(selectedOption?.value || "")
                            )
                          }
                          placeholder="Select Product"
                          isClearable
                          classNamePrefix="react-select"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={2}>
                      <Form.Group>
                        <Form.Label>Variant</Form.Label>
                        <Select
                          options={getSelectedProductVariants().map(
                            (variant) => ({
                              value: variant.id,
                              label: `${variant.variant_name}: ${variant.variant_value}`,
                            })
                          )}
                          value={
                            selectedVariant
                              ? {
                                  value: selectedVariant,
                                  label:
                                    getSelectedProductVariants().find(
                                      (v) => v.id === selectedVariant
                                    )?.variant_name +
                                      ": " +
                                      getSelectedProductVariants().find(
                                        (v) => v.id === selectedVariant
                                      )?.variant_value || "",
                                }
                              : null
                          }
                          onChange={(selectedOption) =>
                            handleVariantChange(
                              Number(selectedOption?.value || "")
                            )
                          }
                          placeholder="No Variant"
                          isClearable
                          isDisabled={!selectedProduct}
                          classNamePrefix="react-select"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={2}>
                      <Form.Group>
                        <Form.Label>Quantity *</Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setQuantity(Number(e.target.value))
                          }
                        />
                      </Form.Group>
                    </Col>
                    <Col md={2}>
                      <Form.Group>
                        <Form.Label>Unit Price *</Form.Label>
                        <Form.Control
                          type="number"
                          min="0"
                          step="0.01"
                          value={unitPrice}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setUnitPrice(Number(e.target.value))
                          }
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>&nbsp;</Form.Label>
                        <div className="d-grid">
                          <Button
                            color="success"
                            onClick={addOrderItem}
                            disabled={
                              !selectedProduct ||
                              quantity <= 0 ||
                              unitPrice <= 0
                            }
                          >
                            <FiPlus size={16} className="me-2" />
                            Add Item
                          </Button>
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Order Items Table */}
                  {orderItems.length > 0 && (
                    <div className="table-responsive">
                      <Table className="table-nowrap align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Product</th>
                            <th>Variant</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderItems.map((item, index) => (
                            <tr key={index}>
                              <td>
                                <div className="fw-medium">
                                  {item.product?.name}
                                </div>
                                <small className="text-muted">
                                  SKU: {item.product?.sku}
                                </small>
                              </td>
                              <td>
                                {item.variant ? (
                                  <Badge color="info">
                                    {item.variant.variant_name}:{" "}
                                    {item.variant.variant_value}
                                  </Badge>
                                ) : (
                                  <span className="text-muted">No variant</span>
                                )}
                              </td>
                              <td>
                                <Form.Control
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>
                                  ) =>
                                    updateOrderItem(
                                      index,
                                      "quantity",
                                      Number(e.target.value)
                                    )
                                  }
                                  style={{ width: "80px" }}
                                />
                              </td>
                              <td>
                                <Form.Control
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.unit_price}
                                  onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>
                                  ) =>
                                    updateOrderItem(
                                      index,
                                      "unit_price",
                                      Number(e.target.value)
                                    )
                                  }
                                  style={{ width: "100px" }}
                                />
                              </td>
                              <td>
                                <span className="fw-medium">
                                  $
                                  {(item.quantity * item.unit_price).toFixed(2)}
                                </span>
                              </td>
                              <td>
                                <Button
                                  color="danger"
                                  size="sm"
                                  onClick={() => removeOrderItem(index)}
                                >
                                  <FiTrash2 size={14} />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}

                  {/* Order Summary */}
                  {orderItems.length > 0 && (
                    <Row className="mt-4">
                      <Col lg={6} className="ms-auto">
                        <Card className="border">
                          <CardBody>
                            <h6 className="mb-3">Order Summary</h6>
                            <div className="d-flex justify-content-between mb-2">
                              <span>Subtotal:</span>
                              <span>${calculateSubtotal().toFixed(2)}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                              <span>Tax:</span>
                              <Form.Control
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.tax_amount}
                                onChange={(
                                  e: React.ChangeEvent<HTMLInputElement>
                                ) =>
                                  handleInputChange(
                                    "tax_amount",
                                    Number(e.target.value)
                                  )
                                }
                                style={{ width: "100px" }}
                              />
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                              <span>Discount:</span>
                              <Form.Control
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.discount_amount}
                                onChange={(
                                  e: React.ChangeEvent<HTMLInputElement>
                                ) =>
                                  handleInputChange(
                                    "discount_amount",
                                    Number(e.target.value)
                                  )
                                }
                                style={{ width: "100px" }}
                              />
                            </div>
                            <hr />
                            <div className="d-flex justify-content-between fw-bold">
                              <span>Total:</span>
                              <span>${calculateTotal().toFixed(2)}</span>
                            </div>
                          </CardBody>
                        </Card>
                      </Col>
                    </Row>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* Action Buttons */}
          <Row className="mt-4">
            <Col lg={12}>
              <div className="d-flex justify-content-between">
                <Link href={`/sales/orders/${order.id}`}>
                  <Button color="secondary">
                    <FiArrowLeft size={16} className="me-2" />
                    Back to Order
                  </Button>
                </Link>
                <div>
                  <Button
                    type="submit"
                    color="primary"
                    disabled={saving || orderItems.length === 0}
                  >
                    {saving ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FiSave size={16} className="me-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  );
};

EditOrder.getLayout = (page: React.ReactNode) => <Layout>{page}</Layout>;

export default EditOrder;
