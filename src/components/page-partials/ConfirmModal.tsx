import React, { useState, useEffect, useMemo } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
  show: boolean;
  onHide: () => void;
  title: string;
  description: string;
  targetName: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  onConfirm: (confirmationText: string) => void;
  onCancel?: () => void;
  showCancelButton?: boolean;
  confirmButtonVariant?: 'primary' | 'danger' | 'warning' | 'success';
  cancelButtonVariant?: 'secondary' | 'export' | 'outline-secondary';
  requireTextConfirmation?: boolean;
  confirmationPlaceholder?: string;
  confirmationLabel?: string;
  requiredConfirmationText?: string;
  additionalInfo?: React.ReactNode;
  loading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  show,
  onHide,
  title,
  description,
  targetName,
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  onConfirm,
  onCancel,
  showCancelButton = true,
  confirmButtonVariant = 'primary',
  cancelButtonVariant = 'secondary',
  requireTextConfirmation = true,
  confirmationPlaceholder,
  confirmationLabel,
  requiredConfirmationText = "delete",
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

  // Case-insensitive comparison - recalculates when confirmText or requiredConfirmationText changes
  const isValidConfirmation = useMemo(() => {
    if (!requireTextConfirmation) return true;
    if (!confirmText || !requiredConfirmationText) return false;
    const trimmedConfirm = confirmText.trim().toLowerCase();
    const trimmedRequired = requiredConfirmationText.trim().toLowerCase();
    return trimmedConfirm === trimmedRequired;
  }, [confirmText, requiredConfirmationText, requireTextConfirmation]);

  const handleConfirm = () => {
    if (isValidConfirmation) {
      onConfirm(confirmText);
    }
  };

  const handleClose = () => {
    setConfirmText("");
    onHide();
  };

  const handleCancel = () => {
    setConfirmText("");
    if (onCancel) {
      onCancel();
    } else {
      onHide();
    }
  };

  // Handle Enter key press to submit
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (isValidConfirmation && !loading) {
        handleConfirm();
      }
    }
  };

  const displayPlaceholder = confirmationPlaceholder || `Type ${requiredConfirmationText.toUpperCase()}`;

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
    >
      <Modal.Header closeButton className="border-bottom">
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        <div className="text-center">
          <AlertCircle size={48} className="text-danger mb-3" />
          <p className="mb-0">
            {description.replace('{targetName}', targetName)}
          </p>
          {requireTextConfirmation && (
            <p className="text-muted small mb-3">This action cannot be undone.</p>
          )}
          
          {additionalInfo && (
            <div className="mb-3">
              {additionalInfo}
            </div>
          )}
          
          {requireTextConfirmation && (
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
                  {confirmationLabel || `Type `}
                  {!confirmationLabel && (
                    <>
                      <span className="text-danger fw-bold">{requiredConfirmationText.toUpperCase()}</span> to confirm
                    </>
                  )}
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder={displayPlaceholder}
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  disabled={loading}
                />
              </div>
            </Form>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer className="border-top">
        {showCancelButton && (
          <Button
            variant={cancelButtonVariant}
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelButtonText}
          </Button>
        )}
        <Button
          variant={confirmButtonVariant}
          disabled={!isValidConfirmation || loading}
          onClick={handleConfirm}
        >
          {loading ? (
            <>
              <output
                className="spinner-border spinner-border-sm me-1 d-inline-block"
                aria-live="polite"
              >
                <span className="visually-hidden">Confirming…</span>
              </output>
              {confirmButtonText}...
            </>
          ) : (
            confirmButtonText
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmModal;
