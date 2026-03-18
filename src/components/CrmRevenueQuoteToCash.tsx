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

const underlineOnHoverEnter = (e: React.MouseEvent<HTMLElement>) => {
  e.currentTarget.style.textDecoration = "underline";
};

const underlineOnHoverLeave = (e: React.MouseEvent<HTMLElement>) => {
  e.currentTarget.style.textDecoration = "none";
};

const hoverBgEnter = (e: React.MouseEvent<HTMLElement>) => {
  e.currentTarget.style.backgroundColor = "#f7fafc";
};

const hoverBgLeave = (e: React.MouseEvent<HTMLElement>) => {
  e.currentTarget.style.backgroundColor = "transparent";
};

const borderHoverButtonBaseStyle: React.CSSProperties = {
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
};

const getBorderHoverButtonStyle = (gapPx: number): React.CSSProperties => ({
  ...borderHoverButtonBaseStyle,
  gap: `${gapPx}px`,
});

const UnderlineAnchor: React.FC<{
  href: string;
  style: React.CSSProperties;
  children: React.ReactNode;
}> = ({ href, style, children }) => (
  <a
    href={href}
    style={style}
    onMouseEnter={underlineOnHoverEnter}
    onMouseLeave={underlineOnHoverLeave}
  >
    {children}
  </a>
);

const BorderHoverButton: React.FC<{
  onClick?: () => void;
  gapPx: number;
  children: React.ReactNode;
}> = ({ onClick, gapPx, children }) => (
  <button
    type="button"
    onClick={onClick}
    style={getBorderHoverButtonStyle(gapPx)}
    onMouseEnter={hoverBgEnter}
    onMouseLeave={hoverBgLeave}
  >
    {children}
  </button>
);

export const createDefaultRevenueSections = (
  subscriptionCount: number,
  subscriptionItems: SubscriptionItem[],
): RevenueSection[] => [
  {
    id: "quotes",
    title: "Quotes",
    count: 0,
    description: "Track the sales documents associated with this record.",
    buttonText: "Create quote",
    buttonIcon: FileText,
    onButtonClick: () => {},
    addButtonText: "Add",
    onAddClick: () => {},
  },
  {
    id: "invoices",
    title: "Invoices",
    count: 0,
    description:
      "Send your customer a request for payment and associate it with this record.",
    buttonText: "Set up payments",
    onButtonClick: () => {},
    addButtonText: "Add",
    onAddClick: () => {},
  },
  {
    id: "payment-links",
    title: "Payment Links",
    count: 0,
    description:
      "Add a payment link to accept a payment and associate it with this record.",
    buttonText: "Set up payments",
    onButtonClick: () => {},
    addButtonText: "Add",
    onAddClick: () => {},
  },
  {
    id: "subscriptions",
    title: "Subscriptions",
    count: subscriptionCount,
    description: "",
    buttonText: "",
    items: subscriptionItems,
    onButtonClick: () => {},
    addButtonText: "Add",
    onAddClick: () => {},
  },
  {
    id: "payments",
    title: "Payments",
    count: 0,
    description:
      "Track payments associated with this record. A payment is created when a customer pays or a recurring payment is processed.",
    buttonText: "Set up payments",
    onButtonClick: () => {},
  },
];

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
              onMouseEnter={underlineOnHoverEnter}
              onMouseLeave={underlineOnHoverLeave}
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
                  <UnderlineAnchor
                    href={item.link}
                    style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "#006162",
                      textDecoration: "none",
                    }}
                  >
                    {item.name}
                  </UnderlineAnchor>
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
                    <UnderlineAnchor
                      href={`mailto:${item.contactEmail}`}
                      style={{ color: "#006162", textDecoration: "none" }}
                    >
                      {item.contactEmail}
                    </UnderlineAnchor>
                    <ExternalLink
                      size={12}
                      style={{ marginLeft: "4px", display: "inline" }}
                    />
                  </div>
                </div>
              </div>
            ))}
            <BorderHoverButton gapPx={6}>
              View all associated {section.title}
              <ExternalLink size={14} />
            </BorderHoverButton>
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
              <BorderHoverButton gapPx={8} onClick={section.onButtonClick}>
                {section.buttonIcon && <section.buttonIcon size={16} />}
                {section.buttonText}
              </BorderHoverButton>
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

