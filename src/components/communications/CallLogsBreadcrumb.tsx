import React from "react";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { CALL_LOGS_BREADCRUMB } from "@components/communications/callLogsListPageConfig";
import { useAppSelector } from "@toolkit/hooks";

const CallLogsBreadcrumb: React.FC = () => {
  const showPageLoader = useAppSelector(
    (s) => s.callLogsList?.showPageLoader ?? false,
  );

  return (
    <BreadcrumbItem
      mainTitle={CALL_LOGS_BREADCRUMB.mainTitle}
      mainLink={CALL_LOGS_BREADCRUMB.mainLink}
      subTitle={CALL_LOGS_BREADCRUMB.subTitle}
      showPageLoader={showPageLoader}
    />
  );
};

export default CallLogsBreadcrumb;
