import type { Session } from "next-auth";
import moment from "moment";
import { GlobalDateFormat } from "@utils/Helper";

export const documentPageFont = "Lexend Deca, Helvetica, Arial, sans-serif";

type SessionUserWithCompanyIds = {
  company_indentifier?: string;
  company_identifier?: string;
};

export function getCompanyIdFromSession(session: Session | null): string {
  const user = session?.user as SessionUserWithCompanyIds | undefined;
  const raw = user?.company_indentifier ?? user?.company_identifier ?? "";
  return typeof raw === "string" ? raw.trim() : String(raw ?? "").trim();
}

export function normalizeCompanyDocumentsResponse(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) {
    return raw.filter((item): item is Record<string, unknown> => item != null && typeof item === "object");
  }
  if (raw != null && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const inner = obj.data ?? obj.documents ?? obj.items;
    if (Array.isArray(inner)) {
      return inner.filter((item): item is Record<string, unknown> => item != null && typeof item === "object");
    }
  }
  return [];
}

export function getDocumentId(doc: Record<string, unknown>): string | number | undefined {
  const v = doc.id ?? doc.document_id ?? doc.documentId;
  if (typeof v === "string" || typeof v === "number") return v;
  return undefined;
}

export function getDocumentName(doc: Record<string, unknown>): string {
  const v = doc.name ?? doc.filename ?? doc.title ?? doc.file_name;
  return typeof v === "string" && v.trim() ? v : "Document";
}

export function getDocumentType(doc: Record<string, unknown>): string {
  const v = doc.type ?? doc.document_type ?? doc.category;
  return typeof v === "string" ? v : "";
}

export function getUpdatedAtDisplay(doc: Record<string, unknown>): string {
  const v = doc.updated_at ?? doc.updatedAt ?? doc.modified_at;
  if (v == null || v === "") return "";
  if (typeof v === "string" || typeof v === "number") {
    const parsed = moment(v);
    return parsed.isValid() ? parsed.format(GlobalDateFormat) : String(v);
  }
  return "";
}

export function getExternalUrl(doc: Record<string, unknown>): string | undefined {
  const url = doc.external_url ?? doc.url ?? doc.file_url;
  if (typeof url === "string" && /^https?:\/\//i.test(url)) return url;
  return undefined;
}

export function buildCompanyDocumentsFormData(files: File[]): FormData {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files[]", file);
    formData.append("name[]", file.name);
    formData.append("types[]", file.type || "application/octet-stream");
  }
  return formData;
}
