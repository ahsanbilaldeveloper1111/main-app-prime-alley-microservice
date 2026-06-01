import React from "react";
import { Button } from "react-bootstrap";
import { RefreshCw, Check } from "lucide-react";
import type { FilterField } from "./filterFieldTypes";
import { renderGenericFilterField } from "./genericFilterFieldRender";

export type GenericFilterFieldsPanelProps = {
  readonly filters: readonly FilterField[];
  readonly layout?: "stack" | "grid";
  readonly onApply?: () => void;
  readonly onReset?: () => void;
  readonly showApplyButton?: boolean;
  readonly showResetButton?: boolean;
  readonly applyLabel?: string;
  readonly className?: string;
};

const GenericFilterFieldsPanel: React.FC<GenericFilterFieldsPanelProps> = ({
  filters,
  layout = "stack",
  onApply,
  onReset,
  showApplyButton = false,
  showResetButton = false,
  applyLabel = "Apply filters",
  className = "",
}) => {
  const showFooter = showApplyButton || showResetButton;

  return (
    <div className={`generic-filter-fields-panel ${className}`.trim()}>
      <div
        className={
          layout === "grid"
            ? "generic-filter-fields-panel__grid"
            : "generic-filter-fields-panel__stack"
        }
      >
        {filters.map((filter) => (
          <div key={filter.id} className="generic-filter-fields-panel__field">
            <label htmlFor={filter.id} className="generic-filter-fields-panel__label">
              {filter.label}
            </label>
            <div className="generic-filter-fields-panel__control">
              {renderGenericFilterField(filter)}
            </div>
          </div>
        ))}
      </div>
      {showFooter && (
        <div className="generic-filter-fields-panel__footer">
          {showResetButton && (
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={onReset}
              className="d-flex align-items-center gap-1"
            >
              <RefreshCw size={16} />
              Reset
            </Button>
          )}
          {showApplyButton && (
            <Button
              variant="primary"
              size="sm"
              onClick={onApply}
              className="d-flex align-items-center gap-1"
            >
              <Check size={16} />
              {applyLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default GenericFilterFieldsPanel;
