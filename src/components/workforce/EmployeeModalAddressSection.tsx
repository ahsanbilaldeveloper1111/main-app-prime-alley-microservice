import React from "react";
import { Button, Form } from "react-bootstrap";
import Select from "@components/AppSelect";
import { Plus, Trash2 } from "lucide-react";
import { State, City } from "country-state-city";
import type { EmployeeModalAddressBase } from "@utils/employeeModalAddressMap";
import {
  ADDRESS_NAME_MAX_LENGTH,
  ADDRESS_STREET_MAX_LENGTH,
  ADDRESS_ZIP_CODE_MAX_LENGTH,
  employeeModalReactSelectStyles,
} from "@utils/workforce/employeeModalShared";

export type EmployeeModalAddressFieldKey =
  | "name"
  | "zip_code"
  | "city"
  | "country"
  | "address"
  | "state"
  | "countryCode"
  | "stateCode";

type SelectOption = { value: string; label: string };

function resolveCitySelectValue(
  cityValue: string,
  cityOptions: SelectOption[],
  allowAdHoc: boolean,
): SelectOption | null {
  if (!cityValue) {
    return null;
  }
  const match = cityOptions.find((o) => o.value === cityValue);
  if (match) {
    return match;
  }
  if (allowAdHoc) {
    return { value: cityValue, label: cityValue };
  }
  return null;
}

export interface EmployeeModalAddressSectionProps<T extends EmployeeModalAddressBase> {
  addresses: T[];
  addressCountries: { isoCode: string; name: string }[];
  getRowId: (row: T) => string;
  onAddAddress: () => void;
  onRemoveRow: (rowId: string) => void;
  onUpdateField: (rowId: string, field: EmployeeModalAddressFieldKey, value: string) => void;
  onCountryChange: (rowId: string, opt: SelectOption | null) => void;
  onStateChange: (rowId: string, opt: SelectOption | null) => void;
  /** Edit modal: show city string when it is not in the country-state-city list. */
  allowAdHocCityOption: boolean;
}

/**
 * Shared addresses card for Add / Edit employee modals (country-state-city cascade + street).
 */
