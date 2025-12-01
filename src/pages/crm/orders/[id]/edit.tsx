import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect, useRef } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  updateOrder,
  getOrder,
  getStages,
  StageData,
  getCrmProducts,
  CrmProduct,
} from "@utils/crm";
import { Button, Row, Col, Form, Card, Badge, Table, Modal } from "react-bootstrap";
import Select from "react-select";
import { CheckCircle, ChevronLeft, ChevronRight, ArrowLeft, Plus, Edit, Trash2, Package } from "lucide-react";
import Link from "next/link";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import { ModuleSlug } from '@utils/Helper';

interface OrderItem {
  id?: number;
  product_id: number;
  product_name: string;
  quantity: string;
  unit_price: number;
  total_price: string;
  description?: string;
  original_currency?: string;
  original_price?: number;
}

const EditOrder = () => {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();
  const [formStep, setFormStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [stages, setStages] = useState<StageData[]>([]);
  const [products, setProducts] = useState<CrmProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [itemFormData, setItemFormData] = useState({
    product_id: null as number | null,
    product_name: "",
    description: "",
    quantity: 1,
    unit_price: 0,
  });
  const isInitialLoad = useRef(true);
  
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_address: "",
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: "",
    order_stage_id: undefined as number | undefined,
    notes: "",
    tax_percentage: "0",
    standard_discount_percentage: "0",
    special_discount_percentage: "0",
    currency: "USD",
    items: [] as OrderItem[],
  });

  useEffect(() => {
    fetchStages();
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchOrderData = async () => {
      if (!router.isReady || !id || isInitialLoad.current === false) return;
      
      try {
        setFetching(true);
        const order = await getOrder(Number(id));
        
        // Format dates for input fields
        const formatDate = (dateString: string | null) => {
          if (!dateString) return "";
          return dateString.split('T')[0];
        };

        // Transform items from API format
        const transformedItems: OrderItem[] = (order.items || []).map((item: any) => ({
          id: item.id,
          product_id: Number(item.product_id),
          product_name: item.product_name || "",
          quantity: String(item.quantity),
          unit_price: parseFloat(item.unit_price || "0"),
          total_price: String(item.total_price || "0"),
          description: item.description || "",
          original_currency: item.original_currency || order.currency,
          original_price: parseFloat(item.original_price || item.unit_price || "0"),
        }));

        // Calculate tax and discount percentages from amounts
        const grandTotal = transformedItems.reduce((sum, item) => sum + parseFloat(item.total_price || "0"), 0);
        const taxAmount = parseFloat(order.tax_amount || "0");
        const discountAmount = parseFloat(order.discount_amount || "0");
        const taxPercentage = grandTotal > 0 ? ((taxAmount / (grandTotal - discountAmount)) * 100).toFixed(2) : "0";
        const discountPercentage = grandTotal > 0 ? ((discountAmount / grandTotal) * 100).toFixed(2) : "0";

        setFormData({
          customer_name: order.customer_name || "",
          customer_email: order.customer_email || "",
          customer_phone: order.customer_phone || "",
          customer_address: order.customer_address || "",
          order_date: formatDate(order.order_date),
          expected_delivery_date: formatDate(order.expected_delivery_date),
          order_stage_id: order.order_stage_id ? Number(order.order_stage_id) : undefined,
          notes: order.notes || "",
          tax_percentage: taxPercentage,
          standard_discount_percentage: discountPercentage,
          special_discount_percentage: "0",
          currency: order.currency || "USD",
          items: transformedItems,
        });
        
        isInitialLoad.current = false;
      } catch (error) {
        console.error("Failed to fetch order:", error);
        toast.error("Failed to load order data");
        router.push("/crm/orders");
      } finally {
        setFetching(false);
      }
    };

    fetchOrderData();
  }, [router.isReady, id, router]);

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
      setLoadingProducts(true);
      const response = await getCrmProducts({ per_page: 100 });
      setProducts(response.data || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const calculateTotals = () => {
    const grandTotal = formData.items.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity || "0") * (item.unit_price || 0));
    }, 0);
    
    const standardDiscount = (grandTotal * parseFloat(formData.standard_discount_percentage || "0")) / 100;
    const specialDiscount = ((grandTotal - standardDiscount) * parseFloat(formData.special_discount_percentage || "0")) / 100;
    const totalDiscount = standardDiscount + specialDiscount;
    const subtotalAfterDiscount = grandTotal - totalDiscount;
    const taxAmount = (subtotalAfterDiscount * parseFloat(formData.tax_percentage || "0")) / 100;
    const netValue = subtotalAfterDiscount + taxAmount;
    
    return { 
      grandTotal, 
      standardDiscount, 
      specialDiscount, 
      totalDiscount, 
      subtotalAfterDiscount, 
      taxAmount, 
      netValue 
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formStep < 2) {
      setFormStep(formStep + 1);
      return;
    }

    if (!id) return;

    setLoading(true);
    try {
      const totals = calculateTotals();
      const payload: any = {
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        customer_address: formData.customer_address || "",
        order_date: formData.order_date,
        expected_delivery_date: formData.expected_delivery_date || "",
        order_stage_id: formData.order_stage_id ? String(formData.order_stage_id) : undefined,
        notes: formData.notes || "",
        tax_amount: totals.taxAmount.toFixed(2),
        discount_amount: totals.totalDiscount.toFixed(2),
        total_amount: totals.grandTotal.toFixed(2),
        final_amount: totals.netValue.toFixed(2),
        currency: formData.currency,
        items: formData.items.map(item => ({
          id: item.id,
          product_id: String(item.product_id),
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: (parseFloat(item.quantity || "0") * item.unit_price).toFixed(2),
          description: item.description || "",
        })),
      };

      await updateOrder(Number(id), payload);
      toast.success("Order updated successfully!");
      router.push("/crm/orders");
    } catch (error: any) {
      console.error("Failed to update order:", error);
      toast.error(error?.response?.data?.message || "Failed to update order");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <React.Fragment>
        <BreadcrumbItem
          mainTitle="CRM"
          mainLink="/crm/dashboard"
          subTitle="Orders"
          subLink="/crm/orders"
          currentTitle="Edit Order"
        />
        <div className="text-center py-5">
          <p>Loading order data...</p>
        </div>
      </React.Fragment>
    );
  }

  const totals = calculateTotals();

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Orders"
        subLink="/crm/orders"
        currentTitle="Edit Order"
      />
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1 fw-bold">Edit Order</h2>
            <p className="text-muted mb-0">Update the order details below</p>
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
                  <h5 className="fw-bold mb-4 text-success">ORDER ITEMS</h5>
                  
                  {/* Order-level settings */}
                  <Row className="mb-4">
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Tax Percentage (%)</Form.Label>
                        <Form.Control
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={formData.tax_percentage}
                          onChange={(e) => setFormData({ ...formData, tax_percentage: e.target.value })}
                          placeholder="0"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Standard Discount (%)</Form.Label>
                        <Form.Control
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={formData.standard_discount_percentage}
                          onChange={(e) => setFormData({ ...formData, standard_discount_percentage: e.target.value })}
                          placeholder="0"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Special Discount (%)</Form.Label>
                        <Form.Control
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={formData.special_discount_percentage}
                          onChange={(e) => setFormData({ ...formData, special_discount_percentage: e.target.value })}
                          placeholder="0"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Add Item Button */}
                  <div className="d-flex justify-content-end mb-3">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setEditingItemIndex(null);
                        setItemFormData({
                          product_id: null,
                          product_name: "",
                          description: "",
                          quantity: 1,
                          unit_price: 0,
                        });
                        setShowAddItemModal(true);
                      }}
                    >
                      <Plus size={14} className="me-1" />
                      Add Item
                    </Button>
                  </div>

                  {/* Order Items Table */}
                  <div className="table-responsive">
                    <Table size="sm" hover className="bg-white">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Product/Service</th>
                          <th>Description</th>
                          <th>Qty</th>
                          <th>Unit Price</th>
                          <th>Sub Total</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.map((item, index) => {
                          const subtotal = parseFloat(item.quantity || "0") * item.unit_price;
                          return (
                            <tr key={index}>
                              <td>{index + 1}</td>
                              <td>{item.product_name}</td>
                              <td>{item.description || 'N/A'}</td>
                              <td>{item.quantity}</td>
                              <td>{item.unit_price.toLocaleString()} {formData.currency}</td>
                              <td className="fw-bold">{subtotal.toLocaleString()} {formData.currency}</td>
                              <td>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0 me-2"
                                  title="Edit Item"
                                  onClick={() => {
                                    setEditingItemIndex(index);
                                    setItemFormData({
                                      product_id: item.product_id,
                                      product_name: item.product_name,
                                      description: item.description || "",
                                      quantity: parseFloat(item.quantity || "1"),
                                      unit_price: item.unit_price,
                                    });
                                    setShowAddItemModal(true);
                                  }}
                                >
                                  <Edit size={14} />
                                </Button>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0 text-danger"
                                  title="Delete Item"
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this item?')) {
                                      setFormData({
                                        ...formData,
                                        items: formData.items.filter((_, i) => i !== index)
                                      });
                                    }
                                  }}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                        {formData.items.length === 0 && (
                          <tr>
                            <td colSpan={7} className="text-center text-muted py-4">
                              <Package size={32} className="text-muted mb-2" />
                              <div>No items in order</div>
                              <small>Click "Add Item" to add products or services</small>
                            </td>
                          </tr>
                        )}
                      </tbody>
                      {formData.items.length > 0 && (
                        <tfoot>
                          <tr>
                            <td colSpan={5} className="text-end fw-bold">Subtotal:</td>
                            <td className="fw-bold">{totals.grandTotal.toFixed(2)} {formData.currency}</td>
                            <td></td>
                          </tr>
                          {totals.totalDiscount > 0 && (
                            <tr>
                              <td colSpan={5} className="text-end">
                                Discount ({parseFloat(formData.standard_discount_percentage || "0") + parseFloat(formData.special_discount_percentage || "0")}%):
                              </td>
                              <td>-{totals.totalDiscount.toFixed(2)} {formData.currency}</td>
                              <td></td>
                            </tr>
                          )}
                          {parseFloat(formData.tax_percentage || "0") > 0 && (
                            <tr>
                              <td colSpan={5} className="text-end fw-bold">Tax ({formData.tax_percentage}%):</td>
                              <td className="fw-bold">{totals.taxAmount.toFixed(2)} {formData.currency}</td>
                              <td></td>
                            </tr>
                          )}
                          <tr className="table-primary">
                            <td colSpan={5} className="text-end fw-bold">Net Value:</td>
                            <td className="fw-bold">{totals.netValue.toFixed(2)} {formData.currency}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      )}
                    </Table>
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
                            <th>Description</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.items.map((item, index) => {
                            const subtotal = parseFloat(item.quantity || "0") * item.unit_price;
                            return (
                              <tr key={index}>
                                <td>{item.product_name}</td>
                                <td>{item.description || 'N/A'}</td>
                                <td>{item.quantity}</td>
                                <td>{formData.currency} {item.unit_price.toFixed(2)}</td>
                                <td>{formData.currency} {subtotal.toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={4} className="text-end"><strong>Subtotal:</strong></td>
                            <td><strong>{formData.currency} {totals.grandTotal.toFixed(2)}</strong></td>
                          </tr>
                          {totals.totalDiscount > 0 && (
                            <tr>
                              <td colSpan={4} className="text-end"><strong>Discount:</strong></td>
                              <td><strong>-{formData.currency} {totals.totalDiscount.toFixed(2)}</strong></td>
                            </tr>
                          )}
                          {parseFloat(formData.tax_percentage || "0") > 0 && (
                            <tr>
                              <td colSpan={4} className="text-end"><strong>Tax ({formData.tax_percentage}%):</strong></td>
                              <td><strong>{formData.currency} {totals.taxAmount.toFixed(2)}</strong></td>
                            </tr>
                          )}
                          <tr className="table-primary">
                            <td colSpan={4} className="text-end"><strong>Net Value:</strong></td>
                            <td><strong className="text-primary">{formData.currency} {totals.netValue.toFixed(2)}</strong></td>
                          </tr>
                        </tfoot>
                      </Table>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}
          </div>

          {/* Add/Edit Item Modal */}
          <Modal show={showAddItemModal} onHide={() => {
            setShowAddItemModal(false);
            setEditingItemIndex(null);
            setItemFormData({
              product_id: null,
              product_name: "",
              description: "",
              quantity: 1,
              unit_price: 0,
            });
          }} size="lg" centered>
            <Modal.Header closeButton>
              <Modal.Title>{editingItemIndex !== null ? 'Edit Item' : 'Add New Item'}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const selectedProduct = products.find(p => p.id === itemFormData.product_id);
              const newItem: OrderItem = {
                product_id: itemFormData.product_id!,
                product_name: itemFormData.product_name,
                description: itemFormData.description,
                quantity: String(itemFormData.quantity),
                unit_price: itemFormData.unit_price,
                total_price: (itemFormData.quantity * itemFormData.unit_price).toFixed(2),
                original_currency: selectedProduct?.currency || formData.currency,
                original_price: parseFloat(selectedProduct?.price || "0") || itemFormData.unit_price,
              };

              if (editingItemIndex !== null) {
                const updated = [...formData.items];
                updated[editingItemIndex] = newItem;
                setFormData({ ...formData, items: updated });
              } else {
                setFormData({ ...formData, items: [...formData.items, newItem] });
              }

              setShowAddItemModal(false);
              setEditingItemIndex(null);
              setItemFormData({
                product_id: null,
                product_name: "",
                description: "",
                quantity: 1,
                unit_price: 0,
              });
            }} noValidate>
              <Modal.Body>
                <Row className="g-3">
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label>Product <span className="text-danger">*</span></Form.Label>
                      <Select
                        value={itemFormData.product_id ? {
                          value: itemFormData.product_id,
                          label: itemFormData.product_name || products.find(p => p.id === itemFormData.product_id)?.name || ""
                        } : null}
                        onChange={(selectedOption: any) => {
                          const product = products.find(p => p.id === selectedOption?.value);
                          if (product) {
                            setItemFormData({
                              ...itemFormData,
                              product_id: product.id,
                              product_name: product.name,
                              unit_price: parseFloat(product.price) || 0,
                            });
                          }
                        }}
                        options={products.map(product => ({
                          value: product.id,
                          label: `${product.name} (${product.sku}) - ${product.currency} ${product.price}`,
                        }))}
                        placeholder="Select a product"
                        isSearchable
                        isLoading={loadingProducts}
                        isDisabled={editingItemIndex !== null}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label>Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="Enter product description or specifications"
                        value={itemFormData.description}
                        onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Quantity <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        placeholder="Enter quantity"
                        value={itemFormData.quantity}
                        onChange={(e) => setItemFormData({ ...itemFormData, quantity: parseInt(e.target.value) || 1 })}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Unit Price <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Enter unit price"
                        value={itemFormData.unit_price}
                        onChange={(e) => setItemFormData({ ...itemFormData, unit_price: parseFloat(e.target.value) || 0 })}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Card className="bg-light border-0">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-muted">Sub Total:</span>
                          <h5 className="mb-0 text-success">
                            {formData.currency} {(itemFormData.quantity * itemFormData.unit_price).toFixed(2)}
                          </h5>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="outline-secondary" onClick={() => {
                  setShowAddItemModal(false);
                  setEditingItemIndex(null);
                  setItemFormData({
                    product_id: null,
                    product_name: "",
                    description: "",
                    quantity: 1,
                    unit_price: 0,
                  });
                }}>
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  type="button"
                  disabled={!itemFormData.product_id || itemFormData.quantity < 1 || itemFormData.unit_price <= 0}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const selectedProduct = products.find(p => p.id === itemFormData.product_id);
                    const newItem: OrderItem = {
                      product_id: itemFormData.product_id!,
                      product_name: itemFormData.product_name,
                      description: itemFormData.description,
                      quantity: String(itemFormData.quantity),
                      unit_price: itemFormData.unit_price,
                      total_price: (itemFormData.quantity * itemFormData.unit_price).toFixed(2),
                      original_currency: selectedProduct?.currency || formData.currency,
                      original_price: parseFloat(selectedProduct?.price || "0") || itemFormData.unit_price,
                    };

                    if (editingItemIndex !== null) {
                      const updated = [...formData.items];
                      updated[editingItemIndex] = newItem;
                      setFormData({ ...formData, items: updated });
                    } else {
                      setFormData({ ...formData, items: [...formData.items, newItem] });
                    }

                    setShowAddItemModal(false);
                    setEditingItemIndex(null);
                    setItemFormData({
                      product_id: null,
                      product_name: "",
                      description: "",
                      quantity: 1,
                      unit_price: 0,
                    });
                  }}
                >
                  {editingItemIndex !== null ? 'Update Item' : 'Add Item'}
                </Button>
              </Modal.Footer>
            </Form>
          </Modal>

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
                  {loading ? 'Updating...' : 'Update Order'}
                </Button>
              )}
            </div>
          </div>
        </Form>
      </div>
    </React.Fragment>
  );
};

EditOrder.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default EditOrder;

