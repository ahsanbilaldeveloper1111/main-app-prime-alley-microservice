export interface KeyPoint {
  id: string;
  label: string;
  value: string;
}

export interface Suggestion {
  id: string;
  title: string;
  rating: number;
  content: string;
}

export type AIComposeChannel = 'whatsapp' | 'sms' | 'email' | 'meetings';
export type AIComposeOpenedFrom = AIComposeChannel | 'meet-now' | 'schedule';

export interface AIComposeProps {
  openedFrom?: AIComposeOpenedFrom;
  /** Context payload (e.g. lead, deal, order) from the page using the sidebar */
  contextPayload?: Record<string, unknown>;
}

export interface FooterHandlers {
  cancel: () => void;
  copy: () => void;
  later: () => void;
  send: () => void;
}

export type RegisterFooter = (handlers: FooterHandlers | null) => void;

/** Common options shared across all channels (Industry, Tone, Language, Urgency, CTA Type) */
export interface CommonChannelOptions {
  industry: string;
  customIndustry: string;
  tone: string;
  language: string;
  customLanguage: string;
  urgency: string;
  ctaType: string;
  customCtaType: string;
}

/** Optional context payload passed to each channel section (e.g. lead, deal, order) */
export interface ChannelSectionContext {
  contextPayload?: Record<string, unknown>;
  /** Shared options for all channels; when provided, sections use these instead of local state */
  commonOptions?: CommonChannelOptions;
  setCommonOptions?: React.Dispatch<React.SetStateAction<CommonChannelOptions>>;
}

/** Source page when opening AI Compose from CRM (leads, deals, orders) */
export type ContextSource = 'leads' | 'deals' | 'orders';

/** Derive which CRM page the context came from based on payload keys */
export function getContextSource(payload?: Record<string, unknown> | null): ContextSource | undefined {
  if (!payload) return undefined;
  if ('lead' in payload && payload.lead != null) return 'leads';
  if ('deal' in payload && payload.deal != null) return 'deals';
  if ('order' in payload && payload.order != null) return 'orders';
  return undefined;
}

export interface ContextBadgeItem {
  label: string;
  value: string;
}

/** Build badge items from context payload for display in channel sections */
export function getContextBadges(payload?: Record<string, unknown> | null): ContextBadgeItem[] {
  if (!payload) return [];
  const lead = payload.lead as Record<string, unknown> | undefined;
  const deal = payload.deal as Record<string, unknown> | undefined;
  const order = payload.order as Record<string, unknown> | undefined;
  if (lead) {
    const items: ContextBadgeItem[] = [];
    if (lead.name != null && String(lead.name).trim()) items.push({ label: 'Name', value: String(lead.name) });
    if (lead.email != null && String(lead.email).trim()) items.push({ label: 'Email', value: String(lead.email) });
    if (lead.phone != null && String(lead.phone).trim()) items.push({ label: 'Phone', value: String(lead.phone) });
    return items;
  }
  if (order) {
    const items: ContextBadgeItem[] = [];
    if (order.id != null) items.push({ label: 'Order ID', value: String(order.id) });
    if (order.items != null) {
      const arr = Array.isArray(order.items) ? order.items : [order.items];
      const itemStr = arr.map((i) => (typeof i === 'string' ? i : String(i))).join(', ');
      if (itemStr) items.push({ label: 'Items', value: itemStr.length > 40 ? itemStr.slice(0, 40) + '…' : itemStr });
    }
    if (order.status != null && String(order.status).trim()) items.push({ label: 'Status', value: String(order.status) });
    return items;
  }
  if (deal) {
    const items: ContextBadgeItem[] = [];
    if (deal.amount != null) items.push({ label: 'Amount', value: String(deal.amount) });
    if (deal.stage != null && String(deal.stage).trim()) items.push({ label: 'Stage', value: String(deal.stage) });
    if (deal.currency != null && String(deal.currency).trim()) items.push({ label: 'Currency', value: String(deal.currency) });
    return items;
  }
  return [];
}
