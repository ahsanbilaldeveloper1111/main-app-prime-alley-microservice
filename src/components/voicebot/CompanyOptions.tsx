import React from "react";

export type CompanyOption = {
  id: string;
  identifier?: string;
  company_id?: string;
  name: string;
};

export function CompanyOptions({
  isAdmin,
  companies,
  userCompanyIdentifier,
  userCompanyName,
}: Readonly<{
  isAdmin: boolean;
  companies: CompanyOption[];
  userCompanyIdentifier: string;
  userCompanyName: string;
}>) {
  if (isAdmin) {
    return (
      <>
        {companies.map((c, i) => {
          const value = String(c.identifier ?? c.company_id ?? c.id ?? "").trim();
          if (!value) return null;
          return (
            <option key={`co-${i}-${value}`} value={value}>
              {c.name}
            </option>
          );
        })}
      </>
    );
  }

  if (userCompanyIdentifier) {
    return (
      <option value={userCompanyIdentifier}>
        {userCompanyName || userCompanyIdentifier}
      </option>
    );
  }

  return null;
}

