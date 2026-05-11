import { useMemo, useState } from "react";
import { useAllFAQTopicsQuery } from "@page-modules/faqs/useAllFAQTopicsQuery";
import { useFAQItemTypesQuery } from "@page-modules/faqs/useFAQItemTypesQuery";

export function useFAQTypesPage() {
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);

  const allTopicsQuery = useAllFAQTopicsQuery(true);
  const typesQuery = useFAQItemTypesQuery(selectedTopic);

  const topicOptions = useMemo(() => {
    const topics = allTopicsQuery.data ?? [];
    return [
      { value: null as number | null, label: "All Topics" },
      ...topics.map((t: any) => {
        let label = String(t.name);
        if (t.faq_module) {
          label += ` (${String(t.faq_module.name)})`;
        }
        return {
          value: t.id as number,
          label,
        };
      }),
    ];
  }, [allTopicsQuery.data]);

  const types = typesQuery.data ?? [];
  const loading = allTopicsQuery.isFetching || typesQuery.isFetching;
  const isLoadingTopics = allTopicsQuery.isFetching && !allTopicsQuery.data;

  return {
    selectedTopic,
    setSelectedTopic,
    topicOptions,
    types,
    loading,
    isLoadingTopics,
  };
}
