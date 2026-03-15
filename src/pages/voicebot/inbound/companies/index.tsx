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
import { GetCompanies } from "@utils/users";
import { Row, Col, Button, Modal, Form, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { Plus, Pencil, Trash2, Power, PowerOff, Eye } from "lucide-react";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import PhoneInput, { parsePhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import Select, { SingleValue } from "react-select";
import "@assets/scss/common.scss";

const SUBSCRIPTION_TIER_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "basic", label: "Basic" },
  { value: "pro", label: "Pro" },
  { value: "enterprise", label: "Enterprise" },
];

const getFlagImgSrc = (countryCode: string) =>
  `https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`;

type CompanyOption = { value: string; label: string };

function getCompanySelectOptions(
  isAdmin: boolean,
  companiesOptions: CompanyOption[],
  userCompanyIdentifier: string,
  userCompanyName: string
): CompanyOption[] {
  if (isAdmin) return companiesOptions;
  if (userCompanyIdentifier) return [{ value: userCompanyIdentifier, label: userCompanyName || userCompanyIdentifier }];
  return [];
}

function getCompanySelectValue(
  isAdmin: boolean,
  companiesOptions: CompanyOption[],
  formCompanyId: string,
  userCompanyIdentifier: string,
  userCompanyName: string
): CompanyOption | null {
  if (isAdmin) return companiesOptions.find((o) => o.value === formCompanyId) ?? null;
  if (userCompanyIdentifier) return { value: userCompanyIdentifier, label: userCompanyName || userCompanyIdentifier };
  return null;
}

function useCompaniesOptions() {
  const [companiesOptions, setCompaniesOptions] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    GetCompanies()
      .then((data) => {
        if (mounted && Array.isArray(data)) {
          const options = (data as Array<{ identifier?: string; company_id?: string; id?: string; name?: string }>).map((c) => {
            const id = c.identifier ?? c.company_id ?? c.id ?? "";
            return { value: String(id), label: String(c.name ?? id) };
          });
          setCompaniesOptions(options);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);
  return { companiesOptions, companiesOptionsLoading: loading };
}

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
            <img src={getFlagImgSrc(country)} alt={country} title={country} style={{ width: 20, height: 14, objectFit: "cover" }} />
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
  const list = Array.isArray(res) ? res : (res as { results?: unknown[]; data?: unknown[] })?.results ?? (res as { results?: unknown[]; data?: unknown[] })?.data ?? [];
  return Array.isArray(list) ? (list as CompanyRow[]) : [];
}

async function loadViewDetails(
  row: CompanyRow,
  setViewDetails: React.Dispatch<React.SetStateAction<{ company: Record<string, unknown> | null; stats: Record<string, unknown> | null }>>,
  setShowViewModal: (v: boolean) => void,
  setViewLoading: (v: boolean) => void
) {
  const id = row.company_id ?? row.id ?? "";
  setViewDetails({ company: null, stats: null });
  setShowViewModal(true);
  setViewLoading(true);
  try {
    const [companyRes, statsRes] = await Promise.all([getCompany(id), getCompanyStats(id)]);
    setViewDetails({ company: companyRes, stats: statsRes });
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { detail?: string } }; message?: string })?.response?.data?.detail ?? (e as { message?: string })?.message ?? "Failed to load details";
    toast.error(msg);
    setShowViewModal(false);
  } finally {
    setViewLoading(false);
  }
}

type CompaniesPageSetters = {
  setViewDetails: React.Dispatch<React.SetStateAction<{ company: Record<string, unknown> | null; stats: Record<string, unknown> | null }>>;
  setShowViewModal: (v: boolean) => void;
  setViewLoading: (v: boolean) => void;
  setSelectedRow: React.Dispatch<React.SetStateAction<CompanyRow | null>>;
  setShowEditModal: (v: boolean) => void;
  setForm: React.Dispatch<React.SetStateAction<CreateCompanyPayload & { company_id?: string; is_active?: boolean }>>;
  setShowDeleteModal: (v: boolean) => void;
};

