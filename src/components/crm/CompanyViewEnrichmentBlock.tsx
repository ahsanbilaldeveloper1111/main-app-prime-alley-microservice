import React, { type CSSProperties } from "react";
import type { EnrichmentData } from "@utils/crm";

const ENRICHMENT_BLOCK_WRAPPER_STYLE: CSSProperties = {
  marginBottom: "24px",
};

const ENRICHMENT_BLOCK_TITLE_STYLE: CSSProperties = {
  fontSize: "15px",
  fontWeight: 700,
  color: "#1f2937",
  marginBottom: "16px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const ENRICHMENT_BLOCK_TITLE_DOT_STYLE: CSSProperties = {
  width: "4px",
  height: "18px",
  background: "linear-gradient(135deg, #2563eb 0%, #764ba2 100%)",
  borderRadius: "2px",
};

const ENRICHMENT_BLOCK_BODY_STYLE: CSSProperties = {
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "20px",
};

const ENRICHMENT_SECTION_HEADER_STYLE: CSSProperties = {
  fontSize: "12px",
  fontWeight: 700,
  color: "#6b7280",
  marginBottom: "12px",
};

const ENRICHMENT_GRID_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "160px 1fr",
  gap: "12px 24px",
  alignItems: "baseline",
};

const ENRICHMENT_LABEL_STYLE: CSSProperties = {
  fontSize: "12px",
  fontWeight: 700,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const ENRICHMENT_VALUE_STYLE: CSSProperties = {
  fontSize: "14px",
  color: "#1f2937",
  fontWeight: 500,
  wordBreak: "break-word",
};

const ENRICHMENT_LINK_STYLE: CSSProperties = {
  ...ENRICHMENT_VALUE_STYLE,
  color: "#2563eb",
  textDecoration: "underline",
};

const STRUCT_TOP_SPACER_STYLE: CSSProperties = {
  paddingTop: "20px",
  borderTop: "1px solid #e5e7eb",
};

const VALIDATION_TOP_SPACER_STYLE: CSSProperties = {
  marginTop: "20px",
  paddingTop: "20px",
  borderTop: "1px solid #e5e7eb",
};

const TOP_LEVEL_SKIP_KEYS = new Set<string>([
  "raw_data",
  "structured_data",
  "validation_data",
]);

type StructuredData = NonNullable<EnrichmentData["structured_data"]>;
type ValidationData = NonNullable<EnrichmentData["validation_data"]>;
type Headquarters = NonNullable<StructuredData["headquarters"]>;
type OtherLocation = NonNullable<StructuredData["other_locations"]>[number];
type EmailEntry = NonNullable<StructuredData["emails"]>[number];
type PhoneEntry = NonNullable<StructuredData["phones"]>[number];
type SocialEntry = NonNullable<StructuredData["social_links"]>[number];

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function hasValue(v: unknown): boolean {
  return v !== null && v !== undefined && v !== "";
}

function labelFromKey(key: string): string {
  return key.replaceAll("_", " ").replaceAll(/\b\w/g, (c) => c.toUpperCase());
}

/** Convert an enrichment value to a display string without falling back to `[object Object]`. */
function formatEnrichmentValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) {
    return value
      .filter(hasValue)
      .map((v) => formatEnrichmentValue(v))
      .join(", ");
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "bigint") {
    return value.toString();
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  return "";
}

function joinHeadquartersLine(hq: Headquarters | null | undefined): string {
  if (!hq) return "";
  return [hq.address, hq.city, hq.country].filter(Boolean).join(", ");
}

function joinOtherLocationLine(loc: OtherLocation): string {
  return [loc?.address, loc?.city, loc?.country].filter(Boolean).join(", ");
}

interface EnrichmentRowProps {
  readonly label: string;
  readonly children: React.ReactNode;
}

