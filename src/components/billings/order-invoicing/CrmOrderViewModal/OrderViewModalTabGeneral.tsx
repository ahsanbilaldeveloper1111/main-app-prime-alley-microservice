import React from "react";
import { Badge, Table } from "react-bootstrap";
import { formatDateForTable } from "@utils/Helper";
import { CrmPhoneDisplay as PhoneDisplay } from "@components/crm/CrmListPageUi";
import { getInitials, getRandomColor } from "@utils/crmNameAvatar";
import {
  Target,
  CheckCircle,
  ShoppingBag,
  Calendar,
  Building2,
  Mail,
  DollarSign,
} from "lucide-react";
import {
  orderItemsFooterColSpan,
  orderStatusCardAccentColor,
} from "./orderViewModalUtils";

export function OrderViewModalTabGeneral(props: {
  readonly viewingOrder: any;
}): React.ReactElement {
  const { viewingOrder } = props;
  const orderItems = Array.isArray(viewingOrder.items)
    ? (viewingOrder.items as unknown[])
    : [];
  const hasItemDescriptionColumn = orderItems.some(
    (item) =>
      item &&
      typeof item === "object" &&
      "description" in item &&
      Boolean((item as { description?: unknown }).description),
  );
  const footerColSpan = orderItemsFooterColSpan(orderItems);
  return (
                      <div>
                        {/* Quick Info Cards */}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gap: "16px",
                            marginBottom: "28px",
                          }}
                        >
                          <div
                            style={{
                              background: "#f9fafb",
                              border: "1px solid #e5e7eb",
                              padding: "20px",
                              borderRadius: "12px",
                              transition: "all 0.3s ease",
                            }} className="order-view-quick-info-card"
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                              }}
                            >
                              <div
                                style={{
                                  width: "44px",
                                  height: "44px",
                                  borderRadius: "10px",
                                  background:
                                    viewingOrder.stage?.color || "#6c757d",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <Target size={20} style={{ color: "white" }} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: "#6b7280",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.8px",
                                    marginBottom: "4px",
                                  }}
                                >
                                  Stage
                                </div>
                                <div
                                  style={{
                                    fontSize: "15px",
                                    color: "#1f2937",
                                    fontWeight: 600,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {viewingOrder.stage?.name || "Not assigned"}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              background: "#f9fafb",
                              border: "1px solid #e5e7eb",
                              padding: "20px",
                              borderRadius: "12px",
                              transition: "all 0.3s ease",
                            }} className="order-view-quick-info-card"
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                              }}
                            >
                              <div
                                style={{
                                  width: "44px",
                                  height: "44px",
                                  borderRadius: "10px",
                                  background: orderStatusCardAccentColor(viewingOrder.status),
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <CheckCircle
                                  size={20}
                                  style={{ color: "white" }}
                                />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: "#6b7280",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.8px",
                                    marginBottom: "4px",
                                  }}
                                >
                                  Status
                                </div>
                                <div
                                  style={{
                                    fontSize: "15px",
                                    color: "#1f2937",
                                    fontWeight: 600,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {viewingOrder.status || "N/A"}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              background: "#f9fafb",
                              border: "1px solid #e5e7eb",
                              padding: "20px",
                              borderRadius: "12px",
                              transition: "all 0.3s ease",
                            }} className="order-view-quick-info-card"
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                              }}
                            >
                              <div
                                style={{
                                  width: "44px",
                                  height: "44px",
                                  borderRadius: "10px",
                                  background: "#10b981",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <DollarSign
                                  size={20}
                                  style={{ color: "white" }}
                                />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: "#10b981",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.8px",
                                    marginBottom: "4px",
                                  }}
                                >
                                  Final Amount
                                </div>
                                <div
                                  style={{
                                    fontSize: "15px",
                                    color: "#1f2937",
                                    fontWeight: 600,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {viewingOrder.currency || "AED"}{" "}
                                  {Number.parseFloat(
                                    viewingOrder.final_amount ||
                                      viewingOrder.total_amount ||
                                      "0",
                                  ).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              background: "#f9fafb",
                              border: "1px solid #e5e7eb",
                              padding: "20px",
                              borderRadius: "12px",
                              transition: "all 0.3s ease",
                            }} className="order-view-quick-info-card"
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                              }}
                            >
                              <div
                                style={{
                                  width: "44px",
                                  height: "44px",
                                  borderRadius: "10px",
                                  background: "#3b82f6",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <Calendar
                                  size={20}
                                  style={{ color: "white" }}
                                />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: "#3b82f6",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.8px",
                                    marginBottom: "4px",
                                  }}
                                >
                                  Order Date
                                </div>
                                <div
                                  style={{
                                    fontSize: "15px",
                                    color: "#1f2937",
                                    fontWeight: 600,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {viewingOrder.order_date
                                    ? formatDateForTable(
                                        viewingOrder.order_date,
                                      )
                                    : "N/A"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Order Information Section */}
                        <div style={{ marginBottom: "28px" }}>
                          <h5
                            style={{
                              fontSize: "15px",
                              fontWeight: 700,
                              color: "#1f2937",
                              marginBottom: "16px",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <div
                              style={{
                                width: "4px",
                                height: "18px",
                                background:
                                  "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                                borderRadius: "2px",
                              }}
                            />
                            Order Details
                          </h5>
                          <div
                            style={{
                              background: "#f9fafb",
                              border: "1px solid #e5e7eb",
                              borderRadius: "12px",
                              padding: "20px",
                            }}
                          >
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "140px 1fr",
                                gap: "16px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  color: "#6b7280",
                                  fontSize: "14px",
                                  fontWeight: 600,
                                }}
                              >
                                <ShoppingBag
                                  size={16}
                                  style={{ color: "#f59e0b" }}
                                />
                                Order Number
                              </div>
                              <div
                                style={{
                                  color: "#1f2937",
                                  fontSize: "15px",
                                  fontWeight: 500,
                                }}
                              >
                                {viewingOrder.order_number ||
                                  `ORD-${viewingOrder.id}`}
                              </div>

                              {viewingOrder.expected_delivery_date && (
                                <>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                      color: "#6b7280",
                                      fontSize: "14px",
                                      fontWeight: 600,
                                    }}
                                  >
                                    <Calendar
                                      size={16}
                                      style={{ color: "#f59e0b" }}
                                    />
                                    Expected Delivery
                                  </div>
                                  <div
                                    style={{
                                      color: "#1f2937",
                                      fontSize: "15px",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {formatDateForTable(
                                      viewingOrder.expected_delivery_date,
                                    )}
                                  </div>
                                </>
                              )}

                              {viewingOrder.industry && (
                                <>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                      color: "#6b7280",
                                      fontSize: "14px",
                                      fontWeight: 600,
                                    }}
                                  >
                                    <Building2
                                      size={16}
                                      style={{ color: "#f59e0b" }}
                                    />
                                    Industry
                                  </div>
                                  <div
                                    style={{
                                      color: "#1f2937",
                                      fontSize: "15px",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {viewingOrder.industry}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Company Information Section */}
                        <div style={{ marginBottom: "28px" }}>
                          <h5
                            style={{
                              fontSize: "15px",
                              fontWeight: 700,
                              color: "#1f2937",
                              marginBottom: "16px",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <div
                              style={{
                                width: "4px",
                                height: "18px",
                                background:
                                  "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                                borderRadius: "2px",
                              }}
                            />
                            Company Information
                          </h5>
                          <div
                            style={{
                              background: "#f9fafb",
                              border: "1px solid #e5e7eb",
                              borderRadius: "12px",
                              padding: "20px",
                            }}
                          >
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "16px 24px",
                              }}
                            >
                              {viewingOrder.customer_name && (
                                <div>
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      color: "#6b7280",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                      marginBottom: "6px",
                                    }}
                                  >
                                    Company Name
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "14px",
                                      color: "#1f2937",
                                      fontWeight: 500,
                                      wordBreak: "break-word",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: "30px",
                                        height: "30px",
                                        borderRadius: "50%",
                                        backgroundColor: getRandomColor(
                                          viewingOrder.customer_name,
                                        ),
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
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      color: "#6b7280",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                      marginBottom: "6px",
                                    }}
                                  >
                                    Email
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "14px",
                                      color: "#1f2937",
                                      fontWeight: 500,
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    <Mail
                                      size={14}
                                      style={{
                                        color: "#f59e0b",
                                        marginRight: "6px",
                                        display: "inline",
                                      }}
                                    />
                                    {viewingOrder.customer_email}
                                  </div>
                                </div>
                              )}
                              {viewingOrder.customer_phone && (
                                <div>
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      color: "#6b7280",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                      marginBottom: "6px",
                                    }}
                                  >
                                    Phone
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "14px",
                                      color: "#1f2937",
                                      fontWeight: 500,
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    <PhoneDisplay
                                      phone={viewingOrder.customer_phone || ""}
                                    />
                                  </div>
                                </div>
                              )}
                              {viewingOrder.customer_address && (
                                <div style={{ gridColumn: "1 / -1" }}>
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      color: "#6b7280",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                      marginBottom: "6px",
                                    }}
                                  >
                                    Address
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "14px",
                                      color: "#1f2937",
                                      fontWeight: 500,
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    {viewingOrder.customer_address}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Order Items/Products */}
                        {viewingOrder.items &&
                          Array.isArray(viewingOrder.items) &&
                          viewingOrder.items.length > 0 && (
                            <div style={{ marginBottom: "28px" }}>
                              <h5
                                style={{
                                  fontSize: "15px",
                                  fontWeight: 700,
                                  color: "#1f2937",
                                  marginBottom: "16px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <div
                                  style={{
                                    width: "4px",
                                    height: "18px",
                                    background:
                                      "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                                    borderRadius: "2px",
                                  }}
                                />
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
                              <div
                                style={{
                                  background: "white",
                                  border: "1px solid #e5e7eb",
                                  borderRadius: "12px",
                                  overflow: "hidden",
                                }}
                              >
                                <div style={{ overflowX: "auto" }}>
                                  <Table
                                    hover
                                    style={{
                                      width: "100%",
                                      marginBottom: 0,
                                      tableLayout: "auto",
                                    }}
                                  >
                                    <thead style={{ background: "#f9fafb" }}>
                                      <tr>
                                        <th
                                          style={{
                                            padding: "12px 16px",
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            color: "#6b7280",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.5px",
                                          }}
                                        >
                                          #
                                        </th>
                                        <th
                                          style={{
                                            padding: "12px 16px",
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            color: "#6b7280",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.5px",
                                          }}
                                        >
                                          Product Name
                                        </th>
                                        <th
                                          style={{
                                            padding: "12px 16px",
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            color: "#6b7280",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.5px",
                                          }}
                                        >
                                          SKU
                                        </th>
                                        <th
                                          style={{
                                            padding: "12px 16px",
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            color: "#6b7280",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.5px",
                                          }}
                                        >
                                          Quantity
                                        </th>
                                        {hasItemDescriptionColumn && (
                                          <th
                                            style={{
                                              padding: "12px 16px",
                                              fontSize: "11px",
                                              fontWeight: 700,
                                              color: "#6b7280",
                                              textTransform: "uppercase",
                                              letterSpacing: "0.5px",
                                            }}
                                          >
                                            Description
                                          </th>
                                        )}
                                        <th
                                          style={{
                                            padding: "12px 16px",
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            color: "#6b7280",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.5px",
                                          }}
                                        >
                                          Unit Price
                                        </th>
                                        <th
                                          style={{
                                            padding: "12px 16px",
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            color: "#6b7280",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.5px",
                                          }}
                                        >
                                          Total Price
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {viewingOrder.items.map(
                                        (item: any, index: number) => (
                                          <tr
                                            key={item.id || index}
                                            style={{
                                              borderBottom: "1px solid #f3f4f6",
                                            }}
                                          >
                                            <td
                                              style={{
                                                padding: "14px 16px",
                                                fontSize: "13px",
                                                color: "#1f2937",
                                              }}
                                            >
                                              {index + 1}
                                            </td>
                                            <td
                                              style={{
                                                padding: "14px 16px",
                                                fontSize: "13px",
                                                color: "#1f2937",
                                                fontWeight: 600,
                                              }}
                                            >
                                              {item.product_name ||
                                                item.product?.name ||
                                                "N/A"}
                                            </td>
                                            <td
                                              style={{
                                                padding: "14px 16px",
                                                fontSize: "13px",
                                                color: "#6b7280",
                                              }}
                                            >
                                              {item.product?.sku || "N/A"}
                                            </td>
                                            <td
                                              style={{
                                                padding: "14px 16px",
                                                fontSize: "13px",
                                                color: "#1f2937",
                                              }}
                                            >
                                              {item.quantity || "0"}
                                            </td>
                                            {hasItemDescriptionColumn && (
                                              <td
                                                style={{
                                                  padding: "14px 16px",
                                                  fontSize: "13px",
                                                  color: "#6b7280",
                                                  maxWidth: "200px",
                                                  overflow: "hidden",
                                                  textOverflow: "ellipsis",
                                                  whiteSpace: "nowrap",
                                                }}
                                              >
                                                {item.description || "-"}
                                              </td>
                                            )}
                                            <td
                                              style={{
                                                padding: "14px 16px",
                                                fontSize: "13px",
                                                color: "#1f2937",
                                              }}
                                            >
                                              {viewingOrder.currency || "AED"}{" "}
                                              {Number.parseFloat(
                                                item.unit_price || "0",
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              })}
                                            </td>
                                            <td
                                              style={{
                                                padding: "14px 16px",
                                                fontSize: "13px",
                                                color: "#1f2937",
                                                fontWeight: 600,
                                              }}
                                            >
                                              {viewingOrder.currency || "AED"}{" "}
                                              {Number.parseFloat(
                                                item.total_price || "0",
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              })}
                                            </td>
                                          </tr>
                                        ),
                                      )}
                                    </tbody>
                                    <tfoot
                                      style={{
                                        background: "#f9fafb",
                                        fontWeight: 600,
                                      }}
                                    >
                                      <tr>
                                        <td
                                          colSpan={footerColSpan}
                                          style={{
                                            padding: "12px 16px",
                                            textAlign: "right",
                                            fontSize: "13px",
                                            color: "#6b7280",
                                          }}
                                        >
                                          Subtotal:
                                        </td>
                                        <td
                                          style={{
                                            padding: "12px 16px",
                                            fontSize: "13px",
                                            color: "#1f2937",
                                          }}
                                        >
                                          {viewingOrder.currency || "AED"}{" "}
                                          {Number.parseFloat(
                                            viewingOrder.total_amount || "0",
                                          ).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          })}
                                        </td>
                                      </tr>
                                      {viewingOrder.discount_amount &&
                                        Number.parseFloat(
                                          viewingOrder.discount_amount,
                                        ) > 0 && (
                                          <tr>
                                            <td
                                              colSpan={footerColSpan}
                                              style={{
                                                padding: "12px 16px",
                                                textAlign: "right",
                                                fontSize: "13px",
                                                color: "#6b7280",
                                              }}
                                            >
                                              Discount:
                                            </td>
                                            <td
                                              style={{
                                                padding: "12px 16px",
                                                fontSize: "13px",
                                                color: "#dc2626",
                                              }}
                                            >
                                              - {viewingOrder.currency || "AED"}{" "}
                                              {Number.parseFloat(
                                                viewingOrder.discount_amount,
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              })}
                                            </td>
                                          </tr>
                                        )}
                                      {viewingOrder.tax_amount &&
                                        Number.parseFloat(viewingOrder.tax_amount) >
                                          0 && (
                                          <tr>
                                            <td
                                              colSpan={footerColSpan}
                                              style={{
                                                padding: "12px 16px",
                                                textAlign: "right",
                                                fontSize: "13px",
                                                color: "#6b7280",
                                              }}
                                            >
                                              Tax:
                                            </td>
                                            <td
                                              style={{
                                                padding: "12px 16px",
                                                fontSize: "13px",
                                                color: "#1f2937",
                                              }}
                                            >
                                              {viewingOrder.currency || "AED"}{" "}
                                              {Number.parseFloat(
                                                viewingOrder.tax_amount,
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              })}
                                            </td>
                                          </tr>
                                        )}
                                      <tr style={{ fontSize: "16px" }}>
                                        <td
                                          colSpan={footerColSpan}
                                          style={{
                                            padding: "12px 16px",
                                            textAlign: "right",
                                            fontSize: "14px",
                                            color: "#1f2937",
                                            fontWeight: 700,
                                          }}
                                        >
                                          Total:
                                        </td>
                                        <td
                                          style={{
                                            padding: "12px 16px",
                                            fontSize: "14px",
                                            color: "#1f2937",
                                            fontWeight: 700,
                                          }}
                                        >
                                          {viewingOrder.currency || "AED"}{" "}
                                          {Number.parseFloat(
                                            viewingOrder.final_amount ||
                                              viewingOrder.total_amount ||
                                              "0",
                                          ).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          })}
                                        </td>
                                      </tr>
                                    </tfoot>
                                  </Table>
                                </div>
                              </div>
                            </div>
                          )}
                      </div>  );
}
