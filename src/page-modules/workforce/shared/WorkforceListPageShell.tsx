import React from "react";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { CrmListPageScopedLayoutStyles } from "@crm/shared/CrmListPageScopedLayoutStyles";
import { WORKFORCE_LIST_SCOPED_LAYOUT } from "./workforceListPageConfig";

type WorkforceListPageShellProps = Readonly<{
  breadcrumbSubTitle: string;
  tableWrapperClass?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}>;

/** Prospects-style list page shell for workforce GenericTable pages. */
export function WorkforceListPageShell({
  breadcrumbSubTitle,
  tableWrapperClass = "workforce-table-wrapper",
  children,
  footer,
}: WorkforceListPageShellProps) {
  return (
    <>
      <CrmListPageScopedLayoutStyles config={WORKFORCE_LIST_SCOPED_LAYOUT} />
      <div className={`prospects-page-container workforce-page-container ${tableWrapperClass}-container`}>
        <div className="prospects-scrollable-content">
          <BreadcrumbItem mainTitle="" mainLink="" subTitle={breadcrumbSubTitle} />
          <div className="container-fluid prospects-content-area">
            <div className={`prospects-table-wrapper ${tableWrapperClass}`}>{children}</div>
            {footer}
          </div>
        </div>
      </div>
    </>
  );
}
