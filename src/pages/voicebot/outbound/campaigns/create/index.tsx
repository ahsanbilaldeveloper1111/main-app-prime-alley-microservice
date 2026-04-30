import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  postCampaigns,
  getCampaign,
  putCampaign,
  getVoicebots,
  type CreateCampaignPayload,
} from "@utils/voicebot/outbound";
import { OUTBOUND_VOICEBOT_CREATE_COMPANY_ID, OUTBOUND_VOICEBOT_LIST_PAGE_SIZE } from "@utils/voicebot/outboundVoicebotForm";
import { toFormString } from "@utils/voicebot/formDisplay";
import { Form, Spinner, Tab, Row, Col, Button } from "react-bootstrap";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import PageHeader from "@components/PageHeader";
import { FileText, Users, MessageSquare, Check, Upload, Download } from "lucide-react";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

interface VoicebotOption {
  id: number | string;
  name: string;
}

/** UI state for create/edit; API body uses `OUTBOUND_VOICEBOT_CREATE_COMPANY_ID` and ISO `schedule_time`. */
interface CampaignFormState {
  name: string;
  description: string;
  voicebot_id?: number;
  target_list_raw: string;
  campaign_script: string;
  custom_greeting: string;
  input_method: "manual" | "csv";
  schedule_time: string;
  failure_threshold: number;
}

const defaultForm: CampaignFormState = {
  name: "",
  description: "",
  voicebot_id: undefined,
  target_list_raw: "",
  campaign_script: "",
  custom_greeting: "",
  input_method: "manual",
  schedule_time: "",
  failure_threshold: 5,
};

