import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Card, Table, Badge } from "react-bootstrap";
import Select from "react-select";
import PhoneInput from "react-phone-number-input";
import { parsePhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Package,
  X,
  FileText,
  Upload,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  createOrder,
  getStages,
  StageData,
  getCrmProducts,
  CrmProduct,
  getDeal,
  DealData,
} from "@utils/crm";
import { convertCurrency, formatCurrency } from "@utils/currency";
import { ValidationType, checkRequiredFields } from "@utils/Helper";

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

interface ConvertToOrderModalProps {
  show: boolean;
  onHide: () => void;
  dealId: number;
  onSuccess?: () => void;
}

const ConvertToOrderModal: React.FC<ConvertToOrderModalProps> = ({
  show,
  onHide,
  dealId,
  onSuccess,
}) => {
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
  // Document Upload state
const [contractDocument, setContractDocument] = useState<File | null>(null);
const [contractDocumentPreview, setContractDocumentPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_phone_country_code: "",
    customer_address: "",
    order_date: new Date().toISOString().split("T")[0],
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

  // Fetch stages and products
  useEffect(() => {
    if (show) {
      fetchStages();
      fetchProducts();
    }
  }, [show]);

  // Fetch deal data when modal opens
  useEffect(() => {
    const fetchDealData = async () => {
      if (show && dealId) {
        try {
          setLoadingDeal(true);
          const dealData = await getDeal(dealId);
          setSourceDeal(dealData);

          // Get the latest estimate
          const estimates = dealData.estimates || [];
          const sortedEstimates = [...estimates].sort((a: any, b: any) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            if (dateA !== dateB) {
              return dateB - dateA;
            }
            return (b.id || 0) - (a.id || 0);
          });
          const latestEstimate =
            sortedEstimates.find((e: any) => e.is_final) || sortedEstimates[0];

          if (latestEstimate) {
            setSelectedEstimateId(latestEstimate.id);
          }

          // Auto-fill form data from deal
          const decisionMaker = dealData.main_decision_maker || {
            name: dealData.decision_maker_name,
            phone_country_code: dealData.decision_maker_phone_country_code,
            phone: dealData.decision_maker_phone,
            email: dealData.decision_maker_email,
          };

          // Parse phone number
          let phoneCountryCode = decisionMaker.phone_country_code || "";
          let phoneNumber = decisionMaker.phone || "";

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
          }

          setFormData((prev) => ({
            ...prev,
            customer_name: decisionMaker.name || dealData.company_name || "",
            customer_email: decisionMaker.email || "",
            customer_phone: phoneNumber,
            customer_phone_country_code: phoneCountryCode,
            customer_address: "",
            currency: dealData.currency || "AED",
            industry: dealData.industry || "",
            tax_percentage: latestEstimate?.tax_percentage || "0",
            standard_discount_percentage: latestEstimate?.standard_discount_percentage || "0",
            special_discount_percentage: latestEstimate?.special_discount_percentage || "0",
          }));

          // Auto-populate items from latest estimate
          if (latestEstimate?.estimation_chart) {
            const items: OrderItem[] = latestEstimate.estimation_chart.map((item: any) => ({
              product_id: item.product_id,
              product_name: item.product_service,
              description: item.description || "",
              quantity: String(item.qty),
              unit_price: item.unit_price,
              total_price: (item.qty * item.unit_price).toFixed(2),
              original_currency: item.original_currency || dealData.currency,
              original_price: item.original_price || item.unit_price,
            }));
            setFormData((prev) => ({ ...prev, items }));
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
  }, [show, dealId]);

  const fetchStages = async () => {
    try {
      const stagesData = await getStages("order");
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

      setFormData((prev) => ({
        ...prev,
        tax_percentage: selectedEstimate.tax_percentage || "0",
        standard_discount_percentage: selectedEstimate.standard_discount_percentage || "0",
        special_discount_percentage: selectedEstimate.special_discount_percentage || "0",
      }));

      if (selectedEstimate.estimation_chart) {
        const estimateCurrency = selectedEstimate.currency || sourceDeal.currency;
        const orderCurrency = formData.currency;

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
            setFormData((prev) => ({ ...prev, items: convertedItems }));
          } catch (error) {
            console.error("Failed to convert estimate items:", error);
            toast.error("Failed to convert prices from estimate currency");
          } finally {
            setConvertingPrice(false);
          }
        } else {
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
          setFormData((prev) => ({ ...prev, items }));
        }
      }
    }
  };

  const calculateTotals = () => {
    const grandTotal = formData.items.reduce((sum, item) => {
      return sum + parseFloat(item.quantity || "0") * (item.unit_price || 0);
    }, 0);
    const totalDiscountPercentage =
      parseFloat(formData.standard_discount_percentage || "0") +
      parseFloat(formData.special_discount_percentage || "0");
    const totalDiscount = (grandTotal * totalDiscountPercentage) / 100;
    const subtotalAfterDiscount = grandTotal - totalDiscount;
    const taxAmount =
      (subtotalAfterDiscount * parseFloat(formData.tax_percentage || "0")) / 100;
    const netValue = subtotalAfterDiscount + taxAmount;

    return {
      grandTotal,
      totalDiscount,
      subtotalAfterDiscount,
      taxAmount,
      netValue,
    };
  };

  const handleFileUpload = (file: File) => {
    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload PDF, DOC, or DOCX files only.");
      return;
    }
  
    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      toast.error("File size exceeds 10MB. Please upload a smaller file.");
      return;
    }
  
    // Set the file
    setContractDocument(file);
  
    // Create preview URL for supported file types
    if (file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onloadend = () => {
        setContractDocumentPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setContractDocumentPreview(file.name);
    }
  
    toast.success("Document uploaded successfully!");
  };
  // Validation functions
  const validateStep0 = (): boolean => {
    const requiredFields = [
      { field: "customer_name" as const, name: "Company Name" },
      { field: "customer_email" as const, name: "Company Email", type: ValidationType.EMAIL },
      { field: "customer_phone" as const, name: "Company Phone" },
      { field: "order_date" as const, name: "Order Date" },
      { field: "order_stage_id" as const, name: "Stage" },
      { field: "currency" as const, name: "Currency" },
    ];
    return checkRequiredFields(formData, requiredFields);
  };

  const validateStep1 = (): boolean => {
    if (!formData.items || formData.items.length === 0) {
      toast.error("Please add at least one item to the order");
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
        return true; // Document upload is optional
      case 3:
        return true; // Review step has no validation
      default:
        return true;
    }
  };

  const handleNextStep = (e: React.MouseEvent) => {
    e.preventDefault();
    if (validateCurrentStep()) {
      setFormStep(Math.min(3, formStep + 1));  // Changed from 2 to 3
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formStep < 3) {
      setFormStep(formStep + 1);
      return;
    }

    if (!validateStep0() || !validateStep1()) {
      return;
    }

    setLoading(true);
    try {
        const totals = calculateTotals();
        const formattedPhone =
          formData.customer_phone_country_code && formData.customer_phone
            ? `${formData.customer_phone_country_code} ${formData.customer_phone}`
            : formData.customer_phone;
      
        const itemsPayload = formData.items.map((item) => ({
          product_id: String(item.product_id),
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: (parseFloat(item.quantity || "0") * item.unit_price).toFixed(2),
          description: item.description || "",
        }));

        const formDataPayload = new FormData();
        formDataPayload.append("customer_name", formData.customer_name);
        formDataPayload.append("customer_email", formData.customer_email);
        formDataPayload.append("customer_phone", formattedPhone);
        formDataPayload.append("customer_address", formData.customer_address || "");
        formDataPayload.append("order_date", formData.order_date);
        formDataPayload.append("expected_delivery_date", formData.expected_delivery_date || "");
        formDataPayload.append("order_stage_id", String(formData.order_stage_id));
        formDataPayload.append("notes", formData.notes || "");
        formDataPayload.append("tax_amount", totals.taxAmount.toFixed(2));
        formDataPayload.append("discount_amount", totals.totalDiscount.toFixed(2));
        formDataPayload.append("total_amount", totals.grandTotal.toFixed(2));
        formDataPayload.append("final_amount", totals.netValue.toFixed(2));
        formDataPayload.append("currency", formData.currency);
        formDataPayload.append("industry", formData.industry || "");
        formDataPayload.append("order_approval_status", formData.order_approval_status || "");
        formDataPayload.append("fulfillment_status", formData.fulfillment_status || "");
        formDataPayload.append("payment_status", formData.payment_status || "");
        formDataPayload.append("items", JSON.stringify(itemsPayload));
        formDataPayload.append("deal_id", String(dealId));
        if (contractDocument) {
          formDataPayload.append("creation_attachment", contractDocument);
        }

        // Create the order with FormData (supports file upload)
        const createdOrder = await createOrder(formDataPayload);

    //   const payload: any = {
    //     customer_name: formData.customer_name,
    //     customer_email: formData.customer_email,
    //     customer_phone: formattedPhone,
    //     customer_address: formData.customer_address || "",
    //     order_date: formData.order_date,
    //     expected_delivery_date: formData.expected_delivery_date || "",
    //     order_stage_id: String(formData.order_stage_id),
    //     notes: formData.notes || "",
    //     tax_amount: totals.taxAmount.toFixed(2),
    //     discount_amount: totals.totalDiscount.toFixed(2),
    //     total_amount: totals.grandTotal.toFixed(2),
    //     final_amount: totals.netValue.toFixed(2),
    //     currency: formData.currency,
    //     industry: formData.industry || "",
    //     order_approval_status: formData.order_approval_status || "",
    //     fulfillment_status: formData.fulfillment_status || "",
    //     payment_status: formData.payment_status || "",
    //     items: formData.items.map((item) => ({
    //       product_id: String(item.product_id),
    //       product_name: item.product_name,
    //       quantity: item.quantity,
    //       unit_price: item.unit_price,
    //       total_price: (parseFloat(item.quantity || "0") * item.unit_price).toFixed(2),
    //       description: item.description || "",
    //     })),
    //     deal_id: String(dealId),
    //   };

    //   await createOrder(payload);
      toast.success("Order created successfully!");
      
      // Reset form
      resetForm();
      
      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
      
      onHide();
    } catch (error: any) {
      console.error("Failed to create order:", error);
     // toast.error(error?.response?.data?.message || "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

//   const resetForm = () => {
//     setFormStep(0);
//     setFormData({
//       customer_name: "",
//       customer_email: "",
//       customer_phone: "",
//       customer_phone_country_code: "",
//       customer_address: "",
//       order_date: new Date().toISOString().split("T")[0],
//       expected_delivery_date: "",
//       order_stage_id: undefined,
//       notes: "",
//       tax_percentage: "0",
//       standard_discount_percentage: "0",
//       special_discount_percentage: "0",
//       currency: "AED",
//       industry: "",
//       order_approval_status: "",
//       fulfillment_status: "",
//       payment_status: "",
//       items: [],
//     });
//     setSourceDeal(null);
//     setSelectedEstimateId(null);
//   };

const resetForm = () => {
    setFormStep(0);
    setFormData({
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      customer_phone_country_code: "",
      customer_address: "",
      order_date: new Date().toISOString().split("T")[0],
      expected_delivery_date: "",
      order_stage_id: undefined,
      notes: "",
      tax_percentage: "0",
      standard_discount_percentage: "0",
      special_discount_percentage: "0",
      currency: "AED",
      industry: "",
      order_approval_status: "",
      fulfillment_status: "",
      payment_status: "",
      items: [],
    });
    setSourceDeal(null);
    setSelectedEstimateId(null);
    setContractDocument(null);  // Add this
    setContractDocumentPreview(null);  // Add this
  };

  const handleClose = () => {
    resetForm();
    onHide();
  };

  const totals = calculateTotals();

  const customSelectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      minHeight: "45px",
      fontSize: "0.875rem",
      borderColor: state.isFocused ? "#86b7fe" : "#dee2e6",
      boxShadow: state.isFocused ? "0 0 0 0.2rem rgba(13, 110, 253, 0.25)" : "none",
      "&:hover": {
        borderColor: "#86b7fe",
      },
    }),
  };

  return (
    <>
      <Modal show={show} onHide={handleClose} size="xl" fullscreen="lg-down" centered>
        <Modal.Header closeButton style={{ borderBottom: "1px solid #ccc" }}>
          <Modal.Title>Convert Deal to Order</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
          {loadingDeal ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading deal data...</span>
              </div>
              <p className="mt-2 text-muted">Loading deal information...</p>
            </div>
          ) : (
            <>
              {sourceDeal && (
                <Card className="mb-3 border-0 bg-info bg-opacity-10">
                  <Card.Body>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <Badge bg="info">Converting from Deal</Badge>
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
                          value={selectedEstimateId || ""}
                          onChange={(e) =>
                            handleEstimateChange(e.target.value ? Number(e.target.value) : null)
                          }
                        >
                          {sourceDeal.estimates.map((estimate: any) => (
                            <option key={estimate.id} value={estimate.id}>
                              Version {estimate.version} {estimate.is_final ? "(Final)" : ""} -{" "}
                              {estimate.currency} {estimate.net_value}
                              {estimate.created_at &&
                                ` (${new Date(estimate.created_at).toLocaleDateString()})`}
                            </option>
                          ))}
                        </Form.Select>
                      </div>
                    )}
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
                        left: "0",
                        right: "0",
                        top: "20px",
                        height: "2px",
                        zIndex: 0,
                      }}
                    />
                    <div
                      className="position-absolute bg-primary"
                      style={{
                        left: "0",
                        top: "20px",
                        height: "2px",
                        width: `${(formStep / 3) * 100}%`,
                        zIndex: 0,
                        transition: "width 0.3s ease",
                      }}
                    />

                    {[0, 1, 2, 3].map((step) => (
                      <div
                        key={step}
                        className="text-center position-relative"
                        style={{ cursor: "pointer", flex: 1 }}
                        onClick={() => setFormStep(step)}
                      >
                        <div
                          className={`rounded-circle d-flex align-items-center justify-content-center mx-auto ${
                            formStep >= step ? "bg-primary text-white" : "bg-light text-muted"
                          }`}
                          style={{ width: "40px", height: "40px", zIndex: 1, position: "relative" }}
                        >
                          {formStep > step ? <CheckCircle size={20} /> : step + 1}
                        </div>
                        <small
                          className={`d-block mt-2 ${
                            formStep === step ? "fw-bold text-primary" : "text-muted"
                          }`}
                        >
                          {/* {step === 0 ? "Order Info" : step === 1 ? "Items" : step === 2 ? "Review" : "Document"} */}

                          {step === 0 ? "Order Info" : step === 1 ? "Items" : step === 2 ? "Documents" : "Review"}
                        </small>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form Content - Step 0: Order Information */}
                {formStep === 0 && (
                  <Card className="mb-3 border-0 bg-light">
                    <Card.Body>
                      <h5 className="fw-bold mb-4 text-primary">ORDER INFORMATION</h5>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>
                              Company Name <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                              type="text"
                              value={formData.customer_name}
                              onChange={(e) =>
                                setFormData({ ...formData, customer_name: e.target.value })
                              }
                              placeholder="Enter company name"
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>
                              Company Email <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                              type="email"
                              value={formData.customer_email}
                              onChange={(e) =>
                                setFormData({ ...formData, customer_email: e.target.value })
                              }
                              placeholder="company@example.com"
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>
                              Company Phone <span className="text-danger">*</span>
                            </Form.Label>
                            <div className="phone-input-wrapper">
                              <PhoneInput
                                international
                                defaultCountry="US"
                                value={
                                  formData.customer_phone_country_code && formData.customer_phone
                                    ? `${formData.customer_phone_country_code}${formData.customer_phone}`
                                    : formData.customer_phone || undefined
                                }
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
                              onChange={(e) =>
                                setFormData({ ...formData, customer_address: e.target.value })
                              }
                              placeholder="Enter address"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>
                              Order Date <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                              type="date"
                              value={formData.order_date}
                              onChange={(e) =>
                                setFormData({ ...formData, order_date: e.target.value })
                              }
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
                              onChange={(e) =>
                                setFormData({ ...formData, expected_delivery_date: e.target.value })
                              }
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>
                              Stage <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Select
                              value={formData.order_stage_id || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  order_stage_id: e.target.value ? Number(e.target.value) : undefined,
                                })
                              }
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
                            <Form.Label>
                              Currency <span className="text-danger">*</span>
                            </Form.Label>
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
                                        const product = products.find((p) => p.id === item.product_id);
                                        if (product) {
                                          const productCurrency = product.currency.toUpperCase();
                                          const oldOrderCurrency = formData.currency.toUpperCase();
                                          const newOrderCurrency = newCurrency.toUpperCase();

                                          if (productCurrency === newOrderCurrency) {
                                            return {
                                              ...item,
                                              unit_price: parseFloat(product.price) || item.unit_price,
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
                                              total_price: (
                                                parseFloat(item.quantity || "0") * convertedPrice
                                              ).toFixed(2),
                                            };
                                          }
                                        }
                                        return item;
                                      })
                                    );
                                    setFormData((prev) => ({ ...prev, items: convertedItems }));
                                  } catch (error) {
                                    console.error("Failed to convert existing items:", error);
                                    toast.error("Failed to convert prices to new currency");
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
                              onChange={(e) =>
                                setFormData({ ...formData, order_approval_status: e.target.value })
                              }
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
                              onChange={(e) =>
                                setFormData({ ...formData, fulfillment_status: e.target.value })
                              }
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
                              onChange={(e) =>
                                setFormData({ ...formData, payment_status: e.target.value })
                              }
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
                              onChange={(e) =>
                                setFormData({ ...formData, tax_percentage: e.target.value })
                              }
                              placeholder="0"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Standard Discount (%)</Form.Label>
                            <Form.Select
                              value={
                                formData.standard_discount_percentage &&
                                parseFloat(formData.standard_discount_percentage)
                              }
                              onChange={(e) =>
                                setFormData({ ...formData, standard_discount_percentage: e.target.value })
                              }
                            >
                              <option value="0">0%</option>
                              <option value="5">5%</option>
                              <option value="10">10%</option>
                              <option value="15">15%</option>
                            </Form.Select>
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
                              onChange={(e) =>
                                setFormData({ ...formData, special_discount_percentage: e.target.value })
                              }
                              placeholder="0"
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      {/* Add Item Button */}
                      {/* <div className="d-flex justify-content-end mb-3">
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
                      </div> */}

                      {/* Items Table */}
                      <div className="table-responsive">
  {(() => {
    const hasDescription = formData.items.some(item => item.description);

    return (
      <Table hover className="align-middle">
        {/* AUTO COLUMN WIDTHS */}
        <colgroup>
          <col style={{ width: '5%' }} />   {/* # */}
          <col style={{ width: '30%' }} />  {/* Product Name */}
          <col style={{ width: '10%' }} />  {/* Qty */}
          {hasDescription && <col style={{ width: '25%' }} />} {/* Description */}
          <col style={{ width: '15%' }} />  {/* Unit Price */}
          <col style={{ width: '15%' }} />  {/* Total Price */}
        </colgroup>

        {/* TABLE HEADER */}
        <thead className="bg-light">
          <tr>
            <th>#</th>
            <th>Product Name</th>
            <th className="text-center">Qty</th>
            {hasDescription && <th>Description</th>}
            <th className="text-end">Unit Price</th>
            <th className="text-end">Total Price</th>
          </tr>
        </thead>

        {/* TABLE BODY */}
        <tbody>
          {formData.items.map((item, index) => {
            const subtotal =
              parseFloat(item.quantity || '0') * (item.unit_price || 0);

            const product = products.find(p => p.id === item.product_id);

            const showConversionInfo =
              product &&
              product.currency.toUpperCase() !==
                formData.currency.toUpperCase() &&
              item.original_currency &&
              item.original_price !== item.unit_price;

            return (
              <tr key={index}>
                <td>{index + 1}</td>

                <td className="fw-semibold">
                  {item.product_name || 'N/A'}
                </td>

                <td className="text-center">
                  {item.quantity || '0'}
                </td>

                {hasDescription && (
                  <td className="small text-muted">
                    {item.description || '-'}
                  </td>
                )}

                <td className="text-end">
                  <div>
                    {formData.currency || 'AED'}{' '}
                    {parseFloat(String(item.unit_price || '0')).toLocaleString(
                      undefined,
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                  </div>

                  {showConversionInfo && (
                    <div className="small text-muted">
                      Original:{' '}
                      {formatCurrency(
                        item.original_price || item.unit_price,
                        item.original_currency || formData.currency
                      )}
                    </div>
                  )}
                </td>

                <td className="text-end fw-semibold">
                  {formData.currency || 'AED'}{' '}
                  {subtotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            );
          })}

          {/* EMPTY STATE */}
          {formData.items.length === 0 && (
            <tr>
              <td
                colSpan={hasDescription ? 6 : 5}
                className="text-center text-muted py-5"
              >
                <Package
                  size={40}
                  className="mb-3"
                  style={{ opacity: 0.5 }}
                />
                <div>No items in order</div>
                <small>
                  Click "Add Item" to add products or services
                </small>
              </td>
            </tr>
          )}
        </tbody>

        {/* TABLE FOOTER */}
        {formData.items.length > 0 && (
          <tfoot className="bg-light">
            <tr>
              <td
                colSpan={hasDescription ? 5 : 4}
                className="text-end"
              >
                <strong>Subtotal:</strong>
              </td>
              <td className="text-end fw-semibold">
                {formData.currency || 'AED'}{' '}
                {totals.grandTotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
            </tr>

            {totals.totalDiscount > 0 && (
              <tr>
                <td
                  colSpan={hasDescription ? 5 : 4}
                  className="text-end text-muted"
                >
                  Discount (
                  {parseFloat(formData.standard_discount_percentage || '0') +
                    parseFloat(
                      formData.special_discount_percentage || '0'
                    )}
                  %):
                </td>
                <td className="text-end text-danger">
                  - {formData.currency || 'AED'}{' '}
                  {totals.totalDiscount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            )}

            {parseFloat(formData.tax_percentage || '0') > 0 && (
              <tr>
                <td
                  colSpan={hasDescription ? 5 : 4}
                  className="text-end"
                >
                  <strong>
                    Tax ({formData.tax_percentage}%):
                  </strong>
                </td>
                <td className="text-end fw-semibold">
                  {formData.currency || 'AED'}{' '}
                  {totals.taxAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            )}

            <tr className="border-top border-2">
              <td
                colSpan={hasDescription ? 5 : 4}
                className="text-end"
              >
                <strong className="fs-5">Total:</strong>
              </td>
              <td className="text-end fw-bold text-success fs-5">
                {formData.currency || 'AED'}{' '}
                {totals.netValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
            </tr>
          </tfoot>
        )}
      </Table>
    );
  })()}
</div>

                    </Card.Body>
                  </Card>
                )}

                {/* Step 2: Document Upload */}
{formStep === 2 && (
  <Card className="mb-3 border-0 bg-light">
    <Card.Body>
      <h5 className="fw-bold mb-4 text-warning">DOCUMENT UPLOAD</h5>
      
      <Row>
        <Col md={12}>
          <Form.Group className="mb-4">
            <Form.Label className="fw-semibold">
              Contract Document
              <span className="text-muted ms-2">(Optional)</span>
            </Form.Label>
            <p className="text-muted small mb-3">
              Upload the contract document for this order. Accepted formats: PDF, DOC, DOCX (Max 10MB)
            </p>
            
            {/* File Upload Area */}
            <div
              className="border-2 border-dashed rounded p-4 text-center"
              style={{
                borderColor: contractDocument ? "#198754" : "#dee2e6",
                backgroundColor: contractDocument ? "#f8fdf9" : "#fafbfc",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = "#0d6efd";
                e.currentTarget.style.backgroundColor = "#f0f7ff";
              }}
              onDragLeave={(e) => {
                e.currentTarget.style.borderColor = contractDocument ? "#198754" : "#dee2e6";
                e.currentTarget.style.backgroundColor = contractDocument ? "#f8fdf9" : "#fafbfc";
              }}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) {
                  handleFileUpload(file);
                }
                e.currentTarget.style.borderColor = contractDocument ? "#198754" : "#dee2e6";
                e.currentTarget.style.backgroundColor = contractDocument ? "#f8fdf9" : "#fafbfc";
              }}
              onClick={() => document.getElementById("contract-file-input")?.click()}
            >
              {!contractDocument ? (
                <>
                  <Upload size={48} className="text-muted mb-3" style={{ opacity: 0.5 }} />
                  <h6 className="mb-2">Drop your contract document here or click to browse</h6>
                  <p className="text-muted small mb-0">
                    Supported formats: PDF, DOC, DOCX • Maximum file size: 10MB
                  </p>
                </>
              ) : (
                <>
                  <CheckCircle size={48} className="text-success mb-3" />
                  <h6 className="mb-2 text-success">Document Uploaded Successfully</h6>
                  <p className="text-muted small mb-3">
                    <strong>{contractDocument.name}</strong> ({(contractDocument.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setContractDocument(null);
                      setContractDocumentPreview(null);
                      const fileInput = document.getElementById("contract-file-input") as HTMLInputElement;
                      if (fileInput) fileInput.value = "";
                    }}
                  >
                    <Trash2 size={14} className="me-1" />
                    Remove Document
                  </Button>
                </>
              )}
              
              <input
                id="contract-file-input"
                type="file"
                accept=".pdf,.doc,.docx"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(file);
                  }
                }}
              />
            </div>
          </Form.Group>

          {/* Document Preview Section */}
          {contractDocument && contractDocumentPreview && (
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">
                    <FileText size={16} className="me-2" />
                    Document Preview
                  </h6>
                  <Badge bg="success">Uploaded</Badge>
                </div>
              </Card.Header>
              <Card.Body>
                {contractDocument.type === "application/pdf" ? (
                  <div className="text-center p-4">
                    <FileText size={64} className="text-danger mb-3" />
                    <h6>{contractDocument.name}</h6>
                    <p className="text-muted small">PDF documents cannot be previewed here</p>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <FileText size={64} className="text-primary mb-3" />
                    <h6>{contractDocument.name}</h6>
                    <p className="text-muted small">
                      {contractDocument.type.includes("word") ? "Word Document" : "Document"}
                    </p>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}

          {/* Information Alert */}
          <div className="alert alert-info mt-3 d-flex align-items-start">
            <AlertCircle size={20} className="me-2 mt-1 flex-shrink-0" />
            <div>
              <strong>Document Upload Guidelines:</strong>
              <ul className="mb-0 mt-2 small">
                <li>Ensure the contract document is signed and finalized</li>
                <li>The document will be attached to the order for future reference</li>
                <li>You can skip this step and upload the document later if needed</li>
              </ul>
            </div>
          </div>
        </Col>
      </Row>
    </Card.Body>
  </Card>
)}
                {/* Step 3: Review */}
                {formStep === 3 && (
                  <Card className="mb-3 border-0 bg-light">
                    <Card.Body>
                      <h5 className="fw-bold mb-4 text-info">REVIEW ORDER</h5>
                      <Row>
                        <Col md={6}>
                          <h6 className="fw-bold">Customer Information</h6>
                          <p>
                            <strong>Name:</strong> {formData.customer_name}
                          </p>
                          <p>
                            <strong>Email:</strong> {formData.customer_email}
                          </p>
                          <p>
                            <strong>Phone:</strong> {formData.customer_phone}
                          </p>
                          {formData.customer_address && (
                            <p>
                              <strong>Address:</strong> {formData.customer_address}
                            </p>
                          )}
                        </Col>
                        <Col md={6}>
                          <h6 className="fw-bold">Order Details</h6>
                          <p>
                            <strong>Order Date:</strong> {formData.order_date}
                          </p>
                          {formData.expected_delivery_date && (
                            <p>
                              <strong>Expected Delivery:</strong> {formData.expected_delivery_date}
                            </p>
                          )}
                          <p>
                            <strong>Stage:</strong>{" "}
                            {stages.find((s) => s.id === formData.order_stage_id)?.name || "N/A"}
                          </p>
                          <p>
                            <strong>Currency:</strong> {formData.currency}
                          </p>
                        </Col>

                        {contractDocument && (
  <Col md={12} className="mt-3">
    <h6 className="fw-bold">Uploaded Document</h6>
    <Card className="border-0 bg-light">
      <Card.Body className="p-3">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-success bg-opacity-10 p-2 rounded">
              <FileText size={24} className="text-success" />
            </div>
            <div>
              <p className="mb-0 fw-semibold">{contractDocument.name}</p>
              <small className="text-muted">
                {(contractDocument.size / 1024 / 1024).toFixed(2)} MB
              </small>
            </div>
          </div>
          <Badge bg="success">Uploaded</Badge>
        </div>
      </Card.Body>
    </Card>
  </Col>
)}
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
                          <h6 className="fw-bold mb-3">Order Summary</h6>
                          <Card className="border-0">
                            <Card.Body>
                              <div className="d-flex justify-content-between mb-2">
                                <span>Items:</span>
                                <strong>{formData.items.length}</strong>
                              </div>
                              <div className="d-flex justify-content-between mb-2">
                                <span>Subtotal:</span>
                                <strong>
                                  {formData.currency} {totals.grandTotal.toFixed(2)}
                                </strong>
                              </div>
                              {totals.totalDiscount > 0 && (
                                <div className="d-flex justify-content-between mb-2 text-danger">
                                  <span>Discount:</span>
                                  <strong>
                                    - {formData.currency} {totals.totalDiscount.toFixed(2)}
                                  </strong>
                                </div>
                              )}
                              {parseFloat(formData.tax_percentage || "0") > 0 && (
                                <div className="d-flex justify-content-between mb-2">
                                  <span>Tax ({formData.tax_percentage}%):</span>
                                  <strong>
                                    {formData.currency} {totals.taxAmount.toFixed(2)}
                                  </strong>
                                </div>
                              )}
                              <hr />
                              <div className="d-flex justify-content-between">
                                <strong className="fs-5">Total:</strong>
                                <strong className="fs-5 text-success">
                                  {formData.currency} {totals.netValue.toFixed(2)}
                                </strong>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                )}

                {/* Navigation Buttons */}
                <div className="d-flex justify-content-between mt-4">
                  <Button
                    variant="secondary"
                    onClick={(e) => {
                      e.preventDefault();
                      if (formStep > 0) {
                        setFormStep(formStep - 1);
                      } else {
                        handleClose();
                      }
                    }}
                  >
                    {formStep > 0 ? (
                      <>
                        <ChevronLeft size={16} className="me-1" /> Previous
                      </>
                    ) : (
                      "Cancel"
                    )}
                  </Button>
                  <div className="d-flex gap-2">
                    {formStep < 3 ? (
                      <Button variant="primary" onClick={handleNextStep}>
                        Next <ChevronRight size={16} className="ms-1" />
                      </Button>
                    ) : (
                      <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? "Creating..." : "Create Order"}
                      </Button>
                    )}
                  </div>
                </div>
              </Form>
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* Add/Edit Item Modal (nested) */}
      <Modal
        show={showAddItemModal}
        onHide={() => {
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
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{editingItemIndex !== null ? "Edit Item" : "Add New Item"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label>
                  Product <span className="text-danger">*</span>
                </Form.Label>
                <Select
                  value={
                    itemFormData.product_id
                      ? {
                          value: itemFormData.product_id,
                          label:
                            itemFormData.product_name ||
                            products.find((p) => p.id === itemFormData.product_id)?.name ||
                            "",
                        }
                      : null
                  }
                  onChange={async (selectedOption: any) => {
                    const product = products.find((p) => p.id === selectedOption?.value);
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
                          console.error("Failed to convert currency:", error);
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
                  options={products.map((product) => {
                    const productCurrency = product.currency.toUpperCase();
                    const orderCurrency = formData.currency.toUpperCase();
                    const originalPrice = parseFloat(product.price) || 0;

                    if (productCurrency !== orderCurrency) {
                      return {
                        value: product.id,
                        label: `${product.name} (${product.sku}) - ${productCurrency} ${originalPrice.toFixed(
                          2
                        )} → ${orderCurrency} (will convert)`,
                      };
                    }

                    return {
                      value: product.id,
                      label: `${product.name} (${product.sku}) - ${productCurrency} ${originalPrice.toFixed(
                        2
                      )}`,
                    };
                  })}
                  placeholder="Select a product"
                  isSearchable
                  isLoading={loadingProducts}
                  isDisabled={editingItemIndex !== null}
                  styles={customSelectStyles}
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
                <Form.Label>
                  Quantity <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  placeholder="Enter quantity"
                  value={itemFormData.quantity}
                  onChange={(e) =>
                    setItemFormData({ ...itemFormData, quantity: parseInt(e.target.value) || 1 })
                  }
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
                      <span
                        className="spinner-border spinner-border-sm me-1"
                        role="status"
                        aria-hidden="true"
                      ></span>
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
                  onChange={(e) =>
                    setItemFormData({ ...itemFormData, unit_price: parseFloat(e.target.value) || 0 })
                  }
                  required
                  disabled={convertingPrice}
                />
                {itemFormData.product_id &&
                  (() => {
                    const selectedProduct = products.find((p) => p.id === itemFormData.product_id);
                    if (selectedProduct) {
                      const productCurrency = selectedProduct.currency.toUpperCase();
                      const orderCurrency = formData.currency.toUpperCase();
                      const originalPrice = parseFloat(selectedProduct.price) || 0;

                      if (productCurrency !== orderCurrency && itemFormData.unit_price !== originalPrice) {
                        return (
                          <Form.Text className="text-muted d-block">
                            Converted from {formatCurrency(originalPrice, productCurrency)} →{" "}
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
                      {formatCurrency(
                        itemFormData.quantity * itemFormData.unit_price,
                        formData.currency
                      )}
                    </h5>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => {
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
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={
              !itemFormData.product_id || itemFormData.quantity < 1 || itemFormData.unit_price <= 0
            }
            onClick={() => {
              const selectedProduct = products.find((p) => p.id === itemFormData.product_id);
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
            {editingItemIndex !== null ? "Update Item" : "Add Item"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ConvertToOrderModal;