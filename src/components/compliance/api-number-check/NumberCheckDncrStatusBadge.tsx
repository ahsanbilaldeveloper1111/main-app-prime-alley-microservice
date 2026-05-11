import React from "react";

import { getStatusCategory, getStatusLabel } from "./apiNumberCheckDomain";

import "./apiNumberCheckPage.scss";

export interface NumberCheckDncrStatusBadgeProps {
  status: string | null | undefined;
  dncrStatus: string | null | undefined;
}

export function NumberCheckDncrStatusBadge(
  props: Readonly<NumberCheckDncrStatusBadgeProps>,
): React.ReactElement {
  const { status, dncrStatus } = props;
  const category = getStatusCategory(status, dncrStatus);
  const label = getStatusLabel(status, dncrStatus);

  if (category.toLowerCase() === "invalid") {
    return (
      <span className="apiNumberCheck-dncrBadge apiNumberCheck-dncrBadge--invalid">
        Invalid
      </span>
    );
  }

  const modifier =
    category === "denied"
      ? "apiNumberCheck-dncrBadge--denied"
      : "apiNumberCheck-dncrBadge--permitted";

  return (
    <span className={`apiNumberCheck-dncrBadge ${modifier}`}>{label}</span>
  );
}
