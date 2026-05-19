import { useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deletePaymentMethod, setDefaultPaymentMethod } from "@utils/accounting";
import { toast } from "react-toastify";
import { usePermissions } from "@utils/permissionUtils";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import { billingCustomerKeys } from "@query/keys";
import { useBillingStripePortalPaymentMethodsQuery } from "@page-modules/billing/customer/useBillingStripePortalPaymentMethodsQuery";

const { PERMISSIONS } = HEADER_CONSTANTS;

export function usePaymentMethodsPage() {
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const canAddPaymentMethod = hasPermission(PERMISSIONS.ADD_PAYMENT_METHOD_BILLING);
  const canMarkDefaultPaymentMethod = hasPermission(
    PERMISSIONS.MARK_PAYMENT_METHOD_DEFAULT_BILLING,
  );
  const canDeletePaymentMethod = hasPermission(PERMISSIONS.DELETE_PAYMENT_METHOD_BILLING);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [actionsOpenId, setActionsOpenId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const paymentMethodsQuery = useBillingStripePortalPaymentMethodsQuery();
  const paymentMethods = paymentMethodsQuery.data ?? [];
  const loading = paymentMethodsQuery.isPending || paymentMethodsQuery.isFetching;

  const invalidatePaymentMethods = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: billingCustomerKeys.paymentMethods.stripePortal(),
    });
  }, [queryClient]);

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => setDefaultPaymentMethod(id),
    onSuccess: async () => {
      toast.success("Default payment method updated");
      await invalidatePaymentMethods();
    },
    onError: () => {
      toast.error("Failed to set default payment method");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePaymentMethod(id),
    onSuccess: async () => {
      toast.success("Payment method deleted");
      setDeleteConfirmId(null);
      await invalidatePaymentMethods();
    },
    onError: () => {
      toast.error("Failed to delete payment method");
    },
  });

  const handleSetDefault = (id: string) => {
    if (!canMarkDefaultPaymentMethod) {
      toast.error("You are not authorized to set default payment method");
      return;
    }
    setActionsOpenId(null);
    setDefaultMutation.mutate(id);
  };

  const handleDeleteClick = (id: string) => {
    if (!canDeletePaymentMethod) {
      toast.error("You are not authorized to delete payment method");
      return;
    }
    setActionsOpenId(null);
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmId || !canDeletePaymentMethod) return;
    deleteMutation.mutate(deleteConfirmId);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    invalidatePaymentMethods().catch(() => undefined);
  };

  return {
    canAddPaymentMethod,
    canMarkDefaultPaymentMethod,
    canDeletePaymentMethod,
    sidebarOpen,
    setSidebarOpen,
    actionsOpenId,
    setActionsOpenId,
    paymentMethods,
    loading,
    deleteConfirmId,
    setDeleteConfirmId,
    handleSetDefault,
    handleDeleteClick,
    handleConfirmDelete,
    handleCloseSidebar,
  };
}

export type PaymentMethodsPageViewModel = ReturnType<typeof usePaymentMethodsPage>;
