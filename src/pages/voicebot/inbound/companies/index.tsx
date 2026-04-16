import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect, useCallback } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, { TableColumn } from "@components/GenericTable";
import {
  getCompanies,
  postCompanies,
  getCompany,
  getCompanyStats,
  putCompany,
  deleteCompany,
  activateCompany,
  deactivateCompany,
  type CreateCompanyPayload,
  type UpdateCompanyPayload,
} from "@utils/voicebot/inbound";
import { Row, Col, Button, Modal, Form, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { Plus, Pencil, Trash2, Power, PowerOff, Eye } from "lucide-react";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import { parsePhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import Select, { SingleValue } from "react-select";
import "@assets/scss/common.scss";

const SUBSCRIPTION_TIER_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "basic", label: "Basic" },
  { value: "pro", label: "Pro" },
  { value: "enterprise", label: "Enterprise" },
];

function trimStr(value: string | undefined): string {
  return (value ?? "").trim();
}

/** Renders API `unknown` values without coercing objects to `[object Object]`. */
function formatUnknownDisplay(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "bigint") return String(value);
  return "—";
}

/** Safe string for IDs/query params from loosely typed API records. */
function unknownToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "bigint") return String(value);
  return "";
}

function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function isPhoneValidInternational(phone: string): boolean {
  const parsed = parsePhoneNumber(trimStr(phone));
  return parsed?.isValid() ?? false;
}

function buildCompanyRequestBody(
  form: CreateCompanyPayload,
): CreateCompanyPayload {
  return {
    company_id: trimStr(form.company_id),
    name: trimStr(form.name),
    description: trimStr(form.description),
    email: trimStr(form.email),
    phone: trimStr(form.phone),
    website: trimStr(form.website),
    subscription_tier: trimStr(form.subscription_tier),
    max_bots: form.max_bots,
    max_calls_per_month: form.max_calls_per_month,
  };
}

/** Scroll long company forms inside modals (layout/CSS can block modal-dialog-scrollable). */
const COMPANY_MODAL_BODY_STYLE: React.CSSProperties = {
  maxHeight: "min(75vh, 36rem)",
  minHeight: 0,
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",
};

function defaultCompanyFormState(): CreateCompanyPayload {
  return {
    company_id: "",
    name: "",
    description: "",
    email: "",
    phone: "",
    website: "",
    subscription_tier: "free",
    max_bots: 1,
    max_calls_per_month: 100,
  };
}

const getFlagImgSrc = (countryCode: string) =>
  `https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`;

const PhoneWithFlag = ({ phone }: { phone: string | undefined }) => {
  if (!phone?.trim()) return <>—</>;
  try {
    const parsed = parsePhoneNumber(phone);
    if (parsed) {
      const country = (parsed as { country?: string }).country;
      const formatted = parsed.formatInternational?.() ?? phone;
      return (
        <div className="d-flex align-items-center gap-2">
          {country && (
            <img
              src={getFlagImgSrc(country)}
              alt={country}
              title={country}
              style={{ width: 20, height: 14, objectFit: "cover" }}
            />
          )}
          <span>{formatted}</span>
        </div>
      );
    }
  } catch {
    // ignore
  }
  return <>{phone}</>;
};

interface CompanyRow {
  id?: string;
  company_id?: string;
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  is_active?: boolean;
  subscription_tier?: string;
  max_bots?: number;
  max_calls_per_month?: number;
  [key: string]: unknown;
}

function getCompaniesListFromResponse(res: unknown): CompanyRow[] {
  const list = Array.isArray(res)
    ? res
    : ((res as { results?: unknown[]; data?: unknown[] })?.results ??
      (res as { results?: unknown[]; data?: unknown[] })?.data ??
      []);
  return Array.isArray(list) ? (list as CompanyRow[]) : [];
}

