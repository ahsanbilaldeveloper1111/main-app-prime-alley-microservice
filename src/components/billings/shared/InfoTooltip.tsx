import React from "react";
import { Info } from "lucide-react";

type InfoTooltipProps = {
  message: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export default function InfoTooltip({
  message,
  size = 14,
  color = "#666",
  strokeWidth = 2,
}: Readonly<InfoTooltipProps>) {
  return (
    <span
      title={message}
      aria-label={message}
      style={{ display: "inline-flex"}}
    >
      <Info size={size} strokeWidth={strokeWidth} color={color} />
    </span>
  );
}

