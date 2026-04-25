import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Form } from "react-bootstrap";
import { X } from "lucide-react";
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

export interface EditEmployeeModalProps {
  show: boolean;
  onHide: () => void;
  /** The profile being edited; when null the sidebar content is not shown */
  profile: UserProfile | null;
  /** Called after save succeeds (e.g. refetch list); receives the updated profile id */
  onSuccess?: (profileId: number) => void;
  /** Optional sidebar title */
  title?: string;
}

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

/** Validates if form is ready for submission */
function isEditEmployeeReadyToSubmit(
  form: Partial<UserProfilePayload>,
  addresses: AddressFormItemWithId[],
  phoneFieldValid: boolean,
): boolean {
  if (!phoneFieldValid) return false;
  const coreValidation = validateEmployeeModalCoreRequiredFields(form);
  if (!coreValidation.ok) return false;
  const addressValidation = validateEmployeeModalAddressRows(addresses);
  return addressValidation.ok;
}

/** Maps profile address to form item */
function mapProfileAddressToFormItem(address: UserProfileAddress): AddressFormItemWithId {
  return {
    ...mapUserProfileAddressToModalFields(address),
    uiId: createEmployeeModalAddressUiId(),
  };
}

/** Converts profile addresses or returns a single default */
function initializeAddressesFromProfile(
  addressList: UserProfileAddress[] | undefined
): AddressFormItemWithId[] {
  if (Array.isArray(addressList) && addressList.length > 0) {
    return addressList.map(mapProfileAddressToFormItem);
  }
  return [createDefaultAddress()];
}

