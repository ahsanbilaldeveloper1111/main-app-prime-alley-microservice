export type FAQItemSidebarConfig = {
  title: string;
  questionInputId: string;
  descInputId: string;
  typeInputId: string;
  submitLabel: string;
  submittingLabel: string;
  questionPlaceholder: string;
  descPlaceholder: string;
  editorKey: (id: unknown, open: boolean) => string;
};

export interface FAQItemFormData {
  topic_id: string;
  question: string;
  answer: string;
  description: string;
  type: string;
}

export const EMPTY_FORM_DATA: FAQItemFormData = {
  topic_id: "",
  question: "",
  answer: "",
  description: "",
  type: "",
};

export const CREATE_ITEM_CONFIG: FAQItemSidebarConfig = {
  title: "New FAQ",
  questionInputId: "newItemQuestion",
  descInputId: "newItemDescription",
  typeInputId: "newItemType",
  submitLabel: "Add FAQ",
  submittingLabel: "Adding...",
  questionPlaceholder: "Enter the question",
  descPlaceholder: "Optional description",
  editorKey: (_id: unknown, open: boolean) => `create-${open}`,
};

export const EDIT_ITEM_CONFIG: FAQItemSidebarConfig = {
  title: "Edit FAQ",
  questionInputId: "editItemQuestion",
  descInputId: "editItemDescription",
  typeInputId: "editItemType",
  submitLabel: "Update FAQ",
  submittingLabel: "Updating...",
  questionPlaceholder: "",
  descPlaceholder: "",
  editorKey: (id: unknown, open: boolean) => `edit-${id}-${open}`,
};

export type FAQItemRow = {
  id: string | number;
  topic_id?: string | number;
  question?: string;
  answer?: string;
  description?: string;
  type?: string;
  topic?: {
    name: string;
    description?: string;
    faq_module?: { name: string };
  };
  view_count?: number;
  created_at?: string;
};
