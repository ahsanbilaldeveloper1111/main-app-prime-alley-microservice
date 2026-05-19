import { useQuery } from "@tanstack/react-query";

import type { PaymentMethodLike } from "@components/billings/shared/paymentMethods";
import { normalizePaymentMethods } from "@components/billings/shared/paymentMethods";
import { billingCustomerKeys } from "@query/keys";
import { GetPaymentMethods } from "@utils/accounting";
import { getErrorMessage } from "@utils/errors";
import { toast } from "react-toastify";

export type StripePortalPaymentMethodRow = PaymentMethodLike;

function parseStripePortalPaymentMethods(
  payload: unknown,
): StripePortalPaymentMethodRow[] {
  return normalizePaymentMethods(payload);
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
