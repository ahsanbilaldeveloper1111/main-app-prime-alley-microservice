import "@assets/scss/datatable-style.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { useRouter } from "next/router";
import ArticleDetail from "@page-modules/help-center/partials/article-detail";

const ArticleDetailPage = () => {
  const router = useRouter();
  const articleId = router.query.id as string || null;
  const searchQuery = (router.query.search as string) || '';

  const handleBack = () => {
    router.push({
      pathname: '/help-center/knowledge-base',
      query: searchQuery ? { search: searchQuery } : {}
    });
  };

  const handleArticleClick = (article: any) => {
    router.push({
      pathname: '/help-center/knowledge-base/[id]',
      query: { 
        id: article?.id?.toString() || article?.id,
        search: searchQuery 
      }
    });
  };

  const handleTopicClick = (topicId: number) => {
    router.push({
      pathname: '/help-center/knowledge-base',
      query: { 
        search: searchQuery,
        topicId: topicId.toString()
      }
    });
  };

  return (
    <React.Fragment>
      <BreadcrumbItem 
        mainTitle="Help Center" 
        mainLink="/help-center" 
        subTitle="Knowledge Base" 
      />
      <ArticleDetail 
        onBack={handleBack}
        articleId={articleId}
        articleData={null}
        onArticleClick={handleArticleClick}
        onTopicClick={handleTopicClick}
      />
    </React.Fragment>
  );
};

ArticleDetailPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ArticleDetailPage;

