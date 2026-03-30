import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect, useCallback } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  getTrunks,
  getVoicebot,
  postVoicebots,
  putVoicebot,
  type CreateVoicebotPayload,
  type UpdateVoicebotPayload,
} from "@utils/voicebot/outbound";
import { toFormString, firstString } from "@utils/voicebot/formDisplay";
import { GetCompanies } from "@utils/users";
import { normalizeCompaniesResponse } from "@utils/companyOptions";
import { Form, Spinner, Tab, Row, Col, Button } from "react-bootstrap";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import PageHeader from "@components/PageHeader";
import { FileText, Mic, MessageSquare, Phone } from "lucide-react";
import { TabsNavigation } from "@components/voicebot/TabsNavigation";
import { CompanyOptions, type CompanyOption } from "@components/voicebot/CompanyOptions";
import { ValidationChecklist } from "@components/voicebot/ValidationChecklist";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

/** Form state (UI uses first_message/system_prompt; API expects default_greeting/default_system_prompt) */
interface OutboundVoicebotFormState {
  company_id: string;
  name: string;
  trunk_id: string;
  description: string;
  system_prompt: string;
  first_message: string;
  llm_model: string;
  tts_model: string;
  stt_model: string;
  voice: string;
  temperature: number;
  max_tokens: number;
  transfer_number: string;
  enable_transfer: boolean;
  idle_timeout_seconds: number;
  max_call_duration_seconds: number;
  status: string;
  language?: string;
  concurrency_limit?: number;
}

const defaultForm: OutboundVoicebotFormState = {
  company_id: "",
  name: "",
  trunk_id: "",
  description: "",
  system_prompt: `You are a professional outbound sales executive calling a customer who has shown interest in our product.

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

Always end call politely.`,
  first_message: "Hello, this is an AI assistant. How can I help you today?",
  llm_model: "gpt-4o-mini",
  tts_model: "gpt-4o-mini-tts",
  stt_model: "nova-3",
  voice: "onyx",
  temperature: 0.7,
  max_tokens: 150,
  transfer_number: "",
  enable_transfer: false,
  idle_timeout_seconds: 300,
  max_call_duration_seconds: 1800,
  status: "inactive",
  language: "en-US",
  concurrency_limit: 10,
};

const TAB_KEYS = { basic: "basic", voice: "voice", prompts: "prompts", call: "call" } as const;
const TAB_ORDER = [TAB_KEYS.basic, TAB_KEYS.voice, TAB_KEYS.prompts, TAB_KEYS.call];
const TABS = [
  { id: TAB_KEYS.basic, label: "Basic Information", icon: FileText },
  { id: TAB_KEYS.voice, label: "Voice Settings", icon: Mic },
  { id: TAB_KEYS.prompts, label: "Prompts", icon: MessageSquare },
  { id: TAB_KEYS.call, label: "Call Settings", icon: Phone },
];

function getPageCopy(isEditMode: boolean) {
  return {
    breadcrumbSubTitle: isEditMode
      ? "Voicebot Outbound - Voice Bots - Edit"
      : "Voicebot Outbound - Voice Bots - Create",
    title: isEditMode ? "Edit Voice Bot" : "Create Voice Bot",
    finalActionLabel: isEditMode ? "Update Voice Bot" : "Create Voice Bot",
  };
}

function getVoicebotDetail(res: Record<string, unknown>): Record<string, unknown> {
  return ((res as { data?: unknown }).data ?? res) as Record<string, unknown>;
}

function getSubmitError(form: OutboundVoicebotFormState): string | null {
  if (!form.company_id || !form.name?.trim()) return "Company and Bot Name are required";
  if (!form.trunk_id?.trim()) return "Select Trunk is required";
  if (!form.first_message?.trim()) return "Default Greeting is required";
  if (!form.system_prompt?.trim()) return "Default System Prompt is required";
  return null;
}

function buildUpdatePayload(form: OutboundVoicebotFormState): UpdateVoicebotPayload {
  return {
    company_id: form.company_id || undefined,
    name: form.name,
    trunk_id: form.trunk_id || undefined,
    default_greeting: form.first_message?.trim() ?? "",
    default_system_prompt: form.system_prompt?.trim() ?? "",
    description: form.description || undefined,
    system_prompt: form.system_prompt || undefined,
    first_message: form.first_message || undefined,
    llm_model: form.llm_model || undefined,
    tts_model: form.tts_model || undefined,
    stt_model: form.stt_model || undefined,
    voice: form.voice || undefined,
    temperature: form.temperature,
    max_tokens: form.max_tokens,
    transfer_number: form.transfer_number || undefined,
    enable_transfer: form.enable_transfer,
    idle_timeout_seconds: form.idle_timeout_seconds,
    max_call_duration_seconds: form.max_call_duration_seconds,
    status: form.status || undefined,
  };
}

