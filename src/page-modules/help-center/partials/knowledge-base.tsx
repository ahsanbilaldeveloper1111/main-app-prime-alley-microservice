import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Row, Col, Card, Button } from "react-bootstrap";
import {
  ChevronLeft,
  BookOpen,
  Video,
  Users,
  TrendingUp,
  HelpCircle,
} from "lucide-react";
import { ListFAQTopics, ListFAQItems, getMostViewedFAQs } from "@utils/faqs";
import type { FaqTopicRow, FaqItemRow } from "./knowledge-base-types";
import { buildKnowledgeBasePanelSections } from "./knowledge-base-panel-sections";

interface KnowledgeBaseProps {
  onBack: () => void;
  moduleId?: string;
  searchQuery?: string;
  moduleName?: string;
  onArticleClick?: (article: unknown) => void;
}

function normalizeFaqArrayResponse<T>(response: unknown): T[] {
  if (Array.isArray(response)) {
    return response as T[];
  }
  if (response !== null && typeof response === "object") {
    const nested = Reflect.get(response, "data");
    if (Array.isArray(nested)) {
      return nested as T[];
    }
  }
  return [];
}

/** Removes tag-shaped spans matching /<[^>]*>/ in linear time (no regex backtracking). */
function stripSimpleAngleBracketTags(html: string): string {
  const LT = 60;
  const GT = 62;
  const chunks: string[] = [];
  let segmentStart = 0;
  let i = 0;
  const n = html.length;
  while (i < n) {
    if (html.charCodeAt(i) !== LT) {
      i += 1;
      continue;
    }
    const tagStart = i;
    let j = i + 1;
    while (j < n && html.charCodeAt(j) !== GT) {
      j += 1;
    }
    if (j >= n) {
      break;
    }
    chunks.push(html.slice(segmentStart, tagStart));
    segmentStart = j + 1;
    i = j + 1;
  }
  chunks.push(html.slice(segmentStart, n));
  return chunks.join("").trim();
}

function buildArticleSummaryPreview(item: FaqItemRow): string {
  const plainDesc = item.description?.trim();
  if (plainDesc) {
    return plainDesc.length > 150
      ? `${plainDesc.substring(0, 150)}...`
      : plainDesc;
  }
  if (item.answer) {
    const stripped = stripSimpleAngleBracketTags(item.answer);
    if (stripped.length > 0) {
      return stripped.length > 150
        ? `${stripped.substring(0, 150)}...`
        : stripped;
    }
  }
  return "No description available";
}

type PaginatedMeta = {
  current_page?: number;
  last_page?: number;
  total?: number;
};

function readPaginationMeta(response: unknown): PaginatedMeta | null {
  if (response === null || typeof response !== "object") {
    return null;
  }
  const out: PaginatedMeta = {};
  const cp = Reflect.get(response, "current_page");
  const lp = Reflect.get(response, "last_page");
  const total = Reflect.get(response, "total");
  if (typeof cp === "number") {
    out.current_page = cp;
  }
  if (typeof lp === "number") {
    out.last_page = lp;
  }
  if (typeof total === "number") {
    out.total = total;
  }
  return out;
}

