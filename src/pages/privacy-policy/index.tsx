import { Lexend_Deca } from "next/font/google";

const lexendDeca = Lexend_Deca({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "Privacy Policy | Prime Alley",
  description: "Prime Alley Privacy Policy – how we collect, use, share, and protect your personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <main
      className={lexendDeca.className}
      style={{
        backgroundColor: "#f5f0eb",
        minHeight: "100vh",
        color: "#141414",
        padding: "60px 20px",
      }}
    >
      <div style={{ maxWidth: "1080px", margin: "0 auto" }}>

        {/* Last Modified Badge */}
        <div
          style={{
            display: "inline-block",
            border: "1px solid #141414",
            borderRadius: "4px",
            padding: "4px 12px",
            fontSize: "0.875rem",
            marginBottom: "20px",
          }}
        >
          Last Modified: February 21, 2026
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: 700,
            marginBottom: "32px",
            lineHeight: 1.2,
          }}
        >
          Prime Alley Privacy Policy
        </h1>

        {/* Intro */}
        <p style={p}>
          PRIME ALLEY ("we", "us", "our") is committed to protecting your privacy. This Privacy
          Policy explains how we collect, use, share, and protect personal data when you visit our
          websites, contact us, or use our products and services (the "Services").
        </p>

        <hr style={hr} />

        {/* Section 1 */}
        <h2 style={h2}>1) Roles We Play When Processing Data</h2>
        <p style={p}>Depending on how our Services are used, PRIME ALLEY may act as:</p>
        <div style={indentBlock}>
          <p style={p}>
            <strong>Controller:</strong> when you visit our websites, request information, sign up
            for an account, purchase Services, or interact with us directly. We decide why and how
            your personal data is processed for these purposes.
          </p>
          <p style={p}>
            <strong>Processor / Service Provider:</strong> when our customers use our Services to
            collect and process personal data as part of their business activities (for example,
            managing contacts, tickets, conversations, or campaigns). In this case, our customer
            controls the data, and we process it on their instructions, under our customer terms and
            applicable data processing terms.
          </p>
        </div>
        <p style={p}>
          In this Privacy Policy, "Personal Data" means information relating to an identified or
          identifiable individual.
        </p>

        <hr style={hr} />

        {/* Section 2 */}
        <h2 style={h2}>2) What Information We Collect</h2>
        <p style={p}>We collect Personal Data in the following ways:</p>

        <h3 style={h3}>2.1 Information you provide</h3>
        <ul style={ul}>
          <li style={li}>
            <strong>Account details:</strong> name, email address, username, job title, company
            name, and similar business contact information.
          </li>
          <li style={li}>
            <strong>Support and communications:</strong> information you share when you contact
            support, submit forms, request demos, or communicate with us.
          </li>
          <li style={li}>
            <strong>Billing information:</strong> billing contact details, billing address, and
            transaction-related information needed to process payments. Payment card details are
            typically processed by secure third-party payment processors.
          </li>
        </ul>

        <h3 style={h3}>2.2 Information collected automatically</h3>
        <p style={p}>When you use our websites or Services, we may collect:</p>
        <ul style={ul}>
          <li style={li}>
            <strong>Usage data:</strong> feature usage, actions taken in the Service (e.g.,
            creating/updating records), timestamps, and performance metrics.
          </li>
          <li style={li}>
            <strong>Device and technical data:</strong> IP address, browser type, device
            identifiers, operating system, referral URLs, and log data.
          </li>
          <li style={li}>
            <strong>Cookies and similar technologies:</strong> described in Section 7.
          </li>
        </ul>

        <h3 style={h3}>2.3 Customer Data processed on behalf of customers (Processor role)</h3>
        <p style={p}>
          Our customers may upload or collect Personal Data in the Services ("Customer Data"), such
          as names, email addresses, phone numbers, message content, call metadata, ticket details,
          and other business records. Customers are responsible for ensuring they have appropriate
          legal basis for collecting and using Customer Data.
        </p>
        <p style={p}>
          If your data is Customer Data and you want to exercise your rights, you should contact the
          relevant customer directly.
        </p>

        <h3 style={h3}>2.4 Information from other sources</h3>
        <p style={p}>
          Where permitted, we may receive business contact information from public sources or
          third-party providers to help maintain accurate records and improve communications.
        </p>

        <hr style={hr} />

        {/* Section 3 */}
        <h2 style={h2}>3) How We Use Personal Data</h2>
        <p style={p}>We use Personal Data to:</p>
        <ul style={ul}>
          <li style={li}>
            <strong>Provide and operate the Services</strong> (account creation, authentication,
            delivering features, administration).
          </li>
          <li style={li}>
            <strong>Support and troubleshoot</strong> (respond to requests, fix bugs, investigate
            outages, improve reliability).
          </li>
          <li style={li}>
            <strong>Improve and develop the Services</strong> (analytics, feature improvement,
            product security, and service performance).
          </li>
          <li style={li}>
            <strong>Communicate with you</strong> (service notices, billing communications,
            important updates).
          </li>
          <li style={li}>
            <strong>Marketing (where allowed)</strong> (sending product updates, newsletters,
            event/webinar info, and relevant offers). You can opt out anytime; we may still send
            administrative/service messages.
          </li>
          <li style={li}>
            <strong>Security and fraud prevention</strong> (protect accounts, prevent abuse, and
            enforce our terms).
          </li>
          <li style={li}>
            <strong>Legal compliance</strong> (respond to lawful requests and meet legal obligations).
          </li>
        </ul>
        <p style={p}>
          <strong>AI / machine learning:</strong> We may use certain data to power AI features
          within the Services. Where required, we will use appropriate safeguards, and we do not use
          Customer Data to train general-purpose AI models unless explicitly agreed in writing.
        </p>

        <hr style={hr} />

        {/* Section 4 */}
        <h2 style={h2}>4) How We Share Personal Data</h2>
        <p style={p}>We may share Personal Data with:</p>
        <ul style={ul}>
          <li style={li}>
            <strong>Service providers (sub processors):</strong> hosting, analytics, support
            tooling, communications, and payment processing—only as needed to provide the Services
            and under contractual obligations to protect data.
          </li>
          <li style={li}>
            <strong>Business transfers:</strong> if we are involved in a merger, acquisition,
            financing, reorganization, or sale of assets, data may be transferred as part of that
            transaction (with appropriate safeguards).
          </li>
          <li style={li}>
            <strong>Legal and safety reasons:</strong> when required by law or necessary to protect
            rights, safety, and prevent fraud or abuse.
          </li>
          <li style={li}>
            <strong>With your instructions:</strong> when you choose to connect third-party
            integrations or otherwise direct us to share information.
          </li>
        </ul>
        <p style={p}>We do not sell Personal Data in the ordinary sense of "selling" for money.</p>

        <hr style={hr} />

        {/* Section 5 */}
        <h2 style={h2}>5) International Transfers</h2>
        <p style={p}>
          We may process and store data in countries other than where you live. Where required by
          law, we use appropriate safeguards for international transfers (for example, Standard
          Contractual Clauses and similar measures).
        </p>

        <hr style={hr} />

        {/* Section 6 */}
        <h2 style={h2}>6) Data Storage, Security, and Retention</h2>
        <p style={p}>
          We use technical and organizational safeguards designed to protect Personal Data (access
          controls, encryption where appropriate, monitoring, and secure development practices).
        </p>
        <p style={p}>
          We retain Personal Data only as long as necessary for legitimate business purposes,
          contractual needs, and legal obligations. When no longer needed, we delete or anonymize it
          or securely store it until deletion is possible.
        </p>

        <hr style={hr} />

        {/* Section 7 */}
        <h2 style={h2}>7) Cookies and Similar Technologies</h2>
        <p style={p}>
          We use cookies and similar technologies (such as pixels and local storage) to:
        </p>
        <ul style={ul}>
          <li style={li}>operate the website and Services,</li>
          <li style={li}>remember preferences,</li>
          <li style={li}>understand usage and improve performance,</li>
          <li style={li}>measure marketing effectiveness.</li>
        </ul>
        <p style={p}>
          You can control cookies through your browser settings and (where available) our cookie
          preferences controls.
        </p>

        <hr style={hr} />

        {/* Section 8 */}
        <h2 style={h2}>8) Your Privacy Rights and Choices</h2>
        <p style={p}>Depending on your location, you may have rights to:</p>
        <ul style={ul}>
          <li style={li}>access, correct, or delete your Personal Data,</li>
          <li style={li}>object to or restrict processing,</li>
          <li style={li}>request data portability,</li>
          <li style={li}>withdraw consent where processing is based on consent,</li>
          <li style={li}>lodge a complaint with a data protection authority.</li>
        </ul>
        <p style={p}>
          <strong>How to exercise your rights:</strong> contact us using the details in Section 10.
          We may verify your identity before responding.
        </p>
        <p style={p}>
          If your data is processed for a customer: please contact that customer directly, as they
          control Customer Data.
        </p>

        <hr style={hr} />

        {/* Section 9 */}
        <h2 style={h2}>9) Children</h2>
        <p style={p}>
          Our websites and Services are not intended for children under 16, and we do not knowingly
          collect Personal Data from children under 16. If you believe a child has provided Personal
          Data to us, contact us so we can take appropriate action.
        </p>

        <hr style={hr} />

        {/* Section 10 */}
        <h2 style={h2}>10) Contact Us</h2>
        <p style={p}>
          If you have questions about this Privacy Policy or want to exercise your privacy rights,
          contact:
        </p>
        <p style={p}>
          <strong>PRIME ALLEY TECHNOLOGY LLC – Privacy</strong>
          <br />
          Email:{" "}
          <a href="mailto:privacy@primealley.com" style={{ color: "#141414", textDecoration: "underline" }}>
            privacy@primealley.com
          </a>
        </p>

      </div>
    </main>
  );
}

// Shared inline style objects
const p: React.CSSProperties = {
  fontSize: "1.125rem",
  lineHeight: 1.75,
  marginBottom: "16px",
  color: "#141414",
};

const h2: React.CSSProperties = {
  fontSize: "1.25rem",
  fontWeight: 700,
  marginBottom: "12px",
  marginTop: "40px",
  color: "#141414",
};

const h3: React.CSSProperties = {
  fontSize: "1.05rem",
  fontWeight: 600,
  marginBottom: "10px",
  marginTop: "24px",
  color: "#141414",
};

const ul: React.CSSProperties = {
  paddingLeft: "32px",
  marginBottom: "16px",
};

const li: React.CSSProperties = {
  fontSize: "1.125rem",
  lineHeight: 1.75,
  marginBottom: "6px",
  color: "#141414",
};

const indentBlock: React.CSSProperties = {
  paddingLeft: "32px",
  borderLeft: "3px solid #c9bfb0",
  marginBottom: "20px",
};

const hr: React.CSSProperties = {
  border: "none",
  borderTop: "1px solid #d8cfc5",
  margin: "40px 0",
};
