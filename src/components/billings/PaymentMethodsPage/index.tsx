import { PaymentMethodsPageView } from "./PaymentMethodsPageView";
import { usePaymentMethodsPage } from "./usePaymentMethodsPage";

export default function PaymentMethodsPage() {
  const vm = usePaymentMethodsPage();
  return <PaymentMethodsPageView {...vm} />;
}
