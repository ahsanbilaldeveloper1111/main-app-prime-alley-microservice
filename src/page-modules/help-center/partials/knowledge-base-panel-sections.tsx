import React from "react";
import type { NextRouter } from "next/router";
import { Row, Col, Badge } from "react-bootstrap";
import type { LucideIcon } from "lucide-react";
import {
  ChevronRight,
  Calendar,
  Eye,
  FileQuestion,
} from "lucide-react";
import type { FaqItemRow } from "./knowledge-base-types";

export type KnowledgePanelCategory = {
  id: number;
  name: string;
  count: number;
  icon: string;
};

export type KnowledgePanelArticle = {
  id?: number | string;
  icon?: string;
  title: string;
  description: string;
  updated: string;
  views: number;
};

export type KnowledgePanelTransformed = {
  id?: number | string;
  title: string;
};

export type KnowledgePanelResource = {
  icon: LucideIcon;
  name: string;
  color: string;
};

export type BuildKnowledgePanelSectionsInput = {
  loadingTopics: boolean;
  categories: KnowledgePanelCategory[];
  selectedCategory: string;
  setSelectedCategory: (name: string) => void;
  setSelectedTopicId: (id: number) => void;
  router: NextRouter;
  loadingItems: boolean;
  articles: KnowledgePanelArticle[];
  onArticleClick?: (article: unknown) => void;
  loadingPopularArticles: boolean;
  transformedPopularArticles: KnowledgePanelTransformed[];
  popularArticles: FaqItemRow[];
  loadingRecentFAQs: boolean;
  transformedFAQs: KnowledgePanelTransformed[];
  recentFAQs: FaqItemRow[];
  resources: KnowledgePanelResource[];
};

export type KnowledgePanelSections = {
  categorySidebarBody: React.ReactNode;
  mainArticlesBody: React.ReactNode;
  popularArticlesBody: React.ReactNode;
  recentFaqsBody: React.ReactNode;
  resourcesListBody: React.ReactNode;
};

