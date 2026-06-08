import React from "react";

type WorkforceFixedActionBarProps = Readonly<{
  children: React.ReactNode;
}>;

/** Top-right action slot in page flow (scrolls with content; not position: fixed). */
export function WorkforceFixedActionBar({ children }: WorkforceFixedActionBarProps) {
  return <div className="workforce-page-actions workforce-prospects-fixed-action">{children}</div>;
}

type WorkforceProspectsPrimaryButtonProps = Readonly<{
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}>;

/** Blue primary CTA (#0066CC) — matches Prospects after global `custom.scss` button standardization. */
export function WorkforceProspectsPrimaryButton({
  children,
  onClick,
  disabled = false,
  type = "button",
  className,
}: WorkforceProspectsPrimaryButtonProps) {
  return (
    <button
      type={type}
      className={["workforce-prospects-primary-btn", className].filter(Boolean).join(" ")}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
