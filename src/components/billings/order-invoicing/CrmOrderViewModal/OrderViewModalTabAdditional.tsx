import React from "react";
import { Badge } from "react-bootstrap";
import { User } from "lucide-react";
import {
  fulfillmentBadgeVariant,
  orderApprovalBadgeVariant,
  paymentStatusBadgeVariant,
} from "./orderViewModalUtils";

export function OrderViewModalTabAdditional(props: {
  readonly viewingOrder: any;
  readonly extensions: any[];
}): React.ReactElement {
  const { viewingOrder, extensions } = props;
  return (
                      <div>
                        {/* Additional Information Section */}
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
                            Additional Information
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
                                  Approval Status
                                </div>
                                <div
                                  style={{
                                    fontSize: "14px",
                                    color: "#1f2937",
                                    fontWeight: 500,
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {viewingOrder.order_approval_status ? (
                                    <Badge
                                      bg={orderApprovalBadgeVariant(
                                        viewingOrder.order_approval_status,
                                      )}
                                    >
                                      {viewingOrder.order_approval_status}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted">Not Set</span>
                                  )}
                                </div>
                              </div>
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
                                  Fulfillment Status
                                </div>
                                <div
                                  style={{
                                    fontSize: "14px",
                                    color: "#1f2937",
                                    fontWeight: 500,
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {viewingOrder.fulfillment_status ? (
                                    <Badge
                                      bg={fulfillmentBadgeVariant(
                                        viewingOrder.fulfillment_status,
                                      )}
                                    >
                                      {viewingOrder.fulfillment_status}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted">Not Set</span>
                                  )}
                                </div>
                              </div>
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
                                  Payment Status
                                </div>
                                <div
                                  style={{
                                    fontSize: "14px",
                                    color: "#1f2937",
                                    fontWeight: 500,
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {viewingOrder.payment_status ? (
                                    <Badge
                                      bg={paymentStatusBadgeVariant(
                                        viewingOrder.payment_status,
                                      )}
                                    >
                                      {viewingOrder.payment_status}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted">Not Set</span>
                                  )}
                                </div>
                              </div>
                              {viewingOrder.assigned_to && (
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
                                    Assigned To
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "14px",
                                      color: "#1f2937",
                                      fontWeight: 500,
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    <User
                                      size={14}
                                      style={{
                                        color: "#f59e0b",
                                        marginRight: "6px",
                                        display: "inline",
                                      }}
                                    />
                                    {extensions.find(
                                      (ext: any) =>
                                        ext?.id == viewingOrder?.assigned_to ||
                                        ext?.extension ==
                                          viewingOrder?.assigned_to,
                                    )?.display_name ||
                                      extensions.find(
                                        (ext: any) =>
                                          ext?.id ==
                                            viewingOrder?.assigned_to ||
                                          ext?.extension ==
                                            viewingOrder?.assigned_to,
                                      )?.name ||
                                      viewingOrder.assigned_to ||
                                      "Not assigned"}
                                  </div>
                                </div>
                              )}
                              {viewingOrder.contract_length && (
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
                                    Contract Length
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "14px",
                                      color: "#1f2937",
                                      fontWeight: 500,
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    {viewingOrder.contract_length}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Notes */}
                        {viewingOrder.notes && (
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
                              Notes
                            </h5>
                            <div
                              style={{
                                background: "#fffbeb",
                                border: "1px solid #fcd34d",
                                borderRadius: "12px",
                                padding: "16px 20px",
                                fontSize: "14px",
                                color: "#78350f",
                                lineHeight: "1.6",
                                whiteSpace: "pre-wrap",
                              }}
                            >
                              {viewingOrder.notes}
                            </div>
                          </div>
                        )}
                      </div>  );
}
