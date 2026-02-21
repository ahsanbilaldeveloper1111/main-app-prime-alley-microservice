import React, { useState, useEffect } from "react";
import { Form, Badge, Table, Button } from "react-bootstrap";
import PhoneInput from "react-phone-number-input";
import { parsePhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { X, Upload, Package, AlertCircle, CheckCircle } from "lucide-react";
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

export interface ConvertDealToOrderModalProps {
  show: boolean;
  onHide: () => void;
  dealId: number;
  onSuccess?: () => void;
}

const fieldLabel = (text: string, required: boolean = false) => (
  <label
    style={{
      display: "block",
      fontSize: "14px",
      fontWeight: "600",
      color: "#141414",
      marginBottom: "8px",
    }}
  >
    {text}
    {required && <span style={{ color: "#f2545b", marginLeft: "2px" }}>*</span>}
  </label>
);

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #8a8a8a",
  borderRadius: "4px",
  fontSize: "16px",
  fontWeight: "300",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const fieldWrap: React.CSSProperties = { marginBottom: "20px" };

const sectionHeading: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#141414",
  marginBottom: "16px",
  marginTop: 0,
};

const sectionHeadingNext: React.CSSProperties = {
  ...sectionHeading,
  marginTop: "32px",
};

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

const ConvertDealToOrderModal: React.FC<ConvertDealToOrderModalProps> = ({
  show,
  onHide,
  dealId,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingDeal, setLoadingDeal] = useState(false);
  const [stages, setStages] = useState<StageData[]>([]);
  const [products, setProducts] = useState<CrmProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [sourceDeal, setSourceDeal] = useState<DealData | null>(null);
  const [selectedEstimateId, setSelectedEstimateId] = useState<number | null>(null);
  const [convertingPrice, setConvertingPrice] = useState(false);
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

  const focusStyle = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderColor = "#0091ae");
  const blurStyle = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderColor = "#8a8a8a");

  useEffect(() => {
    if (!show) return;
    fetchStages();
    fetchProducts();
  }, [show]);

  useEffect(() => {
    if (show && dealId) {
      fetchDealData();
    }
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

  const fetchDealData = async () => {
    try {
      setLoadingDeal(true);
      const dealData = await getDeal(dealId);
      setSourceDeal(dealData);

      const estimates = dealData.estimates || [];
      const sortedEstimates = [...estimates].sort((a: any, b: any) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (dateA !== dateB) return dateB - dateA;
        return (b.id || 0) - (a.id || 0);
      });
      const latestEstimate =
        sortedEstimates.find((e: any) => e.is_final) || sortedEstimates[0];

      if (latestEstimate) setSelectedEstimateId(latestEstimate.id);

      const decisionMaker = dealData.main_decision_maker || {
        name: dealData.decision_maker_name,
        phone_country_code: dealData.decision_maker_phone_country_code,
        phone: dealData.decision_maker_phone,
        email: dealData.decision_maker_email,
      };

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
        } catch (_) {}
      }

      const dealAny = dealData as any;
      setFormData((prev) => ({
        ...prev,
        customer_name: decisionMaker.name || dealData.company_name || "",
        customer_email: decisionMaker.email || dealData.decision_maker_email || "",
        customer_phone: phoneNumber,
        customer_phone_country_code: phoneCountryCode,
        customer_address: dealAny.customer_address ?? dealAny.company_address ?? "",
        order_date: new Date().toISOString().split("T")[0],
        expected_delivery_date: prev.expected_delivery_date || "",
        currency: dealData.currency || "AED",
        industry: dealData.industry || "",
        tax_percentage: latestEstimate?.tax_percentage != null ? String(latestEstimate.tax_percentage) : "0",
        standard_discount_percentage: latestEstimate?.standard_discount_percentage != null ? String(latestEstimate.standard_discount_percentage) : "0",
        special_discount_percentage: latestEstimate?.special_discount_percentage != null ? String(latestEstimate.special_discount_percentage) : "0",
      }));

      if (latestEstimate?.estimation_chart?.length) {
        const items: OrderItem[] = latestEstimate.estimation_chart.map((item: any) => ({
          product_id: item.product_id,
          product_name: item.product_service,
          description: item.description || "",
          quantity: String(item.qty),
          unit_price: item.unit_price,
          total_price: (item.qty * item.unit_price).toFixed(2),
          original_currency: item.original_currency || dealData.currency,
          original_price: item.original_price ?? item.unit_price,
        }));
        setFormData((p) => ({ ...p, items }));
      }
    } catch (error) {
      console.error("Failed to fetch deal:", error);
      toast.error("Failed to load deal data");
    } finally {
      setLoadingDeal(false);
    }
  };

  const handleEstimateChange = async (estimateId: number | null) => {
    if (!sourceDeal || !estimateId) return;
    const estimates = sourceDeal.estimates || [];
    const selectedEstimate = estimates.find((e: any) => e.id === estimateId);
    if (!selectedEstimate) return;

    setSelectedEstimateId(estimateId);
    setFormData((prev) => ({
      ...prev,
      tax_percentage: selectedEstimate.tax_percentage != null ? String(selectedEstimate.tax_percentage) : "0",
      standard_discount_percentage: selectedEstimate.standard_discount_percentage != null ? String(selectedEstimate.standard_discount_percentage) : "0",
      special_discount_percentage: selectedEstimate.special_discount_percentage != null ? String(selectedEstimate.special_discount_percentage) : "0",
    }));

    if (selectedEstimate.estimation_chart?.length) {
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
                original_price: item.original_price ?? item.unit_price,
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
          original_price: item.original_price ?? item.unit_price,
        }));
        setFormData((prev) => ({ ...prev, items }));
      }
    } else {
      setFormData((prev) => ({ ...prev, items: [] }));
    }
  };

  const calculateTotals = () => {
    const grandTotal = formData.items.reduce(
      (sum, item) => sum + parseFloat(item.quantity || "0") * (item.unit_price || 0),
      0
    );
    const totalDiscountPercentage =
      parseFloat(formData.standard_discount_percentage || "0") +
      parseFloat(formData.special_discount_percentage || "0");
    const totalDiscount = (grandTotal * totalDiscountPercentage) / 100;
    const special_discount_amount =
      (grandTotal * parseFloat(formData.special_discount_percentage || "0")) / 100;
    const subtotalAfterDiscount = grandTotal - totalDiscount;
    const taxAmount =
      (subtotalAfterDiscount * parseFloat(formData.tax_percentage || "0")) / 100;
    const netValue = subtotalAfterDiscount + taxAmount;
    return {
      grandTotal,
      totalDiscount,
      special_discount_amount,
      subtotalAfterDiscount,
      taxAmount,
      netValue,
    };
  };

  const handleFileUpload = (file: File) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload PDF, DOC, or DOCX files only.");
      return;
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File size exceeds 5MB. Please upload a smaller file.");
      return;
    }
    setContractDocument(file);
    if (file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onloadend = () => setContractDocumentPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setContractDocumentPreview(file.name);
    }
    toast.success("Document uploaded successfully!");
  };

  const validateForm = (): boolean => {
    const requiredFields = [
      { field: "customer_name" as const, name: "Company Name" },
      { field: "customer_email" as const, name: "Company Email", type: ValidationType.EMAIL },
      { field: "customer_phone" as const, name: "Company Phone" },
      { field: "order_date" as const, name: "Order Date" },
      { field: "order_stage_id" as const, name: "Stage" },
      { field: "currency" as const, name: "Currency" },
    ];
    if (!checkRequiredFields(formData, requiredFields)) return false;
    if (!formData.items?.length) {
      toast.error("Please add at least one item to the order (from deal estimate).");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

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

      const payload = new FormData();
      payload.append("customer_name", formData.customer_name);
      payload.append("customer_email", formData.customer_email);
      payload.append("customer_phone", formattedPhone);
      payload.append("customer_address", formData.customer_address || "");
      payload.append("order_date", formData.order_date);
      payload.append("expected_delivery_date", formData.expected_delivery_date || "");
      payload.append("order_stage_id", String(formData.order_stage_id));
      payload.append("notes", formData.notes || "");
      payload.append("tax_amount", totals.taxAmount.toFixed(2));
      payload.append("discount_amount", totals.totalDiscount.toFixed(2));
      payload.append("total_amount", totals.grandTotal.toFixed(2));
      payload.append("final_amount", totals.netValue.toFixed(2));
      payload.append("currency", formData.currency);
      payload.append("industry", formData.industry || "");
      payload.append("order_approval_status", formData.order_approval_status || "");
      payload.append("fulfillment_status", formData.fulfillment_status || "");
      payload.append("payment_status", formData.payment_status || "");
      payload.append("items", JSON.stringify(itemsPayload));
      payload.append("deal_id", String(dealId));
      if (contractDocument) payload.append("creation_attachment", contractDocument);

      await createOrder(payload);
      resetForm();
      onHide();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Failed to create order:", error);
      toast.error(error?.response?.data?.message || "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
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
    setContractDocument(null);
    setContractDocumentPreview(null);
  };

  const handleClose = () => {
    resetForm();
    onHide();
  };

  const totals = calculateTotals();

  if (!show) return null;

  return (
    <>
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          background: "transparent",
        }}
      />

      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "600px",
          maxWidth: "100vw",
          height: "100vh",
          backgroundColor: "#ffffff",
          boxShadow: "-2px 0 8px rgba(0,0,0,0.1)",
          zIndex: 1001,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #eaf0f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "#141414",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            Convert Deal to Order
            {sourceDeal && (
              <Badge bg="info" style={{ fontWeight: "500" }}>
                {sourceDeal.name}
              </Badge>
            )}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            style={{
              background: "transparent",
              border: "none",
              padding: "4px",
              cursor: "pointer",
              color: "#718096",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={24} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "24px 40px 40px" }}>
          {loadingDeal ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p style={{ margin: 0, fontSize: "14px", color: "#141414" }}>
                Loading deal data...
              </p>
            </div>
          ) : (
            <Form onSubmit={handleSubmit}>
              {sourceDeal && (
                <>
                  <div style={{ ...fieldWrap, padding: "12px", background: "#f0f9ff", borderRadius: "8px", border: "1px solid #bae6fd" }}>
                    <div style={{ fontSize: "13px", color: "#0c4a6e", marginBottom: "8px" }}>
                      <strong>Deal:</strong> {sourceDeal.name}
                      {sourceDeal.company_name ? ` • ${sourceDeal.company_name}` : null}
                      {sourceDeal.id != null ? ` • #${sourceDeal.id}` : null}
                    </div>
                    {sourceDeal.estimates && sourceDeal.estimates.length > 1 && (
                      <div style={fieldWrap}>
                        {fieldLabel("Estimate revision")}
                        <select
                          value={selectedEstimateId ?? ""}
                          onChange={(e) =>
                            handleEstimateChange(e.target.value ? Number(e.target.value) : null)
                          }
                          style={inputStyle}
                        >
                          {sourceDeal.estimates.map((estimate: any) => (
                            <option key={estimate.id} value={estimate.id}>
                              Version {estimate.version} {estimate.is_final ? "(Final)" : ""} –{" "}
                              {estimate.currency} {estimate.net_value}
                              {estimate.created_at &&
                                ` (${new Date(estimate.created_at).toLocaleDateString()})`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </>
              )}

              <h3 style={sectionHeading}>ORDER INFORMATION</h3>

              <div style={fieldWrap}>
                {fieldLabel("Company Name", true)}
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_name: e.target.value })
                  }
                  style={inputStyle}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                  placeholder="Enter company name"
                />
              </div>
              <div style={fieldWrap}>
                {fieldLabel("Company Email", true)}
                <input
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_email: e.target.value })
                  }
                  style={inputStyle}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                  placeholder="company@example.com"
                />
              </div>
              <div style={fieldWrap}>
                {fieldLabel("Company Phone", true)}
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
                      } catch {
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
                  style={{ width: "100%" }}
                  className="form-control"
                  placeholder="Enter phone number"
                />
              </div>
              <div style={fieldWrap}>
                {fieldLabel("Company Address")}
                <input
                  type="text"
                  value={formData.customer_address}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_address: e.target.value })
                  }
                  style={inputStyle}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                  placeholder="Enter address"
                />
              </div>
              <div style={fieldWrap}>
                {fieldLabel("Order Date", true)}
                <input
                  type="date"
                  value={formData.order_date}
                  onChange={(e) =>
                    setFormData({ ...formData, order_date: e.target.value })
                  }
                  style={inputStyle}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
              </div>
              <div style={fieldWrap}>
                {fieldLabel("Expected Delivery Date")}
                <input
                  type="date"
                  value={formData.expected_delivery_date}
                  onChange={(e) =>
                    setFormData({ ...formData, expected_delivery_date: e.target.value })
                  }
                  style={inputStyle}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
              </div>
              <div style={fieldWrap}>
                {fieldLabel("Stage", true)}
                <select
                  value={formData.order_stage_id ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      order_stage_id: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  style={inputStyle}
                >
                  <option value="">Select Stage</option>
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={fieldWrap}>
                {fieldLabel("Currency", true)}
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  style={inputStyle}
                >
                  <option value="AED">AED</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div style={fieldWrap}>
                {fieldLabel("Industry")}
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  style={inputStyle}
                >
                  <option value="">Select Industry</option>
                  <option value="Individual/Residential">Individual/Residential</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Retail">Retail</option>
                  <option value="Office">Office</option>
                  <option value="Mixed-use">Mixed-use</option>
                </select>
              </div>
              <div style={fieldWrap}>
                {fieldLabel("Order Approval Status")}
                <select
                  value={formData.order_approval_status}
                  onChange={(e) =>
                    setFormData({ ...formData, order_approval_status: e.target.value })
                  }
                  style={inputStyle}
                >
                  <option value="">Not Set</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div style={fieldWrap}>
                {fieldLabel("Fulfillment Status")}
                <select
                  value={formData.fulfillment_status}
                  onChange={(e) =>
                    setFormData({ ...formData, fulfillment_status: e.target.value })
                  }
                  style={inputStyle}
                >
                  <option value="">Not Set</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div style={fieldWrap}>
                {fieldLabel("Payment Status")}
                <select
                  value={formData.payment_status}
                  onChange={(e) =>
                    setFormData({ ...formData, payment_status: e.target.value })
                  }
                  style={inputStyle}
                >
                  <option value="">Not Set</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <div style={fieldWrap}>
                {fieldLabel("Notes")}
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={{ ...inputStyle, minHeight: "80px" }}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                  placeholder="Additional notes..."
                />
              </div>

              <h3 style={sectionHeadingNext}>ORDER ITEMS</h3>
              <div style={fieldWrap}>
                <div style={{ overflowX: "auto" }}>
                  <Table hover size="sm" className="align-middle">
                    <thead style={{ background: "#f8fafc" }}>
                      <tr>
                        <th>#</th>
                        <th>Product</th>
                        <th className="text-center">Qty</th>
                        <th className="text-end">Unit Price</th>
                        <th className="text-end">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, index) => {
                        const subtotal =
                          parseFloat(item.quantity || "0") * (item.unit_price || 0);
                        const product = products.find((p) => p.id === item.product_id);
                        const showConversion =
                          product &&
                          product.currency.toUpperCase() !== formData.currency.toUpperCase() &&
                          item.original_currency &&
                          item.original_price !== item.unit_price;

                        return (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td className="fw-semibold">{item.product_name || "N/A"}</td>
                            <td className="text-center">{item.quantity || "0"}</td>
                            <td className="text-end">
                              <div>
                                {formData.currency}{" "}
                                {parseFloat(String(item.unit_price || "0")).toLocaleString(
                                  undefined,
                                  { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                                )}
                              </div>
                              {showConversion && (
                                <div style={{ fontSize: "11px", color: "#64748b" }}>
                                  Original:{" "}
                                  {formatCurrency(
                                    item.original_price ?? item.unit_price,
                                    item.original_currency || formData.currency
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="text-end fw-semibold">
                              {formData.currency}{" "}
                              {subtotal.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {formData.items.length > 0 && (
                      <tfoot style={{ background: "#f8fafc" }}>
                        <tr>
                          <td colSpan={4} className="text-end">
                            <strong>Subtotal:</strong>
                          </td>
                          <td className="text-end fw-semibold">
                            {formData.currency}{" "}
                            {totals.grandTotal.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                        {totals.totalDiscount > 0 && (
                          <tr>
                            <td colSpan={4} className="text-end text-muted">
                              Discount
                            </td>
                            <td className="text-end text-danger">
                              - {formData.currency}{" "}
                              {totals.totalDiscount.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                        )}
                        {parseFloat(formData.tax_percentage || "0") > 0 && (
                          <tr>
                            <td colSpan={4} className="text-end">
                              Tax ({formData.tax_percentage}%)
                            </td>
                            <td className="text-end fw-semibold">
                              {formData.currency}{" "}
                              {totals.taxAmount.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                        )}
                        <tr style={{ borderTop: "2px solid #e2e8f0" }}>
                          <td colSpan={4} className="text-end">
                            <strong>Total:</strong>
                          </td>
                          <td className="text-end fw-bold text-success">
                            {formData.currency}{" "}
                            {totals.netValue.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </Table>
                </div>
                {formData.items.length === 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "24px",
                      color: "#64748b",
                      background: "#f8fafc",
                      borderRadius: "8px",
                    }}
                  >
                    <Package size={32} style={{ opacity: 0.5, marginBottom: "8px" }} />
                    <div>No items – select an estimate with line items above</div>
                  </div>
                )}
              </div>

              <h3 style={sectionHeadingNext}>DOCUMENT UPLOAD (OPTIONAL)</h3>
              <div style={fieldWrap}>
                <div
                  onClick={() => document.getElementById("convert-deal-order-file")?.click()}
                  style={{
                    border: `2px dashed ${contractDocument ? "#198754" : "#dee2e6"}`,
                    borderRadius: "8px",
                    padding: "24px",
                    textAlign: "center",
                    cursor: "pointer",
                    background: contractDocument ? "#f8fdf9" : "#fafbfc",
                  }}
                >
                  {!contractDocument ? (
                    <>
                      <Upload size={32} style={{ opacity: 0.5, marginBottom: "8px" }} />
                      <div style={{ fontSize: "14px" }}>
                        Drop contract document here or click to browse
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                        PDF, DOC, DOCX • Max 5MB
                      </div>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={32} className="text-success mb-2" />
                      <div className="text-success fw-semibold">{contractDocument.name}</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        {(contractDocument.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setContractDocument(null);
                          setContractDocumentPreview(null);
                          const el = document.getElementById("convert-deal-order-file") as HTMLInputElement;
                          if (el) el.value = "";
                        }}
                        style={{
                          marginTop: "8px",
                          padding: "4px 12px",
                          fontSize: "12px",
                          border: "1px solid #dc3545",
                          borderRadius: "4px",
                          background: "#fff",
                          color: "#dc3545",
                          cursor: "pointer",
                        }}
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
                <input
                  id="convert-deal-order-file"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
                <div
                  style={{
                    marginTop: "12px",
                    padding: "12px",
                    background: "#e0f2fe",
                    borderRadius: "8px",
                    fontSize: "13px",
                    color: "#0c4a6e",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                  }}
                >
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    You can skip this and attach the contract later. Accepted: PDF, DOC, DOCX (max 5MB).
                  </div>
                </div>
              </div>
            </Form>
          )}
        </div>

        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #eaf0f6",
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
          }}
        >
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={loading || loadingDeal || !formData.items?.length}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Creating...
              </>
            ) : (
              "Create Order"
            )}
          </Button>
        </div>
      </div>
    </>
  );
};

export default ConvertDealToOrderModal;
