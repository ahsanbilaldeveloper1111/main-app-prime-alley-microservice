import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Form } from "react-bootstrap";
import { X } from "lucide-react";
import Select from "@components/AppSelect";
import { Country } from "country-state-city";
import { toast } from "react-toastify";
import { createUserProfile, type UserProfilePayload } from "@utils/staffManagement";
import { reportApiErrorFromCatch } from "@utils/sentryLogger";
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
  validateEmployeeModalAddressRows,
  validateEmployeeModalCoreRequiredFields,
  type DepartmentUserRow,
} from "@utils/workforce/employeeModalShared";
import { workforceKeys } from "@query/keys";
import "@assets/scss/workforceEmployeeModalSidebar.scss";
import { useEmployeeModalDepartmentUsersQuery } from "./employeeModalQueries";

export type AddressFormItem = EmployeeModalAddressBase;
type AddressFieldKey = EmployeeModalAddressFieldKey;
type AddressFormItemWithId = AddressFormItem & { uiId: string };
type EmployeeSelectOption = { value: string; label: string };
type AddressSelectOption = { label?: string; value?: string } | null;

type SidebarSelectFieldProps = {
  label: string;
  required?: boolean;
  placeholder: string;
  disabled: boolean;
  loading: boolean;
  options: EmployeeSelectOption[];
  value: EmployeeSelectOption | null;
  onChange: (option: EmployeeSelectOption | null) => void;
  resetSearchOnValueChange: boolean;
  helpText?: string;
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

function getEmployeeUserSelectPlaceholder(
  hasDepartmentSelected: boolean,
  userOptionsLoading: boolean,
): string {
  if (!hasDepartmentSelected) return "Select department first";
  if (userOptionsLoading) return "Loading users…";
  return "Select user";
}

function findSelectedOption(
  options: EmployeeSelectOption[],
  selectedValue: string,
): EmployeeSelectOption | null {
  return options.find((option: EmployeeSelectOption) => option.value === selectedValue) ?? null;
}

function createCountryAddressPatch(
  option: AddressSelectOption,
): Partial<AddressFormItemWithId> {
  return {
    country: option?.label ?? "",
    countryCode: option?.value ?? "",
    state: "",
    stateCode: "",
    city: "",
  };
}

function createStateAddressPatch(
  option: AddressSelectOption,
): Partial<AddressFormItemWithId> {
  return {
    state: option?.label ?? "",
    stateCode: option?.value ?? "",
    city: "",
  };
}

const SidebarSelectField: React.FC<SidebarSelectFieldProps> = ({
  label,
  required = false,
  placeholder,
  disabled,
  loading,
  options,
  value,
  onChange,
  resetSearchOnValueChange,
  helpText,
}) => (
  <Form.Group className="mb-3">
    <Form.Label className="workforce-employee-modal-sidebar__label">
      {label}
      {required && <span className="text-danger">*</span>}
    </Form.Label>
    <Select<EmployeeSelectOption>
      className="basic-single"
      classNamePrefix="select"
      placeholder={placeholder}
      isClearable
      isSearchable
      isDisabled={disabled}
      isLoading={loading}
      options={options}
      value={value}
      resetSearchOnValueChange={resetSearchOnValueChange}
      onChange={onChange}
      styles={employeeModalReactSelectStyles}
    />
    {helpText && <Form.Text className="text-muted">{helpText}</Form.Text>}
  </Form.Group>
);

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
  const queryClient = useQueryClient();
  const { mainAppDepartments, loadingDepartments, companyIdentifier } = useMainAppLookups();
  const [form, setForm] = useState<Partial<UserProfilePayload>>(defaultForm);
  const [addresses, setAddresses] = useState<AddressFormItemWithId[]>([]);
  const [addressCountries, setAddressCountries] = useState<{ isoCode: string; name: string }[]>([]);

  const companyUuid = tenantId?.trim() || companyIdentifier || null;

  const hasDepartmentSelected = form.department_id !== null && form.department_id !== undefined;

  const departmentUsersQuery = useEmployeeModalDepartmentUsersQuery({
    companyUuid,
    departmentId: form.department_id ?? null,
    enabled: Boolean(show && hasDepartmentSelected),
  });
  const departmentUsers = departmentUsersQuery.rows;
  const loadingDepartmentUsers = departmentUsersQuery.isFetching;

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
  }, []);

  /** Reset + close for Cancel, header close, and submit success; backdrop/Esc are disabled on Modal. */
  const handleCancelClick = useCallback(() => {
    resetFormState();
    onHide();
  }, [onHide, resetFormState]);

  const createEmployeeMutation = useMutation({
    mutationFn: async () => {
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
        addresses: addressesPayload,
      });
    },
    onSuccess: () => {
      toast.success("Employee created");
      resetFormState();
      onHide();
      onSuccess?.();
      queryClient
        .invalidateQueries({ queryKey: workforceKeys.employees.all() })
        .catch((e: unknown) =>
          reportApiErrorFromCatch(e, "AddEmployeeModal.invalidateEmployeesQueries"),
        );
    },
    onError: (error: unknown) => {
      reportApiErrorFromCatch(error, "AddEmployeeModal.createEmployee");
    },
  });

  const mainAppDepartmentOptions = useMemo(
    () =>
      (mainAppDepartments ?? []).map((d: { id?: string | number; name?: string }) => ({
        value: String(d.id ?? ""),
        label: String(d.name ?? "—"),
      })),
    [mainAppDepartments],
  );

  const mainAppUserOptions = useMemo(() => {
    if (!hasDepartmentSelected) {
      return [];
    }
    return departmentUsers.map((u: DepartmentUserRow) => ({
      value: u.phone,
      label: `${u.name} (${u.phone})`,
    }));
  }, [hasDepartmentSelected, departmentUsers]);

  const userOptionsLoading = hasDepartmentSelected ? loadingDepartmentUsers : false;
  const userSelectPlaceholder = getEmployeeUserSelectPlaceholder(hasDepartmentSelected, userOptionsLoading);

  const removeAddressById = useCallback((addressId: string) => {
    setAddresses((prev) => prev.filter((addr) => addr.uiId !== addressId));
  }, []);

  const updateAddressField = useCallback(
    (addressId: string, field: AddressFieldKey, value: string) => {
      setAddresses((prev) => prev.map((addr) => (addr.uiId === addressId ? { ...addr, [field]: value } : addr)));
    },
    [],
  );

  const updateAddressPatch = useCallback((addressId: string, patch: Partial<AddressFormItemWithId>) => {
    setAddresses((prev) => prev.map((addr) => (addr.uiId === addressId ? { ...addr, ...patch } : addr)));
  }, []);

  const requiredValidation = useMemo(() => validateEmployeeModalCoreRequiredFields(form), [form]);
  const addressRowsValidation = useMemo(() => validateEmployeeModalAddressRows(addresses), [addresses]);
  const phoneFieldValid = useMemo(() => isOptionalWorkforcePhoneValid(form.phone), [form.phone]);
  const phoneShowInvalid = Boolean(form.phone?.toString().trim()) && !phoneFieldValid;
  const submitting = createEmployeeMutation.isPending;
  const isPrimaryDisabled =
    submitting || !requiredValidation.ok || !addressRowsValidation.ok || !phoneFieldValid;

  const handleSubmit = (e: React.FormEvent) => {
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
    createEmployeeMutation.mutate();
  };

  if (!show) return null;

  return (
    <>
      <div className="workforce-employee-modal-sidebar__backdrop" aria-hidden="true" />

      <div className="workforce-employee-modal-sidebar__panel">
        <div className="workforce-employee-modal-sidebar__header">
          <h2 className="workforce-employee-modal-sidebar__title">{title}</h2>
          <button
            type="button"
            onClick={handleCancelClick}
            className="workforce-employee-modal-sidebar__close-btn"
          >
            <X size={24} />
          </button>
        </div>

        <Form onSubmit={handleSubmit} className="workforce-employee-modal-sidebar__form">
          <div className="workforce-employee-modal-sidebar__content">
            <SidebarSelectField
              label="Department "
              required
              placeholder={loadingDepartments ? "Loading departments..." : "Select department"}
              disabled={loadingDepartments}
              loading={loadingDepartments}
              options={mainAppDepartmentOptions}
              value={findSelectedOption(mainAppDepartmentOptions, String(form.department_id ?? ""))}
              resetSearchOnValueChange={show}
              onChange={(opt: EmployeeSelectOption | null) => {
                const deptId =
                  opt?.value == null || opt.value === "" ? null : (Number(opt.value) || opt.value) as number;
                setForm((f: Partial<UserProfilePayload>) => ({ ...f, department_id: deptId, user_id: "" }));
              }}
              helpText={loadingDepartments ? "Loading..." : undefined}
            />

            <SidebarSelectField
              label="User "
              required
              placeholder={userSelectPlaceholder}
              disabled={!hasDepartmentSelected || userOptionsLoading}
              loading={userOptionsLoading}
              options={mainAppUserOptions}
              value={findSelectedOption(mainAppUserOptions, String(form.user_id ?? ""))}
              resetSearchOnValueChange={show}
              onChange={(opt: EmployeeSelectOption | null) =>
                setForm((f: Partial<UserProfilePayload>) => ({
                  ...f,
                  user_id: opt?.value ?? "",
                }))
              }
              helpText={
                !userOptionsLoading && hasDepartmentSelected && mainAppUserOptions.length === 0
                  ? "No users available for this department."
                  : undefined
              }
            />

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
              getRowId={(a: AddressFormItemWithId) => a.uiId}
              onAddAddress={() => setAddresses((prev) => [...prev, createDefaultAddress()])}
              onRemoveRow={removeAddressById}
              onUpdateField={updateAddressField}
              onCountryChange={(rowId: string, opt: AddressSelectOption) =>
                updateAddressPatch(rowId, createCountryAddressPatch(opt))
              }
              onStateChange={(rowId: string, opt: AddressSelectOption) =>
                updateAddressPatch(rowId, createStateAddressPatch(opt))
              }
              allowAdHocCityOption={false}
            />
          </div>

          <div className="contact-sidebar-footer workforce-employee-modal-sidebar__footer">
            <button
              type="submit"
              disabled={isPrimaryDisabled}
              className="contact-form-btn-create workforce-sidebar-btn-create"
            >
              {submitting ? "Creating..." : "Create"}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleCancelClick}
              className="contact-form-btn-cancel workforce-sidebar-btn-cancel"
            >
              Cancel
            </button>
          </div>
        </Form>
      </div>
    </>
  );
};

export default AddEmployeeModal;
