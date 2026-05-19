import { Bot } from "lucide-react";
import React from "react";
import { Button, Spinner } from "react-bootstrap";

export type ChatTrainBotButtonProps = Readonly<{
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: string;
}>;

export function ChatTrainBotButton({
  onClick,
  loading = false,
  disabled = false,
  variant = "outline-primary",
}: ChatTrainBotButtonProps) {
  return (
    <Button
      variant={variant}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <>
          <Spinner size="sm" className="me-2" />
          Training…
        </>
      ) : (
        <>
          <Bot size={16} className="me-2" />
          Train Bot
        </>
      )}
    </Button>
  );
}
