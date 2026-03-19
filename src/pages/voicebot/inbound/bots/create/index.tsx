import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  getCompanies,
  getBot,
  postBots,
  putBot,
  type CreateBotPayload,
  type BotConfiguration,
  type UpdateBotPayload,
} from "@utils/voicebot/inbound";
import { toFormString } from "@utils/voicebot/formDisplay";
import { Form, Spinner, Tab } from "react-bootstrap";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import PageHeader from "@components/PageHeader";
import { HelpCircle, FileText, Settings, Mic, Cpu, Shield, Phone } from "lucide-react";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { TabsNavigation } from "@components/voicebot/TabsNavigation";
import { type CompanyOption } from "@components/voicebot/CompanyOptions";
import { ValidationChecklist } from "@components/voicebot/ValidationChecklist";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

const VOICE_OPTIONS = [
  "alloy",
  "echo",
  "fable",
  "onyx",
  "nova",
  "shimmer",
];

const LLM_MODEL_OPTIONS = [
  "gpt-4o-mini",
  "gpt-4o",
  "gpt-4-turbo",
  "gpt-3.5-turbo",
];

const defaultConfig: BotConfiguration = {
  instructions: "You are a helpful AI assistant. Answer questions clearly and concisely.",
  knowledge_base: "",
  voice_name: "alloy",
  voice_model: "gpt-4o-mini-tts",
  voice_speed: 1,
  voice_instructions: "",
  greeting_message: "Hello! I'm here to help you. How can I assist you today?",
  llm_model: "gpt-4o-mini",
  temperature: 0.7,
  max_tokens: 1000,
  transfer_enabled: true,
  transfer_number: "",
  max_duration: 1800,
  idle_timeout: 300,
  allow_interruptions: true,
  noise_cancellation: true,
  min_endpointing_delay: 0.05,
  sip_trunk_id: "",
  phone_number: "",
};

// CompanyOption extracted to `CompanyOptions` component module

const TAB_KEYS = {
  basic: "basic",
  configuration: "configuration",
  voice: "voice",
  llm: "llm",
  behavior: "behavior",
  sip: "sip",
} as const;

const TAB_ORDER: string[] = [
  TAB_KEYS.basic,
  TAB_KEYS.configuration,
  TAB_KEYS.voice,
  TAB_KEYS.llm,
  TAB_KEYS.behavior,
  TAB_KEYS.sip,
];

const TABS = [
  { id: TAB_KEYS.basic, label: "Basic Information", icon: FileText },
  { id: TAB_KEYS.configuration, label: "Configuration", icon: Settings },
  { id: TAB_KEYS.voice, label: "Voice Settings", icon: Mic },
  { id: TAB_KEYS.llm, label: "LLM Settings", icon: Cpu },
  { id: TAB_KEYS.behavior, label: "Behavior", icon: Shield },
  { id: TAB_KEYS.sip, label: "SIP Settings", icon: Phone },
];

interface ValidationItemType {
  id: string;
  label: string;
  checked: boolean;
  message: string;
}

function getPageCopy(isEditMode: boolean) {
  return {
    breadcrumbSubTitle: isEditMode
      ? "Voicebot Inbound - Bots - Edit"
      : "Voicebot Inbound - Bots - Create",
    title: isEditMode ? "Edit Inbound Bot" : "Create Inbound Bot",
    finalActionLabel: isEditMode ? "Update Bot" : "Create Bot",
  };
}

