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