function buildCompaniesColumns(setters: CompaniesPageSetters): TableColumn<CompanyRow>[] {
  const { setViewDetails, setShowViewModal, setViewLoading, setSelectedRow, setShowEditModal, setForm, setShowDeleteModal } = setters;
  return [
    { key: "name", label: "Name", sortable: true },
    { key: "email", label: "Email", sortable: true, render: (r) => r.email || "—" },
    { key: "phone", label: "Phone", sortable: true, render: (r) => <PhoneWithFlag phone={r.phone} /> },
    { key: "subscription_tier", label: "Tier", sortable: true, render: (r) => r.subscription_tier || "—" },
    {
      key: "max_bots",
      label: "Bots",
      sortable: true,
      render: (r: CompanyRow) => r.max_bots ? <span>{r.max_bots}/{Number(r?.bots_count ?? 0)}</span> : "—",
    },
    {
      key: "max_calls_per_month",
      label: "Max Calls/Month",
      sortable: true,
      render: (r: CompanyRow) => r.max_calls_per_month ? <span>{r.max_calls_per_month}</span> : "0",
    },
    {
      key: "is_active",
      label: "Status",
      sortable: true,
      render: (r) => (r.is_active === true ? <span className="status-badge success">Active</span> : <span className="status-badge danger">Inactive</span>),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="d-flex gap-1">
          <Button size="sm" variant="outline-secondary" onClick={() => loadViewDetails(row, setViewDetails, setShowViewModal, setViewLoading)}>
            <Eye size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline-primary"
            onClick={() => {
              setSelectedRow(row);
              setShowEditModal(true);
              setForm({
                company_id: row.company_id ?? "",
                name: row.name ?? "",
                description: row.description ?? "",
                email: row.email ?? "",
                phone: row.phone ?? "",
                website: row.website ?? "",
                subscription_tier: row.subscription_tier ?? "",
                max_bots: row.max_bots,
                max_calls_per_month: row.max_calls_per_month,
                is_active: row.is_active ?? true,
              });
            }}
          >
            <Pencil size={14} />
          </Button>
          <Button size="sm" variant="outline-danger" onClick={() => { setSelectedRow(row); setShowDeleteModal(true); }}>
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];
}

function getCompaniesParams(showInactive: boolean, isAdmin: boolean, userCompanyIdentifier: string) {
  const params: { show_inactive?: boolean; company_id?: string } = { show_inactive: showInactive };
  if (!isAdmin && userCompanyIdentifier) params.company_id = userCompanyIdentifier;
  return params;
}

function runFetchCompanies(
  showInactive: boolean,
  isAdmin: boolean,
  userCompanyIdentifier: string,
  setData: React.Dispatch<React.SetStateAction<CompanyRow[]>>,
  setLoading: (v: boolean) => void
) {
  setLoading(true);
  getCompanies(getCompaniesParams(showInactive, isAdmin, userCompanyIdentifier))
    .then((res) => setData(getCompaniesListFromResponse(res)))
    .catch((err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } }; message?: string })?.response?.data?.detail ?? (err as { message?: string })?.message ?? "Failed to load companies";
      toast.error(msg);
      setData([]);
    })
    .finally(() => setLoading(false));
}

type FormErrors = { name?: string; description?: string; email?: string; phone?: string; subscription_tier?: string };

function validateFormFields(
  form: CreateCompanyPayload & { company_id?: string },
  isPhoneValidE164: (phone: string) => boolean
): { valid: boolean; errors: FormErrors } {
  const errors: FormErrors = {};
  if (!form.company_id?.trim() || !form.name?.trim()) errors.name = "Company is required.";
  if (!form.description?.trim()) errors.description = "Description is required.";
  if (!form.email?.trim()) errors.email = "Email is required.";
  if (!form.phone?.trim()) errors.phone = "Phone is required.";
  else if (!isPhoneValidE164(form.phone)) errors.phone = "Phone must be a valid E.164 number.";
  if (!form.subscription_tier?.trim()) errors.subscription_tier = "Subscription tier is required.";
  return { valid: Object.keys(errors).length === 0, errors };
}

