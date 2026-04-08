import React, { type ReactNode } from "react";

export type ListPageShellProps = Readonly<{
  /** Toolbar, filter bar, KPI row, etc. */
  header?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}>;

/**
 * Shared vertical layout shell for list pages: optional header band + main content.
 * Pages should still use `Layout` / `getLayout` for chrome; this only structures body.
 */
export function ListPageShell({
  header,
  children,
  className,
  contentClassName,
}: ListPageShellProps) {
  return (
    <div
      className={
        className ?? "d-flex flex-column flex-grow-1 gap-3 min-vh-0 w-100"
      }
    >
      {header}
      <div
        className={
          contentClassName ?? "d-flex flex-column flex-grow-1 min-h-0 overflow-hidden"
        }
      >
        {children}
      </div>
    </div>
  );
}
