import type { CSSProperties, ReactNode } from "react";

export function getGenericTableCardClassName(noBorder: boolean): string {
  return noBorder
    ? "border-0 shadow-none generic-table-card"
    : "border-1 shadow-sm generic-table-card";
}

export function getGenericTableContainerClassName(
  resizableColumns: boolean,
  hasCustomColumnWidths: boolean,
): string {
  let className = "generic-table-container";
  if (resizableColumns) {
    className += " generic-table-container--column-resize";
  }
  if (hasCustomColumnWidths) {
    className += " generic-table-container--column-resize-active";
  }
  return className;
}

export function getGenericTableResponsiveClassName(
  fixedHeight: boolean,
  resizableColumns: boolean,
  hasCustomColumnWidths: boolean,
): string {
  let className = "generic-table-responsive";
  if (fixedHeight) {
    className += " fixed-height-table";
  }
  if (resizableColumns) {
    className += " generic-table-responsive--column-resize";
  }
  if (hasCustomColumnWidths) {
    className += " generic-table-responsive--column-resize-active";
  }
  return className;
}

export function getGenericTableClassName(
  resizableColumns: boolean,
  hasCustomColumnWidths: boolean,
): string {
  let className = "generic-table mb-0 generic-table--compact";
  if (resizableColumns) {
    className += " generic-table--column-resize";
  }
  if (hasCustomColumnWidths) {
    className += " generic-table--column-resize-active";
  }
  return className;
}

export function getGenericTableScrollStyle(
  fixedHeight: boolean,
  maxHeight: string,
): CSSProperties | undefined {
  if (!fixedHeight) {
    return undefined;
  }
  return {
    maxHeight,
    overflow: "auto",
  };
}

export function shouldRenderDefaultTableBody(
  customBody: ReactNode | undefined,
): boolean {
  return customBody == null;
}
