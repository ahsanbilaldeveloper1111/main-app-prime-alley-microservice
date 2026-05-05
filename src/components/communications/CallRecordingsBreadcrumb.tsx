import React from "react";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { useAppSelector } from "@toolkit/hooks";

const CallRecordingsBreadcrumb: React.FC = () => {
  const showPageLoader = useAppSelector(
    (s) => s.callRecordingsList?.showPageLoader ?? false,
  );

  return (
    <BreadcrumbItem
      mainTitle=""
      mainLink=""
      subTitle="Call Recordings"
      showPageLoader={showPageLoader}
    />
  );
};

export default CallRecordingsBreadcrumb;
