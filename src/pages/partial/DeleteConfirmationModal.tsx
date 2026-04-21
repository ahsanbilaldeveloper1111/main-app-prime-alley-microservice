import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const prevLoadingRef = useRef(loading);
  const confirmLockRef = useRef(false);

  useEffect(() => {
    if (!show) {
      setConfirmText("");
      setIsSubmitting(false);
      confirmLockRef.current = false;
    }
  }, [show]);

  // Allow retry after parent finishes loading (e.g. error path)
  useEffect(() => {
    if (prevLoadingRef.current === true && loading === false) {
      setIsSubmitting(false);
      confirmLockRef.current = false;
    }
    prevLoadingRef.current = loading;
  }, [loading]);

  // Case-insensitive validation - recalculates when confirmText changes
  const isValidConfirmation = useMemo(() => {
    if (!confirmText) return false;
    const trimmedConfirm = confirmText.trim().toLowerCase();
    return trimmedConfirm === "delete";
  }, [confirmText]);

  const handleConfirm = () => {
    if (!isValidConfirmation || loading || isSubmitting || confirmLockRef.current) {
      return;
    }
    confirmLockRef.current = true;
    setIsSubmitting(true);
    onConfirm();
  };

  const handleClose = () => {
    if (loading || isSubmitting) {
      return;
    }
    setConfirmText("");
    setIsSubmitting(false);
    confirmLockRef.current = false;
    onHide();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    const el = e.currentTarget;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    setConfirmText((prev) => prev.slice(0, start) + pasted + prev.slice(end));
  };

  // Handle Enter key press to submit deletion
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (isValidConfirmation && !loading && !isSubmitting) {
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
      <Modal.Header closeButton={!loading && !isSubmitting} className="border-bottom">
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
              if (isValidConfirmation && !loading && !isSubmitting) {
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
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                autoFocus
                disabled={loading || isSubmitting}
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
          disabled={!isValidConfirmation || loading || isSubmitting}
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

