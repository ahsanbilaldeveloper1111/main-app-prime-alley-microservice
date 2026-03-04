import React from "react";

interface CrmIntelligenceTabProps {
  company: any | null;
  relatedCompany?: string | null;
  industryName?: string | null;
  industryDescription?: string | null;
}

const detectSocialPlatform = (
  url: string,
): "facebook" | "linkedin" | "twitter" | "instagram" | null => {
  const u = url.toLowerCase();
  if (u.includes("facebook.com")) return "facebook";
  if (u.includes("linkedin.com")) return "linkedin";
  if (u.includes("twitter.com") || u.includes("x.com")) return "twitter";
  if (u.includes("instagram.com")) return "instagram";
  return null;
};

const CrmIntelligenceTab: React.FC<CrmIntelligenceTabProps> = ({
  company,
  relatedCompany,
  industryName,
  industryDescription,
}) => {
  const enr = company?.enrichment_data ?? null;
  const struct = enr?.structured_data ?? null;
  const raw = enr?.raw_data ?? null;

  const socialLinksDeduped: string[] = [];
  const seenUrl = new Set<string>();
  const addUrl = (url: string | null | undefined) => {
    const u = (url ?? "").trim();
    if (!u) return;
    const key = u.toLowerCase();
    if (seenUrl.has(key)) return;
    seenUrl.add(key);
    socialLinksDeduped.push(u);
  };

  // social_links may be strings or objects with url; handle both
  struct?.social_links?.forEach((s: any) => {
    if (typeof s === "string") {
      addUrl(s);
    } else {
      addUrl(s?.url);
    }
  });
  raw?.social_links?.forEach((s: any) => {
    if (typeof s === "string") {
      addUrl(s);
    } else {
      addUrl(s?.url);
    }
  });
  const socialLinks = socialLinksDeduped;

  const cityVal = struct?.headquarters?.city ?? company?.city ?? "—";
  const countryVal = struct?.headquarters?.country ?? company?.country ?? "—";
  const regionVal = struct?.headquarters?.state ?? "—";
  const locationAddressParts = [
    struct?.headquarters?.address ?? (company as { address?: string })?.address,
    struct?.headquarters?.city ?? company?.city,
    struct?.headquarters?.country ?? company?.country,
  ].filter(Boolean) as string[];
  const locationAddressVal =
    locationAddressParts.length > 0 ? locationAddressParts.join(", ") : "—";
  const relatedCompanyVal = company?.name ?? relatedCompany ?? "—";
  const industryNameVal = industryName ?? company?.industry ?? "—";
  const deriveCompanyDescription = () => {
    const combined = (raw?.combined_text ?? "").trim();
    if (combined) {
      const lines = combined
        .split(/\r?\n/g)
        .map((l: string) => l.trim())
        .filter(Boolean);
      const firstMeaningful =
        lines?.find((l: string) => !l.startsWith("===") && l.length > 3) ?? "";
      if (firstMeaningful) {
        return firstMeaningful.length > 240
          ? `${firstMeaningful.slice(0, 237)}...`
          : firstMeaningful;
      }
    }

    const block = (raw?.address_blocks?.[0] ?? "").trim();
    if (block) {
      const cleaned = block.replaceAll(/\s+/g, " ").trim();
      return cleaned.length > 240 ? `${cleaned.slice(0, 237)}...` : cleaned;
    }

    return null;
  };
  const industryDescriptionVal =
    industryDescription ?? deriveCompanyDescription() ?? "—";
  const firstLinkedIn =
    socialLinks.find((u) => detectSocialPlatform(u) === "linkedin") ?? "—";
  const facebookUrl =
    socialLinks.find((u) => detectSocialPlatform(u) === "facebook") ?? null;
  const linkedinUrl =
    socialLinks.find((u) => detectSocialPlatform(u) === "linkedin") ?? null;
  const twitterUrl =
    socialLinks.find((u) => detectSocialPlatform(u) === "twitter") ?? null;
  const instagramUrl =
    socialLinks.find((u) => detectSocialPlatform(u) === "instagram") ?? null;

  const outreachEmails = (() => {
    const list: { email: string; type?: string | null }[] = [];
    const seen = new Set<string>();
    const addEmail = (v0: string | null | undefined, type?: string | null) => {
      const v = (v0 ?? "").trim();
      if (!v) return;
      const key = v.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      list.push({ email: v, type: type ?? null });
    };
    struct?.emails?.forEach((e: any) => {
      addEmail(e?.email, e?.type ?? null);
    });
    raw?.emails?.forEach((e: any) => {
      if (typeof e === "string") addEmail(e, null);
      else addEmail(e?.email, e?.type ?? null);
    });
    addEmail(company?.email, null);
    return list;
  })();

  return (
    <div>
      {/* Contact Information Card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #eaf0f6",
          borderRadius: "5px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "20px",
            marginBottom: "16px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "13px",
                color: "#7c98b6",
                marginBottom: "6px",
              }}
            >
              Related company
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "#141414",
                fontWeight: "400",
              }}
            >
              {relatedCompanyVal}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "13px",
                color: "#7c98b6",
                marginBottom: "6px",
              }}
            >
              Employment role
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "#141414",
                fontWeight: "400",
              }}
            >
              --
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "13px",
                color: "#7c98b6",
                marginBottom: "6px",
              }}
            >
              City
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "#141414",
                fontWeight: "400",
              }}
            >
              {cityVal}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "13px",
                color: "#7c98b6",
                marginBottom: "6px",
              }}
            >
              Country
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "#141414",
                fontWeight: "400",
              }}
            >
              {countryVal}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "13px",
                color: "#7c98b6",
                marginBottom: "6px",
              }}
            >
              Region
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "#141414",
                fontWeight: "400",
              }}
            >
              {regionVal}
            </div>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <div
              style={{
                fontSize: "13px",
                color: "#7c98b6",
                marginBottom: "6px",
              }}
            >
              Location address
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "#141414",
                fontWeight: "400",
              }}
            >
              {locationAddressVal}
            </div>
          </div>
        </div>

        {/* Social Icons */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            paddingTop: "16px",
            borderTop: "1px solid #eaf0f6",
          }}
        >
          <a
            href={facebookUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "8px",
              backgroundColor: "#f7fafc",
              border: "1px solid #eaf0f6",
              borderRadius: "4px",
              cursor: facebookUrl ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              if (facebookUrl)
                e.currentTarget.style.backgroundColor = "#eaf0f6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#f7fafc";
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill={facebookUrl ? "#1877F2" : "#cbd5e0"}
            >
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </a>
          <a
            href={linkedinUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "8px",
              backgroundColor: "#f7fafc",
              border: "1px solid #eaf0f6",
              borderRadius: "4px",
              cursor: linkedinUrl ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              if (linkedinUrl)
                e.currentTarget.style.backgroundColor = "#eaf0f6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#f7fafc";
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill={linkedinUrl ? "#0A66C2" : "#cbd5e0"}
            >
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
          <a
            href={twitterUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "8px",
              backgroundColor: "#f7fafc",
              border: "1px solid #eaf0f6",
              borderRadius: "4px",
              cursor: twitterUrl ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              if (twitterUrl)
                e.currentTarget.style.backgroundColor = "#eaf0f6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#f7fafc";
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill={twitterUrl ? "#1DA1F2" : "#cbd5e0"}
            >
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
            </svg>
          </a>
          <a
            href={instagramUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "8px",
              backgroundColor: "#f7fafc",
              border: "1px solid #eaf0f6",
              borderRadius: "4px",
              cursor: instagramUrl ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              if (instagramUrl)
                e.currentTarget.style.backgroundColor = "#eaf0f6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#f7fafc";
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill={instagramUrl ? "#E1306C" : "#cbd5e0"}
            >
              <path d="M7 2C4.2 2 2 4.2 2 7v10c0 2.8 2.2 5 5 5h10c2.8 0 5-2.2 5-5V7c0-2.8-2.2-5-5-5H7zm0 2h10c1.7 0 3 1.3 3 3v10c0 1.7-1.3 3-3 3H7c-1.7 0-3-1.3-3-3V7c0-1.7 1.3-3 3-3zm5 3.5A4.5 4.5 0 007.5 12 4.5 4.5 0 0012 16.5 4.5 4.5 0 0016.5 12 4.5 4.5 0 0012 7.5zm0 2A2.5 2.5 0 0114.5 12 2.5 2.5 0 0112 14.5 2.5 2.5 0 019.5 12 2.5 2.5 0 0112 9.5zm4.25-3.5a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5z" />
            </svg>
          </a>
        </div>
      </div>

      {/* Two Column Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
        }}
      >
        {/* Left Column - Company Info */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #eaf0f6",
            borderRadius: "5px",
            padding: "20px",
          }}
        >
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                fontSize: "13px",
                color: "#7c98b6",
                marginBottom: "6px",
              }}
            >
              Industry
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "#141414",
                fontWeight: "400",
              }}
            >
              {industryNameVal}
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                fontSize: "13px",
                color: "#7c98b6",
                marginBottom: "6px",
              }}
            >
              Company description
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "#141414",
                fontWeight: "400",
              }}
            >
              {industryDescriptionVal}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: "13px",
                color: "#7c98b6",
                marginBottom: "6px",
              }}
            >
              Company keywords
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "#141414",
                fontWeight: "400",
              }}
            >
              --
            </div>
          </div>
        </div>

        {/* Right Column - Contact Outreach */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #eaf0f6",
            borderRadius: "5px",
            padding: "20px",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "#141414",
              margin: "0 0 16px 0",
            }}
          >
            Contact Outreach
          </h3>

          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                fontSize: "13px",
                color: "#7c98b6",
                marginBottom: "6px",
              }}
            >
              Email
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "#141414",
                fontWeight: "400",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              {outreachEmails.length === 0
                ? "—"
                : outreachEmails.map(({ email, type }, idx) => (
                    <span key={email}>
                      <a
                        href={`mailto:${email}`}
                        style={{ color: "#006162", textDecoration: "none" }}
                      >
                        {email}
                      </a>
                      {type ? (
                        <span
                          style={{
                            color: "#334155",
                            fontSize: "12px",
                            marginLeft: "6px",
                            padding: "1px 6px",
                            borderRadius: "10px",
                            backgroundColor: "#f1f5f9",
                          }}
                        >
                          {type}
                        </span>
                      ) : null}
                    </span>
                  ))}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              marginBottom: "20px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#7c98b6",
                  marginBottom: "6px",
                }}
              >
                Job sub role
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#141414",
                  fontWeight: "400",
                }}
              >
                --
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#7c98b6",
                  marginBottom: "6px",
                }}
              >
                Job seniority
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#141414",
                  fontWeight: "400",
                }}
              >
                --
              </div>
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: "13px",
                color: "#7c98b6",
                marginBottom: "6px",
              }}
            >
              LinkedIn
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "#141414",
                fontWeight: "400",
              }}
            >
              {firstLinkedIn}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrmIntelligenceTab;

