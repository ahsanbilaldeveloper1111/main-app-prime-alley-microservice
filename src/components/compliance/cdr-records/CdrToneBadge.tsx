import React from "react";

import type { StatusChipTone } from "./cdrRecordsDomain";

import "./cdrRecordsPage.scss";

export interface CdrToneBadgeProps {
  text: string;
  tone: StatusChipTone;
}

export function CdrToneBadge(props: Readonly<CdrToneBadgeProps>): React.ReactElement {
  const { text, tone } = props;
  return (
    <span
      className="cdrRecords-toneBadge"
      style={
        {
          "--cdr-tone-fg": tone.color,
          "--cdr-tone-bg": tone.backgroundColor,
        } as React.CSSProperties
      }
    >
      {text}
    </span>
  );
}
