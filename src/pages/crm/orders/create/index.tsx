import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  createOrder,
  getStages,
  StageData,
  getOrder,
} from "@utils/crm";
import { listProducts } from "@utils/sales";
import { GetHierarchyData } from "@utils/users";
import { Button, Row, Col, Form, Card, Badge, Table } from "react-bootstrap";
import Select from "react-select";
import { CheckCircle, ChevronLeft, ChevronRight, ArrowLeft, Plus, X, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import { ModuleSlug } from '@utils/Helper';

interface OrderItem {
  id?: number;
  product_id: string;
  product_name: string;
  quantity: string;
  unit_price: number;
  total_price: string;
  description?: string;
  original_currency?: string;
  original_price?: string;
}

const CreateOrder = () => {
  const router = useRouter();
  const { deal_id } = router.query;
  const { data: session } = useSession();
  const [formStep, setFormStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stages, setStages] = useState<StageData[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_address: "",
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: "",
    order_stage_id: undefined as number | undefined,
    notes: "",
    tax_amount: "0.00",
    discount_amount: "0.00",
    currency: "USD",
    items: [] as OrderItem[],
  });

  useEffect(() => {
    fetchStages();
    fetchProducts();
    if (deal_id) {
      fetchDealData(Number(deal_id));
    }
  }, [deal_id]);

  const fetchStages = async () => {
    try {
      const stagesData = await getStages('order');
      setStages(stagesData || []);
    } catch (error) {
      console.error("Failed to fetch stages:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await listProducts({ page: 1, perPage: 100 });
      setProducts(response.data || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const fetchDealData = async (dealId: number) => {
    try {
      // This would need a getDeal function - assuming it exists
      // const deal = await getDeal(dealId);
      // setSelectedDeal(deal);
      // Pre-populate form with deal data if needed
    } catch (error) {
      console.error("Failed to fetch deal:", error);
    }
  };

  const addOrderItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          product_id: "",
          product_name: "",
          quantity: "1",
          unit_price: 0,
          total_price: "0.00",
          description: "",
        },
      ],
    });
  };

  const removeOrderItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateOrderItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...formData.items];
    const item = { ...newItems[index] };
    
    if (field === 'product_id') {
      const product = products.find(p => String(p.id) === String(value));
      if (product) {
        item.product_id = String(value);
        item.product_name = product.name || "";
        item.unit_price = parseFloat(product.price || product.base_price || "0");
        item.original_currency = product.currency || formData.currency;
        item.original_price = String(product.price || product.base_price || "0");
        item.description = product.description || "";
      }
    } else {
      (item as any)[field] = value;
    }
    
    // Recalculate total_price
    const quantity = parseFloat(item.quantity || "0");
    const unitPrice = item.unit_price || 0;
    item.total_price = (quantity * unitPrice).toFixed(2);
    
    newItems[index] = item;
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => {
      return sum + parseFloat(item.total_price || "0");
    }, 0);
    const tax = parseFloat(formData.tax_amount || "0");
    const discount = parseFloat(formData.discount_amount || "0");
    const total = subtotal + tax - discount;
    return { subtotal, tax, discount, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formStep < 2) {
      setFormStep(formStep + 1);
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        customer_address: formData.customer_address || "",
        order_date: formData.order_date,
        expected_delivery_date: formData.expected_delivery_date || "",
        order_stage_id: formData.order_stage_id ? String(formData.order_stage_id) : undefined,
        notes: formData.notes || "",
        tax_amount: formData.tax_amount || "0.00",
        discount_amount: formData.discount_amount || "0.00",
        currency: formData.currency,
        items: formData.items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          description: item.description || "",
          original_currency: item.original_currency || formData.currency,
          original_price: item.original_price || String(item.unit_price),
        })),
      };

      if (deal_id) {
        payload.deal_id = String(deal_id);
      }

      await createOrder(payload);
      toast.success("Order created successfully!");
      router.push("/crm/orders");
    } catch (error: any) {
      console.error("Failed to create order:", error);
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Orders"
        subLink="/crm/orders"
        currentTitle="Create Order"
      />
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1 fw-bold">Create New Order</h2>
            <p className="text-muted mb-0">Fill in the details below to create a new order</p>
          </div>
          <Link href="/crm/orders">
            <Button variant="outline-secondary">
              <ArrowLeft size={16} className="me-2" />
              Back to Orders
            </Button>
          </Link>
        </div>

        <Form onSubmit={handleSubmit}>
          {/* Timeline Navigation */}
          <div className="mb-4">
            <div className="d-flex align-items-center justify-content-between position-relative">
              <div 
                className="position-absolute bg-light" 
                style={{ 
                  left: '0', 
                  right: '0', 
                  top: '20px', 
                  height: '2px', 
                  zIndex: 0 
                }}
              />
              <div 
                className="position-absolute bg-primary" 
                style={{ 
                  left: '0', 
                  top: '20px', 
                  height: '2px', 
                  width: `${(formStep / 2) * 100}%`,
                  zIndex: 0,
                  transition: 'width 0.3s ease'
                }}
              />
              
              {[0, 1, 2].map((step) => (
                <div 
                  key={step}
                  className="text-center position-relative" 
                  style={{ cursor: 'pointer', flex: 1 }}
                  onClick={() => setFormStep(step)}
                >
                  <div 
                    className={`rounded-circle d-flex align-items-center justify-content-center mx-auto ${formStep >= step ? 'bg-primary text-white' : 'bg-light text-muted'}`}
                    style={{ width: '40px', height: '40px', zIndex: 1, position: 'relative' }}
                  >
                    {formStep > step ? <CheckCircle size={20} /> : step + 1}
                  </div>
                  <small className={`d-block mt-2 ${formStep === step ? 'fw-bold text-primary' : 'text-muted'}`}>
                    {step === 0 ? 'Order Info' : step === 1 ? 'Items' : 'Review'}
                  </small>
                </div>
              ))}
            </div>
          </div>

          {/* Form Content Based on Step */}
          <div style={{ minHeight: '400px' }}>
            {/* Step 0: Order Information */}
            {formStep === 0 && (
              <Card className="mb-3 border-0 bg-light">
                <Card.Body>
                  <h5 className="fw-bold mb-4 text-primary">ORDER INFORMATION</h5>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Customer Name <span className="text-danger">*</span></Form.Label>
                        <Form.Control 
                          type="text" 
                          value={formData.customer_name}
                          onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                          placeholder="Enter customer name" 
                          required 
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Customer Email <span className="text-danger">*</span></Form.Label>
                        <Form.Control 
                          type="email" 
                          value={formData.customer_email}
                          onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                          placeholder="customer@example.com" 
                          required 
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Customer Phone <span className="text-danger">*</span></Form.Label>
                        <Form.Control 
                          type="tel" 
                          value={formData.customer_phone}
                          onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                          placeholder="Enter phone number" 
                          required 
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Customer Address</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={formData.customer_address}
                          onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                          placeholder="Enter address" 
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Order Date <span className="text-danger">*</span></Form.Label>
                        <Form.Control 
                          type="date" 
                          value={formData.order_date}
                          onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                          required 
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Expected Delivery Date</Form.Label>
                        <Form.Control 
                          type="date" 
                          value={formData.expected_delivery_date}
                          onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Stage <span className="text-danger">*</span></Form.Label>
                        <Form.Select 
                          value={formData.order_stage_id || ''}
                          onChange={(e) => setFormData({ ...formData, order_stage_id: e.target.value ? Number(e.target.value) : undefined })}
                          required
                        >
                          <option value="">Select Stage</option>
                          {stages.map((stage) => (
                            <option key={stage.id} value={stage.id}>
                              {stage.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Currency <span className="text-danger">*</span></Form.Label>
                        <Form.Select 
                          value={formData.currency}
                          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                          required
                        >
                          <option value="USD">USD</option>
                          <option value="GBP">GBP</option>
                          <option value="EUR">EUR</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Notes</Form.Label>
                        <Form.Control 
                          as="textarea" 
                          rows={3}
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Additional notes..." 
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}

            {/* Step 1: Order Items */}
            {formStep === 1 && (
              <Card className="mb-3 border-0 bg-light">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold mb-0 text-success">ORDER ITEMS</h5>
                    <Button variant="primary" size="sm" onClick={addOrderItem}>
                      <Plus size={16} className="me-1" />
                      Add Item
                    </Button>
                  </div>
                  
                  {formData.items.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                      <p>No items added yet. Click "Add Item" to start.</p>
                    </div>
                  ) : (
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Quantity</th>
                          <th>Unit Price</th>
                          <th>Total</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.map((item, index) => (
                          <tr key={index}>
                            <td>
                              <Form.Select
                                value={item.product_id}
                                onChange={(e) => updateOrderItem(index, 'product_id', e.target.value)}
                                required
                              >
                                <option value="">Select Product</option>
                                {products.map((product) => (
                                  <option key={product.id} value={product.id}>
                                    {product.name} - {product.currency || formData.currency} {product.price || product.base_price}
                                  </option>
                                ))}
                              </Form.Select>
                              {item.product_name && (
                                <small className="text-muted d-block mt-1">{item.product_name}</small>
                              )}
                            </td>
                            <td>
                              <Form.Control
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateOrderItem(index, 'quantity', e.target.value)}
                                required
                              />
                            </td>
                            <td>
                              <Form.Control
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.unit_price}
                                onChange={(e) => updateOrderItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                required
                              />
                            </td>
                            <td>
                              <strong>{formData.currency} {item.total_price}</strong>
                            </td>
                            <td>
                              <Button
                                variant="link"
                                size="sm"
                                className="text-danger p-0"
                                onClick={() => removeOrderItem(index)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}

                  <Row className="mt-4">
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Tax Amount</Form.Label>
                        <Form.Control 
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.tax_amount}
                          onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value })}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Discount Amount</Form.Label>
                        <Form.Control 
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.discount_amount}
                          onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="mt-3 p-3 bg-white rounded border">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Subtotal:</span>
                      <strong>{formData.currency} {totals.subtotal.toFixed(2)}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Tax:</span>
                      <strong>{formData.currency} {totals.tax.toFixed(2)}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Discount:</span>
                      <strong>{formData.currency} {totals.discount.toFixed(2)}</strong>
                    </div>
                    <hr />
                    <div className="d-flex justify-content-between">
                      <strong>Total:</strong>
                      <strong className="text-primary">{formData.currency} {totals.total.toFixed(2)}</strong>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Step 2: Review */}
            {formStep === 2 && (
              <Card className="mb-3 border-0 bg-light">
                <Card.Body>
                  <h5 className="fw-bold mb-4 text-info">REVIEW ORDER</h5>
                  <Row>
                    <Col md={6}>
                      <h6 className="fw-bold">Customer Information</h6>
                      <p><strong>Name:</strong> {formData.customer_name}</p>
                      <p><strong>Email:</strong> {formData.customer_email}</p>
                      <p><strong>Phone:</strong> {formData.customer_phone}</p>
                      {formData.customer_address && (
                        <p><strong>Address:</strong> {formData.customer_address}</p>
                      )}
                    </Col>
                    <Col md={6}>
                      <h6 className="fw-bold">Order Details</h6>
                      <p><strong>Order Date:</strong> {formData.order_date}</p>
                      {formData.expected_delivery_date && (
                        <p><strong>Expected Delivery:</strong> {formData.expected_delivery_date}</p>
                      )}
                      <p><strong>Stage:</strong> {stages.find(s => s.id === formData.order_stage_id)?.name || 'N/A'}</p>
                      <p><strong>Currency:</strong> {formData.currency}</p>
                    </Col>
                  </Row>
                  {formData.notes && (
                    <Row className="mt-3">
                      <Col>
                        <h6 className="fw-bold">Notes</h6>
                        <p>{formData.notes}</p>
                      </Col>
                    </Row>
                  )}
                  <Row className="mt-3">
                    <Col>
                      <h6 className="fw-bold">Items</h6>
                      <Table responsive>
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.items.map((item, index) => (
                            <tr key={index}>
                              <td>{item.product_name}</td>
                              <td>{item.quantity}</td>
                              <td>{formData.currency} {item.unit_price.toFixed(2)}</td>
                              <td>{formData.currency} {item.total_price}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={3} className="text-end"><strong>Subtotal:</strong></td>
                            <td><strong>{formData.currency} {totals.subtotal.toFixed(2)}</strong></td>
                          </tr>
                          <tr>
                            <td colSpan={3} className="text-end"><strong>Tax:</strong></td>
                            <td><strong>{formData.currency} {totals.tax.toFixed(2)}</strong></td>
                          </tr>
                          <tr>
                            <td colSpan={3} className="text-end"><strong>Discount:</strong></td>
                            <td><strong>{formData.currency} {totals.discount.toFixed(2)}</strong></td>
                          </tr>
                          <tr>
                            <td colSpan={3} className="text-end"><strong>Total:</strong></td>
                            <td><strong className="text-primary">{formData.currency} {totals.total.toFixed(2)}</strong></td>
                          </tr>
                        </tfoot>
                      </Table>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}
          </div>

          {/* Form Footer */}
          <div className="d-flex justify-content-between mt-4">
            <Button 
              variant="secondary" 
              onClick={(e) => {
                e.preventDefault();
                if (formStep > 0) {
                  setFormStep(formStep - 1);
                } else {
                  router.push("/crm/orders");
                }
              }}
            >
              {formStep > 0 ? <><ChevronLeft size={16} className="me-1" /> Previous</> : 'Cancel'}
            </Button>
            <div className="d-flex gap-2">
              {formStep < 2 ? (
                <Button 
                  variant="primary"
                  onClick={(e) => {
                    e.preventDefault();
                    setFormStep(formStep + 1);
                  }}
                >
                  Next <ChevronRight size={16} className="ms-1" />
                </Button>
              ) : (
                <Button variant="primary" type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Order'}
                </Button>
              )}
            </div>
          </div>
        </Form>
      </div>
    </React.Fragment>
  );
};

CreateOrder.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CreateOrder;