export function buildKnowledgeBasePanelSections(
  input: BuildKnowledgePanelSectionsInput,
): KnowledgePanelSections {
  const {
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
  } = input;

  let categorySidebarBody: React.ReactNode;
  if (loadingTopics) {
    categorySidebarBody = (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          color: "#6c757d",
        }}
      >
        Loading categories...
      </div>
    );
  } else if (categories.length === 0) {
    categorySidebarBody = (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          color: "#6c757d",
        }}
      >
        No categories available
      </div>
    );
  } else {
    categorySidebarBody = categories.map((category, index) => (
      <button
        key={category.id ?? `category-${index}`}
        type="button"
        aria-pressed={selectedCategory === category.name}
        onClick={() => {
          setSelectedCategory(category.name);
          setSelectedTopicId(category.id);
          router.replace(
            {
              pathname: router.pathname,
              query: {
                ...router.query,
                topicId: String(category.id),
                topicName: category.name,
              },
            },
            undefined,
            { shallow: true },
          );
        }}
        style={{
          padding: "10px 14px",
          cursor: "pointer",
          background: selectedCategory === category.name ? "#f8f9fa" : "#fff",
          fontSize: "13px",
          fontWeight: selectedCategory === category.name ? "500" : "400",
          color: selectedCategory === category.name ? "#2c3e50" : "#495057",
          transition: "all 0.15s ease",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          border: "none",
          borderBottom:
            index < categories.length - 1 ? "1px solid #f5f5f5" : "none",
          width: "100%",
          textAlign: "left",
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) => {
          if (selectedCategory !== category.name) {
            e.currentTarget.style.background = "#f8f9fa";
          }
        }}
        onMouseLeave={(e) => {
          if (selectedCategory !== category.name) {
            e.currentTarget.style.background = "#fff";
          }
        }}
      >
        <i
          className="material-icons-two-tone"
          aria-hidden
          style={{
            fontSize: "18px",
            color: selectedCategory === category.name ? "#4680ff" : "#6c757d",
          }}
        >
          {category.icon}
        </i>
        <span style={{ flex: 1 }}>{category.name}</span>
        <Badge
          bg="light"
          style={{
            fontSize: "11px",
            fontWeight: "500",
            color: "#6c757d",
            background:
              selectedCategory === category.name ? "#e3f2fd" : "#f0f0f0",
            padding: "2px 6px",
          }}
        >
          {category.count}
        </Badge>
      </button>
    ));
  }

  let mainArticlesBody: React.ReactNode;
  if (loadingItems) {
    mainArticlesBody = (
      <div
        style={{
          textAlign: "center",
          padding: "40px",
          color: "#6c757d",
        }}
      >
        Loading articles...
      </div>
    );
  } else if (articles.length === 0) {
    mainArticlesBody = (
      <div
        style={{
          textAlign: "center",
          padding: "40px",
          color: "#6c757d",
        }}
      >
        No articles available for this category
      </div>
    );
  } else {
    mainArticlesBody = articles.map((article, index) => (
      <button
        key={String(article.id ?? `article-${index}`)}
        type="button"
        onClick={() => onArticleClick?.(article)}
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "20px",
          cursor: "pointer",
          transition: "all 0.3s ease",
          position: "relative",
          overflow: "hidden",
          width: "100%",
          textAlign: "left",
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow =
            "0 8px 24px rgba(102, 126, 234, 0.12)";
          e.currentTarget.style.borderColor = "#667eea";
          e.currentTarget.style.transform = "translateY(-4px)";
          const button = e.currentTarget.querySelector(".read-more-btn");
          if (button instanceof HTMLElement) {
            button.style.transform = "translateX(4px)";
          }
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "4px",
            height: "100%",
            background:
              "linear-gradient(180deg, #667eea 0%, #764ba2 100%)",
            opacity: 0,
          }}
          className="accent-line"
        />

        <Row className="align-items-center g-3">
          <Col xs="auto">
            <div
              className="article-icon-wrapper"
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "12px",
                background: "#667eea15",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i
                className="material-icons-two-tone"
                aria-hidden
                style={{
                  fontSize: "28px",
                  color: "#667eea",
                }}
              >
                {article.icon}
              </i>
            </div>
          </Col>
          <Col>
            <h5
              style={{
                fontSize: "16px",
                fontWeight: "700",
                color: "#1f2937",
                marginBottom: "8px",
                lineHeight: "1.4",
              }}
            >
              {article.title}
            </h5>
            <p
              style={{
                fontSize: "14px",
                color: "#6b7280",
                marginBottom: "10px",
                lineHeight: "1.6",
              }}
            >
              {article.description}
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                fontSize: "13px",
                color: "#9ca3af",
                fontWeight: "500",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#f3f4f6",
                  padding: "4px 10px",
                  borderRadius: "6px",
                }}
              >
                <Calendar aria-hidden size={14} color="#6b7280" />
                <span>{article.updated}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#f3f4f6",
                  padding: "4px 10px",
                  borderRadius: "6px",
                }}
              >
                <Eye aria-hidden size={14} color="#6b7280" />
                <span>{article.views}</span>
              </div>
            </div>
          </Col>
          <Col xs="auto">
            <div
              className="read-more-btn"
              style={{
                background:
                  "linear-gradient(135deg, #667eea 0%, #667eea 100%)",
                border: "none",
                borderRadius: "8px",
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
              }}
            >
              Read More
              <ChevronRight aria-hidden size={16} />
            </div>
          </Col>
        </Row>
      </button>
    ));
  }

  let popularArticlesBody: React.ReactNode;
  if (loadingPopularArticles) {
    popularArticlesBody = (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          color: "#6c757d",
        }}
      >
        Loading popular articles...
      </div>
    );
  } else if (transformedPopularArticles.length === 0) {
    popularArticlesBody = (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          color: "#6c757d",
        }}
      >
        No popular articles available
      </div>
    );
  } else {
    popularArticlesBody = transformedPopularArticles.map((article, index) => (
      <button
        key={String(article.id ?? `popular-${index}`)}
        type="button"
        onClick={() => {
          const fullArticle = popularArticles.find(
            (item) => item.id === article.id,
          );
          onArticleClick?.(fullArticle ?? article);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          cursor: "pointer",
          borderBottom:
            index < transformedPopularArticles.length - 1
              ? "1px solid #f3f4f6"
              : "none",
          transition: "all 0.2s",
          background: "#fff",
          width: "100%",
          border: "none",
          borderLeft: "none",
          borderRight: "none",
          borderTop: "none",
          textAlign: "left",
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#f9fafb";
          e.currentTarget.style.paddingLeft = "24px";
          const chevron = e.currentTarget.querySelector(".chevron-icon");
          if (chevron instanceof HTMLElement) {
            chevron.style.color = "#667eea";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#fff";
          e.currentTarget.style.paddingLeft = "20px";
          const chevron = e.currentTarget.querySelector(".chevron-icon");
          if (chevron instanceof HTMLElement) {
            chevron.style.color = "#9ca3af";
          }
        }}
      >
        <div style={{ flex: 1 }}>
          <span
            style={{
              fontSize: "14px",
              color: "#374151",
              lineHeight: "1.5",
              fontWeight: "500",
              display: "block",
              marginBottom: "2px",
            }}
          >
            {article.title}
          </span>
        </div>
        <ChevronRight
          aria-hidden
          size={16}
          className="chevron-icon"
          style={{
            flexShrink: 0,
            transition: "color 0.2s",
            color: "#9ca3af",
          }}
        />
      </button>
    ));
  }

  let recentFaqsBody: React.ReactNode;
  if (loadingRecentFAQs) {
    recentFaqsBody = (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          color: "#6c757d",
        }}
      >
        Loading FAQs...
      </div>
    );
  } else if (transformedFAQs.length === 0) {
    recentFaqsBody = (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          color: "#6c757d",
        }}
      >
        No FAQs available
      </div>
    );
  } else {
    recentFaqsBody = transformedFAQs.map((faq, index) => (
      <button
        key={String(faq.id ?? `faq-${index}`)}
        type="button"
        onClick={() => {
          const fullFaq = recentFAQs.find((item) => item.id === faq.id);
          onArticleClick?.(fullFaq ?? faq);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "14px 20px",
          cursor: "pointer",
          borderBottom:
            index < transformedFAQs.length - 1 ? "1px solid #f3f4f6" : "none",
          transition: "all 0.2s",
          background: "#fff",
          width: "100%",
          border: "none",
          borderLeft: "none",
          borderRight: "none",
          borderTop: "none",
          textAlign: "left",
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#f9fafb";
          e.currentTarget.style.paddingLeft = "24px";
          const icon = e.currentTarget.querySelector(".faq-icon");
          if (icon instanceof HTMLElement) {
            icon.style.color = "#667eea";
          }
          const chevron = e.currentTarget.querySelector(".chevron-icon");
          if (chevron instanceof HTMLElement) {
            chevron.style.color = "#667eea";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#fff";
          e.currentTarget.style.paddingLeft = "20px";
          const icon = e.currentTarget.querySelector(".faq-icon");
          if (icon instanceof HTMLElement) {
            icon.style.color = "#9ca3af";
          }
          const chevron = e.currentTarget.querySelector(".chevron-icon");
          if (chevron instanceof HTMLElement) {
            chevron.style.color = "#9ca3af";
          }
        }}
      >
        <FileQuestion
          aria-hidden
          size={18}
          className="faq-icon"
          style={{
            flexShrink: 0,
            transition: "color 0.2s",
            color: "#9ca3af",
          }}
          strokeWidth={2}
        />
        <span
          style={{
            fontSize: "14px",
            color: "#374151",
            flex: 1,
            lineHeight: "1.5",
            fontWeight: "500",
          }}
        >
          {faq.title}
        </span>
        <ChevronRight
          aria-hidden
          size={16}
          className="chevron-icon"
          style={{
            flexShrink: 0,
            transition: "color 0.2s",
            color: "#9ca3af",
          }}
        />
      </button>
    ));
  }

  const resourcesListBody = resources.map((resource, index) => {
    const Icon = resource.icon;
    return (
      <button
        key={resource.name}
        type="button"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          cursor: "pointer",
          borderBottom:
            index < resources.length - 1 ? "1px solid #f3f4f6" : "none",
          transition: "all 0.2s",
          background: "#fff",
          width: "100%",
          border: "none",
          borderLeft: "none",
          borderRight: "none",
          borderTop: "none",
          textAlign: "left",
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#f9fafb";
          e.currentTarget.style.paddingLeft = "24px";
          const iconWrapper = e.currentTarget.querySelector(".icon-wrapper");
          if (iconWrapper instanceof HTMLElement) {
            iconWrapper.style.transform = "scale(1.1)";
            iconWrapper.style.background = resource.color;
          }
          const chevron = e.currentTarget.querySelector(".chevron-icon");
          if (chevron instanceof HTMLElement) {
            chevron.style.color = "#667eea";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#fff";
          e.currentTarget.style.paddingLeft = "20px";
          const iconWrapper = e.currentTarget.querySelector(".icon-wrapper");
          if (iconWrapper instanceof HTMLElement) {
            iconWrapper.style.transform = "scale(1)";
            iconWrapper.style.background = `${resource.color}15`;
          }
          const chevron = e.currentTarget.querySelector(".chevron-icon");
          if (chevron instanceof HTMLElement) {
            chevron.style.color = "#9ca3af";
          }
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flex: 1,
          }}
        >
          <div
            className="icon-wrapper"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: `${resource.color}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
          >
            <Icon
              aria-hidden
              size={18}
              color={resource.color}
              strokeWidth={2.5}
            />
          </div>
          <span
            style={{
              fontSize: "14px",
              color: "#374151",
              fontWeight: "500",
            }}
          >
            {resource.name}
          </span>
        </div>
        <ChevronRight
          aria-hidden
          size={16}
          className="chevron-icon"
          style={{
            flexShrink: 0,
            transition: "color 0.2s",
            color: "#9ca3af",
          }}
        />
      </button>
    );
  });

  return {
    categorySidebarBody,
    mainArticlesBody,
    popularArticlesBody,
    recentFaqsBody,
    resourcesListBody,
  };
}