function EnrichmentRow({ label, children }: EnrichmentRowProps) {
  return (
    <>
      <div style={ENRICHMENT_LABEL_STYLE}>{label}</div>
      <div style={ENRICHMENT_VALUE_STYLE}>{children}</div>
    </>
  );
}

interface EnrichmentLinkRowProps {
  readonly label: string;
  readonly href: string;
  readonly display: string;
}

function EnrichmentLinkRow({ label, href, display }: EnrichmentLinkRowProps) {
  return (
    <>
      <div style={ENRICHMENT_LABEL_STYLE}>{label}</div>
      <div style={ENRICHMENT_VALUE_STYLE}>
        <a
          href={href}
          style={ENRICHMENT_LINK_STYLE}
          target="_blank"
          rel="noopener noreferrer"
        >
          {display}
        </a>
      </div>
    </>
  );
}

interface TopLevelEntry {
  key: string;
  value: unknown;
}

function collectTopLevelEntries(data: EnrichmentData): TopLevelEntry[] {
  const entries: TopLevelEntry[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (TOP_LEVEL_SKIP_KEYS.has(key)) continue;
    if (!hasValue(value)) continue;
    entries.push({ key, value });
  }
  return entries;
}

function TopLevelGrid({ entries }: { readonly entries: TopLevelEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <div style={ENRICHMENT_GRID_STYLE}>
      {entries.map(({ key, value }) => (
        <EnrichmentRow key={key} label={labelFromKey(key)}>
          {formatEnrichmentValue(value)}
        </EnrichmentRow>
      ))}
    </div>
  );
}

function buildEmailKey(entry: EmailEntry, fallbackIndex: number): string {
  const id = entry.email || entry.type || `idx-${fallbackIndex}`;
  return `email-${id}`;
}

function buildPhoneKey(entry: PhoneEntry, fallbackIndex: number): string {
  const id = entry.number || entry.type || `idx-${fallbackIndex}`;
  return `phone-${id}`;
}

function buildSocialKey(entry: SocialEntry, fallbackIndex: number): string {
  const id = entry.url || entry.platform || `idx-${fallbackIndex}`;
  return `social-${id}`;
}

function buildLocationKey(line: string, fallbackIndex: number): string {
  const id = line || `idx-${fallbackIndex}`;
  return `loc-${id}`;
}

function StructuredEmailRows({
  emails,
}: {
  readonly emails: EmailEntry[];
}) {
  const labelPrefix = emails.length > 1;
  return (
    <>
      {emails.map((entry, idx) => {
        if (!hasValue(entry?.email)) return null;
        const label = labelPrefix ? `Email ${idx + 1}` : "Email";
        return (
          <EnrichmentLinkRow
            key={buildEmailKey(entry, idx)}
            label={label}
            href={`mailto:${entry.email}`}
            display={String(entry.email)}
          />
        );
      })}
    </>
  );
}

function StructuredPhoneRows({
  phones,
}: {
  readonly phones: PhoneEntry[];
}) {
  const labelPrefix = phones.length > 1;
  return (
    <>
      {phones.map((entry, idx) => {
        if (!hasValue(entry?.number)) return null;
        const label = labelPrefix ? `Phone ${idx + 1}` : "Phone";
        return (
          <EnrichmentLinkRow
            key={buildPhoneKey(entry, idx)}
            label={label}
            href={`tel:${entry.number}`}
            display={String(entry.number)}
          />
        );
      })}
    </>
  );
}

function StructuredSocialRows({
  socials,
}: {
  readonly socials: SocialEntry[];
}) {
  return (
    <>
      {socials.map((entry, idx) => {
        if (!hasValue(entry?.url)) return null;
        const label = entry?.platform ? String(entry.platform) : `Social ${idx + 1}`;
        return (
          <EnrichmentLinkRow
            key={buildSocialKey(entry, idx)}
            label={label}
            href={String(entry.url)}
            display={String(entry.url)}
          />
        );
      })}
    </>
  );
}

