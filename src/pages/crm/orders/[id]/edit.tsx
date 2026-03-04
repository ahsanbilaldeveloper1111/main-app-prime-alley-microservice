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
import PhoneInput from "react-phone-number-input";
import { parsePhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { CheckCircle, ChevronLeft, ChevronRight, ArrowLeft, Plus, Edit, Trash2, Package } from "lucide-react";
import Link from "next/link";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import { ModuleSlug, ValidationType, checkRequiredFields } from '@utils/Helper';
import { convertCurrency, formatCurrency } from '@utils/currency';
import { GetHierarchyData } from "@utils/users";

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
  const [convertingPrice, setConvertingPrice] = useState(false);
  
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_phone_country_code: "",
    customer_address: "",
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: "",
    order_stage_id: undefined as number | undefined,
    notes: "",
    tax_percentage: "0",
    standard_discount_percentage: "0",
    special_discount_percentage: "0",
    currency: "AED",
    industry: "",
    order_approval_status: "",
    fulfillment_status: "",
    payment_status: "",
    items: [] as OrderItem[],
  });

  useEffect(() => {
    fetchStages();
    fetchProducts();
  }, []);

  const [extensions, setExtensions] = useState<any[]>([]);

  const fetchExtensions = async () => {
    try {
      const hierarchyData = await GetHierarchyData(ModuleSlug.CRM_ORDERS);
      if (hierarchyData?.extensions) {
        setExtensions(hierarchyData.extensions);
      }
    } catch (error) {
      console.error("Failed to fetch extensions:", error);
    }
  };

  useEffect(() => {
    fetchExtensions();
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

        // Parse phone number to extract country code and national number
        const parsePhoneNumberFormat = (phone: string): { countryCode: string; phoneNumber: string } => {
          if (!phone) return { countryCode: "", phoneNumber: "" };
          
          // Try to parse as international format
          try {
            const phoneNumber = parsePhoneNumber(phone);
            if (phoneNumber) {
              return {
                countryCode: `+${phoneNumber.countryCallingCode}`,
                phoneNumber: phoneNumber.nationalNumber,
              };
            }
          } catch (error) {
            // If parsing fails, try to match pattern: +country_code space rest_of_number
            const match = phone.match(/^(\+\d{1,4})\s+(.+)$/);
            if (match) {
              return {
                countryCode: match[1], // e.g., "+92"
                phoneNumber: match[2],  // e.g., "3200654656"
              };
            }
          }
          
          // If no match, return original phone as phoneNumber
          return { countryCode: "", phoneNumber: phone };
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

        // Parse phone number from order
        const parsedPhone = parsePhoneNumberFormat(order.customer_phone || "");

        setFormData({
          customer_name: order.customer_name || "",
          customer_email: order.customer_email || "",
          customer_phone: parsedPhone.phoneNumber,
          customer_phone_country_code: parsedPhone.countryCode,
          customer_address: order.customer_address || "",
          order_date: formatDate(order.order_date),
          expected_delivery_date: formatDate(order.expected_delivery_date),
          order_stage_id: order.order_stage_id ? Number(order.order_stage_id) : undefined,
          notes: order.notes || "",
          tax_percentage: taxPercentage,
          standard_discount_percentage: discountPercentage,
          special_discount_percentage: "0",
          currency: order.currency || "AED",
          industry: order.industry || "",
          order_approval_status: order.order_approval_status || "",
          fulfillment_status: order.fulfillment_status || "",
          payment_status: order.payment_status || "",
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

  // Validation functions for each step
  const validateStep0 = (): boolean => {
    const requiredFields = [
      { field: 'customer_name' as const, name: 'Company Name' },
      { field: 'customer_email' as const, name: 'Company Email', type: ValidationType.EMAIL },
      { field: 'customer_phone' as const, name: 'Company Phone' },
      { field: 'order_date' as const, name: 'Order Date' },
      { field: 'order_stage_id' as const, name: 'Stage' },
      { field: 'currency' as const, name: 'Currency' },
    ];
    return checkRequiredFields(formData, requiredFields);
  };

  const validateStep1 = (): boolean => {
    // Validate that at least one item exists
    if (!formData.items || formData.items.length === 0) {
      toast.error('Please add at least one item to the order');
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    // Step 2 (Review) has no required fields
    return true;
  };

  const validateCurrentStep = (): boolean => {
    switch (formStep) {
      case 0:
        return validateStep0();
      case 1:
        return validateStep1();
      case 2:
        return validateStep2();
      default:
        return true;
    }
  };

  const handleNextStep = (e: React.MouseEvent) => {
    e.preventDefault();
    if (validateCurrentStep()) {
      setFormStep(Math.min(2, formStep + 1));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formStep < 2) {
      setFormStep(formStep + 1);
      return;
    }

    if (!id) return;

    // Validate all required fields before submission
    if (!validateStep0()) {
      return;
    }

    if (!validateStep1()) {
      return;
    }

    setLoading(true);
    try {
      const totals = calculateTotals();
      // Format phone number for submission
      const formattedPhone = formData.customer_phone_country_code && formData.customer_phone
        ? `${formData.customer_phone_country_code} ${formData.customer_phone}`
        : formData.customer_phone;
      
      const payload: any = {
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formattedPhone,
        customer_address: formData.customer_address || "",
        order_date: formData.order_date,
        expected_delivery_date: formData.expected_delivery_date || "",
        order_stage_id: String(formData.order_stage_id),
        notes: formData.notes || "",
        tax_amount: totals.taxAmount.toFixed(2),
        discount_amount: totals.totalDiscount.toFixed(2),
        total_amount: totals.grandTotal.toFixed(2),
        final_amount: totals.netValue.toFixed(2),
        currency: formData.currency,
        industry: formData.industry || "",
        order_approval_status: formData.order_approval_status || "",
        fulfillment_status: formData.fulfillment_status || "",
        payment_status: formData.payment_status || "",
        items: formData.items.map(item => ({
          id: item.id,
          product_id: String(item.product_id),
          product_name: item.product_name,
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
      />
      <div className="container-fluid">
        {/* Edit Order Form */}
        <div className="row">
          <div className="col-12">
            <Card className="border-0 shadow-sm">
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="mb-0 app-heading">Order Information</h4>
                  <Link href="/crm/orders">
                    <Button variant="outline-secondary" size="sm">
                      <ArrowLeft size={16} className="me-2" />
                      Back to Orders
                    </Button>
                  </Link>
                </div>
              </Card.Header>
              <Card.Body>
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
                        <Form.Label>Company Name <span className="text-danger">*</span></Form.Label>
                        <Form.Control 
                          type="text" 
                          value={formData.customer_name}
                          onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                          placeholder="Enter company name" 
                          required 
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Company Email <span className="text-danger">*</span></Form.Label>
                        <Form.Control 
                          type="email" 
                          value={formData.customer_email}
                          onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                          placeholder="company@example.com" 
                          required 
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Company Phone <span className="text-danger">*</span></Form.Label>
                        <div className="phone-input-wrapper">
                          <PhoneInput
                            international
                            defaultCountry="US"
                            value={formData.customer_phone_country_code && formData.customer_phone 
                              ? `${formData.customer_phone_country_code}${formData.customer_phone}` 
                              : formData.customer_phone || undefined}
                            onChange={(value) => {
                              if (value) {
                                try {
                                  // Parse the phone number to extract country code and national number
                                  const phoneNumber = parsePhoneNumber(value);
                                  if (phoneNumber) {
                                    setFormData({
                                      ...formData,
                                      customer_phone_country_code: `+${phoneNumber.countryCallingCode}`,
                                      customer_phone: phoneNumber.nationalNumber,
                                    });
                                  } else {
                                    // Fallback: store full number in phone field
                                    setFormData({
                                      ...formData,
                                      customer_phone_country_code: "",
                                      customer_phone: value,
                                    });
                                  }
                                } catch (error) {
                                  // If parsing fails, store full number in phone field
                                  setFormData({
                                    ...formData,
                                    customer_phone_country_code: "",
                                    customer_phone: value,
                                  });
                                }
                              } else {
                                setFormData({
                                  ...formData,
                                  customer_phone_country_code: "",
                                  customer_phone: "",
                                });
                              }
                            }}
                            placeholder="Enter phone number"
                          />
                        </div>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Company Address</Form.Label>
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
                                          total_price: (parseFloat(item.quantity || "0") * (parseFloat(product.price) || item.unit_price)).toFixed(2),
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
                         
                          <option value="AED">AED</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Industry</Form.Label>
                        <Form.Select 
                          value={formData.industry}
                          onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        >
                          <option value="">Select Industry</option>
                          <option value="Individual/Residential">Individual/Residential</option>
                          <option value="Corporate">Corporate</option>
                          <option value="Retail">Retail</option>
                          <option value="Office">Office</option>
                          <option value="Mixed-use">Mixed-use</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Order Approval Status</Form.Label>
                        <Form.Select 
                          value={formData.order_approval_status}
                          onChange={(e) => setFormData({ ...formData, order_approval_status: e.target.value })}
                        >
                          <option value="">Not Set</option>
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Fulfillment Status</Form.Label>
                        <Form.Select 
                          value={formData.fulfillment_status}
                          onChange={(e) => setFormData({ ...formData, fulfillment_status: e.target.value })}
                        >
                          <option value="">Not Set</option>
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Payment Status</Form.Label>
                        <Form.Select 
                          value={formData.payment_status}
                          onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                        >
                          <option value="">Not Set</option>
                          <option value="unpaid">Unpaid</option>
                          <option value="partial">Partial</option>
                          <option value="paid">Paid</option>
                          <option value="refunded">Refunded</option>
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
                        <Form.Select
                          value={(formData.standard_discount_percentage && parseFloat(formData.standard_discount_percentage))}
                          onChange={(e) => setFormData({ ...formData, standard_discount_percentage: e.target.value })}
                        >
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="10">10%</option>
                          <option value="15">15%</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    {extensions?.length > 1 && <Col md={4}>
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
                    </Col>}
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
                  <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'flex-end' }}>
                    <div className="table-responsive custom-table-order" style={{ maxWidth: '900px', width: '100%' }}>
                      <style dangerouslySetInnerHTML={{__html: `
                        .custom-table-order th:first-of-type,
                        .custom-table-order td:first-of-type {
                          width: auto !important;
                          min-width: auto !important;
                          max-width: none !important;
                          white-space: normal !important;
                        }
                        .custom-table-order th:last-of-type,
                        .custom-table-order td:last-of-type {
                          width: auto !important;
                          min-width: auto !important;
                          max-width: none !important;
                          white-space: normal !important;
                        }
                      `}} />
                      <Table hover style={{ width: '100%', marginBottom: 0, tableLayout: 'auto', margin: '0 auto' }}>
                        <thead style={{ background: '#f8f9fa' }}>
                          <tr>
                            <th>#</th>
                            <th>Product Name</th>
                            <th>SKU</th>
                            <th>Quantity</th>
                            {formData.items.some((item) => item.description) && <th>Description</th>}
                            <th>Unit Price</th>
                            <th style={{
                              maxWidth: '100px',
                              minWidth: 'unset',
                            }}>Total Price</th>
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
                                <td className="fw-semibold">{item.product_name || 'N/A'}</td>
                                <td>{product?.sku || 'N/A'}</td>
                                <td>{item.quantity || '0'}</td>
                                {formData.items.some((i) => i.description) && (
                                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {item.description || '-'}
                                  </td>
                                )}
                                <td>
                                  {formData.currency || 'AED'} {parseFloat(String(item.unit_price || '0')).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  {showConversionInfo && (
                                    <div className="small text-muted">
                                      Original: {formatCurrency(item.original_price || item.unit_price, item.original_currency || formData.currency)}
                                    </div>
                                  )}
                                </td>
                                <td style={{
                                  maxWidth: '100px',
                                  minWidth: 'unset',
                                }} className="fw-semibold">
                                  {formData.currency || 'AED'} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
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
                                      setFormData({
                                        ...formData,
                                        items: formData.items.filter((_, i) => i !== index)
                                      });
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
                              <td colSpan={formData.items.some((item) => item.description) ? 8 : 7} className="text-center text-muted py-4">
                                <Package size={32} className="text-muted mb-2" />
                                <div>No items in order</div>
                                <small>Click "Add Item" to add products or services</small>
                              </td>
                            </tr>
                          )}
                        </tbody>
                        {formData.items.length > 0 && (
                          <tfoot style={{ background: '#f8f9fa', fontWeight: 600 }}>
                            <tr>
                              <td colSpan={formData.items.some((item) => item.description) ? 6 : 5} className="text-end">Subtotal:</td>
                              <td style={{
                                maxWidth: '100px',
                                minWidth: 'unset',
                              }}>{formData.currency || 'AED'} {totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td></td>
                            </tr>
                            {totals.totalDiscount > 0 && (
                              <tr>
                                <td colSpan={formData.items.some((item) => item.description) ? 6 : 5} className="text-end">
                                  Discount ({parseFloat(formData.standard_discount_percentage || "0") + parseFloat(formData.special_discount_percentage || "0")}%):
                                </td>
                                <td style={{
                                  maxWidth: '100px',
                                  minWidth: 'unset',
                                }}>- {formData.currency || 'AED'} {totals.totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td></td>
                              </tr>
                            )}
                            {parseFloat(formData.tax_percentage || "0") > 0 && (
                              <tr>
                                <td colSpan={formData.items.some((item) => item.description) ? 6 : 5} className="text-end">Tax ({formData.tax_percentage}%):</td>
                                <td style={{
                                  maxWidth: '100px',
                                  minWidth: 'unset',
                                }}>{formData.currency || 'AED'} {totals.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td></td>
                              </tr>
                            )}
                            <tr style={{ fontSize: '16px' }}>
                              <td colSpan={formData.items.some((item) => item.description) ? 6 : 5} className="text-end">Total:</td>
                              <td style={{
                                maxWidth: '100px',
                                minWidth: 'unset',
                              }}>{formData.currency || 'AED'} {totals.netValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td></td>
                            </tr>
                          </tfoot>
                        )}
                      </Table>
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
                      <h6 className="fw-bold mb-3">Items</h6>
                      <div style={{ marginBottom: '30px', width: '100%' }}>
                        <style dangerouslySetInnerHTML={{__html: `
                          .review-items-table-wrapper {
                            width: 100%;
                            overflow-x: auto;
                          }
                          .review-items-table-wrapper .table-responsive {
                            width: 100%;
                            border-radius: 8px;
                            overflow: hidden;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                          }
                          .review-items-table-wrapper table {
                            width: 100%;
                            margin: 0;
                            border-collapse: separate;
                            border-spacing: 0;
                            table-layout: auto;
                          }
                          .review-items-table-wrapper thead th {
                            background: #f8f9fa !important;
                            padding: 12px 16px !important;
                            font-size: 0.875rem;
                            font-weight: 600;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            color: #495057;
                            border-bottom: 2px solid #dee2e6;
                            white-space: nowrap;
                          }
                          .review-items-table-wrapper thead th:first-of-type {
                            width: 50px !important;
                            min-width: 50px !important;
                            text-align: center;
                          }
                          .review-items-table-wrapper tbody td {
                            padding: 14px 16px !important;
                            font-size: 0.875rem;
                            vertical-align: middle;
                            border-bottom: 1px solid #f0f0f0;
                            background: #fff;
                            word-wrap: break-word;
                            overflow-wrap: break-word;
                          }
                          .review-items-table-wrapper tbody td:first-of-type {
                            width: 50px !important;
                            min-width: 50px !important;
                            text-align: center;
                            color: #6c757d;
                            font-weight: 500;
                          }
                          .review-items-table-wrapper tbody td:nth-last-child(2),
                          .review-items-table-wrapper thead th:nth-last-child(2) {
                            min-width: 150px !important;
                            white-space: nowrap;
                          }
                          .review-items-table-wrapper tbody td:nth-last-child(3),
                          .review-items-table-wrapper thead th:nth-last-child(3) {
                            min-width: 140px !important;
                            white-space: nowrap;
                          }
                          .review-items-table-wrapper tbody tr:hover {
                            background-color: #f8f9fa;
                          }
                          .review-items-table-wrapper tbody tr:last-child td {
                            border-bottom: none;
                          }
                          .review-items-table-wrapper tfoot td {
                            padding: 12px 16px !important;
                            background: #f8f9fa !important;
                            font-size: 0.875rem;
                            border-top: 2px solid #dee2e6;
                            white-space: nowrap;
                          }
                          .review-items-table-wrapper tfoot td:first-of-type {
                            width: auto !important;
                            min-width: auto !important;
                            max-width: none !important;
                          }
                          .review-items-table-wrapper tfoot td:last-of-type {
                            width: auto !important;
                            min-width: 150px !important;
                            max-width: none !important;
                            text-align: right;
                            font-weight: 600;
                          }
                          .review-items-table-wrapper tfoot tr:last-child td:first-of-type {
                            padding-left: 20px !important;
                          }
                          .review-items-table-wrapper tfoot tr:last-child td:last-of-type {
                            padding-right: 20px !important;
                          }
                        `}} />
                        <div className="review-items-table-wrapper">
                          <div className="table-responsive" style={{ width: '100%' }}>
                            <Table hover style={{ marginBottom: 0 }}>
                              <thead>
                                <tr>
                                  <th>#</th>
                                  <th style={{ minWidth: '200px' }}>Product Name</th>
                                  <th style={{ minWidth: '120px' }}>SKU</th>
                                  <th style={{ minWidth: '80px', textAlign: 'center' }}>Qty</th>
                                  {formData.items.some((item) => item.description) && <th style={{ minWidth: '180px' }}>Description</th>}
                                  <th style={{ minWidth: '140px', textAlign: 'right' }}>Unit Price</th>
                                  <th style={{ minWidth: '150px', textAlign: 'right' }}>Total Price</th>
                                </tr>
                              </thead>
                              <tbody>
                                {formData.items.map((item, index) => {
                                  const subtotal = parseFloat(item.quantity || "0") * item.unit_price;
                                  const product = products.find(p => p.id === item.product_id);
                                  return (
                                    <tr key={index}>
                                      <td>{index + 1}</td>
                                      <td className="fw-semibold" style={{ color: '#212529' }}>{item.product_name || 'N/A'}</td>
                                      <td style={{ color: '#6c757d', fontSize: '0.813rem' }}>{product?.sku || 'N/A'}</td>
                                      <td style={{ textAlign: 'center', fontWeight: 500, whiteSpace: 'nowrap' }}>{item.quantity || '0'}</td>
                                      {formData.items.some((i) => i.description) && (
                                        <td style={{ 
                                          maxWidth: '180px', 
                                          overflow: 'hidden', 
                                          textOverflow: 'ellipsis', 
                                          whiteSpace: 'nowrap',
                                          color: '#6c757d',
                                          fontSize: '0.813rem'
                                        }}>
                                          {item.description || '-'}
                                        </td>
                                      )}
                                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                        <div style={{ fontWeight: 500 }}>
                                          {formData.currency || 'AED'} {parseFloat(String(item.unit_price || '0')).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                      </td>
                                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#212529', whiteSpace: 'nowrap' }}>
                                        {formData.currency || 'AED'} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              {formData.items.length > 0 && (
                                <tfoot>
                                  <tr>
                                    <td colSpan={formData.items.some((item) => item.description) ? 6 : 5} style={{ textAlign: 'right', paddingRight: '20px' }}>
                                      <strong>Subtotal:</strong>
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                      {formData.currency || 'AED'} {totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                  {totals.totalDiscount > 0 && (
                                    <tr>
                                      <td colSpan={formData.items.some((item) => item.description) ? 6 : 5} style={{ textAlign: 'right', paddingRight: '20px' }}>
                                        <span style={{ color: '#6c757d' }}>
                                          Discount ({parseFloat(formData.standard_discount_percentage || "0") + parseFloat(formData.special_discount_percentage || "0")}%):
                                        </span>
                                      </td>
                                      <td style={{ textAlign: 'right', color: '#dc3545', whiteSpace: 'nowrap' }}>
                                        - {formData.currency || 'AED'} {totals.totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                    </tr>
                                  )}
                                  {parseFloat(formData.tax_percentage || "0") > 0 && (
                                    <tr>
                                      <td colSpan={formData.items.some((item) => item.description) ? 6 : 5} style={{ textAlign: 'right', paddingRight: '20px' }}>
                                        <strong>Tax ({formData.tax_percentage}%):</strong>
                                      </td>
                                      <td style={{ textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                        {formData.currency || 'AED'} {totals.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                    </tr>
                                  )}
                                  <tr style={{ fontSize: '1rem', borderTop: '2px solid #dee2e6' }}>
                                    <td colSpan={formData.items.some((item) => item.description) ? 6 : 5} style={{ textAlign: 'right', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px', paddingLeft: '20px' }}>
                                      <strong style={{ fontSize: '1rem' }}>Total:</strong>
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '1rem', color: '#198754', paddingTop: '16px', paddingBottom: '16px', paddingRight: '20px', whiteSpace: 'nowrap' }}>
                                      {formData.currency || 'AED'} {totals.netValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                </tfoot>
                              )}
                            </Table>
                          </div>
                        </div>
                      </div>
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
                  onClick={handleNextStep}
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
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

EditOrder.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default EditOrder;

