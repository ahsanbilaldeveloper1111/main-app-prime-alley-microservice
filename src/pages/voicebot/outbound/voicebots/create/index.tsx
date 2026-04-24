import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  getTrunks,
  getVoicebot,
  postVoicebots,
  putVoicebot,
} from "@utils/voicebot/outbound";
import {
  defaultOutboundVoicebotForm,
  mapVoicebotDetailToForm,
  buildCreatePayload,
  buildUpdatePayload,
  getOutboundVoicebotSubmitError,
  OUTBOUND_VOICEBOT_CREATE_COMPANY_ID,
  type OutboundVoicebotFormState,
} from "@utils/voicebot/outboundVoicebotForm";
import { GetCompanies } from "@utils/users";
import { normalizeCompaniesResponse } from "@utils/companyOptions";
import { Form, Spinner, Tab, Row, Col, Button } from "react-bootstrap";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import PageHeader from "@components/PageHeader";
import { FileText, Mic, MessageSquare, Phone } from "lucide-react";
import { TabsNavigation } from "@components/voicebot/TabsNavigation";
import {
  CompanyOptions,
  type CompanyOption,
} from "@components/voicebot/CompanyOptions";
import { ValidationChecklist } from "@components/voicebot/ValidationChecklist";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

const TAB_KEYS = {
  basic: "basic",
  voice: "voice",
  prompts: "prompts",
  call: "call",
} as const;
const TAB_ORDER = [
  TAB_KEYS.basic,
  TAB_KEYS.voice,
  TAB_KEYS.prompts,
  TAB_KEYS.call,
];
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

