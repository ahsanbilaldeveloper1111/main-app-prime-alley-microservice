import type { FAQItem } from "@utils/chat";
import { createNonPrngId } from "@utils/id";

const FAQ_DRAFT_SCOPE = "faq-draft";

export type FAQItemDraft = FAQItem & { readonly clientKey: string };

export function emptyFaqDraft(): FAQItemDraft {
  return { question: "", answer: "", clientKey: createNonPrngId(FAQ_DRAFT_SCOPE) };
}

export function faqToDraft(item: FAQItem): FAQItemDraft {
  return { ...item, clientKey: createNonPrngId(FAQ_DRAFT_SCOPE) };
}

export function faqAttachmentFileDomKey(file: File): string {
  return `${file.name}-${String(file.size)}-${String(file.lastModified)}`;
}
