import React from "react";

export type CompanyOption = {
  id: string;
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
        {companies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
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

