import { Info, Plus } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import {
  getAddressDisplay,
  getBillingContactLabel,
  getBusinessTrn,
  getCompanyName,
  getPrimaryContactLabel,
  toSelectDefaultValue,
} from "./companyInfoHelpers";
import { companyInfoFont, companyInfoStyles as s } from "./companyInfoStyles";
import { CompanyLogo } from "./CompanyLogo";
import { CompanyInfoSelectField } from "./CompanyInfoSelectField";

export type CompanyInfoPageViewProps = Readonly<{
  companyDetails: any;
  loading: boolean;
}>;

export function CompanyInfoPageView({ companyDetails, loading }: CompanyInfoPageViewProps) {
  const { data: session } = useSession();

  const companyName = getCompanyName(companyDetails, session);
  const addressDisplay = getAddressDisplay(companyDetails);
  const trn = getBusinessTrn(companyDetails);
  const primaryContactLabel = getPrimaryContactLabel(companyDetails, session);
  const billingContactLabel = getBillingContactLabel(companyDetails, primaryContactLabel);
  const primaryDefault = toSelectDefaultValue(primaryContactLabel);
  const billingDefault = toSelectDefaultValue(billingContactLabel);
  const billingDefaultForOthers = billingDefault ?? primaryDefault;

  const companyInfoSection = loading ? (
    <div style={{ ...s.card, padding: 40, textAlign: "center" as const, color: "#666", fontFamily: companyInfoFont }}>
      Loading…
    </div>
  ) : (
    <div style={s.card}>
      <div style={s.infoRow}>
        <div style={s.infoLeft}>
          <div style={{ width: 100, flexShrink: 0, display: "flex", alignItems: "flex-start", paddingTop: 4 }}>
            <CompanyLogo />
          </div>
          <div>
            <p style={s.fieldLabel}>Company Name</p>
            <p style={s.fieldValue}>{companyName}</p>
          </div>
        </div>
      </div>

      <div style={s.infoRow}>
        <div style={s.infoLeft}>
          <div style={{ width: 100, flexShrink: 0 }} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <p style={{ ...s.fieldLabel, margin: 0 }}>Primary Company Address</p>
              <Info size={14} color="#888" />
            </div>
            <p style={{ ...s.fieldValue, lineHeight: "24px", whiteSpace: "pre-line" }}>
              {addressDisplay}
            </p>
          </div>
        </div>
      </div>

      <div style={{ ...s.infoRow, borderBottom: "none" }}>
        <div style={s.infoLeft}>
          <div style={{ width: 100, flexShrink: 0 }} />
          <div>
            <p style={s.fieldLabel}>Business TRN number</p>
            <p style={s.fieldValue}>{trn}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={s.page}>

      <h1 style={s.pageHeading}>Company Information</h1>

      {companyInfoSection}

      <div style={{ ...s.sectionHeadingRow, marginTop: 8 }}>
        <h2 style={s.sectionHeading}>Points of Contact</h2>
        {session?.user?.permissions?.includes(HEADER_CONSTANTS.PERMISSIONS.VIEW_SETTINGS) && (
          <Link href="/main-settings/account-defaults?tab=general" style={s.link}>
            Looking for user permissions?
          </Link>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={s.contactCard}>
          <h3 style={s.contactHeading}>Primary Account Contacts</h3>
          <p style={s.contactDesc}>
            The main person working with the account on a daily basis. This user will receive all important account notifications (including invoices, upgrades, renewals etc.)
          </p>
          <CompanyInfoSelectField
            label="Select a user"
            required
            requiredNote
            defaultValue={primaryDefault}
            placeholder="Select a contact"
          />
          <button type="button" style={s.addAnother}>
            <Plus size={14} />
            <span>Add another</span>
          </button>
        </div>

        <div style={s.contactCard}>
          <h3 style={s.contactHeading}>Billing Contacts</h3>
          <p style={s.contactDesc}>
            Send copies of invoices, receipts, orders and other renewal notifications to these HubSpot users.
          </p>
          <CompanyInfoSelectField
            label="Select a user"
            required
            requiredNote
            defaultValue={billingDefault}
            placeholder="Select a contact"
          />
          <button type="button" style={s.addAnother}>
            <Plus size={14} />
            <span>Add another</span>
          </button>
        </div>
      </div>

      <div style={s.otherContactsCard}>
        <h3 style={s.otherContactsHeading}>Other Contacts</h3>

        <div style={s.otherRow}>
          <div>
            <p style={s.otherContactName}>Accounts Payable</p>
            <p style={s.otherContactDesc}>Send copies of invoices and credit memos to these users or email addresses.</p>
          </div>
          <CompanyInfoSelectField label="Select a user or enter an email address" placeholder="Select a contact" defaultValue={billingDefaultForOthers} />
        </div>

        <div style={s.otherRow}>
          <div>
            <p style={s.otherContactName}>Decision Maker</p>
            <p style={s.otherContactDesc}>Approves HubSpot purchases, upgrades, and renewals. Receives all important account notifications.</p>
          </div>
          <CompanyInfoSelectField label="Select a user" required requiredNote placeholder="Select a contact" defaultValue={billingDefaultForOthers} />
        </div>

        <div style={s.otherRow}>
          <div>
            <p style={s.otherContactName}>Onboarding Contact</p>
            <p style={s.otherContactDesc}>Sets up this account through our onboarding process with HubSpot.</p>
          </div>
          <CompanyInfoSelectField label="Select a user" required requiredNote placeholder="Select a contact" defaultValue={billingDefaultForOthers} />
        </div>

        <div style={s.otherRow}>
          <div>
            <p style={s.otherContactName}>Security Contact</p>
            <p style={s.otherContactDesc}>Receives security alerts and notifications.</p>
          </div>
          <CompanyInfoSelectField label="Select a user or enter an email address" required requiredNote placeholder="Select a contact" defaultValue={billingDefaultForOthers} />
        </div>

        <div style={s.otherRowLast}>
          <div>
            <p style={s.otherContactName}>Technical Admin</p>
            <p style={s.otherContactDesc}>Manages all technical settings in this account, such as domain and integration changes.</p>
          </div>
          <CompanyInfoSelectField label="Select a user" required requiredNote placeholder="Select a contact" defaultValue={billingDefaultForOthers} />
        </div>
      </div>

    </div>
  );
}
