import React from "react";
import Link from "next/link";

export interface TopSectionStyles {
  label: React.CSSProperties;
  value: React.CSSProperties;
  link: React.CSSProperties;
}

export interface TopSectionProps {
  companyDetails: any;
  session: any;
  displayPaymentMethod: any;
  hasDefaultAccount: boolean;
  styles: TopSectionStyles;
}

const TopSection = ({
  companyDetails,
  session,
  displayPaymentMethod,
  hasDefaultAccount,
  styles,
}: TopSectionProps) => (
  <div style={{ margin: 0, display: "flex", flexDirection: "row" as const, justifyContent: "space-between", marginTop: 16, gap: 24 }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={styles.label}>Tenant ID</div>
      <div style={styles.value}>
        {companyDetails?.tenant_id ?? companyDetails?.company_identifier ?? session?.user?.company_identifier}
      </div>
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={styles.label}>Billing Frequency</div>
      <div style={styles.value} className="text-capitalize">
        {(companyDetails?.profile?.payment_mode ?? "").replaceAll("_", " ")}
      </div>
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={styles.label}>Subscription Term</div>
      <div style={styles.value}>
        1st Mar 2026 to 31st Mar 2026 <span className=" text-small text-danger">(Static)</span>
      </div>
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={styles.label}>Primary Contact</div>
      <div style={styles.value}>{companyDetails?.phone ?? ""}</div>
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={styles.label}>Payment Method</div>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 2 }}>
        {displayPaymentMethod ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
              <div style={{
                background: "#1a1f71", color: "#fff", fontSize: 9, fontWeight: 700,
                padding: "2px 5px", borderRadius: 3, letterSpacing: 0.5,
              }}>
                {(displayPaymentMethod?.card?.brand ?? displayPaymentMethod?.brand ?? "card").toUpperCase()}
              </div>
              <span style={styles.value}>
                ending in {displayPaymentMethod?.card?.last4 ?? displayPaymentMethod?.last4 ?? "****"}
              </span>
              {hasDefaultAccount && displayPaymentMethod?.is_default && (
                <span style={{
                  fontSize: 10, fontWeight: 600, color: "rgb(0, 97, 98)",
                  background: "rgba(0, 97, 98, 0.1)", padding: "2px 6px", borderRadius: 4,
                }}>
                  Default
                </span>
              )}
            </div>
            <div style={{ ...styles.value, fontSize: 12 }}>
              {displayPaymentMethod?.billing_details?.name ?? displayPaymentMethod?.holder_name ?? ""}
            </div>
          </>
        ) : (
          <div style={styles.value}>No payment method</div>
        )}
        <Link href="#" style={{ ...styles.link, fontSize: 12 }}>Change</Link>
      </div>
    </div>
  </div>
);

export default TopSection;
