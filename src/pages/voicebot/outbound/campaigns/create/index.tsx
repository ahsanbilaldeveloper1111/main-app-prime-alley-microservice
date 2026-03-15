import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect, useCallback } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  postCampaigns,
  getCampaign,
  putCampaign,
  getVoicebots,
  type CreateCampaignPayload,
  type UpdateCampaignPayload,
} from "@utils/voicebot/outbound";
import { toFormString } from "@utils/voicebot/formDisplay";
import { getCompanies } from "@utils/voicebot/inbound";
import { Form, Spinner, Tab, Row, Col, Button } from "react-bootstrap";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import PageHeader from "@components/PageHeader";
import { FileText, Users, MessageSquare, Check, Upload, Download } from "lucide-react";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

interface CompanyOption {
  id: string;
  company_id?: string;
  name: string;
}

interface VoicebotOption {
  id: number | string;
  name: string;
}

interface CreateCampaignFormState extends CreateCampaignPayload {
  target_list_raw?: string;
  campaign_script?: string;
  custom_greeting?: string;
  input_method?: "manual" | "csv";
}

const defaultForm: CreateCampaignFormState = {
  company_id: "",
  name: "",
  description: "",
  voicebot_id: undefined,
  target_list_raw: "",
  campaign_script: "",
  custom_greeting: "",
  input_method: "manual",
  schedule_start: "",
  schedule_end: "",
  retry_attempts: 3,
  retry_interval_minutes: 60,
  status: "draft",
};

/** Normalize a phone string to E.164 (+ and digits only, 10–15 digits). Returns null if invalid. */
function normalizeToE164(raw: string): string | null {
  const digitsOnly = raw.replaceAll(/\D/g, "");
  if (digitsOnly.length < 10 || digitsOnly.length > 15) return null;
  return `+${digitsOnly}`;
}

