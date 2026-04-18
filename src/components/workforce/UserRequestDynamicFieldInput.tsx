import React from "react";
import { Form } from "react-bootstrap";
import type { UserRequestCategoryField } from "@utils/staffManagement";

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
        type="file"
        onChange={(e) => {
          const file = (e.target as HTMLInputElement).files?.[0] ?? null;
          onFileChange(key, file);
        }}
      />
    );
  }

  if (field.type === "select") {
    const options = fieldOptions(field);
    return (
      <Form.Select value={stringValue(values, key)} onChange={(e) => onValueChange(key, e.target.value)}>
        <option value="">Select...</option>
        {options.map((opt: FieldOption) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Form.Select>
    );
  }

  if (field.type === "multiselect") {
    const options = fieldOptions(field);
    return (
      <Form.Select
        multiple
        value={stringArrayValue(values, key)}
        onChange={(e) => {
          const selected = Array.from((e.target as HTMLSelectElement).selectedOptions, (option) => option.value);
          onValueChange(key, selected);
        }}
      >
        {options.map((opt: FieldOption) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Form.Select>
    );
  }

  if (field.type === "radio") {
    const options = fieldOptions(field);
    return (
      <div className="d-flex flex-wrap gap-2">
        {options.map((opt: FieldOption) => (
          <Form.Check
            key={opt.value}
            type="radio"
            id={withPrefix(idPrefix, key, opt.value)}
            name={key}
            label={opt.label}
            value={opt.value}
            checked={stringValue(values, key) === opt.value}
            onChange={() => onValueChange(key, opt.value)}
          />
        ))}
      </div>
    );
  }

  if (field.type === "checkbox") {
    const selectedValues = stringArrayValue(values, key);
    const options = fieldOptions(field);
    return (
      <div className="d-flex flex-wrap gap-2">
        {options.map((opt: FieldOption) => {
          const checked = selectedValues.includes(opt.value);
          return (
            <Form.Check
              key={opt.value}
              type="checkbox"
              id={withPrefix(idPrefix, key, opt.value)}
              label={opt.label}
              checked={checked}
              onChange={() => {
                const nextValues = checked
                  ? selectedValues.filter((value) => value !== opt.value)
                  : [...selectedValues, opt.value];
                onValueChange(key, nextValues);
              }}
            />
          );
        })}
      </div>
    );
  }

  if (field.type === "boolean") {
    return (
      <Form.Check
        type="checkbox"
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
        id={withPrefix(idPrefix, key, "toggle")}
        label={field.config?.help_text ?? "Enable"}
        checked={booleanValue(values, key)}
        onChange={(e) => onValueChange(key, e.target.checked)}
      />
    );
  }

  return (
    <Form.Control
      type={inputType(field.type)}
      value={stringValue(values, key)}
      onChange={(e) => onValueChange(key, e.target.value)}
      placeholder={field.config?.placeholder ?? undefined}
    />
  );
};

export default UserRequestDynamicFieldInput;
