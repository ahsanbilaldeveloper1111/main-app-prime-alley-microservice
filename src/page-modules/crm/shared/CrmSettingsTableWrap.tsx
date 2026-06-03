import React from "react";

import type { CrmPageDisplayProps } from "@page-modules/crm/crmPageDisplayProps";

type CrmSettingsTableWrapProps = CrmPageDisplayProps &
  Readonly<{
    /** Wrapper class on standalone `/crm/*` routes (e.g. `stages-table-wrapper mb-4`). */
    standaloneWrapperClass?: string;
    children: React.ReactNode;
  }>;

/** Applies shared Main Settings table chrome when embedded in Smart CRM. */
export function CrmSettingsTableWrap({
  hideBreadcrumb,
  standaloneWrapperClass,
  children,
}: CrmSettingsTableWrapProps) {
  if (hideBreadcrumb) {
    return <div className="smart-crm-table-page">{children}</div>;
  }
  if (standaloneWrapperClass) {
    return <div className={standaloneWrapperClass}>{children}</div>;
  }
  return <>{children}</>;
}
