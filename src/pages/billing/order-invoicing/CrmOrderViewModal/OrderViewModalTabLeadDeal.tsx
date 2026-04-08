import React from "react";
import { Badge } from "react-bootstrap";
import { formatDateForTable } from "@utils/Helper";
import { CrmPhoneDisplay as PhoneDisplay } from "@components/crm/CrmListPageUi";
import {
  Building2,
  Calendar,
  User,
} from "lucide-react";
import { leadPotentialBadgeVariant } from "./orderViewModalUtils";

export function OrderViewModalTabLeadDeal(props: {
  readonly relatedDeal: any;
  readonly relatedLead: any;
  readonly extensions: any[];
}): React.ReactElement {
  const { relatedDeal, relatedLead, extensions } = props;
  return (
                      <div>
                        {/* Deal Information */}
                        {relatedDeal && (
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
                              Deal Information
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
                                    Deal Name
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "14px",
                                      color: "#1f2937",
                                      fontWeight: 500,
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    {relatedDeal.name || "N/A"}
                                  </div>
                                </div>
                                {relatedDeal.stage && (
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
                                      Stage
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "14px",
                                        color: "#1f2937",
                                        fontWeight: 500,
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      <Badge
                                        style={{
                                          padding: "6px 14px",
                                          borderRadius: "20px",
                                          fontSize: "12px",
                                          fontWeight: 600,
                                          backgroundColor:
                                            relatedDeal.stage?.color ||
                                            "#6c757d",
                                        }}
                                      >
                                        {relatedDeal.stage?.name ||
                                          "Not assigned"}
                                      </Badge>
                                    </div>
                                  </div>
                                )}
                                {relatedDeal.net_value && (
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
                                      Deal Value
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "14px",
                                        color: "#1f2937",
                                        fontWeight: 500,
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      {relatedDeal.currency || "AED"}{" "}
                                      {Number.parseFloat(
                                        String(
                                          relatedDeal.net_value ||
                                            relatedDeal.grand_total ||
                                            0,
                                        ),
                                      ).toLocaleString()}
                                    </div>
                                  </div>
                                )}
                                {relatedDeal.assigned_to && (
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
                                          ext?.id == relatedDeal?.assigned_to ||
                                          ext?.extension ==
                                            relatedDeal?.assigned_to,
                                      )?.display_name ||
                                        extensions.find(
                                          (ext: any) =>
                                            ext?.id ==
                                              relatedDeal?.assigned_to ||
                                            ext?.extension ==
                                              relatedDeal?.assigned_to,
                                        )?.name ||
                                        relatedDeal.assigned_to ||
                                        "Not assigned"}
                                    </div>
                                  </div>
                                )}
                                {relatedDeal.created_at && (
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
                                      Created Date
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "14px",
                                        color: "#1f2937",
                                        fontWeight: 500,
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      <Calendar
                                        size={14}
                                        style={{
                                          color: "#f59e0b",
                                          marginRight: "6px",
                                          display: "inline",
                                        }}
                                      />
                                      {relatedDeal.created_at
                                        ? formatDateForTable(
                                            relatedDeal.created_at,
                                          )
                                        : "N/A"}
                                    </div>
                                  </div>
                                )}
                                {relatedDeal.company_name && (
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
                                      Company Name
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "14px",
                                        color: "#1f2937",
                                        fontWeight: 500,
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      <Building2
                                        size={14}
                                        style={{
                                          color: "#f59e0b",
                                          marginRight: "6px",
                                          display: "inline",
                                        }}
                                      />
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
                              Lead Information
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
                                    Lead Name
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "14px",
                                      color: "#1f2937",
                                      fontWeight: 500,
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    {relatedLead.name}
                                  </div>
                                </div>
                                {relatedLead.stage && (
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
                                      Stage
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "14px",
                                        color: "#1f2937",
                                        fontWeight: 500,
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      <Badge
                                        style={{
                                          padding: "6px 14px",
                                          borderRadius: "20px",
                                          fontSize: "12px",
                                          fontWeight: 600,
                                          backgroundColor:
                                            relatedLead.stage?.color ||
                                            "#6c757d",
                                        }}
                                      >
                                        {relatedLead.stage?.name ||
                                          "Not assigned"}
                                      </Badge>
                                    </div>
                                  </div>
                                )}
                                {relatedLead.lead_potential && (
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
                                      Lead Potential
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "14px",
                                        color: "#1f2937",
                                        fontWeight: 500,
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      <Badge
                                        bg={leadPotentialBadgeVariant(
                                          relatedLead.lead_potential,
                                        )}
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
                                          ext?.id ==
                                            relatedLead?.user_extension ||
                                          ext?.extension ==
                                            relatedLead?.user_extension,
                                      )?.display_name ||
                                        extensions.find(
                                          (ext: any) =>
                                            ext?.id ==
                                              relatedLead?.user_extension ||
                                            ext?.extension ==
                                              relatedLead?.user_extension,
                                        )?.name ||
                                        relatedLead.user_extension ||
                                        "Not assigned"}
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
                              Campaign Information
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
                                    Campaign Name
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "14px",
                                      color: "#1f2937",
                                      fontWeight: 500,
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    {relatedLead.campaign.name}
                                  </div>
                                </div>
                                {relatedLead.campaign_field_values &&
                                  Object.keys(relatedLead.campaign_field_values)
                                    .length > 0 &&
                                  Object.entries(
                                    relatedLead.campaign_field_values,
                                  ).map(([key, value]: [string, any]) => (
                                    <div key={key}>
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
                                        {key}
                                      </div>
                                      <div
                                        style={{
                                          fontSize: "14px",
                                          color: "#1f2937",
                                          fontWeight: 500,
                                          wordBreak: "break-word",
                                        }}
                                      >
                                        {String(value)}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Prospect Information */}
                        {relatedLead?.crm_data && (
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
                              Prospect Information
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
                                {relatedLead.crm_data.id && (
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
                                      CRM Data ID
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "14px",
                                        color: "#1f2937",
                                        fontWeight: 500,
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      #{relatedLead.crm_data.id}
                                    </div>
                                  </div>
                                )}
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
                                    Name
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "14px",
                                      color: "#1f2937",
                                      fontWeight: 500,
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    {relatedLead.crm_data.name || relatedLead.crm_data.data?.name || "N/A"}
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
                                      phone={relatedLead.crm_data.phone || relatedLead.crm_data.data?.phone || ""}
                                    />
                                  </div>
                                </div>
                                {relatedLead.crm_data.source_file && (
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
                                      Source File
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "14px",
                                        color: "#1f2937",
                                        fontWeight: 500,
                                        wordBreak: "break-word",
                                      }}
                                    >
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
