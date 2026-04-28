import type React from "react";
import { useEffect } from "react";
import type { NextRouter } from "next/router";
import { ModuleSlug } from "@utils/Helper";
import type { OrdersUiFilters } from "./crmOrdersPlannerListConstants";
import {
  syncPlannerOrdersActiveTabFromRouter,
  syncPlannerOrdersFiltersFromActiveTab,
} from "./crmOrdersPlannerListFilters";
import {
  plannerLoadExtensions,
  plannerLoadLostReasons,
  plannerLoadStages,
} from "./crmOrdersPlannerListCommands";

export type UseCrmOrdersPlannerLifecycleEffectsInput = Readonly<{
  setStages: React.Dispatch<React.SetStateAction<any[]>>;
  setLostReasons: React.Dispatch<React.SetStateAction<any[]>>;
  setExtensions: React.Dispatch<React.SetStateAction<any[]>>;
  activeFilter: string;
  stages: any[];
  setCurrentFilters: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  setOrdersFilters: React.Dispatch<React.SetStateAction<OrdersUiFilters>>;
  router: NextRouter;
  setActiveFilter: React.Dispatch<React.SetStateAction<string>>;
  refreshKey: number;
  currentFilters: Record<string, unknown>;
  ordersPagination: {
    currentPage: number;
    rowsPerPage: number;
    sortBy: string;
    sortOrder: "asc" | "desc";
  };
  fetchOrders: (page?: number, perPage?: number) => Promise<void>;
  showAttachmentModal: boolean;
  selectedOrderForAttachments: unknown;
  fetchAttachments: () => Promise<void>;
  setAttachments: React.Dispatch<React.SetStateAction<any[]>>;
  setDealAttachments: React.Dispatch<React.SetStateAction<any[]>>;
}>;

export function useCrmOrdersPlannerLifecycleEffects(
  input: UseCrmOrdersPlannerLifecycleEffectsInput,
): void {
  const {
    setStages,
    setLostReasons,
    setExtensions,
    activeFilter,
    stages,
    setCurrentFilters,
    setOrdersFilters,
    router,
    setActiveFilter,
    refreshKey,
    currentFilters,
    ordersPagination,
    fetchOrders,
    showAttachmentModal,
    selectedOrderForAttachments,
    fetchAttachments,
    setAttachments,
    setDealAttachments,
  } = input;

  useEffect(() => {
    Promise.all([
      plannerLoadStages(setStages),
      plannerLoadLostReasons(setLostReasons),
      plannerLoadExtensions(setExtensions, ModuleSlug.CRM_ORDERS),
    ]).catch((error: unknown) => {
      console.error("Failed to load CRM orders bootstrap data:", error);
    });
  }, [setStages, setLostReasons, setExtensions]);

  useEffect(() => {
    syncPlannerOrdersFiltersFromActiveTab({
      activeFilter,
      stages,
      setCurrentFilters,
      setOrdersFilters,
    });
  }, [activeFilter, stages, setCurrentFilters, setOrdersFilters]);

  useEffect(() => {
    syncPlannerOrdersActiveTabFromRouter({
      routerReady: router.isReady,
      routerTab: router.query.tab,
      stages,
      activeFilter,
      setActiveFilter,
    });
  }, [router, router.isReady, router.query.tab, stages, activeFilter, setActiveFilter]);

  useEffect(() => {
    fetchOrders(ordersPagination.currentPage, ordersPagination.rowsPerPage).catch(
      (error: unknown) => {
        console.error("Failed to fetch orders:", error);
      },
    );
  }, [
    refreshKey,
    currentFilters,
    ordersPagination.currentPage,
    ordersPagination.rowsPerPage,
    ordersPagination.sortBy,
    ordersPagination.sortOrder,
    fetchOrders,
  ]);

  useEffect(() => {
    const order = selectedOrderForAttachments as { id?: number } | null;
    if (showAttachmentModal && order?.id) {
      fetchAttachments().catch((error: unknown) => {
        console.error("Failed to fetch attachments:", error);
      });
      return;
    }
    setAttachments([]);
    setDealAttachments([]);
  }, [
    showAttachmentModal,
    (selectedOrderForAttachments as { id?: number } | null | undefined)?.id,
    fetchAttachments,
    setAttachments,
    setDealAttachments,
  ]);
}
