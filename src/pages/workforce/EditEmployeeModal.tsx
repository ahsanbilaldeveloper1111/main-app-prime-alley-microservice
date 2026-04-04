import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import Select from "@components/AppSelect";
import { Country } from "country-state-city";
import { toast } from "react-toastify";
import {
  getUserProfile,
  updateUserProfile,
  type UserProfile,
  type UserProfilePayload,
  type UserProfileAddress,
} from "@utils/staffManagement";
import { buildAddressesForUserProfilePayload } from "@utils/employeeAddressPayload";
import { mapUserProfileAddressToModalFields, type EmployeeModalAddressBase } from "@utils/employeeModalAddressMap";
import { isOptionalWorkforcePhoneValid } from "@utils/workforcePhoneValidation";
import { useMainAppLookups } from "@hooks/useMainAppLookups";
import EmployeeModalAddressSection, {
  type EmployeeModalAddressFieldKey,
} from "@components/workforce/EmployeeModalAddressSection";
import EmployeeModalProfileFields from "@components/workforce/EmployeeModalProfileFields";
import {
  employeeModalReactSelectStyles,
  fetchDepartmentUserRowsForModal,
  validateEmployeeModalAddressRows,
  validateEmployeeModalCoreRequiredFields,
  type DepartmentUserRow,
} from "@utils/workforce/employeeModalShared";

export type AddressFormItem = EmployeeModalAddressBase & { localId: string };

const defaultAddressTemplate: Omit<AddressFormItem, "localId"> = {
  name: "",
  zip_code: "",
  city: "",
  country: "",
  address: "",
  state: "",
  countryCode: "",
  stateCode: "",
};

function isEditEmployeeReadyToSubmit(
  form: Partial<UserProfilePayload>,
  addresses: AddressFormItem[],
  phoneFieldValid: boolean,
): boolean {
  if (!phoneFieldValid) return false;
  if (!validateEmployeeModalCoreRequiredFields(form).ok) return false;
  return validateEmployeeModalAddressRows(addresses).ok;
}

export interface EditEmployeeModalProps {
  show: boolean;
  onHide: () => void;
  /** The profile being edited; when null the modal content is not shown */
  profile: UserProfile | null;
  /** Called after save succeeds (e.g. refetch list); receives the updated profile id */
  onSuccess?: (profileId: number) => void;
  /** Optional modal title */
  title?: string;
}

