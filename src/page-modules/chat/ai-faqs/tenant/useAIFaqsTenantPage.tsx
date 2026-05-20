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
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import { usePermissions } from "@utils/permissionUtils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

const { PERMISSIONS } = HEADER_CONSTANTS;

import { useAiFaqListColumns } from "../aiFaqListColumns";
import {
  buildAiFaqSubmitFields,
  emptyFaqListPage,
  paginateArrayForTable,
  validateAiFaqDraftSubmit,
} from "../faqItemDraft";
import { useAiFaqDraftFormState } from "../hooks/useAiFaqDraftFormState";
import { resolveTenantIdFromSession } from "../../shared/resolveTenantIdFromSession";
import { useChatTrainBot } from "../../shared/useChatTrainBot";

export function useAIFaqsTenantPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { hasPermission } = usePermissions();
  const canDeleteFaq = hasPermission(PERMISSIONS.DELETE_TENANT_FAQS_AI_CHAT);
  const companiesQuery = useChatCompaniesQuery(true);
  const companies = companiesQuery.data ?? [];
  const companiesLoading = companiesQuery.isPending;

  const [tenantId, setTenantId] = useState("");
  const [selectedCompanyForFilter, setSelectedCompanyForFilter] = useState("");
  const [filterTenantId, setFilterTenantId] = useState("");

  const sessionTenantId = useMemo(
    () => resolveTenantIdFromSession(session?.user),
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
    return resolveTenantIdFromSession(session?.user);
  }, [tenantId, filterTenantId, selectedCompanyForFilter, session?.user]);

  const trainBot = useChatTrainBot(getTenantId);

  const handleDeleteFAQ = useCallback(
    (faq: FAQData) => {
      if (!canDeleteFaq) {
        toast.error("You do not have permission to delete tenant FAQs.");
        return;
      }
      setSelectedFAQ(faq);
      setShowDeleteModal(true);
    },
    [canDeleteFaq],
  );

  const handleSubmit = useCallback(async () => {
    const validation = validateAiFaqDraftSubmit(faqItems, haveFiles, selectedFiles, {
      filesOnlyHint:
        "Add at least one FAQ (question and answer) or attach a PDF/TXT file",
    });
    if (!validation.ok) {
      toast.error(validation.message);
      return;
    }

    const { validFAQs } = validation;

    try {
      const tenantForPayload = getTenantId();
      if (!tenantForPayload) {
        toast.error("Please select a tenant (company) first");
        return;
      }

      const fields = buildAiFaqSubmitFields(validFAQs, haveFiles, selectedFiles);
      const payload: CreateTenantFAQPayload = {
        tenant_id: tenantForPayload,
        faqs: fields.faqs,
        have_files: fields.have_files,
        ...(fields.files?.length ? { files: fields.files } : {}),
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
    if (!canDeleteFaq) {
      toast.error("You do not have permission to delete tenant FAQs.");
      return;
    }
    try {
      await deleteTenantFAQ({ faq_id: selectedFAQ.id });

      setShowDeleteModal(false);
      setSelectedFAQ(null);
      await queryClient.invalidateQueries({ queryKey: chatKeys.aiFaqs.tenant.all() });
    } catch (error) {
      console.error("Failed to delete FAQ:", error);
    }
  }, [canDeleteFaq, selectedFAQ, queryClient]);

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
    resetForm();
    setTenantId(filterTenantId || selectedCompanyForFilter || "");
    setShowAddModal(true);
  }, [filterTenantId, resetForm, selectedCompanyForFilter]);

  const columns = useAiFaqListColumns({
    variant: "tenant",
    onDelete: handleDeleteFAQ,
    canDelete: canDeleteFaq,
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