const BasicInfoPane = ({
  form,
  setForm,
  isAdmin,
  companies,
  loadingCompanies,
  isEditMode,
  userCompanyIdentifier,
  userCompanyName,
  labelStyle,
  inputStyle,
}: {
  form: CreateBotPayload;
  setForm: React.Dispatch<React.SetStateAction<CreateBotPayload>>;
  isAdmin: boolean;
  companies: CompanyOption[];
  loadingCompanies: boolean;
  isEditMode: boolean;
  userCompanyIdentifier: string;
  userCompanyName: string;
  labelStyle: React.CSSProperties;
  inputStyle: React.CSSProperties;
}) => (
  <Tab.Pane eventKey={TAB_KEYS.basic}>
    <h6
      style={{
        margin: "0 0 20px 0",
        fontSize: "16px",
        fontWeight: 600,
        color: "#1f2937",
      }}
    >
      Basic Information
    </h6>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
      <Form.Group className="mb-3">
        <Form.Label style={labelStyle}>Bot Name *</Form.Label>
        <Form.Control
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
          placeholder="Bot name"
          style={inputStyle}
        />
      </Form.Group>
      {isAdmin && (
        <Form.Group className="mb-3">
          <Form.Label style={labelStyle}>Company *</Form.Label>
          <Form.Select
            value={form.company}
            onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
            required
            disabled={loadingCompanies || isEditMode}
            style={inputStyle}
          >
            <option value="">Select company</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      )}
    </div>
    <Form.Group className="mb-3">
      <Form.Label style={labelStyle}>Description *</Form.Label>
      <Form.Control
        as="textarea"
        rows={3}
        value={form.description ?? ""}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        placeholder="Description"
        required
        style={{ ...inputStyle, resize: "vertical" as const }}
      />
    </Form.Group>
  </Tab.Pane>
);