function isPhoneValidE164(phone: string): boolean {
  if (!phone?.trim()) return true;
  const parsed = parsePhoneNumber(phone);
  return parsed?.isValid() ?? false;
}

function useSessionCompany() {
  const { data: session } = useSession();
  const isAdmin = String(session?.user?.is_admin ?? "") === "1";
  const userCompanyIdentifier = (session?.user as { company_identifier?: string } | undefined)?.company_identifier ?? "";
  const userCompanyName = (session?.user as { company_name?: string } | undefined)?.company_name ?? userCompanyIdentifier;
  return { isAdmin, userCompanyIdentifier, userCompanyName };
}

type FormSetters = {
  setForm: React.Dispatch<React.SetStateAction<CreateCompanyPayload & { company_id?: string; is_active?: boolean }>>;
  setFormErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
  setShowAddModal: (v: boolean) => void;
  setShowEditModal: (v: boolean) => void;
  setSelectedRow: React.Dispatch<React.SetStateAction<CompanyRow | null>>;
  setShowDeleteModal: (v: boolean) => void;
  fetchCompanies: () => void;
};

async function submitAddCompany(form: CreateCompanyPayload & { company_id?: string; is_active?: boolean }, setters: FormSetters): Promise<void> {
  try {
    await postCompanies({ ...form, company_id: form.company_id || undefined, is_active: form.is_active ?? true } as CreateCompanyPayload & { is_active?: boolean });
    toast.success("Company created");
    setters.setShowAddModal(false);
    setters.setForm({ company_id: "", name: "", description: "", email: "", phone: "", website: "", subscription_tier: "", max_bots: undefined, max_calls_per_month: undefined, is_active: true });
    setters.fetchCompanies();
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { detail?: string } }; message?: string })?.response?.data?.detail ?? (err as { message?: string })?.message ?? "Create failed";
    toast.error(msg);
  }
}

async function submitEditCompany(
  form: CreateCompanyPayload & { company_id?: string; is_active?: boolean },
  selectedRow: CompanyRow,
  setters: FormSetters
): Promise<void> {
  try {
    const payload: UpdateCompanyPayload & { is_active?: boolean } = {
      name: form.name,
      description: form.description || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      website: form.website || undefined,
      subscription_tier: form.subscription_tier || undefined,
      max_bots: form.max_bots,
      max_calls_per_month: form.max_calls_per_month,
      company_id: selectedRow.company_id ?? selectedRow.id ?? "",
      is_active: form.is_active ?? true,
    };
    await putCompany(selectedRow.company_id ?? selectedRow.id ?? "", payload);
    toast.success("Company updated");
    setters.setShowEditModal(false);
    setters.setSelectedRow(null);
    setters.fetchCompanies();
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { detail?: string } }; message?: string })?.response?.data?.detail ?? (err as { message?: string })?.message ?? "Update failed";
    toast.error(msg);
  }
}

async function submitDeleteCompany(selectedRow: CompanyRow, setters: FormSetters): Promise<void> {
  try {
    await deleteCompany(selectedRow.company_id ?? selectedRow.id ?? "");
    toast.success("Company deleted");
    setters.setShowDeleteModal(false);
    setters.setSelectedRow(null);
    setters.fetchCompanies();
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { detail?: string } }; message?: string })?.response?.data?.detail ?? (err as { message?: string })?.message ?? "Delete failed";
    toast.error(msg);
  }
}

function openAddModal(
  isAdmin: boolean,
  userCompanyIdentifier: string,
  userCompanyName: string,
  setForm: React.Dispatch<React.SetStateAction<CreateCompanyPayload & { company_id?: string; is_active?: boolean }>>,
  setShowAddModal: (v: boolean) => void
) {
  setShowAddModal(true);
  if (!isAdmin && userCompanyIdentifier) {
    setForm((f) => ({ ...f, company_id: userCompanyIdentifier, name: userCompanyName || userCompanyIdentifier }));
  }
}

