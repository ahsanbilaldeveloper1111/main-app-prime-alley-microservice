import type { CrmDataItem } from "@utils/crm";

type UpdateCrmDataPayload = {
  name: string;
  phone: string;
  campaign_id: number | null;
  data: Record<string, unknown>;
  scheduled_call_at?: string;
  company_domain?: string;
  source_file?: string;
  tag_ids?: number[];
};

/**
 * Builds a full `updateCrmData` body from a prospects/contacts list row by merging
 * `row.data` and setting `disposition`. Matches the shape used by the edit sidebar.
 */
export function buildCrmPersonListRowDispositionUpdatePayload(
  row: CrmDataItem & Record<string, unknown>,
  dispositionValue: string,
): UpdateCrmDataPayload {
  const prevData =
    typeof row.data === "object" && row.data !== null && !Array.isArray(row.data)
      ? { ...row.data }
      : {};

  const name = String(row.name ?? "").trim();
  const phone = String(row.phone ?? "").trim();

  const rawTags = (row as { tags?: unknown }).tags;
  const tags = Array.isArray(rawTags) ? rawTags : [];
  const tag_ids = tags
    .map((t) => {
      if (!t || typeof t !== "object") return undefined;
      const maybe = t as { id?: unknown };
      return typeof maybe.id === "number" ? maybe.id : undefined;
    })
    .filter((id): id is number => typeof id === "number" && id > 0);

  const companyFromData =
    typeof prevData.company_domain === "string"
      ? prevData.company_domain
      : undefined;

  const sourceFromRow = row.source_file;
  let sourceFromData: string | undefined;
  if (typeof prevData.source_file === "string") {
    sourceFromData = prevData.source_file;
  } else if (typeof prevData.source === "string") {
    sourceFromData = prevData.source;
  }

  const payload: UpdateCrmDataPayload = {
    name: name || "—",
    phone,
    campaign_id: row.campaign_id ?? null,
    data: {
      ...prevData,
      disposition: dispositionValue,
    },
    scheduled_call_at: row.scheduled_call_at || undefined,
    company_domain:
      (typeof row.company_domain === "string" && row.company_domain) ||
      companyFromData ||
      undefined,
    source_file:
      (typeof sourceFromRow === "string" && sourceFromRow) || sourceFromData,
  };

  if (tag_ids.length > 0) {
    payload.tag_ids = tag_ids;
  }

  return payload;
}
