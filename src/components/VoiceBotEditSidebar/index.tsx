import React, { useState, useEffect, useCallback } from "react";
import { Form, Spinner, Row, Col, Button } from "react-bootstrap";
import { toast } from "react-toastify";
import {
  X,
  FileText,
  Mic,
  MessageSquare,
  Phone,
  ChevronDown,
} from "lucide-react";
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
import { normalizeCompaniesResponse, type CompanyOption } from "@utils/companyOptions";
import { useSession } from "next-auth/react";

// ─── Types ──────────────────────────────────────────────────────────────────

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

export interface VoicebotEditSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  botId?: string;
  companyId?: string;
  onSaved?: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SECTION_KEYS = {
  basic: "basic",
  voice: "voice",
  prompts: "prompts",
  call: "call",
} as const;

type SectionKey = (typeof SECTION_KEYS)[keyof typeof SECTION_KEYS];

const defaultForm: OutboundVoicebotFormState = {
  company_id: "",
  name: "",
  trunk_id: "",
  description: "",
  system_prompt: "",
  first_message: "",
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getVoicebotDetail(res: Record<string, unknown>): Record<string, unknown> {
  return ((res as { data?: unknown }).data ?? res) as Record<string, unknown>;
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

function getSubmitError(form: OutboundVoicebotFormState): string | null {
  if (!form.company_id || !form.name?.trim()) return "Company and Bot Name are required";
  if (!form.trunk_id?.trim()) return "Select Trunk is required";
  if (!form.first_message?.trim()) return "Default Greeting is required";
  if (!form.system_prompt?.trim()) return "Default System Prompt is required";
  return null;
}

// ─── Styles (matching GenericSidebarNew) ─────────────────────────────────────

const sidebarStyles = {
  overlay: {
    position: "fixed" as const,
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 1050,
  },
  container: {
    position: "fixed" as const,
    top: 0,
    right: 0,
    width: "470px",
    height: "100vh",
    zIndex: 1051,
    display: "flex" as const,
    flexDirection: "column" as const,
    backgroundColor: "#f0f0f0",
    animation: "slideInRight 0.3s ease-out",
    boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
  },
  header: {
    padding: "20px 24px",
    border: "1px solid #cccccc",
    backgroundColor: "#ffffff",
    flexShrink: 0 as const,
    borderRadius: "10px 10px 0 0",
  },
  headerInner: {
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },
  title: {
    fontSize: "20px",
    fontWeight: "500" as const,
    color: "#141414",
    margin: 0,
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    padding: "4px",
    cursor: "pointer",
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    color: "#718096",
    borderRadius: "4px",
    transition: "all 0.2s",
  },
  scrollContent: {
    flex: 1,
    overflowY: "auto" as const,
    backgroundColor: "#f0f0f0",
    padding: "16px",
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: "10px",
    padding: "0",
    marginBottom: "12px",
    border: "1px solid #cccccc",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)",
    overflow: "hidden",
  },
  sectionHeaderBtn: {
    width: "100%",
    border: "none",
    background: "#ffffff",
    padding: "14px 20px",
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "flex-start" as const,
    gap: "10px",
    cursor: "pointer",
    textAlign: "left" as const,
    outline: "none",
  },
  sectionHeaderTitle: {
    display: "flex" as const,
    alignItems: "center" as const,
    gap: "8px",
    fontSize: "16px",
    fontWeight: 600 as const,
    color: "#141414",
    margin: 0,
    lineHeight: "1.2",
  },
  sectionBody: {
    padding: "20px",
    paddingRight: "10px",
  },
  footer: {
    padding: "16px 24px",
    backgroundColor: "#ffffff",
    borderTop: "1px solid #cccccc",
    display: "flex" as const,
    justifyContent: "flex-end" as const,
    gap: "10px",
    flexShrink: 0 as const,
  },
  label: {
    display: "block" as const,
    fontSize: "13px",
    fontWeight: 500 as const,
    color: "#6b7280",
    marginBottom: "6px",
  },
  input: {
    width: "100%",
    padding: "9px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    fontSize: "13px",
    color: "#141414",
    backgroundColor: "#ffffff",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

const VoicebotEditSidebar: React.FC<VoicebotEditSidebarProps> = ({
  isOpen,
  onClose,
  botId,
  companyId,
  onSaved,
}) => {
  const { data: session } = useSession();
  const isAdmin = String(session?.user?.is_admin ?? "") === "1";
  const userCompanyIdentifier =
    (session?.user as { company_identifier?: string })?.company_identifier ?? "";
  const userCompanyName =
    (session?.user as { company_name?: string })?.company_name ?? userCompanyIdentifier;
  const isEditMode = Boolean(botId);

  const [form, setForm] = useState<OutboundVoicebotFormState>({ ...defaultForm });
  const [loadingBot, setLoadingBot] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [trunks, setTrunks] = useState<Array<{ id: string; trunk_id?: string; name?: string }>>([]);
  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    basic: true,
    voice: true,
    prompts: true,
    call: true,
  });

  const fetchCompanies = useCallback(async () => {
    setLoadingCompanies(true);
    try {
      const res = await GetCompanies();
      if (res === false) { setCompanies([]); return; }
      const opts = normalizeCompaniesResponse(res, { prefer: "company_id" }).map((c: { id: string; company_id?: string; identifier?: string; name: string }) => ({
        id: c.id,
        company_id: c.company_id ?? c.identifier ?? c.id,
        name: c.name,
      }));
      setCompanies(opts);
    } catch {
      setCompanies([]);
    } finally {
      setLoadingCompanies(false);
    }
  }, []);

  const fetchTrunks = useCallback(async () => {
    try {
      const res = await getTrunks();
      const list = Array.isArray(res)
        ? res
        : (
            (res as { results?: unknown[]; data?: unknown[] })?.results ??
            (res as { results?: unknown[]; data?: unknown[] })?.data ??
            []
          );
      const rows = (Array.isArray(list) ? list : []).map(
        (r: { trunk_id?: string; id?: string; name?: string }, i: number) => ({
          id: r.trunk_id ?? r.id ?? `trunk-${i}`,
          trunk_id: r.trunk_id ?? r.id,
          name: r.name ?? r.trunk_id ?? r.id ?? "",
        }),
      );
      setTrunks(rows);
    } catch {
      setTrunks([]);
    }
  }, []);

  // Load bot data for edit mode when sidebar opens
  useEffect(() => {
    if (!isOpen || !botId) return;
    setLoadingBot(true);
    setExpandedSections({
      basic: true,
      voice: true,
      prompts: true,
      call: true,
    });
    fetchCompanies();
    fetchTrunks();
    getVoicebot(botId, companyId ? { company_id: companyId } : undefined)
      .then((res: Record<string, unknown>) => {
        const d = getVoicebotDetail(res);
        setForm({
          company_id: toFormString(d.company_id),
          name: toFormString(d.name),
          description: toFormString(d.description),
          system_prompt:
            firstString(d.default_system_prompt, d.system_prompt) || defaultForm.system_prompt,
          first_message:
            firstString(d.default_greeting, d.first_message) || defaultForm.first_message,
          llm_model: typeof d.llm_model === "string" ? d.llm_model : defaultForm.llm_model,
          tts_model: typeof d.tts_model === "string" ? d.tts_model : defaultForm.tts_model,
          stt_model: typeof d.stt_model === "string" ? d.stt_model : defaultForm.stt_model,
          voice: firstString(d.voice, d.voice_model) || defaultForm.voice,
          temperature: Number(d.temperature ?? defaultForm.temperature),
          max_tokens: Number(d.max_tokens ?? defaultForm.max_tokens),
          transfer_number: toFormString(d.transfer_number),
          enable_transfer: Boolean(d.enable_transfer ?? false),
          idle_timeout_seconds: Number(
            d.idle_timeout_seconds ?? d.idle_timeout ?? defaultForm.idle_timeout_seconds,
          ),
          max_call_duration_seconds: Number(
            d.max_call_duration_seconds ??
              d.max_call_duration ??
              defaultForm.max_call_duration_seconds,
          ),
          status: typeof d.status === "string" ? d.status : defaultForm.status,
          trunk_id: typeof d.trunk_id === "string" ? d.trunk_id : "",
          language: typeof d.language === "string" ? d.language : defaultForm.language,
          concurrency_limit: Number(d.concurrency_limit ?? defaultForm.concurrency_limit),
        });
      })
      .catch(() => {
        toast.error("Failed to load voice bot");
        onClose();
      })
      .finally(() => setLoadingBot(false));
  }, [isOpen, botId, companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize create mode (no prefilled bot data).
  useEffect(() => {
    if (!isOpen || isEditMode) return;

    setForm({
      ...defaultForm,
      company_id: companyId || (isAdmin ? "" : userCompanyIdentifier),
    });
    setLoadingBot(false);
    setExpandedSections({
      basic: true,
      voice: true,
      prompts: true,
      call: true,
    });
    fetchCompanies();
    fetchTrunks();
  }, [
    isOpen,
    isEditMode,
    companyId,
    isAdmin,
    userCompanyIdentifier,
    fetchCompanies,
    fetchTrunks,
  ]);

  const handleSave = () => {
    const err = getSubmitError(form);
    if (err) { toast.error(err); return; }
    setSubmitting(true);
    (isEditMode
      ? putVoicebot(String(botId), buildUpdatePayload(form))
      : postVoicebots(buildCreatePayload(form))
    )
      .then(() => {
        toast.success(isEditMode ? "Voice bot updated" : "Voice bot created");
        onSaved?.();
        onClose();
      })
      .catch((e: { response?: { data?: { detail?: string } }; message?: string }) => {
        toast.error(e?.response?.data?.detail || e?.message || "Update failed");
      })
      .finally(() => setSubmitting(false));
  };

  if (!isOpen) return null;

  const set = (key: keyof OutboundVoicebotFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const setNum = (key: keyof OutboundVoicebotFormState, fallback: number) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value ? Number(e.target.value) : fallback }));

  const toggleSection = (section: SectionKey) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const getSaveButtonContent = () => {
    if (submitting) {
      return (
        <>
          <Spinner animation="border" size="sm" className="me-1" />
          Saving…
        </>
      );
    }
    return isEditMode ? "Update Voice Bot" : "Create Voice Bot";
  };

  const renderSectionCard = (
    section: SectionKey,
    title: string,
    Icon: React.ComponentType<{ size?: number }>,
    content: React.ReactNode,
  ) => {
    const isCollapsed = !expandedSections[section];

    return (
      <div style={sidebarStyles.formCard}>
        <button
          type="button"
          style={{
            ...sidebarStyles.sectionHeaderBtn,
            borderBottom: isCollapsed ? "none" : "1px solid #eaf0f6",
          }}
          onClick={() => toggleSection(section)}
          aria-expanded={!isCollapsed}
        >
          <ChevronDown
            size={18}
            style={{
              color: "#141414",
              transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          />
          <h3 style={sidebarStyles.sectionHeaderTitle}>
            <Icon size={16} />
            {title}
          </h3>
        </button>
        {!isCollapsed && <div style={sidebarStyles.sectionBody}>{content}</div>}
      </div>
    );
  };

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .vb-edit-sidebar input:focus,
        .vb-edit-sidebar select:focus,
        .vb-edit-sidebar textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 2px rgba(102,126,234,0.15);
        }
        .vb-edit-close-btn:hover {
          color: #2d3748 !important;
          background-color: #f7fafc !important;
        }
      `}</style>

      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close sidebar"
        style={{ ...sidebarStyles.overlay, border: "none", padding: 0, cursor: "default" }}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <div style={sidebarStyles.container} className="vb-edit-sidebar">

        {/* Header */}
        <div style={sidebarStyles.header}>
          <div style={sidebarStyles.headerInner}>
            <h2 style={sidebarStyles.title}>{isEditMode ? "Edit Voice Bot" : "Create Voice Bot"}</h2>
            <button
              style={sidebarStyles.closeBtn}
              className="vb-edit-close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={sidebarStyles.scrollContent} className="sidebar-scrollbar">
          {loadingBot ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "200px",
              }}
            >
              <Spinner animation="border" style={{ color: "#6b7280" }} />
            </div>
          ) : (
            <Form onSubmit={(e) => e.preventDefault()}>
              {renderSectionCard(
                SECTION_KEYS.basic,
                "Basic Information",
                FileText,
                <>
                  <Form.Group className="mb-3" controlId="vb-name">
                      <Form.Label style={sidebarStyles.label}>
                        Bot Name <span style={{ color: "#ef4444" }}>*</span>
                      </Form.Label>
                      <Form.Control
                        value={form.name}
                        onChange={set("name")}
                        placeholder="e.g. Sales Bot"
                        style={sidebarStyles.input}
                      />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="vb-description">
                      <Form.Label style={sidebarStyles.label}>Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={form.description ?? ""}
                        onChange={set("description")}
                        placeholder="AI bot for sales calls"
                        style={{ ...sidebarStyles.input, resize: "vertical" }}
                      />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="vb-company">
                      <Form.Label style={sidebarStyles.label}>
                        Company <span style={{ color: "#ef4444" }}>*</span>
                      </Form.Label>
                      <Form.Select
                        value={isAdmin ? form.company_id : userCompanyIdentifier}
                        onChange={(e) => {
                          if (isAdmin) setForm((f) => ({ ...f, company_id: e.target.value }));
                        }}
                        disabled={loadingCompanies || !isAdmin}
                        style={sidebarStyles.input}
                      >
                        <option value="">Select company</option>
                        {isAdmin
                          ? companies.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))
                          : (
                              <option value={userCompanyIdentifier}>{userCompanyName}</option>
                            )}
                      </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="vb-trunk">
                      <Form.Label style={sidebarStyles.label}>
                        Trunk <span style={{ color: "#ef4444" }}>*</span>
                      </Form.Label>
                      <Form.Select
                        value={form.trunk_id ?? ""}
                        onChange={set("trunk_id")}
                        style={sidebarStyles.input}
                      >
                        <option value="">Select trunk</option>
                        {trunks.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name || t.id}
                          </option>
                        ))}
                      </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-0" controlId="vb-status">
                      <Form.Label style={sidebarStyles.label}>Status</Form.Label>
                      <Form.Select
                        value={form.status ?? "inactive"}
                        onChange={set("status")}
                        style={sidebarStyles.input}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </Form.Select>
                  </Form.Group>
                </>,
              )}

              {renderSectionCard(
                SECTION_KEYS.voice,
                "Voice Settings",
                Mic,
                <>
                  <Form.Group className="mb-3" controlId="vb-tts-provider">
                      <Form.Label style={sidebarStyles.label}>TTS Provider</Form.Label>
                      <Form.Select value="openai" disabled style={sidebarStyles.input}>
                        <option value="openai">openai</option>
                      </Form.Select>
                  </Form.Group>

                  <Row>
                    <Col xs={6}>
                      <Form.Group className="mb-3" controlId="vb-voice">
                          <Form.Label style={sidebarStyles.label}>Voice Model</Form.Label>
                          <Form.Control
                            value={form.voice ?? "onyx"}
                            disabled
                            style={sidebarStyles.input}
                          />
                      </Form.Group>
                    </Col>
                    <Col xs={6}>
                      <Form.Group className="mb-3" controlId="vb-language">
                          <Form.Label style={sidebarStyles.label}>Language</Form.Label>
                          <Form.Control
                            value={form.language ?? "en-US"}
                            disabled
                            style={sidebarStyles.input}
                          />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col xs={6}>
                      <Form.Group className="mb-3" controlId="vb-llm-model">
                          <Form.Label style={sidebarStyles.label}>LLM Model</Form.Label>
                          <Form.Control
                            value={form.llm_model ?? ""}
                            disabled
                            style={sidebarStyles.input}
                          />
                      </Form.Group>
                    </Col>
                    <Col xs={6}>
                      <Form.Group className="mb-0" controlId="vb-tts-model">
                          <Form.Label style={sidebarStyles.label}>TTS Model</Form.Label>
                          <Form.Control
                            value={form.tts_model ?? ""}
                            disabled
                            style={sidebarStyles.input}
                          />
                      </Form.Group>
                    </Col>
                  </Row>
                </>,
              )}

              {renderSectionCard(
                SECTION_KEYS.prompts,
                "Prompts",
                MessageSquare,
                <>
                  <Form.Group className="mb-3" controlId="vb-first-message">
                      <Form.Label style={sidebarStyles.label}>
                        Default Greeting <span style={{ color: "#ef4444" }}>*</span>
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        value={form.first_message ?? ""}
                        onChange={set("first_message")}
                        placeholder="Hello, this is an AI assistant..."
                        style={{ ...sidebarStyles.input, resize: "vertical" }}
                      />
                  </Form.Group>

                  <Form.Group className="mb-0" controlId="vb-system-prompt">
                      <Form.Label style={sidebarStyles.label}>
                        System Prompt <span style={{ color: "#ef4444" }}>*</span>
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={8}
                        value={form.system_prompt ?? ""}
                        onChange={set("system_prompt")}
                        placeholder="You are a professional AI assistant."
                        style={{ ...sidebarStyles.input, resize: "vertical" }}
                      />
                  </Form.Group>
                </>,
              )}

              {renderSectionCard(
                SECTION_KEYS.call,
                "Call Settings",
                Phone,
                <>
                  <Form.Group className="mb-3" controlId="vb-transfer-number">
                      <Form.Label style={sidebarStyles.label}>Transfer Number</Form.Label>
                      <Form.Control
                        value={form.transfer_number ?? ""}
                        onChange={set("transfer_number")}
                        placeholder="+1234567890"
                        style={sidebarStyles.input}
                      />
                  </Form.Group>

                  <Row>
                    <Col xs={6}>
                      <Form.Group className="mb-3" controlId="vb-concurrency-limit">
                          <Form.Label style={sidebarStyles.label}>Concurrency Limit</Form.Label>
                          <Form.Control
                            type="number"
                            min={1}
                            value={form.concurrency_limit ?? 10}
                            onChange={setNum("concurrency_limit", 10)}
                            style={sidebarStyles.input}
                          />
                      </Form.Group>
                    </Col>
                    <Col xs={6}>
                      <Form.Group className="mb-3" controlId="vb-max-duration">
                          <Form.Label style={sidebarStyles.label}>Max Duration (s)</Form.Label>
                          <Form.Control
                            type="number"
                            min={60}
                            value={form.max_call_duration_seconds ?? 1800}
                            onChange={setNum("max_call_duration_seconds", 1800)}
                            style={sidebarStyles.input}
                          />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-0" controlId="vb-idle-timeout">
                      <Form.Label style={sidebarStyles.label}>Idle Timeout (s)</Form.Label>
                      <Form.Control
                        type="number"
                        min={30}
                        value={form.idle_timeout_seconds ?? 300}
                        onChange={setNum("idle_timeout_seconds", 300)}
                        style={sidebarStyles.input}
                      />
                  </Form.Group>
                </>,
              )}
            </Form>
          )}
        </div>

        {/* Footer actions */}
        <div style={sidebarStyles.footer}>
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            onClick={onClose}
            disabled={submitting}
            style={{ fontSize: "13px", fontWeight: 500 }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={
              submitting ||
              loadingBot ||
              !form.company_id ||
              !form.name?.trim() ||
              !form.trunk_id?.trim() ||
              !form.first_message?.trim() ||
              !form.system_prompt?.trim()
            }
            style={{
              fontSize: "13px",
              fontWeight: 500,
              backgroundColor: "#141414",
              borderColor: "#141414",
            }}
          >
            {getSaveButtonContent()}
          </Button>
        </div>
      </div>
    </>
  );
};

export default VoicebotEditSidebar;
