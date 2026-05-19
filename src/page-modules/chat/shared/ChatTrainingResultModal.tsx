import type { ChatTrainingResponse } from "@utils/chat";
import { Bot, X } from "lucide-react";
import React from "react";
import { Button, Modal } from "react-bootstrap";

function formatTrainingSummary(response: ChatTrainingResponse): string {
  const tenantFiles = response.tenant_documents.files;
  const globalFiles = response.global_documents.files;
  const totalChunks = response.total_chunks;
  return `Training completed successfully! Processed ${tenantFiles} tenant files and ${globalFiles} global files. Total chunks: ${totalChunks}`;
}

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
        {response ? (
          <p
            style={{
              fontSize: "16px",
              color: "#2d3748",
              margin: 0,
              lineHeight: 1.6,
              textAlign: "center",
              padding: "12px 8px",
            }}
          >
            {formatTrainingSummary(response)}
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
