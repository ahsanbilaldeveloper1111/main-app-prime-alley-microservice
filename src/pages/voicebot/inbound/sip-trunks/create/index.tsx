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
  getCompanies,
  postSipTrunk,
  type CreateSipTrunkPayload,
} from "@utils/voicebot/inbound";
import {
  normalizeCompaniesResponse,
  type CompanyOption,
} from "@utils/companyOptions";
import { Form, Row, Col, Button, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { ArrowLeft, Plus } from "lucide-react";
import "@assets/scss/common.scss";

/**
 * Request body `company_id` must be the company **identifier** (TMS/slug) when the API
 * provides one; otherwise the selected list value.
 */
function companyIdAsIdentifier(
  companies: CompanyOption[],
  selectedListValue: string,
): string {
  const t = selectedListValue.trim();
  if (!t) return "";
  const c = companies.find(
    (x) => x.id === t || x.identifier === t || x.company_id === t,
  );
  if (c?.identifier?.trim()) return c.identifier.trim();
  return t;
}

function parseCallerIds(text: string): string[] {
  return text
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

const primaryButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.5rem",
  background: "#141414",
  borderColor: "rgba(20, 20, 20, 0)",
  color: "rgb(255, 255, 255)",
  borderRadius: "4px",
  paddingBlock: "8px",
  paddingInline: "16px",
  fontSize: "12px",
  fontWeight: 300,
  fontFamily: '"Lexend Deca", Helvetica, Arial, sans-serif',
};

/** SIP address is kept out of React state so paste/drag + re-render cannot wipe a controlled `value`. */
type TrunkFormFields = {
  companyListValue: string;
  name: string;
  callerIdsText: string;
};

const emptyForm = (): TrunkFormFields => ({
  companyListValue: "",
  name: "",
  callerIdsText: "",
});

const CreateSipTrunkPage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = String(session?.user?.is_admin ?? "") === "1";

  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [form, setForm] = useState<TrunkFormFields>(() => emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const sipAddressInputRef = useRef<HTMLInputElement | null>(null);

  const setFormField = useCallback(
    <K extends keyof TrunkFormFields>(key: K, value: TrunkFormFields[K]) => {
      setForm((prev) => {
        const p = prev != null && typeof prev === "object" ? prev : emptyForm();
        return {
          companyListValue: p.companyListValue ?? "",
          name: p.name ?? "",
          callerIdsText: p.callerIdsText ?? "",
          [key]: value,
        };
      });
    },
    [],
  );

  const fetchCompanies = useCallback(async () => {
    setLoadingCompanies(true);
    try {
      const res = await getCompanies({ show_inactive: false });
      setCompanies(normalizeCompaniesResponse(res));
    } catch {
      setCompanies([]);
      toast.error("Failed to load companies");
    } finally {
      setLoadingCompanies(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const nonAdminCompanyName = useMemo(() => {
    return String((session?.user as { company_name?: string })?.company_name ?? "").trim();
  }, [session?.user]);

  const buildPayload = useCallback((): CreateSipTrunkPayload | null => {
    const caller_ids = parseCallerIds(form.callerIdsText);
    const trimmedName = form.name.trim();
    const sip_address = (sipAddressInputRef.current?.value ?? "").trim();

    let company_id = "";
    if (isAdmin) {
      if (!form.companyListValue) {
        toast.error("Select a company");
        return null;
      }
      company_id = companyIdAsIdentifier(companies, form.companyListValue);
    } else {
      const user = session?.user as
        | { company_identifier?: string | null; company_id?: string | null }
        | undefined;
      const ident = String(user?.company_identifier ?? "").trim();
      const cid = String(user?.company_id ?? "").trim();
      if (ident) {
        company_id = ident;
      } else if (cid && companies.length) {
        company_id = companyIdAsIdentifier(companies, cid);
      } else {
        company_id = cid;
      }
      if (!company_id) {
        toast.error("No company is associated with your account");
        return null;
      }
    }

    if (!trimmedName) {
      toast.error("Display name is required");
      return null;
    }

    return {
      company_id,
      name: trimmedName,
      sip_address,
      caller_ids,
    };
  }, [isAdmin, companies, form, session?.user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = buildPayload();
    if (!payload) return;
    setSubmitting(true);
    postSipTrunk(payload)
      .then(() => {
        toast.success("SIP trunk created");
        router.push("/voicebot/inbound/sip-trunks");
      })
      .catch((err: unknown) => {
        const msg =
          (err as { response?: { data?: { detail?: string } } })?.response?.data
            ?.detail ??
          (err as { message?: string })?.message ??
          "Failed to create SIP trunk";
        toast.error(String(msg));
      })
      .finally(() => setSubmitting(false));
  };

  const inputStyle: React.CSSProperties = useMemo(
    () => ({
      width: "100%",
      padding: "10px 12px",
      border: "1px solid #e5e7eb",
      borderRadius: "6px",
      fontSize: "14px",
      color: "#1f2937",
    }),
    [],
  );
  const textareaStyle: React.CSSProperties = useMemo(
    () => ({
      width: "100%",
      padding: "10px 12px",
      border: "1px solid #e5e7eb",
      borderRadius: "6px",
      fontSize: "14px",
      color: "#1f2937",
      minHeight: "120px",
      resize: "vertical" as const,
    }),
    [],
  );
  const labelStyle: React.CSSProperties = useMemo(
    () => ({
      display: "block",
      fontSize: "13px",
      fontWeight: 500,
      color: "#6b7280",
      marginBottom: "6px",
    }),
    [],
  );

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle=""
        mainLink=""
        subTitle="Voicebot Inbound - SIP trunks - Create"
      />
      <Row className="mb-3">
        <Col>
          <div className="d-flex align-items-center flex-wrap gap-2">
            <Button
              type="button"
              variant="link"
              className="p-0 text-decoration-none d-inline-flex align-items-center"
              onClick={() => router.push("/voicebot/inbound/sip-trunks")}
            >
              <ArrowLeft size={18} className="me-1" />
              Back
            </Button>
          </div>
          <h2 className="mb-0 mt-2">Create SIP trunk</h2>
          <p className="text-muted small mb-0 mt-1">
            Required: company and display name. SIP address and caller IDs are optional; leave the
            address blank to allow any origin.
          </p>
        </Col>
      </Row>

      <Row className="g-3">
        <Col xs={12}>
          <div
            className="bg-white rounded-3 p-4 p-lg-5 shadow-sm w-100"
            style={{ border: "1px solid #e5e7eb" }}
          >
            <Form
              onSubmit={handleSubmit}
              noValidate
              autoComplete="off"
            >
                <Row className="g-3 g-md-4">
                  <Col md={6}>
                    {isAdmin ? (
                      <Form.Group className="mb-0">
                        <Form.Label style={labelStyle}>Company *</Form.Label>
                        <div className="position-relative">
                          <Form.Select
                            value={form.companyListValue}
                            onChange={(e) =>
                              setFormField("companyListValue", e.target.value)
                            }
                            required
                            style={inputStyle}
                            disabled={loadingCompanies}
                          >
                            <option value="">
                              {loadingCompanies
                                ? "Loading companies…"
                                : "Select company"}
                            </option>
                            {companies.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </Form.Select>
                          {loadingCompanies && (
                            <Spinner
                              animation="border"
                              size="sm"
                              className="position-absolute"
                              style={{ right: 12, top: "50%", marginTop: -8 }}
                            />
                          )}
                        </div>
                      </Form.Group>
                    ) : (
                      <Form.Group className="mb-0">
                        <Form.Label style={labelStyle}>Company</Form.Label>
                        <div
                          className="small text-body border rounded"
                          style={{
                            ...inputStyle,
                            background: "#f9fafb",
                            padding: "10px 12px",
                            marginBottom: 0,
                          }}
                        >
                          {nonAdminCompanyName || "Your company"}
                        </div>
                      </Form.Group>
                    )}
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-0">
                      <Form.Label style={labelStyle}>Display name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="inbound_sip_trunk_name"
                        value={form.name}
                        onChange={(e) => setFormField("name", e.target.value)}
                        placeholder="e.g. Support Line"
                        style={inputStyle}
                        required
                        autoComplete="off"
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12}>
                    <Form.Group className="mb-0">
                      <Form.Label style={labelStyle} htmlFor="inbound-sip-trunk-sip-address">
                        SIP address{" "}
                        <span className="text-muted fw-normal">(optional)</span>
                      </Form.Label>
                      {/*
                        Uncontrolled: `value={...}` + paste can leave React state stale; the next
                        re-render then overwrites the DOM and clears pasted text. Read `ref` in buildPayload.
                      */}
                      <input
                        ref={sipAddressInputRef}
                        id="inbound-sip-trunk-sip-address"
                        type="text"
                        className="form-control"
                        name="inbound_sip_trunk_sip_address"
                        defaultValue=""
                        placeholder="sip:host:port (leave empty for any origin)"
                        style={inputStyle}
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        enterKeyHint="next"
                      />
                      <Form.Text className="text-muted small">
                        <code>sip:host:port</code> format. Empty string sends the default and allows
                        any origin.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col xs={12}>
                    <Form.Group className="mb-0">
                      <Form.Label style={labelStyle}>
                        Caller IDs{" "}
                        <span className="text-muted fw-normal">(optional, E.164)</span>
                      </Form.Label>
                      <span className="d-block text-muted small mb-1">
                        One per line or comma-separated. Leave empty to send an empty list.
                      </span>
                      <Form.Control
                        as="textarea"
                        name="inbound_sip_trunk_caller_ids"
                        rows={5}
                        value={form.callerIdsText}
                        onChange={(e) => setFormField("callerIdsText", e.target.value)}
                        placeholder="+14155551001&#10;+14155551002"
                        style={textareaStyle}
                        autoComplete="off"
                        spellCheck={false}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex flex-wrap gap-2 mt-4 pt-2 border-top border-light">
                  <Button
                    type="submit"
                    disabled={submitting || (isAdmin && loadingCompanies)}
                    className="border-0"
                    style={primaryButtonStyle}
                  >
                    {submitting ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <Plus size={16} />
                    )}
                    Create trunk
                  </Button>
                  <Button
                    type="button"
                    variant="outline-secondary"
                    onClick={() => router.push("/voicebot/inbound/sip-trunks")}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
          </div>
        </Col>
      </Row>
    </React.Fragment>
  );
};

CreateSipTrunkPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CreateSipTrunkPage;
