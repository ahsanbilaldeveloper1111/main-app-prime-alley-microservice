import React from "react";

interface CrmIntelligenceTabProps {
  company: any;
  relatedCompany?: string | null;
  industryName?: string | null;
  industryDescription?: string | null;
  /** Extra enrichment UI used only on the Companies Intelligence tab. */
  showCompanyEnrichmentUI?: boolean;
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

const extractUrl = (value: any): string | null => {
  if (typeof value === "string") return value;
  return value?.url ?? null;
};

const collectDedupedSocialLinks = (struct: any, raw: any): string[] => {
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

  struct?.social_links?.forEach((s: any) => addUrl(extractUrl(s)));
  raw?.social_links?.forEach((s: any) => addUrl(extractUrl(s)));

  return socialLinksDeduped;
};

const deriveCompanyDescription = (raw: any): string | null => {
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
  if (!block) return null;

  const cleaned = block.replaceAll(/\s+/g, " ").trim();
  return cleaned.length > 240 ? `${cleaned.slice(0, 237)}...` : cleaned;
};

const collectOutreachEmails = (struct: any, raw: any, company: any) => {
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
};

const collectAllPhones = (struct: any, raw: any, company: any): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (n: string | null | undefined) => {
    const v = (n ?? "").trim();
    if (!v) return;
    const key = v.replaceAll(" ", "");
    if (seen.has(key)) return;
    seen.add(key);
    out.push(v);
  };

  add(company?.phone);
  struct?.phones?.forEach((p: any) => add(p?.number));
  raw?.phones?.forEach((p: any) => add(typeof p === "string" ? p : p?.number));

  return out;
};

const renderLegacyEmails = (structData: any, rawData: any, company: any): React.ReactNode => {
  const seen = new Set<string>();
  const list: { email: string; type?: string }[] = [];

  structData?.emails?.forEach((e: any) => {
    const v = (e?.email ?? "").trim();
    if (!v || seen.has(v.toLowerCase())) return;
    seen.add(v.toLowerCase());
    list.push({ email: v, type: e?.type ?? undefined });
  });

  rawData?.emails?.forEach((v: any) => {
    const s = (v ?? "").trim();
    if (!s || seen.has(s.toLowerCase())) return;
    seen.add(s.toLowerCase());
    list.push({ email: s });
  });

  const companyEmail = company?.email?.trim?.();
  if (companyEmail && !seen.has(companyEmail.toLowerCase())) {
    list.push({ email: companyEmail });
  }

  if (list.length === 0) return "--";

  return list.map(({ email, type }) => (
    <span key={email}>
      <a href={`mailto:${email}`} style={{ color: "#006162", textDecoration: "none" }}>
        {email}
      </a>
      {type ? (
        <span style={{ color: "#666", fontSize: "12px", marginLeft: "6px" }}>({type})</span>
      ) : null}
    </span>
  ));
};

