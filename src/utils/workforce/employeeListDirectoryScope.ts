import type { MainAppUserLookup } from "@hooks/useMainAppLookups";

/** Map hierarchy scope ids to directory phones used as GET /user-profiles `user_ids`. */
export function resolveEmployeeDirectoryPhonesForListScope(input: {
  canViewAllCompanyEmployees: boolean;
  mainAppUsers: readonly MainAppUserLookup[];
  teamScopeUserIds: readonly string[];
}): string[] {
  if (input.canViewAllCompanyEmployees) {
    const seen = new Set<string>();
    const phones: string[] = [];
    for (const u of input.mainAppUsers) {
      const phone = String(u.phone ?? "").trim();
      if (phone === "" || seen.has(phone)) continue;
      seen.add(phone);
      phones.push(phone);
    }
    return phones;
  }

  const allow = new Set(
    input.teamScopeUserIds.map((id) => String(id).trim()).filter((id) => id.length > 0),
  );
  const seen = new Set<string>();
  const phones: string[] = [];

  for (const u of input.mainAppUsers) {
    const phone = String(u.phone ?? "").trim();
    const idStr = String(u.id ?? "").trim();
    const inScope = allow.has(phone) || allow.has(idStr);
    if (!inScope || phone === "" || seen.has(phone)) continue;
    seen.add(phone);
    phones.push(phone);
  }

  return phones;
}

export function filterMainAppUsersForEmployeeListScope(input: {
  canViewAllCompanyEmployees: boolean;
  mainAppUsers: readonly MainAppUserLookup[];
  teamScopeUserIds: readonly string[];
}): MainAppUserLookup[] {
  if (input.canViewAllCompanyEmployees) {
    return [...input.mainAppUsers];
  }

  const allow = new Set(
    input.teamScopeUserIds.map((id) => String(id).trim()).filter((id) => id.length > 0),
  );

  return input.mainAppUsers.filter((u) => {
    const phone = String(u.phone ?? "").trim();
    const idStr = String(u.id ?? "").trim();
    return allow.has(phone) || allow.has(idStr);
  });
}