function buildCreatePayload(form: OutboundVoicebotFormState): CreateVoicebotPayload {
  const base = buildUpdatePayload(form);
  return {
    ...base,
    company_id: form.company_id,
    name: form.name.trim(),
    trunk_id: form.trunk_id?.trim() ?? "",
    default_greeting: form.first_message?.trim() ?? "",
    default_system_prompt: form.system_prompt?.trim() ?? "",
  };
}

async function submitOutboundVoicebot(
  form: OutboundVoicebotFormState,
  isEditMode: boolean,
  botId: string | undefined,
): Promise<"updated" | "created"> {
  if (isEditMode && botId) {
    await putVoicebot(botId, buildUpdatePayload(form));
    return "updated";
  }

  await postVoicebots(buildCreatePayload(form));
  return "created";
}

// company options rendering extracted to `CompanyOptions`

const LoadingVoicebotPlaceholder = ({ pageCopy }: { pageCopy: ReturnType<typeof getPageCopy> }) => (
  <React.Fragment>
    <BreadcrumbItem mainTitle="" mainLink="" subTitle={pageCopy.breadcrumbSubTitle} />
    <PageHeader title={pageCopy.title} showSearch={false} />
    <div className="d-flex justify-content-center align-items-center p-5">
      <Spinner animation="border" />
    </div>
  </React.Fragment>
);

// local versions of TabsNavigation/ValidationChecklist/CompanyOption were extracted to shared components

const BottomActionBar = ({
  isFirstTab,
  isLastTab,
  submitting,
  onCancel,
  onPrev,
  onNext,
  onFinalSubmit,
  finalActionLabel,
  canSubmitFinal,
}: {
  isFirstTab: boolean;
  isLastTab: boolean;
  submitting: boolean;
  onCancel: () => void;
  onPrev: () => void;
  onNext: () => void;
  onFinalSubmit: () => void;
  finalActionLabel: string;
  canSubmitFinal: boolean;
}) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #e5e7eb" }}>
    <div>
      {isFirstTab ? (
        <Button type="button" variant="outline-secondary" onClick={onCancel}>
          Cancel
        </Button>
      ) : (
        <Button type="button" variant="outline-secondary" onClick={onPrev}>
          Previous
        </Button>
      )}
    </div>
    <div style={{ display: "flex", gap: "12px" }}>
      {isLastTab ? (
        <Button type="button" variant="primary" disabled={submitting || !canSubmitFinal} onClick={onFinalSubmit}>
          {submitting ? <Spinner animation="border" size="sm" className="me-1" /> : null}
          {finalActionLabel}
        </Button>
      ) : (
        <Button type="button" variant="primary" onClick={onNext}>
          Next
        </Button>
      )}
    </div>
  </div>
);

