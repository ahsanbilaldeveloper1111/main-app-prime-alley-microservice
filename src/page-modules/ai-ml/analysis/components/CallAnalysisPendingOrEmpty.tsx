import React from "react";

export type CallAnalysisPendingOrEmptyProps = Readonly<{
  analysisComplete: boolean;
  hasData: boolean;
  skeleton: React.ReactNode;
  renderContent: () => React.ReactNode;
  emptyMessage?: string;
}>;

/** Skeleton while analysis is running; muted empty line once complete with nothing to show. */
export function CallAnalysisPendingOrEmpty({
  analysisComplete,
  hasData,
  skeleton,
  renderContent,
  emptyMessage = "No data available",
}: CallAnalysisPendingOrEmptyProps) {
  if (hasData) {
    return <>{renderContent()}</>;
  }
  return (
    <>
      {analysisComplete ? (
        <p className="text-muted">{emptyMessage}</p>
      ) : (
        skeleton
      )}
    </>
  );
}
