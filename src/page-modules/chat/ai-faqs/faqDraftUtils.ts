import type { FAQItem } from "@utils/chat";

export type FAQDraftItem = FAQItem & { draftId: string };

export function createFaqDraft(overrides: Partial<FAQItem> = {}): FAQDraftItem {
  return {
    question: "",
    answer: "",
    ...overrides,
    draftId: crypto.randomUUID(),
  };
}

/** Strip client ids for API JSON payloads. */
export function faqDraftsToPayloadItems(items: FAQDraftItem[]): FAQItem[] {
  return items
    .filter((item) => item.question.trim() && item.answer.trim())
    .map(({ question, answer }) => ({ question, answer }));
}

export function fileAttachmentRowKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

/** Add / edit global FAQ modals */
export const FAQ_ATTACHMENTS_ACCEPT_GLOBAL =
  ".jpg,.jpeg,.png,.gif,.pdf,.txt,.doc,.docx";

/** Tenant FAQ modals (stricter) */
export const FAQ_ATTACHMENTS_ACCEPT_TENANT = ".pdf,.txt,.doc,.docx";
