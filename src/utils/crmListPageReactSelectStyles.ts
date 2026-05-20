import type { StylesConfig } from "react-select";
import { CRM_REACT_SELECT_MENU_PORTAL_Z_INDEX } from "@utils/crmReactSelectMenuPortalProps";

/** Shared react-select styles for CRM-style list pages (45px controls, bootstrap-like focus ring). */
export const crmListPageReactSelectStyles: StylesConfig<unknown, boolean> = {
  control: (provided, state) => ({
    ...provided,
    minHeight: "45px",
    fontSize: "0.875rem",
    borderColor: state.isFocused ? "#86b7fe" : "#dee2e6",
    boxShadow: state.isFocused
      ? "0 0 0 0.2rem rgba(13, 110, 253, 0.25)"
      : "none",
    "&:hover": {
      borderColor: "#86b7fe",
    },
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: "#0d6efd",
    color: "white",
    fontSize: "0.813rem",
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: "white",
    padding: "2px 6px",
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: "white",
    "&:hover": {
      backgroundColor: "#0b5ed7",
      color: "white",
    },
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#6c757d",
    fontSize: "0.875rem",
  }),
  singleValue: (provided) => ({
    ...provided,
    fontSize: "0.875rem",
  }),
  menu: (provided) => ({
    ...provided,
    fontSize: "0.875rem",
  }),
  menuPortal: (provided) => ({
    ...provided,
    zIndex: CRM_REACT_SELECT_MENU_PORTAL_Z_INDEX,
  }),
};
