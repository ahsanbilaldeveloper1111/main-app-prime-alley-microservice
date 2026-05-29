import { ProgressBar } from "react-bootstrap";

import {
  clampUsedPct,
  formatBudgetPct,
  formatBudgetUsd,
  isUnlimitedBudgetSource,
  pct1,
  resolveBudgetProgressVariant,
  type ChatBudgetUsageRow,
} from "./chatBudgetUsage";

export type ChatBudgetUsageBarProps = Readonly<{
  row: ChatBudgetUsageRow;
  showRemaining?: boolean;
  barHeight?: number;
}>;

export function ChatBudgetUsageBar({
  row,
  showRemaining = true,
  barHeight = 6,
}: ChatBudgetUsageBarProps) {
  if (isUnlimitedBudgetSource(row.budgetSource)) {
    return (
      <span className="small text-muted">Unlimited budget</span>
    );
  }

  const pct = clampUsedPct(row.usedPct);
  const variant = resolveBudgetProgressVariant(row);

  return (
    <div className="tenant-dashboard-users__usage">
      <div className="d-flex justify-content-between small mb-1">
        <span>{pct1.format(pct)}%</span>
        {showRemaining ? (
          <span className="text-muted">
            {formatBudgetUsd(row.remainingUsd, true)} left
          </span>
        ) : null}
      </div>
      <ProgressBar
        now={pct}
        variant={variant}
        style={{ height: barHeight }}
        aria-label={`${row.displayName} budget used ${pct}%`}
      />
      {row.effectiveThresholdPct > 0 ? (
        <div className="text-muted mt-1" style={{ fontSize: "10px" }}>
          Alert at {formatBudgetPct(row.effectiveThresholdPct)}
        </div>
      ) : null}
    </div>
  );
}
