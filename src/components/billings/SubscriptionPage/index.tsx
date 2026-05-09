import { SubscriptionPageView } from "./SubscriptionPageView";
import { useSubscriptionPage } from "./useSubscriptionPage";

export default function SubscriptionsPage() {
  const { companyDetails, displayPaymentMethod, hasDefaultAccount } = useSubscriptionPage();
  return (
    <SubscriptionPageView
      companyDetails={companyDetails}
      displayPaymentMethod={displayPaymentMethod}
      hasDefaultAccount={hasDefaultAccount}
    />
  );
}
