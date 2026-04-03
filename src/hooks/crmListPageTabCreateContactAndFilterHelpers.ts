import type { NextRouter } from "next/router";
import type { RefObject } from "react";
import { getCrmDataById, type CrmDataItem } from "@utils/crm";
import {
  mapCrmDataItemToContactFormState,
  type CrmItemForContactForm,
} from "@utils/crmContactFormFromCrmItem";

/** Next.js `router.query` value shape for a single key. */
export type NextRouterQueryScalar = string | string[] | undefined;

/** If URL `tab` is allowed, return it; otherwise null. */
export function resolveTabFilterFromUrlQuery(
  tabParam: NextRouterQueryScalar,
  validFilters: readonly string[],
): string | null {
  if (tabParam == null) return null;
  const tabFromUrl = String(Array.isArray(tabParam) ? tabParam[0] : tabParam);
  return validFilters.includes(tabFromUrl) ? tabFromUrl : null;
}

/** Next.js query values are often `string | string[] | undefined`. */
export function isRouterQueryStringEqual(
  value: NextRouterQueryScalar,
  expected: string,
): boolean {
  if (value === expected) return true;
  return Array.isArray(value) && value[0] === expected;
}

/** Parses a positive integer from a query param, or null if missing/invalid. */
export function parsePositiveIntFromQueryParam(
  raw: NextRouterQueryScalar,
): number | null {
  const str = Array.isArray(raw) ? raw[0] : raw;
  const n = str == null ? Number.NaN : Number(str);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Removes deep-link keys used to open the create/edit contact sidebar. */
export function omitCreateContactDeepLinkQueryKeys(
  query: NextRouter["query"],
): NextRouter["query"] {
  const { createContact: _c, editContactId: _e, ...rest } = query;
  return rest;
}

export function createAddContactsDropdownMousedownOutsideHandler(
  addContactsRef: RefObject<HTMLDivElement | null>,
  setShowAddContactsDropdown: (value: boolean) => void,
): (event: MouseEvent) => void {
  return (event: MouseEvent) => {
    if (
      addContactsRef.current &&
      !addContactsRef.current.contains(event.target as Node)
    ) {
      setShowAddContactsDropdown(false);
    }
  };
}

type LoadEditableContactFormArgs<TForm> = {
  editingContactId: number;
  sourceField: "source" | "source_file";
  loadFailedMessage: string;
  setContactForm: (value: TForm) => void;
  setContactFormLoadError: (value: string | null) => void;
  setContactFormLoading: (value: boolean) => void;
  isCancelled: () => boolean;
};

/**
 * Fetches CRM row by id and maps into list contact form state.
 * Caller owns cancellation (e.g. effect cleanup).
 */
export function loadEditableContactFormFromCrmId<TForm>(
  args: LoadEditableContactFormArgs<TForm>,
): Promise<void> {
  const {
    editingContactId,
    sourceField,
    loadFailedMessage,
    setContactForm,
    setContactFormLoadError,
    setContactFormLoading,
    isCancelled,
  } = args;

  setContactFormLoadError(null);
  setContactFormLoading(true);

  return getCrmDataById(editingContactId)
    .then(
      (
        item: CrmDataItem & {
          data?: Record<string, unknown>;
          source_file?: string;
          tags?: { id?: number; name?: string }[];
        },
      ) => {
        if (isCancelled()) return;
        const mapped = mapCrmDataItemToContactFormState(
          item as CrmItemForContactForm,
          sourceField,
        );
        setContactForm(mapped as TForm);
        if (!isCancelled()) setContactFormLoading(false);
      },
    )
    .catch(() => {
      if (!isCancelled()) {
        setContactFormLoadError(loadFailedMessage);
        setContactFormLoading(false);
      }
    });
}

/** Shallow `router.push` payload: keep query, set `tab`. */
export function buildShallowTabFilterPushArgs(
  pathname: string,
  currentQuery: NextRouter["query"],
  filterId: string,
): { pathname: string; query: NextRouter["query"] } {
  return {
    pathname,
    query: { ...currentQuery, tab: filterId },
  };
}
