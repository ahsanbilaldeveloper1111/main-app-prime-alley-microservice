import React from "react";
import { Badge } from "react-bootstrap";
import moment from "moment";
import { Edit } from "lucide-react";
import {
  orderListStatusBadgeVariant,
  paymentStatusBadgeVariant,
} from "./orderViewModalUtils";

export function OrderViewModalRightPanel(props: {
  readonly viewingOrder: any;
  readonly session: { user?: { permissions?: string[] } } | null;
  readonly onHide: () => void;
}): React.ReactElement {
  const { viewingOrder, session, onHide } = props;
  return (
                  <div
                    style={{
                      padding: "32px 24px",
                      background: "#fafbfc",
                      display: "flex",
                      flexDirection: "column",
                      gap: "24px",
                    }}
                  >
                    {/* Quick Actions */}
                    <div>
                      <h6
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: "14px",
                        }}
                      >
                        Quick Actions
                      </h6>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                        }}
                      >
                        {session?.user?.permissions?.includes(
                          "edit-crm-orders",
                        ) && (
                          <button
                            type="button"
                            className="order-view-edit-order-btn"
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
                              onHide();
                              globalThis.location.href = `/crm/orders/${viewingOrder.id}/edit`;
                            }}
                          >
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "8px",
                                background: "#f59e0b",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <Edit size={16} style={{ color: "white" }} />
                            </div>
                            Edit Order
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Status Overview */}
                    <div>
                      <h6
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: "14px",
                        }}
                      >
                        Status Overview
                      </h6>
                      <div
                        style={{
                          background: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "10px",
                          padding: "16px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "14px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "13px",
                                color: "#6b7280",
                                fontWeight: 500,
                              }}
                            >
                              Stage
                            </span>
                            <Badge
                              style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                padding: "4px 10px",
                                borderRadius: "6px",
                                backgroundColor:
                                  viewingOrder.stage?.color || "#6c757d",
                              }}
                            >
                              {viewingOrder.stage?.name || "N/A"}
                            </Badge>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "13px",
                                color: "#6b7280",
                                fontWeight: 500,
                              }}
                            >
                              Status
                            </span>
                            <Badge
                              bg={orderListStatusBadgeVariant(viewingOrder.status)}
                              style={{ fontSize: "11px", padding: "4px 10px" }}
                            >
                              {viewingOrder.status || "N/A"}
                            </Badge>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "13px",
                                color: "#6b7280",
                                fontWeight: 500,
                              }}
                            >
                              Total Amount
                            </span>
                            <span
                              style={{
                                fontSize: "14px",
                                color: "#1f2937",
                                fontWeight: 600,
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
                            </span>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "13px",
                                color: "#6b7280",
                                fontWeight: 500,
                              }}
                            >
                              Items
                            </span>
                            <span
                              style={{
                                fontSize: "14px",
                                color: "#1f2937",
                                fontWeight: 600,
                              }}
                            >
                              {viewingOrder.items?.length || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div style={{ flex: 1 }}>
                      <h6
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: "14px",
                        }}
                      >
                        Order Summary
                      </h6>
                      <div
                        style={{
                          background: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "10px",
                          padding: "16px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                          }}
                        >
                          {viewingOrder.order_date && (
                            <div>
                              <div
                                style={{
                                  fontSize: "11px",
                                  color: "#6b7280",
                                  fontWeight: 600,
                                  marginBottom: "4px",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                }}
                              >
                                Order Date
                              </div>
                              <div
                                style={{
                                  fontSize: "13px",
                                  color: "#1f2937",
                                  fontWeight: 500,
                                }}
                              >
                                {moment(viewingOrder.order_date).format(
                                  "MMM DD, YYYY",
                                )}
                              </div>
                            </div>
                          )}

                          {viewingOrder.expected_delivery_date && (
                            <div>
                              <div
                                style={{
                                  fontSize: "11px",
                                  color: "#6b7280",
                                  fontWeight: 600,
                                  marginBottom: "4px",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                }}
                              >
                                Expected Delivery
                              </div>
                              <div
                                style={{
                                  fontSize: "13px",
                                  color: "#1f2937",
                                  fontWeight: 500,
                                }}
                              >
                                {moment(
                                  viewingOrder.expected_delivery_date,
                                ).format("MMM DD, YYYY")}
                              </div>
                            </div>
                          )}

                          {viewingOrder.payment_status && (
                            <div>
                              <div
                                style={{
                                  fontSize: "11px",
                                  color: "#6b7280",
                                  fontWeight: 600,
                                  marginBottom: "4px",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                }}
                              >
                                Payment Status
                              </div>
                              <Badge
                                bg={paymentStatusBadgeVariant(viewingOrder.payment_status)}
                                style={{
                                  fontSize: "11px",
                                  padding: "4px 10px",
                                }}
                              >
                                {viewingOrder.payment_status}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>  );
}