/** Determines user select placeholder text based on loading/selection state */
function getEditEmployeeUserSelectPlaceholder(
  userOptionsLoading: boolean,
  hasDepartmentSelected: boolean,
): string {
  if (userOptionsLoading) return "Loading users…";
  if (hasDepartmentSelected) return "Select user";
  return "Select department first";
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
  const [addresses, setAddresses] = useState<AddressFormItemWithId[]>([]);
  const [addressCountries, setAddressCountries] = useState<{ isoCode: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState<{ id: number; name?: string }[]>([]);
  const [departmentUsers, setDepartmentUsers] = useState<DepartmentUserRow[]>([]);
  const [loadingDepartmentUsers, setLoadingDepartmentUsers] = useState(false);

  const companyUuid =
    (profile && (profile as UserProfile & { tenant_id?: string }).tenant_id) ||
    companyIdentifier ||
    null;

  // Initialize sidebar if profile changes
  useEffect(() => {
    try {
      setAddressCountries(Country.getAllCountries());
    } catch {
      setAddressCountries([]);
    }
  }, []);

  // Load profile data when modal opens
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
    setAddresses(initializeAddressesFromProfile(addrs));

    const tenantId = (profile as UserProfile & { tenant_id?: string }).tenant_id ?? "";
    if (tenantId.trim()) {
      setDepartments(
        Array.isArray(mainAppDepartments)
          ? (mainAppDepartments as { id: number; name?: string }[])
          : []
      );
    }

    if (profile.department_id == null) {
      setDepartmentUsers([]);
    }

    // Fetch full profile to ensure we have fresh address data
    getUserProfile(profile.id)
      .then((full: UserProfile) => {
        const fullAddrs = (full as UserProfile & { address_locations?: UserProfileAddress[] }).address_locations;
        setAddresses(initializeAddressesFromProfile(fullAddrs));
      })
      .catch((error: unknown) => {
        console.error("Failed to refresh employee profile details", error);
      });
  }, [profile, show, mainAppDepartments]);

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

  // Fetch users when department changes
  useEffect(() => {
    if (show && profile && form.department_id != null) {
      fetchUsersByDepartment(form.department_id);
    }
  }, [fetchUsersByDepartment, form.department_id, profile, show]);

  const hasDepartmentSelected = form.department_id !== null && form.department_id !== undefined;

  const userOptions = useMemo(() => {
    if (!hasDepartmentSelected) {
      return [];
    }
    return departmentUsers.map((u: DepartmentUserRow) => ({
      value: u.phone,
      label: `${u.name} (${u.phone})`,
    }));
  }, [hasDepartmentSelected, departmentUsers]);

  const departmentOptions = useMemo(
    () =>
      (departments ?? []).map((d: { id: number; name?: string }) => ({
        value: String(d.id),
        label: String(d.name ?? "—"),
      })),
    [departments]
  );

  const selectedUserOption = useMemo(() => {
    const raw = (form.user_id ?? "").toString().trim();
    if (raw === "" || userOptions.length === 0) return null;

    const byPhone = userOptions.find((o) => o.value === raw);
    if (byPhone) return byPhone;

    const userById = departmentUsers.find((u: DepartmentUserRow) => String(u.id) === raw);
    if (userById?.phone) {
      return userOptions.find((o) => o.value === userById.phone) ?? null;
    }
    return null;
  }, [departmentUsers, form.user_id, userOptions]);

  const userOptionsLoading = hasDepartmentSelected ? loadingDepartmentUsers : false;

  const userSelectPlaceholder = getEditEmployeeUserSelectPlaceholder(
    userOptionsLoading,
    hasDepartmentSelected,
  );

  const removeAddressById = useCallback((addressId: string) => {
    setAddresses((prev) => prev.filter((a: AddressFormItemWithId) => a.uiId !== addressId));
  }, []);

  const updateAddressField = useCallback(
    (addressId: string, field: AddressFieldKey, value: string) => {
      setAddresses((prev) =>
        prev.map((a: AddressFormItemWithId) =>
          a.uiId === addressId ? { ...a, [field]: value } : a
        )
      );
    },
    []
  );

  const updateAddressCountry = useCallback((addressId: string, opt: { value: string; label: string } | null) => {
    setAddresses((prev) =>
      prev.map((a: AddressFormItemWithId) =>
        a.uiId === addressId
          ? {
              ...a,
              country: opt?.label ?? "",
              countryCode: opt?.value ?? "",
              state: "",
              stateCode: "",
              city: "",
            }
          : a
      )
    );
  }, []);

  const updateAddressState = useCallback((addressId: string, opt: { value: string; label: string } | null) => {
    setAddresses((prev) =>
      prev.map((a: AddressFormItemWithId) =>
        a.uiId === addressId
          ? {
              ...a,
              state: opt?.label ?? "",
              stateCode: opt?.value ?? "",
              city: "",
            }
          : a
      )
    );
  }, []);

  const phoneFieldValid = useMemo(() => isOptionalWorkforcePhoneValid(form.phone), [form.phone]);
  const phoneShowInvalid = Boolean(form.phone?.toString().trim()) && !phoneFieldValid;
  const editSubmitReady = useMemo(
    () => isEditEmployeeReadyToSubmit(form, addresses, phoneFieldValid),
    [form, addresses, phoneFieldValid],
  );

  const handleCancelClick = useCallback(() => {
    onHide();
  }, [onHide]);

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
        addresses: addressesPayload,
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

  if (!show || !profile) return null;

  return (
    <>
      <style>
        {`
          .edit-employee-sidebar {
            font-family: "Lexend Deca", Helvetica, Arial, sans-serif;
            color: #141414;
          }
          .edit-employee-sidebar .form-control,
          .edit-employee-sidebar .form-select,
          .edit-employee-sidebar input,
          .edit-employee-sidebar select,
          .edit-employee-sidebar textarea {
            font-size: 14px;
            color: #141414;
          }
          .edit-employee-sidebar .form-control,
          .edit-employee-sidebar .form-select,
          .edit-employee-sidebar input,
          .edit-employee-sidebar select {
            min-height: 40px;
          }
          .edit-employee-sidebar .select__control {
            min-height: 40px;
            border-color: #8a8a8a;
            border-radius: 4px;
          }
          .edit-employee-sidebar .select__value-container,
          .edit-employee-sidebar .select__indicators {
            min-height: 40px;
          }
        `}
      </style>

      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          background: "transparent",
        }}
        aria-hidden="true"
      />

      <div
        className="edit-employee-sidebar"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "600px",
          height: "100vh",
          backgroundColor: "#ffffff",
          boxShadow: "-2px 0 8px rgba(0, 0, 0, 0.1)",
          zIndex: 999999,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #eaf0f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "#141414",
              margin: 0,
            }}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={handleCancelClick}
            style={{
              background: "transparent",
              border: "none",
              padding: "4px",
              cursor: "pointer",
              color: "#718096",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={24} />
          </button>
        </div>

        <Form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
          }}
        >
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "40px",
            }}
          >
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: "14px", fontWeight: 600, color: "#141414" }}>
                Department <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select value={form.department_id ?? ""} disabled>
                <option value="">Select department</option>
                {departmentOptions.map((d: { value: string; label: string }) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: "14px", fontWeight: 600, color: "#141414" }}>
                User <span className="text-danger">*</span>
              </Form.Label>
              <Select<{ value: string; label: string }>
                className="basic-single"
                classNamePrefix="select"
                placeholder={userSelectPlaceholder}
                isClearable={false}
                isSearchable={false}
                isDisabled
                isLoading={false}
                options={userOptions}
                value={selectedUserOption}
                resetSearchOnValueChange={show}
                onChange={(opt: { value: string; label: string } | null) =>
                  setForm((f: Partial<UserProfilePayload>) => ({
                    ...f,
                    user_id: opt?.value ?? "",
                  }))
                }
                styles={employeeModalReactSelectStyles}
              />
              {!userOptionsLoading && hasDepartmentSelected && userOptions.length === 0 && (
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
              getRowId={(a: AddressFormItemWithId) => a.uiId}
              onAddAddress={() => setAddresses((prev) => [...prev, createDefaultAddress()])}
              onRemoveRow={removeAddressById}
              onUpdateField={updateAddressField}
              onCountryChange={updateAddressCountry}
              onStateChange={updateAddressState}
              allowAdHocCityOption
            />
          </div>

          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid #eaf0f6",
              display: "flex",
              gap: "12px",
              justifyContent: "flex-start",
            }}
          >
            <button
              type="submit"
              disabled={submitting || !editSubmitReady}
              style={{
                padding: "10px 20px",
                backgroundColor: submitting || !editSubmitReady ? "#cbd5e0" : "#0091ae",
                color: "#ffffff",
                border: "none",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: submitting || !editSubmitReady ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleCancelClick}
              style={{
                padding: "10px 20px",
                backgroundColor: "transparent",
                color: "#141414",
                border: "1px solid #8a8a8a",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </Form>
      </div>
    </>
  );
};

export default EditEmployeeModal;
