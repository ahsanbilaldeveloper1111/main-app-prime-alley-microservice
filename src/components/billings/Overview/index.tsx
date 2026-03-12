import React, { useEffect, useState } from "react";
import {
  BarChart3,
  CreditCard,
  ExternalLink,
  FileText,
  Info,
  RefreshCcw,
  Settings,
  UserPlus,
} from "lucide-react";

import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  GetCompanyDetails,
  GetPaymentMethods,
  GetDashboardCounters,
  GetPayments,
} from "@utils/accounting";

import TopSection from "./TopSection";

/** Given an ISO invoice date (e.g. 2026-03-12), returns the same day next month formatted as "12 April 2026". */
function formatNextChargeDate(invoiceDateIso: string | null | undefined): string {
  if (!invoiceDateIso) return "—";
  const d = new Date(invoiceDateIso);
  if (Number.isNaN(d.getTime())) return "—";
  d.setMonth(d.getMonth() + 1);
  const day = d.getDate();
  const month = d.toLocaleString("en-GB", { month: "long" });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    position: "relative" as const,
    display: "flex",
    flexDirection: "column" as const,
    width: "100%",
    padding: 0,
    backgroundColor: "rgb(255, 255, 255)",
    boxShadow: "rgba(20, 20, 20, 0.08) 0px 1px 8px 0px",
    border: "1px solid rgb(204, 204, 204)",
    marginBlockEnd: 16,
    borderRadius: 8,
    boxSizing: "border-box" as const,
  },
  cardPadding: {
    padding: "40px",
  },
  companyHeading: {
    boxSizing: "border-box" as const,
    fontSize: 24,
    fontStyle: "unset",
    fontWeight: 300,
    textTransform: "unset" as const,
    margin: 0,
    padding: 0,
    backgroundColor: "unset",
    fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
    letterSpacing: 0,
    lineHeight: "29px",
    marginBottom: 20,
  },
  label: {
    color: "rgb(102, 102, 102)",
    fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
    fontSize: 12,
    fontWeight: 300,
    letterSpacing: 0,
    lineHeight: "18px",
  },
  value: {
    fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: 0,
    lineHeight: "18px",
  },
  sectionHeading: {
    boxSizing: "border-box" as const,
    fontSize: 24,
    fontStyle: "unset",
    fontWeight: 300,
    textTransform: "unset" as const,
    margin: "0 0 16px 0",
    padding: 0,
    backgroundColor: "unset",
    fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
    letterSpacing: 0,
    lineHeight: "29px",
  },
  link: {
    fontWeight: 600,
    color: "rgb(0, 97, 98)",
    cursor: "pointer",
    textUnderlineOffset: "24%",
    textDecoration: "underline",
    fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
    fontSize: 14,
  },
  btnDark: {
    display: "inline-flex",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    backgroundColor: "rgb(20, 20, 20)",
    borderColor: "rgba(20, 20, 20, 0)",
    color: "rgb(255, 255, 255)",
    textDecoration: "none",
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: "solid",
    verticalAlign: "middle",
    paddingBlock: 8,
    paddingInline: 16,
    maxWidth: "100%",
    fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
    fontSize: 12,
    fontWeight: 400,
    letterSpacing: 0,
    lineHeight: "14px",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center" as const,
    textUnderlineOffset: "24%",
    transition: "150ms ease-out",
    cursor: "pointer",
  },
  btnLight: {
    display: "inline-flex",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    backgroundColor: "rgb(255, 255, 255)",
    borderColor: "rgb(204, 204, 204)",
    color: "rgb(20, 20, 20)",
    textDecoration: "none",
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: "solid",
    verticalAlign: "middle",
    paddingBlock: 8,
    paddingInline: 16,
    maxWidth: "100%",
    fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
    fontSize: 12,
    fontWeight: 400,
    letterSpacing: 0,
    lineHeight: "14px",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center" as const,
    transition: "150ms ease-out",
    cursor: "pointer",
  },
  subHeading: {
    boxSizing: "border-box" as const,
    fontSize: 20,
    fontStyle: "unset",
    fontWeight: 600,
    textTransform: "unset" as const,
    margin: 0,
    padding: 0,
    backgroundColor: "unset",
    fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
    letterSpacing: 0,
    lineHeight: "24px",
  },
};

