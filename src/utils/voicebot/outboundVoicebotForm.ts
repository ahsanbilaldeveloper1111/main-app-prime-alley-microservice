import type { CreateVoicebotPayload, UpdateVoicebotPayload } from "@utils/voicebot/outbound";
import { firstString, toFormString } from "@utils/voicebot/formDisplay";

/** Legacy fallback for outbound voicebot update payload when `company_id` is missing. */
export const OUTBOUND_VOICEBOT_CREATE_COMPANY_ID = "default";

/** Page size for outbound voicebot list API calls (table pagination and filter dropdowns). */
export const OUTBOUND_VOICEBOT_LIST_PAGE_SIZE = 200;

/** UI + API-aligned shape for outbound voicebot create/edit (POST/PUT body). */
export interface OutboundVoicebotFormState {
  company_id: string;
  name: string;
  description: string;
  trunk_id: string;
  tts_provider: string;
  voice_model: string;
  language: string;
  default_greeting: string;
  default_system_prompt: string;
  transfer_number: string;
  transfer_trunk_id: string;
  concurrency_limit: number;
  max_call_duration: number;
  idle_timeout: number;
}

const DEFAULT_SYSTEM_PROMPT = `You are a professional outbound sales executive calling a customer who has shown interest in our product.

Your tone should be:
- Friendly but professional
- Confident but not aggressive
- Conversational, not robotic
- Polite and respectful

Rules:
- Speak naturally like a human sales representative.
- Keep responses short and clear (1–3 sentences).
- Do not give long monologues.
- Ask one question at a time.
- Wait for the customer to respond before continuing.
- Handle objections calmly and positively.
- If the customer is busy, offer to schedule a callback.
- Never argue.
- Always try to move toward booking a demo or next step.
- If customer says "not interested", politely ask the reason once, then end professionally.

Your goal:
- Qualify the lead
- Understand their needs
- Offer value
- Move to next step (demo, callback, or close)

If customer is rude:
- Stay calm
- Apologize briefly
- Offer to call later or end politely

If customer asks pricing:
- Give short overview and suggest proper discussion/demo before final quote.

Always end call politely.`;

export const defaultOutboundVoicebotForm = (): OutboundVoicebotFormState => ({
  company_id: "",
  name: "",
  description: "",
  trunk_id: "",
  tts_provider: "openai",
  voice_model: "onyx",
  language: "en-US",
  default_greeting: "Hello, this is an AI assistant. How can I help you today?",
  default_system_prompt: DEFAULT_SYSTEM_PROMPT,
  transfer_number: "",
  transfer_trunk_id: "",
  concurrency_limit: 5,
  max_call_duration: 1800,
  idle_timeout: 30,
});

export function mapVoicebotDetailToForm(
  d: Record<string, unknown>,
  defaults: OutboundVoicebotFormState,
): OutboundVoicebotFormState {
  return {
    company_id: toFormString(d.company_id),
    name: toFormString(d.name),
    description: toFormString(d.description),
    trunk_id: toFormString(d.trunk_id),
    tts_provider: typeof d.tts_provider === "string" ? d.tts_provider : defaults.tts_provider,
    voice_model: firstString(d.voice_model, d.voice) || defaults.voice_model,
    language: typeof d.language === "string" ? d.language : defaults.language,
    default_greeting:
      firstString(d.default_greeting, d.first_message) || defaults.default_greeting,
    default_system_prompt:
      firstString(d.default_system_prompt, d.system_prompt) || defaults.default_system_prompt,
    transfer_number: toFormString(d.transfer_number),
    transfer_trunk_id: toFormString(d.transfer_trunk_id),
    concurrency_limit: Number(d.concurrency_limit ?? defaults.concurrency_limit),
    max_call_duration: Number(
      d.max_call_duration ?? d.max_call_duration_seconds ?? defaults.max_call_duration,
    ),
    idle_timeout: Number(d.idle_timeout ?? d.idle_timeout_seconds ?? defaults.idle_timeout),
  };
}

function buildVoicebotPayload(
  form: OutboundVoicebotFormState,
  companyId: string,
): CreateVoicebotPayload {
  return {
    company_id: companyId,
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    trunk_id: form.trunk_id.trim(),
    tts_provider: form.tts_provider.trim() || "openai",
    voice_model: form.voice_model.trim() || "onyx",
    language: form.language.trim() || "en-US",
    default_greeting: form.default_greeting.trim(),
    default_system_prompt: form.default_system_prompt.trim(),
    transfer_number: form.transfer_number.trim() || undefined,
    transfer_trunk_id: form.transfer_trunk_id.trim() || undefined,
    concurrency_limit: form.concurrency_limit,
    max_call_duration: form.max_call_duration,
    idle_timeout: form.idle_timeout,
  };
}

export function buildCreatePayload(form: OutboundVoicebotFormState): CreateVoicebotPayload {
  return buildVoicebotPayload(form, form.company_id.trim());
}

export function buildUpdatePayload(form: OutboundVoicebotFormState): UpdateVoicebotPayload {
  const companyId = form.company_id.trim() || OUTBOUND_VOICEBOT_CREATE_COMPANY_ID;
  return buildVoicebotPayload(form, companyId);
}

export function getOutboundVoicebotSubmitError(form: OutboundVoicebotFormState): string | null {
  if (!form.company_id?.trim()) return "Company is required";
  if (!form.name?.trim()) return "Bot Name is required";
  if (!form.trunk_id?.trim()) return "Select Trunk is required";
  if (!form.default_greeting?.trim()) return "Default Greeting is required";
  if (!form.default_system_prompt?.trim()) return "Default System Prompt is required";
  return null;
}
