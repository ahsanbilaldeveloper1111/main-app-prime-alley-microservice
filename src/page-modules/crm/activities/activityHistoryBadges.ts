const ACTIVITY_TYPE_BADGE_BG: Record<
  string,
  "secondary" | "primary" | "success" | "info"
> = {
  Prospect: "secondary",
  Lead: "primary",
  Deal: "success",
  Order: "info",
};

/** Map an activity history `type` cell value to a react-bootstrap Badge `bg` variant. */
export function getActivityTypeBadgeBg(
  type: string,
): "secondary" | "primary" | "success" | "info" {
  return ACTIVITY_TYPE_BADGE_BG[type] ?? "info";
}
