import React from "react";
import { Button, Badge, Modal, Spinner, Table } from "@crm/orders/orderListBootstrap";
import {
  Target,
  X,
  ShoppingBag,
  FileText,
  Info,
  History,
  User,
  Calendar,
  Building2,
  Mail,
  Edit,
  CheckCircle,
  DollarSign,
} from "@crm/orders/orderListLucideHeavy";
import { formatDateForTable } from "@utils/Helper";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import {
  PhoneDisplay,
  getInitials,
  getRandomColor,
} from "@crm/orders/orderListOrderPageShared";
import moment from "moment";
import {
  crmOrdersOrderViewModalEditRowHoverHandlers,
  crmOrdersOrderViewModalFooterCloseHoverHandlers,
  crmOrdersOrderViewModalHeaderCloseHoverHandlers,
} from "./crmOrdersPlannerModalHoverHandlers";

const { PERMISSIONS } = HEADER_CONSTANTS;

const ORDER_HISTORY_IGNORED_KEYS = new Set(["order_stage_id"]);

function orderViewOrderIdKeyPart(orderId: unknown): string {
  if (orderId == null) return "unknown";
  if (typeof orderId === "string" || typeof orderId === "number") {
    return String(orderId);
  }
  return "unknown";
}

function orderLineItemRowKey(orderId: unknown, item: any): string {
  const oid = orderViewOrderIdKeyPart(orderId);
  const id = item?.id;
  if (id != null && String(id) !== "") {
    return `order-line-${oid}-${id}`;
  }
  const productKey =
    item?.product_id ?? item?.product?.id ?? item?.product?.sku ?? "product";
  const quantity = item?.quantity ?? "qty";
  const unitPrice = item?.unit_price ?? "unit";
  const totalPrice = item?.total_price ?? "total";
  return `order-line-${oid}-${productKey}-${quantity}-${unitPrice}-${totalPrice}`;
}

function orderHistoryRowKey(orderId: unknown, history: any): string {
  const oid = orderViewOrderIdKeyPart(orderId);
  const id = history?.id;
  if (id != null && String(id) !== "") {
    return `history-${oid}-${id}`;
  }
  return `history-${oid}-${history?.created_at}-${history?.event}`;
}

type ReadonlyPick<K extends keyof CrmOrdersOrderViewModalRenderProps> = Readonly<
  Pick<CrmOrdersOrderViewModalRenderProps, K>
>;

export type CrmOrdersOrderViewModalRenderProps = Readonly<{
  viewingOrder: any;
  showOrderViewModal: boolean;
  setShowOrderViewModal: React.Dispatch<React.SetStateAction<boolean>>;
  loadingOrder: boolean;
  relatedDeal: any;
  relatedLead: any;
  extensions: readonly any[];
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  session: { user?: { permissions?: string[] } } | null;
}>;


