import React, { useState, useEffect, useMemo } from 'react';
import { Button, Form, Modal, Spinner } from 'react-bootstrap';
import { AlertCircle } from 'lucide-react';

interface DeleteConfirmationModalProps {
  show: boolean;
  onHide: () => void;
  onConfirm: () => void;
  itemName?: string;
  itemType?: string; // e.g., "lead", "deal", "order", "meeting", "note", etc.
  additionalInfo?: React.ReactNode; // Optional additional info to display (e.g., entry details)
  loading?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  show,
  onHide,
  onConfirm,
  itemName,
  itemType = "item",
  additionalInfo,
  loading = false,
}) => {
  const [confirmText, setConfirmText] = useState("");

  // Reset confirm text when modal opens/closes
  useEffect(() => {
    if (!show) {
      setConfirmText("");
    }
  }, [show]);

  // Case-insensitive validation - recalculates when confirmText changes
  const isValidConfirmation = useMemo(() => {
    if (!confirmText) return false;
    const trimmedConfirm = confirmText.trim().toLowerCase();
    return trimmedConfirm === "delete";
  }, [confirmText]);

  const handleConfirm = () => {
    if (isValidConfirmation) {
      onConfirm();
    }
  };

  const handleClose = () => {
    setConfirmText("");
    onHide();
  };

  // Handle Enter key press to submit deletion
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (isValidConfirmation && !loading) {
        handleConfirm();
      }
    }
  };

  // Format item type for display (capitalize first letter)
  const formattedItemType = itemType.charAt(0).toUpperCase() + itemType.slice(1);

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      style={{ zIndex: 999999 }}
    >
      <Modal.Header closeButton className="border-bottom">
        <Modal.Title>Confirm Deletion</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        <div className="text-center">
          <AlertCircle size={48} className="text-danger mb-3" />
          <p className="mb-0">
            Are you sure you want to delete <strong>{itemName || `this ${itemType}`}</strong>?
          </p>
          <p className="text-muted small mb-3">This action cannot be undone.</p>
          
          {additionalInfo && (
            <div className="mb-3">
              {additionalInfo}
            </div>
          )}
          
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              if (isValidConfirmation && !loading) {
                handleConfirm();
              }
            }}
          >
            <div className="text-center mt-4">
              <Form.Label className="fw-semibold">
                Type <span className="text-danger fw-bold">DELETE</span> to confirm
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="Type DELETE"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                disabled={loading}
              />
            </div>
          </Form>
        </div>
      </Modal.Body>
      <Modal.Footer className="border-top">
        <Button
          variant="secondary"
          onClick={handleClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          disabled={!isValidConfirmation || loading}
          onClick={handleConfirm}
        >
          {loading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Deleting...
            </>
          ) : (
            `Delete ${formattedItemType}`
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteConfirmationModal;