async function loadViewDetails(
  row: CompanyRow,
  setViewDetails: React.Dispatch<
    React.SetStateAction<{
      company: Record<string, unknown> | null;
      stats: Record<string, unknown> | null;
    }>
  >,
  setShowViewModal: (v: boolean) => void,
  setViewLoading: (v: boolean) => void,
) {
  const id = row.id ?? row.company_id ?? "";
  setViewDetails({ company: null, stats: null });
  setShowViewModal(true);
  setViewLoading(true);
  try {
    const [companyRes, statsRes] = await Promise.all([
      getCompany(id),
      getCompanyStats(id),
    ]);
    console.log("companyRes", companyRes);
    console.log("statsRes", statsRes);
    setViewDetails({ company: companyRes, stats: statsRes });
  } catch (e: unknown) {
    const msg =
      (e as { response?: { data?: { detail?: string } }; message?: string })
        ?.response?.data?.detail ??
      (e as { message?: string })?.message ??
      "Failed to load details";
    toast.error(msg);
    setShowViewModal(false);
  } finally {
    setViewLoading(false);
  }
}

type CompaniesPageSetters = {
  setViewDetails: React.Dispatch<
    React.SetStateAction<{
      company: Record<string, unknown> | null;
      stats: Record<string, unknown> | null;
    }>
  >;
  setShowViewModal: (v: boolean) => void;
  setViewLoading: (v: boolean) => void;
  setSelectedRow: React.Dispatch<React.SetStateAction<CompanyRow | null>>;
  setShowEditModal: (v: boolean) => void;
  setForm: React.Dispatch<React.SetStateAction<CreateCompanyPayload>>;
  setShowDeleteModal: (v: boolean) => void;
};

