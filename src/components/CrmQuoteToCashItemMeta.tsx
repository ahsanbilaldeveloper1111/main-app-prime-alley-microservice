import React from "react";
import { ExternalLink } from "lucide-react";

interface CrmQuoteToCashItemMetaProps {
  status: string;
  nextBillingDate: string;
  nextPaymentAmount: string;
  contactEmail: string;
}

const underlineOnHoverEnter = (e: React.MouseEvent<HTMLElement>) => {
  e.currentTarget.style.textDecoration = "underline";
};

const underlineOnHoverLeave = (e: React.MouseEvent<HTMLElement>) => {
  e.currentTarget.style.textDecoration = "none";
};

const CrmQuoteToCashItemMeta: React.FC<CrmQuoteToCashItemMetaProps> = ({
  status,
  nextBillingDate,
  nextPaymentAmount,
  contactEmail,
}) => {
  const normalizedStatus =
    status.charAt(0).toUpperCase() + status.slice(1);

  return (
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
                status === "active" ? "#10b981" : "#ef4444",
              display: "inline-block",
            }}
          />
          {normalizedStatus}
        </span>
      </div>

      <div style={{ color: "#141414" }}>
        Next billing date: {nextBillingDate}
      </div>

      <div style={{ color: "#141414" }}>
        Next payment amount: {nextPaymentAmount}
      </div>

      <div>
        <span style={{ color: "#141414" }}>Contact email: </span>
        <a
          href={`mailto:${contactEmail}`}
          style={{ color: "#006162", textDecoration: "none" }}
          onMouseEnter={underlineOnHoverEnter}
          onMouseLeave={underlineOnHoverLeave}
        >
          {contactEmail}
        </a>
        <ExternalLink
          size={12}
          style={{ marginLeft: "4px", display: "inline" }}
        />
      </div>
    </div>
  );
};

export default CrmQuoteToCashItemMeta;

