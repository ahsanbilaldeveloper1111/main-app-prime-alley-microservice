import React from "react";

const RESET: React.CSSProperties = {
  background: "none",
  border: "none",
  padding: 0,
  margin: 0,
};

export function LinkButton({
  onClick,
  style,
  className,
  children,
  type = "button",
  disabled,
  onMouseEnter,
  onMouseLeave,
}: Readonly<{
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onMouseEnter?: React.MouseEventHandler<HTMLButtonElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLButtonElement>;
}>) {
  return (
    <button
      type={type}
      onClick={onClick ?? (() => null)}
      className={className}
      disabled={disabled}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ ...RESET, ...style }}
    >
      {children}
    </button>
  );
}

