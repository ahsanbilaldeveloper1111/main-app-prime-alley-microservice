import React from "react";
import { ChevronDown, ExternalLink, FileText } from "lucide-react";

export interface SubscriptionItem {
  id: string;
  name: string;
  status: "active" | "inactive" | "cancelled";
  nextBillingDate: string;
  nextPaymentAmount: string;
  contactEmail: string;
  link: string;
}

export interface RevenueSection {
  id: string;
  title: string;
  count: number;
  description: string;
  buttonText: string;
  buttonIcon?: React.ComponentType<{ size?: number }>;
  items?: SubscriptionItem[];
  onButtonClick: () => void;
  addButtonText?: string;
  onAddClick?: () => void;
}

interface CrmRevenueQuoteToCashProps {
  sections: RevenueSection[];
  isCollapsed: boolean;
  onToggle: () => void;
}

export const CrmRevenueQuoteToCash: React.FC<CrmRevenueQuoteToCashProps> = ({
  sections,
  isCollapsed,
  onToggle,
}) => {
  const renderRevenueSection = (section: RevenueSection) => {
    return (
      <div
        key={section.id}
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #eaf0f6",
          borderRadius: "5px",
          padding: "20px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: section.items ? "16px" : "12px",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#141414",
              margin: 0,
            }}
          >
            {section.title} ({section.count})
          </h3>
          {section.addButtonText && (
            <button
              type="button"
              onClick={section.onAddClick}
              style={{
                padding: "6px 12px",
                backgroundColor: "transparent",
                border: "none",
                fontSize: "14px",
                fontWeight: 500,
                color: "#006162",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = "none";
              }}
            >
              +{section.addButtonText}
              <ChevronDown size={14} />
            </button>
          )}
        </div>

        {section.items && section.items.length > 0 ? (
          <>
            {section.items.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: "16px",
                  backgroundColor: "#f7fafc",
                  border: "1px solid #eaf0f6",
                  borderRadius: "5px",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    marginBottom: "12px",
                  }}
                >
                  <FileText size={18} color="#7c98b6" />
                  <a
                    href={item.link}
                    style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "#006162",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.textDecoration = "underline";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.textDecoration = "none";
                    }}
                  >
                    {item.name}
                  </a>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    fontSize: "14px",
                  }}
                >
                  <div>
                    <span style={{ color: "#141414" }}>Status: </span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        color: "#141414",
                      }}
                    >
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor:
                            item.status === "active" ? "#10b981" : "#ef4444",
                          display: "inline-block",
                        }}
                      />
                      {item.status.charAt(0).toUpperCase() +
                        item.status.slice(1)}
                    </span>
                  </div>
                  <div style={{ color: "#141414" }}>
                    Next billing date: {item.nextBillingDate}
                  </div>
                  <div style={{ color: "#141414" }}>
                    Next payment amount: {item.nextPaymentAmount}
                  </div>
                  <div>
                    <span style={{ color: "#141414" }}>Contact email: </span>
                    <a
                      href={`mailto:${item.contactEmail}`}
                      style={{ color: "#006162", textDecoration: "none" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.textDecoration = "underline";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.textDecoration = "none";
                      }}
                    >
                      {item.contactEmail}
                    </a>
                    <ExternalLink
                      size={12}
                      style={{ marginLeft: "4px", display: "inline" }}
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              style={{
                padding: "8px 16px",
                backgroundColor: "transparent",
                border: "1px solid #cbd5e0",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: 500,
                color: "#141414",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f7fafc";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              View all associated {section.title}
              <ExternalLink size={14} />
            </button>
          </>
        ) : (
          <>
            <p
              style={{
                fontSize: "14px",
                color: "#141414",
                lineHeight: "1.6",
                marginBottom: "16px",
              }}
            >
              {section.description}
            </p>
            {section.buttonText && (
              <button
                type="button"
                onClick={section.onButtonClick}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "transparent",
                  border: "1px solid #cbd5e0",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#141414",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f7fafc";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {section.buttonIcon && <section.buttonIcon size={16} />}
                {section.buttonText}
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div style={{ marginBottom: "24px" }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "16px",
          cursor: "pointer",
          backgroundColor: "transparent",
          border: "none",
          padding: 0,
        }}
      >
        <ChevronDown
          size={20}
          style={{
            color: "#141414",
            transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        />
        <h2
          style={{
            fontSize: "18px",
            fontWeight: 600,
            color: "#141414",
            margin: 0,
          }}
        >
          Quote-to-cash
        </h2>
      </button>

      {!isCollapsed && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: "16px",
          }}
        >
          {sections.map((section) => renderRevenueSection(section))}
        </div>
      )}
    </div>
  );
};

