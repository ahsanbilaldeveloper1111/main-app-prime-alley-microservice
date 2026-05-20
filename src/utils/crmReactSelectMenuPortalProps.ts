/** Above Bootstrap dropdowns/modals and CRM filter sidebars so portaled react-select menus stay visible. */
export const CRM_REACT_SELECT_MENU_PORTAL_Z_INDEX = 100100;

export type CrmReactSelectBodyMenuPortalProps = Readonly<{
  menuPosition: "fixed";
  menuPortalTarget: HTMLElement;
}>;

/** Use with react-select `styles` that include a `menuPortal` z-index (e.g. `crmListPageReactSelectStyles`). */
export function getCrmReactSelectBodyMenuPortalProps():
  | CrmReactSelectBodyMenuPortalProps
  | Record<string, never> {
  if (typeof document === "undefined") {
    return {};
  }
  return { menuPosition: "fixed", menuPortalTarget: document.body };
}
