export type FaqTopicRow = {
  id: number;
  name: string;
  faqs_count?: string;
  faq_module?: { icon?: string };
};

export type FaqItemRow = {
  id: number | string;
  title?: string;
  question?: string;
  description?: string;
  answer?: string;
  type?: string;
  view_count?: number;
  created_at?: string;
  updated_at?: string;
  topic?: { faq_module?: { icon?: string } };
};
