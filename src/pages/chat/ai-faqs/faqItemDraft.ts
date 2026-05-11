import type { FAQItem } from "@utils/chat";
import { createNonPrngId } from "@utils/id";

const FAQ_DRAFT_SCOPE = "faq-draft";

/** File input accept for global AI FAQ uploads (includes images). */
export const AI_FAQ_GLOBAL_FILE_ACCEPT = ".jpg,.jpeg,.png,.gif,.pdf,.txt,.doc,.docx";

/** File input accept for tenant AI FAQ uploads. */
export const AI_FAQ_TENANT_FILE_ACCEPT = ".pdf,.txt,.doc,.docx";

export type FAQItemDraft = FAQItem & { readonly clientKey: string };

/** FAQs with non-empty question and answer, ready for API JSON payload. */
export function getValidFaqItemsForSubmit(faqItems: FAQItemDraft[]): FAQItem[] {
  return faqItems
    .filter((item) => item.question.trim() && item.answer.trim())
    .map(({ question, answer }) => ({ question, answer }));
}

export function emptyFaqDraft(): FAQItemDraft {
  return { question: "", answer: "", clientKey: createNonPrngId(FAQ_DRAFT_SCOPE) };
}

export function faqToDraft(item: FAQItem): FAQItemDraft {
  return { ...item, clientKey: createNonPrngId(FAQ_DRAFT_SCOPE) };
}

/** Stable React key for a selected file row in global/tenant AI FAQ forms. */
export function faqAttachmentFileDomKey(file: File): string {
  return `${file.name}-${String(file.size)}-${String(file.lastModified)}`;
}

export type FaqListPageResult<T> = {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  last_page: number;
};

export function paginateArrayForTable<T>(rows: T[], page: number, perPage: number): FaqListPageResult<T> {
  const start = (page - 1) * perPage;
  const end = start + perPage;
  return {
    data: rows.slice(start, end),
    total: rows.length,
    page,
    per_page: perPage,
    last_page: Math.ceil(rows.length / perPage),
  };
}

export function emptyFaqListPage<T>(perPage: number, page = 1): FaqListPageResult<T> {
  return { data: [], total: 0, page, per_page: perPage, last_page: 1 };
}

/** Fields shared by global + tenant FAQ create/update payloads. */
export function buildAiFaqSubmitFields(
  validFAQs: FAQItem[],
  haveFiles: boolean,
  selectedFiles: File[],
): { faqs: string; have_files: string; files: string[] | undefined } {
  const faqsJson = JSON.stringify(validFAQs);
  const filePaths: string[] = selectedFiles.map((file) => file.name);
  return {
    faqs: faqsJson,
    have_files: haveFiles && selectedFiles.length > 0 ? "true" : "false",
    files: filePaths.length > 0 ? filePaths : undefined,
  };
}
