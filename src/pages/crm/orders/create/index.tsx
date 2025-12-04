import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  createOrder,
  getStages,
  StageData,
  getCrmProducts,
  CrmProduct,
  getDeal,
  DealData,
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
import { convertCurrency, formatCurrency } from '@utils/currency';

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

const CreateOrder = () => {
  const router = useRouter();
  const { deal_id } = router.query;
  const [formStep, setFormStep] = useState(0);
  const [loading, setLoading] = useState(false);
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
  const [sourceDeal, setSourceDeal] = useState<DealData | null>(null);
  const [loadingDeal, setLoadingDeal] = useState(false);
  const [selectedEstimateId, setSelectedEstimateId] = useState<number | null>(null);
  const [convertingPrice, setConvertingPrice] = useState(false);
  
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
    const fetchDealData = async () => {
      if (router.isReady && deal_id) {
        try {
          setLoadingDeal(true);
          const dealId = Number(deal_id);
          const dealData = await getDeal(dealId);
          setSourceDeal(dealData);

          // Get the latest estimate (final one or most recent)
          const estimates = dealData.estimates || [];
          const latestEstimate = estimates.find((e: any) => e.is_final) || estimates[estimates.length - 1];
          
          if (latestEstimate) {
            setSelectedEstimateId(latestEstimate.id);
          }

          // Auto-fill form data from deal
          setFormData(prev => ({
            ...prev,
            customer_name: dealData.decision_maker_name || dealData.company_name || "",
            customer_email: "",
            customer_phone: dealData.decision_maker_phone_country_code && dealData.decision_maker_phone 
              ? `${dealData.decision_maker_phone_country_code} ${dealData.decision_maker_phone}`
              : dealData.decision_maker_phone || "",
            customer_address: "",
            currency: dealData.currency || "USD",
            tax_percentage: latestEstimate?.tax_percentage || "0",
            standard_discount_percentage: latestEstimate?.standard_discount_percentage || "0",
            special_discount_percentage: latestEstimate?.special_discount_percentage || "0",
          }));

          // Auto-populate items from latest estimate
          // Note: Items are already converted to deal currency in the estimate
          // But we need to ensure they're converted to order currency if different
          if (latestEstimate?.estimation_chart) {
            const estimateCurrency = latestEstimate.currency || dealData.currency;
            const orderCurrency = dealData.currency || "USD";
            
            // If estimate currency matches order currency, use prices as-is
            // Otherwise, we'll convert them (but this should be rare since order inherits deal currency)
            const items: OrderItem[] = latestEstimate.estimation_chart.map((item: any) => ({
              product_id: item.product_id,
              product_name: item.product_service,
              description: item.description || "",
              quantity: String(item.qty),
              unit_price: item.unit_price, // Already in deal currency from estimate
              total_price: (item.qty * item.unit_price).toFixed(2),
              original_currency: item.original_currency || dealData.currency,
              original_price: item.original_price || item.unit_price,
            }));
            setFormData(prev => ({ ...prev, items }));
          }
        } catch (error) {
          console.error("Failed to fetch deal:", error);
          toast.error("Failed to load deal data");
        } finally {
          setLoadingDeal(false);
        }
      }
    };

    fetchDealData();
  }, [router.isReady, deal_id, router]);

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

  const handleEstimateChange = async (estimateId: number | null) => {
    if (!sourceDeal || !estimateId) return;
    
    const estimates = sourceDeal.estimates || [];
    const selectedEstimate = estimates.find((e: any) => e.id === estimateId);
    
    if (selectedEstimate) {
      setSelectedEstimateId(estimateId);
      
      // Update tax and discount percentages
      setFormData(prev => ({
        ...prev,
        tax_percentage: selectedEstimate.tax_percentage || "0",
        standard_discount_percentage: selectedEstimate.standard_discount_percentage || "0",
        special_discount_percentage: selectedEstimate.special_discount_percentage || "0",
      }));

      // Update items from selected estimate
      // Items are already converted to estimate currency, but we may need to convert to order currency
      if (selectedEstimate.estimation_chart) {
        const estimateCurrency = selectedEstimate.currency || sourceDeal.currency;
        const orderCurrency = formData.currency;
        
        // Convert items if estimate currency differs from order currency
        if (estimateCurrency.toUpperCase() !== orderCurrency.toUpperCase()) {
          try {
            setConvertingPrice(true);
            const convertedItems = await Promise.all(
              selectedEstimate.estimation_chart.map(async (item: any) => {
                const convertedPrice = await convertCurrency(
                  item.unit_price,
                  estimateCurrency,
                  orderCurrency
                );
                return {
                  product_id: item.product_id,
                  product_name: item.product_service,
                  description: item.description || "",
                  quantity: String(item.qty),
                  unit_price: convertedPrice,
                  total_price: (item.qty * convertedPrice).toFixed(2),
                  original_currency: item.original_currency || estimateCurrency,
                  original_price: item.original_price || item.unit_price,
                };
              })
            );
            setFormData(prev => ({ ...prev, items: convertedItems }));
          } catch (error) {
            console.error('Failed to convert estimate items:', error);
            toast.error('Failed to convert prices from estimate currency');
            // Fallback: use items as-is
            const items: OrderItem[] = selectedEstimate.estimation_chart.map((item: any) => ({
              product_id: item.product_id,
              product_name: item.product_service,
              description: item.description || "",
              quantity: String(item.qty),
              unit_price: item.unit_price,
              total_price: (item.qty * item.unit_price).toFixed(2),
              original_currency: item.original_currency || estimateCurrency,
              original_price: item.original_price || item.unit_price,
            }));
            setFormData(prev => ({ ...prev, items }));
          } finally {
            setConvertingPrice(false);
          }
        } else {
          // Same currency, use items as-is
          const items: OrderItem[] = selectedEstimate.estimation_chart.map((item: any) => ({
            product_id: item.product_id,
            product_name: item.product_service,
            description: item.description || "",
            quantity: String(item.qty),
            unit_price: item.unit_price,
            total_price: (item.qty * item.unit_price).toFixed(2),
            original_currency: item.original_currency || estimateCurrency,
            original_price: item.original_price || item.unit_price,
          }));
          setFormData(prev => ({ ...prev, items }));
        }
      }
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
          product_id: String(item.product_id),
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: (parseFloat(item.quantity || "0") * item.unit_price).toFixed(2),
          description: item.description || "",
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
      toast.error(error?.response?.data?.message || "Failed to create order");
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
      />
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1 fw-bold">Create New Order</h2>
            <p className="text-muted mb-0">
              {sourceDeal ? `Converting from Deal: ${sourceDeal.name}` : "Fill in the details below to create a new order"}
            </p>
          </div>
          <Link href="/crm/orders">
            <Button variant="outline-secondary">
              <ArrowLeft size={16} className="me-2" />
              Back to Orders
            </Button>
          </Link>
        </div>

        {sourceDeal && (
          <Card className="mb-3 border-0 bg-info bg-opacity-10">
            <Card.Body>
              <div className="d-flex align-items-center gap-2 mb-2">
                <Badge bg="info">Converted from Deal</Badge>
                <span className="small text-muted">
                  Deal: <strong>{sourceDeal.name}</strong>
                  {sourceDeal.company_name && ` • Company: ${sourceDeal.company_name}`}
                  {sourceDeal.id && ` • ID: #${sourceDeal.id}`}
                </span>
              </div>
              {sourceDeal.estimates && sourceDeal.estimates.length > 1 && (
                <div className="mt-2">
                  <Form.Label className="small fw-bold">Select Estimate Revision:</Form.Label>
                  <Form.Select
                    size="sm"
                    value={selectedEstimateId || ''}
                    onChange={(e) => handleEstimateChange(e.target.value ? Number(e.target.value) : null)}
                  >
                    {sourceDeal.estimates.map((estimate: any) => (
                      <option key={estimate.id} value={estimate.id}>
                        Version {estimate.version} {estimate.is_final ? '(Final)' : ''} - {estimate.currency} {estimate.net_value} 
                        {estimate.created_at && ` (${new Date(estimate.created_at).toLocaleDateString()})`}
                      </option>
                    ))}
                  </Form.Select>
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        {loadingDeal && (
          <Card className="mb-3 border-0">
            <Card.Body className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading deal data...</span>
              </div>
              <p className="mt-2 text-muted">Loading deal information...</p>
            </Card.Body>
          </Card>
        )}

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
                          onChange={async (e) => {
                            const newCurrency = e.target.value;
                            setFormData({ ...formData, currency: newCurrency });
                            
                            // Convert all existing order items to new currency
                            if (formData.items.length > 0) {
                              try {
                                setConvertingPrice(true);
                                const convertedItems = await Promise.all(
                                  formData.items.map(async (item) => {
                                    const product = products.find(p => p.id === item.product_id);
                                    if (product) {
                                      const productCurrency = product.currency.toUpperCase();
                                      const oldOrderCurrency = formData.currency.toUpperCase();
                                      const newOrderCurrency = newCurrency.toUpperCase();
                                      
                                      // If product currency matches new order currency, use original price
                                      if (productCurrency === newOrderCurrency) {
                                        return {
                                          ...item,
                                          unit_price: parseFloat(product.price) || item.unit_price,
                                        };
                                      }
                                      
                                      // Convert from old order currency to new order currency
                                      if (oldOrderCurrency !== newOrderCurrency) {
                                        const convertedPrice = await convertCurrency(
                                          item.unit_price,
                                          oldOrderCurrency,
                                          newOrderCurrency
                                        );
                                        return {
                                          ...item,
                                          unit_price: convertedPrice,
                                          total_price: (parseFloat(item.quantity || "0") * convertedPrice).toFixed(2),
                                        };
                                      }
                                    }
                                    return item;
                                  })
                                );
                                setFormData(prev => ({ ...prev, items: convertedItems }));
                              } catch (error) {
                                console.error('Failed to convert existing items:', error);
                                toast.error('Failed to convert prices to new currency');
                              } finally {
                                setConvertingPrice(false);
                              }
                            }
                          }}
                          required
                        >
                          <option value="USD">USD</option>
                          <option value="GBP">GBP</option>
                          <option value="EUR">EUR</option>
                          <option value="PKR">PKR</option>
                          <option value="INR">INR</option>
                          <option value="AUD">AUD</option>
                          <option value="CAD">CAD</option>
                          <option value="JPY">JPY</option>
                          <option value="CNY">CNY</option>
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
                          const product = products.find(p => p.id === item.product_id);
                          const showConversionInfo = product && 
                            product.currency.toUpperCase() !== formData.currency.toUpperCase() &&
                            item.original_currency &&
                            item.original_price !== item.unit_price;
                          
                          return (
                            <tr key={index}>
                              <td>{index + 1}</td>
                              <td>
                                {item.product_name}
                                {showConversionInfo && (
                                  <div className="small text-muted">
                                    Original: {formatCurrency(item.original_price || item.unit_price, item.original_currency || formData.currency)}
                                  </div>
                                )}
                              </td>
                              <td>{item.description || 'N/A'}</td>
                              <td>{item.quantity}</td>
                              <td>
                                {formatCurrency(item.unit_price, formData.currency)}
                                {showConversionInfo && (
                                  <div className="small text-success">
                                    Converted
                                  </div>
                                )}
                              </td>
                              <td className="fw-bold">{formatCurrency(subtotal, formData.currency)}</td>
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
                            <td className="fw-bold">{formatCurrency(totals.grandTotal, formData.currency)}</td>
                            <td></td>
                          </tr>
                          {totals.totalDiscount > 0 && (
                            <tr>
                              <td colSpan={5} className="text-end">
                                Discount ({parseFloat(formData.standard_discount_percentage || "0") + parseFloat(formData.special_discount_percentage || "0")}%):
                              </td>
                              <td>-{formatCurrency(totals.totalDiscount, formData.currency)}</td>
                              <td></td>
                            </tr>
                          )}
                          {parseFloat(formData.tax_percentage || "0") > 0 && (
                            <tr>
                              <td colSpan={5} className="text-end fw-bold">Tax ({formData.tax_percentage}%):</td>
                              <td className="fw-bold">{formatCurrency(totals.taxAmount, formData.currency)}</td>
                              <td></td>
                            </tr>
                          )}
                          <tr className="table-primary">
                            <td colSpan={5} className="text-end fw-bold">Net Value:</td>
                            <td className="fw-bold">{formatCurrency(totals.netValue, formData.currency)}</td>
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
                                <td>{formatCurrency(item.unit_price, formData.currency)}</td>
                                <td>{formatCurrency(subtotal, formData.currency)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={4} className="text-end"><strong>Subtotal:</strong></td>
                            <td><strong>{formatCurrency(totals.grandTotal, formData.currency)}</strong></td>
                          </tr>
                          {totals.totalDiscount > 0 && (
                            <tr>
                              <td colSpan={4} className="text-end"><strong>Discount:</strong></td>
                              <td><strong>-{formatCurrency(totals.totalDiscount, formData.currency)}</strong></td>
                            </tr>
                          )}
                          {parseFloat(formData.tax_percentage || "0") > 0 && (
                            <tr>
                              <td colSpan={4} className="text-end"><strong>Tax ({formData.tax_percentage}%):</strong></td>
                              <td><strong>{formatCurrency(totals.taxAmount, formData.currency)}</strong></td>
                            </tr>
                          )}
                          <tr className="table-primary">
                            <td colSpan={4} className="text-end"><strong>Net Value:</strong></td>
                            <td><strong className="text-primary">{formatCurrency(totals.netValue, formData.currency)}</strong></td>
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
                        onChange={async (selectedOption: any) => {
                          const product = products.find(p => p.id === selectedOption?.value);
                          if (product) {
                            const originalPrice = parseFloat(product.price) || 0;
                            const productCurrency = product.currency.toUpperCase();
                            const orderCurrency = formData.currency.toUpperCase();
                            
                            // Convert price if currencies differ
                            let convertedPrice = originalPrice;
                            if (productCurrency !== orderCurrency) {
                              try {
                                setConvertingPrice(true);
                                convertedPrice = await convertCurrency(
                                  originalPrice,
                                  productCurrency,
                                  orderCurrency
                                );
                              } catch (error) {
                                console.error('Failed to convert currency:', error);
                                toast.error(`Failed to convert ${productCurrency} to ${orderCurrency}`);
                                // Keep original price if conversion fails
                                convertedPrice = originalPrice;
                              } finally {
                                setConvertingPrice(false);
                              }
                            }
                            
                            setItemFormData({
                              ...itemFormData,
                              product_id: product.id,
                              product_name: product.name,
                              unit_price: convertedPrice,
                            });
                          }
                        }}
                        options={products.map(product => {
                          const productCurrency = product.currency.toUpperCase();
                          const orderCurrency = formData.currency.toUpperCase();
                          const originalPrice = parseFloat(product.price) || 0;
                          
                          // Show both currencies if they differ
                          if (productCurrency !== orderCurrency) {
                            return {
                              value: product.id,
                              label: `${product.name} (${product.sku}) - ${productCurrency} ${originalPrice.toFixed(2)} → ${orderCurrency} (will convert)`,
                            };
                          }
                          
                          return {
                            value: product.id,
                            label: `${product.name} (${product.sku}) - ${productCurrency} ${originalPrice.toFixed(2)}`,
                          };
                        })}
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
                      <Form.Label>
                        Unit Price <span className="text-danger">*</span>
                        {convertingPrice && (
                          <span className="ms-2 text-muted small">
                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                            Converting...
                          </span>
                        )}
                      </Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Enter unit price"
                        value={itemFormData.unit_price}
                        onChange={(e) => setItemFormData({ ...itemFormData, unit_price: parseFloat(e.target.value) || 0 })}
                        required
                        disabled={convertingPrice}
                      />
                      {itemFormData.product_id && (() => {
                        const selectedProduct = products.find(p => p.id === itemFormData.product_id);
                        if (selectedProduct) {
                          const productCurrency = selectedProduct.currency.toUpperCase();
                          const orderCurrency = formData.currency.toUpperCase();
                          const originalPrice = parseFloat(selectedProduct.price) || 0;
                          
                          if (productCurrency !== orderCurrency && itemFormData.unit_price !== originalPrice) {
                            return (
                              <Form.Text className="text-muted d-block">
                                Converted from {formatCurrency(originalPrice, productCurrency)} 
                                {' → '}
                                {formatCurrency(itemFormData.unit_price, orderCurrency)}
                              </Form.Text>
                            );
                          }
                        }
                        return null;
                      })()}
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Card className="bg-light border-0">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-muted">Sub Total:</span>
                          <h5 className="mb-0 text-success">
                            {formatCurrency(itemFormData.quantity * itemFormData.unit_price, formData.currency)}
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

