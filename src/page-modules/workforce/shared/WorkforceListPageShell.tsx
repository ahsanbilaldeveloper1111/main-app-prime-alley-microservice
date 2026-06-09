import React from "react";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { CrmListPageScopedLayoutStyles } from "@crm/shared/CrmListPageScopedLayoutStyles";
import type { CrmListPageScopedLayoutStylesConfig } from "@crm/shared/CrmListPageScopedLayoutStyles";
import { WORKFORCE_LIST_SCOPED_LAYOUT } from "./workforceListPageConfig";

type WorkforceListPageShellProps = Readonly<{
  breadcrumbSubTitle: string;
  tableWrapperClass?: string;
  scopedLayout?: CrmListPageScopedLayoutStylesConfig;
  /** Top-right page actions in normal flow (e.g. Add Employee, New Request). */
  fixedActions?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}>;

/** Prospects-style list page shell for workforce GenericTable pages. */
export function WorkforceListPageShell({
  breadcrumbSubTitle,
  tableWrapperClass = "workforce-table-wrapper",
  scopedLayout = WORKFORCE_LIST_SCOPED_LAYOUT,
  fixedActions,
  children,
  footer,
}: WorkforceListPageShellProps) {
  return (
    <>
      <CrmListPageScopedLayoutStyles config={scopedLayout} />
      <div className={`prospects-page-container workforce-page-container ${tableWrapperClass}-container`}>
        <div className="prospects-scrollable-content">
          <BreadcrumbItem mainTitle="" mainLink="" subTitle={breadcrumbSubTitle} />
          {fixedActions}
          <div className="container-fluid prospects-content-area">
            <div className={`prospects-table-wrapper ${tableWrapperClass}`}>{children}</div>
            {footer}
          </div>
        </div>
      </div>
    </>
  );
}