function getVoicebotDetail(
  res: Record<string, unknown>,
): Record<string, unknown> {
  return ((res as { data?: unknown }).data ?? res) as Record<string, unknown>;
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

const LoadingVoicebotPlaceholder = ({
  pageCopy,
}: {
  pageCopy: ReturnType<typeof getPageCopy>;
}) => (
  <React.Fragment>
    <BreadcrumbItem
      mainTitle=""
      mainLink=""
      subTitle={pageCopy.breadcrumbSubTitle}
    />
    <PageHeader title={pageCopy.title} showSearch={false} />
    <div className="d-flex justify-content-center align-items-center p-5">
      <Spinner animation="border" />
    </div>
  </React.Fragment>
);

// local versions of TabsNavigation/ValidationChecklist were extracted to shared components

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
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: "24px",
      paddingTop: "16px",
      borderTop: "1px solid #e5e7eb",
    }}
  >
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
        <Button
          type="button"
          variant="primary"
          disabled={submitting || !canSubmitFinal}
          onClick={onFinalSubmit}
        >
          {submitting ? (
            <Spinner animation="border" size="sm" className="me-1" />
          ) : null}
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
  const sessionUser = session?.user as
    | {
        company_id?: string | null;
        company_identifier?: string | null;
        company_name?: string | null;
      }
    | undefined;
  const userCompanyId = String(sessionUser?.company_id ?? "").trim();
  const userCompanyIdentifier = String(
    sessionUser?.company_identifier ?? "",
  ).trim();
  const userCompanyName =
    String(sessionUser?.company_name ?? "").trim() || userCompanyIdentifier;
  const botId =
    typeof router.query.id === "string" ? router.query.id : undefined;
  const isEditMode = Boolean(botId);
  const pageCopy = getPageCopy(isEditMode);
  const [activeTab, setActiveTab] = useState<string>(TAB_KEYS.basic);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [trunks, setTrunks] = useState<
    Array<{ id: string; trunk_id?: string; name?: string }>
  >([]);
  const [loadingBot, setLoadingBot] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<OutboundVoicebotFormState>(() =>
    defaultOutboundVoicebotForm(),
  );
  const formRef = useRef(form);
  formRef.current = form;

  const trunksFetchCompanyId = useMemo(() => {
    const fromQuery =
      isEditMode && typeof router.query.company_id === "string"
        ? router.query.company_id.trim()
        : "";
    if (isAdmin) {
      const fromForm = String(form.company_id ?? "").trim();
      return (
        fromForm ||
        fromQuery ||
        OUTBOUND_VOICEBOT_CREATE_COMPANY_ID
      );
    }
    return (
      userCompanyId ||
      userCompanyIdentifier ||
      OUTBOUND_VOICEBOT_CREATE_COMPANY_ID
    );
  }, [
    isAdmin,
    isEditMode,
    form.company_id,
    router.query.company_id,
    userCompanyId,
    userCompanyIdentifier,
  ]);

  const fetchCompanies = useCallback(async () => {
    setLoadingCompanies(true);
    try {
      const res = await GetCompanies();
      if (res === false) {
        setCompanies([]);
        return;
      }
      setCompanies(normalizeCompaniesResponse(res));
    } catch {
      setCompanies([]);
    } finally {
      setLoadingCompanies(false);
    }
  }, []);

  const fetchTrunksList = useCallback(async () => {
    try {
      const res = await getTrunks({ company_id: trunksFetchCompanyId });
      const list = Array.isArray(res)
        ? res
        : ((
            res as {
              results?: { trunk_id?: string; id?: string; name?: string }[];
            }
          )?.results ??
          (
            res as {
              data?: { trunk_id?: string; id?: string; name?: string }[];
            }
          )?.data ??
          []);
      const rows = (Array.isArray(list) ? list : []).map((r, i) => ({
        id: r.trunk_id ?? r.id ?? `trunk-${i}`,
        trunk_id: r.trunk_id ?? r.id,
        name: (r as { name?: string }).name ?? r.trunk_id ?? r.id ?? "",
      }));
      setTrunks(rows);
    } catch {
      setTrunks([]);
    }
  }, [trunksFetchCompanyId]);

  useEffect(() => {
    if (isAdmin) {
      fetchCompanies();
    }
  }, [isAdmin, fetchCompanies]);

  useEffect(() => {
    if (isAdmin || isEditMode) return;
    const cid = userCompanyId || userCompanyIdentifier;
    if (cid) setForm((f) => ({ ...f, company_id: cid }));
  }, [isAdmin, isEditMode, userCompanyId, userCompanyIdentifier]);

  useEffect(() => {
    fetchTrunksList();
  }, [fetchTrunksList]);

  useEffect(() => {
    if (!isEditMode || !botId) return;
    setLoadingBot(true);
    const companyId =
      typeof router.query.company_id === "string"
        ? router.query.company_id
        : undefined;
    getVoicebot(botId, companyId ? { company_id: companyId } : undefined)
      .then((res: Record<string, unknown>) => {
        const d = getVoicebotDetail(res);
        setForm(mapVoicebotDetailToForm(d, defaultOutboundVoicebotForm()));
      })
      .catch(() => {
        toast.error("Failed to load voice bot");
        router.push("/voicebot/outbound/voicebots");
      })
      .finally(() => setLoadingBot(false));
  }, [isEditMode, botId, router]);

  const handleSubmit = () => {
    const snapshot = formRef.current;
    const err = getOutboundVoicebotSubmitError(snapshot);
    if (err) {
      toast.error(err);
      return;
    }
    setSubmitting(true);
    submitOutboundVoicebot(snapshot, isEditMode, botId)
      .then((result) => {
        toast.success(
          result === "updated" ? "Voice bot updated" : "Voice bot created",
        );
        router.push("/voicebot/outbound/voicebots");
      })
      .catch((err: unknown) => {
        const e = err as {
          response?: { data?: { detail?: string } };
          message?: string;
        };
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

  const currentTabIndex = TAB_ORDER.indexOf(
    activeTab as "basic" | "voice" | "prompts" | "call",
  );
  const isFirstTab = currentTabIndex <= 0;
  const isLastTab = currentTabIndex >= TAB_ORDER.length - 1;
  const goPrev = () => {
    if (!isFirstTab) setActiveTab(TAB_ORDER[currentTabIndex - 1]);
  };
  const goNext = () => {
    if (!isLastTab) setActiveTab(TAB_ORDER[currentTabIndex + 1]);
  };

  const validationItems = [
    {
      id: "basic",
      label: "Basic Information",
      checked: !!(
        form.name?.trim() &&
        form.company_id &&
        form.trunk_id?.trim() &&
        (form.description?.trim() || true)
      ),
    },
    {
      id: "voice",
      label: "Voice Settings",
      checked: !!(form.voice_model && form.tts_provider),
    },
    {
      id: "prompts",
      label: "Prompts",
      checked: !!(
        form.default_greeting?.trim() && form.default_system_prompt?.trim()
      ),
    },
    { id: "call", label: "Call Settings", checked: true },
  ];

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

  if (loadingBot) {
    return <LoadingVoicebotPlaceholder pageCopy={pageCopy} />;
  }

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle=""
        mainLink=""
        subTitle={pageCopy.breadcrumbSubTitle}
      />
      <PageHeader title={pageCopy.title} showSearch={false} />

      <TabsNavigation
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <Form
        onSubmit={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.preventDefault();
        }}
      >
        <div
          style={{ maxWidth: "1600px", margin: "0 auto", padding: "24px 0" }}
        >
          <div
            className="content-grid outbound-voicebot-create-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 380px",
              gap: "24px",
              alignItems: "start",
            }}
          >
            <div>
              <div
                style={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  padding: "24px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <Tab.Container
                  activeKey={activeTab}
                  onSelect={(k) => setActiveTab(k ?? TAB_KEYS.basic)}
                >
                  <Tab.Content>
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
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label style={labelStyle}>
                              Bot Name <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                              value={form.name}
                              onChange={(e) =>
                                setForm((f) => ({ ...f, name: e.target.value }))
                              }
                              required
                              placeholder="e.g. Sales Bot"
                              style={inputStyle}
                            />
                          </Form.Group>
                          <Form.Group className="mb-3">
                            <Form.Label style={labelStyle}>
                              Description
                            </Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={3}
                              value={form.description ?? ""}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  description: e.target.value,
                                }))
                              }
                              placeholder="AI bot for sales calls"
                              style={{
                                ...inputStyle,
                                resize: "vertical" as const,
                              }}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          {isAdmin ? (
                            <Form.Group className="mb-3">
                              <Form.Label style={labelStyle}>
                                Company <span className="text-danger">*</span>
                              </Form.Label>
                              <Form.Select
                                value={form.company_id}
                                onChange={(e) =>
                                  setForm((f) => ({
                                    ...f,
                                    company_id: e.target.value,
                                    trunk_id: "",
                                    transfer_trunk_id: "",
                                  }))
                                }
                                required
                                disabled={loadingCompanies}
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
                          ) : null}
                          <Form.Group className="mb-3">
                            <Form.Label style={labelStyle}>
                              Select Trunk{" "}
                              <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Select
                              value={form.trunk_id ?? ""}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  trunk_id: e.target.value,
                                }))
                              }
                              style={inputStyle}
                            >
                              <option value="">Select trunk</option>
                              {trunks.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name || t.id}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>
                    </Tab.Pane>
                    <Tab.Pane eventKey={TAB_KEYS.voice}>
                      <h6
                        style={{
                          margin: "0 0 20px 0",
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#1f2937",
                        }}
                      >
                        Voice Settings
                      </h6>
                      <Row>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label style={labelStyle}>
                              TTS Provider
                            </Form.Label>
                            <Form.Select
                              value={form.tts_provider}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  tts_provider: e.target.value,
                                }))
                              }
                              style={inputStyle}
                            >
                              <option value="openai">openai</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label style={labelStyle}>
                              Voice Model
                            </Form.Label>
                            <Form.Control
                              value={form.voice_model}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  voice_model: e.target.value,
                                }))
                              }
                              placeholder="onyx"
                              style={inputStyle}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label style={labelStyle}>Language</Form.Label>
                            <Form.Control
                              value={form.language}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  language: e.target.value,
                                }))
                              }
                              placeholder="en-US"
                              style={inputStyle}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    </Tab.Pane>
                    <Tab.Pane eventKey={TAB_KEYS.prompts}>
                      <h6
                        style={{
                          margin: "0 0 20px 0",
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#1f2937",
                        }}
                      >
                        Prompts
                      </h6>
                      <Form.Group className="mb-3">
                        <Form.Label style={labelStyle}>
                          Default Greeting{" "}
                          <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={form.default_greeting}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              default_greeting: e.target.value,
                            }))
                          }
                          required
                          placeholder="Hi, I am calling from Acme Corp."
                          style={{ ...inputStyle, resize: "vertical" as const }}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label style={labelStyle}>
                          Default System Prompt{" "}
                          <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={form.default_system_prompt}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              default_system_prompt: e.target.value,
                            }))
                          }
                          required
                          placeholder="You are a professional sales agent..."
                          style={{ ...inputStyle, resize: "vertical" as const }}
                        />
                      </Form.Group>
                    </Tab.Pane>
                    <Tab.Pane eventKey={TAB_KEYS.call}>
                      <h6
                        style={{
                          margin: "0 0 20px 0",
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#1f2937",
                        }}
                      >
                        Call Settings
                      </h6>
                      <Row>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label style={labelStyle}>
                              Transfer Number
                            </Form.Label>
                            <Form.Control
                              value={form.transfer_number}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  transfer_number: e.target.value,
                                }))
                              }
                              placeholder="+15551234567"
                              style={inputStyle}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label style={labelStyle}>
                              Transfer Trunk
                            </Form.Label>
                            <Form.Select
                              value={form.transfer_trunk_id}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  transfer_trunk_id: e.target.value,
                                }))
                              }
                              style={inputStyle}
                            >
                              <option value="">Optional</option>
                              {trunks.map((t) => (
                                <option key={`xfer-${t.id}`} value={t.id}>
                                  {t.name || t.id}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label style={labelStyle}>
                              Concurrency Limit
                            </Form.Label>
                            <Form.Control
                              type="number"
                              min={1}
                              value={form.concurrency_limit}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  concurrency_limit: e.target.value
                                    ? Number(e.target.value)
                                    : f.concurrency_limit,
                                }))
                              }
                              style={inputStyle}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label style={labelStyle}>
                              Max Call Duration (s)
                            </Form.Label>
                            <Form.Control
                              type="number"
                              min={1}
                              value={form.max_call_duration}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  max_call_duration: e.target.value
                                    ? Number(e.target.value)
                                    : f.max_call_duration,
                                }))
                              }
                              style={inputStyle}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label style={labelStyle}>
                              Idle Timeout (s)
                            </Form.Label>
                            <Form.Control
                              type="number"
                              min={1}
                              value={form.idle_timeout}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  idle_timeout: e.target.value
                                    ? Number(e.target.value)
                                    : f.idle_timeout,
                                }))
                              }
                              style={inputStyle}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
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
              form.default_greeting?.trim() &&
              form.default_system_prompt?.trim(),
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

VoicebotOutboundCreate.getLayout = (page: ReactElement) => (
  <Layout>{page}</Layout>
);
export default VoicebotOutboundCreate;