function OrderViewModalHeader(
  props: ReadonlyPick<"viewingOrder" | "setShowOrderViewModal">,
): React.ReactElement {
  const { viewingOrder, setShowOrderViewModal } = props;
  return (
<div
  style={{
    background: "#fff",
    color: "black",
    padding: "24px 32px",
    position: "relative",
    borderTopLeftRadius: "12px",
    borderTopRightRadius: "12px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    borderBottom: "1px solid #ccc",
  }}
>
  <button
    onClick={() => setShowOrderViewModal(false)}
    style={{
      position: "absolute",
      top: "16px",
      right: "16px",
      background: "rgba(255,255,255,0.15)",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255,255,255,0.2)",
      color: "black",
      width: "32px",
      height: "32px",
      borderRadius: "8px",
      cursor: "pointer",
      transition: "all 0.2s ease",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
    {...crmOrdersOrderViewModalHeaderCloseHoverHandlers}
  >
    <X size={18} />
  </button>

  {/* Header Content */}
  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
    <div
      style={{
        width: "64px",
        height: "64px",
        borderRadius: "16px",
        background: "#f59e0b",
        backdropFilter: "blur(10px)",
        border: "2px solid rgba(255,255,255,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "28px",
        fontWeight: "700",
        flexShrink: 0,
        color: "#fff",
      }}
    >
      <ShoppingBag size={32} style={{ color: "white" }} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <h2 style={{ 
        margin: 0, 
        fontWeight: 700, 
        fontSize: "26px",
        textShadow: "0 2px 4px rgba(0,0,0,0.1)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {viewingOrder.order_number || `Order #${viewingOrder.id}`}
      </h2>
      <div style={{ 
        marginTop: "6px", 
        opacity: 0.95, 
        fontSize: "14px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap",
        color: "#000",
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Target size={14} />
          {viewingOrder.stage?.name || "No stage"}
        </span>
        <span>•</span>
        <span style={{ fontWeight: 600 }}>
          {viewingOrder.currency || "AED"} {Number.parseFloat(viewingOrder.final_amount || viewingOrder.total_amount || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span>•</span>
        <span>
          {viewingOrder.order_date ? moment(viewingOrder.order_date).format("MMM DD, YYYY") : "N/A"}
        </span>
      </div>
    </div>
  </div>
</div>

  );
}


function OrderViewModalLoadingState(): React.ReactElement {
  return (
    <div style={{
      padding: "48px 20px",
      textAlign: "center",
    }}>
      <Spinner animation="border" variant="primary" size="sm" style={{ marginBottom: "12px" }} />
      <p className="mb-0" style={{ color: "#6b7280", fontSize: "14px" }}>Loading order details...</p>
    </div>
  );
}

function OrderViewModalInlineStyles(): React.ReactElement {
  return (
      <style>{`
        .order-detail-filter-buttons {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 0;
          padding: 0;
          width: 100%;
        }

        .order-detail-filter-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 8px;
          border: 1px solid;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: white;
          white-space: nowrap;
        }

        .order-detail-filter-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .order-detail-filter-button.active {
          color: white;
        }

        .order-detail-filter-button.active .filter-icon {
          color: white;
        }

        .order-detail-filter-button:not(.active) .filter-icon {
          color: inherit;
        }

        .filter-icon {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }

        .order-view-stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(245, 158, 11, 0.15);
        }
      `}</style>

  );
}

const ORDER_VIEW_MODAL_TAB_ACCENT = "#f59e0b";

function OrderViewModalTabNavButton(
  props: Readonly<{
    tabId: string;
    activeTab: string;
    setActiveTab: React.Dispatch<React.SetStateAction<string>>;
    children: React.ReactNode;
  }>,
): React.ReactElement {
  const { tabId, activeTab, setActiveTab, children } = props;
  const isActive = activeTab === tabId;
  return (
    <button
      type="button"
      className={`order-detail-filter-button ${isActive ? "active" : ""}`}
      onClick={() => setActiveTab(tabId)}
      style={{
        backgroundColor: isActive ? ORDER_VIEW_MODAL_TAB_ACCENT : "white",
        borderColor: ORDER_VIEW_MODAL_TAB_ACCENT,
        color: isActive ? "white" : ORDER_VIEW_MODAL_TAB_ACCENT,
      }}
    >
      {children}
    </button>
  );
}

function OrderViewModalTabNav(
  props: ReadonlyPick<"activeTab" | "setActiveTab">,
): React.ReactElement {
  const { activeTab, setActiveTab } = props;
  return (
    <>
          {/* Tabs Navigation */}
          <div className="order-detail-filter-buttons mb-4">
            <OrderViewModalTabNavButton
              tabId="tab1"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            >
              <ShoppingBag className="filter-icon" size={18} />
              <span>General Information</span>
            </OrderViewModalTabNavButton>
            <OrderViewModalTabNavButton
              tabId="tab2"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            >
              <FileText className="filter-icon" size={18} />
              <span>Lead/Deal Information</span>
            </OrderViewModalTabNavButton>
            <OrderViewModalTabNavButton
              tabId="additional-info"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            >
              <Info className="filter-icon" size={18} />
              <span>Additional Information</span>
            </OrderViewModalTabNavButton>
            <OrderViewModalTabNavButton
              tabId="history"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            >
              <History className="filter-icon" size={18} />
              <span>History</span>
            </OrderViewModalTabNavButton>
          </div>
    </>
  );
}


function OrderViewModalTabGeneral(
  props: Readonly<{ viewingOrder: CrmOrdersOrderViewModalRenderProps["viewingOrder"] }>,
): React.ReactElement {
  const { viewingOrder } = props;
  const itemsHaveDescription =
    Array.isArray(viewingOrder.items) &&
    viewingOrder.items.some((item: any) => Boolean(item.description));
  const orderItemsLineItemColSpan = itemsHaveDescription ? 6 : 5;
  return (
            <div>
              {/* Quick Info Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginBottom: "28px" }}>
                <div
                  className="order-view-stat-card"
                  style={{
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    padding: "20px",
                    borderRadius: "12px",
                    transition: "all 0.3s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "10px",
                      background: viewingOrder.stage?.color || "#6c757d",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <Target size={20} style={{ color: "white" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.8px",
                        marginBottom: "4px",
                      }}>
                        Stage
                      </div>
                      <div style={{
                        fontSize: "15px",
                        color: "#1f2937",
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {viewingOrder.stage?.name || "Not assigned"}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="order-view-stat-card"
                  style={{
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    padding: "20px",
                    borderRadius: "12px",
                    transition: "all 0.3s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "10px",
                      background: orderViewModalOrderStatusIconBg(viewingOrder.status),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <CheckCircle size={20} style={{ color: "white" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.8px",
                        marginBottom: "4px",
                      }}>
                        Status
                      </div>
                      <div style={{
                        fontSize: "15px",
                        color: "#1f2937",
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {viewingOrder.status || "N/A"}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="order-view-stat-card"
                  style={{
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    padding: "20px",
                    borderRadius: "12px",
                    transition: "all 0.3s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "10px",
                      background: "#10b981",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <DollarSign size={20} style={{ color: "white" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#10b981",
                        textTransform: "uppercase",
                        letterSpacing: "0.8px",
                        marginBottom: "4px",
                      }}>
                        Final Amount
                      </div>
                      <div style={{
                        fontSize: "15px",
                        color: "#1f2937",
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {viewingOrder.currency || "AED"} {Number.parseFloat(viewingOrder.final_amount || viewingOrder.total_amount || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="order-view-stat-card"
                  style={{
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    padding: "20px",
                    borderRadius: "12px",
                    transition: "all 0.3s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "10px",
                      background: "#3b82f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <Calendar size={20} style={{ color: "white" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#3b82f6",
                        textTransform: "uppercase",
                        letterSpacing: "0.8px",
                        marginBottom: "4px",
                      }}>
                        Order Date
                      </div>
                      <div style={{
                        fontSize: "15px",
                        color: "#1f2937",
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {viewingOrder.order_date ? formatDateForTable(viewingOrder.order_date) : "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Information Section */}
              <div style={{ marginBottom: "28px" }}>
                <h5 style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#1f2937",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}>
                  <div style={{
                    width: "4px",
                    height: "18px",
                    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    borderRadius: "2px",
                  }} />
                  Order Details
                </h5>
                <div style={{
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "20px",
                }}>
                  <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6b7280", fontSize: "14px", fontWeight: 600 }}>
                      <ShoppingBag size={16} style={{ color: "#f59e0b" }} />
                      Order Number
                    </div>
                    <div style={{ color: "#1f2937", fontSize: "15px", fontWeight: 500 }}>
                      {viewingOrder.order_number || `ORD-${viewingOrder.id}`}
                    </div>

                    {viewingOrder.expected_delivery_date && (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6b7280", fontSize: "14px", fontWeight: 600 }}>
                          <Calendar size={16} style={{ color: "#f59e0b" }} />
                          Expected Delivery
                        </div>
                        <div style={{ color: "#1f2937", fontSize: "15px", fontWeight: 500 }}>
                          {formatDateForTable(viewingOrder.expected_delivery_date)}
                        </div>
                      </>
                    )}

                    {viewingOrder.industry && (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6b7280", fontSize: "14px", fontWeight: 600 }}>
                          <Building2 size={16} style={{ color: "#f59e0b" }} />
                          Industry
                        </div>
                        <div style={{ color: "#1f2937", fontSize: "15px", fontWeight: 500 }}>
                          {viewingOrder.industry}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Company Information Section */}
              <div style={{ marginBottom: "28px" }}>
                <h5 style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#1f2937",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}>
                  <div style={{
                    width: "4px",
                    height: "18px",
                    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    borderRadius: "2px",
                  }} />
                  Company Information
                </h5>
                <div style={{
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "20px",
                }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
                    {viewingOrder.customer_name && (
                      <div>
                        <div style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: "6px",
                        }}>
                          Company Name
                        </div>
                        <div style={{
                          fontSize: "14px",
                          color: "#1f2937",
                          fontWeight: 500,
                          wordBreak: "break-word",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}>
                          <div
                            style={{
                              width: "30px",
                              height: "30px",
                              borderRadius: "50%",
                              backgroundColor: getRandomColor(viewingOrder.customer_name),
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "10px",
                              fontWeight: "600",
                              flexShrink: 0,
                            }}
                          >
                            {getInitials(viewingOrder.customer_name)}
                          </div>
                          <span>{viewingOrder.customer_name}</span>
                        </div>
                      </div>
                    )}
                    {viewingOrder.customer_email && (
                      <div>
                        <div style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: "6px",
                        }}>
                          Email
                        </div>
                        <div style={{
                          fontSize: "14px",
                          color: "#1f2937",
                          fontWeight: 500,
                          wordBreak: "break-word",
                        }}>
                          <Mail size={14} style={{ color: "#f59e0b", marginRight: "6px", display: "inline" }} />
                          {viewingOrder.customer_email}
                        </div>
                      </div>
                    )}
                    {viewingOrder.customer_phone && (
                      <div>
                        <div style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: "6px",
                        }}>
                          Phone
                        </div>
                        <div style={{
                          fontSize: "14px",
                          color: "#1f2937",
                          fontWeight: 500,
                          wordBreak: "break-word",
                        }}>
                          <PhoneDisplay phone={viewingOrder.customer_phone || ""} />
                        </div>
                      </div>
                    )}
                    {viewingOrder.customer_address && (
                      <div style={{ gridColumn: "1 / -1" }}>
                        <div style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: "6px",
                        }}>
                          Address
                        </div>
                        <div style={{
                          fontSize: "14px",
                          color: "#1f2937",
                          fontWeight: 500,
                          wordBreak: "break-word",
                        }}>
                          {viewingOrder.customer_address}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items/Products */}
              {viewingOrder.items && Array.isArray(viewingOrder.items) && viewingOrder.items.length > 0 && (
                <div style={{ marginBottom: "28px" }}>
                  <h5 style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#1f2937",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}>
                    <div style={{
                      width: "4px",
                      height: "18px",
                      background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                      borderRadius: "2px",
                    }} />
                    Order Items
                    <Badge 
                      bg="secondary"
                      style={{
                        marginLeft: "8px",
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "4px 10px",
                        borderRadius: "6px",
                      }}
                    >
                      {viewingOrder.items.length}
                    </Badge>
                  </h5>
                  <div style={{
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}>
                    <div style={{ overflowX: "auto" }}>
                      <Table hover style={{ width: "100%", marginBottom: 0, tableLayout: "auto" }}>
                        <thead style={{ background: "#f9fafb" }}>
                          <tr>
                            <th style={{ padding: "12px 16px", fontSize: "11px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>#</th>
                            <th style={{ padding: "12px 16px", fontSize: "11px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>Product Name</th>
                            <th style={{ padding: "12px 16px", fontSize: "11px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>SKU</th>
                            <th style={{ padding: "12px 16px", fontSize: "11px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>Quantity</th>
                            {itemsHaveDescription && (
                              <th style={{ padding: "12px 16px", fontSize: "11px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>Description</th>
                            )}
                            <th style={{ padding: "12px 16px", fontSize: "11px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>Unit Price</th>
                            <th style={{ padding: "12px 16px", fontSize: "11px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewingOrder.items.map((item: any, index: number) => (
                            <tr
                              key={orderLineItemRowKey(viewingOrder.id, item)}
                              style={{ borderBottom: "1px solid #f3f4f6" }}
                            >
                              <td style={{ padding: "14px 16px", fontSize: "13px", color: "#1f2937" }}>{index + 1}</td>
                              <td style={{ padding: "14px 16px", fontSize: "13px", color: "#1f2937", fontWeight: 600 }}>
                                {item.product_name || item.product?.name || "N/A"}
                              </td>
                              <td style={{ padding: "14px 16px", fontSize: "13px", color: "#6b7280" }}>{item.product?.sku || "N/A"}</td>
                              <td style={{ padding: "14px 16px", fontSize: "13px", color: "#1f2937" }}>{item.quantity || "0"}</td>
                              {itemsHaveDescription && (
                                <td style={{ padding: "14px 16px", fontSize: "13px", color: "#6b7280", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {item.description || "-"}
                                </td>
                              )}
                              <td style={{ padding: "14px 16px", fontSize: "13px", color: "#1f2937" }}>
                                {viewingOrder.currency || "AED"} {Number.parseFloat(item.unit_price || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td style={{ padding: "14px 16px", fontSize: "13px", color: "#1f2937", fontWeight: 600 }}>
                                {viewingOrder.currency || "AED"} {Number.parseFloat(item.total_price || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot style={{ background: "#f9fafb", fontWeight: 600 }}>
                          <tr>
                            <td colSpan={orderItemsLineItemColSpan} style={{ padding: "12px 16px", textAlign: "right", fontSize: "13px", color: "#6b7280" }}>
                              Subtotal:
                            </td>
                            <td style={{ padding: "12px 16px", fontSize: "13px", color: "#1f2937" }}>
                              {viewingOrder.currency || "AED"} {Number.parseFloat(viewingOrder.total_amount || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                          {viewingOrder.discount_amount && Number.parseFloat(viewingOrder.discount_amount) > 0 && (
                            <tr>
                              <td colSpan={orderItemsLineItemColSpan} style={{ padding: "12px 16px", textAlign: "right", fontSize: "13px", color: "#6b7280" }}>
                                Discount:
                              </td>
                              <td style={{ padding: "12px 16px", fontSize: "13px", color: "#dc2626" }}>
                                - {viewingOrder.currency || "AED"} {Number.parseFloat(viewingOrder.discount_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          )}
                          {viewingOrder.tax_amount && Number.parseFloat(viewingOrder.tax_amount) > 0 && (
                            <tr>
                              <td colSpan={orderItemsLineItemColSpan} style={{ padding: "12px 16px", textAlign: "right", fontSize: "13px", color: "#6b7280" }}>
                                Tax:
                              </td>
                              <td style={{ padding: "12px 16px", fontSize: "13px", color: "#1f2937" }}>
                                {viewingOrder.currency || "AED"} {Number.parseFloat(viewingOrder.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          )}
                          <tr style={{ fontSize: "16px" }}>
                            <td colSpan={orderItemsLineItemColSpan} style={{ padding: "12px 16px", textAlign: "right", fontSize: "14px", color: "#1f2937", fontWeight: 700 }}>
                              Total:
                            </td>
                            <td style={{ padding: "12px 16px", fontSize: "14px", color: "#1f2937", fontWeight: 700 }}>
                              {viewingOrder.currency || "AED"} {Number.parseFloat(viewingOrder.final_amount || viewingOrder.total_amount || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tfoot>
                      </Table>
                    </div>
                  </div>
                </div>
              )}
            </div>

  );
}


function OrderViewModalTabLeadDeal(
  props: Readonly<{ relatedDeal: any; relatedLead: any; extensions: readonly any[] }>,
): React.ReactElement {
  const { relatedDeal, relatedLead, extensions } = props;
  return (
            <div>
              {/* Deal Information */}
              {relatedDeal && (
                <div style={{ marginBottom: "28px" }}>
                  <h5 style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#1f2937",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}>
                    <div style={{
                      width: "4px",
                      height: "18px",
                      background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                      borderRadius: "2px",
                    }} />
                    Deal Information
                  </h5>
                  <div style={{
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "20px",
                  }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
                      <div>
                        <div style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: "6px",
                        }}>
                          Deal Name
                        </div>
                        <div style={{
                          fontSize: "14px",
                          color: "#1f2937",
                          fontWeight: 500,
                          wordBreak: "break-word",
                        }}>
                          {relatedDeal.name || "N/A"}
                        </div>
                      </div>
                      {relatedDeal.stage && (
                        <div>
                          <div style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#6b7280",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            marginBottom: "6px",
                          }}>
                            Stage
                          </div>
                          <div style={{
                            fontSize: "14px",
                            color: "#1f2937",
                            fontWeight: 500,
                            wordBreak: "break-word",
                          }}>
                            <Badge
                              style={{
                                padding: "6px 14px",
                                borderRadius: "20px",
                                fontSize: "12px",
                                fontWeight: 600,
                                backgroundColor: relatedDeal.stage?.color || "#6c757d",
                              }}
                            >
                              {relatedDeal.stage?.name || "Not assigned"}
                            </Badge>
                          </div>
                        </div>
                      )}
                      {relatedDeal.net_value && (
                        <div>
                          <div style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#6b7280",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            marginBottom: "6px",
                          }}>
                            Deal Value
                          </div>
                          <div style={{
                            fontSize: "14px",
                            color: "#1f2937",
                            fontWeight: 500,
                            wordBreak: "break-word",
                          }}>
                            {relatedDeal.currency || "AED"} {Number.parseFloat(String(relatedDeal.net_value || relatedDeal.grand_total || 0)).toLocaleString()}
                          </div>
                        </div>
                      )}
                      {relatedDeal.assigned_to && (
                        <div>
                          <div style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#6b7280",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            marginBottom: "6px",
                          }}>
                            Assigned To
                          </div>
                          <div style={{
                            fontSize: "14px",
                            color: "#1f2937",
                            fontWeight: 500,
                            wordBreak: "break-word",
                          }}>
                            <User size={14} style={{ color: "#f59e0b", marginRight: "6px", display: "inline" }} />
                            {extensions.find((ext: any) => ext?.id == relatedDeal?.assigned_to || ext?.extension == relatedDeal?.assigned_to)?.display_name || 
                             extensions.find((ext: any) => ext?.id == relatedDeal?.assigned_to || ext?.extension == relatedDeal?.assigned_to)?.name || 
                             relatedDeal.assigned_to || "Not assigned"}
                          </div>
                        </div>
                      )}
                      {relatedDeal.created_at && (
                        <div>
                          <div style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#6b7280",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            marginBottom: "6px",
                          }}>
                            Created Date
                          </div>
                          <div style={{
                            fontSize: "14px",
                            color: "#1f2937",
                            fontWeight: 500,
                            wordBreak: "break-word",
                          }}>
                            <Calendar size={14} style={{ color: "#f59e0b", marginRight: "6px", display: "inline" }} />
                            {relatedDeal.created_at ? formatDateForTable(relatedDeal.created_at) : "N/A"}
                          </div>
                        </div>
                      )}
                      {relatedDeal.company_name && (
                        <div style={{ gridColumn: "1 / -1" }}>
                          <div style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#6b7280",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            marginBottom: "6px",
                          }}>
                            Company Name
                          </div>
                          <div style={{
                            fontSize: "14px",
                            color: "#1f2937",
                            fontWeight: 500,
                            wordBreak: "break-word",
                          }}>
                            <Building2 size={14} style={{ color: "#f59e0b", marginRight: "6px", display: "inline" }} />
                            {relatedDeal.company_name}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Lead Information */}
              {relatedLead && (
                <div style={{ marginBottom: "28px" }}>
                  <h5 style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#1f2937",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}>
                    <div style={{
                      width: "4px",
                      height: "18px",
                      background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                      borderRadius: "2px",
                    }} />
                    Lead Information
                  </h5>
                  <div style={{
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "20px",
                  }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
                      <div>
                        <div style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: "6px",
                        }}>
                          Lead Name
                        </div>
                        <div style={{
                          fontSize: "14px",
                          color: "#1f2937",
                          fontWeight: 500,
                          wordBreak: "break-word",
                        }}>
                          {relatedLead.name}
                        </div>
                      </div>
                      {relatedLead.stage && (
                        <div>
                          <div style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#6b7280",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            marginBottom: "6px",
                          }}>
                            Stage
                          </div>
                          <div style={{
                            fontSize: "14px",
                            color: "#1f2937",
                            fontWeight: 500,
                            wordBreak: "break-word",
                          }}>
                            <Badge
                              style={{
                                padding: "6px 14px",
                                borderRadius: "20px",
                                fontSize: "12px",
                                fontWeight: 600,
                                backgroundColor: relatedLead.stage?.color || "#6c757d",
                              }}
                            >
                              {relatedLead.stage?.name || "Not assigned"}
                            </Badge>
                          </div>
                        </div>
                      )}
                      {relatedLead.lead_potential && (
                        <div>
                          <div style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#6b7280",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            marginBottom: "6px",
                          }}>
                            Lead Potential
                          </div>
                          <div style={{
                            fontSize: "14px",
                            color: "#1f2937",
                            fontWeight: 500,
                            wordBreak: "break-word",
                          }}>
                            <Badge
                              bg={orderViewModalLeadPotentialBadgeBg(relatedLead.lead_potential)}
                              style={{
                                padding: "6px 14px",
                                borderRadius: "20px",
                                fontSize: "12px",
                                fontWeight: 600,
                              }}
                            >
                              {relatedLead.lead_potential || "N/A"}
                            </Badge>
                          </div>
                        </div>
                      )}
                      {relatedLead.user_extension && (
                        <div>
                          <div style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#6b7280",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            marginBottom: "6px",
                          }}>
                            Assigned To
                          </div>
                          <div style={{
                            fontSize: "14px",
                            color: "#1f2937",
                            fontWeight: 500,
                            wordBreak: "break-word",
                          }}>
                            <User size={14} style={{ color: "#f59e0b", marginRight: "6px", display: "inline" }} />
                            {extensions.find((ext: any) => ext?.id == relatedLead?.user_extension || ext?.extension == relatedLead?.user_extension)?.display_name || 
                             extensions.find((ext: any) => ext?.id == relatedLead?.user_extension || ext?.extension == relatedLead?.user_extension)?.name || 
                             relatedLead.user_extension || "Not assigned"}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Campaign Information */}
              {relatedLead?.campaign && (
                <div style={{ marginBottom: "28px" }}>
                  <h5 style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#1f2937",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}>
                    <div style={{
                      width: "4px",
                      height: "18px",
                      background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                      borderRadius: "2px",
                    }} />
                    Campaign Information
                  </h5>
                  <div style={{
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "20px",
                  }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
                      <div>
                        <div style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: "6px",
                        }}>
                          Campaign Name
                        </div>
                        <div style={{
                          fontSize: "14px",
                          color: "#1f2937",
                          fontWeight: 500,
                          wordBreak: "break-word",
                        }}>
                          {relatedLead.campaign.name}
                        </div>
                      </div>
                      {relatedLead.campaign_field_values && Object.keys(relatedLead.campaign_field_values).length > 0 && (
                        Object.entries(relatedLead.campaign_field_values).map(([key, value]: [string, any]) => (
                          <div key={key}>
                            <div style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              color: "#6b7280",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              marginBottom: "6px",
                            }}>
                              {key}
                            </div>
                            <div style={{
                              fontSize: "14px",
                              color: "#1f2937",
                              fontWeight: 500,
                              wordBreak: "break-word",
                            }}>
                              {String(value)}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Prospect Information */}
              {relatedLead?.crm_data && (
                <div style={{ marginBottom: "28px" }}>
                  <h5 style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#1f2937",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}>
                    <div style={{
                      width: "4px",
                      height: "18px",
                      background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                      borderRadius: "2px",
                    }} />
                    Prospect Information
                  </h5>
                  <div style={{
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "20px",
                  }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
                      {relatedLead.crm_data.id && (
                        <div>
                          <div style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#6b7280",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            marginBottom: "6px",
                          }}>
                            CRM Data ID
                          </div>
                          <div style={{
                            fontSize: "14px",
                            color: "#1f2937",
                            fontWeight: 500,
                            wordBreak: "break-word",
                          }}>
                            #{relatedLead.crm_data.id}
                          </div>
                        </div>
                      )}
                      <div>
                        <div style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: "6px",
                        }}>
                          Name
                        </div>
                        <div style={{
                          fontSize: "14px",
                          color: "#1f2937",
                          fontWeight: 500,
                          wordBreak: "break-word",
                        }}>
                          {relatedLead.crm_data.name || relatedLead.crm_data.data?.name || "N/A"}
                        </div>
                      </div>
                      <div>
                        <div style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: "6px",
                        }}>
                          Phone
                        </div>
                        <div style={{
                          fontSize: "14px",
                          color: "#1f2937",
                          fontWeight: 500,
                          wordBreak: "break-word",
                        }}>
                          <PhoneDisplay phone={relatedLead.crm_data.phone || relatedLead.crm_data.data?.phone || ""} />
                        </div>
                      </div>
                      {relatedLead.crm_data.source_file && (
                        <div>
                          <div style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#6b7280",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            marginBottom: "6px",
                          }}>
                            Source File
                          </div>
                          <div style={{
                            fontSize: "14px",
                            color: "#1f2937",
                            fontWeight: 500,
                            wordBreak: "break-word",
                          }}>
                            {relatedLead.crm_data.source_file}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

  );
}


function orderViewModalOrderStatusIconBg(status: string | undefined): string {
  const s = status?.toLowerCase() ?? "";
  if (s === "completed") {
    return "#10b981";
  }
  if (s === "pending") {
    return "#f59e0b";
  }
  return "#6c757d";
}

function orderViewModalLeadPotentialBadgeBg(potential: string | undefined): string {
  if (potential === "Hot") {
    return "danger";
  }
  if (potential === "Warm") {
    return "warning";
  }
  return "secondary";
}

function orderViewModalOrderLifecycleBadgeBg(status: string | undefined): string {
  const s = status?.toLowerCase() ?? "";
  if (s === "completed") {
    return "success";
  }
  if (s === "pending") {
    return "warning";
  }
  return "secondary";
}

function orderViewModalHistoryEventLabel(event: string | undefined): string {
  if (event === "created") {
    return "Created";
  }
  if (event === "updated") {
    return "Updated";
  }
  return event ?? "";
}

function orderViewModalApprovalBadgeBg(status: string | undefined): string {
  const s = status?.toLowerCase() ?? "";
  if (s === "approved") return "success";
  if (s === "rejected") return "danger";
  return "warning";
}

function orderViewModalFulfillmentBadgeBg(status: string | undefined): string {
  const s = status?.toLowerCase() ?? "";
  if (s.includes("completed") || s.includes("delivered")) return "success";
  if (s.includes("progress")) return "primary";
  return "secondary";
}

function orderViewModalPaymentBadgeBg(status: string | undefined): string {
  const s = status?.toLowerCase() ?? "";
  if (s === "paid") return "success";
  if (s === "partial") return "warning";
  return "danger";
}

function OrderViewModalAdditionalInfoGrid(props: Readonly<{
  viewingOrder: CrmOrdersOrderViewModalRenderProps["viewingOrder"];
  extensions: readonly any[];
}>): React.ReactElement {
  const { viewingOrder, extensions } = props;
  return (
            <div style={{ marginBottom: "28px" }}>
              <h5 style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#1f2937",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                <div style={{
                  width: "4px",
                  height: "18px",
                  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  borderRadius: "2px",
                }} />
                Additional Information
              </h5>
              <div style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "20px",
              }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
                  <div>
                    <div style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: "6px",
                    }}>
                      Approval Status
                    </div>
                    <div style={{
                      fontSize: "14px",
                      color: "#1f2937",
                      fontWeight: 500,
                      wordBreak: "break-word",
                    }}>
                      {viewingOrder.order_approval_status ? (
                        <Badge bg={orderViewModalApprovalBadgeBg(viewingOrder.order_approval_status)}>
                          {viewingOrder.order_approval_status}
                        </Badge>
                      ) : (
                        <span className="text-muted">Not Set</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: "6px",
                    }}>
                      Fulfillment Status
                    </div>
                    <div style={{
                      fontSize: "14px",
                      color: "#1f2937",
                      fontWeight: 500,
                      wordBreak: "break-word",
                    }}>
                      {viewingOrder.fulfillment_status ? (
                        <Badge bg={orderViewModalFulfillmentBadgeBg(viewingOrder.fulfillment_status)}>
                          {viewingOrder.fulfillment_status}
                        </Badge>
                      ) : (
                        <span className="text-muted">Not Set</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: "6px",
                    }}>
                      Payment Status
                    </div>
                    <div style={{
                      fontSize: "14px",
                      color: "#1f2937",
                      fontWeight: 500,
                      wordBreak: "break-word",
                    }}>
                      {viewingOrder.payment_status ? (
                        <Badge bg={orderViewModalPaymentBadgeBg(viewingOrder.payment_status)}>
                          {viewingOrder.payment_status}
                        </Badge>
                      ) : (
                        <span className="text-muted">Not Set</span>
                      )}
                    </div>
                  </div>
                  {viewingOrder.assigned_to && (
                    <div>
                      <div style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        marginBottom: "6px",
                      }}>
                        Assigned To
                      </div>
                      <div style={{
                        fontSize: "14px",
                        color: "#1f2937",
                        fontWeight: 500,
                        wordBreak: "break-word",
                      }}>
                        <User size={14} style={{ color: "#f59e0b", marginRight: "6px", display: "inline" }} />
                        {extensions.find((ext: any) => ext?.id == viewingOrder?.assigned_to || ext?.extension == viewingOrder?.assigned_to)?.display_name ||
                         extensions.find((ext: any) => ext?.id == viewingOrder?.assigned_to || ext?.extension == viewingOrder?.assigned_to)?.name ||
                         viewingOrder.assigned_to || "Not assigned"}
                      </div>
                    </div>
                  )}
                  {viewingOrder.contract_length && (
                    <div>
                      <div style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        marginBottom: "6px",
                      }}>
                        Contract Length
                      </div>
                      <div style={{
                        fontSize: "14px",
                        color: "#1f2937",
                        fontWeight: 500,
                        wordBreak: "break-word",
                      }}>
                        {viewingOrder.contract_length}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
  );
}

function OrderViewModalAdditionalNotes(props: Readonly<{
  viewingOrder: CrmOrdersOrderViewModalRenderProps["viewingOrder"];
}>): React.ReactElement {
  const { viewingOrder } = props;
  if (!viewingOrder.notes) {
    return <></>;
  }
  return (
            <div style={{ marginBottom: "28px" }}>
              <h5 style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#1f2937",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                <div style={{
                  width: "4px",
                  height: "18px",
                  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  borderRadius: "2px",
                }} />
                Notes
              </h5>
              <div style={{
                background: "#fffbeb",
                border: "1px solid #fcd34d",
                borderRadius: "12px",
                padding: "16px 20px",
                fontSize: "14px",
                color: "#78350f",
                lineHeight: "1.6",
                whiteSpace: "pre-wrap",
              }}>
                {viewingOrder.notes}
              </div>
            </div>
  );
}

function OrderViewModalTabAdditional(props: Readonly<{
  viewingOrder: CrmOrdersOrderViewModalRenderProps["viewingOrder"];
  extensions: readonly any[];
}>): React.ReactElement {
  const { viewingOrder, extensions } = props;
  return (
            <div>
              <OrderViewModalAdditionalInfoGrid viewingOrder={viewingOrder} extensions={extensions} />
              <OrderViewModalAdditionalNotes viewingOrder={viewingOrder} />
            </div>

  );
}


function OrderViewModalTabHistory(
  props: Readonly<{ viewingOrder: CrmOrdersOrderViewModalRenderProps["viewingOrder"] }>,
): React.ReactElement {
  const { viewingOrder } = props;
  return (
            <div>
              {/* Activity History */}
              {viewingOrder.histories && Array.isArray(viewingOrder.histories) && viewingOrder.histories.length > 0 ? (
                <div style={{ marginBottom: "28px" }}>
                  <h5 style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#1f2937",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}>
                    <div style={{
                      width: "4px",
                      height: "18px",
                      background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                      borderRadius: "2px",
                    }} />
                    Activity History
                    <Badge 
                      bg="secondary"
                      style={{
                        marginLeft: "8px",
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "4px 10px",
                        borderRadius: "6px",
                      }}
                    >
                      {viewingOrder.histories.length}
                    </Badge>
                  </h5>
                  <div style={{
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "20px",
                  }}>
                    <div style={{ position: "relative", paddingLeft: "30px" }}>
                      <div style={{
                        content: "",
                        position: "absolute",
                        left: "8px",
                        top: 0,
                        bottom: 0,
                        width: "2px",
                        background: "#e5e7eb",
                      }} />
                      {viewingOrder.histories.map((history: any, idx: number) => (
                        <div key={orderHistoryRowKey(viewingOrder.id, history)} style={{ position: "relative", paddingBottom: idx < viewingOrder.histories.length - 1 ? "20px" : "0" }}>
                          <div style={{
                            content: "",
                            position: "absolute",
                            left: "-26px",
                            top: "4px",
                            width: "12px",
                            height: "12px",
                            borderRadius: "50%",
                            background: history.event === "created" ? "#10b981" : "#f59e0b",
                            border: "3px solid white",
                            boxShadow: "0 0 0 2px #e5e7eb",
                          }} />
                          <div style={{
                            background: "#f9fafb",
                            padding: "12px 16px",
                            borderRadius: "8px",
                          }}>
                            <div style={{
                              fontSize: "12px",
                              color: "#6b7280",
                              fontWeight: 600,
                              marginBottom: "4px",
                            }}>
                              {new Date(history.created_at).toLocaleString()}
                            </div>
                            <div style={{
                              fontSize: "14px",
                              color: "#1f2937",
                              marginBottom: "4px",
                              fontWeight: 500,
                            }}>
                              {orderViewModalHistoryEventLabel(history.event)}
                            </div>
                            {history.description && (
                              <div style={{
                                fontSize: "13px",
                                color: "#6b7280",
                                marginBottom: "8px",
                              }}>
                                {history.description}
                              </div>
                            )}
                            {history.changes && Object.keys(history.changes).length > 0 && (
                              <div style={{
                                fontSize: "12px",
                                color: "#6b7280",
                              }}>
                                {Object.entries(history.changes).map(([key, change]: [string, any]) => {
                                  if (ORDER_HISTORY_IGNORED_KEYS.has(key)) {
                                    return null;
                                  }
                                  return (
                                    <div key={key} style={{ marginTop: "4px" }}>
                                      <strong>{key}:</strong> {change.old ? `${change.old} → ` : ""}{change.new || "N/A"}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#6b7280",
                  background: "#f9fafb",
                  border: "2px dashed #d1d5db",
                  borderRadius: "12px"
                }}>
                  <History size={40} style={{ marginBottom: "12px", opacity: 0.5 }} />
                  <div style={{ fontSize: "14px", fontWeight: 500 }}>No activity history found</div>
                </div>
              )}
            </div>

  );
}


function OrderViewModalRightPanel(
  props: ReadonlyPick<"viewingOrder" | "session" | "setShowOrderViewModal">,
): React.ReactElement {
  const { viewingOrder, session, setShowOrderViewModal } = props;
  return (
        <div style={{ 
          padding: "32px 24px", 
          background: "#fafbfc",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}>

          {/* Quick Actions */}
          <div>
            <h6 style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "14px",
            }}>
              Quick Actions
            </h6>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {session?.user?.permissions?.includes(PERMISSIONS.EDIT_CRM_ORDERS_BILLING) && (
                <button
                  style={{
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    padding: "12px 16px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#1f2937",
                  }}
                  onClick={() => {
                    setShowOrderViewModal(false);
                    globalThis.location.href = `/crm/orders/${viewingOrder.id}/edit`;
                  }}
                  {...crmOrdersOrderViewModalEditRowHoverHandlers}
                >
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "#f59e0b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Edit size={16} style={{ color: "white" }} />
                  </div>
                  Edit Order
                </button>
              )}
            </div>
          </div>

          {/* Status Overview */}
          <div>
            <h6 style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "14px",
            }}>
              Status Overview
            </h6>
            <div style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              padding: "16px",
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500 }}>
                    Stage
                  </span>
                  <Badge 
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: "6px",
                      backgroundColor: viewingOrder.stage?.color || "#6c757d",
                    }}
                  >
                    {viewingOrder.stage?.name || "N/A"}
                  </Badge>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500 }}>
                    Status
                  </span>
                  <Badge
                    bg={orderViewModalOrderLifecycleBadgeBg(viewingOrder.status)}
                    style={{ fontSize: "11px", padding: "4px 10px" }}
                  >
                    {viewingOrder.status || "N/A"}
                  </Badge>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500 }}>
                    Total Amount
                  </span>
                  <span style={{ fontSize: "14px", color: "#1f2937", fontWeight: 600 }}>
                    {viewingOrder.currency || "AED"} {Number.parseFloat(viewingOrder.final_amount || viewingOrder.total_amount || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500 }}>
                    Items
                  </span>
                  <span style={{ fontSize: "14px", color: "#1f2937", fontWeight: 600 }}>
                    {viewingOrder.items?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div style={{ flex: 1 }}>
            <h6 style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "14px",
            }}>
              Order Summary
            </h6>
            <div style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              padding: "16px",
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {viewingOrder.order_date && (
                  <div>
                    <div style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Order Date
                    </div>
                    <div style={{ fontSize: "13px", color: "#1f2937", fontWeight: 500 }}>
                      {moment(viewingOrder.order_date).format("MMM DD, YYYY")}
                    </div>
                  </div>
                )}

                {viewingOrder.expected_delivery_date && (
                  <div>
                    <div style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Expected Delivery
                    </div>
                    <div style={{ fontSize: "13px", color: "#1f2937", fontWeight: 500 }}>
                      {moment(viewingOrder.expected_delivery_date).format("MMM DD, YYYY")}
                    </div>
                  </div>
                )}

                {viewingOrder.payment_status && (
                  <div>
                    <div style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Payment Status
                    </div>
                    <Badge
                      bg={orderViewModalPaymentBadgeBg(viewingOrder.payment_status)}
                      style={{ fontSize: "11px", padding: "4px 10px" }}
                    >
                      {viewingOrder.payment_status}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

  );
}


function OrderViewModalFooterBar(
  props: ReadonlyPick<"viewingOrder" | "setShowOrderViewModal">,
): React.ReactElement {
  const { viewingOrder, setShowOrderViewModal } = props;
  return (
<div style={{
  padding: "20px 32px",
  borderTop: "1px solid #e5e7eb",
  background: "white",
  borderBottomLeftRadius: "12px",
  borderBottomRightRadius: "12px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
}}>
  <div style={{ fontSize: "13px", color: "#6b7280" }}>
    Order ID: <strong>#{viewingOrder.id}</strong>
  </div>
  <Button
    variant="outline-secondary"
    onClick={() => setShowOrderViewModal(false)}
    style={{
      padding: "10px 24px",
      borderRadius: "8px",
      fontWeight: 600,
      fontSize: "14px",
      border: "2px solid #e5e7eb",
      transition: "all 0.2s ease",
    }}
    {...crmOrdersOrderViewModalFooterCloseHoverHandlers}
  >
    Close
  </Button>
</div>

  );
}

function OrderViewModalTabPanels(
  props: ReadonlyPick<
    "activeTab" | "viewingOrder" | "relatedDeal" | "relatedLead" | "extensions"
  >,
): React.ReactElement {
  const { activeTab, viewingOrder, relatedDeal, relatedLead, extensions } = props;
  if (activeTab === "tab1") {
    return <OrderViewModalTabGeneral viewingOrder={viewingOrder} />;
  }
  if (activeTab === "tab2") {
    return (
      <OrderViewModalTabLeadDeal
        relatedDeal={relatedDeal}
        relatedLead={relatedLead}
        extensions={extensions}
      />
    );
  }
  if (activeTab === "additional-info") {
    return <OrderViewModalTabAdditional viewingOrder={viewingOrder} extensions={extensions} />;
  }
  if (activeTab === "history") {
    return <OrderViewModalTabHistory viewingOrder={viewingOrder} />;
  }
  return <></>;
}

function OrderViewModalLoadedBody(
  props: ReadonlyPick<
    "activeTab" | "setActiveTab" | "viewingOrder" | "relatedDeal" | "relatedLead" | "extensions" | "session" | "setShowOrderViewModal"
  >,
): React.ReactElement {
  const {
    activeTab,
    setActiveTab,
    viewingOrder,
    relatedDeal,
    relatedLead,
    extensions,
    session,
    setShowOrderViewModal,
  } = props;
  return (
    <>
      <OrderViewModalInlineStyles />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", minHeight: "500px" }}>
        <div style={{ padding: "32px", borderRight: "1px solid #e5e7eb" }}>
          <OrderViewModalTabNav activeTab={activeTab} setActiveTab={setActiveTab} />
          <OrderViewModalTabPanels
            activeTab={activeTab}
            viewingOrder={viewingOrder}
            relatedDeal={relatedDeal}
            relatedLead={relatedLead}
            extensions={extensions}
          />
        </div>
        <OrderViewModalRightPanel
          viewingOrder={viewingOrder}
          session={session}
          setShowOrderViewModal={setShowOrderViewModal}
        />
      </div>
    </>
  );
}

export function CrmOrdersOrderViewModal(
  props: Readonly<CrmOrdersOrderViewModalRenderProps>,
): React.ReactNode {
  const {
    viewingOrder,
    showOrderViewModal,
    setShowOrderViewModal,
    loadingOrder,
    relatedDeal,
    relatedLead,
    extensions,
    activeTab,
    setActiveTab,
    session,
  } = props;
  if (!viewingOrder) {
    return null;
  }
  return (
    <Modal
      show={showOrderViewModal}
      onHide={() => setShowOrderViewModal(false)}
      size="xl"
      centered
      className="order-view-modal"
    >
      <OrderViewModalHeader
        viewingOrder={viewingOrder}
        setShowOrderViewModal={setShowOrderViewModal}
      />
      <Modal.Body style={{ padding: 0, maxHeight: "calc(90vh - 200px)", overflowY: "auto" }}>
        {loadingOrder ? (
          <OrderViewModalLoadingState />
        ) : (
          <OrderViewModalLoadedBody
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            viewingOrder={viewingOrder}
            relatedDeal={relatedDeal}
            relatedLead={relatedLead}
            extensions={extensions}
            session={session}
            setShowOrderViewModal={setShowOrderViewModal}
          />
        )}
      </Modal.Body>
      <OrderViewModalFooterBar
        viewingOrder={viewingOrder}
        setShowOrderViewModal={setShowOrderViewModal}
      />
    </Modal>
  );
}

export function renderCrmOrdersOrderViewModal(
  props: Readonly<CrmOrdersOrderViewModalRenderProps>,
): React.ReactNode {
  return <CrmOrdersOrderViewModal {...props} />;
}