type CompanyFormFieldsProps = {
  form: CreateCompanyPayload & { company_id?: string; is_active?: boolean };
  setForm: React.Dispatch<React.SetStateAction<CreateCompanyPayload & { company_id?: string; is_active?: boolean }>>;
  formErrors: FormErrors;
  setFormErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
  isAdmin: boolean;
  companiesOptionsLoading: boolean;
  companySelectOptions: CompanyOption[];
  companySelectValue: CompanyOption | null;
};

const CompanyFormFields = ({
  form,
  setForm,
  formErrors,
  setFormErrors,
  isAdmin,
  companiesOptionsLoading,
  companySelectOptions,
  companySelectValue,
}: CompanyFormFieldsProps) => (
  <>
    <Form.Group className="mb-2">
      <Form.Label>Company <span className="text-danger">*</span></Form.Label>
      <Select<{ value: string; label: string }>
        options={companySelectOptions}
        value={companySelectValue}
        onChange={(option: SingleValue<{ value: string; label: string }>) => {
          if (!isAdmin) return;
          setForm((f) => ({ ...f, company_id: option?.value ?? "", name: option?.label ?? "" }));
          setFormErrors((e) => ({ ...e, name: undefined }));
        }}
        placeholder={isAdmin ? "Select company..." : undefined}
        isClearable={isAdmin}
        isDisabled={!isAdmin}
        isLoading={isAdmin && companiesOptionsLoading}
        className={formErrors.name ? "is-invalid" : ""}
        classNamePrefix="react-select"
      />
      {formErrors.name && <Form.Text className="text-danger d-block mt-1">{formErrors.name}</Form.Text>}
    </Form.Group>
    <Form.Group className="mb-2">
      <Form.Label>Description <span className="text-danger">*</span></Form.Label>
      <Form.Control
        as="textarea"
        rows={2}
        value={form.description || ""}
        onChange={(e) => { setForm((f) => ({ ...f, description: e.target.value })); setFormErrors((e) => ({ ...e, description: undefined })); }}
        placeholder="Description"
        required
        isInvalid={!!formErrors.description}
      />
      {formErrors.description && <Form.Text className="text-danger d-block mt-1">{formErrors.description}</Form.Text>}
    </Form.Group>
    <Form.Group className="mb-2">
      <Form.Label>Email <span className="text-danger">*</span></Form.Label>
      <Form.Control
        type="email"
        value={form.email || ""}
        onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); setFormErrors((e) => ({ ...e, email: undefined })); }}
        isInvalid={!!formErrors.email}
        placeholder="contact@company.com"
      />
      {formErrors.email && <Form.Control.Feedback type="invalid">{formErrors.email}</Form.Control.Feedback>}
    </Form.Group>
    <Form.Group className="mb-2">
      <Form.Label>Phone <span className="text-danger">*</span></Form.Label>
      <div className={`phone-input-wrapper ${formErrors.phone ? "is-invalid" : ""}`} style={{ width: "100%" }}>
        <PhoneInput
          international
          defaultCountry="US"
          value={form.phone || undefined}
          onChange={(value: string | undefined) => { setForm((f) => ({ ...f, phone: value || "" })); setFormErrors((e) => ({ ...e, phone: undefined })); }}
          placeholder="Enter phone number (E.164)"
          className={`form-control ${formErrors.phone ? "is-invalid" : ""}`}
        />
      </div>
      {(formErrors.phone || (form.phone?.trim() && !isPhoneValidE164(form.phone))) && (
        <Form.Text className="text-danger">{formErrors.phone || "Phone must be a valid E.164 number."}</Form.Text>
      )}
    </Form.Group>
    <Form.Group className="mb-2">
      <Form.Label>Website</Form.Label>
      <Form.Control
        type="url"
        value={form.website || ""}
        onChange={(e) => setForm((f) => ({ ...f, website: e.target.value.toLowerCase() }))}
        placeholder="https://company.com"
        style={{ textTransform: "lowercase" }}
      />
    </Form.Group>
    <Form.Group className="mb-2">
      <Form.Label>Subscription tier <span className="text-danger">*</span></Form.Label>
      <Select<{ value: string; label: string }>
        options={SUBSCRIPTION_TIER_OPTIONS}
        value={SUBSCRIPTION_TIER_OPTIONS.find((o) => o.value === form.subscription_tier) ?? null}
        onChange={(option: SingleValue<{ value: string; label: string }>) => {
          setForm((f) => ({ ...f, subscription_tier: option?.value ?? "" }));
          setFormErrors((e) => ({ ...e, subscription_tier: undefined }));
        }}
        placeholder="Select tier..."
        isClearable
        className={formErrors.subscription_tier ? "is-invalid" : ""}
        classNamePrefix="react-select"
      />
      {formErrors.subscription_tier && <Form.Text className="text-danger d-block mt-1">{formErrors.subscription_tier}</Form.Text>}
    </Form.Group>
    <Form.Group className="mb-2">
      <Form.Label>Max bots</Form.Label>
      <Form.Control
        type="number"
        min={1}
        value={form.max_bots ?? ""}
        onChange={(e) => setForm((f) => ({ ...f, max_bots: e.target.value ? Number(e.target.value) : undefined }))}
        placeholder="Enter number of bots"
      />
    </Form.Group>
    <Form.Group className="mb-2">
      <Form.Label>Max calls per month</Form.Label>
      <Form.Control
        type="number"
        min={100}
        step={100}
        value={form.max_calls_per_month ?? ""}
        onChange={(e) => setForm((f) => ({ ...f, max_calls_per_month: e.target.value ? Number(e.target.value) : undefined }))}
        placeholder="Enter number of calls per month"
      />
    </Form.Group>
    <Form.Group className="mb-2">
      <Form.Check
        type="checkbox"
        id="company-is-active"
        label="Is Active"
        checked={form.is_active === true}
        onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
      />
    </Form.Group>
  </>
);

