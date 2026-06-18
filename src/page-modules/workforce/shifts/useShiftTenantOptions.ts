import { useSession } from "next-auth/react";
import { useMemo } from "react";
import {
  mapChatCompaniesToSelectOptions,
} from "@page-modules/chat/shared/chatCompanySelectOptions";
import { useChatCompaniesQuery } from "@page-modules/chat/useChatCompaniesQuery";
import type { ShiftTenantOption } from "@page-modules/workforce/shifts/shiftManagementDomain";

function readSessionCompanyName(sessionUser: unknown): string {
  if (!sessionUser || typeof sessionUser !== "object") return "";
  const record = sessionUser as Record<string, unknown>;
  const name = record.company_name ?? record.companyName;
  return typeof name === "string" ? name.trim() : "";
}

function readSessionCompanyIdentifier(sessionUser: unknown): string {
  if (!sessionUser || typeof sessionUser !== "object") return "";
  const record = sessionUser as Record<string, unknown>;
  const identifier = record.company_identifier ?? record.companyIdentifier;
  return typeof identifier === "string" ? identifier.trim() : "";
}

export function useShiftTenantOptions(isAdmin: boolean) {
  const { data: session } = useSession();
  const companyIdentifier = readSessionCompanyIdentifier(session?.user);

  const companiesQuery = useChatCompaniesQuery(isAdmin);

  const tenantOptions = useMemo((): ShiftTenantOption[] => {
    if (isAdmin) {
      return mapChatCompaniesToSelectOptions(companiesQuery.data ?? []);
    }
    if (!companyIdentifier) return [];
    const companyName = readSessionCompanyName(session?.user) || companyIdentifier;
    return [{ value: companyIdentifier, label: companyName }];
  }, [companyIdentifier, companiesQuery.data, isAdmin, session?.user]);

  const defaultTenantId = useMemo(() => {
    if (isAdmin && !companiesQuery.isSuccess) {
      return "";
    }
    if (companyIdentifier && tenantOptions.some((option) => option.value === companyIdentifier)) {
      return companyIdentifier;
    }
    return tenantOptions[0]?.value ?? companyIdentifier ?? "";
  }, [companyIdentifier, companiesQuery.isSuccess, isAdmin, tenantOptions]);

  return {
    tenantOptions,
    defaultTenantId,
    isLoading: isAdmin && companiesQuery.isLoading,
    isTenantListReady: !isAdmin || companiesQuery.isSuccess,
    resolveTenantLabel: (tenantId: string) =>
      tenantOptions.find((option) => option.value === tenantId)?.label ?? tenantId,
  };
}