function computeHasMoreFromResponse(
  response: unknown,
  itemsLength: number,
  perPage: number,
  totalLoadedAfterAppend: number,
): boolean {
  const meta = readPaginationMeta(response);
  if (meta?.last_page !== undefined && meta?.current_page !== undefined) {
    return meta.current_page < meta.last_page;
  }
  if (meta?.total !== undefined) {
    return totalLoadedAfterAppend < (meta.total || 0);
  }
  return itemsLength === perPage;
}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({
  onBack,
  moduleId,
  moduleName,
  searchQuery = "2FA",
  onArticleClick,
}) => {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [faqTopics, setFaqTopics] = useState<FaqTopicRow[]>([]);
  const [loadingTopics, setLoadingTopics] = useState<boolean>(false);
  const [faqItems, setFaqItems] = useState<FaqItemRow[]>([]);
  const [loadingItems, setLoadingItems] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [popularArticles, setPopularArticles] = useState<FaqItemRow[]>([]);
  const [loadingPopularArticles, setLoadingPopularArticles] =
    useState<boolean>(false);
  const [recentFAQs, setRecentFAQs] = useState<FaqItemRow[]>([]);
  const [loadingRecentFAQs, setLoadingRecentFAQs] = useState<boolean>(false);

  // Fetch FAQ topics on component mount
  useEffect(() => {
    const fetchTopics = async () => {
      setLoadingTopics(true);
      try {
        const response = await ListFAQTopics({
          page: 1,
          perPage: 100,
          filters: {
            faq_module_id: moduleId ? Number.parseInt(moduleId, 10) : undefined,
          },
        });
        const list = normalizeFaqArrayResponse<FaqTopicRow>(response);
        setFaqTopics(list);

        let topicIdFromUrl: number | null = null;
        const rawTopic = router.query.topicId;
        if (typeof rawTopic === "string") {
          const parsed = Number.parseInt(rawTopic, 10);
          if (!Number.isNaN(parsed)) {
            topicIdFromUrl = parsed;
          }
        }

        const topicFromUrl =
          topicIdFromUrl === null
            ? undefined
            : list.find((t) => t.id === topicIdFromUrl);
        if (topicFromUrl) {
          setSelectedCategory(topicFromUrl.name);
          setSelectedTopicId(topicFromUrl.id);
        } else if (list.length > 0) {
          setSelectedCategory(list[0].name);
          setSelectedTopicId(list[0].id);
        }
      } catch (error) {
        console.error("Error fetching FAQ topics:", error);
      } finally {
        setLoadingTopics(false);
      }
    };

    if (router.isReady) {
      fetchTopics();
    }
  }, [router.isReady, router.query.topicId, moduleId]);

  // Fetch FAQ items when topic is selected
  useEffect(() => {
    const fetchFAQItems = async () => {
      if (!selectedTopicId) return;

      setLoadingItems(true);
      setCurrentPage(1);
      try {
        const response = await ListFAQItems({
          page: 1,
          perPage: 5,
          filters: {
            topic_id: selectedTopicId,
            faq_module_id: moduleId ? Number.parseInt(moduleId, 10) : undefined,
          },
        });

        const items = normalizeFaqArrayResponse<FaqItemRow>(response);
        setFaqItems(items);
        setHasMore(computeHasMoreFromResponse(response, items.length, 5, items.length));
      } catch (error) {
        console.error("Error fetching FAQ items:", error);
        setFaqItems([]);
        setHasMore(false);
      } finally {
        setLoadingItems(false);
      }
    };

    fetchFAQItems();
  }, [selectedTopicId, moduleId]);

  // Fetch most viewed FAQs when topic is selected
  useEffect(() => {
    const fetchMostViewed = async () => {
      setLoadingPopularArticles(true);
      try {
        const response = await getMostViewedFAQs(
          undefined,
          selectedTopicId || undefined,
        );
        setPopularArticles(normalizeFaqArrayResponse<FaqItemRow>(response));
      } catch (error) {
        console.error("Error fetching most viewed FAQs:", error);
        setPopularArticles([]);
      } finally {
        setLoadingPopularArticles(false);
      }
    };

    fetchMostViewed();
  }, [selectedTopicId]);

  // Fetch recent FAQ items based on selected topic
  useEffect(() => {
    const fetchRecentFAQs = async () => {
      if (!selectedTopicId) {
        setRecentFAQs([]);
        return;
      }

      setLoadingRecentFAQs(true);
      try {
        const response = await ListFAQItems({
          page: 1,
          perPage: 5,
          filters: { topic_id: selectedTopicId },
        });

        const items = normalizeFaqArrayResponse<FaqItemRow>(response).slice();
        items.sort((a, b) => {
          const dateA = new Date(a.created_at || a.updated_at || 0).getTime();
          const dateB = new Date(b.created_at || b.updated_at || 0).getTime();
          return dateB - dateA;
        });

        // Take only the first 5
        setRecentFAQs(items.slice(0, 5));
      } catch (error) {
        console.error("Error fetching recent FAQs:", error);
        setRecentFAQs([]);
      } finally {
        setLoadingRecentFAQs(false);
      }
    };

    fetchRecentFAQs();
  }, [selectedTopicId]);

  // Load more FAQ items
  const handleLoadMore = async () => {
    if (!selectedTopicId || loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const response = await ListFAQItems({
        page: nextPage,
        perPage: 5,
        filters: { topic_id: selectedTopicId },
      });

      const newItems = normalizeFaqArrayResponse<FaqItemRow>(response);

      setFaqItems((prev) => {
        const merged = [...prev, ...newItems];
        setHasMore(
          computeHasMoreFromResponse(
            response,
            newItems.length,
            5,
            merged.length,
          ),
        );
        return merged;
      });
      setCurrentPage(nextPage);
    } catch (error) {
      console.error("Error loading more FAQ items:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Transform FAQ topics to categories format
  const categories = faqTopics.map((topic) => ({
    id: topic.id,
    name: topic.name,
    count: Number.parseInt(topic.faqs_count || "0", 10),
    icon: topic.faq_module?.icon || "help_outline",
  }));

  // Extract unique FAQ types from fetched items
  const getUniqueTypes = () => {
    const types = new Set<string>();
    faqItems.forEach((item) => {
      const trimmed = item.type?.trim();
      if (trimmed) {
        types.add(trimmed);
      }
    });
    return Array.from(types).sort((a, b) => a.localeCompare(b));
  };

  const uniqueTypes = getUniqueTypes();

  // Create dynamic tabs with "All" as first tab (only when there are multiple types)
  const tabs =
    uniqueTypes.length > 1
      ? [
          { id: "all", label: "All" },
          ...uniqueTypes.map((type) => ({
            id: type.toLowerCase().replaceAll(/\s+/g, "-"),
            label: type,
          })),
        ]
      : uniqueTypes.map((type) => ({
          id: type.toLowerCase().replaceAll(/\s+/g, "-"),
          label: type,
        }));

  // Transform FAQ items to articles format
  const formatDate = (dateString: string) => {
    if (!dateString) return "Recently";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  // Filter FAQ items by selected tab (type)
  const filteredFAQItems =
    activeTab === "all"
      ? faqItems
      : faqItems.filter((item) => {
          const itemType = item.type
            ?.trim()
            .toLowerCase()
            .replaceAll(/\s+/g, "-");
          return itemType === activeTab;
        });
  const articles = filteredFAQItems.map((item) => ({
    id: item.id,
    icon: item.topic?.faq_module?.icon,
    title: item.title || item.question || "",
    description: buildArticleSummaryPreview(item),
    updated: formatDate(item.updated_at || item.created_at || ""),
    views: item.view_count || 0,
    answer: item.answer,
    topic: item.topic,
    type: item.type,
  }));

  // Transform most viewed FAQs to popular articles format
  const transformedPopularArticles = popularArticles.map((article) => ({
    id: article.id,
    title: article.title || article.question || "",
    viewCount: article.view_count || 0,
  }));

  const resources = [
    { icon: BookOpen, name: "User Guides", color: "#4680ff" },
    { icon: Video, name: "Video Tutorials", color: "#04a9f5" },
    { icon: Users, name: "Community Forum", color: "#1de9b6" },
  ];

  // Transform recent FAQs to the format needed for rendering
  const transformedFAQs = recentFAQs.map((faq) => ({
    id: faq.id,
    title: faq.title || faq.question || "",
    viewCount: faq.view_count || 0,
  }));
  const {
    categorySidebarBody,
    mainArticlesBody,
    popularArticlesBody,
    recentFaqsBody,
    resourcesListBody,
  } = buildKnowledgeBasePanelSections({
    loadingTopics,
    categories,
    selectedCategory,
    setSelectedCategory,
    setSelectedTopicId,
    router,
    loadingItems,
    articles,
    onArticleClick,
    loadingPopularArticles,
    transformedPopularArticles,
    popularArticles,
    loadingRecentFAQs,
    transformedFAQs,
    recentFAQs,
    resources,
  });


  return (
    <div
      style={{
        background: "#f4f7fa",
        minHeight: "100vh",
        paddingBottom: "40px",
      }}
    >
      {/* Breadcrumb */}
      <div style={{ marginBottom: "20px" }}>
        <Button
          variant="link"
          type="button"
          onClick={onBack}
          style={{
            textDecoration: "none",
            color: "#6c757d",
            fontSize: "14px",
            padding: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <ChevronLeft aria-hidden size={16} /> Help Center
        </Button>
        <span style={{ color: "#6c757d", margin: "0 8px" }}>›</span>
        <span style={{ color: "#2c3e50", fontWeight: "600", fontSize: "14px" }}>
          Knowledge Base
        </span>
      </div>

      <Row className="g-3">
        {/* Left Sidebar - Categories */}
        <Col xs={12} lg={2}>
          <Card
            style={{
              background: "#fff",
              border: "1px solid #e9ecef",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "0" }}>{categorySidebarBody}</div>
          </Card>
        </Col>

        {/* Main Content */}
        <Col xs={12} lg={7}>
          <Card
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              overflow: "hidden",
            }}
          >
            {/* Header Section */}
            <div
              style={{
                padding: "24px 24px 20px 24px",
                background: "linear-gradient(to right, #f9fafb, #fff)",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "16px",
                }}
              >
                <div>
                  <h4
                    style={{
                      fontSize: "20px",
                      fontWeight: "700",
                      color: "#1f2937",
                      margin: 0,
                      marginBottom: "6px",
                    }}
                  >
                    Search Results
                  </h4>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#6b7280",
                      margin: 0,
                    }}
                  >
                    Showing results for{" "}
                    <span
                      style={{
                        color: "#667eea",
                        fontWeight: "600",
                        background: "#667eea15",
                        padding: "2px 8px",
                        borderRadius: "4px",
                      }}
                    >
                      "{selectedCategory || searchQuery || moduleName}"
                    </span>
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  marginTop: "20px",
                  flexWrap: "wrap",
                }}
              >
                {tabs.map((tab) => (
                  <Button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: "10px 20px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: activeTab === tab.id ? "#fff" : "#6b7280",
                      background:
                        activeTab === tab.id
                          ? "linear-gradient(135deg, #667eea 0%, #667eea 100%)"
                          : "#fff",
                      border:
                        activeTab === tab.id ? "none" : "1px solid #e5e7eb",
                      borderRadius: "8px",
                      transition: "all 0.2s",
                      boxShadow:
                        activeTab === tab.id
                          ? "0 4px 12px rgba(102, 126, 234, 0.3)"
                          : "none",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== tab.id) {
                        e.currentTarget.style.background = "#f9fafb";
                        e.currentTarget.style.borderColor = "#667eea";
                        e.currentTarget.style.color = "#667eea";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== tab.id) {
                        e.currentTarget.style.background = "#fff";
                        e.currentTarget.style.borderColor = "#e5e7eb";
                        e.currentTarget.style.color = "#6b7280";
                      }
                    }}
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>
            </div>

            <Card.Body style={{ padding: "24px" }}>
              {/* Articles List */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {mainArticlesBody}
              </div>

              {/* Pagination or Load More */}
              {hasMore && (
                <div
                  style={{
                    marginTop: "28px",
                    paddingTop: "24px",
                    borderTop: "1px solid #f3f4f6",
                    textAlign: "center",
                  }}
                >
                  <Button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    style={{
                      background: "#fff",
                      border: "2px solid #667eea",
                      borderRadius: "8px",
                      padding: "10px 24px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#667eea",
                      transition: "all 0.2s",
                      opacity: loadingMore ? 0.6 : 1,
                      cursor: loadingMore ? "not-allowed" : "pointer",
                    }}
                    onMouseEnter={(e) => {
                      if (!loadingMore) {
                        e.currentTarget.style.background = "#667eea";
                        e.currentTarget.style.color = "#fff";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loadingMore) {
                        e.currentTarget.style.background = "#fff";
                        e.currentTarget.style.color = "#667eea";
                      }
                    }}
                  >
                    {loadingMore ? "Loading..." : "Load More Results"}
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <style
          dangerouslySetInnerHTML={{
            __html: `
  .article-icon-wrapper:hover ~ .accent-line {
    opacity: 1 !important;
  }
`,
          }}
        />

        {/* Right Sidebar */}
        <Col xs={12} lg={3}>
          {/* Popular Articles */}
          <Card
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              marginBottom: "20px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "18px 20px",
                background: "linear-gradient(to right, #f9fafb, #fff)",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <TrendingUp aria-hidden size={18} color="#fff" strokeWidth={2.5} />
                </div>
                <h5
                  style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#1f2937",
                    margin: 0,
                  }}
                >
                  Popular Articles
                </h5>
              </div>
            </div>
            <Card.Body style={{ padding: "0" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0",
                }}
              >
                {popularArticlesBody}
              </div>
            </Card.Body>
          </Card>

          {/* Resources */}
          <Card
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              marginBottom: "20px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "18px 20px",
                background: "linear-gradient(to right, #f9fafb, #fff)",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background:
                      "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <BookOpen aria-hidden size={18} color="#fff" strokeWidth={2.5} />
                </div>
                <h5
                  style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#1f2937",
                    margin: 0,
                  }}
                >
                  Resources
                </h5>
              </div>
            </div>
            <Card.Body style={{ padding: "0" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0",
                }}
              >
                {resourcesListBody}
              </div>
            </Card.Body>
          </Card>

          {/* FAQs */}
          <Card
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "18px 20px",
                background: "linear-gradient(to right, #f9fafb, #fff)",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background:
                      "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <HelpCircle aria-hidden size={18} color="#fff" strokeWidth={2.5} />
                </div>
                <h5
                  style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#1f2937",
                    margin: 0,
                  }}
                >
                  FAQs
                </h5>
              </div>
            </div>
            <Card.Body style={{ padding: "0" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0",
                }}
              >
                {recentFaqsBody}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default KnowledgeBase;
