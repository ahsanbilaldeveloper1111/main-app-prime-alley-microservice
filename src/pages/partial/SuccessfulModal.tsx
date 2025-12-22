import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { CheckCircle } from 'lucide-react';

interface SuccessfulModalProps {
  show: boolean;
  onHide: () => void;
  title?: string;
  description: string;
  confirmButtonText?: string;
  showCancelButton?: boolean;
  cancelButtonText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCloseButton?: boolean;
  additionalInfo?: React.ReactNode;
  loading?: boolean;
  confirmButtonVariant?: 'primary' | 'danger' | 'warning' | 'success';
}

const SuccessfulModal: React.FC<SuccessfulModalProps> = ({
  show,
  onHide,
  title = "Success!",
  description,
  confirmButtonText = "OK",
  showCancelButton = false,
  cancelButtonText = "Cancel",
  onConfirm,
  onCancel,
  showCloseButton = true,
  additionalInfo,
  loading = false,
  confirmButtonVariant = 'primary',
}) => {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onHide();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onHide();
    }
  };

  const handleClose = () => {
    onHide();
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
    >
      <Modal.Header closeButton={showCloseButton} className="border-bottom">
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        <div className="text-center">
          <CheckCircle size={48} className="text-success mb-3" />
          <p className="mb-0">
            {description}
          </p>
          
          {additionalInfo && (
            <div className="mb-3">
              {additionalInfo}
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer className="border-top">
        {showCancelButton && (
          <Button
            variant="secondary"
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelButtonText}
          </Button>
        )}
        <Button
          variant={confirmButtonVariant}
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="spinner-border spinner-border-sm me-1" role="status" />
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

export default SuccessfulModal;
