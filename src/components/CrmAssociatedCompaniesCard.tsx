import React from "react";
import { ChevronDown, Building2, ExternalLink } from "lucide-react";

interface CrmAssociatedCompaniesCardProps {
  sectionId: string;
  collapsedSections: Set<string>;
  toggleSection: (id: string) => void;
  companyName: string | null | undefined;
  primaryPhone?: string | null | undefined;
  primaryEmail?: string | null | undefined;
  phones?: { number: string; type?: string | null }[] | null | undefined;
  count?: number;
  /** Optional CRM company ID for navigating to detail view */
  companyId?: number | string | null;
  viewAllLabel?: string;
  viewAllHref?: string;
  showViewAll?: boolean;
}

const CrmAssociatedCompaniesCard: React.FC<CrmAssociatedCompaniesCardProps> = ({
  sectionId,
  collapsedSections,
  toggleSection,
  companyName,
  primaryPhone,
  primaryEmail,
  phones,
  count,
  companyId,
  viewAllLabel,
  viewAllHref,
  showViewAll = true,
}) => {
  const companiesCount = count ?? (companyName ? 1 : 0);
  const phoneList =
    (phones &&
      phones
        .map((p) => ({
          number: (p?.number ?? "").trim(),
          type: p?.type ?? null,
        }))
        .filter((p) => p.number !== "")) ||
    (primaryPhone
      ? [
          {
            number: primaryPhone,
            type: null,
          },
        ]
      : []);

  const resolvedViewAllHref =
    viewAllHref ??
    (companyId != null && companyId !== ""
      ? `/crm/detailspage?type=companies&id=${encodeURIComponent(String(companyId))}`
      : "/crm/companies");

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "10px",
        marginBottom: "12px",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)",
        border: "1px solid #cccccc",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px 0",
          cursor: "pointer",
          backgroundColor: "#ffffff",
        }}
        onClick={() => toggleSection(sectionId)}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flex: 1,
          }}
        >
          <ChevronDown
            size={18}
            style={{
              color: "#141414",
              transform: collapsedSections.has(sectionId)
                ? "rotate(-90deg)"
                : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          />
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "#141414",
              margin: 0,
              lineHeight: "1.2",
            }}
          >
            Companies ({companiesCount})
          </h3>
        </div>
      </div>

      {!collapsedSections.has(sectionId) && (
        <div style={{ padding: "20px" }}>
          {companiesCount === 0 || !companyName ? (
            <div
              style={{
                padding: "32px 20px",
                textAlign: "center",
              }}
            >
              <Building2
                size={48}
                style={{ color: "#cbd5e0", marginBottom: "16px" }}
              />
              <p
                style={{
                  fontSize: "14px",
                  color: "#718096",
                  margin: 0,
                  lineHeight: "1.6",
                }}
              >
                No companies associated
              </p>
            </div>
          ) : (
            <>
              <div
                style={{
                  marginBottom: "16px",
                  border: "1px solid #cccccc",
                  borderRadius: "10px",
                  padding: "15px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "14px",
                      color: "#006162",
                      fontWeight: "500",
                    }}
                  >
                    {companyName}
                  </span>
                  <span
                    style={{
                      padding: "2px 8px",
                      backgroundColor: "#e6f3ff",
                      color: "#006162",
                      borderRadius: "3px",
                      fontSize: "11px",
                      fontWeight: "600",
                    }}
                  >
                    Primary
                  </span>
                </div>
                {primaryEmail && (
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#666666",
                      margin: "4px 0",
                    }}
                  >
                    Email: {primaryEmail}
                  </p>
                )}
                {phoneList.length > 0 &&
                  phoneList.map((phone, idx) => (
                    <p
                      key={`${phone.number}-${idx}`}
                      style={{
                        fontSize: "13px",
                        color: "#666666",
                        margin: "4px 0",
                      }}
                    >
                      Phone{phoneList.length > 1 ? ` ${idx + 1}` : ""}:{" "}
                      {phone.number}
                      {phone.type ? (
                        <span
                          style={{
                            marginLeft: "6px",
                            fontSize: "11px",
                            color: "#666666",
                            padding: "1px 6px",
                            borderRadius: "10px",
                            backgroundColor: "#f1f5f9",
                          }}
                        >
                          {phone.type}
                        </span>
                      ) : null}
                    </p>
                  ))}
              </div>
              {showViewAll && (
                <a
                  href={resolvedViewAllHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "12px",
                    color: "#141414",
                    textDecoration: "none",
                    fontWeight: "300",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    border: "1px solid #cccccc",
                    borderRadius: "6px",
                    padding: "6px 12px",
                  }}
                >
                  {viewAllLabel ?? "View all associated Companies"}
                  <ExternalLink size={12} />
                </a>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CrmAssociatedCompaniesCard;

