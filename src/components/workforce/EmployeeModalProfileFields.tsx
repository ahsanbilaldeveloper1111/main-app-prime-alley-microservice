import React from "react";
import { Form } from "react-bootstrap";
import PhoneInput, { type Country } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import type { UserProfilePayload } from "@utils/staffManagement";
import {
  CONTRACT_TYPES,
  DESIGNATION_MAX_LENGTH,
  EMPLOYMENT_TYPES,
  WORKFORCE_PROFILE_SHORT_TEXT_MAX,
} from "@utils/workforce/employeeModalShared";
import {
  formatCnicInput,
  isValidCnic,
  CNIC_MAX_DIGITS,
} from "@utils/workforce/employeeProfileFieldUtils";

export interface EmployeeModalProfileFieldsProps {
  form: Partial<UserProfilePayload>;
  setForm: React.Dispatch<React.SetStateAction<Partial<UserProfilePayload>>>;
  phoneShowInvalid: boolean;
  /** Passed to `PhoneInput` `defaultCountry` (e.g. `"US"` or `"PK"`). */
  phoneDefaultCountry: Country;
  phoneHelpText: string;
  /** Add modal uses `required` on employment select; edit may omit. */
  employmentSelectRequired?: boolean;
}

/**
 * Shared employee profile fields (code, CNIC, designation, employment, contract, phone, status).
 */
const EmployeeModalProfileFields: React.FC<EmployeeModalProfileFieldsProps> = ({
  form,
  setForm,
  phoneShowInvalid,
  phoneDefaultCountry,
  phoneHelpText,
  employmentSelectRequired = true,
}) => (
  <>
    <Form.Group className="mb-3">
      <Form.Label>Employee Code</Form.Label>
      <Form.Control
        type="text"
        maxLength={WORKFORCE_PROFILE_SHORT_TEXT_MAX}
        value={form.employee_code ?? ""}
        onChange={(e) =>
          setForm((f) => ({
            ...f,
            employee_code: e.target.value.slice(0, WORKFORCE_PROFILE_SHORT_TEXT_MAX),
          }))
        }
        placeholder="Employee code"
      />
      <div className="d-flex justify-content-between align-items-baseline gap-2 mt-1">
        <Form.Text className="text-muted mb-0">
          Maximum {WORKFORCE_PROFILE_SHORT_TEXT_MAX} characters allowed.
        </Form.Text>
        <Form.Text className="text-muted mb-0 small text-nowrap" aria-live="polite">
          {(form.employee_code ?? "").length}/{WORKFORCE_PROFILE_SHORT_TEXT_MAX}
        </Form.Text>
      </div>
    </Form.Group>
    <Form.Group className="mb-3">
      <Form.Label>Identification Number (CNIC)</Form.Label>
      <Form.Control
        type="text"
        inputMode="numeric"
        maxLength={CNIC_MAX_DIGITS + 2}
        value={form.identification_number ?? ""}
        onChange={(e) =>
          setForm((f) => ({
            ...f,
            identification_number: formatCnicInput(e.target.value),
          }))
        }
        placeholder="12345-1234567-1"
      />
      <div className="d-flex justify-content-between align-items-baseline gap-2 mt-1">
        <Form.Text className="text-muted mb-0">
          Format: XXXXX-XXXXXXX-X ({CNIC_MAX_DIGITS} digits).
        </Form.Text>
        <Form.Text className="text-muted mb-0 small text-nowrap" aria-live="polite">
          {formatCnicInput(form.identification_number ?? "").replace(/\D/g, "").length}/{CNIC_MAX_DIGITS}
        </Form.Text>
      </div>
      {!isValidCnic(form.identification_number) && (
        <Form.Text className="text-danger d-block">
          Enter all {CNIC_MAX_DIGITS} digits or leave the field empty.
        </Form.Text>
      )}
    </Form.Group>
    <Form.Group className="mb-3">
      <Form.Label>
        Designation <span className="text-danger">*</span>{" "}
      </Form.Label>
      <Form.Control
        type="text"
        maxLength={DESIGNATION_MAX_LENGTH}
        value={form.designation ?? ""}
        onChange={(e) =>
          setForm((f) => ({
            ...f,
            designation: e.target.value.slice(0, DESIGNATION_MAX_LENGTH),
          }))
        }
        placeholder="Designation"
        required
      />
      <div className="d-flex justify-content-between align-items-baseline gap-2 mt-1">
        <Form.Text className="text-muted mb-0">Maximum {DESIGNATION_MAX_LENGTH} characters allowed.</Form.Text>
        <Form.Text className="text-muted mb-0 small text-nowrap" aria-live="polite">
          {(form.designation ?? "").length}/{DESIGNATION_MAX_LENGTH}
        </Form.Text>
      </div>
    </Form.Group>
    <Form.Group className="mb-3">
      <Form.Label>
        Employment Type <span className="text-danger">*</span>{" "}
      </Form.Label>
      <Form.Select
        value={form.employment_type ?? ""}
        onChange={(e) => setForm((f) => ({ ...f, employment_type: e.target.value }))}
        required={employmentSelectRequired}
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
      <Form.Label>
        Contract Type <span className="text-danger">*</span>{" "}
      </Form.Label>
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
          defaultCountry={phoneDefaultCountry}
          value={form.phone && form.phone.trim() !== "" ? form.phone : undefined}
          onChange={(value: string | undefined) =>
            setForm((f) => ({ ...f, phone: value && value.trim() !== "" ? value : "" }))
          }
          placeholder="Enter phone number"
          className={phoneShowInvalid ? "is-invalid" : undefined}
        />
      </div>
      <Form.Text className="text-muted">{phoneHelpText}</Form.Text>
      {phoneShowInvalid && (
        <Form.Text className="text-danger d-block">
          Enter a valid phone number for the selected country.
        </Form.Text>
      )}
    </Form.Group>
    <Form.Group className="mb-3">
      <Form.Label>Status</Form.Label>
      <Form.Select value={form.status ?? "active"} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </Form.Select>
    </Form.Group>
  </>
);

export default EmployeeModalProfileFields;
