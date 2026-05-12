/** react-select styles shared by CRM campaigns list toolbar filters */
export const CRM_CAMPAIGNS_SELECT_STYLES = {
  control: (provided: any, state: any) => ({
    ...provided,
    minHeight: "38px",
    fontSize: "0.875rem",
    borderColor: state.isFocused ? "#86b7fe" : "#dee2e6",
    boxShadow: state.isFocused ? "0 0 0 0.2rem rgba(13, 110, 253, 0.25)" : "none",
    "&:hover": { borderColor: "#86b7fe" },
  }),
  multiValue: (provided: any) => ({
    ...provided,
    backgroundColor: "#0d6efd",
    color: "white",
    fontSize: "0.813rem",
  }),
  multiValueLabel: (provided: any) => ({ ...provided, color: "white", padding: "2px 6px" }),
  multiValueRemove: (provided: any) => ({
    ...provided,
    color: "white",
    "&:hover": { backgroundColor: "#0b5ed7", color: "white" },
  }),
  menu: (provided: any) => ({ ...provided, fontSize: "0.875rem" }),
};

export const CAMPAIGN_SIDEBAR_SELECT_STYLES = {
  control: (base: any, state: any) => ({
    ...base,
    minHeight: "40px",
    fontSize: "14px",
    borderColor: state.isFocused ? "#0091ae" : "#8a8a8a",
    borderRadius: "4px",
    boxShadow: "none",
    "&:hover": { borderColor: "#0091ae" },
  }),
};
