import React from "react";
import { Button } from "react-bootstrap";

export function PaymentMethodEmptyState({
  message,
  buttonText,
  onAction,
}: Readonly<{
  message: string;
  buttonText: string;
  onAction: () => void;
}>) {
  return (
    <div className="text-center py-3">
      <p className="text-muted mb-2" style={{ fontSize: "0.75rem" }}>
        {message}
      </p>
      <Button
        variant="primary"
        size="sm"
        onClick={onAction}
        style={{ fontSize: "0.75rem", padding: "0.35rem 0.7rem" }}
      >
        {buttonText}
      </Button>
    </div>
  );
}
