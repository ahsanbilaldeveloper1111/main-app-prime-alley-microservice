import React, { useState, useEffect, useRef } from "react";
import {
  updateOrder,
  updateOrderAccount,
  updateOrderDelivery,
  getOrder,
  getStages,
  StageData,
  getCrmProducts,
  CrmProduct,
} from "@utils/crm";
import { Button, Row, Col, Form, Card, Modal, Table } from "react-bootstrap";
import Select from "react-select";
import PhoneInput from "react-phone-number-input";
import { parsePhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { CheckCircle, ChevronLeft, ChevronRight, Plus, Edit, Trash2, Package, X } from "lucide-react";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
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

interface OrderEditModalProps {
  show: boolean;
  onHide: () => void;
  orderId: number;
  onSuccess?: () => void;
  isDeliveryRole: boolean;
  isAccountRole: boolean;
}

const OrderEditModal: React.FC<OrderEditModalProps> = ({ show, onHide, orderId, onSuccess, isDeliveryRole, isAccountRole }) => {
  const { data: session } = useSession();
  //const isRootUser = Number((session?.user as { is_admin?: number | string })?.is_admin) === 1 || String((session?.user as { is_admin?: number | string })?.is_admin) === '1';



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
  const [extensions, setExtensions] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_phone_country_code: "",
    customer_address: "",
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: "",
    actual_delivery_date: "",
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
    contract_type: "",
    contract_length: "",
    contract_start_date: "",
    contract_end_date: "",
    auto_renewal: "",
    poc_title: "",
    poc_name: "",
    poc_phone_country_code: "",
    poc_phone: "",
    billing_model: "",
    billing_status: "",
    payment_terms: "",
    payment_terms_custom: "",
  });

  // Fetch initial data
  useEffect(() => {
    if (show) {
      fetchStages();
      fetchProducts();
      fetchExtensions();
      fetchOrderData();
    }
  }, [show, orderId]);

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

  const fetchOrderData = async () => {
    try {
      setFetching(true);
      const order = await getOrder(orderId);
      
      const formatDate = (dateString: string | null) => {
        if (!dateString) return "";
        return dateString.split('T')[0];
      };

      const parsePhoneNumberFormat = (phone: string): { countryCode: string; phoneNumber: string } => {
        if (!phone) return { countryCode: "", phoneNumber: "" };
        
        try {
          const phoneNumber = parsePhoneNumber(phone);
          if (phoneNumber) {
            return {
              countryCode: `+${phoneNumber.countryCallingCode}`,
              phoneNumber: phoneNumber.nationalNumber,
            };
          }
        } catch (error) {
          const match = phone.match(/^(\+\d{1,4})\s+(.+)$/);
          if (match) {
            return {
              countryCode: match[1],
              phoneNumber: match[2],
            };
          }
        }
        
        return { countryCode: "", phoneNumber: phone };
      };

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

      const grandTotal = transformedItems.reduce((sum, item) => sum + parseFloat(item.total_price || "0"), 0);
      const taxAmount = parseFloat(order.tax_amount || "0");
      const discountAmount = parseFloat(order.discount_amount || "0");
      const taxPercentage = grandTotal > 0 ? ((taxAmount / (grandTotal - discountAmount)) * 100).toFixed(2) : "0";
      const discountPercentage = grandTotal > 0 ? ((discountAmount / grandTotal) * 100).toFixed(2) : "0";

      const parsedPhone = parsePhoneNumberFormat(order.customer_phone || "");

      setFormData({
        customer_name: order.customer_name || "",
        customer_email: order.customer_email || "",
        customer_phone: parsedPhone.phoneNumber,
        customer_phone_country_code: parsedPhone.countryCode,
        customer_address: order.customer_address || "",
        order_date: formatDate(order.order_date),
        expected_delivery_date: formatDate(order.expected_delivery_date),
        actual_delivery_date: formatDate(order.actual_delivery_date),
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
        contract_type: order.contract_type || "",
        contract_length: order.contract_length || "",
        contract_start_date: order.contract_start_date || "",
        contract_end_date: order.contract_end_date || "",
        auto_renewal: (() => {
          const v = order?.auto_renewal;
          const s = v != null ? String(v).toLowerCase().trim() : "";
          if (s === "yes" || v === true) return "yes";
          if (s === "no" || v === false) return "no";
          return "n/a";
        })(),
        poc_title: order.poc_title || "",
        poc_name: order.poc_name || "",
        poc_phone_country_code: order.poc_phone_country_code || "",
        poc_phone: order.poc_phone || "",
        billing_model: order.billing_model || "",
        billing_status: order.billing_status || "",
        payment_terms: order.payment_terms || "",
        payment_terms_custom: order.payment_terms_custom || "",
      });
      
      isInitialLoad.current = false;
    } catch (error) {
      console.error("Failed to fetch order:", error);
      toast.error("Failed to load order data");
      onHide();
    } finally {
      setFetching(false);
    }
  };

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
    if (!formData.items || formData.items.length === 0) {
      toast.error('Please add at least one item to the order');
      return false;
    }
    return true;
  };

  const validateCurrentStep = (): boolean => {
    switch (formStep) {
      case 0:
        return validateStep0();
      case 1:
        return validateStep1();
      case 2:
        return true;
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

    if (!validateStep0() || !validateStep1()) {
      return;
    }

    setLoading(true);
    try {
      const totals = calculateTotals();
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
        actual_delivery_date: formData.actual_delivery_date || "",
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

        contract_type: formData.contract_type,
        contract_length: formData.contract_length,
        contract_start_date: formData.contract_start_date,
        contract_end_date: formData.contract_end_date,
        auto_renewal: formData.auto_renewal,

        poc_title: formData.poc_title,
        poc_name: formData.poc_name,
        poc_phone_country_code: formData.poc_phone_country_code,
        poc_phone: formData.poc_phone,

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

      await updateOrder(orderId, payload);
      
      onSuccess?.();
      onHide();
    } catch (error: any) {
      console.error("Failed to update order:", error);
      toast.error(error?.response?.data?.message || "Failed to update order");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    // if (formStep < 2) {
    //   setFormStep(formStep + 1);
    //   return;
    // }

    // if (!validateStep0() || !validateStep1()) {
    //   return;
    // }

    setLoading(true);
    try {
      const totals = calculateTotals();
      const formattedPhone = formData.customer_phone_country_code && formData.customer_phone
        ? `${formData.customer_phone_country_code} ${formData.customer_phone}`
        : formData.customer_phone;
      
      const payload: any = {
        total_amount: totals.grandTotal.toFixed(2),
        tax_amount: totals.taxAmount.toFixed(2),
        discount_amount: totals.totalDiscount.toFixed(2),
        final_amount: totals.netValue.toFixed(2),
        billing_model: formData.billing_model || "",
        billing_status: formData.billing_status || "",
        payment_terms: formData.payment_terms || "",
        payment_terms_custom: formData.payment_terms_custom || "",
        payment_status: formData.payment_status || "",
        order_approval_status: formData.order_approval_status || "",
        currency: formData.currency,
        contract_type: formData.contract_type || "",
        contract_length: formData.contract_length || "",
        contract_start_date: formData.contract_start_date,
        contract_end_date: formData.contract_end_date,
        auto_renewal: formData.auto_renewal,

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

      await updateOrderAccount(orderId, payload);
     
      onSuccess?.();
      onHide();
    } catch (error: any) {
      console.error("Failed to update order:", error);
      toast.error(error?.response?.data?.message || "Failed to update order");
    } finally {
      setLoading(false);
    }
  };


  const handleSubmitDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    // if (formStep < 2) {
    //   setFormStep(formStep + 1);
    //   return;
    // }

    // if (!validateStep0() || !validateStep1()) {
    //   return;
    // }

    setLoading(true);
    try {
      const totals = calculateTotals();
      const formattedPhone = formData.customer_phone_country_code && formData.customer_phone
        ? `${formData.customer_phone_country_code} ${formData.customer_phone}`
        : formData.customer_phone;
      
      const payload: any = {
        customer_address: formData.customer_address || "",
        expected_delivery_date: formData.expected_delivery_date || "",
        actual_delivery_date: formData.actual_delivery_date || "",
        fulfillment_status: formData.fulfillment_status || "",
        poc_title: formData.poc_title,
        poc_name: formData.poc_name,
        poc_phone_country_code: formData.poc_phone_country_code,
        poc_phone: formData.poc_phone,

      };

      await updateOrderDelivery(orderId, payload);
      
      onSuccess?.();
      onHide();
    } catch (error: any) {
      console.error("Failed to update order:", error);
      toast.error(error?.response?.data?.message || "Failed to update order");
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  // Reset form step when modal closes
  useEffect(() => {
    if (!show) {
      setFormStep(0);
      isInitialLoad.current = true;
    }
  }, [show]);

  return (
    <>

    {(isAccountRole) && (
     <>
      <Modal
        show={show}
        onHide={onHide}
        size="xl"
        centered
        className="order-edit-modal"
        backdrop="static"
      >
        <Modal.Header className="border-0 pb-0">
          <Modal.Title>
            <h4 className="mb-0 app-heading">Edit Order #{orderId}</h4>
          </Modal.Title>
          <button
          className="btn-close"
            onClick={onHide}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              padding: "0.5rem",
              lineHeight: 1,
            }}
          >
            <X size={24} />
          </button>
        </Modal.Header>

        <Modal.Body style={{ maxHeight: "calc(90vh - 200px)", overflowY: "auto" }}>
          
          {fetching ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading order data...</p>
            </div>
          ) : (
            <Form onSubmit={handleSubmitAccount}>
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
                        {/* <Col md={6}>
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
                        </Col> */}
                        {/* <Col md={6}>
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
                        </Col> */}
                        {/* <Col md={6}>
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
                                      const phoneNumber = parsePhoneNumber(value);
                                      if (phoneNumber) {
                                        setFormData({
                                          ...formData,
                                          customer_phone_country_code: `+${phoneNumber.countryCallingCode}`,
                                          customer_phone: phoneNumber.nationalNumber,
                                        });
                                      } else {
                                        setFormData({
                                          ...formData,
                                          customer_phone_country_code: "",
                                          customer_phone: value,
                                        });
                                      }
                                    } catch (error) {
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
                        </Col> */}

                        {/* <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Order Date <span className="text-danger">*</span></Form.Label>
                            <Form.Control 
                              type="date" 
                              value={formData.order_date}
                              onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                              required 
                            />
                          </Form.Group>
                        </Col> */}

                        {/* <Col md={6}>
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
                        </Col> */}
                       
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Currency <span className="text-danger">*</span></Form.Label>
                            <Form.Select 
                              value={formData.currency}
                              onChange={async (e) => {
                                const newCurrency = e.target.value;
                                setFormData({ ...formData, currency: newCurrency });
                                
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
                                          
                                          if (productCurrency === newOrderCurrency) {
                                            return {
                                              ...item,
                                              unit_price: parseFloat(product.price) || item.unit_price,
                                              total_price: (parseFloat(item.quantity || "0") * (parseFloat(product.price) || item.unit_price)).toFixed(2),
                                            };
                                          }
                                          
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
                      
                        {/* <Col md={6}>
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
                        </Col> */}
                        
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
                            <Form.Label>Contract Type</Form.Label>
                            <Form.Select 
                              value={formData.contract_type}
                              onChange={(e) => setFormData({ ...formData, contract_type: e.target.value })}
                            >
                              <option value="">Not Set</option>
                              <option value="subscription">Subscription</option>
                              <option value="one-time">One-time</option>
                              <option value="maintenance">Maintenance</option>
                              <option value="sla">SLA</option>
                              <option value="custom">Custom</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>

                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Billing Model</Form.Label>
                            <Form.Select 
                              value={formData.billing_model}
                              onChange={(e) => setFormData({ ...formData, billing_model: e.target.value })}
                            >
                              <option value="">Select Model</option>
                              <option value="monthly">Monthly</option>
                              <option value="quarterly">Quarterly</option>
                              <option value="annual">Annual</option>
                              <option value="usage-based">Usage-based</option>
                              <option value="hybrid">Hybrid</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Billing Status</Form.Label>
                            <Form.Select 
                              value={formData.billing_status}
                              onChange={(e) => setFormData({ ...formData, billing_status: e.target.value })}
                            >
                              <option value="">Select Status</option>
                              <option value="not_billed">Not Billed</option>
                              <option value="partially_billed">Partially Billed</option>
                              <option value="fully_billed">Fully Billed</option>
                              <option value="on_hold">On Hold</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>

                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Payment Terms</Form.Label>
                            <Form.Select 
                              value={formData.payment_terms}
                              onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                            >
                              <option value="">Select Terms</option>
                              <option value="due_upon_receipt">Due Upon Receipt</option>
                              <option value="net_15">Net 60</option>
                              <option value="net_30">Net 30</option>
                              <option value="net_45">Net 45</option>
                              <option value="net_60">Net 60</option>
                              <option value="advance">Advance</option>
                              <option value="milestone">Milestone</option>
                              <option value="installments">Installments</option>
                              <option value="custom">Custom</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        {formData.payment_terms === "custom" && (
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Payment Terms Custom</Form.Label>
                            <Form.Control type="text" value={formData.payment_terms_custom} onChange={(e) => setFormData({ ...formData, payment_terms_custom: e.target.value })} />
                          </Form.Group>
                        </Col>
                        )}

                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Contract Length</Form.Label>
                            <Form.Select 
                              value={formData.contract_length}
                              onChange={(e) => setFormData({ ...formData, contract_length: e.target.value })}
                            >
                              <option value="">Not Set</option>
                              <option value="1 month">1 month</option>
                              <option value="3 months">3 months</option>
                              <option value="6 months">6 months</option>
                              <option value="12 months">12 months</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>

                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Contract Start Date</Form.Label>
                            <Form.Control type="date" value={formData.contract_start_date} onChange={(e) => setFormData({ ...formData, contract_start_date: e.target.value })} />
                          </Form.Group>
                        </Col>

                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Contract End Date</Form.Label>
                            <Form.Control type="date" value={formData.contract_end_date} onChange={(e) => setFormData({ ...formData, contract_end_date: e.target.value })} />
                          </Form.Group>
                        </Col>

                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Auto Renewal</Form.Label>
                            <Form.Select 
                              value={formData.auto_renewal}
                              onChange={(e) => setFormData({ ...formData, auto_renewal: e.target.value })}
                            >
                              <option value="n/a">N/A</option>
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
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

                      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'flex-end' }}>
                        <div className="table-responsive custom-table-order" style={{ maxWidth: '900px', width: '100%' }}>
                          <Table hover style={{ width: '100%', marginBottom: 0, tableLayout: 'auto', margin: '0 auto' }}>
                            <thead style={{ background: '#f8f9fa' }}>
                              <tr>
                                <th>#</th>
                                <th>Product Name</th>
                                <th>SKU</th>
                                <th>Quantity</th>
                                {formData.items.some((item) => item.description) && <th>Description</th>}
                                <th>Unit Price</th>
                                <th>Total Price</th>
                                
                                  {/* <th>Actions</th> */}
                                
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
                                    <td className="fw-semibold">
                                      {formData.currency || 'AED'} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                   
                                    {/* <td>
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
                                    </td> */}
                                    
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
                                  <td>{formData.currency || 'AED'} {totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td></td>
                                </tr>
                                {totals.totalDiscount > 0 && (
                                  <tr>
                                    <td colSpan={formData.items.some((item) => item.description) ? 6 : 5} className="text-end">
                                      Discount ({parseFloat(formData.standard_discount_percentage || "0") + parseFloat(formData.special_discount_percentage || "0")}%):
                                    </td>
                                    <td>- {formData.currency || 'AED'} {totals.totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td></td>
                                  </tr>
                                )}
                                {parseFloat(formData.tax_percentage || "0") > 0 && (
                                  <tr>
                                    <td colSpan={formData.items.some((item) => item.description) ? 6 : 5} className="text-end">Tax ({formData.tax_percentage}%):</td>
                                    <td>{formData.currency || 'AED'} {totals.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td></td>
                                  </tr>
                                )}
                                <tr style={{ fontSize: '16px' }}>
                                  <td colSpan={formData.items.some((item) => item.description) ? 6 : 5} className="text-end">Total:</td>
                                  <td>{formData.currency || 'AED'} {totals.netValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
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

                {/* Step 2: Review - Similar structure to edit page */}
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
                          <p><strong>Billing Model:</strong> {formData.billing_model}</p>
                          <p><strong>Billing Status:</strong> {formData.billing_status}</p>
                          <p><strong>Payment Terms:</strong> {formData.payment_terms}</p>
                          <p><strong>Payment Terms Custom:</strong> {formData.payment_terms_custom}</p>
                          <p><strong>Payment Status:</strong> {formData.payment_status}</p>
                          <p><strong>Order Approval Status:</strong> {formData.order_approval_status}</p>
                          <p><strong>Contract Type:</strong> {formData.contract_type}</p>
                          <p><strong>Contract Length:</strong> {formData.contract_length}</p>
                          <p><strong>Contract Start Date:</strong> {formData.contract_start_date}</p>
                          <p><strong>Contract End Date:</strong> {formData.contract_end_date}</p>
                          <p><strong>Auto Renewal:</strong> {formData.auto_renewal}</p>
                          

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
                          <h6 className="fw-bold mb-3">Items Summary</h6>
                          <p><strong>Total Items:</strong> {formData.items.length}</p>
                          <p><strong>Subtotal:</strong> {formData.currency} {totals.grandTotal.toFixed(2)}</p>
                          {totals.totalDiscount > 0 && (
                            <p><strong>Discount:</strong> {formData.currency} {totals.totalDiscount.toFixed(2)}</p>
                          )}
                          {totals.taxAmount > 0 && (
                            <p><strong>Tax:</strong> {formData.currency} {totals.taxAmount.toFixed(2)}</p>
                          )}
                          <p className="fw-bold"><strong>Grand Total:</strong> {formData.currency} {totals.netValue.toFixed(2)}</p>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                )}
              </div>
            </Form>
          )}
        </Modal.Body>

        <Modal.Footer className="border-0">
          <div className="d-flex justify-content-between w-100">
            <Button 
              variant="secondary" 
              onClick={(e) => {
                e.preventDefault();
                if (formStep > 0) {
                  setFormStep(formStep - 1);
                } else {
                  onHide();
                }
              }}
              disabled={loading}
            >
              {formStep > 0 ? <><ChevronLeft size={16} className="me-1" /> Previous</> : 'Cancel'}
            </Button>
            <div className="d-flex gap-2">
              {formStep < 2 ? (
                <Button 
                  variant="primary"
                  onClick={handleNextStep}
                  disabled={loading}
                >
                  Next <ChevronRight size={16} className="ms-1" />
                </Button>
              ) : (
                <Button variant="primary" onClick={handleSubmitAccount} disabled={loading}>
                  {loading ? 'Updating...' : 'Update Order'}
                </Button>
              )}
            </div>
          </div>
        </Modal.Footer>
      </Modal>
     </>
    )}


{(isDeliveryRole) && (
     <>
     <Modal
        show={show}
        onHide={onHide}
        size="xl"
        centered
        className="order-edit-modal"
        backdrop="static"
      >
        <Modal.Header className="border-0 pb-0">
          <Modal.Title>
            <h4 className="mb-0 app-heading">Edit Order #{orderId}</h4>
          </Modal.Title>
          <button
          className="btn-close"
            onClick={onHide}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              padding: "0.5rem",
              lineHeight: 1,
            }}
          >
            <X size={24} />
          </button>
        </Modal.Header>

        <Modal.Body style={{ maxHeight: "calc(90vh - 200px)", overflowY: "auto" }}>
          {fetching ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading order data...</p>
            </div>
          ) : (
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
                      <h5 className="fw-bold mb-4 text-primary">ORDER INFORMATION 2</h5>
                      <Row>
                        
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
                            <Form.Label>Actual Delivery Date</Form.Label>
                            <Form.Control type="date" value={formData.actual_delivery_date} onChange={(e) => setFormData({ ...formData, actual_delivery_date: e.target.value })} />
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
                              <option value="fulfilled">Fulfilled</option>
                              <option value="not_fulfilled">Not Fulfilled</option>
                              <option value="payment_done">Payment Done</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>

                      

                        <Col md={6}>  <Form.Group className="mb-3">
                            <Form.Label>POC Title</Form.Label>
                            <Form.Select 
                              value={formData.poc_title}
                              onChange={(e) => setFormData({ ...formData, poc_title: e.target.value })}
                            >
                              <option value="">Select Title</option>
                              <option value="Mr.">Mr.</option>
                              <option value="Mrs.">Mrs.</option>
                              <option value="Ms.">Ms.</option>
                              <option value="Dr.">Dr.</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={6}>  <Form.Group className="mb-3">
                            <Form.Label>POC Name</Form.Label>
                            <Form.Control type="text" placeholder="Enter poc name" value={formData.poc_name} onChange={(e) => setFormData({ ...formData, poc_name: e.target.value })} />
                          </Form.Group>
                        </Col>
                        <Col md={6}>  
                        <Form.Label>Poc Phone <span className="text-danger">*</span></Form.Label>
                        <div className="phone-input-wrapper">
                              <PhoneInput
                                international
                                defaultCountry="US"
                                value={formData.poc_phone_country_code && formData.poc_phone 
                                  ? `${formData.poc_phone_country_code}${formData.poc_phone}` 
                                  : formData.poc_phone || undefined}
                                onChange={(value) => {
                                  if (value) {
                                    try {
                                      const phoneNumber = parsePhoneNumber(value);
                                      if (phoneNumber) {
                                        setFormData({
                                          ...formData,
                                          poc_phone_country_code: `+${phoneNumber.countryCallingCode}`,
                                          poc_phone: phoneNumber.nationalNumber,
                                        });
                                      } else {
                                        setFormData({
                                          ...formData,
                                          poc_phone_country_code: "",
                                          poc_phone: value,
                                        });
                                      }
                                    } catch (error) {
                                      setFormData({
                                        ...formData,
                                        poc_phone_country_code: "",
                                        poc_phone: value,
                                      });
                                    }
                                  } else {
                                    setFormData({
                                      ...formData,
                                      poc_phone_country_code: "",
                                      poc_phone: "",
                                    });
                                  }
                                }}
                                placeholder="Enter phone number"
                              />
                            </div>
                        </Col>
                      
                       
                      </Row>
                    </Card.Body>
                  </Card>
                )}

                {/* Step 1: Order Items */}
                {formStep === 1 && (
                  <Card className="mb-3 border-0 bg-light">
                    <Card.Body>

                      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'flex-end' }}>
                        <div className="table-responsive custom-table-order" style={{ maxWidth: '900px', width: '100%' }}>
                          <Table hover style={{ width: '100%', marginBottom: 0, tableLayout: 'auto', margin: '0 auto' }}>
                            <thead style={{ background: '#f8f9fa' }}>
                              <tr>
                                <th>#</th>
                                <th>Product Name</th>
                                <th>SKU</th>
                                <th>Quantity</th>
                                {formData.items.some((item) => item.description) && <th>Description</th>}
                                <th>Unit Price</th>
                                <th>Total Price</th>
                               
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
                                    <td className="fw-semibold">
                                      {formData.currency || 'AED'} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                                  <td>{formData.currency || 'AED'} {totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td></td>
                                </tr>
                                {totals.totalDiscount > 0 && (
                                  <tr>
                                    <td colSpan={formData.items.some((item) => item.description) ? 6 : 5} className="text-end">
                                      Discount ({parseFloat(formData.standard_discount_percentage || "0") + parseFloat(formData.special_discount_percentage || "0")}%):
                                    </td>
                                    <td>- {formData.currency || 'AED'} {totals.totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td></td>
                                  </tr>
                                )}
                                {parseFloat(formData.tax_percentage || "0") > 0 && (
                                  <tr>
                                    <td colSpan={formData.items.some((item) => item.description) ? 6 : 5} className="text-end">Tax ({formData.tax_percentage}%):</td>
                                    <td>{formData.currency || 'AED'} {totals.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td></td>
                                  </tr>
                                )}
                                <tr style={{ fontSize: '16px' }}>
                                  <td colSpan={formData.items.some((item) => item.description) ? 6 : 5} className="text-end">Total:</td>
                                  <td>{formData.currency || 'AED'} {totals.netValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
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

                {/* Step 2: Review - Similar structure to edit page */}
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

                          {isAccountRole && (
                           <>
                            <p><strong>Billing Model:</strong> {formData.billing_model}</p>
                            <p><strong>Billing Status:</strong> {formData.billing_status}</p>
                            <p><strong>Payment Terms:</strong> {formData.payment_terms}</p>
                            <p><strong>Payment Terms Custom:</strong> {formData.payment_terms_custom}</p>
                            <p><strong>Payment Status:</strong> {formData.payment_status}</p>
                            <p><strong>Order Approval Status:</strong> {formData.order_approval_status}</p>
                           </>
                          )}

                          {isDeliveryRole && (
                            <>
                            <p><strong>Actual Delivery Date:</strong> {formData.actual_delivery_date}</p>
                            <p><strong>Fulfillment Status:</strong> {formData.fulfillment_status}</p>
                            <p><strong>POC Title:</strong> {formData.poc_title}</p>
                            <p><strong>POC Name:</strong> {formData.poc_name}</p>
                            <p><strong>POC Phone:</strong> {formData.poc_phone_country_code} {formData.poc_phone}</p>
                            </>
                          )}
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
                          <h6 className="fw-bold mb-3">Items Summary</h6>
                          <p><strong>Total Items:</strong> {formData.items.length}</p>
                          <p><strong>Subtotal:</strong> {formData.currency} {totals.grandTotal.toFixed(2)}</p>
                          {totals.totalDiscount > 0 && (
                            <p><strong>Discount:</strong> {formData.currency} {totals.totalDiscount.toFixed(2)}</p>
                          )}
                          {totals.taxAmount > 0 && (
                            <p><strong>Tax:</strong> {formData.currency} {totals.taxAmount.toFixed(2)}</p>
                          )}
                          <p className="fw-bold"><strong>Grand Total:</strong> {formData.currency} {totals.netValue.toFixed(2)}</p>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                )}
              </div>
            </Form>
          )}
        </Modal.Body>

        <Modal.Footer className="border-0">
          <div className="d-flex justify-content-between w-100">
            <Button 
              variant="secondary" 
              onClick={(e) => {
                e.preventDefault();
                if (formStep > 0) {
                  setFormStep(formStep - 1);
                } else {
                  onHide();
                }
              }}
              disabled={loading}
            >
              {formStep > 0 ? <><ChevronLeft size={16} className="me-1" /> Previous</> : 'Cancel'}
            </Button>
            <div className="d-flex gap-2">
              {formStep < 2 ? (
                <Button 
                  variant="primary"
                  onClick={handleNextStep}
                  disabled={loading}
                >
                  Next <ChevronRight size={16} className="ms-1" />
                </Button>
              ) : (
                <Button variant="primary" onClick={handleSubmitDelivery} disabled={loading}>
                  {loading ? 'Updating...' : 'Update Order'}
                </Button>
              )}
            </div>
          </div>
        </Modal.Footer>
      </Modal>
     </>
    )}



{/* this is old --- statr */}
      <Modal
        show={false}
        onHide={onHide}
        size="xl"
        centered
        className="order-edit-modal"
        backdrop="static"
      >
        <Modal.Header className="border-0 pb-0">
          <Modal.Title>
            <h4 className="mb-0 app-heading">Edit Order #{orderId}</h4>
          </Modal.Title>
          <button
          className="btn-close"
            onClick={onHide}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              padding: "0.5rem",
              lineHeight: 1,
            }}
          >
            <X size={24} />
          </button>
        </Modal.Header>

        <Modal.Body style={{ maxHeight: "calc(90vh - 200px)", overflowY: "auto" }}>
          {fetching ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading order data...</p>
            </div>
          ) : (
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
                      <h5 className="fw-bold mb-4 text-primary">ORDER INFORMATION 3</h5>
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
                                      const phoneNumber = parsePhoneNumber(value);
                                      if (phoneNumber) {
                                        setFormData({
                                          ...formData,
                                          customer_phone_country_code: `+${phoneNumber.countryCallingCode}`,
                                          customer_phone: phoneNumber.nationalNumber,
                                        });
                                      } else {
                                        setFormData({
                                          ...formData,
                                          customer_phone_country_code: "",
                                          customer_phone: value,
                                        });
                                      }
                                    } catch (error) {
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
                                          
                                          if (productCurrency === newOrderCurrency) {
                                            return {
                                              ...item,
                                              unit_price: parseFloat(product.price) || item.unit_price,
                                              total_price: (parseFloat(item.quantity || "0") * (parseFloat(product.price) || item.unit_price)).toFixed(2),
                                            };
                                          }
                                          
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

                      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'flex-end' }}>
                        <div className="table-responsive custom-table-order" style={{ maxWidth: '900px', width: '100%' }}>
                          <Table hover style={{ width: '100%', marginBottom: 0, tableLayout: 'auto', margin: '0 auto' }}>
                            <thead style={{ background: '#f8f9fa' }}>
                              <tr>
                                <th>#</th>
                                <th>Product Name</th>
                                <th>SKU</th>
                                <th>Quantity</th>
                                {formData.items.some((item) => item.description) && <th>Description</th>}
                                <th>Unit Price</th>
                                <th>Total Price</th>
                                
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
                                    <td className="fw-semibold">
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
                                  <td>{formData.currency || 'AED'} {totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td></td>
                                </tr>
                                {totals.totalDiscount > 0 && (
                                  <tr>
                                    <td colSpan={formData.items.some((item) => item.description) ? 6 : 5} className="text-end">
                                      Discount ({parseFloat(formData.standard_discount_percentage || "0") + parseFloat(formData.special_discount_percentage || "0")}%):
                                    </td>
                                    <td>- {formData.currency || 'AED'} {totals.totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td></td>
                                  </tr>
                                )}
                                {parseFloat(formData.tax_percentage || "0") > 0 && (
                                  <tr>
                                    <td colSpan={formData.items.some((item) => item.description) ? 6 : 5} className="text-end">Tax ({formData.tax_percentage}%):</td>
                                    <td>{formData.currency || 'AED'} {totals.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td></td>
                                  </tr>
                                )}
                                <tr style={{ fontSize: '16px' }}>
                                  <td colSpan={formData.items.some((item) => item.description) ? 6 : 5} className="text-end">Total:</td>
                                  <td>{formData.currency || 'AED'} {totals.netValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
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

                {/* Step 2: Review - Similar structure to edit page */}
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
                          <h6 className="fw-bold mb-3">Items Summary</h6>
                          <p><strong>Total Items:</strong> {formData.items.length}</p>
                          <p><strong>Subtotal:</strong> {formData.currency} {totals.grandTotal.toFixed(2)}</p>
                          {totals.totalDiscount > 0 && (
                            <p><strong>Discount:</strong> {formData.currency} {totals.totalDiscount.toFixed(2)}</p>
                          )}
                          {totals.taxAmount > 0 && (
                            <p><strong>Tax:</strong> {formData.currency} {totals.taxAmount.toFixed(2)}</p>
                          )}
                          <p className="fw-bold"><strong>Grand Total:</strong> {formData.currency} {totals.netValue.toFixed(2)}</p>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                )}
              </div>
            </Form>
          )}
        </Modal.Body>

        <Modal.Footer className="border-0">
          <div className="d-flex justify-content-between w-100">
            <Button 
              variant="secondary" 
              onClick={(e) => {
                e.preventDefault();
                if (formStep > 0) {
                  setFormStep(formStep - 1);
                } else {
                  onHide();
                }
              }}
              disabled={loading}
            >
              {formStep > 0 ? <><ChevronLeft size={16} className="me-1" /> Previous</> : 'Cancel'}
            </Button>
            <div className="d-flex gap-2">
              {formStep < 2 ? (
                <Button 
                  variant="primary"
                  onClick={handleNextStep}
                  disabled={loading}
                >
                  Next <ChevronRight size={16} className="ms-1" />
                </Button>
              ) : (
                <Button variant="primary" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Updating...' : 'Update Order'}
                </Button>
              )}
            </div>
          </div>
        </Modal.Footer>
      </Modal>
      {/* this is old --- end */}

      {/* Add/Edit Item Sub-Modal */}
      <Modal show={showAddItemModal} onHide={() => {
        setShowAddItemModal(false);
        setEditingItemIndex(null);
      }} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingItemIndex !== null ? 'Edit Item' : 'Add New Item'}</Modal.Title>
        </Modal.Header>
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
          }}>
            Cancel
          </Button>
          <Button 
            variant="primary"
            disabled={!itemFormData.product_id || itemFormData.quantity < 1 || itemFormData.unit_price <= 0}
            onClick={() => {
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
      </Modal>
    </>
  );
};

export default OrderEditModal;
