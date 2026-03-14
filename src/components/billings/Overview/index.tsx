import React, { useEffect, useState } from "react";
import {
  BarChart3,
  CreditCard,
  ExternalLink,
  FileText,
  Info,
  Settings,
} from "lucide-react";

import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  GetCompanyDetails,
  GetPaymentMethods,
  GetDashboardCounters,
  GetPayments,
} from "@utils/accounting";
import { getAllUsers } from "@utils/users";

import TopSection from "./TopSection";
import { BILLING_FONT, billingSharedStyles } from "@components/billings/shared/styles";
import { hasDefaultPaymentMethod, normalizePaymentMethods, pickDisplayPaymentMethod } from "@components/billings/shared/paymentMethods";
import InfoTooltip from "@components/billings/shared/InfoTooltip";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractSummaryUsersCount(value: unknown): number | null {
  if (!isRecord(value)) return null;

  const summary = value.summary;
  if (!isRecord(summary)) return null;

  const users = summary.users;
  if (typeof users === "number") return users;
  if (typeof users === "string") {
    const parsed = Number(users);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (isRecord(users)) {
    const candidate = users.total ?? users.count ?? users.users;
    if (typeof candidate === "number") return candidate;
    if (typeof candidate === "string") {
      const parsed = Number(candidate);
      return Number.isFinite(parsed) ? parsed : null;
    }
  }

  return null;
}

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
  ...billingSharedStyles,
  companyHeading: {
    boxSizing: "border-box" as const,
    fontSize: 24,
    fontStyle: "unset",
    fontWeight: 300,
    textTransform: "unset" as const,
    margin: 0,
    padding: 0,
    backgroundColor: "unset",
    fontFamily: BILLING_FONT,
    letterSpacing: 0,
    lineHeight: "29px",
    marginBottom: 20,
  },
  sectionHeading: {
    ...billingSharedStyles.sectionHeading,
    boxSizing: "border-box" as const,
    fontStyle: "unset",
    textTransform: "unset" as const,
    margin: "0 0 16px 0",
    padding: 0,
    backgroundColor: "unset",
  },
  btnDark: {
    ...billingSharedStyles.btnDark,
    maxWidth: "100%",
    textUnderlineOffset: "24%",
  },
  btnLight: {
    ...billingSharedStyles.btnLight,
    maxWidth: "100%",
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
    fontFamily: BILLING_FONT,
    letterSpacing: 0,
    lineHeight: "24px",
  },
};

const commonActions = [
  { Icon: FileText, label: "View or download invoices", url: "/billing/account-billing/billing-history" },
  { Icon: Settings, label: "View subscriptions", url: "/billing/account-billing/subscriptions" },
  { Icon: CreditCard, label: "View Transactions", url: "/billing/account-billing/transactions" },
  { Icon: BarChart3, label: "View usage & limits", url: "/billing/account-billing/usage-limits" },
  { Icon: CreditCard, label: "Add a payment method", url: "/billing/account-billing/payment-methods" },

];

const starterIncludes = [
  "Smart CRM ",
  "Communications",
  "Planner",
  "Pulse",
  "Workforce",
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
  const [usersCount, setUsersCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companyRes, paymentMethodsRes, countersRes, paymentsRes, usersRes] = await Promise.all([
          GetCompanyDetails({ crm_company_id: '' }),
          GetPaymentMethods(),
          GetDashboardCounters(),
          GetPayments({ page: 1, per_page: 3, limit: 3 }),
          getAllUsers({ page: 1, perPage: 1 }),
        ]);

        console.log("GetCompanyDetails response:", companyRes);
        console.log("GetPaymentMethods response:", paymentMethodsRes);
        console.log("GetDashboardCounters response:", countersRes);
        console.log("GetPayments response:", paymentsRes);
        console.log("getAllUsers response:", usersRes);

        setCompanyDetails(companyRes);
        setPaymentMethods(paymentMethodsRes);
        setUsersCount(extractSummaryUsersCount(usersRes));
        
      } catch (err) {
        console.error("Overview API error:", err);
      }
    };
    fetchData();
  }, []);

  const paymentMethodsList = normalizePaymentMethods(paymentMethods);
  const displayPaymentMethod = pickDisplayPaymentMethod(paymentMethodsList);
  const hasDefaultAccount = hasDefaultPaymentMethod(paymentMethodsList);
  const seatsText = usersCount === null ? "—/—" : `${usersCount.toLocaleString()}/${usersCount.toLocaleString()}`;

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
            An estimated total of <strong>AED {companyDetails?.latest_invoice?.total_amount ?? "0"}</strong> will be charged on the 1st of every month.
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
                  <Link href={action.url} style={styles.link}>{action.label}</Link>
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
            <div style={{ fontSize: 28, fontWeight: 300, lineHeight: 1 }}>{seatsText}</div>
            <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>0 seats left</div>
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
                  <InfoTooltip message="Some features may not work." />
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
                  }}>Beta</span>
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
