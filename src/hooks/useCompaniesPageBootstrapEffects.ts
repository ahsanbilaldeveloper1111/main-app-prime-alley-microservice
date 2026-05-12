import {
  useEffect,
  type RefObject,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { NextRouter } from "next/router";
import type { UseQueryResult } from "@tanstack/react-query";
import type { CompanyData } from "@utils/crm";
import type { CompanyFormPayload } from "@components/renderCreateCompany";

/** Sync list tab from `?tab=` when the router is ready. */
export function useCompaniesActiveFilterFromUrl(
  router: NextRouter,
  validFilters: readonly string[],
  setActiveFilter: (tab: string) => void,
): void {
  useEffect(() => {
    if (router.isReady && router.query.tab) {
      const tabFromUrl = String(router.query.tab);
      if (validFilters.includes(tabFromUrl)) {
        setActiveFilter(tabFromUrl);
      }
    }
  }, [router.isReady, router.query.tab, validFilters, setActiveFilter]);
}

/** Close "Add contacts" dropdown on outside click. */
export function useCompaniesAddContactsClickOutside(
  showAddContactsDropdown: boolean,
  addContactsRef: RefObject<HTMLDivElement | null>,
  setShowAddContactsDropdown: (open: boolean) => void,
): void {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (
        addContactsRef.current &&
        target instanceof Node &&
        !addContactsRef.current.contains(target)
      ) {
        setShowAddContactsDropdown(false);
      }
    };

    if (showAddContactsDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showAddContactsDropdown, addContactsRef, setShowAddContactsDropdown]);
}

type ContactFormQuery = UseQueryResult<CompanyData, Error>;

/** Reflect contact-company query loading/error into sidebar form state flags. */
export function useCompaniesContactFormLoadFlagsEffect(
  showCreateContactSidebar: boolean,
  editingContactId: number | null,
  contactCompanyForFormQuery: ContactFormQuery,
  setContactFormLoadError: (v: string | null) => void,
  setContactFormLoading: (v: boolean) => void,
): void {
  useEffect(() => {
    if (!showCreateContactSidebar || !editingContactId) {
      setContactFormLoadError(null);
      setContactFormLoading(false);
      return;
    }
    setContactFormLoading(contactCompanyForFormQuery.isFetching);
    if (contactCompanyForFormQuery.isError) {
      setContactFormLoadError("Failed to load company");
    } else {
      setContactFormLoadError(null);
    }
  }, [
    showCreateContactSidebar,
    editingContactId,
    contactCompanyForFormQuery.isFetching,
    contactCompanyForFormQuery.isError,
    setContactFormLoadError,
    setContactFormLoading,
  ]);
}

/** Prefill create-contact form when company data for the contact row is loaded. */
export function useCompaniesContactFormPrefillFromCompanyEffect(
  showCreateContactSidebar: boolean,
  editingContactId: number | null,
  contactCompanyForFormQuery: ContactFormQuery,
  setContactForm: Dispatch<SetStateAction<any>>,
): void {
  useEffect(() => {
    if (
      !showCreateContactSidebar ||
      !editingContactId ||
      !contactCompanyForFormQuery.data
    ) {
      return;
    }
    const company = contactCompanyForFormQuery.data;
    const nameParts = (company.name || "").trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";
    setContactForm({
      firstName,
      lastName,
      email: company.email ?? "",
      phoneNumber: company.phone ?? "",
      campaign_id: null,
      contact_owner: null,
      lifecycle_stage: "Lead",
      disposition: "",
      legal_basis: [],
      last_called: "",
      last_call_status: "",
      next_call: "",
      scheduled_call_at: "",
      tags: [],
      note: "",
      is_viewed: false,
    });
  }, [
    showCreateContactSidebar,
    editingContactId,
    contactCompanyForFormQuery.data,
    setContactForm,
  ]);
}

/** Hydrate create/edit company sidebar payload from the company-by-id query. */
export function useCompaniesEditCompanySidebarDataEffect(
  showCreateCompanySidebar: boolean,
  editingCompanyId: number | null,
  companyFormEditQuery: ContactFormQuery,
  setEditingCompanyData: Dispatch<SetStateAction<CompanyFormPayload | null>>,
): void {
  useEffect(() => {
    if (!showCreateCompanySidebar) return;
    if (editingCompanyId == null) {
      setEditingCompanyData(null);
      return;
    }
    const company = companyFormEditQuery.data;
    if (!company) return;
    setEditingCompanyData({
      name: company.name ?? "",
      phone: company.phone ?? undefined,
      city: company.city ?? undefined,
      country: company.country ?? undefined,
      industry: company.industry ?? undefined,
      domain: company.domain ?? undefined,
      email: company.email ?? undefined,
    });
  }, [
    showCreateCompanySidebar,
    editingCompanyId,
    companyFormEditQuery.data,
    setEditingCompanyData,
  ]);
}

/** Clear edit payload when the company fetch errors while editing. */
export function useCompaniesEditCompanySidebarErrorEffect(
  showCreateCompanySidebar: boolean,
  editingCompanyId: number | null,
  companyFormEditQuery: ContactFormQuery,
  setEditingCompanyData: Dispatch<SetStateAction<CompanyFormPayload | null>>,
): void {
  useEffect(() => {
    if (!showCreateCompanySidebar || editingCompanyId == null) return;
    if (companyFormEditQuery.isError) {
      setEditingCompanyData(null);
    }
  }, [
    showCreateCompanySidebar,
    editingCompanyId,
    companyFormEditQuery.isError,
    setEditingCompanyData,
  ]);
}
