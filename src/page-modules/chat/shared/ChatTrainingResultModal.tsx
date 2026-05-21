import {
  formatChatTrainingResultMessage,
  getChatTrainingResultLines,
  isChatTrainingReconciledResponse,
  type ChatTrainingResponse,
} from "@utils/chat";
import { Bot, X } from "lucide-react";
import React from "react";
import { Button, Modal } from "react-bootstrap";

import "./chatTrainingResultModal.scss";

export type ChatTrainingResultModalProps = Readonly<{
  show: boolean;
  response: ChatTrainingResponse | null;
  onClose: () => void;
}>;

export function ChatTrainingResultModal({
  show,
  response,
  onClose,
}: ChatTrainingResultModalProps) {
  const lines = response ? getChatTrainingResultLines(response) : [];
  const reconciled = response ? isChatTrainingReconciledResponse(response) : false;
  const showStatsGrid = Boolean(response) && !reconciled && lines.length > 1;

  return (
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Modal.Header style={{ borderBottom: "1px solid #e8eef5" }}>
        <Modal.Title
          style={{
            fontSize: "18px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Bot size={20} color="#4e6fa5" />
          Training results
        </Modal.Title>
        <Button
          variant="link"
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            padding: "4px",
            cursor: "pointer",
            color: "#6c757d",
            display: "flex",
            alignItems: "center",
          }}
          aria-label="Close"
        >
          <X size={20} />
        </Button>
      </Modal.Header>
      <Modal.Body>
        {response && showStatsGrid ? (
          <dl className="chatTrainingResultModal-stats">
            {lines.map((line) => (
              <div key={line.label} className="chatTrainingResultModal-statRow">
                <dt>{line.label}</dt>
                <dd>{line.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {response && !showStatsGrid ? (
          <p className="chatTrainingResultModal-message">
            {formatChatTrainingResultMessage(response)}
          </p>
        ) : null}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
