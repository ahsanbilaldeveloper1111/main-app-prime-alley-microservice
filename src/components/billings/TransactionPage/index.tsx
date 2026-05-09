import { TransactionsPageView } from "./TransactionsPageView";
import { useTransactionsPage } from "./useTransactionsPage";

export default function TransactionsPage() {
  const p = useTransactionsPage();
  return <TransactionsPageView {...p} />;
}
