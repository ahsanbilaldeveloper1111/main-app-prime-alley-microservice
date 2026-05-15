import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  createOrder,
  getStages,
  getCrmProducts,
  CrmProduct,
  getDeal,
  DealData,
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
import { convertCurrency, formatCurrency } from '@utils/currency';
import { ModuleSlug, ValidationType, checkRequiredFields } from "@utils/Helper";
import { GetHierarchyData } from "@utils/users";
import { crmAppKeys } from "@query/keys";

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
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [itemFormData, setItemFormData] = useState({
    product_id: null as number | null,
    product_name: "",
    description: "",
    quantity: 1,
    unit_price: 0,
  });
  const stagesQuery = useQuery({
    queryKey: crmAppKeys.crmStages.byType("order"),
    queryFn: () => getStages("order"),
  });
  const extensionsQuery = useQuery({
    queryKey: crmAppKeys.hierarchyExtensions.module(ModuleSlug.CRM_ORDERS),
    queryFn: async () => {
      const hierarchyData = await GetHierarchyData(ModuleSlug.CRM_ORDERS);
      return hierarchyData?.extensions ?? [];
    },
  });
  const productsQuery = useQuery({
    queryKey: crmAppKeys.orderFormBootstrap.productsPicklist(),
    queryFn: async () => {
      const response = await getCrmProducts({ per_page: 100 });
      return response.data ?? [];
    },
  });
  const stages = stagesQuery.data ?? [];
  const extensions = extensionsQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const loadingProducts = productsQuery.isPending;

  const [sourceDeal, setSourceDeal] = useState<DealData | null>(null);
  const [loadingDeal, setLoadingDeal] = useState(false);
  const [selectedEstimateId, setSelectedEstimateId] = useState<number | null>(null);
  const [convertingPrice, setConvertingPrice] = useState(false);
  
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_phone_country_code: "",
    order_date: new Date().toISOString().split('T')[0],
    order_stage_id: undefined as number | undefined,
    notes: "",
    tax_percentage: "0",
    standard_discount_percentage: "0",
    special_discount_percentage: "0",
    currency: "AED",
    industry: "",
    items: [] as OrderItem[],
  });

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
          // Sort estimates by created_at (descending) to get latest first, fallback to id if created_at is not available
          const sortedEstimates = [...estimates].sort((a: any, b: any) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            if (dateA !== dateB) {
              return dateB - dateA; // Descending order (newest first)
            }
            // Fallback to id if dates are equal or missing
            return (b.id || 0) - (a.id || 0);
          });
          // Find the latest estimate with is_final flag, or use the latest estimate overall
          const latestEstimate = sortedEstimates.find((e: any) => e.is_final) || sortedEstimates[0];
          
          if (latestEstimate) {
            setSelectedEstimateId(latestEstimate.id);
          }

          // Auto-fill form data from deal
          // Prefer main_decision_maker if available, otherwise use direct fields
          const decisionMaker = dealData.main_decision_maker || {
            name: dealData.decision_maker_name,
            phone_country_code: dealData.decision_maker_phone_country_code,
            phone: dealData.decision_maker_phone,
            email: dealData.decision_maker_email,
          };

          // Parse phone number for PhoneInput component
          let phoneCountryCode = decisionMaker.phone_country_code || "";
          let phoneNumber = decisionMaker.phone || "";
          
          // If we have both, combine them and try to parse
          if (phoneCountryCode && phoneNumber) {
            try {
              const fullPhone = `${phoneCountryCode}${phoneNumber}`;
              const parsed = parsePhoneNumber(fullPhone);
              if (parsed) {
                phoneCountryCode = `+${parsed.countryCallingCode}`;
                phoneNumber = parsed.nationalNumber;
              }
            } catch (error) {
              // Keep original values if parsing fails
            }
          } else if (phoneNumber && !phoneCountryCode) {
            // Try to parse if we only have phone number
            try {
              const parsed = parsePhoneNumber(phoneNumber);
              if (parsed) {
                phoneCountryCode = `+${parsed.countryCallingCode}`;
                phoneNumber = parsed.nationalNumber;
              }
            } catch (error) {
              // Keep original value if parsing fails
            }
          }

          const dealAny = dealData as any;
          const companyName =
            dealData.company_name ||
            dealAny.company?.name ||
            decisionMaker.name ||
            "";

          setFormData(prev => ({
            ...prev,
            customer_name: companyName,
            customer_email: decisionMaker.email || "",
            customer_phone: phoneNumber,
            customer_phone_country_code: phoneCountryCode,
            currency: dealData.currency || "AED",
            industry: dealData.industry || "",
            tax_percentage: latestEstimate?.tax_percentage || "0",
            standard_discount_percentage: latestEstimate?.standard_discount_percentage || "0",
            special_discount_percentage: latestEstimate?.special_discount_percentage || "0",
          }));

          // Auto-populate items from latest estimate
          // Note: Items are already converted to deal currency in the estimate
          // But we need to ensure they're converted to order currency if different
          if (latestEstimate?.estimation_chart) {
            const estimateCurrency = latestEstimate.currency || dealData.currency;
            const orderCurrency = dealData.currency || "AED";
            
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
    const totalDiscountPercentage = parseFloat(formData.standard_discount_percentage || "0") + parseFloat(formData.special_discount_percentage || "0");
    const totalDiscount = (grandTotal * totalDiscountPercentage) / 100;
    const subtotalAfterDiscount = grandTotal - totalDiscount;
    const taxAmount = (subtotalAfterDiscount * parseFloat(formData.tax_percentage || "0")) / 100;
    const netValue = subtotalAfterDiscount + taxAmount;
    
    return { 
      grandTotal, 
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
        order_date: formData.order_date,
        order_stage_id: String(formData.order_stage_id),
        notes: formData.notes || "",
        company: formData.customer_name,
        tax_amount: totals.taxAmount.toFixed(2),
        discount_amount: totals.totalDiscount.toFixed(2),
        total_amount: totals.grandTotal.toFixed(2),
        final_amount: totals.netValue.toFixed(2),
        currency: formData.currency,
        industry: formData.industry || "",
        items: formData.items.map(item => ({
          product_id: String(item.product_id),
          product_name: item.product_name,
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
     // toast.error(error?.response?.data?.message || "Failed to create order");
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
      <div className="container-fluid">
        {/* Create Order Form */}
        <div className="row">
          <div className="col-12">
            {sourceDeal && (
              <Card className="mb-3 border-0 bg-info bg-opacity-10">
                <Card.Body>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Badge bg="info">Converted from Deal</Badge>
                    <span className="small text-muted">
                      Company: <strong>{sourceDeal.company_name || (sourceDeal as any).company?.name || "—"}</strong>
                      {sourceDeal.name && ` • Deal: ${sourceDeal.name}`}
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

            <Card className="border-0 shadow-sm">
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="mb-0 app-heading">Order Information</h4>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                      if (typeof window !== "undefined" && window.history.length > 1) {
                        window.history.back();
                      } else {
                        router.push("/crm/orders");
                      }
                    }}
                  >
                    <ArrowLeft size={16} className="me-2" />
                    Back
                  </Button>
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
                        onClick={() => console.log(formData)}
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
                  <div style={{ marginBottom: '30px', width: '100%' }}>
                    <style dangerouslySetInnerHTML={{__html: `
                      .order-items-table-wrapper {
                        width: 100%;
                        overflow-x: auto;
                      }
                      .order-items-table-wrapper .table-responsive {
                        width: 100%;
                        border-radius: 8px;
                        overflow: hidden;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                      }
                      .order-items-table-wrapper table {
                        width: 100%;
                        margin: 0;
                        border-collapse: separate;
                        border-spacing: 0;
                        table-layout: auto;
                      }
                      .order-items-table-wrapper thead th {
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
                      .order-items-table-wrapper thead th:first-of-type {
                        width: 50px !important;
                        min-width: 50px !important;
                        text-align: center;
                      }
                      .order-items-table-wrapper thead th:last-of-type {
                        width: 120px !important;
                        min-width: 120px !important;
                        text-align: center;
                      }
                      .order-items-table-wrapper tbody td {
                        padding: 14px 16px !important;
                        font-size: 0.875rem;
                        vertical-align: middle;
                        border-bottom: 1px solid #f0f0f0;
                        background: #fff;
                        word-wrap: break-word;
                        overflow-wrap: break-word;
                      }
                      .order-items-table-wrapper tbody td:first-of-type {
                        width: 50px !important;
                        min-width: 50px !important;
                        text-align: center;
                        color: #6c757d;
                        font-weight: 500;
                      }
                      .order-items-table-wrapper tbody td:last-of-type {
                        width: 120px !important;
                        min-width: 120px !important;
                        text-align: center;
                      }
                      .order-items-table-wrapper tbody td:nth-last-child(2),
                      .order-items-table-wrapper thead th:nth-last-child(2) {
                        min-width: 150px !important;
                        white-space: nowrap;
                      }
                      .order-items-table-wrapper tbody td:nth-last-child(3),
                      .order-items-table-wrapper thead th:nth-last-child(3) {
                        min-width: 140px !important;
                        white-space: nowrap;
                      }
                      .order-items-table-wrapper tbody tr:hover {
                        background-color: #f8f9fa;
                      }
                      .order-items-table-wrapper tbody tr:last-child td {
                        border-bottom: none;
                      }
                      .order-items-table-wrapper tfoot td {
                        padding: 12px 16px !important;
                        background: #f8f9fa !important;
                        font-size: 0.875rem;
                        border-top: 2px solid #dee2e6;
                        white-space: nowrap;
                      }
                      .order-items-table-wrapper tfoot td:first-of-type {
                        width: auto !important;
                        min-width: auto !important;
                        max-width: none !important;
                      }
                      .order-items-table-wrapper tfoot td:last-of-type {
                        width: auto !important;
                        min-width: 150px !important;
                        max-width: none !important;
                        text-align: right;
                        font-weight: 600;
                      }
                      .order-items-table-wrapper tfoot tr:last-child td:first-of-type {
                        padding-left: 20px !important;
                      }
                      .order-items-table-wrapper tfoot tr:last-child td:last-of-type {
                        padding-right: 20px !important;
                      }
                    `}} />
                    <div className="order-items-table-wrapper">
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
                                    {showConversionInfo && (
                                      <div className="small text-muted" style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                                        Original: {formatCurrency(item.original_price || item.unit_price, item.original_currency || formData.currency)}
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#212529', whiteSpace: 'nowrap' }}>
                                    {formData.currency || 'AED'} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td>
                                    <div className="d-flex gap-1 justify-content-center">
                                      <Button
                                        variant="link"
                                        size="sm"
                                        className="p-1"
                                        title="Edit Item"
                                        style={{ minWidth: 'auto', padding: '4px' }}
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
                                        <Edit size={16} />
                                      </Button>
                                      <Button
                                        variant="link"
                                        size="sm"
                                        className="p-1 text-danger"
                                        title="Delete Item"
                                        style={{ minWidth: 'auto', padding: '4px' }}
                                        onClick={() => {
                                          setFormData({
                                            ...formData,
                                            items: formData.items.filter((_, i) => i !== index)
                                          });
                                        }}
                                      >
                                        <Trash2 size={16} />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                            {formData.items.length === 0 && (
                              <tr>
                                <td colSpan={formData.items.some((item) => item.description) ? 8 : 7} className="text-center text-muted py-5">
                                  <Package size={40} className="text-muted mb-3" style={{ opacity: 0.5, display: 'block', margin: '0 auto 12px' }} />
                                  <div style={{ fontSize: '0.938rem', fontWeight: 500, marginBottom: '4px' }}>No items in order</div>
                                  <small style={{ fontSize: '0.813rem' }}>Click "Add Item" to add products or services</small>
                                </td>
                              </tr>
                            )}
                          </tbody>
                          {formData.items.length > 0 && (
                            <tfoot>
                              <tr>
                                <td colSpan={formData.items.some((item) => item.description) ? 7 : 6} style={{ textAlign: 'right', paddingRight: '20px' }}>
                                  <strong>Subtotal:</strong>
                                </td>
                                  <td style={{ textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                    {formData.currency || 'AED'} {totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                              </tr>
                              {totals.totalDiscount > 0 && (
                                <tr>
                                  <td colSpan={formData.items.some((item) => item.description) ? 7 : 6} style={{ textAlign: 'right', paddingRight: '20px' }}>
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
                                  <td colSpan={formData.items.some((item) => item.description) ? 7 : 6} style={{ textAlign: 'right', paddingRight: '20px' }}>
                                    <strong>Tax ({formData.tax_percentage}%):</strong>
                                  </td>
                                  <td style={{ textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                    {formData.currency || 'AED'} {totals.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              )}
                              <tr style={{ fontSize: '1rem', borderTop: '2px solid #dee2e6' }}>
                                <td colSpan={formData.items.some((item) => item.description) ? 7 : 6} style={{ textAlign: 'right', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px', paddingLeft: '20px' }}>
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
                    </Col>
                    <Col md={6}>
                      <h6 className="fw-bold">Order Details</h6>
                      <p><strong>Order Date:</strong> {formData.order_date}</p>
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
                  {loading ? 'Creating...' : 'Create Order'}
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

CreateOrder.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CreateOrder;

