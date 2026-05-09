import { useCallback, useEffect, useRef, useState } from "react";
import { GetPaymentMethods, setDefaultPaymentMethod, deletePaymentMethod } from "@utils/accounting";
import { toast } from "react-toastify";
import { usePermissions } from "@utils/permissionUtils";
import { HEADER_CONSTANTS } from "@constants/headerConstants";

const { PERMISSIONS } = HEADER_CONSTANTS;

export function usePaymentMethodsPage() {
  const { hasPermission } = usePermissions();
  const canAddPaymentMethod = hasPermission(PERMISSIONS.ADD_PAYMENT_METHOD_BILLING);
  const canMarkDefaultPaymentMethod = hasPermission(PERMISSIONS.MARK_PAYMENT_METHOD_DEFAULT_BILLING);
  const canDeletePaymentMethod = hasPermission(PERMISSIONS.DELETE_PAYMENT_METHOD_BILLING);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [actionsOpenId, setActionsOpenId] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const fetchVersionRef = useRef(0);

  const fetchPaymentMethods = useCallback(async () => {
    fetchVersionRef.current += 1;
    const version = fetchVersionRef.current;
    setLoading(true);
    try {
      const response = await GetPaymentMethods() as any;
      if (version !== fetchVersionRef.current) return;
      const list = Array.isArray(response)
        ? response
        : response?.payment_methods ?? response?.data ?? [];
      setPaymentMethods(Array.isArray(list) ? list : []);
    } catch (err) {
      if (version !== fetchVersionRef.current) return;
      console.error("GetPaymentMethods error:", err);
      setPaymentMethods([]);
      toast.error("Failed to load payment methods");
    } finally {
      if (version === fetchVersionRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchPaymentMethods().catch(() => undefined);
    return () => {
      fetchVersionRef.current += 1;
    };
  }, [fetchPaymentMethods]);

  const handleSetDefault = async (id: string) => {
    if (!canMarkDefaultPaymentMethod) {
      toast.error("You are not authorized to set default payment method");
      return;
    }
    setActionsOpenId(null);
    try {
      await setDefaultPaymentMethod(id);
      toast.success("Default payment method updated");
      fetchPaymentMethods().catch(() => undefined);
    } catch (err) {
      console.error("setDefaultPaymentMethod error:", err);
      toast.error("Failed to set default payment method");
    }
  };

  const handleDeleteClick = (id: string) => {
    if (!canDeletePaymentMethod) {
      toast.error("You are not authorized to delete payment method");
      return;
    }
    setActionsOpenId(null);
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    if (!canDeletePaymentMethod) {
      toast.error("You are not authorized to delete payment method");
      return;
    }
    try {
      await deletePaymentMethod(deleteConfirmId);
      toast.success("Payment method deleted");
      setDeleteConfirmId(null);
      fetchPaymentMethods().catch(() => undefined);
    } catch (err) {
      console.error("deletePaymentMethod error:", err);
      toast.error("Failed to delete payment method");
    }
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    fetchPaymentMethods().catch(() => undefined);
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
