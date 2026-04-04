import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import Select from "@components/AppSelect";
import { Country } from "country-state-city";
import { toast } from "react-toastify";
import { createUserProfile, type UserProfilePayload } from "@utils/staffManagement";
import { buildAddressesForUserProfilePayload } from "@utils/employeeAddressPayload";
import type { EmployeeModalAddressBase } from "@utils/employeeModalAddressMap";
import { isOptionalWorkforcePhoneValid } from "@utils/workforcePhoneValidation";
import { useMainAppLookups } from "@hooks/useMainAppLookups";
import EmployeeModalAddressSection, {
  type EmployeeModalAddressFieldKey,
} from "@components/workforce/EmployeeModalAddressSection";
import EmployeeModalProfileFields from "@components/workforce/EmployeeModalProfileFields";
import {
  createEmployeeModalAddressUiId,
  employeeModalReactSelectStyles,
  fetchDepartmentUserRowsForModal,
  validateEmployeeModalAddressRows,
  validateEmployeeModalCoreRequiredFields,
  type DepartmentUserRow,
} from "@utils/workforce/employeeModalShared";

export type AddressFormItem = EmployeeModalAddressBase;
type AddressFieldKey = EmployeeModalAddressFieldKey;
type AddressFormItemWithId = AddressFormItem & { uiId: string };

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

const createDefaultAddress = (): AddressFormItemWithId => ({
  uiId: createEmployeeModalAddressUiId(),
  name: "",
  zip_code: "",
  city: "",
  country: "",
  address: "",
  state: "",
  countryCode: "",
  stateCode: "",
});

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
        const list = await fetchDepartmentUserRowsForModal(companyUuid, departmentId);
        setDepartmentUsers(list);
      } finally {
        setLoadingDepartmentUsers(false);
      }
    },
    [companyUuid],
  );

  useEffect(() => {
    try {
      setAddressCountries(Country.getAllCountries());
    } catch {
      setAddressCountries([]);
    }
  }, []);

  const resetFormState = useCallback(() => {
    setForm(defaultForm);
    setAddresses([]);
    setDepartmentUsers([]);
  }, []);

  /** Reset + close for Cancel, header close, and submit success; backdrop/Esc are disabled on Modal. */
  const handleCancelClick = useCallback(() => {
    resetFormState();
    onHide();
  }, [onHide, resetFormState]);

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

  const requiredValidation = useMemo(() => validateEmployeeModalCoreRequiredFields(form), [form]);
  const addressRowsValidation = useMemo(() => validateEmployeeModalAddressRows(addresses), [addresses]);
  const phoneFieldValid = useMemo(() => isOptionalWorkforcePhoneValid(form.phone), [form.phone]);
  const phoneShowInvalid = Boolean(form.phone?.toString().trim()) && !phoneFieldValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateEmployeeModalCoreRequiredFields(form);
    if (!validation.ok) {
      toast.error(validation.message);
      return;
    }
    if (!phoneFieldValid) {
      toast.error("Enter a valid phone number or clear the field.");
      return;
    }
    const addressValidation = validateEmployeeModalAddressRows(addresses);
    if (!addressValidation.ok) {
      toast.error(addressValidation.message);
      return;
    }
    setSubmitting(true);
    try {
      const addressesPayload = buildAddressesForUserProfilePayload(addresses ?? []);
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
        ...(addressesPayload ? { addresses: addressesPayload } : {}),
      });
      toast.success("Employee created");
      resetFormState();
      onHide();
      onSuccess?.();
    } catch {
      // toast handled in API
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal size="lg" show={show} onHide={handleCancelClick} centered>
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
              styles={employeeModalReactSelectStyles}
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
              styles={employeeModalReactSelectStyles}
            />
            {!userOptionsLoading && hasDepartmentSelected && mainAppUserOptions.length === 0 && (
              <Form.Text className="text-muted">No users available for this department.</Form.Text>
            )}
          </Form.Group>
          <EmployeeModalProfileFields
            form={form}
            setForm={setForm}
            phoneShowInvalid={phoneShowInvalid}
            phoneDefaultCountry="US"
            phoneHelpText="Select country (e.g. +92) then enter a complete phone number."
            employmentSelectRequired
          />

          <EmployeeModalAddressSection
            addresses={addresses}
            addressCountries={addressCountries}
            getRowId={(a) => a.uiId}
            onAddAddress={() => setAddresses((prev) => [...prev, createDefaultAddress()])}
            onRemoveRow={removeAddressById}
            onUpdateField={updateAddressField}
            onCountryChange={(rowId, opt) =>
              updateAddressPatch(rowId, {
                country: opt?.label ?? "",
                countryCode: opt?.value ?? "",
                state: "",
                stateCode: "",
                city: "",
              })
            }
            onStateChange={(rowId, opt) =>
              updateAddressPatch(rowId, {
                state: opt?.label ?? "",
                stateCode: opt?.value ?? "",
                city: "",
              })
            }
            allowAdHocCityOption={false}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancelClick} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={
              submitting ||
              !requiredValidation.ok ||
              !addressRowsValidation.ok ||
              !phoneFieldValid
            }
          >
            {submitting ? "Creating…" : "Create"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AddEmployeeModal;
