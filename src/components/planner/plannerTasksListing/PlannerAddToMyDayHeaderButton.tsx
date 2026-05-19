import React from "react";
import { Button } from "react-bootstrap";
import { Sun } from "lucide-react";
import { plannerAddToMyDayDisabledTitle } from "./plannerTasksListingMyDay";

export type PlannerAddToMyDayHeaderButtonProps = Readonly<{
  show: boolean;
  canAdd: boolean;
  alreadyInMyDay: boolean;
  onClick: () => void;
  title?: string;
}>;

export function PlannerAddToMyDayHeaderButton({
  show,
  canAdd,
  alreadyInMyDay,
  onClick,
  title,
}: PlannerAddToMyDayHeaderButtonProps) {
  if (!show) return null;

  const resolvedTitle =
    title ?? plannerAddToMyDayDisabledTitle(true, alreadyInMyDay) ?? "Add to My Day";

  return (
    <Button
      variant="link"
      className={`p-0 ${canAdd ? "text-primary" : "text-muted"}`}
      onClick={() => {
        if (!canAdd) return;
        onClick();
      }}
      title={resolvedTitle}
      aria-disabled={!canAdd}
    >
      <Sun size={20} />
    </Button>
  );
}