function buildCompaniesColumns(
  setters: CompaniesPageSetters,
): TableColumn<CompanyRow>[] {
  const {
    setViewDetails,
    setShowViewModal,
    setViewLoading,
    setSelectedRow,
    setShowEditModal,
    setForm,
    setShowDeleteModal,
  } = setters;
  return [
    { key: "name", label: "Name", sortable: true },
    {
      key: "email",
      label: "Email",
      sortable: true,
      render: (r) => r.email || "—",
    },
    {
      key: "phone",
      label: "Phone",
      sortable: true,
      render: (r) => <PhoneWithFlag phone={r.phone} />,
    },
    {
      key: "subscription_tier",
      label: "Tier",
      sortable: true,
      render: (r) => r.subscription_tier || "—",
    },
    {
      key: "max_bots",
      label: "Bots",
      sortable: true,
      render: (r: CompanyRow) =>
        r.max_bots ? (
          <span>
            {r.max_bots}/{Number(r?.bots_count ?? 0)}
          </span>
        ) : (
          "—"
        ),
    },
    {
      key: "max_calls_per_month",
      label: "Max Calls/Month",
      sortable: true,
      render: (r: CompanyRow) =>
        r.max_calls_per_month ? <span>{r.max_calls_per_month}</span> : "0",
    },
    {
      key: "is_active",
      label: "Status",
      sortable: true,
      render: (r) =>
        r.is_active === true ? (
          <span className="status-badge success">Active</span>
        ) : (
          <span className="status-badge danger">Inactive</span>
        ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="d-flex gap-1">
          <Button
            size="sm"
            variant="outline-secondary"
            onClick={() =>
              loadViewDetails(
                row,
                setViewDetails,
                setShowViewModal,
                setViewLoading,
              )
            }
          >
            <Eye size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline-primary"
            onClick={() => {
              setSelectedRow(row);
              setShowEditModal(true);
              setForm({
                company_id: row.id ?? row.company_id ?? "",
                name: row.name ?? "",
                description: row.description ?? "",
                email: row.email ?? "",
                phone: row.phone ?? "",
                website: row.website ?? "",
                subscription_tier: row.subscription_tier ?? "free",
                max_bots: row.max_bots ?? 1,
                max_calls_per_month: row.max_calls_per_month ?? 100,
              });
            }}
          >
            <Pencil size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline-danger"
            onClick={() => {
              setSelectedRow(row);
              setShowDeleteModal(true);
            }}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];
}

function getCompaniesParams(
  showInactive: boolean,
  isAdmin: boolean,
  userCompanyIdentifier: string,
) {
  const params: { show_inactive?: boolean; company_id?: string } = {
    show_inactive: showInactive,
  };
  if (!isAdmin && userCompanyIdentifier)
    params.company_id = userCompanyIdentifier;
  return params;
}

function runFetchCompanies(
  showInactive: boolean,
  isAdmin: boolean,
  userCompanyIdentifier: string,
  setData: React.Dispatch<React.SetStateAction<CompanyRow[]>>,
  setLoading: (v: boolean) => void,
) {
  setLoading(true);
  getCompanies(getCompaniesParams(showInactive, isAdmin, userCompanyIdentifier))
    .then((res) => setData(getCompaniesListFromResponse(res)))
    .catch((err: unknown) => {
      const msg =
        (err as { response?: { data?: { detail?: string } }; message?: string })
          ?.response?.data?.detail ??
        (err as { message?: string })?.message ??
        "Failed to load companies";
      toast.error(msg);
      setData([]);
    })
    .finally(() => setLoading(false));
}

type FormErrors = {
  company_id?: string;
  name?: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  subscription_tier?: string;
  max_bots?: string;
  max_calls_per_month?: string;
};

function applyCompanyIdentityErrors(
  form: CreateCompanyPayload,
  errors: FormErrors,
): void {
  if (!trimStr(form.company_id)) errors.company_id = "Company ID is required.";
  if (!trimStr(form.name)) errors.name = "Company name is required.";
}

function applyContactWebsiteAndQuotaErrors(
  form: CreateCompanyPayload,
  errors: FormErrors,
): void {
  if (!trimStr(form.description))
    errors.description = "Description is required.";
  if (!trimStr(form.email)) errors.email = "Email is required.";
  if (!trimStr(form.phone)) errors.phone = "Phone is required.";
  else if (isPhoneValidInternational(trimStr(form.phone))) {
    errors.phone = "Enter a valid phone number (e.g. +1 555 000 0000).";
  }

  const website = trimStr(form.website);
  if (!website) errors.website = "Website is required.";
  else if (!isValidHttpUrl(website)) {
    errors.website = "Enter a valid URL (e.g. https://acme.com).";
  }

  if (!trimStr(form.subscription_tier))
    errors.subscription_tier = "Subscription tier is required.";

  const { max_bots: mb, max_calls_per_month: mc } = form;
  if (mb == null || Number.isNaN(Number(mb)) || Number(mb) < 1) {
    errors.max_bots = "Max bots must be at least 1.";
  }
  if (mc == null || Number.isNaN(Number(mc)) || Number(mc) < 1) {
    errors.max_calls_per_month = "Max calls per month must be at least 1.";
  }
}

function validateFormFields(form: CreateCompanyPayload): {
  valid: boolean;
  errors: FormErrors;
} {
  const errors: FormErrors = {};
  applyCompanyIdentityErrors(form, errors);
  applyContactWebsiteAndQuotaErrors(form, errors);
  return { valid: Object.keys(errors).length === 0, errors };
}

function resolveUserIsAdmin(
  user: { is_admin?: string | number | boolean | null } | undefined,
): boolean {
  if (!user) return false;
  const raw = user.is_admin;
  if (raw === true) return true;
  if (raw === false || raw == null) return false;
  if (typeof raw === "number") return raw === 1;
  const s = String(raw).trim().toLowerCase();
  return s === "1" || s === "true";
}

function useSessionCompany() {
  const { data: session } = useSession();
  const isAdmin = resolveUserIsAdmin(
    session?.user as
      | { is_admin?: string | number | boolean | null }
      | undefined,
  );
  const userCompanyIdentifier =
    (session?.user as { company_identifier?: string } | undefined)
      ?.company_identifier ?? "";
  const userCompanyName =
    (session?.user as { company_name?: string } | undefined)?.company_name ??
    userCompanyIdentifier;
  return { isAdmin, userCompanyIdentifier, userCompanyName };
}

type FormSetters = {
  setForm: React.Dispatch<React.SetStateAction<CreateCompanyPayload>>;
  setFormErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
  setShowAddModal: (v: boolean) => void;
  setShowEditModal: (v: boolean) => void;
  setSelectedRow: React.Dispatch<React.SetStateAction<CompanyRow | null>>;
  setShowDeleteModal: (v: boolean) => void;
  fetchCompanies: () => void;
};

async function submitAddCompany(
  form: CreateCompanyPayload,
  setters: FormSetters,
): Promise<void> {
  try {
    await postCompanies(buildCompanyRequestBody(form));
    toast.success("Company created");
    setters.setShowAddModal(false);
    setters.setForm(defaultCompanyFormState());
    setters.fetchCompanies();
  } catch (err: unknown) {
    const msg =
      (err as { response?: { data?: { detail?: string } }; message?: string })
        ?.response?.data?.detail ??
      (err as { message?: string })?.message ??
      "Create failed";
    toast.error(msg);
  }
}

async function submitEditCompany(
  form: CreateCompanyPayload,
  selectedRow: CompanyRow,
  setters: FormSetters,
): Promise<void> {
  try {
    const payload = buildCompanyRequestBody(form) as UpdateCompanyPayload;
    await putCompany(selectedRow.id ?? selectedRow.company_id ?? "", payload);
    toast.success("Company updated");
    setters.setShowEditModal(false);
    setters.setSelectedRow(null);
    setters.fetchCompanies();
  } catch (err: unknown) {
    const msg =
      (err as { response?: { data?: { detail?: string } }; message?: string })
        ?.response?.data?.detail ??
      (err as { message?: string })?.message ??
      "Update failed";
    toast.error(msg);
  }
}

async function submitDeleteCompany(
  selectedRow: CompanyRow,
  setters: FormSetters,
): Promise<void> {
  try {
    const response = await deleteCompany(
      selectedRow.id ?? selectedRow.company_id ?? "",
    );
    console.log("response", response);
    toast.success("Company deleted");
    setters.setShowDeleteModal(false);
    setters.setSelectedRow(null);
    setters.fetchCompanies();
  } catch (err: unknown) {
    const msg =
      (err as { response?: { data?: { detail?: string } }; message?: string })
        ?.response?.data?.detail ??
      (err as { message?: string })?.message ??
      "Delete failed";
    toast.error(msg);
  }
}

function openAddModal(
  setForm: React.Dispatch<React.SetStateAction<CreateCompanyPayload>>,
  setShowAddModal: (v: boolean) => void,
) {
  setShowAddModal(true);
  setForm(defaultCompanyFormState());
}

type CompanyFormFieldsProps = {
  mode: "create" | "edit";
  form: CreateCompanyPayload;
  setForm: React.Dispatch<React.SetStateAction<CreateCompanyPayload>>;
  formErrors: FormErrors;
  setFormErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
};

const CompanyFormFields = ({
  mode,
  form,
  setForm,
  formErrors,
  setFormErrors,
}: CompanyFormFieldsProps) => (
  <>
    <p className="text-muted small mb-3">
      {mode === "create"
        ? "Create company — fields match the API request body (company_id, name, description, …)."
        : "Edit company — same fields as create."}
    </p>
    <Form.Group className="mb-2">
      <Form.Label htmlFor={`company-form-company_id-${mode}`}>
        company_id <span className="text-danger">*</span>
      </Form.Label>
      <Form.Control
        id={`company-form-company_id-${mode}`}
        value={form.company_id || ""}
        onChange={(e) => {
          setForm((f) => ({ ...f, company_id: e.target.value }));
          setFormErrors((err) => ({ ...err, company_id: undefined }));
        }}
        placeholder="acme-corp"
        autoComplete="off"
        isInvalid={!!formErrors.company_id}
      />
      {formErrors.company_id && (
        <Form.Control.Feedback type="invalid">
          {formErrors.company_id}
        </Form.Control.Feedback>
      )}
    </Form.Group>
    <Form.Group className="mb-2">
      <Form.Label htmlFor={`company-form-name-${mode}`}>
        name <span className="text-danger">*</span>
      </Form.Label>
      <Form.Control
        id={`company-form-name-${mode}`}
        value={form.name || ""}
        onChange={(e) => {
          setForm((f) => ({ ...f, name: e.target.value }));
          setFormErrors((err) => ({ ...err, name: undefined }));
        }}
        placeholder="Acme Corporation"
        isInvalid={!!formErrors.name}
        autoComplete="organization"
      />
      {formErrors.name && (
        <Form.Control.Feedback type="invalid">
          {formErrors.name}
        </Form.Control.Feedback>
      )}
    </Form.Group>
    <Form.Group className="mb-2">
      <Form.Label htmlFor={`company-form-description-${mode}`}>
        description <span className="text-danger">*</span>
      </Form.Label>
      <Form.Control
        id={`company-form-description-${mode}`}
        as="textarea"
        rows={2}
        value={form.description || ""}
        onChange={(e) => {
          setForm((f) => ({ ...f, description: e.target.value }));
          setFormErrors((e) => ({ ...e, description: undefined }));
        }}
        placeholder="Short description"
        required
        isInvalid={!!formErrors.description}
      />
      {formErrors.description && (
        <Form.Text className="text-danger d-block mt-1">
          {formErrors.description}
        </Form.Text>
      )}
    </Form.Group>
    <Form.Group className="mb-2">
      <Form.Label htmlFor={`company-form-email-${mode}`}>
        email <span className="text-danger">*</span>
      </Form.Label>
      <Form.Control
        id={`company-form-email-${mode}`}
        type="email"
        value={form.email || ""}
        onChange={(e) => {
          setForm((f) => ({ ...f, email: e.target.value }));
          setFormErrors((e) => ({ ...e, email: undefined }));
        }}
        isInvalid={!!formErrors.email}
        placeholder="admin@acme.com"
      />
      {formErrors.email && (
        <Form.Control.Feedback type="invalid">
          {formErrors.email}
        </Form.Control.Feedback>
      )}
    </Form.Group>
    <Form.Group className="mb-2">
      <Form.Label htmlFor={`company-form-phone-${mode}`}>
        phone <span className="text-danger">*</span>
      </Form.Label>
      <div
        className={`phone-input-wrapper ${formErrors.phone ? "is-invalid" : ""}`}
        style={{ width: "100%" }}
      >
        <Form.Control
          id={`company-form-phone-${mode}`}
          type="text"
          value={form.phone || ""}
          onChange={(e) => {
            setForm((f) => ({ ...f, phone: e.target.value }));
            setFormErrors((e) => ({ ...e, phone: undefined }));
          }}
          isInvalid={!!formErrors.phone}
          placeholder="+1 555 000 0000"
        />
      </div>
      {formErrors.phone && (
        <Form.Text className="text-danger d-block mt-1">
          {formErrors.phone}
        </Form.Text>
      )}
    </Form.Group>
    <Form.Group className="mb-2">
      <Form.Label htmlFor={`company-form-website-${mode}`}>
        website <span className="text-danger">*</span>
      </Form.Label>
      <Form.Control
        id={`company-form-website-${mode}`}
        type="url"
        value={form.website || ""}
        onChange={(e) => {
          setForm((f) => ({ ...f, website: e.target.value }));
          setFormErrors((err) => ({ ...err, website: undefined }));
        }}
        isInvalid={!!formErrors.website}
        placeholder="https://acme.com"
      />
      {formErrors.website && (
        <Form.Control.Feedback type="invalid">
          {formErrors.website}
        </Form.Control.Feedback>
      )}
    </Form.Group>
    <Form.Group className="mb-2">
      <Form.Label htmlFor={`company-form-subscription_tier-${mode}`}>
        subscription_tier <span className="text-danger">*</span>
      </Form.Label>
      <Select<{ value: string; label: string }>
        inputId={`company-form-subscription_tier-${mode}`}
        options={SUBSCRIPTION_TIER_OPTIONS}
        value={
          SUBSCRIPTION_TIER_OPTIONS.find(
            (o) => o.value === form.subscription_tier,
          ) ?? SUBSCRIPTION_TIER_OPTIONS[0]
        }
        onChange={(option: SingleValue<{ value: string; label: string }>) => {
          setForm((f) => ({
            ...f,
            subscription_tier: option?.value ?? "free",
          }));
          setFormErrors((e) => ({ ...e, subscription_tier: undefined }));
        }}
        placeholder="Select tier..."
        className={formErrors.subscription_tier ? "is-invalid" : ""}
        classNamePrefix="react-select"
      />
      {formErrors.subscription_tier && (
        <Form.Text className="text-danger d-block mt-1">
          {formErrors.subscription_tier}
        </Form.Text>
      )}
    </Form.Group>
    <Form.Group className="mb-2">
      <Form.Label htmlFor={`company-form-max_bots-${mode}`}>
        max_bots <span className="text-danger">*</span>
      </Form.Label>
      <Form.Control
        id={`company-form-max_bots-${mode}`}
        type="number"
        min={1}
        value={form.max_bots ?? ""}
        onChange={(e) => {
          const raw = e.target.value;
          setForm((f) => ({
            ...f,
            max_bots: raw === "" ? undefined : Number(raw),
          }));
          setFormErrors((err) => ({ ...err, max_bots: undefined }));
        }}
        placeholder="1"
        isInvalid={!!formErrors.max_bots}
      />
      {formErrors.max_bots && (
        <Form.Control.Feedback type="invalid">
          {formErrors.max_bots}
        </Form.Control.Feedback>
      )}
    </Form.Group>
    <Form.Group className="mb-2">
      <Form.Label htmlFor={`company-form-max_calls_per_month-${mode}`}>
        max_calls_per_month <span className="text-danger">*</span>
      </Form.Label>
      <Form.Control
        id={`company-form-max_calls_per_month-${mode}`}
        type="number"
        min={1}
        step={1}
        value={form.max_calls_per_month ?? ""}
        onChange={(e) => {
          const raw = e.target.value;
          setForm((f) => ({
            ...f,
            max_calls_per_month: raw === "" ? undefined : Number(raw),
          }));
          setFormErrors((err) => ({ ...err, max_calls_per_month: undefined }));
        }}
        placeholder="100"
        isInvalid={!!formErrors.max_calls_per_month}
      />
      {formErrors.max_calls_per_month && (
        <Form.Control.Feedback type="invalid">
          {formErrors.max_calls_per_month}
        </Form.Control.Feedback>
      )}
    </Form.Group>
  </>
);

const CompaniesPage = () => {
  const { isAdmin, userCompanyIdentifier } = useSessionCompany();
  const [data, setData] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState<CompanyRow | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState<CreateCompanyPayload>(
    defaultCompanyFormState(),
  );
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewDetails, setViewDetails] = useState<{
    company: Record<string, unknown> | null;
    stats: Record<string, unknown> | null;
  }>({ company: null, stats: null });
  const [viewLoading, setViewLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const fetchCompanies = useCallback(
    () =>
      runFetchCompanies(
        showInactive,
        isAdmin,
        userCompanyIdentifier,
        setData,
        setLoading,
      ),
    [showInactive, isAdmin, userCompanyIdentifier],
  );

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const columns = buildCompaniesColumns({
    setViewDetails,
    setShowViewModal,
    setViewLoading,
    setSelectedRow,
    setShowEditModal,
    setForm,
    setShowDeleteModal,
  });

  const validateForm = () => {
    const result = validateFormFields(form);
    setFormErrors(result.errors);
    return result.valid;
  };

  const formSetters: FormSetters = {
    setForm,
    setFormErrors,
    setShowAddModal,
    setShowEditModal,
    setSelectedRow,
    setShowDeleteModal,
    fetchCompanies,
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fill all required fields correctly.");
      return;
    }
    setFormLoading(true);
    submitAddCompany(form, formSetters).finally(() => setFormLoading(false));
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRow) return;
    if (!validateForm()) {
      toast.error("Please fill all required fields correctly.");
      return;
    }
    setFormLoading(true);
    submitEditCompany(form, selectedRow, formSetters).finally(() =>
      setFormLoading(false),
    );
  };

  const handleDeleteConfirm = () => {
    if (!selectedRow) return;
    setDeleteLoading(true);
    submitDeleteCompany(selectedRow, formSetters).finally(() =>
      setDeleteLoading(false),
    );
  };

  const addCompanyFormFields = (
    <CompanyFormFields
      mode="create"
      form={form}
      setForm={setForm}
      formErrors={formErrors}
      setFormErrors={setFormErrors}
    />
  );
  const editCompanyFormFields = (
    <CompanyFormFields
      mode="edit"
      form={form}
      setForm={setForm}
      formErrors={formErrors}
      setFormErrors={setFormErrors}
    />
  );

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle=""
        mainLink=""
        subTitle="Voicebot Inbound - Companies"
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title style-2 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <h2 className="mb-0">Companies</h2>
            </div>
            <div className="d-flex align-items-center gap-2">
              <Form.Check
                type="switch"
                id="show-inactive"
                label="Show inactive"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
              <Button
                variant="primary"
                onClick={() => openAddModal(setForm, setShowAddModal)}
              >
                <Plus size={18} className="me-1" /> Add Company
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <GenericTable<CompanyRow>
        data={data}
        columns={columns}
        loading={loading}
        emptyMessage="No companies found."
        loadingMessage="Loading companies..."
        pagination={{
          currentPage: 1,
          rowsPerPage: 10,
          totalRows: data.length,
          pageSizeOptions: [10, 25, 50],
        }}
        uniqueKey="company_id"
        hover
        striped={false}
      />

      <Modal
        show={showAddModal}
        onHide={() => {
          setShowAddModal(false);
          setFormErrors({});
        }}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Add Company</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddSubmit}>
          <Modal.Body style={COMPANY_MODAL_BODY_STYLE}>
            {addCompanyFormFields}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setShowAddModal(false);
                setFormErrors({});
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={formLoading}>
              {formLoading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                "Create"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal
        show={showEditModal}
        onHide={() => {
          setShowEditModal(false);
          setSelectedRow(null);
          setFormErrors({});
        }}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Company</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body style={COMPANY_MODAL_BODY_STYLE}>
            {editCompanyFormFields}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setShowEditModal(false);
                setSelectedRow(null);
                setFormErrors({});
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={formLoading}>
              {formLoading ? <Spinner animation="border" size="sm" /> : "Save"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setSelectedRow(null);
        }}
        onConfirm={handleDeleteConfirm}
        itemName={selectedRow?.name}
        itemType="company"
        loading={deleteLoading}
      />

      <Modal
        show={showViewModal}
        onHide={() => setShowViewModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Company Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewLoading ? (
            <div className="d-flex justify-content-center align-items-center py-5">
              <Spinner animation="border" />
            </div>
          ) : (
            <div className="row g-3">
              {viewDetails.company && (
                <>
                  <div className="col-6 col-md-4">
                    <div className="card border h-100">
                      <div className="card-body py-2 px-3">
                        <div className="text-muted small">Name</div>
                        <div className="fw-medium">
                          {formatUnknownDisplay(viewDetails.company.name)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-6 col-md-4">
                    <div className="card border h-100">
                      <div className="card-body py-2 px-3">
                        <div className="text-muted small">Email</div>
                        <div className="fw-medium">
                          {typeof viewDetails.company.email === "string" &&
                          viewDetails.company.email.trim() !== "" ? (
                            <a
                              href={`mailto:${viewDetails.company.email}`}
                              className="text-primary text-decoration-underline"
                            >
                              {viewDetails.company.email}
                            </a>
                          ) : (
                            "—"
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-4">
                    <div className="card border h-100">
                      <div className="card-body py-2 px-3">
                        <div className="text-muted small">Phone</div>
                        <div className="fw-medium">
                          {formatUnknownDisplay(viewDetails.company.phone)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-4">
                    <div className="card border h-100">
                      <div className="card-body py-2 px-3">
                        <div className="text-muted small">Website</div>
                        <div className="fw-medium">
                          {formatUnknownDisplay(viewDetails.company.website)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-4">
                    <div className="card border h-100">
                      <div className="card-body py-2 px-3">
                        <div className="text-muted small">Tier</div>
                        <div className="fw-medium text-capitalize">
                          {formatUnknownDisplay(
                            viewDetails.company.subscription_tier,
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-4">
                    <div className="card border h-100">
                      <div className="card-body py-2 px-3">
                        <div className="text-muted small">Status</div>
                        <div className="fw-medium d-flex align-items-center gap-1">
                          {viewDetails.company.is_active ? (
                            <>
                              <span
                                className="badge bg-success rounded d-inline-flex align-items-center justify-content-center"
                                style={{ width: 18, height: 18 }}
                              >
                                ✓
                              </span>{" "}
                              Active
                            </>
                          ) : (
                            <>Inactive</>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
              {viewDetails.stats && (
                <>
                  <div className="col-6 col-md-4">
                    <div className="card border h-100">
                      <div className="card-body py-2 px-3">
                        <div className="text-muted small">Bots</div>
                        <div className="fw-medium">
                          {formatUnknownDisplay(viewDetails.stats.total_bots)} /{" "}
                          {formatUnknownDisplay(viewDetails.company?.max_bots)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-4">
                    <div className="card border h-100">
                      <div className="card-body py-2 px-3">
                        <div className="text-muted small">Published Bots</div>
                        <div className="fw-medium">
                          {formatUnknownDisplay(viewDetails.stats.active_bots)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-4">
                    <div className="card border h-100">
                      <div className="card-body py-2 px-3">
                        <div className="text-muted small">Total Calls</div>
                        <div className="fw-medium">
                          {formatUnknownDisplay(viewDetails.stats.total_calls)}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* <div className="col-6 col-md-4">
                    <div className="card border h-100">
                      <div className="card-body py-2 px-3">
                        <div className="text-muted small">Completed Calls</div>
                        <div className="fw-medium">{String(viewDetails.stats.completed_calls ?? "—")}</div>
                      </div>
                    </div>
                  </div> */}
                  <div className="col-6 col-md-4">
                    <div className="card border h-100">
                      <div className="card-body py-2 px-3">
                        <div className="text-muted small">Success Rate</div>
                        <div className="fw-medium">
                          {typeof viewDetails.stats.success_rate === "number"
                            ? `${viewDetails.stats.success_rate.toFixed(1)}%`
                            : "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-4">
                    <div className="card border h-100">
                      <div className="card-body py-2 px-3">
                        <div className="text-muted small">Total Cost</div>
                        <div className="fw-medium">
                          {typeof viewDetails.stats.total_cost === "number"
                            ? `$${viewDetails.stats.total_cost.toFixed(4)}`
                            : formatUnknownDisplay(viewDetails.stats.total_cost)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-4">
                    <div className="card border h-100">
                      <div className="card-body py-2 px-3">
                        <div className="text-muted small">Max Calls/Month</div>
                        <div className="fw-medium">
                          {formatUnknownDisplay(
                            viewDetails?.company?.max_calls_per_month,
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {viewDetails.company && (
            <>
              <Button
                variant="outline-success"
                onClick={async () => {
                  const id = unknownToString(
                    viewDetails.company?.id ??
                      viewDetails.company?.company_id,
                  );
                  try {
                    await activateCompany(id);
                    toast.success("Company activated");
                    const [companyRes, statsRes] = await Promise.all([
                      getCompany(id),
                      getCompanyStats(id),
                    ]);
                    setViewDetails({ company: companyRes, stats: statsRes });
                    fetchCompanies();
                  } catch (e: unknown) {
                    const msg =
                      (e as { response?: { data?: { detail?: string } } })
                        ?.response?.data?.detail ?? "Activate failed";
                    toast.error(msg);
                  }
                }}
                disabled={viewDetails.company?.is_active === true}
              >
                <Power size={14} className="me-1" /> Activate
              </Button>
              <Button
                variant="outline-warning"
                onClick={async () => {
                  const id = unknownToString(
                    viewDetails.company?.id ??
                      viewDetails.company?.company_id,
                  );
                  try {
                    await deactivateCompany(id);
                    toast.success("Company deactivated");
                    const [companyRes, statsRes] = await Promise.all([
                      getCompany(id),
                      getCompanyStats(id),
                    ]);
                    setViewDetails({ company: companyRes, stats: statsRes });
                    fetchCompanies();
                  } catch (e: unknown) {
                    const msg =
                      (e as { response?: { data?: { detail?: string } } })
                        ?.response?.data?.detail ?? "Deactivate failed";
                    toast.error(msg);
                  }
                }}
                disabled={viewDetails.company?.is_active === false}
              >
                <PowerOff size={14} className="me-1" /> Deactivate
              </Button>
            </>
          )}
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
};

CompaniesPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;
export default CompaniesPage;