/** Parse raw text area or CSV line into E.164 numbers (one per line), skipping invalid. */
function parseTargetListToE164(text: string): string[] {
  const headerWords = new Set(["phone", "number", "tel", "telephone", "mobile", "contact"]);
  return text
    .split(/[\n\r,;]+/)
    .map((s) => s.trim().replaceAll(/^["']|["']$/g, ""))
    .filter((s) => s.length > 0 && !headerWords.has(s.toLowerCase()))
    .map((s) => normalizeToE164(s))
    .filter((s): s is string => s !== null);
}

const TAB_KEYS = { basic: "basic", targets: "targets", script: "script" } as const;
const TAB_ORDER = [TAB_KEYS.basic, TAB_KEYS.targets, TAB_KEYS.script];
const TABS = [
  { id: TAB_KEYS.basic, label: "Basic Information", icon: FileText },
  { id: TAB_KEYS.targets, label: "Target Numbers", icon: Users },
  { id: TAB_KEYS.script, label: "Script & Greeting", icon: MessageSquare },
];

interface CampaignFormPageProps {
  editCampaignId?: string;
  editCompanyId?: string;
}

function buildFormFromCampaignDetail(detail: Record<string, unknown>, editCompanyId: string): CreateCampaignFormState {
  const targetList = (detail.target_numbers as string[] | undefined) ?? (detail.target_list as string[] | undefined);
  const targetListRaw = Array.isArray(targetList) ? targetList.join("\n") : "";
  return {
    company_id: toFormString(detail.company_id ?? editCompanyId),
    name: toFormString(detail.name),
    description: toFormString(detail.description),
    voicebot_id: detail.voicebot_id == null ? undefined : Number(detail.voicebot_id),
    target_list_raw: targetListRaw,
    campaign_script: toFormString(detail.campaign_script),
    custom_greeting: toFormString(detail.custom_greeting),
    input_method: "manual",
    schedule_start: toFormString(detail.schedule_start),
    schedule_end: toFormString(detail.schedule_end),
    retry_attempts: Number(detail.retry_attempts ?? 3),
    retry_interval_minutes: Number(detail.retry_interval_minutes ?? 60),
    status: toFormString(detail.status) || "draft",
  };
}

async function submitCampaignForm(
  form: CreateCampaignFormState,
  isEditMode: boolean,
  editCampaignId: string | undefined,
  router: { push: (url: string) => void }
): Promise<void> {
  if (!form.company_id || !form.name?.trim()) {
    toast.error("Company and Campaign Name are required");
    return;
  }
  if (!isEditMode && !(form.campaign_script ?? "").trim()) {
    toast.error("Campaign Script is required");
    return;
  }
  if (isEditMode && editCampaignId) {
    const payload: UpdateCampaignPayload = {
      company_id: form.company_id || undefined,
      name: form.name,
      description: form.description || undefined,
      retry_attempts: form.retry_attempts,
      status: form.status || undefined,
      voicebot_id: form.voicebot_id,
      target_numbers: parseTargetListToE164(form.target_list_raw ?? ""),
      schedule_start: form.schedule_start || undefined,
      schedule_end: form.schedule_end || undefined,
      retry_interval_minutes: form.retry_interval_minutes,
      campaign_script: (form.campaign_script ?? "").trim(),
      custom_greeting: (form.custom_greeting ?? "").trim(),
    };
    await putCampaign(editCampaignId, payload);
    toast.success("Campaign updated");
    router.push("/voicebot/outbound/campaigns");
    return;
  }
  const targetList = parseTargetListToE164(form.target_list_raw ?? "");
  if (targetList.length === 0) {
    toast.error("Enter at least one valid phone number in E.164 format (e.g. +1234567890)");
    return;
  }
  const payload: CreateCampaignPayload & Record<string, unknown> = {
    company_id: form.company_id,
    name: form.name,
    description: form.description || undefined,
    voicebot_id: form.voicebot_id,
    target_numbers: targetList,
    schedule_start: form.schedule_start || undefined,
    schedule_end: form.schedule_end || undefined,
    retry_attempts: form.retry_attempts,
    retry_interval_minutes: form.retry_interval_minutes,
    status: form.status || undefined,
  };
  const script = (form.campaign_script ?? "").trim();
  const greeting = (form.custom_greeting ?? "").trim();
  if (script) payload.campaign_script = script;
  if (greeting) payload.custom_greeting = greeting;
  await postCampaigns(payload);
  router.push("/voicebot/outbound/campaigns");
}

function useLoadCampaignForEdit(
  editCampaignId: string | undefined,
  editCompanyId: string | undefined,
  isEditMode: boolean,
  setForm: React.Dispatch<React.SetStateAction<CreateCampaignFormState>>
): boolean {
  const [loadingCampaign, setLoadingCampaign] = useState(isEditMode);
  useEffect(() => {
    if (!isEditMode || !editCampaignId || !editCompanyId) {
      if (isEditMode) setLoadingCampaign(false);
      return;
    }
    let cancelled = false;
    setLoadingCampaign(true);
    getCampaign(editCampaignId, { company_id: editCompanyId })
      .then((res: Record<string, unknown>) => {
        if (cancelled) return;
        const detail = (res?.data ?? res) as Record<string, unknown>;
        setForm(buildFormFromCampaignDetail(detail, editCompanyId));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const e = err as { response?: { data?: { detail?: string } }; message?: string };
        toast.error(e?.response?.data?.detail ?? String(e?.message ?? "Failed to load campaign"));
      })
      .finally(() => {
        if (!cancelled) setLoadingCampaign(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isEditMode, editCampaignId, editCompanyId, setForm]);
  return loadingCampaign;
}

function useTabNavigation(activeTab: string, setActiveTab: (tab: string) => void) {
  const currentTabIndex = TAB_ORDER.indexOf(activeTab as typeof TAB_KEYS[keyof typeof TAB_KEYS]);
  const isFirstTab = currentTabIndex <= 0;
  const isLastTab = currentTabIndex >= TAB_ORDER.length - 1;
  const goPrev = useCallback(() => {
    if (currentTabIndex > 0) setActiveTab(TAB_ORDER[currentTabIndex - 1]);
  }, [currentTabIndex, setActiveTab]);
  const goNext = useCallback(() => {
    if (currentTabIndex < TAB_ORDER.length - 1) setActiveTab(TAB_ORDER[currentTabIndex + 1]);
  }, [currentTabIndex, setActiveTab]);
  return { isFirstTab, isLastTab, goPrev, goNext };
}

function parseCompaniesResponse(res: unknown): CompanyOption[] {
  if (res === false) return [];
  const list = Array.isArray(res)
    ? res
    : (res as { results?: Record<string, unknown>[] })?.results ??
      (res as { data?: Record<string, unknown>[] })?.data ??
      [];
  const arr = Array.isArray(list) ? list : [];
  return arr.map((c) => {
    const item = c as { company_id?: string; id?: string; identifier?: string; name?: string };
    const id = item.company_id ?? item.identifier ?? item.id ?? "";
    return { id, company_id: item.company_id ?? item.identifier ?? item.id, name: item.name ?? "" };
  });
}

function parseVoicebotsResponse(res: unknown): VoicebotOption[] {
  const list = Array.isArray(res)
    ? res
    : (res as { results?: { id?: number; name?: string }[] })?.results ??
      (res as { data?: { id?: number; name?: string }[] })?.data ??
      [];
  const arr = Array.isArray(list) ? list : [];
  return arr.map((v) => ({ id: v.id ?? "", name: (v as { name?: string }).name ?? "" }));
}

interface ValidationItem {
  id: string;
  label: string;
  checked: boolean;
}

function buildValidationItems(form: CreateCampaignFormState, targetCount: number): ValidationItem[] {
  const basicOk = Boolean(form.name?.trim() && form.company_id && (form.voicebot_id != null || true));
  const scriptOk = Boolean((form.campaign_script ?? "").trim());
  return [
    { id: "basic", label: "Basic Information", checked: basicOk },
    { id: "targets", label: "Target Numbers", checked: targetCount > 0 },
    { id: "script", label: "Script & Greeting", checked: scriptOk },
  ];
}

function renderCompanyOptions(
  companies: CompanyOption[],
  isAdmin: boolean,
  userCompanyIdentifier: string,
  userCompanyName: string
): React.ReactNode {
  if (isAdmin) return companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>);
  if (userCompanyIdentifier) return <option value={userCompanyIdentifier}>{userCompanyName || userCompanyIdentifier}</option>;
  return null;
}

const inputStyle = { width: "100%" as const, padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "14px", color: "#1f2937" };
const labelStyle = { display: "block" as const, fontSize: "13px", fontWeight: 500 as const, color: "#6b7280", marginBottom: "6px" };

interface CampaignFormBodyProps {
  isEditMode: boolean;
  loadingCampaign: boolean;
  form: CreateCampaignFormState;
  setForm: React.Dispatch<React.SetStateAction<CreateCampaignFormState>>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  companies: CompanyOption[];
  voicebots: VoicebotOption[];
  loadingCompanies: boolean;
  isAdmin: boolean;
  userCompanyIdentifier: string;
  userCompanyName: string;
  validationItems: ValidationItem[];
  targetCount: number;
  isFirstTab: boolean;
  isLastTab: boolean;
  goPrev: () => void;
  goNext: () => void;
  handleCancel: () => void;
  handleSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  csvInputRef: React.RefObject<HTMLInputElement | null>;
  handleCsvFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  downloadSampleCsv: () => void;
}

function CampaignFormBody(props: Readonly<CampaignFormBodyProps>) {
  const {
    isEditMode,
    loadingCampaign,
    form,
    setForm,
    activeTab,
    setActiveTab,
    companies,
    voicebots,
    loadingCompanies,
    isAdmin,
    userCompanyIdentifier,
    userCompanyName,
    validationItems,
    targetCount,
    isFirstTab,
    isLastTab,
    goPrev,
    goNext,
    handleCancel,
    handleSubmit,
    submitting,
    csvInputRef,
    handleCsvFileChange,
    downloadSampleCsv,
  } = props;
  const showSpinner = isEditMode && loadingCampaign;
  if (showSpinner) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
      </div>
    );
  }
  const isSubmitDisabled = submitting || !form.company_id || !form.name?.trim() || (isEditMode ? false : (!(form.campaign_script ?? "").trim() || targetCount === 0));
  return (
    <>
      <div className="content-grid campaign-create-grid" style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "24px", alignItems: "start" }}>
        <div>
          <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k ?? TAB_KEYS.basic)}>
              <Tab.Content>
                <Tab.Pane eventKey={TAB_KEYS.basic}>
                  <h6 style={{ margin: "0 0 20px 0", fontSize: "16px", fontWeight: 600, color: "#1f2937" }}>Basic Information</h6>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label style={labelStyle}>Campaign Name <span className="text-danger">*</span></Form.Label>
                        <Form.Control value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required placeholder="e.g. Q1 2026 Sales Campaign" style={inputStyle} />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label style={labelStyle}>Description</Form.Label>
                        <Form.Control as="textarea" rows={3} value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Lead generation campaign" style={{ ...inputStyle, resize: "vertical" as const }} />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      {isAdmin ? (
                        <Form.Group className="mb-3">
                          <Form.Label style={labelStyle}>Company <span className="text-danger">*</span></Form.Label>
                          <Form.Select
                            value={form.company_id}
                            onChange={(e) => setForm((f) => ({ ...f, company_id: e.target.value }))}
                            required
                            disabled={loadingCompanies}
                            style={inputStyle}
                          >
                            <option value="">Select company</option>
                            {renderCompanyOptions(companies, true, userCompanyIdentifier, userCompanyName)}
                          </Form.Select>
                        </Form.Group>
                      ) : null}
                      <Form.Group className="mb-3">
                        <Form.Label style={labelStyle}>Select VoiceBot</Form.Label>
                        <Form.Select value={form.voicebot_id ?? ""} onChange={(e) => setForm((f) => ({ ...f, voicebot_id: e.target.value ? Number(e.target.value) : undefined }))} style={inputStyle}>
                          <option value="">—</option>
                          {voicebots.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </Form.Select>
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label style={labelStyle}>Status</Form.Label>
                        <Form.Select value={form.status ?? "draft"} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} style={inputStyle}>
                          <option value="draft">Draft</option>
                          <option value="active">Active</option>
                          <option value="scheduled">Scheduled</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                </Tab.Pane>
                <Tab.Pane eventKey={TAB_KEYS.targets}>
                  <h6 style={{ margin: "0 0 20px 0", fontSize: "16px", fontWeight: 600, color: "#1f2937" }}>Target Numbers</h6>
                  <Form.Group className="mb-3">
                    <Form.Label style={labelStyle}>Input Method</Form.Label>
                    <div className="d-flex gap-3">
                      <Form.Check type="radio" id="input-manual" name="input_method" label="Manual Entry" checked={(form.input_method ?? "manual") === "manual"} onChange={() => setForm((f) => ({ ...f, input_method: "manual" }))} />
                      <Form.Check type="radio" id="input-csv" name="input_method" label="Upload CSV" checked={(form.input_method ?? "manual") === "csv"} onChange={() => setForm((f) => ({ ...f, input_method: "csv" }))} />
                    </div>
                  </Form.Group>
                  {(form.input_method ?? "manual") === "csv" && (
                    <Form.Group className="mb-3">
                      <Form.Label style={labelStyle}>Select CSV file</Form.Label>
                      <div className="d-flex align-items-center gap-2">
                        <input
                          ref={csvInputRef}
                          type="file"
                          accept=".csv,text/csv,text/plain"
                          onChange={handleCsvFileChange}
                          style={{ display: "none" }}
                          aria-label="Choose CSV file"
                        />
                        <Button
                          type="button"
                          variant="outline-primary"
                          onClick={() => csvInputRef.current?.click()}
                        >
                          <Upload size={16} className="me-1" />
                          Choose file
                        </Button>
                        <Form.Text className="text-muted">CSV or text with numbers (one per line or comma-separated)</Form.Text>
                      </div>
                    </Form.Group>
                  )}
                  <Form.Group className="mb-3">
                    <Form.Label style={labelStyle}>Phone Numbers (E.164, one per line) <span className="text-danger">*</span></Form.Label>
                    <div className="mb-2">
                      <Button type="button" variant="link" className="p-0 text-decoration-none" onClick={downloadSampleCsv} style={{ fontSize: "13px" }}>
                        <Download size={14} className="me-1 align-middle" />
                        Download sample CSV
                      </Button>
                    </div>
                    <Form.Control
                      as="textarea"
                      rows={6}
                      value={form.target_list_raw ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, target_list_raw: e.target.value }))}
                      placeholder="+1234567890\n+19876543210"
                      style={{ ...inputStyle, resize: "vertical" as const }}
                    />
                    <Form.Text className="text-muted">
                      E.164 format (e.g. +1234567890). Total valid numbers: {targetCount}
                    </Form.Text>
                  </Form.Group>
                </Tab.Pane>
                <Tab.Pane eventKey={TAB_KEYS.script}>
                  <h6 style={{ margin: "0 0 20px 0", fontSize: "16px", fontWeight: 600, color: "#1f2937" }}>Script & Greeting</h6>
                  <Form.Group className="mb-3">
                    <Form.Label style={labelStyle}>Campaign Script <span className="text-danger">*</span></Form.Label>
                    <Form.Control as="textarea" rows={4} value={form.campaign_script ?? ""} onChange={(e) => setForm((f) => ({ ...f, campaign_script: e.target.value }))} required placeholder="You are calling to discuss our new product..." style={{ ...inputStyle, resize: "vertical" as const }} />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label style={labelStyle}>Custom Greeting (optional)</Form.Label>
                    <Form.Control as="textarea" rows={3} value={form.custom_greeting ?? ""} onChange={(e) => setForm((f) => ({ ...f, custom_greeting: e.target.value }))} placeholder="Hello, this is John from ABC Company..." style={{ ...inputStyle, resize: "vertical" as const }} />
                  </Form.Group>
                </Tab.Pane>
              </Tab.Content>
            </Tab.Container>
          </div>
        </div>
        <div style={{ position: "sticky", top: "24px" }}>
          <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h6 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#1f2937" }}>Validation Checklist</h6>
              <span style={{ fontSize: "12px", color: "#6b7280" }}>{validationItems.filter((i) => i.checked).length}/{validationItems.length} Complete</span>
            </div>
            {validationItems.map((item, index) => (
              <div key={item.id} style={{ borderBottom: index < validationItems.length - 1 ? "1px solid #f3f4f6" : "none", paddingBottom: "12px", paddingTop: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: item.checked ? "#10b981" : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {item.checked ? <Check size={12} color="white" /> : null}
                  </div>
                  <span style={{ fontSize: "13px", color: "#374151" }}>{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #e5e7eb" }}>
        <div>
          {isFirstTab ? (
            <Button type="button" variant="outline-secondary" onClick={handleCancel}>Cancel</Button>
          ) : (
            <Button type="button" variant="outline-secondary" onClick={goPrev}>Previous</Button>
          )}
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          {isLastTab ? (
            <Button
              type="button"
              variant="primary"
              disabled={isSubmitDisabled}
              onClick={(e) => { e.preventDefault(); handleSubmit(e as unknown as React.FormEvent); }}
            >
              {submitting ? <Spinner animation="border" size="sm" className="me-1" /> : null}
              {isEditMode ? "Update Campaign" : "Create Campaign"}
            </Button>
          ) : (
            <Button type="button" variant="primary" onClick={goNext}>Next</Button>
          )}
        </div>
      </div>
    </>
  );
}

const CampaignCreatePage = (props: CampaignFormPageProps) => {
  const { editCampaignId, editCompanyId } = props;
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = String(session?.user?.is_admin ?? "") === "1";
  const userCompanyIdentifier = (session?.user as { company_identifier?: string })?.company_identifier ?? "";
  const userCompanyName = (session?.user as { company_name?: string })?.company_name ?? userCompanyIdentifier;

  const isEditMode = Boolean(editCampaignId && editCompanyId);

  const [activeTab, setActiveTab] = useState<string>(TAB_KEYS.basic);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [voicebots, setVoicebots] = useState<VoicebotOption[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(isAdmin);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateCampaignFormState>({ ...defaultForm });
  const csvInputRef = React.useRef<HTMLInputElement>(null);

  const loadingCampaign = useLoadCampaignForEdit(editCampaignId, editCompanyId, isEditMode, setForm);
  const { isFirstTab, isLastTab, goPrev, goNext } = useTabNavigation(activeTab, setActiveTab);

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      const numbers = parseTargetListToE164(text);
      setForm((f) => ({ ...f, target_list_raw: numbers.join("\n") }));
      toast.success(`Loaded ${numbers.length} number(s) in E.164 format from ${file.name}`);
    };
    reader.readAsText(file, "utf-8");
    e.target.value = "";
  };

  const downloadSampleCsv = () => {
    const sample = "phone\n+1234567890\n+1987654321\n+1555123456";
    const blob = new Blob([sample], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "campaign-target-numbers-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const fetchCompanies = useCallback(async () => {
    if (!isAdmin) {
      setCompanies([]);
      setLoadingCompanies(false);
      return;
    }
    setLoadingCompanies(true);
    try {
      const res = await getCompanies();
      const opts = parseCompaniesResponse(res);
      setCompanies(opts);
      if (opts.length > 0 && !form.company_id && !editCampaignId) setForm((f) => ({ ...f, company_id: opts[0].id }));
    } catch {
      setCompanies([]);
    } finally {
      setLoadingCompanies(false);
    }
  }, [editCampaignId, isAdmin, form.company_id]);

  const fetchVoicebots = useCallback(async (companyId: string) => {
    if (!companyId) {
      setVoicebots([]);
      return;
    }
    try {
      const res = await getVoicebots({ company_id: companyId });
      setVoicebots(parseVoicebotsResponse(res));
    } catch {
      setVoicebots([]);
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
    if (form.company_id) fetchVoicebots(form.company_id);
    else setVoicebots([]);
  }, [form.company_id, fetchVoicebots]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitCampaignForm(form, isEditMode, editCampaignId, router);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(e?.response?.data?.detail || String(e?.message ?? (isEditMode ? "Update failed" : "Create failed")));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/voicebot/outbound/campaigns");
  };

  const targetCount = parseTargetListToE164(form.target_list_raw ?? "").length;
  const validationItems = buildValidationItems(form, targetCount);

  const pageTitle = isEditMode ? "Edit Campaign" : "Create Campaign";
  const subTitle = isEditMode ? "Voicebot Outbound - Campaigns - Edit" : "Voicebot Outbound - Campaigns - Create";

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle={subTitle} />
      <PageHeader title={pageTitle} showSearch={false} />

      <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ maxWidth: "1600px", margin: "0 auto", display: "flex", gap: "8px", overflowX: "auto" }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 20px",
                border: "none",
                backgroundColor: "transparent",
                color: activeTab === tab.id ? "#667eea" : "#9ca3af",
                fontWeight: activeTab === tab.id ? 600 : 500,
                fontSize: "14px",
                cursor: "pointer",
                borderBottom: activeTab === tab.id ? "3px solid #667eea" : "3px solid transparent",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: activeTab === tab.id ? "#667eea" : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <tab.icon size={14} color={activeTab === tab.id ? "white" : "#9ca3af"} />
              </div>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <Form onSubmit={(e) => e.preventDefault()}>
        <div style={{ maxWidth: "1600px", margin: "0 auto", padding: "24px 0" }}>
          <CampaignFormBody
            isEditMode={isEditMode}
            loadingCampaign={loadingCampaign}
            form={form}
            setForm={setForm}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            companies={companies}
            voicebots={voicebots}
            loadingCompanies={loadingCompanies}
            isAdmin={isAdmin}
            userCompanyIdentifier={userCompanyIdentifier}
            userCompanyName={userCompanyName}
            validationItems={validationItems}
            targetCount={targetCount}
            isFirstTab={isFirstTab}
            isLastTab={isLastTab}
            goPrev={goPrev}
            goNext={goNext}
            handleCancel={handleCancel}
            handleSubmit={handleSubmit}
            submitting={submitting}
            csvInputRef={csvInputRef}
            handleCsvFileChange={handleCsvFileChange}
            downloadSampleCsv={downloadSampleCsv}
          />
        </div>
      </Form>

      <style>{`
        .campaign-create-grid select:focus,
        .campaign-create-grid input:focus,
        .campaign-create-grid textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        @media (max-width: 1200px) {
          .campaign-create-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </React.Fragment>
  );
};

CampaignCreatePage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;
export default CampaignCreatePage;
