import "@assets/scss/datatable-style.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { useRouter } from "next/router";
import KnowledgeBase from "../partials/knowledge-base";

const KnowledgeBasePage = () => {
  const router = useRouter();
  const searchQuery = (router.query.search as string) || '';
  const moduleId = (router.query.moduleId as string) || '';
  const moduleName = (router.query.moduleName as string) || '';
  const handleBack = () => {
    router.push('/help-center');
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

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Help Center" mainLink="/help-center" subTitle="Knowledge Base" />
      <KnowledgeBase 
        moduleId={moduleId}
        moduleName={moduleName}
        onBack={handleBack}
        searchQuery={searchQuery}
        onArticleClick={handleArticleClick}
      />
    </React.Fragment>
  );
};

KnowledgeBasePage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default KnowledgeBasePage;

