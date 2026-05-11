import { ChevronDown } from "lucide-react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import TopSection from "../Overview/TopSection";
import InfoTooltip from "@components/billings/shared/InfoTooltip";
import type { PaymentMethodLike } from "@components/billings/shared/paymentMethods";
import { PRO_PLAN_INCLUDES, subscriptionPageStyles as styles } from "./subscriptionPageStyles";

function IncludesList({ items }: Readonly<{ items: readonly string[] }>) {
  return (
    <>
      {items.map((item) => (
        <div key={item} style={{ ...styles.includedItem, display: "flex", alignItems: "center", gap: 6 }}>
          <span>{item}</span>
          <InfoTooltip message="Feature availability is subject to the specific plan purchased." />
        </div>
      ))}
    </>
  );
}

export type SubscriptionPageViewProps = Readonly<{
  companyDetails: any;
  displayPaymentMethod: PaymentMethodLike | undefined;
  hasDefaultAccount: boolean;
}>;

export function SubscriptionPageView({
  companyDetails,
  displayPaymentMethod,
  hasDefaultAccount,
}: SubscriptionPageViewProps) {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <div style={styles.body}>
      <div style={{ maxWidth: "calc(1376px)", margin: "0 auto" }}>

        <div style={styles.card}>
          <div style={styles.cardPadding}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={styles.sectionHeading}>Subscription Summary</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" style={styles.btnDark}>Add seats</button>
                <button
                  type="button"
                  style={styles.btnLight}
                  onClick={() => {
                    router
                      .push("/billing/account-billing/billing-history")
                      .then(() => undefined);
                  }}
                >
                  View invoices
                </button>
              </div>
            </div>

            <TopSection
              companyDetails={companyDetails}
              session={session}
              displayPaymentMethod={displayPaymentMethod}
              hasDefaultAccount={hasDefaultAccount}
              styles={{ label: styles.label, value: styles.value, link: styles.link }}
            />
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardPadding}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <ChevronDown size={20} strokeWidth={2} color="#141414" style={{ cursor: "pointer" }} />
              <h2 style={styles.sectionHeading}>Committed Terms | 1st April 2026 – 30th April 2026</h2>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ flex: 1 }}>
                <h3 style={styles.subHeading}>Pro Plan</h3>
              </div>
              <div style={{ marginLeft: 32 }}>
                <button type="button" style={styles.btnLight}>View pricing</button>
              </div>
            </div>

            <div style={{ fontSize: 13, color: "#141414", marginTop: 2, marginBottom: 20 }}>
              The annual subscription cost for the Pro Plan is subject to a 5% increase effective next year.
            </div>

            <div style={{ paddingLeft: 16 }}>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>Includes:</div>
              <IncludesList items={PRO_PLAN_INCLUDES} />
            </div>

            <div style={{ borderTop: "1px solid #e5e5e5", margin: "20px 0" }} />

            <div style={{ marginBottom: 20 }}>
              <div style={styles.subHeading}>Total Credits</div>
              <div style={{ fontSize: 14, color: "#141414", marginTop: 6 }}>0 Included Credits</div>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardPadding}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ChevronDown size={20} strokeWidth={2} color="#141414" style={{ cursor: "pointer" }} />
                <h2 style={styles.sectionHeading}>Auto-Renewal Terms | 1st April 2026 – 30th April 2026</h2>
              </div>
              <button type="button" style={styles.btnLight}>Cancel auto-renewal</button>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ flex: 1 }}>
                <h3 style={styles.subHeading}>Pro Plan</h3>
                <div style={{ fontSize: 13, color: "#141414", marginTop: 4 }}>
                  The annual subscription cost for the Pro Plan is subject to a 5% increase effective next year.
                </div>
              </div>
            </div>

            <div style={{ paddingLeft: 16, marginTop: 20 }}>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>Includes:</div>
              <IncludesList items={PRO_PLAN_INCLUDES} />
            </div>

            <div style={{ borderTop: "1px solid #e5e5e5", margin: "20px 0" }} />

            <div style={{ marginBottom: 20 }}>
              <div style={styles.subHeading}>Total Credits</div>
              <div style={{ fontSize: 14, color: "#141414", marginTop: 6 }}>0 Included Credits</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
