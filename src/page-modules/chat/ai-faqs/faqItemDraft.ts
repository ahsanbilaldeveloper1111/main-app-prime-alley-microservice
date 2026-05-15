import type { FAQItem } from "@utils/chat";

export type FAQItemDraft = FAQItem & { clientKey: string };

let faqClientKeySeq = 0;

function newClientKey(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) {
    return c.randomUUID();
  }
  if (c?.getRandomValues) {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  faqClientKeySeq += 1;
  return `faq-${Date.now()}-${faqClientKeySeq}`;
}

export function emptyFaqDraft(): FAQItemDraft {
  return { clientKey: newClientKey(), question: "", answer: "" };
}

export function faqToDraft(input: Pick<FAQItem, "question" | "answer">): FAQItemDraft {
  return { clientKey: newClientKey(), ...input };
}

/** Shared file input `accept` for FAQ attachments (global + tenant modals). */
export const AI_FAQ_ATTACHMENT_ACCEPT = ".jpg,.jpeg,.png,.gif,.pdf,.txt,.doc,.docx,.zip";

export function faqAttachmentFileDomKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export function getValidFaqItemsForSubmit(items: FAQItemDraft[]): FAQItem[] {
  return items
    .filter((item) => item.question.trim() && item.answer.trim())
    .map(({ question, answer }) => ({ question, answer }));
}

export type AiFaqSubmitFieldPayload = {
  faqs: string;
  have_files: string;
  files: File[] | undefined;
};

export function buildAiFaqSubmitFields(
  validFAQs: FAQItem[],
  haveFiles: boolean,
  selectedFiles: File[],
): AiFaqSubmitFieldPayload {
  const faqsJson = JSON.stringify(validFAQs);
  const hasFiles = haveFiles && selectedFiles.length > 0;
  return {
    faqs: faqsJson,
    have_files: hasFiles ? "true" : "false",
    files: hasFiles ? selectedFiles : undefined,
  };
}

export type FaqListPageShape<T> = {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  last_page: number;
};

export function paginateArrayForTable<T>(all: T[], page: number, perPage: number) {
  const start = (page - 1) * perPage;
  const total = all.length;
  const last_page = Math.max(1, Math.ceil(total / perPage) || 1);
  return {
    slice: all.slice(start, start + perPage),
    total,
    last_page,
  };
}

export function emptyFaqListPage<T>(perPage: number): FaqListPageShape<T> {
  return { data: [], total: 0, page: 1, per_page: perPage, last_page: 1 };
}
