import React from "react";
import { ReportsModalOverlay } from "./ReportsModalOverlay";

type ReportsViewAllFooterProps = Readonly<{
  count: number;
  label: string;
  onClick: () => void;
  variant?: "default" | "inset";
}>;

export function ReportsViewAllFooter({
  count,
  label,
  onClick,
  variant = "default",
}: ReportsViewAllFooterProps) {
  const className =
    variant === "inset"
      ? "reports-view-all-footer reports-view-all-footer--inset"
      : "reports-view-all-footer";

  return (
    <div className={className}>
      <button type="button" className="reports-view-all-footer__btn" onClick={onClick}>
        View All ({count} {label})
      </button>
    </div>
  );
}

type ReportsModalShellProps = Readonly<{
  ariaLabel: string;
  onClose: () => void;
  dialogClassName: string;
  title: string;
  subtitle: string;
  headerActions?: React.ReactNode;
  searchPlaceholder?: string;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  bodyClassName?: string;
  children: React.ReactNode;
}>;

export function ReportsModalShell({
  ariaLabel,
  onClose,
  dialogClassName,
  title,
  subtitle,
  headerActions,
  searchPlaceholder,
  searchQuery,
  onSearchChange,
  bodyClassName = "reports-modal-body",
  children,
}: ReportsModalShellProps) {
  return (
    <ReportsModalOverlay
      ariaLabel={ariaLabel}
      onClose={onClose}
      dialogClassName={dialogClassName}
    >
      <div className="reports-modal-header">
        <div>
          <div className="reports-modal-header__title">{title}</div>
          <div className="reports-modal-header__subtitle">{subtitle}</div>
        </div>
        <div className="reports-modal-header__actions">
          {headerActions}
          <button type="button" className="reports-modal-header__close" onClick={onClose}>
            ×
          </button>
        </div>
      </div>
      {searchPlaceholder && searchQuery != null && onSearchChange ? (
        <div className="reports-modal-search-wrap">
          <input
            type="text"
            className="reports-modal-search-input"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      ) : null}
      <div className={bodyClassName}>{children}</div>
    </ReportsModalOverlay>
  );
}

type ReportsModalIndexProps = Readonly<{
  index: number;
}>;

export function ReportsModalIndex({ index }: ReportsModalIndexProps) {
  return <span className="reports-modal-index">{index + 1}</span>;
}

type ReportsModalAvatarProps = Readonly<{
  backgroundColor: string;
  initials: string;
}>;

export function ReportsModalAvatar({ backgroundColor, initials }: ReportsModalAvatarProps) {
  return (
    <span className="reports-modal-avatar" style={{ backgroundColor }} aria-hidden>
      {initials}
    </span>
  );
}

type ReportsSortToggleProps = Readonly<{
  value: "worst" | "best";
  onChange: (value: "worst" | "best") => void;
}>;

export function ReportsSortToggle({ value, onChange }: ReportsSortToggleProps) {
  return (
    <div className="reports-sort-toggle">
      <button
        type="button"
        className={`reports-sort-toggle__btn${value === "worst" ? " reports-sort-toggle__btn--active" : ""}`}
        onClick={() => onChange("worst")}
      >
        ↑ Ascending
      </button>
      <button
        type="button"
        className={`reports-sort-toggle__btn${value === "best" ? " reports-sort-toggle__btn--active" : ""}`}
        onClick={() => onChange("best")}
      >
        ↓ Descending
      </button>
    </div>
  );
}
