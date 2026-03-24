type CrmId = string | number | null | undefined;

const toEncodedId = (id: CrmId): string | null => {
  if (id === null || id === undefined) return null;
  const s = String(id).trim();
  if (!s) return null;
  return encodeURIComponent(s);
};

export const buildCrmDealsDetailpageHref = (id: CrmId): string => {
  const encodedId = toEncodedId(id);
  return encodedId
    ? `/crm/detailspage?type=deal&id=${encodedId}`
    : "/crm/deals";
};

export const buildCrmLeadsDetailpageHref = (id: CrmId): string => {
  const encodedId = toEncodedId(id);
  return encodedId
    ? `/crm/detailspage?type=lead&id=${encodedId}`
    : "/crm/leads";
};