/** Normalize schedule to ISO 8601 (UTC) for API `schedule_time`. */
function toScheduleTimeIso(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

/** Split textarea/CSV into non-empty entries; values are sent to the API as entered (trim + strip quotes only). */
function parseTargetListRaw(text: string): string[] {
  return text
    .split(/[\n\r,;]+/)
    .map((s) => s.trim().replaceAll(/^["']|["']$/g, ""))
    .filter((s) => s.length > 0);
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
}

function scheduleTimeForForm(detail: Record<string, unknown>): string {
  const st = toFormString(detail.schedule_time);
  if (st) {
    const d = new Date(st);
    if (!Number.isNaN(d.getTime())) {
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    return st;
  }
  const legacy = toFormString(detail.schedule_start);
  if (!legacy) return "";
  const d = new Date(legacy);
  if (Number.isNaN(d.getTime())) return legacy;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function buildFormFromCampaignDetail(detail: Record<string, unknown>): CampaignFormState {
  const targetList =
    (detail.target_numbers as string[] | undefined) ??
    (detail.target_list as string[] | undefined);
  const targetListRaw = Array.isArray(targetList) ? targetList.join("\n") : "";
  return {
    name: toFormString(detail.name),
    description: toFormString(detail.description),
    voicebot_id: detail.voicebot_id == null ? undefined : Number(detail.voicebot_id),
    target_list_raw: targetListRaw,
    campaign_script: toFormString(detail.campaign_script),
    custom_greeting: toFormString(detail.custom_greeting),
    input_method: "manual",
    schedule_time: scheduleTimeForForm(detail),
    failure_threshold: Number(detail.failure_threshold ?? 5),
  };
}

function buildCampaignPayload(
  form: CampaignFormState,
  companyIdOverride?: string,
): CreateCampaignPayload | null {
  if (!form.name?.trim()) {
    toast.error("Campaign name is required");
    return null;
  }
  if (form.voicebot_id == null || Number.isNaN(Number(form.voicebot_id))) {
    toast.error("Select a VoiceBot");
    return null;
  }
  const schedule_time = toScheduleTimeIso(form.schedule_time);
  if ((form.schedule_time ?? "").trim() && !schedule_time) {
    toast.error("Invalid schedule time");
    return null;
  }
  const target_numbers = parseTargetListRaw(form.target_list_raw ?? "");
  if (target_numbers.length === 0) {
    toast.error("Enter at least one target number (one per line or comma-separated)");
    return null;
  }
  const script = (form.campaign_script ?? "").trim();
  if (!script) {
    toast.error("Campaign script is required");
    return null;
  }
  return {
    company_id:
      companyIdOverride && String(companyIdOverride).trim()
        ? String(companyIdOverride).trim()
        : OUTBOUND_VOICEBOT_CREATE_COMPANY_ID,
    voicebot_id: Number(form.voicebot_id),
    name: form.name.trim(),
    description: form.description?.trim() || undefined,
    campaign_script: script,
    custom_greeting: (form.custom_greeting ?? "").trim() || undefined,
    target_numbers,
    ...(schedule_time ? { schedule_time } : {}),
    failure_threshold: Number.isFinite(Number(form.failure_threshold))
      ? Number(form.failure_threshold)
      : 5,
  };
}

async function submitCampaignForm(
  form: CampaignFormState,
  isEditMode: boolean,
  editCampaignId: string | undefined,
  router: { push: (url: string) => void },
  campaignCompanyId?: string,
): Promise<void> {
  const payload = buildCampaignPayload(form, campaignCompanyId);
  if (!payload) return;

  if (isEditMode && editCampaignId) {
    await putCampaign(editCampaignId, payload);
    toast.success("Campaign updated");
    router.push("/voicebot/outbound/campaigns");
    return;
  }

  await postCampaigns(payload);
  toast.success("Campaign created");
  router.push("/voicebot/outbound/campaigns");
}

function useLoadCampaignForEdit(
  editCampaignId: string | undefined,
  isEditMode: boolean,
  setForm: React.Dispatch<React.SetStateAction<CampaignFormState>>,
  scopedCompanyId: string | undefined,
): boolean {
  const [loadingCampaign, setLoadingCampaign] = useState(isEditMode);
  useEffect(() => {
    if (!isEditMode || !editCampaignId) {
      if (isEditMode) setLoadingCampaign(false);
      return;
    }
    let cancelled = false;
    setLoadingCampaign(true);
    const params =
      scopedCompanyId && scopedCompanyId.trim()
        ? { company_id: scopedCompanyId.trim() }
        : undefined;
    getCampaign(editCampaignId, params)
      .then((res: Record<string, unknown>) => {
        if (cancelled) return;
        const detail = (res?.data ?? res) as Record<string, unknown>;
        setForm(buildFormFromCampaignDetail(detail));
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
  }, [isEditMode, editCampaignId, setForm, scopedCompanyId]);
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

function parseVoicebotsResponse(res: unknown): VoicebotOption[] {
  const list = Array.isArray(res)
    ? res
    : (res as { results?: Record<string, unknown>[] })?.results ??
      (res as { data?: Record<string, unknown>[] })?.data ??
      [];
  const arr = Array.isArray(list) ? list : [];
  return arr.map((v) => {
    const row = v as { id?: number | string; bot_id?: number | string; name?: string };
    const id = row.id ?? row.bot_id ?? "";
    return { id, name: row.name ?? "" };
  });
}

interface ValidationItem {
  id: string;
  label: string;
  checked: boolean;
}

function buildValidationItems(form: CampaignFormState, targetCount: number): ValidationItem[] {
  const basicOk = Boolean(
    form.name?.trim() &&
      form.voicebot_id != null,
  );
  const scriptOk = Boolean((form.campaign_script ?? "").trim());
  return [
    { id: "basic", label: "Basic Information", checked: basicOk },
    { id: "targets", label: "Target Numbers", checked: targetCount > 0 },
    { id: "script", label: "Script & Greeting", checked: scriptOk },
  ];
}

const inputStyle = { width: "100%" as const, padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "14px", color: "#1f2937" };
const labelStyle = { display: "block" as const, fontSize: "13px", fontWeight: 500 as const, color: "#6b7280", marginBottom: "6px" };

interface CampaignFormBodyProps {
  isEditMode: boolean;
  loadingCampaign: boolean;
  form: CampaignFormState;
  setForm: React.Dispatch<React.SetStateAction<CampaignFormState>>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  voicebots: VoicebotOption[];
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
    voicebots,
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
  const isSubmitDisabled =
    submitting ||
    !form.name?.trim() ||
    form.voicebot_id == null ||
    !(form.campaign_script ?? "").trim() ||
    targetCount === 0;
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
                      <Form.Group className="mb-3">
                        <Form.Label style={labelStyle}>
                          Select VoiceBot <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select
                          value={form.voicebot_id ?? ""}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              voicebot_id: e.target.value ? Number(e.target.value) : undefined,
                            }))
                          }
                          style={inputStyle}
                        >
                          <option value="">—</option>
                          {voicebots.map((v) => (
                            <option key={String(v.id)} value={v.id}>
                              {v.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label style={labelStyle}>
                          Schedule time
                        </Form.Label>
                        <Form.Control
                          type="datetime-local"
                          value={form.schedule_time}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, schedule_time: e.target.value }))
                          }
                          style={inputStyle}
                        />
                        <Form.Text className="text-muted">Optional. Sent to API as ISO 8601 UTC (e.g. 2026-06-01T09:00:00Z).</Form.Text>
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label style={labelStyle}>Failure threshold</Form.Label>
                        <Form.Control
                          type="number"
                          min={0}
                          value={form.failure_threshold}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              failure_threshold: e.target.value ? Number(e.target.value) : 5,
                            }))
                          }
                          style={inputStyle}
                        />
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
                    <Form.Label style={labelStyle}>Target numbers (one per line) <span className="text-danger">*</span></Form.Label>
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
                      placeholder={"e.g. +1234567890\n555-0100"}
                      style={{ ...inputStyle, resize: "vertical" as const }}
                    />
                    <Form.Text className="text-muted">
                       Total targets: {targetCount}
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
  const { editCampaignId } = props;
  const router = useRouter();
  const isEditMode = Boolean(editCampaignId);

  const companyIdFromQuery = useMemo(() => {
    const q = router.query.company_id;
    if (typeof q === "string" && q.trim()) return q.trim();
    if (Array.isArray(q) && q[0] && String(q[0]).trim()) return String(q[0]).trim();
    return undefined;
  }, [router.query.company_id]);

  const [activeTab, setActiveTab] = useState<string>(TAB_KEYS.basic);
  const [voicebots, setVoicebots] = useState<VoicebotOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CampaignFormState>({ ...defaultForm });
  const csvInputRef = React.useRef<HTMLInputElement>(null);

  const loadingCampaign = useLoadCampaignForEdit(
    editCampaignId,
    isEditMode,
    setForm,
    companyIdFromQuery,
  );
  const { isFirstTab, isLastTab, goPrev, goNext } = useTabNavigation(activeTab, setActiveTab);

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      const numbers = parseTargetListRaw(text);
      setForm((f) => ({ ...f, target_list_raw: numbers.join("\n") }));
      toast.success(`Loaded ${numbers.length} target(s) from ${file.name}`);
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

  const fetchVoicebots = useCallback(async () => {
    try {
      const res = await getVoicebots({
        page: 1,
        page_size: OUTBOUND_VOICEBOT_LIST_PAGE_SIZE,
        ...(companyIdFromQuery ? { company_id: companyIdFromQuery } : {}),
      });
      setVoicebots(parseVoicebotsResponse(res));
    } catch {
      setVoicebots([]);
    }
  }, [companyIdFromQuery]);

  useEffect(() => {
    fetchVoicebots();
  }, [fetchVoicebots]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitCampaignForm(
        form,
        isEditMode,
        editCampaignId,
        router,
        companyIdFromQuery,
      );
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

  const targetCount = parseTargetListRaw(form.target_list_raw ?? "").length;
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
            voicebots={voicebots}
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
