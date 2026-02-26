import React, { useState, useEffect } from "react";
import {
  updateOrderAccount,
  updateOrderDelivery,
  getOrder,
  getStages,
  StageData,
  getCrmProducts,
  CrmProduct,
} from "@utils/crm";
import { Form, Table } from "react-bootstrap";
import PhoneInput, { parsePhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import { GetHierarchyData } from "@utils/users";
import { ModuleSlug } from "@utils/Helper";

export type EditOrderMode = "account" | "delivery";

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

export interface EditOrderSidebarProps {
  onClose: () => void;
  orderId: number;
  editMode: EditOrderMode;
  onSuccess?: () => void;
}

const fieldWrap: React.CSSProperties = {
  marginBottom: "16px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #8a8a8a",
  borderRadius: "4px",
  fontSize: "14px",
};

const fieldLabel = (label: string, required?: boolean) => (
  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600, color: "#374151" }}>
    {label} {required && <span style={{ color: "#dc2626" }}>*</span>}
  </label>
);

export const EditOrderSidebar: React.FC<EditOrderSidebarProps> = ({
  onClose,
  orderId,
  editMode,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [stages, setStages] = useState<StageData[]>([]);
  const [products, setProducts] = useState<CrmProduct[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_phone_country_code: "",
    customer_address: "",
    order_date: "",
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
    auto_renewal: "n/a",
    poc_title: "",
    poc_name: "",
    poc_phone_country_code: "",
    poc_phone: "",
    billing_model: "",
    billing_status: "",
    payment_terms: "",
    payment_terms_custom: "",
  });

  useEffect(() => {
    fetchStages();
    fetchProducts();
    fetchExtensions();
    fetchOrderData();
  }, [orderId, editMode]);

  const fetchExtensions = async () => {
    try {
      const hierarchyData = await GetHierarchyData(ModuleSlug.CRM_ORDERS);
      if (hierarchyData?.extensions) setExtensions(hierarchyData.extensions);
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
        return dateString.split("T")[0];
      };

      const parsePhoneNumberFormat = (phone: string): { countryCode: string; phoneNumber: string } => {
        if (!phone) return { countryCode: "", phoneNumber: "" };
        try {
          const p = parsePhoneNumber(phone);
          if (p) {
            return {
              countryCode: `+${p.countryCallingCode}`,
              phoneNumber: p.nationalNumber,
            };
          }
        } catch {
          const match = phone.match(/^(\+\d{1,4})\s+(.+)$/);
          if (match) return { countryCode: match[1], phoneNumber: match[2] };
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
      const pocPhone = parsePhoneNumberFormat(order.poc_phone || "");

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
        contract_start_date: order.contract_start_date ? String(order.contract_start_date).split("T")[0] : "",
        contract_end_date: order.contract_end_date ? String(order.contract_end_date).split("T")[0] : "",
        auto_renewal: (() => {
          const v = order?.auto_renewal;
          const s = v != null ? String(v).toLowerCase().trim() : "";
          if (s === "yes" || v === true) return "yes";
          if (s === "no" || v === false) return "no";
          return "n/a";
        })(),
        poc_title: order.poc_title || "",
        poc_name: order.poc_name || "",
        poc_phone_country_code: pocPhone.countryCode,
        poc_phone: pocPhone.phoneNumber,
        billing_model: order.billing_model || "",
        billing_status: order.billing_status || "",
        payment_terms: order.payment_terms || "",
        payment_terms_custom: order.payment_terms_custom || "",
      });
    } catch (error) {
      console.error("Failed to fetch order:", error);
      toast.error("Failed to load order data");
      onClose();
    } finally {
      setFetching(false);
    }
  };

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
      const response = await getCrmProducts({ per_page: 100 });
      setProducts(response?.data || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const calculateTotals = () => {
    const grandTotal = formData.items.reduce(
      (sum, item) => sum + parseFloat(item.quantity || "0") * (item.unit_price || 0),
      0
    );
    const standardDiscount = (grandTotal * parseFloat(formData.standard_discount_percentage || "0")) / 100;
    const specialDiscount =
      ((grandTotal - standardDiscount) * parseFloat(formData.special_discount_percentage || "0")) / 100;
    const totalDiscount = standardDiscount + specialDiscount;
    const subtotalAfterDiscount = grandTotal - totalDiscount;
    const taxAmount = (subtotalAfterDiscount * parseFloat(formData.tax_percentage || "0")) / 100;
    const netValue = subtotalAfterDiscount + taxAmount;
    return { grandTotal, standardDiscount, specialDiscount, totalDiscount, subtotalAfterDiscount, taxAmount, netValue };
  };

  const handleSubmitAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const totals = calculateTotals();
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
        contract_start_date: formData.contract_start_date || "",
        contract_end_date: formData.contract_end_date || "",
        auto_renewal: formData.auto_renewal,
        notes: formData.notes || "",
        items: formData.items.map((item) => ({
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
      onClose();
    } catch (error: any) {
      console.error("Failed to update order:", error);
      toast.error(error?.response?.data?.message || "Failed to update order");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formattedPocPhone =
        formData.poc_phone_country_code && formData.poc_phone
          ? `${formData.poc_phone_country_code}${formData.poc_phone}`.replace(/\s+/g, "")
          : formData.poc_phone || "";
      const payload: any = {
        customer_address: formData.customer_address || "",
        expected_delivery_date: formData.expected_delivery_date || "",
        actual_delivery_date: formData.actual_delivery_date || "",
        fulfillment_status: formData.fulfillment_status || "",
        poc_title: formData.poc_title || "",
        poc_name: formData.poc_name || "",
        poc_phone_country_code: formData.poc_phone_country_code || "",
        poc_phone: formattedPocPhone,
      };
      await updateOrderDelivery(orderId, payload);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Failed to update order:", error);
      toast.error(error?.response?.data?.message || "Failed to update order");
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();
  const set = (key: keyof typeof formData) => (val: any) =>
    setFormData((prev) => ({ ...prev, [key]: val }));
  const setE = (key: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <>
      <div
        onClick={onClose}
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
          width: "560px",
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
          <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#141414", margin: 0 }}>
            Edit Order #{orderId} {editMode === "account" ? "(Account)" : "(Delivery)"}
          </h2>
          <button
            onClick={onClose}
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

        <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px 24px" }}>
          {fetching ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p>Loading order data...</p>
            </div>
          ) : editMode === "account" ? (
            <Form id="edit-order-account-form" onSubmit={handleSubmitAccount}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#141414", marginBottom: "16px", marginTop: 0 }}>
                ORDER INFORMATION (ACCOUNT)
              </h3>

              <div style={fieldWrap}>
                {fieldLabel("Currency", true)}
                <Form.Select value={formData.currency} onChange={(e) => set("currency")(e.target.value)} style={inputStyle}>
                  <option value="AED">AED</option>
                </Form.Select>
              </div>

              <div style={fieldWrap}>
                {fieldLabel("Order Approval Status")}
                <Form.Select value={formData.order_approval_status} onChange={(e) => set("order_approval_status")(e.target.value)} style={inputStyle}>
                  <option value="">Not Set</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </Form.Select>
              </div>

              <div style={fieldWrap}>
                {fieldLabel("Contract Type")}
                <Form.Select value={formData.contract_type} onChange={(e) => set("contract_type")(e.target.value)} style={inputStyle}>
                  <option value="">Not Set</option>
                  <option value="subscription">Subscription</option>
                  <option value="one-time">One-time</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="sla">SLA</option>
                  <option value="custom">Custom</option>
                </Form.Select>
              </div>

              <div style={fieldWrap}>
                {fieldLabel("Billing Model")}
                <Form.Select value={formData.billing_model} onChange={(e) => set("billing_model")(e.target.value)} style={inputStyle}>
                  <option value="">Select Model</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                  <option value="usage-based">Usage-based</option>
                  <option value="hybrid">Hybrid</option>
                </Form.Select>
              </div>

              <div style={fieldWrap}>
                {fieldLabel("Billing Status")}
                <Form.Select value={formData.billing_status} onChange={(e) => set("billing_status")(e.target.value)} style={inputStyle}>
                  <option value="">Select Status</option>
                  <option value="not_billed">Not Billed</option>
                  <option value="partially_billed">Partially Billed</option>
                  <option value="fully_billed">Fully Billed</option>
                  <option value="on_hold">On Hold</option>
                </Form.Select>
              </div>

              <div style={fieldWrap}>
                {fieldLabel("Payment Terms")}
                <Form.Select value={formData.payment_terms} onChange={(e) => set("payment_terms")(e.target.value)} style={inputStyle}>
                  <option value="">Select Terms</option>
                  <option value="due_upon_receipt">Due Upon Receipt</option>
                  <option value="net_15">Net 15</option>
                  <option value="net_30">Net 30</option>
                  <option value="net_45">Net 45</option>
                  <option value="net_60">Net 60</option>
                  <option value="advance">Advance</option>
                  <option value="milestone">Milestone</option>
                  <option value="installments">Installments</option>
                  <option value="custom">Custom</option>
                </Form.Select>
              </div>
              {formData.payment_terms === "custom" && (
                <div style={fieldWrap}>
                  {fieldLabel("Payment Terms Custom")}
                  <Form.Control type="text" value={formData.payment_terms_custom} onChange={setE("payment_terms_custom")} style={inputStyle} />
                </div>
              )}

              <div style={fieldWrap}>
                {fieldLabel("Contract Length")}
                <Form.Select value={formData.contract_length} onChange={(e) => set("contract_length")(e.target.value)} style={inputStyle}>
                  <option value="">Not Set</option>
                  <option value="1 month">1 month</option>
                  <option value="3 months">3 months</option>
                  <option value="6 months">6 months</option>
                  <option value="12 months">12 months</option>
                </Form.Select>
              </div>

              <div style={fieldWrap}>
                {fieldLabel("Contract Start Date")}
                <Form.Control type="date" value={formData.contract_start_date} onChange={setE("contract_start_date")} style={inputStyle} />
              </div>

              <div style={fieldWrap}>
                {fieldLabel("Contract End Date")}
                <Form.Control type="date" value={formData.contract_end_date} onChange={setE("contract_end_date")} style={inputStyle} />
              </div>

              <div style={fieldWrap}>
                {fieldLabel("Auto Renewal")}
                <Form.Select value={formData.auto_renewal} onChange={(e) => set("auto_renewal")(e.target.value)} style={inputStyle}>
                  <option value="n/a">N/A</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </Form.Select>
              </div>

              <div style={fieldWrap}>
                {fieldLabel("Payment Status")}
                <Form.Select value={formData.payment_status} onChange={(e) => set("payment_status")(e.target.value)} style={inputStyle}>
                  <option value="">Not Set</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                  <option value="refunded">Refunded</option>
                </Form.Select>
              </div>

              <div style={fieldWrap}>
                {fieldLabel("Notes")}
                <Form.Control as="textarea" rows={3} value={formData.notes} onChange={setE("notes")} placeholder="Additional notes..." style={inputStyle} />
              </div>

              {formData.items.length > 0 && (
                <>
                  <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#141414", marginBottom: "12px", marginTop: "24px" }}>
                    Order Items (read-only)
                  </h3>
                  <div style={{ overflowX: "auto", marginBottom: "16px" }}>
                    <Table size="sm" hover style={{ marginBottom: 0 }}>
                      <thead style={{ background: "#f8f9fa" }}>
                        <tr>
                          <th>#</th>
                          <th>Product</th>
                          <th>Qty</th>
                          <th>Unit Price</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.map((item, idx) => {
                          const subtotal = Number.parseFloat(item.quantity || "0") * item.unit_price;
                          return (
                            <tr key={item.id ?? idx}>
                              <td>{idx + 1}</td>
                              <td>{item.product_name || "N/A"}</td>
                              <td>{item.quantity}</td>
                              <td>{formData.currency} {item.unit_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td>{formData.currency} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot style={{ background: "#f8f9fa", fontWeight: 600 }}>
                        <tr>
                          <td colSpan={4} className="text-end">Total:</td>
                          <td>{formData.currency} {totals.netValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      </tfoot>
                    </Table>
                  </div>
                </>
              )}

              <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #eaf0f6", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button type="button" onClick={onClose} disabled={loading} style={{ padding: "10px 20px", backgroundColor: "transparent", color: "#141414", border: "1px solid #8a8a8a", borderRadius: "4px", fontSize: "14px", fontWeight: 500, cursor: loading ? "not-allowed" : "pointer" }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading} style={{ padding: "10px 20px", backgroundColor: loading ? "#cbd5e0" : "#0091ae", color: "#ffffff", border: "none", borderRadius: "4px", fontSize: "14px", fontWeight: 500, cursor: loading ? "not-allowed" : "pointer" }}>
                  {loading ? "Updating..." : "Update Order"}
                </button>
              </div>
            </Form>
          ) : (
            <Form id="edit-order-delivery-form" onSubmit={handleSubmitDelivery}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#141414", marginBottom: "16px", marginTop: 0 }}>
                ORDER INFORMATION (DELIVERY)
              </h3>

              <div style={fieldWrap}>
                {fieldLabel("Company Address")}
                <Form.Control type="text" value={formData.customer_address} onChange={setE("customer_address")} placeholder="Enter address" style={inputStyle} />
              </div>

              <div style={fieldWrap}>
                {fieldLabel("Expected Delivery Date")}
                <Form.Control type="date" value={formData.expected_delivery_date} onChange={setE("expected_delivery_date")} style={inputStyle} />
              </div>

              <div style={fieldWrap}>
                {fieldLabel("Actual Delivery Date")}
                <Form.Control type="date" value={formData.actual_delivery_date} onChange={setE("actual_delivery_date")} style={inputStyle} />
              </div>

              <div style={fieldWrap}>
                {fieldLabel("Fulfillment Status")}
                <Form.Select value={formData.fulfillment_status} onChange={(e) => set("fulfillment_status")(e.target.value)} style={inputStyle}>
                  <option value="">Not Set</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="fulfilled">Fulfilled</option>
                  <option value="not_fulfilled">Not Fulfilled</option>
                  <option value="payment_done">Payment Done</option>
                </Form.Select>
              </div>

              <div style={fieldWrap}>
                {fieldLabel("POC Title")}
                <Form.Select value={formData.poc_title} onChange={(e) => set("poc_title")(e.target.value)} style={inputStyle}>
                  <option value="">Select Title</option>
                  <option value="Mr.">Mr.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Dr.">Dr.</option>
                </Form.Select>
              </div>

              <div style={fieldWrap}>
                {fieldLabel("POC Name")}
                <Form.Control type="text" placeholder="Enter POC name" value={formData.poc_name} onChange={setE("poc_name")} style={inputStyle} />
              </div>

              <div style={fieldWrap}>
                {fieldLabel("POC Phone")}
                <div className="phone-input-wrapper">
                  <PhoneInput
                    international
                    defaultCountry="US"
                    value={
                      formData.poc_phone_country_code && formData.poc_phone
                        ? `${formData.poc_phone_country_code}${formData.poc_phone}`
                        : formData.poc_phone || undefined
                    }
                    onChange={(value) => {
                      if (value) {
                        try {
                          const p = parsePhoneNumber(value);
                          if (p) {
                            setFormData((prev) => ({
                              ...prev,
                              poc_phone_country_code: `+${p.countryCallingCode}`,
                              poc_phone: p.nationalNumber,
                            }));
                          } else {
                            setFormData((prev) => ({ ...prev, poc_phone_country_code: "", poc_phone: value }));
                          }
                        } catch {
                          setFormData((prev) => ({ ...prev, poc_phone_country_code: "", poc_phone: value }));
                        }
                      } else {
                        setFormData((prev) => ({ ...prev, poc_phone_country_code: "", poc_phone: "" }));
                      }
                    }}
                    placeholder="Enter phone number"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #eaf0f6", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button type="button" onClick={onClose} disabled={loading} style={{ padding: "10px 20px", backgroundColor: "transparent", color: "#141414", border: "1px solid #8a8a8a", borderRadius: "4px", fontSize: "14px", fontWeight: 500, cursor: loading ? "not-allowed" : "pointer" }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading} style={{ padding: "10px 20px", backgroundColor: loading ? "#cbd5e0" : "#0091ae", color: "#ffffff", border: "none", borderRadius: "4px", fontSize: "14px", fontWeight: 500, cursor: loading ? "not-allowed" : "pointer" }}>
                  {loading ? "Updating..." : "Update Order"}
                </button>
              </div>
            </Form>
          )}
        </div>
      </div>
    </>
  );
};

export default EditOrderSidebar;
