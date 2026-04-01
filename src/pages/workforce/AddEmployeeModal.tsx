import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import Select from "@components/AppSelect";
import { Plus, Trash2 } from "lucide-react";
import { Country, State, City } from "country-state-city";
import { toast } from "react-toastify";
import { createUserProfile, getMainAppUsers, type UserProfilePayload, type UserProfileAddress } from "@utils/staffManagement";
import { useMainAppLookups } from "@hooks/useMainAppLookups";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

const EMPLOYMENT_TYPES = ["Full-Time", "Part-Time", "Contract", "Internship", "Freelance", "Temporary"];
const CONTRACT_TYPES = ["Permanent", "Temporary", "Freelance", "Fixed-term", "Probation"];
/** Address form row with country-state-city cascade fields */
export type AddressFormItem = UserProfileAddress & { state?: string; countryCode?: string; stateCode?: string };
type AddressFieldKey = "name" | "zip_code" | "city" | "country" | "address" | "state" | "countryCode" | "stateCode";
type AddressFormItemWithId = AddressFormItem & { uiId: string };
type DepartmentUserRow = { id: number; name: string; phone: string };
type MainAppUserApiRow = { id: number; name?: string; phone?: string | number | null; phone_no?: string | number | null };

const selectStyles = {
  control: (provided: Record<string, unknown>, state: { isFocused?: boolean }) => ({
    ...provided,
    minHeight: "48px",
    height: "48px",
    fontSize: "0.875rem",
    borderColor: state.isFocused ? "#86b7fe" : "#dee2e6",
    boxShadow: state.isFocused ? "0 0 0 0.2rem rgba(13, 110, 253, 0.25)" : "none",
    borderRadius: "0.375rem",
    "&:hover": {
      borderColor: state.isFocused ? "#86b7fe" : "#DBE0E5",
    },
  }),
  valueContainer: (provided: Record<string, unknown>) => ({
    ...provided,
    height: "48px",
    padding: "0 8px",
  }),
  input: (provided: Record<string, unknown>) => ({
    ...provided,
    margin: "0px",
    padding: "0px",
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  indicatorsContainer: (provided: Record<string, unknown>) => ({
    ...provided,
    height: "48px",
  }),
  placeholder: (provided: Record<string, unknown>) => ({
    ...provided,
    color: "#6c757d",
    fontSize: "0.875rem",
  }),
  singleValue: (provided: Record<string, unknown>) => ({
    ...provided,
    fontSize: "0.875rem",
    lineHeight: "1.5",
  }),
  multiValue: (provided: Record<string, unknown>) => ({
    ...provided,
    backgroundColor: "#e7f1ff",
    borderRadius: "0.25rem",
  }),
  multiValueLabel: (provided: Record<string, unknown>) => ({
    ...provided,
    color: "#0d6efd",
    fontSize: "0.875rem",
    padding: "2px 6px",
  }),
  multiValueRemove: (provided: Record<string, unknown>) => ({
    ...provided,
    color: "#0d6efd",
    "&:hover": {
      backgroundColor: "#b6d4fe",
      color: "#0d6efd",
    },
  }),
};

export interface AddEmployeeModalProps {
  show: boolean;
  onHide: () => void;
  /** Called after an employee is created successfully (e.g. to refetch list) */
  onSuccess?: () => void;
  /** Optional tenant/company UUID for the create payload */
  tenantId?: string;
  /** Optional modal title */
  title?: string;
}

const defaultForm: Partial<UserProfilePayload> = {
  user_id: "",
  employee_code: "",
  identification_number: "",
  job_title: "",
  designation: "",
  department_id: null,
  location_id: null,
  employment_type: "",
  contract_type: "",
  phone: "",
  status: "active",
};

/** React list key only; use cryptographically strong randomness (not Math.random). */
let addressUiIdFallbackSeq = 0;
function createAddressUiId(): string {
  const { crypto: webCrypto } = globalThis;
  if (webCrypto?.randomUUID) {
    return webCrypto.randomUUID();
  }
  if (webCrypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    webCrypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  addressUiIdFallbackSeq += 1;
  return `addr-${addressUiIdFallbackSeq}`;
}

const createDefaultAddress = (): AddressFormItemWithId => ({
  uiId: createAddressUiId(),
  name: "",
  zip_code: "",
  city: "",
  country: "",
  address: "",
  state: "",
  countryCode: "",
  stateCode: "",
});

function userPhoneFromRow(user: MainAppUserApiRow): string {
  const raw = user.phone ?? user.phone_no;
  if (raw == null) return "";
  return String(raw).trim();
}

const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
  show,
  onHide,
  onSuccess,
  tenantId,
  title = "Add Employee",
}) => {
  const { mainAppDepartments, loadingDepartments, companyIdentifier } = useMainAppLookups();
  const [form, setForm] = useState<Partial<UserProfilePayload>>(defaultForm);
  const [addresses, setAddresses] = useState<AddressFormItemWithId[]>([]);
  const [addressCountries, setAddressCountries] = useState<{ isoCode: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [departmentUsers, setDepartmentUsers] = useState<DepartmentUserRow[]>([]);
  const [loadingDepartmentUsers, setLoadingDepartmentUsers] = useState(false);

  const companyUuid = tenantId?.trim() || companyIdentifier || null;

  const fetchUsersByDepartment = useCallback(
    async (departmentId: number) => {
      if (!companyUuid) {
        setDepartmentUsers([]);
        return;
      }
      setLoadingDepartmentUsers(true);
      try {
        const usersRaw = await getMainAppUsers(companyUuid, { department_id: departmentId });
        const list = Array.isArray(usersRaw)
          ? (usersRaw as MainAppUserApiRow[])
              .map((u) => ({
                id: u.id,
                name: u.name ?? "—",
                phone: userPhoneFromRow(u),
              }))
              .filter((u) => u.phone !== "")
          : [];
        setDepartmentUsers(list);
      } catch {
        setDepartmentUsers([]);
      } finally {
        setLoadingDepartmentUsers(false);
      }
    },
    [companyUuid]
  );

  useEffect(() => {
    try {
      setAddressCountries(Country.getAllCountries());
    } catch {
      setAddressCountries([]);
    }
  }, []);

  useEffect(() => {
    if (show) {
      setForm(defaultForm);
      setAddresses([]);
      setDepartmentUsers([]);
    }
  }, [show]);

  const mainAppDepartmentOptions = useMemo(
    () => (mainAppDepartments ?? []).map((d) => ({ value: String(d.id), label: String(d.name ?? "—") })),
    [mainAppDepartments]
  );

  const hasDepartmentSelected = form.department_id !== null && form.department_id !== undefined;
  const mainAppUserOptions = useMemo(() => {
    if (!hasDepartmentSelected) {
      return [];
    }
    return departmentUsers.map((u) => ({ value: u.phone, label: `${u.name} (${u.phone})` }));
  }, [hasDepartmentSelected, departmentUsers]);

  const userOptionsLoading = hasDepartmentSelected ? loadingDepartmentUsers : false;
  let userSelectPlaceholder = "Select user";
  if (!hasDepartmentSelected) {
    userSelectPlaceholder = "Select department first";
  } else if (userOptionsLoading) {
    userSelectPlaceholder = "Loading users…";
  }

  const removeAddressById = useCallback((addressId: string) => {
    setAddresses((prev) => prev.filter((addr) => addr.uiId !== addressId));
  }, []);

  const updateAddressField = useCallback(
    (addressId: string, field: AddressFieldKey, value: string) => {
      setAddresses((prev) => prev.map((addr) => (addr.uiId === addressId ? { ...addr, [field]: value } : addr)));
    },
    []
  );

  const updateAddressPatch = useCallback((addressId: string, patch: Partial<AddressFormItemWithId>) => {
    setAddresses((prev) => prev.map((addr) => (addr.uiId === addressId ? { ...addr, ...patch } : addr)));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.user_id?.toString().trim()) {
      toast.error("User ID is required");
      return;
    }
    if (!form.department_id) {
      toast.error("Department is required");
      return;
    }
    if (!form.employment_type?.toString().trim()) {
      toast.error("Employment type is required");
      return;
    }
    if (!form.contract_type?.toString().trim()) {
      toast.error("Contract type is required");
      return;
    }
    if (!form.designation?.toString().trim()) {
      toast.error("Designation is required");
      return;
    }
    setSubmitting(true);
    try {
      await createUserProfile({
        tenant_id: tenantId?.trim() || undefined,
        user_id: String(form.user_id).trim(),
        employee_code: form.employee_code?.toString().trim() || null,
        identification_number: form.identification_number?.toString().trim() || null,
        job_title: form.job_title?.toString().trim() || null,
        department_id: form.department_id ?? null,
        location_id: form.location_id ?? null,
        employment_type: form.employment_type?.toString().trim() || null,
        designation: form.designation?.toString().trim() || null,
        contract_type: form.contract_type?.toString().trim() || null,
        phone: form.phone?.toString().trim() || null,
        status: form.status?.toString().trim() || null,
        addresses: (addresses ?? []).map(({ name, zip_code, city, country, address }) => ({
          name,
          zip_code,
          city,
          country,
          address,
        })),
      });
      toast.success("Employee created");
      onHide();
      onSuccess?.();
    } catch {
      // toast handled in API
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal size="lg" show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Department <span className="text-danger">*</span> </Form.Label>
            <Select<{ value: string; label: string }>
              className="basic-single"
              classNamePrefix="select"
              placeholder={loadingDepartments ? "Loading departments…" : "Select department"}
              isClearable
              isSearchable
              isDisabled={loadingDepartments}
              isLoading={loadingDepartments}
              options={mainAppDepartmentOptions}
              value={mainAppDepartmentOptions.find((o) => o.value === String(form.department_id ?? "")) ?? null}
              resetSearchOnValueChange={show}
              onChange={(opt) => {
                const deptId = opt?.value == null || opt.value === "" ? null : (Number(opt.value) || opt.value) as number;
                setForm((f) => ({ ...f, department_id: deptId, user_id: "" }));
                if (deptId == null) {
                  setDepartmentUsers([]);
                  return;
                }
                fetchUsersByDepartment(deptId);
              }}
              styles={selectStyles}
            />
            {loadingDepartments && <Form.Text className="text-muted">Loading…</Form.Text>}
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>User <span className="text-danger">*</span> </Form.Label>
            <Select<{ value: string; label: string }>
              className="basic-single"
              classNamePrefix="select"
              placeholder={userSelectPlaceholder}
              isClearable
              isSearchable
              isDisabled={!hasDepartmentSelected || userOptionsLoading}
              isLoading={userOptionsLoading}
              options={mainAppUserOptions}
              value={mainAppUserOptions.find((o) => o.value === (form.user_id ?? "")) ?? null}
              resetSearchOnValueChange={show}
              onChange={(opt) => setForm((f) => ({ ...f, user_id: opt?.value ?? "" }))}
              styles={selectStyles}
            />
            {!userOptionsLoading && hasDepartmentSelected && mainAppUserOptions.length === 0 && (
              <Form.Text className="text-muted">No users available for this department.</Form.Text>
            )}
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Employee Code</Form.Label>
            <Form.Control
              value={form.employee_code ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, employee_code: e.target.value }))}
              placeholder="Employee code"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Identification Number (CNIC)</Form.Label>
            <Form.Control
              value={form.identification_number ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, identification_number: e.target.value }))}
              placeholder="CNIC / ID"
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Designation <span className="text-danger">*</span> </Form.Label>
            <Form.Control
              value={form.designation ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
              placeholder="Designation"
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Employment Type <span className="text-danger">*</span> </Form.Label>
            <Form.Select
              value={form.employment_type ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, employment_type: e.target.value }))}
              required
            >
              <option value="">Select employment type</option>
              {EMPLOYMENT_TYPES.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Contract Type <span className="text-danger">*</span> </Form.Label>
            <Form.Select
              value={form.contract_type ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, contract_type: e.target.value }))}
              required
            >
              <option value="">Select contract type</option>
              {CONTRACT_TYPES.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Phone</Form.Label>
            <div className="phone-input-wrapper">
              <PhoneInput
                international
                defaultCountry="US"
                value={form.phone && form.phone.trim() !== "" ? form.phone : undefined}
                onChange={(value: string | undefined) =>
                  setForm((f) => ({ ...f, phone: value && value.trim() !== "" ? value : "" }))
                }
                placeholder="Enter phone number"
              />
            </div>
            <Form.Text className="text-muted">
              Select country (e.g. +92) then enter the phone number.
            </Form.Text>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Status</Form.Label>
            <Form.Select value={form.status ?? "active"} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Form.Select>
          </Form.Group>

          {/* Addresses */}
          <div className="card em-card mb-3">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                <div className="em-section-title mb-0">Addresses</div>
                <Button
                  type="button"
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setAddresses((prev) => [...prev, createDefaultAddress()])}
                >
                  <Plus className="me-1" size={14} />
                  Add Address
                </Button>
              </div>
              <div className="d-flex flex-column gap-3">
                {addresses.length === 0 ? (
                  <div className="text-muted small">No addresses added. Click &quot;Add Address&quot; to add one.</div>
                ) : (
                  addresses.map((addr, idx) => {
                    const countryOptions = addressCountries.map((c) => ({ value: c.isoCode, label: c.name }));
                    const stateOptions = (addr.countryCode
                      ? State.getStatesOfCountry(addr.countryCode)
                      : []
                    ).map((s) => ({ value: s.isoCode, label: s.name }));
                    const cityOptions =
                      addr.countryCode && addr.stateCode
                        ? City.getCitiesOfState(addr.countryCode, addr.stateCode).map((c) => ({
                            value: c.name,
                            label: c.name,
                          }))
                        : [];
                    return (
                      <div key={addr.uiId} className="p-3 bg-light rounded">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div className="fw-semibold">Address #{idx + 1}</div>
                          <Button
                            type="button"
                            variant="outline-danger"
                            size="sm"
                            onClick={() => removeAddressById(addr.uiId)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <Form.Group>
                              <Form.Label>Name</Form.Label>
                              <Form.Control
                                value={addr.name ?? ""}
                                onChange={(e) => updateAddressField(addr.uiId, "name", e.target.value)}
                                placeholder="e.g. Head Office"
                              />
                            </Form.Group>
                          </div>
                          <div className="col-md-6">
                            <Form.Group>
                              <Form.Label>Zip / Postal Code</Form.Label>
                              <Form.Control
                                value={addr.zip_code ?? ""}
                                onChange={(e) => updateAddressField(addr.uiId, "zip_code", e.target.value)}
                                placeholder="Zip / Postal Code"
                              />
                            </Form.Group>
                          </div>
                          <div className="col-md-6">
                            <Form.Group>
                              <Form.Label>Country</Form.Label>
                              <Select<{ value: string; label: string }>
                                className="basic-single"
                                classNamePrefix="select"
                                isClearable
                                isSearchable
                                options={countryOptions}
                                placeholder="Select Country"
                                value={
                                  addr.countryCode ? countryOptions.find((o) => o.value === addr.countryCode) ?? null : null
                                }
                                onChange={(opt) =>
                                  updateAddressPatch(addr.uiId, {
                                    country: opt?.label ?? "",
                                    countryCode: opt?.value ?? "",
                                    state: "",
                                    stateCode: "",
                                    city: "",
                                  })
                                }
                                styles={selectStyles}
                              />
                            </Form.Group>
                          </div>
                          <div className="col-md-6">
                            <Form.Group>
                              <Form.Label>State</Form.Label>
                              <Select<{ value: string; label: string }>
                                className="basic-single"
                                classNamePrefix="select"
                                isClearable
                                isSearchable
                                options={stateOptions}
                                placeholder="Select State"
                                isDisabled={!addr.countryCode}
                                value={
                                  addr.stateCode ? stateOptions.find((o) => o.value === addr.stateCode) ?? null : null
                                }
                                onChange={(opt) =>
                                  updateAddressPatch(addr.uiId, {
                                    state: opt?.label ?? "",
                                    stateCode: opt?.value ?? "",
                                    city: "",
                                  })
                                }
                                styles={selectStyles}
                              />
                            </Form.Group>
                          </div>
                          <div className="col-md-6">
                            <Form.Group>
                              <Form.Label>City</Form.Label>
                              <Select<{ value: string; label: string }>
                                className="basic-single"
                                classNamePrefix="select"
                                isClearable
                                isSearchable
                                options={cityOptions}
                                placeholder="Select City"
                                isDisabled={!addr.stateCode}
                                value={addr.city ? cityOptions.find((o) => o.value === addr.city) ?? null : null}
                                onChange={(opt) => updateAddressField(addr.uiId, "city", opt?.value ?? "")}
                                styles={selectStyles}
                              />
                            </Form.Group>
                          </div>
                          <div className="col-md-6" />
                          <div className="col-12">
                            <Form.Group>
                              <Form.Label>Address</Form.Label>
                              <Form.Control
                                as="textarea"
                                rows={2}
                                value={addr.address ?? ""}
                                onChange={(e) => updateAddressField(addr.uiId, "address", e.target.value)}
                                placeholder="Street address"
                              />
                            </Form.Group>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="text-muted small mt-2">
                Addresses are stored as multiple Location records linked to this employee profile.
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AddEmployeeModal;
