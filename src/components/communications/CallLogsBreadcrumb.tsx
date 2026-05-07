import React from "react";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { useAppSelector } from "@toolkit/hooks";

const CallLogsBreadcrumb: React.FC = () => {
  const showPageLoader = useAppSelector(
    (s) => s.callLogsList?.showPageLoader ?? false,
  );

  return (
    <BreadcrumbItem
      mainTitle=""
      mainLink=""
      subTitle="Call Logs"
      showPageLoader={showPageLoader}
    />
  );
};

export default CallLogsBreadcrumb;
