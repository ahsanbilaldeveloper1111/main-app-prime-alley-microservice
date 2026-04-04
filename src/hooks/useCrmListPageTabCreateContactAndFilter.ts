import {
  useCallback,
  useEffect,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import type { NextRouter } from "next/router";
import {
  buildShallowTabFilterPushArgs,
  createAddContactsDropdownMousedownOutsideHandler,
  isRouterQueryStringEqual,
  loadEditableContactFormFromCrmId,
  omitCreateContactDeepLinkQueryKeys,
  parsePositiveIntFromQueryParam,
  resolveTabFilterFromUrlQuery,
} from "@hooks/crmListPageTabCreateContactAndFilterHelpers";

export type CrmListContactSidebarParams<TForm> = {
  showAddContactsDropdown: boolean;
  setShowAddContactsDropdown: (value: boolean) => void;
  addContactsRef: RefObject<HTMLDivElement | null>;
  showCreateContactSidebar: boolean;
  setShowCreateContactSidebar: (value: boolean) => void;
  editingContactId: number | null;
  setEditingContactId: (value: number | null) => void;
  setContactForm: Dispatch<SetStateAction<TForm>>;
  setContactFormLoadError: (value: string | null) => void;
  setContactFormLoading: (value: boolean) => void;
  sourceField: "source" | "source_file";
  loadFailedMessage: string;
};

export type UseCrmListPageTabCreateContactAndFilterParams<
  TForm,
  TPagination extends { currentPage: number },
> = {
  router: NextRouter;
  validFilters: readonly string[];
  setActiveFilter: (value: string) => void;
  setPagination: Dispatch<SetStateAction<TPagination>>;
  setLoading: (value: boolean) => void;
} & CrmListContactSidebarParams<TForm>;

/**
 * Tab sync from URL, deep-link to create/edit contact sidebar, dropdown click-outside,
 * load contact form from CRM id, and shallow tab filter navigation — shared across large CRM list pages.
 */
export function useCrmListPageTabCreateContactAndFilter<
  TForm,
  TPagination extends { currentPage: number },
>(
  params: UseCrmListPageTabCreateContactAndFilterParams<TForm, TPagination>,
): { handleFilterChange: (filterId: string) => void } {
  const {
    router,
    validFilters,
    setActiveFilter,
    setPagination,
    setLoading,
    showAddContactsDropdown,
    setShowAddContactsDropdown,
    addContactsRef,
    showCreateContactSidebar,
    setShowCreateContactSidebar,
    editingContactId,
    setEditingContactId,
    setContactForm,
    setContactFormLoadError,
    setContactFormLoading,
    sourceField,
    loadFailedMessage,
  } = params;

  useEffect(() => {
    if (!router.isReady) return;
    const tab = resolveTabFilterFromUrlQuery(router.query.tab, validFilters);
    if (tab != null) setActiveFilter(tab);
  }, [router.isReady, router.query.tab, validFilters, setActiveFilter]);

  useEffect(() => {
    if (!router.isReady || !isRouterQueryStringEqual(router.query.createContact, "1"))
      return;
    setShowCreateContactSidebar(true);
    const editId = parsePositiveIntFromQueryParam(router.query.editContactId);
    if (editId != null) setEditingContactId(editId);

    router.replace(
      {
        pathname: router.pathname,
        query: omitCreateContactDeepLinkQueryKeys(router.query),
      },
      undefined,
      { shallow: true },
    );
  }, [router.isReady, router.query.createContact, router.query.editContactId]);

  useEffect(() => {
    if (!showAddContactsDropdown) return;
    const handleClickOutside = createAddContactsDropdownMousedownOutsideHandler(
      addContactsRef,
      setShowAddContactsDropdown,
    );
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAddContactsDropdown, addContactsRef, setShowAddContactsDropdown]);

  useEffect(() => {
    if (!showCreateContactSidebar || !editingContactId) {
      setContactFormLoadError(null);
      setContactFormLoading(false);
      return;
    }
    let cancelled = false;
    loadEditableContactFormFromCrmId({
      editingContactId,
      sourceField,
      loadFailedMessage,
      setContactForm,
      setContactFormLoadError,
      setContactFormLoading,
      isCancelled: () => cancelled,
    });
    return () => {
      cancelled = true;
    };
  }, [
    showCreateContactSidebar,
    editingContactId,
    sourceField,
    loadFailedMessage,
    setContactForm,
    setContactFormLoadError,
    setContactFormLoading,
  ]);

  const handleFilterChange = useCallback(
    (filterId: string) => {
      setActiveFilter(filterId);
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      if (filterId === "has_leads") {
        setLoading(true);
      }

      router.push(
        buildShallowTabFilterPushArgs(router.pathname, router.query, filterId),
        undefined,
        { shallow: true },
      );
    },
    [
      router,
      setActiveFilter,
      setLoading,
      setPagination,
    ],
  );

  return { handleFilterChange };
}
