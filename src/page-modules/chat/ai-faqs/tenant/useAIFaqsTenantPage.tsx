import { chatKeys } from "@query/keys";
import { useChatCompaniesQuery } from "@page-modules/chat/useChatCompaniesQuery";
import {
  type CreateTenantFAQPayload,
  type FAQData,
  createTenantFAQ,
  deleteTenantFAQ,
  getTenantFAQs,
} from "@utils/chat";
import type { GenericListPageQueryParams } from "@components/GenericListPage";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import { useAiFaqListColumns } from "../aiFaqListColumns";
import {
  emptyFaqListPage,
  getValidFaqItemsForSubmit,
  paginateArrayForTable,
} from "../faqItemDraft";
import { useAiFaqDraftFormState } from "../hooks/useAiFaqDraftFormState";
import { useChatTrainBot } from "../../shared/useChatTrainBot";

function resolveTenantIdFromSession(
  user: Record<string, unknown> | undefined,
): string {
  if (!user) return "";
  const candidates = [user.company_identifier, user.tenant_id, user.tenant];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return "";
}

export function useAIFaqsTenantPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const companiesQuery = useChatCompaniesQuery(true);
  const companies = companiesQuery.data ?? [];
  const companiesLoading = companiesQuery.isPending;

  const [tenantId, setTenantId] = useState("");
  const [selectedCompanyForFilter, setSelectedCompanyForFilter] = useState("");
  const [filterTenantId, setFilterTenantId] = useState("");

  const sessionTenantId = useMemo(
    () =>
      resolveTenantIdFromSession(
        session?.user as Record<string, unknown> | undefined,
      ),
    [session?.user],
  );

  const listTenantId = useMemo(() => {
    const fromFilter = filterTenantId.trim();
    if (fromFilter) return fromFilter;
    const fromSelect = selectedCompanyForFilter.trim();
    if (fromSelect) return fromSelect;
    return sessionTenantId;
  }, [filterTenantId, selectedCompanyForFilter, sessionTenantId]);

  useEffect(() => {
    if (!sessionTenantId) return;
    setSelectedCompanyForFilter((prev) => prev || sessionTenantId);
    setFilterTenantId((prev) => prev || sessionTenantId);
  }, [sessionTenantId]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState<FAQData | null>(null);

  const {
    faqItems,
    haveFiles,
    selectedFiles,
    fileInputKey,
    resetForm,
    handleAddFAQItem,
    handleRemoveFAQItem,
    handleUpdateFAQItem,
    handleFileChange,
    handleRemoveFile,
  } = useAiFaqDraftFormState();

  const getTenantId = useCallback((): string => {
    if (tenantId?.trim()) return tenantId.trim();
    if (filterTenantId?.trim()) return filterTenantId.trim();
    if (selectedCompanyForFilter?.trim()) return selectedCompanyForFilter.trim();
    const u = session?.user as
      | { tenant_id?: string; company_identifier?: string; tenant?: string }
      | undefined;
    if (u?.company_identifier?.trim()) return u.company_identifier.trim();
    if (u?.tenant_id?.trim()) return u.tenant_id.trim();
    if (typeof u?.tenant === "string" && u.tenant.trim()) return u.tenant.trim();
    return "";
  }, [tenantId, filterTenantId, selectedCompanyForFilter, session?.user]);

  const trainBot = useChatTrainBot(getTenantId);

  const handleDeleteFAQ = useCallback((faq: FAQData) => {
    setSelectedFAQ(faq);
    setShowDeleteModal(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    const validFAQs = getValidFaqItemsForSubmit(faqItems);
    const hasFiles = haveFiles && selectedFiles.length > 0;

    if (validFAQs.length === 0 && !hasFiles) {
      toast.error("Add at least one FAQ (question and answer) or attach a PDF/TXT file");
      return;
    }

    try {
      const tenantForPayload = getTenantId();
      if (!tenantForPayload) {
        toast.error("Please select a tenant (company) first");
        return;
      }

      const faqsJson = JSON.stringify(validFAQs);
      const payload: CreateTenantFAQPayload = {
        tenant_id: tenantForPayload,
        faqs: faqsJson,
        ...(hasFiles ? { files: selectedFiles } : {}),
      };

      await createTenantFAQ(payload);

      resetForm();
      setShowAddModal(false);
      setSelectedFAQ(null);
      await queryClient.invalidateQueries({ queryKey: chatKeys.aiFaqs.tenant.all() });
    } catch (error) {
      console.error("Failed to save FAQs:", error);
    }
  }, [faqItems, getTenantId, haveFiles, resetForm, selectedFiles, queryClient]);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedFAQ?.id) return;
    try {
      await deleteTenantFAQ({ faq_id: selectedFAQ.id });

      setShowDeleteModal(false);
      setSelectedFAQ(null);
      await queryClient.invalidateQueries({ queryKey: chatKeys.aiFaqs.tenant.all() });
    } catch (error) {
      console.error("Failed to delete FAQ:", error);
    }
  }, [selectedFAQ, queryClient]);

  const handleCompanyFilterChange = useCallback((companyId: string) => {
    const id = companyId.trim();
    setSelectedCompanyForFilter(id);
    setFilterTenantId(id);
  }, []);

  const getListQueryOptions = useCallback(
    (params: GenericListPageQueryParams) => {
      const tenant = listTenantId;
      return {
        queryKey: chatKeys.aiFaqs.tenant.list({
          tenantId: tenant || "__none__",
          page: params.page,
          perPage: params.perPage,
          search: params.search,
        }),
        queryFn: async () => {
          if (!tenant) {
            return emptyFaqListPage(params.perPage);
          }
          try {
            const allFAQs = await getTenantFAQs(tenant, params.search || undefined);
            const { slice, total, last_page } = paginateArrayForTable(
              allFAQs,
              params.page,
              params.perPage,
            );
            return {
              data: slice,
              total,
              page: params.page,
              per_page: params.perPage,
              last_page,
            };
          } catch (error) {
            console.error("Error fetching FAQs:", error);
            return emptyFaqListPage(params.perPage);
          }
        },
      };
    },
    [listTenantId],
  );

  const handleApplyFilter = useCallback(() => {
    if (!selectedCompanyForFilter?.trim()) {
      toast.info("Please select a company first");
      return;
    }
    handleCompanyFilterChange(selectedCompanyForFilter);
  }, [handleCompanyFilterChange, selectedCompanyForFilter]);

  const stableFilters = useMemo(() => ({}), []);

  const openAddModalWithTenant = useCallback(() => {
    setTenantId(filterTenantId || selectedCompanyForFilter || "");
    setShowAddModal(true);
  }, [filterTenantId, selectedCompanyForFilter]);

  const columns = useAiFaqListColumns({
    variant: "tenant",
    onDelete: handleDeleteFAQ,
  });

  return {
    router,
    columns,
    getListQueryOptions,
    stableFilters,
    companies,
    companiesLoading,
    tenantId,
    setTenantId,
    selectedCompanyForFilter,
    handleCompanyFilterChange,
    filterTenantId,
    listTenantId,
    handleApplyFilter,
    showAddModal,
    setShowAddModal,
    showDeleteModal,
    setShowDeleteModal,
    selectedFAQ,
    setSelectedFAQ,
    faqItems,
    haveFiles,
    selectedFiles,
    fileInputKey,
    resetForm,
    handleAddFAQItem,
    handleRemoveFAQItem,
    handleUpdateFAQItem,
    handleFileChange,
    handleRemoveFile,
    handleSubmit,
    handleConfirmDelete,
    openAddModalWithTenant,
    ...trainBot,
  };
}