function StructuredOtherLocationRows({
  locations,
}: {
  readonly locations: OtherLocation[];
}) {
  return (
    <>
      {locations.map((loc, idx) => {
        const line = joinOtherLocationLine(loc);
        if (!line) return null;
        return (
          <EnrichmentRow
            key={buildLocationKey(line, idx)}
            label={`Other location ${idx + 1}`}
          >
            {line}
          </EnrichmentRow>
        );
      })}
    </>
  );
}

interface StructuredDataSectionProps {
  readonly struct: StructuredData;
  readonly topLevelHasEntries: boolean;
}

function StructuredDataSection({
  struct,
  topLevelHasEntries,
}: StructuredDataSectionProps) {
  const headquartersLine = joinHeadquartersLine(struct.headquarters);
  const otherLocations = struct.other_locations ?? [];
  const emails = struct.emails ?? [];
  const phones = struct.phones ?? [];
  const socials = struct.social_links ?? [];

  const containerStyle: CSSProperties | undefined = topLevelHasEntries
    ? STRUCT_TOP_SPACER_STYLE
    : undefined;

  return (
    <div style={containerStyle}>
      <div style={ENRICHMENT_SECTION_HEADER_STYLE}>
        Structured data (all fields)
      </div>
      <div style={ENRICHMENT_GRID_STYLE}>
        {hasValue(struct.official_company_name) && (
          <EnrichmentRow label="Official company name">
            {formatEnrichmentValue(struct.official_company_name)}
          </EnrichmentRow>
        )}
        {headquartersLine && (
          <EnrichmentRow label="Headquarters">{headquartersLine}</EnrichmentRow>
        )}
        <StructuredOtherLocationRows locations={otherLocations} />
        <StructuredEmailRows emails={emails} />
        <StructuredPhoneRows phones={phones} />
        <StructuredSocialRows socials={socials} />
        {struct.llm_confidence != null && (
          <EnrichmentRow label="LLM confidence">
            {formatEnrichmentValue(struct.llm_confidence)}
          </EnrichmentRow>
        )}
      </div>
    </div>
  );
}

function ValidationDataSection({
  validation,
}: {
  readonly validation: ValidationData;
}) {
  const entries = Object.entries(validation).filter(([, v]) => hasValue(v));
  if (entries.length === 0) return null;
  return (
    <div style={VALIDATION_TOP_SPACER_STYLE}>
      <div style={ENRICHMENT_SECTION_HEADER_STYLE}>Validation data</div>
      <div style={ENRICHMENT_GRID_STYLE}>
        {entries.map(([key, value]) => (
          <EnrichmentRow key={key} label={labelFromKey(key)}>
            {formatEnrichmentValue(value)}
          </EnrichmentRow>
        ))}
      </div>
    </div>
  );
}

interface CompanyViewEnrichmentBlockProps {
  readonly data: EnrichmentData;
}

/** Renders enrichment_data: top-level fields, then all structured_data fields (no raw_data). */
export function CompanyViewEnrichmentBlock({
  data,
}: CompanyViewEnrichmentBlockProps) {
  const topLevelEntries = collectTopLevelEntries(data);
  const struct = isPlainObject(data.structured_data) ? data.structured_data : null;
  const validation = isPlainObject(data.validation_data)
    ? data.validation_data
    : null;

  return (
    <div style={ENRICHMENT_BLOCK_WRAPPER_STYLE}>
      <h5 style={ENRICHMENT_BLOCK_TITLE_STYLE}>
        <div style={ENRICHMENT_BLOCK_TITLE_DOT_STYLE} />
        Enrichment data
      </h5>
      <div style={ENRICHMENT_BLOCK_BODY_STYLE}>
        <TopLevelGrid entries={topLevelEntries} />
        {struct && (
          <StructuredDataSection
            struct={struct}
            topLevelHasEntries={topLevelEntries.length > 0}
          />
        )}
        {validation && <ValidationDataSection validation={validation} />}
      </div>
    </div>
  );
}