function EmployeeModalAddressSection<T extends EmployeeModalAddressBase>(
  props: Readonly<EmployeeModalAddressSectionProps<T>>,
): React.ReactElement {
  const {
    addresses,
    addressCountries,
    getRowId,
    onAddAddress,
    onRemoveRow,
    onUpdateField,
    onCountryChange,
    onStateChange,
    allowAdHocCityOption,
  } = props;
  return (
    <div className="card em-card mb-3">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
          <div className="em-section-title mb-0">Addresses</div>
          <Button type="button" variant="outline-primary" size="sm" onClick={onAddAddress}>
            <Plus className="me-1" size={14} />
            Add Address
          </Button>
        </div>
        <div className="d-flex flex-column gap-3">
          {addresses.length === 0 ? (
            <div className="text-muted small">No addresses added. Click &quot;Add Address&quot; to add one.</div>
          ) : (
            addresses.map((addr, idx) => {
              const rowId = getRowId(addr);
              const countryOptions = addressCountries.map((c) => ({ value: c.isoCode, label: c.name }));
              const stateOptions = (addr.countryCode ? State.getStatesOfCountry(addr.countryCode) : []).map((s) => ({
                value: s.isoCode,
                label: s.name,
              }));
              const cityOptions =
                addr.countryCode && addr.stateCode
                  ? City.getCitiesOfState(addr.countryCode, addr.stateCode).map((c) => ({
                      value: c.name,
                      label: c.name,
                    }))
                  : [];
              const cityValue = addr.city?.trim() ?? "";
              const citySelectValue = resolveCitySelectValue(cityValue, cityOptions, allowAdHocCityOption);

              return (
                <div key={rowId} className="p-3 bg-light rounded">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="fw-semibold">Address #{idx + 1}</div>
                    <Button type="button" variant="outline-danger" size="sm" onClick={() => onRemoveRow(rowId)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <Form.Group>
                        <Form.Label>
                          Name <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          maxLength={ADDRESS_NAME_MAX_LENGTH}
                          value={addr.name ?? ""}
                          onChange={(e) =>
                            onUpdateField(rowId, "name", e.target.value.slice(0, ADDRESS_NAME_MAX_LENGTH))
                          }
                          placeholder="e.g. Head Office"
                          required
                        />
                        <div className="d-flex justify-content-between align-items-baseline gap-2 mt-1">
                          <Form.Text className="text-muted mb-0">
                            Maximum {ADDRESS_NAME_MAX_LENGTH} characters allowed.
                          </Form.Text>
                          <Form.Text className="text-muted mb-0 small text-nowrap" aria-live="polite">
                            {(addr.name ?? "").length}/{ADDRESS_NAME_MAX_LENGTH}
                          </Form.Text>
                        </div>
                      </Form.Group>
                    </div>
                    <div className="col-md-6">
                      <Form.Group>
                        <Form.Label>Zip / Postal Code</Form.Label>
                        <Form.Control
                          type="text"
                          maxLength={ADDRESS_ZIP_CODE_MAX_LENGTH}
                          value={addr.zip_code ?? ""}
                          onChange={(e) =>
                            onUpdateField(rowId, "zip_code", e.target.value.slice(0, ADDRESS_ZIP_CODE_MAX_LENGTH))
                          }
                          placeholder="Zip / Postal Code"
                        />
                        <div className="d-flex justify-content-between align-items-baseline gap-2 mt-1">
                          <Form.Text className="text-muted mb-0">
                            Maximum {ADDRESS_ZIP_CODE_MAX_LENGTH} characters allowed.
                          </Form.Text>
                          <Form.Text className="text-muted mb-0 small text-nowrap" aria-live="polite">
                            {(addr.zip_code ?? "").length}/{ADDRESS_ZIP_CODE_MAX_LENGTH}
                          </Form.Text>
                        </div>
                      </Form.Group>
                    </div>
                    <div className="col-md-6">
                      <Form.Group>
                        <Form.Label>Country</Form.Label>
                        <Select<SelectOption>
                          className="basic-single"
                          classNamePrefix="select"
                          isClearable
                          isSearchable
                          options={countryOptions}
                          placeholder="Select Country"
                          value={
                            addr.countryCode ? countryOptions.find((o) => o.value === addr.countryCode) ?? null : null
                          }
                          onChange={(opt) => onCountryChange(rowId, opt)}
                          styles={employeeModalReactSelectStyles}
                        />
                      </Form.Group>
                    </div>
                    <div className="col-md-6">
                      <Form.Group>
                        <Form.Label>State</Form.Label>
                        <Select<SelectOption>
                          className="basic-single"
                          classNamePrefix="select"
                          isClearable
                          isSearchable
                          options={stateOptions}
                          placeholder="Select State"
                          isDisabled={!addr.countryCode}
                          value={addr.stateCode ? stateOptions.find((o) => o.value === addr.stateCode) ?? null : null}
                          onChange={(opt) => onStateChange(rowId, opt)}
                          styles={employeeModalReactSelectStyles}
                        />
                      </Form.Group>
                    </div>
                    <div className="col-md-6">
                      <Form.Group>
                        <Form.Label>City</Form.Label>
                        <Select<SelectOption>
                          className="basic-single"
                          classNamePrefix="select"
                          isClearable
                          isSearchable
                          options={cityOptions}
                          placeholder="Select City"
                          isDisabled={!addr.stateCode}
                          value={citySelectValue}
                          onChange={(opt) => onUpdateField(rowId, "city", opt?.value ?? "")}
                          styles={employeeModalReactSelectStyles}
                        />
                      </Form.Group>
                    </div>
                    <div className="col-md-6" />
                    <div className="col-12">
                      <Form.Group>
                        <Form.Label>
                          Address <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          maxLength={ADDRESS_STREET_MAX_LENGTH}
                          value={addr.address ?? ""}
                          onChange={(e) =>
                            onUpdateField(rowId, "address", e.target.value.slice(0, ADDRESS_STREET_MAX_LENGTH))
                          }
                          placeholder="Street address"
                          required
                        />
                        <div className="d-flex justify-content-between align-items-baseline gap-2 mt-1">
                          <Form.Text className="text-muted mb-0">
                            Maximum {ADDRESS_STREET_MAX_LENGTH} characters allowed.
                          </Form.Text>
                          <Form.Text className="text-muted mb-0 small text-nowrap" aria-live="polite">
                            {(addr.address ?? "").length}/{ADDRESS_STREET_MAX_LENGTH}
                          </Form.Text>
                        </div>
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
  );
}

export default EmployeeModalAddressSection;