const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({
  show,
  onHide,
  profile,
  onSuccess,
  title = "Edit Employee",
}) => {
  const { companyIdentifier, mainAppDepartments } = useMainAppLookups();
  const [form, setForm] = useState<Partial<UserProfilePayload>>({});
  const [addresses, setAddresses] = useState<AddressFormItem[]>([]);
  const [addressCountries, setAddressCountries] = useState<{ isoCode: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState<{ id: number; name?: string }[]>([]);
  const [departmentUsers, setDepartmentUsers] = useState<DepartmentUserRow[]>([]);
  const [loadingDepartmentUsers, setLoadingDepartmentUsers] = useState(false);
  const addressIdRef = useRef(0);

  const companyUuid =
    (profile && (profile as UserProfile & { tenant_id?: string }).tenant_id) ||
    companyIdentifier ||
    null;

  const toAddressFormItem = useCallback((address: UserProfileAddress): AddressFormItem => {
    addressIdRef.current += 1;
    return {
      ...mapUserProfileAddressToModalFields(address),
      localId: `addr-${addressIdRef.current}`,
    };
  }, []);

  const createDefaultAddress = useCallback((): AddressFormItem => {
    addressIdRef.current += 1;
    return {
      ...defaultAddressTemplate,
      localId: `addr-${addressIdRef.current}`,
    };
  }, []);

  const fetchDepartments = useCallback(
    (tenantId: string) => {
      if (!tenantId?.trim()) {
        setDepartments([]);
        return;
      }
      setDepartments(Array.isArray(mainAppDepartments) ? (mainAppDepartments as { id: number; name?: string }[]) : []);
    },
    [mainAppDepartments]
  );

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

  useEffect(() => {
    if (!show || !profile) return;
    setForm({
      user_id: profile.user_id ?? "",
      employee_code: profile.employee_code ?? "",
      identification_number: profile.identification_number ?? "",
      job_title: profile.job_title ?? "",
      designation: profile.designation ?? "",
      department_id: profile.department_id ?? null,
      location_id: profile.location_id ?? null,
      employment_type: profile.employment_type ?? "",
      contract_type: profile.contract_type ?? "",
      phone: profile.phone ?? "",
      status: profile.status ?? "active",
    });
    const addrs = (profile as UserProfile & { address_locations?: UserProfileAddress[] }).address_locations;
    setAddresses(
      Array.isArray(addrs) && addrs.length > 0
        ? addrs.map((a) => toAddressFormItem(a))
        : [createDefaultAddress()]
    );
    const tenantId = (profile as UserProfile & { tenant_id?: string }).tenant_id ?? "";
    fetchDepartments(tenantId);
    if (profile.department_id == null) setDepartmentUsers([]);
    getUserProfile(profile.id)
      .then((full) => {
        const fullAddrs = (full as UserProfile & { address_locations?: UserProfileAddress[] }).address_locations;
        if (Array.isArray(fullAddrs) && fullAddrs.length > 0) {
          setAddresses(fullAddrs.map((a) => toAddressFormItem(a)));
        }
      })
      .catch((error: unknown) => {
        console.error("Failed to refresh employee profile details", error);
      });
  }, [createDefaultAddress, fetchDepartments, profile, show, toAddressFormItem]);

  useEffect(() => {
    if (show && profile && form.department_id != null) {
      fetchUsersByDepartment(form.department_id);
    }
  }, [fetchUsersByDepartment, form.department_id, profile, show]);

  const userOptions = useMemo(
    () =>
      form.department_id == null
        ? []
        : departmentUsers.map((u) => ({ value: u.phone, label: `${u.name} (${u.phone})` })),
    [form.department_id, departmentUsers]
  );

  /** Match option by phone (form.user_id) or legacy numeric user id from API */
  const selectedUserOption = useMemo(() => {
    const raw = (form.user_id ?? "").toString().trim();
    if (raw === "" || userOptions.length === 0) return null;
    const byPhone = userOptions.find((o) => o.value === raw);
    if (byPhone) return byPhone;
    const userById = departmentUsers.find((u) => String(u.id) === raw);
    if (userById?.phone) {
      return userOptions.find((o) => o.value === userById.phone) ?? null;
    }
    return null;
  }, [departmentUsers, form.user_id, userOptions]);

  const userOptionsLoading = form.department_id == null ? false : loadingDepartmentUsers;

  const removeAddressById = useCallback((localId: string) => {
    setAddresses((prev) => prev.filter((a) => a.localId !== localId));
  }, []);

  const updateAddressField = useCallback((localId: string, key: EmployeeModalAddressFieldKey, value: string) => {
    setAddresses((prev) => prev.map((a) => (a.localId === localId ? { ...a, [key]: value } : a)));
  }, []);

  const updateAddressCountry = useCallback((localId: string, opt: { value: string; label: string } | null) => {
    setAddresses((prev) =>
      prev.map((a) =>
        a.localId === localId
          ? { ...a, country: opt?.label ?? "", countryCode: opt?.value ?? "", state: "", stateCode: "", city: "" }
          : a
      )
    );
  }, []);

  const updateAddressState = useCallback((localId: string, opt: { value: string; label: string } | null) => {
    setAddresses((prev) =>
      prev.map((a) => (a.localId === localId ? { ...a, state: opt?.label ?? "", stateCode: opt?.value ?? "", city: "" } : a))
    );
  }, []);

  const phoneFieldValid = useMemo(() => isOptionalWorkforcePhoneValid(form.phone), [form.phone]);
  const phoneShowInvalid = Boolean(form.phone?.toString().trim()) && !phoneFieldValid;
  const editSubmitReady = useMemo(
    () => isEditEmployeeReadyToSubmit(form, addresses, phoneFieldValid),
    [form, addresses, phoneFieldValid],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const coreValidation = validateEmployeeModalCoreRequiredFields(form);
    if (!coreValidation.ok) {
      toast.error(coreValidation.message);
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
      await updateUserProfile(profile.id, {
        tenant_id: companyUuid?.trim() || undefined,
        user_id: form.user_id?.toString().trim() || null,
        employee_code: form.employee_code?.toString().trim() || null,
        identification_number: form.identification_number?.toString().trim() || null,
        job_title: form.job_title?.toString().trim() || null,
        designation: form.designation?.toString().trim() || null,
        department_id: form.department_id ?? null,
        location_id: form.location_id ?? null,
        employment_type: form.employment_type?.toString().trim() || null,
        contract_type: form.contract_type?.toString().trim() || null,
        phone: form.phone?.toString().trim() || null,
        status: form.status?.toString().trim() || null,
        ...(addressesPayload ? { addresses: addressesPayload } : {}),
      });
      toast.success("Employee updated");
      onHide();
      onSuccess?.(profile.id);
    } catch {
      // toast handled in API
    } finally {
      setSubmitting(false);
    }
  };

  if (!profile) return null;

  return (
    <Modal size="lg" show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>
              {"Department "}
              <span className="text-danger">*</span>
            </Form.Label>
            <Form.Select value={form.department_id ?? ""} disabled>
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name ?? "—"}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>
              {"User "}
              <span className="text-danger">*</span>
            </Form.Label>
            <Select<{ value: string; label: string }>
              className="basic-single"
              classNamePrefix="select"
              placeholder="User"
              isClearable={false}
              isSearchable={false}
              isDisabled
              isLoading={false}
              options={userOptions}
              value={selectedUserOption}
              resetSearchOnValueChange={show}
              onChange={(opt) => setForm((f) => ({ ...f, user_id: opt?.value ?? "" }))}
              styles={employeeModalReactSelectStyles}
            />
            {!userOptionsLoading && form.department_id != null && userOptions.length === 0 && (
              <Form.Text className="text-muted">No users available for this department.</Form.Text>
            )}
          </Form.Group>
          <EmployeeModalProfileFields
            form={form}
            setForm={setForm}
            phoneShowInvalid={phoneShowInvalid}
            phoneDefaultCountry="PK"
            phoneHelpText="Select country then enter a complete phone number."
            employmentSelectRequired={false}
          />

          <EmployeeModalAddressSection
            addresses={addresses}
            addressCountries={addressCountries}
            getRowId={(a) => a.localId}
            onAddAddress={() => setAddresses((prev) => [...prev, createDefaultAddress()])}
            onRemoveRow={removeAddressById}
            onUpdateField={updateAddressField}
            onCountryChange={(rowId, opt) => updateAddressCountry(rowId, opt)}
            onStateChange={(rowId, opt) => updateAddressState(rowId, opt)}
            allowAdHocCityOption
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} type="button">Cancel</Button>
          <Button variant="primary" type="submit" disabled={submitting || !editSubmitReady}>
            {submitting ? "Saving…" : "Save"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default EditEmployeeModal;
