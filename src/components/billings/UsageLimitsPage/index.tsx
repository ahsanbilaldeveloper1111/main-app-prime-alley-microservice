import { UsageLimitsPageView } from "./UsageLimitsPageView";
import { useUsageLimitsPage } from "./useUsageLimitsPage";

export default function UsageLimitsPage() {
  const p = useUsageLimitsPage();
  return <UsageLimitsPageView {...p} />;
}
