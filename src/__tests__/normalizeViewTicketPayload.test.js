/**
 * Must stay aligned with `normalizeViewTicketPayload` in tickets.ts.
 */

function readTicketRecord(value) {
  return value != null && typeof value === "object" ? value : null;
}

function looksLikeTicketRecord(record) {
  return (
    record.id != null &&
    (record.title != null ||
      record.description != null ||
      record.ticket_status_id != null ||
      record.module_id != null)
  );
}

function normalizeViewTicketPayload(payload) {
  const record = readTicketRecord(payload);
  if (!record) {
    return null;
  }

  if (looksLikeTicketRecord(record)) {
    return record;
  }

  if (record.success === true) {
    const successData = normalizeViewTicketPayload(record.data);
    if (successData) {
      return successData;
    }
  }

  const nested = normalizeViewTicketPayload(record.data);
  if (nested) {
    return nested;
  }

  return record.id != null ? record : null;
}

const ticket = {
  id: 42,
  title: "Broken login",
  description: "User cannot sign in",
  module_id: 3,
};

if (JSON.stringify(normalizeViewTicketPayload(ticket)) !== JSON.stringify(ticket)) {
  throw new Error("direct ticket record should pass through");
}

if (
  JSON.stringify(normalizeViewTicketPayload({ success: true, data: ticket })) !==
  JSON.stringify(ticket)
) {
  throw new Error("success envelope should unwrap");
}

if (JSON.stringify(normalizeViewTicketPayload({ data: ticket })) !== JSON.stringify(ticket)) {
  throw new Error("data envelope should unwrap");
}

if (normalizeViewTicketPayload(null) !== null) {
  throw new Error("null should return null");
}

console.log("normalizeViewTicketPayload: all assertions passed");
