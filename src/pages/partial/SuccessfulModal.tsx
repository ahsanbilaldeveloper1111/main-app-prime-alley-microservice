import React from 'react';

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
  showCloseButton = true
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

  if (!show) return null;

  return (
    <div id="action-modal" className="modal customModal" style={{display: 'flex'}}>
      <div className="modal-content">
          {showCloseButton && (
          <span className="close-btn" id="action-close-btn" onClick={onHide}>
            <i className="fas fa-times"></i>
          </span>
        )}
        <h2 id="action-modal-title">{title}</h2>
        <p id="action-modal-text">{description}</p>
        <div className="modal-footer">
          {showCancelButton && (
            <button 
              className="btn btn-export" 
              id="action-cancel-btn" 
              onClick={handleCancel}
            >
              {cancelButtonText}
            </button>
          )}
          <button 
            className="btn btn-primary" 
            id="action-confirm-btn" 
            onClick={handleConfirm}
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessfulModal;
