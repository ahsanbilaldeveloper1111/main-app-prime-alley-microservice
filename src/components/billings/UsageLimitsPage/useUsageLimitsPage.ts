import { useMemo, useState } from "react";
import { usageLimitsFeatures } from "./usageLimitsConstants";

export function useUsageLimitsPage() {
  const [showUnbilled, setShowUnbilled] = useState(true);
  const [featureFilter, setFeatureFilter] = useState("All features");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFeatures = useMemo(
    () => usageLimitsFeatures.filter((f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [searchQuery],
  );

  return {
    showUnbilled,
    setShowUnbilled,
    featureFilter,
    setFeatureFilter,
    searchQuery,
    setSearchQuery,
    filteredFeatures,
  };
}
