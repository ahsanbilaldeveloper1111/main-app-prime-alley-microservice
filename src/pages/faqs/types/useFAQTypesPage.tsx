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
        const moduleSuffix = t.faq_module ? ` (${t.faq_module.name})` : "";
        return {
          value: t.id as number,
          label: `${t.name}${moduleSuffix}`,
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
