import { useQuery } from "@tanstack/react-query";

import { billingCustomerKeys } from "../../../query/keys";
import { GetPaymentMethods } from "@utils/accounting";
import { getErrorMessage } from "@utils/errors";
import { toast } from "react-toastify";

export type StripePortalPaymentMethodRow = Record<string, unknown> & {
  id?: string | number;
};

function parseStripePortalPaymentMethods(
  payload: unknown,
): StripePortalPaymentMethodRow[] {
  if (
    payload &&
    typeof payload === "object" &&
    "payment_methods" in payload &&
    Array.isArray((payload as { payment_methods: unknown }).payment_methods)
  ) {
    return (payload as { payment_methods: StripePortalPaymentMethodRow[] })
      .payment_methods;
  }
  return [];
}

export function useBillingStripePortalPaymentMethodsQuery() {
  return useQuery({
    queryKey: billingCustomerKeys.paymentMethods.stripePortal(),
    queryFn: async () => {
      try {
        const response = await GetPaymentMethods();
        return parseStripePortalPaymentMethods(response);
      } catch (error) {
        toast.error(`Failed to load payment methods: ${getErrorMessage(error)}`, {
          toastId: "billing_stripe_payment_methods_failed",
        });
        return [];
      }
    },
  });
}
