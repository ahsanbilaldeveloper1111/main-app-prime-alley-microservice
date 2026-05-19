import { billingCustomerKeys } from "@query/keys";
import { useBillingStripePortalPaymentMethodsQuery } from "@page-modules/billing/customer/useBillingStripePortalPaymentMethodsQuery";
import {
  deletePaymentMethod,
  setDefaultPaymentMethod,
} from "@utils/accounting";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import type { StripePaymentMethodRow } from "./paymentMethodsTypes";

export function usePaymentMethodsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const paymentMethodsQuery = useBillingStripePortalPaymentMethodsQuery();
  const paymentMethods = (paymentMethodsQuery.data ??
    []) as unknown as StripePaymentMethodRow[];

  const invalidatePaymentMethods = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: billingCustomerKeys.paymentMethods.stripePortal(),
    });
  }, [queryClient]);

  const setDefaultMutation = useMutation({
    mutationFn: (id: string | number) => setDefaultPaymentMethod(String(id)),
    onSuccess: async () => {
      await invalidatePaymentMethods();
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: (id: string) => deletePaymentMethod(id),
    onSuccess: async () => {
      await invalidatePaymentMethods();
      setDeletePaymentMethodConfirm(false);
      setDeletePaymentMethodId(null);
      toast.success("Payment method deleted successfully");
    },
  });

  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [stripePublishableKey, setStripePublishableKey] = useState<string>("");

  useEffect(() => {
    const loadStripePublishableKey = () => {
      try {
        const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
        setStripePublishableKey(key);
      } catch (error) {
        console.error("Error loading Stripe publishable key:", error);
      }
    };
    loadStripePublishableKey();
  }, []);

  const handleSetDefault = useCallback(
    (id: string | number) => {
      setDefaultMutation.mutate(id);
    },
    [setDefaultMutation],
  );

  const [deletePaymentMethodId, setDeletePaymentMethodId] = useState<
    string | null
  >(null);
  const [deletePaymentMethodConfirm, setDeletePaymentMethodConfirm] =
    useState(false);

  const handleDeleteCard = useCallback((id: string | number) => {
    setDeletePaymentMethodId(String(id));
    setDeletePaymentMethodConfirm(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (deletePaymentMethodId) {
      deleteCardMutation.mutate(deletePaymentMethodId);
    }
  }, [deletePaymentMethodId, deleteCardMutation]);

  const handleAddCardSuccess = useCallback(async () => {
    setShowAddCardModal(false);
    await invalidatePaymentMethods();
  }, [invalidatePaymentMethods]);

  const canAddPaymentMethod =
    session?.user?.permissions?.includes("add-payment-method-billing") ?? false;
  const canMarkDefault =
    session?.user?.permissions?.includes(
      "mark-payment-method-default-billing",
    ) ?? false;
  const canDeletePaymentMethod =
    session?.user?.permissions?.includes("delete-payment-method-billing") ??
    false;

  return {
    paymentMethods,
    showAddCardModal,
    setShowAddCardModal,
    stripePublishableKey,
    handleSetDefault,
    deletePaymentMethodConfirm,
    setDeletePaymentMethodConfirm,
    deletePaymentMethodId,
    handleDeleteCard,
    handleConfirmDelete,
    handleAddCardSuccess,
    canAddPaymentMethod,
    canMarkDefault,
    canDeletePaymentMethod,
  };
}