const commonActions = [
  { Icon: FileText, label: "View or download invoices" },
  { Icon: Settings, label: "Manage subscription details" },
  { Icon: BarChart3, label: "View usage & limits" },
  { Icon: UserPlus, label: "Add a billing contact" },
  { Icon: CreditCard, label: "Add a payment method" },
  { Icon: RefreshCcw, label: "Cancel auto-renewal" },
];

const starterIncludes = [
  "Smart CRM ",
  "Call Logs & Recordings",
  "Planner",
  "Pulse",
  "Workforce",
  "1 Core Seat",
];

const billingHelpLinks = [
  ["How do I cancel this subscription?", "Understand marketing contacts billing"],
  ["Billing and payment FAQs", "How do I update my payment method?"],
  ["Where do I find my subscription and service limits?", "View or download your invoices and receipts"],
];

const OverviewPage = () => {
  const { data: session } = useSession();
  const [companyDetails, setCompanyDetails] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companyRes, paymentMethodsRes, countersRes, paymentsRes] = await Promise.all([
          GetCompanyDetails({ crm_company_id: '' }),
          GetPaymentMethods(),
          GetDashboardCounters(),
          GetPayments({ page: 1, per_page: 3, limit: 3 }),
        ]);

        console.log("GetCompanyDetails response:", companyRes);
        console.log("GetPaymentMethods response:", paymentMethodsRes);
        console.log("GetDashboardCounters response:", countersRes);
        console.log("GetPayments response:", paymentsRes);

        setCompanyDetails(companyRes);
        setPaymentMethods(paymentMethodsRes);
        
      } catch (err) {
        console.error("Overview API error:", err);
      }
    };
    fetchData();
  }, []);

  const paymentMethodsList = Array.isArray(paymentMethods)
    ? paymentMethods
    : paymentMethods?.data ?? paymentMethods?.payment_methods ?? [];
  const displayPaymentMethod = paymentMethodsList.find((pm: any) => pm?.is_default) ?? paymentMethodsList[0];
  const hasDefaultAccount = paymentMethodsList.some((pm: any) => pm?.is_default);

  return (
    <>
      {/* Company Info Card */}
      <div style={styles.card}>
        <div style={{ ...styles.cardPadding, display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 8,
            background: "linear-gradient(135deg, #00bcd4, #006162)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="4" y="4" width="8" height="8" rx="2" fill="white" opacity="0.9" />
              <rect x="16" y="4" width="8" height="8" rx="2" fill="white" opacity="0.6" />
              <rect x="4" y="16" width="8" height="8" rx="2" fill="white" opacity="0.6" />
              <rect x="16" y="16" width="8" height="8" rx="2" fill="white" opacity="0.9" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={styles.companyHeading}>
              {companyDetails?.name ?? session?.user?.company_name}
            </h2>
            <TopSection
              companyDetails={companyDetails}
              session={session}
              displayPaymentMethod={displayPaymentMethod}
              hasDefaultAccount={hasDefaultAccount}
              styles={{ label: styles.label, value: styles.value, link: styles.link }}
            />
          </div>
        </div>
      </div>

      {/* Two column: Your Next Payment + Common Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, marginBlockEnd: 16 }}>
        <div style={{ ...styles.card, marginBlockEnd: 0 }}>
          <div style={styles.cardPadding}>
            <h2 style={styles.sectionHeading}>Your Next Payment</h2>
            <p style={{ margin: "0 0 16px 0", fontSize: 18, color: "#141414" }}>
            An estimated total of <strong>AED {companyDetails?.latest_invoice?.total_amount ?? "0"}</strong> will be charged on <strong>{formatNextChargeDate(companyDetails?.latest_invoice?.invoice_date)}</strong>.
            </p>
            <p style={{ margin: "0 0 16px 0", fontSize: 12, color: "#666", lineHeight: "18px" }}>
              *Includes estimated sales tax or VAT, based on your main company address. Excludes any recent credits to your account. Your recurring fees may increase based on your usage.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <div style={{ ...styles.label, marginBottom: 4 }}>Billing period</div>
                <div style={{ fontSize: 14, color: "#141414" }}>1st April 2026 – 30th April 2026 <span className=" text-small text-danger">(Static)</span></div>
              </div>
              <div>
                <div style={{ ...styles.label, marginBottom: 4 }}>Payment method</div>
                {displayPaymentMethod ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{
                      background: "#1a1f71", color: "#fff", fontSize: 9, fontWeight: 700,
                      padding: "2px 5px", borderRadius: 3, letterSpacing: 0.5,
                    }}>
                      {(displayPaymentMethod?.card?.brand ?? "card").toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        ending in {displayPaymentMethod?.card?.last4 ?? "****"}
                        {hasDefaultAccount && displayPaymentMethod?.is_default && (
                          <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, color: "rgb(0, 97, 98)" }}>(Default)</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>
                        {displayPaymentMethod?.billing_details?.name ?? ""}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 14, color: "#666" }}>No payment method</div>
                )}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ ...styles.label, marginBottom: 4 }}><strong style={{ color: "#141414", fontSize: 14 }}>Products &amp; Add-ons</strong></div>
              <div style={{ fontSize: 14 }}>Pro Plan</div>
            </div>
            <div>
              <div style={{ ...styles.value, marginBottom: 4 }}>Need help?</div>
              <p style={{ margin: 0, fontSize: 14 }}>
                Visit the{" "}
                <Link href="/settings" style={styles.link}>Knowledge Base</Link>
                {" "}for answers to FAQs or{" "}
                <Link href="/settings" style={styles.link}>contact us</Link>
                {" "}for more support.
              </p>
            </div>
          </div>
        </div>

        <div style={{ ...styles.card, marginBlockEnd: 0 }}>
          <div style={styles.cardPadding}>
            <h2 style={styles.sectionHeading}>Common Actions</h2>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
              {commonActions.map((action) => (
                <div key={action.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <action.Icon size={16} strokeWidth={2} color="#141414" />
                  <Link href="/billing/account-billing" style={styles.link}>{action.label}</Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Two column: Prime Alley Credits + Marketing Contacts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBlockEnd: 16 }}>
        <div style={{ ...styles.card, marginBlockEnd: 0 }}>
          <div style={styles.cardPadding}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ ...styles.sectionHeading, margin: 0 }}>My Credits</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={styles.btnDark}>Add credits</button>
                <button style={styles.btnLight}>Manage usage</button>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 13 }}>0 of 0 credits used</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>0%</span>
            </div>
            <div style={{ height: 8, backgroundColor: "#e5e5e5", borderRadius: 4, marginBottom: 8 }}>
              <div style={{ width: "0%", height: "100%", backgroundColor: "#00a47c", borderRadius: 4 }} />
            </div>
            <p style={{ fontSize: 12, color: "#666", margin: "0 0 12px 0" }}>Resets on 10 Mar 2026.</p>
            <div style={{
              border: "1px solid rgb(0, 97, 98)", borderRadius: 4, padding: "8px 12px",
              fontSize: 12, color: "rgb(0, 97, 98)", marginBottom: 12,
            }}>
              Usage will be paused if you reach your credit limit
            </div>
            <p style={{ fontSize: 13, margin: 0 }}>
              Explore features that use Credits in{" "}
              <Link href="/settings" style={styles.link}> Agents Marketplace</Link>
            </p>
          </div>
        </div>

        <div style={{ ...styles.card, marginBlockEnd: 0 }}>
          <div style={styles.cardPadding}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ ...styles.sectionHeading, margin: 0 }}>Marketing Contacts</h2>
              <button style={styles.btnLight}>View Usage &amp; Limits</button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Contact tier: 0 contacts</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>0/0 used</span>
            </div>
            <p style={{ fontSize: 13, color: "#444", lineHeight: "20px", margin: 0 }}>
              Billed data for marketing contacts is updated once a day. Marketing contacts are updated to non-marketing once a month on the next update date. Go to{" "}
              <Link href="/billing/account-billing" style={styles.link}>Usage &amp; Limits</Link>
              {" "}to set contacts as non-marketing.
            </p>
          </div>
        </div>
      </div>

      {/* Seats */}
      <div style={styles.card}>
        <div style={styles.cardPadding}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h2 style={{ ...styles.sectionHeading, margin: 0 }}>Seats</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={styles.btnDark}>Add seats</button>
              <button style={{ ...styles.btnLight, gap: 6 }}>
                <span>Manage seats &amp; users</span>
                <ExternalLink size={14} strokeWidth={2} />
              </button>
            </div>
          </div>
          <div style={{ textAlign: "center" as const, padding: "16px 0" }}>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 1,
              color: "#666",
              marginBottom: 4,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}>
              <span>CORE SEATS (PRO)</span>
              <Info size={14} strokeWidth={2} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 300, lineHeight: 1 }}>1/2,501</div>
            <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>2,500 seats left</div>
          </div>
        </div>
      </div>

      {/* Products & Add-ons */}
      <div style={styles.card}>
        <div style={styles.cardPadding}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h2 style={{ ...styles.sectionHeading, margin: 0 }}>Products &amp; Add-ons</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...styles.btnLight, gap: 6 }}>
                <span>Manage seats &amp; users</span>
                <ExternalLink size={14} strokeWidth={2} />
              </button>
              <button style={styles.btnLight}>View credits usage</button>
              <button style={styles.btnDark}>Manage subscriptions</button>
            </div>
          </div>

          <div style={{ borderBottom: "1px solid #e5e5e5", paddingBottom: 24, marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <h3 style={styles.subHeading}>Pro Plan</h3>
              <button style={styles.btnLight}>View pricing</button>
            </div>
            <div style={{ marginTop: 12, paddingLeft: 8 }}>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>Includes:</div>
              {starterIncludes.map((item) => (
                <div key={item} style={{ fontSize: 14, color: "#141414", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{item}</span>
                  <Info size={14} strokeWidth={2} color="#666" />
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <h3 style={styles.subHeading}>Virtual Agents Trial</h3>
                  <span style={{
                    background: "#ff5c35", color: "#fff", fontSize: 11, fontWeight: 600,
                    padding: "3px 8px", borderRadius: 12, whiteSpace: "nowrap" as const,
                  }}>41 days left</span>
                </div>
                <p style={{ fontSize: 13, color: "#666", margin: "6px 0 6px 0" }}>
                  You won't be charged at the end of your trial - you'll just return to your current plan
                </p>
                <p style={{ fontSize: 13, color: "#666", margin: 0 }}>
                  Data hosting location:{" "}
                  <Link href="/settings" style={{ ...styles.link, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <span>Gulf Region</span>
                    <ExternalLink size={13} strokeWidth={2} />
                  </Link>
                </p>
              </div>
              <button style={styles.btnLight}>View pricing</button>
            </div>
          </div>

          <div>
            <h3 style={styles.subHeading}>Total Credits</h3>
            <p style={{ fontSize: 14, color: "#141414", margin: "6px 0 0 0" }}>0 Included Credits</p>
          </div>
        </div>
      </div>

      {/* Want to enhance your plan? */}
      <div style={styles.card}>
        <div style={{
          ...styles.cardPadding,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <h2 style={{ ...styles.sectionHeading, margin: "0 0 6px 0" }}>Want to enhance your plan?</h2>
            <p style={{ fontSize: 13, color: "#666", margin: 0 }}>
              Explore the growth platform for upgrades, services, and add-ons
            </p>
          </div>
          <button style={styles.btnLight}>Explore add-ons</button>
        </div>
      </div>

      {/* Billing Help */}
      <div style={styles.card}>
        <div style={{ ...styles.cardPadding, position: "relative" as const }}>
          <h2 style={{ ...styles.sectionHeading, marginBottom: 20 }}>Billing Help</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 32px" }}>
            {billingHelpLinks.map((row) => (
              <div key={`${row[0]}|${row[1]}`} style={{ display: "contents" }}>
                <Link href="/settings" style={{ ...styles.link, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <span>{row[0]}</span>
                  <ExternalLink size={13} strokeWidth={2} />
                </Link>
                <Link href="/settings" style={{ ...styles.link, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <span>{row[1]}</span>
                  <ExternalLink size={13} strokeWidth={2} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default OverviewPage;