const CompaniesPage = () => {
  const { isAdmin, userCompanyIdentifier, userCompanyName } = useSessionCompany();
  const [data, setData] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState<CompanyRow | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState<CreateCompanyPayload & { company_id?: string; is_active?: boolean }>({
    company_id: "",
    name: "",
    description: "",
    email: "",
    phone: "",
    website: "",
    subscription_tier: "",
    max_bots: undefined,
    max_calls_per_month: undefined,
    is_active: true,
  });
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewDetails, setViewDetails] = useState<{
    company: Record<string, unknown> | null;
    stats: Record<string, unknown> | null;
  }>({ company: null, stats: null });
  const [viewLoading, setViewLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    description?: string;
    email?: string;
    phone?: string;
    subscription_tier?: string;
  }>({});
  const { companiesOptions, companiesOptionsLoading } = useCompaniesOptions();

  const fetchCompanies = useCallback(
    () => runFetchCompanies(showInactive, isAdmin, userCompanyIdentifier, setData, setLoading),
    [showInactive, isAdmin, userCompanyIdentifier]
  );

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

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
    const result = validateFormFields(form, isPhoneValidE164);
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
    submitEditCompany(form, selectedRow, formSetters).finally(() => setFormLoading(false));
  };

  const handleDeleteConfirm = () => {
    if (!selectedRow) return;
    setDeleteLoading(true);
    submitDeleteCompany(selectedRow, formSetters).finally(() => setDeleteLoading(false));
  };

  const companySelectOptions = getCompanySelectOptions(isAdmin, companiesOptions, userCompanyIdentifier, userCompanyName);
  const companySelectValue = getCompanySelectValue(isAdmin, companiesOptions, form.company_id ?? "", userCompanyIdentifier, userCompanyName);

  const formFields = (
    <CompanyFormFields
      form={form}
      setForm={setForm}
      formErrors={formErrors}
      setFormErrors={setFormErrors}
      isAdmin={isAdmin}
      companiesOptionsLoading={companiesOptionsLoading}
      companySelectOptions={companySelectOptions}
      companySelectValue={companySelectValue}
    />
  );

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Voicebot Inbound - Companies" />
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
              <Button variant="primary" onClick={() => openAddModal(isAdmin, userCompanyIdentifier, userCompanyName, setForm, setShowAddModal)}>
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

      <Modal show={showAddModal} onHide={() => { setShowAddModal(false); setFormErrors({}); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Company</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddSubmit}>
          <Modal.Body>{formFields}</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowAddModal(false); setFormErrors({}); }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={formLoading}>
              {formLoading ? <Spinner animation="border" size="sm" /> : "Create"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showEditModal} onHide={() => { setShowEditModal(false); setSelectedRow(null); setFormErrors({}); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Company</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body>{formFields}</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowEditModal(false); setSelectedRow(null); setFormErrors({}); }}>
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
        onHide={() => { setShowDeleteModal(false); setSelectedRow(null); }}
        onConfirm={handleDeleteConfirm}
        itemName={selectedRow?.name}
        itemType="company"
        loading={deleteLoading}
      />

      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered size="lg">
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
                        <div className="fw-medium">{String(viewDetails.company.name ?? "—")}</div>
                      </div>
                    </div>
                  </div>
                 
                  <div className="col-6 col-md-4">
                    <div className="card border h-100">
                      <div className="card-body py-2 px-3">
                        <div className="text-muted small">Email</div>
                        <div className="fw-medium">
                          {viewDetails.company.email ? (
                            <a href={`mailto:${viewDetails.company.email}`} className="text-primary text-decoration-underline">
                              {String(viewDetails.company.email)}
                            </a>
                          ) : "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-4">
                    <div className="card border h-100">
                      <div className="card-body py-2 px-3">
                        <div className="text-muted small">Phone</div>
                        <div className="fw-medium">{String(viewDetails.company.phone ?? "—")}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-4">
                    <div className="card border h-100">
                      <div className="card-body py-2 px-3">
                        <div className="text-muted small">Website</div>
                        <div className="fw-medium">{String(viewDetails.company.website ?? "—")}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-4">
                    <div className="card border h-100">
                      <div className="card-body py-2 px-3">
                        <div className="text-muted small">Tier</div>
                        <div className="fw-medium text-capitalize">{String(viewDetails.company.subscription_tier ?? "—")}</div>
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
                              <span className="badge bg-success rounded d-inline-flex align-items-center justify-content-center" style={{ width: 18, height: 18 }}>✓</span>
                              {" "}
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
                          {String(viewDetails.stats.bots_count ?? "—")} / {String(viewDetails.stats.max_bots ?? "—")}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-4">
                    <div className="card border h-100">
                      <div className="card-body py-2 px-3">
                        <div className="text-muted small">Published Bots</div>
                        <div className="fw-medium">{String(viewDetails.stats.published_bots_count ?? "—")}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-4">
                    <div className="card border h-100">
                      <div className="card-body py-2 px-3">
                        <div className="text-muted small">Total Calls</div>
                        <div className="fw-medium">{String(viewDetails.stats.total_calls ?? "—")}</div>
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
                            : String(viewDetails.stats.total_cost ?? "—")}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-4">
                    <div className="card border h-100">
                      <div className="card-body py-2 px-3">
                        <div className="text-muted small">Max Calls/Month</div>
                        <div className="fw-medium">{String(viewDetails.stats.max_calls_per_month ?? "—")}</div>
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
                  const id = String(viewDetails.company?.company_id ?? viewDetails.company?.id ?? "");
                  try {
                    await activateCompany(id);
                    toast.success("Company activated");
                    const [companyRes, statsRes] = await Promise.all([getCompany(id), getCompanyStats(id)]);
                    setViewDetails({ company: companyRes, stats: statsRes });
                    fetchCompanies();
                  } catch (e: unknown) {
                    const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Activate failed";
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
                  const id = String(viewDetails.company?.company_id ?? viewDetails.company?.id ?? "");
                  try {
                    await deactivateCompany(id);
                    toast.success("Company deactivated");
                    const [companyRes, statsRes] = await Promise.all([getCompany(id), getCompanyStats(id)]);
                    setViewDetails({ company: companyRes, stats: statsRes });
                    fetchCompanies();
                  } catch (e: unknown) {
                    const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Deactivate failed";
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
