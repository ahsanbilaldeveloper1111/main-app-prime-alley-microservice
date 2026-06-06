import React from "react";

type WorkforceSettingsTableWrapProps = Readonly<{
  children: React.ReactNode;
}>;

/** Shared Main Settings table chrome (aligned with Smart CRM / Ranks). */
export function WorkforceSettingsTableWrap({ children }: WorkforceSettingsTableWrapProps) {
  return <div className="smart-crm-table-page">{children}</div>;
}
