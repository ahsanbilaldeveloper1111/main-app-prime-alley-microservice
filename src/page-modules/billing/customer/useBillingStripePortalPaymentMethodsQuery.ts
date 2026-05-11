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
    payload === null ||
    typeof payload !== "object" ||
    !("payment_methods" in payload)
  ) {
    return [];
  }
  const methods = payload.payment_methods;
  if (!Array.isArray(methods)) {
    return [];
  }
  return methods as StripePortalPaymentMethodRow[];
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
