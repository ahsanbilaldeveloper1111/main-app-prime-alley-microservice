import React from "react";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { useAppSelector } from "@toolkit/hooks";

const CallAnalysisBreadcrumb: React.FC = () => {
  const showPageLoader = useAppSelector(
    (s) => s.callAnalysisList?.showPageLoader ?? false,
  );

  return (
    <BreadcrumbItem
      mainTitle=""
      mainLink=""
      subTitle="Call Analysis"
      showPageLoader={showPageLoader}
    />
  );
};

export default CallAnalysisBreadcrumb;
