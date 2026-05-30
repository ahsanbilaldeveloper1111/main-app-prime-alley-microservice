import React from "react";
import { Form } from "react-bootstrap";
import Select from "react-select";
import {
  CRM_REACT_SELECT_MENU_PORTAL_Z_INDEX,
  getCrmReactSelectBodyMenuPortalProps,
} from "@utils/crmReactSelectMenuPortalProps";
import type { FilterField } from "./filterFieldTypes";

function resolveSelectOptionBackgroundColor(state: {
  isSelected: boolean;
  isFocused: boolean;
}): string {
  if (state.isSelected) {
    return "#4f46e5";
  }
  if (state.isFocused) {
    return "#f3f4f6";
  }
  return "white";
}

function resolveSelectOptionTextColor(state: { isSelected: boolean }): string {
  if (state.isSelected) {
    return "white";
  }
  return "#111827";
}

export function renderGenericFilterField(  filter: Readonly<FilterField>,
): React.ReactNode {
  const baseStyles: React.CSSProperties = {
    fontSize: "14px",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
  };

  const selectStyles = {
    control: (base: Record<string, unknown>) => ({
      ...base,
      fontSize: "14px",
      padding: "2px",
      borderRadius: "8px",
      border: "1px solid #d1d5db",
      boxShadow: "none",
      "&:hover": {
        borderColor: "#9ca3af",
      },
    }),
    menu: (base: Record<string, unknown>) => ({
      ...base,
      zIndex: CRM_REACT_SELECT_MENU_PORTAL_Z_INDEX,
    }),
    menuPortal: (base: Record<string, unknown>) => ({
      ...base,
      zIndex: CRM_REACT_SELECT_MENU_PORTAL_Z_INDEX,
    }),
    option: (base: Record<string, unknown>, state: { isSelected: boolean; isFocused: boolean }) => ({
      ...base,
      fontSize: "14px",
      backgroundColor: resolveSelectOptionBackgroundColor(state),
      color: resolveSelectOptionTextColor(state),
      cursor: "pointer",
    }),
    multiValue: (base: Record<string, unknown>) => ({
      ...base,
      backgroundColor: "#e0e7ff",
      borderRadius: "6px",
    }),
    multiValueLabel: (base: Record<string, unknown>) => ({
      ...base,
      color: "#4f46e5",
      fontSize: "13px",
    }),
    multiValueRemove: (base: Record<string, unknown>) => ({
      ...base,
      color: "#4f46e5",
      ":hover": {
        backgroundColor: "#c7d2fe",
        color: "#4338ca",
      },
    }),
    ...filter.styles,
  };

  switch (filter.type) {
    case "text":
      return (
        <Form.Control
          type="text"
          value={filter.value || ""}
          onChange={(e) => filter.onChange(e.target.value)}
          placeholder={filter.placeholder}
          style={baseStyles}
        />
      );

    case "select":
      return (
        <Select
          options={filter.options || []}
          value={filter.value}
          onChange={filter.onChange}
          placeholder={filter.placeholder || "Select..."}
          styles={selectStyles}
          isClearable={filter.isClearable !== false}
          {...getCrmReactSelectBodyMenuPortalProps()}
        />
      );

    case "multi-select":
      return (
        <Select
          isMulti
          options={filter.options || []}
          value={filter.value}
          onChange={filter.onChange}
          placeholder={filter.placeholder || "Select..."}
          styles={selectStyles}
          isClearable={filter.isClearable !== false}
          {...getCrmReactSelectBodyMenuPortalProps()}
        />
      );

    case "dropdown":
      return (
        <Form.Select
          value={filter.value || ""}
          onChange={(e) => filter.onChange(e.target.value || null)}
          style={baseStyles}
        >
          {filter.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Form.Select>
      );

    case "date":
      return (
        <Form.Control
          type="date"
          value={filter.value || ""}
          min={filter.min}
          max={filter.max}
          onChange={(e) => filter.onChange(e.target.value || null)}
          style={baseStyles}
        />
      );

    case "datetime":
      return (
        <Form.Control
          type="datetime-local"
          value={filter.value || ""}
          min={filter.min}
          max={filter.max}
          onChange={(e) => filter.onChange(e.target.value || null)}
          style={baseStyles}
        />
      );

    default:
      return null;
  }
}