const VoicebotOutboundCreate = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = String(session?.user?.is_admin ?? "") === "1";
  const userCompanyIdentifier = (session?.user as { company_identifier?: string })?.company_identifier ?? "";
  const userCompanyName = (session?.user as { company_name?: string })?.company_name ?? userCompanyIdentifier;
  const botId = typeof router.query.id === "string" ? router.query.id : undefined;
  const isEditMode = Boolean(botId);
  const pageCopy = getPageCopy(isEditMode);
  const [activeTab, setActiveTab] = useState<string>(TAB_KEYS.basic);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [trunks, setTrunks] = useState<Array<{ id: string; trunk_id?: string; name?: string }>>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingBot, setLoadingBot] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<OutboundVoicebotFormState>({ ...defaultForm });

  const fetchCompanies = useCallback(async () => {
    setLoadingCompanies(true);
    try {
      const res = await GetCompanies();
      if (res === false) {
        setCompanies([]);
        return;
      }
      const opts = normalizeCompaniesResponse(res, { prefer: "company_id" }).map((c) => ({
        id: c.id,
        company_id: c.company_id ?? c.identifier ?? c.id,
        name: c.name,
      }));
      setCompanies(opts);
      if (opts.length && !form.company_id && !botId) setForm((f) => ({ ...f, company_id: opts[0].id }));
    } catch {
      setCompanies([]);
    } finally {
      setLoadingCompanies(false);
    }
  }, [botId]);

  const fetchTrunksList = useCallback(async () => {
    try {
      const res = await getTrunks();
      const list = Array.isArray(res) ? res : (res as { results?: { trunk_id?: string; id?: string; name?: string }[] })?.results ?? (res as { data?: { trunk_id?: string; id?: string; name?: string }[] })?.data ?? [];
      const rows = (Array.isArray(list) ? list : []).map((r, i) => ({
        id: r.trunk_id ?? r.id ?? `trunk-${i}`,
        trunk_id: r.trunk_id ?? r.id,
        name: (r as { name?: string }).name ?? r.trunk_id ?? r.id ?? "",
      }));
      setTrunks(rows);
    } catch {
      setTrunks([]);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    if (!isAdmin && userCompanyIdentifier) {
      setForm((f) => ({ ...f, company_id: userCompanyIdentifier }));
    }
  }, [isAdmin, userCompanyIdentifier]);

  useEffect(() => {
    fetchTrunksList();
  }, [fetchTrunksList]);

  useEffect(() => {
    if (!isEditMode || !botId) return;
    setLoadingBot(true);
    const companyId = typeof router.query.company_id === "string" ? router.query.company_id : undefined;
    getVoicebot(botId, companyId ? { company_id: companyId } : undefined)
      .then((res: Record<string, unknown>) => {
        const d = getVoicebotDetail(res);
        setForm({
          company_id: toFormString(d.company_id),
          name: toFormString(d.name),
          description: toFormString(d.description),
          system_prompt: firstString(d.default_system_prompt, d.system_prompt) || defaultForm.system_prompt,
          first_message: firstString(d.default_greeting, d.first_message) || defaultForm.first_message,
          llm_model: typeof d.llm_model === "string" ? d.llm_model : defaultForm.llm_model,
          tts_model: typeof d.tts_model === "string" ? d.tts_model : defaultForm.tts_model,
          stt_model: typeof d.stt_model === "string" ? d.stt_model : defaultForm.stt_model,
          voice: firstString(d.voice, d.voice_model) || defaultForm.voice,
          temperature: Number(d.temperature ?? defaultForm.temperature),
          max_tokens: Number(d.max_tokens ?? defaultForm.max_tokens),
          transfer_number: toFormString(d.transfer_number),
          enable_transfer: Boolean(d.enable_transfer ?? false),
          idle_timeout_seconds: Number(d.idle_timeout_seconds ?? d.idle_timeout ?? defaultForm.idle_timeout_seconds),
          max_call_duration_seconds: Number(d.max_call_duration_seconds ?? d.max_call_duration ?? defaultForm.max_call_duration_seconds),
          status: typeof d.status === "string" ? d.status : defaultForm.status,
          trunk_id: typeof d.trunk_id === "string" ? d.trunk_id : "",
          language: typeof d.language === "string" ? d.language : defaultForm.language,
          concurrency_limit: Number(d.concurrency_limit ?? defaultForm.concurrency_limit),
        });
      })
      .catch(() => {
        toast.error("Failed to load voice bot");
        router.push("/voicebot/outbound/voicebots");
      })
      .finally(() => setLoadingBot(false));
  }, [isEditMode, botId, router]);

  const handleSubmit = () => {
    const err = getSubmitError(form);
    if (err) {
      toast.error(err);
      return;
    }

    setSubmitting(true);
    submitOutboundVoicebot(form, isEditMode, botId)
      .then((result) => {
        toast.success(result === "updated" ? "Voice bot updated" : "Voice bot created");
        router.push("/voicebot/outbound/voicebots");
      })
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { detail?: string } }; message?: string };
        toast.error(
          e?.response?.data?.detail ||
            e?.message ||
            (isEditMode ? "Update failed" : "Create failed"),
        );
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const handleCancel = () => {
    router.push("/voicebot/outbound/voicebots");
  };

  const currentTabIndex = TAB_ORDER.indexOf(activeTab as "basic" | "voice" | "prompts" | "call");
  const isFirstTab = currentTabIndex <= 0;
  const isLastTab = currentTabIndex >= TAB_ORDER.length - 1;
  const goPrev = () => {
    if (!isFirstTab) setActiveTab(TAB_ORDER[currentTabIndex - 1]);
  };
  const goNext = () => {
    if (!isLastTab) setActiveTab(TAB_ORDER[currentTabIndex + 1]);
  };

  const validationItems = [
    { id: "basic", label: "Basic Information", checked: !!(form.name?.trim() && form.company_id && form.trunk_id?.trim() && (form.description?.trim() || true)) },
    { id: "voice", label: "Voice Settings", checked: !!(form.voice && form.llm_model) },
    { id: "prompts", label: "Prompts", checked: !!(form.first_message?.trim() && form.system_prompt?.trim()) },
    { id: "call", label: "Call Settings", checked: true },
  ];

  const inputStyle = { width: "100%" as const, padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "14px", color: "#1f2937" };
  const labelStyle = { display: "block" as const, fontSize: "13px", fontWeight: 500 as const, color: "#6b7280", marginBottom: "6px" };

  if (loadingBot) {
    return <LoadingVoicebotPlaceholder pageCopy={pageCopy} />;
  }

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle={pageCopy.breadcrumbSubTitle} />
      <PageHeader title={pageCopy.title} showSearch={false} />

      <TabsNavigation tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <Form
        onSubmit={(e) => e.preventDefault()}
        onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
      >
        <div style={{ maxWidth: "1600px", margin: "0 auto", padding: "24px 0" }}>
          <div className="content-grid outbound-voicebot-create-grid" style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "24px", alignItems: "start" }}>
            <div>
              <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k ?? TAB_KEYS.basic)}>
                  <Tab.Content>
                    <Tab.Pane eventKey={TAB_KEYS.basic}>
                      <h6 style={{ margin: "0 0 20px 0", fontSize: "16px", fontWeight: 600, color: "#1f2937" }}>Basic Information</h6>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label style={labelStyle}>Bot Name <span className="text-danger">*</span></Form.Label>
                            <Form.Control value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required placeholder="e.g. Sales Bot" style={inputStyle} />
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label style={labelStyle}>Description</Form.Label>
                            <Form.Control as="textarea" rows={3} value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="AI bot for sales calls" style={{ ...inputStyle, resize: "vertical" as const }} />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label style={labelStyle}>Company <span className="text-danger">*</span></Form.Label>
                            <Form.Select
                              value={isAdmin ? form.company_id : userCompanyIdentifier}
                              onChange={(e) => { if (isAdmin) setForm((f) => ({ ...f, company_id: e.target.value })); }}
                              required
                              disabled={loadingCompanies || isEditMode || !isAdmin}
                              style={inputStyle}
                            >
                              <option value="">Select company</option>
                              <CompanyOptions
                                isAdmin={isAdmin}
                                companies={companies}
                                userCompanyIdentifier={userCompanyIdentifier}
                                userCompanyName={userCompanyName}
                              />
                            </Form.Select>
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label style={labelStyle}>Select Trunk <span className="text-danger">*</span></Form.Label>
                            <Form.Select value={form.trunk_id ?? ""} onChange={(e) => setForm((f) => ({ ...f, trunk_id: e.target.value }))}  style={inputStyle}>
                              <option value="">Select trunk</option>
                              {trunks.map((t) => <option key={t.id} value={t.id}>{t.name || t.id}</option>)}
                            </Form.Select>
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label style={labelStyle}>Status</Form.Label>
                            <Form.Select value={form.status ?? "inactive"} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} style={inputStyle}>
                            <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>
                    </Tab.Pane>
                    <Tab.Pane eventKey={TAB_KEYS.voice}>
                      <h6 style={{ margin: "0 0 20px 0", fontSize: "16px", fontWeight: 600, color: "#1f2937" }}>Voice Settings</h6>
                      <Row>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label style={labelStyle}>TTS Provider</Form.Label>
                            <Form.Select value="openai" style={inputStyle} disabled><option value="openai">openai</option></Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label style={labelStyle}>Voice Model</Form.Label>
                            <Form.Control value={form.voice ?? "onyx"} onChange={(e) => setForm((f) => ({ ...f, voice: e.target.value }))} placeholder="onyx" style={inputStyle} disabled />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label style={labelStyle}>Language</Form.Label>
                            <Form.Control value={form.language ?? "en-US"} onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))} placeholder="en-US" style={inputStyle}  disabled />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label style={labelStyle}>LLM Model</Form.Label>
                            <Form.Control value={form.llm_model ?? ""} onChange={(e) => setForm((f) => ({ ...f, llm_model: e.target.value }))} placeholder="gpt-4o-mini" style={inputStyle}  disabled />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label style={labelStyle}>TTS Model</Form.Label>
                            <Form.Control value={form.tts_model ?? ""} onChange={(e) => setForm((f) => ({ ...f, tts_model: e.target.value }))} placeholder="gpt-4o-mini-tts" style={inputStyle}  disabled />
                          </Form.Group>
                        </Col>
                      </Row>
                    </Tab.Pane>
                    <Tab.Pane eventKey={TAB_KEYS.prompts}>
                      <h6 style={{ margin: "0 0 20px 0", fontSize: "16px", fontWeight: 600, color: "#1f2937" }}>Prompts</h6>
                      <Form.Group className="mb-3">
                        <Form.Label style={labelStyle}>Default Greeting <span className="text-danger">*</span></Form.Label>
                        <Form.Control as="textarea" rows={3} value={form.first_message ?? ""} onChange={(e) => setForm((f) => ({ ...f, first_message: e.target.value }))} required placeholder="Hello, this is an AI assistant..." style={{ ...inputStyle, resize: "vertical" as const }} />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label style={labelStyle}>Default System Prompt <span className="text-danger">*</span></Form.Label>
                        <Form.Control as="textarea" rows={3} value={form.system_prompt ?? ""} onChange={(e) => setForm((f) => ({ ...f, system_prompt: e.target.value }))} required placeholder="You are a professional AI assistant." style={{ ...inputStyle, resize: "vertical" as const }} />
                      </Form.Group>
                    </Tab.Pane>
                    <Tab.Pane eventKey={TAB_KEYS.call}>
                      <h6 style={{ margin: "0 0 20px 0", fontSize: "16px", fontWeight: 600, color: "#1f2937" }}>Call Settings</h6>
                      <Row>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label style={labelStyle}>Transfer Number</Form.Label>
                            <Form.Control value={form.transfer_number ?? ""} onChange={(e) => setForm((f) => ({ ...f, transfer_number: e.target.value }))} placeholder="+1234567890" style={inputStyle} />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label style={labelStyle}>Concurrency Limit</Form.Label>
                            <Form.Control type="number" min={1} value={form.concurrency_limit ?? 10} onChange={(e) => setForm((f) => ({ ...f, concurrency_limit: e.target.value ? Number(e.target.value) : 10 }))} style={inputStyle} />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label style={labelStyle}>Max Call Duration (s)</Form.Label>
                            <Form.Control type="number" min={60} value={form.max_call_duration_seconds ?? 1800} onChange={(e) => setForm((f) => ({ ...f, max_call_duration_seconds: e.target.value ? Number(e.target.value) : 1800 }))} style={inputStyle} />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Form.Group className="mb-3">
                        <Form.Label style={labelStyle}>Idle Timeout (s)</Form.Label>
                        <Form.Control type="number" min={30} value={form.idle_timeout_seconds ?? 300} onChange={(e) => setForm((f) => ({ ...f, idle_timeout_seconds: e.target.value ? Number(e.target.value) : 300 }))} style={inputStyle} />
                      </Form.Group>
                    </Tab.Pane>
                  </Tab.Content>
                </Tab.Container>
              </div>
            </div>
            <div style={{ position: "sticky", top: "24px" }}>
              <ValidationChecklist items={validationItems} />
            </div>
          </div>

          <BottomActionBar
            isFirstTab={isFirstTab}
            isLastTab={isLastTab}
            submitting={submitting}
            onCancel={handleCancel}
            onPrev={goPrev}
            onNext={goNext}
            onFinalSubmit={handleSubmit}
            finalActionLabel={pageCopy.finalActionLabel}
            canSubmitFinal={Boolean(
              form.company_id &&
                form.name?.trim() &&
                form.trunk_id?.trim() &&
                form.first_message?.trim() &&
                form.system_prompt?.trim(),
            )}
          />
        </div>
      </Form>

      <style>{`
        .outbound-voicebot-create-grid select:focus,
        .outbound-voicebot-create-grid input:focus,
        .outbound-voicebot-create-grid textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        @media (max-width: 1200px) {
          .outbound-voicebot-create-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </React.Fragment>
  );
};

VoicebotOutboundCreate.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;
export default VoicebotOutboundCreate;