const BottomActionBar = ({
  submitting,
  isFirstTab,
  isLastTab,
  onCancel,
  onPrev,
  onNext,
  onFinalSubmit,
  finalActionLabel,
  canSubmitFinal,
}: {
  submitting: boolean;
  isFirstTab: boolean;
  isLastTab: boolean;
  onCancel: () => void;
  onPrev: () => void;
  onNext: () => void;
  onFinalSubmit: () => void;
  finalActionLabel: string;
  canSubmitFinal: boolean;
}) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: "24px",
      padding: "24px",
      backgroundColor: "white",
      borderRadius: "12px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    }}
  >
    <button
      type="button"
      onClick={onCancel}
      disabled={submitting}
      style={{
        padding: "10px 24px",
        backgroundColor: "transparent",
        border: "none",
        color: "#6b7280",
        fontSize: "14px",
        fontWeight: 500,
        cursor: submitting ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        opacity: submitting ? 0.6 : 1,
      }}
    >
      ← Cancel
    </button>
    <div style={{ display: "flex", gap: "12px" }}>
      <button
        type="button"
        onClick={onPrev}
        disabled={isFirstTab || submitting}
        style={{
          padding: "10px 24px",
          backgroundColor: "transparent",
          border: "1px solid #e5e7eb",
          color: "#6b7280",
          fontSize: "14px",
          fontWeight: 500,
          borderRadius: "8px",
          cursor: isFirstTab || submitting ? "not-allowed" : "pointer",
          opacity: isFirstTab || submitting ? 0.6 : 1,
        }}
      >
        Previous
      </button>
      {isLastTab ? (
        <button
          type="button"
          disabled={submitting || !canSubmitFinal}
          onClick={onFinalSubmit}
          style={{
            padding: "10px 32px",
            backgroundColor: submitting || !canSubmitFinal ? "#9ca3af" : "#667eea",
            border: "none",
            color: "white",
            fontSize: "14px",
            fontWeight: 500,
            borderRadius: "8px",
            cursor: submitting || !canSubmitFinal ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {submitting ? <Spinner animation="border" size="sm" /> : null}
          {finalActionLabel}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          style={{
            padding: "10px 32px",
            backgroundColor: "#667eea",
            border: "none",
            color: "white",
            fontSize: "14px",
            fontWeight: 500,
            borderRadius: "8px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          Next →
        </button>
      )}
    </div>
  </div>
);

// TabsNavigation/ValidationChecklist extracted to shared components

function getFirstValidationError(form: CreateBotPayload): string | null {
  if (!form.company) return "Please select a company";
  if (!form.name?.trim()) return "Bot Name is required";
  if (!form.description?.trim()) return "Description is required";
  const c = form.configuration;
  if (!c?.instructions?.trim()) return "Instructions are required";
  if (!c?.knowledge_base?.trim()) return "Knowledge Base is required";
  if (!c?.voice_instructions?.trim()) return "Voice Instructions are required";
  if (!c?.transfer_number?.trim()) return "Transfer Number is required";
  if (!c?.sip_trunk_id?.trim()) return "SIP Trunk ID is required";
  if (!c?.phone_number?.trim()) return "Phone Number is required";
  return null;
}

function validateFormAndToast(form: CreateBotPayload): boolean {
  const err = getFirstValidationError(form);
  if (err) {
    toast.error(err);
    return false;
  }
  return true;
}

function buildUpdatePayload(form: CreateBotPayload): UpdateBotPayload {
  const c = form.configuration ?? defaultConfig;
  const num = (v: unknown, def: number, parse: (s: string) => number) =>
    typeof v === "number" && !Number.isNaN(v) ? v : (parse(String(v)) || def);
  return {
    name: form.name?.trim() ?? "",
    description: form.description?.trim() ?? "",
    status: form.status ?? "draft",
    configuration: {
      instructions: c.instructions?.trim() ?? "",
      knowledge_base: c.knowledge_base?.trim() ?? "",
      voice_name: c.voice_name ?? "alloy",
      voice_model: c.voice_model ?? "gpt-4o-mini-tts",
      voice_speed: num(c.voice_speed, 1, Number.parseFloat),
      voice_instructions: c.voice_instructions?.trim() ?? "",
      llm_model: c.llm_model ?? "gpt-4o-mini",
      temperature: num(c.temperature, 0.7, Number.parseFloat),
      max_tokens: num(c.max_tokens, 1000, (s) => Number.parseInt(s, 10)),
      greeting_message: c.greeting_message?.trim() ?? "",
      transfer_enabled: Boolean(c.transfer_enabled),
      transfer_number: c.transfer_number?.trim() ?? "",
      max_duration: num(c.max_duration, 1800, (s) => Number.parseInt(s, 10)),
      idle_timeout: num(c.idle_timeout, 300, (s) => Number.parseInt(s, 10)),
      sip_trunk_id: c.sip_trunk_id?.trim() ?? "",
      phone_number: c.phone_number?.trim() ?? "",
      allow_interruptions: Boolean(c.allow_interruptions),
      min_endpointing_delay: num(c.min_endpointing_delay, 0.05, Number.parseFloat),
      noise_cancellation: Boolean(c.noise_cancellation),
    },
  };
}

function buildCreateBotPayload(form: CreateBotPayload): CreateBotPayload {
  const updatePayload = buildUpdatePayload(form);
  return {
    company: form.company,
    name: updatePayload.name ?? "",
    description: updatePayload.description ?? "",
    status: updatePayload.status ?? "draft",
    configuration: updatePayload.configuration ?? defaultConfig,
  };
}

async function loadCompanyOptions(): Promise<CompanyOption[]> {
  const res = await getCompanies({ show_inactive: false });
  const list = Array.isArray(res) ? res : (res as { results?: unknown[] })?.results ?? (res as { data?: unknown[] })?.data ?? [];
  const arr = Array.isArray(list) ? list : [];
  return arr.map((c: { company_id?: string; id?: string; name?: string }) => ({
    id: c.company_id ?? c.id ?? "",
    company_id: c.company_id ?? c.id,
    name: c.name ?? "",
  }));
}

function validationItem(id: string, label: string, checked: boolean, okMsg: string, failMsg: string): ValidationItemType {
  return { id, label, checked, message: checked ? okMsg : failMsg };
}

function getBasicValidationItem(form: CreateBotPayload): ValidationItemType {
  const ok = !!(form.name?.trim() && form.company && form.description?.trim());
  return validationItem("basic", "Basic Information", ok, `Bot "${form.name?.trim()}", company and description set`, "Provide bot name, company and description");
}

function getConfigValidationItem(cfg: BotConfiguration): ValidationItemType {
  const ok = !!(cfg.instructions?.trim() && cfg.knowledge_base?.trim());
  return validationItem("config", "Configuration", ok, "Instructions and knowledge base configured", "Instructions and knowledge base are required");
}

function getVoiceValidationItem(cfg: BotConfiguration): ValidationItemType {
  const ok = !!(cfg.voice_name && cfg.greeting_message?.trim() && cfg.voice_instructions?.trim());
  return validationItem("voice", "Voice Settings", ok, "Voice, greeting and voice instructions set", "Set voice, greeting message and voice instructions");
}

function getLlmValidationItem(cfg: BotConfiguration): ValidationItemType {
  const ok = !!(cfg.llm_model && cfg.max_tokens);
  return validationItem("llm", "LLM Settings", ok, `${cfg.llm_model}, max ${cfg.max_tokens} tokens`, "Select LLM model and max tokens");
}

function getBehaviorValidationItem(cfg: BotConfiguration): ValidationItemType {
  const ok = !!cfg.transfer_number?.trim();
  return validationItem("behavior", "Behavior", ok, "Transfer number configured", "Transfer number is required");
}

function getSipValidationItem(cfg: BotConfiguration): ValidationItemType {
  const ok = !!(cfg.sip_trunk_id?.trim() && cfg.phone_number?.trim());
  return validationItem("sip", "SIP Settings", ok, "SIP trunk ID and phone number set", "SIP Trunk ID and phone number are required");
}

function buildValidationItemsList(form: CreateBotPayload, cfg: BotConfiguration): ValidationItemType[] {
  return [
    getBasicValidationItem(form),
    getConfigValidationItem(cfg),
    getVoiceValidationItem(cfg),
    getLlmValidationItem(cfg),
    getBehaviorValidationItem(cfg),
    getSipValidationItem(cfg),
  ];
}

function getValidationItems(form: CreateBotPayload): ValidationItemType[] {
  return buildValidationItemsList(form, form.configuration ?? defaultConfig);
}

async function submitBotForm(
  form: CreateBotPayload,
  isEditMode: boolean,
  botId: string | undefined,
  router: ReturnType<typeof useRouter>
): Promise<void> {
  try {
    if (isEditMode && botId) {
      await putBot(botId, buildUpdatePayload(form));
      toast.success("Bot updated");
    } else {
      await postBots(buildCreateBotPayload(form));
      toast.success("Bot created");
    }
    router.push("/voicebot/inbound/bots");
  } catch (err: unknown) {
    const axErr = err as { response?: { data?: { detail?: string } }; message?: string };
    toast.error(axErr?.response?.data?.detail ?? axErr?.message ?? (isEditMode ? "Failed to update bot" : "Failed to create bot"));
  }
}

const LoadingBotPlaceholder = () => (
  <React.Fragment>
    <BreadcrumbItem mainTitle="" mainLink="" subTitle="Voicebot Inbound - Bots - Edit" />
    <PageHeader title="Edit Inbound Bot" showSearch={false} />
    <div className="d-flex justify-content-center align-items-center p-5">
      <Spinner animation="border" />
    </div>
  </React.Fragment>
);

function useTabNavigation(activeTab: string, setActiveTab: (tab: string) => void) {
  const currentIndex = TAB_ORDER.indexOf(activeTab);
  const goPrev = () => {
    if (currentIndex > 0) setActiveTab(TAB_ORDER[currentIndex - 1]);
  };
  const goNext = () => {
    if (currentIndex < TAB_ORDER.length - 1) setActiveTab(TAB_ORDER[currentIndex + 1]);
  };
  return { isFirstTab: currentIndex <= 0, isLastTab: currentIndex >= TAB_ORDER.length - 1, goPrev, goNext };
}

function useSessionCompany() {
  const { data: session } = useSession();
  const isAdmin = String(session?.user?.is_admin ?? "") === "1";
  const userCompanyIdentifier = (session?.user as { company_identifier?: string } | undefined)?.company_identifier ?? "";
  const userCompanyName = (session?.user as { company_name?: string } | undefined)?.company_name ?? userCompanyIdentifier;
  return { isAdmin, userCompanyIdentifier, userCompanyName };
}

function useCompanies(setForm: React.Dispatch<React.SetStateAction<CreateBotPayload>>) {
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  useEffect(() => {
    setLoadingCompanies(true);
    loadCompanyOptions()
      .then((opts) => {
        setCompanies(opts);
        if (opts.length > 0) setForm((f) => (f.company ? f : { ...f, company: opts[0].id }));
      })
      .catch(() => {
        toast.error("Failed to load companies");
        setCompanies([]);
      })
      .finally(() => setLoadingCompanies(false));
  }, [setForm]);
  return { companies, setCompanies, loadingCompanies };
}

function useBotLoader(
  botId: string | undefined,
  isEditMode: boolean,
  setForm: React.Dispatch<React.SetStateAction<CreateBotPayload>>,
  router: ReturnType<typeof useRouter>
) {
  const [loadingBot, setLoadingBot] = useState(isEditMode);
  useEffect(() => {
    if (isEditMode && botId) {
    setLoadingBot(true);
    getBot(botId)
      .then((data: Record<string, unknown>) => {
        const company = toFormString(data.company);
        const configuration = { ...defaultConfig, ...(data.configuration as Record<string, unknown>) };
        setForm({
          company,
          name: toFormString(data.name),
          description: toFormString(data.description),
          status: toFormString(data.status) || "draft",
          configuration: configuration as BotConfiguration,
        });
      })
      .catch(() => {
        toast.error("Failed to load bot");
        router.push("/voicebot/inbound/bots");
      })
      .finally(() => setLoadingBot(false));
    }
  }, [isEditMode, botId, router, setForm]);
  return loadingBot;
}

const VoicebotInboundBotsCreate = () => {
  const router = useRouter();
  const botId = typeof router.query.id === "string" ? router.query.id : undefined;
  const isEditMode = Boolean(botId);
  const pageCopy = getPageCopy(isEditMode);
  const { isAdmin, userCompanyIdentifier, userCompanyName } = useSessionCompany();
  const [activeTab, setActiveTab] = useState<string>(TAB_KEYS.basic);
  const [form, setForm] = useState<CreateBotPayload>({
    company: "",
    name: "",
    description: "",
    status: "draft",
    configuration: { ...defaultConfig },
  });
  const { companies, loadingCompanies } = useCompanies(setForm);
  const loadingBot = useBotLoader(botId, isEditMode, setForm, router);
  const [submitting, setSubmitting] = useState(false);
  const [expandedValidation, setExpandedValidation] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin && userCompanyIdentifier) setForm((f) => ({ ...f, company: userCompanyIdentifier }));
  }, [isAdmin, userCompanyIdentifier]);

  const updateConfig = (key: keyof BotConfiguration, value: unknown) => {
    setForm((f) => ({
      ...f,
      configuration: { ...f.configuration, [key]: value },
    }));
  };

  const submit = () => {
    if (!validateFormAndToast(form)) return Promise.resolve();
    setSubmitting(true);
    return submitBotForm(form, isEditMode, botId, router).finally(() => setSubmitting(false));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit();
  };

  const handleCancel = () => {
    router.push("/voicebot/inbound/bots");
  };

  const { isFirstTab, isLastTab, goPrev, goNext } = useTabNavigation(activeTab, setActiveTab);

  const cfg = form.configuration ?? defaultConfig;
  const validationItems = getValidationItems(form);

  const inputStyle = {
    width: "100%" as const,
    padding: "10px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    fontSize: "14px",
    color: "#1f2937",
  };
  const labelStyle = {
    display: "block" as const,
    fontSize: "13px",
    fontWeight: 500 as const,
    color: "#6b7280",
    marginBottom: "6px",
  };

  if (loadingBot) return <LoadingBotPlaceholder />;

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle={pageCopy.breadcrumbSubTitle} />
      <PageHeader title={pageCopy.title} showSearch={false} />

      {/* Tab navigation */}
      <TabsNavigation tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <Form
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.preventDefault();
        }}
      >
        <div style={{ maxWidth: "1600px", margin: "0 auto", padding: "24px 0" }}>
          <div
            className="content-grid inbound-bot-create-grid"
            style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "24px", alignItems: "start" }}
          >
            {/* Left column - form card */}
            <div>
              <div
                style={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  padding: "24px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k ?? TAB_KEYS.basic)}>
                  <Tab.Content>
                    <BasicInfoPane
                      form={form}
                      setForm={setForm}
                      isAdmin={isAdmin}
                      companies={companies}
                      loadingCompanies={loadingCompanies}
                      isEditMode={isEditMode}
                      userCompanyIdentifier={userCompanyIdentifier}
                      userCompanyName={userCompanyName}
                      labelStyle={labelStyle}
                      inputStyle={inputStyle}
                    />
                    <Tab.Pane eventKey={TAB_KEYS.configuration}>
                      <h6 style={{ margin: "0 0 20px 0", fontSize: "16px", fontWeight: 600, color: "#1f2937" }}>
                        Configuration
                      </h6>
                      <Form.Group className="mb-3">
                        <Form.Label className="d-flex align-items-center gap-1" style={labelStyle}>
                          Instructions *
                          <OverlayTrigger
                            placement="top"
                            overlay={
                              <Tooltip id="instructions-tooltip">
                                System instructions for the bot behavior.
                              </Tooltip>
                            }
                          >
                            <span className="text-muted" style={{ cursor: "pointer" }}>
                              <HelpCircle size={14} />
                            </span>
                          </OverlayTrigger>
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={cfg.instructions ?? ""}
                          onChange={(e) => updateConfig("instructions", e.target.value)}
                          required
                          placeholder="You are a helpful AI assistant..."
                          style={{ ...inputStyle, resize: "vertical" as const }}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label className="d-flex align-items-center gap-1" style={labelStyle}>
                          Knowledge Base *
                          <OverlayTrigger
                            placement="top"
                            overlay={
                              <Tooltip id="kb-tooltip">
                                Q&A or context the bot can use. e.g. Q1. Question? A1. Answer...
                              </Tooltip>
                            }
                          >
                            <span className="text-muted" style={{ cursor: "pointer" }}>
                              <HelpCircle size={14} />
                            </span>
                          </OverlayTrigger>
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={cfg.knowledge_base ?? ""}
                          onChange={(e) => updateConfig("knowledge_base", e.target.value)}
                          placeholder={'Q1. What is this company?\nA1. We provide excellent services...'}
                          required
                          style={{ ...inputStyle, resize: "vertical" as const }}
                        />
                      </Form.Group>
                    </Tab.Pane>
                    <Tab.Pane eventKey={TAB_KEYS.voice}>
                      <h6 style={{ margin: "0 0 20px 0", fontSize: "16px", fontWeight: 600, color: "#1f2937" }}>
                        Voice Settings
                      </h6>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div>
                          <Form.Group className="mb-3">
                            <Form.Label style={labelStyle}>Voice</Form.Label>
                            <Form.Select
                              value={cfg.voice_name ?? "alloy"}
                              onChange={(e) => updateConfig("voice_name", e.target.value)}
                              style={inputStyle}
                            >
                              {VOICE_OPTIONS.map((v) => (
                                <option key={v} value={v}>{v}</option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label style={labelStyle}>Voice Model</Form.Label>
                            <Form.Control
                              value={cfg.voice_model ?? ""}
                              onChange={(e) => updateConfig("voice_model", e.target.value)}
                              placeholder="gpt-4o-mini-tts"
                              disabled
                              style={inputStyle}
                            />
                          </Form.Group>
                        </div>
                        <div>
                          <Form.Group className="mb-3">
                            <Form.Label style={labelStyle}>Voice Speed ({(cfg.voice_speed ?? 1).toFixed(2)})</Form.Label>
                            <Form.Range
                              min={0.5}
                              max={2}
                              step={0.01}
                              value={cfg.voice_speed ?? 1}
                              onChange={(e) => updateConfig("voice_speed", Number.parseFloat(e.target.value))}
                            />
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#6b7280" }}>
                              <span>0.50</span>
                              <span>2.00</span>
                            </div>
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label style={labelStyle}>Voice Instructions *</Form.Label>
                            <Form.Control
                              value={cfg.voice_instructions ?? ""}
                              onChange={(e) => updateConfig("voice_instructions", e.target.value)}
                              placeholder="Voice-specific instructions"
                              required
                              style={inputStyle}
                            />
                          </Form.Group>
                        </div>
                      </div>
                      <Form.Group className="mb-3">
                        <Form.Label style={labelStyle}>Greeting Message</Form.Label>
                        <Form.Control
                          value={cfg.greeting_message ?? ""}
                          onChange={(e) => updateConfig("greeting_message", e.target.value)}
                          placeholder="Hello! I'm here to help you. How can I assist you today?"
                          style={inputStyle}
                        />
                      </Form.Group>
                    </Tab.Pane>
                    <Tab.Pane eventKey={TAB_KEYS.llm}>
                      <h6 style={{ margin: "0 0 20px 0", fontSize: "16px", fontWeight: 600, color: "#1f2937" }}>
                        LLM Settings
                      </h6>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                        <div>
                          <Form.Group className="mb-3">
                            <Form.Label style={labelStyle}>LLM Model</Form.Label>
                            <Form.Select
                              value={cfg.llm_model ?? "gpt-4o-mini"}
                              onChange={(e) => updateConfig("llm_model", e.target.value)}
                              disabled
                              style={inputStyle}
                            >
                              {LLM_MODEL_OPTIONS.map((m) => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </div>
                        <div>
                          <Form.Group className="mb-3">
                            <Form.Label style={labelStyle}>Temperature ({(cfg.temperature ?? 0.7).toFixed(2)})</Form.Label>
                            <Form.Range
                              min={0}
                              max={1}
                              step={0.01}
                              value={cfg.temperature ?? 0.7}
                              onChange={(e) => updateConfig("temperature", Number.parseFloat(e.target.value))}
                            />
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#6b7280" }}>
                              <span>0.00</span>
                              <span>1.00</span>
                            </div>
                          </Form.Group>
                        </div>
                        <div>
                          <Form.Group className="mb-3">
                            <Form.Label style={labelStyle}>Max Tokens</Form.Label>
                            <Form.Control
                              type="number"
                              min={100}
                              max={4000}
                              step={100}
                              value={cfg.max_tokens ?? 1000}
                              onChange={(e) => updateConfig("max_tokens", Number.parseInt(e.target.value, 10) || 1000)}
                              style={inputStyle}
                            />
                          </Form.Group>
                        </div>
                      </div>
                    </Tab.Pane>
                    <Tab.Pane eventKey={TAB_KEYS.behavior}>
                      <h6 style={{ margin: "0 0 20px 0", fontSize: "16px", fontWeight: 600, color: "#1f2937" }}>
                        Behavior Settings
                      </h6>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                        <div>
                          <Form.Group className="mb-3">
                            <Form.Check
                              type="switch"
                              id="transfer-enabled"
                              label="Enable Transfer"
                              checked={!!cfg.transfer_enabled}
                              onChange={(e) => updateConfig("transfer_enabled", e.target.checked)}
                            />
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label style={labelStyle}>Transfer Number *</Form.Label>
                            <Form.Control
                              value={cfg.transfer_number ?? ""}
                              onChange={(e) => updateConfig("transfer_number", e.target.value)}
                              placeholder="Transfer number"
                              required
                              style={inputStyle}
                            />
                          </Form.Group>
                        </div>
                        <div>
                          <Form.Group className="mb-3">
                            <Form.Label style={labelStyle}>Max Duration (seconds)</Form.Label>
                            <Form.Control
                              type="number"
                              min={60}
                              step={60}
                              value={cfg.max_duration ?? 1800}
                              onChange={(e) => updateConfig("max_duration", Number.parseInt(e.target.value, 10) || 1800)}
                              style={inputStyle}
                            />
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label style={labelStyle}>Idle Timeout (seconds)</Form.Label>
                            <Form.Control
                              type="number"
                              min={30}
                              step={30}
                              value={cfg.idle_timeout ?? 300}
                              onChange={(e) => updateConfig("idle_timeout", Number.parseInt(e.target.value, 10) || 300)}
                              style={inputStyle}
                            />
                          </Form.Group>
                        </div>
                        <div>
                          <Form.Group className="mb-3">
                            <Form.Check
                              type="switch"
                              id="allow-interruptions"
                              label="Allow Interruptions"
                              checked={!!cfg.allow_interruptions}
                              onChange={(e) => updateConfig("allow_interruptions", e.target.checked)}
                            />
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Check
                              type="switch"
                              id="noise-cancellation"
                              label="Noise Cancellation"
                              checked={!!cfg.noise_cancellation}
                              onChange={(e) => updateConfig("noise_cancellation", e.target.checked)}
                            />
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label style={labelStyle}>Min Endpointing Delay</Form.Label>
                            <Form.Control
                              type="number"
                              min={0}
                              max={1}
                              step={0.01}
                              value={cfg.min_endpointing_delay ?? 0.05}
                              onChange={(e) => updateConfig("min_endpointing_delay", Number.parseFloat(e.target.value) || 0.05)}
                              style={inputStyle}
                            />
                          </Form.Group>
                        </div>
                      </div>
                    </Tab.Pane>
                    <Tab.Pane eventKey={TAB_KEYS.sip}>
                      <h6 style={{ margin: "0 0 20px 0", fontSize: "16px", fontWeight: 600, color: "#1f2937" }}>
                        SIP Settings
                      </h6>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <Form.Group className="mb-3">
                          <Form.Label style={labelStyle}>SIP Trunk ID *</Form.Label>
                          <Form.Control
                            value={cfg.sip_trunk_id ?? ""}
                            onChange={(e) => updateConfig("sip_trunk_id", e.target.value)}
                            placeholder="SIP trunk identifier"
                            required
                            style={inputStyle}
                          />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label style={labelStyle}>Phone Number *</Form.Label>
                          <Form.Control
                            value={cfg.phone_number ?? ""}
                            onChange={(e) => updateConfig("phone_number", e.target.value)}
                            placeholder="Phone number"
                            required
                            style={inputStyle}
                          />
                        </Form.Group>
                      </div>
                    </Tab.Pane>
                  </Tab.Content>
                </Tab.Container>
              </div>
            </div>

            {/* Right column - Validation sidebar */}
            <div style={{ position: "sticky", top: "24px" }}>
              <div
                style={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <ValidationChecklist
                  items={validationItems}
                  expandedId={expandedValidation}
                  onToggle={setExpandedValidation}
                />
              </div>
            </div>
          </div>

          {/* Bottom action bar */}
          <BottomActionBar
            submitting={submitting}
            isFirstTab={isFirstTab}
            isLastTab={isLastTab}
            onCancel={handleCancel}
            onPrev={goPrev}
            onNext={goNext}
            onFinalSubmit={() => {
              submit();
            }}
            finalActionLabel={pageCopy.finalActionLabel}
            canSubmitFinal={Boolean(form.company && form.name?.trim())}
          />
        </div>
      </Form>

      <style>{`
        .inbound-bot-create-grid select:focus,
        .inbound-bot-create-grid input:focus,
        .inbound-bot-create-grid textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        @media (max-width: 1200px) {
          .inbound-bot-create-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </React.Fragment>
  );
};

VoicebotInboundBotsCreate.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default VoicebotInboundBotsCreate;
