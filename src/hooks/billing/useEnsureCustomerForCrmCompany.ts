import { useEffect, useRef } from "react";
import { toast } from "react-toastify";

import { createCustomer, getCustomer, type CustomerData } from "@utils/accounts";
import { getCompany, type CompanyData } from "@utils/crm";
import { getErrorMessage } from "@utils/errors";

function optionalTrimmed(value: unknown): string | undefined {
  if (value == null) return undefined;
  const s = String(value).trim();
  return s === "" ? undefined : s;
}

function buildCreateCustomerPayload(
  crmCompanyId: string | number,
  company: CompanyData | null,
): Parameters<typeof createCustomer>[0] {
  const phone = optionalTrimmed(company?.phone);
  const email = optionalTrimmed(company?.email);
  const city = optionalTrimmed(company?.city);
  const country = optionalTrimmed(company?.country);

  const profile: Record<string, unknown> = { vat_exemption: false };
  if (city !== undefined) profile.city = city;
  if (country !== undefined) profile.country = country;

  const payload: Parameters<typeof createCustomer>[0] = {
    crm_company_id: crmCompanyId,
    profile,
  };
  if (phone !== undefined) payload.phone = phone;
  if (email !== undefined) payload.email = email;

  return payload;
}

/** Same nominal type as `getCustomer` (API may still return a `{ success: false }` body at runtime). */
export type EnsuredCustomerPayload = CustomerData;

/**
 * True when `getCustomer` returned a failure envelope (e.g. missing customer).
 * Caller then runs `createCustomer` and refetches.
 */
export function shouldCreateCustomerAfterGetResponse(data: unknown): boolean {
  if (typeof data !== "object" || data === null) return false;
  return (data as { success?: unknown }).success === false;
}

export async function ensureCustomerExistsForCrmCompany(
  crmCompanyId: string | number,
): Promise<{ created: boolean; customer: EnsuredCustomerPayload }> {
  const id = String(crmCompanyId);
  let customer = await getCustomer(id);
  if (!shouldCreateCustomerAfterGetResponse(customer)) {
    return { created: false, customer };
  }

  let companyFromCrm: CompanyData | null = null;
  const companyNumericId = Number(crmCompanyId);
  if (Number.isFinite(companyNumericId) && companyNumericId > 0) {
    try {
      companyFromCrm = await getCompany(Number(crmCompanyId));
    } catch {
      companyFromCrm = null;
    }
  }

  await createCustomer(buildCreateCustomerPayload(crmCompanyId, companyFromCrm));
  customer = await getCustomer(id);
  return { created: true, customer };
}

export interface EnsureCustomerSettledResult {
  created: boolean;
  customer: EnsuredCustomerPayload;
}

export interface UseEnsureCustomerForCrmCompanyOptions {
  onCreated?: () => void;
  /** Invoked after a successful ensure with the resolved customer. */
  onSettled?: (result: EnsureCustomerSettledResult) => void;
  /** Invoked when ensure throws (after the error toast). */
  onFailed?: () => void;
  /** Invoked when the ensure attempt finishes (success or failure), unless the effect was cancelled. */
  onFinished?: () => void;
  errorToastId?: string;
}

/**
 * On mount / when `crmCompanyId` changes: ensure accounting customer exists (create if `getCustomer` returns `{ success: false }`).
 */
export function useEnsureCustomerForCrmCompany(
  crmCompanyId: string | number | null | undefined,
  options?: UseEnsureCustomerForCrmCompanyOptions,
): void {
  const optsRef = useRef(options);
  optsRef.current = options;

  useEffect(() => {
    if (crmCompanyId == null || crmCompanyId === "") return undefined;

    let cancelled = false;

    const run = async () => {
      try {
        const result = await ensureCustomerExistsForCrmCompany(crmCompanyId);
        if (cancelled) return;
        optsRef.current?.onSettled?.(result);
        if (result.created) optsRef.current?.onCreated?.();
      } catch (e) {
        if (cancelled) return;
        optsRef.current?.onFailed?.();
        toast.error(`Failed to load customer: ${getErrorMessage(e)}`, {
          toastId: optsRef.current?.errorToastId,
        });
      } finally {
        if (!cancelled) optsRef.current?.onFinished?.();
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [crmCompanyId]);
}
