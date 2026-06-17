import { CrmTableRowActionsMobileMenu } from "@page-modules/crm/shared/CrmTableRowActionsMobileMenu";
import React from "react";
import { Button } from "react-bootstrap";

export type CrmTableRowActionTone =
  | "primary"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "secondary";

export type CrmTableRowAction = Readonly<{
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  tone?: CrmTableRowActionTone;
  disabled?: boolean;
  disabledTitle?: string;
}>;

const TONE_CLASS: Record<CrmTableRowActionTone, string> = {
  primary: "text-primary",
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  secondary: "text-secondary",
};

type CrmTableRowActionsProps = Readonly<{
  actions: readonly CrmTableRowAction[];
}>;

/** Icon row actions matching Users & Teams / Ranks tables (`btn-action-style-2`). */
export function CrmTableRowActions({ actions }: CrmTableRowActionsProps) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <>
      <div className="d-flex flex-nowrap align-items-center justify-content-center gap-1 gt-row-actions--desktop d-none d-md-flex">
        {actions.map((action) => {
          const isDisabled = action.disabled === true;
          const button = (
            <Button
              type="button"
              variant="light"
              size="sm"
              disabled={isDisabled}
              className={`btn-action-style-2 d-inline-flex align-items-center justify-content-center p-0 ${
                isDisabled ? "gt-action-disabled" : TONE_CLASS[action.tone ?? "primary"]
              }`}
              title={isDisabled ? undefined : action.label}
              aria-label={action.label}
              onClick={(event) => {
                event.stopPropagation();
                if (isDisabled) return;
                action.onClick();
              }}
            >
              {action.icon}
            </Button>
          );

          if (isDisabled && action.disabledTitle) {
            return (
              <span
                key={action.label}
                className="gt-action-disabled-wrapper"
                title={action.disabledTitle}
              >
                {button}
              </span>
            );
          }

          return (
            <React.Fragment key={action.label}>{button}</React.Fragment>
          );
        })}
      </div>
      <CrmTableRowActionsMobileMenu actions={actions} />
    </>
  );
}
