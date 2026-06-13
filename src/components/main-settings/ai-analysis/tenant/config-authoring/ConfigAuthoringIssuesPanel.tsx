import React from "react";

import type { AnalysisConfigValidationIssue } from "@utils/aiAnalytics";

type ConfigAuthoringIssuesPanelProps = Readonly<{
  title: string;
  issues: AnalysisConfigValidationIssue[];
  variant: "error" | "warning";
}>;

export const ConfigAuthoringIssuesPanel: React.FC<
  ConfigAuthoringIssuesPanelProps
> = ({ title, issues, variant }) => {
  if (issues.length === 0) {
    return null;
  }

  return (
    <div
      className={`ai-analysis-tenant-config__config-issues ai-analysis-tenant-config__config-issues--${variant}`}
      role="alert"
    >
      <h3 className="ai-analysis-tenant-config__config-issues-title">{title}</h3>
      <ul className="ai-analysis-tenant-config__config-issues-list">
        {issues.map((issue) => (
          <li key={`${issue.code}-${issue.target}-${issue.message}`}>
            <span className="ai-analysis-tenant-config__config-issue-code">
              {issue.code}
            </span>
            {issue.target ? (
              <span className="ai-analysis-tenant-config__config-issue-target">
                {issue.target}
              </span>
            ) : null}
            <span className="ai-analysis-tenant-config__issue-message">
              {issue.message}
            </span>
            {issue.layer ? (
              <span className="ai-analysis-tenant-config__config-issue-layer">
                ({issue.layer}
                {issue.model_backed ? ", AI" : ""})
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
};
