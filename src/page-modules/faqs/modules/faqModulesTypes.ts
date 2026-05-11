export interface FAQModuleRow {
  id: string | number;
  name: string;
  icon: string;
  description: string;
}

export const ICON_FALLBACK: string[] = ["help_outline", "info", "book", "settings", "person"];

export const CREATE_MODULE_CONFIG = {
  title: "New FAQ Module",
  nameInputId: "newModuleName",
  descInputId: "newModuleDescription",
  iconInputId: "newModuleIcon",
  submitLabel: "Add Module",
  submittingLabel: "Adding...",
} as const;

export const EDIT_MODULE_CONFIG = {
  title: "Edit FAQ Module",
  nameInputId: "editModuleName",
  descInputId: "editModuleDescription",
  iconInputId: "editModuleIcon",
  submitLabel: "Update Module",
  submittingLabel: "Updating...",
} as const;

export type ModuleSidebarConfig = typeof CREATE_MODULE_CONFIG | typeof EDIT_MODULE_CONFIG;