const CrmIntelligenceTabContent: React.FC<CrmIntelligenceTabProps> = ({
  company,
  relatedCompany,
  industryName,
  industryDescription,
  showCompanyEnrichmentUI = false,
}) => { // NOSONAR
  const enr = company?.enrichment_data ?? null;
  const struct = enr?.structured_data ?? null;
  const raw = enr?.raw_data ?? null;
  const socialLinks = collectDedupedSocialLinks(struct, raw);

  const cityVal = struct?.headquarters?.city ?? company?.city ?? "—";
  const countryVal = struct?.headquarters?.country ?? company?.country ?? "—";
  const regionVal = struct?.headquarters?.state ?? "—";
  // Legacy company-detailpage.tsx mapping:
  // - State   = headquarters.address
  // - Region  = headquarters.country
  const stateValCompany =
    struct?.headquarters?.address ?? (company?.country ?? "—");
  const regionValCompany =
    struct?.headquarters?.country ?? (company?.country ?? "—");
  const locationAddressParts = [
    struct?.headquarters?.address ?? (company as { address?: string })?.address,
    struct?.headquarters?.city ?? company?.city,
    struct?.headquarters?.country ?? company?.country,
  ].filter(Boolean) as string[];
  const locationAddressVal =
    locationAddressParts.length > 0 ? locationAddressParts.join(", ") : "—";
  const lifecycleStageVal =
    (enr?.status_display ?? enr?.status ?? null) || "--";
  const relatedCompanyVal = showCompanyEnrichmentUI
    ? (enr?.company_name ?? company?.name ?? relatedCompany ?? "—")
    : company?.name ?? relatedCompany ?? "—";
  const industryNameVal = industryName ?? company?.industry ?? "—";
  const industryDescriptionVal = showCompanyEnrichmentUI
    ? struct?.official_company_name ?? company?.name ?? "—"
    : industryDescription ?? deriveCompanyDescription(raw) ?? "—";
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

  const outreachEmails = collectOutreachEmails(struct, raw, company);
  const allPhones = collectAllPhones(struct, raw, company);

  // Legacy Company Intelligence UI (the UI you shared from company-detailpage.tsx)
  if (showCompanyEnrichmentUI) {
    const enrData: any = enr;
    const structData: any = struct;
    const rawData: any = raw;

    const lifecycleStage = enrData?.status_display ?? enrData?.status ?? "--";
    const relatedCompanyLegacy = enrData?.company_name ?? company?.name ?? "--";
    const industryValLegacy = company?.industry ?? "--";
    const companyDescLegacy = structData?.official_company_name ?? company?.name ?? "--";

    const stateValLegacy =
      structData?.headquarters?.address ?? (company?.country ?? "--");
    const regionValLegacy =
      structData?.headquarters?.country ?? (company?.country ?? "--");

    const iconBtn = (
      href: string | null,
      iconSvg: React.ReactNode,
      label: string
    ) => (
      <a
        href={href || "#"}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          padding: "7px",
          backgroundColor: "#f0f0f0",
          border: "none",
          borderRadius: "4px",
          cursor: href ? "pointer" : "default",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textDecoration: "none",
        }}
        aria-label={label}
        onMouseEnter={
          href ? (e) => {
            e.currentTarget.style.backgroundColor = "#e0e0e0";
          } : undefined
        }
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#f0f0f0";
        }}
      >
        {iconSvg}
      </a>
    );

    const facebookUrlLegacy =
      socialLinks.find((u) => detectSocialPlatform(u) === "facebook") ?? null;
    const linkedinUrlLegacy =
      socialLinks.find((u) => detectSocialPlatform(u) === "linkedin") ?? null;
    const twitterUrlLegacy =
      socialLinks.find((u) => detectSocialPlatform(u) === "twitter") ?? null;

    return (
      <div>
        {/* Info Banner */}
        <div
          style={{
            padding: "16px 20px",
            backgroundColor: "#ffffff",
            border: "1px solid #eaf0f6",
            borderRadius: "5px",
            marginBottom: "20px",
          }}
        >
          <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>
            {enrData
              ? "Enrichment data for this company is shown below."
              : "We do not have enrichment data for this record, yet."}
          </p>
        </div>

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
          <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", flexWrap: "nowrap" }}>
            <div style={{ flex: "1 1 auto", minWidth: "100px" }}>
              <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>
                Lifecycle stage
              </div>
              <div style={{ fontSize: "14px", color: "#141414", fontWeight: "700" }}>{lifecycleStage}</div>
            </div>

            <div style={{ flex: "1 1 auto", minWidth: "100px" }}>
              <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>Related company</div>
              <div style={{ fontSize: "14px", color: "#141414", fontWeight: "400" }}>{relatedCompanyLegacy}</div>
            </div>

            <div style={{ flex: "1 1 auto", minWidth: "100px" }}>
              <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>Employment role</div>
              <div style={{ fontSize: "14px", color: "#141414", fontWeight: "400" }}>--</div>
            </div>

            <div style={{ flex: "1 1 auto", minWidth: "60px" }}>
              <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>City</div>
              <div style={{ fontSize: "14px", color: "#141414", fontWeight: "400" }}>{cityVal}</div>
            </div>

            <div style={{ flex: "1 1 auto", minWidth: "60px" }}>
              <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>State</div>
              <div style={{ fontSize: "14px", color: "#141414", fontWeight: "400" }}>{stateValLegacy}</div>
            </div>

            <div style={{ flex: "1 1 auto", minWidth: "60px" }}>
              <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>Region</div>
              <div style={{ fontSize: "14px", color: "#141414", fontWeight: "400" }}>{regionValLegacy}</div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "center",
                flexShrink: 0,
                marginLeft: "auto",
                paddingTop: "2px",
              }}
            >
              {facebookUrlLegacy &&
                iconBtn(
                  facebookUrlLegacy,
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#555">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>,
                  "Facebook"
                )}
              {linkedinUrlLegacy &&
                iconBtn(
                  linkedinUrlLegacy,
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#555">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>,
                  "LinkedIn"
                )}
              {twitterUrlLegacy &&
                iconBtn(
                  twitterUrlLegacy,
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#555">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>,
                  "X"
                )}
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #eaf0f6", borderRadius: "5px", padding: "20px" }}>
            <div style={{ paddingBottom: "16px", borderBottom: "1px solid #eaf0f6", marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>Industry</div>
              <div style={{ fontSize: "14px", color: "#141414", fontWeight: "400" }}>{industryValLegacy}</div>
            </div>
            <div style={{ paddingBottom: "16px", borderBottom: "1px solid #eaf0f6", marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>Company description</div>
              <div style={{ fontSize: "14px", color: "#141414", fontWeight: "400" }}>{companyDescLegacy}</div>
            </div>
            <div>
              <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>Company keywords</div>
              <div style={{ fontSize: "14px", color: "#141414", fontWeight: "400" }}>--</div>
            </div>
          </div>

          <div style={{ backgroundColor: "#ffffff", border: "1px solid #eaf0f6", borderRadius: "5px", padding: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#141414", margin: "0 0 16px 0" }}>
              Contact Outreach
            </h3>

            {/* Emails */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>Emails</div>
              <div style={{ fontSize: "14px", color: "#141414", fontWeight: "400", display: "flex", flexDirection: "column", gap: "6px" }}>
                {renderLegacyEmails(structData, rawData, company)}
              </div>
            </div>

            {/* Phones */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>Phones</div>
              <div style={{ fontSize: "14px", color: "#141414", fontWeight: "400", display: "flex", flexDirection: "column", gap: "6px" }}>
                {allPhones.length === 0 ? (
                  "--"
                ) : (
                  allPhones.map((num) => {
                    const normalized = num.replaceAll(" ", "");
                    return (
                      <a
                        key={normalized}
                        href={`tel:${normalized}`}
                        style={{ color: "#006162", textDecoration: "none" }}
                      >
                        {num}
                      </a>
                    );
                  })
                )}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>Job sub role</div>
                <div style={{ fontSize: "14px", color: "#141414", fontWeight: "400" }}>--</div>
              </div>
              <div>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>Job seniority</div>
                <div style={{ fontSize: "14px", color: "#141414", fontWeight: "400" }}>--</div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>LinkedIn</div>
              <div style={{ fontSize: "14px", color: "#141414", fontWeight: "400" }}>
                {firstLinkedIn === "--" ? (
                  "--"
                ) : (
                  <a
                    href={firstLinkedIn}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#006162", textDecoration: "none" }}
                  >
                    {firstLinkedIn}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Structured data */}
        {structData && (
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #eaf0f6",
              borderRadius: "5px",
              padding: "20px",
              marginTop: "20px",
            }}
          >
            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#141414", margin: "0 0 16px 0" }}>
              Structured data
            </h3>

            {structData?.official_company_name && (
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>Official company name</div>
                <div style={{ fontSize: "14px", color: "#141414" }}>{structData.official_company_name}</div>
              </div>
            )}

            {structData?.headquarters &&
              (structData.headquarters.address || structData.headquarters.city || structData.headquarters.country) && (
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>Headquarters</div>
                  <div style={{ fontSize: "14px", color: "#141414" }}>
                    {[structData.headquarters.address, structData.headquarters.city, structData.headquarters.country]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                </div>
              )}

            {structData?.other_locations && structData.other_locations.length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>Other locations</div>
                <div style={{ fontSize: "14px", color: "#141414", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {structData.other_locations.map((loc: any, i: number) => (
                    <div
                      key={
                        [loc?.address, loc?.city, loc?.country]
                          .filter(Boolean)
                          .join(", ") || "other-location"
                      }
                    >
                      {[loc?.address, loc?.city, loc?.country]
                        .filter((x: any) => x && x !== ".")
                        .join(", ") || "—"}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {structData?.emails && structData.emails.length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>Emails (structured)</div>
                <div style={{ fontSize: "14px", color: "#141414", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {structData.emails.map((e: any, i: number) => (
                    <span key={e?.email ?? "structured-email"}>
                      {e?.email}
                      {e?.type ? (
                        <span style={{ color: "#666", fontSize: "12px", marginLeft: "6px" }}>({e.type})</span>
                      ) : null}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {structData?.phones && structData.phones.length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>Phones (structured)</div>
                <div style={{ fontSize: "14px", color: "#141414", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {structData.phones.map((p: any, i: number) => (
                    <span key={p?.number ?? "structured-phone"}>
                      {p?.number}
                      {p?.type ? (
                        <span style={{ color: "#666", fontSize: "12px", marginLeft: "6px" }}>({p.type})</span>
                      ) : null}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {structData.llm_confidence != null && (
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>LLM confidence</div>
                <div style={{ fontSize: "14px", color: "#141414" }}>{structData.llm_confidence}%</div>
              </div>
            )}
          </div>
        )}

        {/* Social links at bottom (deduped) */}
        {socialLinks.length > 0 && (
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #eaf0f6",
              borderRadius: "5px",
              padding: "20px",
              marginTop: "20px",
            }}
          >
            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#141414", margin: "0 0 16px 0" }}>
              Social links
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {socialLinks.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: "14px", color: "#006162", textDecoration: "none" }}
                >
                  {url}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {showCompanyEnrichmentUI && (
        <div
          style={{
            padding: "16px 20px",
            backgroundColor: "#ffffff",
            border: "1px solid #eaf0f6",
            borderRadius: "5px",
            marginBottom: "20px",
          }}
        >
          <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>
            {enr
              ? "Enrichment data for this company is shown below."
              : "We do not have enrichment data for this record, yet."}
          </p>
        </div>
      )}

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
            {showCompanyEnrichmentUI && (
              <div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#7c98b6",
                    marginBottom: "6px",
                  }}
                >
                  Lifecycle stage
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#141414",
                    fontWeight: "700",
                  }}
                >
                  {lifecycleStageVal}
                </div>
              </div>
            )}
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
          {showCompanyEnrichmentUI ? (
            <>
              <div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#7c98b6",
                    marginBottom: "6px",
                  }}
                >
                  State
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#141414",
                    fontWeight: "400",
                  }}
                >
                  {stateValCompany}
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
                  {regionValCompany}
                </div>
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
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

const CrmIntelligenceTab: React.FC<CrmIntelligenceTabProps> = (props) => {
  return <CrmIntelligenceTabContent {...props} />;
};

export default CrmIntelligenceTab;

