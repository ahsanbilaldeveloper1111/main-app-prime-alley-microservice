import React from "react";
import { Form } from "react-bootstrap";
import type { UserRequestCategoryField } from "@utils/staffManagement";
import SelectBox from "@components/SelectBox";

type FieldOption = { value: string; label: string };

type UserRequestDynamicFieldInputProps = {
  field: UserRequestCategoryField;
  values: Record<string, unknown>;
  onValueChange: (key: string, value: unknown) => void;
  onFileChange: (key: string, file: File | null) => void;
  idPrefix?: string;
};

function resolveFieldKey(field: UserRequestCategoryField): string {
  return field.key?.trim() ?? "";
}

function stringValue(values: Record<string, unknown>, key: string): string {
  const value = values[key];
  return typeof value === "string" ? value : "";
}

function stringArrayValue(values: Record<string, unknown>, key: string): string[] {
  const value = values[key];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function booleanValue(values: Record<string, unknown>, key: string): boolean {
  return Boolean(values[key]);
}

function inputType(fieldType: string): "number" | "date" | "text" {
  if (fieldType === "number") return "number";
  if (fieldType === "date") return "date";
  return "text";
}

function isAttachmentType(fieldType: string): boolean {
  return fieldType === "file" || fieldType === "attachment";
}

function fieldOptions(field: UserRequestCategoryField): FieldOption[] {
  return (field.options ?? []) as FieldOption[];
}

function withPrefix(prefix: string, key: string, value: string): string {
  return prefix === "" ? `${key}-${value}` : `${prefix}-${key}-${value}`;
}

function noOptionsMessage(fieldType: string): string {
  return `No ${fieldType} options available`;
}

function renderSelectField(
  options: FieldOption[],
  value: string,
  onChange: (next: string) => void,
): React.ReactNode {
  if (options.length === 0) {
    return (
      <Form.Select className="new-request-fieldControl" disabled value="">
        <option value="">{noOptionsMessage("select")}</option>
      </Form.Select>
    );
  }
  return (
    <Form.Select className="new-request-fieldControl" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select...</option>
      {options.map((opt: FieldOption) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </Form.Select>
  );
}

function renderMultiSelectField(
  options: FieldOption[],
  selectedValues: string[],
  onChange: (nextValues: string[]) => void,
): React.ReactNode {
  return (
    <>
      <SelectBox
        options={options}
        value={selectedValues}
        isMulti
        className="new-request-selectbox"
        classNamePrefix="new-request-selectbox"
        placeholder="Select..."
        isClearable
        isSearchable
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
        onChange={(next) => {
          const normalized = Array.isArray(next)
            ? next.map(String)
            : [];
          onChange(normalized);
        }}
      />
      {options.length === 0 && (
        <Form.Text className="text-muted">{noOptionsMessage("multi-select")}</Form.Text>
      )}
    </>
  );
}

function renderRadioField(
  options: FieldOption[],
  key: string,
  idPrefix: string,
  value: string,
  onChange: (next: string) => void,
): React.ReactNode {
  if (options.length === 0) {
    return <Form.Text className="text-muted">{noOptionsMessage("radio")}</Form.Text>;
  }
  return (
    <div className="urdf-radioGroup">
      {options.map((opt: FieldOption) => {
        const checked = value === opt.value;
        const id = withPrefix(idPrefix, key, opt.value);
        return (
          <label
            key={opt.value}
            htmlFor={id}
            className={`urdf-radioOption${checked ? " urdf-radioOption--selected" : ""}`}
          >
            <input
              id={id}
              className="urdf-radioInput"
              type="radio"
              name={key}
              value={opt.value}
              checked={checked}
              onChange={() => onChange(opt.value)}
            />
            <span
              aria-hidden
              className={`urdf-radioMark${checked ? " urdf-radioMark--selected" : ""}`}
            >
              {checked && <span className="urdf-radioDot" />}
            </span>
            <span>{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
}

function renderCheckboxField(
  options: FieldOption[],
  key: string,
  idPrefix: string,
  selectedValues: string[],
  onChange: (nextValues: string[]) => void,
): React.ReactNode {
  if (options.length === 0) {
    return <Form.Text className="text-muted">{noOptionsMessage("checkbox")}</Form.Text>;
  }
  return (
    <div className="urdf-checkboxGroup">
      {options.map((opt: FieldOption) => {
        const checked = selectedValues.includes(opt.value);
        const id = withPrefix(idPrefix, key, opt.value);
        return (
          <label
            key={opt.value}
            htmlFor={id}
            className={`urdf-checkboxOption${checked ? " urdf-checkboxOption--selected" : ""}`}
          >
            <input
              id={id}
              className="urdf-checkboxInput"
              type="checkbox"
              checked={checked}
              onChange={() => {
                const nextValues = checked
                  ? selectedValues.filter((value) => value !== opt.value)
                  : [...selectedValues, opt.value];
                onChange(nextValues);
              }}
            />
            <span aria-hidden className={`urdf-checkboxMark${checked ? " urdf-checkboxMark--selected" : ""}`}>
              {checked && <span className="urdf-checkboxTick">✓</span>}
            </span>
            <span>{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
}

const UserRequestDynamicFieldInput: React.FC<UserRequestDynamicFieldInputProps> = ({
  field,
  values,
  onValueChange,
  onFileChange,
  idPrefix = "",
}) => {
  const key = resolveFieldKey(field);
  if (key === "") return null;

  if (field.type === "textarea") {
    return (
      <Form.Control
        className="new-request-fieldControl"
        as="textarea"
        rows={2}
        value={stringValue(values, key)}
        onChange={(e) => onValueChange(key, e.target.value)}
        placeholder={field.config?.placeholder ?? undefined}
      />
    );
  }

  if (isAttachmentType(field.type)) {
    return (
      <Form.Control
        className="new-request-fieldControl"
        type="file"
        onChange={(e) => {
          const file = (e.target as HTMLInputElement).files?.[0] ?? null;
          onFileChange(key, file);
        }}
      />
    );
  }

  if (field.type === "select") {
    return renderSelectField(fieldOptions(field), stringValue(values, key), (next) => onValueChange(key, next));
  }

  if (field.type === "multiselect") {
    return renderMultiSelectField(fieldOptions(field), stringArrayValue(values, key), (next) =>
      onValueChange(key, next),
    );
  }

  if (field.type === "radio") {
    return renderRadioField(
      fieldOptions(field),
      key,
      idPrefix,
      stringValue(values, key),
      (next) => onValueChange(key, next),
    );
  }

  if (field.type === "checkbox") {
    return renderCheckboxField(
      fieldOptions(field),
      key,
      idPrefix,
      stringArrayValue(values, key),
      (next) => onValueChange(key, next),
    );
  }

  if (field.type === "boolean") {
    return (
      <Form.Check
        type="checkbox"
        className="new-request-booleanControl"
        id={withPrefix(idPrefix, key, "boolean")}
        label={field.config?.help_text ?? "Yes / No"}
        checked={booleanValue(values, key)}
        onChange={(e) => onValueChange(key, e.target.checked)}
      />
    );
  }

  if (field.type === "toggle") {
    return (
      <Form.Check
        type="switch"
        className="new-request-switchControl"
        id={withPrefix(idPrefix, key, "toggle")}
        label={field.config?.help_text ?? "Enable"}
        checked={booleanValue(values, key)}
        onChange={(e) => onValueChange(key, e.target.checked)}
      />
    );
  }

  return (
    <Form.Control
      className="new-request-fieldControl"
      type={inputType(field.type)}
      value={stringValue(values, key)}
      onChange={(e) => onValueChange(key, e.target.value)}
      placeholder={field.config?.placeholder ?? undefined}
    />
  );
};

export default UserRequestDynamicFieldInput;
