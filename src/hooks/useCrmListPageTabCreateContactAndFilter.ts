import {
  useCallback,
  useEffect,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import type { NextRouter } from "next/router";
import { getCrmDataById, type CrmDataItem } from "@utils/crm";
import {
  mapCrmDataItemToContactFormState,
  type CrmItemForContactForm,
} from "@utils/crmContactFormFromCrmItem";

export type UseCrmListPageTabCreateContactAndFilterParams<
  TForm,
  TPagination extends { currentPage: number },
> = {
  router: NextRouter;
  validFilters: readonly string[];
  setActiveFilter: (value: string) => void;
  setPagination: Dispatch<SetStateAction<TPagination>>;
  setLoading: (value: boolean) => void;
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
    if (router.isReady && router.query.tab) {
      const tabFromUrl = String(router.query.tab);
      if (validFilters.includes(tabFromUrl)) {
        setActiveFilter(tabFromUrl);
      }
    }
  }, [router.isReady, router.query.tab]);

  useEffect(() => {
    if (!router.isReady || router.query.createContact !== "1") return;
    setShowCreateContactSidebar(true);
    const rawEditId = router.query.editContactId;
    const editIdStr = Array.isArray(rawEditId) ? rawEditId[0] : rawEditId;
    const editIdNum = editIdStr == null ? Number.NaN : Number(editIdStr);
    if (Number.isFinite(editIdNum) && editIdNum > 0) {
      setEditingContactId(editIdNum);
    }

    const { createContact: _c, editContactId: _e, ...rest } = router.query;
    router.replace({ pathname: router.pathname, query: rest }, undefined, {
      shallow: true,
    });
  }, [router.isReady, router.query.createContact, router.query.editContactId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        addContactsRef.current &&
        !addContactsRef.current.contains(event.target as Node)
      ) {
        setShowAddContactsDropdown(false);
      }
    };

    if (showAddContactsDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showAddContactsDropdown]);

  useEffect(() => {
    if (!showCreateContactSidebar || !editingContactId) {
      setContactFormLoadError(null);
      setContactFormLoading(false);
      return;
    }
    let cancelled = false;
    setContactFormLoadError(null);
    setContactFormLoading(true);
    getCrmDataById(editingContactId)
      .then(
        (
          item: CrmDataItem & {
            data?: Record<string, unknown>;
            source_file?: string;
            tags?: { id?: number; name?: string }[];
          },
        ) => {
          if (cancelled) return;
          const mapped = mapCrmDataItemToContactFormState(
            item as CrmItemForContactForm,
            sourceField,
          );
          setContactForm(mapped as TForm);
          if (!cancelled) setContactFormLoading(false);
        },
      )
      .catch(() => {
        if (!cancelled) {
          setContactFormLoadError(loadFailedMessage);
          setContactFormLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [showCreateContactSidebar, editingContactId]);

  const handleFilterChange = useCallback(
    (filterId: string) => {
      setActiveFilter(filterId);
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      if (filterId === "has_leads") {
        setLoading(true);
      }

      router.push(
        {
          pathname: router.pathname,
          query: { ...router.query, tab: filterId },
        },
        undefined,
        { shallow: true },
      );
    },
    [router],
  );

  return { handleFilterChange };
}
